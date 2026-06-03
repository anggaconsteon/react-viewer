# Web Builder Agent Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a parallel `web-*` agent set (analyzer → architect → engineer → qa) plus three supporting skills that turn a UI mockup/code into a formula-assembled Web Screen page in the VTL Master spreadsheet.

**Architecture:** Four agents mirror the mobile 4-stage pipeline; analyzer + architect are read-only plan-mode, engineer + qa touch the live sheet via gsheets MCP. Three skills back them: `web-json-pattern` (schema + idiom + gotchas), `web-builder-interview` (one-at-a-time grilling), `web-builder-workflow` (orchestrator). Shared state lives in `.claude/tasks|plans|reports/[TASK_ID]`.

**Tech Stack:** Claude Code agent (`.claude/agents/*.md`) and skill (`.claude/skills/*/SKILL.md`) markdown definitions with YAML frontmatter; gsheets MCP tools; target spreadsheet `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` (locale `in_ID`, arg separator `;`).

**Source of truth:** spec `docs/superpowers/specs/2026-06-03-web-builder-agent-workflow-design.md`; deep reference `docs/vertika-web-builder-MASTER-REFERENCE.md`; memory `web_builder_pattern.md`.

**Verification note:** there is no test framework for markdown config. Each task's "verify" = confirm the file exists, the YAML frontmatter is well-formed, and every `skills:`/agent reference it names already exists on disk (Glob). The end-to-end behavior is validated by a dry-run in the final task.

---

## Task 1: `web-json-pattern` skill

**Files:**
- Create: `.claude/skills/web-json-pattern/SKILL.md`

- [ ] **Step 1: Write the skill file**

````markdown
---
name: web-json-pattern
description: Web Widget + Web Screen sheet schema, the template+VLOOKUP+SUBSTITUTE idiom, [CC_LIST] token, content types, per-widget D-resolver maps, and the critical formula gotchas for building VTL web pages.
when_to_use: Use whenever building, planning, or auditing a Web Screen page or Web Widget template in the VTL Master spreadsheet.
---

# Web JSON Pattern (VTL Web Builder)

