# Dev Spec (Flutter) — widget `OCR_CAPTURE` (foto → isi field, ML Kit on-device)

**Tanggal:** 2026-08-18
**Buat:** dev Flutter (renderer — widget BARU generik, form-field family seperti `TXF`/`GET_IMAGES`) + builder op1Screen (nyusul setelah renderer landing).
**Status:** PROPOSED
**Konsumen pertama:** page **Catat Meteran** (agent real estate VTL — foto meteran air/listrik, stand meter keisi otomatis). Konsumen kedua: page **OCR Invoice** (foto nota supplier, 4 field keisi lewat ketuk). Row op1Screen belum dialokasikan — builder isi pas renderer landing.
**Mesin:** Google ML Kit Text Recognition v2, **on-device**, package `google_mlkit_text_recognition`. **Nol backend, nol API call, nol biaya per foto.**

---

## 0. Problem statement

> Agent lapangan harus bisa mindahin angka dari benda fisik (meteran, nota, invoice) ke form tanpa ngetik — di lokasi yang sering **tanpa sinyal** — dan mekanismenya harus kepake ulang buat dokumen lain tanpa nulis kode baru tiap jenis dokumen.

Widget ini = form field biasa (punya `position` kaya `TXF`), nilainya sendiri **URL foto**; hasil bacanya ditulis ke posisi lain lewat `ocrTargets`.

## 1. Keputusan user (terkunci, 2026-08-18)

1. **Ekstraksi di HP, bukan backend.** VLM/AI (Gemini/Claude) sempat dirancang lalu **dibatalkan user**. Konsekuensi diterima sadar: ML Kit cuma *baca teks*, gak *ngerti dokumen*.
2. **Offline = syarat, bukan bonus.** Semua jalur baca harus jalan tanpa sinyal. Upload foto ngantri kaya sekarang.
3. **Widget BARU berdiri sendiri**, punya kamera + layar sendiri. **BUKAN** nempel di `GET_IMAGES` — alasan user: "takutnya beda dari segi UI dan prosessing". `GET_IMAGES` **nol sentuhan**, page report existing nol regresi.
4. **Variant = `auto` | `tap`** (cara ambil), **BUKAN** `single`/`multiple` (jumlah field). Jumlah field jatuh sendiri dari panjang `ocrTargets`. Alasan: kasus "nota, ambil totalnya doang" = 1 field + perilaku ketuk; di penamaan berbasis jumlah, kasus itu gak punya rumah dan variant bakal beranak.
5. **Agent selalu bisa koreksi.** Angka yang tersimpan = yang disetujui manusia. Gak ada auto-submit hasil mesin.
6. **Semua label dari `text`** ◆-segmen — termasuk label widget (user: "untuk label masukin aja ke text"). Nol string hardcode di Flutter.
7. **UI baru, pipa lama.** Layar & pemrosesan sendiri, tapi upload/folder/filename/`imageParameter` **numpang pipeline `GET_IMAGES` yang sudah ada** — biar CF hash `ih` + `addToTable` existing gak ketinggalan.

## 2. Konsep

ML Kit balikin *daftar potongan teks + kotak posisinya*, bukan *field yang keisi*. Jadi widget ini **bukan "mesin yang ngisi formulir"** — dia **"keyboard yang isinya udah ada di foto"**.

- `variant:"auto"` — 1 benda di dalam kotak bantu, mesin nebak, agent mastiin. Buat meteran / nomor seri / plat.
- `variant:"tap"` — banyak teks di dokumen, agent nunjuk mana yang mana. Buat invoice / KTP / surat jalan. **Nol aturan per-dokumen, nol rilis app per supplier baru.**

Gagal baca **bukan error**: field ditinggal kosong, form balik jadi form biasa, agent ngetik. Foto tetap keupload.

## 3. Kontrak config (generic template — semua label dari `text`)

```json
{"type":"OCR_CAPTURE","variant":"[VARIANT]","position":[POSITION],"ocrTargets":"[OCRTARGETS]","ocrPattern":"[OCRPATTERN]","ocrType":"[OCRTYPE]","metaTargets":"[METATARGETS]","guide":"[GUIDE]","ocrMaxSide":[OCRMAXSIDE],"source":"[SOURCE]","max":1,"folder":"[FOLDER]","filename":"[FILENAME]","imageParameter":"[IMAGEPARAMETER]","previewSize":[PREVIEWSIZE],"currentValue":"","isEnabled":"[ISENABLED]","text":"[TEXT]"}
```

