# mobileRefresh Go Service — Dev Spec

**Tujuan dokumen.** Spesifikasi lengkap service pengganti jalur refresh mobile: dari `readSS` force-pull (lambat, blocking, sering gantung) menjadi service Go di Cloud Run yang membaca Google Sheet lewat Sheets API dan menulis diff ke Firestore. Tanpa Apps Script (GAS), tanpa dibArray, invocation internal-only via IAM.

**Status.** Proposal — menunggu keputusan §14.

**Dokumen terkait.**
- `docs/refresh-mechanism-dev-spec.md` — mental model mekanisme refresh existing (3 kaki) + internals GAS `mobileRefresh`
- `docs/cf-mobilerefresh-handoff.md` — desain lama (CF Node thin-proxy → GAS); **di-supersede dokumen ini**, dipertahankan sebagai referensi kontrak

---

## 1. Ringkasan satu paragraf

UI mobile app disimpan di Google Sheet ("proxy sheet") dan dimirror ke Firestore `/Proxy/<ssid>` supaya app bisa baca cepat dan live. Mirror-nya tidak pernah jalan otomatis, jadi tombol refresh app terpaksa menarik sheet langsung lewat `readSS` — buka workbook penuh formula, 2.5–8 detik, user menunggu, sering timeout dan indikator merah tanpa sebab jelas. Service ini menggantikan seluruh jalur itu: user tap refresh → app menulis satu dokumen kecil ke Firestore → trigger membangunkan service Go → service baca 4 range sheet via Sheets API (ratusan milidetik) → bandingkan sidik jari (hash) konten → tulis hanya dokumen yang berubah → app repaint otomatis lewat listener yang sudah ada. User tidak pernah menunggu; indikator refresh mendapat status nyata (running/done/error) untuk pertama kalinya.

```
SEBELUM: tap ──▶ readSS ──▶ GAS openById (2.5–8s, user menunggu) ──▶ payload penuh ──▶ parse ──▶ repaint
SESUDAH: tap ──▶ tulis 1 doc (instan, user lanjut kerja)
                    └─▶ trigger ─▶ Go service ─▶ Sheets API (~0.5s) ─▶ diff hash ─▶ tulis yg berubah ─▶ listener repaint
```

---

## 2. Masalah hari ini (kenapa rebuild)

1. **Lambat & blocking.** `readSS` → GAS `SpreadsheetApp.openById()` memuat SELURUH workbook (semua tab engine + formula volatile) hanya untuk membaca beberapa range. 2.5–8 detik, dibayar user setiap tap, synchronous.
2. **Makin banyak page makin parah.** Payload `JSON!B1:E` membesar seiring jumlah page → transfer + parse di HP ikut membengkak → timeout → app gantung, indikator merah tanpa aksi apa pun.
3. **Tidak ada observability.** GAS tidak punya log/metric terstruktur. Saat gantung, tidak ada cara tahu kenapa.
4. **Keamanan by-obscurity.** Endpoint GAS publik tanpa auth; satu-satunya pagar = deployment ID (`AKfyc…`) yang dirahasiakan. Pool 20 deployment harus di-maintain manual.
5. **Ceiling GAS.** ±30 eksekusi concurrent per script (asal-usul pola "20 pintu"), 6 menit max per eksekusi, deploy manual 20×.

## 3. Requirement yang sudah ditetapkan

| # | Requirement | Konsekuensi |
|---|---|---|
| R1 | Tidak pakai dibArray / tidak ada panggilan ke GAS | Logika sync GAS `mobileRefresh` di-port ke Go (§7) |
| R2 | Baca sheet lewat Google Sheets API | Butuh service account + share sheet (§11) |
| R3 | Bahasa Go | — |
| R4 | Deploy di Cloud Run | Revisi ber-versi, rollback instan, autoscale |
| R5 | Invocation internal-only (IAM), tidak boleh dari luar | App (HP user = "luar") tidak bisa memanggil langsung → butuh mekanisme trigger (§5) |

---

## 4. Arsitektur

### 4.1 Lama

