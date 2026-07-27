# Web Dynamic FORM + Action Service — Dev Spec

**Tanggal:** 2026-07-03
**Status:** DESIGN — disetujui user, menunggu review tech lead (call path + repo Go)
**Repo terdampak:** `web-dev` (Next.js) + service Go BARU (Cloud Run) + VTL Master sheet (`14kDPqAw...`)
**Menggantikan:** pendekatan custom-content-type per fitur — untuk fitur BARU (PHK dst). **Reset device TIDAK diubah** (keputusan user 2026-07-03): `contentResetDevice` dibiarkan as-is, jalur eksekusinya tetap yang sekarang. Migrasi ke FORM opsional, nanti kalau perlu.

---

## 1. Tujuan

Fitur kepegawaian yang sekarang jalan via Apps Script manual (`scripts/autsorz.js`: Add User, Mutasi, Reaktivasi, Reset Device, Update Position, nanti PHK) dipindah ke web:

1. **UI 100% dinamis dari spreadsheet** — form (field, label, dropdown, button) didefine di Web Screen sheet → JSON → web render. Ubah/tambah form = edit sheet, **zero deploy**.
2. **Logic = kode Go di Cloud Run** (keputusan tech lead) — 1 handler per fitur, dipanggil by-name dari JSON (`action`). Fitur dengan logic baru = tambah 1 handler Go.
3. Operator tidak lagi input di tab spreadsheet + run Apps Script. Semua dari web. Tab input lama (`AddUser`/`UpdateUser`) tetap di-append **otomatis** sebagai arsip.

**Prinsip pemisahan:**

> **Type = bentuk tampilan. Action = logic yang jalan.**
> Type baru hanya kalau bentuk visual beda (FORM, SPREADSHEET, nanti STAT_CARDS/MAP). Logic beda cukup action baru — type tetap `FORM`.

---

## 2. Arsitektur

```
SHEET (web-builder)                 WEB-DEV (Next.js, Cloud Run existing)         GO SERVICE (Cloud Run BARU, private)
──────────────────                  ─────────────────────────────────────         ────────────────────────────────────
Web Widget: contentForm       →     render type:"FORM"                            registry: map[string]Action
Web Screen: page phk/mutasi/…       (components/form/*)                             phk.go / mutasi.go / addUser.go /
  ↓ formula rakit JSON              operator isi + submit                           reaktivasi.go / resetDevice.go
Firestore users/{uid}.j                   ↓                                       steps.go (port autsorz.js)
(pipeline existing, TIDAK diubah)   POST /api/actions (PROXY tipis)         →     POST /actions  (exec + dry-run)
                                      1. getSession() (existing)                  GET  /actions  (introspection)
                                      2. inject {userEmail} dll                        ↓
                                      3. forward + ID token (IAM)                 Google Sheets API (service account)
                                    UI tampil hasil per step ✓/✗    ←             Firestore (idempotency + action_logs)
```

- **Call path (REKOMENDASI, konfirmasi tech lead):** browser → Next `/api/actions` → Go. Go service **private** (Cloud Run IAM, invoker = service account web-dev saja). Session auth tetap di Next (cookie `session` Firebase existing); Go percaya identitas yang dikirim Next karena satu-satunya caller dijamin IAM.
  - *Alternatif (tidak direkomendasikan):* browser → Go langsung. Konsekuensi: Go verify session cookie Firebase sendiri + CORS + endpoint publik. Hanya masuk akal kalau ada client lain non-Next yang mau hit Go.
- Region sama (`asia-southeast1`), hop latency ~ms.
- `records` = **array sejak hari 1** (sekarang selalu 1 elemen). Batch / upload Excel di masa depan = loop existing, kontrak API tidak berubah.

---

## 3. Schema JSON — content type `FORM`

### 3.1 Contoh resolved lengkap (whole page, PHK)

Ini yang tersimpan di `users/{uid}.j` (satu node menu di tree):

```json
{
  "label": "PHK",
  "icon": "UserMinus",
  "path": "/kepegawaian/phk",
  "key": "phk",
  "pageData": {
    "title": "Proses PHK Pegawai",
    "description": "Nonaktifkan pegawai dari semua sistem",
    "topbar": { "alignment": "start" },
    "content": [
      {
        "id": "form-phk",
        "type": "FORM",
        "action": "PHK",
        "confirm": true,
        "resolveOn": "vid",
        "multi": true,
        "submitLabel": "Proses PHK",
        "submitVariant": "destructive",
        "onSuccess": { "toast": "PHK berhasil diproses", "then": "RESET_FORM" },
        "fields": [
          { "id": "tenant", "label": "Tenant / Client", "input": "dropdown", "required": true, "shared": true,
            "optionsSrc": "https://docs.google.com/spreadsheets/d/16G0QYAWFVcxLLUf0IUBr2g5pB1hn-A_5MSAHmigviV0/edit",
            "optionsRange": "ClientInduk-active!C3:C" },
          { "id": "vid", "label": "Pegawai", "input": "dropdown", "required": true,
            "optionsSrcFrom": "tenant", "optionsRange": "Pegawai!B3:D" },
          { "id": "tanggal", "label": "Tanggal Efektif", "input": "date", "required": true,
            "width": "1/2", "default": "{today}" },
          { "id": "alasan", "label": "Alasan", "input": "dropdown", "required": true,
            "width": "1/2",
            "options": "Meninggal◆Lain-lain" },
          { "id": "keterangan", "label": "Keterangan", "input": "textarea" },
          { "id": "diprosesOleh", "input": "hidden", "value": "{userEmail}" }
        ]
      }
    ],
    "bottomBar": { "alignment": "start" }
  }
}
```

`MenuItem` + `PageData` = shape existing (`types/menu.type.ts:137-155`), tidak diubah. Perubahan kode type hanya:

```ts
type PageContent = SpreadsheetContent | FormContent   // menu.type.ts:132 — slot "// future:" memang sudah disiapkan
```

### 3.2 Keys FORM

