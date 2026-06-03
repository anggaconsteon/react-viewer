# ARCHITECTURAL BLUEPRINT: Pending Approvals Widget Set
**TASK_ID:** APPROVAL-WIDGET-20260507
**Deliverables:** `pending-approval-page.json` + `request-detail-page.json`
**Status:** Awaiting sign-off

---

## 1. SCHEMA RECONCILIATION DECISION: OPTION A2

The locked 21-column schema and the actual Firebase data diverge. After analyzing the real Firebase sample (columns 1-22), recommend **Option A2: Map JSON to actual Firebase columns AND extend with worker pre-join fields.**

**Why not pure Option A (full remap)?** The MAKER-side submission widget already writes in the current 22-column order. Reordering would break existing data and require migration. Instead, accept current layout as canonical and append new columns.

**Required spreadsheet changes BEFORE Engineer writes final JSON:**

| New Column | Content | Source |
|---|---|---|
| `<23>` | Worker name | Pre-joined from worker record at submission time |
| `<24>` | Worker role | Pre-joined from worker record at submission time |
| `<25>` | Worker city | Pre-joined from worker record at submission time |
| `<26>` | Request type key (lowercase, e.g., `cuti`) | Written by MAKER at submission time |

The MAKER-side `addToTable` must be updated to include these 4 columns. Without them, the worker card on the detail page cannot render and the typeConfig lookup has no key.

### Revised canonical column map for `vtl.request`

| `<N>` | Content | Used in JSON |
|---|---|---|
| `<1>` | Request code (`REQ-2026-000112`) | Row key, navigate param, search key |
| `<2>` | Worker VID | FK (not displayed) |
| `<3>` | Site/project name | Worker card subtitle, MetaRow "Location" |
| `<4>` | Cost center VID | List page search/conditions filter |
| `<5>` | Cost center label | -- |
| `<6>` | Cost center VID (dup) | -- |
| `<7>` | Cost center label (dup) | -- |
| `<8>` | Submitted datetime formatted | "Submitted" line, list row timeAgo |
| `<9>` | Submitted epoch | Sorting |
| `<10>` | Request title/label (`Cuti Melahirkan`) | Title line on cards |
| `<11>` | Reason text | Reason section body |
| `<12>` | Attachment image URL | Optional image |
| `<13>` | Start epoch | -- |
| `<14>` | Start datetime formatted | MetaRow "Start" |
| `<15>` | End epoch | -- |
| `<16>` | End datetime formatted | MetaRow "End" |
| `<17>` | Duration / days count | MetaRow "Duration" |
| `<18>` | Replacement worker VID | MetaRow "Replacement" (if applicable) |
| `<19>` | Status (`PENDING` / `APPROVED` / `REJECTED`) | Badge, filter, updateTableRow target |
| `<20>` | Approver VID (written on action) | updateTableRow target |
| `<21>` | Approver name or approval chain | updateTableRow target |
| `<22>` | Description text (composite) | List row subtitle line |
| `<23>` | Worker name **(NEW)** | Worker card name, list row title |
| `<24>` | Worker role **(NEW)** | Worker card subtitle |
| `<25>` | Worker city **(NEW)** | Worker card subtitle |
| `<26>` | Request type key **(NEW)** | typeConfig lookup (e.g., `cuti`) |

Comment table `vtl.request-comment` remains unchanged from locked schema.

---

## 2. PAGE 1: `pending-approval-page.json`

Single page wrapper, one APPROVAL child. Flutter fetches rows from Firebase, loops and renders per this template.

### Flat DSL Skeleton