```
APP ──POST──▶ CF readSS (Node, otq-01) ──GET──▶ GAS pool otqma0001..0020 ──▶ openById(sheet) ──▶ data balik ke app
                                                (publik, tanpa auth,                 2.5–8s
                                                 rahasia = deployment ID)
```

### 4.2 Baru

```
APP ── tulis doc ──▶ Firestore /refresh_request/<ssid>
                          │  (Eventarc trigger, identitas SA, internal ✔)
                          ▼
                    Cloud Run "mobile-refresh" (Go)
                          │ 1. Sheets API values.batchGet (4 range)          ~0.3–1s
                          │ 2. hash konten per page (SHA-256)                ~ms
                          │ 3. baca manifest (1 read)                        ~10ms
                          │ 4. diff hash → tulis HANYA yang berubah
                          │ 5. bump `t` di /Proxy/<ssid>
                          │ 6. tulis hasil ke /refresh_status/<ssid>
                          ▼
                    Firestore /Proxy/<ssid> ── listener (sudah ada, tidak diubah) ──▶ APP repaint
```

Yang **tidak berubah**: leg sumber→proxy-sheet (engine existing), listener app di `/Proxy/<ssid>`, `readSS` (tetap hidup sebagai fallback), GAS (dibiarkan, tidak dipakai jalur ini).

---

## 5. Trigger — kenapa app tidak boleh memanggil langsung, dan solusinya

R5 mengunci service: hanya identitas IAM ber-role `run.invoker` yang boleh memanggil. HP user tidak punya identitas IAM → tap refresh tidak bisa menembak URL service.

**Solusi: pola "bel pintu" (Firestore-trigger).** Tamu tidak boleh masuk dapur, tapi boleh pencet bel. App sudah login Firebase (dipakai listener `/Proxy`) → app **boleh menulis Firestore**. Jadi:

1. User tap refresh → app menulis/overwrite doc `/refresh_request/<ssid>` (isi §6.3).
2. Eventarc mendeteksi write → memanggil Cloud Run **dengan identitas service account** → lolos IAM.
3. Service jalan, selesai, menulis hasil ke `/refresh_status/<ssid>`.
4. App (opsional tapi direkomendasikan) listen `/refresh_status/<ssid>` → indikator amber saat `running`, hijau saat `done`, merah saat `error` — status nyata, bukan tebakan timeout.

**Alternatif yang dipertimbangkan:**

| Opsi | Cara | Kenapa bukan ini |
|---|---|---|
| Cloud Scheduler polling tiap N menit | Zero perubahan app | Refresh tidak instan (delay sampai tick berikutnya); boros call saat tidak ada perubahan. Bisa DITAMBAHKAN belakangan sebagai pelengkap |
| Drive `files.watch` (webhook saat sheet berubah) | Paling otomatis | Webhook harus reachable dari server Google = ada permukaan publik lagi; melanggar semangat R5. Kandidat fase berikutnya |
| Endpoint publik + API key | Sederhana | Melanggar R5 langsung |

**Perubahan app (Flutter) yang dibutuhkan:** ganti aksi tombol refresh dari HTTP POST `readSS` → 1 write Firestore + 1 listener status. Kecil, dan jalur lama tetap ada di belakang flag selama transisi.

---

## 6. Skema data Firestore

### 6.1 Existing — tidak diubah (kontrak dengan app)

```
/Proxy/<ssid>                     ← doc induk: v,n,e,p,ty (profile) + t (change clock)
/Proxy/<ssid>/Page/<docId>        ← 1 doc per page   : {v, p: namaPage, c: kontenJSON, t}
/Proxy/<ssid>/System/<docId>      ← 1 doc per system : {v, p, c, t}
```

- App bangun ulang UI saat **`t` di doc induk berubah**; membaca Page/System dengan scan + match field `p` (docId-agnostic). Aturan ini dipertahankan persis.
- Doc existing punya docId hash SHA3 buatan GAS. Service **tidak membuat doc paralel**: cari doc by field `p`, update yang ketemu; page baru boleh docId apa pun (client tidak peduli).

### 6.2 Baru — manifest (indeks sidik jari, milik service saja)

