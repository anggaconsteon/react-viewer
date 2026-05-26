# Web Builder Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working web-builder layer inside the VTL Master spreadsheet so a tenant admin can define web pages and widgets in a sheet, and a single per-user JSON compile flows out to the website via `Web JSON!C`.

**Architecture:** Three tabs (`Web Widget`, `Web Screen`, `Web JSON`) wired by VLOOKUP + SUBSTITUTE + ARRAYFORMULA, modeled 1:1 on the existing `op1Screen` pattern (header row anchors a page; widget rows under it resolve via Widget tab templates; `Web JSON` spills per user and substitutes `[CC_LIST]` from RBAC matrices).

**Tech Stack:** Google Sheets formulas (LET, MAP, LAMBDA, FILTER, ARRAYFORMULA, SUBSTITUTE, VLOOKUP, TEXTJOIN, MID), gsheets MCP for writes/reads, the reference `contoh json full.txt` as the QA fixture.

**Target spreadsheet:** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`
**Reference op1Screen sheet:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` (read-only, for formula patterns)
**Spec:** `docs/superpowers/specs/2026-05-26-web-builder-sheet-design.md`
**Reference JSON:** `C:/Users/FCT/Downloads/contoh json full.txt`

---

## File Structure (Sheet Structure)

Sheets are the "files" here. Below is the responsibility split:

| Tab | New / Existing | Responsibility |
|---|---|---|
| `Web Widget` | NEW | Template library. col A=widgetName, col B=paramList (info), col G=template JSON with `[TOKEN]` placeholders. |
| `Web Screen` | NEW | Per-page definition. Header row anchors pageKey + meta; widget rows below define topbar/bottomBar widgets and resolve through `Web Widget` via formula. |
| `Web JSON` | EXISTING (formula change) | Per-user spill. col B=email, col C=compiled root MENU JSON with `[CC_LIST]` substituted from `Otorisasi Cost Center 2` row. |
| `Otorisasi Menu Web` | EXISTING (read-only) | Source of menu RBAC per user. |
| `Otorisasi Cost Center 2` | EXISTING (read-only) | Source of per-user CC list. |
| `Web Menu 2` | EXISTING (read-only) | Source of menu hierarchy (parent / order / pageKey). |
| `Web Screen 2` | EXISTING (kept as fossil) | Old design, do not edit. |
| `Component` | EXISTING (kept as fossil) | Superseded by Web Widget, do not edit. |

Local artifacts in this repo:
- `docs/superpowers/specs/2026-05-26-web-builder-sheet-design.md` — design spec (already committed).
- `docs/superpowers/plans/2026-05-26-web-builder-sheet.md` — this file.
- `json/web-screen-patrol-report.expected.json` — fixture for Task 6 QA (created in Task 6).
- `json/web-screen-sales-performance.expected.json` — fixture for Task 7 QA (created in Task 7).
- `json/web-json-budi.expected.json` — fixture for Task 10 QA (created in Task 10).

---

## Quick Reference — gsheets MCP Calls

These come up repeatedly. Pattern reminder before starting tasks:

- Read a tab: `mcp__gsheets__get_sheet_data` with `include_grid_data: false` for plain values (use `true` only when you need formulas/formats — the result is much larger).
- Write/edit cells: `mcp__gsheets__update_cells` (single range) or `mcp__gsheets__batch_update_cells` (multiple ranges).
- Add a tab: `mcp__gsheets__create_sheet`.
- List tabs first if unsure they exist: `mcp__gsheets__list_sheets`.
- **Formula encoding gotcha (saved memory):** when writing a formula via `update_cells`, end with plain `"` then `]]`, never `\"]]` or `"]]]`. If the cell value is the formula string, the API receives it literally.

---

## Task 1: Create `Web Widget` tab and seed templates

**Files:**
- Modify (via MCP): tab `Web Widget` in spreadsheet `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`

- [ ] **Step 1: Confirm the tab doesn't already exist**

