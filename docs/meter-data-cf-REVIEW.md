# Review — `meter-data-cf-dev-spec.md`

**Reviewer:** CF session (grounded ke repo `cloud-function`, branch `event-push` @ `e19f331`, + docs `widget-claude/docs`)
**Tanggal:** 2026-08-19
**Status:** OPEN — belum ada kode, semua temuan masih bisa diberesin di level spec
**Buat:** penulis `meter-data-cf-dev-spec.md`

**Verdict:** Rancangan intinya **benar dan pintar**. `due` sebagai "periode yang masih ditunggu" (§2.2) itu jawaban tepat buat `search` cocok-persis — titik terbaca hilang sendiri dari daftar tanpa butuh kemampuan query baru. Putaran-sebagai-cron (§2.1) dan `exp` yang dibekukan juga argumennya kuat dan tahan audit.

Masalahnya **bukan di desain, tapi di grounding**: 3 kode field ditulis dengan asumsi "sudah ada / belum bentrok" yang ternyata salah kalau dicek ke kode live, dan 1 keputusan doc-id yang permanen dibuat di atas id yang memang tidak unik. Ditambah 4 gap hitung/infra.

**7 dari 11 temuan cuma ganti kata di spec** — nol biaya kalau dibenerin sebelum dev Go mulai, mahal kalau ketahuan setelah CF jalan.

| Tingkat | Temuan |
|---|---|
| 🔴 Blocker | A `et` bukan taksonomi · B doc-id `li` tabrakan · C nama field bentrok |
| 🟠 Salah hitung | D gate nolak survey · E `pu` pembagi salah · F cron bakar tunggakan · G `prd` HP |
| 🟡 Gap infra | H trigger ke-3 · I cron belum ada polanya · J `exp` tak terhitung · K index |
| ✅ Kejawab | L satuan `r` — ketemu di docs, tidak perlu nunggu dev |

---

## A. 🔴 `et` BUKAN nama taksonomi — `et` = event time (epoch ms)

Spec §3.1 nulis:

| Field | Isi | Status |
|---|---|---|
| `et` | nama taksonomi event | **sudah ada** |

Grounded, `et` memang "sudah ada" — **tapi artinya lain**:

```
addToEvent-flutter-dev-spec.md:101   | `et` | Event time (epoch ms) — Event tab col A | auto client-side
addToEvent-flutter-dev-spec.md:110   | `ty` | Event type (report-incident, attendance-check-in)
patroli-cleaning-MASTER-handoff.md:254   `et` event time(A) · `ev` event ref(C) · `ld` ledger ref(D)
cloud-function/function.go:31            fieldTy = "ty" // event/report type
```

Kalau ditulis apa adanya: `et` keisi string `"meter-reading-recorded"` di tempat yang seharusnya epoch → **kolom A tab Event rusak**, dan semua konsumen `et` (timeline, `timelinePeriodic`@196 yang justru mau dipakai §2.5) ikut salah baca. Gate §5 juga jadi gate ke field yang salah → CF tidak akan pernah menyala.

Taksonomi event di sistem ini tinggal di **`ty`**. Nilai existing (`report-incident`, `attendance-check-in`) polanya sama dengan yang diusulkan spec.

**Patch — 4 tempat:**

| Lokasi | Dari | Jadi |
|---|---|---|
| §3.1 baris terakhir tabel | `et` \| nama taksonomi | **`ty`** \| nama taksonomi |
| §4 addToEvent resolved | `⭘et◼meter-reading-recorded⭘` | `⭘ty◼meter-reading-recorded⭘` |
| §5 Gate | "`et` diawali `meter-reading`" | "`ty` diawali `meter-`" (lihat §D) |
| §5.6 | "`et` = `meter-point-surveyed`" | "`ty` = `meter-point-surveyed`" |

String §4 yang benar:

```
84214220504259//event⭘r◼[LIHAT §L]⭘tablevid◼20342033315492⭘ty◼meter-reading-recorded⭘lq◼◁1▷⭘prd◼◀2|T7|yyyyMM▶⭘sd◼◁7▷⭘i◼◁4▷⭘d◼◁8▷⭘cv◼{userVid}⭘cn◼{userName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm▶
```

---

## B. 🔴 Doc-id `meter` = `li` → dua site berbagi satu doc

Spec §3.2: "Doc-id = `li` (deterministik, idempoten)". §10 nyebut risikonya tapi menurunkannya jadi "`search li◼…` balik >1 doc" + "buat Paskal (1 site) aman".

**Salah kelas.** `search` balik >1 doc itu gangguan tampilan; doc-id kembar itu **korupsi data, dan permanen**. Kode `location` sendiri yang menjelaskan kenapa:

```go
// cloud-function/internal/location/location.go:50-52
fieldLi = "li"  // location: LQR id ("0l" + 40 hex) — CF-generated, QR encodes it verbatim
fieldLk = "lk"  // location: unique row key "{li}-{sv}" (= doc id) — li alone is shared
                // across a titik's sites, and the app's keyed search takes ONE field◼value
                // pair, so detail pages route+load on lk
fieldSv = "sv"  // site vid
```

`lk` **dibikin persis untuk masalah ini**. Kalau `meter` pakai `li` sebagai doc-id, satu meter yang kedaftar di 2 site → satu doc → `pv` timpa-timpaan → dua tagihan ngambil angka yang sama. Dan karena "Paskal 1 site" itu kondisi hari ini, bukan kontrak, cacatnya baru meledak di tenant kedua — waktu datanya sudah setahun.

**Patch:**

| §3.2 | Dari | Jadi |
|---|---|---|
| Doc-id | `li` | **`lk`** (= `{li}-{sv}`, konsisten dengan `location`) |
| Field | `li` FK | `lk` (PK) + `li` (FK, tetap simpan buat hasil scan QR) |

Dampak ke §4 tabel "dua bacaan yang dipakai halaman":

| Halaman | search lama | search benar |
|---|---|---|
| `MeterRound` | `sv◼{site}⭘due◼202609` | *(tetap)* |
| `MeterRead` | `li◼{li}` | `lk◼{lk}` — atau `li◼{li}⭘sv◼{site}` kalau yang dibawa dari scan cuma `li` |

Dua-duanya tetap **satu hop**, jadi tidak ada ongkos.

---

## C. 🔴 Nama field bentrok — spec-vs-spec, dan lawan kode live

### C.1 Dua spec, dua nama, satu collection

`digit-pad-widget-dev-spec.md` (konsumen data ini) dan spec ini menyebut collection `meter` yang sama dengan kode berbeda:

