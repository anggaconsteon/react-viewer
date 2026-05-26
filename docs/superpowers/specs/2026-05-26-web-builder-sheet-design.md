# Web Builder Sheet Design (VTL)

**Date:** 2026-05-26
**Target spreadsheet:** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` (VTL Master)
**Status:** Approved design, ready for plan

## Goal

Build a web-builder layer inside the VTL Master spreadsheet so a tenant admin can define web pages and their topbar/bottomBar widgets directly in the sheet. Compilation produces one nested JSON per user, matching the shape of `contoh json full.txt` (root `MENU` object with `children` carrying inline `pageData`). The pattern intentionally mirrors `op1Screen` so the team's mental model (header row + widget rows + formula-resolved JSON) carries straight over from mobile.

## Constraints unique to web (vs mobile op1Screen)

1. **One spreadsheet, many users.** mobile = 1 user / 1 sheet. Web JSON tab must spill per-user output over the email column.
2. **One user, many cost centers.** users can belong to multiple CCs (e.g., Pak Budi has access to Induk + Kantor Pusat + Product Group). Mobile = 1 user / 1 CC, no multi-CC concern.
3. **Three render zones per page** — topbar / mainContent / bottomBar. Mobile = single scroll list.
4. **Dynamic CC list in widget params.** dropdown options for cost-center filters must vary by user. Solved via a `[CC_LIST]` token substituted at compile time inside Web JSON.

## Architecture (3 layers)

```
Layer 1 — Page Definition (global, identical for all users)
  Web Widget    (template library, ~10–20 widget types initially)
  Web Screen    (header row + widget rows per page; col B header row carries full pageJSON)
                                  │
                                  │ pageJSON literals
                                  ▼
Layer 2 — RBAC Matrices (existing, no change)
  Otorisasi Menu Web              (user × menu group flags)
  Otorisasi Cost Center 2         (user × CC flags)
  Web Menu 2                      (menu hierarchy: parent / order / pageKey)
                                  │
                                  │ per-user permitted menus + CC list
                                  ▼
Layer 3 — Per-User Output Spill
  Web JSON      (one row per email, col C = compiled full MENU JSON)
                Compile substitutes [CC_LIST] with user's actual CC list and
                filters Web Menu 2 by the user's Otorisasi Menu Web row.