Tool: `mcp__gsheets__list_sheets`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY" }`
Expected: `Web Widget` is NOT in the returned list. If it is, skip to Step 3 and just clear A1:G50 instead of creating.

- [ ] **Step 2: Create the `Web Widget` tab**

Tool: `mcp__gsheets__create_sheet`
Args:
```json
{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "title": "Web Widget" }
```

- [ ] **Step 3: Write the header row (row 1)**

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Widget",
  "range": "A1:G1",
  "data": [["widgetName","paramList","","","","","template"]]
}
```

- [ ] **Step 4: Seed the 4 launch templates (rows 2–5)**

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Widget",
  "range": "A2:G5",
  "data": [
    ["DROPDOWN","KEY,CELL,PLACEHOLDER,OPTIONS,EMPTY_TEXT,VARIANT","","","","","{\"type\":\"DROPDOWN\",\"key\":\"[KEY]\",\"cell\":\"[CELL]\",\"placeholder\":\"[PLACEHOLDER]\",\"options\":\"[OPTIONS]\",\"emptyText\":\"[EMPTY_TEXT]\",\"variant\":\"[VARIANT]\"}"],
    ["DATE","KEY,CELL,PLACEHOLDER,VARIANT","","","","","{\"type\":\"DATE\",\"key\":\"[KEY]\",\"cell\":\"[CELL]\",\"placeholder\":\"[PLACEHOLDER]\",\"variant\":\"[VARIANT]\"}"],
    ["SPACER","","","","","","{\"type\":\"SPACER\"}"],
    ["BUTTON_SUBMIT","TEXT,DATA,ICON,TARGET,API_URL,SUCCESS,ERROR,THEN","","","","","{\"type\":\"BUTTON\",\"variant\":\"outline\",\"size\":\"icon\",\"icon\":\"[ICON]\",\"text\":\"[TEXT]\",\"data\":\"[DATA]\",\"onClick\":{\"type\":\"SUBMIT\",\"url\":\"[API_URL]\",\"method\":\"POST\",\"target\":\"[TARGET]\",\"onSuccess\":{\"toast\":\"[SUCCESS]\",\"then\":\"[THEN]\"},\"onError\":{\"toast\":\"[ERROR]\"}}}"]
  ]
}
```

- [ ] **Step 5: Verify the tab content**

Tool: `mcp__gsheets__get_sheet_data`
Args:
```json
{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Widget", "range": "A1:G5", "include_grid_data": false }
```
Expected: returned values match Step 3 + Step 4 exactly (no extra escaping artifacts in the template column G).

- [ ] **Step 6: No git commit for this task** — spreadsheet writes are versioned by Google. Move on.

---

## Task 2: Create `Web Screen` tab and write header schema

**Files:**
- Modify (via MCP): tab `Web Screen`

- [ ] **Step 1: Confirm tab doesn't exist**

Tool: `mcp__gsheets__list_sheets` (same args as Task 1 Step 1). Expected: `Web Screen` is NOT in list.

- [ ] **Step 2: Create the tab**

Tool: `mcp__gsheets__create_sheet`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "title": "Web Screen" }`

- [ ] **Step 3: Write the column header row (row 1)**

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "A1:AE1",
  "data": [[
    "pageKey/order","widgetName/pageJSON","section","widgetJSON","JSON--","Displayed",
    "[KEY]","[CELL]","[PLACEHOLDER]","[OPTIONS]","[EMPTY_TEXT]","[VARIANT]",
    "[TEXT]","[DATA]","[ICON]","[TARGET]","[API_URL]","[SUCCESS]","[ERROR]","[THEN]",
    "label","icon","path","parent","src","permission","rowHeader","rowStartData","sheetName","topbarAlign","bottomAlign"
  ]]
}
```

- [ ] **Step 4: Verify**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Screen", "range": "A1:AE1", "include_grid_data": false }`
Expected: 31 header cells exactly matching Step 3.

---

## Task 3: Install col D widget resolver formula and col E ARRAYFORMULA

These are the engine. Col D resolves a single widget row's JSON; col E builds the comma-prefixed concat string that col B (header rows) will gather.

