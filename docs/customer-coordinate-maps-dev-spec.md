# Titik Koordinat Pelanggan + Navigasi Google Maps (Dev Spec)

**Tanggal:** 2026-08-26 · **revisi terakhir 2026-08-27**
**Buat:** dev Flutter (renderer) — 3 bagian terpisah (A ✅ · B ✅ dengan 1 bug · C ⬜ baru)
**Status:** SEBAGIAN LIVE — baca §10 dulu buat tau apa yang masih perlu dikerjain
**Konteks / Konsumen pertama:** galon VTL (tenant `20342033315492`, coll `84214220504259`). Admin isi titik pelanggan di **Pelanggan Baru** (`vertikaTeknoLokaciptaNewCustomer`, op1Screen 729) → sopir tap **📍 Lihat Lokasi** di **Rute Hari Ini** (`DRIVER_STOP_CARD`, op1Screen 547).

> **Buat dev yang baru buka file ini:** yang masih jadi kerjaan cuma tiga — **(1) bug denorm `la`/`lo` kosong**, bukti + diagnosis di **§14 no.1**; **(2) Bagian C**, tombol yang sama di 2 layar lain, di **§13**; **(3) rapiin UI kartu sopir** di **§13.5**. Sisanya udah jadi dan dicatat sebagai riwayat.
**Referensi:** `docs/map-point-picker-widget-dev-spec.md` · `docs/driver-stop-card-dev-spec.md` · `docs/driver-runtime-field-dictionary.md`

---

## 1. Kenapa

Sopir sekarang cuma dapat **alamat teks** (`task.al`). Alamat tulisan tangan admin sering gak ketemu di Maps ("Jl. Merdeka No. 5, belakang Indomaret") — sopir nyari sendiri, telat, atau nelpon pelanggan.

Yang dibutuhin: **titik koordinat asli per pelanggan**, disimpan sekali waktu pelanggan dibuat, lalu dipakai sopir buat buka Google Maps langsung ke titik itu.

Dua bagian yang saling lepas — bisa dikerjain terpisah dan dirilis terpisah:

| | Bagian | Butuh apa | Status |
|---|---|---|---|
| **A** | Admin nyimpen koordinat pelanggan | renderer `MAP_POINT_PICKER` + config | ✅ **selesai 2026-08-26/27** |
| **B** | Sopir buka Google Maps dari DriverHome | field `mapsUrl` di `DRIVER_STOP_CARD` | ✅ renderer + config selesai · 🐞 **1 bug: §14 no.1** |
| **C** | Tombol yang sama di TaskFeed + DeliveryWorkspace | `mapsUrl` di 2 widget lain | ⬜ **nunggu dev — §13** |

**Bagian B bisa dirilis tanpa nunggu semua pelanggan punya koordinat** — pelanggan lama jatuh ke alamat teks sebagai cadangan (§6.1). Akurasinya kalah, tapi langsung kepakai hari ini.

---

## 2. Konsep

`stock_location` **sudah punya** field `la` (latitude) dan `lo` (longitude) di kamus — tinggal diisi. Alurnya:

```
Admin: Pelanggan Baru
   └─ MAP_POINT_PICKER  ──► la, lo  ──► stock_location (doc pelanggan)
                                            │
Admin: Buat Order (wizard 4 langkah)        │ denorm saat tugas dibuat
   └─ TASK_CREATE_SUBMIT ───────────────────┘
                                            ▼
                                        task.la, task.lo
                                            │
Sopir: Rute Hari Ini                        │
   └─ DRIVER_STOP_CARD ─[📍 Lihat Lokasi]───┴──► Google Maps
```

🐞 **Panah yang putus sekarang ada di langkah `TASK_CREATE_SUBMIT`** — `al` nyampe ke `task`, tapi `la`/`lo` ketulis kosong. Bukti + diagnosis di §14 no.1.

Koordinat **di-denorm ke `task`** (bukan di-join runtime dari `stock_location`), ikut pola yang sudah ada — `kn` dan `al` juga sudah didenorm ke task. Alasannya: sopir sering sinyal jelek, kartu rute harus bisa render tanpa query kedua.

---

## BAGIAN A — Admin nyimpen koordinat ✅ SELESAI (config), 2026-08-26

### 3. Widget yang dipakai: `MAP_POINT_PICKER` — dipakai apa adanya

**Nol perubahan kontrak.** `MAP_POINT_PICKER` (spec 2026-07-17, renderer sudah landing) dipakai persis seperti di halaman **Tambah Titik Lokasi** (`vertikaTeknoLokaciptaTitikPatroli`, op1Screen 877). Sepuluh parameternya sudah cukup buat kasus pelanggan — yang beda cuma nomor posisi form dan tujuan tulisnya (`stock_location`, bukan `location`).

Dibandingkan kebutuhan sekarang, satu-satunya hal yang **belum** ditanggung kontrak sekarang: **prefill titik yang sudah ada** (buat layar Edit Pelanggan). `currentValue` di template dipatok `""`, jadi picker selalu mulai dari kosong. Detail di §12.

### 4. Contoh resolved — `MAP_POINT_PICKER` @NewCustomer

