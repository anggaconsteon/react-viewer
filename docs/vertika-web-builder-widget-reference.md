# Vertika Web Builder — Referensi Widget & Desain Batch-Form

> Dokumen ini = daftar SEMUA widget web builder + cara pakainya (bahasa manusia), plus desain fitur baru `DATA_TABLE` (form-tabel/batch Excel) hasil brainstorming 2026-07-08.
> Buat: pemilik page (config di spreadsheet) DAN tim web-dev (kontrak yang dibangun).
> Spreadsheet: `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`. Pola sheet: lihat `docs/vertika-web-builder-MASTER-REFERENCE.md`.
> **Dev spec implementasi** (buat web-dev): FORM/action = `docs/web-dynamic-form-action-dev-spec.md`; DATA_TABLE/batch/Excel = `docs/web-data-table-batch-form-dev-spec.md`.

---

## 1. Konsep dasar (baca ini dulu)

**Satu page = 3 zona:**

```
┌─ topbar ────────────────────────────┐   ← bar atas: widget kecil horizontal
│  [dropdown] [date] [tombol]          │     (filter, upload, tombol aksi)
├─ content ───────────────────────────┤   ← isi utama: grid / form / tabel / map
│  (tabel data, form, spreadsheet…)    │
├─ bottomBar ─────────────────────────┤   ← bar bawah (opsional)
└──────────────────────────────────────┘
```

- **Widget bar** (topbar/bottomBar): `dropdown`, `date`, `spacer`, tombol-tombol. Kecil, horizontal.
- **Widget content**: `contentSpreadsheet`, `contentForm`, `DATA_TABLE`, `contentMap`, `contentResetDevice`. Isi utama page.
- Di sheet: 1 baris = 1 widget. Kolom C = section (`topbar`/`content`/`bottomBar`).

**Token dinamis** (diisi otomatis per user/CC — jangan hardcode):

| Token | Jadi apa |
|---|---|
| `[SRC:namaPage]` | URL spreadsheet sumber, sesuai Cost Center user (dari tab Web URL) |
| `[CC_LIST]` | daftar Cost Center user, dipisah ◆ |
| `[CC_OPTIONS:namaPage]` | opsi CC yang punya data buat page itu |

**Kontrak `records[]` + `action`** (INTI — hafalin ini):
> Semua form (field-form, form-multi, tabel) menghasilkan **`records[]`** (daftar record) yang dikirim ke satu **`action`** (logic di server). Bikin fitur baru = definisi tampilan + tunjuk `action`. Nol logic baru per fitur.

```
FORM (1 field-form)     → records[] 1 elemen
FORM + multi (kartu)    → records[] beberapa
DATA_TABLE (Excel/grid) → records[] ratusan/ribuan
        └──────── semua → action handler yang SAMA
```

---

## 2. Katalog widget

### 2.1 Page

#### `pageWrapper`
Kerangka page. Otomatis dirakit sheet — kamu gak nulis manual. Isinya: `title`, `description`, `topbar`, `content[]`, `bottomBar`. Judul diambil dari label menu.

---

### 2.2 Widget CONTENT (isi utama)

#### `contentSpreadsheet` — tabel spreadsheet (view/edit data existing)

Nampilin sheet sebagai grid. Bisa add/edit/delete row (kalau `permission` punya token-nya).

> **Spreadsheet = engine-nya.** Tampilan grid ngikut sheet: lebar kolom, kolom di-hide, format tanggal/angka, warna sel, dropdown validasi, kolom beku — semua mirror, **bukan config**. Kalau tampilannya salah, benerin di spreadsheet. Daftar lengkap yang mirror ada di §2.6.

| Config | Fungsi |
|---|---|
| `id` | ID unik; jadi target `refresh` / `target` widget lain |
| `src` | pakai `[SRC:namaPage]` (jangan URL mentah) |
| `permission` | `C◆U◆D` — Create/Update/Delete. Kosong = view-only |
| `visibleSheets` | tab mana yang boleh dibuka: `Nama◼barisHeader☆barisData`, antar tab `◆`. Tab di luar daftar ga bisa dibuka |
| `sheetName` | tab yang kebuka duluan |
| `rowHeader` / `rowStartData` | baris header / baris mulai data |

```json
{"type":"SPREADSHEET","id":"dashboardContent","src":"[SRC:dashboard]","permission":"C◆U◆D","visibleSheets":"","sheetName":"","rowHeader":1,"rowStartData":2}
```

Contoh multi-tab (dari page `laporanPekerjaan` yang live) — urutan tab di `visibleSheets` dipakai juga sebagai acuan posisi buat `cell` dropdown dan `seq` tombol sequential:

```json
{"type":"SPREADSHEET","id":"laporanPekerjaanContent","src":"[SRC:laporanPekerjaan]","permission":"C◆U◆D","visibleSheets":"Patroli◼8☆9◆Patroli1◼8☆9◆Rutin◼8☆9","sheetName":"Patroli","rowHeader":8,"rowStartData":9}
```

```
┌──────────────────────────────────────────────────────────────┐
│ [ Patroli ] [ Patroli1 ] [ Rutin ]        ← dari visibleSheets│
├─────┬──────────────┬───────────┬──────────┬──────────────────┤
│  #  │ VID          │ Nama      │ Jabatan  │ Site             │
│ ═══ │ ════════════ │ ═════════ │ ════════ │ ════════════════ │ ← baris 8 (rowHeader)
├─────┼──────────────┼───────────┼──────────┼──────────────────┤
│  1  │ 788136801773 │ Imaglo CS │ Selektor │ Product Group    │ ← baris 9 (rowStartData)
│  2  │ 353393324999 │ Edu FM    │ Selektor │ Product Group    │
└─────┴──────────────┴───────────┴──────────┴──────────────────┘
  └── lebar kolom ini dari spreadsheet, bukan dari config ──┘
```