**Spreadsheet:** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` — locale `in_ID`, formula arg separator `;`.
**Deep reference (read for full formulas):** `docs/vertika-web-builder-MASTER-REFERENCE.md`. **Memory index:** `web_builder_pattern.md`.

## Idiom (MANDATORY)

Pattern: a template string with `[TOKEN]` placeholders lives in a tab; a producer cell does `VLOOKUP` to fetch it, then chained `SUBSTITUTE` to fill each token. Producer cells stay "dumb" — no manual `&"..."&` string building.

- **Forbidden:** `MAP`, `LAMBDA`, `LET`, `CHAR(34)`, `INDEX`, `MATCH`, `ISTEXT`.
- **Allowed:** `VLOOKUP`, `FILTER`, `COUNTIF`, `TEXTJOIN`, `SUBSTITUTE`, `IFERROR`, `IF`, `OR`, `ISNUMBER`, `ARRAYFORMULA`.
- **MCP caveat:** `update_cells`/`batch_update_cells` do NOT auto-adjust relative refs. Every per-row formula is written with explicit row numbers (no copy-down).

## `Web Widget` tab (template library)

| Col | Content |
|---|---|
| A | `Widget name` — VLOOKUP key |
| B | `paramList` — CSV of token names (human-readable; not consumed) |
| G | `JSON` — resolved sample (leave `[CC_LIST]` intact) |
| H | index map `◆<name>▶Web Widget!J<row>` (H1 = full ◆-join) |
| J | `Base JSON` — the `[TOKEN]` template VLOOKUP reads (column index **10**) |

Templates: `pageWrapper`(J6), `contentSpreadsheet`(J7), `contentMap`(J8), `contentCustom`, `dropdown`, `date`, `spacer`, `buttonSubmit`.

`pageWrapper` (J6):
```
{"label":"[LABEL]","icon":"[ICON]","path":"[PATH]","key":"[KEY]","urlSheet":"[URL_SHEET]","parent":"[PARENT]","pageData":{"title":"[TITLE]","description":"[DESCRIPTION]","topbar":{"alignment":"[TB_ALIGN]","children":[[TB_CHILDREN]]},"content":[[CONTENT]],"bottomBar":{"alignment":"[BT_ALIGN]","children":[[BT_CHILDREN]]}}}
```

## `Web Screen` tab (page = 1 header row + N widget rows)

- Header row: col A = Menu Key (non-numeric, exact from `Web Menu 2`). Col B = page assembler (`VLOOKUP "pageWrapper" Web Widget!$A:$J;10` + 13× SUBSTITUTE). Col E = page-local ARRAYFORMULA. Meta cols U–AE (label/icon/path/parent/urlSheet/description/.../TB_ALIGN/BT_ALIGN).
- Widget rows: col A = order (numeric), col B = widget name, col C = section (`topbar`/`content`/`bottomBar`), col D = per-row resolver, params in G–T. Col E = `","&D`.
- Content is a **first-class widget row** (C=`content`, B=content type); `pageData.content` is an **array** (multiple content elements allowed).

## Content types

| Type (col B) | Template | D-resolver token → column |
|---|---|---|
| `spreadsheet` | `contentSpreadsheet` | `[SRC]`→G, `[PERM]`→H, `[VISIBLE_SHEETS]`→K, `[SHEET_NAME]`→L, `[ROWHEADER]`→`IF(I="";1;I)`, `[ROWSTARTDATA]`→`IF(J="";2;J)` |
| `map` | `contentMap` | `[LAT]`→Y, `[LNG]`→Z, `[ZOOM]`→AA |
| `custom` | `contentCustom` | `[BODY]`→G (raw JSON object, injected **unquoted**) |

`contentCustom` template (J col):
```
{"type":"CUSTOM","id":"mainContent","body":[BODY]}
```
Author pastes a raw JSON object fragment into col G; resolver injects verbatim. Nested objects/arrays allowed; author owns correctness. Graduation: when a custom shape stabilizes, promote it to a concrete strict template (`contentChart`, ...) with its own tokens.

## Per-widget D-resolver token → column

- **dropdown** (6): `[KEY]`→G, `[CELL]`→H, `[PLACEHOLDER]`→I, `[OPTIONS]`→J, `[EMPTY_TEXT]`→K, `[VARIANT]`→L
- **date** (4): `[KEY]`→G, `[CELL]`→H, `[PLACEHOLDER]`→I, `[VARIANT]`→L
- **buttonSubmit** (8): `[ICON]`→O, `[TEXT]`→M, `[DATA]`→N, `[API_URL]`→Q, `[TARGET]`→P, `[SUCCESS]`→R, `[THEN]`→T, `[ERROR]`→S
- **spacer** (0): VLOOKUP only, no SUBSTITUTE

D resolver guard (every widget row): `=IF(NOT(ISNUMBER(A{r}));"";IF(B{r}="";"";<VLOOKUP + SUBSTITUTE chain>))` with `VLOOKUP(B{r};'Web Widget'!$A:$J;10;FALSE)`.

## `[CC_LIST]` token

Author writes `[CC_LIST]` in a Web Screen param (e.g. dropdown `[OPTIONS]` = `Semua◆[CC_LIST]`). It MUST stay intact through Web Screen; it is resolved once per user only in `Web JSON`. In any assembler, substitute `[CHILDREN]`/`[TB/BT/CONTENT_CHILDREN]` BEFORE `[CC_LIST]`.

## CRITICAL gotchas

- **D resolver paren tail:** plain cell-ref value → **3** trailing `)` (`L{r})))`); `IF(col="";default;col)` value → **4** (`J{r}))))`). Miscount → `#ERROR!` and the section collapses to `[]`.
- **A/E spill alignment:** non-header A and E cells MUST be truly empty (`""`). A stray/mis-shifted header formula one row off blocks the prior page's spill → `#REF!` across cols A+E (and B header). Fix by rewriting only cols A & E per header at the correct row.
- **sheetName quoting:** closing literal = **4** quotes (`&AC{h}&""""`); 5 quotes = `#ERROR! parse`.
- **Children substituted last:** `[TB_CHILDREN]`/`[CONTENT]`/`[BT_CHILDREN]` are the outermost SUBSTITUTE so tokens inside children (`[CC_LIST]`) survive.
- **B assembler children fragments** use `IFERROR(MID(TEXTJOIN("";TRUE;FILTER($E$<h+1>:$E$<last>;$C$<h+1>:$C$<last>="topbar"));2;50000);"")` — page-local bounded range, IFERROR-wrapped (FILTER throws on zero match).
````

- [ ] **Step 2: Verify the file**