**Files:**
- Modify (via MCP): tab `Web Screen` cells D2 and E2

- [ ] **Step 1: Write the col D formula on row 2 (and copy down via fill-down later)**

The formula must run only when col B has a value (widget row), and only when col A is NOT a pageKey header. Since pageKey is non-numeric and order is numeric on widget rows, we detect "widget row" by `ISNUMBER(A{n})`.

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "D2",
  "data": [["=IF(NOT(ISNUMBER(A2)),\"\",IF(B2=\"\",\"\",SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(VLOOKUP(B2,'Web Widget'!$A:$G,7,FALSE),\"[KEY]\",G2),\"[CELL]\",H2),\"[PLACEHOLDER]\",I2),\"[OPTIONS]\",J2),\"[EMPTY_TEXT]\",K2),\"[VARIANT]\",L2),\"[TEXT]\",M2),\"[DATA]\",N2),\"[ICON]\",O2),\"[TARGET]\",P2),\"[API_URL]\",Q2),\"[SUCCESS]\",R2),\"[ERROR]\",S2),\"[THEN]\",T2)))"]]
}
```

After this lands, manually copy D2 down to D1000 in the UI (or run the same update across a range later when there are real widget rows).

- [ ] **Step 2: Verify the col D formula sits as a formula (not literal text)**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Screen", "range": "D2:D2", "include_grid_data": true }`
Expected: the `userEnteredValue.formulaValue` field contains the SUBSTITUTE chain. Cell currently evaluates to `""` because A2/B2 are empty — that is correct, the formula short-circuits.

- [ ] **Step 3: Write the col E ARRAYFORMULA on row 2**

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "E2",
  "data": [["=ARRAYFORMULA(IF(ROW(D2:D10000)=ROW(D2),\"JSON\",IF(ISERROR(D2:D10000),\"\",IF(D2:D10000=\"\",\"\",IF(F2:F10000<>TRUE,\"\",\",\"&D2:D10000)))))"]]
}
```

- [ ] **Step 4: Verify col E spills**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Screen", "range": "E2:E10", "include_grid_data": false }`
Expected: E2 = `"JSON"` literal label; E3–E10 all empty strings (no widget rows yet).

---

## Task 4: Define the `patrolReport` page (1 header row + 4 widget rows)

This is the first real test of the design. Data lifted from the reference JSON `Patrol Report` leaf.

**Files:**
- Modify (via MCP): tab `Web Screen` rows 2–6

- [ ] **Step 1: Write the patrolReport header row (row 2)**

Per the spec, header row keeps col B blank for now — we install the pageJSON formula in Task 5. Pages meta cols U–AE are populated here.

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "A2:AE2",
  "data": [[
    "patrolReport","","","","JSON--","Displayed",
    "","","","","","","","","","","","","","",
    "Patrol Report","UserStar","/patrol","patrol","https://docs.google.com/spreadsheets/d/1bpuiI-71sIKx6AOiSyb5BvCO7UNwAgqi0n_Nxrla-oY/edit?gid=2099023861#gid=2099023861","C◆U◆D",8,9,"","start","end"
  ]]
}
```

- [ ] **Step 2: Write the 4 widget rows (rows 3–6)**

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "A3:T6",
  "data": [
    [1,"DROPDOWN","topbar","","","TRUE","costCenter","Patroli!F5","Choose cost center","Semua◆[CC_LIST]","Cost center not found","outline","","","","","","","",""],
    [2,"DATE","topbar","","","TRUE","startDate","Patroli!C5","Choose start date","","","outline","","","","","","","",""],
    [3,"DATE","topbar","","","TRUE","endDate","Patroli!C6","Choose end date","","","outline","","","","","","","",""],
    [4,"BUTTON_SUBMIT","topbar","","","TRUE","","","","","","","Apply","costCenter◆startDate◆endDate","FilterIcon","mainContent","https://autsorz.consteon.ai/api/spreadsheet","Filter applied successfully.","Failed to load data.","REFRESH_CONTENT"]
  ]
}
```