| Isi | digit-pad spec | meter-data spec | Akibat kalau dibiarkan |
|---|---|---|---|
| jumlah digit | `dg` (:48) | `dg` (§3.2) | ✅ sama |
| bacaan terakhir | `pv` (:50) | `pv` (§3.2) | ✅ sama |
| rata-rata pakai | **`avg`** (:175) | **`pu`** (§3.2) | 🔴 DIGIT_PAD baca `avg`, CF nulis `pu` → **null diam, bukan error** |
| nomor seri | **`msn`** (:202) | **`mn`** (§3.2) | 🔴 idem |

Ini kelas bug paling jahat: tidak ada yang crash, widget cuma "nol banding, nol vonis" (perilaku sah menurut digit-pad §180) — jadi kelihatan **jalan normal** padahal ambang lonjakan mati total.

### C.2 `mn` memang sudah kepakai

```go
// cloud-function/internal/fate/fate.go:55
fieldMn = "mn"  // model name array (project)
```
Plus `fate-schema-dev-spec.md:45` (`pv`/`mn` = project vid / nama model) dan `fate-flutter-multiselect-dev-spec.md:103`.

digit-pad spec **sudah benar** milih `msn` dan sudah nulis alasannya (:202 — `sn` = site name, jangan dipakai). Spec ini mundur ke `mn` yang justru bentrok.

### C.3 `dl` bentrok — delta custody

Spec §3.2b pakai `dl` = tenggat (deadline). §3.3 nandain "belum dicek". Hasil ceknya:

```
driver-runtime-field-dictionary.md:124   dp[]: ii · cd · ex expected · ac actual · dl delta
driver-custody-p7p8p9-dev-spec.md:32     grid Warehouse(ie) | Lo Hitung(ip) | Selisih(dl)
```

`dl` = **selisih/delta**, dan dipakai di layar yang dilihat driver tiap hari. Ganti (`dld`, `dln`, atau apa pun yang lolos dict book).

### C.4 Catatan `pv` dan `li`

`pv` juga = project vid di fate, `li` juga = nota sale-line array (`walkin_nota_trigger.go:29`). **Ini tidak perlu diganti** — sistem ini memang mengizinkan kode yang sama beda arti di collection berbeda (`ty` saja sudah 3 arti: event type, location subtype, approval discriminator — semuanya berkomentar eksplisit di kode). Bedanya: itu harus **dicatat sadar di dict book**, bukan lewat sebagai "belum ketemu bentrok". §3.3 sebaiknya berubah dari klaim jadi daftar keputusan.

---

## D. 🟠 Gate §5 menolak event yang justru dipegang §5.6

§5 Gate: `et`(→`ty`) **diawali `meter-reading`** DAN `sd` terisi.
§5 langkah 6: kalau `ty` = **`meter-point-surveyed`** → set `mc` + `due`.

`meter-point-surveyed` tidak diawali `meter-reading` → **tersaring keluar sebelum sampai langkah 6**. Pendataan awal tidak akan pernah bikin doc `meter`, jadi bacaan bulanan pertama masuk tanpa `dg`/`mn` — persis yang §3.2 bilang harus datang dari pendataan awal.

**Patch §5 Gate:**
```
ty diawali "meter-"  DAN  ( sd terisi  ATAU  ty == "meter-point-surveyed" )
```

**Efek samping yang belum ditulis:** `meter-reading-failed` tidak punya `sd` → tersaring → `due` tidak naik → titik tetap di daftar. Itu **benar** (memang belum terbaca). Tapi konsekuensinya "meteran rusak / gembok / anjing" jadi **tidak bisa dibedakan dari "belum dikunjungi"** lewat `search` — padahal dua-duanya butuh tindakan berbeda dari kokpit. Satu field hasil-terakhir di doc `meter` (mis. `mo` = last outcome, diisi juga saat failed) menutup ini dengan satu tulisan.

---

## E. 🟠 `pu` dibagi jumlah bacaan, bukan rentang bulan

§5.5: `(sd - stand terlama dalam N bacaan terakhir) / (jumlah selang)`.

Titik yang kelewat Agustus lalu dibaca September: pemakaian **2 bulan** dibagi **1 selang** → `pu` jadi 2× lipat. Karena `pu` yang jadi dasar ambang lonjakan (§8 "v1 dari `pu` × `spikeMultiplier`"), bulan berikutnya lonjakan sungguhan **lolos diam-diam**. Titik yang paling sering bolong = titik yang paling longgar diawasi — kebalikan dari yang diinginkan.

**Patch:** pembaginya jarak periode, bukan cacah bacaan.
```
pu = (sd − sd_terlama) / (bulan(prd_sekarang) − bulan(prd_terlama))
```

---

## F. 🟠 Cron langkah 4 membakar bukti tunggakan

§5b langkah 4 menaikkan `due` semua titik yang masih tertinggal, supaya titik yang kelewat bulan lalu tetap muncul di daftar. Tujuannya benar. Caranya menghapus satu-satunya jejak yang bisa di-`search`.

Setelah `due` 202608 → 202609, pertanyaan **"titik mana yang bolong Agustus"** tidak bisa dijawab lagi — karena jawabannya berupa *ketiadaan event*, dan §2.2 sendiri sudah membuktikan ketiadaan tidak bisa diungkapkan `search`. Yang hilang persis informasi yang paling dibutuhkan handoff #4 (satu unit kelewat → tagihannya tidak bisa terbit).

**Patch — buang langkah 4, ganti jadi 2 seksi daftar.** Nol field baru, dua-duanya tetap cocok-persis:

```
"Tertunggak Agustus"       sv◼{site}⭘due◼202608
"Belum dibaca September"   sv◼{site}⭘due◼202609
```

Tunggakan jadi berisik dan berumur, bukan dilebur diam-diam ke bulan berjalan. Preseden pola ini sudah ada di builder: `AdminTaskList` = 4 `LIST_CARD` terpisah karena eq-DSL tidak punya OR.

> Kalau tunggakan bisa lebih dari 1 bulan, itu bukan urusan daftar petugas — itu eskalasi kokpit. Selisih `exp` vs terbaca di doc `putaran` sudah cukup jadi pemicunya.

---

## G. 🟠 `prd` dari tanggal HP — obatnya lebih murah dari yang ditulis

§10 bullet 1 sudah menandai ini sebagai "lubang paling mungkin bikin daftar kotor di bulan ke-2", lalu menggantung: "`prd` sebaiknya dipilih petugas / diturunkan dari putaran yang `open` — belum diputuskan."

Dua-duanya lebih mahal dari yang perlu. Doc `meter` **sudah menyimpan periode yang titik itu utang** (`due`). Jadi CF tidak perlu percaya stempel HP sama sekali:

```
closed  = min(event.prd, meter.due)      // tutup yang diutang, bukan yang distempel
new due = closed + 1 bulan
```

