# Verifikasi Nomor Seri Meter — OCR jadi penjaga "salah meteran" (Dev Spec)

**Tanggal:** 2026-08-25
**Buat:** dev Flutter (renderer) · builder op1Screen
**Status:** PROPOSED
**Konteks / Konsumen pertama:** `vertikaTeknoLokaciptaMeterRead` — proxy `18v3w5YJ`, tab `op1Screen 16072026`, baris **1530** (`digitPad`). Titik uji `BSD Tech Center #18`, site `Product Group`, tenant `Agenia Demo-7`.
**Referensi:** `docs/digit-pad-widget-dev-spec.md` (rev d) · `docs/get-images-required-dev-spec.md` · `docs/meter-test-scenarios.md`

---

## 1. Kenapa

**§7.8 dibatalkan.** Rencana lama: OCR baca **angka** di foto, dibandingkan dengan angka yang diketik petugas. Dicabut 2026-08-25 (keputusan user). Alasannya: typo sudah ditangkap dua pemeriksaan yang lebih murah dan sudah jalan — vonis **mundur** (`nilai < pv`) dan vonis **lonjakan** (`nilai − pv > avg × spikeMultiplier`). OCR angka cuma jaring ketiga di atas dua jaring yang sudah ada.

**Yang belum dijaga sama sekali:** petugas berdiri di **meteran yang salah**. Ini bukan typo — angkanya benar, cuma milik unit lain. Dua pemeriksaan di atas justru **buta** terhadap ini: meteran tetangga bisa saja angkanya lebih besar dan selisihnya wajar. Konsekuensinya dua unit salah tagih sekaligus, dan tidak ada satu pun layar yang bisa menunjukkan bahwa itu terjadi.

Nomor seri adalah satu-satunya hal di muka meteran yang bisa membedakan unit ini dari unit sebelah. Jadi **OCR dipindah tugas**: dari memeriksa angka, jadi memeriksa identitas.

**Constraint kunci (keputusan user 2026-08-25):**

1. **Tidak semua meteran punya nomor seri.** Yang tidak punya harus lolos tanpa gangguan — bukan error, bukan blokir.
2. **Tidak semua meteran punya stiker QR.** Ini **sudah beres, nol kerjaan** — `li` digenerate CF (`location.go:183` `generateLqrID`), stiker cuma **mencetak** `li`, bukan membuatnya. Titik tanpa stiker tetap punya `li` di DB dan dipilih dari daftar `MeterRound`. Syaratnya cuma satu: tombol scan **tidak boleh** jadi gerbang wajib. Sekarang memang bukan.
3. **Pendataan awal lewat Apps Script**, bukan lewat app. Jadi `msn` masuk DB dari seed, bukan dari OCR petugas.

Sumbu QR dan sumbu nomor seri **tidak saling mengunci**. Spec ini cuma menggarap sumbu nomor seri.

## 2. Konsep

**Isi database yang jadi saklarnya, bukan flag config.**

`digitPad` sudah membaca doc `meter` sekali saat halaman load (§7.5 spec digitPad — buat ambil `pv`, `avg`, `dgh`, `dgm`). Tambahkan satu field ke bacaan itu: `msn`.

> `msn` **kosong** → tidak ada yang bisa dibandingkan → OCR **tidak dijalankan sama sekali**, layar diam.
> `msn` **terisi** → OCR baca foto, cari nomor seri itu di dalamnya. Tidak ketemu → naikkan bottom sheet.

Tidak perlu penanda "meteran ini punya seri / tidak punya" per titik. Meteran tanpa nomor seri memang `msn`-nya kosong, dan itu sudah cukup. Ini persis aturan yang sama dengan `compareField` kosong = nol vonis.

**Bonus yang sudah jalan:** `DETAIL_CARD` di baris 1528 sudah menampilkan `Nomor meter◼<msn>` dengan `hideEmptyRows:"TRUE"`. Titik tanpa `msn` → barisnya hilang sendiri. Petugas melihat nomor seri yang tercatat **sebelum** memfoto. Nol kerjaan tambahan.

## 3. Kontrak field — delta atas `DIGIT_PAD`

