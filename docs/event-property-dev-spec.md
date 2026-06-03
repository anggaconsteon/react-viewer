# Dev Spec: Implement `event` Property on Approval Buttons

## Overview

Add support for a new `event` property on `LIST_ITEM_CARD` buttons. When present, the app builds an Event C entry dynamically from the Firebase record being approved, using a DSL mapping string. This replaces hardcoded Event C construction.

**Priority:** High — approval actions currently create no Event audit trail.

---

## 1. Widget JSON — What Changes

The `event` property is added to each button inside `LIST_ITEM_CARD.buttons[]`.

### Before (current — no Event created)

```json
{
  "text": "Approved",
  "color": "green",
  "actions": "<2>◼APPROVED⭘<3>◼87544551624342⭘<4>◼Agenia Demo-7⭘<5>◼◀5|T7|Ddd MMM yyyy HH:mm▶⭘<6>◼◀5▶",
  "chain": { "..." }
}
```

### After (Event created via DSL)

```json
{
  "text": "Approved",
  "color": "green",
  "actions": "<2>◼APPROVED⭘<3>◼87544551624342⭘<4>◼Agenia Demo-7⭘<5>◼◀5|T7|Ddd MMM yyyy HH:mm▶⭘<6>◼◀5▶",
  "event": "★2◼<15>⭘★3◼<13>⭘★5◼<16>⭘★6◼<18>⭘★9◼<14>⭘★10◼<20>⭘★14◼<2>⭘★15◼<22>⭘★16◼<1>⭘★17◼<23>⭘★18◼approver⭘★23◼levels",
  "chain": { "..." }
}
```

### Full Widget JSON (both buttons)

```json
{
  "type": "LIST_ITEM_CARD",
  "flag": "approve-leave",
  "vidtable": "20342033315492",
  "table": "$test/request-approval//vtl.trial-approval",
  "search": "7◼83674161979544⭘2◼PENDING",
  "conditions": "[[◀7▶◼83674161979544◁1▷◼APPROVED,◁2▷◼PENDING]]",
  "toDo": "[PENDING, APPROVED, REJECTED]",
  "role": "APPROVER",
  "text": "Approvals◆<6>◆<13>◆<11>◆Cari Approval◆Ketik Untuk Mencari◆Data tidak ditemukan",
  "route": "vertikaTeknoLokaciptaRequestDetail",
  "buttons": [
    {
      "text": "Rejected",
      "color": "red",
      "actions": "<2>◼REJECTED⭘<3>◼87544551624342⭘<4>◼Agenia Demo-7⭘<5>◼◀5|T7|Ddd MMM yyyy HH:mm▶⭘<6>◼◀5▶",
      "event": "★2◼<15>⭘★3◼<13>⭘★5◼<16>⭘★6◼<18>⭘★9◼<14>⭘★10◼<20>⭘★14◼<2>⭘★15◼<22>⭘★16◼<1>⭘★17◼<23>⭘★18◼approver⭘★23◼levels",
      "chain": {
        "type": "DO_DIALOG",
        "title": "Request Rejected",
        "children": [
          {"type": "TXT", "data": "Terkirim."},
          {"type": "RBT", "alignment": "center", "children": [{"text": "OK", "route": "vertikaTeknoLokaciptaRequestApprover"}]}
        ]
      }
    },
    {
      "text": "Approved",
      "color": "green",
      "actions": "<2>◼APPROVED⭘<3>◼87544551624342⭘<4>◼Agenia Demo-7⭘<5>◼◀5|T7|Ddd MMM yyyy HH:mm▶⭘<6>◼◀5▶",
      "event": "★2◼<15>⭘★3◼<13>⭘★5◼<16>⭘★6◼<18>⭘★9◼<14>⭘★10◼<20>⭘★14◼<2>⭘★15◼<22>⭘★16◼<1>⭘★17◼<23>⭘★18◼approver⭘★23◼levels",
      "chain": {
        "type": "DO_DIALOG",
        "title": "Request Approved",
        "children": [
          {"type": "TXT", "data": "Terkirim."},
          {"type": "RBT", "alignment": "center", "children": [{"text": "OK", "route": "vertikaTeknoLokaciptaRequestApprover"}]}
        ]
      }
    }
  ]
}
```