```json
{
  "title": "Pending Approvals",
  "children": [
    {
      "type": "APPROVAL",
      "role": "APPROVER",
      "ledgerCode": "APPROVE-REQUEST-ROW",
      "vidTable": "<PLACEHOLDER_VID>",
      "table": "$<env>/<workspace>//vtl.request",
      "search": "4◼<CC_VID>⭘19◼PENDING",
      "conditions": "[[◀4▶◼<CC_VID>◁1▷◼PENDING]]",
      "toDo": "PENDING",
      "icon": "hourglass_top",
      "text": "Pending Approvals◆<23> . <10>◆<22>◆<8>",
      "typeConfig": { ... },
      "typeField": 26,
      "navigate": "navigate◼request-detail⭘request_vid◼<1>",
      "buttons": [
        {
          "text": "Reject",
          "color": "red",
          "icon": "thumb_down",
          "updateTableRow": "$<env>/<workspace>//vtl.request⭘tablevid◼<PLACEHOLDER_VID>⭘search◼1★<1>⭘<19>◼REJECTED⭘<20>◼◁1▷⭘<21>◼◁2▷",
          "chain": {
            "type": "DO_DIALOG",
            "title": "Request Rejected",
            "children": [
              { "type": "TXT", "data": "Request has been rejected." },
              { "type": "RBT", "alignment": "center", "children": [
                { "text": "OK" }
              ]}
            ]
          }
        },
        {
          "text": "Approve",
          "color": "green",
          "icon": "thumb_up",
          "updateTableRow": "$<env>/<workspace>//vtl.request⭘tablevid◼<PLACEHOLDER_VID>⭘search◼1★<1>⭘<19>◼APPROVED⭘<20>◼◁1▷⭘<21>◼◁2▷",
          "chain": {
            "type": "DO_DIALOG",
            "title": "Request Approved",
            "children": [
              { "type": "TXT", "data": "Request has been approved." },
              { "type": "RBT", "alignment": "center", "children": [
                { "text": "OK" }
              ]}
            ]
          }
        }
      ]
    }
  ]
}
```

### Text-String Compression

```
"Pending Approvals◆<23> . <10>◆<22>◆<8>"
 ───────1────────  ────2─────  ─3──  ─4─
```

| Pos | Compressed Value | UI Element |
|---|---|---|
| 1 | `Pending Approvals` | Card header title (left of count badge) |
| 2 | `<23> . <10>` | Row line 1: "Worker Name . Request Type Label" |
| 3 | `<22>` | Row line 2: description/reason summary |
| 4 | `<8>` | Row line 3: submitted timestamp (Flutter derives "2h ago") |

### Proxy Variable Map

| Token | Source | Meaning |
|---|---|---|
| `<1>` | vtl.request col 1 | Request code |
| `<4>` | vtl.request col 4 | Cost center VID |
| `<8>` | vtl.request col 8 | Submitted datetime |
| `<10>` | vtl.request col 10 | Request title/type label |
| `<19>` | vtl.request col 19 | Status |
| `<20>` | vtl.request col 20 | Approver VID (write target) |
| `<21>` | vtl.request col 21 | Approver name (write target) |
| `<22>` | vtl.request col 22 | Description |
| `<23>` | vtl.request col 23 | Worker name |
| `<26>` | vtl.request col 26 | Type key (for typeConfig) |
| `<CC_VID>` | Device proxy | Supervisor's cost center VID |
| `◁1▷` | Right payload | Supervisor VID |
| `◁2▷` | Right payload | Supervisor name |

### Button Action Payloads

**Approve `updateTableRow`:**
```
$<env>/<workspace>//vtl.request          <-- table path with // foldering
⭘ tablevid ◼ <PLACEHOLDER_VID>           <-- table registration VID
⭘ search ◼ 1 ★ <1>                       <-- find row where col 1 = request code
⭘ <19> ◼ APPROVED                        <-- set status
⭘ <20> ◼ ◁1▷                             <-- approver VID from right payload
⭘ <21> ◼ ◁2▷                             <-- approver name from right payload
```

**Reject:** Identical, only `<19> ◼ REJECTED`.

Both chain to `DO_DIALOG` with TXT confirmation + RBT "OK" dismiss. On the list page, OK has NO route (user stays on list; row disappears from PENDING-filtered view).

---

## 3. PAGE 2: `request-detail-page.json`

Page wrapper with 4 children. `request_vid` navigation param passed from list row tap.

### Flat DSL Skeleton