Bukan widget baru. Dua field ditambah, satu field dipensiunkan.

| Field | Status | Isi | Contoh |
|---|---|---|---|
| `serialField` | **BARU** | Nama field nomor seri di doc `meter`. **Kosong = pemeriksaan seri mati total** (nol ML Kit dipanggil) | `msn` |
| `blockOnSerialMismatch` | **BARU** | `TRUE` = seri tidak cocok **mematikan tombol simpan**. `FALSE` = cuma memperingatkan | `FALSE` |
| `photoPosition` | dipakai ulang | `◁N▷` foto dari `getImages1`. Tidak berubah sedikit pun | `3` |
| `ocrPattern` | **PENSIUN** | Satu-satunya pemakainya adalah §7.8 yang dibatalkan. **Renderer abaikan.** Nilainya boleh tetap ada di sheet, tidak apa-apa | — |
| `compareField` / `avgField` / `spikeMultiplier` / `blockOnBackward` | tidak berubah | Vonis mundur & lonjakan tetap jalan apa adanya | — |

> **Tidak ada `serialPattern`.** Kita tidak sedang mencari "sesuatu yang berbentuk nomor seri" di dalam foto — kita sudah **tahu** nomor seri yang dicari, isinya `msn`. Regex cuma menambah satu hal yang bisa salah kalibrasi.

### 3.1 Aturan pencocokan (persis, jangan diimprovisasi)

1. OCR seluruh foto on-device (ML Kit Latin). Ambil **semua** teks yang kebaca, gabung jadi satu string.
2. Normalkan **dua-duanya** — hasil OCR dan nilai `msn` — dengan aturan yang sama: huruf jadi KAPITAL, lalu **buang semua karakter selain A-Z dan 0-9** (spasi, strip, titik, garis miring semuanya hilang).
3. Cocok = string OCR yang sudah dinormalkan **mengandung** `msn` yang sudah dinormalkan (substring, bukan sama persis — di foto ada tulisan lain: merek, watermark, koordinat).
4. Cocok → **jangan tampilkan apa pun.** Tidak cocok → bottom sheet naik dengan `text` segmen 6.

**Nol ambang kemiripan, nol fuzzy match, nol Levenshtein.** Kalau nanti hit-rate-nya jelek, yang diperbaiki fotonya atau seed-nya — bukan aturannya dilonggarkan sampai tidak ada bedanya dengan tidak diperiksa.

### 3.2 Segmen `text` — segmen 6 dipakai ulang

Segmen 6 dulunya pesan "beda dengan foto" milik §7.8. Karena §7.8 batal, slot itu kosong dan **dipakai ulang di tempat**. Urutan segmen 0–14 **tidak bergeser sama sekali** — config lama tetap resolve benar.

| # | Isi lama (batal) | **Isi baru** |
|---|---|---|
| 6 | `Hasil baca foto {ocr}, kamu ketik {value} — cek lagi?` | `Nomor seri di foto tidak cocok dengan yang tercatat ({serial}). Yakin ini meteran unit ini?` |

Segmen **5** (`Perbaiki dulu, atau kamu sedang berdiri di meter unit lain.`) sudah pas apa adanya buat kaki-blokir kasus ini. Tidak diubah.

**Token `{}` — daftar tertutup, ada perubahan:**

| Token | Status |
|---|---|
| `{serial}` | **BARU** — isi `msn` dari doc |
| `{ocr}` | **PENSIUN** — dengan pencocokan substring tidak ada satu "nilai hasil OCR" yang bisa ditampilkan |
| `{value}` `{prev}` `{delta}` `{avg}` `{n}` | tidak berubah |

## 4. Contoh resolved — `MeterRead` (baris 1530)

Delta atas config yang **sekarang live**. Yang berubah dicetak tebal; sisanya sama persis.

