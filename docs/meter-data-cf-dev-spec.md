# Dev Spec (Go + dict book) — data & CF Baca Meter

**Tanggal:** 2026-08-19 · **Versi: v3** (menyerap review ronde 1+2+3, `docs/meter-data-cf-REVIEW.md`)
**Buat:** dev Go (CF) + dict book. **Bukan** buat dev Flutter — widget-nya di `docs/digit-pad-widget-dev-spec.md`.
**Status:** PROPOSED
**Konsumen pertama:** vertikal Paskal Hypersquare, page `MeterRound` / `MeterScan` / `MeterRead` / `MeterSurvey`.
**Referensi:** `docs/handoff-meter-pascal.md` · `docs/digit-pad-widget-dev-spec.md` · `docs/titik-patroli-app-first-location-dev-spec.md` · `docs/meter-data-cf-REVIEW.md` · dict book `1_XHmo5…`.

---

## 1. Kenapa

Widget `DIGIT_PAD` butuh tiga angka yang **sudah ada di layar sebelum petugas ngetik**: jumlah digit meter, bacaan terakhir, rata-rata pemakaian. Runtime baca data lewat `search` (cocok-persis), **gak bisa "ambil 1 terakhir diurut turun"** — jadi ketiganya harus duduk di satu doc yang bisa di-`search` langsung.

Itu satu-satunya alasan ada CF di fitur ini. Sisanya nebeng yang sudah jalan.

## 2. Konsep — tiga lapis, satu di antaranya sudah ada

```
location          SUDAH ADA   identitas + QR. li = isi QR. Gak disentuh.
   │
   ├── event      SUDAH ADA   tiap bacaan = 1 event (addToEvent). Append-only.
   │                          lq = li (dict book: "li = event lq")
   ├── meter      BARU        1 doc per titik per site. Ringkasan yang dibaca DIGIT_PAD.
   │                          Ditulis CF, bukan app.
   └── putaran    BARU        1 doc per site per periode. Header, bukan tugas.
                              Dibikin cron, bukan tombol.
```

**Kenapa bacaan naik ke `event`, bukan collection sendiri:** `addToEvent` sudah ada, `lq` sudah berarti titik, `i`/`d`/`cv`/`cn`/`t`/`ts` sudah berarti foto/catatan/pelaku/waktu. `timelinePeriodic`@196 baca event → panel "Riwayat pembacaan" di kokpit jadi gratis. Append-only cocok dengan handoff #11: fakta terkunci, tafsir menumpuk di atasnya.

### 2.1 Putaran = dokumen header, dibuat cron

Versi pertama spec ini bilang "putaran cukup nilai `prd`, nol dokumen". **Salah di satu hal yang mahal: penyebutnya jadi tidak beku.** Kalau titik ditambah atau dinonaktifkan di tengah bulan, "214 unit" bergeser **surut**, dan klaim "Agustus semua terbaca" tidak bisa dibuktikan lagi.

