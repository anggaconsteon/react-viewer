# Dev Spec — `DATA_TABLE` (Form-Tabel / Batch Input) + Excel Upload

**Status:** design approved (brainstorm 2026-07-08). Untuk: tim web-dev (Next.js renderer) + backend (Go/action service).
**Terkait:** kontrak FORM/action & `records[]` = `docs/web-dynamic-form-action-dev-spec.md`. Referensi widget bahasa-manusia = `docs/vertika-web-builder-widget-reference.md`. Sheet pattern = `docs/vertika-web-builder-MASTER-REFERENCE.md`.

---

## 1. Tujuan & scope

Tambah **content type `DATA_TABLE`** = permukaan input tabular untuk **banyak record** (batch). Diisi 2 cara: manual (tambah baris) atau upload Excel. Baris → `records[]` → **action handler yang SAMA** dengan FORM. Fitur:

- Kolom fully config-driven (key/label/type/editable/searchable/required per kolom).
- Autofill per-baris (`resolve[]`, multi-chain) — pilih key → kolom turunan keisi (batch resolve).
- Search filter by-column (client).
- Submit batch → hasil **per-baris** (✓/✗), partial success.
- 2 widget bar pendukung TERPISAH: `buttonUpload` (Excel → tabel), `buttonTemplate` (download template).

**Prinsip:** DATA_TABLE **BUKAN logic baru** — cuma UI ke-3 pengisi `records[]`. `FORM`(1) / `FORM`+`multi`(kartu) / `DATA_TABLE`(grid/Excel) → satu action.

**Di luar scope v1:** rollback transaksional, editing kolaboratif realtime, Excel >5MB / >5000 baris (guard `rowLimit`).

---

## 2. Arsitektur

```
Browser                                   Next (proxy)              Go action service
───────                                   ────────────              ─────────────────
DATA_TABLE grid ─ manual/upload ─┐
buttonUpload → parse xlsx client ┘
        │ (resolve saat load/edit)
        ├─ POST /api/actions/resolve-batch ─► resolve tiap rantai ─► Sheets VLOOKUP / handler
        │      ◄─ nilai turunan per baris ───┘
        │ (submit)
        └─ POST /api/actions {records[]} ────► action handler loop ─► Sheets/Firestore
               ◄─ hasil per-record ───────────┘
        (progress: GET /api/actions/status?requestId — reuse FORM §5.2b)
```

- **Excel parse = client-side** (browser), bukan server — hemat bandwidth, privasi, cepat. Library: `xlsx` (SheetJS) atau `exceljs`.
- **Resolve & submit = server**, borongan (1 request untuk N baris).
- Reuse penuh kontrak FORM: `/api/actions`, session auth, Go private (IAM), `action_logs`, idempotency `requestId`, progress polling.

---

## 3. Schema `DATA_TABLE` (resolved JSON — persis yang diterima renderer)

Ini yang tersimpan di `users/{uid}.j` sebagai satu elemen `pageData.content[]` (token `[SRC:…]` sudah ter-resolve per user):

```json
{
  "type": "DATA_TABLE",
  "id": "batchPhk",
  "title": "Batch PHK",
  "columns": [
    { "key": "vid",        "label": "VID",             "type": "text",   "editable": false, "searchable": true,  "required": true,  "width": 140 },
    { "key": "nama",       "label": "Nama",            "type": "text",   "editable": false, "searchable": true,  "width": 200 },
    { "key": "alamat",     "label": "Alamat",          "type": "text",   "editable": false, "width": 240 },
    { "key": "costCenter", "label": "Cost Center",     "type": "text",   "editable": false, "width": 160 },
    { "key": "tanggal",    "label": "Tanggal Efektif", "type": "date",   "editable": true,  "required": true,  "format": "dd-MMM-yyyy", "width": 150 },
    { "key": "alasan",     "label": "Alasan",          "type": "select", "editable": true,  "required": true,  "options": "Meninggal◆Lain-lain", "width": 150 },
    { "key": "keterangan", "label": "Keterangan",      "type": "text",   "editable": true,  "width": 220 }
  ],
  "search": { "enabled": true, "placeholder": "Cari baris…" },
  "manualAdd": true,
  "rowLimit": 2000,
  "resolve": [
    { "on": "vid",
      "fill": ["nama", "alamat", "costCenter"],
      "source": {
        "src": "https://docs.google.com/spreadsheets/d/1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A/edit",
        "range": "Pegawai!B3:H",
        "keyCol": "B",
        "valueCols": "C◆D◆F"
      } }
  ],
  "action": "PHK",
  "confirm": true,
  "submitLabel": "Proses PHK",
  "submitVariant": "destructive",
  "onSuccess": { "toast": "Batch PHK selesai" }
}
```