---

## 2. Execution Flow

```
User taps button (Approve or Reject)
    │
    ▼
Step 1: Execute `actions` (updateTableRow)
    │   Updates Firebase record fields (<2>, <3>, <4>, <5>, <6>)
    │   Wait for completion before proceeding
    │
    ▼
Step 2: Check if `event` property exists on the button
    │   If no `event` → skip to Step 5
    │   If `event` exists → continue
    │
    ▼
Step 3: Read the UPDATED Firebase record
    │   Important: <2> now has the new status (APPROVED/REJECTED)
    │   Important: <4> now has the updated approval levels array
    │
    ▼
Step 4: Build Event C from `event` DSL + record data
    │   a. Build geo block (flag = widget's `flag` property, gpsPosition = 2)
    │   b. Build ★1 identity block (current user, auto from system)
    │   c. Parse DSL entries, fill ★ sections from record
    │   d. Save Event to ledger
    │
    ▼
Step 5: Execute `chain` (show dialog)
```

**Critical:** Step 3 must read the record AFTER Step 1 completes. If you read before updateTableRow finishes, `<2>` will still have the old status.

---

## 3. DSL Parser

### Format

```
event = "★{N}◼{source}⭘★{N}◼{source}⭘..."
```

Split by `⭘` to get entries. Each entry split by `◼` to get target ★ section and source.

### Source Types (4 types)

| Source Pattern | Meaning | Action |
|----------------|---------|--------|
| `<N>` | Firebase field | `sections[star] = record["<N>"] ?? ""` |
| `approver` | Current user | `sections[star] = "${user.vid}☆${user.name}"` |
| `levels` | Approval array | Expand `record["<4>"]` into ★star through ★star+4 |
| anything else | Literal string | `sections[star] = source` |

### Implementation

```dart
String? buildEventFromDSL({
  required String eventDSL,
  required Map<String, dynamic> record,
  required User currentUser,
  required GeoData geoData,
  required String flag,
}) {
  // Initialize ★1-★27 (index 0 unused)
  final sections = List.filled(28, '');

  // ★1 = identity block (always auto, same as savesend)
  sections[1] = buildIdentityBlock(currentUser);

  // Parse DSL
  for (final entry in eventDSL.split('⭘')) {
    final parts = entry.split('◼');
    if (parts.length != 2) continue;

    final starIdx = int.tryParse(parts[0].replaceAll('★', ''));
    if (starIdx == null || starIdx < 1 || starIdx > 27) continue;

    final source = parts[1];

    if (source == 'approver') {
      sections[starIdx] = '${currentUser.vid}☆${currentUser.name}';
    }
    else if (source == 'levels') {
      expandLevels(record, sections, starIdx);
    }
    else if (RegExp(r'^<\d+>$').hasMatch(source)) {
      sections[starIdx] = record[source]?.toString() ?? '';
    }
    else {
      sections[starIdx] = source;
    }
  }

  // Assemble
  final geo = buildGeoBlock(flag: flag, geoData: geoData);
  final stars = sections.sublist(1).map((s) => '★$s').join('');
  return '${geo}⬤$stars';
}

void expandLevels(Map<String, dynamic> record, List<String> sections, int startIdx) {
  final raw = record['<4>'];
  if (raw == null) return;

  // <4> is stored as string: "[[1, APPROVED, vid, name, ts, epoch], [2, PENDING, , , , ]]"
  // Parse into list of level arrays
  final levels = parseApprovalArray(raw);

  for (var i = 0; i < levels.length && i < 5; i++) {
    final targetIdx = startIdx + i;
    if (targetIdx >= sections.length) break;

    final level = levels[i];
    // level = [levelNumber, status, vid, name, timestamp, epoch]

    // Skip pending or empty levels
    if (level.length < 6) continue;
    final status = level[1].toString().trim();
    if (status == 'PENDING' || status.isEmpty) continue;

    // Build: level☆status☆name☆vid☆timestamp☆epoch
    // IMPORTANT: use ☆ separator, NOT ◇
    sections[targetIdx] = [
      level[0], // level number
      level[1], // status (APPROVED / REJECTED)
      level[3], // approver name (index 3, not 2)
      level[2], // approver vid (index 2, not 3)
      level[4], // timestamp formatted
      level[5], // epoch ms
    ].map((e) => e.toString().trim()).join('☆');
  }
}
```

