---
name: define-page-from-image
description: Orchestrator for transforming a UI screenshot into a fully-written page-row block in op1Screen tab of the proxy spreadsheet. Chains vision analysis, page composition, formula/token resolution, MCP write, and post-write QA. Triggered by image input + intent to publish a new page.
when_to_use: Use when the user uploads a screenshot of a mobile/web page and wants it auto-added to op1Screen as a new page-row block (header + widgets + buffer). Trigger phrases include "/define-page-from-image", "buat page dari gambar", "tambahkan page ini ke op1Screen", or any image upload paired with publish intent.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, mcp__gsheets__get_sheet_data, mcp__gsheets__update_cells, mcp__gsheets__batch_update_cells
---

# Define-Page-From-Image Orchestrator

## Overview

End-to-end pipeline: screenshot → analyzed widgets → composed page block → live-written to op1Screen with verified state. Bridges visual design and spreadsheet-as-CMS persistence.

**Shared state carrier:** `.claude/tasks/[TASK_ID].md`

**Target spreadsheet:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` (proxy/agenia-demo-7)
**Target tab:** `op1Screen` page registry (rows ~900+)

---

## Prerequisites

Read these files BEFORE running pipeline:

1. `memory/op1Screen/page-row-anatomy.md` — page-block schema, formulas, append algorithm
2. `memory/op1Screen/proxy-spreadsheet-full.md` — spreadsheet architecture context
3. `file/addToTable guide.txt` — addToTable DSL notation
4. `memory/feedback_dsl_tokens.md` — token semantics
5. `memory/feedback_field_ordering.md` — payload slot ordering

Confirm target spreadsheet `18v3w5YJ...` is the intended write target. If user mentions a different spreadsheet, halt and ask.

---

## Pipeline Execution

### Step 1 — Vision Analysis (`vision-analyzer` skill)

Invoke `vision-analyzer` skill on the screenshot. Extract:

- All UI elements (header, separator, text, form fields, buttons, lists, cards)
- Field labels, hints, placeholder content
- Button labels, colors, actions
- Visual hierarchy and ordering top-to-bottom
- Implicit page type (form / detail / list / approval)

Output: structured element list with bounding-box order.

### Step 2 — Scope & Interview (`widget-project-manager` agent)

Invoke `widget-project-manager` agent to:

- Confirm page name suffix with user (e.g. `LogIncidentDetail`)
- Confirm provider context (default = `$B$120` content of target sheet)
- Confirm `hideBottomBar` flag (default = true)
- Identify ledger code, flag, retention if form/submit page
- Trigger `widget-interview` skill if any required field is ambiguous

Output: scoped page metadata.

### Step 3 — Widget Composition (`widget-architect` agent)

Invoke `widget-architect` agent. For each visual element from Step 1:

- Map to Widget tab template (lookup name in Widget!G1 master index)
- If widget type doesn't exist → halt, instruct user to define it in Widget tab first
- Assign form field positions (sequential 1-based, skip display-only widgets)
- Plan `<N>` payload indexes for any addToTable / event DSL
- Document positions and tokens in task file

Output: ordered widget composition plan with placeholder slots identified.

### Step 4a — DSL string assembly (`formula-substituter` agent)

Invoke `formula-substituter` agent first. Job = build the VALUES that will fill placeholders:

- Assemble `addToTable` / `updateTableRow` strings with correct `<N>` indexes, `◀N|T7|format▶`, `◁N▷`, literals, tablevid, retention, flag
- Build `event` DSL strings for approval buttons
- Resolve simple-known placeholders (`[TABLE]`, `[VIDTABLE]`, `[LEDGERCODE]`, `[FLAG]`, `[VARIANT]`)
- Map screenshot field positions to `◁N▷` tokens

Output: a named-map of placeholder values per widget. Does NOT substitute into template — just produces the strings.

### Step 4b — Template substitution (`widget-placeholder-resolver` agent)

Invoke `widget-placeholder-resolver` agent. Job = take Step 4a's value-map + Widget tab base template, do the actual substitution:

- Fetch base template from `Widget!J<n>` (G1 master index → row number)
- Regex-discover every `[X]` token in template
- Substitute longest-name first to avoid partial matches (e.g. `[TEXT1]` before `[TEXT]`)
- Validate no `[X]` remains, output parses as valid JSON
- Build `,{...}` concat-form for col E

Output: list of resolved widget records (`name`, `jsonResolved`, `jsonForConcat`, `displayed`, `params[]`).

**Why split:** `formula-substituter` is DSL-aware (knows addToTable semantics). `widget-placeholder-resolver` is generic (just does string substitution). Step 4a's complex strings become Step 4b's input values.

### Step 5 — Spreadsheet Write (`op1screen-page-engineer` agent)

Invoke `op1screen-page-engineer` agent. Pass resolved widget list + page suffix.

Agent will:

- Scan `op1Screen` for last header row
- Compute next free row (last widget + 3, skipping 2 buffer slots)
- Assemble page-name formula + title JSON formula
- MCP `batch_update_cells` for atomic write of header + widget rows
- Re-read range and verify no `#REF!`/`#N/A`/`#NAME?`/`#ERROR!`/`#VALUE!`