```json
{
  "title": "Request Detail",
  "children": [

    /* ── Child 1: Worker Card ── */
    {
      "type": "TXT",
      "role": "APPROVER",
      "variant": "workerCard",
      "table": "$<env>/<workspace>//vtl.request",
      "search": "1◼<request_vid>",
      "conditions": "[[◀1▶◼<request_vid>]]",
      "icon": "shield",
      "text": "WORKER◆<23>◆<24> . <3> . <25>",
      "avatar": "<23>"
    },

    /* ── Child 2: Request Card (display-only) ── */
    {
      "type": "APPROVAL",
      "role": "APPROVER",
      "variant": "detail",
      "ledgerCode": "APPROVE-REQUEST-DETAIL",
      "vidTable": "<PLACEHOLDER_VID>",
      "table": "$<env>/<workspace>//vtl.request",
      "search": "1◼<request_vid>",
      "conditions": "[[◀1▶◼<request_vid>]]",
      "typeConfig": {
        "izin":         { "icon": "flight",         "iconColor": "#7C3AED", "bgTint": "#EDE9FE", "label": "Leave" },
        "lembur":       { "icon": "schedule",       "iconColor": "#B45309", "bgTint": "#FEF3C7", "label": "Overtime" },
        "absen-manual": { "icon": "edit",           "iconColor": "#BE185D", "bgTint": "#FFE4E6", "label": "Manual Check-In" },
        "cuti":         { "icon": "beach_access",   "iconColor": "#0891B2", "bgTint": "#CFFAFE", "label": "Annual Leave" },
        "tukar-shift":  { "icon": "swap_horiz",     "iconColor": "#4338CA", "bgTint": "#E0E7FF", "label": "Shift Swap" },
        "sakit":        { "icon": "local_hospital", "iconColor": "#16A34A", "bgTint": "#DCFCE7", "label": "Sick" }
      },
      "typeField": 26,
      "text": "<10>◆Submitted <8>◆Date◆Start◆End◆Location◆Duration◆REASON",
      "content": "<14>◆<14>◆<16>◆<3>◆<17> days",
      "reason": "<11>",
      "status": "<19>",
      "image": "<12>"
    },

    /* ── Child 3: Conversation + Comment Input ── */
    {
      "type": "displayList",
      "role": "APPROVER",
      "ledgerCode": "REQUEST-CONVERSATION",
      "table": "$<env>/<workspace>//vtl.request-comment",
      "search": "2◼<request_vid>",
      "conditions": "[[◀2▶◼<request_vid>]]",
      "orderBy": "6 ASC",
      "text": "CONVERSATION◆Add a comment...◆Send",
      "content": "<5>◆<6>◆<7>◆<8>",
      "roleConfig": {
        "SYSTEM":     { "icon": "auto_awesome", "iconColor": "#7C3AED", "bgTint": "#EDE9FE", "tag": "System",     "tagColor": "#94A3B8", "renderMode": "chip" },
        "WORKER":     { "icon": "engineering",  "iconColor": "#2563EB", "bgTint": "#DBEAFE", "tag": "Worker",     "tagColor": "#2563EB", "renderMode": "message" },
        "SUPERVISOR": { "icon": "shield",       "iconColor": "#059669", "bgTint": "#D1FAE5", "tag": "Supervisor", "tagColor": "#059669", "renderMode": "message" }
      },
      "roleField": 3,
      "commentInput": {
        "attachIcon": "attach_file",
        "addToTable": "$<env>/<workspace>//vtl.request-comment⭘retention◼4320⭘<2>◼<request_vid>⭘<3>◼SUPERVISOR⭘<4>◼◁1▷⭘<5>◼◁2▷⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼"
      }
    },

    /* ── Child 4: Action Bar ── */
    {
      "type": "RBT",
      "role": "APPROVER",
      "alignment": "end",
      "children": [
        {
          "text": "Reject",
          "color": "red",
          "icon": "thumb_down",
          "updateTableRow": "$<env>/<workspace>//vtl.request⭘tablevid◼<PLACEHOLDER_VID>⭘search◼1★<request_vid>⭘<19>◼REJECTED⭘<20>◼◁1▷⭘<21>◼◁2▷",
          "chain": {
            "type": "DO_DIALOG",
            "title": "Request Rejected",
            "children": [
              { "type": "TXT", "data": "Request has been rejected." },
              { "type": "RBT", "alignment": "center", "children": [
                { "text": "OK", "route": "pending-approval-page" }
              ]}
            ]
          }
        },
        {
          "text": "Approve",
          "color": "green",
          "icon": "thumb_up",
          "updateTableRow": "$<env>/<workspace>//vtl.request⭘tablevid◼<PLACEHOLDER_VID>⭘search◼1★<request_vid>⭘<19>◼APPROVED⭘<20>◼◁1▷⭘<21>◼◁2▷",
          "chain": {
            "type": "DO_DIALOG",
            "title": "Request Approved",
            "children": [
              { "type": "TXT", "data": "Request has been approved." },
              { "type": "RBT", "alignment": "center", "children": [
                { "text": "OK", "route": "pending-approval-page" }
              ]}
            ]
          }
        }
      ]
    }
  ]
}
```