#### `contentSpreadsheetRowAction` — grid + tombol proses per baris

Sama seperti di atas, plus satu ikon di tiap baris yang manggil action backend buat baris itu.

| Config `rowAction` | Fungsi |
|---|---|
| `action` | nama handler di registry backend |
| `payload` | data tambahan, diteruskan apa adanya |
| `icon` / `label` | ikon lucide / tooltip |
| `confirm` | `true` = nanya dulu |
| `successToast` | notif kalau berhasil |
| `refresh` | `true` = tabel dimuat ulang setelah sukses |

```json
{"type":"SPREADSHEET","id":"slipGajiContent","src":"https://docs.google.com/spreadsheets/d/1FQqc6KIOT1e194_1Dux-6zVR4Ab76bg8l7hxd4GG2mg/edit","permission":"C◆U◆D","visibleSheets":"Payroll◼2☆3","sheetName":"Payroll","rowHeader":2,"rowStartData":3,"rowAction":{"action":"DOCENGINE_GENERATE","payload":{"docType":"Slip Gaji"},"icon":"FileOutput","label":"Generate slip baris ini","confirm":true,"successToast":"Slip gaji baris ini selesai","refresh":false}}
```

#### `contentSpreadsheetRowView` — grid + proses + buka dokumen per baris

Tambah ikon kedua: buka link yang tersimpan di sebuah kolom. Dipakai page Slip Gaji.

| Config `rowView` | Fungsi |
|---|---|
| `sourceColumn` | nama header kolom yang isinya link |
| `fallbackColumn` | kolom cadangan kalau yang pertama kosong |
| `icon` / `label` | ikon / tooltip |
| `mode` | `dialog` (popup di dalam app) atau tab baru |
| `emptyText` | tooltip kalau kolomnya kosong |

Kolom dicocokin **pakai nama header**, bukan huruf kolom. Kolom digeser di sheet tetap aman; header di-rename bakal mutusin.

**Kolom sumbernya biasanya di-hide** — di sheet `Payroll`, kolom W (`Link Drive (Slip Gaji)`) dan X (`Link Storage (Slip Gaji)`) dua-duanya tersembunyi. Tetap jalan, karena kolom tersembunyi cuma dilewati waktu render; datanya tetap lengkap. Syaratnya satu: renderer nyari nama kolomnya di **baris header utuh**, bukan di kolom yang tampil. Kalau kebalik, ikonnya nonaktif semua tanpa pesan error.

Dua catatan dari isi kolom yang sebenarnya:
- Link Drive bentuknya `/view?usp=drivesdk` — **ga bakal render di iframe**, harus dikonversi ke `/preview` dulu. Makanya Storage ditaro duluan di `sourceColumn`.
- Kolom hidden **tetap kekirim ke browser**. Di halaman ini artinya tiap pengguna nerima URL slip gaji semua pegawai, dan URL Storage-nya bawa `token=` yang bisa dibuka tanpa login. Nyembunyiin kolom ga ngubah itu. Rinciannya di `docs/web-row-actions-dev-spec.md` §3.

```json
{"type":"SPREADSHEET","id":"slipGajiContent","src":"https://docs.google.com/spreadsheets/d/1FQqc6KIOT1e194_1Dux-6zVR4Ab76bg8l7hxd4GG2mg/edit","permission":"C◆U◆D","visibleSheets":"Payroll◼2☆3","sheetName":"Payroll","rowHeader":2,"rowStartData":3,"rowAction":{"action":"DOCENGINE_GENERATE","payload":{"docType":"Slip Gaji"},"icon":"FileOutput","label":"Generate slip baris ini","confirm":true,"successToast":"Slip gaji baris ini selesai","refresh":false},"rowView":{"sourceColumn":"Link Storage (Slip Gaji)","fallbackColumn":"Link Drive (Slip Gaji)","icon":"Eye","label":"Lihat slip gaji","mode":"dialog","emptyText":"Slip belum di-generate"}}
```

```
┌─────┬──────────────┬───────────┬─────────────────────┬─────────┐
│  #  │ VID          │ Nama      │ Link Storage (Slip) │  aksi   │
├─────┼──────────────┼───────────┼─────────────────────┼─────────┤
│  1  │ 788136801773 │ Imaglo CS │ https://…/slip1.pdf │  ⚙  👁  │
│  2  │ 353393324999 │ Edu FM    │                     │  ⚙  👁̶  │ ← kolom kosong:
└─────┴──────────────┴───────────┴─────────────────────┴─────────┘    ikon nonaktif,
                                                                       tooltip emptyText
   ⚙ = rowAction (generate)      👁 = rowView (buka dokumen)
```

Klik 👁 dengan `mode:"dialog"`:

```
        ┌──────────────────────────────────┐
        │  Lihat slip gaji             ✕   │
        ├──────────────────────────────────┤
        │                                  │
        │        [ preview PDF ]           │
        │                                  │
        └──────────────────────────────────┘
```

#### `contentSpreadsheetRowActions` — banyak ikon per baris (usulan, belum jalan)

