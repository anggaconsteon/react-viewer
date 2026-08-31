# Review — `task-tdt-on-assign-cf-dev-spec.md`

**Reviewer:** CF session (grounded ke repo `cloud-function`, branch `event-push` @ `cddc3c6`)
**Tanggal:** 2026-08-04
**Verdict:** Desain **sehat, greenlight**. Pola persis sudah ada, reuse hampir semua. 1 usulan arsitektur (§A) + 2 risiko wajib-verif + 1 gotcha korektness. Nol asumsi spec yang salah — tapi 2 asumsi spec (§10) sebenarnya **load-bearing**, bukan remeh.

---

## A. USULAN ARSITEKTUR — konsolidasi ke `OnTaskWrite` (pola tenant), JANGAN CF ke-3

**Konteks:** `onTaskRejected` + `onTaskCompleted` sudah 2 CF terpisah di resource+event yang **identik** (`MobileTable/{db}/tables/{tid}/task/{tnm}`, `document.updated` — lihat `deploy.sh:31-32`). Spec ini nambah `onTaskAssigned` ke-3 di path sama → tiap task-write nge-trigger **3 CF**.

**Usulan (permintaan user):** 1 function `OnTaskWrite` yang dispatch internal **by transisi `tst`** (analog `OnTenantWrite`, tapi kunci route = transisi old→new tst, bukan coll):

```
transition (oldTst → newTst):
  *            → "rejected"   → movement.TaskRejected
  *            → "completed"  → movement.TaskCompleted
  "unassigned" → "assigned"   → movement.TaskAssigned   (stamp tdt — fitur spec ini)
```

Satu unmarshal → hitung old/new tst dari `newVal.GetFields()` + `data.GetOldValue()` → first-match → panggil handler internal. Logika `internal/movement.TaskRejected/TaskCompleted` **tetap byte-identik** (cuma adapter root digabung) → regresi minim.

**Keuntungan:** hilangkan R4 (3× invocation → 1×); handler task baru = tambah 1 route, bukan CF baru; 1 target deploy.

**Aturan:** JANGAN setengah — kalau `OnTaskWrite` cuma buat assign sambil reject/complete tetap CF sendiri → tetap 3 CF + pola campur (lebih jelek). Konsolidasi = tiga-tiganya masuk, atau tidak sama sekali.

**Disiplin migrasi** (preseden persis: `onFateWrite`→`onTenantWrite`, warning di `deploy.sh:37-42`):
1. Deploy `onTaskWrite` (3 route).
2. `gcloud functions delete onTaskRejected` + `onTaskCompleted` — kalau tidak, DUA-DUANYA nyala → reject/complete diproses dobel (idempotent, tapi mubazir + jendela tanpa tdt).
3. `deploy.sh`: `ALL` drop 2 case lama, tambah `onTaskWrite … updated "…/task/{tnm}"`.

Trade-off: menyentuh 2 CF LIVE yang baru distabilin (race-fix `cddc3c6`/`7300243`/`57e8b8a`). Aman karena internal movement tidak diubah. **Rekomendasi: konsolidasi sekalian di PR yang sama.**

> Jangan lipat ke `onTenantWrite`: itu router domain **tenant** (reward/approval/fate/location). task/vehicle/movement punya domain trigger sendiri. `OnTaskWrite` = paralel, bukan digabung — jaga batas domain.

---

## B. Grounding — yang SUDAH ADA (spec akurat, reuse penuh)

- **Pola trigger**: `OnTaskCompleted` (`task_complete_trigger.go`) = template persis. Gate FRESH transition baca `oldValue.tst` dari **event** (`data.GetOldValue()`), bukan re-read.
- **Const semua ada** di `internal/movement`: `fieldTst`(`task_reject.go:53`), `fieldTdt`(`:57`), **`statusAssigned`** (dipakai `vehicle_opening.go:143`), `wibZone`(`movement.go:64` = `FixedZone("WIB",7h)`), `parseTaskPath` (dipakai task_complete), `fsdoc.Int/AsInt64`. → **Nol field/util baru.**
- Rumah alami stamp = `internal/movement/task_assigned.go` (sibling `task_complete.go`/`task_reject.go`).