Bacaan 2 September untuk Agustus → `min(202609, 202608)` = Agustus ditutup, `due` → 202609, September tetap ditagih. Bacaan normal → `min` = periode berjalan, perilaku tidak berubah. Satu baris, dan §10 bullet 1 hilang seluruhnya — tanpa memindahkan beban ke petugas atau ke putaran.

---

## H. 🟡 `onMeterReadingWrite` = trigger KE-3 di path yang sama

`deploy.sh` sudah punya dua fungsi yang menyala di `event`:

```bash
onEventCreated)  ... created  "MobileTable/{db}/tables/{tid}/event/{eid}"
onTenantWrite)   ... written  "MobileTable/{db}/tables/{tid}/{coll}/{docId}"   # {coll} wildcard
```

Menambah trigger ketiga di path yang sama = pola yang repo ini **sudah kena dua kali**, dan komentar peringatannya masih menempel:

```bash
# deploy.sh:33-35  SUPERSEDES onTaskRejected + onTaskCompleted — after this is live,
#                  delete the old two or all three fire on every task write
# deploy.sh:42-45  RENAMED from onFateWrite — delete it after onTenantWrite is live,
#                  or BOTH will process every event
```

Kebiasaan rumah = **fold ke dispatcher yang sudah ada**, bukan tambah trigger. `onEventCreated` rumah paling wajar (created-only, sudah bergaya gate-by-field: `ntf` untuk push → tambah cabang `ty` prefix `meter-`).

**Jebakan turunan:** `onTenantWrite` wildcard `{coll}` akan menyala di doc `meter` dan `putaran` yang **CF sendiri tulis**. Perlu early-return eksplisit untuk dua collection baru itu, kalau tidak jadi loop / invocation liar.

---

## I. 🟡 Cron belum punya pola di repo ini, dan tidak tahu daftar tenant

`openMeterPeriod` (§5b) akan jadi **fungsi terjadwal pertama**. 9 fungsi existing: 8 Firestore-trigger + 1 HTTP. Tidak ada Eventarc-schedule, tidak ada Pub/Sub.

Pola termurah = tiru `reconcileAssetCache` persis:
```bash
gcloud functions deploy openMeterPeriod --gen2 --runtime=go124 --region=$REGION --source=. \
  --entry-point=OpenMeterPeriod --trigger-http --no-allow-unauthenticated
```
+ Cloud Scheduler job (OIDC) tanggal 1 jam 00:05 WIB → **kerjaan devops, di luar repo**.

**Yang belum kejawab:** `reconcileAssetCache` menerima `db` + `tid` dari body HTTP — ada manusia yang menyuruh. Cron tidak. **Belum ada registry tenant** di repo ini, jadi "untuk tiap site yang punya titik meter" (§5b.1) belum punya titik awal. Perlu diputuskan: daftar tenant di env var, di satu doc config, atau cron dipanggil per-tenant dari Scheduler (N job).

---

## J. 🟡 `exp` belum bisa dihitung, dan `pst` tidak pernah ditutup

**J.1** §5b.2: `exp` = "jumlah doc `meter` **aktif** di site itu". Doc `meter` (§3.2) **tidak punya field status** — 10 field, tidak satu pun menandai aktif/nonaktif. `lst` ada di `location`, bukan di `meter`. Jadi "aktif" belum terdefinisi, dan `exp` — satu-satunya alasan doc `putaran` ada (§3.2b) — belum bisa dihitung.

Pilihan: tambah `mst` di `meter`, atau `exp` dihitung dari `location` (`sv` + `lst◼active` + penanda punya-meter). Yang kedua sekaligus menjawab §10 bullet 3 ("cron butuh daftar site yang punya meter") — dan kekhawatiran "gagal di bulan pertama" tidak berlaku, karena pendataan awal (§5.6) sudah membuat doc `meter` sebelum siklus tagihan pertama.

**J.2** §3.2b `pst`: `open` → `locked`, dikunci kokpit. Cron membuka September tapi **tidak pernah menutup Agustus**. Kalau Agustus belum sempat dikunci manusia, `search pst◼open` mengembalikan 2 doc. Perlu ditetapkan: cron ikut mengunci periode sebelumnya, atau setiap pembaca `putaran` wajib membawa `prd`.

---

## K. 🟡 Index tidak masuk deliverable — dan `pu` bisa tanpa query

Belum tercatat di §6:
- `meter`: composite `sv` + `due` (dipakai `MeterRound`, §4).
- `event`: `lq` + `t desc` — **kepaksa ada**, karena §5.5 butuh N bacaan terakhir sementara doc `meter` cuma menyimpan `pv`. Artinya CF query ledger event **tiap bacaan masuk**.

Yang kedua bisa dihapus seluruhnya: simpan **6 stand terakhir** sebagai array di doc `meter` (mis. `hs:[1189,1201,1230,1268]`). Nol query, nol index, 6 angka. Ledger event tetap SSOT — `hs` cuma cache hitung, dan kalau hilang bisa dibangun ulang dari ledger. Guard urutan §5.2 sudah menjamin isinya tidak pernah mundur.

---

## L. ✅ Satuan `r` — tidak perlu nunggu dev, jawabannya ada di docs

§2 dan §10 menahan nilai retensi sampai satuan dipastikan. Grounded, dokumennya sudah menjawab:

```
addToEvent-flutter-dev-spec.md:98         | `r` | Retention minutes (e.g. 4320 = 72h)
driver-runtime-firestore-structure.md:42  | `r` | retention (minutes, e.g. 4320)
patroli-cleaning-MASTER-handoff.md:254      `r` retention(menit, REQ)
standard-page-event-pattern.md:43         | Berapa HARI data disimpan | 4320 |   ← sendirian, beda
```

**3 lawan 1: menit.** Jadi `4320` = **72 jam = 3 hari** — jauh lebih buruk dari dugaan terburuk di §2 (180 hari). Buat bacaan meter yang jadi dasar tagihan, itu total.

**Tapi:** tidak ada satu pun kode Go di `cloud-function` yang **membaca** `r` — hanya `fate.go:190` yang menulisnya sebagai literal. Satu-satunya TTL yang benar-benar jalan di repo ini adalah `xa` (`internal/movement/movement.go:50`, Firestore TTL policy). Jadi penegak `r` ada di luar repo ini (backend mobile / Apps Script).

**Rekomendasi tetap seperti §2 urutan (1): hilangkan `r` untuk event bacaan meter.** Kalau wajib ada, isi setara ≥10 tahun **dalam menit** (`5256000`), dan **jangan** salin `4320`. Sebelum dipatok, satu orang perlu memastikan siapa yang benar-benar menghapus berdasarkan `r` — kalau ternyata tidak ada, seluruh kekhawatiran §2 gugur dan `r` cuma dekorasi.