```json
{"type":"MAP_POINT_PICKER","label":"Titik di Peta","position":18,"addressPosition":"21","latPosition":"19","lngPosition":"20","currentValue":"","initialCenter":"","zoom":17,"searchEnabled":"TRUE","searchCountry":"id","text":"Belum ada titik — sopir cuma dapat alamat tulisan◆📍 Lokasi Saya◆🗺️ Cari di Peta◆Ganti Titik◆Cari alamat / tempat…◆Pakai Titik Ini◆Mencari lokasi…◆GPS gagal — cek izin lokasi◆Jaringan bermasalah, coba lagi"}
```

Posisi form di halaman Pelanggan Baru yang **sudah kepakai**: 11 (Jenis) · 12 (Nama) · 14 (Nama Kontak) · 15 (Kontak) · 17 (No. Pelanggan). Yang dipakai widget ini: **18** (nilai `"lat,long"`), **19** (lat), **20** (lng), **21** (alamat hasil reverse-geocode) — semua kosong sebelumnya.

### 4.1 Field Alamat manual DIMATIKAN (revisi 2026-08-27)

Keputusan user: **peta jadi satu-satunya sumber alamat.** Field Alamat manual (`3LineBorderForm`, posisi 13, op1Screen 734) di-set `Displayed = FALSE` — masih ada di sheet, tapi gak ikut ke page JSON.

Alasannya: `MAP_POINT_PICKER` sudah punya `addressPosition` yang otomatis ngisi alamat dari reverse-geocode titik yang dipilih. Dua sumber alamat = redundan, dan alamat tulisan tangan admin justru yang bikin sopir nyasar (§1).

| | Sebelum | Sesudah |
|---|---|---|
| Field Alamat manual (pos 13) | tampil, admin ngetik | **hidden** (`F734=FALSE`) |
| `addressPosition` | `""` (sengaja kosong) | `"21"` |
| `al` di `addToEvent` | `◁13▷` (ketikan admin) | `◁21▷` (reverse-geocode peta) |

Posisi 13 dibiarkan nempel di baris yang di-hidden (bukan dipakai ulang) — kalau suatu hari field Alamat manual mau dinyalain lagi, cukup balik `F734` ke `TRUE`, nol tabrakan posisi.

### 5. Yang ditulis ke database

Submit `sendButtonGpsWithEvent` @NewCustomer (op1Screen 739) — `addToEvent` ada di helper **`Q739`**, bukan literal di kolom D (pola generic, resolver `D739` yang nyusun).

`addToEvent` lengkap (LIVE 2026-08-27):

```
84214220504259//stock_location⭘r◼4320⭘tablevid◼20342033315492⭘lt◼client⭘ty◼◁11▷⭘ln◼◁12▷⭘al◼◁21▷⭘la◼◁19▷⭘lo◼◁20▷⭘pic◼◁14▷⭘hpic◼◁15▷⭘lv◼{newCustomerId}⭘lst◼active⭘cv◼{userVid}⭘cn◼{userName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```

Tiga field yang datang dari `MAP_POINT_PICKER`: `al◼◁21▷` (alamat reverse-geocode) · `la◼◁19▷` (lat) · `lo◼◁20▷` (lng).

Nilai `la`/`lo` **selalu titik desimal 6 angka** apapun bahasa HP (`-6.302154` / `106.653428`) — ini kontrak `MAP_POINT_PICKER` yang sudah dikunci di spec-nya, khusus buat ngindarin korupsi koma-vs-titik locale id_ID.

**⚠️ Kalau admin skip peta:** sesudah revisi §4.1, `la`/`lo` **dan** `al` tiga-tiganya kosong — peta satu-satunya sumber alamat. Doc pelanggan lahir tanpa alamat sama sekali, tombol Navigasi di kartu sopir mati (§6.1 langkah 3), dan kartu cuma nampilin nama pelanggan.

Konsekuensinya: **peta praktis jadi wajib waktu bikin pelanggan.** Belum ada validasi yang maksa — kalau kejadiannya sering, tambahin `required` di picker atau gate di tombol submit (belum di-scope, lihat §12).

---

## BAGIAN B — Sopir buka Google Maps ✅ renderer + config SELESAI 2026-08-27 · 🐞 sisa 1 bug (§14 no.1)

### 6. Kontrak field baru — `DRIVER_STOP_CARD`

**Satu field, opsional.** Absent = perilaku sekarang persis, nol regresi.

```
mapsUrl
```

Isinya DSL keyed `key◼value⭘key◼value` — pola yang sama kaya `search` / `routeParams` / `addToEvent`, jadi parser-nya udah ada:

| key | isi | wajib? |
|---|---|---|
| `url` | template URL utama | ya |
| `fallback` | template cadangan kalau `url` ada token kosong | opsional |
| `empty` | pesan waktu tombol mati | opsional |

Contoh lengkap:

```
url◼https://www.google.com/maps/dir/?api=1&destination=<la>,<lo>&travelmode=driving⭘fallback◼https://www.google.com/maps/search/?api=1&query=<al>⭘empty◼Alamat belum lengkap
```

`<field>` di dalam template = field doc tugas, interpolasi persis kaya field lain (`<la>`, `<lo>`, `<al>`).

Label tombol = **segmen `text` ke-20** (`text` sekarang 19 segmen). Cuma nambah 1 segmen — pesan gagal udah nempel di key `empty`, gak perlu segmen ke-21.

```
…◆Buka Daftar Antar◆Tolak◆📍 Lihat Lokasi
   (18)              (19)  (20)
```

