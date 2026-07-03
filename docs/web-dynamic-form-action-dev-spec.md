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
        "submitLabel": "Proses PHK",
        "submitVariant": "destructive",
        "onSuccess": { "toast": "PHK berhasil diproses", "then": "RESET_FORM" },
        "fields": [
          { "id": "vid", "label": "Pegawai", "input": "dropdown", "required": true,
            "optionsSrc": "https://docs.google.com/spreadsheets/d/1x94Q1qXb4ouoxZNwLPoKjEKifnEq6-8aEMPMhzz4Mps/edit",
            "optionsRange": "Pegawai!C3:D" },
          { "id": "tanggal", "label": "Tanggal Efektif", "input": "date", "required": true,
            "width": "1/2", "default": "{today}" },
          { "id": "alasan", "label": "Alasan", "input": "dropdown", "required": true,
            "width": "1/2",
            "options": "Resign◆Kontrak habis◆Pelanggaran◆Lainnya" },
          { "id": "alasanLain", "label": "Alasan Lainnya", "input": "textarea",
            "visibleIf": "alasan◼Lainnya", "required": true },
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
| `submitLabel` | ✅ | Teks button |
| `submitVariant` | — (default `default`) | `default` \| `destructive` \| `outline` — vocab `ButtonVariant` existing |
| `onSuccess.toast` | — | Toast sukses (Sonner, pattern existing) |
| `onSuccess.then` | — (default `RESET_FORM`) | `RESET_FORM` (kosongkan form) \| `REFRESH_CONTENT` (bump `spreadsheetSyncKey` — refresh grid SPREADSHEET di page yang sama) |
| `columns` | — (default `1`) | Jumlah field per baris untuk SEMUA field form ini. `1` = vertikal ke bawah; `2` = ke bawah 2-2; dst. Per-field `width` meng-override. Lihat §3.4 |
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
| `default` | Nilai awal saat form dibuka (operator bisa ganti). String literal (`"Aktif"`) atau token (`"{today}"`). Berlaku juga setelah `RESET_FORM` |
| `visibleIf` | `"fieldId◼nilai"` — field muncul hanya jika field lain bernilai itu. Simbol ◼ konsisten DSL existing |
| `pattern` | Regex validasi tambahan (mis. `^628[0-9]+$` untuk HP) |
| `value` (untuk `hidden`) | Token session: `{userEmail}` \| `{userName}` \| `{today}`. **Di-inject Next server-side saat submit** — nilai kiriman client di-override, tidak bisa dipalsu. **`{today}` = tanggal WIB (Asia/Jakarta), format `YYYY-MM-DD`** — BUKAN UTC (jam 00–07 WIB beda hari kalau salah zona) |
| `width` | — (default `full`) | `full` \| `1/2` \| `1/3` \| `2/3` \| `1/4` \| `3/4` — lebar field. Lihat §3.4 |

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
| `view-form.tsx` | Loop `fields` dalam CSS grid 12-kolom (`width` → span, §3.4), state nilai, evaluasi `visibleIf`, orkestrasi submit (dry-run → confirm → exec), disabled saat pending, generate `requestId` (uuid) per intent submit |
| `form-field.tsx` | Switch per `input` type → shadcn existing (`Input`, `Select`, `Calendar`/date-picker, `Textarea`). `hidden` tidak dirender |
| `confirm-dialog.tsx` | Dialog preview dry-run: daftar `changes` (`from → to`) per step + Batal/Konfirmasi |
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
    { "vid": "12345", "tanggal": "2026-07-01", "alasan": "Resign", "diprosesOleh": "design@consteon.com" }
  ]
}
```

### 5.2 Go → response (dry-run maupun eksekusi)

```json
{
  "ok": true,
  "dryRun": true,
  "results": [
    {
      "record": 0,
      "steps": [
        { "name": "Arsip ke UpdateUser", "status": "done", "message": "Row 12 ditambahkan" },
        { "name": "Update Induk", "status": "done",
          "changes": [ { "target": "Pegawai!H42", "from": "Aktif", "to": "PHK" } ] },
        { "name": "Update Proxy", "status": "error", "message": "Vid 12345 not found in spreadsheet" },
        { "name": "Update Firestore users_a1", "status": "done" }
      ]
    }
  ]
}
```

Semantik:

1. Step jalan **berurutan**; error 1 step **tidak menghentikan** step berikutnya (mirror perilaku `autsorzMutasi()` dkk — tiap step nulis ke sistem berbeda, laporan per step). HTTP tetap 200; status per step yang bercerita.
2. `dryRun:true` → step mode preview: baca target, hitung `changes[{target,from,to}]` (persis format `lama=>baru` milik `directUpdate`), **tidak menulis apa pun**.
3. Error level request: `400` validasi (`errors:[{field,message}]` → UI highlight field), `401` no session (di Next), `403` authorize menolak (§7.7), `404` action tidak ada di registry, `409` — tidak dipakai; duplicate `requestId` balas `200` + hasil run pertama + flag `"replayed": true`.

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

---

## 7. Security model

1. Session wajib di Next (`getSession()` existing) — tanpa session, request tidak pernah sampai Go.
2. Go service **private**: Cloud Run IAM invoker = service account web-dev saja. URL tidak pernah dikirim ke browser.
3. **Endpoint fixed** — URL tidak pernah berasal dari config JSON (menutup kelas lubang `bar-button.tsx` fetch-URL-verbatim).
4. Action allowlist = keys registry (`404` kalau tidak dikenal).
5. Validasi schema server-side di Go (mirror introspection) — client validation cuma UX.
6. Hidden session token di-inject Next dari session — client tidak bisa memalsukan `{userEmail}`.
7. **Authorize v1 = kepemilikan menu** (di Next proxy, zero admin surface baru): user boleh eksekusi action X **hanya jika menu JSON (`j`) miliknya memuat page ber-`action:"X"`**. Menu sudah RBAC-ed via sheet Otorisasi → API otomatis ikut aturan yang sama; cabut menu PHK dari user di sheet = user itu juga tidak bisa menembak API-nya. Lolos check → 403 kalau tidak. Slot `Authorize(caller)` per action di Go tetap ada untuk aturan lebih halus kelak (tidak mengubah kontrak).
8. Audit lengkap di `action_logs` (siapa, kapan, payload, hasil per step, requestId).

---

## 8. Sheet side (VTL Master `14kDPqAw…`)

### 8.1 Web Widget — template baru `contentForm`

Row baru (col A = `contentForm`, col J = Base JSON):

```
{"type":"FORM","id":"[ID]","action":"[ACTION]","confirm":[CONFIRM],"columns":[COLUMNS],"submitLabel":"[SUBMIT_LABEL]","submitVariant":"[SUBMIT_VARIANT]","onSuccess":{"toast":"[SUCCESS_TOAST]","then":"[THEN]"},"fields":[[FIELDS]]}
```

- `[FIELDS]` = **single unquoted token** (Cara 1 — pattern yang sudah terbukti di `contentResetDevice`): satu cell param berisi JSON array fields utuh.
- `[CONFIRM]` unquoted (boolean). `[COLUMNS]` unquoted (number) — token selalu muncul di template, jadi resolver WAJIB kasih default kalau param kosong (idiom sama dengan `[ROWHEADER]` default 1/2 di contentSpreadsheet): `[CONFIRM]`→`TRUE`, `[COLUMNS]`→`1`.
- Resolver col D = per-widget minimal SUBSTITUTE (idiom 2026-06-02), token→param col mengikuti konvensi Web Screen. Usulan mapping (final saat implementasi sheet, ikuti kolom kosong yang tersedia): `[ID]`→G, `[ACTION]`→H, `[CONFIRM]`→I, `[COLUMNS]`→J, `[SUBMIT_LABEL]`→K, `[SUBMIT_VARIANT]`→L, `[SUCCESS_TOAST]`→M, `[THEN]`→N, `[FIELDS]`→O.
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

Reset device: di luar scope (dibiarkan as-is). Catatan: PHK belum ada di `autsorz.js` (fitur baru) — urutan step-nya perlu didefinisikan bareng user/tech lead saat fase 1; kandidat awal = subset step Mutasi (update Induk + Proxy + CP1 status nonaktif + invitation revoke), TO BE CONFIRMED.

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

## 12. Open questions (tech lead)

1. **Call path:** konfirmasi browser → Next proxy → Go private (rekomendasi §2) vs Go publik.
2. **Repo Go:** repo sendiri (`actions-service`) atau monorepo dengan CF asset_cache?
3. **Deploy pipeline:** web-dev sekarang tidak punya CI deploy (Dockerfile manual). Go service ikut pipeline apa?
4. **SA permission:** service account perlu editor access ke semua ssid target (aumCP1, auzCP1, induk, proxy list) — siapa yang grant?
5. **Nasib Apps Script:** setelah fase 4 stabil, `autsorz.js` menu di-disable atau dibiarkan paralel? (Arsip tab tetap ditulis dari Go, jadi paralel aman — tapi dua jalur eksekusi = risiko double-process kalau operator jalanin dua-duanya untuk orang yang sama.)
