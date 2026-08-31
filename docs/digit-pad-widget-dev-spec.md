# Dev Spec (Flutter) — widget `DIGIT_PAD` (kotak digit terkunci + banding riwayat)

**Tanggal:** 2026-08-20 · **rev 2026-08-20f** — 🔴 **JANGAN bangun `digitsPosition` sebagai INPUT.** Diuji di lapangan hari ini: config lama memberi jumlah kotak lewat slot `◁N▷` milik `SELECTABLE_BTN` di halaman yang sama. Petugas memilih `5`, **widget tidak pernah merender sama sekali**. Jalur itu **sudah dicabut sejak rev d** — `digitsPosition` sekarang **keluaran**, dan jumlah kotak datang dari doc (`digitsField`) atau dari **pemilih milik widget ini sendiri** (§2.2). Kalau ada yang sedang mengerjakan pembacaan slot-widget-lain: hentikan, itu bukan lagi bagian spec. Detail temuan di §12. Peringatan menyusul: `photoPosition` memakai pola yang sama dan kemungkinan besar mati dengan cara yang sama — uji sebelum membangun §7.8.
**rev 2026-08-20e** — 🔴 **KOREKSI: vonis pakai BOTTOM SHEET, bukan inline.** Rev d dan sebelumnya menulis "melekat di halaman, bukan modal". Itu **salah** — `handoff-meter-pascal-v3.md` #15b (revisi 19 Agu) sudah membalikkannya, dan dua prototipe (`PembacaanMeter.jsx`, `RegistrasiMeter.jsx`) memang bottom sheet. Kekhawatiran lama (petugas harus jalan ke meter lain sambil layarnya kehalang) dijawab bukan dengan membuang sheet, tapi dengan **sheet yang bisa ditutup dan menyisakan baris ringkas yang bisa ditap untuk membukanya lagi**. Lihat §4c. Segmen `text` bertambah 12–14. **Kalau sudah terlanjur dibangun inline: logika vonis tidak berubah sama sekali, cuma pembungkusnya.**
**rev 2026-08-20d** — **jumlah kotak jadi dinamis** (§2.2 BARU). Foto meter asli dari lapangan (AMICO, 20 Agu) ternyata **4 hitam + 1 merah** — pola ketiga, di luar dua config site yang sudah diketok. Artinya jumlah digit **tidak seragam bahkan di dalam satu site**, jadi asumsi §12 baris 1 gugur. Perubahan: kalau doc belum punya config digit, widget **menampilkan pemilih sendiri** dan hasilnya **ditulis balik jadi config permanen titik itu** (`digitsMode`, `digitsOptions`, `digitsSourcePosition`). `digitsPosition`/`digitsRedPosition` naik pangkat dari *override opsional* jadi **slot keluaran yang selalu diisi**. Segmen `text` bertambah 8–11 (append, segmen 0–7 tidak bergeser). Kalau §7.1–6 rev c sudah dibangun, yang nambah cuma pemilih + tulis-balik.
**rev 2026-08-19c** — **kotak merah MASUK** (§2.1). Product merevisi keputusan #14 tanggal 18 Agu: sebagian site ditagih lebih halus dari m³, jadi digit merah dipakai. Jumlah kotak sekarang **dua angka** (`digitsField` hitam + `digitsRedField` merah), bukan satu. Baris *Not Doing* "jangan bikin kotak merah" **dicabut**. Kalau sudah terlanjur dibangun tanpa merah, yang berubah cuma render + 2 field — logika banding tidak tersentuh.
**rev 2026-08-19b** — `search` doc `meter` diperbaiki `li◼{li}` → **`lk◼{lk}`** (doc `meter` ber-id `lk` = `{li}-{sv}`; `li` sendirian dipakai bersama lintas site, jadi `li◼{li}` bisa balik >1 doc dan salah ambil). Sisa kontrak tidak berubah.
**Buat:** dev Flutter (renderer — widget BARU, form-field family seperti TXF)
**Status:** PROPOSED (renderer dulu, config nyusul — type baru, config-ahead DILARANG)
**Konsumen pertama:** page **Baca Meter** vertikal Paskal Hypersquare (`MeterRead` bulanan + `MeterSurvey` pendataan awal), di atas collection `84214220504259//location` yang sudah ada.
**Referensi:** `docs/handoff-meter-pascal.md` (keputusan product, diketok), `docs/titik-patroli-app-first-location-dev-spec.md` (schema `location`), `docs/scanner-widget-dev-spec.md` (widget pasangan di halaman sebelumnya), `docs/ocr-capture-widget-dev-spec.md` (**arahnya dibalik — lihat §1**), dict book.

---

## 1. Kenapa

Petugas nyalin 5 angka dari muka meter air, 214 unit tiap bulan, dan angkanya jadi **tagihan tenant**. Dua cara gagal yang mahal: kelebihan/kurang digit (tagihan meleset 10×), dan ikut nyalin digit merah/liter (meleset 1000×).

**Keputusan product, terkunci (`handoff-meter-pascal.md`, 2026-08-18):**

| # | Keputusan | Akibat ke widget ini |
|---|---|---|
| 13 | **Kotak digit terkunci** sepanjang digit meter, bentuknya niru kotak hitam di meter | Jumlah kotak = config, bukan bebas. Kelebihan digit **mustahil secara bentuk**, bukan divalidasi |
| 14 | **DIREVISI 18 Agu — digit merah DIPAKAI di sebagian site.** Config disimpan sebagai **dua angka: berapa hitam + berapa merah**, BUKAN satu angka total | Kotak merah **wajib** dirender merah + koma terlihat. Lihat §2.1 |
| 15 | **Foto dulu, angka belakangan** — petugas nyalin dari foto di layar | Widget ini duduk **di bawah** `getImages1`, bukan di atas |
| 16 | Pemeriksaan jalan **saat petugas masih di depan meter** | Vonis muncul begitu digit terakhir masuk |
| 15b | **Vonis = BOTTOM SHEET, dan hanya kalau bermasalah** (v3, revisi 19 Agu) | Cocok → **tidak ada apa pun yang muncul**. Bermasalah → sheet naik sendiri, bisa ditutup, menyisakan baris ringkas yang bisa ditap. Lihat §4c |
| 17 | **Petugas selalu menang** | Vonis **tidak memblokir**. Angka mundur pun tersimpan apa adanya, cuma ditandai |
| 21 | **Kecuali pendataan awal** — di situ yang diuji pemetaan, bukan angka | Satu saklar `blockOnBackward`, dan cuma itu satu-satunya yang memblokir di seluruh sistem |
| 6 | **OCR dibalik: petugas mengisi, OCR memeriksa** | OCR **tidak pernah** nulis ke kotak digit. Ini **mensupersede arah** `ocr-capture-widget-dev-spec.md` (yang merancang OCR ngisi field) |

