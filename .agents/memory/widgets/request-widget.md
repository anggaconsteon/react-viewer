---
widget: "Pending Approvals"
ledgerCode: "APPROVE-REQUEST"
primaryTable: "vtl.request"
commentTable: "vtl.request-comment"
lastUpdated: "2026-05-08"
---

## Schema Reference

### `vtl.request` (21 fields)
- `<1>` Request VID
- `<2>` Worker VID
- `<3>` Worker name
- `<4>` Worker role
- `<5>` Site
- `<6>` City
- `<7>` Cost Center VID
- `<8>` Request type (`izin/lembur/cuti/absen-manual/tukar-shift/sakit`)
- `<9>` Title
- `<10>` Date
- `<11>` Start time
- `<12>` End time
- `<13>` Location
- `<14>` Shift VID
- `<15>` Shift label
- `<16>` Reason
- `<17>` Submitted at
- `<18>` Status (`PENDING/APPROVED/REJECTED`)
- `<19>` Approver VID
- `<20>` Approver name
- `<21>` Action timestamp

### `vtl.request-comment` (8 fields)
- `<1>` Comment VID
- `<2>` Request VID FK
- `<3>` Author type (`SYSTEM/WORKER/SUPERVISOR`)
- `<4>` Author VID
- `<5>` Author name
- `<6>` Timestamp
- `<7>` Body
- `<8>` Event chip

---

## Architectural Rules & Decisions

### General Structure
- **Single JSON:** All widget interactions (list, detail, comment) MUST be merged into one single JSON file. Do not split widgets into multiple files (e.g., list vs detail vs conversation).
- **Visual Handling:** Flutter resolves all visuals from `<8>` (type) and `<3>` (author role) internally. DO NOT include visual configs (icon, color, typeConfig, roleConfig) in the JSON except for basic button primitives.

### Actions
- **Compound Action (Reject):** Reject MUST use `◆` to chain `updateTableRow` (updating request status) and `addToTable` (adding a rejection comment). It requires a non-empty comment.
- **Single Action (Approve):** Approve is a single one-tap `updateTableRow` action on `vtl.request`.
- **Send Comment Action:** Uses `addToTable` to `vtl.request-comment` via `commentAddToTable` field. Automatically fills request VID (`◁3▷`), author from session (`◁4▷`, `◁1▷`, `◁2▷`), and timestamp now (`◀1|T7|yyyy-MM-dd HH:mm:ss▶`).

### Payload Context Mapping
- `◁1▷`: Approver/Author VID (Session)
- `◁2▷`: Approver/Author name (Session)
- `◁3▷`: Request VID (Row Context, `<1>`)
- `◁4▷`: Author role (Session)
- `◀1▶`: Current timestamp epoch (Device clock)
- `◀2▶`: Generated UUID (Device)
- `◀3▶`: Comment input text (UI input)

---

## Bug History & Corrections

- **2026-05-07:** AI previously split this widget into 3 files (`pending-approval-row`, `request-detail`, `request-conversation`). User explicitly corrected this to merge everything into 1 single JSON file (`request.json`). **Rule adopted:** Maintain a flat structure, single ledger, single table reference inside the same document.