Bentuknya tetap **bukan tombol** (handoff #29 — suatu bulan orang lupa menekan, petugas nganggur). Jadi: **cron tanggal 1**, satu doc per site.

Doc `putaran` **bukan tugas dan tidak menugaskan siapa pun** — dia membekukan tiga hal: berapa titik diharapkan, kapan tenggat, apakah sudah dikunci. Tidak melanggar NEVER §8. Ini juga rumah tombol **"Kunci N bacaan"** di kokpit.

### 2.2 "Belum terbaca" harus bisa diungkapkan `search`

`search` hanya **cocok-persis** — tidak ada `!=`, tidak ada NOT-EXISTS. Jadi *"titik yang belum dibaca bulan ini"* mustahil diungkapkan kalau penandanya "periode terakhir".

Dibalik: `meter` menyimpan **`due` = periode yang masih ditunggu**.

```
search: "sv◼{site}⭘due◼202609"   → persis titik yang belum dibaca bulan ini
```

Tiap ada bacaan, CF menaikkan `due` → titik itu **hilang sendiri** dari daftar (handoff #28), tanpa kemampuan query baru.

### 2.3 Retensi

✅ **Diputus user 2026-08-19: event bacaan TIDAK BOLEH hilang.** Collection `meter_reading` terpisah tidak jadi.

**Satuan `r` = MENIT** (terverifikasi, 3 dokumen lawan 1):
```
addToEvent-flutter-dev-spec.md:98         | `r` | Retention minutes (e.g. 4320 = 72h)
driver-runtime-firestore-structure.md:42  | `r` | retention (minutes, e.g. 4320)
patroli-cleaning-MASTER-handoff.md:254      `r` retention(menit, REQ)
```
Jadi `4320` = **72 jam = 3 hari**. **JANGAN salin dari config lain.** Pilihan: (1) hilangkan `r` kalau kosong = tidak pernah kedaluwarsa; (2) isi **`5256000`** (10 tahun dalam menit).

⚠️ **Tidak ada kode Go di `cloud-function` yang MEMBACA `r`** — cuma `fate.go:190` yang menulisnya sebagai literal. TTL yang benar-benar jalan di repo itu `xa` (Firestore TTL policy). Penegak `r` ada di luar repo, **atau tidak ada sama sekali**. Satu orang perlu memastikan sebelum nilai dipatok.

## 3. Kontrak field

### 3.0 Tipe data — patok sekarang, jangan diserahkan ke dev

| String | Number |
|---|---|
| `prd` `due` `lk` `li` `sv` `ln` `msn` `mc` `mo` `mst` `pst` | `sd` `dg` `pv` `avg` `pt` `exp` `dln` `t` |

**Aturan: canonical-on-write.** CF selalu menulis `prd`/`due` sebagai **String**, dan menormalkan apa pun yang dibaca dari event sebelum membandingkan.

> `"202609"` sangat gampang ter-coerce jadi Number oleh writer mana pun. Kalau `meter.due` tersimpan String tapi `search` mengirim Number — atau sebaliknya — hasilnya **0 row, senyap**: `MeterRound` kosong dan tidak ada yang error. Ini bukan kekhawatiran teoretis: String-vs-Number sudah jadi akar **custody-stuck** dan **search-0-row** di sistem ini, dan `digit-pad-widget-dev-spec.md:143` sudah mematok `position` = Number dengan alasan yang persis sama.

### 3.1 `event` — 1 bacaan (app tulis via `addToEvent`)

| Field | Isi | Sumber | Status |
|---|---|---|---|
| `lq` | id titik = `location.li` | `◁1▷` (hasil scan / routeParams) | sudah ada |
| **`sv`** | site vid — **wajib**, tanpa ini CF tidak bisa membentuk `lk` | `{site}` (token halaman) | sudah ada |
| `prd` | periode `YYYYMM` (String) | dihitung app dari tanggal kirim | sudah ada |
| `sd` | **stand** — angka meter (Number) | `◁7▷` (DIGIT_PAD) | **BARU** |
| `i` | foto muka meter | `◁4▷` | sudah ada |
| `d` | alasan kalau tidak terbaca | `◁8▷` | sudah ada |
| `mc` | tingkat keyakinan pemetaan (pendataan awal) | `◁12▷` | **BARU** |
| `cv` / `cn` | petugas | `{userVid}` / `{userName}` | sudah ada |
| `t` / `ts` | epoch / string terformat | `◀2▶` / `◀2\|T7\|…▶` | sudah ada |
| **`ty`** | nama taksonomi event | literal | sudah ada |

> ⚠️ **`ty`, BUKAN `et`.** `et` = **Event time (epoch ms)**, kolom A tab Event (`addToEvent-flutter-dev-spec.md:101`). Kalau diisi string, kolom A rusak dan semua konsumen timeline — termasuk `timelinePeriodic`@196 yang justru mau dipakai — ikut salah baca. Jenis event tinggal di `ty` (`:110`, nilai existing `report-incident` / `attendance-check-in`).

> ⚠️ **`sv` wajib.** Doc `meter` ber-id `lk` = `{li}-{sv}`; tanpa `sv` di event, CF harus menebak site lewat lookup `location` by `li` — dan itu balik N doc, persis masalah yang `lk` selesaikan. App sudah tahu site-nya (`MeterRound` memfilter `sv◼{site}`), jadi ini 1 token.

Nama taksonomi (pola `{domain}-{entity}-{action-past}`, tab `event_taxonomy`):
`meter-reading-recorded` · `meter-reading-failed` · `meter-point-surveyed`.

### 3.2 `meter` — ringkasan per titik (CF tulis, app TIDAK PERNAH tulis)

**Doc-id = `lk`** (= `{li}-{sv}`, konsisten dengan `location`).

> ⚠️ **BUKAN `li`.** Kode `location` sendiri menjelaskan kenapa:
> ```go
> // cloud-function/internal/location/location.go:50-52
> fieldLk = "lk"  // unique row key "{li}-{sv}" (= doc id) — li alone is shared
>                 // across a titik's sites
> ```
> Doc-id `li` = satu meter di 2 site berbagi satu doc → `pv` timpa-timpaan → dua tagihan mengambil angka yang sama. "Paskal 1 site" itu kondisi hari ini, bukan kontrak — cacatnya baru meledak di tenant kedua, waktu datanya sudah setahun.

| Field | Isi | Diisi |
|---|---|---|
| `lk` | PK, = `{li}-{sv}` | CF |
| `li` | FK → `location.li` — tetap disimpan, ini yang keluar dari scan QR | CF |
| `sv` | site | CF |
| `ln` | nama titik (denorm dari `location.ln`) — judul kartu di daftar | CF |
| `dg` | jumlah digit meter (4/5/6) | app, sekali, pendataan awal |
| `msn` | nomor seri meter | app, sekali, pendataan awal |
| `pv` | bacaan terakhir | CF |
| `avg` | rata-rata pemakaian per bulan | CF |
| `pt` | epoch bacaan terakhir | CF |
| `due` | **periode yang masih ditunggu** — inti daftar "belum terbaca", §2.2 | CF |
| `hs` | riwayat, **array of `{prd, sd}`**, maks 6, `hs[0]` = tertua | CF |
| `mc` | tingkat keyakinan pemetaan terakhir | CF |
| `mo` | hasil kunjungan terakhir: `read` / `failed` | CF |
| `mst` | status titik: `active` / `removed` — dasar hitung `exp` | app / admin |

**`hs` menyimpan pasangan, bukan angka telanjang.** Rumus `avg` (§5.5) membaginya dengan **jarak periode**, jadi periode tiap elemen harus ikut. `hs` yang cuma `[1120,1157,…]` bikin pembaginya tidak punya sumber data.

**`prd` yang disimpan di `hs` = periode yang DITUTUP (`closed`), bukan `event.prd`** — supaya konsisten dengan §5.4.

**Nama field WAJIB sama dengan `digit-pad-widget-dev-spec.md`.** Kalau beda, widget baca field yang tidak pernah ditulis → **`null` diam, bukan error** → "nol banding, nol vonis" (perilaku sah menurut spec widget) → ambang lonjakan mati total sementara halamannya kelihatan jalan normal.

### 3.2b `putaran` — header periode (cron tulis)

**Doc-id = `{sv}__{prd}`** (deterministik, idempoten).

| Field | Isi | Diisi |
|---|---|---|
| `sv` | site | cron |
| `prd` | periode `YYYYMM` | cron |
| `exp` | **jumlah titik diharapkan**, dibekukan saat putaran dibuka | cron |
| `dln` | tenggat terbit (epoch) | cron, dari config site |
| `pst` | `open` → `closed` (periode lewat, cron) → `locked` (angka final, kokpit) | cron + kokpit |
| `lkv` / `lkn` | siapa yang mengunci | kokpit |
| `t` / `ts` | epoch / string | cron |

> **`closed` ≠ `locked`, sengaja dibedakan.** `closed` = periodenya sudah lewat (mekanis, cron). `locked` = angkanya final dan tidak bisa diubah (keputusan, manusia). Tanpa pemisahan ini, `search pst◼open` balik 2 doc begitu September dibuka sementara Agustus belum sempat dikunci.

### 3.3 Kode field — daftar keputusan sadar

Sistem ini **mengizinkan kode yang sama beda arti di collection berbeda** — `ty` saja sudah 3 arti (event type, location subtype, approval discriminator), semuanya berkomentar eksplisit di kode. Jadi tabel ini **bukan klaim "bebas bentrok"**, tapi daftar keputusan.

| Kode | Keputusan | Alasan |
|---|---|---|
| `sd` `mc` `dg` `pt` `due` `hs` `mo` `mst` | pakai | belum ketemu pemakaian lain |
| `msn` | pakai | meter serial. **Bukan `sn`** (= site name), **bukan `mn`** (= model name array, `fate.go:55`) |
| `avg` | pakai | rata-rata. **`av` HARAM** = cost-center vid |
| `pv` | **pakai ulang sadar** | juga = project vid di fate. Beda collection, arti jelas dari konteks |
| `li` | **pakai ulang sadar** | juga = nota sale-line array (`walkin_nota_trigger.go:29`). Di sini artinya sama dengan `location.li` — justru konsisten |
| `exp` `dln` `pst` `lkv` `lkn` | pakai | field `putaran` |
| ~~`pp`~~ | **DIBUANG** | `task.it[]` = plan-pickup; lagipula tidak bisa mengungkapkan "belum terbaca" (§2.2) |
| ~~`mn`~~ | **DIBUANG** | `fate.go:55` = model name array |
| ~~`dl`~~ | **DIBUANG** | `dp[].dl` = selisih custody, muncul di layar driver harian |
| ~~`et`~~ | **DIBUANG** | = event time epoch, bukan jenis event |

`ad` / `al` juga sudah kepakai (actual-drop / address) — dihindari.

> Baris "belum ketemu pemakaian lain" berdasarkan review CF grounded ke repo `cloud-function` @ `e19f331` + docs. **Tetap lewat dict book** sebelum CF ditulis — dict book yang SSOT, bukan tabel ini.

## 4. Contoh resolved (id asli, titik `BSD Tech Center #18`)

`addToEvent` di tombol simpan page `MeterRead`:

```
84214220504259//event⭘r◼5256000⭘tablevid◼20342033315492⭘ty◼meter-reading-recorded⭘lq◼◁1▷⭘sv◼{site}⭘prd◼◀2|T7|yyyyMM▶⭘sd◼◁7▷⭘i◼◁4▷⭘d◼◁8▷⭘cv◼{userVid}⭘cn◼{userName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm▶
```

Doc `meter` sesudah bacaan Agustus:

```json
{ "lk":"0lefc05bc4c884bd590a3a13c8d99663b1dfd371d8-32639062303108",
  "li":"0lefc05bc4c884bd590a3a13c8d99663b1dfd371d8",
  "sv":"32639062303108", "ln":"BSD Tech Center #18",
  "dg":5, "msn":"B21-4471902",
  "pv":1268, "avg":37, "pt":1787200000000, "due":"202609",
  "hs":[{"prd":"202605","sd":1157},{"prd":"202606","sd":1194},
        {"prd":"202607","sd":1231},{"prd":"202608","sd":1268}],
  "mc":"uji-aliran", "mo":"read", "mst":"active" }
```

Doc `putaran` September (cron 1 Sep):

```json
{ "sv":"32639062303108", "prd":"202609",
  "exp":214, "dln":1788800000000, "pst":"open",
  "t":1788300000000, "ts":"01 Sep 2026 00:05:00" }
```

**Bacaan yang dipakai halaman:**

| Halaman / seksi | table | search |
|---|---|---|
| `MeterRound` — **Belum dibaca September** | `//meter` | `sv◼{site}⭘due◼202609` |
| `MeterRound` — **Tertunggak Agustus** | `//meter` | `sv◼{site}⭘due◼202608` |
| `MeterRead` — banding | `//meter` | `lk◼{lk}` (atau `li◼{li}⭘sv◼{site}`) |

**Dua seksi, bukan satu.** Kalau tunggakan dilebur ke daftar bulan berjalan dengan menaikkan `due`-nya, pertanyaan *"titik mana yang bolong Agustus"* tidak bisa dijawab lagi — jawabannya berupa ketiadaan event, dan §2.2 sudah membuktikan ketiadaan tidak bisa diungkapkan `search`. Dua seksi = tunggakan jadi berumur dan berisik. Preseden: `AdminTaskList` (4 `LIST_CARD` terpisah, karena eq-DSL tidak punya OR).

## 5. CF — cabang `meter-` di `onEventCreated`

**Bukan fungsi/trigger baru.** `deploy.sh` sudah punya dua fungsi yang menyala di path `event` (`onEventCreated` created-only, `onTenantWrite` wildcard `{coll}`), dan repo ini sudah dua kali kena masalah trigger tumpang-tindih — komentar peringatannya masih menempel di `deploy.sh:33-35` dan `:42-45`. Kebiasaan rumah = fold ke dispatcher yang ada.

> ⚠️ `onTenantWrite` wildcard `{coll}` akan menyala di doc `meter` dan `putaran` yang **CF sendiri tulis** → butuh early-return eksplisit untuk dua collection itu, kalau tidak jadi loop.

**Gate — prefix saja:**
```
ty diawali "meter-"
```

> Gate v1 (`meter-reading` + `sd` terisi) menyaring keluar `meter-point-surveyed`. Gate v2 menambal dengan satu pengecualian, lalu **menyaring keluar `meter-reading-failed`** — dan langkah 7 yang memegangnya jadi tidak pernah tercapai, `mo` mati diam. Selama gate memakai daftar-putih, tiap `ty` baru harus ingat mengubah gate. **Gate cukup prefix; percabangan di dalam.** Event `meter-*` di masa depan (mis. `meter-point-deactivated`) tinggal jadi cabang baru.

**Seluruh langkah 1–7 dibungkus satu `RunTransaction`** — baca doc di dalam txn, tulis di dalam txn yang sama.

> Tanpa transaksi: dua event untuk titik yang sama tiba berbarengan → dua invocation membaca `hs` yang sama, dua-duanya push, yang belakangan menimpa → **satu bacaan hilang dari `hs`**, dan `avg` salah sampai jendela 6-nya bergulir habis. Kapan itu terjadi? Persis skenario yang bikin langkah 2 ada: sync offline mengirim beberapa event sekaligus. Guard `t ≤ pt` tidak menolong — dua event beda `t`, dua-duanya sah. Presedennya `asset_cache` (balance + rollup dalam satu txn).

Langkah:

1. Baca doc `meter` id `lk` = `{lq}-{sv}`. Belum ada → bikin (`lk`, `li`, `sv`, `ln` dari doc `location`, `mst:"active"`).
2. **Tolak mundur waktu:** `t` event ≤ `pt` tersimpan → **skip**. Offline-first bikin urutan tiba tidak terjamin.
3. Butuh `sd` (langkah 3–5). `sd` kosong → lompat ke langkah 7.
   Set `pv` = `sd`, `pt` = `t`, `mo` = `read`.
4. **Tutup periode yang diutang, bukan yang distempel:**
   ```
   due kosong (doc baru)      →  closed = event.prd
   event.prd − due == 1 bulan →  closed = due          // telat sync
   selain itu                 →  closed = event.prd    // bolong / normal
   due = closed + 1 bulan
   ```
   > Aturan tengah menutup telat-sync: bacaan 2 September untuk Agustus → Agustus tertutup, `due` → 202609, September tetap ditagih. **Aturan ketiga penting:** titik yang bolong 3 bulan, kalau `min()` dipakai apa adanya, satu bacaan September cuma menutup Juni — `due` ketinggalan permanen dan titiknya nongol di seksi tunggakan padahal dibaca tiap bulan. Stand Juli/Agustus tidak bisa diciptakan ulang; satu kunjungan = satu angka. Bulan yang kelewat **hilang permanen**, dan `putaran.exp` vs jumlah terbaca yang mencatat kerugiannya. Itu jujur.
5. Push `{prd: closed, sd}` ke ekor `hs`, buang dari kepala kalau sudah >6. Lalu:
   ```
   avg = (sd − hs[0].sd) / ( bulan(closed) − bulan(hs[0].prd) )
   ```
   **Pembagi = jarak periode, bukan cacah bacaan.** Titik yang kelewat Agustus lalu dibaca September = pemakaian 2 bulan; dibagi 1 selang, `avg` jadi 2× lipat dan bulan berikutnya lonjakan sungguhan lolos diam-diam — titik yang paling sering bolong jadi yang paling longgar diawasi.
   Kurang dari 2 elemen `hs` → `avg` **dikosongkan** (bukan 0 — 0 bikin ambang lonjakan nol dan semua bacaan kena tandai).
6. `ty` = `meter-point-surveyed` → set juga `mc`. **Jangan sentuh `due`** — langkah 4 sudah menghasilkan periode berikutnya, dan itu yang benar. (Versi sebelumnya menyetel `due` = periode berjalan, yang justru bikin titiknya tetap muncul sebagai "belum dibaca" — kebalikan dari klaim "pendataan ADALAH pembacaan", handoff #24.)
7. `ty` = `meter-reading-failed` (tidak ada `sd`) → **hanya** set `mo` = `failed`. `pv`/`pt`/`due`/`avg`/`hs` tidak disentuh — titiknya memang belum terbaca dan harus tetap di daftar. `mo` yang bikin kokpit bisa membedakan "meteran kegembok" dari "belum dikunjungi".
8. Idempoten: re-fire event yang sama = hasil sama (doc-id deterministik + guard langkah 2).

**Kenapa `hs` ada:** tanpa itu, langkah 5 harus query ledger event (`lq` + `t desc`) tiap bacaan masuk, plus satu composite index. `hs` = 6 pasangan di doc yang sudah dibaca — nol query, nol index. Ledger event tetap SSOT; `hs` cuma cache dan bisa dibangun ulang. Guard langkah 2 menjamin isinya tidak pernah mundur.

### 5b. CF — `openMeterPeriod` (cron, tanggal 1)

Trigger: **jadwal**, tanggal 1 tiap bulan (WIB). Bukan tombol.

1. Untuk tiap site yang punya titik meter: `docId = {sv}__{prd}`. Sudah ada → **berhenti**.
2. `exp` = `count(meter where sv◼{sv} ⭘ mst◼active)` saat itu juga — dibekukan, tidak pernah dihitung ulang.
3. `dln` = tenggat dari config site. `pst` = `open`.
4. Periode sebelumnya yang masih `open` → set `pst` = `closed`.

> **TIDAK ada langkah "naikkan `due` yang tertinggal".** Versi sebelumnya melakukannya supaya titik bolong tetap muncul di daftar bulan berjalan — tujuannya benar, caranya menghapus satu-satunya jejak yang bisa di-`search`. Gantinya = dua seksi daftar (§4). Tunggakan >1 bulan = eskalasi kokpit lewat selisih `exp`, bukan daftar petugas yang memanjang.

**Titik baru di tengah bulan:** `due`-nya periode berjalan → muncul di daftar, tapi `exp` tidak berubah. Disengaja — yang beku adalah janji di awal bulan. Selisihnya kelihatan di kokpit sebagai "titik baru di luar putaran", bukan disembunyikan.

### 5b.1 Cron belum punya preseden di repo

`openMeterPeriod` bakal jadi **fungsi terjadwal pertama**. 9 fungsi existing = 8 Firestore-trigger + 1 HTTP; nol Eventarc-schedule, nol Pub/Sub.

Pola termurah = tiru `reconcileAssetCache`:
```bash
gcloud functions deploy openMeterPeriod --gen2 --runtime=go124 --region=$REGION --source=. \
  --entry-point=OpenMeterPeriod --trigger-http --no-allow-unauthenticated
```
\+ Cloud Scheduler job (OIDC), tanggal 1 jam 00:05 WIB — kerjaan devops.

`reconcileAssetCache` dapat `db`+`tid` dari body HTTP; cron tidak punya penyuruh. Belum ada registry tenant di repo. **Keputusan: satu Scheduler job per tenant**, `db`/`tid` di body job. Nol registry baru, nol kode baru; menambah tenant = menambah job. Env-var list / doc config baru sepadan kalau tenant sudah puluhan.

### 5c. Refresh `ln`

`onTenantWrite` sudah me-route perubahan `location`. Tambah cabang: `ln` berubah → tulis ulang `ln` di doc `meter` yang `lk`-nya cocok.

> Tanpa ini, titik yang di-rename di `TitikPatroli` bikin judul kartu `MeterRound` basi **selamanya**, sementara layar lain menampilkan nama baru — petugas melihat dua nama untuk satu titik.

## 6. Deliverable

**dev Go:**
1. **Cabang `meter-` di `onEventCreated`** (§5) — bukan fungsi baru. Gate: `ty` prefix `meter-` **saja**.
2. **Early-return `meter` + `putaran` di `onTenantWrite`**.
3. Doc-id `meter` = `lk`. Seluruh langkah 1–7 dalam **satu `RunTransaction`**.
4. Aturan `closed` 3 cabang (§5.4) · `avg` dibagi jarak periode (§5.5) · `avg` kosong kalau `hs` < 2 · `hs` array of `{prd,sd}`, maks 6, `hs[0]` tertua.
5. Cabang `meter-reading-failed` → cuma set `mo` (§5.7).
6. **Canonical-on-write** `prd`/`due` sebagai String (§3.0).
7. **`openMeterPeriod`** (§5b) — HTTP + Cloud Scheduler.
8. Cabang refresh `ln` di `onTenantWrite` (§5c).
9. Registry: tab `flags_functions` (CLOUD FUNCTIONS) + `event_taxonomy` (3 nama baru).
10. **Index:** `meter` `sv`+`due` · `meter` `sv`+`mst` · `putaran` `sv`+`pst`. Index `event` `lq`+`t desc` **tidak perlu** — dibunuh `hs`.

**devops:**
11. Cloud Scheduler job per tenant, tanggal 1 jam 00:05 WIB, OIDC.

**dict book:**
12. Tab `meter` + `putaran` BARU (template 11 kolom, bilingual).
13. Tab `location` dipatch — live sudah punya `lk` dan `lst`, dict masih 6 field. Catat juga `la`/`lo` live = **Number** (dict bilang text).
14. Tab `addToEvent` += `sd`, `mc`, dan `sv` di konteks event bacaan.
15. Catat `pv` dan `li` sebagai **pemakaian-ulang sadar** (§3.3).

**builder / spec lain:**
16. `digit-pad-widget-dev-spec.md` — `search` contoh `li◼{li}` → **`lk◼{lk}`**. Sisanya sudah cocok (`dg`/`pv`/`avg`).
17. Halaman `MeterRead` wajib membawa `sv` ke `addToEvent` (§3.1).

**Siapa pun sebelum CF ditulis:**
18. Pastikan **siapa yang benar-benar menghapus berdasarkan `r`** (§2.3).

## 7. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Retensi event | user / product | ✅ DIPUTUS — jangan hilang |
| Satuan `r` | — | ✅ MENIT. `4320` = 3 hari, jangan disalin |
| Siapa penegak `r` | dev / backend mobile | **OPEN** |
| Kode field | dict book | ✅ **DITULIS 2026-08-19** |
| Tab `meter` + `putaran` + patch `location` + `addToEvent` + `event_taxonomy` | dict book | ✅ **DITULIS 2026-08-19** |
| Cron `openMeterPeriod` + Scheduler | dev Go / devops | **DITUNDA user 2026-08-19** — cuma nyuapin kokpit (web), dan web ikut ditunda. Jalur mobile tidak menyentuhnya |
| Cabang `meter-` di `onEventCreated` (+txn) | dev Go | PROPOSED |
| Early-return + refresh `ln` di `onTenantWrite` | dev Go | PROPOSED |
| `openMeterPeriod` | dev Go | PROPOSED |
| Scheduler job per tenant | devops | PROPOSED |
| Widget `DIGIT_PAD` | dev Flutter | spec terpisah, **sudah terkirim** |
| Sinkron `search` di spec widget | builder | **PENDING — doc lain** |
| 4 page | builder | nunggu renderer |

**Riwayat revisi:** v2 — 11 temuan ronde 1 (`et`→`ty`, doc-id→`lk`, nama field disamakan, gate survey, `avg` pembagi, cron bakar tunggakan, fold ke `onEventCreated`, `hs`). **v3 — 15 temuan ronde 2+3**: `sv` di event, `hs` simpan periode, gate prefix-saja, aturan `closed` 3 cabang, tabel tipe + canonical-on-write, transaksi, refresh `ln`, rename bocor 8 tempat, +2 index, acceptance diperbaiki.

## 8. Not Doing (dan kenapa)

- **Tombol "Buat Putaran September"** — cron, bukan manusia (handoff #29).
- **Penugasan orang di doc `putaran`** — putaran cuma membekukan jumlah + tenggat + kunci. Kalau nanti ada field `assignee` di sini, itu tanda NEVER §8 mulai bocor.
- **Hitung tagihan / tarif** — fase 2, sebagian di luar produk. CF ini berhenti di angka meter.
- **CF hapus / koreksi event** — koreksi = event baru di atasnya (handoff #11).
- **Merekonstruksi bulan yang bolong** — satu kunjungan = satu angka. Stand bulan kelewat tidak bisa diciptakan ulang, dan berpura-pura bisa lebih buruk daripada mengakui hilang.
- **Ambang lonjakan per titik** — v1 dari `avg` × `spikeMultiplier` di config widget.
- **`meter` ditulis app** — kecuali `dg`/`msn` di pendataan awal. Ringkasan turunan yang bisa ditulis app = ringkasan yang bisa bohong.

## 9. Acceptance

- [ ] Bacaan pertama sebuah titik → doc `meter` terbentuk, `pv` = stand, `avg` **kosong** (bukan 0).
- [ ] Bacaan kedua → `avg` keisi, nilainya pemakaian **per bulan**.
- [ ] Event `t` lebih tua dari `pt` → doc `meter` **tidak berubah**.
- [ ] Re-fire event yang sama → doc identik, bukan dobel.
- [ ] Event non-`meter-` di collection yang sama → CF diam, nol tulisan.
- [ ] `dg`/`msn` dari pendataan awal **masih utuh** setelah 3 bacaan bulanan.
- [ ] `search` `sv◼{site}⭘due◼202609` → persis titik belum dibaca September. Baca satu → **hilang** dari hasil search yang sama.
- [ ] Event `ty◼meter-point-surveyed` → doc terbentuk, `dg`/`msn`/`mc` terisi, `due` = periode **berikutnya**.
- [ ] Event `ty◼meter-reading-failed` → `pv`/`pt`/`due`/`avg`/`hs` **tidak berubah**, `mo` = `failed`.
- [ ] Bacaan 2 Sep stempel `prd◼202609` untuk titik `due◼202608` → tertutup **Agustus**, `due` → `202609`.
- [ ] Titik bolong 3 bulan (`due◼202606`) dibaca September → `due` → **`202610`**, bukan `202607`.
- [ ] Titik kelewat 1 bulan → `avg` = pemakaian per bulan, **bukan 2× lipat**.
- [ ] Satu `li` di 2 site → **2 doc `meter` terpisah**, `pv` masing-masing berdiri sendiri.
- [ ] Dua event titik sama tiba berbarengan → `hs` berisi **dua-duanya**, tidak ada yang tertimpa.
- [ ] `hs` tidak pernah >6 elemen, tiap elemen punya `prd`, `hs[0]` tertua.
- [ ] `prd`/`due` tersimpan **String** — cek di Firestore, bukan di UI.
- [ ] Satu event bacaan masuk → tepat **1 fungsi yang memproses**. `onTenantWrite` boleh menyala tapi harus early-return tanpa menulis apa pun.
- [ ] Cron jalan 2× di tanggal sama → tetap 1 doc `putaran`, `exp` tidak berubah.
- [ ] Titik bolong Agustus, cron September jalan → **masih ketemu** lewat `due◼202608`.
- [ ] Titik baru dibikin tanggal 10 → muncul di daftar, `exp` putaran berjalan **tidak berubah**.
- [ ] Rename titik di `TitikPatroli` → judul kartu di `MeterRound` **ikut berubah**.
- [ ] Event bacaan berumur >1 tahun **masih ada** di Firestore.

## 10. Asumsi & risiko

- [ ] **Siapa penegak `r`** (§2.3). Tidak ada kode Go di repo yang membacanya; TTL yang jalan cuma `xa`. Penghapusnya di luar repo — atau tidak ada sama sekali.
- [ ] **`sv` datang dari token halaman.** `MeterRound` memfilter `sv◼{site}` jadi tokennya hidup di sana — tapi jalur `MeterScan` (scanner → route) belum dipastikan membawanya. Kalau ternyata tidak, `scanner.search` bisa diarahkan ke `lk` (search = nama field), dengan catatan QR fisik isinya `li` sehingga perlu jalur lain.
- [ ] **`mst` belum ada yang men-set `removed`.** `exp` bergantung padanya, tapi belum ada layar yang menonaktifkan titik. Sampai ada, semua doc `active` selamanya dan `exp` cuma naik.
- [ ] **Bulan yang bolong hilang permanen** (§5.4 cabang 3). Itu keputusan sadar, bukan bug — tapi kokpit harus menampilkannya, kalau tidak kerugiannya tidak terlihat siapa pun.
- [ ] **Tunggakan >1 bulan** = beberapa seksi daftar. Titik bolong 3 bulan berturut = 3 seksi; kokpit yang harus mengeskalasi lewat selisih `exp`, bukan daftar petugas yang memanjang.
- [ ] **`prd` masih dari tanggal HP** — dampaknya dinetralkan §5.4, tapi kalau suatu saat `due` hilang/reset, stempel HP jadi satu-satunya sumber periode lagi.

---

**Referensi:** `docs/digit-pad-widget-dev-spec.md` · `docs/meter-data-cf-REVIEW.md` (ronde 1–3) · `docs/handoff-meter-pascal.md` · `docs/titik-patroli-app-first-location-dev-spec.md` · `cloud-function` @ `e19f331` (`deploy.sh`, `internal/location/location.go:44-52`, `internal/fate/fate.go:55,190`, `function.go:31`) · `docs/addToEvent-flutter-dev-spec.md:98-110`.