```json
{"type":"DIGIT_PAD","position":7,"vidtable":"20342033315492","table":"84214220504259//meter","search":"lk◼{lk}","digitsField":"dgh","digitsRedField":"dgm","digitsPosition":"9","digitsRedPosition":"13","digitsMode":"auto","digitsOptions":"4◆5◆6","digitsRedOptions":"0◆1◆2◆3","digitsSourcePosition":"14","compareField":"pv","avgField":"avg","spikeMultiplier":4,"blockOnBackward":"FALSE","photoPosition":"3","ocrPattern":"\\d{4,9}","serialField":"msn","blockOnSerialMismatch":"FALSE","currentValue":"","isEnabled":"TRUE","text":"Angka di meter sekarang◆Salin jendela odometer saja — jarum kecil di bawahnya jangan◆Masuk akal — selisih {delta} m³ dari {prev}◆Lonjakan jauh — {delta} m³, biasanya {avg} m³/bulan. Bisa bocor, bisa salah digit.◆Angka lebih kecil dari {prev}. Meter air tidak bisa berkurang — tersimpan apa adanya, kantor yang tinjau.◆Perbaiki dulu, atau kamu sedang berdiri di meter unit lain.◆Nomor seri di foto tidak cocok dengan yang tercatat ({serial}). Yakin ini meteran unit ini?◆Kurang {n} angka◆Berapa kotak hitam?◆Berapa kotak merah?◆beda?◆Cocokkan dengan meternya. Salah di sini = tagihan unit ini meleset 10× atau 100×.◆Perbaiki angkanya◆Angkanya memang segitu◆Kalau kamu yakin, angkanya disimpan apa adanya dan cuma ditandai untuk ditinjau kantor."}
```

**`MeterSurvey`** (blok 1535–1546): `serialField:""`. Doc `meter`-nya memang belum ada di pendataan awal, jadi pemeriksaan ini tidak punya bahan. Dikosongkan **eksplisit** supaya tidak ada yang mengira ini kelupaan.

## 5. Layar

Tidak ada elemen baru. Vonis seri numpang bottom sheet yang sudah ada (§4c spec digitPad), sama persis dengan vonis lonjakan.

```
┌──────────────────────────────────────┐
│  Detail Meter                        │
│  Nomor meter    A21-4471908          │  ← DETAIL_CARD, hilang kalau msn kosong
│  Bulan lalu     39010                │
│  Rata-rata      55 m³/bln            │
├──────────────────────────────────────┤
│  Foto Muka Meter          [ + ]      │  ← getImages1, position 3, optional FALSE
├──────────────────────────────────────┤
│  Angka di meter sekarang             │
│   ▢ ▢ ▢ ▢ ▢                          │
└──────────────────────────────────────┘
                 ↓  foto diambil, msn terisi, seri tidak ketemu di foto
┌──────────────────────────────────────┐
│  ⚠  Nomor seri di foto tidak cocok   │
│     dengan yang tercatat             │
│     (A21-4471908). Yakin ini         │
│     meteran unit ini?                │
│                                      │
│   [ Perbaiki angkanya ]              │  ← segmen 12
│   [ Angkanya memang segitu ]         │  ← segmen 13, ADA kalau block FALSE
│                                      │
│   Kalau kamu yakin, angkanya         │  ← segmen 14
│   disimpan apa adanya dan cuma       │
│   ditandai untuk ditinjau kantor.    │
└──────────────────────────────────────┘
```

`blockOnSerialMismatch:"TRUE"` → segmen 13 **tidak muncul**, tombol simpan halaman mati, yang tampil segmen 5.

## 6. Sheet-side (builder, **setelah** renderer landing)

Peta kolom baris **1530** yang sekarang, dibaca live 2026-08-25:

| Kol | Placeholder | Isi sekarang |
|---|---|---|
| G–V | POSITION … BLOCKONBACKWARD | tidak disentuh |
| W | `[PHOTOPOSITION]` | `3` |
| X | `[OCRPATTERN]` | `\\d{4,9}` — dibiarkan, renderer abaikan |
| Y | `[ISENABLED]` | `TRUE` |
| Z | `[TEXT]` | segmen 0–14 |
| **AA** | `[SERIALFIELD]` | **kolom bebas pertama** |
| **AB** | `[BLOCKONSERIALMISMATCH]` | |

Langkahnya, urut:

1. `Widget!J322` — tambahkan `,"serialField":"[SERIALFIELD]","blockOnSerialMismatch":"[BLOCKONSERIALMISMATCH]"` sebelum `"currentValue"`.
2. `AA1530` = `msn` · `AB1530` = `FALSE` · `Z1530` = segmen 6 diganti (§3.2).
3. Baris `digitPad` di `MeterSurvey` — `AA` = kosong, `AB` = `FALSE`.
4. Bungkus dua SUBSTITUTE baru di kolom `D` kedua baris itu.

⚠️ **Template dipasang PALING AKHIR.** `Widget!J322` dipakai bareng `MeterRead` dan `MeterSurvey`. Begitu template berubah, dua page langsung ikut. Kolom AA/AB diisi duluan, template terakhir — supaya tidak ada saat di mana JSON-nya masih memuat `[SERIALFIELD]` mentah.

## 7. Deliverable dev Flutter

**Langkah 0 — WAJIB duluan, sebelum menulis kode fitur ini.** Dua hal, dua-duanya cepat:

**0a. Buktikan `photoPosition` benar-benar terbaca.** `digitPad` membaca slot `◁N▷` milik `getImages1`. **Pola ini sudah pernah gagal total** — `digitsPosition` rev c menunjuk slot milik `SELECTABLE_BTN`, petugas memilih, widget tidak pernah merender, nol error (§12 spec digitPad, terbukti di lapangan 20 Agu). Dugaannya slot dibaca sekali saat halaman load, dan foto baru ada **sesudah** load.
Caranya: tampilkan isi mentah slot `photoPosition` di layar, sementara. Kosong sebelum foto, **terisi** sesudah foto = mekanisme hidup, lanjut. Tetap kosong sesudah foto = **berhenti, kabari.** Fitur ini tidak bisa dibangun di atas mekanisme itu dan perlu jalan lain (OCR di dalam `GET_IMAGES` sendiri) — itu keputusan baru, bukan perbaikan.

**0b. Buktikan nomor serinya masuk frame.** Buka 10 foto "Foto Muka Meter" yang sudah pernah diambil di lapangan. Nomor serinya kelihatan dan kebaca? Kalau ternyata nomor seri ada di badan meteran dan **tidak pernah** ikut kefoto di frame muka, seluruh spec ini gugur — perlu foto kedua, dan itu keputusan produk.

Kalau 0a atau 0b gagal, **jangan lanjut ke 1–6.**

Lalu:

1. Waktu membaca doc `meter` (§7.5 spec digitPad), ambil juga field yang namanya disebut `serialField`. `serialField` kosong → **lewati, jangan panggil ML Kit sama sekali.**
2. Nilai `serialField` di doc **kosong** → juga lewati. Nol OCR, nol delay, nol tampilan.
3. `serialField` terisi **dan** foto sudah ada di slot `photoPosition` → jalankan OCR, cocokkan sesuai §3.1.
4. Cocok → **jangan tampilkan apa pun.** Tidak cocok → naikkan bottom sheet dengan segmen 6, `{serial}` diisi nilai dari doc.
5. `blockOnSerialMismatch:"TRUE"` **dan** tidak cocok → matikan tombol simpan halaman + tampilkan segmen 5, segmen 13 disembunyikan. `FALSE` → tombol tetap hidup.
6. **Abaikan `ocrPattern`.** Hapus jalur §7.8 kalau sudah terlanjur ditulis.
7. Foto diganti → **hitung ulang.** Vonis seri ikut aturan yang sama dengan vonis angka: dihitung ulang tiap perubahan, bukan sekali di awal.
8. Nol string hardcode — semua tulisan dari `text`, semua nilai lewat token `{}` §3.2.

**dev Go (CF):** **nol kerjaan.** Aturan fill-if-empty `msn` sudah ada dan sudah benar (`internal/meter/meter.go:359-361`) — bacaan rutin tidak akan pernah menimpa seri yang sudah tercatat.

## 8. Dictionary — field baru

| Field | Tab | Tipe | Default | Makna |
|---|---|---|---|---|
| `serialField` | widget | string | `""` | Nama field nomor seri di doc sumber. Kosong = pemeriksaan seri mati |
| `blockOnSerialMismatch` | widget | string bool | `FALSE` | `TRUE` = seri tidak cocok mematikan submit |
| `ocrPattern` | widget | string | `""` | ⚠️ **PENSIUN 2026-08-25** — pemakainya (§7.8) dibatalkan |

