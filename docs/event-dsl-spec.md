# Spec: `event` DSL — Dynamic Event C Builder for Approval Actions

## Problem

When an approver clicks Approve/Reject, the app needs to create an Event C entry. Currently this is hardcoded in Flutter — each page type requires code changes to map Firebase fields to ★ positions. Adding a new approval page means modifying Flutter code, testing, and deploying.

## Solution

Add a new property `event` to the approval button config. This DSL string tells the app HOW to build Event C from the Firebase record being approved. The Flutter code becomes a single generic function that reads the DSL and constructs Event C dynamically.

**This follows the same pattern as `addToTable`** — spreadsheet defines the structure, app executes it.

---

## DSL Syntax

```
event◼{entry1}⭘{entry2}⭘{entry3}⭘...
```

Each entry is:

```
★{section}◼{source}
```

Where `★{section}` is the target ★ section number in Event C, and `{source}` tells the app where to read the value from.

---

## Source Types

### 1. Firebase record field: `<N>`

Read field `<N>` from the Firebase record being approved. Put the raw value at the target ★ section.

```
★2◼<15>
```
→ Read `record["<15>"]` (Photo URL), put at ★2.

### 2. Approver identity: `approver`

Put the current user's VID and Name as a `☆`-separated string at the target ★ section.

```
★18◼approver
```
→ Output: `87544551624342☆Agenia Demo-7`

### 3. Approval levels expansion: `levels`

Read the `<4>` approval levels array from the Firebase record. Expand each acted-on level into consecutive ★ sections starting from the target, one level per ★ section.

```
★23◼levels
```
→ Reads `record["<4>"]`, expands to:
- ★23 = `1☆APPROVED☆Muhamad Angga☆85924392055168☆21 May 2026 15:26☆1779352003642`
- ★24 = `2☆APPROVED☆Agenia Demo-7☆87544551624342☆21 May 2026 15:43☆1779353014253`
- ★25 = *(empty — Level 3 still PENDING)*
- ★26 = *(empty)*
- ★27 = *(empty)*

Maximum 5 levels (★N through ★N+4).

### 4. Static value: any plain text

If the source is not `<N>`, `approver`, or `levels`, treat it as a literal string.

```
★14◼APPROVED
```
→ Put literal string `APPROVED` at ★14.

---

## Fixed Sections (handled automatically, NOT in DSL)

These sections are always built by the app — do NOT include them in the `event` DSL:

| ★ Section | Content | Built by |
|-----------|---------|----------|
| ★1 | Identity block (`VID☆Name☆email☆...☆orgChain`) | System auto — same mechanism as regular savesend |
| Geo block | `0{flag}◆{timestamp}◆◆◆{lat}◆{lng}◆◆...⬤` | System auto from `gpsPosition` |

---

## Button Config Example

### approve-leave (RequestLeave approval)

```json
{
  "position": 251,
  "text": "Approve",
  "action": "savesend",
  "com": "auz",
  "flag": "approve-leave",
  "gpsPosition": 2,
  "updateTableRow": "<2>◼APPROVED⭘<3>◼{approverVID}⭘<4>◼{approverName}⭘<5>◼◀5|T7|Ddd MMM yyyy HH:mm▶⭘<6>◼◀5▶",
  "event": "★2◼<15>⭘★3◼<13>⭘★5◼<16>⭘★6◼<18>⭘★9◼<14>⭘★10◼<20>⭘★14◼<2>⭘★15◼<22>⭘★16◼<1>⭘★17◼<23>⭘★18◼approver⭘★23◼levels"
}
```

**Mapping breakdown:**

| DSL Entry | ★ | Firebase Field | Data |
|-----------|---|----------------|------|
| `★2◼<15>` | ★2 | `<15>` | Photo URL |
| `★3◼<13>` | ★3 | `<13>` | Jenis Cuti |
| `★5◼<16>` | ★5 | `<16>` | Tanggal Mulai (epoch) |
| `★6◼<18>` | ★6 | `<18>` | Tanggal Selesai (epoch) |
| `★9◼<14>` | ★9 | `<14>` | Keterangan |
| `★10◼<20>` | ★10 | `<20>` | Jumlah Hari |
| `★14◼<2>` | ★14 | `<2>` | Overall Status (read AFTER updateTableRow) |
| `★15◼<22>` | ★15 | `<22>` | Replacement VID |
| `★16◼<1>` | ★16 | `<1>` | Request Number |
| `★17◼<23>` | ★17 | `<23>` | Replacement Name |
| `★18◼approver` | ★18 | — | Approver VID☆Name |
| `★23◼levels` | ★23-★27 | `<4>` | Approval level blocks |

