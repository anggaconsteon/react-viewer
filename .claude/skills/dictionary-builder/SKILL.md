---
name: dictionary-builder
description: Build a data-dictionary tab in the SSOT spreadsheet using the canonical 11-column template. Use whenever the user wants to document a schema, collection, widget, or DSL as a dictionary. Triggers include "/dictionary-builder", "buatkan dictionary", "bikin data dictionary", "dictionary untuk addToEvent", "dokumentasikan schema X", "tambah tab dictionary".
---

**critical**: Every dictionary tab MUST use the canonical 11-column header and the `═══ GROUP ═══` section-header convention. Do not invent columns. Match the existing dictionary tabs (Transaction, Request, Customers, ProgressBar_Tasklist) so all tabs stay uniform.

<what-to-do>

Build (or extend) a data-dictionary tab in the SSOT spreadsheet.

## 1. Gather inputs (ask only what is missing)

1. **Spreadsheet ID** — default to the active SSOT dictionary book `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw` unless the user names another.
2. **Tab name** — short, no spaces if possible (e.g. `addToEvent`, `Transaction`).
3. **Variant** — pick header style:
   - **Schema dictionary** (Firestore collection / table): first column = `Column # (Begin with 1)` + `Index` + `Index Type`.
   - **DSL / wire dictionary** (addToEvent, widget, etc.): first column = `Char Code` + `Required`. Add a `Token / Source` column at the end for the DSL token form (`◀N|T7|epoch▶`, `◁N▷`, `<no_request>`, literal).
4. **Field source** — where rows come from: user list, a local `json/*.json` file, an existing schema tab, or the canonical addToEvent dictionary (`reference_addToEvent_pattern.md` / `file/addToEvent guide.txt`).
5. **Grouping** — flat, or split into groups via section headers. Groups are free-form (META, CONTENT, ROUTE/TENANT, WORKFORCE, etc.).

## 2. Canonical headers (11 columns)

**Schema variant:**
```
Column # (Begin with 1) | Index | Index Type | Field Name | Label (EN) | Label (ID) | Data Type | Allowed Values | Description (EN) | Deskripsi (ID) | Example
```

**DSL/wire variant:**
```
Char Code | Required | Field Name | Label (EN) | Label (ID) | Data Type | Allowed Values | Description (EN) | Deskripsi (ID) | Example | Token / Source
```

Rules:
- `Index` = `TRUE` only for fields that are query/index keys; `Index Type` (`String`, etc.) only on those rows.
- `Required` = `TRUE` only for mandatory fields (addToEvent: `r ty t ts`); leave blank otherwise.
- `Allowed Values` = enum list comma-separated, or `—` if free.
- Always fill BOTH `Label (EN)`/`Label (ID)` and `Description (EN)`/`Deskripsi (ID)`. Bilingual is mandatory.
- `Example` = one concrete value.

## 3. Section headers

Put group dividers in column A only, rest of row blank, matching the `ProgressBar_Tasklist` tab:
```
═══ META (event-level) ═══
═══ CONTENT (per-doc) ═══
```
Use the `═` (U+2550) box-drawing char, three on each side.

## 4. Write sequence (gsheets MCP)

1. `mcp__gsheets__list_sheets` — confirm the tab does not already exist. If extending, read it first with `get_sheet_data` and append below the last row instead of overwriting.
2. `mcp__gsheets__create_sheet` — only when creating a new tab.
3. `mcp__gsheets__update_cells` — write the whole block as one 2D array, range `A1:K<lastRow>` (11 columns = A..K). Encode DSL symbols directly (`⭘ ◼ ◆ ◀ ▶ ◁ ▷ ═`); they are plain UTF-8.
4. `mcp__gsheets__get_sheet_data` — re-read the written range and verify row count + that symbols survived.

## 5. addToEvent reference rows (ready to reuse)

The `addToEvent` tab already exists with 34 fields in 4 groups. When asked for an event dictionary, mirror it:
- META: `r✅ fc tablevid p et ld ev`
- CONTENT: `ty✅ t✅ ts✅ ln lq i d cv cn av an sv sn cl rf`
- ROUTE/TENANT: `tv tn st nm ll`
- WORKFORCE: `VID n ci co is os ta`

(✅ = Required TRUE.) Full field meanings live in `file/addToEvent guide.txt` and memory `reference_addToEvent_pattern.md`. `et p ev ld` are spreadsheet-only (NOT Firestore doc fields).

## 6. After writing

Report in one line: tab name, sheetId, field count, group count. List any fields the user mentioned that lack a code/definition so they can decide.

</what-to-do>