### 3.1 Keys DATA_TABLE

| Key | Wajib | Fungsi |
|---|---|---|
| `type` | ✅ | `"DATA_TABLE"` literal |
| `id` | ✅ | ID unik — target `buttonUpload`/`buttonTemplate` merujuk ini |
| `title` | — | judul di atas grid |
| `columns[]` | ✅ | definisi kolom (§3.2) |
| `search` | — | `{enabled, placeholder}` — kotak cari filter kolom `searchable` |
| `manualAdd` | — (default `false`) | `true` = tombol "+ Tambah baris" |
| `rowLimit` | — (default `2000`) | batas jumlah baris; upload/tambah melewati batas → tolak + toast |
| `resolve[]` | — | autofill per-baris (§5) |
| `action` | ✅ | nama handler di registry (sama dengan FORM) |
| `confirm` | — (default `true`) | `true` = dry-run preview batch sebelum eksekusi |
| `submitLabel` / `submitVariant` | — | tombol submit (vocab shadcn) |
| `onSuccess.toast` | — | toast setelah sukses |

### 3.2 Keys per kolom (`columns[]`)

| Key | Fungsi |
|---|---|
| `key` | nama field record (= header Excel yang di-map; = key di `records[]`) |
| `label` | header kolom tampil |
| `type` | `text` \| `number` \| `date` \| `select` — nentuin editor sel + validasi |
| `options` | untuk `type:"select"` — ◆-separated |
| `format` | untuk `type:"date"` — format tampil (`dd-MMM-yyyy`) |
| `editable` | `false` = read-only (kolom kunci / hasil autofill). Default `true` |
| `searchable` | `true` = kolom kena filter search |
| `required` | validasi client + server sebelum submit; baris invalid ditandai |
| `width` | lebar px (opsional; default auto) |

---

## 4. Widget bar pendukung (TERPISAH dari DATA_TABLE)

### 4.1 `buttonUpload` — Excel → feed ke tabel

```json
{ "type": "BUTTON", "variant": "outline", "size": "default", "icon": "Upload", "text": "Upload Excel",
  "onClick": { "type": "UPLOAD_EXCEL", "target": "batchPhk", "sheet": "Sheet1", "headerRow": 1 } }
```

Perilaku:
1. Klik → buka file picker (`.xlsx`, `.xls`, `.csv`).
2. Parse client-side (SheetJS). Baca sheet `onClick.sheet` (default sheet pertama), header di baris `headerRow` (default 1).
3. **Map header → `key` kolom** DATA_TABLE `target`: cocokkan teks header Excel dengan `columns[].label` ATAU `columns[].key` (case-insensitive, trim). Kolom yang gak match → diabaikan; kolom `required` yang gak ke-map → warning.
4. Baris di-append ke tabel `target` (respect `rowLimit`). Trigger `resolve[]` batch untuk baris baru.
5. Toast: "N baris dimuat" / error parse.

### 4.2 `buttonTemplate` — download template

```json
{ "type": "BUTTON", "variant": "outline", "size": "default", "icon": "Download", "text": "Template Excel",
  "onClick": { "type": "DOWNLOAD_TEMPLATE", "target": "batchPhk" } }
```

Perilaku: generate `.xlsx` di client dari `columns[]` tabel `target` — 1 baris header = `columns[].label` (hanya kolom yang bukan hasil `resolve` = kolom yang perlu diisi user; kolom autofill boleh di-skip atau ditandai "(otomatis)"). Alternatif: `{"type":"DOWNLOAD","url":"…file.xlsx"}` untuk template statis.

---

## 5. `resolve[]` — autofill per-baris (multi-chain)

```json
"resolve": [
  { "on": "vid",      "fill": ["nama","alamat","costCenter"], "source": { "src":"…", "range":"Pegawai!B3:H", "keyCol":"B", "valueCols":"C◆D◆F" } },
  { "on": "kodeAset", "fill": ["namaAset","lokasi"],          "source": "ASSET_LOOKUP" }
]
```

- `on` = kolom pemicu. Saat nilainya di-set/berubah (per baris) → jalankan resolve rantai itu.
- `fill` = kolom yang diisi hasil lookup (urutan sejajar `valueCols`). Kolom ini idealnya `editable:false`.
- `source`:
  - **object** `{src, range, keyCol, valueCols}` → VLOOKUP sheet: cari nilai `on` di `keyCol` dalam `range`, ambil `valueCols` (◆-sep, sejajar `fill`). **Server-side, reuse resolver `optionsSrc`, cache 60s.** Nol kode baru.
  - **string** `"ASSET_LOOKUP"` → panggil resolve handler bernama di registry Go (logic kompleks). 