| Key | Wajib | Fungsi |
|---|---|---|
| `id` | ✅ | ID unik blok dalam page |
| `type` | ✅ | `"FORM"` literal |
| `action` | ✅ | Nama handler di registry Go. **Bukan logic** — selector by-name (analog `functionName` di `onOpen()` Apps Script) |
| `confirm` | — (default `true`) | `true` = submit pertama dry-run → dialog preview perubahan → tombol Konfirmasi = eksekusi. `false` = langsung eksekusi |
| `permission` | — (default kosong = view/submit dasar) | **Reuse vocab CUD existing** (`C◆U◆D`, `menu.type.ts:112` — sekarang cuma dipakai content `Spreadsheet`). Di FORM = gate **step opsional destruktif** per action: token `D` ada → step delete action itu jalan; tidak ada → step delete di-skip. PHK: page CS bisa `"D"` (boleh hapus row Pegawai), page client tanpa `D` (set-inactive saja). Lihat §6.4 + §7.9. **WAJIB enforce server-side** — Go baca `permission` dari menu config `j` user (BUKAN dari payload client); jangan tiru enforce grid yang client-only |
| `submitLabel` | ✅ | Teks button |
| `submitVariant` | — (default `default`) | `default` \| `destructive` \| `outline` — vocab `ButtonVariant` existing |
| `onSuccess.toast` | — | Toast sukses (Sonner, pattern existing) |
| `onSuccess.then` | — (default `RESET_FORM`) | `RESET_FORM` (kosongkan form) \| `REFRESH_CONTENT` (bump `spreadsheetSyncKey` — refresh grid SPREADSHEET di page yang sama) |
| `columns` | — (default `1`) | Jumlah field per baris untuk SEMUA field form ini. `1` = vertikal ke bawah; `2` = ke bawah 2-2; dst. Per-field `width` meng-override. Lihat §3.4 |
| `resolveOn` | — | ID field pemicu **live lookup**: field itu berubah → call `GET /api/actions/resolve` (§5.4) → render panel info read-only (key-value + link) di bawah field pemicu. Pengganti "formula autofill" versi live — operator lihat data orangnya SEBELUM submit. Tanpa `resolveOn`, data turunan tetap muncul di preview dry-run. Saat `multi:true` → panel per record |
| `multi` | — (default `false`) | **Multi-record dalam 1 submit** (keputusan user 2026-07-06: batch dari inputan, BUKAN Excel — Excel tetap future §11.3). `true` → field ber-`shared:true` tampil SEKALI di atas (nilai di-copy ke tiap record), field lain jadi per-record dalam card + tombol `+ Tambah` / hapus `✕`. Submit = `records[]` N elemen — API & Go TIDAK berubah (§5.2 hasil per record, §5.2b progress per record). `maxRecords` opsional (default 20) |
| `fields[]` | ✅ | Daftar field, urutan = urutan render |

### 3.3 Keys per field

| Key | Fungsi |
|---|---|
| `id` | Key payload. **HARUS match field schema handler Go** (cek via introspection §5.3) |
| `label` | Label tampil |
| `input` | `text` \| `number` \| `date` \| `textarea` \| `dropdown` \| `hidden` |
| `required` | Validasi client + server. Field yang sedang tersembunyi oleh `visibleIf` → tidak dikirim & required tidak berlaku |
| `options` | Dropdown statis, ◆-separated: `"Resign◆Kontrak habis◆…"` |
| `optionsSrc` + `optionsRange` | Dropdown live dari sheet. Kolom 1 range = **value** (dikirim), kolom 2 = **label** (tampil); 1 kolom = value=label. Resolve **server-side** (service account) saat form mount — client tidak pegang akses sheet. Hasil di-cache server 60 detik (N operator buka form barengan = 1 hit Sheets API) |
| `dependsOn` + `filterColumn` | **Cascading dropdown.** `dependsOn:"clientTujuan"` + `filterColumn:"F"` → options hanya baris yang kolom `F`-nya = nilai field `clientTujuan` terpilih. Parent berubah → options re-fetch, nilai field ini di-reset. Sebelum parent terisi → dropdown disabled ("pilih … dulu"). Hanya valid bersama `optionsSrc` |
| `optionsSrcFrom` | **Cascading lintas-spreadsheet** — dropdown yang SUMBER ssid-nya ikut nilai field lain (kasus: pilih tenant → pegawai tenant itu; tiap tenant beda spreadsheet, jadi `filterColumn` tidak cukup). `optionsSrcFrom:"tenant"` + `optionsRange:"Pegawai!B3:D"` → server resolve nilai tenant → ssid (lookup list pusat, reuse `ResolveTargetSsid` §6.2) → fetch range dari ssid itu. Mechanic renderer = sama persis `dependsOn` (parent berubah → re-fetch + reset; disabled sebelum parent terisi) |
| `default` | Nilai awal saat form dibuka (operator bisa ganti). String literal (`"Aktif"`) atau token (`"{today}"`). Berlaku juga setelah `RESET_FORM` |
| `visibleIf` | `"fieldId◼nilai"` — field muncul hanya jika field lain bernilai itu. Simbol ◼ konsisten DSL existing |
| `pattern` | Regex validasi tambahan (mis. `^628[0-9]+$` untuk HP) |
| `value` (untuk `hidden`) | Token session (`{userEmail}` \| `{userName}` \| `{today}`) ATAU literal baked di config (mis. identitas tenant di page per-tenant). **Dua-duanya di-override Next server-side saat submit**: token dari session, literal dibaca ulang dari menu config (`j`) milik user sendiri — nilai kiriman client dibuang, tidak bisa dipalsu (anti cross-tenant, §7.6). **`{today}` = tanggal WIB (Asia/Jakarta), format `YYYY-MM-DD`** — BUKAN UTC (jam 00–07 WIB beda hari kalau salah zona) |
| `width` | — (default `full`) | `full` \| `1/2` \| `1/3` \| `2/3` \| `1/4` \| `3/4` — lebar field. Lihat §3.4 |
| `shared` | Hanya saat `multi:true` (§3.2): field tampil sekali di atas card list, nilainya di-copy ke SEMUA record saat submit (kasus: `tenant` — 1 batch = 1 tenant). Field `hidden` otomatis shared |

