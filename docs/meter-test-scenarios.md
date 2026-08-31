# Skenario Tes — Vertikal Meter Paskal

**Tanggal:** 2026-08-21 · **direvisi 2026-08-25** (Bagian A ditulis ulang — §7.8 dibatalkan, OCR pindah ke nomor seri)
**Buat:** yang ngetes di lapangan (bukan dev)
**Titik uji:** `BSD Tech Center #18` · site `Product Group` (`sv 83674161979544`) · tenant `Agenia Demo-7`
**Keadaan titik sekarang:** `pv 39010` · `dgh 5` · `dgm 0` · `due 202609` · `hs` baru 1 elemen (`{prd:202608, sd:39010}`)

---

## Kenapa dokumen ini ada

Di fitur ini **diam itu ambigu.** Tiga sebab yang beda-beda menghasilkan layar yang sama persis — tidak ada peringatan:

1. Semuanya benar, memang tidak ada yang perlu diperingatkan.
2. Mekanismenya rusak, gagal diam-diam.
3. Bagiannya memang belum dibangun.

Jadi tes yang bunyinya *"coba lihat jalan atau nggak"* tidak pernah bisa menyimpulkan apa pun. **Tiap skenario di bawah dirancang untuk MEMAKSA satu peringatan muncul** — kalau yang dipaksa tidak muncul, itu baru bukti.

Sudah pernah kejadian: `digitsPosition` gagal total selama berhari-hari dan gejalanya cuma "widget-nya nggak muncul", yang saat itu dikira "renderer belum dibangun". Bukan.

---

# BAGIAN A — mekanisme foto & verifikasi nomor seri

> ⚠️ **BERUBAH 2026-08-25.** Dulu bagian ini menguji "OCR baca **angka**, dibandingkan dengan yang diketik" (§7.8). **§7.8 dibatalkan.** OCR pindah tugas: sekarang memeriksa **nomor seri**, buat menangkap petugas yang berdiri di meteran unit lain. Spec barunya `docs/meter-serial-verify-dev-spec.md`.
>
> Yang **tidak** berubah: mekanismenya. `digitPad` tetap harus bisa membaca slot foto milik `getImages1` lewat `photoPosition`. Pola itu **sudah pernah gagal senyap** (`digitsPosition`, 20 Agu). Jadi A1 di bawah tetap tes yang paling penting — cuma sekarang dia menguji **mekanismenya langsung**, bukan lewat hasil OCR.

## A1. 🔴 Tes pondasi — apakah slot foto kebaca sama sekali

**Ini duluan. Semua tes lain di bagian A percuma kalau ini gagal.**

Minta dev pasang tampilan sementara: `digitPad` menampilkan isi mentah slot `photoPosition` di layar — di bawah kotak digit, kecil, apa saja. ~15 menit kerja, dibuang lagi setelah tes.

Buka `MeterRead` → titik `BSD Tech Center #18`. Lihat tampilan itu sebelum dan sesudah ambil foto.

| Sebelum foto | Sesudah foto | Artinya |
|---|---|---|
| kosong | **terisi** (URL/path) | ✅ Mekanisme hidup. Lanjut A2. |
| kosong | **tetap kosong** | 🔴 **Slot tidak pernah dibaca ulang** — kegagalan yang sama persis dengan `digitsPosition`. **Berhenti, kabari dev.** Verifikasi seri tidak bisa dibangun di atas mekanisme ini. Perlu jalan lain (OCR di dalam widget foto sendiri), dan itu **keputusan produk baru**, bukan perbaikan bug. |

## A2. 🔴 Tes frame — apakah nomor serinya ikut kefoto

Tidak perlu app, tidak perlu dev. **Buka 10 foto "Foto Muka Meter" yang sudah pernah diambil di lapangan** dan lihat sendiri.

| Yang kelihatan | Artinya |
|---|---|
| Nomor seri kebaca di sebagian besar foto | ✅ Lanjut. |
| Nomor seri kepotong / buram / kekecilan | ⚠️ Ukur berapa dari 10. Di bawah 7 → laporkan angkanya, jangan diteruskan diam-diam. |
| Nomor seri **tidak pernah** masuk frame — adanya di badan meteran, bukan di muka | 🔴 **Seluruh fitur gugur.** Perlu foto kedua khusus nomor seri. Keputusan produk, bukan urusan dev. |

## A3. Verifikasi seri — ⚠️ BELUM BISA DITES SEKARANG

Butuh `msn` sudah terisi di doc `meter`. Seluruh titik sekarang `msn`-nya **kosong** — seed 400 titik Paskal belum masuk.