| param | fungsi | contoh (meteran) |
|---|---|---|
| `variant` | `auto` = mesin nebak 1 nilai · `tap` = agent ketuk teks di foto | `auto` |
| `position` | ◁N▷ widget sendiri = **URL foto** (bukan hasil OCR) → `addToTable` existing `i◼◁4▷` jalan apa adanya | `4` |
| `ocrTargets` | daftar posisi tujuan, dipisah koma, **urut**. Ketukan ke-1 → posisi ke-1. **Panjang daftar = jumlah field** | `7` |
| `ocrPattern` | ◆-segmen **sejajar `ocrTargets`**. Regex bentuk yang diharap per field. `auto` pakai segmen 0. Segmen kosong = terima apa saja | `\d{4,6}` |
| `ocrType` | ◆-segmen sejajar juga: `text` \| `number` \| `date`. **Normalisasi** nilai sebelum ditulis (§5) | `number` |
| `metaTargets` | OPSIONAL, 2 posisi dipisah koma: `src` + `raw`. Kosong = gak nulis apa-apa | `8,9` |
| `ocrMinPosition` | OPSIONAL — posisi yang nilainya jadi **batas bawah masuk akal** (§5.2). Hasil OCR di bawah nilai itu = mencurigakan. Kosong = nol pengecekan | `6` (Stand Awal) |
| `guide` | rasio kotak bantu di layar kamera (`"4:1"`, `"1.6:1"`). Kosong = tanpa kotak (full frame) | `4:1` |
| `ocrMaxSide` | sisi terpanjang gambar **yang dikasih ke ML Kit** (px). Tuas kualitas-lawan-kecepatan buat HP lawas. Default 1600 | `1600` |
| `source` | `""` kamera (default) · `gallery` · `both` — ikut kosakata `GET_IMAGES` (`docs/getimages-gallery-source-dev-spec.md`) | `` |
| `max` | jumlah foto. **v1 = 1** (§11) | `1` |
| `folder` `filename` `imageParameter` `previewSize` `currentValue` `isEnabled` | **sama persis semantik `GET_IMAGES`** | `id/2026/vtl/meter/<vid>` |
| `text` | ◆-segmen, urutan §3.1 | lihat §4 |

### 3.1 Urutan `text` ◆-segmen (5 tetap + ekor sepanjang `ocrTargets`)

| # | isi |
|---|---|
| 0 | label widget di form |
| 1 | judul/hint layar kamera |
| 2 | hint layar ketuk (`tap` doang) |
| 3 | pesan gagal baca |
| 4 | badge penanda nilai asal-foto di field (mis. `dari foto`) |
| 5 | pesan cek-masuk-akal gagal (§5.2), mis. `lebih kecil dari stand awal — cek lagi` |
| 6.. | nama chip per target — **urut sama persis** dengan `ocrTargets` |

### 3.2 Aturan kesejajaran (WAJIB dijaga renderer)

- `ocrTargets`, `ocrPattern`, `ocrType`, dan `text` segmen 6+ **sejajar per-indeks**.
- `ocrPattern`/`ocrType` boleh lebih pendek dari `ocrTargets` → sisanya default (`ocrPattern` kosong = terima apa saja, `ocrType` = `text`).
- Panjang lebih dari `ocrTargets` → kelebihannya **diabaikan**, jangan crash.
- `variant:"auto"` cuma pakai indeks 0; `ocrTargets` isi >1 di mode `auto` → pakai yang pertama, abaikan sisanya (jangan error).

## 4. UI / Layout

### 4a. Di form (dua variant, tampilan sama)

```
SEBELUM difoto:                        SESUDAH (auto, berhasil):
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ Foto Meteran                 │       │ Foto Meteran                 │
│ ┌──────────────────────────┐ │       │ ┌──────────────────────────┐ │
│ │          [ + ]           │ │       │ │  [potongan foto angka]   │ │
│ └──────────────────────────┘ │       │ └──────────────────────────┘ │
└──────────────────────────────┘       └──────────────────────────────┘
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ Stand Meter                  │       │ Stand Meter                  │
│ (kosong)                     │       │ 01234        [text[4]]       │  ← badge dari config, tetap bisa diketik
└──────────────────────────────┘       └──────────────────────────────┘
```