Label yang sama dipakai di **kedua mode** kartu (locked + unlocked) — lihat §6.4/§6.5.

> **Kenapa keyed, bukan 4 field kepisah.** Draf pertama spec ini minta `latField`/`lngField`/`mapsUrlTemplate`/`mapsFallbackTemplate`. Dua yang pertama mubazir — template URL-nya udah nyebut `<la>`/`<lo>` di dalam dirinya sendiri; `latField`/`lngField` cuma ngulang buat ngecek kosong, dan cek kosong bisa dibikin generic (§6.1). Keyed dipilih ketimbang ◆-positional karena `url` dan `fallback` dua-duanya URL yang mirip — ketuker urutan = bug senyap yang gak keliatan pas review config.

> Template URL sengaja **generik**, bukan flag `googleMaps:true`. Alasannya sama kaya aturan web-builder: jangan bake nama layanan ke renderer. Besok mau Waze / peta lain → ganti string di config, nol perubahan Flutter.

### 6.1 Perilaku tombol

Aturannya satu kalimat: **coba `url` dulu, pakai template pertama yang SEMUA token-nya keisi.**

1. Semua `<token>` di `url` keisi → buka `url`.
2. Ada token kosong di `url`, semua token `fallback` keisi → buka `fallback`.
3. `fallback` juga ada token kosong (atau gak diisi) → tombol **disabled** + tampilkan `empty`.

Cek kosong **generic** — jangan hardcode nama field `la`/`lo`/`al`. Token apapun yang nilainya kosong/null/whitespace = template itu gagal. Ini yang bikin `latField`/`lngField` gak perlu ada.

Semua nilai token **wajib di-URL-encode** waktu disisipin (alamat penuh spasi & koma).

Buka pakai external application (Android: intent ke app Google Maps kalau terpasang, jatuh ke browser kalau enggak; iOS sama). **Jangan** webview in-app — sopir butuh navigasi turn-by-turn beneran.

### 6.2 Format URL (Google Maps URLs API — stabil, resmi)

| Tujuan | URL |
|---|---|
| Navigasi ke koordinat | `https://www.google.com/maps/dir/?api=1&destination=-6.302154,106.653428&travelmode=driving` |
| Cari alamat teks | `https://www.google.com/maps/search/?api=1&query=Jl.%20Merdeka%20No.%205%20Bintaro` |

Koordinat dipisah koma **tanpa spasi**, titik desimal — sesuai kontrak §5.

### 6.3 Contoh resolved — `DRIVER_STOP_CARD` @DriverHome (op1Screen 547)

```json
{"type":"DRIVER_STOP_CARD","variant":"preview","vidtable":"20342033315492","table":"84214220504259//task","search":"tr◼{activeTrip}⭘tdt◼{today}","navState":"assigned","route":"vertikaTeknoLokaciptaTaskFeed","rejectRoute":"vertikaTeknoLokaciptaRejectTask","taskIdField":"tnm","gateTable":"84214220504259//vehicle_check","gateSearch":"cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}⭘cst◼custody_confirmed","icon":"local_shipping","iconLocked":"lock","nameField":"kn","addressField":"al","mapsUrl":"url◼https://www.google.com/maps/dir/?api=1&destination=<la>,<lo>&travelmode=driving⭘fallback◼https://www.google.com/maps/search/?api=1&query=<al>⭘empty◼Alamat belum lengkap","excludeStatus":"load_rejected","text":"Tujuan Berikutnya◆Dilaporkan Gagal◆Sudah Selesai◆Pilih sesuai kondisi lapangan◆Mulai Antar◆Selesai◆Pelanggan setuju◆Dilaporkan gagal — nunggu admin atur ulang◆kirim◆ambil◆Ambil Aja◆Rute Hari Ini◆{closed} dari {total} tujuan◆lanjut:◆semua kelar◆{total} tujuan◆Cek barang dulu buat mulai — ini tujuanmu hari ini:◆Buka Daftar Antar◆Tolak◆📍 Lihat Lokasi"}
```

### 6.4 UI

Sumber bentuk kartu: mockup React `HomeRouteCard` (`src/component/Driverruntimefull2.jsx` 3634). Kartunya **bukan** satu tujuan — dia container "Rute Hari Ini" berisi daftar stop, dengan 2 wajah.

**Tombol ada di TIAP baris stop, di KEDUA mode.** Gak ada pengecualian per-status — baris `Selesai` juga dapet. Aturan seragam = renderer nol cabang.

**LOCKED — custody belum confirmed**

```
+--------------------------------------------+
| [gembok] Rute Hari Ini                     |
|          3 tujuan                          |   <- text ◆16
+--------------------------------------------+
| Cek barang dulu buat mulai - ini tujuan lo |   <- text ◆17
| hari ini:                                  |
+--------------------------------------------+
|  1  Kopi Kenangan Bintaro                  |   <- nameField (kn)
|     Jl. Merdeka No.5 . 2 galon             |   <- addressField (al)
|     [ (pin) Lihat Lokasi ]     [ Tolak ]   |   <- ◆20 (BARU)   ◆19
|                                            |
|  2  Toko Budi                              |
|     Jl. Kenanga 12 . 1 galon               |
|     [ (pin) Lihat Lokasi ]     [ Tolak ]   |
|                                            |
|  3  Warung Sari                [ Selesai ] |   <- completed: chip, tanpa Tolak
|     Jl. Melati 3 . 3 galon                 |
|     [ (pin) Lihat Lokasi ]                 |   <- tetap dapet tombol
+--------------------------------------------+
| Ada stop nggak searah? Tolak sebelum       |
| berangkat - dikembalikan ke Admin.         |
+--------------------------------------------+
```