Alasan #6 dari product, dan alasannya kuat: kalau kotak keisi duluan, petugas tap-lanjut tanpa baca (automation bias) × 214 unit, dan salahnya diam-diam. Arah dibalik = rusaknya aman (satu peringatan menyebalkan), arah sebaliknya = rusaknya berbahaya (tagihan salah terkirim).

> Pembalikan ini **cuma buat meteran**. Buat invoice/nota OCR-ngisi tetap benar — petugas gak punya pengetahuan sendiri soal total nota, dia cuma nunjuk. Page `OcrInvoice`@1501 jalan terus, gak kena spec ini.

## 2.1 Kotak hitam & kotak merah — pengaman, bukan kosmetik

Muka meter air punya dua kelompok angka. **Hitam = m³. Merah = pecahan m³.** Yang berbeda antar site bukan meternya — tapi **sampai mana dibaca**, dan itulah yang menentukan satuannya.

```
[0][1][2][6][8]  [3][4]
 └── hitam ──┘   └merah┘

Kawasan Ruko : 5 hitam, 0 merah  →  01268    = 1268 m³
Paskal Lodge : 5 hitam, 2 merah  →  0126834  = 1268,34 m³
AMICO (foto lapangan 20 Agu)
             : 4 hitam, 1 merah  →  00115    = 11,5 m³
```

**Meter AMICO di atas bukan hipotesis — itu foto asli dari lapangan, 20 Agustus.** Pola ketiga, di luar dua config site yang sudah diketok. Konsekuensinya dibahas di §2.2.

**Jarum/roda kecil di bawah odometer TIDAK disalin.** Meter tipe ini punya beberapa jarum pecahan yang lebih halus dari kotak merah. Yang disalin **hanya jendela odometer**. Ini harus disebut eksplisit di `text` segmen 1 — kalau tidak, cepat atau lambat ada petugas yang menyalinnya, dan bentuk kotak yang terkunci tidak bisa menahannya (jumlah kotaknya kebetulan cukup).

**Wajib disimpan sebagai DUA angka — hitam dan merah — bukan satu angka total.** Kalau disimpan "7", letak komanya hilang: `0013162` bisa berarti `131,62` atau `13,162` — beda 10×, dan itu langsung jadi tagihan salah 10 kali lipat.

**Bahayanya dua arah:**

| Salah | Akibat |
|---|---|
| Kawasan, merah ikut tersalin | tagihan **1000× kebesaran** |
| Lodge, merah lupa disalin | tagihan **100× kekecilan** |

Dan salah config **tidak akan ketahuan** — semua unit di site itu salah dengan arah yang sama, jadi semuanya tampak wajar. Tidak ada pemeriksaan lain yang menangkapnya (banding riwayat pun ikut salah kalau seed-nya diimpor dengan asumsi digit yang sama). Ini **risiko nomor satu di seluruh fitur**.

**Karena itu bentuk kotaknya wajib mengikuti meternya:**
- `digitsRed` kotak terakhir dirender **merah**, sisanya gelap
- **koma terlihat** di antara kelompok hitam dan merah
- label di atas kotak menyatakan apa yang harus disalin — `text` segmen 1, contoh: `SALIN SEMUA — 5 HITAM DAN 2 MERAH` vs `SALIN 5 KOTAK HITAM · MERAH TIDAK USAH`

**Nilai yang dikirim = bilangan bulat MENTAH, semua kotak digabung, apa adanya seperti tertera di meter.** Pembagian ke m³ (`÷ 10^digitsRed`) **hanya saat ditampilkan**, tidak pernah saat disimpan. Menghindari galat pembulatan pada angka yang ujungnya jadi tagihan.

> Contoh: Lodge, petugas ketik `0126834` → `position` menerima **`126834`** (Number). Yang ditampilkan `1268,34 m³`. Yang disimpan tetap `126834`.

## 2.2 Dari mana jumlah kotak datang — dan siapa yang boleh mengubahnya

**Yang gugur:** rencana lama menyimpan jumlah digit **per site**, diisi sekali waktu onboarding. Foto AMICO (§2.1) membatalkan itu — 4+1 muncul di site yang config-nya 5+0. Jumlah digit **tidak seragam bahkan di dalam satu site**.

**Yang menggantikan:** config nempel **per titik** di doc `meter` (`dgh`/`dgm`). Site cuma memberi nilai awal. Dan karena tidak ada yang bisa menjamin semua titik sudah terisi benar, widget harus punya jalan keluar untuk titik yang config-nya **belum ada**.

### Tiga keadaan

| Keadaan | `digitsMode` | Yang dirender |
|---|---|---|
| Config ada, pembacaan bulanan | `auto` | Kotak **terkunci**. Tidak ada pemilih, tidak ada tautan |
| Config ada, pendataan awal | `editable` | Kotak terkunci + tautan kecil (segmen 10) yang membuka pemilih |
| Config **kosong** (`dgh` tidak ada / `0`) | apa pun | Pemilih **muncul sendiri dan wajib diisi**. Kotak baru dirender setelah dipilih |

### Aturan yang tidak boleh dilanggar

**1. Pilihan petugas WAJIB ditulis balik jadi config permanen titik itu.** Widget menulis jumlah kotak yang berlaku ke `digitsPosition` / `digitsRedPosition` — **selalu**, baik nilainya datang dari config maupun dari pemilih. Slot itu ikut naik lewat `addToEvent`, dan CF menyimpannya ke doc `meter`.

Kalau hasil pilihannya tidak disimpan, tiap bulan petugas memilih ulang dari nol. Dengan 400 unit × 12 bulan, salah pencet bukan kemungkinan tapi kepastian — dan salah digit **tidak terlihat** (§2.1). Sekali dipilih, jadi config; bulan berikutnya `digitsMode:"auto"` yang mengunci.

**2. Asal-usulnya ikut dicatat.** `digitsSourcePosition` diisi widget dengan salah satu dari dua kata:

| Nilai | Artinya |
|---|---|
| `config` | jumlah kotak datang dari doc — petugas tidak menyentuh apa pun |
| `field` | jumlah kotak **dipilih petugas di lapangan** — belum pernah diverifikasi siapa pun |