Potongan foto = crop area sumber nilai (kotak bantu buat `auto`, elemen yang diketuk buat `tap`) — biar mata agent bisa banding tanpa pindah layar. Gagal baca → preview foto biasa + pesan `text[3]` sekali, field kosong.

### 4b. Layar kamera (`variant:"auto"`)

```
┌────────────────────────────────┐
│  Pas-in angka ke kotak         │  ← text[1]
│                                │
│      ┌──────────────────┐      │  ← kotak bantu, rasio dari `guide`
│      │     01234        │      │
│      └──────────────────┘      │
│                                │
│           ( ⬤ )   [⚡]          │  ← shutter + flash
└────────────────────────────────┘
```

### 4c. Layar ketuk (`variant:"tap"`, muncul setelah jepret)

```
┌────────────────────────────────┐
│ Ketuk angkanya                 │  ← text[2]
│┌──────────────────────────────┐│
││ PT SUMBER JAYA               ││
││ Invoice ⌈INV-8823⌉           ││  ← tiap TextElement = kotak tap-able
││ Tgl ⌈14/08/26⌉               ││
││ TOTAL ⌈3.663.000⌉ ← diketuk  ││
│└──────────────────────────────┘│
│ [No ✓] [Tgl ✓] [Supplier] [Total ←] │  ← chip dari text[6..], yang nyala = tujuan
│              [ Selesai ]       │
└────────────────────────────────┘
```

- Ketuk teks → normalisasi → masuk chip aktif → **auto-maju** ke chip berikutnya.
- Ketuk chip → jadikan tujuan aktif (buat betulin/ketimpa).
- **Selesai** boleh ditekan walau ada chip kosong — sisanya diketik manual di form.
- Zoom/pan foto wajib (invoice teksnya kecil).

### 4d. State

`empty` → `capturing` → `reading` (spinner, ≤2 dtk) → `filled` / `failed`.
`failed` = ML Kit balikin kosong ATAU gak ada yang cocok `ocrPattern`: foto **tetap keupload**, pesan `text[3]`, field kosong, **gak ada dialog / gak ada tombol coba-lagi** — jangan bikin agent mandek.

## 5. Kontrak output (KRITIS — anti-locale, anti String-vs-Number)

Nilai ditulis ke `ocrTargets[i]` **setelah dinormalisasi** ikut `ocrType[i]`:

| `ocrType` | input mentah ML Kit | yang ditulis ke ◁N▷ |
|---|---|---|
| `number` | `"3.663.000"`, `"3 663 000"`, `"01234"` | **digit polos**: `3663000`, `1234`. Buang semua pemisah ribuan & spasi. Desimal (kalau ada) pakai **titik**, jangan pernah pakai formatter locale |
| `date` | `"14/08/26"`, `"14-08-2026"` | format sama persis dengan output widget `datePicker` existing — **[VERIFY] dev**, samain, jangan bikin format ketiga |
| `text` | apa adanya | trim spasi depan-belakang doang |

Kenapa keras di sini: String-vs-Number udah pernah jadi akar custody nyangkut, dan search field bertipe number balik 0 baris gara-gara dikirim String. Normalisasi wajib **di titik masuk**, bukan dibenerin belakangan.

### 5.1 `metaTargets` — dihitung **saat submit**, bukan saat jepret

| kondisi | nilai `src` (posisi ke-1) |
|---|---|
| nilai akhir field == teks mentah ML Kit | `ocr` |
| beda (agent ngedit) | `ocr_edit` |
| ML Kit gak balikin apa-apa / gak ada yang cocok | `manual` |

Posisi ke-2 = `raw` (teks mentah sebelum normalisasi & sebelum edit). Dua kolom ini = **alat ukur akurasi di produksi** (§13) — tanpa ini gak ada yang tau fiturnya kepake apa nggak.

### 5.2 Cek masuk akal (`ocrMinPosition`) — validasi termurah yang paling nolong

Kalau `ocrMinPosition` diisi dan `ocrType` = `number`:

- hasil OCR **≥** nilai di posisi itu → isi seperti biasa.
- hasil OCR **<** nilai itu → **tetap diisi, TAPI ditandai** (field warna beda + pesan `text[6]`), badge asal-foto diganti penanda ragu. Agent bisa lanjut (meteran memang bisa di-reset/ganti), tapi gak bisa gak sadar.
- **JANGAN blok submit.** Ini penanda, bukan gerbang — kasus meteran diganti / muter balik ke 0 itu nyata.

