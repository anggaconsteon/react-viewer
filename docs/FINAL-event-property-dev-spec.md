# FINAL Dev Spec: `event` Property — Complete Bug Fix & Implementation

> **Version:** FINAL (2026-05-22)
> **Status:** Ready for dev — no further spec iterations needed
> **Total issues:** 13 (5 code bugs + 4 parser edge cases + 3 spreadsheet config + 1 design gap)

---

## 0. Summary

The `event` property on `LIST_ITEM_CARD` buttons builds an Event C entry dynamically from the Firebase record being approved. The current implementation has the DSL correct but the Flutter code has multiple bugs causing all data to be empty or misplaced.

**DSL (CORRECT — do not change):**
```
★2◼<15>⭘★3◼<13>⭘★5◼<16>⭘★6◼<18>⭘★9◼<14>⭘★10◼<20>⭘★14◼<2>⭘★15◼<22>⭘★16◼<1>⭘★17◼<23>⭘★18◼approver⭘★23◼levels
```

---

## 1. Complete Bug List

### BUG-1: Off-by-One — All ★ sections shifted -1 (CRITICAL)

**Symptom:** All data lands one ★ section too early. op1Script reads wrong columns → everything appears empty.

**Root cause:** Event C assembly joins sections without leading `★` before section 1.

```dart
// ❌ BUG — produces: "geo⬤identity★photo★cuti..."
//    Parser splits by ★:
//      parts[0] = "geo⬤identity"  ← ★1 merged with geo!
//      parts[1] = "photo"         ← shows at ★1 instead of ★2
//    Every section shifts -1
final stars = sections.sublist(1).join('★');

// ✅ FIX — produces: "geo⬤★identity★photo★cuti..."
//    Parser splits by ★:
//      parts[0] = "geo⬤"          ← geo only
//      parts[1] = "identity"      ← ★1 correct
//      parts[2] = "photo"         ← ★2 correct
final stars = sections.sublist(1).map((s) => '★$s').join('');
```

**This single fix resolves "all positions are empty."**

---

### BUG-2: Approver Separator ◆ Instead of ☆ (HIGH)

**Symptom:** Approver string `87544551624342◆Agenia Demo-7` uses geo delimiter `◆`. Parser first splits Event C on `◆` for geo block, corrupting everything from approver section onward.

```dart
// ❌ BUG
sections[starIdx] = '${currentUser.vid}◆${currentUser.name}';

// ✅ FIX
sections[starIdx] = '${currentUser.vid}☆${currentUser.name}';
```

---

### BUG-3: Levels Expansion Produces Nothing (HIGH)

**Symptom:** ★23-★27 all empty even though `<4>` has acted-on levels.

**Root cause:** `parseApprovalArray()` cannot parse the Firebase `<4>` format. It is NOT valid JSON:

```
// Firebase stores <4> as this STRING:
"[[1, APPROVED, 85924392055168, Muhamad Angga, 21 May 2026 15:26, 1779352003642], [2, PENDING, , , , ]]"

// This is NOT JSON — has unquoted strings, bare identifiers, empty values between commas
// jsonDecode() WILL fail silently, returning null → expandLevels skips everything
```

**Fix:** Write a custom parser (see Section 4).

**Also check these 3 sub-causes in order:**

| # | Check | How to verify |
|---|-------|---------------|
| 3a | `expandLevels()` never called | Add `print('DEBUG: levels triggered')` inside `source == 'levels'` branch |
| 3b | `record['<4>']` returns null | Print `record['<4>']` and `record['<4>'].runtimeType` — key might be integer `4` not string `"<4>"` |
| 3c | `parseApprovalArray()` fails | Print return value — if null/empty, parser is the problem |
| 3d | Status filter too strict | After parsing, print each level's status before the PENDING check |

---

### BUG-4: Level Blocks Use ◇ Instead of ☆ (HIGH)

**Symptom:** From iteration 1 broken output: `1◇APPROVED◇Muhamad Angga◇85924392055168◇...`