Kantor menyaring yang `field`, dan **fotonya sudah ada di event yang sama** — jadi verifikasinya cuma melihat, bukan mengirim orang balik. Ini penutup termurah untuk risiko nomor satu di seluruh fitur, dan biayanya satu field.

**3. Pemilih bukan dropdown bebas.** Isinya dari `digitsOptions` / `digitsRedOptions` (daftar `◆`), dan di atasnya berdiri peringatan segmen 11. Petugas memilih dari beberapa angka yang masuk akal, bukan mengetik angka apa pun.

**4. Ganti pilihan = kosongkan isian.** Begitu jumlah kotak berubah, angka yang sudah diketik **dibuang**, bukan dipotong dari kanan. Angka yang dipotong tetap terlihat seperti angka yang sah, dan itu persis cara kegagalan yang mau dicegah.

## 2. Konsep

Satu form-field angka yang **bentuknya niru muka meter**: N kotak gelap, satu digit per kotak, diisi lewat numpad milik widget sendiri (bukan keyboard HP). Nilai cuma bisa masuk dari jempol petugas.

Begitu kotak terakhir keisi, widget baca **doc `meter`** (bacaan terakhir + rata-rata pemakaian) lalu menilai. **Kalau angkanya masuk akal, tidak ada apa pun yang muncul** — jalur normal nol gangguan. Kalau bermasalah, **bottom sheet naik sendiri** (§4c). Vonis itu **informasi, bukan gerbang** — kecuali satu saklar dinyalakan.

## 3. Kontrak field

```json
{"type":"DIGIT_PAD","position":[POSITION],"vidtable":"[VIDTABLE]","table":"[TABLE]","search":"[SEARCH]","digitsField":"[DIGITSFIELD]","digitsRedField":"[DIGITSREDFIELD]","digitsPosition":"[DIGITSPOSITION]","digitsRedPosition":"[DIGITSREDPOSITION]","digitsMode":"[DIGITSMODE]","digitsOptions":"[DIGITSOPTIONS]","digitsRedOptions":"[DIGITSREDOPTIONS]","digitsSourcePosition":"[DIGITSSOURCEPOSITION]","compareField":"[COMPAREFIELD]","avgField":"[AVGFIELD]","spikeMultiplier":[SPIKEMULTIPLIER],"blockOnBackward":"[BLOCKONBACKWARD]","photoPosition":"[PHOTOPOSITION]","ocrPattern":"[OCRPATTERN]","currentValue":"","isEnabled":"[ISENABLED]","text":"[TEXT]"}
```

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `DIGIT_PAD` | — |
| `position` | ✅ | `◁N▷` tujuan nilai bacaan | `7` |
| `vidtable` / `table` / `search` | ✅ | Sumber doc `meter` (sifat meter, keyed titik) | `84214220504259//meter` / `lk◼{lk}` |
| `digitsField` | ✅ | Nama field **jumlah kotak HITAM** di doc itu | `dgh` |
| `digitsRedField` | ✅ | Nama field **jumlah kotak MERAH**. `0` = titik satuan m³ | `dgm` |
| `digitsPosition` | ✅ | **Slot KELUARAN** `◁N▷` — widget menulis jumlah kotak hitam yang berlaku ke sini, **selalu**, entah dari config entah dari pemilih (§2.2) | `9` |
| `digitsRedPosition` | ✅ | Slot keluaran `◁N▷` untuk jumlah kotak merah. Selalu diisi, `0` kalau tanpa merah | `13` |
| `digitsMode` | ✅ | `auto` = kunci kalau config ada · `editable` = selalu bisa dibuka lewat tautan segmen 10. **Config kosong → pemilih muncul di kedua mode** | `auto` |
| `digitsOptions` | ✅ | Pilihan jumlah kotak hitam, dipisah `◆` | `4◆5◆6` |
| `digitsRedOptions` | ✅ | Pilihan jumlah kotak merah, dipisah `◆`. `0` artinya "tidak ada merah" | `0◆1◆2◆3` |
| `digitsSourcePosition` | Opsional | Slot keluaran `◁N▷` — widget isi `config` atau `field` (§2.2 aturan 2). Kosong = asal-usul tidak direkam | `14` |
| `compareField` | Opsional | Field **bacaan terakhir**. **Kosong = nol banding, nol vonis** (widget jadi kotak digit polos) | `pv` |
| `avgField` | Opsional | Field rata-rata pemakaian. Kosong = cek lonjakan mati, cek mundur tetap jalan | `avg` |
| `spikeMultiplier` | Opsional | Ambang lonjakan = rata-rata × ini. Default `4` | `4` |
| `blockOnBackward` | ✅ | `TRUE` = vonis mundur **mematikan tombol simpan**. `FALSE` = cuma nandain | `FALSE` |
| `photoPosition` | Opsional | `◁N▷` foto dari `getImages1` — bahan pembanding OCR. **Kosong = pembanding OCR mati** | `4` |
| `ocrPattern` | Opsional | Regex kandidat angka di foto. Kosong = pembanding OCR mati | `\d{4,6}` |
| `isEnabled` | ✅ | `TRUE`/`FALSE` | `TRUE` |
| `text` | ✅ | Semua tulisan, dipisah `◆` (§3.1) | lihat §4 |

> **Nol `variant`.** Beda perilaku bulanan vs pendataan awal sudah habis diungkapkan `digitsMode` + `blockOnBackward`. Nambah `variant` cuma bikin dua sumber kebenaran buat satu perilaku.

### 3.1 Segmen `text` (urutan FIX)

| # | Isi | Contoh |
|---|---|---|
| 0 | Judul field | `Angka di meter sekarang` |
| 1 | Hint di bawah judul | `Salin kotak hitam saja — jangan yang merah` |
| 2 | Vonis **masuk akal** | `Masuk akal — selisih {delta} m³ dari {prev}` |
| 3 | Vonis **lonjakan** | `Lonjakan jauh — {delta} m³, biasanya {avg} m³/bulan. Bisa bocor, bisa salah digit.` |
| 4 | Vonis **mundur** | `Angka lebih kecil dari {prev}. Meter air tidak bisa berkurang.` |
| 5 | Pesan kaki saat submit diblok | `Perbaiki dulu, atau kamu sedang berdiri di meter unit lain.` |
| 6 | Pesan **beda dengan foto** | `Hasil baca foto {ocr}, kamu ketik {value} — cek lagi?` |
| 7 | Pesan belum lengkap | `Kurang {n} angka` |
| 8 | Label pemilih **hitam** (§2.2) | `Berapa kotak hitam?` |
| 9 | Label pemilih **merah** | `Berapa kotak merah?` |
| 10 | Tautan pembuka pemilih, mode `editable` | `beda?` |
| 11 | Peringatan di atas pemilih | `Cocokkan dengan meternya. Salah di sini = tagihan unit ini meleset 10× atau 100×.` |
| 12 | Tombol utama di sheet (§4c) | `Perbaiki angkanya` |
| 13 | Tombol kedua — petugas menang | `Angkanya memang segitu` |
| 14 | Kalimat pelindung di kaki sheet | `Kalau kamu yakin, angkanya disimpan apa adanya dan cuma ditandai untuk ditinjau kantor.` |