Konsumen pertama: Stand Awal (bacaan periode lalu) jadi batas bawah Stand Akhir. Salah baca ketahuan **saat agent masih berdiri di depan meterannya**, bukan pas nagih.

## 6. Pipeline foto (urutan WAJIB — paling gampang kebalik)

```
jepret → file ASLI di HP
       → [1] resize ke `ocrMaxSide`  → ML Kit baca  → isi field
       → [2] resize ke `imageParameter` (400,400,80) → upload (pipeline GET_IMAGES)
```

- **Baca dulu dari file asli, kecilin buat upload belakangan.** Kalau kebalik (baca dari hasil 400×400), tulisan invoice udah jadi bubur dan fitur ini gagal total.
- Yang diupload **tetap** `imageParameter` seperti sekarang → kuota agent & storage nol kenaikan.
- `variant:"auto"` + `guide` keisi → ML Kit dikasih **crop area kotak bantu saja**, bukan full frame. Ini yang paling naikin akurasi sekaligus ngapus pertanyaan "angka yang mana".

### 6.1 ML Kit — aturan pakai

1. `TextRecognizer(script: TextRecognitionScript.latin)` · `processImage(InputImage.fromFile(f))` · hasil `RecognizedText.blocks[].lines[].elements[]`, tiap level punya `boundingBox` + `cornerPoints`.
2. **Tap target = `TextElement`** (level kata). Line-level / gabung 2 elemen = di luar v1.
3. Koordinat `boundingBox` relatif gambar yang dikasih ke ML Kit — renderer wajib skala balik ke koordinat layar (rotasi EXIF ikut diperhitungkan).
4. **Model Latin WAJIB ikut di-bundle ke app**, bukan yang di-download lewat Play Services. Kalau modelnya baru turun saat online pertama, HP agent yang langsung dibawa ke lapangan gagal OCR — persis skenario yang fitur ini mau tolong. **[VERIFY] dev** pas milih dependency.
5. `close()` recognizer saat widget dilepas.
6. `run:"N:disable"` / `isEnabled:"FALSE"` → widget non-aktif, tombol foto mati (ikut perilaku widget lain).

## 7. Sheet-side (builder — SETELAH renderer landing)

**Config-ahead TIDAK dipakai**: ini type BARU, renderer dulu, config nyusul. Nulis `OCR_CAPTURE` ke sheet sebelum renderer bisa baca = page JSON dianggap tipe tak dikenal / widget ilang dari layar.

1. Tab **Widget**: 1 baris template generic — kolom I nama (`ocrCapture1`), kolom J template §3 dengan `[PLACEHOLDER]`, kolom A/G/H formula (ikut konvensi, **jangan tulis literal**).
2. Tab **op1Screen**: blok page. Contoh page OCR Invoice — 7 baris: header · `ocrCapture1` · 4× `txf1` · `saveSend`.
3. Registrasi page di **Plug**.
4. `GET_IMAGES` **jangan disentuh** — termasuk template `getImages1@134` yang SHARED banyak page report.

## 8. Contoh resolved

**8a. Meteran (`auto`)** — posisi ikut page Catat Meteran saat dibangun:

```json
{"type":"OCR_CAPTURE","variant":"auto","position":4,"ocrTargets":"7","ocrPattern":"\\d{3,6}","ocrType":"number","metaTargets":"8,9","ocrMinPosition":"6","guide":"5:1","ocrMaxSide":1600,"source":"","max":1,"folder":"id/2026/vtl/baca-meter/87544551624342","filename":"87544551624342-2026-08-18-09-41-02","imageParameter":"400,400,80","previewSize":120,"currentValue":"","isEnabled":"TRUE","text":"Foto Meteran◆Pas-in deretan angka ke kotak◆◆Gak kebaca — ketik manual◆dari foto◆Lebih kecil dari stand awal — cek lagi◆Stand Akhir"}
```

**8b. Invoice (`tap`)**:

