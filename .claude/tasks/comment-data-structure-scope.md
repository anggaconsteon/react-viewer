# TASK -- Comment Data Structure Scoping (request-approval index 3)

**Created:** 2026-05-11
**Task ID:** COMMENT-DATA-SCOPE-001
**Status:** SCOPING -- awaiting user approval

---

## Context

User observed Firebase `request-approval` row with compressed `c:` field. Index 3 (1-based) contains `"[]"` (empty array string). Index 4 contains `"[[1, APPROVED, , , ]]"` (nested array audit log). User asks whether index 3 should hold comment data in a nested-array string, and how to render it.

---

## Finding A: Comment Table Schema

Comments live in a **separate table**: `vtl.request-comment`

| Field | Content | Source |
|---|---|---|
| `<1>` | Comment VID | Auto-generated |
| `<2>` | Request VID (FK) | Parent row `<1>` |
| `<3>` | Author type | `SYSTEM` / `WORKER` / `SUPERVISOR` |
| `<4>` | Author VID | Session |
| `<5>` | Author name | Session |
| `<6>` | Timestamp | Device clock, formatted `yyyy-MM-dd HH:mm:ss` |
| `<7>` | Comment body text | User input |
| `<8>` | Event chip | `"Rejected"`, `"Approved"`, or empty |
| `<9>` | Attachment URL | Optional (from `◀4▶`) |

Schema confirmed from: `TASK.md` line 44-45, `addToTable` strings in `full-detail-page-approval.json` line 102, `request-conversation.json`, and `request.json`.

---

## Finding B: Index 3 of `c:` Row -- Recommendation

**Recommendation: Index 3 should remain `"[]"` (unused/vestigial). Do NOT store comment data inline.**

**Rationale:**
1. Comments already have their own dedicated table (`vtl.request-comment`) with proper FK linkage via field `<2>` = Request VID.
2. The `COMMENT_DETAIL` widget queries `vtl.request-comment` directly -- it does NOT read from the parent approval row's index 3.
3. The `txf commentBox` widget writes to `vtl.request-comment` via `addToTable` -- it does NOT update the parent row.
4. Duplicating comment data into the parent row would create sync issues (stale data) and bloat the compressed `c:` field.
5. The nested-array pattern at index 4 (`"[[1, APPROVED, , , ]]"`) serves a different purpose: it is an approval audit log (approver sequence tracking). Comments are a different entity.

If the user needs a comment count or "has comments" flag on the list page (without loading the full comment table), index 3 could optionally store a count integer (e.g., `"3"`) or remain empty. But it should NOT mirror the full comment data.

---

## Finding C: Widget JSON for Conversation Rendering

The existing `COMMENT_DETAIL` / `COMMENT_SECTION` block is **already correctly structured**. It appears in:

- `request-detail-page.json` lines 28-38 (as `COMMENT_DETAIL`)
- `full-detail-page-approval.json` lines 72-81 (as `COMMENT_SECTION`)
- `request-page-merged.json` lines 94-102 (as `COMMENT_DETAIL`)

All three use the same core pattern:
```json
{
  "type": "COMMENT_DETAIL",
  "ledgerCode": "REQUEST-CONVERSATION",
  "table": "$<env>/<workspace>//vtl.request-comment",
  "search": "2◼<no_request>",
  "text": "CONVERSATION",
  "content": "<5>◆<6>◆<7>◆<8>"
}
```

The `content` field `"<5>◆<6>◆<7>◆<8>"` maps to:
- `<5>` = Author name (e.g., "Budi")
- `<6>` = Timestamp (formatted as "Apr 25, 07:56 AM" by Flutter)
- `<7>` = Comment body text
- `<8>` = Event chip (system events like "Approved"/"Rejected")

This is sufficient to render the conversation UI shown in the mockup. Flutter reads the ledger config (`request-conversation.json`), queries `vtl.request-comment` filtered by request VID, orders by `<6>` ASC, and renders each entry using role-based styling driven by `<3>` (author type).

**One discrepancy noted:** In `request-detail-page.json` and `full-detail-page-approval.json`, the `COMMENT_DETAIL` widget points to the **parent approval table** (`vtl.trial-approval`) instead of `vtl.request-comment`. The `search` uses `"1◼<no_request>"` (searching the approval table). This may be intentional (the ledgerCode `REQUEST-CONVERSATION` tells Flutter to redirect the query to the comment table), or it may be a bug requiring the table/search to be updated to point directly at `vtl.request-comment` with `search: "2◼<no_request>"`.