```
/Proxy/<ssid>/Meta/manifest
{
  "p":  { "<namaPage>": "<hash16>", ... },     // sidik jari tiap page   (JSON!B51:E kolom C)
  "s":  { "<namaKomponen>": "<hash16>", ... }, // sidik jari tiap system (JSON!B6:E49)
  "pr": "<hash16>",                            // sidik jari profile     (Settings!B1:B5 digabung)
  "h":  "<hash16>",                            // sidik jari home        (op1!H11)
  "t":  <epoch-ms update terakhir>,
  "n":  <jumlah page>,                         // sanity check
  "v":  1                                      // versi skema manifest
}
```

Kenapa perlu: Firestore tidak bisa membaca sebagian doc — mengecek "berubah tidak?" dengan cara lama berarti menarik SELURUH konten semua page (N read mahal + payload besar) setiap refresh. Manifest menurunkan biaya diff menjadi **1 read, konstan berapa pun jumlah page**. Pola yang sama dengan HTTP ETag / git / rsync.

Ditaruh di subcollection `Meta` (bukan field di doc induk) supaya listener app di doc induk tidak ikut men-download map hash setiap repaint.

`hash16` = 16 hex char pertama dari SHA-256 konten. Konten berubah 1 karakter → hash berubah total.

### 6.3 Baru — request & status (kontrak app ↔ service)

```
/refresh_request/<ssid>           ← DITULIS APP (doc id = ssid → tap beruntun otomatis menyatu)
{
  "at":  <epoch-ms saat tap>,     // wajib, dipakai guard duplikat
  "by":  "<vid user>",            // opsional, buat audit
  "rebuild": false                // opsional: true = paksa full-diff, abaikan manifest (§8.4)
}

/refresh_status/<ssid>            ← DITULIS SERVICE (collection terpisah → trigger tidak loop)
{
  "status":  "running" | "done" | "error",
  "reqAt":   <at dari request yang diproses>,
  "start":   <epoch-ms>, "end": <epoch-ms>, "tookMs": 850,
  "changed": ["login"], "deleted": [],     // ringkasan hasil (padanan dibMessage lama)
  "error":   "<pesan>"                     // hanya saat status=error
}
```

Request dan status **sengaja dipisah collection**: kalau service menulis status ke doc request, write itu memicu trigger lagi → loop. Terpisah = trigger hanya pasang di `refresh_request`, bebas loop by construction.

**Firestore security rules:** app (authenticated) boleh `write` `refresh_request/<ssid>` hanya dengan field `at/by/rebuild` bertipe benar; boleh `read` `refresh_status`; **tidak boleh** menulis `/Proxy` dan `refresh_status` (hanya SA service).

---

## 7. Alur runtime — langkah demi langkah

Skenario: user mengubah teks satu page di sheet, lalu tap refresh.

```
 0. (di luar service) edit sheet → formula recalc → tab JSON kolom C berubah. Sama seperti sekarang.
 1. Tap refresh → app tulis /refresh_request/<ssid> {at: now}.
 2. Eventarc → panggil Cloud Run (identitas SA, IAM ✔).
 3. GUARD (urut, gagal salah satu = berhenti dengan alasan di log):
    a. ssid valid (regex [A-Za-z0-9_-]{20,80})? bukan → tulis status error, selesai.
    b. duplikat? request.at <= status.reqAt terakhir → sudah diproses, skip.
    c. single-flight: sync utk ssid ini sedang jalan (mutex in-memory)? → skip (yang jalan akan meng-cover).
    d. cooldown: selesai sync ssid ini < 2 detik lalu? → skip (anti spam-tap).
 4. Tulis /refresh_status/<ssid> {status:"running", reqAt, start}.  → indikator app: amber.
 5. Sheets API values.batchGet — SATU call HTTP, 4 range:
       JSON!B51:E      → pages   (kolom B = nama, C = konten)
       JSON!B6:E49     → system
       Settings!B1:B5  → profile (v,n,e,p,ty)
       op1!H11         → home
    valueRenderOption=UNFORMATTED_VALUE. Timeout context 60s. Retry backoff hanya utk 429/5xx (max 3).
 6. Hash: sha256(konten)[:16] per page/system/profile/home. In-memory, ~ms.
 7. Baca /Proxy/<ssid>/Meta/manifest — 1 read.
    Tidak ada / rebuild=true / v beda → JALUR PENUH: baca seluruh Page+System, diff full, bangun manifest baru (§8.4).
 8. Diff (aturan lengkap §8):
       hash sama                     → skip total (doc tidak disentuh)
       hash beda                     → update doc (cari by field p), Modified
       nama baru di sheet            → create doc, Added
       nama hilang dari sheet        → delete doc, Deleted (prune)
       profile berubah               → update field doc induk
 9. Ada perubahan apa pun → tulis manifest baru + bump `t` (epoch-ms) di /Proxy/<ssid>
    dalam SATU batched write (atomik: manifest, page docs, dan t konsisten).
    Tidak ada perubahan → tidak ada write sama sekali (idempotent).
10. Tulis /refresh_status/<ssid> {status:"done", changed, deleted, tookMs, end}. → indikator: hijau.
11. (otomatis, bukan kerjaan service) `t` berubah → listener app bangun → scan Page/System → repaint.
```