```json
{"type":"OCR_CAPTURE","variant":"tap","position":4,"ocrTargets":"11,12,13,14","ocrPattern":"◆\\d{2}[/-]\\d{2}[/-]\\d{2,4}◆◆[\\d.,]+","ocrType":"text◆date◆text◆number","metaTargets":"","ocrMinPosition":"","guide":"","ocrMaxSide":1600,"source":"both","max":1,"folder":"id/2026/vtl/invoice/87544551624342","filename":"87544551624342-2026-08-18-09-41-02","imageParameter":"400,400,80","previewSize":120,"currentValue":"","isEnabled":"TRUE","text":"Foto Invoice◆Arahkan ke dokumen◆Ketuk angkanya◆Gak kebaca — ketik manual◆dari foto◆◆No. Invoice◆Tanggal◆Supplier◆Total"}
```

## 9. Dictionary (field baru)

| field | tab | tipe | default | makna |
|---|---|---|---|---|
| `variant` (OCR_CAPTURE) | widget | String | `auto` | cara ambil nilai: `auto` \| `tap` |
| `ocrTargets` | widget | String | — | posisi tujuan, koma-separated, urut |
| `ocrPattern` | widget | String | `""` | ◆-segmen regex per target |
| `ocrType` | widget | String | `text` | ◆-segmen `text`/`number`/`date` per target |
| `metaTargets` | widget | String | `""` | 2 posisi: src + raw |
| `ocrMinPosition` | widget | String | `""` | posisi batas bawah masuk akal; hasil di bawahnya ditandai, bukan ditolak |
| `guide` | widget | String | `""` | rasio kotak bantu, `""` = full frame |
| `ocrMaxSide` | widget | Number | `1600` | sisi terpanjang gambar yang dibaca ML Kit |

Kolom data yang perlu disiapin di koleksi konsumen: `src` (String: `ocr`/`ocr_edit`/`manual`) + `raw` (String).

## 10. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| **Spike ukur akurasi** (§12 langkah 0) | dev Flutter | PROPOSED — **kerjain duluan** |
| Widget `OCR_CAPTURE` variant `auto` | dev Flutter | PROPOSED |
| Widget `OCR_CAPTURE` variant `tap` | dev Flutter | PROPOSED |
| Normalisasi `ocrType` + kontrak §5 | dev Flutter | PROPOSED |
| Cek masuk akal `ocrMinPosition` §5.2 | dev Flutter | PROPOSED |
| `TXF variant:"delta"` §16 (pemakaian live) | dev Flutter | PROPOSED — **[VERIFY] mungkin sudah ada** |
| Watermark stamping di foto | — | **DI LUAR LINGKUP** (§15.2, keputusan user) |
| Bundle model Latin ML Kit | dev Flutter | PROPOSED ([VERIFY]) |
| Widget row `ocrCapture1` + page Catat Meteran + page OCR Invoice | builder | NUNGGU renderer |
| Kolom `src`/`raw` di koleksi konsumen | builder | NUNGGU renderer |
| Backend / CF | — | **NIHIL** (keputusan §1.1) |

## 11. v1 scope & Not Doing (dan kenapa)

**v1:** `auto` 1 field · `tap` n field · 1 foto · normalisasi 3 tipe · meta src/raw.

- **Rincian baris barang invoice (tabel item)** — butuh ngerti kolom-baris; ML Kit gak punya konsep itu, nulis parser tabel sendiri = proyek, bukan fitur. Manual dulu. Kalau ini yang nanti kerasa berat, itu momen AI dibuka lagi.
- **Meteran jarum analog** — gak ada teks buat dibaca. Selamanya ketik manual. Jangan janjiin ke user.
- **Mesin aturan kata kunci** (`cari "TOTAL" ambil angka kanannya`) — dibuang sadar: tiap supplier layout beda → aturan per supplier → tiap supplier baru = rilis app. Treadmill. `tap` ngasih hasil yang sama tanpa itu.
- **Backend / VLM** — dibatalkan user (§1.1). Kalau nanti dibuka lagi, **UI-nya gak berubah**: bedanya cuma sebagian elemen udah ke-highlight duluan pas layar ketuk kebuka. Sambungannya gak perlu disiapin sekarang.
- **`max` > 1** (invoice 2 halaman) — field-nya ada di kontrak, v1 isinya 1. Ketuk-buat-isi lintas beberapa foto = barang lain.
- **Pilihan bahasa ML Kit** (Jepang/Korea/Devanagari) — app Indonesia, tuas yang gak akan pernah diputer. Latin di-hardcode.
- **Dokumen terbitan sendiri** — jangan di-OCR, tempel QR/barcode (ML Kit barcode nyaris 100%). Di luar spec ini.