Ganti `rowAction` + `rowView` jadi **satu array**, tiap entri punya `type`. Ikon ketiga nanti cuma nambah entri, bukan nambah key baru. Semua teks jadi satu field `text` dipisah `◆`.

Kontrak lengkap: `docs/web-row-actions-dev-spec.md`.

```json
{"type":"SPREADSHEET","id":"slipGajiContent","src":"…","permission":"C◆U◆D","visibleSheets":"Payroll◼2☆3","sheetName":"Payroll","rowHeader":2,"rowStartData":3,"rowActions":[{"type":"RUN_ACTION","icon":"FileOutput","action":"DOCENGINE_GENERATE","payload":{"docType":"Slip Gaji"},"refresh":"FALSE","text":"Generate slip baris ini◆◆Generate slip untuk baris ini?◆Slip gaji baris ini selesai◆Gagal generate slip"},{"type":"OPEN_LINK","icon":"Eye","sourceColumns":"Link Storage (Slip Gaji)◆Link Drive (Slip Gaji)","mode":"dialog","text":"Lihat slip gaji◆Slip belum di-generate◆◆◆Link tidak valid◆Slip Gaji"}]}
```

Indeks `text`: `1` label · `2` tooltip nonaktif · `3` pertanyaan konfirmasi (kosong = tanpa konfirmasi) · `4` toast sukses · `5` toast gagal · `6` judul dialog.

#### `contentForm` — form field (1 record; input satu-satu)
Form isian: field ke bawah, bisa diatur horizontal/vertikal + lebar per field. Buat input 1 orang/1 record.

| Config | Fungsi |
|---|---|
| `fields[]` | daftar field: `{id, label, input, options, required, width, …}` |
| `columns` | jumlah field per baris (1 = ke bawah; 2 = 2-2) |
| `submitLabel` | teks tombol |
| `action` (atau `onClick.url`) | logic tujuan / URL submit |
| `resolve[]` | autofill (§3.3) |
| `multi` | `true` = bisa tambah beberapa record (kartu-kartu) |

**Field `input`**: `text` · `number` · `date` · `textarea` · `dropdown` · `hidden`.

```json
{"type":"FORM","id":"formPhk","columns":2,"submitLabel":"Proses PHK",
 "fields":[
   {"id":"vid","label":"Pegawai","input":"dropdown","required":true,"options":"…"},
   {"id":"tanggal","label":"Tanggal","input":"date","width":"1/2"},
   {"id":"alasan","label":"Alasan","input":"dropdown","width":"1/2","options":"Meninggal◆Lain-lain"}
 ],"action":"PHK"}
```

#### `contentFormAction` — form ke action backend (bentuk FORM terbaru)

Beda dari `contentForm`: **`action` di level atas**, ga ada `onClick`/`url`, dan punya `onSuccess.then`. Ini bentuk yang dipakai page baru.

| Config | Fungsi |
|---|---|
| `action` | nama handler di registry backend |
| `confirm` | nanya dulu sebelum submit |
| `columns` | jumlah field per baris (angka, jangan dikosongin) |
| `submitLabel` / `submitVariant` | teks + warna tombol |
| `onSuccess` | `{toast, then}` — `then`: `RESET_FORM` / `REFRESH_CONTENT` |
| `fields[]` | daftar field |

Field `input`: `text` · `number` · `date` · `textarea` · `dropdown` · `file` · `hidden`.
Field `file` punya `accept`, `maxSizeMb`, `width`. Field bisa punya `default` (nilai awal).

Contoh page `icon` (live):

```json
{"type":"FORM","id":"addLogoContent","action":"ADD_LOGO","confirm":true,"columns":2,"submitLabel":"Simpan Logo","submitVariant":"default","onSuccess":{"toast":"Logo tersimpan","then":"RESET_FORM"},"fields":[{"id":"vidClient","label":"VID Client","input":"text","required":true},{"id":"label","label":"Label","input":"text","required":true},{"id":"rootFolder","label":"Folder","input":"text","required":true,"default":"id/2026/"},{"id":"logo","label":"Logo","input":"file","required":true,"accept":"image/png,image/jpeg","maxSizeMb":5,"width":"full"}]}
```

```
┌──────────────────────────────────────────────────┐
│ VID Client                Label                  │
│ [____________]            [____________]         │  ← columns: 2
│                                                  │
│ Folder                                           │
│ [id/2026/____]                                   │  ← default
│                                                  │
│ Logo                                             │
│ [ ⬆ Pilih berkas — PNG/JPEG, maks 5 MB ]         │  ← width: "full"
│                                                  │
│                              [ Simpan Logo ]     │
└──────────────────────────────────────────────────┘
```

#### `DATA_TABLE` — form-tabel / batch (BANYAK record) — **BARU, lihat §3**
Grid banyak baris. Isi manual (+Tambah baris) atau di-feed dari Excel. Kolom read-only/editable per kolom, search per kolom, submit semua sekaligus, hasil per-baris.

#### `contentMap` — peta
`{"type":"MAP","id":"…","lat":…,"lng":…,"zoom":…}`

#### `contentResetDevice` / `contentResetDeviceTenant` — form reset device
Form khusus reset device (bawaan). `fields[]` + `keyLabel` + `groupLabel` (+ `tenantGroup` buat versi tenant).