### 3.4 Layout — `columns` form-level + `width` per-field override

Dua level, saling melengkapi:

1. **`columns` (form-level, default `1`)** — jumlah field per baris untuk seluruh form. Kasus umum cukup ini: `columns:2` → field mengalir kiri→kanan, turun 2-2.
2. **`width` (per field, opsional)** — override untuk baris tidak rata: `full` \| `1/2` \| `1/3` \| `2/3` \| `1/4` \| `3/4`. Field tanpa `width` mengikuti `columns`.

```
columns: 1 (default)      columns: 2                 columns: 2, catatan width:"full"
┌──────────────┐          ┌────────┬────────┐        ┌────────┬────────┐
│ Pegawai      │          │ Pegawai│ Tanggal│        │ Pegawai│ Tanggal│
├──────────────┤          ├────────┼────────┤        ├────────┼────────┤
│ Tanggal      │          │ Alasan │ Posisi │        │ Alasan │ Posisi │
├──────────────┤          ├────────┼────────┤        ├────────┴────────┤
│ Alasan       │          │ Client │ …      │        │ Catatan  (full) │
└──────────────┘          └────────┴────────┘        └─────────────────┘
```

Aturan render:

- Implementasi: CSS grid 12 kolom. Default span field = `12 / columns`. Map `width`: `full`=12, `3/4`=9, `2/3`=8, `1/2`=6, `1/3`=4, `1/4`=3.
- Urutan isi SELALU kiri→kanan lalu turun (mengikuti urutan `fields[]`) — tab order keyboard tetap natural. **Tidak ada key `direction`**: "horizontal sejajar semua" = `columns` = jumlah field; column-fill (isi kolom kiri penuh dulu) sengaja tidak didukung (tab order rusak).
- Field `hidden` tidak memakan slot grid.
- **Responsive:** di bawah breakpoint `sm` (mobile) semua field dipaksa full-width — tanpa config.

---

## 4. Renderer web-dev (`components/form/`)

| File | Isi |
|---|---|
| `view-form.tsx` | Loop `fields` dalam CSS grid 12-kolom (`width` → span, §3.4), state nilai, evaluasi `visibleIf`, panel `resolveOn` (live lookup §5.4, debounce 300ms), mode `multi` (card list per record + `+ Tambah`/`✕`, shared fields di atas, expand → `records[]`), orkestrasi submit (dry-run → confirm → exec), disabled saat pending, generate `requestId` (uuid) per intent submit |
| `form-field.tsx` | Switch per `input` type → shadcn existing (`Input`, `Select`, `Calendar`/date-picker, `Textarea`). `hidden` tidak dirender |
| `confirm-dialog.tsx` | Dialog preview dry-run: blok `resolved` (data turunan hasil lookup server, §5.2) + daftar `changes` (`from → to`) per step + Batal/Konfirmasi |
| `result-list.tsx` | Hasil eksekusi: ✓/✗ per step + message |
| `actions/form-options.action.ts` | Server action resolve `optionsSrc`/`optionsRange` via service account — pola sama `getSpreadsheetData()` existing |

Dispatcher: `components/slug-page.tsx` tambah cabang `item.type === "FORM"` → `<ViewForm />` (sekarang single-if `SPREADSHEET`).

**Double-submit guard:** button disabled saat pending + `requestId` sama dikirim ulang saat retry → server balikin hasil run pertama (§7).

---

## 5. Kontrak API

### 5.1 Browser → Next: `POST /api/actions`

Next route = proxy tipis: (1) `getSession()` — 401 kalau tidak ada; (2) override semua field `hidden` bertoken dengan nilai session; (3) forward ke Go + ID token IAM; (4) relay response.

```json
{
  "action": "PHK",
  "dryRun": true,
  "requestId": "a1b2c3d4-…",
  "records": [
    { "tenant": "Vertika Tekno Lokacipta", "vid": "78003598247510",
      "tanggal": "2026-08-01", "alasan": "Lain-lain",
      "keterangan": "permintaan client", "diprosesOleh": "design@consteon.com" },
    { "tenant": "Vertika Tekno Lokacipta", "vid": "48030602863479",
      "tanggal": "2026-08-15", "alasan": "Meninggal",
      "keterangan": "", "diprosesOleh": "design@consteon.com" }
  ]
}
```

(2 elemen = hasil form `multi:true` — field `shared` (tenant) + `hidden` di-copy renderer ke tiap record.)

### 5.2 Go → response (dry-run maupun eksekusi)

```json
{
  "ok": true,
  "dryRun": true,
  "results": [
    {
      "record": 0,
      "resolved": { "Nama": "Rika Putri Amelia Listiana - NIP 12", "No. Ponsel": "6281776629336",
                    "Cost Center": "Kantor Pusat", "Site": "Kantor Pusat" },
      "steps": [
        { "name": "Arsip Inactive", "status": "done", "message": "Row 8 ditambahkan" },
        { "name": "Set Inactive (Induk)", "status": "done",
          "changes": [ { "target": "Pegawai!C42", "from": "active", "to": "inactive" } ] },
        { "name": "Reset Device (Firestore)", "status": "error", "message": "phone 81776629336 (c=62) not_found in users_a1" },
        { "name": "Copy op1 template", "status": "skipped" }
      ]
    }
  ]
}
```

Semantik:

1. Step jalan **berurutan**. Semantik error **per action** (mirror sumber Apps Script-nya): Mutasi/AddUser/Reaktivasi = error 1 step **tidak menghentikan** step berikutnya (perilaku `autsorzMutasi()` dkk); **PHK = fail-fast** — step gagal → step berikutnya di-skip (`status:"skipped"`), mirror `allLogicsOk` di `phk.js` (§6.4). HTTP tetap 200; status per step yang bercerita.
2. `dryRun:true` → step mode preview: baca target, hitung `changes[{target,from,to}]` (persis format `lama=>baru` milik `directUpdate`), **tidak menulis apa pun**.
3. `resolved` (opsional, per record) = **data turunan hasil lookup server** — key display-ready → value. Ini pengganti "autofill" formula sheet: user cuma kirim key (vid), server lookup sisanya dan pamerkan di dialog preview sebelum konfirmasi. Confirm-dialog render sebagai key-value list di atas daftar step.
4. Error level request: `400` validasi (`errors:[{field,message}]` → UI highlight field), `401` no session (di Next), `403` authorize menolak (§7.7), `404` action tidak ada di registry, `409` — tidak dipakai; duplicate `requestId` balas `200` + hasil run pertama + flag `"replayed": true`.

### 5.2b Progress untuk action panjang — `GET /api/actions/status?requestId=…`

Reactivate = 11 step buka banyak spreadsheet → eksekusi bisa 10–30 detik. Mekanisme (TANPA background job — aman dari CPU-throttle Cloud Run):

- `POST /actions` eksekusi **tetap synchronous** (Next proxy timeout longgar, 300 detik). Selama request jalan, Go **update doc `action_logs/{requestId}` setiap step selesai** (`status:"running"`, `steps[]` bertambah).
- UI: fire POST, lalu **paralel** polling `GET /api/actions/status?requestId=…` tiap 2 detik → render progress list (✓ done / ⟳ running / ○ pending) + progress bar. POST balik = hasil final, polling stop.
- Refresh browser di tengah eksekusi aman: `requestId` sama → replay hasil / status terkini, tidak dobel eksekusi.

```json
{ "requestId": "a1b2…", "status": "running",
  "steps": [
    { "name": "Arsip ke UpdateUser", "status": "done" },
    { "name": "Invitation ke Induk", "status": "done" },
    { "name": "Invitation ke Proxy", "status": "running" }
  ] }
```

Dry-run tidak butuh polling (read-only, cepat) — response sync biasa.

### 5.3 Introspection: `GET /api/actions` (Next proxy → Go `GET /actions`)

```json
{
  "actions": [
    { "action": "PHK",
      "description": "Nonaktifkan pegawai dari semua sistem",
      "fields": [
        { "id": "vid", "type": "string", "required": true },
        { "id": "tanggal", "type": "string", "required": true },
        { "id": "alasan", "type": "string", "required": true },
        { "id": "alasanLain", "type": "string", "required": false },
        { "id": "diprosesOleh", "type": "string", "required": true, "sessionToken": true }
      ] }
  ]
}
```

Auto-generate dari schema tiap handler. Guna builder: setelah nyusun form di sheet, cek `id` field sheet vs kontrak handler — mismatch ketahuan sebelum operator kena error.

### 5.4 Live lookup: `GET /api/actions/resolve?action=PHK&tenant=…&vid=…` (Next proxy → Go)

Dipicu `resolveOn` (§3.2) saat field pemicu berubah. Go jalankan **step resolve action itu saja** (PHK = `ResolveEmployee`, logic sama persis dry-run step 0 — satu implementasi dua pintu), **tanpa nulis apa pun**. Response = shape `resolved` §5.2:

```json
{ "resolved": {
    "Nama": "Deardo Satria", "VID": "78003598247510", "No. Ponsel": "6281216680537",
    "Client": "Vertika Tekno Lokacipta", "VID Cost Center": "83674161979544",
    "Cost Center": "Product Group", "Site": "Product Group",
    "# Admin": "https://docs.google.com/spreadsheets/d/1FTaIACxtt…" } }
```

- Value ber-prefix `https://` di-render sebagai link (buka tab baru).
- **Sumber `# Admin`** (konfirmasi user 2026-07-06, dari formula kolom P tab Inactive `=ARRAYFORMULA(…VLOOKUP(J2:J, Client!$B$2:$P, 15, False))`): lookup **VID Cost Center** di tab pusat `Client!B2:P`, ambil kolom ke-15 range = **kolom P** — BUKAN dari Pegawai. Row `Client` yang sama sudah dibaca step 2 (col I = ssid client), jadi `# Admin` gratis, tanpa lookup tambahan.
- **Prinsip umum:** tiap kolom autofill di sheet punya formula, dan formula itu = spek lookup untuk Go (tabel sumber + key + kolom). Saat implementasi, salin formula tiap kolom turunan (tab PHK tenant + Inactive) jadi map `field → (sheet, key, kolom)` di `consts.go` — jangan menebak sumber.
- Debounce client 300ms + cache server 60 detik (pola sama `form-options`).
- Field pemicu di-clear → panel hilang.
- **Filter per persona:** key internal (mis. `# Admin` — link sheet admin company) HANYA dikirim untuk page operator/CS; request dari page client (tenant hidden baked, §6.4) → server omit key internal, client cuma terima data pegawainya. Penentu = page asal request (Next sudah baca menu `j` user untuk override hidden §7.6 — flag `internal` dilempar ke Go dari situ).

---

## 6. Go service (Cloud Run, BARU)

### 6.1 Struktur

```
actions-service/
  main.go            HTTP server: POST /actions, GET /actions, health
  registry.go        map[string]Action — {"PHK": PHK, "MUTASI": Mutasi, "ADD_USER": AddUser,
                     "REAKTIVASI": Reaktivasi}   // RESET_DEVICE tidak dimigrasi (dibiarkan as-is)
  action.go          type Action { Name, Description string; Fields []FieldSpec;
                     Authorize func(Caller) error; Steps []Step }
                     type Step { Name string; Run func(ctx *Ctx) StepResult }
                     type Ctx { Record map[string]string; DryRun bool; Caller Caller }
  steps.go           helper generic (port §6.2)
  consts.go          ssid + kolom map (port konstanta header autsorz.js: aumCP1, auzCP1,
                     indukListSsid, numberOfColumnIn*, dst; + copy ssid aumCP1C/auzCP1C untuk test mode)
  phk.go / mutasi.go / adduser.go / reaktivasi.go / resetdevice.go
  sheets.go          Google Sheets API client (service account — SA yang sama dgn web-dev sheet writer)
  firestorelog.go    idempotency (read-before-run by requestId) + tulis action_logs
```