## 12. Deliverable dev (urut)

0. **Spike dulu, ~setengah hari.** Pakai **foto asli sistem Baca Meter yang jalan sekarang** (§15) — meteran air **roda angka mekanik**, kotor/basah/di rumput, **plus watermark ke-bakar di gambar**. Ambil ~30, jalanin ML Kit apa adanya, itung berapa persen deretan angkanya kebaca **persis**. Uji dua kondisi: (a) full frame, (b) crop kotak bantu doang. Lapor dua angkanya sebelum lanjut. Kodenya buang.
   **Alasan: ini risiko terbesar spec.** Roda angka mekanik lebih susah dari 7-segment (digit setengah muter), dan watermark `Sidik (2232)` / `Lat -6.24869` / `15-08-2026` bakal ikut kebaca — pattern polos bisa nyomot angka watermark, bukan angka meteran. ≥80% (crop) → lanjut penuh. ~30% → stop, rancang ulang: kotak bantu lebih ketat, atau `auto` dicoret dan meteran ikut pakai `tap` (agent ketuk deretan angkanya).
1. Widget shell + kamera + kotak bantu `guide` + pipeline foto §6 (baca-dulu-resize-belakangan).
2. Variant `auto`: pattern match → normalisasi → tulis 1 posisi.
3. Variant `tap`: overlay elemen tap-able + chip + auto-maju.
4. Normalisasi §5 + meta §5.1 (dihitung saat submit).
5. Bundle model Latin, cek di HP yang belum pernah online.

## 13. Acceptance

- [ ] `auto`: foto meteran normal → `◁7▷` keisi digit polos, ≤2 dtk, offline (mode pesawat).
- [ ] `auto` gagal (foto buram) → field kosong, pesan `text[3]`, **foto tetap keupload**, form tetap bisa disubmit.
- [ ] `tap`: 4 ketukan → 4 field keisi urut; ketuk chip → tujuan pindah; ketuk teks lain → nilai ketimpa.
- [ ] `ocrType:"number"` → `"3.663.000"` tersimpan `3663000` di device locale id_ID (**bukan** `3.663.000` atau `3.663`).
- [ ] `metaTargets` keisi benar 3 kasus: terima bulat (`ocr`), diedit (`ocr_edit`), gagal (`manual`).
- [ ] `metaTargets:""` / `ocrMinPosition:""` → nol efek, gak nulis apa-apa, gak ngecek apa-apa.
- [ ] `ocrMinPosition` diisi: hasil OCR < nilai posisi itu → field **tetap keisi** + penanda + pesan `text[5]`, dan **submit tetap bisa jalan** (kasus meteran diganti / muter balik ke 0).
- [ ] Foto ber-watermark (nama/koordinat/jam ke-bakar) → yang keambil angka meteran, **bukan** angka watermark.
- [ ] §16: stand awal `989` + OCR `1033` → pemakaian tampil `44` **tanpa** disubmit dulu; agent koreksi jadi `1030` → pemakaian **langsung** jadi `41`.
- [ ] §16: stand akhir dikosongin → pemakaian tampil `text[1]`, **bukan** `0`. Hasil negatif tampil negatif.
- [ ] `position` = URL foto, `addToTable` existing pola `i◼◁4▷` jalan tanpa perubahan.
- [ ] HP yang **belum pernah online** → OCR tetap jalan (model ke-bundle).
- [ ] Page report existing pakai `GET_IMAGES` → **nol regresi** (widget itu gak disentuh).
- [ ] Nol string hardcode di Flutter — semua tulisan dari `text`.
- [ ] `ocrPattern`/`ocrType` lebih pendek/panjang dari `ocrTargets` → gak crash, ikut §3.2.

## 14. Asumsi & risiko (belum divalidasi)