**UNLOCKED — sesudah konfirmasi muatan**

```
+--------------------------------------------+
| [truk] Rute Hari Ini                  65%  |
|        2 dari 3 . lanjut: Toko Budi        |   <- text ◆13/◆14/◆15
| ############--------                       |
+--------------------------------------------+
|  v  Kopi Kenangan              [ Selesai ] |
|     Jl. Merdeka No.5 . 2 galon             |
|     [ (pin) Lihat Lokasi ]                 |
|                                            |
|  2  Toko Budi                  [ Lanjut  ] |
|     Jl. Kenanga 12 . 1 galon               |
|     [ (pin) Lihat Lokasi ]                 |
+--------------------------------------------+
|        Buka Tasklist (eksekusi) ->         |   <- text ◆18
+--------------------------------------------+
```

**Koordinat + alamat dua-duanya kosong** — tombol mati, alasannya ditulis:

```
|  3  Warung Sari                            |
|     (alamat kosong)                        |
|     [ (pin) Lihat Lokasi ]  <- abu-abu     |
|     Alamat belum lengkap                   |   <- key `empty` di mapsUrl
```

### 6.5 Kenapa tombolnya juga ada di mode LOCKED

Ini **bukan** duplikasi — justru di sinilah fungsi utamanya.

Mode locked = layar tempat sopir mutusin **Tolak**. Keputusannya: *"stop ini searah gak sama rute gue?"* Tanpa peta, sopir disuruh nolak cuma modal alamat tulisan — persis masalah yang bikin fitur ini ada (§1). Jadi `[ Lihat Lokasi ]` itu **pasangannya `[ Tolak ]`**: lihat dulu, baru putusin.

Di mode unlocked tombolnya tetap ada buat pemakaian kedua: sopir udah jalan, mau cek ulang lokasi.

### 6.6 Catatan UI buat dev

- **Label pakai kata, jangan ikon doang.** Pengguna gaptek. Ikon kompas sendirian gak kebaca. Usul segmen ◆20: `📍 Lihat Lokasi` — bukan "Navigasi", karena tombolnya dipakai buat dua hal (ngecek sebelum berangkat + jalan pas ngantar) dan "Lihat Lokasi" nutup dua-duanya.
- **Tombol ditaruh di baris sendiri** di bawah alamat, bukan disempilin di kanan. Alasannya: mode locked udah punya `[Tolak]` di kanan; dua tombol kecil sebaris bikin nama pelanggan kepotong `…` di HP kecil, dan target tap-nya jadi kekecilan buat orang yang lagi di jalan.
- **⚠️ Tombol di dalam tombol.** Di mode unlocked, satu baris stop itu sendiri udah `<button onClick={openFeed}>`. Tombol Lihat Lokasi nempel di dalamnya → **wajib `stopPropagation`**, kalau enggak tap Lihat Lokasi malah kebuka Tasklist. Di mode locked barisnya `<div>` biasa, aman.
- Tombol mati = **abu-abu + alasan tertulis** (`empty`), jangan disembunyiin. Tombol yang ilang bikin sopir ngira app-nya rusak; tombol abu-abu dengan alasan ngajarin dia lapor ke admin.

---

## 7. Denorm `la`/`lo` ke `task`

`TASK_CREATE_SUBMIT` (op1Screen 727, wizard `admin_create_task`) menyalin data pelanggan terpilih ke doc `task` — `kl` (FK), `kn` (nama), `al` (alamat) **sudah** disalin di dalam renderer, bukan lewat string DSL. Jadi ini **perubahan Flutter, bukan config**.

**Minta:** ikutkan `la` dan `lo` dari doc `stock_location` pelanggan ke doc `task`, persis pola `kn`/`al`. Kalau di pelanggan kosong → tulis kosong (jangan bikin field bohongan).

Berlaku juga buat jalur order lain yang bikin task (adhoc dari AdminHome) — pakai sumber yang sama.

---

## 8. Dictionary

**Nol field baru.** `la` / `lo` sudah terdaftar di `docs/driver-runtime-field-dictionary.md`:

| code | collection | arti |
|---|---|---|
| `la` | `stock_location`, `location` | latitude |
| `lo` | `stock_location`, `location` | longitude |

Yang perlu ditambah cuma catatan bahwa `la`/`lo` sekarang juga **dipakai di `task`** (hasil denorm) — sama statusnya kaya `kn`/`al`.

---

## 9. Sheet-side (builder)