**Batch (WAJIB):** untuk N baris, resolve **sekali** — kirim semua nilai `on` unik, terima map `onValue → {fill values}`, isi semua baris. JANGAN N request. Lihat §7.2.

**Kapan resolve jalan:**
- Setelah upload Excel (semua baris baru).
- Setelah user isi/ubah kolom `on` di baris manual (debounce 300ms, batch baris yang berubah).

---

## 6. Renderer web-dev (`components/data-table/`)

| File | Isi |
|---|---|
| `view-data-table.tsx` | Root: state baris `rows[]`, orkestrasi resolve batch + submit (dry-run→confirm→exec), progress, hasil. Dengar event dari `buttonUpload` (via store, by `id`). |
| `data-table-grid.tsx` | Grid: render `columns` sebagai header, `rows` sebagai baris. Virtualized (banyak baris) — pakai `@tanstack/react-virtual` atau sejenis. Baris invalid/gagal ditandai (border merah + tooltip). |
| `data-table-cell.tsx` | Sel per `type`: `text`→Input, `number`→Input numeric, `date`→date-picker, `select`→Select (shadcn). Read-only kalau `editable:false`. |
| `data-table-toolbar.tsx` | Search box (filter kolom `searchable`) + "+ Tambah baris" (kalau `manualAdd`) + tombol submit. |
| `data-table-results.tsx` | Ringkasan hasil (✓ N / ✗ M) + tabel baris gagal + "Unduh laporan" + "Ulangi yang gagal". |
| `actions/parse-excel.ts` | Client util: File → rows[] (SheetJS), map header→key. |
| `actions/resolve-batch.action.ts` | Server action: kirim rantai resolve → nilai turunan. |
| `lib/stores/data-table.store.ts` | Zustand: rows per table `id`, dipush oleh `buttonUpload`. |

**Dispatcher `slug-page.tsx`:** tambah cabang `item.type === "DATA_TABLE"` → `<ViewDataTable table={item} />` (sekarang single-if `SPREADSHEET`).
**`bar-button.tsx`:** tambah handler `UPLOAD_EXCEL` (buka picker → parse → push ke store by `target`) + `DOWNLOAD_TEMPLATE` (generate xlsx dari kolom table `target`).

---

## 7. Kontrak API

### 7.1 Submit batch — `POST /api/actions` (reuse FORM)

Sama persis FORM, `records[]` = baris tabel (bisa ribuan):

```json
{
  "action": "PHK",
  "dryRun": false,
  "requestId": "a1b2c3d4-…",
  "records": [
    { "vid": "78003598247510", "nama": "Deardo Satria", "alamat": "Jl. …", "costCenter": "Product Group",
      "tanggal": "2026-08-01", "alasan": "Lain-lain", "keterangan": "", "diprosesOleh": "cs@consteon.com" },
    { "vid": "48030602863479", "…": "…" }
  ]
}
```

Response — hasil **per-record** (index = urutan baris):

```json
{
  "ok": true, "dryRun": false,
  "results": [
    { "record": 0, "status": "done",  "steps": [ … ] },
    { "record": 1, "status": "error", "message": "VID 48030602863479 not found in Pegawai", "steps": [ … ] }
  ],
  "summary": { "total": 1000, "done": 998, "error": 2 }
}
```

- Error 1 record **tidak menghentikan** record lain (partial success). `summary` untuk header hasil.
- `dryRun:true` (kalau `confirm`) → validasi + hitung perubahan tiap record TANPA menulis; tandai baris bakal-gagal.
- Batch besar → progress via `GET /api/actions/status?requestId` (reuse FORM §5.2b): Go update `action_logs` per record selesai; UI polling → progress bar `X/1000`.

### 7.2 Resolve batch — `POST /api/actions/resolve-batch`

```json
{
  "requests": [
    { "chainId": 0, "source": { "src":"…", "range":"Pegawai!B3:H", "keyCol":"B", "valueCols":"C◆D◆F" },
      "keys": ["78003598247510", "48030602863479", "…unik…"] },
    { "chainId": 1, "source": "ASSET_LOOKUP", "keys": ["AST-001","AST-002"] }
  ]
}
```

Response — per chain, map key → nilai `fill` (urutan sejajar `valueCols`/handler):