### 6.2 Port map dari `scripts/autsorz.js`

| Apps Script | Go | Catatan |
|---|---|---|
| `onOpen()` menu → `functionName` | `registry.go` | Konsep identik: nama → function |
| `autsorzMutasi()` dkk (komposisi step) | `mutasi.go` dkk: `Action{Steps: […]}` | 1 file per fitur |
| `generalSearchAndUpdate` / `…Once…` (13 param posisi) | `SearchAndUpdateSheet(cfg SearchUpdateCfg)` | Param jadi struct bernama |
| `directUpdate` (tulis kolom + string `lama=>baru`) | internal → `[]Change{Target,From,To}` | Sumber data preview dry-run |
| `getSsidFromList` (vid → ssid final via list induk) | `ResolveTargetSsid()` | Chain lookup sama |
| `addResult`/`addString` (akumulasi kolom B) | `[]StepResult` return + `WriteResultColumn()` | Hasil tetap ditulis ke kolom B tab input (arsip, format existing) |
| `thisIsTest` + `updateFlag` + ssid copy | `DryRun` flag per request + `ACTIONS_TEST_MODE` env (§9) | |
| `CiFirestore` lib | `cloud.google.com/go/firestore` | Team sudah pakai (asset_cache CF) |

**Step pertama SEMUA action** = `AppendInputRow` (arsip ke tab `AddUser`/`UpdateUser` di control-panel spreadsheet) — keputusan user: sheet tetap arsip permintaan, Apps Script lama masih bisa dipakai paralel selama transisi.

**⚠️ Type contract:** semua write (sheet & Firestore) ikut kanon `docs/runtime-type-contract-DEV.md` (vid/cdt Number, vv/lv String, dst). Jangan menambah writer baru dengan tipe divergen.

### 6.3 Idempotency + audit — Firestore `action_logs`

Doc ID = `requestId`. Read-before-run: doc ada & `status:"done"` → balas hasil tersimpan (`replayed:true`), **tidak eksekusi ulang**. `status` = `running` \| `done`; doc di-update **per step selesai** selama eksekusi (sumber data endpoint status §5.2b).

```json
{
  "requestId": "a1b2c3d4-…",
  "action": "PHK",
  "actor": { "email": "design@consteon.com", "name": "…", "uid": "…" },
  "dryRun": false,
  "records": [ { "vid": "12345", "…": "…" } ],
  "results": [ { "record": 0, "steps": [ "…" ] } ],
  "status": "done",
  "createdAt": "…", "finishedAt": "…"
}
```

(Dry-run TIDAK ditulis ke `action_logs` — hanya eksekusi.)

### 6.4 Action PHK — urutan step (port `scripts/phk.js`, refactor 2026-07-08)

**Sumber logic:** `scripts/phk.js` (versi dry-run, `INACTIVE_DRY_RUN=true`). Port faithful — jangan redesign step.

**⚠️ phk.js sudah di-refactor** (2026-07-08) dari 1 fungsi monolitik jadi modular. Yang berubah dan WAJIB tercermin di port:

1. **Tiap logic = fungsi terpisah** — `inactiveRunLogic1..4` (murni) + `inactiveFunction1..4` (menu, tiap satu jalanin 1 logic untuk semua row). Menu "Inactive" sekarang 4 item independen (`Delete Pegawai` / `Set Inactive` / `Reset Device` / `Copy op1`), bukan 1 tombol gabung. Map 1:1 ke model per-step web (§5.2).
2. **DELETE row Pegawai (logic 1) DIKELUARKAN dari chain otomatis.** Orchestrator `removeInactiveFromPegawai()` (baris ~1614) sekarang jalanin **logic 2→3→4 saja** — logic 1 sengaja di-comment (*"not used during function inactive, but opted to user to run it manually"*), di sheet dijalanin manual via menu `[Inactive] Delete Pegawai`. → **Jawaban pasti pertanyaan lama "apakah delete disengaja": ya, tapi ditarik keluar dari alur otomatis karena destruktif.** Di web = step opsional gated `permission:"D"` (§7.9), default OFF.
3. **Tab arsip baru `Delete Inactive`.** Row yang SUKSES penuh (2+3+4) → seluruh row disalin ke sheet `Delete Inactive` (mirror header `Inactive`, kolom Process di salinan TIDAK dicentang) → baru Process di `Inactive` dicentang. Semacam "move to processed".
4. **`autsorzInactive()`** = wrapper `removeInactiveFromPegawai()` (2→3→4), diekspos di menu Autsorz.

**Flow legacy (2 tingkat) yang digantikan:**

1. Admin tenant isi tab `PHK` di Induk tenant (mis. `1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A`): pilih Nama-NIP dari picker → VID/No. Ponsel/Cost Center/Site keisi **formula sheet**; isi manual Status/Alasan/Tanggal Efektif/Keterangan → tombol Kirim.
2. Row ngumpul lintas-tenant di tab `Inactive` sheet pusat (`Salinan dari autsorz | Support 2A`, `16G0QYAWFVcxLLUf0IUBr2g5pB1hn-A_5MSAHmigviV0`) → ops jalanin menu `[Inactive] Remove from Pegawai` manual.

**Dengan web:** antrian hilang — 1 submit form = 1 eksekusi langsung. **Autofill formula pindah jadi lookup server** (step 0): form cuma kirim `vid`, Go lookup nama/ponsel/CC/site dari Pegawai tenant → tampil di preview dry-run (`resolved`, §5.2). Dua tab lama jadi **arsip** yang ditulis Go (konsisten keputusan arsip AddUser/UpdateUser).

**Mapping kolom tab PHK tenant → form:**