| Bagian | Sel | Status |
|---|---|---|
| `MAP_POINT_PICKER` @NewCustomer (op1Screen 735, seq 6) | `B735` `D735` `G735:P735` | ✅ 2026-08-26 |
| Blok digeser: separator dibuang, seq 2-5 naik 1 baris | `B731:B734` `D731:D734` `G731:P734` | ✅ 2026-08-26 |
| `addToEvent` +`la◼◁19▷⭘lo◼◁20▷` | `Q739` | ✅ 2026-08-26 |
| **Field Alamat manual dimatikan** (§4.1) | `F734` = `FALSE` | ✅ 2026-08-27 |
| **`addressPosition` = 21** | `I735` = `21` | ✅ 2026-08-27 |
| **`al` pindah sumber** `◁13▷` → `◁21▷` | `Q739` | ✅ 2026-08-27 |
| `DRIVER_STOP_CARD` +`mapsUrl` + 1 segmen `text` | `Widget!J204` (template) + `W547` `S547` `D547` | ✅ 2026-08-27 |

**Detail tulisan 2026-08-27** (renderer landing → config nyusul):

| Sel | Isi |
|---|---|
| `Widget!J204` | template +`"mapsUrl":"[MAPSURL]"`, disisipin sesudah `addressField` |
| `op1Screen!W547` | `url◼…dir/?api=1&destination=<la>,<lo>&travelmode=driving⭘fallback◼…search/?api=1&query=<al>⭘empty◼Alamat belum lengkap` |
| `op1Screen!S547` | `text` +1 segmen ujung: `◆📍 Lihat Lokasi` (jadi 20 segmen) |
| `op1Screen!D547` | resolver 16 → **17** SUBSTITUTE, `[MAPSURL]`→`W547`, ditaruh **paling luar** biar isinya gak kena substitusi lain |

Urutan nulis: op1Screen dulu, Widget belakangan — pas lapisan `[MAPSURL]` ditambah, template belum punya placeholder-nya, jadi no-op. Nol keadaan setengah jadi.

Dicek: op1Screen 549-620 (seluruh blok driver runtime) — **DriverHome satu-satunya pemakai** `driverStopCard`, jadi nambah placeholder ke template bersama gak nyenggol halaman lain.

Semua lewat pola generic + SUBSTITUTE — **jangan** tulis literal di kolom D.

> Blok halaman NewCustomer (730-739) sudah penuh 10 seq dan MCP gak bisa nyisipin baris. Solusinya: **separator kosong di seq 2 dibuang** (cuma spasi 28px di bawah header), seq 2-5 digeser naik, slot bebas dipakai picker tepat di bawah Alamat. Nol baris disisipin → nol pergeseran nomor baris di halaman lain.

---

## 10. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Renderer `MAP_POINT_PICKER` (spec 2026-07-17) | dev Flutter | ✅ sudah landing |
| Config NewCustomer (picker + `la`/`lo` ke `addToEvent`) | builder | ✅ 2026-08-26 |
| `DRIVER_STOP_CARD`: field `mapsUrl` (DSL keyed) + segmen text 20 | dev Flutter | ✅ 2026-08-27 |
| `TASK_CREATE_SUBMIT`: denorm `la`/`lo` ke task | dev Flutter | 🐞 **BUG — nulis kosong.** Diagnosis lengkap §14 no.1 |
| **Bagian C** — `mapsUrl` di `TASK_FEED_LIST` + `WORKSPACE_HEADER` | dev Flutter | ✅ 2026-08-27 |
| Config Bagian C (baris 602 + 606 + varian `workspaceHeaderMaps`) | builder | ✅ 2026-08-27 |
| **Rapiin UI kartu sopir** — Tolak sebaris + alamat 2 baris | dev Flutter | ✅ dilaporkan kelar — **belum diverifikasi di HP** |
| Config DriverHome (baris 547) | builder | ✅ 2026-08-27 |

## 11. Not Doing (dan kenapa)

- **Peta inline di kartu sopir** — berat, dan sopir tetap butuh navigasi beneran di app Maps.
- **Ketik koordinat manual** — sumber bug locale koma/titik; itu justru alasan `MAP_POINT_PICKER` dibikin.
- **Ambil koordinat dari GPS HP admin waktu bikin pelanggan** — admin bikin pelanggan dari kantor, bukan dari lokasi pelanggan. Hasilnya = titik kantor. Salah.
- **Rute multi-stop sekaligus** (optimasi urutan antar) — beda fitur, beda spec.
- **Geofence radius pelanggan** — `ra` itu punya `location` (patroli), bukan `stock_location`.

## 12. Asumsi & risiko

