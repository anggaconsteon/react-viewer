# P2 ScanLogin -- Build Walkthrough

**Task:** `driver-runtime-full-pages`
**File:** `json/driver-runtime/p2-scan-login.json`
**Date:** 2026-06-11
**Engineer:** widget-engineer

---

## 1. File produced

`C:\Users\FCT\Documents\Development\consteon\widget-claude\json\driver-runtime\p2-scan-login.json`

Top-level JSON object with two named page rows: `driverScanLogin` (fresh) and `driverScanResume` (resuming paused trip). Each page row is an array of widgets in render order.

---

## 2. Widget inventory (render order, per page row)

| # | type | variant | status | text segments |
|---|------|---------|--------|---------------|
| 1 | horizBanner | warn (fresh) / info (resume) | REUSE | 1 |
| 2 | HORIZONTAL_ICON > location | qr-single | REUSE | 26 (indices 0-25) |

0 NEW types. 2 REUSE.

---

## 3. DSL symbol audit

- Diamond delimiter `◆`: 25 per location text string = 26 segments. Matches clockin.json 26-slot attendance contract.
- `⭘` (U+2B58): 8 per addToTable string (pair separator).
- `◼` (U+25FC): 8 per addToTable string (key=value assignment).
- `◀`/`▶` left payload: ◀2▶ (timestamp), ◀3▶ (card VID), ◀5▶ (lat), ◀6▶ (lng). 4 extractions.
- No `◁`/`▷` right payload (correct: no form inputs on scan page).
- No trailing commas. Valid JSON.

---

## 4. Text slot map (location widget, 26 slots)

| Slot | Fresh | Resume |
|------|-------|--------|
| 0 | Scan Kartu | Scan Kartu |
| 1 | Batal | Batal |
| 2 | Sesi dibuka | Sesi dibuka |
| 3 | Login berhasil | Lanjut trip berhasil |
| 4-6 | (empty) | (empty) |
| 7 | success banner body | success banner body (resume variant) |
| 8 | OK | OK |
| 9 | QR salah | QR salah |
| 10 | error body | error body |
| 11 | Scan Lagi | Scan Lagi |
| 12-25 | (empty x14) | (empty x14) |

Slots 4-6 (attendance clock-out/overtime legacy) and 12-25 (selfie-fallback/out-of-area legacy) deliberately left empty per plan.

---

## 5. addToTable field map

```
[TABLE_PATH]//driver.session⭘retention◼4320⭘description◼driver-session-open⭘flag◼driver-session-open⭘<1>◼driver-session-open⭘<2>◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶⭘<3>◼◀3▶⭘<4>◼◀5▶⭘<5>◼◀6▶
```

| Target | Value | Source | Type |
|--------|-------|--------|------|
| <1> | driver-session-open | literal | static flag |
| <2> | ◀2\|T7\|Ddd MMM yyyy HH:mm:ss▶ | left payload | system timestamp |
| <3> | ◀3▶ | left payload | scanned card VID |
| <4> | ◀5▶ | left payload | latitude |
| <5> | ◀6▶ | left payload | longitude |

Resume row: flag/description/`<1>` use `driver-session-resume` instead.

---

## 6. Fresh vs Resume differences

| Property | Fresh | Resume |
|----------|-------|--------|
| horizBanner variant | warn | info |
| horizBanner text | identity-on-card notice | trip continuation notice |
| location flag | driver-session-open | driver-session-resume |
| location text slot 3 | Login berhasil | Lanjut trip berhasil |
| location text slot 7 | ...Sesi Driver Runtime aktif. | ...Sesi Driver Runtime dilanjutkan. |
| addToTable description | driver-session-open | driver-session-resume |

---

## 7. LIKELY-TO-CHANGE fields

- All `<N>` field indices in addToTable
- `[TABLE_PATH]` Firestore write root
- `[ROUTE:driverHome]` destination page key
- `[QR_ICON_URL]` / `[FOLDER]` / `[FILENAME]` asset references
- `[ICON]` horizBanner icon name
- `{executorName}` / `{remaining}` resume banner tokens (resolution mechanism TBD)
- horizBanner prop surface (variant/icon) unverified

---

## 8. Constraint compliance

| # | Constraint | Status |
|---|-----------|--------|
| 1 | REUSE-FIRST | 0 NEW, 2 REUSE |
| 2 | GRANULARITY | No new types needed |
| 3 | STATUS 3-tier | No status rendering on this page |
| 4 | TOKENS | All system stream ◀N▶; no invented storage |
| 5 | addToTable ordering | static/session LOW (slots 1-5); no user-input |
| 6 | GENERICITY | No hardcoded business names; generic scan labels |
| 7 | FIRESTORE TBD | All fields bracketed; LIKELY-TO-CHANGE |
| 8 | FLAT DSL | Single text prop with diamond delimiters |
| 9 | NO PIN | No PIN widget anywhere |
| 10 | Page chrome | Top bar and status bar omitted |