**Note on `<4>` array field order:** The Firebase `<4>` array stores each level as `[levelNumber, status, VID, name, timestamp, epoch]`. But the Event C output order is `level☆status☆NAME☆VID☆timestamp☆epoch` — name comes before VID. Make sure to swap indices 2 and 3.

---

## 4. Event C Output Format

### Structure

```
0{flag}◆{timestamp}◆◆◆{lat}◆{lng}◆◆{country}◆{zip}◆{state}◆{regency}◆{district}◆{village}◆{street}◆{number}◆{location-type}⬤★{★1}★{★2}★{★3}★...★{★27}
```

### Expected Output — Level 2 Approves

Given:
- Approver: Agenia Demo-7 (VID: 87544551624342)
- Firebase record after updateTableRow:
  - `<1>` = `REQ-2026-000159`
  - `<2>` = `PENDING` (not final level)
  - `<4>` = `[[1, APPROVED, 85924392055168, Muhamad Angga, 21 May 2026 15:26, 1779352003642], [2, APPROVED, 87544551624342, Agenia Demo-7, 21 May 2026 15:43, 1779353014253], [3, PENDING, , , , ]]`
  - `<13>` = `Cuti Besar`
  - `<14>` = `ya`
  - `<15>` = `https://firebasestorage...jpg`
  - `<16>` = `1779321600000`
  - `<18>` = `1779408000000`
  - `<20>` = `2`
  - `<22>` = `42000000077322`
  - `<23>` = `Rika Putri Amelia Listiana`

**Result:**

```
0approve-leave◆{ts}◆◆◆{lat}◆{lng}◆◆{geo...}⬤★{identity}★https://firebasestorage...jpg★Cuti Besar★★1779321600000★1779408000000★★★ya★2★★★★PENDING★42000000077322★REQ-2026-000159★Rika Putri Amelia Listiana★87544551624342☆Agenia Demo-7★★★★★1☆APPROVED☆Muhamad Angga☆85924392055168☆21 May 2026 15:26☆1779352003642★2☆APPROVED☆Agenia Demo-7☆87544551624342☆21 May 2026 15:43☆1779353014253★★★
```

**★ section breakdown:**

| ★ | Content | Source |
|---|---------|--------|
| ★1 | `{identity_block}` | System auto |
| ★2 | `https://firebasestorage...jpg` | `<15>` |
| ★3 | `Cuti Besar` | `<13>` |
| ★4 | *(empty)* | not in DSL |
| ★5 | `1779321600000` | `<16>` |
| ★6 | `1779408000000` | `<18>` |
| ★7-★8 | *(empty)* | not in DSL |
| ★9 | `ya` | `<14>` |
| ★10 | `2` | `<20>` |
| ★11-★13 | *(empty)* | not in DSL |
| ★14 | `PENDING` | `<2>` |
| ★15 | `42000000077322` | `<22>` |
| ★16 | `REQ-2026-000159` | `<1>` |
| ★17 | `Rika Putri Amelia Listiana` | `<23>` |
| ★18 | `87544551624342☆Agenia Demo-7` | `approver` |
| ★19-★22 | *(empty)* | not in DSL |
| ★23 | `1☆APPROVED☆Muhamad Angga☆85924392055168☆21 May 2026 15:26☆1779352003642` | `levels[0]` |
| ★24 | `2☆APPROVED☆Agenia Demo-7☆87544551624342☆21 May 2026 15:43☆1779353014253` | `levels[1]` |
| ★25-★27 | *(empty)* | Level 3-5 pending |

---

## 5. Key Rules

1. **`event` is optional.** If a button has no `event` property, skip Event creation entirely. Existing buttons without `event` keep working as before.

2. **Read record AFTER `actions`.** The `actions` property (updateTableRow) runs first and updates Firebase. Then read the record to get the new values for Event C.

3. **★1 is always auto.** The identity block at ★1 is built by the system (same mechanism as `savesend`). Do NOT include ★1 in the DSL.