```json
{"type":"RESET_DEVICE","id":"resetDeviceContent","keyLabel":"Nama User","groupLabel":"Group",
 "fields":[
   {"key":"oldPhone","label":"No. Telepon Lama","disabled":true},
   {"key":"oldEmail","label":"Email Saat Ini","disabled":true},
   {"key":"vid","label":"VID","disabled":true},
   {"key":"e","label":"Email Baru"},
   {"key":"i","label":"No. Telepon Baru","normalize":"phone_ID"}
 ]}
```
Versi tenant: tambah `"tenantGroup":"VTL"` di akhir.

---

### 2.3 Widget BAR — input (topbar/bottomBar)

#### `dropdown` — pilih dari daftar (nulis ke cell)
Nilai kepilih dikirim saat submit (harus punya `cell` biar keikut).

| Config | Fungsi |
|---|---|
| `key` | nama data |
| `cell` | tujuan nilai (WAJIB biar keikut submit) |
| `options` | daftar ◆-pisah, atau `[CC_LIST]` |
| `placeholder` / `emptyText` / `variant` | tampilan |
| `label` / `labelPosition` | label + posisi (`vertical`/…) |

```json
{"type":"DROPDOWN","key":"costCenter","cell":"Patroli!F5","placeholder":"Pilih cost center",
 "options":"[CC_LIST]","emptyText":"Cost center tidak ditemukan","variant":"outline",
 "label":"Cost Center","labelPosition":"vertical"}
```
Contoh options statis: `"options":"Meninggal◆Lain-lain◆Resign"`.

#### `dropdownSrc` — dropdown yang me-refresh konten (pakai `target`, bukan `cell`)
Buat filter konten. **Tidak keikut payload submit** (gak punya `cell`).

```json
{"type":"DROPDOWN","key":"costCenter","target":"attendanceContent","placeholder":"Pilih cost center",
 "options":"[CC_OPTIONS:attendance]","emptyText":"Cost center tidak ditemukan","variant":"outline",
 "label":"Cost Center","labelPosition":"vertical"}
```

#### `dropdownSrcOptions` — dropdown yang opsinya dari range sheet
`srcOptions:"W8:W"` → opsi ditarik dari kolom sheet.

```json
{"type":"DROPDOWN","key":"vid","srcOptions":"W8:W","placeholder":"Pilih VID","emptyText":"Nama tidak ditemukan",
 "variant":"outline","cell":"Patroli!C4","label":"Nama","labelPosition":"vertical"}
```

#### `date` — pilih tanggal
`key`, `cell`, `format` (`dd-MMM-yyyy`), `variant`, `label`, `labelPosition`.

```json
{"type":"DATE","key":"startDate","cell":"Patroli!C5","placeholder":"Pilih tanggal awal",
 "format":"dd-MMM-yyyy","variant":"outline","label":"Tanggal Awal","labelPosition":"vertical"}
```

#### `spacer` — pendorong jarak
`{"type":"SPACER"}` — dorong widget berikutnya ke kanan (mis. tombol nempel ke kanan).

---

### 2.4 Widget BAR — tombol

Semua tombol pakai styling shadcn (config-driven):

| Prop | Nilai | Default |
|---|---|---|
| `variant` | `default` · `destructive` · `outline` · `secondary` · `ghost` · `link` (warna ikut theme) | `default` |
| `size` | `sm` · `default` · `lg` · `icon` (tinggi ikut size) | `default` |
| `width` | `auto` · `full` | `auto` |
| `icon` | nama ikon (lucide) | — |
| posisi | taruh di section (`topbar`/`bottomBar`) + `alignment` bar (start/center/end) | topbar start |

> Warna dari `variant` (theme), BUKAN hex di config. Tinggi dari `size` (keyword), bukan px mentah.

#### `buttonSubmit` — kirim data ke URL
POST `{spreadsheetId, data:[{cell,value},…]}` ke `onClick.url`. `data:"key1◆key2"` = key mana yang dikirim (harus punya `cell`).

```json
{"type":"BUTTON","icon":"Send","text":"Proses","variant":"destructive","data":"vid◆tanggal◆alasan",
 "onClick":{"type":"SUBMIT","url":"…","method":"POST","onSuccess":{"toast":"Terkirim","then":"REFRESH_CONTENT"},"onError":{"toast":"Gagal"}}}
```

#### `buttonFetch` — ambil konten ke `target`
`onClick.type:"FETCH_CONTENT"` + `target` = id elemen yang di-update responsnya.
```json
{"type":"BUTTON","icon":"RefreshCw","text":"Muat","variant":"outline",
 "onClick":{"type":"FETCH_CONTENT","url":"…","method":"POST","target":"tabelHasil",
 "onSuccess":{"toast":"Dimuat"},"onError":{"toast":"Gagal"}}}
```

#### `buttonReset` — reset input
`onClick.type:"RESET"` + `scope`.
```json
{"type":"BUTTON","icon":"X","text":"Reset","variant":"ghost","onClick":{"type":"RESET","scope":"topbar"}}
```

#### `buttonRunAction` — jalanin proses backend

Tombol paling umum buat aksi halaman. `action` = nama handler di registry, `payload` = data tambahan (bentuknya bebas, ditulis per page).

```json
{"type":"BUTTON","variant":"default","size":"default","text":"Generate Semua Slip Gaji","onClick":{"type":"RUN_ACTION","action":"DOCENGINE_GENERATE_ALL","confirm":true,"payload":{"docType":"Slip Gaji"},"onSuccess":{"toast":"Slip gaji diproses","then":"REFRESH_CONTENT"},"onError":{"toast":"Gagal generate slip gaji"}}}
```