---

## M. Yang sudah benar — jangan diutak-atik saat revisi

- **`due` sebagai penanda** (§2.2). Solusi tepat untuk `search` cocok-persis; "terbaca → hilang dari daftar" jadi gratis, tanpa kemampuan query baru.
- **`due` dihitung dari `prd`, bukan tanggal sekarang** (§5.4). Instingnya sudah benar — §G cuma mempertajam.
- **Guard mundur-waktu** (§5.2). Wajib untuk offline-first, dan paling sering dilupakan orang.
- **`pu` kosong (bukan 0) kalau bacaan < 2** (§5.5). Nol bikin ambang jadi nol dan semua bacaan kena tandai. Alasannya sudah ditulis di spec — bagus.
- **Putaran = cron, bukan tombol** (§2.1) + **`exp` dibekukan** (§3.2b). Argumennya kuat dan tahan audit; §2.1 juga sudah benar menolak revisi versi pertama sendiri.
- **§8 Not Doing.** Batas NEVER §8 dijaga eksplisit, termasuk sinyal kebocorannya ("kalau nanti ada field `assignee` di sini…"). Ini bagian terbaik dari spec.
- **§9 Acceptance** padat dan sebagian besar bisa langsung dites.

---

## N. Daftar patch

| # | Patch | Lokasi spec | Biaya |
|---|---|---|---|
| 1 | `et` → **`ty`** | §3.1, §4, §5 gate, §5.6, §6.5 | ganti kata |
| 2 | Doc-id `meter` = **`lk`**, `li` tetap disimpan sebagai FK | §3.2, §4 tabel search | ganti kata |
| 3 | Samakan dengan digit-pad: **`msn`** (bukan `mn`), pilih satu **`avg` / `pu`** lalu ubah spec yang kalah | §3.2 + `digit-pad-widget-dev-spec.md` | edit 2 doc |
| 4 | `dl` → kode lain (bentrok delta custody) | §3.2b, §3.3 | ganti kata |
| 5 | Gate terima `meter-point-surveyed` | §5 gate | 1 kondisi |
| 6 | `closed = min(prd, due)` | §5.4 — **menghapus §10 bullet 1** | 1 baris |
| 7 | `pu` dibagi rentang bulan | §5.5 | 1 baris |
| 8 | Buang cron langkah 4 → daftar 2 seksi | §5b.4, §4 tabel | hapus kode |
| 9 | Fold ke `onEventCreated`; early-return `meter`/`putaran` di `onTenantWrite` | §5 judul, §6.1 | pilihan arsitektur |
| 10 | `hs[6]` di doc `meter` menggantikan query ledger | §3.2, §5.5, §6 | hemat 1 index |
| 11 | Putuskan: flag aktif `meter`, registry tenant cron, pola scheduler HTTP+OIDC | §3.2, §5b, §6 | **perlu keputusan** |
| 12 | §3.3 diubah dari "belum ketemu bentrok" jadi daftar keputusan sadar | §3.3 | tulis ulang tabel |

**1–8 semuanya edit spec, belum menyentuh kode.** Sekarang momen paling murah.

---

## O. Acceptance tambahan (usul untuk §9)

- [ ] Event `ty◼meter-point-surveyed` → doc `meter` **terbentuk**, `dg`/`mn`/`mc` terisi, `due` = periode berjalan. *(menutup §D — gate lama gagal di sini)*
- [ ] Event `ty◼meter-reading-failed` → `pv`/`pt`/`due` **tidak berubah**, tapi kokpit tetap bisa membedakannya dari titik yang belum dikunjungi.
- [ ] Titik bolong Agustus, cron September jalan → **masih bisa di-`search`** sebagai tunggakan Agustus, bukan melebur jadi "belum dibaca September". *(menutup §F)*
- [ ] Bacaan 2 September stempel `prd◼202609` untuk titik yang `due◼202608` → yang tertutup **Agustus**, `due` jadi `202609`. *(menutup §G)*
- [ ] Titik kelewat 1 bulan lalu dibaca → `pu` = pemakaian **per bulan**, bukan 2× lipat. *(menutup §E)*
- [ ] Satu `li` terdaftar di 2 site → **2 doc `meter` terpisah**, `pv` masing-masing berdiri sendiri. *(menutup §B)*
- [ ] Satu event bacaan masuk → hitung berapa Cloud Function yang menyala. Harus **1**, bukan 3. *(menutup §H)*

---

# Ronde 2 — atas spec v2 (2026-08-19)

**Verdict:** 11/11 temuan diserap, dan patch-nya rapi — tiap perubahan dikasih kotak alasan, jadi orang yang baca spec setahun lagi tahu kenapa `et` bukan `ty` tanpa harus nemu review ini. **3 hal yang penulis tambahin sendiri di luar yang diminta, dan ketiganya lebih baik dari usul gue** (lihat §R2-M).

Sisanya: **2 regresi baru** yang lahir justru dari fix-nya — satu di antaranya salah gue di ronde 1 — plus 1 kontradiksi lama yang kebawa, dan rename yang bocor di 8 tempat.

---

## R2-A. 🔴 `sv` tidak ada di event — `lk` tidak bisa dibentuk

Regresi langsung dari fix doc-id (`li` → `lk`).

§5 langkah 1: *"Baca doc `meter` id `lk` (= `{lq}-{sv}`)"*.
§3.1 tabel field event: `lq` `prd` `sd` `i` `d` `mc` `cv` `cn` `t` `ts` `ty` — **tidak ada `sv`**.
§4 string `addToEvent` (baris 174): juga tidak menulis `sv`.

Jadi CF menerima event yang cuma tahu `lq` (= `li`), lalu harus menebak site-nya. Cara satu-satunya = lookup `location` by `li` — dan itu balik **N doc**, persis kenapa `lk` ada. Fix doc-id-nya benar, tapi bahan bakunya belum sampai ke CF.

**Fix — 1 token.** App sudah tahu site-nya: `MeterRound` memfilter `sv◼{site}`, jadi tokennya sudah hidup di halaman itu.

```
…⭘ty◼meter-reading-recorded⭘lq◼◁1▷⭘sv◼{site}⭘prd◼…
```

Alternatif: `scanner` mengembalikan `lk` langsung (`search` = nama field, jadi bisa diarahkan ke `lk`) — tapi QR fisik isinya `li`, jadi jalur `sv` dari halaman lebih murah.

Perlu ditambahkan ke **§3.1** (baris tabel), **§4** (string), dan **§10** (menggantikan bullet 6 yang sekarang basi, lihat R2-H).

---

## R2-B. 🔴 `hs` tidak menyimpan periode — rumus `avg` §5.5 tidak bisa dihitung