Sampai seed ada, pemeriksaan ini **diam di semua titik**, dan itu **perilaku yang benar** (`msn` kosong = tidak ada pembanding = diam). Jangan dilaporkan sebagai bug.

Kalau mau dites duluan tanpa nunggu seed: minta dev Go isi `msn` di **satu** doc uji saja, pakai nomor seri asli meteran `BSD Tech Center #18`.

Setelah `msn` ada:

| # | Langkah | ✅ Jalan | ❌ Mati |
|---|---|---|---|
| A3a | Foto meteran **yang benar** | Tidak ada apa-apa di layar | Peringatan muncul padahal meterannya benar → catat, ini false alarm |
| A3b | Foto meteran **unit lain** | Bottom sheet: *"Nomor seri di foto tidak cocok dengan yang tercatat (…)"*, dan yang ditampilkan nomor seri **tercatat**, bukan yang di foto | Diam saja |
| A3c | Setelah A3b, cek tombol simpan | **Masih hidup** — v1 cuma memperingatkan (`blockOnSerialMismatch:"FALSE"`) | Mati → config-nya salah, harusnya `FALSE` dulu |
| A3d | Ganti fotonya dengan yang benar | Peringatan **hilang** | Nempel di hasil foto pertama → vonis tidak dihitung ulang |

**Kalau A3a sering false alarm, itu temuan penting — catat berapa dari 10.** Angka itu yang menentukan `blockOnSerialMismatch` boleh dinaikkan jadi `TRUE` atau tidak.

## A4. Titik tanpa nomor seri harus lolos diam-diam

Ambil titik yang `msn`-nya **kosong** (sekarang: semua titik). Foto, ketik angka, simpan.

| Yang muncul | Artinya |
|---|---|
| Tidak ada apa-apa, tersimpan normal | ✅ Benar. Meteran tanpa nomor seri memang harus lolos. |
| Peringatan seri muncul | 🔴 Kebalik — `msn` kosong dipakai sebagai pembanding. Kabari dev. |
| Di kartu detail atas, baris "Nomor meter" **hilang** | ✅ Benar, `hideEmptyRows:"TRUE"` |

## A5. Pastikan OCR tidak pernah MENGISI

Buka `MeterRead`, ambil foto, **jangan ketik apa-apa**.