| Kolom sheet PHK | Di web |
|---|---|
| Nama - NIP (picker) | field `vid` (dropdown `optionsSrc` Pegawai tenant, value=VID label=Nama-NIP) |
| Status | TIDAK di form — handler set literal `inactive` |
| Alasan (dropdown) | field `alasan` — **vocab final copy dari data-validation kolom Alasan tab PHK** (contoh terlihat: `Meninggal`, `Lain-lain`) |
| Tanggal Efektif | field `tanggal` (date) |
| Keterangan | field `keterangan` (textarea, opsional) |
| VID, No. Ponsel, Cost Center, Site (formula) | TIDAK di form — lookup server by VID |

**Urutan step action `PHK` (chain FAIL-FAST — beda dari Mutasi dkk, lihat §5.2 poin 1). Mirror `removeInactiveFromPegawai()` = logic 2→3→4, TANPA delete:**

| # | Step | Logic (dari phk.js) |
|---|---|---|
| 0 | `ResolveEmployee` | Lookup VID di Pegawai tenant → nama, no. ponsel, cost center, site (pengganti formula autofill). Lanjut lookup VID Cost Center di `Client!B2:P` pusat → col I (ssid client) + col P (`# Admin` link, mirror formula kolom P Inactive). Sumber per field = salinan formula kolom autofill sheet (§5.4). Gagal = 400, tidak ada step jalan |
| 1 | `AppendArchive` | Append row arsip → tab `PHK` Induk tenant **+** tab `Inactive` sheet pusat (format kolom existing). **Kolom ber-formula JANGAN ditulis** — mis. Inactive col P `# Admin` (ARRAYFORMULA existing ngisi otomatis dari col J; kalau Go ikut nulis P → `#REF!` ketabrak). Aturan umum: kolom arsip milik formula = skip, Go cuma nulis kolom data |
| 2 | `SetInactiveInduk` | (`inactiveRunLogic2`) Lookup Nama Cost Center di `ClientInduk-active!C3:C` (ssid col H) → di Induk itu, cari VID di `Pegawai!B3:B` → set **col C = `inactive`** |
| 3 | `ResetFirestoreUser` | (`inactiveRunLogic3`) Bersihkan No. Ponsel ke format nasional polos (tanpa prefix `0`/`62`) → query `users_a1` **by phone** `i == cleanPhone` lalu filter manual `c === '62'` (hindari composite index; **bukan by VID** — mirror as-is) → set `u:'-'` + tiap doc subcollection `dvc`: `{did:'TBD', in:false}`. 0 device = info, bukan gagal |
| 4 | `CopyOp1Template` | (`inactiveRunLogic4`) Lookup VID di `aumCP1!Active` col B (data mulai row 2) → URL target col L → copy values `op1!B6:F14` dari template ssid `17n7HygBtbipPhvbbwY2r7yoJKVb3m8ESnPob-bMGZsY` |
| 5 | `WriteResult` | Sukses penuh (2+3+4 semua ok) → **salin seluruh row ke tab arsip `Delete Inactive`** (Process di salinan tidak dicentang, mirror header `Inactive`) + centang Process di `Inactive` + tulis Status Update tab PHK tenant. Gagal di salah satu step → tidak dicentang (sinyal legacy dipertahankan) |

Step 2–4 gagal → step berikutnya `skipped`, arsip step 1 tetap ada, Process TIDAK dicentang (mirror: return early, row tidak masuk `successRows`).

**Step DELETE (logic 1) = capability-gated, default OFF.** phk.js sengaja narik hapus-row keluar dari alur otomatis (destruktif). Untuk web, delete = **step opsional dalam action `PHK` yang cuma jalan kalau `permission` page memuat token `D`** (§3.2, §7.9) — reuse vocab CUD existing, bukan action/mekanisme baru:

| Step | Kapan jalan |
|---|---|
| `DeletePegawaiClient` (logic 1: lookup `Client!B3:B` ssid col I → cari VID di `Pegawai!B3:B` → delete row + insert blank di bawah jaga row count) | HANYA jika `permission` page ⊇ `D`. Jalan **setelah** step 2–4 sukses (paling destruktif, terakhir). Default (tanpa `D`) = di-skip, `status:"skipped"`, chain lanjut normal |

- **Page CS** boleh diberi `permission:"D"` → delete ikut jalan.
- **Page client** tanpa `D` → set-inactive saja (persis keadaan otomatis phk.js sekarang).
- Enforce di server (Go baca `permission` dari menu `j`, §7.9) — **bukan** dari payload, **bukan** client-hide tombol doang. Grid CUD existing enforce-nya client-only + IDOR (§7 catatan); FORM TIDAK boleh niru itu.

Jangan gabung delete ke chain otomatis default-ON — itu justru yang di-*undo* di refactor. Alternatif "action kedua `PHK_DELETE_PEGAWAI` terpisah" tetap opsi bila mau tombol/audit sendiri (§12 q6), tapi capability-flag lebih ringkas.

**Multi-tenant + 2 persona (CS company vs client):** tenant BANYAK dan eksekutor utama hari ini = CS company → **v1 = SATU page `phk` untuk CS**, tenant dipilih di dalam form (dropdown bertingkat), BUKAN page per tenant:

```json
"fields": [
  { "id": "tenant", "label": "Tenant / Client", "input": "dropdown", "required": true,
    "optionsSrc": "<ssid pusat>", "optionsRange": "ClientInduk-active!C3:C" },
  { "id": "vid", "label": "Pegawai", "input": "dropdown", "required": true,
    "optionsSrcFrom": "tenant", "optionsRange": "Pegawai!B3:D" },
  { "id": "tanggal", "label": "Tanggal Efektif", "input": "date", "required": true, "width": "1/2", "default": "{today}" },
  { "id": "alasan", "label": "Alasan", "input": "dropdown", "required": true, "width": "1/2", "options": "Meninggal◆Lain-lain" },
  { "id": "keterangan", "label": "Keterangan", "input": "textarea" },
  { "id": "diprosesOleh", "input": "hidden", "value": "{userEmail}" }
]
```

