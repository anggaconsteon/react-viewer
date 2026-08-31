---
name: web-page-builder
description: Use when building, adding, or auditing a page/widget in the VTL web builder — the Web Widget, Web Screen, or Web Menu tabs of VTL Master spreadsheet 14kDPqAw... Triggers include "bikin page web", "tambah widget web", "Web Screen", "Web Menu", "contentForm", "buttonAction", pageData JSON, define web page. Supersedes the stale web-json-pattern skill.
---

# Web Page Builder (VTL)

Build a web page from a target `pageData` JSON by driving three tabs in spreadsheet `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` (locale `in_ID`: formula sep `;`, array col-sep `\`). Mirror of the op1Screen page engineer, but for web.

**Core idiom:** a `[PLACEHOLDER]` template lives in **Web Widget** col J; **Web Screen** cells VLOOKUP it + chained SUBSTITUTE to fill tokens; **Web Menu** holds the final node. Producer cells stay dumb (no `&"..."&`).

## Architecture (current — verify live before trusting)

1. **Web Widget** = template library. Add widget = write col **I** (name) + col **J** (template), then the two per-row formulas **G** and **H** (copy the row above, rebase the row number):
   - `G{r}` = `=IF(ISERROR(J{r});"";J{r})` — resolved sample
   - `H{r}` = `=IF(A{r}=""; ""; IF(ROW()<=2; ""; "◆")&$A{r}&"▶Widget!"&CHAR(64+COLUMN($J$1))&ROW())` — index map
   **NEVER write col A** — it's `=ARRAYFORMULA(I:I)` spill; a literal there collapses col A → every `VLOOKUP(...,'Web Widget'!$A:$J,10)` breaks.
2. **Web Screen** = page authoring. Each page = **9-row block**: 1 header + 8 content slots (fill as many as needed). Assembler in header col B produces the `pageData` object.
3. **Web Menu** = the live tree. Col **L** (level-2 Sub JSON) / **M** (level-1 Main JSON) hold **STATIC pageData** (pasted, NOT a formula anymore). So building Web Screen alone does NOT update the menu — you MUST copy the assembled `pageData` into the node's L/M.

## Web Screen 9-row block

Header at row `H`, content rows `H+1 … H+8` (= `L`). Write header cells A,B,D,E,F + params; write content rows B,C,D,F + params. **Leave content-row A and E EMPTY** — the header spills fill them; a literal (even `""`) blocks the spill.

Header row `H`:
- **A** (A-spill): `=IF($B$10="";"";ARRAYFORMULA(IF(ROW(A{H}:A{L})=ROW(A{H});VLOOKUP("<pageKey>";'Web Menu'!$J:$J;1;FALSE);ROW(A{H}:A{L})-ROW(A{H}))))` — `$B$10` is a FIXED global "sheet-populated" sentinel; keep it literally `$B$10` on every page, do NOT rebase it to the block.
- **B** (assembler, 7× SUBSTITUTE): `=SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(VLOOKUP("pageWrapper";'Web Widget'!$A:$J;10;FALSE);"[TITLE]";VLOOKUP(A{H};{'Web Menu'!$J:$J\'Web Menu'!$F:$F};2;FALSE));"[DESCRIPTION]";Z{H});"[TB_ALIGN]";AD{H});"[BT_ALIGN]";AE{H});"[TB_CHILDREN]";IFERROR(MID(TEXTJOIN("";TRUE;FILTER(E{H+1}:E{L};C{H+1}:C{L}="topbar"));2;50000);""));"[CONTENT]";IFERROR(MID(TEXTJOIN("";TRUE;FILTER(E{H+1}:E{L};C{H+1}:C{L}="content"));2;50000);""));"[BT_CHILDREN]";IFERROR(MID(TEXTJOIN("";TRUE;FILTER(E{H+1}:E{L};C{H+1}:C{L}="bottomBar"));2;50000);""))`
- **C** empty · **D** = `JSON--` (literal) · **F** = `Displayed` (literal)
- **E** (E-spill): `=ARRAYFORMULA(IF(A{H}:A{L}="";"";IF(NOT(ISNUMBER(A{H}:A{L}));"JSON";IF(ISERROR(D{H}:D{L});"";IF(D{H}:D{L}="";"";IF(F{H}:F{L}<>TRUE;"";","&D{H}:D{L}))))))`
- Header params: **Z**=description, **AD**=topbar alignment, **AE**=bottomBar alignment (current pages use `""` for both).

**Refs are RELATIVE** (`E{H+1}:E{L}`, `A{H}:A{L}`), NOT absolute (`$E$..`). FILTER window is **content rows only** (`H+1:L`), excludes the header. Match the existing pages exactly.

Content row `r` (`H+1 …`):
- **B** = widget name (Web Widget col I) · **C** = section (`content`/`topbar`/`bottomBar`) · **F** = `TRUE`
- **D** (resolver): `=SUBSTITUTE(SUBSTITUTE(…VLOOKUP(B{r};'Web Widget'!$A:$J;10;FALSE);"[TOK1]";G{r});"[TOK2]";H{r};…)` — one SUBSTITUTE per placeholder, params start at col **G** and run right as far as needed (live pages already use G–R). Reuse a sibling widget's column order where one exists, so related widgets stay column-aligned.
- **A, E** = leave empty (spill).

Content widget → `content` section. A bare BUTTON → `bottomBar` or `topbar` (the content dispatcher only renders SPREADSHEET/FORM/RESET_DEVICE/MAP; a raw BUTTON belongs in a bar's children).

**Parameterized cells use `=` prefix** (forces explicit type, kills Sheets auto-coercion of "TRUE"/dates/leading-zeros): string → `="value"`, number → `=2`, composite JSON like `[FIELDS]` → `="{""id"":""x""...}"` (double EVERY internal `"`). Applies to section col C + all template params (G–N, Z/AD/AE). Leave PLAIN (no `=`): col A/D/E (already spill/resolver formulas), widget-name col B, Displayed flag col F.

