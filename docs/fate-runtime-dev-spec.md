# Fate Runtime — Dev Spec (Widget + Cloud Function + Schema)

Tanggal: 2026-07-14 · Status: PROPOSED (menunggu dev)
Referensi UI: `src/component/web/Fate_ops_app.jsx` + `src/component/web/Fate_model_app_revisi.jsx`
Pola acuan yang sudah LIVE: incident/complaint runtime (workflow buttons + event ledger + timelineLedger) dan movement → CF → asset_cache.

---

## 1. Overview

Dua sisi aplikasi (1 codebase, beda page):
- **Fate Ops**: bikin project, assign model, pantau, konfirmasi selisih atas nama brand.
- **Fate Model**: terima assignment, konfirmasi keikutsertaan, lapor hadir (selfie), lapor selesai (selfie).

Phase per assignment (field `ast`):
```
assigned ──(model konfirmasi)──> scheduled ──(lapor hadir)──> present ──(lapor selesai)──> ┬─ ovm=0 → closed
                                                                                           └─ ovm>0 → awaiting ──(ops konfirmasi selisih)──> closed
```
Catatan: phase `ready` (time-gated) dari mockup DIBUANG — scheduled langsung boleh lapor hadir. Deteksi waktu (selisih) dipindah ke Cloud Function, bukan renderer.

---

## 2. Schema Firestore (semua KEYED, prefix `84214220504259//`)

### 2.1 `//fate_project` — ditulis form ops (SSOT project)
| key | type | isi |
|---|---|---|
| pn | S | no project `FPRJ-2026-000001` (autoNumber) |
| bn / tt / vn | S | brand / judul / venue |
| dt | S | tanggal display (`5 Jul`) |
| dts | N | epoch tanggal (buat CF cek jadwal) |
| st / et | S | jam mulai / selesai (`09:00` / `17:00`) |
| mv[] / mn[] | arr | vid & nama model terpilih (dari TABLE_PICKER multi) |
| cv / cn | S | creator vid / nama |
| av / an / sv / sn | S | CC vid/nama, site vid/nama |
| t / ts | S | epoch / timestamp display |

### 2.2 `//fate_assign` — DIBUAT CF (fan-out, 1 doc per model per project)
| key | type | isi |
|---|---|---|
| anm | S | id assign = AUTO-ID Firestore = doc id (revisi owner 2026-07-15; idempotency fan-out via existence check `pn`+`mv`) |
| pn | S | ref project |
| bn / tt / vn / dt / dts / st / et | S/N | DENORM dari project (list model tanpa join) |
| mv / mnn | S | model vid / nama |
| ast | S | phase: assigned / scheduled / present / awaiting / closed |
| arr / cmp | S | jam lapor hadir / selesai (dikunci `◀2▶` app) |
| ai / ci | S | url selfie hadir / selesai (GET_IMAGES) |
| ovm | N | selisih menit — DIHITUNG CF (cmp − et, min 0) |
| ss | S | status selisih: pending / confirmed / disputed |
| scn / sct | S | catatan konfirmasi brand / waktu konfirmasi |

### 2.3 `//model_cache` — CF-derived (analog asset_cache), 1 doc per model
| key | type | isi |
|---|---|---|
| mv / mnn | S | model vid / nama (doc id = mv) |
| cst | S | status terkini, prioritas: `on_job > awaiting > scheduled > assigned > idle` |
| cpn / cbn / ctt | S | project aktif sekarang (no / brand / judul, denorm) |
| pa | N | jumlah assignment belum dikonfirmasi model |
| na | N | jumlah assignment aktif (non-closed) |
| lat | N | epoch aktivitas terakhir |

### 2.4 Event ledger `//event` (existing)
Semua aksi nulis addToEvent: `r◼4320`, `ty◼fate`, `ept◼fate_project|fate_assign`, `erf◼{pn}|{anm}`, **`epn◼{pn}` (BARU: project ref — semua event assign juga bawa ini, dipakai timeline level-project `[[◀epn▶◼{projectVid}]]`)**, `d◼{pesan}`, WAJIB `av/an/sv/sn`, `cv/cn`, `t/ts`, selfie → `i`.

---

## 3. Cloud Function (Go, repo `Consteon/asset_cache`)

> Detail implementasi lengkap (trigger, routing, anti-loop, edge case, deploy, test checklist): **`docs/fate-cf-onfatewrite-dev-spec.md`**. Bagian ini ringkasan.

