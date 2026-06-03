# Web Builder Agent Workflow Design

**Date:** 2026-06-03
**Target spreadsheet:** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` (VTL Master, locale `in_ID`, arg separator `;`)
**Status:** Approved design, ready for plan

## Goal

Build a parallel set of `web-*` agents + orchestrator/pattern skills that take a UI mockup (image) and/or existing code, and produce a **Web Screen page** inside the VTL Master spreadsheet — header row + widget rows + resolver formulas — whose assembled per-user **Web JSON** output is valid. The workflow mirrors the existing mobile 4-stage pipeline (analyzer → architect → engineer → qa) so the team's mental model carries straight over, but the web JSON pattern differs significantly from mobile and is baked into web-specific agents.

The mobile sets (`widget-*`, `sheet-*`, `op1screen-page-engineer`, `define-page-from-*`) are **not touched**.

## Why this differs from the mobile widget workflow

| Aspect | Mobile (`widget-*`) | Web (this design) |
|---|---|---|
| Engineer output | writes a flat-DSL `.json` file directly | writes **rows + formulas** to live `Web Widget` / `Web Screen` tabs via gsheets MCP; JSON is **assembled by sheet formulas** |
| JSON shape | flat DSL (`◆`/`<N>`/`addToTable`) | nested envelope (`pageWrapper` → `pageData` → topbar/content/bottomBar arrays) |
| Source of truth | the file | the spreadsheet (Web JSON output is a derived cell) |
| QA target | parse the file | read back assembled `Web Screen!B{hdr}` + `Web JSON` output cells |
| Multi-user | n/a | one page definition → per-user output via `[CC_LIST]` token + RBAC |

Because the JSON is formula-assembled, the web engineer is modeled on `op1screen-page-engineer` ("write to live sheet, then verify post-write state"), **not** on `widget-engineer` ("write a file").

## Decisions locked during brainstorming

1. **Write target:** live sheet formula (engineer writes to `Web Widget` / `Web Screen` tabs; output Web JSON follows automatically). SSOT stays in the sheet.
2. **Scope:** page-centric with auto-widget. Main flow builds a Web Screen page; if a required component has no matching `Web Widget` template, the architect flags it and the engineer registers the new template first, then continues the page.
3. **Agent set:** new parallel `web-*` agents (do not generalize/overload the mobile op1Screen agents — the two JSON patterns are too different to share one agent safely).
4. **Stages:** 4 (mirror mobile): analyzer → architect → engineer → qa.

## Pipeline

Shared state carriers (mirror mobile conventions):
- Task: `.claude/tasks/[TASK_ID].md`
- Plan: `.claude/plans/[TASK_ID].md`
- Report: `.claude/reports/[TASK_ID]-walkthrough.md`

```
[web-builder-workflow]  (orchestrator skill — user invokes)
  1. web-screen-analyzer    (plan mode)
  2. web-screen-architect   (plan mode; reads sheet)
       → STOP, user approves plan
  3. web-screen-engineer    (writes sheet live)
  4. web-screen-qa          (plan mode; reads sheet) → pass | back to engineer
