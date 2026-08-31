# Catatan Perubahan Menu JSON — dampak Batch A–E

**Dibuat:** 2026-08-28
**Acuan:** `example.js` di folder ini (menu dev `dsatria@consteon.com`, paling lengkap saat ini)
**Sumber perubahan:** `docs/web-spreadsheet-implementation-plan.md` Batch A–D (selesai) + E (sebagian)

Batch A menambahkan penegakan di sisi server untuk hal-hal yang selama ini hanya
diatur di UI. **Menu JSON-nya sendiri tidak berubah bentuknya** — tidak ada key
baru, tidak ada key yang dihapus. Yang berubah: beberapa key yang dulu cuma
mempengaruhi tampilan sekarang benar-benar mengikat.

**Batch B juga tidak menambah key apa pun** — semuanya dibaca dari spreadsheet,
lihat §8.

**Batch C menambah SATU key opsional**, `rowActions[]`, yang menggantikan
`rowAction` + `rowView`. Keduanya tetap didukung dan tidak wajib diubah — lihat
§9.

**Batch D menambah LIMA key opsional** (`toolbar`, `export`, `pageSize`,
`selectable`, `text`) dan dua perubahan tampilan yang berlaku tanpa config —
lihat §10 dan §11.

**Batch E** membuat tombol bar `OPEN_LINK` bisa dipakai, tapi hanya untuk `href`
literal — dua bentuk penunjuk masih dilarang, lihat §12.

Dokumen ini menjawab satu pertanyaan: **apa yang harus diperiksa/diubah di menu
JSON supaya tidak ada page yang mendadak berhenti bisa menyimpan.** Isinya
catatan perubahan, bukan referensi — bentuk lengkap tiap key ada di
[`docs/menu-json/`](../menu-json/), yang sudah diperbarui untuk Batch A–E
(`rowActions`, lima key Batch D, dan `OPEN_LINK` di bar).

---

## 1. Ringkasan: apa yang sekarang mengikat

| Key | Dulu | Sekarang |
|---|---|---|
| `permission` | menyembunyikan tombol di UI | **dicek server** — request langsung ke API ikut ditolak |
| `visibleSheets` | membatasi tab yang bisa dibuka | **dicek server** — juga membatasi tab yang bisa DITULIS |
| `src` | sumber grid | jadi **kunci izin**: spreadsheet yang tidak muncul di menu user tidak bisa ditulis sama sekali |
| `rowStartData` | baris awal data | juga jadi titik awal sampel deteksi kolom formula |
| `rowView.sourceColumn` | kolom link | isinya sekarang **wajib URL `https://`**, kalau tidak ikonnya nonaktif |

Yang **tidak** perlu diubah: semua bentuk widget, `rowAction`, `rowView`,
`FORM`, `RESET_DEVICE`, tombol bar. Tidak ada key baru di Batch A maupun B, dan
key baru di Batch C (`rowActions`) dan Batch D (lima key) semuanya opsional —
tidak ditulis = perilaku seperti sebelumnya.

---

## 2. Hasil pemeriksaan `example.js` — satu temuan nyata

Seluruh page di menu dev ini punya `permission` terisi, jadi **tidak ada page
yang langsung rusak**. Tapi ada satu yang perlu dibetulkan.

### 2.1 🔴 `dashboard` melumpuhkan pembatasan `pendaftaranPegawaiTenant`

Dua page menunjuk **spreadsheet yang sama**:

| Page | `src` (spreadsheetId) | `permission` | `visibleSheets` |
|---|---|---|---|
| `dashboard` | `1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A` | `C◆U◆D` | `''` (kosong) |
| `pendaftaranPegawaiTenant` | `1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A` | `U` | `Pendaftaran Pegawai◼2☆3` |

Guard menggabungkan izin dari **semua** page yang menunjuk satu spreadsheet
(union — satu user memang punya akses lewat dua pintu, dan yang paling longgar
menang). Akibatnya, izin efektif user atas spreadsheet itu jadi:

```
permission     : C, U, D      ← dari dashboard
visibleSheets  : semua tab    ← dashboard mengosongkannya = wildcard
```

Artinya **`permission: 'U'` di page Pendaftaran Pegawai tidak membatasi apa
pun**: user tetap bisa menambah dan menghapus baris di tab itu, karena
`dashboard` sudah memberi CUD atas seluruh spreadsheet. Ini bukan bug guard —
ini konsekuensi wajar dari union — tapi hampir pasti bukan yang dimaksud.

**Yang perlu diubah di config:**

```jsonc
// dashboard — sebelum
{ "permission": "C◆U◆D", "visibleSheets": "", "sheetName": "" }

// dashboard — sesudah (dashboard itu tampilan, bukan tempat mengedit)
{ "permission": "", "visibleSheets": "Dashboard◼1☆2", "sheetName": "Dashboard" }
```

Ganti `Dashboard` dengan nama tab dashboard yang sebenarnya (gid `815108501`).

**Aturan umum yang lahir dari kasus ini:**

> `visibleSheets: ''` bukan "belum diisi" — itu **wildcard**: semua tab di
> spreadsheet itu boleh ditulis. Kalau ada page LAIN yang menunjuk spreadsheet
> yang sama dengan izin lebih ketat, page berwildcard ini akan membatalkan
> pembatasan itu. Isi `visibleSheets` di **setiap** widget SPREADSHEET, terutama
> di spreadsheet yang dipakai lebih dari satu page.

### 2.2 🟡 `permission` kosong = view-only, dan itu sekarang sungguhan

Page yang `permission`-nya kosong sekarang benar-benar tidak bisa menulis, bukan
sekadar tombolnya hilang. Di menu ini tidak ada yang seperti itu, tapi kalau
nanti ada page yang "dulu bisa diedit padahal permission-nya kosong" — itu akan
berhenti bekerja, dan perbaikannya adalah **mengisi `permission`**, bukan
melonggarkan guard.

Cek juga arah sebaliknya, yang lebih halus: page yang `permission`-nya diisi
lengkap "biar aman" padahal cuma perlu dibaca. Sekarang itu berarti user benar
benar bisa menghapus baris lewat API.

### 2.3 🟡 `phk` dan `pendaftaranPegawaiTenant` — pembatasan sekarang nyata

| Page | `permission` | Efek baru |
|---|---|---|
| `phk` | `C◆U` | request DELETE ditolak `403 PERMISSION_DENIED` (dulu lolos) |
| `pendaftaranPegawaiTenant` | `U` | tambah baris & hapus baris ditolak — **kecuali** selama masalah §2.1 belum dibetulkan |

Tidak ada yang perlu diubah kalau memang itu maksudnya. Sebutkan di sini supaya
kalau ada laporan "tiba-tiba tidak bisa hapus", jawabannya sudah ada.

---

## 3. Aturan baru untuk config berikutnya

### 3.1 Dropdown ber-`target` (routing `Label▶url`)

Dropdown yang menukar `src` grid saat dipilih:

```json
{"type":"DROPDOWN","key":"cc","target":"laporanContent","options":"Induk▶https://docs.google.com/spreadsheets/d/AAA/edit◆Pusat▶https://docs.google.com/spreadsheets/d/BBB/edit"}
```

Guard mengenali spreadsheet tujuan dari opsi ini, **tapi hanya kalau `target`
persis sama dengan `id` widget SPREADSHEET di page yang sama**. Kalau `target`
salah ketik atau menunjuk id yang tidak ada:

- grid tetap bertukar `src` (klien tidak peduli), tapi
- setiap penulisan ke spreadsheet hasil tukar → `403 SHEET_FORBIDDEN`.

> **Wajib:** `dropdown.target` === `spreadsheet.id`. Ini dulu cuma "supaya
> refresh-nya kena", sekarang menentukan boleh-tidaknya menulis.