Notice the `[CC_LIST]` token in cell J3. It is intentional — Web JSON resolves it.

- [ ] **Step 3: Fill col D and col F-formula propagation**

Col D in rows 3–6 should auto-fill via the formula from Task 3. If it did not (Google Sheets sometimes won't fill array of formulas when written via API), explicitly copy D2's formula into D3:D6:

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "D3",
  "data": [["=IF(NOT(ISNUMBER(A3)),\"\",IF(B3=\"\",\"\",SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(VLOOKUP(B3,'Web Widget'!$A:$G,7,FALSE),\"[KEY]\",G3),\"[CELL]\",H3),\"[PLACEHOLDER]\",I3),\"[OPTIONS]\",J3),\"[EMPTY_TEXT]\",K3),\"[VARIANT]\",L3),\"[TEXT]\",M3),\"[DATA]\",N3),\"[ICON]\",O3),\"[TARGET]\",P3),\"[API_URL]\",Q3),\"[SUCCESS]\",R3),\"[ERROR]\",S3),\"[THEN]\",T3)))"]]
}
```
Repeat for D4, D5, D6 (same formula, replace `3` with `4`, `5`, `6` throughout).

- [ ] **Step 4: Verify col D evaluates per widget**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Screen", "range": "D3:D6", "include_grid_data": false }`
Expected (compact):
- D3 starts with `{"type":"DROPDOWN","key":"costCenter","cell":"Patroli!F5","placeholder":"Choose cost center","options":"Semua◆[CC_LIST]",…`
- D4 starts with `{"type":"DATE","key":"startDate",…`
- D5 starts with `{"type":"DATE","key":"endDate",…`
- D6 starts with `{"type":"BUTTON","variant":"outline","size":"icon","icon":"FilterIcon","text":"Apply","data":"costCenter◆startDate◆endDate",…`

If any cell is `#N/A` or `#REF!`, the most likely cause is a typo in the Web Widget template name. Fix the col B value or the Web Widget row.

- [ ] **Step 5: Verify col E spills with `,`-prefix**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Screen", "range": "E2:E6", "include_grid_data": false }`
Expected:
- E2 = `"JSON"`
- E3 = `,{"type":"DROPDOWN",…}`
- E4 = `,{"type":"DATE",…}` (startDate)
- E5 = `,{"type":"DATE",…}` (endDate)
- E6 = `,{"type":"BUTTON",…}`

---

## Task 5: Install the col B header pageJSON assembler

**Files:**
- Modify (via MCP): tab `Web Screen` cell B2 (patrolReport header row)

- [ ] **Step 1: Write the col B formula on B2**