---

## 9. Handoff

Ready for `widget-qa` review.

---
---

# P4 DriverHome -- Build Walkthrough

**Task:** `driver-runtime-full-pages`
**File:** `json/driver-runtime/p4-driver-home.json`
**Date:** 2026-06-11
**Engineer:** widget-engineer

---

## 1. File produced

`C:\Users\FCT\Documents\Development\consteon\widget-claude\json\driver-runtime\p4-driver-home.json`

Top-level JSON array of 6 widget objects in render order (stack).

---

## 2. Widget inventory (render order)

| # | type | variant | status | row | text segments |
|---|------|---------|--------|-----|---------------|
| 1 | ROUTE_PROGRESS_HEADER | identityOnly | VARIANT of row 198 | 198 | 11 (indices 0-10) |
| 2 | TXT | -- | REUSE | -- | 1 (section label) |
| 3 | PRECONDITION_GATE_CARD | -- | NEW | 205 | 9 (indices 0-8) |
| 4 | INVENTORY_BUCKET_CARD | -- | NEW | 206 | 2 (indices 0-1) |
| 5 | DRIVER_STOP_CARD | preview | VARIANT of row 199 | 199 | 18 (indices 0-17) |
| 6 | NAV_ACTION_CARD | -- | NEW | 207 | 3 (indices 0-2) |

---

## 3. DSL symbol audit

- Diamond delimiter `◆`: used in every `text` property. Segment counts verified:
  - ROUTE_PROGRESS_HEADER: 10 diamonds = 11 segments (matches plan: base 8 + 3 additive)
  - PRECONDITION_GATE_CARD: 8 diamonds = 9 segments (matches plan)
  - INVENTORY_BUCKET_CARD: 1 diamond = 2 segments (matches plan)
  - DRIVER_STOP_CARD: 17 diamonds = 18 segments (matches plan: base 11 + 7 preview)
  - NAV_ACTION_CARD: 2 diamonds = 3 segments (matches plan)
- Black square `◼`: used in `buckets` prop of INVENTORY_BUCKET_CARD (`isi◼ok★kosong◼warn`) as label=tier separator
- Star `★`: used in `buckets` prop as inter-bucket separator
- Proxy variable `<2>`: used in PRECONDITION_GATE_CARD text segment 2 (`Muat dari <2>`)
- Computed tokens `{gateStatus}`, `{allClosed}`, `{confirmedSummary}`, `{closed}`, `{total}`: used as documented in plan, renderer-computed, never stored

---

## 4. Shared gate contract

- `PRECONDITION_GATE_CARD` reads `[GATE_FIELD]` from `[SRC:custodyState]`, exposes resolved value as page-level `{gateStatus}`
- `INVENTORY_BUCKET_CARD`, `DRIVER_STOP_CARD`, `NAV_ACTION_CARD` all consume `gate` + `gateValue` for visibility/lock behavior (equality only, no expression parser)
- Fallback documented: split into locked/unlocked page rows if reactive token unsupported

---

## 5. LIKELY-TO-CHANGE fields (all marked in plan, blocked on Firestore schema)

- Every `[SRC:*]`, `[GATE_FIELD]`, `[ITEMS_FIELD]`, `[LABEL_FIELD]`, `[QTY_FIELD]`, `[CATEGORY_FIELD]`
- `<2>` in preconditionGateCard text (load-origin label field index)
- `[PENDING_VALUE]` / `[MISMATCH_VALUE]` status vocabulary
- Identity tokens `[DRIVERNAME]`, `[VEHICLEID]`, `[PLATE]`, `[AVATAR]`
- All `[ROUTE:*]` destination page keys

---

## 6. Constraint compliance

| # | Constraint | Status |
|---|-----------|--------|
| 1 | REUSE-FIRST | 3 NEW + 2 VARIANT + 1 TXT reuse; gap table in plan justifies each |
| 2 | GRANULARITY | Dedicated types for distinct cards; no renames |
| 3 | STATUS 3-tier | No hex in config; tiers in buckets prop only (ok/warn); tier mapping documented as renderer-side |
| 4 | TOKENS | `<N>` for storage; `{curly}` for computed; no invented storage for aggregates |
| 5 | addToTable ordering | No addToTable on this page (display-only home); ordering rule N/A |
| 6 | GENERICITY | Zero hardcoded item names; categoryField indirection; N-ary buckets; generic gate |
| 7 | FIRESTORE TBD | All fields bracketed as [PLACEHOLDER]; LIKELY-TO-CHANGE assumptions listed |
| 8 | FLAT DSL | Single text prop with diamond delimiters; no invented nesting |
| 9 | NO PIN | No PIN widget anywhere |
| 10 | Page chrome | Bottom nav and status bar omitted |

---

## 7. Handoff

Ready for `widget-qa` review.