Di `example.js` tidak ada dropdown ber-`target` — semua pakai `cell`
(`laporanPekerjaan`), jadi tidak ada yang terdampak.

### 3.2 `visibleSheets` harus memuat SEMUA tab yang ditulis

`laporanPekerjaan` sudah benar:

```
visibleSheets : 'Patroli1◼8☆9◆Patroli◼8☆9◆Rutin◼8☆9'
cell dropdown : 'Patroli1!C4◆Patroli!C4◆Rutin!C4'
```

Tombol filter menulis ke `Patroli1!C4` / `Patroli!C4` / `Rutin!C4` lewat
`/api/spreadsheet`, dan ketiga tab itu ada di `visibleSheets`. Kalau suatu saat
ditambah tab keempat di `cell` tanpa menambahnya di `visibleSheets`, tombol
filternya akan gagal dengan `403` **hanya saat tab itu aktif** — gejala yang
membingungkan kalau tidak tahu aturannya.

> Setiap tab yang muncul di `cell` sebuah DROPDOWN/DATE harus ada di
> `visibleSheets` grid-nya.

### 3.3 Nama tab berspasi sudah aman

`pendaftaranPegawaiTenant` memakai tab `Pendaftaran Pegawai` (ada spasi). Semua
range yang dikirim ke Google sekarang di-quote otomatis
(`'Pendaftaran Pegawai'!C5`), jadi **tidak perlu** menulis kutip sendiri di
`sheetName` / `visibleSheets` / `cell`. Tulis apa adanya seperti sekarang.

---

## 4. Yang otomatis, jangan dibuatkan key

Godaan terbesar setelah Batch A adalah menambah key config untuk hal-hal yang
sudah otomatis. Jangan.

| Perilaku baru | Diatur di mana |
|---|---|
| kolom berformula jadi read-only + ikon Σ | otomatis dari sheet — **tidak ada key** |
| kolom terproteksi jadi read-only + ikon gembok | otomatis dari sheet (protected range) |
| `0812…` tidak kehilangan nol depan | otomatis dari data validation kolom |
| tanggal tetap tersimpan sebagai tanggal | otomatis dari data validation kolom |
| tolak simpan kalau sel sudah diubah orang lain | otomatis |

Kalau kolom tanggal ternyata tersimpan sebagai teks, perbaikannya **memasang
Data Validation tanggal di kolom itu di spreadsheet**, bukan menambah key di
menu JSON. Kolom tanpa validasi diperlakukan sebagai teks — itu default yang
disengaja.

Deteksi kolom formula membaca **300 baris pertama sheet, dipotong mulai dari
`rowStartData`** (jendelanya melebar di Batch B, ikut jendela format).
Jadi `rowStartData` yang salah bukan cuma menggeser tampilan — kolom formula bisa
gagal terdeteksi. Di `example.js` semuanya sudah benar (`3`, `3`, `9`, `2`).

---

## 5. `rowView` — isi kolom link sekarang divalidasi

Page `slipGaji`:

```json
"rowView": {
  "sourceColumn": "Link Storage (Slip Gaji)",
  "fallbackColumn": "Link Drive (Slip Gaji)",
  "mode": "dialog"
}
```

Config-nya tidak berubah. Yang berubah, isi selnya sekarang disaring:

- bukan `https://` (termasuk `http://`, `javascript:`, teks biasa, ID Drive
  telanjang) → ikon **nonaktif**, tooltip "link tidak valid" — dibedakan dari
  tooltip "belum di-generate";
- `mode: "dialog"` tapi host di luar allowlist → dibuka di **tab baru**, bukan
  iframe. Allowlist ada di kode (`EMBEDDABLE_HOSTS` di `lib/const.global.ts`),
  bukan di sheet — menambah host = perubahan kode, bukan config. Sekarang berisi
  `drive.google.com`, `docs.google.com`, `storage.googleapis.com`,
  `firebasestorage.googleapis.com`, `consteon.io`.

Jadi: pastikan kolom link di sheet berisi URL `https://` penuh.

