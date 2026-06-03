# TASK — Pending Approvals Widget

**Created:** 2026-05-07
**Status:** DONE — QA PASS 10/10
**Output file (target):** `json/request.json` (new file, do not overwrite `approval.json`)

---

## Scope

Single merged widget JSON modeling:
- List card "Pending Approvals" header + repeating row
- Detail screen (Worker + IZIN request + Conversation + comment input + bottom action bar)
- All actions (Approve / Reject compound / Send comment)

ONE `ledgerCode` (`APPROVE-REQUEST`). ONE primary `table` (`vtl.request`). Comment table referenced inside same document via `commentTable`.

---

## Decisions Log

### Q1 — Data source per type
**Q:** Which request types? Single shared table or per-type tables?
**A:** Single-card template only — Flutter iterates Firebase rows. JSON does NOT carry full data set. Spreadsheet → JSON for config only.

### Q2 — Action button placement
**Q:** Where do Approve/Reject fire — list, detail, both?
**A:** **Option C** — both. Same `updateTableRow` payload. Comment input independent of approve.

### Q3 — Type marker / visual mapping
**Q:** How does frontend pick icon/color/label per type?
**A:** No hardcode in Flutter except base primitives. ALL config from spreadsheet → JSON. *(Note: superseded by Q6 below — visual config moved back to Flutter.)*

### Q4 — Detail composition
**Q:** Detail = one JSON or many?
**A:** Initially Option C hybrid (2 JSONs). *(Note: superseded by Q6 below — collapsed into ONE JSON.)*

### Q5 — Schema
**A:** Locked.

`vtl.request` (21 fields):
`<1>` Req VID · `<2>` Worker VID · `<3>` Worker name · `<4>` Role · `<5>` Site · `<6>` City · `<7>` CC VID · `<8>` Type · `<9>` Title · `<10>` Date · `<11>` Start · `<12>` End · `<13>` Location · `<14>` Shift VID · `<15>` Shift label · `<16>` Reason · `<17>` Submitted at · `<18>` Status · `<19>` Approver VID · `<20>` Approver name · `<21>` Action timestamp

`vtl.request-comment` (8 fields):
`<1>` Comment VID · `<2>` Req VID FK · `<3>` Author type · `<4>` Author VID · `<5>` Author name · `<6>` Timestamp · `<7>` Body · `<8>` Event chip

Status enum: `PENDING/APPROVED/REJECTED` (uppercase).
Type enum: `izin/lembur/cuti/absen-manual/tukar-shift/sakit` (lowercase Indonesian).
Role enum: `SYSTEM/WORKER/SUPERVISOR` (uppercase).

### Q6 — Course correction (2026-05-07)
**User directive:** Merge into ONE JSON. Single ledger + table even for comments. Strip visual config (icon/color/typeConfig/roleConfig) — Flutter handles. Use `approval.json` as base shape. New file (don't overwrite). Keep blueprint + task tracker in project root, not `.claude/tasks/`.

**Resolution:**
- Old 3-file plan (`pending-approval-row.json` + `request-detail.json` + `request-conversation.json`) DEPRECATED.
- New single-file output → `json/request.json`.
- All visual config removed. Only DSL action strings + plain text labels + field bindings.
- Flutter resolves visuals from `<8>` (type) and `<3>` (author role) internally.
- Reject still uses `◆` to chain `updateTableRow` + `addToTable comment` (compound action).

### Reject reason gating
**A:** Reject requires non-empty comment. Compound action chained with `◆`. Approve one-tap. Flutter gates Reject button on input.

### Header card scope
**A:** Flutter chrome — title + count badge native. "Pending Approvals" appears as text position 1 in `text` only.

### Conversation entry template
**A:** Single template. Author type `<3>` drives bubble style — Flutter handles mapping (no roleConfig in JSON).

### Send comment action
**A:** `addToTable` to `vtl.request-comment` via `commentAddToTable` field. Auto-fill request VID, author from session, timestamp now.

---

## Pipeline Status

| Step | Agent | Status |
|---|---|---|
| 1. Visual analysis + interview | widget-project-manager | DONE |
| 2. Schema lock | (interview) | DONE |
| 3. Blueprint v1 (3 files) | widget-architect | DEPRECATED |
| 4. Engineer v1 (3 files) | widget-engineer | DEPRECATED — files written to `json/` but superseded |
| 5. QA v1 (3 files) | widget-qa | DEPRECATED |
| 6. Course correction → merge | user | DONE 2026-05-07 |
| 7. Blueprint v2 (1 file) | widget-architect | DONE → `BLUEPRINT.md` |
| 8. Engineer v2 (1 file) | widget-engineer | DONE → `json/request.json` |
| 9. QA v2 (1 file) | widget-qa | DONE — PASS 10/10 |
| 10. Memory Migration | widget-architect | DONE → `.agents/memory/widgets/request-widget.md` |

---

## Files

**Project root (this folder):**
- `BLUEPRINT.md` — merged JSON blueprint v2
- `TASK.md` — this file (decision log + status)

**Output target:**
- `json/request.json` — new file, single merged widget JSON (engineer step)

**Memory System (Local Brain):**
- `.agents/memory/widgets/request-widget.md` — dedicated architectural memory, schema rules, and bug history for this widget.

**Deprecated v1 files (still on disk, no longer canonical):**
- `json/pending-approval-row.json`
- `json/request-detail.json`
- `json/request-conversation.json`

**Reference (do not modify):**
- `json/approval.json` — base DSL shape
- `json/clockin.json` — addToTable / updateTableRow patterns
- `json/display-list.json` — displayList ordering pattern