**Fix:** Level block separator MUST be `☆`, never `◇`:

```dart
// ❌ BUG (if this is how it's coded)
sections[targetIdx] = level.join('◇');

// ✅ FIX
sections[targetIdx] = [
  level[0],  // level number
  level[1],  // status
  level[3],  // name (index 3, NOT 2 — swap!)
  level[2],  // vid (index 2, NOT 3 — swap!)
  level[4],  // timestamp formatted
  level[5],  // epoch ms
].map((e) => e.toString().trim()).join('☆');
```

**CRITICAL: Note the VID/Name swap!** Firebase stores `[level, status, VID, name, ts, epoch]` but Event C output order is `level☆status☆NAME☆VID☆ts☆epoch`. Indices 2 and 3 must be swapped.

---

### BUG-5: ★1 Identity Block Empty (HIGH)

**Symptom:** From iteration 1 broken output: `⬤★★Cuti Besar...` — ★1 is empty, no identity block.

**Root cause:** Either `buildIdentityBlock()` is not called, returns empty, or the approver user object is incomplete.

**Fix:** Verify `sections[1] = buildIdentityBlock(currentUser)` is called and produces:

```
{VID}☆{Name}☆{email}☆☆☆{siteName}☆{siteVID}☆{orgChain}
```

Example:
```
87544551624342☆Agenia Demo-7☆ageniademo7@gmail.com☆☆☆Product Group☆83674161979544☆Product Group◇83674161979544☆Product Group◇84214220504259☆Vertika Tekno Lokacipta
```

**The identity block is the SAME mechanism as regular `savesend` events.** If `savesend` events have correct identity, copy that logic. If not, there's a shared bug.

---

## 2. Parser Edge Cases (Preventive Fixes)

### EDGE-1: `parseApprovalArray` Must Handle Non-JSON Format

Firebase `<4>` is a STRING that looks like an array but isn't valid JSON:

```
"[[1, APPROVED, 85924392055168, Muhamad Angga, 21 May 2026 15:26, 1779352003642], [2, PENDING, , , , ]]"
```

Problems:
- Unquoted strings: `APPROVED`, `Muhamad Angga`
- Empty values: `, ,` (adjacent commas)
- Timestamps with spaces: `21 May 2026 15:26`

**Custom parser required:**

```dart
List<List<String>> parseApprovalArray(dynamic raw) {
  if (raw == null) return [];
  
  final str = raw.toString().trim();
  if (!str.startsWith('[[')) return [];
  
  // Strip outer brackets: "[[...]]" → "[...]"  
  final inner = str.substring(1, str.length - 1);
  
  // Split on "], [" to get individual level strings
  final levelStrings = inner.split(RegExp(r'\]\s*,\s*\['));
  
  final result = <List<String>>[];
  for (var levelStr in levelStrings) {
    // Strip any remaining [ or ]
    levelStr = levelStr.replaceAll('[', '').replaceAll(']', '');
    
    // Split on comma — but respect that names/timestamps may NOT have commas
    // Actually each level has exactly 6 fields separated by ", "
    // Use split with limit to handle edge cases
    final fields = levelStr.split(', ');
    
    // Trim each field
    final trimmed = fields.map((f) => f.trim()).toList();
    result.add(trimmed);
  }
  
  return result;
}
```

**WARNING:** The comma-space split assumes field values don't contain `, ` (comma-space). Current data is safe (names, VIDs, dates don't have `, `). If this changes, need a smarter delimiter.

---

### EDGE-2: Record Key Format — `"<4>"` vs `4`

Firebase field keys in the record map might be stored differently depending on how the Flutter code constructs the map:

```dart
// If Firebase stores as: { "<4>": "[[...]]" }
record['<4>']  // ✅ works

// If Firebase stores as: { "4": "[[...]]" }
record['<4>']  // ❌ returns null

// If code strips angle brackets: record[4] or record['4']
record['<4>']  // ❌ returns null
```

**Fix:** Add a fallback key lookup:

```dart
dynamic getField(Map<String, dynamic> record, String key) {
  // Try exact match first
  if (record.containsKey(key)) return record[key];
  // Try without angle brackets
  final stripped = key.replaceAll('<', '').replaceAll('>', '');
  if (record.containsKey(stripped)) return record[stripped];
  return null;
}
```

---

### EDGE-3: Null Handling in Level Arrays

Empty/pending levels from Firebase: `[2, PENDING, , , , ]`

After parsing, empty values between commas become empty strings `""`. But some parsers might return `null` instead.

```dart
// Safe status check:
final status = (level.length > 1 ? level[1] : '').toString().trim();
if (status == 'PENDING' || status.isEmpty) continue;

// Safe field access with null-to-empty:
final name = (level.length > 3 ? level[3] : '') ?? '';
final vid = (level.length > 2 ? level[2] : '') ?? '';
```

---

### EDGE-4: Whitespace Trimming

Firebase values may have leading/trailing spaces. Trim during BOTH parsing and output:

```dart
// During status check (before filtering):
final status = level[1].toString().trim();  // " APPROVED" → "APPROVED"

// During output (when building the ☆-string):
.map((e) => e.toString().trim()).join('☆')
```

---

## 3. Spreadsheet Config Issues

### CONFIG-1: RequestDetail Page (Row 694) Missing `event` Property (CRITICAL)

**Current state:** `vertikaTeknoLokaciptaRequestDetail` (row 694) has Approve/Reject buttons with `actions` but **NO `event` property**. Approvals from the detail page create NO Event audit trail.

**Impact:** Users who approve from the detail page (vs. the list page) have no audit record.

**Fix depends on design decision (see DESIGN-1 below).** Two options:

**Option A — Add `event` to the RBT buttons at row 694:**

The RBT buttons at row 694 are standalone (not inside LIST_ITEM_CARD). They need the Firebase record context to resolve `<N>` tokens. If the Flutter code can provide the current record context to standalone RBT buttons, add:

```json
{
  "text": "Approved",
  "buttonColor": "green",
  "textColor": "white",
  "actions": "<2>◼APPROVED⭘<3>◼87544551624342⭘...",
  "event": "★2◼<15>⭘★3◼<13>⭘★5◼<16>⭘★6◼<18>⭘★9◼<14>⭘★10◼<20>⭘★14◼<2>⭘★15◼<22>⭘★16◼<1>⭘★17◼<23>⭘★18◼approver⭘★23◼levels",
  "chain": {...}
}
```

**Option B — Skip for now, fix later:**

If standalone RBT buttons can't access Firebase record context, defer this fix. Document it as a known gap.

---

### CONFIG-2: RequestDetail Chain Routes to Wrong Page

**Current (row 694):** After Approve/Reject, chain dialog OK button routes to `vertikaTeknoLokaciptaRequestLeave` (the REQUEST FORM page).

**Expected:** Should route back to `vertikaTeknoLokaciptaApproveLeave` (the APPROVAL LIST page).

```json
// ❌ Current
{"text": "OK", "route": "vertikaTeknoLokaciptaRequestLeave"}

// ✅ Fix
{"text": "OK", "route": "vertikaTeknoLokaciptaApproveLeave"}
```

---

### CONFIG-3: op1Script Needs +2 Columns for Level 4-5

**Current:** op1Script has 29 columns (A through AC). Level data at ★23-★27 maps to columns AA-AE in the D formula output.

**Issue:** Columns AD and AE don't exist yet. Level 4-5 data (★26-★27) will be truncated.

**Fix:** Add 2 columns to op1Script sheet (AD, AE). This is only needed if the system actually has 4+ approval levels. For 3-level systems (current), columns A-AC are sufficient (★23-★25 → AA-AC).

---

## 4. Design Gap

### DESIGN-1: `event` DSL on Standalone RBT Buttons (Row 694)

The `event` DSL resolves `<N>` tokens from the Firebase record currently being viewed/acted upon. Inside `LIST_ITEM_CARD`, the record is available because the card iterates over Firebase records.