> Penyaringan yang sama berlaku untuk entri `OPEN_LINK` di `rowActions[]` (§9) —
> `rowView` dinormalkan ke bentuk itu sebelum digambar, jadi keduanya melewati
> jalur yang sama persis.

---

## 6. Catatan pemeliharaan lain di `example.js`

Bukan akibat Batch A, tapi ketahuan saat memeriksanya:

1. **URL absolut ke produksi di menu dev.** `laporanPekerjaan` → tombol filter:
   `"url": "https://consteon.io/api/spreadsheet"`. Di menu dev ini artinya
   sesi dev menulis ke **API produksi**, dan sejak Batch A permintaannya
   dievaluasi terhadap menu user di produksi. Sebaiknya jadi path relatif
   `/api/spreadsheet`.
2. **`method: 'POST'` di dalam `onClick` bertipe `RUN_ACTION`** (page
   `pendaftaranPegawai`, `phk`). Key itu bukan bagian kontrak `RUN_ACTION`
   (`action`, `payload`, `confirm`, `onSuccess`, `onError`) dan diabaikan.
   Tidak berbahaya, tapi menyesatkan pembaca config berikutnya.
3. **`dashboard`: `sheetName: ''` + `rowHeader: 1` + `rowStartData: 2`.** Karena
   `visibleSheets` kosong, tab mana pun bisa dibuka, tapi `rowHeader`/
   `rowStartData` hanya satu nilai untuk semua tab. Begitu ada tab dengan header
   di baris lain, tampilannya salah. Isi `visibleSheets` per tab (lihat §2.1).
4. **`slipGaji` masih memakai `rowAction` + `rowView` terpisah.** Bentuk ini
   tetap didukung penuh. Migrasi ke `rowActions[]` baru dilakukan di **Batch C**
   dan sifatnya opsional — page lama tidak perlu diubah bersamaan.

---

## 7. Yang TIDAK dijaga guard (jangan salah kira)

Guard hanya memasang diri di depan `/api/spreadsheet` dan
`/api/spreadsheet/rows`. Route lain yang menulis ke spreadsheet **tidak** lewat
situ:

- **`/api/reset-device`** — page `resetDevice` dan `resetDeviceTenant` menulis
  ke Firestore + beberapa spreadsheet lewat route sendiri. Tidak ada cek
  `permission`/`visibleSheets` di sana, karena widget `RESET_DEVICE` memang tidak
  punya key itu. Kalau route ini perlu dibatasi, mekanismenya harus dirancang
  terpisah.
- **`/api/actions` dan `/api/actions/run`** — semua tombol `RUN_ACTION` di menu
  ini (`PHK`, `DOCENGINE_GENERATE`, `ADD_LOGO`, `SUSPEND_TENANT`, …). Penulisan
  dilakukan oleh Go actions-service, dan yang membatasi adalah allowlist `action`
  di sisi Go — bukan `permission` di menu JSON.

Konkretnya di menu ini: page `phk` punya `permission: 'C◆U'` (tanpa `D`), tapi
tombol **Process PHK** memanggil action `PHK` di backend, yang bebas melakukan
apa pun di spreadsheet-nya. `permission` membatasi apa yang boleh dilakukan
**user lewat grid**, bukan apa yang boleh dilakukan **action** yang dipicu dari
page itu. Dua batas yang berbeda; jangan diandalkan sebagai satu.

---

## 8. Batch B — nol key baru, tapi kerjanya pindah ke spreadsheet

Batch B membuat tampilan tabel di web mengikuti spreadsheet. Tidak ada satu pun
key config untuk ini, **dan memang tidak boleh ada** — spec widget §7 secara
eksplisit menolak `columns`, `width`, `align`, `format`, `frozen`, `hideColumns`,
dan `sortBy`.