Segmen **8–11 append di belakang** — segmen 0–7 tidak bergeser, jadi config rev c yang sudah ditulis tetap resolve benar (segmen hilang = fiturnya diam).

**Token `{}` di dalam segmen** (renderer yang isi, daftar TERTUTUP — jangan nambah sendiri):
`{value}` nilai yang diketik · `{prev}` bacaan terakhir · `{delta}` selisih · `{avg}` rata-rata · `{ocr}` hasil baca foto · `{n}` sisa kotak kosong.

Segmen kosong = fitur itu diam. `◆◆` = segmen dilewat.

## 4. Contoh resolved

### 4a. `MeterRead` — pembacaan bulanan (terkunci, tidak pernah memblokir)

```json
{"type":"DIGIT_PAD","position":7,"vidtable":"20342033315492","table":"84214220504259//meter","search":"lk◼{lk}","digitsField":"dgh","digitsRedField":"dgm","digitsPosition":"9","digitsRedPosition":"13","digitsMode":"auto","digitsOptions":"4◆5◆6","digitsRedOptions":"0◆1◆2◆3","digitsSourcePosition":"14","compareField":"pv","avgField":"avg","spikeMultiplier":4,"blockOnBackward":"FALSE","photoPosition":"4","ocrPattern":"\\d{4,6}","currentValue":"","isEnabled":"TRUE","text":"Angka di meter sekarang◆Salin jendela odometer saja — jarum kecil di bawahnya jangan◆Masuk akal — selisih {delta} m³ dari {prev}◆Lonjakan jauh — {delta} m³, biasanya {avg} m³/bulan. Bisa bocor, bisa salah digit.◆Angka lebih kecil dari {prev}. Meter air tidak bisa berkurang — tersimpan apa adanya, kantor yang tinjau.◆◆Hasil baca foto {ocr}, kamu ketik {value} — cek lagi?◆Kurang {n} angka◆Berapa kotak hitam?◆Berapa kotak merah?◆beda?◆Cocokkan dengan meternya. Salah di sini = tagihan unit ini meleset 10× atau 100×.◆Perbaiki angkanya◆Angkanya memang segitu◆Kalau kamu yakin, angkanya disimpan apa adanya dan cuma ditandai untuk ditinjau kantor."}
```

Titik yang `dgh`-nya sudah terisi → kotak terkunci, pemilih tidak muncul, `◁14▷` = `config`. Titik yang belum → pemilih muncul, petugas pilih, `◁9▷`/`◁13▷` terisi pilihannya dan `◁14▷` = `field`.

### 4b. `MeterSurvey` — pendataan awal (memblokir; doc `meter` belum ada)

```json
{"type":"DIGIT_PAD","position":7,"vidtable":"20342033315492","table":"84214220504259//meter","search":"lk◼{lk}","digitsField":"dgh","digitsRedField":"dgm","digitsPosition":"9","digitsRedPosition":"13","digitsMode":"editable","digitsOptions":"4◆5◆6","digitsRedOptions":"0◆1◆2◆3","digitsSourcePosition":"14","compareField":"pv","avgField":"","spikeMultiplier":4,"blockOnBackward":"TRUE","photoPosition":"4","ocrPattern":"\\d{4,6}","currentValue":"","isEnabled":"TRUE","text":"Angka di meter sekarang◆Salin jendela odometer saja — jarum kecil di bawahnya jangan◆Cocok dengan catatan — selisih {delta} m³◆Jauh dari kebiasaan — selisih {delta} m³◆Hampir pasti bukan meter unit ini. Catatan terakhir {prev}, meter air tidak bisa berkurang.◆Pemetaannya belum masuk akal — perbaiki, atau pindah ke meter yang benar.◆Hasil baca foto {ocr}, kamu ketik {value} — cek lagi?◆Kurang {n} angka◆Berapa kotak hitam?◆Berapa kotak merah?◆beda?◆Cocokkan dengan meternya. Salah di sini = tagihan unit ini meleset 10× atau 100×.◆Perbaiki angkanya◆Angkanya memang segitu◆Kalau kamu yakin, angkanya disimpan apa adanya dan cuma ditandai untuk ditinjau kantor."}
```

> Di 4b, `search` kemungkinan besar **nol hasil** (doc `meter` belum dibikin) → config digit kosong → **pemilih muncul dan wajib diisi**, sekaligus `compareField`/`avgField` kosong → **nol vonis, nol blokir**. Itu perilaku yang benar, bukan error (§12).

> **Nomor slot di atas cuma contoh.** Angka `◁N▷` yang sebenarnya ditentukan builder op1Screen saat menyusun halaman, dan diberikan bersama config. Renderer tidak boleh mengasumsikan nomor tertentu.

## 4b. UI / Layout per state

