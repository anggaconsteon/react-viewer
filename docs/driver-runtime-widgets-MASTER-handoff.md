# Driver Runtime — Widget MASTER Handoff

Entry point for the **Consteon Driver Runtime** feature — the full gas/galon delivery loop a driver runs in one day: scan in → confirm vehicle custody → run the route (deliver / sell / buy / refill per stop) → return the vehicle. Read this first, then the per-page detail specs listed in §8.

Source prototypes: `src/component/Driverruntimeintegrated.jsx` (original loop) and `src/component/Driverruntimefull2.jsx` (adds transaction types + reject task — the "v2" layer).

> Specs are written in normal prose (docs boundary). Read order = this MASTER → per-page specs.

---

## 0. Status at a glance (2026-06-22)

Every page below is **published and resolving on op1Screen** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` (the proxy). The JSON config — pages, widget types, DSL writes, tx + reject fields — is **complete**. What remains is **Flutter renderer work** for the newer widget types, plus the **Cloud Function** (asset_cache + movement derivation), which is deferred to a separate track.

So this handoff is a **renderer + CF build list**, not a sheet-authoring list. The sheet side is done.

`json/driver-runtime/*.json` mirrors the live pages (one file per page) if you prefer reading the assembled page JSON over the sheet.

---

## 1. The flow (P1 → P12 + reject)

| # | Page | op1Screen route | Row | What it does |
|---|------|-----------------|-----|--------------|
| P1–P3 | Scan / login | `…DriverScanLogin` | 1001 | QR card scan → session open |
| P4 | Driver Home | `…DriverHome` | 1007 | Custody gate + cargo + route preview + return CTA |
| P5 | Custody Notification | `…CustodyNotification` | 1016 | Manifest + circulation, blocks route until confirmed |
| P6 | Custody Count (step 1/2) | `…CustodyCount` | 1024 | Blind physical count, writes `ip[]` |
| — | Custody Reveal (step 2/2) | `…CustodyReveal` | 1035 | Reveal warehouse vs count → branch match/mismatch |
| P7 | Custody Success (match) | `…CustodySuccess` | 1042 | Confirm `cst=custody_confirmed` |
| P8 | Mismatch Report | `…MismatchReport` | 1050 | Note + photo + confirm w/ discrepancy |
| P9 | Mismatch Submitted | `…MismatchSubmitted` | 1059 | Outcome screen → home |
| P10 | Task Feed | `…TaskFeed` | 1066 | Route as state-grouped stop cards |
| P11 | Delivery Workspace | `…DeliveryWorkspace` | 1071 | Per-item execution (deliver / sell / buy / refill) + submit |
| P12 | Return Vehicle | `…ReturnVehicle` | 1079 | Hand vehicle + remaining cargo to warehouse |
| — | **Reject Task** | `…RejectTask` | **1086** | Refuse a not-on-route task before custody confirm (v2) |

Doctrine baked into the prototype:
- Feed = route, each card = one stop. Driver-driven sequencing (no auto-promote).
- Custody gate: route locked until `cst=custody_confirmed`. Route phases live in `task.tst`, not `cst`.
- Max 2 levels: feed → workspace (workspace = sheet over feed).
- Submit creates **movement events** (DROP/PICKUP, and for v2 also SALE/PURCHASE/REFILL) — all CF-derived, deferred.

---

## 2. Widget → spec map (per page)

JSON `type` (UPPERCASE renderer code) ≠ Widget-tab name (camelCase). Types below are the renderer codes.

| Page | Widget types | Spec |
|------|--------------|------|
| P4 | `ROUTE_PROGRESS_HEADER`, `PRECONDITION_GATE_CARD`, `INVENTORY_BUCKET_CARD`, `DRIVER_STOP_CARD`, `NAV_ACTION_CARD` | `driverhome-p4-dev-spec.md`, `driver-home-state-machine-dev-spec.md`, `driver-route-progress-header-dev-spec.md`, `driver-stop-card-dev-spec.md` |
| P5 | `NOTICE_BAR`, `VEHICLE_CUSTODY_HEADER`, `TASK_MANIFEST_LIST`, `CIRCULATION_SUMMARY` | `driver-custody-notification-p5-dev-spec.md` |
| P6 | `CUSTODY_STEP_HEADER`, `CUSTODY_COUNT_LIST`, `CUSTODY_COUNT_SUBMIT` | `driver-custody-count-p6-dev-spec.md` |
| Reveal | `CUSTODY_REVEAL` | `driver-custody-reveal-dev-spec.md` |
| P7/P8/P9 | `CUSTODY_CONFIRMED_LIST`, `CUSTODY_DISCREPANCY_LIST` | `driver-custody-p7p8p9-dev-spec.md` |
| P10 | `ROUTE_FEED_HEADER`, `TASK_FEED_LIST` | `driver-task-feed-p10-dev-spec.md` |
| P11 | `WORKSPACE_HEADER`, `ITEM_EXECUTION_LIST`, `SIGNATURE_PAD`, submit (`RBT`/`sendButtonGpsWithEvent`) | `driver-delivery-workspace-p11-dev-spec.md`, `driver-submit-confirm-sheet-dev-spec.md`, `driver-failed-delivery-sheet-dev-spec.md` |
| P12 | `RETURN_HEADER`, `VEHICLE_CARGO_SUMMARY` | `driver-return-vehicle-p12-dev-spec.md` |
| Reject | reuses `WORKSPACE_HEADER` + `NOTICE_BAR` + `TXF` + `RBT` savesend | `driver-reject-task-sheet-dev-spec.md` |

Reused/existing renderers across pages: `TXT`, `RBT`, `TXF`, `GET_IMAGES`, `NOTICE_BAR`, `scanner`.

**Renderer status (verify before build):** the P4 set + `scanner` + `noticeBar` were confirmed built by dev (2026-06-15). The custody/feed/workspace/return types (P5–P12) and the v2 additions are config-complete in the sheet but their renderers need build/verification.

---

## 3. v2 layer — transactions (jual/beli/tukar) + reject task

Newest layer, from `Driverruntimefull2.jsx`. **0 new collections, 0 new pages besides RejectTask.** Master spec: `driver-runtime-transaction-delta.md`.

### 3.1 Per-line transaction type (`tx`)
Each `task.it[]` line carries `tx`: `deliver` (default) | `sale` | `purchase` | `refill`.

| tx | UI | qty fields | movement (CF) |
|----|----|-----------|----------------|
| deliver | stepper drop+pickup | `pd`/`pp` → `ad`/`ap` | DROP + PICKUP |
| sale "Jual" | read-only | `ps` → `as` | SALE (`tl=null`) |
| purchase "Beli" | read-only, naik kendaraan | `pb` → `ab` | PURCHASE |
| refill "Tukar" | read-only, swap 1-1 | `pr` → `ar` | REFILL (full−/empty+) |

Affected renderers: `ITEM_EXECUTION_LIST` (4 branches; sale/purchase/refill read-only, actuals auto = plan), `SUBMIT_CONFIRM_SHEET` (per-tx recap), `TASK_MANIFEST_LIST` + `CIRCULATION_SUMMARY` (tx-aware totals; purchase `pb` not loaded at warehouse). Specs: P11, P5, P6 TX-DELTA sections. Schema: `driver-runtime-field-dictionary.md` (item `wt`; it[] `tx ps as pb ab pr ar`; movement `mt` +PURCHASE/REFILL).

### 3.2 Reject task (load rejection)
Driver refuses a not-on-route task **before custody confirm** (route still locked). `DRIVER_STOP_CARD` (preview/locked variant) shows a **Tolak** button per task → routes to the **RejectTask** page → sets `task.tst = load_rejected` + writes an evidence note. **`vv` (vehicle) is kept** (Admin needs last driver/vehicle for audit + reassign). No movement (goods never left the warehouse). Manifest/count exclude `tst=load_rejected`. Specs: `driver-stop-card-dev-spec.md` §15, `driver-reject-task-sheet-dev-spec.md`, custody P5/P6 TX-DELTA.

---

## 4. Shared data model & state machine

`task` (one stop) + its `it[]` lines drive every widget. Live field codes (NOT the prototype mock names) — see `driver-runtime-field-dictionary.md` for the authoritative list:
- `task`: `tnm` id · `kn`/`al` customer+address (denorm) · `vv` vehicle · `tst` state (`assigned`/`on_delivery`/`completed`/`validated`/`closed`/`load_rejected`) · `tty` type · `tdt` date · `it[]`.
- `it[]`: `ii`/`in` item id+name · `tx` · `cdo`/`cdi` condition out/in · deliver `pd pp ad ap` · sale `ps as` · purchase `pb ab` · refill `pr ar`.
- Custody on `vehicle_check` opening doc: `ie[]` warehouse manifest · `ip[]` driver count · `dp[]` discrepancy · `rs` reconcile · `cst` (`awaiting_custody`→`custody_confirmed`→`closed`).

Outcome predicates (per item / page rollup) for stepper colors + banners + confirm sheet: `isComplete` (actual==plan), `isPartial` (0<actual<plan), `isZero`, `isOpportunistic` (planPickup==0 && actualPickup>0), `isSurplus`. Page outcome = partial / clean+opportunistic / clean. Single source of truth — every widget reads the same predicates.

---

## 5. DSL / backend writes

- Updates use **`updateEventRow`**, appends use **`addToEvent`** (event/keyed variants — NOT `updateTableRow`/`addToTable`). Submit via `sendButtonGpsWithEvent` (confirmed to support `updateEventRow`).
- Tokens: `◀N▶` system/session stream (driver VID, timestamp, GPS); `◁N▷` form input at position N; `★`/`☆` = search key/AND. Table path `84214220504259//{coll}`, proxy `tablevid◼20342033315492`.
- Custody writes: `ip[]`/`dp[]` are **arrays → native Flutter** (DSL can't do arrays); `cst`/`rs`/note are scalar → DSL via RBT. Reject: `tst=load_rejected` (DSL) + evidence note (addToEvent).
- Movement (DROP/PICKUP/SALE/PURCHASE/REFILL) is **CF-derived** from submit — see §7.
- Detail per page in its spec; evidence pattern in `driver-evidence-addToEvent-dev-spec.md`.

---

## 6. Build order (renderers)

1. `ITEM_EXECUTION_LIST` (incl. 4 tx branches) + `SUBMIT_CONFIRM_SHEET` — core input/review.
2. `ROUTE_FEED_HEADER` + `TASK_FEED_LIST` — feed screen (P10).
3. Custody chain: `CUSTODY_STEP_HEADER`, `CUSTODY_COUNT_LIST`, `CUSTODY_COUNT_SUBMIT`, `CUSTODY_REVEAL`, `CUSTODY_CONFIRMED_LIST`, `CUSTODY_DISCREPANCY_LIST` (P5–P9) + `VEHICLE_CUSTODY_HEADER`, `TASK_MANIFEST_LIST`, `CIRCULATION_SUMMARY`.
4. `DRIVER_STOP_CARD` Tolak button + RejectTask sheet.
5. `RETURN_HEADER` + `VEHICLE_CARGO_SUMMARY` (P12).
6. Wire submit → movement events; CF derives actuals + asset_cache.
7. `SIGNATURE_PAD` — deferred (optional evidence until shipped; use photo/note meanwhile).

---

## 7. Open / deferred

- **Cloud Function (separate track):** movement (immutable SSOT) → derive `asset_cache` (vehicle stock) + `task.it[].ad/ap`. Covers all tx (REFILL = full−/empty+ both buckets; PURCHASE inbound). Spec `driver-runtime-movement-cf-dev-spec.md` + `driver-runtime-movement-cf-handoff.md`. Until live, asset_cache cards render structure with deferred values.
- **`ie[]` rebuild on reject:** rejected-task items must drop out of the warehouse manifest before custody count — gudang-app/CF responsibility (flagged in custody P5/P6 specs).
- **`SIGNATURE_PAD`:** deferred (no native analogue yet).
- **`[ICON]` placeholders:** left intentionally across cards; renderer supplies defaults.
- **P4 `logoutRoute`:** empty (a `pauseConfirm` page is not yet built/verified).
- **Walk-in customer:** future admin-side channel; data structure future-proofed (`stock_location.lt +store`, `movement.er +ADMIN`), no driver-runtime change. Details in `driver-runtime-transaction-delta.md`.

---

## 8. Files

Per-page specs: `driver-route-progress-header-dev-spec.md`, `driver-stop-card-dev-spec.md`, `driverhome-p4-dev-spec.md`, `driver-home-state-machine-dev-spec.md`, `driver-custody-notification-p5-dev-spec.md`, `driver-custody-count-p6-dev-spec.md`, `driver-custody-reveal-dev-spec.md`, `driver-custody-p7p8p9-dev-spec.md`, `driver-task-feed-p10-dev-spec.md`, `driver-delivery-workspace-p11-dev-spec.md`, `driver-submit-confirm-sheet-dev-spec.md`, `driver-failed-delivery-sheet-dev-spec.md`, `driver-return-vehicle-p12-dev-spec.md`, `driver-reject-task-sheet-dev-spec.md`, `driver-evidence-addToEvent-dev-spec.md`.

Schema / DSL: `driver-runtime-field-dictionary.md`, `driver-runtime-transaction-delta.md`, `driver-runtime-tables-dev-spec.md`.

Cloud Function: `driver-runtime-movement-cf-dev-spec.md`, `driver-runtime-movement-cf-handoff.md`.

Handoffs / runtime req: `driver-p4-handoff-dev.md`, `driver-custody-p6-reveal-handoff-dev.md`.

Assembled page JSON (mirror of live): `json/driver-runtime/*.json`.

Source prototypes: `src/component/Driverruntimeintegrated.jsx`, `src/component/Driverruntimefull2.jsx`.

---

## 9. Versi & History

- **v2.0 (2026-06-22)** — Full rewrite. Indexed the complete flow P1–P12 + RejectTask (was: only 5 widgets). Added the v2 transaction layer (jual/beli/tukar) + reject task. All pages confirmed published + resolving on op1Screen; json mirror synced. Widget names updated to live UPPERCASE types (`executionStepper`→`ITEM_EXECUTION_LIST` etc.).
- v1.0 (2026-06-10) — Initial handoff. 5 NEW widgets, `signaturePad` PENDING. (Superseded — predated custody flow, P10–P12, and v2.)