**Action needed from user:** Confirm whether `COMMENT_DETAIL` with `table: vtl.trial-approval` + `ledgerCode: REQUEST-CONVERSATION` correctly redirects to the comment table via Flutter logic, or whether the table/search fields need correction.

---

## Decisions (Resolved 2026-05-11)

### Decision 1: Index 3 of `c:` row = Comment Count (integer)

User confirmed: store comment count as an integer at index 3.

**Maintenance approach: Increment-on-insert trigger.**

Rationale: A computed-on-read approach would require a sub-query (count rows in `vtl.request-comment` where `<2>` = this request VID) every time the list page renders. That is expensive for a list of N items. Instead, the `txf commentBox` `addToTable` should be extended with a **compound action** (`◆`-chained second operation) that does `updateTableRow` on the parent `vtl.trial-approval` row, incrementing field `<3>` by 1. This keeps the count denormalized but always fresh (writes are infrequent vs reads).

Implementation: The `addToTable` in the commentBox widget already chains to `vtl.request-comment`. Append a second `◆`-delimited `updateTableRow` that sets `<3>◼<3>+1` on the parent row. Flutter handles the increment semantics when it sees the `+1` suffix pattern.

### Decision 2: Fix the `table` to point at `vtl.request-comment`

**Verdict: Fix it. Change `table` and `search` in the COMMENT_DETAIL block.**

Rationale:
- The `ledgerCode` mechanism (`REQUEST-CONVERSATION`) is a **rendering hint** (tells Flutter which bubble template/roleConfig to use). It does NOT redirect the data query to a different table.
- Evidence: `request-page-merged.json` (the canonical merged file per TASK.md Q6) already correctly points `table` at `$<env>/<workspace>//vtl.request-comment`. The older `request-detail-page.json` and `full-detail-page-approval.json` are stale drafts that still reference `vtl.trial-approval` -- a copy-paste leftover from when the COMMENT_DETAIL shared the same table block as APPROVAL_DETAIL above it.
- The `search` must also change: from `"1◼<no_request>"` (field 1 in approval table = request VID) to `"2◼<no_request>"` (field 2 in comment table = request FK).

### Decision 3: Attachment as separate thumbnail in bubble (content includes `<9>`)

**Verdict: Include `<9>` in the content string. Render as clickable thumbnail below message body.**

Rationale:
- Appending to body text would produce ugly raw URLs.
- Skipping entirely wastes data the user explicitly attached.
- A 5th `◆`-delimited token (`<9>`) lets Flutter detect presence (non-empty = render thumbnail; empty = skip). The Flutter `COMMENT_DETAIL` renderer already uses index-based parsing of `content` split by `◆`. Adding a 5th position is backwards-compatible (older clients ignore extra tokens).

Final content string: `"<5>◆<6>◆<7>◆<8>◆<9>"`

---

## Sample Data

### Sample 1: Serialized `c:` row in `vtl.trial-approval`

This is what a single row looks like in Firebase under `vtl.trial-approval` (the parent request/approval table). Index 3 = comment count `2`.

```
c: ["87544551624342", "1746201600000", "izin", "2", "[[1, APPROVED, 90122033415821, Pak Darmawan, 2026-05-03 14:22:10]]", "Budi Santoso", "0w9044", "Sakit", "2026-04-25", "2026-04-25", "2026-04-25", "", "Bandung", "", "", "Saudara saya menikah di Bandung perlu hadir 1 hari", "1", "2026-04-25 07:56:00", "APPROVED", "90122033415821", "Pak Darmawan", "", "Budi Santoso", "Worker", "Site Bandung A"]
```

Index breakdown (0-based):
- `[0]` = `87544551624342` (Request VID, field `<1>`)
- `[1]` = `1746201600000` (timestamp ms)
- `[2]` = `izin` (type, field `<8>` equivalent in some schemas)
- `[3]` = `2` **<-- comment count (NEW)**
- `[4]` = `[[1, APPROVED, 90122033415821, Pak Darmawan, 2026-05-03 14:22:10]]` (approval audit log)
- ... remaining fields per schema

### Sample 2: Two rows in `vtl.request-comment`

These are the 2 comment rows matching the UI mockup. Stored as array-of-values in Firebase.