```
KOSONG                              SEBAGIAN (3 dari 5)
┌──────────────────────────────┐    ┌──────────────────────────────┐
│ Angka di meter sekarang      │    │ Angka di meter sekarang      │
│ Salin kotak hitam saja       │    │ Salin kotak hitam saja       │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐        │    │  ┌──┐┌──┐┌──┐┌──┐┌──┐        │
│  │ ·││ ·││ ·││ ·││ ·│        │    │  │0 ││1 ││2 ││ ·││ ·│        │
│  └──┘└──┘└──┘└──┘└──┘        │    │  └──┘└──┘└──┘└╌╌┘└──┘        │
│   ▲ kotak aktif              │    │              ▲               │
│  [1][2][3]                   │    │  [1][2][3]                   │
│  [4][5][6]                   │    │  [4][5][6]     Kurang 2 angka│
│  [7][8][9]                   │    │  [7][8][9]                   │
│     [0][⌫]                   │    │     [0][⌫]                   │
└──────────────────────────────┘    └──────────────────────────────┘

LENGKAP · MASUK AKAL                LENGKAP · LONJAKAN
│  │0││1││2││6││8│            │    │  │0││1││6││8││1│            │
│ ┌──────────────────────────┐ │    │ ┌──────────────────────────┐ │
│ │✓ Masuk akal — selisih 34 │ │    │ │! Lonjakan jauh — 447 m³, │ │
│ │  m³ dari 01 234          │ │    │ │  biasanya 37 m³/bulan.   │ │
│ └──────────────────────────┘ │    │ └──────────────────────────┘ │
   (hijau)                             (kuning) — TOMBOL TETAP HIDUP

MUNDUR · blockOnBackward FALSE      MUNDUR · blockOnBackward TRUE
│ ┌──────────────────────────┐ │    │ ┌──────────────────────────┐ │
│ │✗ Angka lebih kecil dari  │ │    │ │✗ Hampir pasti bukan meter│ │
│ │  01 234 — tersimpan apa  │ │    │ │  unit ini. Catatan       │ │
│ │  adanya, kantor tinjau.  │ │    │ │  terakhir 01 234…        │ │
│ └──────────────────────────┘ │    │ └──────────────────────────┘ │
│  [ Simpan & lanjut ]  HIDUP  │    │  [ Simpan & lanjut ]  MATI   │
                                     │  Pemetaannya belum masuk akal│

BEDA DENGAN FOTO (numpuk di atas vonis riwayat — dua pemeriksaan beda)
│ ┌──────────────────────────┐ │
│ │◎ Hasil baca foto 01268,  │ │   ← muncul HANYA kalau beda.
│ │  kamu ketik 01286 —      │ │      Sama → tidak ada apa pun.
│ │  cek lagi?               │ │      Petugas tetap boleh lanjut.
│ └──────────────────────────┘ │
```

- Kotak aktif ditandai (border/caret). Tap kotak mana pun = pindah kursor ke situ.
- **Nol keyboard sistem.** Numpad milik widget. Gak ada koma, gak ada minus, gak ada titik.
- Kotak vonis yang digambar di atas = **baris ringkas** yang duduk di bawah kotak digit. Isi lengkapnya ada di **bottom sheet** (§4c); baris ringkas ini yang tersisa setelah sheet ditutup.
- Vonis **masuk akal** (hijau) tidak memunculkan sheet sama sekali — cuma baris ringkas, atau tidak ada apa pun.

## 4c. Bottom sheet — hanya kalau bermasalah

`handoff-meter-pascal-v3.md` #15b, revisi 19 Agu. Menggantikan rancangan inline-only di rev ≤ d.

```
ANGKA COCOK                          ANGKA BERMASALAH
┌──────────────────────────────┐     ┌──────────────────────────────┐
│  │0││1││2││6││8│             │     │  │0││1││1││9││4│  ← kehalang │
│ ┌──────────────────────────┐ │     │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ │✓ Masuk akal — selisih 34 │ │     │┌────────────────────────────┐│
│ └──────────────────────────┘ │     ││ (↑)                        ││
│                              │     ││ Lonjakannya jauh           ││
│  [ Simpan & lanjut ]         │     ││ Pemakaian 447 m³ — jauh di ││
└──────────────────────────────┘     ││ atas kebiasaan unit ini.   ││
   Sheet TIDAK PERNAH naik.          ││ ┌────────┐ ┌────────────┐  ││
   Nol gangguan.                     ││ │KAMU ISI│ │ BULAN LALU │  ││
                                     ││ │ 01 194 │ │  01 234    │  ││
                                     ││ └────────┘ └────────────┘  ││
                                     ││ [  Perbaiki angkanya    ]  ││  ← segmen 12
                                     ││ [ Angkanya memang segitu]  ││  ← segmen 13
                                     ││ Kalau kamu yakin, angkanya ││  ← segmen 14
                                     ││ disimpan apa adanya…       ││
                                     │└────────────────────────────┘│
                                     └──────────────────────────────┘

SETELAH SHEET DITUTUP — status tidak hilang
┌──────────────────────────────┐
│  │0││1││1││9││4│             │
│ ┌──────────────────────────┐ │
│ │! Lonjakan jauh — 447 m³  ▸│ │  ← baris ringkas, BISA DITAP
│ └──────────────────────────┘ │     untuk membuka sheet lagi
│  [ Simpan & lanjut ]  HIDUP  │
└──────────────────────────────┘
```

**Aturannya:**

1. **Cocok → sheet tidak pernah naik.** Ini yang bikin polanya kepakai: kalau sheet muncul tiap unit, orang belajar menutupnya tanpa membaca — dan begitu itu terjadi, vonis mundur ikut diabaikan.
2. **Bermasalah → sheet naik sendiri**, tanpa petugas menekan apa pun, begitu kotak terakhir keisi.
3. **Sheet bisa ditutup**, dan yang tersisa **baris ringkas yang bisa ditap** untuk membukanya lagi. Ini menjawab kekhawatiran aslinya — petugas mungkin harus jalan ke meter berikutnya sambil layarnya kehalang — tanpa membuang polanya.
4. **Dua tombol:** segmen 12 (perbaiki → tutup sheet, kosongkan isian) dan segmen 13 (petugas menang → tutup sheet, simpan apa adanya + tandai). Kaki sheet segmen 14.
5. **`blockOnBackward:"TRUE"`** → tombol segmen 13 **tidak dirender**, dan pesan segmen 5 menggantikannya. Cuma di situ petugas tidak menang.
6. Sheet **tidak pernah** menahan tombol simpan halaman selain lewat aturan 5.

## 5. Kontrak output

- `position` → **Number**, bukan String. Alasan: nilainya dipakai aritmetika (selisih, banding, tagihan). String-vs-Number sudah jadi akar bug custody-stuck dan search-0-row di sistem ini — jangan diulang di jalur yang ujungnya uang.
- **Leading zero urusan tampilan, bukan penyimpanan.** `00987` disimpan `987`. Jumlah digit hidup di `meter.dgh`/`meter.dgm`, jadi tampilan bisa di-pad ulang kapan saja.
- **`digitsPosition` / `digitsRedPosition` juga Number**, dan **selalu terisi** — termasuk saat jumlah kotak datang dari config dan petugas tidak menyentuh apa pun. Kosong berarti CF tidak punya bahan untuk menyimpan config titik itu, dan bulan depan pemilihnya muncul lagi (§2.2 aturan 1).
- **`digitsSourcePosition` String**, isinya persis `config` atau `field` — bukan boolean, bukan angka. Dua kata itu masuk ke laporan.
- **Belum lengkap = kirim kosong**, jangan kirim parsial. Kotak setengah keisi bukan angka.
- Nilai ke-capture pola form standar → dipakai `addToTable`/`addToEvent` via `◁N▷` seperti biasa.
- Hasil pembanding OCR **tidak masuk `position`**. Kalau nanti mau direkam (buat ngukur akurasi), itu field terpisah di spec lanjutan — v1 cukup ditampilkan.