```

## Web Widget tab (new)

Mirrors `op1Screen!Widget` structure so the same agents/skills can read it.

| Col | Content |
|---|---|
| A | `widgetName` — lookup key (e.g. `DROPDOWN`, `DATE`, `SPACER`, `BUTTON_SUBMIT`) |
| B | `paramList` — informational CSV of which `[TOKEN]`s the template uses (for human readers; not consumed by formula) |
| G | Template JSON with `[TOKEN]` placeholders. Tokens chosen from the shared param mapping below. |

Templates we know we need at launch (from the reference JSON):

| widgetName | template (col G) |
|---|---|
| `DROPDOWN` | `{"type":"DROPDOWN","key":"[KEY]","cell":"[CELL]","placeholder":"[PLACEHOLDER]","options":"[OPTIONS]","emptyText":"[EMPTY_TEXT]","variant":"[VARIANT]"}` |
| `DATE` | `{"type":"DATE","key":"[KEY]","cell":"[CELL]","placeholder":"[PLACEHOLDER]","variant":"[VARIANT]"}` |
| `SPACER` | `{"type":"SPACER"}` |
| `BUTTON_SUBMIT` | `{"type":"BUTTON","variant":"outline","size":"icon","icon":"[ICON]","text":"[TEXT]","data":"[DATA]","onClick":{"type":"SUBMIT","url":"[API_URL]","method":"POST","target":"[TARGET]","onSuccess":{"toast":"[SUCCESS]","then":"[THEN]"},"onError":{"toast":"[ERROR]"}}}` |

Extending = add a row in Web Widget; no formula changes needed in Web Screen.

## Web Screen tab (new) — 1:1 mirror of op1Screen

Single tab. Two row types interleaved.

### Row layout

| Col | Header row (page anchor) | Widget row |
|---|---|---|
| A | `pageKey` (e.g. `patrolReport`) | order number (1, 2, 3, …) |
| B | **Formula** producing full pageJSON (gathers children from col E) | `widgetName` — VLOOKUP key into Web Widget |
| C | (empty / notes) | `section` — `topbar` / `bottomBar` |
| D | (empty) | **Formula** — VLOOKUP template + 13× SUBSTITUTE → resolved widget JSON |
| E | `JSON--` literal label | **Formula** — ARRAYFORMULA conditional concat (prepends `,` when `F=TRUE`) |
| F | `Displayed` literal label | `TRUE` / `FALSE` — per-widget on/off toggle |
| G–T | (empty) | Parameter values, ordered by shared param mapping below |
| U–AE | Page meta fields (label / icon / path / parent / src / permission / rowHeader / rowStartData / sheetName / topbarAlign / bottomAlign) | (empty) |

Header row is detected by `A <> ""` containing a non-numeric pageKey. Widget row is everything below until the next header row.

### Shared param column mapping (cols G–T)

Same convention across all widget rows. Each widget uses whichever subset its template references; unused columns stay blank.

| Col | Token | Used by |
|---|---|---|
| G | `[KEY]` | DROPDOWN, DATE |
| H | `[CELL]` | DROPDOWN, DATE |
| I | `[PLACEHOLDER]` | DROPDOWN, DATE |
| J | `[OPTIONS]` | DROPDOWN |
| K | `[EMPTY_TEXT]` | DROPDOWN |
| L | `[VARIANT]` | DROPDOWN, DATE |
| M | `[TEXT]` | BUTTON_SUBMIT |
| N | `[DATA]` | BUTTON_SUBMIT |
| O | `[ICON]` | BUTTON_SUBMIT |
| P | `[TARGET]` | BUTTON_SUBMIT |
| Q | `[API_URL]` | BUTTON_SUBMIT |
| R | `[SUCCESS]` | BUTTON_SUBMIT |
| S | `[ERROR]` | BUTTON_SUBMIT |
| T | `[THEN]` | BUTTON_SUBMIT |

14 substitutions total (one per column G–T), modeled on op1Screen's ~13-SUBSTITUTE chain.

### Page meta columns (header rows only, cols U–AE)

| Col | Field | Notes |
|---|---|---|
| U | `label` | menu label shown in nav |
| V | `icon` | icon name (Lucide name) |
| W | `path` | route path, e.g. `/patrol` |
| X | `parent` | parent pageKey, blank if root |
| Y | `src` | default spreadsheet URL (literal OR a `=VLOOKUP(…,'Cost Center'!…)` formula) |
| Z | `permission` | e.g. `C◆U◆D` |
| AA | `rowHeader` | optional |
| AB | `rowStartData` | optional |
| AC | `sheetName` | optional |
| AD | `topbarAlign` | `start` / `center` / `end` |
| AE | `bottomAlign` | `start` / `center` / `end` |

### Formulas

**Col D (widget row) — widget JSON resolver.** VLOOKUP into `Web Widget` then a fixed 14-step SUBSTITUTE chain (one per param column G–T). Pseudocode:

```
=IF(B{n}="","",
  SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
  SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
  SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
    VLOOKUP(B{n}, 'Web Widget'!$A:$G, 7, FALSE),
    "[KEY]",         G{n}),
    "[CELL]",        H{n}),
    "[PLACEHOLDER]", I{n}),
    "[OPTIONS]",     J{n}),
    "[EMPTY_TEXT]",  K{n}),
    "[VARIANT]",     L{n}),
    "[TEXT]",        M{n}),
    "[DATA]",        N{n}),
    "[ICON]",        O{n}),
    "[TARGET]",      P{n}),
    "[API_URL]",     Q{n}),
    "[SUCCESS]",     R{n}),
    "[ERROR]",       S{n}),
    "[THEN]",        T{n}))
