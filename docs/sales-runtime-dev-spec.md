# Sales Runtime — Dev Spec (Schema + CF case + mapping page)

Tanggal: 2026-07-16 · Status: BUILDING (sheet) / CF case = kiriman dev
Referensi UI: `src/component/web/SalesWorkerApp.jsx` + `src/component/web/SalesSupervisor.jsx`
Pola: full reuse infrastruktur fate (LIST_CARD, DETAIL_CARD, TABLE_PICKER, workflowEvent*, CF onFateWrite fan-out).

---

## 1. Simplifikasi V1 (ACC owner 2026-07-16)
- Checklist syarat per-produk (KTP/slip gaji/… per produk + foto per item) DITUNDA → v1: GET_IMAGES "Foto tiba & dokumen" (max 5) + textField no-referensi.
- Gate "foto dulu baru isian kebuka" tidak di-enforce renderer (foto tetap wajib tercapture; precedent selfie fate).
- Cabang kondisional bertemu/tidak → semua field tampil.
- Auto-verify window 2 hari (cron) + roster computed stats per-sales (`sales_cache`) → fase 2.
- "Hasil" = klaim sales ("dilaporkan"), TIDAK PERNAH "disetujui" — verifikasi supervisor = verifikasi kelengkapan, bukan status bank.

## 2. Schema Firestore (KEYED, prefix `84214220504259//`)

### 2.1 `//sales_visit` — 1 kunjungan, terkunci sejak submit (ditulis form worker via addToEvent)
| key | isi | sumber form |
|---|---|---|
| vno | S no kunjungan `SLV-2026-000001` | autoNumber pos 17, counter `vtl.sales` |
| pl | S nama tempat/usaha/prospek | ◁8▷ |
| kt | S nama kontak (ops) | ◁9▷ |
| ar | S area/kelurahan | ◁11▷ |
| bt | S status: `Bertemu Prospek` / `Tidak Bertemu` | SELECTABLE ◁6▷ |
| als | S alasan tak bertemu (ops) | SELECTABLE ◁7▷ |
| prv / prn | S produk (ids / labels, backtick-array TABLE_PICKER multi) | ◁16▷ / ◁26▷ |
| hs | S hasil: `Tertarik`/`Ajukan`/`Follow-up`/`Tolak` | SELECTABLE ◁5▷ |
| rf | S no referensi aplikasi (ops) | ◁10▷ |
| d | S keterangan | ◁3▷ |
| i | S foto tiba + dokumen (max 5) | GET_IMAGES ◁4▷ |
| vst | S status verifikasi: `pending` (literal saat create) → `verified` | tombol supervisor |
| vby / vat / vnote | S verifikator nama / waktu / catatan | workflowEventNoteBtn |
| cv / cn | S sales vid / nama (creator = sales) | baked |
| av / an / sv / sn / t / ts | CC + site denorm + waktu | baked |
GPS ikut payload (gpsPosition 2), waktu terkunci `◀2▶` saat submit.

### 2.2 `//sales_task` — definisi task SM (form supervisor via addToEvent)
| key | isi |
|---|---|
| tno | S `STK-2026-000001` (counter `vtl.salestask`, pos 17) |
| tt / lk / ar | S judul / lokasi / area (◁8▷/◁9▷/◁10▷) |
| psp | S prospek yang ditemui (ops, ◁11▷) |
| prd | S produk fokus (TABLE_PICKER single pos 18/28 → simpan label ◁28▷) |
| dt / st / et | S tanggal / jam mulai / jam selesai (◁12▷/◁13▷/◁14▷) |
| ins | S instruksi (◁15▷) |
| mv / mn | S assignees (TABLE_PICKER multi workforce, ◁16▷/◁26▷, backtick-array) |
| cv/cn/av/an/sv/sn/t/ts | baked |