## 6. Sheet-side (builder op1Screen)

Template masuk tab `Widget` (kolom **I** nama `digitPad`, kolom **J** template ber-`[PLACEHOLDER]`; **G**/**H** salin rumus dari baris atas, **kolom A JANGAN pernah ditulis** — itu ARRAYFORMULA yang spill dari kolom I).

Urutan token di template = urutan kolom param di op1Screen, positional:

| Token | Kolom | Token | Kolom |
|---|---|---|---|
| `[POSITION]` | G | `[DIGITSREDOPTIONS]` | Q |
| `[VIDTABLE]` | H | `[DIGITSSOURCEPOSITION]` | R |
| `[TABLE]` | I | `[COMPAREFIELD]` | S |
| `[SEARCH]` | J | `[AVGFIELD]` | T |
| `[DIGITSFIELD]` | K | `[SPIKEMULTIPLIER]` | U |
| `[DIGITSREDFIELD]` | L | `[BLOCKONBACKWARD]` | V |
| `[DIGITSPOSITION]` | M | `[PHOTOPOSITION]` | W |
| `[DIGITSREDPOSITION]` | N | `[OCRPATTERN]` | X |
| `[DIGITSMODE]` | O | `[ISENABLED]` | Y |
| `[DIGITSOPTIONS]` | P | `[TEXT]` | Z |

> Peta kolom di atas **indikatif** — kolom pastinya ditentukan builder saat menulis baris, karena tiap halaman punya helper yang sudah kepakai. Yang mengikat cuma **nama token**, bukan hurufnya.

Kolom D = rantai `SUBSTITUTE(VLOOKUP(B{r},Widget!$A:$G,7,FALSE),…)` yang **nunjuk ke kolom G..S**, bukan literal di dalam rumus. Ikut `op1screen-genericize-widget`.

**Config nyusul, bukan duluan.** Type baru yang belum dikenal renderer bikin widget-nya di-*drop* diam-diam — halaman kelihatan jalan tapi bolong. Baris Widget + page ditulis **setelah** renderer landing.

## 7. Deliverable dev

**dev Flutter (renderer):**

1. Register type `DIGIT_PAD` sebagai **form-field family** (punya `position`, ikut siklus form seperti TXF).
2. **Tentukan jumlah kotak** (§2.2), urutannya:
   - baca `digitsField` / `digitsRedField` dari doc `meter`
   - **ada** → render kotak terkunci. `digitsMode:"editable"` → tampilkan tautan segmen 10 yang membuka pemilih
   - **kosong / `0` / doc tidak ketemu** → render **pemilih** (segmen 8, 9, 11 + `digitsOptions` / `digitsRedOptions`), kotak digit belum muncul sampai dipilih. Berlaku di kedua `digitsMode`
   - apa pun jalurnya: tulis hasilnya ke `digitsPosition` / `digitsRedPosition`, dan `config`/`field` ke `digitsSourcePosition`
   - ganti pilihan → **kosongkan angka yang sudah diketik**, jangan dipotong dari kanan
3. Render kotak: **hitam** sebanyak jumlah hitam, lalu **merah** sebanyak jumlah merah, dengan **koma di antaranya**. Merah `0` → nol kotak merah, nol koma (perilaku titik satuan m³).
4. Numpad milik sendiri: 1-9, 0, hapus. **Blokir keyboard sistem.** Nol koma, nol minus, nol titik.
5. Baca doc `meter` sekali saat halaman load (bukan tiap ketikan). Simpan `pv`, `avg`, `dgh`, `dgm`.
6. Vonis jalan **saat kotak terakhir keisi**, dan **dihitung ulang tiap perubahan** setelahnya:
   - `nilai < pv` → **mundur**
   - `nilai - pv > avg × spikeMultiplier` → **lonjakan**
   - selain itu → **masuk akal**
   - `compareField` kosong / doc gak ketemu / `pv` kosong → **nol vonis** (diam, bukan error)
7. `blockOnBackward:"TRUE"` **dan** vonis mundur → matikan tombol submit halaman + tampilkan `text` segmen 5. Semua kondisi lain: tombol hidup. **Pemilih digit belum diisi juga mematikan submit** — kotaknya belum ada, jadi tidak ada angka yang sah untuk dikirim.
8. ~~Pembanding OCR (opsional, boleh nyusul setelah #1-7 jalan): kalau `photoPosition` **dan** `ocrPattern` keisi → baca file foto itu on-device (ML Kit Latin), ambil token pertama yang cocok pola, **bandingkan** ke nilai ketikan. Beda → tampilkan segmen 6. Sama → **jangan tampilkan apa pun**.~~ **DIBATALKAN 2026-08-25 (keputusan user).** Typo sudah ditangkap vonis mundur + lonjakan; OCR angka cuma jaring ketiga. OCR **dipindah tugas** jadi pemeriksa **nomor seri** — lihat `docs/meter-serial-verify-dev-spec.md`. `ocrPattern` **pensiun**, renderer abaikan. `photoPosition` **tetap dipakai** oleh spec baru itu. Aturan **"hasil OCR tidak pernah nulis ke kotak digit"** tetap berlaku mutlak.
9. Nol string hardcode — semua tulisan dari `text`, semua angka di dalamnya lewat token `{}` §3.1.

**builder op1Screen (setelah renderer landing):**

10. Tulis baris Widget `digitPad` (kolom I + J + salin rumus G/H).
11. Pasang di page `MeterRead` dan `MeterSurvey`, param di kolom G..Z.
12. Sambungkan `digitsPosition` / `digitsRedPosition` / `digitsSourcePosition` ke `addToEvent` → `dgh◼◁9▷⭘dgm◼◁13▷⭘dgs◼◁14▷`, biar CF punya bahan menyimpan config titik (§2.2 aturan 1).

**dev Go (CF):** simpan `dgh`/`dgm` **kalau doc belum punya**, jangan timpa kalau sudah ada; simpan `dgs` apa adanya. Delta-nya di `docs/meter-cf-delta-2026-08-20.md`.

## 8. Dictionary — field baru

| Field | Tab | Tipe | Default | Makna |
|---|---|---|---|---|
| `digitsField` | widget | string | — | Nama field jumlah kotak **hitam** di doc sumber |
| `digitsRedField` | widget | string | — | Nama field jumlah kotak **merah**; `0` = site satuan m³ |
| `digitsPosition` | widget | string (`◁N▷`) | — | Slot **keluaran** jumlah kotak hitam yang berlaku; selalu diisi widget |
| `digitsRedPosition` | widget | string (`◁N▷`) | — | Slot keluaran jumlah kotak merah; selalu diisi widget |
| `digitsMode` | widget | string enum | `auto` | `auto` = kunci kalau config ada · `editable` = bisa dibuka lewat segmen 10 |
| `digitsOptions` | widget | string (`◆`) | — | Pilihan jumlah kotak hitam |
| `digitsRedOptions` | widget | string (`◆`) | — | Pilihan jumlah kotak merah |
| `digitsSourcePosition` | widget | string (`◁N▷`) | `""` | Slot keluaran asal-usul config: `config` atau `field` |
| `compareField` | widget | string | `""` | Field nilai pembanding (bacaan terakhir) |
| `avgField` | widget | string | `""` | Field rata-rata pemakaian |
| `spikeMultiplier` | widget | number | `4` | Pengali rata-rata buat ambang lonjakan |
| `blockOnBackward` | widget | string bool | `FALSE` | `TRUE` = vonis mundur mematikan submit |
| `photoPosition` | widget | string (`◁N▷`) | `""` | Slot foto buat pembanding OCR |

Field collection `meter`: `dgh` (kotak hitam) · `dgm` (kotak merah) · `dgs` (asal config: `config`/`field`) · `pv` · `avg` · `msn`. ⚠️ `dg` tunggal **tidak dipakai lagi** — diganti pasangan `dgh`/`dgm` (§2.1). ⚠️ `sn` sudah kepakai di `location` sebagai **site name**, jadi nomor seri meter **tidak boleh** pakai `sn`.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Render kotak + numpad (§7.1, 7.3-4) | dev Flutter | PROPOSED |
| **Pemilih digit + tulis-balik config (§7.2)** | dev Flutter | **BARU rev d** |
| Baca doc + vonis 3-tier (§7.5-6) | dev Flutter | PROPOSED |
| Gerbang submit (§7.7) | dev Flutter | PROPOSED |
| ~~Pembanding OCR (§7.8)~~ | dev Flutter | **DIBATALKAN 2026-08-25** → diganti verifikasi nomor seri, spec terpisah |
| Collection `meter` + `meter_reading` | dev Go (CF) | spec terpisah |
| `onMeterReadingWrite` → update `pv`/`avg` | dev Go (CF) | spec terpisah |
| Baris Widget + 4 page | builder op1Screen | nunggu renderer |
| Kode field `meter` | dict book | OPEN |

## 10. v1 scope & Not Doing (dan kenapa)

**v1 =** §7.1-7. ~~Pembanding OCR (§7.8) boleh nyusul tanpa ngubah layar sama sekali.~~ §7.8 **dibatalkan 2026-08-25** — lihat `docs/meter-serial-verify-dev-spec.md`.

**Not doing:**
- **Keyboard sistem** — justru sumber bug yang mau dibunuh (kelebihan digit, koma nyasar).
- ~~**Kotak buat digit merah/liter**~~ — **DICABUT 2026-08-19.** Keputusan #14 direvisi product 18 Agu: digit merah **dipakai** di site yang ditagih lebih halus dari m³. Lihat §2.1. Baris ini sengaja ditinggal tercoret supaya tidak ada yang mengembalikannya dari ingatan.
- **Desimal / koma / minus** — meter air bilangan bulat naik.
- **OCR mengisi kotak** — dibalik oleh product (#6). Jangan "dibantu dikit" — begitu kotak keisi duluan, kontrol double-entry-nya mati.
- **Ambang lonjakan adaptif per-unit** — v1 pakai `avg × spikeMultiplier`. Adaptif butuh riwayat beberapa bulan yang belum ada. ⚠️ Risiko kalibrasi ada di §12.
- **Lebih dari satu meter dalam satu widget** — satu widget satu angka. Meter berderet di satu panel = beberapa titik, beberapa halaman.
- **Blokir selain mundur** — lonjakan **tidak pernah** memblokir. Kebocoran itu nyata dan justru harus kelaporan.
- **Pemilih digit yang hasilnya tidak disimpan.** Kalau pilihan petugas cuma hidup satu sesi, tiap bulan dia memilih ulang dari nol — 400 unit × 12 bulan, dan salah digit tidak terlihat siapa pun. Pemilih **wajib** dipasangkan dengan tulis-balik (§2.2 aturan 1). Salah satunya saja lebih buruk daripada tidak ada dua-duanya.
- **Ketik bebas jumlah digit.** Pemilih isinya `digitsOptions`, bukan input angka. Yang mau dicegah justru angka yang tidak masuk akal.

## 11. Acceptance

- [ ] `digits`=5 → tepat 5 kotak. Ketik angka ke-6 → **tidak ada yang terjadi** (bukan error, bukan geser).
- [ ] Keyboard sistem tidak pernah muncul. Tidak ada cara memasukkan koma/titik/minus.
- [ ] Isi 5 digit, nilai > `pv`, selisih wajar → vonis hijau segmen 2, angka `{delta}` benar, **bottom sheet TIDAK naik**.
- [ ] Selisih > `avg × 4` → **sheet naik sendiri** dengan segmen 3, **tombol simpan tetap hidup**.
- [ ] Sheet ditutup → baris ringkas tetap ada dan **bisa ditap** untuk membuka sheet lagi; statusnya tidak hilang.
- [ ] Tombol segmen 13 ditekan → sheet tutup, angka **tersimpan apa adanya**, bacaan ditandai.
- [ ] `blockOnBackward:"TRUE"` + vonis mundur → tombol segmen 13 **tidak ada** di sheet, yang muncul pesan segmen 5.
- [ ] Nilai < `pv`, `blockOnBackward:"FALSE"` → vonis merah segmen 4, **tombol simpan tetap hidup**, nilai tersimpan apa adanya.
- [ ] Nilai < `pv`, `blockOnBackward:"TRUE"` → tombol simpan **mati** + pesan segmen 5. Perbaiki angka → tombol hidup lagi.
- [ ] `compareField:""` → nol vonis, nol blokir, kotak tetap jalan normal.
- [ ] `search` nol hasil (doc `meter` belum ada) → nol vonis, **bukan crash, bukan spinner nyangkut**.
- [ ] Doc punya `dgh:4`, `dgm:1` → 4 kotak gelap + koma + 1 kotak merah. Ketik `00115` → tampil `0011,5`, `position` terkirim **`115`**.
- [ ] `digitsMode:"auto"` + config ada → **tidak ada pemilih, tidak ada tautan** di layar.
- [ ] `digitsMode:"editable"` + config ada → tautan segmen 10 ada; ditap → pemilih terbuka.
- [ ] Doc **tidak punya** `dgh` → pemilih muncul sendiri, kotak digit belum ada, **tombol simpan mati** sampai dipilih.
- [ ] Setelah memilih 5+2 → `digitsPosition` terkirim `5`, `digitsRedPosition` `2`, `digitsSourcePosition` **`field`**.
- [ ] Config datang dari doc, petugas tidak menyentuh apa pun → tiga slot itu **tetap terkirim**, `digitsSourcePosition` = **`config`**.
- [ ] Sudah ketik 3 angka lalu ganti pilihan digit → **isian kosong total**, bukan dipotong dari kanan.
- [ ] Bulan berikutnya titik yang tadi dipilih di lapangan → pemilih **tidak muncul lagi** (CF sudah menyimpan `dgh`/`dgm`).
- [ ] Nilai terkirim **Number** — `00987` → `987`. Cek di Firestore, bukan cuma di UI.
- [ ] Kotak setengah keisi → `position` kosong, bukan angka parsial.
- [ ] ~~`photoPosition`/`ocrPattern` kosong → nol ML Kit dipanggil, nol delay.~~ ~~OCR beda → segmen 6 muncul.~~ **Dua baris ini pindah** ke `docs/meter-serial-verify-dev-spec.md` §11 dengan bunyi yang berbeda.
- [ ] Nol string hardcode di Flutter — ganti `text` di sheet, semua tulisan ikut berubah.

## 12. Asumsi & risiko (belum divalidasi)

- [x] ~~**Jumlah digit seragam di tiap site?**~~ **TERJAWAB 20 Agu — TIDAK.** Foto meter AMICO dari lapangan: **4 hitam + 1 merah**, di site yang config-nya 5+0. Satu meter menyimpang sudah cukup bikin tagihan unit itu meleset 100×, dan tidak ada pemeriksaan lain yang menangkapnya. Konsekuensi sudah masuk rancangan: config **per titik** (bukan per site) + pemilih di lapangan + `dgs` buat menandai mana yang belum diverifikasi (§2.2). **Yang masih terbuka: berapa banyak titik yang menyimpang** — baru ketahuan setelah putaran nol jalan, dan itu wajar.
- [ ] **ML Kit bisa baca roda angka mekanik** (drum), bukan cuma 7-segment. Belum diuji. **Langkah 0 = spike 30 foto asli, ukur hit-rate** sebelum §7.7 dibangun. Foto lapangan juga sering ada **watermark ke-bakar** (nama, koordinat, tanggal) yang ikut kebaca dan bisa kepilih.
- [x] ~~**Renderer bisa baca `◁N▷` widget lain saat runtime**~~ **TERJAWAB 20 Agu — TIDAK BISA, terbukti di lapangan.** Config lama memberi jumlah kotak lewat `digitsPosition` yang menunjuk slot milik `SELECTABLE_BTN` di halaman yang sama. Petugas memilih `5`, **widget tidak pernah merender** — tidak ada judul, tidak ada kotak, tidak ada error. Dugaan: slot dibaca sekali saat halaman load (waktu masih kosong) dan tidak pernah dibaca ulang — kelas kegagalan yang sama dengan `search` yang tidak bisa membaca `◁N▷`.
  **Ini sudah tidak relevan untuk rev d+**, karena jalur itu memang dicabut: `digitsPosition` sekarang **keluaran**, dan jumlah kotak datang dari doc atau dari pemilih **milik widget ini sendiri** (§2.2). Tidak ada lagi widget yang membaca slot widget lain. Dicatat di sini supaya tidak ada yang mencoba menghidupkannya lagi.
  ⚠️ **`photoPosition` masih memakai pola yang sama** (membaca slot `getImages1`). Kalau temuan di atas berlaku umum, apa pun yang dibangun di atas foto akan diam-diam mati dengan cara yang persis sama. **Masih terbuka per 2026-08-25** — pembatalan §7.8 tidak menghapus risiko ini, cuma memindahkannya: verifikasi nomor seri memakai `photoPosition` yang sama. Uji **sebelum** membangun, bukan sesudah — `docs/meter-test-scenarios.md` A1.
- [ ] **Penjaga pemetaan mati di putaran nol.** Handoff #21 mengandalkan seed spreadsheet Paskal sebagai pembanding; seed itu **ada di Paskal tapi belum di tangan kita**. Sampai masuk, `blockOnBackward:"TRUE"` tidak punya apa-apa buat memblokir. Itu sebabnya §7.5 mewajibkan "nol pembanding = diam", bukan error.
- [ ] **Ambang lonjakan salah kalibrasi = semua pemeriksaan mati.** Kalau kelewat sensitif, petugas belajar mengabaikan peringatan, dan begitu itu terjadi vonis mundur ikut diabaikan. `spikeMultiplier` sengaja config supaya bisa dinaikkan cepat tanpa rilis app.
- [ ] **Kode field `meter`** (`dg`/`pv`/`avg`/`msn`) masih usulan — belum lewat dict book.

---

**Referensi:** `docs/handoff-meter-pascal.md` (keputusan product #6/#13-17/#21) · `docs/titik-patroli-app-first-location-dev-spec.md` (schema `location`: `li`/`lk`/`ln`/`sv`, `li` digenerate CF) · `docs/scanner-widget-dev-spec.md` (halaman sebelumnya — QR nentuin titik) · `docs/ocr-capture-widget-dev-spec.md` (arah lama, disupersede untuk meteran; tetap berlaku untuk invoice) · `docs/widget-docs/README.md` (index widget + status renderer) · skill `op1screen-genericize-widget` (pola generic+SUBSTITUTE).