The formula auto-detects the row range of widgets for this page (rows below until the next header). Implementation uses `MATCH("?*", A_below, 0)` to find the next non-empty A cell.

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "B2",
  "data": [["=IF(OR(A2=\"\",ISNUMBER(A2)),\"\",LET(startRow,ROW()+1,nextHdrOffset,IFERROR(MATCH(\"?*\",INDIRECT(\"A\"&startRow&\":A10000\"),0),10000-startRow+1),endRow,startRow+nextHdrOffset-2,topbarStr,TEXTJOIN(\"\",TRUE,FILTER(INDIRECT(\"E\"&startRow&\":E\"&endRow),INDIRECT(\"C\"&startRow&\":C\"&endRow)=\"topbar\")),bottomStr,TEXTJOIN(\"\",TRUE,FILTER(INDIRECT(\"E\"&startRow&\":E\"&endRow),INDIRECT(\"C\"&startRow&\":C\"&endRow)=\"bottomBar\")),topbarChildren,IF(topbarStr=\"\",\"\",MID(topbarStr,2,50000)),bottomChildren,IF(bottomStr=\"\",\"\",MID(bottomStr,2,50000)),\"{\"\"label\"\":\"\"\"&U2&\"\"\",\"\"icon\"\":\"\"\"&V2&\"\"\",\"\"path\"\":\"\"\"&W2&\"\"\",\"\"key\"\":\"\"\"&A2&\"\"\",\"\"parent\"\":\"\"\"&X2&\"\"\",\"\"pageData\"\":{\"\"title\"\":\"\"\"&U2&\"\"\",\"\"topbar\"\":{\"\"alignment\"\":\"\"\"&AD2&\"\"\",\"\"children\"\":[\"&topbarChildren&\"]},\"\"spreadsheet\"\":{\"\"id\"\":\"\"mainContent\"\",\"\"src\"\":\"\"\"&Y2&\"\"\",\"\"permission\"\":\"\"\"&Z2&\"\"\"\"&IF(AA2<>\"\",\",\"\"rowHeader\"\":\"&AA2,\"\")&IF(AB2<>\"\",\",\"\"rowStartData\"\":\"&AB2,\"\")&IF(AC2<>\"\",\",\"\"sheetName\"\":\"\"\"&AC2&\"\"\"\",\"\")&\"},\"\"bottomBar\"\":{\"\"alignment\"\":\"\"\"&AE2&\"\"\",\"\"children\"\":[\"&bottomChildren&\"]}}}\")"]]
}
```

Note: nested `""` inside the formula represents a literal `"` character per Sheets formula syntax. The JSON outputs use `"`.

- [ ] **Step 2: Verify B2 evaluates to JSON for patrolReport**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Screen", "range": "B2", "include_grid_data": false }`
Expected: a single JSON string starting `{"label":"Patrol Report","icon":"UserStar","path":"/patrol","key":"patrolReport","parent":"patrol","pageData":{"title":"Patrol Report","topbar":{"alignment":"start","children":[{"type":"DROPDOWN",…},{"type":"DATE",…},{"type":"DATE",…},{"type":"BUTTON",…}]},"spreadsheet":{"id":"mainContent","src":"https://docs.google.com/…","permission":"C◆U◆D","rowHeader":8,"rowStartData":9},"bottomBar":{"alignment":"end","children":[]}}}`

The `[CC_LIST]` token is still present unresolved — that is correct, Web JSON does that step.

---

## Task 6: QA Patrol Report JSON against the reference

**Files:**
- Create: `json/web-screen-patrol-report.expected.json`

- [ ] **Step 1: Capture the expected JSON from the reference**

Create the file `json/web-screen-patrol-report.expected.json` with the Patrol Report leaf from `C:/Users/FCT/Downloads/contoh json full.txt` (lines 127–195) — same shape but with the `options` field set to `Semua◆[CC_LIST]` instead of the hardcoded list, since the spec uses the token.

Content to write:
```json
{
  "label": "Patrol Report",
  "icon": "UserStar",
  "path": "/patrol",
  "key": "patrolReport",
  "parent": "patrol",
  "pageData": {
    "title": "Patrol Report",
    "topbar": {
      "alignment": "start",
      "children": [
        {
          "type": "DROPDOWN",
          "key": "costCenter",
          "cell": "Patroli!F5",
          "placeholder": "Choose cost center",
          "options": "Semua◆[CC_LIST]",
          "emptyText": "Cost center not found",
          "variant": "outline"
        },
        {
          "type": "DATE",
          "key": "startDate",
          "cell": "Patroli!C5",
          "placeholder": "Choose start date",
          "variant": "outline"
        },
        {
          "type": "DATE",
          "key": "endDate",
          "cell": "Patroli!C6",
          "placeholder": "Choose end date",
          "variant": "outline"
        },
        {
          "type": "BUTTON",
          "variant": "outline",
          "size": "icon",
          "icon": "FilterIcon",
          "text": "Apply",
          "data": "costCenter◆startDate◆endDate",
          "onClick": {
            "type": "SUBMIT",
            "url": "https://autsorz.consteon.ai/api/spreadsheet",
            "method": "POST",
            "target": "mainContent",
            "onSuccess": {
              "toast": "Filter applied successfully.",
              "then": "REFRESH_CONTENT"
            },
            "onError": {
              "toast": "Failed to load data."
            }
          }
        }
      ]
    },
    "spreadsheet": {
      "id": "mainContent",
      "src": "https://docs.google.com/spreadsheets/d/1bpuiI-71sIKx6AOiSyb5BvCO7UNwAgqi0n_Nxrla-oY/edit?gid=2099023861#gid=2099023861",
      "permission": "C◆U◆D",
      "rowHeader": 8,
      "rowStartData": 9
    },
    "bottomBar": {
      "alignment": "end",
      "children": []
    }
  }
}
```

