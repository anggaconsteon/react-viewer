# Driver Runtime — Session Handoff 2026-06-24

Konsolidasi kerjaan 1 sesi: **movement architecture (load/delivery/reject)**, **return/handover (`rt`)**, config live (cargo/circulation/handover), CF coded. Entry point tunggal → dari sini lompat ke spec detail.

---

## TL;DR

- **Movement = 3 sumber**, semua lewat ledger (asset_cache di-derive CF, gak pernah di-hand-edit):
  - Opening **LOAD** = SEED. Delivery = **CF `OnTaskCompleted`**. Reject = **CF `OnTaskRejected`**.
- **CF: 4 fn coded, 0 deployed** → kerjaan CF session.
- **Seed = movement-driven** (gudang stok-awal + load + `rt:pending`); asset_cache TIDAK di-seed.
- **Config live (op1Screen) DONE** sesi ini: cargo per-item, circulation Opsi A, handover `rt`, navActionCard hide.
- **Return/handover** pakai field baru **`rt`** (pending→returned), BUKAN `cst` (cst locked 3 nilai).

---

## 1. Movement architecture (FINAL)

| Sumber | Movement | Owner | Status |
|---|---|---|---|
| Opening **LOAD** | gudang stok-awal (`ADJUSTMENT` null→gudang) + LOAD (`INTERNAL` gudang→mobil) | **SEED** (`driver-runtime-seed.js`) | ✅ |
| **Delivery** | per `it[]` by `tx`: deliver→DROP+PICKUP, sale→SALE, purchase→PURCHASE, refill→swap. qt=`actual??plan` | **CF `OnTaskCompleted`** | ✅ coded, deploy pending |
| **Reject unload** | mobil→gudang (`INTERNAL`) per it[] + recompute `vehicle_check.ie[]` | **CF `OnTaskRejected`** | ✅ coded, deploy pending |

- `asset_cache` = derived by **`OnMovementCreated`** (−qt@fl / +qt@tl). App/seed **gak pernah** tulis asset_cache langsung.
- **App gak emit movement** (kecuali seed) — delivery & reject = CF. Pivot 2026-06-24 (app ◆-loop ditolak; konsisten + N dinamis gampang di CF).
- Spec: `docs/driver-runtime-movement-emit-dev-spec.md` §0.

---

## 2. CF — `cloud-function/` (4 fn, ALL coded, NONE deployed)

| Fn | File | Trigger | Status |
|---|---|---|---|
| `OnMovementCreated` | `movement_trigger.go` | movement created | ✅ coded |
| `ReconcileAssetCache` | `reconcile.go` | HTTP | ✅ coded |
| `OnTaskRejected` | `task_reject_trigger.go` | task `tst→load_rejected` | ✅ coded |
| `OnTaskCompleted` | `task_complete_trigger.go` | task `tst→completed` | ✅ coded (2026-06-24) |

- go build/vet/test green. **Belum di-deploy semua.**
- **→ CF session: `cloud-function/docs/CF-SESSION-HANDOFF.md`** (deploy 4 fn + 2 index reject + TTL; OnTaskCompleted = no new index).

---

## 3. Seed — `scripts/driver-runtime-seed.js` (movement-driven)

- Emit: **stok-awal gudang** (`Master_Item` kolom `ga`) → **LOAD** gudang→mobil → CF bikin asset_cache.
- `vehicle_check` opening default **`rt:'pending'`** (buat gate navActionCard).
- `asset_cache` **TIDAK** di-seed lagi (CF derive). `buildAssetCacheOpening` = dead (revert-only).
- Data ditrim ke **1 task (Warung) + Amidis (deliver)** buat test 1 putaran.
- ⚠️ **CONFIG = `fir-app-dev1`** (`MOBILE_TABLE_DOC_ID 60936087747650`). Test di otq-01 → ganti project id + doc id (`20342033315492`) + service account.
- Expected abis re-seed (Amidis, ga=50): movement 2 doc (stok-awal 50 + load 3); asset_cache gudang **47**, mobil **3**.

---

## 4. Config live (op1Screen) — DONE sesi ini

| Widget/page | Perubahan | Lokasi |
|---|---|---|
| `vehicleCargoSummary` (ReturnVehicle) | per-item nama+satuan (join `item`, `itemTable`/`nameField:in`/`unitField:un`) | D1081 |
| `CIRCULATION_SUMMARY` Opsi A | per-item tx-driven (Drop/Pickup/Jual/Tukar/Beli), label dari `text` | return D1082 + custody D1021 |
| Handover savesend | "Serahkan" → `rt◼returned` + dialog | return RBT D1084 |
| `navActionCard` hide | gate `…⭘rt◼pending` → hide pas returned | DriverHome D1014 |

> ⚠️ Renderer dev udah build VEHICLE_CARGO_SUMMARY + CIRCULATION_SUMMARY Opsi A — config doang yang tadinya kurang (gap, kayak ke-fallback). Sekarang udah diisi → jalan.

---

## 5. Return / Handover (`rt`)

- Field baru `vehicle_check.rt`: **`pending` → `returned`** (driver "Serahkan ke Gudang"). **BUKAN `cst`** (cst locked 3: awaiting/confirmed/closed; nambah value bakal break gate `cst◼custody_confirmed`).
- Flow: Serahkan → savesend `rt=returned` + dialog "nunggu gudang" → DriverHome → navActionCard HIDDEN. Gudang baca `rt=returned` → C1 closing → `cst=closed` → logout.
- Spec: `docs/driver-return-vehicle-p12-dev-spec.md` §OPEN #3.

---

## 6. PENDING

### A. Dev (Flutter renderer)
- **`taskFeedList` "Kembali ke Gudang" suppress** pas `rt=returned` (WAJIB — entry ke-2 ke ReturnVehicle; CTA internal, no gateField → renderer tambah cek rt / gate support). p12 spec §OPEN #3.
- **Phase-2 actual:** `ITEM_EXECUTION_LIST` capture + tulis actual (`ad/ap/as/ab/ar`) ke `task.it[]` (native array) → CF auto-pakai actual (sekarang Phase 1 pakai plan). emit-spec §0.
- **Logout** pas `cst=closed`.
- (DONE: cargo per-item, circulation Opsi A, config-driven labels.)

### B. Deploy (CF session)
- 4 CF + 2 composite index (reject: vehicle_check `cty,vv,cdt` + task `vv,tdt`) + TTL policy (`xa`). `CF-SESSION-HANDOFF.md`.

### C. Data / owner
- **Tambah `rt:"pending"` ke opening `vehicle_check` doc sekarang** (atau re-seed) — kalo nggak navActionCard ilang (gate `rt◼pending` no-match).
- **Dict:** tambah row `rt` (`pending|returned`) di tab `vehicle_check`.
- **`Master_Item`:** isi `un` proper (sekarang semua `pcs` → cargo nampil "pcs isi" bukan "Galon isi") + `ga` stok gudang real (sekarang default 50/dst).

---

## 7. Entry points (reading order)

1. **`driver-runtime-session-handoff-2026-06-24.md`** ← INI (overview).
2. **CF session:** `cloud-function/docs/CF-SESSION-HANDOFF.md`.
3. **Flutter dev:** `docs/driver-runtime-DEV-HANDOFF.md` (cover semua renderer spec).
4. **Movement:** `docs/driver-runtime-movement-emit-dev-spec.md` (§0 = CF-emit) + `cloud-function/docs/reject-unload-ie-cf-audit.md`.
5. **Return/handover:** `docs/driver-return-vehicle-p12-dev-spec.md`.