**Ini salah gue di ronde 1.** §K cuma bilang "simpan 6 stand terakhir", dan spec v2 menuruti apa adanya:

```json
"hs":[1120,1157,1194,1231,1268]
```

Tapi rumusnya (§5 langkah 5):
```
avg = (sd − hs[0]) / ( bulan(prd_sekarang) − bulan(prd_terlama) )
```

**`prd_terlama` tidak ada di mana pun.** `hs` cuma angka; periode tiap elemen hilang. Jadi pembagi yang justru jadi inti fix R1-E tidak punya sumber data.

**Fix — `hs` simpan pasangan:**
```json
"hs":[{"prd":"202604","sd":1120},{"prd":"202605","sd":1157},{"prd":"202608","sd":1268}]
```
atau dua array paralel `hs` + `hp` kalau array-of-map dihindari. Yang penting: **periode ikut, dan periode yang disimpan = periode yang DITUTUP (`closed`), bukan `event.prd`** — supaya konsisten dengan langkah 4.

Sekalian ditetapkan di §5.5: `hs[0]` = **tertua**, push di ekor, buang dari kepala.

---

## R2-C. 🟠 `min(prd, due)` nyangkut kalau titik bolong lebih dari 1 bulan

Ronde 1 §G cuma gue uji di kasus telat-sync 1 bulan. Kasus gap panjang belum:

| | `due` | `event.prd` | `closed` | `due` baru |
|---|---|---|---|---|
| telat sync 1 bulan | 202608 | 202609 | 202608 | 202609 ✅ |
| bolong 3 bulan | 202606 | 202609 | 202606 | **202607** ❌ |

Baris kedua: satu bacaan September menutup **Juni**. Bulan depan nutup Juli, bulan depannya Agustus — `due` **ketinggalan permanen 3 bulan**, dan titiknya nongol terus di seksi tunggakan padahal petugas membacanya tiap bulan. Kokpit melihat masalah yang sudah tidak ada.

Akarnya: stand Juli dan Agustus **tidak bisa diciptakan ulang**. Satu kunjungan cuma menghasilkan satu angka. Jadi memperlakukan bacaan September sebagai "bacaan Juni yang telat" itu fiksi.

**Fix — bedakan telat-sync dari bolong:**
```
closed = (event.prd − due == 1) ? due : event.prd
due    = closed + 1
```
Gap tepat 1 = jendela sync telat (realistis: beberapa hari pertama bulan baru) → tutup yang diutang.
Gap ≥ 2 = titik memang bolong → bacaan ini milik periode berjalan, bulan yang kelewat **hilang permanen** dan `due` melompat. Itu jujur: yang hilang memang hilang, dan `putaran.exp` vs jumlah terbaca yang mencatat kerugiannya.

---

## R2-D. 🟠 §5 langkah 6 (survey) bertentangan dengan kalimatnya sendiri

> "`ty` = `meter-point-surveyed` → set juga `mc`, dan `due` = periode **berjalan** (pendataan awal menutup periodenya sendiri — handoff #24)"

Kalau `due` = periode berjalan, titik itu **masih muncul** di `search due◼{periode berjalan}` = "belum dibaca bulan ini". Artinya periodenya **tidak** tertutup — kebalikan dari yang kalimat kurungnya klaim.

Pendataan awal punya `sd` (MeterSurvey memakai `DIGIT_PAD` juga), jadi gate lolos dan langkah 3–5 sudah jalan normal. Langkah 4 sudah menghasilkan `due` = periode berikutnya, yang **sudah benar**.

**Fix:** langkah 6 tidak usah menyentuh `due` sama sekali — cukup `set mc`. Kalimat "pendataan ADALAH pembacaan" justru terpenuhi dengan membiarkan langkah 4 bekerja.

---

## R2-E. 🟠 `due` kosong di doc baru → `min()` tidak terdefinisi

§5 langkah 1 membuat doc `meter` baru; langkah 4 langsung `min(event.prd, meter.due)` — dan `due` masih kosong. Perlu satu kalimat eksplisit, kalau tidak tiap dev menebak sendiri (nil→0 bikin `closed` = 0 dan `due` = bulan tahun 0):

```
due kosong (doc baru)  →  closed = event.prd
```

---

## R2-F. 🟡 §9 masih menyuruh dev bikin cron langkah 4 yang sudah dihapus

Baris 345:
> "Titik yang tidak terbaca bulan lalu → **masih muncul** di daftar bulan ini (**cron langkah 4**), bukan hilang diam-diam."

Dua masalah: (a) "cron langkah 4" sudah **dibuang** di §5b — dev yang baca §9 tanpa §5b akan mengimplementasikannya; (b) kriterianya sendiri sekarang **salah** — titik bolong justru **tidak** muncul di daftar bulan berjalan, dia di seksi tunggakan terpisah.

Baris 350 sudah menyatakan perilaku yang benar. **Hapus baris 345.**

---

## R2-G. 🟡 Rename bocor di 8 tempat

Tabel field-nya sudah v2, tapi teks di sekitarnya masih v1. Yang paling berbahaya baris 195 dan 339 — dev bisa sampai di sana tanpa pernah membaca §3.2.

| Baris | Sekarang | Harusnya |
|---|---|---|
| **195** | `"dl":1788800000000` (JSON `putaran` §4) | **`dln`** — `dl` sudah resmi dibuang di §3.2b |
| **143** | "`dg` dan `mn` ditulis app" | **`msn`** — dan catatannya nyasar: ada di §3.2b (`putaran`) padahal membahas field `meter` |
| **248** | "tidak menyentuh `dg`/`mn`" | `msn` |
| **329** | "v1 dari `pu` × `spikeMultiplier`" | `avg` |
| **330** | "kecuali `dg`/`mn` di pendataan awal" | `msn` |
| **334** | "`pu` **kosong** (bukan 0)" | `avg` |
| **335** | "`pu` keisi, nilainya = selisih dua bacaan" | `avg` — sekaligus perlu diperbaiki: setelah R1-E nilainya **per bulan**, bukan "selisih dua bacaan" |
| **339** | "`dg`/`mn` yang ditulis pendataan awal masih utuh" | `msn` |

---

## R2-H. 🟡 §10 bullet 6 sudah basi

> "**`li` sama lintas site** … Buat Paskal (1 site) aman — tapi CF langkah 1 harus ambil `sv` dari doc pertama secara deterministik, bukan asal."

Doc-id sudah `lk`, jadi risiko yang dibahas bullet ini sudah hilang. Dan "ambil `sv` dari doc pertama" sekarang justru **berbahaya** — doc pertama = site sembarang = `lk` salah = doc `meter` salah.

**Ganti** dengan pertanyaan yang benar-benar terbuka: dari mana `sv` datang (R2-A).