| Yang sekarang termirror | Diatur di mana |
|---|---|
| lebar kolom | drag lebar kolom di spreadsheet |
| warna latar sel, warna teks, tebal, miring, coret | format sel di spreadsheet |
| rata kiri/tengah/kanan | format sel di spreadsheet |
| bungkus vs potong teks | Format → Perataan → Pembungkusan teks |
| kolom beku | Tampilan → Bekukan → N kolom |

Artinya satu pesan untuk yang mengatur sheet: **berhenti meminta perubahan
tampilan lewat menu JSON.** Ubah di spreadsheet, muat ulang halaman, selesai.

Tiga batas yang perlu diketahui supaya tidak dikira bug:

1. **Format hanya dibaca untuk 300 baris pertama.** Baris ke-301 ke atas tampil
   polos. Ini batas biaya yang disengaja: Google mengirim format untuk *setiap*
   sel termasuk yang defaultnya, jadi menariknya untuk seluruh grid berukuran
   megabyte tiap kali halaman dibuka. Sudah dilihat di layar dan diterima apa
   adanya per 2026-08-28.
2. **Baris beku tidak dirender.** Header web memang sudah selalu menempel di
   atas, jadi `frozenRowCount: 1` sudah terpenuhi; angka 2 ke atas tidak akan
   terlihat bedanya. Kolom beku dirender penuh.
3. **Sel merge tidak didukung** dan tidak akan digambar melintang.

Satu perbaikan yang terlihat langsung: **kolom kosong tanpa judul tidak lagi
muncul** (lima kolom hantu di page Slip Gaji). Kolom yang PUNYA judul tapi
isinya kosong tetap tampil — itu kolom yang memang disiapkan untuk diisi. Jadi
kalau ada kolom yang seharusnya tampil tapi hilang, sebabnya satu: **judulnya
kosong di baris `rowHeader`.**

---

## 9. Batch C — `rowActions[]`, key baru yang opsional

`rowAction` + `rowView` berarti setiap tombol baris berikutnya butuh key baru,
tipe baru, dan cabang baru di renderer. `rowActions[]` menggantikan keduanya
dengan satu array; ikon ketiga cuma menambah satu entri config.

**Tidak ada yang wajib diubah sekarang.** `rowAction` dan `rowView` di
`example.js` tetap jalan persis seperti sebelumnya — renderer menormalkan
keduanya jadi bentuk yang sama sebelum menggambar. Migrasi page Slip Gaji
dilakukan terpisah, kapan saja.

### 9.1 Bentuknya

```json
"rowActions": [
  {
    "type": "RUN_ACTION",
    "icon": "FileOutput",
    "action": "DOCENGINE_GENERATE",
    "payload": { "docType": "Slip Gaji" },
    "refresh": "FALSE",
    "text": "Generate slip baris ini◆◆Generate slip untuk baris ini?◆Slip gaji baris ini selesai◆Gagal generate slip"
  },
  {
    "type": "OPEN_LINK",
    "icon": "Eye",
    "sourceColumns": "Link Storage (Slip Gaji)◆Link Drive (Slip Gaji)",
    "mode": "dialog",
    "text": "Lihat slip gaji◆Slip belum di-generate◆◆◆Link tidak valid◆Slip Gaji"
  }
]
```

Urutan ikon di baris = urutan array.

### 9.2 Kontrak `text` — indeks mulai 1

Semua teks user-facing ada di SATU field `text`, dipisah `◆`. **Tidak ada lagi
key `label`, `emptyText`, `successToast`, atau `confirm`** di bentuk baru.

| idx | Isi | Kalau kosong |
|---|---|---|
| 1 | label / tooltip ikon | teks default aplikasi |
| 2 | tooltip saat ikon nonaktif | teks default aplikasi |
| 3 | pertanyaan konfirmasi | **tanpa konfirmasi — aksi langsung jalan** |
| 4 | toast sukses | teks default aplikasi |
| 5 | toast/tooltip gagal | teks default aplikasi |
| 6 | judul dialog (`mode: "dialog"`) | pakai segmen 1 |

Empat aturan yang mengikat:

1. **Segmen baru hanya boleh di-append di ujung.** Menyisipkan di tengah
   menggeser makna semua segmen di bawahnya dan diam-diam merusak setiap page
   yang sudah live.
2. **Segmen kosong di tengah tetap ditulis** sebagai `◆◆` — posisi menentukan
   makna. Di ujung boleh dipotong.
3. **`◆` dilarang muncul di dalam teks.** Tidak ada escape. Kalau labelnya butuh
   diamond, ganti kata.
4. Segmen yang tidak ada = kosong, bukan error. `text` dengan 3 segmen adalah
   pemakaian normal.

### 9.3 Dua jebakan yang paling mungkin kena

**Segmen 3 kosong = tidak ada konfirmasi.** Ini kebalikan dari `rowAction` lama,
yang defaultnya JUSTRU menampilkan konfirmasi. Saat memigrasi `rowAction` ke
`rowActions`, kalau segmen 3 lupa diisi, tombol Generate berubah jadi jalan
sekali klik tanpa peringatan. Untuk aksi yang menulis dokumen, isi segmen 3.

**`refresh` ditulis sebagai STRING**, `"TRUE"`/`"FALSE"` dalam tanda kutip —
bukan boolean telanjang. Sel Sheets berisi boolean di-render `TRUE` uppercase,
dan boolean telanjang bukan JSON valid; yang gagal di-parse adalah seluruh menu,
bukan cuma tombol itu. Tidak diisi = tabel dimuat ulang setelah sukses.

### 9.4 `sourceColumns` — daftar, bukan pasangan

`sourceColumns` adalah ◆-list nama kolom header; **yang pertama non-kosong
menang**. Menggantikan pasangan `sourceColumn` + `fallbackColumn` yang hanya
menampung dua. Sumber ketiga sekarang = tambah satu segmen.

Urutannya bukan selera: taruh **Link Storage sebelum Link Drive**. Link Drive
bentuk `/view` tidak bisa dirender di dalam dialog dan harus dikonversi dulu;
link Storage mulus. Yang mulus didahulukan.

Kolom link yang **disembunyikan di spreadsheet tetap bekerja** — nama kolom
dicari di baris header utuh, bukan di kolom yang tampil. Kalau nama kolomnya
salah ketik, ikonnya nonaktif **dan ada peringatan di console browser**; tanpa
log itu, salah ketik terlihat persis sama dengan "dokumennya belum di-generate".

### 9.5 `mode`

`dialog` (default) · `newTab` · `sameTab`. `dialog` hanya berlaku untuk host
yang ada di allowlist aplikasi (Drive, Docs, Storage, domain sendiri); host lain
otomatis dibuka di tab baru. Allowlist itu ada di kode, **bukan di sheet** —
kalau di sheet, orang yang bisa mengubah linknya juga bisa mengubah daftar yang
seharusnya membatasi dia.

---

## 10. Batch D — lima key baru, semuanya opsional

Semua key di bawah boleh tidak ditulis. Kalau tidak ditulis, halamannya
berperilaku sama seperti sebelumnya — itu aturan yang dipegang di seluruh batch
ini.

| Key | Bentuk | Absen berarti |
|---|---|---|
| `toolbar` | ◆-list `search`◆`addRow`◆`export`◆`sync` | `addRow`+`export` (seperti sekarang) |
| `export` | ◆-list `csv`◆`xlsx`◆`pdf` | `xlsx`+`pdf` (seperti sekarang) |
| `pageSize` | angka tanpa kutip | `0` = tanpa paging, scroll seperti sekarang |
| `selectable` | `"TRUE"`/`"FALSE"` (string) | `"FALSE"` |
| `text` | ◆-segmen 1–11 | semua teks ikut bahasa aplikasi |

### 10.1 `toolbar` — absen ≠ kosong

Ini bedanya halus tapi konsekuensinya besar:

- **Key-nya tidak ditulis** → toolbar bawaan (Tambah Baris + Ekspor).
- **Ditulis sebagai string kosong `""`** → benar-benar tanpa toolbar.