### 2.3 `//sales_task_assign` — DIBUAT CF (1 doc per orang per task)
Doc id = AUTO-ID, `anm` = doc id (pola fate).
| key | isi |
|---|---|
| anm | S = doc auto-id |
| tno | S ref task |
| tt/lk/ar/psp/prd/dt/st/et/ins | DENORM dari task |
| mv / mnn | S assignee vid / nama |
| ast | S phase: `assigned` → `diterima` → `selesai` |
| cmp / ci / nt | S waktu selesai / foto bukti / catatan penyelesaian |

### 2.4 `//product` — seed master produk (buat TABLE_PICKER)
Doc per produk, key `prn` = nama. SEED MANUAL 6 doc (console): Tabungan, Kartu Kredit, KTA / Pinjaman, Payroll, KPR, Deposito.

### 2.5 Event ledger
`ty◼sales`, `ept◼sales_visit|sales_task|sales_task_assign`, `erf◼{vno}|{tno}|{anm}`, `epn◼{tno}` (di event assign — timeline level-task), wajib av/an/sv/sn + cv/cn + t/ts, foto → `i`.

## 3. CF — case baru di `onFateWrite` (KIRIMAN DEV, kecil)
```go
case "sales_task":
    if e.Before == nil && e.After != nil { return handleSalesTaskCreated(ctx, e) }
```
`handleSalesTaskCreated` = COPY `handleProjectCreated`:
1. `parseModelList(mv/mn)` (fungsi existing — string backtick-array).
2. Existence check `tno`+`mv` → skip kalau ada (replay-safe).
3. Create `sales_task_assign` auto-id: `anm`=id, denorm tt/lk/ar/psp/prd/dt/st/et/ins, mv/mnn, `ast="assigned"`.
4. Event per assignee: `ty◼sales ept◼sales_task_assign erf◼{anm} epn◼{tno} d◼"Ditugaskan: {tt}"` + av/an/sv/sn/cv/cn dari doc task.
5. TIDAK ada ovm/model_cache — sales_task_assign gak butuh handler update (transisi phase murni dari app).

## 4. Mapping page (op1Screen rows 1171+, semua reuse)
| Page | Row | Widget inti |
|---|---|---|
| SalesVisitForm (menu worker) | 1171 | autoNumber + textField×5 + tablePicker produk multi + SELECTABLE×3 + getImages + 3LineBorderForm + submit addToEvent→sales_visit |
| SalesHistori (menu worker) | 1187 | listCard visits `cv◼{user}` + stats 4 hasil + badge hs → VisitDetail |
| SalesVisitDetail | 1196 | detailCard visit + timeline erf vno |
| SalesTaskList (menu worker) | 1206 | listCard assign `mv◼{user}` groupBy ast → TaskDetail |
| SalesTaskDetail | 1215 | detailCard assign + timeline + getImages + workflowEventBtn Terima (assigned→diterima) & Selesaikan (diterima→selesai + cmp/ci via noteBtn nt) |
| SalesRoster (menu SM) | 1227 | listCard workforce → WorkerDetail (salesVid◼{vid}) |
| SalesWorkerDetail | 1236 | listCard visits `cv◼{salesVid}` + stats |
| SalesSubmissionList (menu SM) | 1245 | listCard visits `hs◼Ajukan⭘vst◼pending` |
| SalesSubmissionDetail | 1254 | detailCard + timeline + workflowEventNoteBtn Verifikasi (vst◼verified + vby/vat/vnote, gate vst◼pending) |
| SalesTaskBoard (menu SM) | 1266 | listCard sales_task + rbtCta "+ Task Baru" → Monitor (taskVid◼{tno}) |
| SalesTaskNew | 1275 | form = FateNewProject pattern (2 tablePicker: produk single + assignees multi) |
| SalesTaskMonitor | 1291 | detailCard task + listCard assign `tno◼{taskVid}` badge ast + timeline epn |

Registry: J52 `//sales_visit`, J53 `//sales_task`, J54 `//sales_task_assign`, J55 `//product`.
Menu entries: worker = VisitForm + Histori + TaskList; SM = Roster + SubmissionList + TaskBoard.