- [ ] **Step 2: Pull the computed B2 value from the sheet**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Screen", "range": "B2", "include_grid_data": false }`

- [ ] **Step 3: Diff the structures**

Parse the B2 value as JSON, then compare object equality with the fixture. The diff is a manual eyeball check this time — focus on:
- Same key set at every level.
- `options` value equals `"Semua◆[CC_LIST]"` (token preserved).
- `rowHeader`/`rowStartData` are numbers, not strings. (If the sheet returns `"8"` instead of `8`, the JSON output will be `"rowHeader":"8"`. If so, in Step 1 of Task 4 ensure cols AA/AB were written as numeric values, not strings — the JSON sample uses `8` not `"8"`. If they ended up as strings, re-run Task 4 Step 1 passing numbers.)

If a mismatch is found, identify the source (formula vs data) and fix at the source. No fixture edits to mask sheet bugs.

- [ ] **Step 4: Commit the fixture**

```bash
git add json/web-screen-patrol-report.expected.json
git commit -m "feat(web-builder): patrol report JSON fixture"
```

---

## Task 7: Define `salesPerformance` page and confirm pattern generalises

**Files:**
- Modify (via MCP): tab `Web Screen` rows 7–10
- Create: `json/web-screen-sales-performance.expected.json`

- [ ] **Step 1: Write the salesPerformance header row (row 7)**

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "A7:AE7",
  "data": [[
    "salesPerformance","","","","JSON--","Displayed",
    "","","","","","","","","","","","","","",
    "Sales Performance","ChartLine","/sales/performance","salesMarketing","https://docs.google.com/spreadsheets/d/1B19envLgBiyxgM8MUKWNjxaIjQQ50M9mjkn-QgjAXtM/edit?gid=564995506#gid=564995506","C◆U◆D","","","","start","end"
  ]]
}
```

- [ ] **Step 2: Write the col B formula on B7**

Same formula as B2 but referencing row 7. Copy the formula text from Task 5 Step 1, change every `2` to `7` (`A2→A7`, `U2→U7`, etc.).

Tool: `mcp__gsheets__update_cells` to `B7` with the same long formula as Task 5 Step 1, every row index replaced 2→7.

- [ ] **Step 3: Write the 3 widget rows (rows 8–10)**

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web Screen",
  "range": "A8:T10",
  "data": [
    [1,"DROPDOWN","topbar","","","TRUE","region","Dashboard!B2","Choose region","Semua Region◆Jakarta◆Surabaya◆Bandung◆Medan","Region not found","outline","","","","","","","",""],
    [2,"SPACER","topbar","","","TRUE","","","","","","","","","","","","","",""],
    [3,"BUTTON_SUBMIT","topbar","","","TRUE","","","","","","","Apply","region","FilterIcon","mainContent","https://autsorz.consteon.ai/api/spreadsheet","Filter applied successfully.","Failed to load data.",""]
  ]
}
```

Notice the literal options on J8 — no `[CC_LIST]` here, since Region is not user CCs.

- [ ] **Step 4: Propagate D formula to D8–D10**

Same pattern as Task 4 Step 3, three separate `update_cells` calls or one `batch_update_cells`. Replace row indices.

- [ ] **Step 5: Verify B7 evaluates**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web Screen", "range": "B7", "include_grid_data": false }`
Expected: a JSON string for the salesPerformance leaf, with three widgets in `topbar.children`, `bottomBar.children` empty.