Spec aslinya hanya bilang "kosong = tanpa toolbar". Kalau itu diterapkan juga ke
key yang absen, semua page yang sekarang live langsung kehilangan tombolnya
tanpa ada yang mengubah config. Jadi kosongkan hanya kalau memang itu maunya.

Urutan token = urutan tampil. Item yang izinnya tidak ada **tidak dirender**:
`addRow` di page tanpa `C` hilang sendiri, bukan tampil lalu gagal saat diklik.
`sync` = tombol muat ulang tabel (segmen teks 4), bukan tombol Sinkron menu di
topbar.

### 10.2 `export` — ada token ketiga, `pdf`

Spec menyebut `csv◆xlsx`. Yang benar-benar terpasang dan dipakai hari ini adalah
**XLSX dan PDF** — PDF-nya bahkan menarik foto tiap baris. Menuruti spec
harfiah berarti menghapus fitur yang sedang dipakai, jadi tiga token didukung:
`csv`, `xlsx`, `pdf`.

`export: ""` → tombol Ekspor tidak muncul walaupun `toolbar` menyebutnya. Dua
key, satu keputusan.

### 10.3 `pageSize` — jangan pernah dikosongkan

Ditulis sebagai **angka tanpa kutip**. Sel yang dibiarkan kosong membuat seluruh
JSON menu tidak valid — yang rusak bukan satu widget, tapi seluruh menu user
itu. Isi `0` kalau tidak mau paging.

`0` = perilaku sekarang (scroll, baris dibuka bertahap). Angka > 0 = paging
dengan footer "Menampilkan 1–50 dari 812".

### 10.4 `selectable` — aksinya diambil dari `rowActions`

`"TRUE"` memunculkan checkbox per baris dan bar seleksi yang **menggantikan**
toolbar selama ada yang tercentang.

**Tidak ada key untuk aksi massalnya.** Spec menggambar tombol "Generate 12
Slip" tapi tidak pernah mendefinisikan dari mana aksi itu datang. Yang dipakai:
entri **`RUN_ACTION` di `rowActions[]`** — aksi yang sama dengan tombol per
baris, dijalankan untuk tiap baris tercentang. Konsekuensinya:

- `selectable: "TRUE"` di page yang tidak punya `rowActions` hanya memberi
  checkbox tanpa tombol apa pun. Isi `rowActions` dulu.
- Entri `OPEN_LINK` sengaja tidak muncul di bar seleksi — membuka 12 tab
  sekaligus bukan hal yang diinginkan siapa pun.
- Baris dijalankan **berurutan**, dan hasilnya dilaporkan sebagai "8 berhasil,
  4 gagal" beserta nomor baris yang gagal.
- Checkbox "pilih semua" di header hanya mencentang **halaman yang sedang
  dilihat**, bukan seluruh sheet.

### 10.5 `text` — 11 segmen, override di atas bahasa aplikasi

Aplikasi ini sudah punya terjemahan sendiri. `text` adalah **override per
widget**, bukan sumber teksnya: segmen yang dikosongkan tetap mengikuti bahasa
aplikasi. Jadi isi `text` hanya kalau satu halaman memang butuh kata yang
berbeda dari halaman lain — bukan supaya teksnya muncul.

| idx | Isi | idx | Isi |
|---|---|---|---|
| 1 | placeholder kotak cari | 7 | teks saat gagal memuat |
| 2 | label tombol tambah baris | 8 | teks saat tidak punya akses |
| 3 | label tombol ekspor | 9 | tooltip kolom berformula |
| 4 | label tombol muat ulang | 10 | tooltip kolom terkunci |
| 5 | teks saat tabel kosong | 11 | pesan sel bentrok (409) |
| 6 | teks saat memuat | | |

Aturan ◆-nya sama persis dengan `rowActions.text` (§9.2): append-only, kosong di
tengah tetap ditulis, `◆` haram di dalam teks.

---