**Row A -- System auto-comment (leave request submitted):**
```json
["55801171730001", "87544551624342", "SYSTEM", "", "System", "2026-04-25 07:56:00", "Leave request submitted", "Submitted", ""]
```

Field map:
| Index | Field | Value |
|---|---|---|
| 0 | `<1>` Comment VID | `55801171730001` |
| 1 | `<2>` Request FK | `87544551624342` |
| 2 | `<3>` Author type | `SYSTEM` |
| 3 | `<4>` Author VID | (empty -- system has no VID) |
| 4 | `<5>` Author name | `System` |
| 5 | `<6>` Timestamp | `2026-04-25 07:56:00` |
| 6 | `<7>` Body | `Leave request submitted` |
| 7 | `<8>` Event chip | `Submitted` |
| 8 | `<9>` Attachment URL | (empty) |

**Row B -- Worker comment (Budi explains reason):**
```json
["55801171730002", "87544551624342", "WORKER", "0w9044", "Budi", "2026-04-25 07:56:30", "Saudara saya menikah di Bandung, perlu hadir 1 hari", "", ""]
```

Field map:
| Index | Field | Value |
|---|---|---|
| 0 | `<1>` Comment VID | `55801171730002` |
| 1 | `<2>` Request FK | `87544551624342` |
| 2 | `<3>` Author type | `WORKER` |
| 3 | `<4>` Author VID | `0w9044` |
| 4 | `<5>` Author name | `Budi` |
| 5 | `<6>` Timestamp | `2026-04-25 07:56:30` |
| 6 | `<7>` Body | `Saudara saya menikah di Bandung, perlu hadir 1 hari` |
| 7 | `<8>` Event chip | (empty) |
| 8 | `<9>` Attachment URL | (empty) |

### Sample 3: What `<5>◆<6>◆<7>◆<8>◆<9>` resolves to for each row

**Row A (System):**
```
System◆2026-04-25 07:56:00◆Leave request submitted◆Submitted◆
```
Flutter renders: chip-style bubble, purple tint, text "Leave request submitted", chip label "Submitted", no attachment.

**Row B (Worker / Budi):**
```
Budi◆2026-04-25 07:56:30◆Saudara saya menikah di Bandung, perlu hadir 1 hari◆◆
```
Flutter renders: message-style bubble, blue tint, author "Budi", body text shown, no event chip, no attachment.

---

## Corrected Widget JSON Snippet

Drop-in replacement for the `COMMENT_DETAIL` block in `request-detail-page.json` (lines 28-38):

```json
{
  "type": "COMMENT_DETAIL",
  "role": "APPROVER",
  "ledgerCode": "REQUEST-CONVERSATION",
  "vidtable": "20342033315492",
  "table": "$<env>/<workspace>//vtl.request-comment",
  "search": "2◼<no_request>",
  "conditions": "[[◀2▶◼<no_request>]]",
  "text": "CONVERSATION",
  "content": "<5>◆<6>◆<7>◆<8>◆<9>"
}
```

Changes from original:
1. `table`: `$test/request-approval//vtl.trial-approval` --> `$<env>/<workspace>//vtl.request-comment`
2. `search`: `1◼<no_request>` --> `2◼<no_request>` (field 2 = Request FK in comment table)
3. `conditions`: `[[◀1▶◼<no_request>]]` --> `[[◀2▶◼<no_request>]]` (matches search)
4. `content`: `<5>◆<6>◆<7>◆<8>` --> `<5>◆<6>◆<7>◆<8>◆<9>` (adds attachment token)

Same fix applies to `full-detail-page-approval.json` lines 72-81 (COMMENT_SECTION block -- identical changes).

---

## Alternative Storage Strategies