```

Each row uses whichever subset of cols G–T its template references; unreferenced columns stay blank and SUBSTITUTE becomes a no-op for them.

**Col E — ARRAYFORMULA concat-ready, op1Screen exact translation:**

```
=ARRAYFORMULA(
  IF(ROW(D2:D10000)=ROW(D2), "JSON",
    IF(ISERROR(D2:D10000), "",
      IF(D2:D10000="", "",
        IF(F2:F10000<>TRUE, "", "," & D2:D10000)))))
```

`FALSE` in col F or empty col D both yield `""`, so disabled/empty rows silently drop out of the page assembly.

**Col B (header row) — full pageJSON assembler:**

```
=LET(
  startRow  = ROW() + 1,
  endRow    = startRow + MATCH("?*", A{startRow}:A$10000, 0) - 2,
  topbarStr = TEXTJOIN("", TRUE, FILTER(E{startRow}:E{endRow}, C{startRow}:C{endRow}="topbar")),
  bottomStr = TEXTJOIN("", TRUE, FILTER(E{startRow}:E{endRow}, C{startRow}:C{endRow}="bottomBar")),
  topbarChildren = IF(topbarStr="","",MID(topbarStr,2,50000)),
  bottomChildren = IF(bottomStr="","",MID(bottomStr,2,50000)),
  "{""label"":""" & U{row} & """,""icon"":""" & V{row} & """,""path"":""" & W{row}
  & """,""key"":""" & A{row} & """,""parent"":""" & X{row}
  & """,""pageData"":{""title"":""" & U{row}
  & """,""topbar"":{""alignment"":""" & AD{row} & """,""children"":[" & topbarChildren & "]}"
  & ",""spreadsheet"":{""id"":""mainContent"",""src"":""" & Y{row}
  & """,""permission"":""" & Z{row} & """"
  & IF(AA{row}<>"",",""rowHeader"":" & AA{row},"")
  & IF(AB{row}<>"",",""rowStartData"":" & AB{row},"")
  & IF(AC{row}<>"",",""sheetName"":""" & AC{row} & """","")
  & "},""bottomBar"":{""alignment"":""" & AE{row} & """,""children"":[" & bottomChildren & "]}"
  & "}}")
```

The MID-strip-comma trick (`MID(str, 2, 50000)`) is the same one used in op1Screen!B923.

`mainContent` is built directly from the meta columns; it is not a widget row, since the spreadsheet view itself is a single object, not a list.

## RBAC matrices (existing, no schema change)

- `Otorisasi Menu Web` — user × menu group flags. Stays the source of truth for **menu permission is global, not per-CC**. (Confirmed during brainstorm — Q1 answered A.)
- `Otorisasi Cost Center 2` — user × CC flags. Source of the per-user CC list.
- `Web Menu 2` — menu hierarchy (parent, order, pageKey). Used for the order in which permitted menus are emitted into `children`.

If a user matches a permitted menu, the compiled `children` entry uses the pageJSON cached in `Web Screen!B<header_row>`.

## Web JSON tab — per-user compile

Spill formula in `Web JSON!C2`. Each output row is the full root `MENU` object for that user, ready to ship.

```
=ARRAYFORMULA(MAP(B2:B100, LAMBDA(eml,
  IF(eml="", "", LET(
    menuRow  = MATCH(eml, 'Otorisasi Menu Web'!D:D, 0),
    menuFlags  = INDEX('Otorisasi Menu Web'!E:Z, menuRow, 0),
    menuLabels = 'Otorisasi Menu Web'!E1:Z1,
    permittedMenus = TEXTJOIN("◆", 1, MAP(menuLabels, menuFlags,
                       LAMBDA(lbl, flg, IF(flg=TRUE, lbl, "")))),

    ccRow     = MATCH(eml, 'Otorisasi Cost Center 2'!D:D, 0),
    ccFlags   = INDEX('Otorisasi Cost Center 2'!E:Z, ccRow, 0),
    ccLabels  = 'Otorisasi Cost Center 2'!E1:Z1,
    ccList    = TEXTJOIN("◆", 1, MAP(ccLabels, ccFlags,
                  LAMBDA(lbl, flg, IF(flg=TRUE, lbl, "")))),

    permittedPages = FILTER('Web Menu 2'!K:K,
                       ISNUMBER(SEARCH('Web Menu 2'!K:K, permittedMenus))),

    childrenStr = TEXTJOIN(",", 1, MAP(permittedPages, LAMBDA(pageKey,
      SUBSTITUTE(
        VLOOKUP(pageKey, 'Web Screen'!A:B, 2, FALSE),
        "[CC_LIST]",
        ccList
      )
    ))),

    "{""type"":""MENU"",""name"":""Vertika Tekno Lokacipta"","
    & """description"":""Electronic Distribution & Marketing Management System"","
    & """logoUrl"":"""",""email"":""" & eml & ""","
    & """costCenters"":""" & ccList & ""","
    & """footer"":""Powered by Consteon"","
    & """children"":[" & childrenStr & "]}"
  )))))
