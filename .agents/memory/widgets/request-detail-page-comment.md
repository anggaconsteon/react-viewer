---
widget: "Request Detail Page — Conversation/Comment"
ledgerCode: "REQUEST-CONVERSATION"
parentTable: "vtl.trial-approval"
commentStorage: "sub-collection"
commentPath: "vtl.trial-approval/<no_request>/comment"
sessionDate: "2026-05-11"
lastUpdated: "2026-05-11"
---

## Decision Summary

Comments untuk Request Detail Page disimpan sebagai **Firestore sub-collection** di dalam parent approval doc, BUKAN top-level table `vtl.request-comment` (yang dipakai widget Pending Approvals).

### Storage Path
```
$test/request-approval/vtl.trial-approval/<no_request>/comment/{auto-id}
```

Tiap comment = 1 dokumen terpisah dalam sub-collection. Pakai `c:` array pattern standar (BUKAN keyed fields).

### Comment Schema (`c:` array, 6 fields)
- `<1>` Comment VID (auto-gen)
- `<2>` Author VID (session)
- `<3>` Author name (session)
- `<4>` Timestamp string (`dd MMM yyyy : HH:mm`)
- `<5>` Comment body text
- `<6>` Attachment URL

**Tidak ada** field author type (SYSTEM/WORKER/SUPERVISOR). User explicit minta hilangkan SUPERVISOR — tag role di UI diabaikan per requirement.

**Tidak ada** field rating (`r: 7.4` di Firebase = dummy, skip).

---

## Final Widget JSON (`json/request-detail-page.json`)

### COMMENT_DETAIL (read sub-collection)
```json
{
  "type": "COMMENT_DETAIL",
  "ledgerCode": "REQUEST-CONVERSATION",
  "vidtable": "20342033315492",
  "table": "$test/request-approval//vtl.trial-approval/<no_request>/comment",
  "text": "CONVERSATION"
}
```
Minimal — no `search`/`conditions`/`content`/`role`. Sub-collection scoped via path. Rendering detail delegated ke ledger spec / Flutter dev.

### txf commentBox (write sub-collection)
```
addToTable: $<env>/<workspace>//vtl.trial-approval/<no_request>/comment⭘retention◼4320⭘<2>◼◁1▷⭘<3>◼◁2▷⭘<4>◼◀1|T7|dd MMM yyyy : HH:mm▶⭘<5>◼◀3▶⭘<6>◼◀4▶
```

Mapping:
- `<2>◼◁1▷` Author VID dari session
- `<3>◼◁2▷` Author name dari session
- `<4>◼◀1|T7|...▶` Timestamp formatted
- `<5>◼◀3▶` Comment body dari text input
- `<6>◼◀4▶` Attachment URL

Read path (COMMENT_DETAIL) + write path (addToTable) HARUS point ke path sama.

---

## Architectural Rules (Session-specific)

### Sub-collection vs Top-level Table
Widget ini **deviate** dari `request-widget.md` pattern. Pending Approvals widget pakai top-level `vtl.request-comment`. Request Detail Page pakai sub-collection di bawah parent.

**Reason:** Sub-collection bikin doc ID Firebase grouping per-transaction (lebih clean debugging di console). 1 doc per comment tetap (bukan array dalam 1 doc) → no write contention, support pagination.

### Page JSON vs Ledger Spec — clarification
- **Page JSON** (`request-detail-page.json`) = runtime config Flutter consume.
- **Ledger JSON** (`request-conversation.json`) = **design spec / dokumentasi**, BUKAN runtime config. Flutter hardcode rendering logic per `ledgerCode` magic string.

User gak perlu serve 2 file. Cuma page JSON yang dipakai runtime.

### Proxy Tokens
- `<no_request>` literal di JSON & spreadsheet. Flutter resolve runtime dari route context.
- `<env>`, `<workspace>` resolved runtime juga.
- `◁N▷` = session field (1=VID, 2=name).
- `◀N▶` = input/output proxy (1=timestamp, 3=text input value, 4=attachment URL).

### Data Shape Discussion
Earlier rejected alternatives:
1. **Inline di parent row index 3** — needs engine PR (array append), write contention, bloat.
2. **Sub-collection with keyed fields** (`a`, `c`, `n`, `r`, `t`, `ts`, `v`) — needs engine PR untuk `<keyname>◼value` syntax.
3. **Doc ID = transaction number** — needs engine PR untuk custom docId.

Pilihan final = sub-collection + `c:` array pattern, zero engine PR.

---

## Related Files Touched This Session
- `json/request-detail-page.json` — COMMENT_DETAIL minimal config, addToTable rewritten to sub-collection + `c:` array shape
- `.claude/tasks/comment-data-structure-scope.md` — full scoping doc with Alt A/B/C/D analysis

---

## Open Items (untuk dev/tech lead)
1. Konfirmasi Flutter engine support nested sub-collection path di `table` (`vtl.trial-approval/<no_request>/comment`).
2. Konfirmasi `addToTable` bisa write ke sub-collection path (bukan cuma top-level collection).
3. Mapping author type (SYSTEM/WORKER) di rendering — hilang dari schema baru. Apakah Flutter perlu inference dari VID, atau memang abaikan tag sesuai user requirement?
4. Ledger spec `request-conversation.json` perlu update kalau dipakai dev sebagai referensi (content template ganti `<3>◆<4>◆<5>◆<6>`).
