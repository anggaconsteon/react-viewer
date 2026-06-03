# Spec: Approval Event Creation for Request-Leave Flow

## Problem

When an approver clicks **Approve** or **Reject** on the `vertikaTeknoLokaciptaRequestApprover` or `vertikaTeknoLokaciptaRequestDetail` page, the app currently only performs a `updateTableRow` to update Firebase directly. **No Event entry is created.** This means:

- No audit trail in the Event ledger
- op1Script cannot parse the approval action
- Reporting (Event column D) has no visibility into approvals
- The only record of WHO approved, WHEN, and at WHAT level is buried in the Firebase `<4>` array

## Goal

When an approver clicks Approve/Reject, the app must **also create an Event** (equivalent to `savesend`) with flag `approve-leave`. The Event must contain:

1. All original request data (read from the Firebase record being approved)
2. The approver's identity (VID + name)
3. The overall transaction status (`<2>` — read AFTER the Firebase update)
4. The cumulative approval levels data (who approved at each level so far)

## Firebase Table Reference

- **Table path:** `$test/request-approval//vtl.trial-approval`
- **Table VID:** `20342033315492`
- **Pages:** `vertikaTeknoLokaciptaRequestApprover` (op1Screen row 674), `vertikaTeknoLokaciptaRequestDetail` (op1Screen row 694)
- **Spreadsheet:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`

## Current Button Actions (keep as-is)

The approval buttons currently execute `updateTableRow` with:

```
<2>◼APPROVED⭘<3>◼{approverVID}⭘<4>◼{approverName}⭘<5>◼◀5|T7|Ddd MMM yyyy HH:mm▶⭘<6>◼◀5▶
```

This updates the approval level sub-array in Firebase `<4>`. **Keep this behavior.** The new Event creation is **in addition to** this existing update.

## Event C Data Structure

The Event C column uses the standard Consteon encoding:

```
0{flag}◆{timestamp}◆◆◆{lat}◆{lng}◆◆{country}◆{zip}◆{state}◆{regency}◆{district}◆{village}◆{street}◆{number}◆{location-type}⬤★{section1}★{section2}★...
```

- Sections after `⬤` are separated by `★`
- `★1` (first section after ⬤) = identity block of the person performing the action (auto from system)
- Subsequent `★` sections correspond to **position numbers** where `★N = position (N+1)`
- Within a section, fields are separated by `☆`

### Flag

```
approve-leave
```

## Position Map

### Section 1: Request Data (positions 3-18)

These positions use the **same numbering** as the `request-leave` form so that op1Script parsing is consistent. Values are read from the Firebase record being approved.

| Position | ★ Section | Field | Read from Firebase |
|----------|-----------|-------|--------------------|
| 3 | ★2 | Photo/Document URL | record field `<15>` |
| 4 | ★3 | Jenis Cuti (leave type) | record field `<13>` |
| 6 | ★5 | Tanggal Mulai (start date epoch ms) | record field `<16>` |
| 7 | ★6 | Tanggal Selesai (end date epoch ms) | record field `<18>` |
| 10 | ★9 | Keterangan (reason text) | record field `<14>` |
| 11 | ★10 | Jumlah Hari (number of days) | record field `<20>` |
| 15 | ★14 | **Overall Transaction Status** | record field `<2>` — **read AFTER updateTableRow completes** |
| 16 | ★15 | Replacement VID | record field `<22>` |
| 17 | ★16 | Request Number | record field `<1>` |
| 18 | ★17 | Replacement Name | record field `<23>` |

**Important:** Position 15 must contain the UPDATED value of `<2>`. For intermediate levels this will be `PENDING`. For the final level it will be `APPROVED`. For rejection it will be `REJECTED`.

Positions not listed (5, 8, 9, 12, 13, 14) should be empty `★` sections.

### Section 2: Approver Identity (positions 19-20)

| Position | ★ Section | Field | Source |
|----------|-----------|-------|--------|
| 19 | ★18 | Approver VID | Current user's VID (the person clicking Approve/Reject) |
| 20 | ★19 | Approver Name | Current user's display name |

### Section 3: Reserved for Future Use (positions 21-23)

| Position | ★ Section | Field |
|----------|-----------|-------|
| 21 | ★20 | *empty — reserved* |
| 22 | ★21 | *empty — reserved* |
| 23 | ★22 | *empty — reserved* |

These 3 positions are intentionally left empty for future expansion without breaking the position layout.

### Section 4: Approval Level Blocks (positions 24-28)

Each position holds ONE approval level's complete data as a `☆`-delimited string:

```
{level_number}☆{status}☆{approver_name}☆{approver_vid}☆{timestamp_formatted}☆{epoch_ms}
```

| Position | ★ Section | Level |
|----------|-----------|-------|
| 24 | ★23 | Level 1 |
| 25 | ★24 | Level 2 |
| 26 | ★25 | Level 3 |
| 27 | ★26 | Level 4 |
| 28 | ★27 | Level 5 |

**Critical: Approval data is CUMULATIVE.** When level 2 approves, the Event must contain BOTH level 1's data AND level 2's data. Previous levels' data is read from the updated Firebase `<4>` array.

Empty/pending levels should be empty `★` sections.

## Examples

### Example 1: Level 1 approves (3-level system)

Firebase `<4>` after update:
```
[[1, APPROVED, 2321312, Ucup, 17 Mei 2026, 179001293912], [2, PENDING, , , , ], [3, PENDING, , , , ]]
```

Firebase `<2>` after update: `PENDING` (not final level)

Event C:
```
0approve-leave◆1790012939120◆◆◆-6.316◆106.644◆◆ID◆15345◆Banten◆Kabupaten Tangerang◆Kecamatan Cisauk◆Sampora◆Jalan Horizon Broadway◆25◆true-location⬤★{Ucup_identity_block}★{photo_url}★Cuti Besar★★1778457600000★1778544000000★★★testttttt★1★★★★PENDING★41999991046694★REQ-2026-000135★Functional test★2321312★Ucup★★★★1☆APPROVED☆Ucup☆2321312☆17 Mei 2026☆179001293912★★★★★
```

### Example 2: Level 2 approves (Level 1 data preserved)

Firebase `<4>` after update:
```
[[1, APPROVED, 2321312, Ucup, 17 Mei 2026, 179001293912], [2, APPROVED, 1111321312, Deo, 18 Mei 2026, 17229001293912], [3, PENDING, , , , ]]
```

Firebase `<2>` after update: `PENDING` (still not final)

Event C:
```
0approve-leave◆...⬤★{Deo_identity_block}★{photo_url}★Cuti Besar★★1778457600000★1778544000000★★★testttttt★1★★★★PENDING★41999991046694★REQ-2026-000135★Functional test★1111321312★Deo★★★★1☆APPROVED☆Ucup☆2321312☆17 Mei 2026☆179001293912★2☆APPROVED☆Deo☆1111321312☆18 Mei 2026☆17229001293912★★★★
```

### Example 3: Level 3 approves (FINAL — status changes)

Firebase `<2>` after update: **`APPROVED`** (final level done)

Event C:
```
0approve-leave◆...⬤★{Budi_identity_block}★{photo_url}★Cuti Besar★★1778457600000★1778544000000★★★testttttt★1★★★★APPROVED★41999991046694★REQ-2026-000135★Functional test★9988776★Budi★★★★1☆APPROVED☆Ucup☆2321312☆17 Mei 2026☆179001293912★2☆APPROVED☆Deo☆1111321312☆18 Mei 2026☆17229001293912★3☆APPROVED☆Budi☆9988776☆19 Mei 2026☆17239001293912★★★
```

Note: Position 15 is now `APPROVED` instead of `PENDING`.

### Example 4: Level 1 rejects

Firebase `<2>` after update: **`REJECTED`**

Event C:
```
0approve-leave◆...⬤★{approver_identity}★...★★★★REJECTED★...★REQ-2026-000135★...★{approverVID}★{approverName}★★★★1☆REJECTED☆{name}☆{vid}☆{ts}☆{epoch}★★★★★
```

## Implementation Steps

1. **Keep existing `updateTableRow`** — do not change the current Firebase update logic
2. **After `updateTableRow` completes**, read the updated Firebase record to get:
   - All request fields (`<1>`, `<2>`, `<13>`, `<14>`, `<15>`, `<16>`, `<18>`, `<20>`, `<22>`, `<23>`)
   - The updated `<4>` approval levels array
3. **Build Event C string** following the position map above:
   - Geo block (from GPS, same as any savesend)
   - Identity block (current approver, auto from system)
   - Request data mapped to positions 3-18
   - Approver VID/Name at positions 19-20
   - Empty sections at positions 21-23
   - Approval levels from `<4>` array mapped to positions 24-28
4. **Create the Event** with:
   - `flag`: `approve-leave`
   - `gpsPosition`: `2` (same as request-leave)
   - The constructed Event C data
5. **Note:** op1Script sheet may need +2 columns (AD, AE) to parse positions 27-28 (Level 4-5). Current sheet has 29 columns (A-AC), which supports up to position 26 (Level 3).

## Position Summary Table

```
Pos  ★   Cell   Purpose
───  ──  ────   ───────
 3   ★2   F13   Photo URL
 4   ★3   G13   Jenis Cuti
 5   ★4   H13   (empty)
 6   ★5   I13   Tanggal Mulai
 7   ★6   J13   Tanggal Selesai
 8   ★7   K13   (empty)
 9   ★8   L13   (empty)
10   ★9   M13   Keterangan
11  ★10   N13   Jumlah Hari
12  ★11   O13   (empty)
13  ★12   P13   (empty)
14  ★13   Q13   (empty)
15  ★14   R13   Overall Status (<2>)
16  ★15   S13   Replacement VID
17  ★16   T13   Request Number
18  ★17   U13   Replacement Name
19  ★18   V13   Approver VID
20  ★19   W13   Approver Name
21  ★20   X13   (reserved)
22  ★21   Y13   (reserved)
23  ★22   Z13   (reserved)
24  ★23  AA13   Level 1: {level}☆{status}☆{nama}☆{vid}☆{ts}☆{epoch}
25  ★24  AB13   Level 2: ...
26  ★25  AC13   Level 3: ...
27  ★26  AD13   Level 4: ... (needs sheet expansion)
28  ★27  AE13   Level 5: ... (needs sheet expansion)
```
