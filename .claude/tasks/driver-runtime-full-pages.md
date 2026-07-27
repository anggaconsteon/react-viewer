# TASK: driver-runtime-full-pages

**Status:** SCOPING (deep-learn done, interview in progress)
**Date:** 2026-06-11
**Source:** `src/component/Driverruntimefull.jsx` (3941 lines)
**Goal:** Page-by-page widget JSON (flat DSL, generic/dynamic — reusable for any delivery case) for full driver runtime: scan login → custody check → delivery → return.

---

## 1. Flow state machine (from code, `DriverRuntimeFull` main component)

State vars: `session`, `authStep (scan|pin)`, `deviceOwner`, `custodyStatus (pending|confirmed|confirmed_selisih)`, `custodyCounts`, `screen (home|custody_notif|custody_count|custody_success|custody_mismatch_report|custody_mismatch_submitted|feed|workspace|return)`, `paused`.

```
[device has owner session?] ──yes──▶ A. DeviceOwnerScreen ──"Keluar/handover"──▶ clears owner
        │ no
        ▼
B. ScanScreen (QR kartu; variant: fresh | resuming-paused-trip)
        ▼ scanned
C. PinScreen (4-digit; executor card from scanned kartu) ──ok──▶ session opened
        ▼
D. HomeView  ◀────────────────────────────────┐
   ├ custodyStatus=pending → route LOCKED      │
   ├ HomeCustodyCard → E                       │
   ├ HomeRouteCard → J (feed)                  │
   ├ HomeReturnCard → M (return)               │
   └ "Keluar" → pending>0 ? PauseConfirmSheet (→ paused, back to B resuming) : endSession
        ▼
E. CustodyNotificationScreen (vehicle card + TaskManifestCard + total circulation)
        ▼ "Mulai Konfirmasi"
F. IndependentCountWorkspace (blind count → reveal gate → compare vs warehouse)
   ├ all match  → G. ConfirmationSuccessScreen → home (custodyStatus=confirmed)
   └ mismatch   → H. MismatchReportScreen (note ≥10 char + photo WAJIB)
                   → I. MismatchSubmittedScreen → home (custodyStatus=confirmed_selisih)
        ▼ (custody confirmed unlocks route)
J. TaskFeedScreen (RouteProgressHeader + grouped TaskCards: assigned/failed/completed)
        ▼ tap assigned card
K. DeliveryExecutionWorkspace (ItemExecutionRow × N + SignaturePad + evidence + banners)
   ├ submit → SubmitConfirmSheet → back to J (state updated, NO auto-promote)
   ├ EvidenceNoteSheet (catatan)
   └ FailedDeliverySheet (4 reason codes + note) → task failed → J
        ▼ all done
M. ReturnScreen (sisa cargo summary) → "Serahkan ke Gudang" → endSession (terminal logout)
```

Key doctrines in code comments:
- Identity on CARD not device ("1 HP bisa dipinjam") — portable executor session; pause/resume any device via scan+PIN.
- One device one session — owner must logout before handover.
- Custody = BLOCKING gate before tasks. Independent count BEFORE warehouse reveal (genuine bilateral, not auto-match).
- Mismatch ≠ lost: report w/ photo+note, driver keeps working with actual counts; Supervisor resolves parallel.
- Driver-driven sequencing, feed-return guarantee, partial/opportunistic/extra valid outcomes.
- Submit creates DROP+PICKUP movement events.
- Cargo baseline = driver's confirmed counts (not warehouse manifest) when selisih.

## 2. Data model

- Task: id, customer, address, distance, stopNumber, state(assigned|in_execution|completed|failed|blocked), taskType?(pickup_return), completedAt?, customerConfirmed?, items[]
- Item: id, name, type(returnable|consumable), planDrop, actualDrop, planPickup, actualPickup
- Custody: custodyEventId, vehicleId, vehiclePlate, loadedBy, loadedAt, loadSessionId, items[{id,name,type,warehouseRecorded}], tasks[manifest]
- Driver/executor: name, id, role (resolved from card scan). Vehicle: id, plate.
- Custody count payload: {itemId: count}, outcome confirm|mismatch; mismatch payload: deltas[] + note + photo.

## 3. Existing assets (Driverruntimeintegrated.jsx round, rows 198-203)

Already spec'd: routeProgressHeader(198), driverStopCard(199), executionStepper(200), itemExecutionRow(201), submitConfirmSheet(202), failedDeliverySheet(203). signaturePad reserved 204 (PENDING). Screens J + K REUSE these.

## 4. Proposed page list (NEW pages to build, scanner → end)