Run (Glob): `.claude/skills/web-json-pattern/SKILL.md`
Expected: file listed. Frontmatter has `name: web-json-pattern`. No `[PLACEHOLDER]` left as literal TODO.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/web-json-pattern/SKILL.md
git commit -m "feat(web-agents): add web-json-pattern skill"
```

---

## Task 2: `web-builder-interview` skill

**Files:**
- Create: `.claude/skills/web-builder-interview/SKILL.md`

- [ ] **Step 1: Write the skill file**

````markdown
---
name: web-builder-interview
description: Relentlessly interview the user about a web page mockup/code one question at a time — page meta, content type(s), topbar/bottomBar widgets, RBAC parent, and dynamic tokens — until the Web Screen scope is fully clear.
when_to_use: Use at the start of a Web Screen build, before architecting, to remove ambiguity about page structure and data.
---

# Web Builder Interview

Ask ONE question at a time. Do not batch. Prefer multiple-choice. Continue until every item below is unambiguous, then summarize back for confirmation.

## Required coverage

1. **Page meta** — label, icon, path, parent menu (must match a `Web Menu 2` node), page title, urlSheet/src.
2. **Content zone(s)** — for each: type `spreadsheet` | `map` | `custom`?
   - spreadsheet → src, permission (`C◆U◆D`), visibleSheets, sheetName, rowHeader, rowStartData.
   - map → lat, lng, zoom.
   - custom → the raw JSON object body fragment (and confirm it is valid JSON).
   - Is there more than one content element (content is an array)?
3. **topbar** — which widgets (dropdown/date/buttonSubmit/spacer), in what order, alignment? Per widget, its params.
4. **bottomBar** — same questions, or none.
5. **Dynamic tokens** — which params carry `[CC_LIST]` (per-user cost-center list)? Any other per-user value?
6. **RBAC** — which Level-1 menu group gates this page (the parent's permission)?

## Rules

- If the user supplied an image, restate what you see and ask the user to confirm/correct before drilling into params.
- If a needed widget type does not exist in `Web Widget`, note it explicitly (the architect's gap-check will handle it) and ask for its intended JSON shape.
- Never invent params. If unknown, ask.
````

- [ ] **Step 2: Verify the file**

Run (Glob): `.claude/skills/web-builder-interview/SKILL.md`
Expected: file listed; frontmatter `name: web-builder-interview`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/web-builder-interview/SKILL.md
git commit -m "feat(web-agents): add web-builder-interview skill"
```

---

## Task 3: `web-screen-analyzer` agent

**Files:**
- Create: `.claude/agents/web-screen-analyzer.md`
- Depends on: Task 1, Task 2 (named in frontmatter `skills:`)

- [ ] **Step 1: Write the agent file**

````markdown
---
name: web-screen-analyzer
description: Identifies UI elements from a web page mockup/code, categorizes them by render zone (page meta / content / topbar / bottomBar), runs the interview, and writes the scope to the task file. Web analogue of widget-project-manager.
skills: web-json-pattern, web-builder-interview
memory: web-screen-analyzer
tools: Read, Glob, Grep, Write, Edit
model: claude-opus-4-6
permissionMode: plan
color: cyan
---

## Role

You are the Principal scoping lead for VTL **web** pages. Given a UI image and/or existing code, you deconstruct it into the Web Screen model before any sheet work happens.

## Workflow

### 1. Deep identification
1. If given an image, perform deep visual analysis; if given code (`.jsx`/JSON/HTML), read it.
2. Categorize every element by render zone: **page meta** (label/icon/path/parent/title), **content** (type `spreadsheet` | `map` | `custom`), **topbar children**, **bottomBar children** (dropdown/date/buttonSubmit/spacer), and **dynamic tokens** (`[CC_LIST]`).
3. A content zone that is neither spreadsheet nor map → flag `custom`; capture the raw JSON body the user wants.

### 2. Align + interview
1. Invoke `web-json-pattern` to map your breakdown to the strict web schema.
2. Invoke `web-builder-interview` to grill the user ONE question at a time until scope is unambiguous.
3. Generate a unique `[TASK_ID]`.

### 3. Task creation
1. Create `.claude/tasks/[TASK_ID].md`.
2. Write the component inventory (per zone), the raw params, flagged-missing widgets, and `[CC_LIST]` locations.
3. Hand off to `web-screen-architect`.

## Rules
1. Prove you understood the input (restate it) before routing onward.
2. Identify only. Never write the sheet or the final JSON.
````

- [ ] **Step 2: Verify the file + references**