---

## R2-I. 🟡 Dua index kurang di §6.8

§6.8 sudah menyebut `meter` `sv`+`due` ✓. Yang belum:

- `meter` **`sv` + `mst`** — §5b.2 `count(meter where sv◼{sv} ⭘ mst◼active)`.
- `putaran` **`sv` + `pst`** — §5b.4 "periode sebelumnya yang masih `open` → `closed`".

---

## R2-M. Yang penulis tambahin sendiri, dan lebih baik dari usul gue

Perlu dicatat supaya tidak ikut kegeser waktu revisi berikutnya:

- **`pst` 3-state `open` → `closed` → `locked`** (§3.2b). Ronde 1 cuma nunjuk masalahnya ("`pst◼open` balik 2 doc"). Solusinya memisahkan **mekanis** (periode lewat, cron) dari **keputusan** (angka final, manusia) — itu pembedaan yang benar dan gue tidak kepikiran.
- **`mo` = `read` / `failed`** (§3.2, §5.7). Ronde 1 cuma bilang "butuh 1 field hasil-terakhir". Penulis kasih nama, nilai, langkah CF-nya, dan acceptance-nya.
- **`mst` = `active` / `removed`** (§3.2, §5b.2). Menutup gap `exp` yang ronde 1 cuma bisa bilang "belum terdefinisi" — plus **jujur menulis risikonya sendiri** di §10 (belum ada layar yang men-set `removed`, jadi `exp` cuma bisa naik). Spec yang menandai lubangnya sendiri lebih berguna daripada spec yang rapi.
- **§3.3 jadi "daftar keputusan sadar"** — persis yang diminta, termasuk `pv`/`li` dicatat sebagai pemakaian-ulang sengaja, bukan disembunyikan.
- **§5b.1 memilih "1 Scheduler job per tenant"** + menyebut kapan pindah ke registry ("baru sepadan kalau tenant sudah puluhan"). Ronde 1 cuma menyodorkan pilihan; penulis yang memutuskan.

---

## R2-N. Patch ronde 2

| # | Patch | Lokasi | Biaya |
|---|---|---|---|
| 1 | Tambah **`sv`** ke event | §3.1 tabel, §4 string, §10 | 1 token |
| 2 | **`hs` simpan pasangan** `{prd, sd}` + tetapkan `hs[0]` = tertua | §3.2, §4 JSON, §5.5 | ubah bentuk |
| 3 | `closed = (prd − due == 1) ? due : prd` | §5.4 | 1 baris |
| 4 | Langkah 6 (survey) **tidak menyentuh `due`** | §5.6 | hapus klausa |
| 5 | `due` kosong → `closed = event.prd` | §5.4 | 1 kalimat |
| 6 | Hapus acceptance baris 345 (cron langkah 4) | §9 | hapus baris |
| 7 | Rename bocor 8 tempat | §3.2b, §4, §5, §8, §9 | cari-ganti |
| 8 | Ganti §10 bullet 6 → pertanyaan sumber `sv` | §10 | tulis ulang |
| 9 | +2 index (`sv`+`mst`, `sv`+`pst`) | §6.8 | 2 baris |

**1–2 blocker** (CF tidak bisa ditulis tanpa keduanya). **3–5 keputusan**, masing-masing 1 baris. **6–9 kebersihan.**

Tidak ada yang menyentuh rancangan intinya — `due`, dua seksi, `lk`, `ty`, fold ke `onEventCreated` semuanya berdiri.

---

# Ronde 3 — pass ulang atas spec v2

Spec masih v2 (patch ronde 2 belum diterapkan). Pass ini menyisir sudut yang dua ronde sebelumnya belum sentuh: **tipe data, konkurensi, sinkronisasi ke spec widget, dan denorm yang basi.** 6 temuan, 1 blocker.

---

## R3-A. 🔴 Gate v2 masih menolak `meter-reading-failed`

Kelas bug yang **persis sama** dengan yang baru dibenerin buat survey — cuma pindah cabang.

Gate v2 (§5):
```
ty diawali "meter-"   DAN   ( sd terisi   ATAU   ty == "meter-point-surveyed" )
```

§5 langkah 7 (**baru di v2**):
> "`ty` = `meter-reading-failed` (**tidak ada `sd`**) → hanya set `mo` = `failed`."

Telusuri: `meter-reading-failed` → prefix ✓ · `sd` kosong ✗ · bukan `meter-point-surveyed` ✗ → **gate gagal, CF tidak jalan, `mo` tidak pernah keisi.** Langkah 7 tidak akan pernah tercapai, dan `mo` — yang justru dibikin supaya kokpit bisa membedakan "meteran kegembok" dari "belum dikunjungi" — mati diam.

Gate v1 gagal karena mendaftar kondisi yang boleh lewat; gate v2 mengulangi polanya, cuma nambah satu pengecualian. Selama gate memakai daftar-putih, tiap `ty` baru harus ingat mengubah gate.

**Fix — gate cukup prefix, cabang di dalam:**
```
gate:  ty diawali "meter-"
```
Lalu langkah 3 yang menuntut `sd`, langkah 6 menangani survey, langkah 7 menangani failed. Event `meter-*` lain di masa depan (mis. `meter-point-deactivated` buat `mst`) tinggal jadi cabang baru, tidak menyentuh gate.

---

## R3-B. 🟠 Tipe `prd` dan `due` belum dipatok — sistem ini punya sejarahnya

§3.1 mematok `sd` = **Number** ✓. `prd` dan `due` **diam** — padahal `due` satu-satunya field yang **di-`search`**, dan `prd` dipakai aritmetika bulan (§5.4, §5.5).

`"202609"` adalah string yang **sangat gampang** ter-coerce jadi Number `202609` oleh writer mana pun. Kalau `meter.due` tersimpan String tapi `search` mengirim Number — atau sebaliknya — hasilnya **0 row, senyap**: `MeterRound` kosong, dan tidak ada yang error.

Ini bukan kekhawatiran teoretis di sistem ini:
- String-vs-Number sudah jadi **akar custody-stuck** dan bug **search-0-row**.
- `digit-pad-widget-dev-spec.md:143` sudah mematok `position` = Number **dengan alasan itu persis**: *"String-vs-Number sudah jadi akar bug custody-stuck dan search-0-row di sistem ini — jangan diulang di jalur yang ujungnya uang."*

Spec CF ini jalur yang sama, ujungnya uang yang sama, tapi belum mematok apa pun selain `sd`.

**Fix — satu tabel tipe di §3:**

| String | Number |
|---|---|
| `prd` `due` `lk` `li` `sv` `ln` `msn` `mc` `mo` `mst` `pst` | `sd` `dg` `pv` `avg` `pt` `exp` `dln` `t` |