**KEPUTUSAN (user 2026-07-14): deploy SATU function saja — `onFateWrite`** — trigger Firestore `onDocumentWritten` dengan path pattern wildcard `MobileTable/{root}/tables/{tenant}/{coll}/{docId}`, routing internal by path param + jenis perubahan:

```go
switch coll {
case "fate_project":
    if event.Before == nil { handleProjectCreated(...) }   // §3.1
case "fate_assign":
    if event.Before != nil { handleAssignUpdated(...) }    // §3.2
default:
    return // coll lain: early return
}
```

Catatan trade-off yang sudah di-ACC: wildcard nangkep semua write coll tenant (invocation naik, early-return murah); log kasih prefix per handler biar monitoring kepisah. Keuntungan: nambah domain berikutnya (complaint/sales) = nambah `case`, tanpa deploy function baru.

### 3.1 Handler `handleProjectCreated` (create `//fate_project`)
1. Loop `mv[]`/`mn[]` → create `//fate_assign` doc AUTO-ID (field `anm` = doc id): `ast◼assigned` + denorm bn/tt/vn/dt/dts/st/et + mv/mnn. Idempotency = existence check `pn`+`mv` sebelum create (detail di spec CF §5).
2. Refresh `//model_cache` tiap model terlibat (lihat 3.3).

### 3.2 Handler `handleAssignUpdated` (update `//fate_assign`)
1. Jika `cmp` baru terisi dan `ovm` belum dihitung:
   - `ovm = max(0, menit(cmp) − menit(et))`
   - `ovm > 0` → `ast◼awaiting`, `ss◼pending`; else `ast◼closed`.
2. Refresh `//model_cache` model terkait.

### 3.3 Derivasi `model_cache.cst`
Scan assignment non-closed milik model (atau maintain incremental):
`present→on_job` > `awaiting→awaiting` > `scheduled→scheduled` > `assigned→assigned` > tidak ada → `idle`. Isi cpn/cbn/ctt dari assignment berstatus tertinggi; `pa` = count assigned; `na` = count non-closed.

FUTURE (bukan sekarang): cron flag anomali (assigned & dts dekat / present & jadwal lewat) buat attention feed kokpit.

---

## 4. WIDGET BARU: `TABLE_PICKER` (generic, single/multi via parameter)

Pengganti kebutuhan multi-select model — dibuat GENERIC: sumber tabel apa aja (workforce, model, customer, item), dipakai fitur lain ke depan. Bukan extend `tableSearch`.

### 4.1 Contoh JSON resolved — MULTI (form project fate)
```json
{
  "type": "TABLE_PICKER",
  "mode": "multi",
  "vidtable": "20342033315492",
  "table": "84214220504259//workforce",
  "search": "ps◼model",
  "labelField": "n",
  "subField": "ps",
  "valueField": "",
  "max": 0,
  "position": 16,
  "labelPosition": 26,
  "title": "Assign model",
  "hint": "Pilih satu atau lebih — yang dipilih harus dia yang kerja",
  "text": "Pilih Model◆Cari nama◆Data tidak ditemukan◆Pilih◆Batal◆{n} dipilih"
}
```

### 4.2 Contoh JSON resolved — SINGLE
```json
{
  "type": "TABLE_PICKER",
  "mode": "single",
  "vidtable": "20342033315492",
  "table": "84214220504259//workforce",
  "search": "",
  "labelField": "n",
  "subField": "ps",
  "valueField": "",
  "max": 1,
  "position": 16,
  "labelPosition": 26,
  "title": "Pilih Petugas",
  "hint": "",
  "text": "Pilih Petugas◆Cari nama◆Data tidak ditemukan◆Pilih◆Batal◆{n} dipilih"
}
```

### 4.3 Kontrak field
| field | isi |
|---|---|
| mode | `single` \| `multi` |
| vidtable / table / search | sumber data keyed + filter WHERE (`key◼value⭘…`, semantik sama widget `search` DSL existing) |
| labelField / subField | key buat label chip & baris kedua di list |
| valueField | key yang dijadiin value; KOSONG = doc id/vid |
| max | batas pilihan (0 = unlimited; single otomatis 1) |
| position | form position untuk VALUES |
| labelPosition | form position untuk LABELS |
| title / hint / text | semua label UI via config (◆-segmen, JANGAN hardcode di Flutter) |