On the RequestDetail page (row 694), the buttons are standalone `RBT` widgets. They have `actions` (updateTableRow) which implies they DO know which record to update. The same record reference should be passed to `buildEventC`.

**Question for dev:** Can standalone `RBT` buttons access the same Firebase record that `actions`/`updateTableRow` targets? If yes, add `event` property. If no, need to implement record context passing for detail page buttons.

---

## 5. Complete Position Map (FINAL — do not change)

| ★ | Source | Field | Notes |
|---|--------|-------|-------|
| ★1 | System auto | Identity block | `VID☆Name☆email☆...☆orgChain` — same as `savesend` |
| ★2 | `record["<15>"]` | Photo/Document URL | |
| ★3 | `record["<13>"]` | Jenis Cuti | |
| ★4 | — | *(empty)* | |
| ★5 | `record["<16>"]` | Tanggal Mulai (epoch ms) | |
| ★6 | `record["<18>"]` | Tanggal Selesai (epoch ms) | |
| ★7 | — | *(empty)* | |
| ★8 | — | *(empty)* | |
| ★9 | `record["<14>"]` | Keterangan | |
| ★10 | `record["<20>"]` | Jumlah Hari | |
| ★11-★13 | — | *(empty)* | |
| ★14 | `record["<2>"]` | Overall Status | **Read AFTER updateTableRow** |
| ★15 | `record["<22>"]` | Replacement VID | |
| ★16 | `record["<1>"]` | Request Number | |
| ★17 | `record["<23>"]` | Replacement Name | |
| ★18 | Current user | Approver `VID☆Name` | ONE section, `☆` separator |
| ★19-★22 | — | *(empty — reserved)* | |
| ★23 | `record["<4>"][0]` | Level 1 | `level☆status☆NAME☆VID☆ts☆epoch` |
| ★24 | `record["<4>"][1]` | Level 2 | Same format |
| ★25 | `record["<4>"][2]` | Level 3 | Same format, or empty |
| ★26 | `record["<4>"][3]` | Level 4 | Same format, or empty |
| ★27 | `record["<4>"][4]` | Level 5 | Same format, or empty |

---

## 6. Complete Implementation Code (FINAL)