```

The nested children (parent groupings like `Sales & Marketing > Sales Performance`) come from the existing `Web Menu 2` L/M/N spilled formulas — same pattern already in use, no rework required.

## Token substitution — `[CC_LIST]`

Single token at launch.

- Author intent: anywhere in a widget's param value (typically `Web Screen!J` for `DROPDOWN.OPTIONS`) write `[CC_LIST]`. Literal text mixes freely, e.g. `Semua◆[CC_LIST]`.
- Resolution point: **Web JSON compile only.** `Web Screen!B` carries the unresolved pageJSON; the `SUBSTITUTE(…, "[CC_LIST]", ccList)` runs once per user inside the spill formula.
- Result example: Pak Budi (Induk + KP + PG) sees `Semua◆Induk◆KP◆PG`; Pak Sari (Induk + PG) sees `Semua◆Induk◆PG`.
- Pages that need a static dropdown (e.g. Region) just put the literal `Semua Region◆Jakarta◆…` in col J — no token, SUBSTITUTE is a no-op.

Adding more tokens later (`[CC_LIST_ALL]`, `[USER_NAME]`, etc.) = add one more SUBSTITUTE in the Web JSON spill. Deferred per YAGNI.

## Migration notes

- `Web Screen 2` (current 14-param flat tab) is **superseded** but kept until the first 3–4 pages are ported and validated. Don't delete.
- `Component` tab is **superseded by Web Widget**. Same idea, different layout — old tab kept read-only for reference until cutover is complete.
- `Web JSON` tab keeps its row schema (header + per-user rows); col C formula is the only thing that changes.
- v1 tabs (`Web Menu`, `Web Screen`, `Otorisasi Cost Center`) untouched — fossils per existing convention.

## Open questions (defer to plan phase)

- Performance ceiling: how many users × pages can a single ARRAYFORMULA MAP sustain before recompute time becomes a problem? Plan should include a sanity benchmark.
- Validation: do we want a `Web Screen QA` helper column that flags rows where col B template references a `[TOKEN]` that the param-column position doesn't cover? Useful for tenants extending Web Widget.
- Per-CC URL override: deferred. Current model uses one URL + topbar CC filter widget. If a page legitimately needs different URLs per CC, the escape hatch is a formula in col Y (e.g. `=VLOOKUP("patrol", 'Cost Center'!A:N, 9, FALSE)`); we don't bake a token for it yet.

## Decisions log (from brainstorm)

- **Page variance dimension:** B — different default URL per CC, handled via topbar dropdown + backend filter, not by multiplying page rows.
- **Authoring profile:** C — hybrid. Tenant admin edits common cases; power users extend Web Widget templates.
- **Sheet layout:** C4 — pure op1Screen mirror (header row + widget rows; col D auto-resolved; col E ARRAYFORMULA concat; col F TRUE/FALSE toggle).
- **Menu RBAC scope:** A — global menu permission, independent of CC.
- **Token set at launch:** `[CC_LIST]` only.