Dan satu kalimat: **canonical-on-write** — CF selalu menulis `prd`/`due` sebagai String, dan menormalkan apa pun yang dibaca dari event sebelum membandingkan.

---

## R3-C. 🟠 Tidak ada transaksi — read-modify-write bisa saling menimpa

§5 langkah 1–7 = baca doc `meter`, hitung, tulis balik (`pv` `pt` `due` `avg` `hs` `mo`). Kata "transaksi" **tidak muncul sekali pun** di spec.

Dua event untuk titik yang sama tiba berbarengan → dua invocation membaca `hs` yang sama, dua-duanya push, yang belakangan menimpa → **satu bacaan hilang dari `hs`**, dan `avg` salah sampai jendela 6-nya bergulir habis.

Kapan itu terjadi? **Persis skenario yang bikin langkah 2 ada**: sync offline yang mengirim beberapa event sekaligus. Guard `t ≤ pt` tidak menolong — dua event beda `t`, dua-duanya sah, dua-duanya maju.

Presedennya sudah ada di repo dan sudah terbukti: `asset_cache` menulis balance + monthly rollup dalam **satu Firestore transaction**, plus marker idempoten. Meter tidak butuh markernya (doc-id deterministik + guard `t` sudah cukup), tapi butuh transaksinya.

**Fix:** bungkus langkah 1–7 dalam `RunTransaction` — baca doc di dalam txn, tulis di dalam txn yang sama. Satu kalimat di §5, dan satu baris deliverable.

---

## R3-D. 🟡 `digit-pad-widget-dev-spec.md` belum disinkron ke `lk`

Fix R1-B mengubah doc-id `meter` jadi `lk`, dan §4 spec CF sudah memakai `lk◼{lk}`. **Spec widget belum ikut:**