Run (Glob): `.claude/agents/web-screen-analyzer.md`, `.claude/skills/web-json-pattern/SKILL.md`, `.claude/skills/web-builder-interview/SKILL.md`
Expected: all three exist (the two skills named in `skills:` must already be on disk from Tasks 1–2).

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/web-screen-analyzer.md
git commit -m "feat(web-agents): add web-screen-analyzer agent"
```

---

## Task 4: `web-screen-architect` agent

**Files:**
- Create: `.claude/agents/web-screen-architect.md`
- Depends on: Task 1

- [ ] **Step 1: Write the agent file**

````markdown
---
name: web-screen-architect
description: Maps the analyzer's inventory to concrete Web Widget templates + param/meta columns, runs the auto-widget gap-check, computes sheet placement (next free row, A/E spill ranges, Web Menu 2 registration), and writes the plan. Web analogue of widget-architect.
skills: web-json-pattern
memory: web-screen-architect
tools: Read, Glob, Grep, mcp__gsheets__get_sheet_data
model: claude-opus-4-6
permissionMode: plan
color: magenta
---

## Role

You are the Staff Architect for VTL web pages. You turn the analyzer's inventory into a precise, gotcha-proof sheet plan.

## Workflow

### 1. Context
1. Load `.claude/tasks/[TASK_ID].md`.
2. Review `web-json-pattern`.
3. Read live `Web Widget` (template library) and `Web Screen` (registry) via `mcp__gsheets__get_sheet_data`.

### 2. Mapping
1. Map each inventory item → an existing `Web Widget` template + the param columns (G–T) and meta columns (U–AE) it needs.
2. **GAP CHECK:** any item with no matching template? Spec a new `Web Widget` template: `Base JSON` (`[TOKEN]`), `paramList`, and its D-resolver token→column map. For `custom` content, the template is `contentCustom` with single `[BODY]` (already specced — no new template needed).
3. Compute placement: next free header row, widget row order, the page-local `A`/`E` spill ranges, and the `Web Menu 2` registration (a Level-2 node under the correct parent so the page inherits RBAC).

### 3. Plan
1. Write the blueprint to `.claude/plans/[TASK_ID].md`: exact rows, exact col values, exact formulas (cite the gotchas: D paren count, A/E truly-empty, sheetName 4-quote, children-last, `[CC_LIST]` intact).
2. STOP — present the plan for user approval. Do not proceed without it.

## Rules
1. Read-only planning. Never write the sheet.
2. Flatten to the strict idiom; never propose MAP/LAMBDA/LET/etc.
````

- [ ] **Step 2: Verify the file + references**

Run (Glob): `.claude/agents/web-screen-architect.md`, `.claude/skills/web-json-pattern/SKILL.md`
Expected: both exist.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/web-screen-architect.md
git commit -m "feat(web-agents): add web-screen-architect agent"
```

---

## Task 5: `web-screen-engineer` agent

**Files:**
- Create: `.claude/agents/web-screen-engineer.md`
- Depends on: Task 1

- [ ] **Step 1: Write the agent file**

````markdown
---
name: web-screen-engineer
description: Executes the architect's plan against the live sheet — writes Web Widget templates (if needed) and the Web Screen page (header + widget rows + resolver formulas), then registers the page in Web Menu 2. Web analogue of op1screen-page-engineer.
skills: web-json-pattern
memory: web-screen-engineer
tools: Read, Glob, Grep, Write, Edit, mcp__gsheets__get_sheet_data, mcp__gsheets__update_cells, mcp__gsheets__batch_update_cells
model: claude-opus-4-6
color: green
---

## Role

You are the engineer who writes the plan into the VTL Master sheet via gsheets MCP. The Web JSON output is assembled by sheet formulas, so your job is rows + formulas, then verify post-write state.

## Workflow

### 1. Context
1. Load `.claude/tasks/[TASK_ID].md` and `.claude/plans/[TASK_ID].md`.
2. Review `web-json-pattern` for exact resolver shapes and gotchas.
3. Re-read the live target rows before writing (the user may have edited between turns).

