# updateEventRow — Implementation Design

**Date:** 2026-06-04
**Status:** Draft for review
**Grounded in:** existing `updateTableRow` DSL (write-side targeting) + `addToEvent` parser (keyed body), both in this repo's specs/JSON fixtures.

---

## 1. Goal

Add `updateEventRow`: a **keyed sibling of `updateTableRow`**. It mutates an **existing** keyed
(char-code) Firestore document in place — sparse merge, only the listed keys.

It reuses `updateTableRow`'s targeting verbatim (`tablevid` + `search`) and swaps the body parser
from positional `<N>◼value` to `addToEvent`'s keyed `key◼value`.

**Motivating case — workforce attendance.** The `workforce` table holds per-worker-per-site state
as a keyed doc:

```
ci: -1      // check-in epoch  (-1 = not yet)
co: -1      // check-out epoch (-1 = not yet)
is: ""      // check-in string
os: ""      // check-out string
st: "off"   // status: off | on | working ...
n:  "Autsorz"
sv: 83674161979544   // site vid
vid: 58111161122230  // worker vid
```

On check-in we must set **`ci`, `is`, `st`** on this same doc; on check-out set **`co`, `os`, `st`**.
`updateTableRow` cannot address these — its body is positional (`<N>`), the doc has no positions,
only named char-code keys. `addToEvent` cannot do it either — it **appends** a new doc with
blank-prefill, it does not mutate an existing one. Hence a new primitive.

**Two writes on attendance, not one:**

| Write | Mechanism | Shape | Behavior |
|-------|-----------|-------|----------|
| Record event "Bob checked in @ T" | `addToEvent` | append NEW keyed doc | blank-prefill canonical, auto-id |
| Mutate worker current state (`ci`/`is`/`st`) | **`updateEventRow`** | merge EXISTING keyed doc | sparse, NO prefill, target selector |

`updateEventRow` is additive and independent — it does not replace the event ledger append.

---

## 2. Key facts established from existing patterns (verified in repo)

1. **`updateTableRow` DSL shape** (e.g. `json/page-detail-full.json:103`, `.claude/tasks/realestate-flow-addToTable.md:306`):
   ```
   $<env>/<workspace>//<collection>⭘tablevid◼<TABLE_VID>⭘search◼<col>★<value>⭘<N>◼<value>…
   ```
   - Header pair `tablevid` = Firebase table node id.
   - Header pair `search` = `col★value` (★ = U+2605) — find row where positional column `col` == value.
   - Body = only the columns to change. Other slots untouched → **sparse patch** (NO blank-prefill).
2. **`◆` is the multi-statement separator**, NOT an AND-join. `json/incident user.json:58` chains two
   separate `updateTableRow` statements against two tables with `◆`. Do not reuse `◆` inside `search`.
3. **Compound search already exists — on the READ side.** `"search"` field, e.g.
   `json/approval real example.json:6`: `"7◼87544551624342⭘2◼PENDING"` → col7==vid **AND** col2==PENDING.
   Read-side joins conditions with `⭘` and separates col/value with `◼`.
4. **Write-side `search` cannot reuse `⭘`** as an AND-join: in the inline action DSL, `⭘` is the
   top-level field separator, so `⭘` ends the `search` field and starts the body. All existing
   write-side `search◼col★value` examples are single-condition.
5. **Separators (exact codeUnits):** `⬤`=`separator[0]` (U+2B24), `◆`=`separator[1]` (U+25C6),
   `◼`=`separator[2]` (U+25FC), `★`=`separator[3]` (U+2605), `⭘`=`separator[8]` (U+2B58).
   `updateEventRow` adds `☆` (U+2606, **white** star — distinct from `★` black star) as the
   compound-search AND-join. If `☆` is not already a registered separator constant, add it.
   `☆` is used today only inside Event C `savesend` data strings (`{VID}☆{Name}`) — a different
   subsystem; no collision in the action-DSL context.

---

## 3. DSL grammar

```
updateEventRow :=
    $<env>/<workspace>//<collection>          ; routing prefix → collection
    ⭘ tablevid ◼ <TABLE_VID>                  ; Firebase table node id
    ⭘ search   ◼ <searchClause>               ; target selector (see 3.1)
    ( ⭘ <key> ◼ <value> )+                    ; keyed body (char-code), sparse

searchClause :=  <key> ★ <value>  ( ☆ <key> ★ <value> )*   ; AND of conditions
```