User is re-evaluating storage. Two alternatives below. Both use the same sample scenario: Request `REQ-2026-000135` (VID `87544551624342`) with 2 comments (System "Leave request submitted" + Budi's message).

---

### Alt A -- Inline in Parent Row (Index 3 of `c:` field)

#### Schema / Shape

Index 3 of `vtl.trial-approval` `c:` array stores a **nested-array-string** (same encoding pattern as index 4 approval audit log). Each inner array is one comment.

Format per comment entry:
```
[author_type, author_name, author_vid, timestamp, body, event_chip, attachment_url]
```

Full index 3 value (string):
```
[[SYSTEM, System, , 2026-04-25 07:56:00, Leave request submitted, Submitted, ], [WORKER, Budi, 0w9044, 2026-04-25 07:56:30, Saudara saya menikah di Bandung perlu hadir 1 hari, , ]]
```

#### Sample `c:` row (index 3 highlighted)

```
c: ["87544551624342", "1746201600000", "izin", "[[SYSTEM, System, , 2026-04-25 07:56:00, Leave request submitted, Submitted, ], [WORKER, Budi, 0w9044, 2026-04-25 07:56:30, Saudara saya menikah di Bandung perlu hadir 1 hari, , ]]", "[[1, APPROVED, 90122033415821, Pak Darmawan, 2026-05-03 14:22:10]]", ...]
```

#### Widget JSON Snippet (COMMENT_DETAIL)

```json
{
  "type": "COMMENT_DETAIL",
  "role": "APPROVER",
  "ledgerCode": "REQUEST-CONVERSATION",
  "vidtable": "20342033315492",
  "table": "$test/request-approval//vtl.trial-approval",
  "search": "1◼<no_request>",
  "conditions": "[[◀1▶◼<no_request>]]",
  "text": "CONVERSATION",
  "commentField": "3",
  "content": "<1>◆<2>◆<4>◆<5>◆<6>◆<7>"
}
```

Note: `commentField: "3"` is a **hypothetical new property** telling Flutter to parse index 3 of the parent row as a nested array of comments, then iterate using the `content` template. This does NOT exist in the DSL today -- Flutter would need a code change to support inline-array comment parsing.

The `content` maps to positions WITHIN each inner array:
- `<1>` = author_type, `<2>` = author_name, `<4>` = timestamp, `<5>` = body, `<6>` = event_chip, `<7>` = attachment

#### addToTable Mutation (commentBox)

Cannot use `addToTable` (that creates a new doc). Must use `updateTableRow` to **append** to the nested array string at index 3:

```json
"updateTableRow": "$test/request-approval//vtl.trial-approval⭘tablevid◼20342033315492⭘search◼1★<no_request>⭘<3>◼<3>+[[◁4▷, ◁2▷, ◁1▷, ◀1|T7|yyyy-MM-dd HH:mm:ss▶, ◀3▶, , ◀4▶]]"
```

**Warning:** The `<3>◼<3>+[[...]]` append syntax is **speculative**. The DSL `updateTableRow` supports field assignment (`<N>◼value`) and numeric increment (`<N>◼<N>+1`), but there is NO confirmed support for string-append or array-push to a nested-array-string. This would require Flutter engine changes.

#### Pros / Cons

**Pros:**
- Single read: parent row fetch gives you comments + approval data + request details in one Firestore read
- No extra table/collection to manage
- Simpler Firestore rules (no cross-collection queries)
- Comment count is implicit (parse array length)

**Cons:**
- **No DSL support for array-append**: `updateTableRow` cannot natively append to a nested-array-string. Requires Flutter engine modification.
- **Firestore doc size limit** (1 MB): Many comments = bloated parent row. 100 comments at ~200 bytes each = 20 KB (safe), but with attachments or long threads it could grow.
- **Write contention**: Every comment write is a full-doc update on the parent row. Concurrent approver + worker commenting = conflict risk (last-write-wins or failed writes).
- **No pagination**: All comments loaded at once. Cannot lazy-load older messages.
- **Schema rigidity**: Adding a new comment field (e.g., reactions, edit history) means changing the nested array format, which breaks all existing serialized strings.
- **Tech lead concern**: Mixing entity types (request metadata + comments + approval log) in one row violates separation of concerns. Makes querying "all comments by user X" across requests impossible without scanning every request row.
- **Flutter code change required**: The `COMMENT_DETAIL` widget has no concept of parsing a field from the parent row as a sub-array. New rendering logic needed.

---

### Alt B -- Separate Table, Doc ID = Transaction Number

#### Schema / Shape

Table: `vtl.request-comment`
Firestore path: `$<env>/<workspace>//vtl.request-comment/{REQ-2026-000135}`

**One Firestore document per request.** The doc ID IS the transaction/request number (not a random Firebase ID). The doc contains a `c:` field holding an **array of comment arrays** (the standard Consteon row-array pattern, but multiple rows packed into one doc).

```
Doc ID: REQ-2026-000135
c: [
  ["55801171730001", "REQ-2026-000135", "SYSTEM", "", "System", "2026-04-25 07:56:00", "Leave request submitted", "Submitted", ""],
  ["55801171730002", "REQ-2026-000135", "WORKER", "0w9044", "Budi", "2026-04-25 07:56:30", "Saudara saya menikah di Bandung perlu hadir 1 hari", "", ""]
]
```

Each inner array follows the same schema as the existing `vtl.request-comment` (9 fields):
| Index | Field | Value |
|---|---|---|
| 0 | `<1>` Comment VID | Auto-generated |
| 1 | `<2>` Request number | `REQ-2026-000135` |
| 2 | `<3>` Author type | `SYSTEM` / `WORKER` / `SUPERVISOR` |
| 3 | `<4>` Author VID | Session or empty |
| 4 | `<5>` Author name | Display name |
| 5 | `<6>` Timestamp | `yyyy-MM-dd HH:mm:ss` |
| 6 | `<7>` Body | Comment text |
| 7 | `<8>` Event chip | `Submitted` / `Approved` / `Rejected` / empty |
| 8 | `<9>` Attachment URL | URL or empty |

#### Sample Firestore Document

```json
{
  "path": "vtl.request-comment/REQ-2026-000135",
  "c": [
    ["55801171730001", "REQ-2026-000135", "SYSTEM", "", "System", "2026-04-25 07:56:00", "Leave request submitted", "Submitted", ""],
    ["55801171730002", "REQ-2026-000135", "WORKER", "0w9044", "Budi", "2026-04-25 07:56:30", "Saudara saya menikah di Bandung perlu hadir 1 hari", "", ""]
  ]
}
```

#### Widget JSON Snippet (COMMENT_DETAIL)

```json
{
  "type": "COMMENT_DETAIL",
  "role": "APPROVER",
  "ledgerCode": "REQUEST-CONVERSATION",
  "vidtable": "20342033315492",
  "table": "$<env>/<workspace>//vtl.request-comment",
  "search": "docId◼<no_request>",
  "text": "CONVERSATION",
  "content": "<5>◆<6>◆<7>◆<8>◆<9>"
}
```

Key change: `search` uses `docId◼<no_request>` to fetch by document ID directly instead of querying by field value. This is a **direct document lookup** (cheapest possible Firestore read).

**Note:** The `docId◼` search syntax is **hypothetical** -- the current DSL uses `search◼fieldIndex★value` for collection queries. Fetching by doc ID may require a new search operator OR a convention where the table path includes the doc ID: `$<env>/<workspace>//vtl.request-comment/<no_request>`. This depends on whether the Flutter engine supports direct doc-path resolution.

**Fallback if direct doc-ID lookup is not supported:** Keep the current `search: "2◼<no_request>"` pattern but ensure new docs are created with the request number as doc ID. Firestore still indexes by doc ID internally, so the `where field 2 == request_number` query would be fast (single result). This works with existing DSL unchanged.

#### addToTable Mutation (commentBox)

**Problem:** Standard `addToTable` creates a NEW doc with auto-generated ID. For Alt B, we need to APPEND a row to an EXISTING doc (the one named after the request number).

Two sub-options:

**B1 -- Array-append via updateTableRow (requires engine support for array-push):**
```json
"updateTableRow": "$<env>/<workspace>//vtl.request-comment⭘tablevid◼20342033315492⭘search◼docId★<no_request>⭘<c>◼arrayAppend★[◁1▷, <no_request>, SUPERVISOR, ◁1▷, ◁2▷, ◀1|T7|yyyy-MM-dd HH:mm:ss▶, ◀3▶, , ◀4▶]"
```

**B2 -- Keep `addToTable` but override doc ID (requires engine support for custom doc IDs):**
```json
"addToTable": "$<env>/<workspace>//vtl.request-comment⭘docId◼<no_request>⭘retention◼4320⭘<2>◼<no_request>⭘<3>◼SUPERVISOR⭘<4>◼◁1▷⭘<5>◼◁2▷⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼⭘<9>◼◀4▶"
```

This would use `docId◼<no_request>` to tell the engine "create-or-append to this specific doc ID." If the doc does not exist, create it. If it exists, append the new row to the `c:` array.

**Neither B1 nor B2 is confirmed to work with the current DSL/Flutter engine.** Both require engine-level changes, though B2 is arguably a smaller change (adding an optional `docId` parameter to `addToTable`).

#### Pros / Cons

**Pros:**
- Clean separation: comments are their own entity, not crammed into the parent row
- Deterministic doc ID: `REQ-2026-000135` is human-readable, debuggable, and directly addressable (no need to query by field)
- Single doc per request: one read fetches all comments (like Alt A), but without bloating the parent row
- Firestore real-time listener on one doc = live comment updates
- Comment count can still be denormalized to parent row index 3 (same as current Decision 1)
- Query "all comments for request X" is a direct doc get (fastest possible Firestore operation, 0 index cost)

**Cons:**
- **Engine changes needed**: Either `docId◼` in `addToTable` or `arrayAppend` in `updateTableRow`. Not free.
- **Write contention** (same as Alt A): All comments for one request live in one doc. Concurrent writes collide. Firestore array-union or transactions needed.
- **No pagination**: All comments in one doc = all loaded at once. Same limitation as Alt A.
- **Doc size limit**: Same 1 MB concern as Alt A (though comments-only doc is smaller than parent-row-with-everything).
- **Two reads on detail page**: One for parent request row, one for comment doc. (Current separate-table approach has the same cost, so this is neutral.)
- **Migration**: Existing comment docs (with random IDs like `1hFL5q2Kmh1zHL2aVxUq`) must be migrated to new doc-per-request structure.

---

### Alt C (Current State) -- Separate Table, One Doc Per Comment, Auto-Generated IDs

For comparison, here is what is already implemented:

```json
"addToTable": "$<env>/<workspace>//vtl.request-comment⭘retention◼4320⭘<2>◼<no_request>⭘<3>◼SUPERVISOR⭘<4>◼◁1▷⭘<5>◼◁2▷⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼⭘<9>◼◀4▶"
```

This works TODAY with zero engine changes. Each comment = one Firestore doc with auto ID. The `COMMENT_DETAIL` widget queries `vtl.request-comment` with `search: "2◼<no_request>"` and iterates results.

---

### Recommendation

**Keep Alt C (current architecture). Do not switch to Alt A or Alt B.**

Rationale:

1. **Both Alt A and Alt B require Flutter engine changes.** Alt A needs inline-array parsing in `COMMENT_DETAIL` + array-append in `updateTableRow`. Alt B needs custom doc-ID support in `addToTable` + either `docId◼` search syntax or `arrayAppend`. Neither is a JSON-only change. The whole point of the DSL is that JSON authors should not need engine modifications.

2. **Alt C already works.** The `addToTable` string at line 59 of `request-detail-page.json` correctly creates comment docs. The `COMMENT_DETAIL` widget with `search: "2◼<no_request>"` correctly queries them. The only fix needed is the table/search correction identified in Decision 2 above (pointing at `vtl.request-comment` instead of `vtl.trial-approval`).

3. **Write contention.** Alt A and Alt B both stuff multiple comments into one doc/field, creating write conflicts when multiple users comment simultaneously. Alt C (one doc per comment) has zero contention -- Firestore handles concurrent `addToTable` calls to different docs natively.

4. **Pagination.** Alt C supports Firestore cursor-based pagination on the query. Alt A and Alt B require loading the entire array and paginating client-side.

5. **The doc-ID concern is cosmetic.** Random IDs like `1hFL5q2Kmh1zHL2aVxUq` are ugly in Firebase console, but they are never shown to users. The `search: "2◼<no_request>"` query finds all comments for a request reliably. If console debugging is the concern, Firestore console has a filter/search feature.

6. **Codebase precedent.** Every `addToTable` in this codebase uses auto-generated doc IDs. `request.json` line 19 (`commentAddToTable`), `request-detail-page.json` line 59, `full-detail-page-approval.json` line 102 -- all follow the same pattern. Alt B would be the only table using custom doc IDs, creating an inconsistency.

**If user strongly prefers Alt B despite engine cost**, the smallest change would be: add an optional `docId◼<value>` parameter to `addToTable` in the Flutter engine. Each `addToTable` call creates a sub-document (row) inside the named parent doc instead of creating a new top-level doc. This preserves the existing field schema and `content` template. But this is a Flutter PR, not a JSON change.

**If user strongly prefers Alt A for "simplicity"**, acknowledge that it only feels simple on the surface. The parent row already has 25+ fields. Adding a growing nested array of comments at index 3 makes that row progressively heavier. Every approval-list-page load (which fetches all pending rows) would carry all comments for all requests -- data the list page does not even display.

**Final verdict: Alt C. Fix the table/search pointer (Decision 2) and ship it.**

---

## Status

**RESOLVED** -- Alternative storage strategies evaluated. Recommendation: keep current architecture (Alt C). Apply table/search fix from Decision 2.