- [ ] **Roda angka mekanik kebaca ML Kit** — risiko terbesar. Konsumen pertama BUKAN 7-segment: foto asli (§15) = meteran air drum mekanik, kotor, di rumput. Digit yang lagi setengah muter hampir pasti salah baca. Dijawab langkah 0, bukan diasumsikan.
- [ ] **Watermark ke-bakar di foto** (`Sidik (2232)`, `Lat -6.24869`, `15-08-2026 10:03`) ikut kebaca ML Kit dan bisa kepilih sebagai nilai. Mitigasi: kotak bantu WAJIB di `auto` (`guide` jangan dikosongin), plus `ocrMinPosition` sebagai jaring kedua. Kalau spike nunjukin masih ketuker, tambah aturan buang zona watermark.
- [ ] **Model Latin bisa di-bundle** (bukan wajib download Play Services) — [VERIFY] dev saat milih dependency.
- [ ] **Format output `date`** samain dengan `datePicker` existing — [VERIFY] dev, jangan bikin format ketiga.
- [ ] **Renderer bisa nulis nilai ke posisi lain** dari dalam widget. Ada tandanya bisa (`run:"17:generate_number"` = tombol nyuruh posisi 17 keisi), tapi itu petunjuk, bukan bukti — [VERIFY] dev sebelum estimasi.
- [ ] **Elemen ML Kit sejajar dengan yang mau diketuk** — angka bertitik ribuan kadang kepecah jadi 2 elemen. Kalau kejadian di data asli: gabung elemen yang bersebelahan di baris sama sebelum ditampilkan.
- [ ] HP lawas: full-frame `tap` di invoice padat bisa lambat. `ocrMaxSide` = tuasnya; kalau masih berat, turunin dari sheet, bukan nunggu rilis.

## 15. Data map konsumen pertama — layar "Detail Baca Meter" (sistem existing, screenshot user 2026-08-18)

Sistem baca meter air yang jalan sekarang nampilin 9 field. **Yang jadi urusan widget ini cuma SATU.** Sisanya page-level — ditulis di sini biar gak ada yang ngira widget-nya bolong.

| Field di layar | Contoh | Dari mana | Urusan siapa |
|---|---|---|---|
| Stand Akhir | `1033 M3` | **OCR** | **widget ini** (`ocrTargets`) |
| Stand Awal | `989 M3` | bacaan periode sebelumnya, keyed No SL + periode | page — prefill lookup |
| Pemakaian | `44 M3` | **selisih akhir − awal** | **OPEN, §15.1** |
| No Sambungan Langganan / No SL Lama | `X315015` / `DC1214` | master pelanggan; agent milih sambungan dulu (route/list), bukan dari foto | page |
| Nama Pelanggan / Alamat | `JUSUF JOHANI` / `SEKTOR 7 DC 12/14` | ikut master, denorm | page |
| Periode Baca | `202608` | turunan tanggal submit | page — formatter |
| Petugas Baca | `SIDIK` | session user | page — formatter existing |
| Lat / Long / jam | `-6.24869, 106.61479, 15-08-2026 10:03` | GPS | `gpsPosition` di `saveSend` (udah ada) — **tapi lihat §15.2** |
| Tab "Daftar Pemakaian Sebelumnya" | riwayat | query keyed No SL | page terpisah / widget list existing |

Satuan (`M3`) statis per jenis meteran → label, bukan bagian nilai. `ocrType:"number"` nulis `1033`, bukan `"1033 M3"`.

### 15.1 Pemakaian — dihitung LIVE di form (keputusan user 2026-08-18)

Agent harus lihat `44 M3` **sebelum** submit, bukan setelah data masuk server. Alasan: angka pemakaian yang aneh (0, atau 10× rata-rata) itu sinyal salah baca paling kentara, dan cuma berguna kalau muncul **saat agent masih di depan meterannya**. CF yang ngitung = ketahuan pas nagih, telat.

Butuh field turunan di renderer. Kontraknya §16.

### 15.2 Watermark ke-bakar di foto — DI LUAR LINGKUP (keputusan user 2026-08-18)

Sistem existing nge-bakar nama petugas + koordinat + jam **ke dalam gambar**. Consteon nyimpen itu sebagai **data terpisah** (`gpsPosition` + timestamp submit) — setara secara data.

- **Gak dikerjain di spec ini** (dikonfirmasi ulang user 2026-08-18). Alasan user: nama petugas datang dari spreadsheet lewat `addToEvent` — data di piksel gak bisa di-query, gak bisa dikoreksi, dan duplikat dari yang sudah disimpan. Kalau nanti butuh watermark visual, itu urusan **widget image**, bukan widget ini.
- Kalau jadi dibikin: **stamp SESUDAH ML Kit baca, jangan sebelum.** Kebalik = watermark ikut kebaca dan angkanya bisa ketuker (§14).