- [x] ~~`TASK_CREATE_SUBMIT` beneran nyalin `kn`/`al` di dalam renderer~~ — **TERKONFIRMASI 2026-08-27.** Doc `task` hasil order punya `kn` dan `al` yang byte-identical sama doc pelanggannya. §7 tetap kerjaan Flutter, bukan config.
- [x] ~~Kartu sopir lain mungkin juga perlu tombol~~ — **DIMINTA 2026-08-27**, jadi Bagian C (§13): `TASK_FEED_LIST` + `WORKSPACE_HEADER`.
- [ ] Sopir bisa aja belum pasang app Google Maps. Fallback ke browser jalan, tapi tanpa turn-by-turn.
- [x] ~~`addressPosition` beneran diisi renderer~~ — **TERBUKTI JALAN 2026-08-27.** Tes submit NewCustomer: posisi 21 keisi `18, Blok L5, BSD City, Pagedangan, Kabupaten Tangerang, Banten, 15345, Indonesia`, posisi 13 (Alamat manual) kosong sesuai §4.1, posisi 18/19/20 keisi `-6.316024,106.644819` / `-6.316024` / `106.644819` — format titik-desimal 6 angka sesuai kontrak.
- [x] ~~Mutu alamat reverse-geocode Nominatim~~ — **cukup detail** di tes yang sama (ada nomor + blok + kota + kodepos), bukan cuma level jalan seperti yang dikhawatirkan. Field manual tetap disimpan hidden di posisi 13 kalau suatu saat perlu dibalikin (`F734=TRUE`).
- [ ] **⚠️ DI LUAR SCOPE MAPS — nomor pelanggan gak kesimpen.** Posisi 17 (widget `NUMBER`, `template CUSTOMER-{{YYYY}}-{{COUNTER(vtl.request,6)}}`) keluar string `"null"` di `ev`, dan doc `stock_location` yang kebentuk **gak punya field nomor sama sekali** — `lv` diisi id acak Firestore (`R1h3f6XjDhb259cUUvhZ`). Sebabnya: `addToEvent` gak pernah nyebut `◁17▷`, jadi nomornya digenerate buat dipajang di layar lalu dibuang. Perlu diputusin: emang disengaja (nomor cuma hiasan → cabut aja widget-nya) atau kelewat (perlu `⭘nm◼◁17▷`, tapi `null`-nya dibenerin dulu). Bukan bagian fitur ini, tapi ketahuan dari tes yang sama.
- [ ] Segmen `text` ke-1 picker masih bunyi *"Belum ada titik — sopir cuma dapat alamat tulisan"* — sesudah §4.1 gak ada alamat tulisan lagi. Copy-nya perlu diganti (nunggu keputusan user).

### 12.1 Pelanggan lama & layar Edit — satu-satunya gap kontrak

Pelanggan yang **sudah ada** di database `la`/`lo`-nya kosong, dan belum ada layar "Edit Pelanggan" buat ngisi belakangan. Kalau layar itu dibikin, `MAP_POINT_PICKER` **belum bisa dipakai apa adanya**: template mematok `"currentValue":""`, jadi picker selalu mulai dari nol — admin gak lihat titik lama, gak bisa geser dikit, harus pin ulang dari awal.

Yang dibutuhin kalau layar edit jadi dibikin:

| field | isi | fungsi |
|---|---|---|
| `currentValue` | jadi placeholder `[CURRENTVALUE]` (sekarang dipatok `""`) | prefill `"lat,long"` dari doc yang lagi diedit |

Cukup itu — `initialCenter` gak bisa gantiin, karena dia cuma nentuin pusat peta saat **belum ada** nilai; field tetap kebaca "belum dipilih" dan submit bakal nulis kosong.

**Belum diputuskan user** apakah layar Edit Pelanggan mau dibikin. Selama belum, pelanggan lama jalan pakai alamat teks (§6.1 langkah 2).

---

## 13. BAGIAN C — tombol lokasi di 2 layar sisanya (2026-08-27) ⬜

**Kenapa nyusul.** Bagian B cuma masang tombol di **DriverHome**. Begitu sopir tap masuk ke rute, tombolnya ilang — padahal di dua layar itulah dia paling lama berada. Sopir harus balik ke Home cuma buat buka peta. Di §12 ini ditandai "belum diminta"; sekarang diminta.

### 13.1 Kontraknya SAMA PERSIS, jangan bikin baru

Dua widget di bawah nerima field `mapsUrl` dengan **nama, isi, dan aturan yang identik** sama `DRIVER_STOP_CARD` (§6). Satu kontrak dipakai tiga widget — jangan bikin varian nama lain (`navUrl`, `mapsTemplate`, dst), nanti tiga tempat harus dirawat kepisah.

```
mapsUrl = url◼<template utama>⭘fallback◼<template cadangan>⭘empty◼<pesan tombol mati>
```
Aturan pakai: template pertama yang **semua** `<token>`-nya keisi. Habis → tombol disabled + tampilkan `empty`. Cek kosong generic, jangan hardcode nama field.

### 13.2 `TASK_FEED_LIST` @TaskFeed (halaman op1Screen **600**, widget baris **602**)

Daftar tujuan, satu baris per tugas — udah punya `titleField:"kn"` + `addressField:"al"`.

| | |
|---|---|
| Field baru | `mapsUrl` |
| `text` | sekarang **15 segmen** → tombol = **segmen 16** |
| Taruh di mana | tiap baris tujuan, semua status (termasuk `Sudah Selesai`) — aturan seragam kaya §6.4 |

### 13.3 `WORKSPACE_HEADER` @DeliveryWorkspace (halaman op1Screen **605**, widget baris **606**)

Header layar antar — udah nampilin `titleField:"kn"` + `addressField:"al"` buat satu tujuan yang lagi dikerjain.

| | |
|---|---|
| Field baru | `mapsUrl` |
| `text` | sekarang **2 segmen** (`Tujuan◆Lagi Antar`) → tombol = **segmen 3** |
| Taruh di mana | di header, sebaris sama alamat |

⚠️ `WORKSPACE_HEADER` dipakai **banyak halaman lain** (NewCustomer, dll). `mapsUrl` opsional — halaman yang gak ngisi harus berperilaku persis kaya sekarang. Cek dulu konsumen lainnya sebelum ngubah template bersama.

### 13.4 Sheet-side

**✅ SELESAI 2026-08-27** (renderer landing → config nyusul).