- **Body keys are char-codes** (`ci`, `co`, `is`, `os`, `st`, …), exactly like `addToEvent` — NOT
  positional `<N>`.
- **`search` keys are char-codes too** (`vid`, `sv`), not column numbers. Keyed tables have no
  positional columns. (Positional `search◼1★…` remains valid for legacy positional tables; the
  parser keys-vs-index distinction is just "is the token numeric or a name".)
- Multiple `updateEventRow` statements may still be chained with `◆`, and may interleave with
  `updateTableRow`, unchanged.

### 3.1 search clause — compound AND

```
search◼vid★58111161122230☆sv★83674161979544
```

Three nesting levels, none colliding:

| Level | Symbol | Splits |
|-------|--------|--------|
| field | `◼` (first only) | the word `search` from its payload |
| condition | `★` | `key` from `value` within one condition |
| AND | `☆` | one condition from the next |

Parse:
1. Split the field at the **first** `◼` → `search` \| payload.
2. Split payload by `☆` → list of conditions.
3. Split each condition by `★` → `(key, value)`.
4. Match the row where **all** `(key == value)` hold (AND).

**Backward compatible:** single condition `search◼vid★<vid>` has no `☆` → list of one. Legacy
`search◼1★<value>` is untouched.

---

## 4. Differences from siblings (the whole design in one table)

| Aspect | `updateTableRow` | `addToEvent` | **`updateEventRow`** |
|--------|------------------|--------------|----------------------|
| Target | existing row via `search` | none (append, auto-id) | existing doc via `search` ← **from updateTableRow** |
| Collection source | `//collection` prefix | first `⭘` body token | `//collection` prefix ← **from updateTableRow** |
| Body addressing | positional `<N>◼v` | keyed `key◼v` | keyed `key◼v` ← **from addToEvent** |
| Body parser | `parseTableInput` | `parseAddToEvent` | `parseAddToEvent` ← **from addToEvent** |
| Write op | Firestore `update`/merge | Firestore `add` | `update`/`set(merge:true)` ← **from updateTableRow** |
| Blank-prefill | none (sparse) | fills canonical `""` | **none (sparse)** — must NOT prefill |
| Compound search | single only (today) | n/a | **AND via `☆`** (new) |

The only genuinely new code is: (a) the `☆` compound-search parse, (b) search-by-key (vs index),
(c) gluing updateTableRow's header parse to addToEvent's body parse. Token resolution and write
plumbing are reused.

---

## 5. Components

### 5.1 `parseSearchClause(String payload) → List<(String key, String value)>` — new
- Split `payload` by `☆` → conditions; split each by `★` → `(key, value)`; trim.
- Return the list (AND-semantics applied by the caller).
- Single condition (no `☆`) → list of one. Empty/malformed condition → skip silently.

### 5.2 `parseUpdateEventRow(String inp) → (collection, tablevid, conditions, Map body)` — new
- Mirror `updateTableRow`'s header parse for the prefix, `tablevid`, and `search`.
- Hand the `search` payload to `parseSearchClause`.
- Hand the **body** (`⭘key◼value` pairs after the header) to the **same per-pair logic as
  `parseAddToEvent`** (split each field at first `◼` → `key`, `rawValue`; malformed → skip;
  unknown codes pass through). No `_collection` first-token here — collection comes from the prefix.

### 5.3 Token resolution for values — reuse existing primitive
- Run `resolveValueTokens(rawValue, ref)` on each body value — the SAME helper `addToEvent` and
  `parseTableInput` use: `◀N▶`→system stream, `◁N▷`→form input, `◀N|T7|fmt▶`→formatted, etc.