Output: row numbers used, post-write verification report.

### Step 6 — QA Audit (`widget-qa` agent)

Invoke `widget-qa` agent on the just-written page block. Verify:

- All widget JSON conforms to flat DSL pattern (no illegal arrays, correct `◆` usage)
- Page name unique across op1Screen (no collision)
- All `<N>` payload slots sequential
- addToTable references valid Firebase table names
- `event` DSL well-formed for approval buttons
- Page name suffix matches Indonesian camelCase convention (`<providerCamel><PageNoun>`)

Output: pass/fail per check + remediation list if needed.

### Step 7 — Final Report

Summarize to user:

```
Page written
  Name: <providerName><Suffix>
  Row: header @ {R}, widgets @ {R+1}..{R+N}, buffer @ {R+N+1}, {R+N+2}
  Widget count: N
  Form positions: {p1=label, p2=label, ...}
  Table writes: <list of addToTable target tables>
  Open spreadsheet: https://docs.google.com/spreadsheets/d/18v3w5YJ.../edit#gid=296861564&range=A{R}
```

---

## Decision points

### When to halt

- Required widget type missing from Widget tab → halt at Step 3
- Provider cell `$B$120` empty → halt at Step 2
- Page name suffix collides with existing page → halt at Step 6 (rerun with new suffix)
- Vision analysis ambiguous on >2 widgets → halt at Step 1 (clarify with user)

### When to extend Widget tab first

If vision detects a UI element not matching any existing Widget tab entry:

1. Pause pipeline
2. Spawn `widget-engineer` agent to add new Widget tab row (with base template + `[PLACEHOLDER]` tokens)
3. Resume pipeline at Step 3

### When to skip Step 1 (vision)

If user provides pre-analyzed widget plan as input (no image), skip Step 1. Validate plan structure and proceed to Step 2.

---

## Trigger forms

| User input | Action |
|------------|--------|
| Screenshot + "buat page dari gambar ini" | Full pipeline |
| Screenshot + "/define-page-from-image" | Full pipeline |
| Screenshot + "tambahkan ke op1Screen" | Full pipeline |
| "@op1screen-page-engineer write this" + widget list | Skip to Step 5 |
| "@formula-substituter resolve this" + plan | Run Step 4a only (DSL strings) |
| "@widget-placeholder-resolver substitute this" + widget name + values | Run Step 4b only (template substitution) |
| Screenshot + "analyze only, don't write" | Steps 1–4, halt before Step 5 |

---

## Output convention

All intermediate state in `.claude/tasks/[TASK_ID].md` with sections:

1. Source image reference
2. Vision analysis output
3. Page metadata (suffix, provider, hideBottomBar, ledger, flag)
4. Widget composition table
5. Resolved widget JSON list
6. Spreadsheet write log (rows used, formulas placed)
7. QA audit results
8. Final live link to written range