| Kotak digit | Artinya |
|---|---|
| Tetap kosong | ✅ Benar. OCR memeriksa, tidak pernah mengisi (v3 #6). |
| Terisi otomatis dari foto | 🔴 **Arahnya kebalik.** Hentikan, kabari dev. Kalau kotak keisi sendiri, petugas tinggal tap-lanjut tanpa membaca meternya — dan hilirnya tagihan tenant. |

Cek juga di Firestore: `msn` **tidak boleh** ikut tertulis dari hasil OCR. `msn` itu fill-if-empty — sekali salah kecatat, salah selamanya.

---

# BAGIAN B — foto wajib (`optional`)

Sisi sheet **sudah terpasang** — `optional:"FALSE"` live di baris 1529 (`MeterRead`) dan 1540 (`MeterSurvey`). Tinggal nunggu renderer menyelesaikan `docs/get-images-required-dev-spec.md`.

| # | Langkah | ✅ Jalan | ❌ Mati |
|---|---|---|---|
| B1 | `MeterRead`, isi angka, **jangan foto**, tekan "Simpan & lanjut" | Ditolak + pesan *"Foto muka meter belum diambil"*. Tidak pindah halaman. | Tersimpan diam-diam |
| B2 | Setelah B1 ditolak, cek kotak digitnya | Angka yang tadi diketik **masih ada** | Kosong lagi → petugas harus ngetik ulang, akan dibenci |
| B3 | Foto, lalu simpan | Tersimpan normal | — |
| B4 | Tombol **"Tidak bisa dibaca"** → pilih alasan → "Simpan alasan", tanpa foto | Ditolak juga | Lolos → jalur gagal jadi celah |
| B5 | **Buka page lain yang punya kotak foto** (mana saja di luar meter) | Kotak fotonya **masih muncul**, masih boleh dikosongkan | 🔴 Kotaknya hilang → nilai `[OPTIONAL]` bikin widget di-drop. **Paling gawat di daftar ini** — kena banyak page sekaligus. |

**B5 wajib dites.** Sisi sheet sengaja tidak menyisir semua pemakaian `getImages1` (keputusan 2026-08-21), jadi page lain akan mengirim `"optional":"[OPTIONAL]"`. Renderer harus diam saja menghadapinya.

---

# BAGIAN C — pemeriksaan riwayat (sudah jalan, belum pernah diuji tuntas)

Dua pemeriksaan ini **tidak butuh foto sama sekali** — membaca doc `//meter`.

## C1. Bacaan normal

`MeterRead` → `BSD Tech Center #18` → ketik **`39047`** (naik 37 dari 39010) → simpan.

| ✅ | Tersimpan. Tidak ada peringatan. Cek Firestore: `pv` jadi `39047`, `hs` nambah 1 elemen. |
|---|---|
| ❌ | Ada peringatan padahal kenaikannya wajar |

## C2. Angka mundur

Ketik **`38900`** — lebih kecil dari `pv`.

| ✅ | Peringatan *"Angka lebih kecil dari 39010…"*. **Tetap boleh disimpan** (`blockOnBackward:"FALSE"`) — petugas selalu menang, angkanya cuma ditandai. |
|---|---|
| ❌ | Diam saja, atau malah memblokir |

## C3. Lonjakan — ⚠️ BELUM BISA DITES SEKARANG

Pemeriksaan ini butuh `avg`, dan `avg` butuh **dua periode berbeda** di `hs`. Titik ini baru punya satu (`{202608, 39010}`).

Bacaan kedua di bulan yang sama **tidak menambah** — `prd`-nya sama, CF dedupe by `prd`, yang terbaru menang. Jadi `hs` tetap 1 elemen berapa kali pun kamu simpan hari ini.

Tiga jalan:

| Cara | Ongkos |
|---|---|
| **Tunggu September** | Nol kerja, tapi lama |
| **Minta dev Go nyuntik 1 elemen `hs` palsu** di doc uji | Paling bersih buat tes, doc uji doang |
| Ubah sel `prd` di sheet ke bulan lampau, simpan, balikin | ⚠️ **Jangan.** `due` ikut bergeser mundur dan titiknya bisa nyangkut — merusak data uji yang lain |

Setelah `avg` ada (misal `55`), ambangnya `55 × 4 = 220`:

| Ketik | Selisih | Harusnya |
|---|---|---|
| `39100` | 53 | diam |
| `39280` | 233 | ⚠️ peringatan lonjakan |

## C4. Tidak bisa dibaca

Tombol **"Tidak bisa dibaca"** → bottom sheet muncul → pilih *"Box meter terkunci"* → "Simpan alasan".

| ✅ | Tersimpan. Firestore: `mo` jadi `"failed"`, `sd` **kosong**, `d` berisi alasannya. Kembali ke `MeterRound`, kartunya dapat badge *"Gagal dibaca"*. |
|---|---|
| ❌ | `sd` terisi `0` (bukan kosong) → nanti dihitung sebagai bacaan nyata dan merusak `avg` |

## C5. Toggle mode-b (tanpa QR)

Sel `AG1510` di `op1Screen 16072026` → ganti `mode-a` jadi `mode-b`. Tunggu app refresh.

| ✅ | Tombol **"Scan meter"** di `MeterRound` **hilang**. Daftarnya tetap ada, tap kartu tetap masuk ke `MeterRead`. Event yang tersimpan berisi `mm:"mode-b"`. |
|---|---|
| ❌ | Tombolnya masih ada, atau daftarnya ikut hilang |

Balikin ke `mode-a` setelah selesai.

---

# Urutan yang disarankan

1. **A2** — sekarang juga. Cuma buka folder foto lapangan, nol dependensi, dan hasilnya bisa membatalkan seluruh fitur seri.
2. **C1, C2, C4, C5** — sekarang. Tidak nunggu siapa-siapa.
3. **A1** — begitu dev pasang tampilan sementara. 🔴 **Hasilnya menentukan verifikasi seri bisa dibangun atau tidak** — dahulukan di atas apa pun yang lain di daftar dev.
4. **B1–B5** — begitu renderer `optional` selesai.
5. **A3, A4, A5** — nunggu seed `msn` masuk.
6. **C3** — paling akhir, atau September.

---

# Yang perlu dilaporkan balik

Buat tiap tes yang gagal, tiga hal ini saja sudah cukup buat dilacak:

1. Nomor tesnya (mis. `A1`)
2. Angka yang diketik dan angka yang ada di foto
3. Yang muncul di layar — atau tulis **"tidak ada apa-apa"** kalau memang tidak ada. Ini bukan jawaban kosong; buat fitur ini, "tidak ada apa-apa" itu justru temuan.

---

**Referensi:** `docs/meter-serial-verify-dev-spec.md` (verifikasi nomor seri — **menggantikan §7.8**) · `docs/digit-pad-widget-dev-spec.md` §12 (kenapa `photoPosition` dicurigai) · `docs/get-images-required-dev-spec.md` (foto wajib) · `handoff-meter-pascal-v3.md` #5 #6 #17 · `docs/meter-outstanding-cf-delta.md` (belum dites, nunggu cron).