- Dropdown `tenant` = list pusat `ClientInduk-active` (SATU sheet, semua tenant sudah terdaftar di sana — sumber yang sama dipakai step 3).
- Dropdown `vid` = `optionsSrcFrom:"tenant"` (§3.3): pilih tenant → server resolve ssid Induk tenant itu → fetch pegawai. Nambah tenant baru = nol kerjaan (kebaca otomatis dari list pusat).
- Kepemilikan page ini di menu = izin semua tenant (CS only, via Otorisasi §7.7).

**Client self-service (tenant isi sendiri) = page terpisah, dibuat ON-DEMAND** hanya untuk tenant yang memang dikasih akses: copy 2 rows Web Screen, fields TANPA `tenant` (hidden baked per page, override server-side §7.6), `optionsSrc` fix ke Pegawai tenant itu. Handler Go tetap satu — payload sama, bedanya tenant dari config vs dari dropdown.

---

## 7. Security model

1. Session wajib di Next (`getSession()` existing) — tanpa session, request tidak pernah sampai Go.
2. Go service **private**: Cloud Run IAM invoker = service account web-dev saja. URL tidak pernah dikirim ke browser.
3. **Endpoint fixed** — URL tidak pernah berasal dari config JSON (menutup kelas lubang `bar-button.tsx` fetch-URL-verbatim).
4. Action allowlist = keys registry (`404` kalau tidak dikenal).
5. Validasi schema server-side di Go (mirror introspection) — client validation cuma UX.
6. Hidden field di-override Next server-side SELALU: token dari session, **literal (mis. tenant) dibaca ulang dari menu config `j` milik user sendiri** — client tidak bisa memalsukan `{userEmail}` maupun nge-tembak tenant lain lewat payload. Kepemilikan page di menu = scope tenant yang diizinkan (satu sumber RBAC dengan poin 7).
7. **Authorize v1 = kepemilikan menu** (di Next proxy, zero admin surface baru): user boleh eksekusi action X **hanya jika menu JSON (`j`) miliknya memuat page ber-`action:"X"`**. Menu sudah RBAC-ed via sheet Otorisasi → API otomatis ikut aturan yang sama; cabut menu PHK dari user di sheet = user itu juga tidak bisa menembak API-nya. Lolos check → 403 kalau tidak. Slot `Authorize(caller)` per action di Go tetap ada untuk aturan lebih halus kelak (tidak mengubah kontrak).
8. Audit lengkap di `action_logs` (siapa, kapan, payload, hasil per step, requestId).
9. **Capability `permission` (CUD) di FORM — enforce SERVER-SIDE.** Token `D` (dan kelak `C`/`U` untuk action lain) yang gate step destruktif WAJIB dibaca Go dari menu config `j` user (sumber sama dengan poin 6/7), **bukan** dari payload request. Client cuma pakai `permission` buat show/hide tombol (UX). ⚠️ **Jangan tiru enforce CUD grid existing:** di content `Spreadsheet`, `canDelete` cuma client-gate + `/api/spreadsheet/rows` DELETE tanpa cek ownership/permission (IDOR, tercatat di security-reviewer web-dev) — itu lubang, bukan pola. FORM capability harus benar-benar dicek server sebelum step delete jalan.

---

## 8. Sheet side (VTL Master `14kDPqAw…`)

### 8.1 Web Widget — template baru `contentForm`

Row baru (col A = `contentForm`, col J = Base JSON):

```
{"type":"FORM","id":"[ID]","action":"[ACTION]","confirm":[CONFIRM],"resolveOn":"[RESOLVE_ON]","multi":[MULTI],"columns":[COLUMNS],"submitLabel":"[SUBMIT_LABEL]","submitVariant":"[SUBMIT_VARIANT]","onSuccess":{"toast":"[SUCCESS_TOAST]","then":"[THEN]"},"fields":[[FIELDS]]}
```

- `[FIELDS]` = **single unquoted token** (Cara 1 — pattern yang sudah terbukti di `contentResetDevice`): satu cell param berisi JSON array fields utuh.
- `[CONFIRM]` + `[MULTI]` unquoted (boolean). `[COLUMNS]` unquoted (number) — token selalu muncul di template, jadi resolver WAJIB kasih default kalau param kosong (idiom sama dengan `[ROWHEADER]` default 1/2 di contentSpreadsheet): `[CONFIRM]`→`TRUE`, `[MULTI]`→`FALSE`, `[COLUMNS]`→`1`, `[RESOLVE_ON]`→string kosong (renderer: `resolveOn:""` = off).
- Resolver col D = per-widget minimal SUBSTITUTE (idiom 2026-06-02), token→param col mengikuti konvensi Web Screen. Usulan mapping (final saat implementasi sheet, ikuti kolom kosong yang tersedia): `[ID]`→G, `[ACTION]`→H, `[CONFIRM]`→I, `[COLUMNS]`→J, `[SUBMIT_LABEL]`→K, `[SUBMIT_VARIANT]`→L, `[SUCCESS_TOAST]`→M, `[THEN]`→N, `[FIELDS]`→O, `[RESOLVE_ON]`→P, `[MULTI]`→Q.
- `contentResetDevice` (J12) **dibiarkan as-is** — reset device tidak diubah (keputusan 2026-07-03). Semua fitur baru pakai `contentForm`.

### 8.2 Web Screen — contoh page `phk` (registry row 29, sudah ada)

| Row | A | B | C | G (ID) | H (ACTION) | I (CONFIRM) | J (COLUMNS) | K (LABEL) | L (VARIANT) | … | O (FIELDS) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 29 | `phk` | =assembler | | | | | | | | | *(meta U:AE existing)* |
| 30 | `1` | `contentForm` | `content` | `form-phk` | `PHK` | `TRUE` | `2` | `Proses PHK` | `destructive` | | `[{"id":"vid",…},…]` |

Bikin Mutasi/Reaktivasi = copy 2 rows, ganti H + O. Zero deploy.

---

## 9. Error handling & testing

**Error:** §5.2. Pesan error Sheets API (quota/permission) diteruskan verbatim di `message` step — tidak ditelan.