| # | Page | Screen(s) | New widget candidates | Reuse |
|---|------|-----------|----------------------|-------|
| P1 | DeviceOwnerGate | DeviceOwnerScreen | sessionOwnerCard | horizBanner, button1 |
| P2 | ScanLogin | ScanScreen (fresh+resuming variant) | qrScannerPanel | horizBanner, text |
| P3 | PinVerify | PinScreen | pinPad (executor card + dots + numpad) | — |
| P4 | DriverHome | HomeView (5 cards + bottom nav) | homeCustodyCard, homeCargoCard, homeRouteCard, homeReturnCard | header chrome, bottom nav |
| P5 | CustodyNotification | CustodyNotificationScreen | taskManifestCard (+ totalCirculation) | horizBanner, detail card |
| P6 | CustodyCount | IndependentCountWorkspace | independentCountStepper (reveal-gate variant) | stepper relationship TBD |
| P7 | CustodySuccess | ConfirmationSuccessScreen | confirmedItemList? | horizBanner, button |
| P8 | MismatchReport | MismatchReportScreen | mismatchDeltaCard | textField, getImages |
| P9 | MismatchSubmitted | MismatchSubmittedScreen | — | horizBanner, text, button |
| P10 | TaskFeed | TaskFeedScreen | — (REUSE 198/199) | rows 198-203 |
| P11 | DeliveryWorkspace | DeliveryExecutionWorkspace + sheets | — (REUSE 200-203) | rows 198-203 |
| P12 | ReturnVehicle | ReturnScreen | cargoRemainderList? | text, button, sendButtonGpsWithEvent |
| S1 | PauseConfirmSheet | sheet | — | dialog/sheet + banners |

## 5. Genericization flags (must fix vs prototype)

- `HomeCargoCard` + `ReturnScreen` hardcode "Tabung/Galon" via `isGas()/isGalon()` name-sniffing (lines 3266-3288) — MUST become dynamic per-item-type list from items table.
- DEMO_PIN, DRIVER, VEHICLE, DEVICE_OWNER, PENDING_CUSTODY = mock → session/system tokens `◀N▶` + table src `[SRC:page]` (Web URL SSOT rule).
- Custody item list, task manifest, reasons list (failed) → all table-driven.
- Status labels via statusLabels relabel pattern (3-tier baku: danger/warn/ok).

## 6. Interview log

- Q1 (P1 in scope vs start at scanner?) → A: keep full list P1-S1, but production flow starts at SCANNER and **WITHOUT PIN** (scan alone opens session). P3 PinVerify = DROPPED from build scope (kept in gallery for reference only).

## 7. Decisions

- 2026-06-11: **No PIN.** Scan kartu langsung buka sesi. P3 dropped; P2 ScanScreen `onScanned` → session directly.
- 2026-06-11: Page gallery built for visual mapping: `src/component/DriverRuntimeGallery.jsx` (renders all screens labeled P1-S1; named exports added to `Driverruntimefull.jsx`; `src/main.jsx` temporarily points to gallery).
- 2026-06-11: P2+P4 designed via multi-agent workflow (3 lenses → 3 judges → synth → build → QA, all PASS 0 blockers). Winner: genericity-max base + grafts.

## 8. P2 + P4 build results (2026-06-11)

Files (STRICT JSON, QA passed):
- `json/driver-runtime/p2-scan-login.json` — 2 page rows (driverScanLogin / driverScanResume), each: `horizBanner` + `HORIZONTAL_ICON`›`location` opMode `qr-single` (REUSE clockin machinery; 26-slot text contract preserved, unused slots empty). addToTable `driver-session-open|resume`. **0 NEW widgets.**
- `json/driver-runtime/p4-driver-home.json` — 6 widgets stack:
  1. `routeProgressHeader` **VARIANT** `identityOnly` (amend row 198: +logoutRoute, +text seg 8-10)
  2. `TXT` section label
  3. `preconditionGateCard` **NEW** row 205 — generic blocking gate, 3 states (pending/confirmed/confirmed_mismatch) via `gateField`/`pendingValue`/`mismatchValue` field indirection; item list data-driven (replaces tabung/galon hardcode)
  4. `inventoryBucketCard` **NEW** row 206 — N kategori × M bucket (`buckets:"isi◼ok★kosong◼warn"`), `categoryField` indirection, no computeMode (aggregation = renderer dev)
  5. `driverStopCard` **VARIANT** `preview` (amend row 199: +7 text seg 11-17, locked mode, gate props)
  6. `navActionCard` **NEW** row 207 — generic nav card icon+title+sub+chevron, `ready:"{allClosed}"` warn-tier highlight

**Shared gate contract:** `preconditionGateCard` resolves status → page token `{gateStatus}`; siblings consume `gate`+`gateValue` equality (stopCard=locked, inventory/nav=hidden). BIGGEST RISK: renderer support for page-level reactive token — fallback = 2 page rows (locked-home/unlocked-home).

**Open before Widget!A write (user sign-off needed):**
- Naming permanen: `preconditionGateCard` / `inventoryBucketCard` / `navActionCard`, variant `identityOnly` / `preview`
- Status vocab: `confirmed_selisih` (prototype) vs `confirmed_mismatch` (generic)
- Rows 198/199 amendment OK? (dev belum build → additive aman; kalau ditolak: fallback `sessionHeaderStrip` / `routePreviewCard` row baru)
- Renderer dev: `{gateStatus}` token, `location` tanpa locList, QR kartu decode via qr-single, horizBanner prop surface, 25-vs-26 slot tolerance

**Firestore TBD (besok):** semua `<N>`, `◀N▶`, `[SRC:*]`, `[TABLE_PATH]`, `[GATE_FIELD]`/`[ITEMS_FIELD]`/`[CATEGORY_FIELD]` = LIKELY-TO-CHANGE; re-walk saat skema masuk. Full assumptions + 17 QA warns: workflow output `w683sqd0i`.