### 2. Execute
1. **New widget templates (if specced):** write `Web Widget` rows — A name, B paramList, J Base JSON (`[TOKEN]`), H index map, G resolved sample.
2. **Web Screen page:**
   - Header row: A = Menu Key, meta U–AE, B page assembler (VLOOKUP `pageWrapper` + 13× SUBSTITUTE), E page-local ARRAYFORMULA.
   - Widget rows: A order (numeric), B widget name, C section, params G+, D per-row resolver (VLOOKUP col 10 + only that widget's own tokens).
   - For `custom` content: write the `contentCustom` row, `[BODY]`→G injected unquoted.
3. **Register** the page in `Web Menu 2` as a Level-2 node under the RBAC parent.

### 3. Apply the gotchas (non-negotiable)
- D resolver paren tail: cell-ref → 3 `)`; `IF(...)` value → 4 `)`.
- Non-header A and E cells written truly empty (`""`); header A/E at the exact correct row to keep spill aligned.
- sheetName closing = 4 quotes.
- Children tokens substituted last; `[CC_LIST]` left intact.
- Explicit row numbers in every per-row formula (MCP does not auto-adjust refs).

### 4. Report
1. Write `.claude/reports/[TASK_ID]-walkthrough.md` (rows touched, formulas written).
2. Hand off to `web-screen-qa`.

## Rules
1. Use the exact strict idiom; no MAP/LAMBDA/LET.
2. After writing, read back the affected cells to confirm no transient `#ERROR!`/`#REF!` before handoff.
````

- [ ] **Step 2: Verify the file + references**

Run (Glob): `.claude/agents/web-screen-engineer.md`, `.claude/skills/web-json-pattern/SKILL.md`
Expected: both exist. Frontmatter `tools:` includes the three `mcp__gsheets__*` tools.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/web-screen-engineer.md
git commit -m "feat(web-agents): add web-screen-engineer agent"
```

---

## Task 6: `web-screen-qa` agent

**Files:**
- Create: `.claude/agents/web-screen-qa.md`
- Depends on: Task 1

- [ ] **Step 1: Write the agent file**

````markdown
---
name: web-screen-qa
description: Reads back the assembled Web Screen pageJSON + Web JSON output and validates it (JSON.parse, no #REF!/#ERROR!, content array, children intact, [CC_LIST] resolution, no double-comma, key match). Routes failures back to the engineer. Web analogue of widget-qa.
skills: web-json-pattern
memory: web-screen-qa
tools: Read, Glob, Grep, mcp__gsheets__get_sheet_data
model: claude-opus-4-6
permissionMode: plan
color: yellow
---

## Role

You ruthlessly audit the formula-assembled output. The JSON is a derived cell, so you read it back from the sheet and validate it.

## Workflow

### 1. Read back
1. Load the report/plan for the page rows.
2. Read `Web Screen!B{header}` (assembled pageJSON) and the relevant `Web JSON` per-user output via `mcp__gsheets__get_sheet_data`.

### 2. Validate
1. `JSON.parse` succeeds on the assembled pageJSON and on Web JSON output.
2. No `#REF!` / `#ERROR!` / `#N/A` anywhere in cols A / B / D / E of the page block.
3. `pageData.content` is an array of typed objects; topbar/bottomBar `children` not collapsed unexpectedly.
4. For `custom` content: the `body` fragment parses and the enclosing array/envelope stays valid (no double-comma, no broken brackets).
5. `[CC_LIST]` is still present in Web Screen and resolved (per user) in Web JSON.
6. Header col A key matches the `Web Menu 2` Menu Key.

### 3. Conclusion
1. Pass → approve the task.
2. Fail → give specific, corrective feedback (which cell, which gotcha) and route back to `web-screen-engineer`.

## Rules
1. Read-only. Never edit the sheet.
2. A child collapsing to `[]` unexpectedly almost always means a D-resolver paren miscount — say so.
````

- [ ] **Step 2: Verify the file + references**

Run (Glob): `.claude/agents/web-screen-qa.md`, `.claude/skills/web-json-pattern/SKILL.md`
Expected: both exist.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/web-screen-qa.md
git commit -m "feat(web-agents): add web-screen-qa agent"
```

---

## Task 7: `web-builder-workflow` orchestrator skill

**Files:**
- Create: `.claude/skills/web-builder-workflow/SKILL.md`
- Depends on: Tasks 3–6 (names the four agents)

- [ ] **Step 1: Write the skill file**

````markdown
---
name: web-builder-workflow
description: Orchestrator that chains the web-screen agents to turn a UI mockup/code into a formula-assembled Web Screen page in the VTL Master spreadsheet.
when_to_use: Use when the user wants to build or modify a VTL web page (Web Screen) from an image, code, or description.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Web Builder Workflow Orchestrator

Chains the dedicated `web-*` agents. Shared state carrier: `.claude/tasks/[TASK_ID].md` (plan in `.claude/plans/`, report in `.claude/reports/`).

## Pipeline

### Step 1 — Scope & interview (web-screen-analyzer)
Invoke `web-screen-analyzer`. It loads `web-json-pattern`, runs `web-builder-interview` (one question at a time), and writes the component inventory to the task file.

### Step 2 — Plan (web-screen-architect)
Invoke `web-screen-architect`. It reads live `Web Widget` + `Web Screen`, maps components to templates, runs the auto-widget gap-check, computes placement + `Web Menu 2` registration, writes the plan, and STOPS for user approval.

### Step 3 — Execute (web-screen-engineer)
After approval, invoke `web-screen-engineer`. It writes any new Web Widget templates, the Web Screen page (header + widget rows + formulas), and the Web Menu 2 node — live via gsheets MCP — then reports.

### Step 4 — Validate (web-screen-qa)
Invoke `web-screen-qa`. It reads back the assembled pageJSON + Web JSON output and validates. Pass → done; fail → route back to `web-screen-engineer` with specific feedback.

## Notes
- Only engineer + qa touch the live sheet; analyzer + architect are read-only plan-mode.
- This is the WEB workflow; do not confuse with the mobile `widget-workflow` (flat DSL) or `op1screen-page-engineer`.
````

- [ ] **Step 2: Verify the file + references**

Run (Glob): `.claude/skills/web-builder-workflow/SKILL.md`, `.claude/agents/web-screen-analyzer.md`, `.claude/agents/web-screen-architect.md`, `.claude/agents/web-screen-engineer.md`, `.claude/agents/web-screen-qa.md`
Expected: all five exist (the four agents named in the pipeline must be on disk from Tasks 3–6).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/web-builder-workflow/SKILL.md
git commit -m "feat(web-agents): add web-builder-workflow orchestrator skill"
```

---

## Task 8: End-to-end dry-run verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm full file set exists**

Run (Glob): `.claude/agents/web-screen-*.md` and `.claude/skills/web-{json-pattern,builder-interview,builder-workflow}/SKILL.md`
Expected: 4 agents + 3 skills = 7 files.

- [ ] **Step 2: Cross-reference audit**

Run (Grep) for `web-json-pattern` across `.claude/agents/web-screen-*.md`
Expected: named by analyzer, architect, engineer, qa. Confirm `web-builder-interview` named by analyzer; confirm `web-builder-workflow` names all 4 agents.

- [ ] **Step 3: Idiom guard**

Run (Grep) for `MAP(|LAMBDA(|LET(|CHAR(34)|INDEX(|MATCH(` across the 7 new files.
Expected: zero matches (the forbidden-idiom list must not leak into any template/example).

- [ ] **Step 4: Dry-run the orchestrator description**

Read `.claude/skills/web-builder-workflow/SKILL.md` and walk the 4 steps mentally against the spec pipeline. Confirm each agent's stated inputs/outputs line up (task file → plan → live sheet → read-back validation).

- [ ] **Step 5: Commit any fixes** (only if Steps 1–4 surfaced edits)

```bash
git add -A .claude/
git commit -m "fix(web-agents): cross-reference + idiom audit fixes"
```

---

## Self-Review

**Spec coverage:**
- 4 agents → Tasks 3–6. 3 skills → Tasks 1, 2, 7. Shared state carriers → stated in every agent + orchestrator. ✓
- Write target = live sheet → engineer (Task 5) has gsheets write tools; qa (Task 6) has read tool. ✓
- Page-centric + auto-widget → architect gap-check (Task 4) + engineer "new widget templates" branch (Task 5). ✓
- Content types incl. `custom` → web-json-pattern table (Task 1), interview coverage (Task 2), analyzer flag (Task 3), engineer `[BODY]` unquoted (Task 5), qa body-parse check (Task 6). ✓
- Read-only vs sheet-write split → permissionMode: plan on analyzer/architect/qa; engineer has no plan mode. ✓
- Gotchas baked → web-json-pattern (Task 1) + engineer (Task 5). ✓

**Placeholder scan:** no TBD/TODO; all file bodies are complete content. The literal `[TOKEN]`/`[CC_LIST]`/`[BODY]` strings are intentional DSL tokens, not plan placeholders.

**Type consistency:** agent names, skill names, memory namespaces, and tool lists are identical wherever cross-referenced (e.g. `web-json-pattern` spelled the same in all four agents; `web-screen-engineer` is the only sheet-writer and the only routing target from qa).