- Search values get the same resolution (e.g. `vid★◀3▶` resolves the signed-in user's VID).

### 5.4 `writeUpdateEventRow(String inp, ...)` — new
- `parseUpdateEventRow(inp)` → collection, tablevid, conditions, body.
- Resolve each search value + each body value via `resolveValueTokens`.
- Query `collection` where ALL conditions hold (AND).
- **Match count:**
  - exactly 1 → `doc.set(resolvedBody, SetOptions(merge: true))` (sparse — only listed keys).
  - 0 → skip + log (nothing to update; do not create).
  - >1 → **error + skip**, do not write. Worker-per-site must be unique (`vid`+`sv`); duplicates
    are corrupt data, never silently overwrite N rows.
- **Never** apply `canonicalEventCodes` blank-prefill here — that would wipe `co`/`os` on check-in.
- Multi-statement (`◆`) and offline retry behavior mirror `updateTableRow` exactly.

---

## 6. Output shape (sample)

**Check-in** (`component['updateEventRow']`, after submit-time pre-pass):
```
$<env>/<workspace>//workforce⭘tablevid◼84214220504259⭘search◼vid★58111161122230☆sv★83674161979544⭘ci◼◀2▶⭘is◼◀2|T7|HH:mm:ss▶⭘st◼on
```
Resolved write (merge into the matched doc):
```dart
doc.set({ "ci": 1780477245031, "is": "16:00:45", "st": "on" }, merge: true)
// co, os, n, sv, vid, … left exactly as they were
```

**Check-out:**
```
$<env>/<workspace>//workforce⭘tablevid◼84214220504259⭘search◼vid★58111161122230☆sv★83674161979544⭘co◼◀2▶⭘os◼◀2|T7|HH:mm:ss▶⭘st◼off
```

---

## 7. Error handling

- `parseSearchClause` / `parseUpdateEventRow` never throw — malformed conditions/pairs skipped,
  unknown codes pass through.
- 0 matches → skip + log (no create).
- >1 matches → error + skip (no partial write).
- Sparse merge only — no blank-prefill, so absent keys are never zeroed.
- Offline → stays in the history/transport queue and retries, same as `updateTableRow`.

---

## 8. Testing

| # | Case | Assert |
|---|------|--------|
| 1 | Single-key search `vid★X` | resolves 1 doc; only listed keys merged |
| 2 | Compound `vid★X☆sv★Y` | AND match; both conditions required |
| 3 | Check-in body `ci,is,st` | `co`/`os` on the doc unchanged after merge |
| 4 | Check-out body `co,os,st` | `ci`/`is` unchanged |
| 5 | 0 matches | no write, logged, no doc created |
| 6 | >1 matches | no write, error surfaced |
| 7 | Unknown code `⭘xx◼hi` | merges `xx:"hi"`, no throw |
| 8 | Search value token `vid★◀3▶` | resolves to signed-in VID before query |
| 9 | Body token `◀2|T7|HH:mm:ss▶` | parity with `parseTableInput`/`addToEvent` |
| 10 | Legacy positional `search◼1★X` | still resolves (numeric key path) |
| 11 | Multi-statement `…◆…` | each statement targets its own table |

`parseSearchClause` parity: same `(key,value)` output for `vid★X` and `vid★X☆sv★Y`.

---

## 9. Out of scope

- Creating the doc when 0 matches (use `addToEvent` for inserts).
- OR / range / negation in search (AND-only for now).
- Cross-store atomicity between the event ledger append and the state merge (independent failures
  accepted, mirror `addToEvent`).
- `canonicalEventCodes` / blank-prefill (deliberately excluded for updates).

---

## 10. Files touched

| File | Change |
|------|--------|
| Flutter `table_repository.dart` | new `parseSearchClause`, `parseUpdateEventRow`, `writeUpdateEventRow`; reuse `resolveValueTokens` |
| Flutter submit handler (`saveSend` / `checkerSaveData`) | read `component['updateEventRow']`, submit-time pre-pass, carry on the same transport as `updateTableRow` |
| Flutter sync dispatcher | route the carried `updateEventRow` to `writeUpdateEventRow` |
| separator constants | register `☆` (U+2606) if not present |
| `docs/firestore/` | short `updateEventRow` op doc (mirror existing pattern) |
| test fixtures | vectors in §8 |

> Note: the Flutter source is not in this repo (only specs/JSON fixtures are). File rows above name
> the Flutter app's modules by their role; confirm exact symbols against `addToEvent`'s landing PR,
> since `updateEventRow` reuses the same `resolveValueTokens` + transport.
