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
Nampilin sheet sebagai grid. Bisa add/edit/delete row (kalau izin `permission` punya token-nya).

| Config | Fungsi |
|---|---|
| `src` | pakai `[SRC:namaPage]` (jangan URL mentah) |
| `permission` | `C◆U◆D` — Create/Update/Delete. Kosong = view-only |
| `visibleSheets` | whitelist tab yang tampil (opsional) |
| `sheetName` | tab default |
| `rowHeader` / `rowStartData` | baris header / baris mulai data |

```json
{"type":"SPREADSHEET","id":"dashboardContent","src":"[SRC:dashboard]","permission":"C◆U◆D","rowHeader":1,"rowStartData":2}
```

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

**Contoh 3 — page batch tabel** (topbar upload+template, content DATA_TABLE): lihat §3.

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
| Input 1 record (1 orang) | `contentForm` |
| Input beberapa record cepat | `contentForm` + `multi` |
| Input banyak record / dari Excel | `DATA_TABLE` (+ `buttonUpload`/`buttonTemplate`) |
| Filter/aksi di bar atas | `dropdown` / `date` / `buttonSubmit` |
| Peta | `contentMap` |
| Reset device | `contentResetDevice` |

**Aturan emas:** tampilan didefinisi di JSON (sheet), logic = `action` di server. Fitur baru = tambah config + tunjuk action, jarang perlu kode baru.

---

## 5. Status & yang perlu web-dev bangun

- **Sudah ada di renderer:** `contentSpreadsheet`, bar widgets (dropdown/date/spacer/buttonSubmit/fetch/reset). (`contentForm`/`RESET_DEVICE` — user: sudah dihandle web-dev versi baru; local checkout masih SPREADSHEET-only.)
- **BARU perlu dibangun web-dev:** `DATA_TABLE` renderer (grid editable + search + resolve batch + submit records[] + hasil per-baris), `buttonUpload` (parser Excel client), `buttonTemplate` (generate/download).
- **Backend:** resolve borongan (bentuk object = VLOOKUP sheet; bentuk string = handler registry). Submit batch = `records[]` ke action, hasil per-record.
- **Terkait:** kontrak FORM/action & records[] = `docs/web-dynamic-form-action-dev-spec.md`. DATA_TABLE = perluasan input surface-nya (bukan logic baru).