```dart
/// Builds Event C data from the `event` DSL property.
/// Called AFTER updateTableRow completes.
String buildEventC({
  required String eventDSL,
  required Map<String, dynamic> record,
  required User currentUser,
  required GeoData geoData,
  required String flag,
}) {
  // 1. Initialize ★1-★27 (index 0 unused)
  final sections = List.filled(28, '');

  // 2. ★1 = identity block (auto, same as savesend)
  sections[1] = _buildIdentityBlock(currentUser);

  // 3. Parse DSL entries
  for (final entry in eventDSL.split('⭘')) {
    if (entry.isEmpty) continue;
    
    final parts = entry.split('◼');
    if (parts.length != 2) continue;

    final starIdx = int.tryParse(parts[0].replaceAll('★', ''));
    if (starIdx == null || starIdx < 2 || starIdx > 27) continue;

    final source = parts[1].trim();

    if (source == 'approver') {
      // ✅ Use ☆ separator, NOT ◆
      sections[starIdx] = '${currentUser.vid}☆${currentUser.name}';
    }
    else if (source == 'levels') {
      _expandLevels(record, sections, starIdx);
    }
    else if (source.startsWith('<') && source.endsWith('>')) {
      // Firebase field reference — try exact key, then stripped
      sections[starIdx] = _getField(record, source)?.toString() ?? '';
    }
    else {
      // Static/literal value
      sections[starIdx] = source;
    }
  }

  // 4. Build geo block
  final geoBlock = _buildGeoBlock(flag: flag, geoData: geoData);

  // 5. Assemble — CRITICAL: use .map((s) => '★$s'), NOT .join('★')
  final starData = sections.sublist(1).map((s) => '★$s').join('');
  return '$geoBlock⬤$starData';
}

/// Reads a Firebase field with fallback key formats.
dynamic _getField(Map<String, dynamic> record, String key) {
  if (record.containsKey(key)) return record[key];
  final stripped = key.replaceAll('<', '').replaceAll('>', '');
  if (record.containsKey(stripped)) return record[stripped];
  return null;
}

/// Expands the <4> approval levels array into consecutive ★ sections.
void _expandLevels(Map<String, dynamic> record, List<String> sections, int startIdx) {
  final raw = _getField(record, '<4>');
  if (raw == null) return;

  final levels = _parseApprovalArray(raw.toString());

  for (var i = 0; i < levels.length && i < 5; i++) {
    final targetIdx = startIdx + i;
    if (targetIdx >= sections.length) break;

    final level = levels[i];
    if (level.length < 6) continue;

    final status = level[1].trim();
    if (status == 'PENDING' || status.isEmpty) continue;

    // ✅ Use ☆ separator, NOT ◇
    // ✅ Swap indices 2 and 3: Firebase = [level, status, VID, name, ts, epoch]
    //    Output = level☆status☆NAME☆VID☆ts☆epoch
    sections[targetIdx] = [
      level[0].trim(),  // level number
      level[1].trim(),  // status
      level[3].trim(),  // approver NAME (index 3, swapped!)
      level[2].trim(),  // approver VID  (index 2, swapped!)
      level[4].trim(),  // timestamp formatted
      level[5].trim(),  // epoch ms
    ].join('☆');
  }
}

/// Parses the non-JSON Firebase <4> array format.
/// Input:  "[[1, APPROVED, 85924392055168, Muhamad Angga, 21 May 2026 15:26, 1779352003642], [2, PENDING, , , , ]]"
/// Output: [["1", "APPROVED", "85924392055168", "Muhamad Angga", "21 May 2026 15:26", "1779352003642"], ["2", "PENDING", "", "", "", ""]]
List<List<String>> _parseApprovalArray(String raw) {
  final str = raw.trim();
  if (!str.startsWith('[[')) return [];

  // Strip outer brackets
  final inner = str.substring(1, str.length - 1);

  // Split on "], [" patterns (with optional whitespace)
  final levelStrings = inner.split(RegExp(r'\]\s*,\s*\['));

  final result = <List<String>>[];
  for (var levelStr in levelStrings) {
    levelStr = levelStr.replaceAll('[', '').replaceAll(']', '').trim();
    
    // Split by ", " (comma-space) — each level has exactly 6 fields
    final fields = levelStr.split(', ');
    
    // Pad to 6 fields if shorter, trim each
    while (fields.length < 6) fields.add('');
    final trimmed = fields.take(6).map((f) => f.trim()).toList();
    
    result.add(trimmed);
  }

  return result;
}
```

---

## 7. Execution Flow (FINAL)

```
User taps Approve/Reject button
    │
    ▼
Step 1: Execute `actions` (updateTableRow)
    │   Updates: <2>=status, <3>=approverVID, <4>=approverName,
    │            <5>=timestamp, <6>=epoch
    │   ⚠️ MUST await completion before proceeding
    │
    ▼
Step 2: Check if `event` property exists
    │   If absent → skip to Step 5
    │
    ▼
Step 3: Read UPDATED Firebase record
    │   ⚠️ <2> must have new status (APPROVED/REJECTED)
    │   ⚠️ <4> must have updated approval levels array
    │
    ▼
Step 4: Call buildEventC(eventDSL, record, user, geo, flag)
    │   a. Build geo block (flag = "approve-leave", gpsPosition = 2)
    │   b. ★1 = identity (auto, same as savesend)
    │   c. Parse each DSL entry → fill ★ sections
    │   d. Assemble with leading ★ per section
    │   e. Save Event to ledger
    │
    ▼
Step 5: Execute `chain` (show confirmation dialog)
```

---

## 8. Expected Correct Output

### Level 2 Approves (3-level system, Level 1 already approved)