Estimasi durasi langkah 5–10: **0.5–1.5 detik**, seluruhnya di background. Persepsi user: tap = instan.

---

## 8. Aturan diff & tulis

### 8.1 Prinsip
- **Idempotent.** Dijalankan 2× berturut-turut tanpa perubahan sheet = run kedua zero write. Aman di-retry, aman kena duplicate event.
- **`t` hanya bump saat ada perubahan nyata.** Menulis `t` yang sama tidak membangunkan app (gate `rec['t']==storedCS` di listener); `t` baru tanpa perubahan konten = repaint sia-sia semua device. Dua-duanya dihindari.
- **Batched write** untuk perubahan + manifest + `t` → tidak ada state setengah jadi yang terlihat listener.

### 8.2 Kasus per entitas

| Kondisi | Aksi |
|---|---|
| Page: hash sama | Tidak disentuh |
| Page: hash beda | Update doc (match by `p`): set `c`, `t` |
| Page: baru di sheet | Create doc `{v, p, c, t}` |
| Page: hilang dari sheet | Delete doc + hapus entry manifest |
| Page: nama di-rename di sheet | = delete nama lama + create nama baru (2 aksi, benar by design) |
| System | Aturan sama dengan Page, collection `System` |
| Profile (Settings!B1:B5) | Hash gabungan beda → update field `v,n,e,p,ty` doc induk |
| Duplikat nama page di sheet | Ambil kemunculan terakhir + log warning (jangan crash) |
| Konten kosong (row kosong di range) | Bukan page — skip row tanpa nama |

### 8.3 Sumber kebenaran
Sheet = source of truth penuh untuk `page=all` semantics: yang tidak ada di sheet dianggap dihapus (prune), sama dengan perilaku GAS `page=["all"]`.

### 8.4 Manifest lifecycle
- **First run / manifest hilang / `rebuild:true` / versi skema beda** → full-diff: baca seluruh collection Page+System (sekali itu saja), bandingkan konten sebenarnya, tulis yang perlu, bangun manifest dari nol. Self-healing: manifest terhapus → terbangun lagi run berikutnya.
- **Guard drift:** manifest adalah cache turunan. Kalau ada yang mengedit doc Page langsung dari console, manifest bisa "bohong". `rebuild:true` di request doc memaksa full-diff. Opsional: Cloud Scheduler mingguan memanggil rebuild per tenant sebagai reconcile.

---

## 9. Stabilitas & proteksi

| Mekanisme | Detail |
|---|---|
| Single-flight per ssid | Mutex in-memory `map[ssid]`. Eventarc bisa deliver duplikat / user spam tap → hanya 1 sync jalan, sisanya skip. `max-instances=1` menjadikan mutex ini efektif global (§11.4) |
| Cooldown | Selesai < 2s lalu → skip. Anti tap-spam |
| Timeout | Context deadline: batchGet 60s, total request 120s. Tidak ada operasi tanpa deadline |
| Retry | HANYA transport/429/5xx Sheets API, backoff, max 3. Write Firestore yang sudah committed tidak pernah di-retry ulang |
| Quota Sheets API | ±60 read-request/menit per SA; batchGet = 1 request → ±60 refresh/menit lintas tenant. Tap-driven: aman jauh. Kalau nanti + Scheduler semua-tenant: hitung ulang / minta quota increase (gratis) |
| Duplicate event | Guard `request.at <= status.reqAt` (§7.3b) |
| Kegagalan parsial | Batched write atomik — sukses semua atau tidak sama sekali |