### Text-String Compression per Child

**Child 1 (Worker TXT):**
```
"WORKER◆<23>◆<24> . <3> . <25>"
```
| Pos | Value | UI |
|---|---|---|
| 1 | `WORKER` | Header label |
| 2 | `<23>` | Worker name (bold) |
| 3 | `<24> . <3> . <25>` | Subtitle: "Role . Site . City" |

**Child 2 (Request APPROVAL detail):**
```
text:    "<10>◆Submitted <8>◆Date◆Start◆End◆Location◆Duration◆REASON"
content: "<14>◆<14>◆<16>◆<3>◆<17> days"
```
| `text` Pos | Value | UI |
|---|---|---|
| 1 | `<10>` | Title line |
| 2 | `Submitted <8>` | Submitted timestamp line |
| 3-7 | MetaRow labels | Left column |
| 8 | `REASON` | Section sub-header |

| `content` Pos | Value | UI |
|---|---|---|
| 1 | `<14>` | Date value |
| 2 | `<14>` | Start time value |
| 3 | `<16>` | End time value |
| 4 | `<3>` | Location (site name) |
| 5 | `<17> days` | Duration value |

**Child 3 (Conversation displayList):**
```
text:    "CONVERSATION◆Add a comment...◆Send"
content: "<5>◆<6>◆<7>◆<8>"   (per-entry: name, timestamp, body, event chip)
```

### Comment Input `addToTable` Payload

```
$<env>/<workspace>//vtl.request-comment    <-- table path
⭘ retention ◼ 4320                          <-- 180 days retention
⭘ <2> ◼ <request_vid>                       <-- FK to request code
⭘ <3> ◼ SUPERVISOR                          <-- author type (hardcoded)
⭘ <4> ◼ ◁1▷                                 <-- author VID (right payload 1)
⭘ <5> ◼ ◁2▷                                 <-- author name (right payload 2)
⭘ <6> ◼ ◀1|T7|yyyy-MM-dd HH:mm:ss▶          <-- timestamp (left payload 1, TZ+7)
⭘ <7> ◼ ◀3▶                                 <-- comment body (left payload 3)
⭘ <8> ◼                                     <-- event chip (empty for free text)
```

### Detail Action Bar `updateTableRow` Payload

```
$<env>/<workspace>//vtl.request
⭘ tablevid ◼ <PLACEHOLDER_VID>
⭘ search ◼ 1 ★ <request_vid>
⭘ <19> ◼ APPROVED (or REJECTED)
⭘ <20> ◼ ◁1▷
⭘ <21> ◼ ◁2▷
```

After write, chain DO_DIALOG with OK button → `route: "pending-approval-page"`.

---

## 4. ROLE GATING STRATEGY

| Widget | APPROVER JSON | MAKER JSON |
|---|---|---|
| List: APPROVAL | Full widget with `buttons` | Same widget, `buttons` removed |
| Detail: Worker TXT | Present | Present |
| Detail: APPROVAL | Present | Present |
| Detail: displayList | Present with `commentInput` | Present, `commentInput` removed |
| Detail: RBT action bar | Present | **Entirely omitted from children** |

Spreadsheet emits two complete JSON files per page (one per role). Flutter has zero conditional logic.

---

## 5. OPEN QUESTIONS BLOCKING THE ENGINEER

| # | Question | Impact | Suggested Default |
|---|---|---|---|
| 1 | Type key column: `<10>` holds display labels (`Cuti Melahirkan`), not lowercase keys (`cuti`). Add `<26>` for lowercase key, or restructure typeConfig to use display-label keys? | typeConfig lookup breaks without matching key | Add `<26>` lowercase keys, update MAKER addToTable |
| 2 | Action timestamp: locked schema had `<21>` = action timestamp, real Firebase `<21>` = approval chain. Where to write approval timestamp? | Audit trail data integrity | Append as `<27>` |
| 3 | Worker pre-join cols `<23>`-`<25>` do not exist yet. MAKER addToTable must add. | Worker card blank without these | Prerequisite |
| 4 | `<CC_VID>` source: how does device provide supervisor's cost center VID? | List filter cannot run | Assume device proxy injects |
| 5 | `tablevid` value for `vtl.request`? | updateTableRow will fail | Engineer obtains from Firebase |
| 6 | Duplicate cost center cols `<4>`/`<5>` vs `<6>`/`<7>` -- which canonical? | Cleanliness | Use `<4>` for VID filter |
| 7 | MetaRow label set: actual data has Date/Start/End/Duration, no "Shift affected". Adjust labels? | UI accuracy | Use Date, Start, End, Location, Duration. Drop "Shift affected" |