- [ ] **Step 6: Capture the fixture**

Create `json/web-screen-sales-performance.expected.json` mirroring `contoh json full.txt` lines 25–77 (the salesPerformance leaf), keeping the literal Region options.

- [ ] **Step 7: Eyeball diff sheet output vs fixture**

Same procedure as Task 6 Step 3.

- [ ] **Step 8: Commit fixture**

```bash
git add json/web-screen-sales-performance.expected.json
git commit -m "feat(web-builder): sales performance JSON fixture"
```

---

## Task 8: Read the current `Web JSON` schema before editing

Before touching `Web JSON!C2`, capture what's there so we can revert if needed.

**Files:**
- Modify: none yet (read-only step)

- [ ] **Step 1: Read existing Web JSON formula and headers**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web JSON", "range": "A1:C10", "include_grid_data": true }`
Expected: read the existing C-column formula and headers. Save the current formula text into a scratch note so it can be restored if needed.

- [ ] **Step 2: Read RBAC sources**

Tools: two `mcp__gsheets__get_sheet_data` calls in parallel, both with `include_grid_data: false`:
- `Otorisasi Menu Web` range `A1:Z20`
- `Otorisasi Cost Center 2` range `A1:Z20`

Confirm:
- Email column position (currently expected col D per spec).
- Menu/CC label row (currently row 1).
- TRUE/FALSE values are real booleans, not strings (`get_sheet_data` returns them as `True`/`False`).

If anything differs from the spec, **update the spec section "RBAC matrices"** first and then continue — don't silently work around it.

---

## Task 9: Install upgraded `Web JSON!C2` per-user spill formula

**Files:**
- Modify (via MCP): tab `Web JSON` cell C2

- [ ] **Step 1: Write the new spill formula**

Tool: `mcp__gsheets__update_cells`
Args:
```json
{
  "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY",
  "sheet": "Web JSON",
  "range": "C2",
  "data": [["=ARRAYFORMULA(MAP(B2:B100,LAMBDA(eml,IF(eml=\"\",\"\",LET(menuRow,MATCH(eml,'Otorisasi Menu Web'!D:D,0),menuFlags,INDEX('Otorisasi Menu Web'!E:Z,menuRow,0),menuLabels,'Otorisasi Menu Web'!E1:Z1,permittedMenus,TEXTJOIN(\"◆\",1,MAP(menuLabels,menuFlags,LAMBDA(lbl,flg,IF(flg=TRUE,lbl,\"\")))),ccRow,MATCH(eml,'Otorisasi Cost Center 2'!D:D,0),ccFlags,INDEX('Otorisasi Cost Center 2'!E:Z,ccRow,0),ccLabels,'Otorisasi Cost Center 2'!E1:Z1,ccList,TEXTJOIN(\"◆\",1,MAP(ccLabels,ccFlags,LAMBDA(lbl,flg,IF(flg=TRUE,lbl,\"\")))),permittedPages,FILTER('Web Menu 2'!K:K,ISNUMBER(SEARCH('Web Menu 2'!K:K,permittedMenus))),childrenStr,TEXTJOIN(\",\",1,MAP(permittedPages,LAMBDA(pageKey,SUBSTITUTE(VLOOKUP(pageKey,'Web Screen'!A:B,2,FALSE),\"[CC_LIST]\",ccList)))),\"{\"\"type\"\":\"\"MENU\"\",\"\"name\"\":\"\"Vertika Tekno Lokacipta\"\",\"\"description\"\":\"\"Electronic Distribution & Marketing Management System\"\",\"\"logoUrl\"\":\"\"\"\",\"\"email\"\":\"\"\"&eml&\"\"\"\",\"\"costCenters\"\":\"\"\"&ccList&\"\"\"\",\"\"footer\"\":\"\"Powered by Consteon\"\",\"\"children\"\":[\"&childrenStr&\"]}\")))))"]]
}
```

- [ ] **Step 2: Verify formula was set (not the evaluated value yet)**

