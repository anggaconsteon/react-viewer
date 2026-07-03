# Web Dynamic FORM + Action Service — Dev Spec

**Tanggal:** 2026-07-03
**Status:** DESIGN — disetujui user, menunggu review tech lead (call path + repo Go)
**Repo terdampak:** `web-dev` (Next.js) + service Go BARU (Cloud Run) + VTL Master sheet (`14kDPqAw...`)
**Menggantikan:** pendekatan custom-content-type per fitur (`contentResetDevice` / `type:"RESET_DEVICE"` — renderer belum pernah dibuat, tidak ada kode yang dibuang)

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
          { "id": "tanggal", "label": "Tanggal Efektif", "input": "date", "required": true },
          { "id": "alasan", "label": "Alasan", "input": "dropdown", "required": true,
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
| `fields[]` | ✅ | Daftar field, urutan = urutan render |

### 3.3 Keys per field

| Key | Fungsi |
|---|---|
| `id` | Key payload. **HARUS match field schema handler Go** (cek via introspection §5.3) |
| `label` | Label tampil |
| `input` | `text` \| `number` \| `date` \| `textarea` \| `dropdown` \| `hidden` |
| `required` | Validasi client + server. Field yang sedang tersembunyi oleh `visibleIf` → tidak dikirim & required tidak berlaku |
| `options` | Dropdown statis, ◆-separated: `"Resign◆Kontrak habis◆…"` |
| `optionsSrc` + `optionsRange` | Dropdown live dari sheet. Kolom 1 range = **value** (dikirim), kolom 2 = **label** (tampil); 1 kolom = value=label. Resolve **server-side** (service account) saat form mount — client tidak pegang akses sheet |
| `visibleIf` | `"fieldId◼nilai"` — field muncul hanya jika field lain bernilai itu. Simbol ◼ konsisten DSL existing |
| `pattern` | Regex validasi tambahan (mis. `^628[0-9]+$` untuk HP) |
| `value` (untuk `hidden`) | Token session: `{userEmail}` \| `{userName}` \| `{today}`. **Di-inject Next server-side saat submit** — nilai kiriman client di-override, tidak bisa dipalsu |

---

## 4. Renderer web-dev (`components/form/`)

| File | Isi |
|---|---|
| `view-form.tsx` | Loop `fields`, state nilai, evaluasi `visibleIf`, orkestrasi submit (dry-run → confirm → exec), disabled saat pending, generate `requestId` (uuid) per intent submit |
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
3. Error level request: `400` validasi (`errors:[{field,message}]` → UI highlight field), `401` no session (di Next), `403` `authorize` hook menolak, `404` action tidak ada di registry, `409` — tidak dipakai; duplicate `requestId` balas `200` + hasil run pertama + flag `"replayed": true`.

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
                     "REAKTIVASI": Reaktivasi, "RESET_DEVICE": ResetDevice}
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

Doc ID = `requestId`. Read-before-run: doc ada & `status:"done"` → balas hasil tersimpan (`replayed:true`), **tidak eksekusi ulang**.

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
7. Slot `Authorize(caller)` per action — isi RBAC menyusul (mis. cek email vs daftar admin); lubangnya dibuat sekarang supaya penambahan tidak mengubah kontrak.
8. Audit lengkap di `action_logs` (siapa, kapan, payload, hasil per step, requestId).

---

## 8. Sheet side (VTL Master `14kDPqAw…`)

### 8.1 Web Widget — template baru `contentForm`

Row baru (col A = `contentForm`, col J = Base JSON):

```
{"type":"FORM","id":"[ID]","action":"[ACTION]","confirm":[CONFIRM],"submitLabel":"[SUBMIT_LABEL]","submitVariant":"[SUBMIT_VARIANT]","onSuccess":{"toast":"[SUCCESS_TOAST]","then":"[THEN]"},"fields":[[FIELDS]]}
```