## 10. Observability

- **Structured log per run** (Cloud Logging otomatis dari Cloud Run): `{ssid, reqAt, sheetsMs, diffMs, writeMs, totalMs, changed[], deleted[], error?}` — padanan `dibMessage` lama tapi bisa di-query.
- **Metric turunan log**: error rate, p95 totalMs, jumlah refresh/jam.
- **Alert minimum**: error rate > X% dalam 15 menit → notifikasi.
- `/refresh_status` doc itu sendiri = jejak audit per tenant yang bisa dilihat langsung di console.

---

## 11. Setup sekali jalan (prasyarat)

### 11.1 Keputusan project
Service, Eventarc, dan Firestore `/Proxy` **harus satu project** (Firestore trigger tidak lintas project). → Deploy di project tempat Firestore `/Proxy` berada (perlu konfirmasi: `authenium-prod1`?). Dev/staging: `fir-app-dev1`.

### 11.2 Service account
```
mobile-refresh-sa@<project>.iam.gserviceaccount.com
  roles/datastore.user          (baca+tulis Firestore)
  (akses sheet BUKAN via IAM — via sharing, §11.3)
```

### 11.3 Share sheet
Tiap proxy sheet di-share ke email SA sebagai **Viewer** (service hanya membaca sheet). ⚠️ Konsekuensi operasional: **onboarding tenant baru bertambah 1 langkah wajib** — share proxy sheet-nya ke SA. Kalau lupa: refresh tenant itu error 403 (terlihat jelas di status doc + log), bukan silent.

### 11.4 Deploy Cloud Run
```
gcloud run deploy mobile-refresh \
  --source=. --region=<region Firestore, mis. asia-northeast1> --project=<project> \
  --no-allow-unauthenticated --ingress=internal \
  --service-account=mobile-refresh-sa@<project>.iam.gserviceaccount.com \
  --min-instances=1 --max-instances=1 --memory=256Mi
```
- `--no-allow-unauthenticated` + `--ingress=internal` = R5.
- `min-instances=1` → tanpa cold start, latency konsisten.
- `max-instances=1` → single-flight in-memory berlaku global. Cukup: 1 instance Go menangani ratusan refresh/menit. Naikkan hanya kalau terbukti perlu (dengan catatan mutex menjadi per-instance).

### 11.5 Eventarc trigger
```
gcloud eventarc triggers create refresh-request-trigger \
  --destination-run-service=mobile-refresh --destination-run-region=<region> \
  --event-filters="type=google.cloud.firestore.document.v1.written" \
  --event-filters="database=(default)" \
  --event-filters-path-pattern="document=refresh_request/{ssid}" \
  --service-account=mobile-refresh-sa@<project>.iam.gserviceaccount.com
```
SA trigger butuh `roles/run.invoker` di service + `roles/eventarc.eventReceiver`.

### 11.6 Enable API
`sheets.googleapis.com`, `run.googleapis.com`, `eventarc.googleapis.com`, `cloudbuild.googleapis.com`.

### 11.7 Struktur repo (Go)
```
mobile-refresh/
  main.go            // HTTP handler CloudEvent + guard chain (§7.3–4)
  sync.go            // pipeline: fetch → hash → diff → write (§7.5–10)
  sheets.go          // client Sheets API, batchGet 4 range
  manifest.go        // baca/bangun/tulis manifest, full-diff fallback
  sync_test.go       // golden test aturan diff (§8.2 semua baris = 1 test case)
  go.mod
```
Tanpa framework; stdlib + `cloud.google.com/go/firestore` + `google.golang.org/api/sheets/v4` + functions-framework (CloudEvent parsing).

---

## 12. Rencana rilis bertahap