Tool: `mcp__gsheets__get_sheet_data` with `include_grid_data: true` on `Web JSON!C2`.
Expected: `userEnteredValue.formulaValue` contains the spill formula above.

---

## Task 10: QA per-user output for two real users

**Files:**
- Create: `json/web-json-budi.expected.json`

- [ ] **Step 1: Pick two emails from `Otorisasi Menu Web`**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Otorisasi Menu Web", "range": "D1:D20", "include_grid_data": false }`
Pick the first two non-header emails. Call them `userA_email` and `userB_email` in this task.

- [ ] **Step 2: Ensure those emails are present in `Web JSON!B`**

Tool: `mcp__gsheets__get_sheet_data`
Args: `{ "spreadsheet_id": "14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY", "sheet": "Web JSON", "range": "B1:B20", "include_grid_data": false }`
If userA_email / userB_email are missing, append them at the bottom of col B using `update_cells`.

- [ ] **Step 3: Read the compiled C column for those users**

Tool: `mcp__gsheets__get_sheet_data`
Args: matching the rows of userA_email / userB_email in col C.

- [ ] **Step 4: Validate three things**

For each compiled JSON:
1. Parses as valid JSON (paste into a quick `JSON.parse` mental check or `node -e 'JSON.parse(`...`)'`).
2. `costCenters` value matches the user's TRUE columns in `Otorisasi Cost Center 2`.
3. The `[CC_LIST]` token is **not** present anywhere in the output. Every occurrence should have been substituted by the user's CC list. Within the Patrol Report leaf, `topbar.children[0].options` should now be `Semua◆<actual CC names>`.

If any of those fail, isolate cause by checking each step of the Web JSON formula in a scratch cell.

- [ ] **Step 5: Save the fixture for the first user**

Write the user A compiled JSON to `json/web-json-budi.expected.json` (rename if user A isn't budi; use whatever email you picked). This is the regression fixture going forward.

- [ ] **Step 6: Commit**

```bash
git add json/web-json-budi.expected.json
git commit -m "feat(web-builder): per-user web json fixture for user A"
```

---

## Task 11: Add documentation pointer to the spec

**Files:**
- Modify: `docs/superpowers/specs/2026-05-26-web-builder-sheet-design.md` — add the post-implementation status note.

- [ ] **Step 1: Append a status section at the bottom of the spec**

Edit the spec file to add:

```markdown
## Implementation status (2026-05-26)

Plan executed: `docs/superpowers/plans/2026-05-26-web-builder-sheet.md`. Tabs landed: `Web Widget`, `Web Screen`. `Web JSON!C2` upgraded. First two pages live: `patrolReport`, `salesPerformance`. Fixtures stored in `json/web-screen-*.expected.json` and `json/web-json-*.expected.json`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-26-web-builder-sheet-design.md
git commit -m "docs(web-builder): mark implementation milestone"
```

---

## Self-Review Notes

- **Spec coverage:** every spec section maps to a task — Web Widget (Task 1), Web Screen (Task 2), col D / col E formulas (Task 3), page authoring (Task 4 and Task 7), col B header formula (Task 5), Web JSON upgrade with `[CC_LIST]` (Tasks 8–9), per-user QA (Task 10), documentation hook (Task 11).
- **Placeholder scan:** every formula and every range/cell update is fully written out. No "fill in later" anywhere.
- **Type consistency:** the column mapping G–T is identical in Task 1, Task 3 Step 1, Task 4 Step 2, and Task 7 Step 3. The header row column count (31, A–AE) in Task 2 Step 3 matches what Task 4 Step 1 writes into row 2. Web JSON formula in Task 9 references `Web Screen!A:B`, which is exactly where Task 5 Step 1 stores the per-page JSON.
- **Migration safety:** existing `Web Screen 2`, `Component`, `Web JSON` (with old formula captured in Task 8 Step 1) are not destroyed — only `Web JSON!C2` is rewritten and we have its old text on hand.
- **Open items (deferred per spec):** performance benchmark and validation column. Acceptable to leave for the next iteration.