```json
{
  "results": [
    { "chainId": 0, "values": {
        "78003598247510": ["Rika Putri", "Jl. Melati 1", "Kantor Pusat"],
        "48030602863479": ["Silvia Yankee", "Jl. Anggrek 2", "Product Group"] } },
    { "chainId": 1, "values": { "AST-001": ["Genset 5kVA", "Gudang A"] } }
  ]
}
```

- 1 call resolve SEMUA baris. Server dedup `keys`, VLOOKUP/handler sekali per key unik, cache 60s.
- Key gak ketemu → tidak muncul di `values` → renderer kosongkan `fill` + (opsional) tandai baris.

### 7.3 Introspection — `GET /api/actions` (reuse FORM)
Cek field/schema handler `action` cocok dengan `columns[].key` sebelum go-live.

---

## 8. Data flow (langkah demi langkah)

1. Page load → `ViewDataTable` render grid kosong (atau baris awal kalau `source` awal).
2. **Isi**: (a) manual "+ Tambah baris" → baris kosong editable; ATAU (b) `buttonUpload` → parse Excel → push N baris ke store `batchPhk`.
3. **Resolve**: baris baru dengan kolom `on` terisi → `resolve-batch` (borongan) → isi kolom `fill` (read-only).
4. **Edit/search**: user benerin kolom `editable`, filter via search.
5. **Validasi client**: kolom `required` kosong → baris ditandai, submit disabled sampai beres (atau submit skip baris invalid — lihat §9).
6. **Submit**: `confirm:true` → dry-run → dialog ringkasan ("998 siap, 2 bakal gagal") → Konfirmasi → eksekusi.
7. **Progress**: polling status → bar `X/1000`.
8. **Hasil**: `data-table-results` — ✓/✗ per baris, unduh laporan, ulangi yang gagal (re-submit hanya baris `error`).

---

## 9. Error handling & validasi

- **Client (pra-submit):** `required` kosong, `type` mismatch (tanggal invalid, number bukan angka), `select` di luar `options` → tandai sel + baris. Submit: **skip baris invalid** (default) atau block sampai beres (config `blockOnInvalid`, future). v1 = skip + laporkan sebagai `error` di hasil.
- **Server (saat eksekusi):** lanjut-semua, hasil per-record (§7.1). Pesan error Sheets/handler diteruskan verbatim.
- **Upload:** file bukan spreadsheet / sheet gak ada / header gak match `required` → tolak + toast jelas, tabel tidak berubah.
- **rowLimit** terlampaui → tolak sisa + toast "maksimum N baris".
- **Known limitation:** non-transactional (partial success). Mitigasi = `confirm` dry-run + laporan lengkap + "ulangi yang gagal". Tidak ada rollback v1.

---

## 10. Parse Excel (client)

- Library: **SheetJS (`xlsx`)** — baca `.xlsx/.xls/.csv`, ambil sheet by name/index, baris dari `headerRow+1`.
- Header mapping: normalize (trim, lowercase) header Excel → cocokkan ke `columns[].label` lalu `columns[].key`. Simpan map; kolom tak dikenal diabaikan (log ke console + toast ringkas "3 kolom Excel diabaikan").
- Tipe: nilai sel dikonversi sesuai `columns[].type` saat masuk grid (date → ISO, number → Number). Konversi gagal → sel ditandai invalid.
- Batas: file >5MB atau baris > `rowLimit` → tolak dengan pesan.

---

## 11. Security (reuse FORM §7)

1. Session wajib (Next `getSession()`).
2. Go private (Cloud Run IAM), URL tak pernah ke browser.
3. Endpoint fixed (bukan dari config JSON).
4. `action` allowlist = registry.
5. Validasi schema server (mirror `columns` → field handler).
6. Field `hidden`/derived (mis. `diprosesOleh`, tenant) di-inject/override server dari session/menu config — bukan dari payload.
7. Authorize = kepemilikan menu (page ber-`action` ada di `j` user).
8. Audit `action_logs` (batch: simpan `records[]` + hasil per-record + `requestId`).
9. Resolve `source` object: range dibaca via service account; **jangan** percaya `src` sembarang dari client — untuk v1 `source` datang dari config page (sheet), bukan input user, jadi aman. (Kalau kelak user bisa nunjuk src, whitelist domain.)

---

## 12. Sheet side (VTL Master `14kDPqAw…`)

### 12.1 Web Widget — template baru

**`contentDataTable`** (col A=`contentDataTable`, col J=Base JSON). `[COLUMNS]`, `[RESOLVE]` = single unquoted token (array JSON utuh, Cara 1); `[CONFIRM]`/`[MANUAL_ADD]` unquoted boolean; `[ROW_LIMIT]` unquoted number:

```
{"type":"DATA_TABLE","id":"[ID]","title":"[TITLE]","columns":[[COLUMNS]],"search":{"enabled":[SEARCH],"placeholder":"[SEARCH_PH]"},"manualAdd":[MANUAL_ADD],"rowLimit":[ROW_LIMIT],"resolve":[[RESOLVE]],"action":"[ACTION]","confirm":[CONFIRM],"submitLabel":"[SUBMIT_LABEL]","submitVariant":"[SUBMIT_VARIANT]","onSuccess":{"toast":"[SUCCESS_TOAST]"}}
```

Resolver col D = per-widget minimal SUBSTITUTE (idiom existing). Token→param col mengikuti kolom kosong (final saat implementasi): `[ID]`→G, `[TITLE]`→H, `[COLUMNS]`→I, `[RESOLVE]`→J, `[ACTION]`→K, `[SUBMIT_LABEL]`→L, `[SUBMIT_VARIANT]`→M, `[SUCCESS_TOAST]`→N, `[SEARCH]`→O (default `true`), `[SEARCH_PH]`→P, `[MANUAL_ADD]`→Q (default `false`), `[ROW_LIMIT]`→R (default `2000`), `[CONFIRM]`→S (default `TRUE`).

**`buttonUpload`** (col J):
```
{"type":"BUTTON","variant":"[VARIANT]","size":"[SIZE]","icon":"[ICON]","text":"[TEXT]","onClick":{"type":"UPLOAD_EXCEL","target":"[TARGET]","sheet":"[SHEET]","headerRow":[HEADER_ROW]}}
```

**`buttonTemplate`** (col J):
```
{"type":"BUTTON","variant":"[VARIANT]","size":"[SIZE]","icon":"[ICON]","text":"[TEXT]","onClick":{"type":"DOWNLOAD_TEMPLATE","target":"[TARGET]"}}
```

> ⚠️ **Web Widget col A = `ARRAYFORMULA(I1:I)` spill.** Tambah template = tulis **col I (nama) + col J (template) SAJA**. JANGAN tulis col A (bikin spill collapse → semua VLOOKUP `#N/A`). (Killer #1, kejadian 2026-07-08.)

### 12.2 Web Screen — contoh page batch PHK

| Section | Widget | Params |
|---|---|---|
| header | (pageWrapper) | title dari label menu |
| topbar | `buttonUpload` | target=`batchPhk`, text="Upload Excel", icon="Upload" |
| topbar | `buttonTemplate` | target=`batchPhk`, text="Template", icon="Download" |
| content | `contentDataTable` | id=`batchPhk`, columns=[…], resolve=[…], action=`PHK`, … |

Bikin batch fitur lain = ganti `columns` + `action` + `resolve`. Zero deploy sheet.

---

## 13. Rollout

| Fase | Isi | Pihak |
|---|---|---|
| 1 | web-dev: `DATA_TABLE` renderer (`components/data-table/*`) + dispatch slug-page + store. Grid read-only + submit `records[]` (reuse `/api/actions`) + hasil per-baris | web-dev |
| 2 | `buttonUpload` (parse Excel client) + `buttonTemplate` (generate xlsx) + handler di `bar-button.tsx` | web-dev |
| 3 | `resolve-batch` (backend + client wiring) — autofill borongan; kolom editable | web-dev + Go |
| 4 | Sheet: template `contentDataTable`/`buttonUpload`/`buttonTemplate` + page batch PHK. Verifikasi end-to-end live | sheet |
| 5 | `confirm` dry-run batch + validasi client + "ulangi yang gagal" | web-dev + Go |

Ship config sheet BARENG renderer (jangan pre-stage — unknown content type = null, aman, tapi tetap barengin).

---

## 14. Open questions (tech lead / web-dev)

1. **Library grid**: `@tanstack/react-table` + virtualizer, atau grid custom? (Rekomendasi: tanstack-table + tanstack-virtual — editable + virtualized.)
2. **Batas baris realistis**: `rowLimit` default 2000 cukup? Excel bisa 10k+. Kalau perlu, chunk submit (mis. 500/batch) + progress agregat.
3. **`resolve-batch` endpoint**: reuse `/api/actions/resolve` (extend jadi batch) atau endpoint baru? (Spec pisah biar jelas; boleh digabung.)
4. **Template generate vs statis**: generate dari `columns` (dinamis) disetujui? atau tetap sediakan `url` statis juga?
5. **Kolom autofill di template**: di-skip (user gak isi) atau ditulis dengan catatan "(otomatis)"?
6. **`blockOnInvalid` vs skip**: v1 = skip baris invalid + laporkan. Setuju?
