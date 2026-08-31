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
| **A** | `Widget name` — VLOOKUP key. **`A1 = ARRAYFORMULA(I1:I)` — NEVER WRITE col A** |
| B | `Parameter 1` label (per-widget; leave empty unless labelling) |
| G | `JSON` — resolved sample (leave `[CC_LIST]` intact) |
| H | index map `◆<name>▶Web Widget!J<row>` (H1 = full ◆-join) |
| **I** | **name source** — write the widget name HERE; col A spills from it |
| J | `Base JSON` — the `[TOKEN]` template VLOOKUP reads (column index **10**) |

**Add a widget = write col I (name) + col J (template). Nothing else.** A literal in col A blocks the spill → `A1 = #REF!` → **every** `VLOOKUP(...;'Web Widget'!$A:$J;10;FALSE)` in the workbook returns `#N/A` → every page header collapses (hit 2026-07-28). Recovery: clear the literal in A.

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
| `spreadsheet + per-row action` | `contentSpreadsheetRowAction` | G=ID, H=SRC, I=PERM, J=VISIBLE_SHEETS, K=SHEET_NAME, L=ROWHEADER`(dflt 1)`, M=ROWSTARTDATA`(dflt 2)`, N=ACTION, O=PAYLOAD`(dflt {})`, P=RA_ICON, Q=RA_LABEL, R=CONFIRM`(dflt true)`, S=SUCCESS_TOAST, T=REFRESH`(dflt false)` |
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
- **buttonAction** (RUN_ACTION, legacy — no payload, `confirm`/`method` baked): `[TEXT]`→G, `[ACTION]`→H, `[SUCCESS]`→J, `[THEN]`→K, `[ERROR]`→L (I = dead slot)
- **buttonRunAction** (RUN_ACTION, generic — supersedes buttonAction for new pages): `[TEXT]`→G, `[ACTION]`→H, `[PAYLOAD]`→I `(dflt {})`, `[SUCCESS]`→J, `[THEN]`→K, `[ERROR]`→L, `[VARIANT]`→M `(dflt default)`, `[SIZE]`→N `(dflt default)`, `[CONFIRM]`→O `(dflt true)`

**Raw-injection tokens (unquoted in template) — always give a default so empty never yields invalid JSON:** object params (`[PAYLOAD]` → `IF(col="";"{}";col)`), numbers (`[ROWHEADER]` → `IF(col="";1;col)`), booleans (`[CONFIRM]` → `IF(col="";"true";LOWER(col&""))` — `LOWER` because a sheet `TRUE` substitutes as uppercase `TRUE`, which is invalid JSON).
- **spacer** (0): VLOOKUP only, no SUBSTITUTE

D resolver guard (every widget row): `=IF(NOT(ISNUMBER(A{r}));"";IF(B{r}="";"";<VLOOKUP + SUBSTITUTE chain>))` with `VLOOKUP(B{r};'Web Widget'!$A:$J;10;FALSE)`.

## `[CC_LIST]` token

Author writes `[CC_LIST]` in a Web Screen param (e.g. dropdown `[OPTIONS]` = `Semua◆[CC_LIST]`). It MUST stay intact through Web Screen; it is resolved once per user only in `Web JSON`. In any assembler, substitute `[CHILDREN]`/`[TB/BT/CONTENT_CHILDREN]` BEFORE `[CC_LIST]`.

## `Web URL` tab (SSOT for every SPREADSHEET `src`)

Cols: **A=# (AUTO spill)** · B=Page label (manual) · C=Cost Center (manual) · **D=Page Key (AUTO spill)** · E=Spreadsheet URL (manual). **Write B, C, E only** — A and D are header-spill arrayformulas (row 2).

- `D2 = ARRAYFORMULA(IF(B2:B="";"";IFERROR(VLOOKUP(B2:B;{'Web Menu'!$F$2:$F\'Web Menu'!$J$2:$J};2;FALSE);B2:B)))` — key resolved by looking the label up in `Web Menu` (label→key), falling back to the raw label. **Ranges MUST stay open-ended**: they were `$F$2:$F$25` and silently fell back to the raw label for every Web Menu row past 25 (`IT Admin`, `Reset Device`, and any new page) → `[SRC:key]` never resolved. Fixed 2026-07-28.
- A page with one shared URL for all CCs still gets **one row per cost center** (proven pattern: `laporanPekerjaan`). `C="Semua CC"` is the only literal the resolver force-includes for everyone — `"Semua"` only matches users whose ccstr contains it.
- The label in B must match the `Web Menu` label exactly, or the key falls back to the label and `[SRC:...]` stays raw.

## CRITICAL gotchas

- **Auto-spill columns exist in every tab — writing a literal into one is the #1 way to break the workbook.** Known: `Web Widget!A` (from I), `Web URL!A` + `Web URL!D`, `Web Menu!A/F/J/K/L/M`, `Web Screen!A`+`E` per page header. A blocked spill turns the anchor into `#REF!` and cascades far outside the tab you edited. **Before writing any cell, grid-read it: a cell with `effectiveValue` but NO `userEnteredValue` is SPILLED — do not write it.** (Missing that read is what caused two breakages on 2026-07-28.)
- **Row offsets: data starts at row 2 in `Web Menu` / `Web URL`, so `#N` sits at row N+1.** Reading a `#` column and treating it as the row number overwrites the last real record (hit twice: `Icon` in Web Menu, `Reset Device Tenant` in Web URL). Re-read the tail rows and confirm the first genuinely empty row before appending.

- **D resolver paren tail:** plain cell-ref value → **3** trailing `)` (`L{r})))`); `IF(col="";default;col)` value → **4** (`J{r}))))`). Miscount → `#ERROR!` and the section collapses to `[]`.
- **A/E spill alignment:** non-header A and E cells MUST be truly empty (`""`). A stray/mis-shifted header formula one row off blocks the prior page's spill → `#REF!` across cols A+E (and B header). Fix by rewriting only cols A & E per header at the correct row.
- **sheetName quoting:** closing literal = **4** quotes (`&AC{h}&""""`); 5 quotes = `#ERROR! parse`.
- **Children substituted last:** `[TB_CHILDREN]`/`[CONTENT]`/`[BT_CHILDREN]` are the outermost SUBSTITUTE so tokens inside children (`[CC_LIST]`) survive.
- **B assembler children fragments** use `IFERROR(MID(TEXTJOIN("";TRUE;FILTER($E$<h+1>:$E$<last>;$C$<h+1>:$C$<last>="topbar"));2;50000);"")` — page-local bounded range, IFERROR-wrapped (FILTER throws on zero match).