**TaskFeed — template disisipin langsung.** `taskFeedList`@Widget 225 cuma dipakai TaskFeed@602; varian flat buat picker pelanggan udah kepisah di `taskFeedListFlat`@248, jadi nol risiko.

| Sel | Isi |
|---|---|
| `Widget!J225` | +`"mapsUrl":"[MAPSURL]"` sebelum `"text"` |
| `op1Screen!Y602` | nilai `mapsUrl` (identik `W547`) |
| `op1Screen!X602` | `text` 15 → **16** segmen, +`◆📍 Lihat Lokasi` |
| `op1Screen!D602` | resolver 18 → **19** SUBSTITUTE, `[MAPSURL]` paling luar |

**DeliveryWorkspace — VARIAN BARU, template bersama TIDAK disentuh.**

`workspaceHeader`@Widget 226 dipakai **12+ halaman** (NewCustomer · WalkIn · WalkInNota · WalkInHistory · StockHistory · StockHistoryDetail · SuratJalanList · SuratJalanPrint · CustomerOutstanding · WarehouseOpeningCheck · WarehouseClosingCheck · DeliveryWorkspace). Nyisipin `[MAPSURL]` ke situ bikin **11 halaman lain nyembur `"mapsUrl":"[MAPSURL]"` mentah**, karena resolver mereka gak punya lapisan substitusinya.

Solusinya varian — pola yang sama kaya `detailCardTwoPhoto` dan `taskFeedListFlat`:

| Sel | Isi |
|---|---|
| `Widget!I327` | `workspaceHeaderMaps` |
| `Widget!J327` | template `workspaceHeader` + `"mapsUrl":"[MAPSURL]"` |
| `Widget!G327` `H327` | `=J327` + formula pointer index |
| `op1Screen!B606` | `workspaceHeader` → `workspaceHeaderMaps` |
| `op1Screen!N606` | `Tujuan◆Lagi Antar◆📍 Lihat Lokasi` (2 → **3** segmen) |
| `op1Screen!O606` | nilai `mapsUrl` |
| `op1Screen!D606` | resolver 8 → **9** SUBSTITUTE, VLOOKUP ke nama varian |

**Urutan nulis** (biar nol keadaan setengah jadi): varian Widget 327 dulu (belum ada yang nunjuk) → op1Screen 602+606 → paling akhir `Widget!J225`. Waktu `D602` dapat lapisan `[MAPSURL]`, template `taskFeedList` belum punya placeholder-nya, jadi no-op.

**Verifikasi live:** `D602` + `D606` resolve bersih dengan `mapsUrl`; **`D730` (NewCustomer) gak berubah** — bukti 11 konsumen `workspaceHeader` lain utuh.

### 13.5 Rapiin UI `DRIVER_STOP_CARD` — dikerjain bareng Bagian C

Ini sebenarnya **punya Bagian B** (kartu yang udah jadi), dititip di sini biar sekalian sekali sentuh. Dua yang pertama perlu dibenerin, yang ketiga opsional.

#### 13.5.1 `[Tolak]` dan `[📍 Lihat Lokasi]` harus SEBARIS — beda dari §6.4

Yang kepasang sekarang:
```
1  Warteg                          [ Tolak ]
   ruko bidex
   [ 📍 Lihat Lokasi ]
```
Yang diminta §6.4:
```
1  Warteg
   ruko bidex
   [ 📍 Lihat Lokasi ]     [ Tolak ]
```

**Kenapa penting:** dua tombol itu **satu keputusan** — lihat lokasinya dulu, baru mutusin tolak (§6.5). Sekarang mereka kepisah baris *dan* kepisah sisi (Tolak kanan-atas, Lihat Lokasi kiri-bawah), jadi kebaca kayak dua hal yang gak berhubungan. Ditaruh nempel sebaris, urutan pakainya ngajarin dirinya sendiri — penting buat pengguna gaptek.

Baris yang statusnya `Selesai` tetap kaya sekarang: chip `[ Selesai ]` di kanan, `[ 📍 Lihat Lokasi ]` sendirian di bawah (gak ada Tolak buat dipasangin).

#### 13.5.2 Alamat harus boleh 2 baris

```
18, Blok L5, BSD City, Pagedangan, Kabu…     ← kepotong
```

Sejak §4.1, peta jadi **satu-satunya** sumber alamat — artinya semua pelanggan baru punya alamat panjang gaya reverse-geocode yang selalu berekor `…, Banten, 15345, Indonesia`. Satu baris gak akan pernah cukup. Ini konsekuensi yang belum kepikiran waktu §4.1 diputuskan.

**Minta:** `addressField` di kartu boleh **2 baris** sebelum di-ellipsis (sekarang 1).

Alternatif yang **ditolak**: motong ekor alamat (`, Indonesia` + kodepos) waktu simpan. Ekornya emang gak berguna dibaca, tapi ngebuang data asli cuma demi tampilan itu mahal — dan yang dibuang gak bisa balik. Beresin di sisi tampilan, jangan di sisi data.

#### 13.5.3 (OPSIONAL) Bedain bobot visual dua tombol

`Lihat Lokasi` dan `Tolak` sekarang sama-sama tombol garis, ukuran mirip. Padahal satu aman (cuma lihat), satu bikin tugas balik ke admin. Kalau salah tap, yang rugi jelas sebelah.