```
digit-pad-widget-dev-spec.md:47
| `vidtable` / `table` / `search` | Sumber doc `meter` | `84214220504259//meter` / `li◼{li}` |
```

Karena doc `meter` menyimpan `lk` **dan** `li`, `search li◼{li}` tetap "jalan" — cuma balik **N doc lintas site**, ambiguitas yang justru mau dibunuh `lk`. Jadi fix-nya baru setengah: doc-nya sudah tidak tabrakan, tapi pembacanya masih bisa salah ambil.

**Fix:** sinkronkan contoh di spec widget → `lk◼{lk}`, atau `li◼{li}⭘sv◼{site}` kalau yang dibawa dari scan cuma `li`.

> Kabar baiknya, sisa spec widget **sudah cocok**: `digitsField:dg` · `compareField:pv` · `avgField:avg`. Konsesi nama field (R1-C) mendarat benar — tinggal `search`-nya.

---

## R3-E. 🟡 `ln` denorm tidak pernah di-refresh

§5 langkah 1 membaca doc `location` **hanya saat doc `meter` belum ada**. Sesudah itu `ln` tidak pernah disentuh lagi.

Titik di-rename di `TitikPatroli` ("BSD Tech Center #18" → "#18A") → judul kartu di `MeterRound` **basi selamanya**, sementara semua layar lain menampilkan nama baru. Petugas melihat dua nama untuk satu titik.

**Rumahnya sudah ada:** `onTenantWrite` sekarang me-*route* fate **+ location** — jadi fan-out rename ke doc `meter` adalah cabang di tempat yang memang sudah membaca perubahan `location`. Alternatif yang lebih murah: terima basi, tapi **tulis di §10** supaya bukan kejutan.

---

## R3-F. 🟡 Acceptance "harus 1 CF menyala" tidak akan pernah lulus

§9:
> "Satu event bacaan masuk → hitung berapa Cloud Function yang menyala. Harus **1**, bukan 3."

Kriteria ini dari ronde 1, dan **salah kutip**. `onTenantWrite` memakai wildcard `{coll}` — dia **tetap menyala** di doc `event`; early-return yang diminta (§6.2) cuma buat `meter`/`putaran`. Jadi yang menyala **2**, yang memproses **1**.

Dites apa adanya, kriteria ini gagal padahal implementasinya benar — dan orang akan "memperbaiki" yang tidak rusak.

**Fix:** *"Satu event bacaan masuk → tepat **1** fungsi yang memprosesnya. `onTenantWrite` boleh menyala tapi harus early-return tanpa menulis apa pun."*

---

## R3-N. Patch ronde 3

| # | Patch | Lokasi | Biaya |
|---|---|---|---|
| 1 | Gate = `ty` prefix `meter-` saja, cabang di dalam | §5 gate, §6.1 | hapus klausa |
| 2 | Tabel tipe String/Number + aturan canonical-on-write | §3 (baru), §5.4 | 1 tabel |
| 3 | Bungkus langkah 1–7 dalam `RunTransaction` | §5, §6 | 1 kalimat |
| 4 | Sinkron `search` di spec widget → `lk◼{lk}` | `digit-pad-widget-dev-spec.md:47` | **doc lain** |
| 5 | `ln` refresh (fan-out di cabang location) — atau catat basi di §10 | §5.1 / §10 | keputusan |
| 6 | Perbaiki acceptance "1 CF menyala" → "1 yang memproses" | §9 | 1 baris |

**#1 blocker** (`mo` mati diam tanpa itu). **#2–3 kelas bug yang sudah pernah kejadian di sistem ini** — murah sekarang, mahal setelah data masuk. **#4 di doc lain**, jangan lupa ikut.

---

## Status gabungan

| Ronde | Temuan | Diserap |
|---|---|---|
| 1 | 11 | ✅ semua, spec jadi v2 |
| 2 | 9 (2 blocker) | ⏳ belum |
| 3 | 6 (1 blocker) | ⏳ belum |

**Total menunggu: 15 patch, 3 di antaranya blocker** (`sv` tidak sampai ke CF · `hs` tanpa periode · gate menolak `failed`).

Rancangan intinya tetap tidak bergeser sejak ronde 1: `due` sebagai penanda, dua seksi daftar, `lk`, `ty`, fold ke `onEventCreated`. Yang ditemukan ronde 2 dan 3 semuanya **lapisan pelaksanaan** — dan itu pertanda spec-nya sehat: kalau konsepnya salah, temuan ronde 2 tidak akan sesempit ini.

---

# Ronde 4 — atas spec v3

**Verdict: v3 sudah bisa dieksekusi.** 15/15 temuan ronde 2+3 diserap, dan diserapnya bukan tambal — beberapa dirapikan lebih jauh dari yang diminta (§3.0 tabel tipe berdiri sendiri, §5c dapat sub-bab, §5.4 jadi 3 cabang eksplisit dengan alasan tiap cabang, §8 dapat butir baru "merekonstruksi bulan yang bolong" yang menaikkan keputusan teknis jadi doktrin).

Verifikasi rename: `pu` / `mn` / `dl` / `et` **nol pemakaian basi** — 7 kemunculan tersisa semuanya sengaja (baris `DIBUANG`, kotak peringatan, riwayat revisi).

Ronde ini menyisir **cabang aritmetika dan urutan operasi** — sudut terakhir yang belum diuji. 2 temuan + 1 catatan. **Tidak ada blocker.**

---

## R4-A. 🟠 `avg` bisa bagi nol kalau dua elemen `hs` sama periodenya

§5.5 sudah benar rumusnya, dan guard-nya ada — tapi guard-nya menjaga hal yang salah:

> "Kurang dari 2 elemen `hs` → `avg` dikosongkan"

Guard di **jumlah elemen**, sementara yang bisa nol adalah **penyebut**:

```
avg = (sd − hs[0].sd) / ( bulan(closed) − bulan(hs[0].prd) )
```

Bacaan ulang di bulan yang sama — petugas salah baca lalu mengulang, atau supervisor minta verifikasi — menghasilkan:
```json
"hs":[{"prd":"202608","sd":1268},{"prd":"202608","sd":1275}]
```
2 elemen → guard lolos → penyebut `202608 − 202608` = **0**.

Guard §5.2 tidak menahan ini: dia cuma menolak `t` yang lebih tua, dan bacaan ulang `t`-nya lebih baru. Sah, dan memang harus diterima.

**Fix — dedupe `hs` by `prd`, yang terbaru menang.** Push jadi: kalau `prd` sudah ada di `hs`, timpa elemennya; kalau belum, append lalu trim.

Bonus: itu sekaligus membetulkan makna jendelanya. Sekarang "maks 6" berarti **6 bacaan**; sesudah dedupe berarti **6 bulan** — dan 6 bulan yang memang dimaksud, karena pembaginya jarak periode.

> Guard jumlah elemen tetap dipertahankan buat kasus doc baru; tambahannya cuma "penyebut 0 → `avg` dikosongkan" sebagai jaring terakhir.

---

## R4-B. 🟡 Gate sekarang permisif, tapi langkah 1 tetap bikin doc tanpa syarat

Gate prefix-saja (R3-A) benar — tapi konsekuensinya belum diikuti langkah 1:

> "1. Baca doc `meter` id `lk`. **Belum ada → bikin** (`lk`, `li`, `sv`, `ln`, `mst:"active"`)"

Dengan gate lama (daftar-putih), langkah 1 cuma kena event yang jelas maksudnya. Sekarang **event `meter-*` apa pun** — termasuk `meter-point-deactivated` yang §5 sendiri sebut sebagai contoh cabang masa depan — akan **melahirkan doc `meter` baru ber-`mst:"active"`**, lalu ikut terhitung di `exp` (§5b.2). Event yang maksudnya menonaktifkan titik justru mengaktifkannya.

**Fix — pindahkan pembuatan doc ke cabang yang punya maksud:**
- `sd` terisi (bacaan / survey) → boleh bikin.
- `meter-reading-failed` → **update kalau ada, skip kalau tidak ada**. Gagal membaca titik yang belum pernah disurvei tidak menghasilkan ringkasan apa pun.
- Cabang `meter-*` lain → tidak bikin.

Satu kalimat di langkah 1, dan sifat permisif gate jadi aman ke depan.

---

## R4-C. 🟡 Catatan — urutan baca/tulis di dalam transaksi

§5 sekarang membungkus langkah 1–7 dalam satu `RunTransaction` ✅. Satu hal yang layak ditulis eksplisit supaya dev tidak kejeblos: **Firestore mewajibkan semua `Get` mendahului semua `Set` di dalam satu transaksi.**

Langkah 1 punya read **bersyarat** (doc `location`, cuma kalau doc `meter` belum ada) — struktur seperti itu yang paling gampang tanpa sengaja jatuh sesudah write pertama waktu kodenya ditulis.

Repo sudah kenal aturan ini — `asset_cache` mematuhinya untuk dua collection sekaligus. Cukup satu kalimat di §5 supaya tidak ditemukan ulang lewat error runtime.

---

## R4-N. Patch ronde 4

| # | Patch | Lokasi | Biaya |
|---|---|---|---|
| 1 | `hs` dedupe by `prd` (terbaru menang) + guard penyebut ≠ 0 | §3.2, §5.5 | 1 aturan push |
| 2 | Langkah 1 bikin doc hanya kalau `sd` terisi atau survey; `failed` = update-if-exists | §5.1, §5.7 | 1 kalimat |
| 3 | Catatan "semua read sebelum semua write" di dalam txn | §5 | 1 kalimat |
| + | Acceptance: bacaan ulang bulan sama → `avg` waras, `hs` tetap 1 elemen per periode | §9 | 1 baris |

---

## Status akhir

| Ronde | Temuan | Blocker | Status |
|---|---|---|---|
| 1 | 11 | 3 | ✅ diserap → v2 |
| 2 | 9 | 2 | ✅ diserap → v3 |
| 3 | 6 | 1 | ✅ diserap → v3 |
| 4 | 3 | **0** | ⏳ |

**Ronde 4 nol blocker, dan ketiganya edit satu kalimat.** Kurvanya turun tajam: 11 → 15 → 3, dan yang tersisa sudah bukan soal rancangan melainkan cabang aritmetika yang cuma kelihatan kalau ditelusuri per-kasus.

Rancangan intinya **tidak pernah bergeser sejak ronde 1** — `due` sebagai penanda, dua seksi daftar, `lk`, `ty`, fold ke `onEventCreated`. Itu ukuran yang sebenarnya: spec yang konsepnya keliru akan runtuh di ronde 2, bukan menyempit sampai tiga kalimat.

**Rekomendasi: patch ronde 4 boleh digabung ke ronde implementasi** — dev Go bisa mulai sekarang, tiga butir ini masuk sebagai catatan waktu menulis §5. Tidak perlu v4 sebelum kode ditulis.

---

**Referensi grounding:** `cloud-function` @ `e19f331` — `deploy.sh`, `internal/location/location.go:44-52`, `internal/fate/fate.go:55,190`, `internal/movement/movement.go:50,55`, `function.go:31`, `event_push_trigger.go`, `walkin_nota_trigger.go:29` · `widget-claude/docs` — `addToEvent-flutter-dev-spec.md:98-110`, `digit-pad-widget-dev-spec.md:48-50,175,202`, `driver-runtime-field-dictionary.md:124`, `driver-custody-p7p8p9-dev-spec.md:32`, `patroli-cleaning-MASTER-handoff.md:254`, `driver-runtime-firestore-structure.md:42`, `standard-page-event-pattern.md:43`