Versi lama `buttonAction` sama saja tapi tanpa `payload` dan `confirm`-nya di-bake `true`. Buat page baru pakai `buttonRunAction`.

#### `buttonSequential` — jalanin Apps Script sequential

`buttonRunAction` + satu field `seqBySheet`. Kepakai kalau satu spreadsheet punya beberapa sequential, satu per tab.

| Config | Fungsi |
|---|---|
| `seqBySheet` | `"TRUE"` = ambil `seq` sesuai tab yang lagi dibuka; `"FALSE"` = kirim utuh |
| `payload.seq` | ◆-list, **urutannya sejajar `visibleSheets`** |
| `payload.encoding` | cara backend nembak service: `queryParams` / `json` |

Browser cuma ngomong ke backend kita; backend yang manggil service. Kontrak lengkap: `docs/web-button-sequential-dev-spec.md`.

```json
{"type":"BUTTON","variant":"default","size":"default","text":"Jalankan Sequential","onClick":{"type":"RUN_ACTION","action":"RUN_SEQUENTIAL","confirm":true,"seqBySheet":"TRUE","payload":{"ssid":"1LnZsETajZ6Ut4rxgyTIyWpYW9HKC1bsXTn4Lqw50LzY","seq":"SequentialDailyM0◆SequentialDailyM1◆SequentialDailyM2","encoding":"queryParams"},"onSuccess":{"toast":"Sequential dijalankan","then":"REFRESH_CONTENT"},"onError":{"toast":"Gagal menjalankan sequential"}}}
```

```
visibleSheets:  Daily M0  ◆  Daily M1  ◆  Daily M2
                   │            │            │
payload.seq:    ...M0     ◆  ...M1     ◆  ...M2
                             ▲
              tab aktif index 1 → yang dikirim cuma "SequentialDailyM1"
```

#### `buttonLink` — buka link

`href` nerima nilai literal atau penunjuk. Link dari sheet/Firestore di-resolve di server waktu halaman disajikan, jadi yang nyampe ke browser udah URL jadi.

| Isi `href` | Artinya |
|---|---|
| `https://…` | literal |
| `[SRC:pageKey]` | dari tab `Web URL` |
| `sheet◼<spreadsheet>◼Config!B2` | baca 1 cell |
| `firestore◼web_links/dashboard◼url` | baca 1 field doc |

Kontrak lengkap: `docs/web-button-link-dev-spec.md`.

```json
{"type":"BUTTON","variant":"outline","size":"default","icon":"ExternalLink","text":"Buka Dashboard","onClick":{"type":"OPEN_LINK","href":"https://lookerstudio.google.com/reporting/abc123","newTab":"TRUE","confirm":false,"onError":{"toast":"Link belum diisi"}}}
```

#### `buttonUpload` — upload Excel → feed ke tabel — **BARU**
Baca Excel di browser → map header ke `key` kolom → dorong baris ke `DATA_TABLE` lewat `target`.
```json
{"type":"BUTTON","icon":"Upload","text":"Upload Excel","onClick":{"type":"UPLOAD_EXCEL","target":"batchPhk","headerRow":1}}
```

#### `buttonTemplate` — download template Excel — **BARU**
Download template. Bisa di-generate dari kolom tabel (header = label kolom) atau file statis.
```json
{"type":"BUTTON","icon":"Download","text":"Template","onClick":{"type":"DOWNLOAD_TEMPLATE","target":"batchPhk"}}
```

---

### 2.5 Contoh page utuh (widget digabung)

**Contoh 1 — page filter + tabel** (Laporan: topbar filter, content spreadsheet):
```json
{
  "title": "Laporan Pekerjaan",
  "topbar": { "alignment": "start", "children": [
    {"type":"DROPDOWN","key":"vid","srcOptions":"W8:W","placeholder":"Pilih VID","variant":"outline","cell":"Patroli!C4","label":"Nama","labelPosition":"vertical"},
    {"type":"DATE","key":"startDate","cell":"Patroli!C5","format":"dd-MMM-yyyy","variant":"outline","label":"Tanggal Awal","labelPosition":"vertical"},
    {"type":"SPACER"},
    {"type":"BUTTON","icon":"FilterIcon","text":"Tampilkan","data":"vid◆startDate","onClick":{"type":"SUBMIT","url":"https://consteon.io/api/spreadsheet","method":"POST","onSuccess":{"then":"REFRESH_CONTENT"},"onError":{"toast":"Gagal"}}}
  ]},
  "content": [
    {"type":"SPREADSHEET","id":"laporanContent","src":"[SRC:laporanPekerjaan]","permission":"C◆U◆D","rowHeader":8,"rowStartData":9}
  ],
  "bottomBar": { "alignment": "end", "children": [] }
}
```

**Contoh 2 — page form field** (PHK single, topbar kosong, form di body):
```json
{
  "title": "Form PHK",
  "topbar": { "alignment": "start", "children": [] },
  "content": [
    {"type":"FORM","id":"formPhk","columns":2,"submitLabel":"Proses PHK","submitVariant":"destructive",
     "fields":[
       {"id":"vid","label":"Pegawai","input":"dropdown","required":true,"options":"…"},
       {"id":"tanggal","label":"Tanggal Efektif","input":"date","width":"1/2"},
       {"id":"alasan","label":"Alasan","input":"dropdown","width":"1/2","options":"Meninggal◆Lain-lain"},
       {"id":"keterangan","label":"Keterangan","input":"textarea"}
     ],"action":"PHK","onClick":{"type":"SUBMIT","url":"…"}}
  ],
  "bottomBar": { "alignment": "end", "children": [] }
}
```