Collection `meter`: `msn` sudah ada, tidak berubah. ⚠️ `sn` tetap tidak boleh dipakai — sudah kepakai di `location` sebagai **site name**.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| **Langkah 0a** — buktikan `photoPosition` terbaca | dev Flutter | **BLOKIR — duluan** |
| **Langkah 0b** — buktikan seri masuk frame foto | dev Flutter / lapangan | **BLOKIR — duluan** |
| Baca `serialField` + cocokkan (§7.1-4) | dev Flutter | PROPOSED |
| Gerbang `blockOnSerialMismatch` (§7.5) | dev Flutter | PROPOSED |
| Cabut jalur §7.8 (§7.6) | dev Flutter | PROPOSED |
| `Widget!J322` + `AA/AB` 2 baris + segmen 6 | builder op1Screen | nunggu renderer |
| Seed `msn` 400 titik | Apps Script | **nunggu data Paskal** |
| `serialField` / `blockOnSerialMismatch` | dict book | OPEN |

## 10. v1 scope & Not Doing (dan kenapa)

**v1 =** §7.1-8, dengan `blockOnSerialMismatch:"FALSE"`. Peringatan dulu, blokir belakangan — begitu hit-rate OCR terukur di lapangan, tinggal ganti satu sel jadi `TRUE`, **tanpa rilis app**. Pola yang sama dengan `spikeMultiplier`.

**Not doing:**

