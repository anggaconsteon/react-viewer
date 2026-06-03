---
name: define-page-from-code
description: Orchestrator transforming an HTML / JSX / TSX section into a fully-written page-row block in op1Screen tab of the proxy spreadsheet. Mirrors `define-page-from-image` but starts from code, not a screenshot.
when_to_use: Use when the user points to a code file + section (id, class, line range, or JSX component) and wants it published as a new page-row block. Trigger phrases include "/define-page-from-code", "buat page dari file ini", "convert section X di file.html ke op1Screen", or any code reference paired with publish intent.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, mcp__gsheets__get_sheet_data, mcp__gsheets__update_cells, mcp__gsheets__batch_update_cells
---

# Define-Page-From-Code Orchestrator

## Overview

End-to-end: code section → analyzed widgets → composed page block → live-written to op1Screen with verified state. Sibling of `define-page-from-image`; only Step 1 differs.

**Shared state carrier:** `.claude/tasks/[TASK_ID].md`

**Target spreadsheet:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` (proxy/agenia-demo-7)
**Target tab:** `op1Screen` page registry (rows ~900+)

---

## Prerequisites

Read these BEFORE pipeline:

1. `memory/op1Screen/page-row-anatomy.md`
2. `memory/op1Screen/proxy-spreadsheet-full.md`
3. `file/addToTable guide.txt`
4. `memory/feedback_dsl_tokens.md`
5. `memory/feedback_field_ordering.md`

Confirm target spreadsheet `18v3w5YJ...`. If different, halt + ask.

---

## Pipeline

### Step 1 — Code analysis (`code-analyzer` skill)

Invoke `code-analyzer` skill. Inputs required from user:
- `file_path`
- One of: `selector` (id / class / component name) / `start_line + end_line`

Output: structured element list with roles (`TOPBAR`, `KPI_STRIP`, `FILTER_BAR`, `SECTION_HEADER`, `COLLAPSIBLE_CARD`, `LIST_ITEM_AVATAR`, `HIGHLIGHTED_CARD`, `INFO_BANNER`, `BUTTON`) + `state_refs[]` candidate-proxy list.

If user gave a screenshot instead → halt + redirect to `define-page-from-image`.

### Step 2 — Scope & Interview (`widget-project-manager` agent)

Same as image variant: confirm page suffix, provider, hideBottomBar, ledger / flag / retention (if form). Trigger `widget-interview` on ambiguity.

### Step 3 — Widget Composition (`widget-architect` agent)

Same as image variant. For each element from Step 1:
- Map to Widget tab template via `Widget!G1` master index
- Halt if widget type missing — instruct user to add it
- Assign form field positions sequential, skip display-only

**Code-specific advantage:** `state_refs[]` from Step 1 is already exact (no OCR error), so `<N>` assignment is deterministic. Architect can directly use `state_refs[i].label` as variable name.

### Step 4a — DSL string assembly (`formula-substituter` agent)

Same: build `addToTable` / `updateTableRow` / `event` DSL strings with correct `<N>`, `◀N|T7|format▶`, `◁N▷`, literals.

### Step 4b — Template substitution (`widget-placeholder-resolver` agent)

Same: fetch base from `Widget!J<n>`, substitute `[X]` tokens longest-first, validate, output `,{...}` concat-form for col E.

### Step 5 — Spreadsheet Write (`op1screen-page-engineer` agent)

Same: scan last header, compute next free row, MCP batch_update, verify no `#REF!`/`#N/A`.

### Step 6 — QA Audit (`widget-qa` agent)

Same checks + ONE extra: cross-check `state_refs` count from Step 1 against `<N>` slots actually used. Mismatch = warning (unused state_ref or undeclared proxy).

### Step 7 — Final Report

Same shape as image variant. Additionally include:
- Source file + line range
- Element-count: N elements → M widget rows

---

## Decision points

### When to halt

- File not found / range out of bounds → halt Step 1
- `role: UNKNOWN` count > 0 → halt Step 1, surface raw snippet
- Widget type missing → halt Step 3
- Provider cell `$B$120` empty → halt Step 2
- Page name suffix collision → halt Step 6

### When to use this skill vs `define-page-from-image`

| Signal | Use |
|---|---|
| User uploads image | `define-page-from-image` |
| User cites file:line or `id="..."` | `define-page-from-code` |
| User pastes raw code block in chat | `define-page-from-code` (raw_inline) |
| User has both | Prefer code (deterministic) — but skim image for layout intent |

### When to skip Step 1

If user already wrote `code-analyzer` output by hand, validate shape and proceed to Step 2.

---

## Trigger forms

| User input | Action |
|---|---|
| `file:L100-L300` + "buat page dari sini" | Full pipeline |
| `file` + `#some-id` + "/define-page-from-code" | Full pipeline |
| JSX component + "tambahkan ke op1Screen" | Full pipeline |
| Code paste + "analyze only" | Steps 1-4, halt before Step 5 |
| `@code-analyzer parse this` + scope | Run Step 1 only |

---

## Output convention

All intermediate state in `.claude/tasks/[TASK_ID].md`:

1. Source code reference (file, range, dialect)
2. `code-analyzer` output (element list + state_refs)
3. Page metadata
4. Widget composition table
5. Resolved widget JSON list
6. Spreadsheet write log
7. QA audit results
8. Final live link