Usul: `Lihat Lokasi` dikasih isi warna tipis (filled tint), `Tolak` tetap garis doang. Bukan mendesak — kerjain kalau sempat.

#### Not doing (biar gak melebar)

- **Peta kecil di dalam kartu** — udah ditolak di §11, alasannya masih sama.
- **Tombol "lihat semua tujuan sekaligus di peta"** — kepikiran, tapi itu fitur baru, bukan rapiin yang ada. Beda scope, beda spec.

---

## 14. Yang harus dites sebelum dianggap beres

1. ⚠️ **Order baru → doc `task` punya `la`/`lo`.** Ini yang mastiin §7 (denorm) beneran jalan. **HASIL TES 2026-08-27: BELUM LULUS.** Tap Lihat Lokasi di tujuan Indomaret BSD (pelanggan yang doc `stock_location`-nya JELAS punya `la:"-6.316024"` / `lo:"106.644819"`) → Google Maps kebuka mode **pencarian** dengan teks alamat, hasilnya daftar tempat. Itu `fallback`, artinya `la`/`lo` di doc **`task`** kosong.
   **DIAGNOSIS SELESAI 2026-08-27** — diulang pakai pelanggan baru + task baru, hasilnya sama. Doc `task` `TASK-2026-000551` (`kn:"Janji Jiwa BSD"`):
   ```
   al: "29, Blok L2, BSD City, Pagedangan, Kabupaten Tangerang, Banten, 15345, Indonesia"   ← kesalin
   la: ""      ← field ADA, isinya KOSONG
   lo: ""      ← field ADA, isinya KOSONG
   ```
   **Bukan "§7 belum dikerjain".** Kalau belum, `la`/`lo` gak bakal muncul sebagai field. Kode denormnya ADA — sumber datanya yang kosong.

   **Doc pelanggan dicek — koordinatnya ADA.** Rantai buktinya lengkap:
   ```
   stock_location                          task TASK-2026-000551
     lv: "M3V7CG4yO1Zu9RsATQ7S"   ←────→    kl: "M3V7CG4yO1Zu9RsATQ7S"   ✓ doc yang sama
     ln: "Janji Jiwa BSD"         ────→     kn: "Janji Jiwa BSD"          ✓ kesalin
     al: "29, Blok L2, BSD City…" ────→     al: "29, Blok L2, BSD City…"  ✓ kesalin
     la: "-6.316754"              ──✗──→    la: ""                        ✗ KOSONG
     lo: "106.644907"             ──✗──→    lo: ""                        ✗ KOSONG
   ```
   `kl` nunjuk doc yang tepat, `kn`/`al` kesalin persis dari doc itu, tapi `la`/`lo` dari doc yang sama ketulis kosong. Bukan salah baca doc, bukan salah pelanggan, bukan data lama.

   **Penyebab (tinggal satu kemungkinan):** objek/projection pelanggan yang dioper ke `TASK_CREATE_SUBMIT` cuma bawa `kn` + `al`. `la`/`lo` gak ikut di payload itu, jadi sisi tulisnya nulis string kosong. **Perbaikannya di payload/projection pelanggan, bukan di sisi tulis** — sisi tulis udah bener (field-nya kebentuk).

   **Sisi sheet & renderer udah bener** — begitu `la`/`lo` keisi, jalur `url` langsung kepakai, nol perubahan config.
2. ✅ **Tombol muncul di kedua mode.** LULUS 2026-08-27 — mode locked kebukti: tiap baris tujuan (Warteg, Indomaret BSD) dapat `📍 Lihat Lokasi` sebaris sama `[Tolak]`, persis §6.4.
3. ✅ **Pelanggan lama** — `la`/`lo` kosong → jatuh ke `fallback` alamat teks, bukan tombol mati. LULUS (jalur fallback kebukti jalan di tes no.1).
4. ⬜ **Pelanggan tanpa titik DAN tanpa alamat** → tombol abu-abu + tulisan "Alamat belum lengkap". Belum dites.

**Cara baca hasilnya di Google Maps** (buat tes berikutnya):

| Yang kebuka | URL yang dipakai | Artinya |
|---|---|---|
| Langsung satu pin, siap navigasi | `/maps/dir/?api=1&destination=…` | `url` — koordinat kepakai ✓ |
| Halaman pencarian, hasilnya daftar tempat | `/maps/search/?api=1&query=…` | `fallback` — koordinat kosong |

Soal `fallback`: dia **cuma nolong pelanggan LAMA** — yang `al`-nya keisi dari ketikan admin tapi belum punya koordinat. Buat pelanggan baru (sesudah §4.1) `al` dan `la`/`lo` lahir dari picker yang sama, jadi kalau satu kosong biasanya kosong semua dan `fallback` gak kepanggil. Tetap dipasang karena database isinya campur lama+baru, tapi jangan diharap jadi jaring pengaman buat data baru.

---

**Referensi:** `MAP_POINT_PICKER` spec `docs/map-point-picker-widget-dev-spec.md` · `DRIVER_STOP_CARD` spec `docs/driver-stop-card-dev-spec.md` · kamus field `docs/driver-runtime-field-dictionary.md` · konsumen: op1Screen 729 (NewCustomer) · 547 (DriverHome) · 727 (CreateTaskSummary submit) · 877 (TitikPatroli, konsumen pertama MAP_POINT_PICKER)