**Contoh 3 — page grid + aksi per baris + tombol massal** (Slip Gaji, live):
```json
{
  "title": "Slip Gaji",
  "description": "Generate slip gaji dari antrian Payroll.",
  "topbar": { "alignment": "", "children": [] },
  "content": [
    {"type":"SPREADSHEET","id":"slipGajiContent","src":"https://docs.google.com/spreadsheets/d/1FQqc6KIOT1e194_1Dux-6zVR4Ab76bg8l7hxd4GG2mg/edit","permission":"C◆U◆D","visibleSheets":"Payroll◼2☆3","sheetName":"Payroll","rowHeader":2,"rowStartData":3,
     "rowAction":{"action":"DOCENGINE_GENERATE","payload":{"docType":"Slip Gaji"},"icon":"FileOutput","label":"Generate slip baris ini","confirm":true,"successToast":"Slip gaji baris ini selesai","refresh":false},
     "rowView":{"sourceColumn":"Link Storage (Slip Gaji)","fallbackColumn":"Link Drive (Slip Gaji)","icon":"Eye","label":"Lihat slip gaji","mode":"dialog","emptyText":"Slip belum di-generate"}}
  ],
  "bottomBar": { "alignment": "", "children": [
    {"type":"BUTTON","variant":"default","size":"default","text":"Generate Semua Slip Gaji","onClick":{"type":"RUN_ACTION","action":"DOCENGINE_GENERATE_ALL","confirm":true,"payload":{"docType":"Slip Gaji"},"onSuccess":{"toast":"Slip gaji diproses","then":"REFRESH_CONTENT"},"onError":{"toast":"Gagal generate slip gaji"}}}
  ]}
}
```

```
  Slip Gaji                                       ← title
  Generate slip gaji dari antrian Payroll.        ← description
┌─────┬──────────────┬───────────┬──────────┬─────────┐
│  #  │ VID          │ Nama      │ Jabatan  │  aksi   │
├─────┼──────────────┼───────────┼──────────┼─────────┤
│  1  │ 788136801773 │ Imaglo CS │ Selektor │  ⚙  👁  │  ← content[]
│  2  │ 353393324999 │ Edu FM    │ Selektor │  ⚙  👁  │
└─────┴──────────────┴───────────┴──────────┴─────────┘
  [ Generate Semua Slip Gaji ]                    ← bottomBar
```

**Contoh 4 — page batch tabel** (topbar upload+template, content DATA_TABLE): lihat §3.

---

### 2.6 Yang BUKAN config — diatur di spreadsheet

Grid di web itu cerminan sheet. Hal-hal ini **ga punya key config** dan emang ga akan pernah punya. Kalau tampilannya salah, benerinnya di spreadsheet.

| Mau ubah | Caranya |
|---|---|
| kolom ga usah tampil | hide kolomnya di spreadsheet |
| lebar kolom | lebarin kolomnya di spreadsheet |
| urutan kolom | pindahin kolomnya di spreadsheet |
| format tanggal / angka / rupiah | format sel di spreadsheet |
| rata kiri / kanan / tengah | atur di spreadsheet |
| warna sel, teks tebal | atur di spreadsheet |
| isi pilihan dropdown di sel | Data Validation di spreadsheet |
| kolom nempel pas scroll | freeze kolom di spreadsheet |
| sel ga boleh diedit | protect range di spreadsheet |
| sel gabungan | merge di spreadsheet |

**Kasus nyata:** halaman Slip Gaji nampilin 5 kolom kosong tanpa judul di sebelah kanan. Itu bukan bug renderer — kolomnya emang ada di sheet. Sembunyiin di spreadsheet, hilang sendiri di web.

Status: sekarang yang benar-benar sudah mirror = **kolom di-hide** dan **format tanggal/angka**. Sisanya masih gap renderer, rinciannya di `docs/web-spreadsheet-widget-dev-spec.md` §2.2.

---

## 3. Desain `DATA_TABLE` (form-tabel / batch) — BARU

> Keputusan brainstorming 2026-07-08. Prinsip: **se-dinamis mungkin, dipake case apapun.** DATA_TABLE = cara ke-3 ngisi `records[]` — bukan logic baru.

### 3.1 Schema

```json
{
  "type": "DATA_TABLE",
  "id": "batchPhk",
  "title": "Batch PHK",
  "columns": [
    { "key":"vid",        "label":"VID",             "type":"text",   "editable":false, "searchable":true, "required":true },
    { "key":"nama",       "label":"Nama",            "type":"text",   "editable":false },
    { "key":"alamat",     "label":"Alamat",          "type":"text",   "editable":false },
    { "key":"tanggal",    "label":"Tanggal Efektif", "type":"date",   "editable":true,  "required":true },
    { "key":"alasan",     "label":"Alasan",          "type":"select", "editable":true,  "required":true, "options":"Meninggal◆Lain-lain" },
    { "key":"keterangan", "label":"Keterangan",      "type":"text",   "editable":true }
  ],
  "search":   { "enabled": true, "placeholder": "Cari baris…" },
  "manualAdd": true,
  "rowLimit":  2000,
  "resolve": [
    { "on":"vid", "fill":["nama","alamat"],
      "source":{ "src":"[SRC:daftarPegawai]", "range":"Pegawai!B3:H", "keyCol":"B", "valueCols":"C◆D" } }
  ],
  "action":      "PHK",
  "confirm":     true,
  "submitLabel": "Proses PHK",
  "onSuccess":   { "toast": "Batch PHK selesai" }
}
```