```

### 1. web-screen-analyzer

- **Role:** scoping / visual + code identification. Mobile analogue: `widget-project-manager`.
- **Tools:** Read (images + code), Glob, Grep, Write, Edit. **permissionMode: plan.**
- **Input:** a UI image and/or existing code (`.jsx` component, mobile JSON, HTML mock).
- **Work:**
  1. Deep-identify every UI element and categorize by render zone: **page meta** (label/icon/path/parent/title), **content** (type = `spreadsheet` | `map` | `custom`), **topbar children**, **bottomBar children** (dropdown / date / buttonSubmit / spacer), and **dynamic tokens** (`[CC_LIST]`). A content zone that is neither spreadsheet nor map is flagged `custom` — the analyzer asks the user for the raw JSON body fragment (see Content types).
  2. Invoke `web-json-pattern` (align identification to web schema) and `web-builder-interview` (grill the user one question at a time: page meta? content type? topbar widgets? RBAC parent menu? which params carry `[CC_LIST]`?).
  3. Generate `[TASK_ID]`, write the component inventory + raw requirements to the task file. Hand off to architect.
- **Rule:** identify only; never write the sheet or final JSON.

### 2. web-screen-architect

- **Role:** map inventory → concrete sheet plan. Mobile analogue: `widget-architect`.
- **Tools:** Read, Glob, Grep, `mcp__gsheets__get_sheet_data`. **permissionMode: plan.**
- **Work:**
  1. Load task file + `web-json-pattern`.
  2. Read live `Web Widget` (template library) and `Web Screen` (existing registry) tabs.
  3. Map each identified component → an existing `Web Widget` template + the param columns it needs (G–T) + page meta columns (U–AE).
  4. **GAP CHECK:** any component with no matching template? Spec a new `Web Widget` template: `Base JSON` (`[TOKEN]` placeholders), `paramList`, and the per-widget D-resolver token→column map.
  5. Compute placement: next free header row, widget row order, the page-local `A`/`E` spill ranges, and the `Web Menu 2` registration (node Level-2 + RBAC parent so the page inherits menu permissions).
  6. Write the blueprint to `.claude/plans/[TASK_ID].md`. **STOP — present for user approval.**
- **Rule:** read-only planning; never write the sheet.

### 3. web-screen-engineer

- **Role:** execute the plan against the live sheet. Mobile analogue: `op1screen-page-engineer` (not `widget-engineer`).
- **Tools:** Read, Glob, Grep, Write, Edit, `mcp__gsheets__get_sheet_data`, `mcp__gsheets__update_cells`, `mcp__gsheets__batch_update_cells`.
- **Work:**
  1. **If new widget templates were specced:** write `Web Widget` rows — col A name, col B paramList, col J Base JSON (`[TOKEN]`), col H index map, col G resolved sample — plus the per-widget D-resolver token map.
  2. **Write the Web Screen page:**
     - Header row: col A = Menu Key (exact from `Web Menu 2`), meta cols U–AE, col B page assembler (VLOOKUP `pageWrapper` + 13× SUBSTITUTE), col E page-local ARRAYFORMULA.
     - Widget rows: col A order (numeric), col B widget name, col C section (`topbar`/`content`/`bottomBar`), params in G+, col D per-row resolver (VLOOKUP col J + minimal SUBSTITUTE for that widget's own tokens only).
  3. Register the page in `Web Menu 2` as a Level-2 node.
  4. Report to `.claude/reports/[TASK_ID]-walkthrough.md`. Hand off to qa.
- **Critical gotchas the agent must encode** (from `web_builder_pattern.md` / MASTER-REFERENCE):
  - **D resolver paren tail:** plain cell-ref value = **3** trailing `)`; `IF(col="";default;col)` value = **4**. Miscount → `#ERROR!` and topbar collapses to `[]`.
  - **A/E spill alignment:** non-header A and E cells MUST be truly empty (`""`). A stray/mis-shifted formula one row off blocks the prior page's spill → `#REF!` across cols A+E.
  - **sheetName quoting:** closing literal = **4** quotes (`&AC&""""`); 5 = parse error.
  - **`[CC_LIST]` stays intact** through Web Screen (resolved once per user only in Web JSON).
  - **`[TB/BT/CONTENT_CHILDREN]` substituted last** (outermost) so tokens inside children (e.g. `[CC_LIST]`) aren't clobbered.
  - **MCP does not auto-adjust relative refs** → every per-row formula written with explicit row numbers.

### 4. web-screen-qa

- **Role:** validate assembled output. Mobile analogue: `widget-qa`.
- **Tools:** Read, Glob, Grep, `mcp__gsheets__get_sheet_data`. **permissionMode: plan.**
- **Work:** read back `Web Screen!B{header}` (assembled pageJSON) and the `Web JSON` per-user output. Checks:
  - `JSON.parse` succeeds.
  - No `#REF!` / `#ERROR!` / `#N/A` in cols A / B / D / E of the page block.
  - `content` is an array of typed objects; topbar/bottomBar children not collapsed unexpectedly.
  - `[CC_LIST]` present in Web Screen, resolved (per user) in Web JSON.
  - No double-comma; header col A key matches the `Web Menu 2` Menu Key.
- **Conclusion:** pass → approve; fail → specific corrective feedback, route back to `web-screen-engineer`.