### approve-incident (hypothetical future page)

Different form → different positions → different DSL, **same Flutter code**:

```json
{
  "flag": "approve-incident",
  "event": "★2◼<18>⭘★3◼<17>⭘★4◼<12>⭘★5◼<13>⭘★6◼<16>⭘★7◼<15>⭘★14◼<3>⭘★16◼<2>⭘★18◼approver⭘★23◼levels"
}
```

No Flutter code change needed.

---

## Implementation

### Execution Order

```
1. User clicks Approve/Reject button
2. App executes updateTableRow → updates Firebase record
3. App reads the UPDATED Firebase record (important: <2> now has new status)
4. App parses `event` DSL
5. App builds Event C:
   a. Geo block (from gpsPosition, same as savesend)
   b. ★1 = identity block (auto from system)
   c. For each DSL entry:
      - <N>      → sections[star] = record[N]
      - approver → sections[star] = currentUser.vid + "☆" + currentUser.name
      - levels   → expand <4> array into sections[star..star+4]
      - else     → sections[star] = literal value
   d. Assemble: geoBlock + "⬤" + "★".join(sections)
6. App saves Event to ledger
```

### Flutter Implementation

```dart
/// Builds Event C data from the `event` DSL property.
/// Called AFTER updateTableRow completes so record has updated values.
///
/// [eventDSL] - the `event` property from button config
/// [record] - Firebase record (read AFTER updateTableRow)
/// [approver] - current user performing the approval
/// [geoData] - GPS data from gpsPosition
String buildEventC({
  required String eventDSL,
  required Map<String, dynamic> record,
  required User approver,
  required GeoData geoData,
  required String flag,
}) {
  // 1. Initialize 28 sections (index 0 unused, ★1-★27)
  final sections = List.filled(28, '');

  // 2. ★1 = identity block (auto)
  sections[1] = _buildIdentityBlock(approver);

  // 3. Parse and apply DSL entries
  final entries = eventDSL.split('⭘');
  for (final entry in entries) {
    final parts = entry.split('◼');
    if (parts.length != 2) continue;

    final starIdx = int.tryParse(parts[0].replaceAll('★', ''));
    if (starIdx == null) continue;

    final source = parts[1];

    if (source == 'approver') {
      // Approver VID☆Name combined
      sections[starIdx] = '${approver.vid}☆${approver.name}';

    } else if (source == 'levels') {
      // Expand <4> approval levels array
      _expandLevels(record['<4>'], sections, starIdx);

    } else if (source.startsWith('<') && source.endsWith('>')) {
      // Firebase field reference
      final fieldValue = record[source]?.toString() ?? '';
      sections[starIdx] = fieldValue;

    } else {
      // Static/literal value
      sections[starIdx] = source;
    }
  }

  // 4. Build geo block
  final geoBlock = _buildGeoBlock(flag, geoData);

  // 5. Assemble Event C
  final starData = sections.skip(1).map((s) => '★$s').join('');
  return '$geoBlock⬤$starData';
}

/// Expands the <4> approval levels array into consecutive ★ sections.
/// Each level: {level}☆{status}☆{name}☆{vid}☆{timestamp}☆{epoch}
/// Only includes levels that have been acted on (not PENDING/empty).
void _expandLevels(dynamic levelsData, List<String> sections, int startIdx) {
  if (levelsData == null) return;

  final levels = _parseApprovalLevels(levelsData); // parse string/array

  for (var i = 0; i < levels.length && i < 5; i++) {
    final level = levels[i];
    final targetIdx = startIdx + i;
    if (targetIdx >= sections.length) break;

    // Skip pending/empty levels
    if (level.status == 'PENDING' || level.status.isEmpty) continue;

    // Use ☆ separator (NOT ◇)
    sections[targetIdx] = [
      level.levelNumber,
      level.status,
      level.approverName,
      level.approverVid,
      level.timestamp,
      level.epoch,
    ].join('☆');
  }
}
```