## 11. Batch D — dua perubahan tampilan yang tidak butuh config

Keduanya berlaku di **semua** page, termasuk yang confignya tidak diubah.

**Tombol aksi baris pindah ke kolom tetap paling kanan.** Sebelumnya berupa pil
melayang yang muncul saat baris di-hover, menumpuk di atas sel VID/Nama — persis
sel yang sedang ingin dibaca atau diedit — dan tidak muncul sama sekali di layar
sentuh karena di sana tidak ada hover. Sekarang kolomnya selalu ada, menempel di
kanan saat tabel di-scroll horizontal.

**Toolbar dan tab sheet pindah ke atas tabel.** Tab yang berada di pojok kanan
bawah membuat orang tidak sadar ada tab lain sampai selesai men-scroll seluruh
tabel. Baris tab hanya muncul kalau `visibleSheets` memuat **lebih dari satu**
tab; satu tab tidak perlu barisnya.

Satu state baru yang mungkin akan terlihat: **"Kamu tidak punya akses ke
spreadsheet ini"**, terpisah dari "gagal memuat". Kalau ini muncul, artinya
spreadsheet-nya belum di-share ke akun Google yang login — mencoba lagi tidak
akan menolong, yang perlu dilakukan adalah membagikan dokumennya.

---

## 12. Batch E — `buttonLink` (`OPEN_LINK`), separuh jalan

Tombol bar bertipe `OPEN_LINK` sekarang jalan, **untuk `href` literal saja**.

```json
{
  "type": "BUTTON",
  "variant": "outline",
  "icon": "ExternalLink",
  "text": "Buka Dashboard",
  "onClick": {
    "type": "OPEN_LINK",
    "href": "https://lookerstudio.google.com/reporting/abc123",
    "newTab": "TRUE",
    "onError": { "toast": "Link belum diisi" }
  }
}
```

| Key | Isi |
|---|---|
| `href` | URL literal `https://`. **Wajib https** — `http://` ditolak dan tombolnya nonaktif |
| `newTab` | `"TRUE"` (string) = tab baru. Default: tab yang sama |
| `confirm` | tanya dulu sebelum membuka. Boleh `true`/`false` maupun `"TRUE"`/`"FALSE"` |
| `onError.toast` | teks saat link tidak sah |

`[SRC:pageKey]` boleh dipakai seperti biasa — token itu sudah di-resolve sebelum
menu sampai ke aplikasi, jadi yang tiba di tombol sudah URL jadi.

### 12.1 Dua bentuk `href` yang BELUM bisa dipakai

```
sheet◼<spreadsheetId>◼Config!B2
firestore◼web_links/dashboard◼url
```

Kalau ditulis, tombolnya **nonaktif** dan ada peringatan di console browser.
Jangan dipakai dulu di config mana pun.

Ini bukan soal belum sempat. Keduanya berarti server membaca sel spreadsheet
atau dokumen Firestore yang **alamatnya ditulis di menu JSON**, dan itu kelas
lubang yang sama dengan `url`-dari-config yang ditutup di Batch A. Tiga hal
harus diputuskan dulu:

1. **Path Firestore mana yang boleh dibaca.** Tanpa daftar putih,
   `firestore◼users_a1/<uid>◼j` adalah `href` yang sah — dan itu membaca menu
   user lain. Daftarnya harus di kode, bukan di sheet.
2. **Dibaca atas nama siapa** — service account (bisa baca apa saja) atau token
   user (dibatasi ACL-nya). Pilihan yang salah membocorkan spreadsheet yang user
   itu memang tidak boleh buka.
3. **Kapan di-resolve dan seberapa lama di-cache**, karena resolusi saat halaman
   disajikan berarti satu baca tambahan per tombol per muat halaman.

Dokumen yang menjawab ini (`docs/web-button-link-dev-spec.md`) dirujuk tiga
dokumen lain tapi tidak ada di repo. **Itu yang perlu diminta** sebelum bagian
ini dilanjutkan.
