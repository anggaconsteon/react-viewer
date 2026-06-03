# APPROVAL WIDGET BLUEPRINT

**Plan:** `C:\Users\FCT\.claude\plans\modular-percolating-seal.md`
**Task:** `.claude/tasks/APPROVAL-WIDGET-20260507.md`

---

## Shared Payload Conventions

### Right Payload (button context)

| Pos | Content | Source |
|---|---|---|
| `◁1▷` | Approver/Author VID | Session |
| `◁2▷` | Approver/Author name | Session |
| `◁3▷` | Request VID (`<1>` from row) | Row context |
| `◁4▷` | Author role | Session |

### Left Payload (button context)

| Pos | Content | Source |
|---|---|---|
| `◀1▶` | Current timestamp epoch | Device clock |
| `◀2▶` | Generated UUID | Device |
| `◀3▶` | Comment input text | UI input |

---

## FILE 1: `json/pending-approval-row.json`

```json
{
  "type": "APPROVAL",
  "ledgerCode": "APPROVE-REQUEST-ROW",
  "vidTable": "<PLACEHOLDER_VID>",
  "table": "$<env>/<workspace>//vtl.request",
  "search": "7◼(Cost Center VID)⭘18◼(Status)",
  "conditions": "[[◀7▶◼<CC_VID>◁1▷◼PENDING]]",
  "toDo": "PENDING",
  "typeConfig": {
    "izin":         {"icon": "flight",         "iconColor": "#7C3AED", "bgTint": "#EDE9FE", "label": "Leave"},
    "lembur":       {"icon": "schedule",       "iconColor": "#B45309", "bgTint": "#FEF3C7", "label": "Overtime"},
    "absen-manual": {"icon": "edit",           "iconColor": "#BE185D", "bgTint": "#FFE4E6", "label": "Manual Check-In"},
    "cuti":         {"icon": "beach_access",   "iconColor": "#0891B2", "bgTint": "#CFFAFE", "label": "Annual Leave"},
    "tukar-shift":  {"icon": "swap_horiz",     "iconColor": "#4338CA", "bgTint": "#E0E7FF", "label": "Shift Swap"},
    "sakit":        {"icon": "local_hospital", "iconColor": "#16A34A", "bgTint": "#DCFCE7", "label": "Sick"}
  },
  "displayBindings": {
    "iconTile": "typeConfig[<8>]",
    "title": "<3> · typeConfig[<8>].label",
    "description": "<16>",
    "timeAgo": "derived from <17>",
    "status": "<18>",
    "rowId": "<1>"
  },
  "buttons": [
    {
      "label": "APPROVED",
      "color": "green",
      "icon": "thumb_up",
      "actions": "<18>◼APPROVED⭘<19>◼◁1▷⭘<20>◼◁2▷⭘<21>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶"
    },
    {
      "label": "REJECTED",
      "color": "red",
      "icon": "thumb_down",
      "actions": "navigate◼request-detail"
    }
  ]
}
```

**Approve trace:** `<18>=APPROVED`, `<19>=approver VID`, `<20>=approver name`, `<21>=now TZ+7`. ✓

---

## FILE 2: `json/request-detail.json`

```json
{
  "type": "APPROVAL",
  "ledgerCode": "APPROVE-REQUEST-DETAIL",
  "vidTable": "<PLACEHOLDER_VID>",
  "table": "$<env>/<workspace>//vtl.request",
  "search": "1◼(Request VID)",
  "conditions": "[[◀1▶◼<request_vid>]]",
  "typeConfig": "<same map as File 1>",
  "sections": ["worker", "request", "actionBar"],
  "workerSection": {
    "headerLabel": "WORKER",
    "headerIcon": "shield",
    "avatar": "derived from <3>",
    "name": "<3>",
    "subtitle": "<4> · <5> · <6>"
  },
  "requestSection": {
    "headerLabel": "typeConfig[<8>].label uppercased",
    "headerIcon": "typeConfig[<8>].icon",
    "topBorderColor": "typeConfig[<8>].iconColor",
    "statusBadge": "<18>",
    "title": "<9>",
    "submittedAt": "<17>",
    "metaRows": "Date: <10>\nStart time: <11>\nEnd time: <12>\nLocation: <13>\nShift affected: <15>",
    "reasonHeader": "REASON",
    "reasonBody": "<16>"
  },
  "buttons": [
    {
      "label": "APPROVED",
      "color": "green",
      "icon": "thumb_up",
      "actions": "<18>◼APPROVED⭘<19>◼◁1▷⭘<20>◼◁2▷⭘<21>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶"
    },
    {
      "label": "REJECTED",
      "color": "red",
      "icon": "thumb_down",
      "disabledWhenEmpty": true,
      "actions": "<18>◼REJECTED⭘<19>◼◁1▷⭘<20>◼◁2▷⭘<21>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶◆$<env>/<workspace>//vtl.request-comment⭘<1>◼◀2▶⭘<2>◼◁3▷⭘<3>◼SUPERVISOR⭘<4>◼◁1▷⭘<5>◼◁2▷⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼Rejected"
    }
  ]
}
```