- **OCR mengisi `msn`.** Product sudah membalik arah ini (#6: OCR memeriksa, tidak pernah mengisi). Lebih gawat lagi di sini: `msn` itu **fill-if-empty**, jadi satu kali OCR salah baca akan meracuni `msn` **permanen** dan pemeriksaannya berbalik jadi pemblokir bacaan yang benar, tiap bulan, selamanya. `msn` cuma boleh masuk dari seed atau koreksi manual.
- **`serialPosition` (slot keluaran seri).** Konsekuensi langsung dari poin di atas. Tidak ada slot, tidak ada `msn` di `addToEvent`.
- **Pendataan seri lewat app.** Data awal ditembak Apps Script (keputusan user). Kalau nanti ada titik baru di luar seed, `msn`-nya kosong → pemeriksaan diam. Itu perilaku yang benar, bukan lubang.
- **Penanda "meteran ini tidak punya nomor seri".** `msn` kosong sudah menyatakannya. Menambah flag kedua = dua sumber kebenaran buat satu fakta. ⚠️ Konsekuensinya `msn` kosong tidak bisa membedakan "memang tidak punya" dari "belum disurvei" — kalau nanti kantor perlu daftar "titik mana yang serinya belum kekumpul", itu urusan laporan, bukan urusan widget ini.
- **Fuzzy match / ambang kemiripan.** Lihat §3.1. Pemeriksaan yang dilonggarkan sampai selalu lolos itu lebih buruk daripada tidak ada — petugas belajar mengabaikan sheet-nya, dan begitu itu terjadi vonis mundur ikut diabaikan.
- **§7.8 (OCR angka vs ketikan).** Dibatalkan user 2026-08-25. Baris ini sengaja ditinggal supaya tidak ada yang menghidupkannya lagi dari ingatan.
- **Blokir waktu OCR gagal baca apa pun.** Foto berembun/gelap tidak sama dengan meteran salah. Tapi ⚠️ lihat §12 — aturan substring §3.1 memang **tidak bisa** membedakan keduanya, dan itu risiko utama spec ini.

## 11. Acceptance

- [ ] `serialField:""` → **nol ML Kit dipanggil**, nol delay tambahan, layar persis seperti sekarang.
- [ ] `serialField:"msn"` tapi doc `msn`-nya kosong → juga nol ML Kit, layar diam. **Bukan peringatan, bukan error.**
- [ ] Doc `msn` terisi, foto muka meteran yang benar → **tidak ada apa pun di layar.**
- [ ] Doc `msn` terisi, foto meteran unit **lain** → bottom sheet naik, segmen 6, `{serial}` menampilkan nomor seri yang **tercatat** (bukan yang di foto).
- [ ] `blockOnSerialMismatch:"FALSE"` + tidak cocok → tombol simpan **tetap hidup**, segmen 13 ada, bacaan tersimpan apa adanya.
- [ ] `blockOnSerialMismatch:"TRUE"` + tidak cocok → tombol simpan **mati**, segmen 13 **tidak ada**, yang tampil segmen 5.
- [ ] `msn` di doc ditulis `A21-4471908`, di foto tercetak `A21 4471908` → **cocok** (normalisasi §3.1 langkah 2 jalan).
- [ ] Foto diganti dengan foto meteran lain → vonis **dihitung ulang**, bukan menempel di hasil foto pertama.
- [ ] Vonis mundur & lonjakan **tetap jalan persis seperti sekarang** — tidak ada regresi dari perubahan ini.
- [ ] `ocrPattern` masih ada di config → diabaikan diam-diam, widget tidak di-drop.
- [ ] Nol string hardcode — ganti segmen 6 di sheet, teks di layar ikut berubah.

## 12. Asumsi & risiko (belum divalidasi)

- [ ] 🔴 **`photoPosition` mungkin memang tidak pernah terbaca.** Pola yang sama sudah terbukti gagal senyap sekali (`digitsPosition` rev c). Ini **satu-satunya** blocker yang bisa membatalkan seluruh spec. Langkah 0a ada buat menjawabnya sebelum ada kode terbuang.
- [ ] 🔴 **Nomor seri belum tentu masuk frame "Foto Muka Meter".** Belum pernah dicek ke foto asli. Langkah 0b.
- [ ] 🔴 **Aturan substring tidak bisa membedakan "meteran salah" dari "OCR gagal baca".** Dua-duanya keluar sebagai "tidak cocok". Kalau ML Kit gagal baca seri di, katakanlah, 40% foto, petugas diperingatkan di 40% bacaan yang **benar** — dan dalam sebulan mereka belajar menekan "Angkanya memang segitu" tanpa membaca. Begitu itu terjadi, **vonis mundur dan lonjakan ikut mati**, karena sheet-nya sama. Ini alasan v1 wajib `FALSE`, dan alasan hit-rate harus **diukur**, bukan diasumsikan.
- [ ] **ML Kit bisa baca angka/huruf timbul di badan meteran** — belum diuji. Warisan risiko yang sama dari §12 spec digitPad, cuma objeknya ganti dari roda angka jadi nomor seri.
- [ ] **Watermark ke-bakar** (nama petugas, koordinat, tanggal) ikut kebaca OCR. Dengan pencocokan substring ini **tidak berbahaya** — watermark cuma menambah teks, tidak bisa bikin seri yang salah jadi cocok. Justru inilah alasan §3.1 pakai substring, bukan sama-persis.
- [ ] **Format nomor seri Paskal belum diketahui.** Belum ada datanya. §3.1 sengaja tidak bergantung pada format apa pun, jadi ini **tidak memblokir** — tapi kalau ternyata banyak seri yang cuma 4-5 digit angka, risiko cocok-kebetulan dengan angka lain di foto naik. Ukur setelah seed masuk.
- [ ] **Seed `msn` belum ada.** Sampai Apps Script jalan, semua `msn` kosong → pemeriksaan ini **diam di seluruh titik**. Itu perilaku benar, tapi artinya fitur ini tidak bisa diuji tuntas di lapangan sebelum seed masuk. Yang bisa diuji sekarang cuma langkah 0a + 0b.

---

**Referensi:** `docs/digit-pad-widget-dev-spec.md` §3/§4a/§7/§12 (§7.8 di sana **dibatalkan** oleh dokumen ini) · `docs/get-images-required-dev-spec.md` (foto wajib, `optional:"FALSE"` sudah LIVE di baris 1529) · `docs/meter-test-scenarios.md` Bagian A (skenario langkah 0a) · `internal/meter/meter.go:331-363` (fill-if-empty `msn`) · `internal/location/location.go:183` (`generateLqrID` — kenapa QR opsional bukan masalah).