### 3.2 Config per bagian

| Key | Fungsi |
|---|---|
| `columns[].key` | nama field record (generik — ganti kolom = ganti kasus) |
| `columns[].type` | `text` · `number` · `date` · `select` (+ `options`) — nentuin render sel |
| `columns[].editable` | read-only vs bisa diedit **per kolom** |
| `columns[].searchable` | kolom ini kena filter search |
| `columns[].required` | wajib isi sebelum submit |
| `search` | kotak cari — filter kolom `searchable` (client-side) |
| `manualAdd` | `true` = tombol "+ Tambah baris" |
| `rowLimit` | batas jumlah baris (jaga performa) |
| `resolve[]` | autofill berantai — §3.3 |
| `action` | handler logic (sama kayak field-form) |
| `confirm` | `true` = preview dry-run dulu sebelum eksekusi |
| `submitLabel` / `onSuccess` | tombol + toast |

### 3.3 `resolve[]` — autofill berantai (bisa >1)

Pilih 1 nilai → kolom lain keisi otomatis. Tiap entri = 1 rantai independen (boleh banyak dalam 1 page):

```json
"resolve": [
  { "on":"vid",      "fill":["nama","alamat","costCenter"], "source":{…} },
  { "on":"kodeAset", "fill":["namaAset","lokasi"],          "source":"ASSET_LOOKUP" }
]
```

- `on` = kolom/field pemicu
- `fill` = kolom yang keisi (read-only, set `editable:false`)
- `source` = dari mana datanya (2 bentuk):

| `source` | Artinya | Kode? |
|---|---|---|
| object `{src, range, keyCol, valueCols}` | VLOOKUP sheet inline (cari `on` di `keyCol`, ambil `valueCols` sejajar `fill`) | ❌ config doang |
| string `"PHK"` | resolve handler bernama di server (logic kompleks/multi-sheet/Firestore) | ✅ ada di registry |

Default = object (sheet lookup, nol kode). String = escape hatch. Pola sama: `options`(inline) vs `optionsSrc`(sheet).

### 3.4 Data flow

```
Isi manual (+Tambah)  ─┐
                       ├─► parse ─► RESOLVE BORONGAN ─► grid ─► search/edit ─► submit ─► action ─► hasil per-baris
Upload Excel (widget) ─┘            (1 call, semua VID           (read-only/                        (✓/✗ + pesan
                                     → data turunan;             editable per                        balik ke grid)
                                     JANGAN 1000 lookup satu2)   kolom)
```

**Efisiensi (WAJIB):** buat 1000 baris, resolve & submit **borongan** — 1 request kirim semua baris, server balikin semua hasil. Jangan per-baris (1000 call = lambat).

### 3.5 Kegagalan — lanjut semua + lapor per-baris (partial success)

Submit 1000 baris, baris ke-543 gagal → **proses tetap lanjut**, tiap baris dapat status:

```
┌─ Hasil Batch PHK ───────────────────────────┐
│ ✓ 998 berhasil   ✗ 2 gagal                  │
│ … baris 543  Deardo  ✗ VID gak ketemu       │
│ … baris 871  Silvia  ✗ CC gak cocok         │
│ [ Unduh laporan ]  [ Ulangi yang gagal ]    │
└──────────────────────────────────────────────┘
```

- Non-transactional (cocok Google Sheets). Sesuai kontrak `records[]` (hasil per-record).
- Opsi lanjutan (nanti): `confirm:true` = validasi dry-run dulu → tandai baris bakal-gagal SEBELUM eksekusi.

### 3.6 UI

```
┌─ topbar (opsional) ─────────────────────────────┐
│ [ Upload Excel ] [ Template ]        [ Cari… ]  │
├─ content ────────────────────────────────────────┤
│  Batch PHK                                       │
│  ┌─────┬────────┬─────────┬──────────┬─────────┐ │
│  │ VID │ Nama   │ Alamat  │ Tanggal  │ Alasan  │ │  ← VID/Nama/Alamat read-only (autofill)
│  ├─────┼────────┼─────────┼──────────┼─────────┤ │     Tanggal/Alasan editable
│  │ 780…│ Deardo │ Jl. …   │ [📅]     │ [▼]     │ │
│  │ …   │ …      │ …       │ …        │ …       │ │
│  └─────┴────────┴─────────┴──────────┴─────────┘ │
│  [ + Tambah baris ]              [ Proses PHK ]  │
└───────────────────────────────────────────────────┘
```

---

### 3.7 Contoh page batch utuh