---

## C. Risiko (rank)

### 🔴 R1 — ASUMSI PENGGERAK, WAJIB VERIF (spec §10 anggap remeh)
Seluruh fix bergantung: **coordination inline picker `updateEventRow` benar-benar flip `tst◼assigned`**. Kalau picker cuma tulis `vv` (tst di-flip di tempat lain / tidak) → transisi unassigned→assigned tidak terjadi → CF **tidak pernah nyala** → tdt tidak ter-stamp = fix gagal di **surface yang justru jadi alasan spec dibuat**. `tst◼assigned` itu literal (bukan `{today}`) jadi *seharusnya* resolve — tapi **cek config coordination dulu** sebelum ngoding. Blocker #1.

### 🔴 R2 — midnight harus BYTE-MATCH `cdt` (kalau salah, gudang tidak deteksi)
Konsumen `vehicle_opening.go` `stampTrips` (:141-151) match task ke manifest via **`tdt == cdt`** (tolerant `fsdoc.AsInt64`). Jadi tdt yang di-stamp harus = `cdt` (midnight epoch manifest), atau task tidak keangkut Surat Jalan.
- **Gotcha:** `tdt = time.Date(y, m, d, 0,0,0,0, wibZone).UnixMilli()` dengan Y/M/D dari `time.Now().In(wibZone)`. **JANGAN `now.Truncate(24*time.Hour)`** — Truncate jalan di UTC → meleset 7 jam (17:00 WIB hari sebelumnya) → `tdt != cdt` → task hilang dari manifest.
- Tulis `tdt` sebagai **Number (int64)** via `Set(...MergeAll)`.
- Verif: sumber `cdt` (yang hitung midnight manifest — client/opening) pakai zona sama. assign-day = opening-day (asumsi v1) → match; cross-midnight mismatch (spec §10 sudah terima).

### 🟡 R3 — gate strict `before=="unassigned"`
Reassign dari state lain (mis. `rejected`→`assigned`) TIDAK ter-stamp (before≠unassigned). Kalau flow cuma unassigned→assigned, aman. Konfirmasi tidak ada re-assign dari status lain yang butuh tdt.

### 🟢 R4 — 3× invocation → **HILANG** kalau adopsi §A (OnTaskWrite).

---

## D. Idempotency — sound (spec benar)
Self-write re-fire: CF `Set(tdt)` → updated re-fire, `oldTst=assigned` → gate `oldTst==unassigned` gagal → drop. Guard ke-2: `fsdoc.AsInt64(after[tdt]) != 0 → skip` (nutup absent DAN 0, + hormati tdt yang mungkin ditulis config AssignConfirm). Dobel aman.

---

## E. Deliverable (path malas, kalau §A diadopsi)
- Root `task_write_trigger.go`: `OnTaskWrite` — unmarshal, hitung old/new tst, dispatch 3 route.
- `internal/movement/task_assigned.go`: `TaskAssigned` — skip kalau `tdt != 0`, else `Set({tdt: midnightWIB}, MergeAll)`.
- Root `task_complete_trigger.go` / `task_reject_trigger.go`: adapter dilebur ke `OnTaskWrite` (internal movement tetap).
- `deploy.sh`: +`onTaskWrite`; drop `onTaskRejected`/`onTaskCompleted` dari `ALL`; post-deploy `gcloud functions delete` 2 lama.
- Test: dispatch table (transisi → handler), pure gate assign (4 kombinasi tst), idempotent (tdt sudah keisi), midnight-WIB benar (pola `LoadLocation` sudah ada di `validate_test.go:136`).

Kalau §A **ditolak** (tetap CF terpisah): sama persis tapi `OnTaskAssigned` standalone niru `task_complete_trigger.go` + `deploy.sh` +1 case +array — R4 tetap ada.
