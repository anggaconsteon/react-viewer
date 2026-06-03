# BLUEPRINT — Pending Approvals Single Merged Widget JSON

**Goal:** ONE JSON file. One `ledgerCode`, one primary `table` (vtl.request) + comment table reference inside same document. Strip all visual config (icon, color, typeConfig, roleConfig) — Flutter handles visuals from `<8>` type and `<3>` author role internally.

**Base shape:** matches `json/approval.json`. Just add fields.

---

## Final Merged JSON Shape

```json
{
  "type": "APPROVAL",
  "ledgerCode": "APPROVE-REQUEST",
  "vidTable": "<PLACEHOLDER_VID>",
  "table": "$<env>/<workspace>//vtl.request",
  "search": "7◼(CC VID)⭘18◼(Status)",
  "conditions": "[[◀7▶◼<CC_VID>◁1▷◼PENDING]]",
  "toDo": "PENDING",

  "rowKey": "<1>",

  "text": "Pending Approvals◆WORKER◆<4> · <5> · <6>◆<9>◆Submitted <17>◆Date◆Start time◆End time◆Location◆Shift affected◆REASON◆CONVERSATION◆Add a comment...",

  "content": "Date: <10>\nStart time: <11>\nEnd time: <12>\nLocation: <13>\nShift affected: <15>",

  "reason": "<16>",

  "worker": "<3>◆<4> · <5> · <6>",

  "commentTable": "$<env>/<workspace>//vtl.request-comment",
  "commentSearch": "2◼(Request VID)",
  "commentConditions": "[[◀2▶◼<request_vid>]]",
  "commentOrderBy": "6 ASC",
  "comment": "<5>◆<6>◆<7>◆<8>",
  "commentAddToTable": "$<env>/<workspace>//vtl.request-comment⭘<1>◼◀2▶⭘<2>◼◁3▷⭘<3>◼◁4▷⭘<4>◼◁1▷⭘<5>◼◁2▷⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼",

  "buttons": [
    {
      "label": "APPROVED",
      "color": "green",
      "actions": "<18>◼APPROVED⭘<19>◼◁1▷⭘<20>◼◁2▷⭘<21>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶"
    },
    {
      "label": "REJECTED",
      "color": "red",
      "actions": "<18>◼REJECTED⭘<19>◼◁1▷⭘<20>◼◁2▷⭘<21>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶◆$<env>/<workspace>//vtl.request-comment⭘<1>◼◀2▶⭘<2>◼◁3▷⭘<3>◼SUPERVISOR⭘<4>◼◁1▷⭘<5>◼◁2▷⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼Rejected"
    }
  ]
}
```

---

## `text` positions (13, diamond-delimited)

| Pos | Value | Use |
|---|---|---|
| 1 | `Pending Approvals` | List card title |
| 2 | `WORKER` | Worker section header |
| 3 | `<4> · <5> · <6>` | Worker subtitle template (role · site · city) |
| 4 | `<9>` | Detail title |
| 5 | `Submitted <17>` | Submitted timestamp line |
| 6 | `Date` | Meta label |
| 7 | `Start time` | Meta label |
| 8 | `End time` | Meta label |
| 9 | `Location` | Meta label |
| 10 | `Shift affected` | Meta label |
| 11 | `REASON` | Reason header |
| 12 | `CONVERSATION` | Conversation header |
| 13 | `Add a comment...` | Comment input placeholder |

---

## Schema Reference

### `vtl.request` (21 fields)

| `<N>` | Field |
|---|---|
| `<1>` | Request VID |
| `<2>` | Worker VID |
| `<3>` | Worker name |
| `<4>` | Worker role |
| `<5>` | Site |
| `<6>` | City |
| `<7>` | Cost Center VID |
| `<8>` | Request type (`izin/lembur/cuti/absen-manual/tukar-shift/sakit`) |
| `<9>` | Title |
| `<10>` | Date |
| `<11>` | Start time |
| `<12>` | End time |
| `<13>` | Location |
| `<14>` | Shift VID |
| `<15>` | Shift label |
| `<16>` | Reason |
| `<17>` | Submitted at |
| `<18>` | Status (`PENDING/APPROVED/REJECTED`) |
| `<19>` | Approver VID |
| `<20>` | Approver name |
| `<21>` | Action timestamp |

### `vtl.request-comment` (8 fields)

| `<N>` | Field |
|---|---|
| `<1>` | Comment VID |
| `<2>` | Request VID FK |
| `<3>` | Author type (`SYSTEM/WORKER/SUPERVISOR`) |
| `<4>` | Author VID |
| `<5>` | Author name |
| `<6>` | Timestamp |
| `<7>` | Body |
| `<8>` | Event chip |

---

## Payload Conventions

### Right payload (session/row context)