## 16. Field turunan `TXF variant:"delta"` (tambahan kecil, buat §15.1)

**[VERIFY] dev pertama:** kalau renderer **sudah** punya field turunan/computed, **pakai yang ada** — spec §16 ini gugur jadi catatan config. Kalau belum ada, ini versi paling kecilnya. **Sengaja bukan mesin formula** — cuma pengurangan dua posisi; bikin parser rumus buat satu kasus = scope creep.

```json
{"type":"TXF","variant":"delta","position":10,"deltaPositions":"7,6","decimals":0,"isEnabled":"FALSE","text":"Pemakaian◆—"}
```

| param | isi |
|---|---|
| `deltaPositions` | `"A,B"` → nilai = ◁A▷ − ◁B▷. Konsumen pertama: `"7,6"` = stand akhir − stand awal |
| `decimals` | angka di belakang koma, default `0` |
| `isEnabled` | `FALSE` — read-only, agent gak boleh ngetik ke sini |
| `text` | ◆-segmen: 0 label · 1 tampilan saat salah satu sumber kosong/bukan angka |

Aturan:
- **Hitung ulang tiap salah satu posisi sumber berubah** — termasuk saat agent ngedit manual hasil OCR. Ini inti "live"-nya; kalau cuma dihitung sekali saat OCR, angkanya basi begitu agent koreksi.
- Salah satu sumber kosong / bukan angka → tampilkan `text[1]`, **jangan** tulis 0 (0 itu nilai yang sah, jangan dipalsuin).
- Hasil negatif → **tetap tampilkan apa adanya** (jangan di-absolute-kan, jangan di-nol-kan). Negatif = sinyal, dan §5.2 udah nandain sebabnya.
- Nilai tetap ikut `◁10▷` di `addToTable` seperti field biasa. Format angka polos, aturan anti-locale §5.

## 17. v0 — page Baca Meter TANPA OCR (bisa dites di mobile SEKARANG)

Status hari ini: **nol kode**. `OCR_CAPTURE` tipe baru → renderer belum kenal → **jangan ditulis ke sheet dulu** (page rusak, bukan fitur setengah jalan).

Tapi seluruh alur kerjanya bisa dibangun & dites hari ini pakai **widget yang 100% sudah ada**:

| baris | widget | isi |
|---|---|---|
| header | — | page BacaMeter |
| 1 | picker sambungan (existing, pola `lqr`) | pilih No SL → nama/alamat denorm keisi |
| 2 | `TXF` `isEnabled:FALSE` | Stand Awal ← prefill bacaan periode lalu · posisi 6 |
| 3 | **`GET_IMAGES`** | foto meteran · posisi 4 |
| 4 | `TXF` `number` | **Stand Akhir — diketik manual** · posisi 7 |
| 5 | `TXF` | Pemakaian — v0 diketik/CF (§16 belum ada) · posisi 10 |
| 6 | `saveSend` | `addToEvent` + `gpsPosition` |

**Yang divalidasi v0** (dan ini bagian yang paling gampang salah, bukan OCR-nya): prefill stand awal benar per sambungan? periode kehitung benar? GPS kecatat? `addToEvent` nulis ke kolom yang bener? agent ngerti urutan layarnya?

**Upgrade ke OCR nanti = ganti 1 baris.** Baris 3 `GET_IMAGES` → `OCR_CAPTURE` + isi `ocrTargets:"7"`, `ocrMinPosition:"6"`. Sisanya nol perubahan — itu sebabnya `position` widget ini sengaja diisi **URL foto** (§3), persis seperti `GET_IMAGES` yang digantikan.

Paralel: dev jalanin spike §12 langkah 0 — **gak butuh app**, cukup skrip buang pakai foto asli.

---

**Referensi:** `docs/getimages-gallery-source-dev-spec.md` (kosakata `source`, pipeline upload yang dinumpangi), `docs/map-point-picker-widget-dev-spec.md` (sibling: widget baru form-field family, pola anti-locale), `json/request-leave.json` (contoh `GET_IMAGES` + `TXF` + `saveSend`/`addToTable` nyata), aturan config-driven labels, aturan config-ahead-of-renderer (type baru → renderer dulu).