### 4.4 Output & array write (KEPUTUSAN DEV — rekomendasi ada)
- single: `◁position▷` = value, `◁labelPosition▷` = label (drop-in pengganti tableSearch capture).
- multi: REKOMENDASI output JSON-array string `["vid1","vid2"]` di position (dan `["Nama1","Nama2"]` di labelPosition), sehingga addToTable `mv◼◁16▷⭘mn◼◁26▷` langsung menghasilkan field array native (precedent array native: `task.it[]`). Alternatif csv `vid1,vid2` + CF yang split — pilih satu, konsisten.
- UI: chips terpilih tampil di form (mockup: pill + ✓), tap lagi = unselect.

---

## 5. Mapping page (kerjaan sheet, BUKAN dev) — full reuse library existing

| Page | Widget |
|---|---|
| FateKokpit (ops list) | pickerList/LIST_ITEM_CARD over fate_project + workflowRouteBtn "+ Project"; fase 2: panel model_cache |
| FateNewProject (form) | textField ×3, datePicker, timePicker ×2, autoNumber (FPRJ), **TABLE_PICKER multi**, SendButtonGpsExeConsteon (+addToEvent inject) |
| FateProjectDetail (ops) | workspaceHeader/contextCard + list assign (filter pn) + timelineLedger(erf◼pn) |
| FateAssignDetail (ops, selisih) | itemCard assign + 2× workflowNoteBtn ("Brand konfirmasi selisih" → ss◼confirmed ast◼closed; "Brand keberatan" → ss◼disputed ast◼closed) |
| FateModelHome (model list) | pickerList filter mv◼{userVid} |
| FateModelDetail | itemCard + timelineLedger(erf◼anm) + workflowBtn "Konfirmasi keikutsertaan" (assigned→scheduled) + page lapor hadir/selesai (GET_IMAGES selfie + workflowBtn, waktu ◀2▶; foto → ai/ci + event i) |

~~Interim sebelum TABLE_PICKER ready: form project pakai picker single existing (tableSearch).~~ **SUPERSEDED 2026-07-15: renderer TABLE_PICKER selesai dev → form sudah pakai TABLE_PICKER multi live** (template Widget `tablePicker`@290; op1Screen row 1100; mode multi, table `//workforce` via auzSettings J32, labelField `n`, subField `ps`, search kosong = semua workforce dulu, position 16 / labelPosition 26, max 0). `mv`/`mn` sekarang array beneran — kompat string di CF tetap dipertahankan buat jaga-jaga.

**STATUS 2026-07-15: 6 page SUDAH LIVE di op1Screen** (Kokpit@1081, NewProject@1090, ProjectDetail@1106, AssignDetail@1116, ModelHome@1128, ModelDetail@1137; Plug 124-129). Catatan implementasi yang jadi kontrak:
- Fate keyed → semua write dari app pakai `addToEvent` (create fate_project) + `updateEventRow` (update fate_assign, `search◼anm★{assignVid}`), BUKAN addToTable/updateTableRow. 2 template Widget baru: `workflowEventBtn` (288) + `workflowEventNoteBtn` (289).
- Submit form nulis `mv`/`mn` array (TABLE_PICKER multi, live 2026-07-15) — CF `handleProjectCreated` tetap WAJIB terima string|array (defensive).
- `dts` (epoch tanggal) TIDAK diisi form v1 (tanggal = teks bebas pos 11); anomali time-check fase 2 tetap butuh ini — isi pas form upgrade.
- Event submit project ditulis form (`ept◼fate_project, erf◼pn, epn◼pn`); event fan-out per model ("Model di-assign") DITULIS CF biar timeline assign mulai dari awal.
- Waktu `arr`/`cmp`/`sct` dikunci format `◀2|T{tz}|HH:mm▶` sesuai kontrak CF toMin("HH:mm").

---

## 6. Ringkasan deliverable dev
1. **Flutter**: renderer `TABLE_PICKER` (§4) — single+multi, generic table, config-driven labels.
2. **Go CF** (repo asset_cache): **1 function `onFateWrite`** (wildcard trigger + routing internal, §3) berisi 2 handler + koleksi `model_cache`.
3. Keputusan encoding array output multi (§4.4) — konfirmasi ke tim sheet.