**Known limitation — race dua operator:** dua operator memproses orang yang sama bersamaan → sheet write last-write-wins (tidak transactional). Diterima sebagai risiko: mitigasi = dry-run preview (operator lihat nilai sekarang sebelum konfirmasi) + audit `action_logs` lengkap untuk rekonstruksi. Tidak dibangun locking.

**Testing** (web-dev tidak punya test framework — tidak dipaksakan):
- `ACTIONS_TEST_MODE=1` env di Go → semua ssid target di-swap ke copy (`aumCP1C`/`auzCP1C` — konstanta copy sudah ada di autsorz.js, pola test lama dipertahankan). Eksekusi beneran, sheet sandbox.
- Dry-run = harness natural: preview tanpa tulis.
- Go: unit test `steps.go` (pure logic mapping/parsing) + `go vet`; Next: `pnpm typecheck` (pre-commit existing).

---

## 10. Rollout

| Fase | Isi | Deploy |
|---|---|---|
| 1 | web-dev: `FormContent` type + renderer `components/form/*` + `/api/actions` proxy + status + `form-options` action. Go service skeleton (registry, steps, 1 action pertama: **`PHK`**) | web-dev + Go |
| 2 | Sheet: template `contentForm` + page PHK (Web Screen row 29 sudah ada header). Verifikasi end-to-end live | sheet only |
| 3 | Go: `MUTASI`, `ADD_USER`, `REAKTIVASI` (port per-fitur dari autsorz.js) | Go only |
| 4 | Sheet: page Mutasi/Pendaftaran/Reaktivasi (rows 23-27 Web Screen sudah ada header-nya) | sheet only |
| 5 | Batch input (upload Excel → `records[]` multi) — **future, jangan dibangun sekarang** | — |

Reset device: di luar scope (dibiarkan as-is). Urutan step PHK = **§6.4** (grounded `scripts/phk.js` `removeInactiveFromPegawai()` — masih dry-run di Apps Script; port Go sekalian jadi implementasi non-dry-run pertamanya).

**Transisi Apps Script → Go:** hari ini logic masih Apps Script (manual); Go = target pasti. Selama Go belum live, jalur lama tetap dipakai apa adanya — **JANGAN bikin bridge sementara web → Apps Script Web App** (kerja buangan, dobel security surface). Web FORM go-live bareng Go fase 1-2.

---

## 11. Future — sketch, JANGAN dibangun sekarang

### 11.1 Prefill / edit mode (untuk page `perubahanData`, Web Screen row 25)

Pilih record kunci → form ter-isi data existing → operator ubah sebagian → submit. Sketch schema (final saat page-nya digarap):

```json
{ "type": "FORM", "action": "PERUBAHAN_DATA",
  "record": {
    "keyField": "vid",
    "src": "https://docs.google.com/spreadsheets/d/1x94Q…/edit",
    "range": "Pegawai!C3:K",
    "map": "vid◆nama◆phone◆posisi◆client" },
  "fields": [ "…field id match nama di map…" ] }
```

`keyField` berubah → fetch row by key dari `range` → populate field yang `id`-nya ada di `map`. Schema v1 tidak menghalangi penambahan key `record` ini.

### 11.2 File upload (foto pegawai, AddUser)

Butuh field type `file` + Firebase Storage + aturan size/mime. **PARKED** — didesain saat dibutuhkan.

### 11.3 Batch / upload Excel

`records[]` sudah array — loop existing. Parser Excel + UI table review = kerjaan terpisah.

*(Batch dari inputan form = SUDAH v1 — key `multi` §3.2, dipromosikan dari sini per keputusan user 2026-07-06. Excel tetap coming-soon.)*

### 11.4 Client self-service PHK (per-tenant page)

Bentuk = §6.4, dibuat **on-demand per tenant yang minta akses** — jangan pre-generate untuk semua tenant. Config `FORM` sama dengan page CS kecuali 2 field pertama:

```json
"fields": [
  { "id": "tenant", "input": "hidden", "value": "Vertika Tekno Lokacipta" },
  { "id": "vid", "label": "Pegawai", "input": "dropdown", "required": true,
    "optionsSrc": "https://docs.google.com/spreadsheets/d/1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A/edit",
    "optionsRange": "Pegawai!B3:D" },
  …sisanya identik page CS (tanggal/alasan/keterangan/diprosesOleh)…
]
```

Hidden `tenant` = nama cost center (vocab `ClientInduk-active!C`), di-override server dari menu `j` user (§7.6). Response `resolve` untuk page ini di-filter — `# Admin` tidak dikirim (§5.4).

## 12. Open questions (tech lead)

1. **Call path:** konfirmasi browser → Next proxy → Go private (rekomendasi §2) vs Go publik.
2. **Repo Go:** repo sendiri (`actions-service`) atau monorepo dengan CF asset_cache?
3. **Deploy pipeline:** web-dev sekarang tidak punya CI deploy (Dockerfile manual). Go service ikut pipeline apa?
4. **SA permission:** service account perlu editor access ke semua ssid target (aumCP1, auzCP1, induk, proxy list) — siapa yang grant?
5. **Nasib Apps Script:** setelah fase 4 stabil, `autsorz.js` menu di-disable atau dibiarkan paralel? (Arsip tab tetap ditulis dari Go, jadi paralel aman — tapi dua jalur eksekusi = risiko double-process kalau operator jalanin dua-duanya untuk orang yang sama.)
6. **Delete row Pegawai di web?** phk.js refactor 2026-07-08 narik delete keluar dari alur otomatis (§6.4). Rekomendasi = **capability-gate**: step delete opsional dalam action `PHK`, jalan hanya jika `permission` page ⊇ `D` (reuse vocab CUD, enforce server §7.9), default OFF. Konfirmasi: (a) setuju capability-flag ini; (b) atau tetap mau action terpisah `PHK_DELETE_PEGAWAI` (tombol/audit sendiri). Plus: siapa yang boleh punya page ber-`D` — CS only?