| Pos | Content | Source |
|---|---|---|
| `◁1▷` | Approver/Author VID | Session |
| `◁2▷` | Approver/Author name | Session |
| `◁3▷` | Request VID (`<1>` from row) | Row context |
| `◁4▷` | Author role | Session |

### Left payload (device context)

| Pos | Content | Source |
|---|---|---|
| `◀1▶` | Current timestamp epoch | Device clock |
| `◀2▶` | Generated UUID | Device |
| `◀3▶` | Comment input text | UI input |

---

## Action String Traces

### APPROVED (single `updateTableRow` on vtl.request)

| Fragment | Field | Value |
|---|---|---|
| `<18>◼APPROVED` | 18 | literal `APPROVED` |
| `<19>◼◁1▷` | 19 | approver VID |
| `<20>◼◁2▷` | 20 | approver name |
| `<21>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶` | 21 | now TZ+7 |

### REJECTED Part A (vtl.request, before `◆`)

Same shape as APPROVED with status `REJECTED`.

### REJECTED Part B (vtl.request-comment, after `◆`)

| Fragment | Field | Value |
|---|---|---|
| `<1>◼◀2▶` | 1 | UUID |
| `<2>◼◁3▷` | 2 | request VID |
| `<3>◼SUPERVISOR` | 3 | literal `SUPERVISOR` |
| `<4>◼◁1▷` | 4 | author VID |
| `<5>◼◁2▷` | 5 | author name |
| `<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶` | 6 | now TZ+7 |
| `<7>◼◀3▶` | 7 | comment input |
| `<8>◼Rejected` | 8 | literal `Rejected` |

### `commentAddToTable` (Send button on conversation input)

| Fragment | Field | Value |
|---|---|---|
| `<1>◼◀2▶` | 1 | UUID |
| `<2>◼◁3▷` | 2 | request VID |
| `<3>◼◁4▷` | 3 | author role |
| `<4>◼◁1▷` | 4 | author VID |
| `<5>◼◁2▷` | 5 | author name |
| `<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶` | 6 | now TZ+7 |
| `<7>◼◀3▶` | 7 | comment body |
| `<8>◼` | 8 | empty (free-form comment) |

---

## What Was Stripped (Flutter handles)

| Removed | Why |
|---|---|
| `typeConfig` (icon/color/bg/label per type) | Flutter maps `<8>` → visuals internally |
| `roleConfig` (icon/color/tag per role) | Flutter maps `<3>` → bubble style internally |
| `displayBindings` / `entryBindings` / `workerSection` / `requestSection` / `sections` | Replaced by flat `text` + `content` + `reason` + `worker` + `comment` strings |
| Button `icon`, `disabledWhenEmpty` | Flutter handles button chrome + input gating |
| `navigate` action | Flutter handles row-tap navigation natively |

---

## Verification Matrix

| Check | Status |
|---|---|
| Single `ledgerCode` (`APPROVE-REQUEST`) | ✓ |
| Single primary `table` (vtl.request) | ✓ |
| Comments referenced in same document via `commentTable` | ✓ |
| No typeConfig / roleConfig / icon / color codes | ✓ |
| Button colors only `green`/`red` (matches approval.json) | ✓ |
| Symbols legal (`◼ ⭘ <N> ◁N▷ ◀N▶ ★ ◆ \|T7\| //`) | ✓ |
| `text` 13 diamond-delimited positions | ✓ |
| Reject chains 2 ops via `◆` | ✓ |
| Top-level shape matches approval.json | ✓ |
| Flat structure | ✓ |
| vtl.request writes within 1-21 | ✓ (18-21) |
| vtl.request-comment writes within 1-8 | ✓ (1-8) |

---

## Engineer Handoff Notes

1. `<PLACEHOLDER_VID>` — real Firebase vidTable from MobileTable at deploy.
2. `$<env>/<workspace>` — replace per env (e.g. `$test/agenia-demo-7` or `$prod/consteon`).
3. `text` has exactly 13 `◆`-delimited positions. Flutter splits on `◆` and indexes.
4. `<8>` carries Indonesian type strings (`izin/lembur/cuti/absen-manual/tukar-shift/sakit`). Flutter maps to icons/colors internally — JSON does not carry mapping.
5. `<3>` (comment author type) carries `SYSTEM/WORKER/SUPERVISOR`. Flutter maps to bubble style internally.
6. REJECTED `actions` chains two table ops with `◆` as op-delimiter. Flutter splits and executes both.
7. `commentOrderBy: "6 ASC"` — comments oldest-first by timestamp `<6>`.
8. New file path: `C:\Users\FCT\Documents\Development\consteon\widget-claude\json\request.json` (NEW — do not overwrite `approval.json`).

---

## Next Steps

1. Engineer writes `json/request.json` per this blueprint.
2. QA audits the file.
3. Update `TASK.md` status to `done`.