- `[FIELDS]` = **single unquoted token** (Cara 1 — pattern yang sudah terbukti di `contentResetDevice`): satu cell param berisi JSON array fields utuh.
- `[CONFIRM]` unquoted (boolean).
- Resolver col D = per-widget minimal SUBSTITUTE (idiom 2026-06-02), token→param col mengikuti konvensi Web Screen. Usulan mapping (final saat implementasi sheet, ikuti kolom kosong yang tersedia): `[ID]`→G, `[ACTION]`→H, `[CONFIRM]`→I, `[SUBMIT_LABEL]`→J, `[SUBMIT_VARIANT]`→K, `[SUCCESS_TOAST]`→L, `[THEN]`→M, `[FIELDS]`→N.
- `contentResetDevice` (J12) **superseded** — reset device dinyatakan ulang sebagai `contentForm` + `action:"RESET_DEVICE"`. Renderer `RESET_DEVICE` belum pernah dibuat di web-dev, jadi tidak ada kode dibuang.

### 8.2 Web Screen — contoh page `phk` (registry row 29, sudah ada)

| Row | A | B | C | G (ID) | H (ACTION) | I (CONFIRM) | J (LABEL) | K (VARIANT) | … | N (FIELDS) |
|---|---|---|---|---|---|---|---|---|---|---|
| 29 | `phk` | =assembler | | | | | | | | *(meta U:AE existing)* |
| 30 | `1` | `contentForm` | `content` | `form-phk` | `PHK` | `TRUE` | `Proses PHK` | `destructive` | | `[{"id":"vid",…},…]` |

Bikin Mutasi/Reaktivasi = copy 2 rows, ganti H + N. Zero deploy.

---

## 9. Error handling & testing

**Error:** §5.2. Pesan error Sheets API (quota/permission) diteruskan verbatim di `message` step — tidak ditelan.

**Testing** (web-dev tidak punya test framework — tidak dipaksakan):
- `ACTIONS_TEST_MODE=1` env di Go → semua ssid target di-swap ke copy (`aumCP1C`/`auzCP1C` — konstanta copy sudah ada di autsorz.js, pola test lama dipertahankan). Eksekusi beneran, sheet sandbox.
- Dry-run = harness natural: preview tanpa tulis.
- Go: unit test `steps.go` (pure logic mapping/parsing) + `go vet`; Next: `pnpm typecheck` (pre-commit existing).

---

## 10. Rollout

| Fase | Isi | Deploy |
|---|---|---|
| 1 | web-dev: `FormContent` type + renderer `components/form/*` + `/api/actions` proxy + `form-options` action. Go service skeleton (registry, steps, 1 action: `RESET_DEVICE`) | web-dev + Go |
| 2 | Sheet: template `contentForm` + page Reset Device via FORM. Verifikasi end-to-end live | sheet only |
| 3 | Go: `PHK`, `MUTASI`, `ADD_USER`, `REAKTIVASI` (port per-fitur dari autsorz.js) | Go only |
| 4 | Sheet: page PHK/Mutasi/Pendaftaran/Reaktivasi (rows 23-30 Web Screen sudah ada header-nya) | sheet only |
| 5 | Batch input (upload Excel → `records[]` multi) — **future, jangan dibangun sekarang** | — |

---

## 11. Open questions (tech lead)

1. **Call path:** konfirmasi browser → Next proxy → Go private (rekomendasi §2) vs Go publik.
2. **Repo Go:** repo sendiri (`actions-service`) atau monorepo dengan CF asset_cache?
3. **Deploy pipeline:** web-dev sekarang tidak punya CI deploy (Dockerfile manual). Go service ikut pipeline apa?
4. **SA permission:** service account perlu editor access ke semua ssid target (aumCP1, auzCP1, induk, proxy list) — siapa yang grant?
5. **Nasib Apps Script:** setelah fase 4 stabil, `autsorz.js` menu di-disable atau dibiarkan paralel? (Arsip tab tetap ditulis dari Go, jadi paralel aman — tapi dua jalur eksekusi = risiko double-process kalau operator jalanin dua-duanya untuk orang yang sama.)
