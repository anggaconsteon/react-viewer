---
name: Request-Approval 3-page flow (VTL op1Screen)
description: Full analysis of RequestLeave→RequestApprover→RequestDetail flow, addToTable DSL, Firebase data structure, approval levels mechanics, and Event entry pattern.
type: project
originSessionId: 1e07e1d5-347f-4225-9467-ef62e00f1fc4
---
# Request-Approval 3-page Flow

**Spreadsheet:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` (agenia-demo-7 Proxy)
**Sheet:** `op1Screen`

## Page Locations in op1Screen

| Row | Route key | Description |
|-----|-----------|-------------|
| 655 | `vertikaTeknoLokaciptaRequestLeave` | Form submit — employee fills & submits leave request |
| 674 | `vertikaTeknoLokaciptaRequestApprover` | Approver list — shows PENDING items, has Approve/Reject buttons |
| 694 | `vertikaTeknoLokaciptaRequestDetail` | Detail view — full card detail + comment box + Approve/Reject |

---

## Firebase Table Path

```
$test/request-approval//vtl.trial-approval
```
- `$test` = Firebase project
- `request-approval` = root node
- `vtl.trial-approval` = table name (dot-separated)
- `//` = folder separator pattern

VID table: `20342033315492`

---

## Firebase Data Structure (indexed array)

Each record = JSON array with **1-based** position indices. From Firebase screenshot (`cfnAGiQVrZQAoBwRb3o5`):

| Index | Field | Example value | Source in addToTable |
|-------|-------|---------------|----------------------|
| `<1>` | Request number | `"REQ-2026-000135"` | `◁17▷` (auto-generated NUMBER widget, position 17) |
| `<2>` | Overall status | `"APPROVED"` (was `"PENDING"`) | `◁9▷` (static field position 9) |
| `<3>` | History | `"[]"` | static `[]` |
| `<4>` | **Approval levels array** | `"[[1, APPROVED, , , ]]"` | static `[[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]` |
| `<5>` | Requester myVID | `87544551624342` | static (baked) |
| `<6>` | Requester name | `"Agenia Demo-7"` | static (baked) |
| `<7>` | Site VID | `83674161979544` | static (baked) |
| `<8>` | Site name | `"Product Group"` | static (baked) |
| `<9>` | Site VID (2nd) | `83674161979544` | static (baked) |
| `<10>` | Site name (2nd) | `"Product Group"` | static (baked) |
| `<11>` | Submit time (formatted) | `"11 May 2026 13:40"` | `◀2|T7|Ddd MMM yyyy HH:mm▶` |
| `<12>` | Submit time (raw ms) | `"1778481623268"` | `◀2▶` |
| `<13>` | Leave type | `"Cuti Besar"` | `◁10▷` (DRD position 10) |
| `<14>` | Reason/Keterangan | `"testttttt"` | `◁3▷` (TXF position 3) |
| `<15>` | Photo/document URL | `https://...` | `◁4▷` (GET_IMAGES position 4) |
| `<16>` | Start date (raw ms) | `"1778457600000"` | `◁5▷` (datePicker position 5) |
| `<17>` | Start date (formatted) | `"11 May 2026 07:00"` | `◁5|T7|Ddd MMM yyyy HH:mm▷` |
| `<18>` | End date (raw ms) | `"1778544000000"` | `◁6▷` (datePicker position 6) |
| `<19>` | End date (formatted) | `"12 May 2026 07:00"` | `◁6|T7|Ddd MMM yyyy HH:mm▷` |
| `<20>` | Days count | `"1"` | `◁7▷` (numeric position 7) |
| `<21>` | Unknown | `""` | `◁8▷` |
| `<22>` | Replacement VID | `"4199999104694"` | `◁22▷` (tableSearch position 22) |
| `<23>` | Replacement name | `"Functional test"` | `◁23▷` (textField position 23) |
| `<24>` | Role label | `"Sekuriti"` | static literal |
| `<25>` | Icon URL | `https://...` | static literal |
| `<30>` | Summary display string | `"Tanggal 11 May 2026 sampai 12 May 2026, jumlah 1 hari, dengan pengganti Functional test"` | template string |

---

## Approval Levels Array (`<4>`) Mechanics

Initial state (3 levels):
```
[[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]
```

Each entry = `[level_number, status, approver_vid, approver_name, timestamp, comment]`

After level-1 approver approves → app logic collapses/updates to show only:
```
[[1, APPROVED, , , ]]
```

**Logic in app:**
- Approver sees requests WHERE their authorization level matches the current active level in `<4>`
- `conditions` in LIST_ITEM_CARD: `[[◀7▶◼{siteVID}◁1▷◼APPROVED,◁2▷◼PENDING]]`
  - `◀7▶` = current user's site VID must match `<7>` in the record
  - `◁1▷◼APPROVED` = if there's a previous level already APPROVED
  - `◁2▷◼PENDING` = overall status must still be PENDING
- When final level approves → `<2>` flips to APPROVED

**Button action when approving (from RequestApprover):**
```
<2>◼APPROVED⭘<3>◼87544551624342⭘<4>◼Agenia Demo-7⭘<5>◼◀5|T7|Ddd MMM yyyy HH:mm▶⭘<6>◼◀5▶
```
Updates: `<2>`=status, `<3>`=approverVID, `<4>`=approverName, `<5>`=timestamp formatted, `<6>`=timestamp raw.