```json
{
  "title": "Batch PHK",
  "topbar": { "alignment": "start", "children": [
    {"type":"BUTTON","icon":"Upload","text":"Upload Excel","variant":"outline","onClick":{"type":"UPLOAD_EXCEL","target":"batchPhk","headerRow":1}},
    {"type":"BUTTON","icon":"Download","text":"Template","variant":"outline","onClick":{"type":"DOWNLOAD_TEMPLATE","target":"batchPhk"}}
  ]},
  "content": [
    {"type":"DATA_TABLE","id":"batchPhk","title":"Batch PHK",
     "columns":[
       {"key":"vid","label":"VID","type":"text","editable":false,"searchable":true,"required":true},
       {"key":"nama","label":"Nama","type":"text","editable":false,"searchable":true},
       {"key":"alamat","label":"Alamat","type":"text","editable":false},
       {"key":"tanggal","label":"Tanggal Efektif","type":"date","editable":true,"required":true},
       {"key":"alasan","label":"Alasan","type":"select","editable":true,"required":true,"options":"Meninggal◆Lain-lain"},
       {"key":"keterangan","label":"Keterangan","type":"text","editable":true}
     ],
     "search":{"enabled":true,"placeholder":"Cari baris…"},
     "manualAdd":true,"rowLimit":2000,
     "resolve":[{"on":"vid","fill":["nama","alamat"],"source":{"src":"[SRC:daftarPegawai]","range":"Pegawai!B3:H","keyCol":"B","valueCols":"C◆D"}}],
     "action":"PHK","confirm":true,"submitLabel":"Proses PHK","submitVariant":"destructive","onSuccess":{"toast":"Batch PHK selesai"}}
  ],
  "bottomBar": { "alignment": "end", "children": [] }
}
```

---

## 4. Ringkasan: pilih widget mana

| Butuh | Pakai |
|---|---|
| Lihat/edit data sheet apa adanya | `contentSpreadsheet` |
| Grid + tombol proses per baris | `contentSpreadsheetRowAction` |
| Grid + proses + buka dokumen per baris | `contentSpreadsheetRowView` |
| Grid + banyak ikon per baris (usulan) | `contentSpreadsheetRowActions` |
| Input 1 record (1 orang) | `contentFormAction` (bentuk baru) / `contentForm` (lama) |
| Input beberapa record cepat | `contentForm` + `multi` |
| Input banyak record / dari Excel | `DATA_TABLE` (+ `buttonUpload`/`buttonTemplate`) |
| Filter/aksi di bar atas | `dropdown` / `date` / `buttonSubmit` |
| Jalanin proses backend | `buttonRunAction` |
| Jalanin Apps Script sequential | `buttonSequential` |
| Buka link (statis / dari sheet / dari Firestore) | `buttonLink` |
| Peta | `contentMap` |
| Reset device | `contentResetDevice` |

**Aturan emas:** tampilan didefinisi di JSON (sheet), logic = `action` di server. Fitur baru = tambah config + tunjuk action, jarang perlu kode baru.

---

## 5. Status & yang perlu web-dev bangun

Status per 2026-08-20.

| Widget | Config di sheet | Renderer |
|---|---|---|
| `contentSpreadsheet` | ✅ | ✅ |
| `contentSpreadsheetRowAction` | ✅ | ✅ |
| `contentSpreadsheetRowView` | ✅ live di page Slip Gaji | ❓ **belum dikonfirmasi** |
| `contentSpreadsheetRowActions` | ✅ template siap | 📋 baru spec |
| `contentFormAction` | ✅ live di page Icon | ❓ belum dikonfirmasi |
| `buttonRunAction` | ✅ | ✅ |
| `buttonSequential` | ✅ template siap | 📋 baru spec |
| `buttonLink` | ✅ template siap | 📋 baru spec |
| `DATA_TABLE`, `buttonUpload`, `buttonTemplate` | 📋 | 📋 |
| bar widgets (dropdown/date/spacer/submit/fetch/reset) | ✅ | ✅ |

**Yang perlu dibangun web-dev, urut dari yang paling nyangkut:**

1. **`rowView`** — config-nya udah live di page Slip Gaji. Kalau renderer belum dukung, ikon matanya ga muncul dan itu bukan salah config.
2. **Perlindungan sel berformula** — `values.get` pakai `FORMATTED_VALUE`, jadi sel `=VLOOKUP` ga bisa dibedain dari literal, dan web sekarang bisa nimpa formula tanpa undo. Rinciannya `docs/web-spreadsheet-widget-dev-spec.md` §5.1.
3. **`valueInputOption` per kolom** — sekarang `USER_ENTERED` semua, jadi `0812…` kehilangan nol depan. §5.2.
4. **Cek bentrok saat 2 orang ngedit sel yang sama** — sekarang tulisan terakhir menang diam-diam. §5.3.
5. **Status simpan per sel** — sekarang cuma satu penanda "Menyimpan…" di atas tabel, jadi kalau 3 sel diedit dan 1 gagal, ga ketauan yang mana. Dan kalau gagal, nilai salahnya tetep kelihatan seolah kesimpen. §5.4 — **3 dari 4 state-nya nol kerja backend**.
6. **Navigasi keyboard di grid** — sekarang cuma `Enter`/`Esc` di dalam editor; panah dan Tab ga ngapa-ngapain, masuk edit harus klik dua kali. §5.5.
7. Mirror yang belum jalan: lebar kolom, kolom beku, merge, warna. §2.2 & §3.
8. `DATA_TABLE` + `buttonUpload` + `buttonTemplate`.
9. `buttonSequential`, `buttonLink`, `rowActions[]`.

**Spec per fitur:**

| Dokumen | Isi |
|---|---|
| `docs/web-spreadsheet-widget-dev-spec.md` | mirror sheet→web, tulis-balik, state visual grid |
| `docs/web-row-actions-dev-spec.md` | `rowActions[]` + kontrak `text` ◆ |
| `docs/web-button-sequential-dev-spec.md` | `buttonSequential` |
| `docs/web-button-link-dev-spec.md` | `buttonLink` / `OPEN_LINK` |
| `docs/web-dynamic-form-action-dev-spec.md` | kontrak FORM/action & `records[]` |
| `docs/web-data-table-batch-form-dev-spec.md` | `DATA_TABLE` batch + Excel |