```
0approve-leave◆{ts}◆◆◆{lat}◆{lng}◆◆ID◆15345◆Banten◆Kabupaten Tangerang◆Kecamatan Cisauk◆Sampora◆◆◆true-location⬤★87544551624342☆Agenia Demo-7☆ageniademo7@gmail.com☆☆☆Product Group☆83674161979544☆Product Group◇83674161979544☆Product Group◇84214220504259☆Vertika Tekno Lokacipta★https://firebasestorage...jpg★Cuti Besar★★1779321600000★1779408000000★★★ya★2★★★★PENDING★42000000077322★REQ-2026-000159★Rika Putri Amelia Listiana★87544551624342☆Agenia Demo-7★★★★★1☆APPROVED☆Muhamad Angga☆85924392055168☆21 May 2026 15:26☆1779352003642★2☆APPROVED☆Agenia Demo-7☆87544551624342☆21 May 2026 15:43☆1779353014253★★★
```

**★ breakdown:**

```
⬤
★ 87544551624342☆Agenia Demo-7☆ageniademo7@gmail.com☆☆☆...  ★1  identity
★ https://firebasestorage...jpg                               ★2  photo
★ Cuti Besar                                                  ★3  jenis cuti
★                                                             ★4  (empty)
★ 1779321600000                                               ★5  tgl mulai
★ 1779408000000                                               ★6  tgl selesai
★                                                             ★7  (empty)
★                                                             ★8  (empty)
★ ya                                                          ★9  keterangan
★ 2                                                           ★10 jumlah hari
★                                                             ★11 (empty)
★                                                             ★12 (empty)
★                                                             ★13 (empty)
★ PENDING                                                     ★14 overall status
★ 42000000077322                                              ★15 replacement VID
★ REQ-2026-000159                                             ★16 request number
★ Rika Putri Amelia Listiana                                  ★17 replacement name
★ 87544551624342☆Agenia Demo-7                                ★18 approver VID☆Name
★                                                             ★19 (empty)
★                                                             ★20 (empty)
★                                                             ★21 (empty)
★                                                             ★22 (empty)
★ 1☆APPROVED☆Muhamad Angga☆85924392055168☆21 May 2026 15:26☆1779352003642    ★23
★ 2☆APPROVED☆Agenia Demo-7☆87544551624342☆21 May 2026 15:43☆1779353014253    ★24
★                                                             ★25 (L3 pending)
★                                                             ★26 (empty)
★                                                             ★27 (empty)
```

---

## 9. Spreadsheet Changes Required

### 9a. Row 694 (vertikaTeknoLokaciptaRequestDetail) — Add `event` & Fix Route

Both Approve and Reject buttons need:
1. Add `"event": "★2◼<15>⭘★3◼<13>⭘★5◼<16>⭘★6◼<18>⭘★9◼<14>⭘★10◼<20>⭘★14◼<2>⭘★15◼<22>⭘★16◼<1>⭘★17◼<23>⭘★18◼approver⭘★23◼levels"`
2. Change chain route: `vertikaTeknoLokaciptaRequestLeave` → `vertikaTeknoLokaciptaApproveLeave`

### 9b. op1Script — Add Columns AD, AE (if 4+ levels needed)

Current: 29 columns (A-AC). Levels 4-5 (★26-★27) need AD and AE.

---

## 10. Fix Priority & Order

| # | Bug | Fix | Impact | Effort |
|---|-----|-----|--------|--------|
| 1 | BUG-1: Off-by-one ★ shift | `.map((s) => '★$s').join('')` | ALL data lands correctly | 1 line |
| 2 | BUG-2: Approver ◆→☆ | Replace `◆` with `☆` | Approver parseable | 1 line |
| 3 | BUG-5: ★1 identity empty | Verify `buildIdentityBlock` called | Identity block present | Verify |
| 4 | BUG-3: Levels empty | Implement custom `parseApprovalArray` | Level data appears | ~30 lines |
| 5 | BUG-4: Level separator ◇→☆ | Use `.join('☆')` in expandLevels | Level data correct format | 1 line |
| 6 | EDGE-2: Record key fallback | Add `_getField()` helper | Handles key format mismatch | 5 lines |
| 7 | CONFIG-2: Detail page route | Update spreadsheet cell | Correct navigation | Spreadsheet |
| 8 | CONFIG-1: Detail page `event` | Add to spreadsheet + verify RBT support | Full audit trail | Spreadsheet + verify |