---

## REVISION 2 (2026-05-08): Comment Input Split

User direction: separate comment list (read) from comment input (write). Comment input becomes its own `txf` variant referencing the `qrScan` pattern from `json/txf.json`.

### Schema change

`vtl.request-comment` gains column `<9>` for attachment URL.

### Detail page child count: 4 → 5

| # | Widget | Change |
|---|---|---|
| 1 | Worker card (TXT) | unchanged |
| 2 | Request card (APPROVAL detail) | unchanged |
| 3 | Conversation list (displayList) | `commentInput` block REMOVED — now read-only |
| 4 | Comment input (`txf` variant `commentBox`) | NEW widget |
| 5 | Action bar (RBT) | unchanged, pushed to last position |

### New widget: `txf` commentBox

```json
{
  "type": "txf",
  "variant": "commentBox",
  "role": "APPROVER",
  "table": "$<env>/<workspace>//vtl.request-comment",
  "text": "Add a comment...◆Send◆Attach file◆Komentar kosong",
  "icon": "attach_file",
  "label": "",
  "hint": "Add a comment...",
  "maxLength": 500,
  "size": 18,
  "position": 7,
  "buttonIcon": "send",
  "buttonLabel": "Send",
  "disabledWhenEmpty": true,
  "attachmentEnabled": true,
  "attachmentFolder": "id/<workspace>/vtl/request-comment/<request_vid>",
  "attachmentFilename": "<request_vid>-<timestamp>",
  "attachmentMax": 3,
  "addToTable": "$<env>/<workspace>//vtl.request-comment⭘retention◼4320⭘<2>◼<request_vid>⭘<3>◼SUPERVISOR⭘<4>◼◁1▷⭘<5>◼◁2▷⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼⭘<9>◼◀4▶"
}
```

### Text-string compression for commentBox

```
"Add a comment...◆Send◆Attach file◆Komentar kosong"
 ───────1───────  ─2──  ────3─────  ──────4───────
```

| Pos | Value | UI |
|---|---|---|
| 1 | `Add a comment...` | Input placeholder |
| 2 | `Send` | Send button label |
| 3 | `Attach file` | Attachment button label/tooltip |
| 4 | `Komentar kosong` | Empty-state error message |

### addToTable payload breakdown

```
$<env>/<workspace>//vtl.request-comment
⭘ retention ◼ 4320                      <-- 180 days
⭘ <2> ◼ <request_vid>                   <-- FK
⭘ <3> ◼ SUPERVISOR                      <-- author type hardcoded
⭘ <4> ◼ ◁1▷                             <-- author VID (right payload)
⭘ <5> ◼ ◁2▷                             <-- author name (right payload)
⭘ <6> ◼ ◀1|T7|yyyy-MM-dd HH:mm:ss▶      <-- timestamp formatted TZ+7
⭘ <7> ◼ ◀3▶                             <-- body text
⭘ <8> ◼                                  <-- event chip empty
⭘ <9> ◼ ◀4▶                             <-- attachment URL (NEW)
```

---

## 6. FILES REFERENCED

| File | Role |
|---|---|
| `.claude/tasks/APPROVAL-WIDGET-20260507.md` | Source requirements |
| `json/checklist-room-page.json` | Parent wrapper pattern |
| `json/rbt.json` | RBT + DO_DIALOG chain pattern |
| `json/display-list.json` | displayList type reference |
| `json/approval.json` | APPROVAL conditions/search pattern |
| `json/pending-approval-row.json` | Draft to supersede |
| `json/request-detail.json` | Draft to supersede (confirmed wrong) |
| `json/request-conversation.json` | Draft -- structure reusable |
| `json/request.json` | Monolithic original to supersede |