---

## Level Block Format

Each level block at ★23+ is `☆`-delimited:

```
{level_number}☆{status}☆{approver_name}☆{approver_vid}☆{timestamp_formatted}☆{epoch_ms}
```

**Separator is `☆`, NOT `◇`.**

| Field | Example |
|-------|---------|
| level_number | `1` |
| status | `APPROVED` or `REJECTED` |
| approver_name | `Muhamad Angga` |
| approver_vid | `85924392055168` |
| timestamp_formatted | `21 May 2026 15:26` |
| epoch_ms | `1779352003642` |

**Cumulative rule:** When Level 2 approves, the Event MUST contain both Level 1 AND Level 2 data. Read from the UPDATED `<4>` array.

---

## Sections Layout Summary

```
FIXED (auto)        DYNAMIC (from DSL)       FIXED (from DSL keywords)
─────────────       ──────────────────       ─────────────────────────
★1  identity        ★2-★17  request data     ★18 approver (keyword)
    (system auto)       (★N◼<M> entries)     ★19 (empty, freed)
                                             ★20-★22 (reserved)
                                             ★23-★27 levels (keyword)
```

---

## DSL Token Reference

| Token | Role | Example |
|-------|------|---------|
| `⭘` | Entry separator | `★2◼<15>⭘★3◼<13>` |
| `◼` | Key-value separator | `★2◼<15>` |
| `★N` | Target ★ section number | `★16` = section 16 |
| `<N>` | Firebase field reference | `<1>` = Request Number |
| `approver` | Current user VID☆Name | — |
| `levels` | Expand `<4>` array (max 5) | — |
| `☆` | Sub-field separator in output | VID☆Name, level data |

---

## Spreadsheet Formula Example

The `event` DSL is defined as a cell formula in op1Screen, same pattern as `addToTable`:

```
="★2◼<15>⭘★3◼<13>⭘★5◼<16>⭘★6◼<18>⭘★9◼<14>⭘★10◼<20>⭘★14◼<2>⭘★15◼<22>⭘★16◼<1>⭘★17◼<23>⭘★18◼approver⭘★23◼levels"
```

For pages where Firebase field references are dynamic (from cell refs):

```
="★2◼<15>⭘★3◼<13>⭘★5◼<"&K674&">⭘★14◼<2>⭘★18◼approver⭘★23◼levels"
```

---

## Testing Checklist

### Unit Test Cases

- [ ] `<N>` source reads correct Firebase field
- [ ] `approver` source produces `VID☆Name` with ☆ separator
- [ ] `levels` source expands only acted-on levels (skip PENDING)
- [ ] `levels` source uses ☆ separator, not ◇
- [ ] `levels` cumulative: Level 2 event contains Level 1 + Level 2
- [ ] Static source passes literal value through unchanged
- [ ] ★1 identity block is always populated (not empty)
- [ ] `<2>` field is read AFTER updateTableRow (has updated status)
- [ ] Missing Firebase fields produce empty string, not null/crash
- [ ] Maximum 5 levels (★23-★27), 6th level ignored gracefully

### Integration Test Cases

- [ ] approve-leave with Level 1 approval → Event C has only ★23 populated
- [ ] approve-leave with Level 2 approval → Event C has ★23 + ★24 (cumulative)
- [ ] approve-leave with final Level 3 → ★14 = `APPROVED` (not `PENDING`)
- [ ] reject at Level 1 → ★14 = `REJECTED`, ★23 = `1☆REJECTED☆...`
- [ ] Event C appears in Event tab with correct flag `approve-leave`
- [ ] Geo block has valid GPS coordinates
- [ ] D formula in op1Script parses the Event C without errors

### Golden Path

1. Submit leave request (creates Firebase record)
2. Level 1 approves → Event C created with ★23 = Level 1 data, ★14 = PENDING
3. Level 2 approves → Event C created with ★23 = Level 1 + ★24 = Level 2, ★14 = PENDING
4. Level 3 approves → Event C created with ★23-★25 all filled, ★14 = APPROVED
5. Verify all 3 Events in Event tab, each with cumulative level data