**Reject Part A trace (vtl.request):** `<18>=REJECTED`, `<19>=approver VID`, `<20>=approver name`, `<21>=now TZ+7`. ✓
**Reject Part B trace (vtl.request-comment):** `<1>=UUID`, `<2>=request VID`, `<3>=SUPERVISOR`, `<4>=approver VID`, `<5>=approver name`, `<6>=now TZ+7`, `<7>=comment input`, `<8>=Rejected`. ✓

---

## FILE 3: `json/request-conversation.json`

```json
{
  "type": "displayList",
  "ledgerCode": "REQUEST-CONVERSATION",
  "table": "$<env>/<workspace>//vtl.request-comment",
  "search": "2◼(Request VID)",
  "conditions": "[[◀2▶◼<request_vid>]]",
  "orderBy": "6 ASC",
  "roleConfig": {
    "SYSTEM":     {"icon": "auto_awesome", "iconColor": "#7C3AED", "bgTint": "#EDE9FE", "tag": "System",     "tagColor": "#94A3B8", "renderMode": "chip"},
    "WORKER":     {"icon": "engineering",  "iconColor": "#2563EB", "bgTint": "#DBEAFE", "tag": "Worker",     "tagColor": "#2563EB", "renderMode": "message"},
    "SUPERVISOR": {"icon": "shield",       "iconColor": "#059669", "bgTint": "#D1FAE5", "tag": "Supervisor", "tagColor": "#059669", "renderMode": "message"}
  },
  "entryBindings": {
    "leftIcon": "roleConfig[<3>]",
    "authorName": "<5>",
    "tag": "roleConfig[<3>].tag / .tagColor",
    "timestamp": "<6> formatted MMM dd, hh:mm a",
    "messageBody": "<7> if renderMode=message",
    "eventChip": "<8> if renderMode=chip"
  },
  "content": "<5>◆<6>◆<7>◆<8>",
  "commentInput": {
    "placeholder": "Add a comment...",
    "attachIcon": "attach_file",
    "sendButton": {
      "label": "Send",
      "icon": "send",
      "disabledWhenEmpty": true,
      "addToTable": "$<env>/<workspace>//vtl.request-comment⭘<1>◼◀2▶⭘<2>◼◁1▷⭘<3>◼◁2▷⭘<4>◼◁3▷⭘<5>◼◁4▷⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼"
    }
  }
}
```

**Send Right Payload (different from buttons):** `◁1▷=request VID`, `◁2▷=author role`, `◁3▷=author VID`, `◁4▷=author name`.
**Send trace:** `<1>=UUID`, `<2>=request VID`, `<3>=author role`, `<4>=author VID`, `<5>=author name`, `<6>=now TZ+7`, `<7>=comment input`, `<8>=empty`. ✓

---

## Verification Matrix

**Symbol legality:** `◼ ⭘ <N> ◁N▷ ◀N▶ ★ ◆ |T7| //` — all legal. No illegal symbols, no nested arrays.
**Field index range:** vtl.request writes 18-21 (range 1-21 ✓). vtl.request-comment writes 1-8 (range 1-8 ✓).
**Status writes:** uppercase `APPROVED` / `REJECTED` ✓. `toDo: PENDING` ✓.
**Type config keys:** `izin/lembur/absen-manual/cuti/tukar-shift/sakit` (6 ✓). Keyed off `<8>` ✓.
**Role config keys:** `SYSTEM/WORKER/SUPERVISOR` (3 ✓). Keyed off `<3>` ✓.

---

## Engineer Handoff Notes

1. `<PLACEHOLDER_VID>` → real Firebase vidTable from MobileTable at deploy.
2. `$<env>/<workspace>` → e.g. `$test/agenia-demo-7` or `$prod/consteon`.
3. typeConfig duplication: Files 1 & 2 share — duplicate inline (build pipeline does not yet support shared constants).
4. `navigate◼request-detail` on row Reject — confirm route string with Flutter dev.
5. `disabledWhenEmpty: true` gates File 2 Reject + File 3 Send.
6. `orderBy: "6 ASC"` — comments oldest first.
7. Material icons used: `flight, schedule, edit, beach_access, swap_horiz, local_hospital, auto_awesome, engineering, shield, thumb_up, thumb_down, attach_file, send`.
8. `<CC_VID>` and `<request_vid>` tokens runtime-resolved by Flutter from session/nav.