**Note:** RequestApprover button actions update Firebase DIRECTLY — they do NOT create Event rows.

---

## addToTable Full DSL (RequestLeave button)

```
$test/request-approval//vtl.trial-approval
⭘retention◼4320
⭘description◼Leave request for vtl
⭘flag◼leave-request
⭘tablevid◼20342033315492
⭘index◼1★S◼5★N◼7★N◼9★N◼13★S◼2★S
⭘<1>◼◁17▷          // request number (auto-generated)
⭘<2>◼◁9▷           // status = PENDING (from static field)
⭘<3>◼[]            // history (empty array)
⭘<4>◼[[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]  // 3-level approval
⭘<5>◼87544551624342    // myVID (baked)
⭘<6>◼Agenia Demo-7     // name (baked)
⭘<7>◼83674161979544    // siteVID (baked)
⭘<8>◼Product Group     // site name (baked)
⭘<9>◼83674161979544    // siteVID (baked)
⭘<10>◼Product Group    // site name (baked)
⭘<11>◼◀2|T7|Ddd MMM yyyy HH:mm▶   // submit time formatted (system token)
⭘<12>◼◀2▶              // submit time raw ms (system token)
⭘<13>◼◁10▷             // leave type (from DRD)
⭘<14>◼◁3▷              // keterangan (from TXF)
⭘<15>◼◁4▷              // photo URL (from GET_IMAGES)
⭘<16>◼◁5▷              // start date raw (from datePicker)
⭘<17>◼◁5|T7|Ddd MMM yyyy HH:mm▷  // start date formatted
⭘<18>◼◁6▷              // end date raw
⭘<19>◼◁6|T7|Ddd MMM yyyy HH:mm▷  // end date formatted
⭘<20>◼◁7▷              // days count
⭘<21>◼◁8▷              // (unknown field)
⭘<22>◼◁22▷             // replacement VID (from tableSearch)
⭘<23>◼◁23▷             // replacement name (from textField readonly)
⭘<24>◼Sekuriti          // role label (static)
⭘<25>◼{icon_url}        // icon URL (static)
⭘<30>◼Tanggal ◁5|T7|Ddd MMM yyyy▷ sampai ◁6|T7|Ddd MMM yyyy▷, jumlah ◁7▷ hari, dengan pengganti ◁23▷
```

**index field:** `1★S◼5★N◼7★N◼9★N◼13★S◼2★S`
- Format: `<N>★{type}` where S=string, N=number
- Indexed fields = fields used for search/filter queries

---

## RequestApprover Page (row 674) — Key Fields

- **No position data** — read-only page, no `addToTable`
- Renders `LIST_ITEM_CARD` pulling from Firebase
- `search: "7◼83674161979544⭘2◼PENDING"` → show items where `<7>`=siteVID AND `<2>`=PENDING
- `role: "APPROVER"` → only approver-role users see this
- `text: "Approvals◆<6>◆<13>◆<11>"` → display uses `<6>` name, `<13>` leave type, `<11>` submit time
- Route on tap: `vertikaTeknoLokaciptaRequestDetail`

---

## RequestDetail Page (row 694) — Key Fields

- **No position data** — read-only + update-only page
- `WORKER_CARD_DETAIL`: search by `1◼<no_request>` (request number)
- `ITEM_CARD_DETAIL`: search by `1◼<request_vid>`, shows `<1>,<13>,<11>,<17>,<19>,<20>,<23>,<14>,<15>`
- `COMMENT_DETAIL` + `commentBox` → `$test/request-approval//comment` table
- Approve/Reject buttons = same action as RequestApprover buttons

---

## "Tidak Ada Position" Explanation

`vertikaTeknoLokaciptaRequestLeave` (row 655) has form fields with `position` values (5, 6, 7, 9, 10, 17, 22, 23, etc.) — these are the `◁N▷` form input tokens.

`vertikaTeknoLokaciptaRequestApprover` (row 674) and `RequestDetail` (row 694) do NOT have form input fields with positions — they only display data pulled from Firebase. Any updates go directly via button `actions`, not via `addToTable`.

---

## Event Entry Pattern (when building new request page)

A new request-type page DOES create an Event row via the `action:"savesend"` button. The Event entry in op1Script lookup table needs:

**From RequestLeave position data (borrow these verbatim):**
- All location fields: lat `◁5▷` → `F14`, lng `◁6▷` → `G14` (GPS from gpsPosition:2)
- Timestamp: `A8` (last Event row timestamp)
- VID chain: myVID (`Settings!$B$1`), siteVID (`B5`)
- Org tree: org chain `◻{VID}☆{Name}◻...`

**Plus approval-specific additions:**
- Approval levels: `<4>◼[[1, PENDING, , , , ], ...]` (count = org hierarchy depth)
- Request number: `<1>` (from NUMBER widget with `generate_number`)
- Status: `<2>◼PENDING` (static initial)

**How to apply:** For a new page, copy the `addToTable` DSL from `vertikaTeknoLokaciptaRequestLeave` row 655, swap field labels and position numbers to match the new form's widget `position` values, adjust `<4>` level count if approval chain depth differs.

---

## Why: last accessed 2026-05-20