**Deploy order:** Fix 1-6 in one commit → test with row 674 (ApproveLeave list page) → verify Event C output matches Section 8 → then apply Config fixes.

---

## 11. Verification Checklist

After ALL fixes applied, verify:

- [ ] ★1 NOT empty — has identity block with `☆` separators
- [ ] ★2 = Photo URL (starts with `https://`), NOT Jenis Cuti
- [ ] ★3 = Jenis Cuti, appears ONCE only
- [ ] ★9 = Keterangan text, NOT Photo URL
- [ ] ★10 = Jumlah Hari (number)
- [ ] ★14 = Status (PENDING/APPROVED/REJECTED) — read AFTER updateTableRow
- [ ] ★15 = Replacement VID (not empty if record has `<22>`)
- [ ] ★16 = Request Number at correct position (not shifted)
- [ ] ★17 = Replacement Name (not empty if record has `<23>`)
- [ ] ★18 = `VID☆Name` — ONE section, `☆` separator, NOT `◆`
- [ ] ★19 is empty (name NOT here — merged into ★18)
- [ ] ★23-★27 level blocks use `☆` separator, NOT `◇`
- [ ] Level data is CUMULATIVE (all previous levels included)
- [ ] Level block field order: `level☆status☆NAME☆VID☆ts☆epoch` (name BEFORE vid)
- [ ] PENDING levels = empty ★ section (not written)
- [ ] Missing Firebase fields = empty string (no crash)
- [ ] Total ★ sections = exactly 27 (★1 through ★27)
- [ ] No `◆` characters appear after the `⬤` delimiter

---

## 12. Test Scenarios

### Test 1: Level 1 Approves
- `<2>` = PENDING (not final)
- `<4>[0]` = `[1, APPROVED, {vid}, {name}, {ts}, {epoch}]`
- ★14 = PENDING, ★23 = level 1 data, ★24-27 = empty

### Test 2: Level 2 Approves (cumulative)
- `<4>[0]` = Level 1 APPROVED (preserved from before)
- `<4>[1]` = Level 2 APPROVED (new)
- ★23 = Level 1 data, ★24 = Level 2 data

### Test 3: Final Level Approves
- `<2>` = APPROVED
- ★14 = APPROVED, ★23-★25 all filled

### Test 4: Level 1 Rejects
- `<2>` = REJECTED
- ★14 = REJECTED, ★23 = `1☆REJECTED☆...`

### Test 5: No `event` property
- Button has `actions` but no `event` → no Event created, no error

### Test 6: Missing Firebase fields
- `<22>` = null → ★15 = empty string, no crash

### Test 7: Empty `<4>` array
- `<4>` = null or `"[]"` → ★23-27 all empty, no crash

---

## 13. Files Changed Summary

| Area | Change |
|------|--------|
| **Button model** | Add optional `String? event` field (if not already added) |
| **Button action handler** | After `actions`, check `event`, call `buildEventC()` |
| **`buildEventC()`** | Fix off-by-one (`.map` not `.join`), fix ☆ separators |
| **`_expandLevels()`** | Fix separator ◇→☆, fix VID/Name swap (indices 2↔3) |
| **`_parseApprovalArray()`** | NEW — custom parser for non-JSON Firebase format |
| **`_getField()`** | NEW — fallback key lookup (`<4>` → `4`) |
| **Spreadsheet row 694** | Add `event` to buttons + fix chain route |
| **op1Script sheet** | Add columns AD, AE (if 4+ levels needed) |