## Web Menu node (static L, level-2)

`{"label":"<Label>","icon":"<Icon>","path":"<path>","key":"<pageKey>","parent":"<Parent>","children":[],"pageData":<paste Web Screen B{H} value verbatim>}`

`pageKey` must match the A-spill VLOOKUP + Web Screen A{H}. `[TITLE]` in the assembler pulls Web Menu col F (Label) — so title = the menu Label. Set `Display` (col N) = TRUE.

## Widget shapes (current)

- **FORM** (`contentFormAction`): `action` at TOP level, no `onClick`/`url`. `{...,"action":"[ACTION]","confirm":true,"columns":[COLUMNS],"onSuccess":{"toast":"[SUCCESS]","then":"[THEN]"},"fields":[[FIELDS]]}`. `[FIELDS]` = field objects comma-joined WITHOUT outer brackets (template has `[[FIELDS]]`).
- **Action button** (`buttonAction`): `{"type":"BUTTON",…,"onClick":{"type":"RUN_ACTION","action":"[ACTION]","confirm":true,…}}` — action INSIDE onClick.
- **Row actions** (`contentSpreadsheetRowActions`, row 22): `contentSpreadsheetRowAction` + `"rowActions":[[ROW_ACTIONS]]` (raw-inject array, params G–M identical, N = ROW_ACTIONS). One array of per-row icon buttons, each with `type` (`RUN_ACTION`/`OPEN_LINK`) — do NOT add a new `rowX` key per icon. Spec: `docs/web-row-actions-dev-spec.md`.
- **All labels in ONE `text` field, `◆`-separated, index starts at 1** — house rule from `.claude/skills/widget-dsl-pattern` §3, now applied to web too. Never `label`+`emptyText`+`successToast` as separate keys. **New segments append at the end only** — inserting or reordering shifts every segment below it and silently breaks live pages. Empty mid-segments still written (`◆◆`); trailing empties may be dropped; `◆` is forbidden inside segment text. Every spec using `text` MUST carry an index table — that table is the only thing holding the contract.
- **Link button** (`buttonLink`, row 21): ClickAction `OPEN_LINK` + `"href":"[HREF]"` · `"newTab":"[NEW_TAB]"`. `href` takes a literal `https://`, an existing `[SRC:pageKey]` token, or a pointer `sheet◼<spreadsheet>◼<Sheet!Cell>` / `firestore◼<coll/doc>◼<field>` resolved **server-side at pageData serve time** (never on click — a click-time resolver would hand the client an arbitrary-read primitive). Params G TEXT · H HREF · I ICON · L ERROR · M VARIANT · N SIZE · O CONFIRM · P NEW_TAB (J/K left empty to stay column-aligned). Spec: `docs/web-button-link-dev-spec.md`.
- **Sequential button** (`buttonSequential`, row 20): `buttonRunAction` + `"seqBySheet":"[SEQ_BY_SHEET]"`. Params G–O identical to `buttonRunAction`, then P SEQ_BY_SHEET. Spec: `docs/web-button-sequential-dev-spec.md`.
- **Payload stays a raw `[PAYLOAD]` token, authored per page in Web Screen** — do NOT bake payload keys into a widget template. Payload shape differs per action/page (user, 2026-08-20). Only the renderer-visible key is fixed by convention (`seq` for `buttonSequential`); everything else is passed through to the backend untouched.
- **`confirm:true` is BAKED literal** in older templates, and `[CONFIRM]` (raw, cell `="true"` lowercase) in `buttonRunAction`/`contentSpreadsheetRowAction` — both live, don't churn them. For **new** boolean-ish flags, quote the token in the template and write the cell as a string: `"seqBySheet":"[SEQ_BY_SHEET]"` + cell `="TRUE"`. An unquoted boolean param cell gets coerced by Sheets to `TRUE` (uppercase) → invalid JSON.
- Numbers (`columns`, `rowHeader`) = unquoted `[TOKEN]` filled from a number cell — fine; never leave blank (→ invalid JSON).

## Gotchas / common mistakes

| Symptom | Cause → fix |
|---|---|
| All pages `#N/A` "Did not find pageWrapper" | wrote Web Widget col A literal → col A spill collapsed. Clear it; write I+J only. |
| Page section renders `[]` / `#REF!` spill | wrote content-row A or E (must be empty), or absolute FILTER refs, or wrong window. Use relative `E{H+1}:E{L}`. |
| Page `#N/A` at header A | `pageKey` not in Web Menu col J. Add the Web Menu node first. |
| `columns`/`confirm` breaks JSON | boolean/number left blank or coerced. Bake `confirm:true`; always fill number params. |
| Menu shows nothing new after building Web Screen | Web Menu L/M is STATIC — copy assembled `pageData` (B{H}) into the node. |
| `Range exceeds grid limits` on write | grid full; MCP can't add rows. Ask the user to insert blank rows in that tab, then retry. |

## Flow

1. Get target `pageData` JSON. 2. Ensure each content widget has a Web Widget template (reuse or add I+J). 3. Pick a free 9-row block in Web Screen (respect grid size). 4. Write header (A/B/D/E/F + Z/AD/AE) + content rows (B/C/D/F + params). 5. Read back B{H}; confirm it parses = target. 6. Paste that `pageData` into the Web Menu node (L for level-2), set Display TRUE. 7. Verify parent's tree includes it.