4. **Geo block uses the widget's `flag`.** The geo block prefix uses the `flag` property from the parent `LIST_ITEM_CARD` widget (e.g., `approve-leave`), and `gpsPosition: 2`.

5. **Level blocks use `☆` separator.** NOT `◇`. Each level: `{level}☆{status}☆{name}☆{vid}☆{timestamp}☆{epoch}`.

6. **Levels are cumulative.** When Level 2 approves, the Event must contain BOTH Level 1 AND Level 2 data from the `<4>` array.

7. **`approver` = VID☆Name.** One ★ section, two values separated by `☆`. NOT two separate ★ sections.

8. **Missing fields = empty string.** If a Firebase field doesn't exist or is null, put empty string at that ★ section. Don't crash.

9. **Max 27 ★ sections.** ★1 through ★27. Ignore any DSL entry with ★ > 27.

10. **Max 5 levels.** `levels` expands into max 5 consecutive ★ sections (★23-★27 typically). If `<4>` has more than 5 entries, ignore the rest.

---

## 6. Test Scenarios

### Test 1: Level 1 Approves (3-level system)

- Click "Approved" on Level 1
- `actions` sets `<2>` to value based on approval logic
- `<4>[0]` = `[1, APPROVED, {vid}, {name}, {ts}, {epoch}]`
- `<4>[1]` = `[2, PENDING, , , , ]`
- Event C ★23 = `1☆APPROVED☆{name}☆{vid}☆{ts}☆{epoch}`
- Event C ★24-★27 = empty

### Test 2: Level 2 Approves (cumulative)

- `<4>[0]` = Level 1 APPROVED (from before)
- `<4>[1]` = `[2, APPROVED, {vid}, {name}, {ts}, {epoch}]`
- Event C ★23 = Level 1 data (preserved)
- Event C ★24 = Level 2 data (new)

### Test 3: Final Level Approves

- All levels APPROVED
- `<2>` = `APPROVED` (final status)
- Event C ★14 = `APPROVED` (not PENDING)

### Test 4: Level 1 Rejects

- Click "Rejected"
- `<2>` = `REJECTED`
- `<4>[0]` = `[1, REJECTED, {vid}, {name}, {ts}, {epoch}]`
- Event C ★14 = `REJECTED`
- Event C ★23 = `1☆REJECTED☆{name}☆{vid}☆{ts}☆{epoch}`

### Test 5: No `event` property

- Button has `actions` but no `event`
- No Event C created
- updateTableRow still works normally
- No errors

### Test 6: Missing Firebase fields

- Record is missing `<22>` (Replacement VID)
- Event C ★15 = empty string (not null, not crash)

---

## 7. Files Changed

| Area | Change |
|------|--------|
| **Button model** | Add optional `String? event` field |
| **Button action handler** | After `actions` (updateTableRow), check for `event`, call `buildEventFromDSL()` |
| **New function** | `buildEventFromDSL()` — parses DSL, reads record, builds Event C |
| **New function** | `expandLevels()` — handles `levels` keyword, parses `<4>` array |
| **Spreadsheet** | Add `event` property to approval button JSON in op1Screen |

No changes needed to: existing `savesend` logic, `addToTable` parsing, `updateTableRow` logic, or any other widget types.

---

## 8. Bug Report — Current Implementation (2026-05-21)

The current implementation has 3 bugs confirmed from live output. **The `event` DSL mapping is correct — all bugs are in the Flutter code.**

### Actual Output (broken)

```
01779358232425◼87544551624342◼83674161979544◼approve-leave◼security◼1779321600000◼◼[-6.31639639,106.64485495]◼Cuti Besar◼Sampora, Kecamatan Cisauk, Kabupaten Tangerang, Banten, 15345, ID◻87544551624342☆Agenia Demo-7◻83674161979544☆Product Group◻83674161979544☆Product Group◻84214220504259☆Vertika Tekno Lokacipta◻539☆46163.7156481482◻☆☆☆☆☆1☆REQ-2026-000176☆87544551624342◆Agenia Demo-7☆☆☆
```

### Bug 1: OFF-BY-ONE — All ★ sections shifted -1

**Severity:** Critical — breaks ALL op1Script D formula column references.

Every value lands one ★ section too early:

| DSL Target | Expected Column | Actual Column | Value Found | Shift |
|-----------|----------------|---------------|-------------|-------|
| `★10◼<20>` (Jumlah Hari) | ★10 → col N | **★9 → col M** | `1` | **-1** |
| `★16◼<1>` (Request Number) | ★16 → col T | **★15 → col S** | `REQ-2026-000176` | **-1** |
| `★18◼approver` | ★18 → col V | **★17 → col U** | `87544551624342◆Agenia Demo-7` | **-1** |

**Root cause:** Event C assembly joins sections without leading `★` before first section.

```dart
// ❌ BUG (produces: "identity★photo★cuti★...")
final stars = sections.sublist(1).join('★');

// When parser splits "geoBlock⬤identity★photo★..." by ★:
//   parts[0] = "geoBlock⬤identity"  ← ★1 merged with geo!
//   parts[1] = "photo"              ← becomes ★1 instead of ★2
//   Everything shifts -1

// ✅ FIX (produces: "★identity★photo★cuti★...")
final stars = sections.sublist(1).map((s) => '★$s').join('');

// Parser splits "geoBlock⬤★identity★photo★..." by ★:
//   parts[0] = "geoBlock⬤"          ← geo only
//   parts[1] = "identity"           ← ★1 correct
//   parts[2] = "photo"              ← ★2 correct
```

**Verification:** After fix, `$T$13` (★16) should contain `REQ-2026-000176`, not `$S$13`.

### Bug 2: Approver separator ◆ instead of ☆

**Severity:** High — D formula tail and downstream reporting breaks.

```
❌ GOT:    87544551624342◆Agenia Demo-7     (◆ = geo delimiter)
✅ EXPECT: 87544551624342☆Agenia Demo-7     (☆ = sub-field delimiter)
```

```dart
// ❌ BUG
sections[starIdx] = '${currentUser.vid}◆${currentUser.name}';

// ✅ FIX
sections[starIdx] = '${currentUser.vid}☆${currentUser.name}';
```

### Bug 3: Levels expansion produces nothing

**Severity:** High — approval audit trail incomplete.

★23 through ★27 are ALL empty even though `<4>` has acted-on levels.

Possible causes (check in order):
1. `expandLevels()` never called — `source == 'levels'` check not matching
2. `record['<4>']` returns null — key mismatch (e.g., reading `<4>` as `4`)
3. `parseApprovalArray()` fails to parse the string format
4. Status check too strict — levels with `APPROVED` status still filtered out

```dart
// Debug: add logging to confirm
if (source == 'levels') {
  print('DEBUG: levels triggered, startIdx=$starIdx');
  print('DEBUG: record[<4>] = ${record["<4>"]}');
  print('DEBUG: type = ${record["<4>"].runtimeType}');
  expandLevels(record, sections, starIdx);
  print('DEBUG: sections[$starIdx] = ${sections[starIdx]}');
}
```

### Fix Priority

| # | Bug | Fix | Impact |
|---|-----|-----|--------|
| 1 | Off-by-one ★ shift | Change `join('★')` → `.map((s) => '★$s').join('')` | ALL fields land in correct columns |
| 2 | Approver ◆→☆ | Replace `◆` with `☆` in approver string | Approver data parseable |
| 3 | Empty levels | Debug `expandLevels()` — likely record key or parse issue | Audit trail complete |

### After Fix — Expected D Formula Output

```
{scaffold}◻87544551624342☆Agenia Demo-7◻83674161979544☆Product Group◻83674161979544☆Product Group◻84214220504259☆Vertika Tekno Lokacipta◻539☆46163.7156481482◻REQ-2026-000176☆PENDING☆87544551624342☆Agenia Demo-7☆☆1☆Rika Putri Amelia Listiana☆87544551624342☆Agenia Demo-7☆1☆APPROVED☆Muhamad Angga☆85924392055168☆21 May 2026 15:26☆1779352003642☆☆
```

Key differences from broken output:
- `REQ-2026-000176` at correct column T (★16), not column S (★15)
- `87544551624342☆Agenia Demo-7` with ☆ at correct column V (★18), not column U with ◆
- Level data present at column AA (★23): `1☆APPROVED☆Muhamad Angga☆85924392055168☆...`