| Milestone | Isi | Kriteria lulus |
|---|---|---|
| M1 | Core sync (fetch→hash→diff→write) + golden test diff | Semua baris tabel §8.2 hijau; run 2× tanpa perubahan = zero write |
| M2 | Trigger Eventarc + guard chain + status write-back | Tulis request doc di dev project → status running→done; spam 5 request → 1 sync |
| M3 | Observability + deploy dev (`fir-app-dev1`) + test ladder §13 | Ladder 4 tahap lulus di dev |
| M4 | Flutter: tombol refresh → tulis request doc; indikator baca status doc (di belakang flag) | 1 tenant pilot: edit sheet → tap → repaint < 3 detik, indikator amber→hijau |
| M5 | Monitor pilot 1–2 minggu → rollout semua tenant | Error rate ~0; `readSS` resmi jadi fallback saja |

`readSS` dan GAS **tidak disentuh di semua milestone** — jalur lama tetap utuh sampai M5 selesai.

## 13. Test ladder (di dev project, sebelum menyentuh produksi)

1. **Unit** — golden test diff, tanpa network.
2. **Guard** — request dengan ssid rusak → status error, Sheets API tidak terpanggil.
3. **Sheet test read-only** — copy proxy sheet, share ke SA dev → request → status done, semua `Added` (Firestore dev kosong), doc Page terbentuk benar.
4. **Idempotensi** — request kedua tanpa edit → done, `changed:[]`, `t` tidak bergerak, zero write (cek metric).
5. **Perubahan nyata** — edit 1 teks di sheet copy → request → `changed:["<page>"]`, `t` bergerak, konten doc = teks baru.
6. **Prune** — hapus 1 page di sheet → request → `deleted:["<page>"]`, doc hilang.
7. **End-to-end pilot (produksi, 1 tenant)** — M4: dari HP, edit sheet asli → tap → repaint.

## 14. Fallback & rollback

- **Service mati / error:** app masih punya jalur `readSS` lama (flag). Degradasi = kembali lambat, bukan mati.
- **Rollback kode:** Cloud Run revisions — alihkan traffic ke revisi sebelumnya, 1 perintah, tanpa redeploy.
- **Rollback total:** matikan flag di app → 100% jalur lama. Tidak ada migrasi data yang harus di-undo (skema `/Proxy` tidak berubah; manifest/status doc bisa dibiarkan, tidak dibaca siapa pun).

## 15. Keputusan yang dibutuhkan sebelum M1

1. **Konfirmasi project** tempat Firestore `/Proxy` berada (dugaan kuat: `authenium-prod1`) — menentukan rumah service (§11.1).
2. **Trigger**: setuju pola request-doc? (Scheduler bisa ditambah belakangan sebagai pelengkap, bukan pengganti.)
3. **Proses share sheet ke SA** untuk tenant existing + masuk checklist onboarding tenant baru — siapa yang mengeksekusi.
4. **Varian JSON2** (`appVid[0]==='updated'` di GAS, tab "changed pages"): dipakai ada yang memanggil? Usulan: tidak di-port (service selalu full-diff dari tab `JSON`; manifest sudah membuat full-diff murah). Konfirmasi tidak ada consumer JSON2.
5. **Field doc induk**: `mobileRefresh` GAS menulis `v,n,e,p,ty,t`. Ada tenant yang bergantung field induk lain? (spec lama §13.5 menandai ini open.)

---

## 16. Ringkasan nilai (kenapa layak dibangun)

| Dimensi | Lama | Baru |
|---|---|---|
| Yang dirasakan user saat tap | Layar ke-block 3–9s, kadang gantung | Instan; repaint menyusul 1–3s |
| Skala dengan jumlah page | Makin banyak makin lambat (linear) | Biaya diff konstan (manifest, 1 read) |
| Indikator refresh | Tebakan; merah misterius | Status nyata running/done/error |
| Keamanan | URL publik, rahasia = obscurity | IAM + ingress internal, tanpa secret di kode |
| Observability | Tidak ada | Log terstruktur per run + alert |
| Concurrency | ±30/script (sumber gantung saat ramai) | Autoscale Cloud Run |
| Maintenance | 20 deployment GAS manual | 1 service, deploy ber-versi, rollback 1 perintah |