## Content types

Content is a first-class widget row (col C = `content`, col B = the content type). Each type maps to a `Web Widget` template (`contentSpreadsheet`, `contentMap`, ...) plus a D-resolver branch. The `pageData.content` field is an **array**, so a page may carry multiple content elements (e.g. a spreadsheet + a custom chart).

Three types at launch:

| Type (col B) | Template | Author input |
|---|---|---|
| `spreadsheet` | `contentSpreadsheet` — strict tokens `[SRC]/[PERM]/[VISIBLE_SHEETS]/[SHEET_NAME]/[ROWHEADER]/[ROWSTARTDATA]` | per-column params |
| `map` | `contentMap` — strict tokens `[LAT]/[LNG]/[ZOOM]` | per-column params |
| `custom` | `contentCustom` — **single token `[BODY]`** (escape hatch for dynamic/unknown structure) | one param column = a raw JSON object fragment, injected verbatim (no quotes) |

### `custom` type — Option A (raw passthrough)

Template (`Web Widget` col J):
```
{"type":"CUSTOM","id":"mainContent","body":[BODY]}
```

Author types the raw JSON object into one Web Screen param column; the resolver injects it verbatim (`[BODY]` is an object literal, **not** wrapped in quotes). Example author input:
```
{"widget":"barChart","title":"Kehadiran Mingguan","dataUrl":"https://api/attendance/weekly","x":"day","y":"count"}
```
Assembled element:
```json
{"type":"CUSTOM","id":"mainContent","body":{"widget":"barChart","title":"Kehadiran Mingguan","dataUrl":"https://api/attendance/weekly","x":"day","y":"count"}}
```

Rationale: the web idiom forbids hand-building JSON, but a single-token template keeps the producer "dumb" — the param value just happens to be a JSON fragment. Nested objects/arrays are allowed; the author owns the fragment's correctness. The `type:"CUSTOM"` wrapper lets the frontend route it.

**Graduation path:** once a custom shape stabilizes, it is promoted to a concrete strict template (`contentChart`, `contentKanban`, ...) via the architect's auto-widget gap-check — at which point it gets its own `[TOKEN]`s and per-column validation, and stops being a raw blob.

**Agent impact:**
- **analyzer** — flag any non-spreadsheet/non-map content zone as `custom`; ask the user for the raw body fragment.
- **engineer** — for `custom`, write the `contentCustom` row with `[BODY]` injected unquoted; ensure the surrounding array comma handling stays valid.
- **qa** — validate the `[BODY]` fragment parses as JSON **and** that the enclosing `content` array / page envelope stays valid (no double-comma, no broken brackets).

## Supporting skills (3 new)

- **`web-json-pattern`** — the Web Widget + Web Screen schema, the mandatory idiom (template + VLOOKUP + chained SUBSTITUTE; forbidden: MAP/LAMBDA/LET/CHAR(34)/INDEX/MATCH/ISTEXT), the `[CC_LIST]` token semantics, and the formula gotchas above. **References** `docs/vertika-web-builder-MASTER-REFERENCE.md` as the deep source rather than duplicating it.
- **`web-builder-interview`** — relentless one-question-at-a-time grilling specialized for web pages.
- **`web-builder-workflow`** — orchestrator chaining the 4 agents (mirrors `widget-workflow`).

## Memory

Each agent gets its own `memory:` namespace (`web-screen-analyzer`, etc.). All web agents also read the existing project memory `web_builder_pattern.md` and the handoff/master-reference docs.

## Key design principle

Only the **engineer** and **qa** touch the live sheet; **analyzer** and **architect** are read-only plan-mode. This matches the `op1screen-page-engineer` "write then verify live state" model and keeps the destructive surface area small and explicit.

## Out of scope (YAGNI)

- Generalizing/parameterizing the mobile op1Screen agents for web (rejected — patterns too different).
- Local `.json` fixture export from the engineer (sheet is the SSOT; fixtures stay a manual/separate concern).
- A standalone "new Web Widget template" workflow (folded into the page flow's auto-widget gap-check).
- Theme subsystem changes (covered separately in `docs/vertika-web-theme-subsystem.md`).
