# Spreadsheet SSOT Long-Term Memory

This file contains accumulated lessons, bug fixes, and architectural preferences for the Spreadsheet SSOT system. Agents must read this file using `recall-memory` before starting any task, and append to it using `update-memory`.

---

## Active Spreadsheets

**Legacy VTL master:** `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8`
**Current VTL master (2026-05-20 onward):** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` — refactor of legacy. Same tenant (VTL VID 84214220504259), same logo, same Dashboard child sheet `1FTaIA...K7Hb4A`. 42 tabs. See `.claude/tasks/sheet-deeplearn-14kDPqAw-2026-05-20.md` for full deep-dive.
Tenant: Vertika Tekno Lokacipta (field operations platform, Consteon/Adrifa E-Patrol)

---

## Sheet roles & IDs

| Sheet | sheetId | Role |
|---|---|---|
| `Component` | (unknown) | Component templates: col A=name, col D=param list (comma-sep), col E=templateJSON with `[PLACEHOLDER]` tokens |
| `Web Screen 2` | 1831821614 | Per-page config: B=pageKey, C=jabatan, D=section (topbar/mainContent/bottomBar), E=componentName, F-S=param values (14 max). T col = resolved JSON (MAP formula). U col = pageData JSON assembled per page+jabatan group (only topbar rows get value). |
| `Web Menu 2` | 1525024695 | Navigation tree: B=level(1/2/3), F=label, G=icon, H=path, I=urlSheet, J=parent, K=key. L col = level-3 detail JSON. M col = level-2 JSON (children from L). N col = level-1 JSON (children from M). NO pageData in this sheet. |
| `Web JSON` | 39406268 | Per-user output. Row 1: A="Tenant", B="Vertika Tekno Lokacipta". Row 2: A="Description", B="Field Operations Platform". Row 3: A="Logo Perusahaan", B=logoURL, D="Provider", E="Consteon". Row 5: headers (A="VID", B="Akun Gmail", C="JSON"). Rows 6+: one row per user. C6 = MAP formula (spills C6:C100). |
| `Otorisasi Menu Web` | (unknown) | RBAC: row 1 = headers. Col D = Akun Gmail (email). Col E:J = menu names (Dashboard, Workforce, Attendance, Operations, Reports, Request & Approval). Each cell = TRUE/FALSE per user. |
| `Otorisasi Cost Center` | (unknown) | RBAC: row 1 = headers. Col B = cost center name. Col C+ = email columns. Each cell = TRUE/FALSE (user belongs to that cost center). |

---

## Data flow

```
Component templates (col E = templateJSON with [PLACEHOLDER])
  + Web Screen 2 (E=componentName, F-S=param values)
  → T col: MAP formula resolves each row to JSON string
  → U col: MAP formula assembles {topbar, mainContent, bottomBar} pageData per (pageKey, jabatan) — only topbar rows get value

Web Menu 2 (navigation structure, jabatan-agnostic)
  → L/M/N cols: level 3→2→1 JSON, children chained
  → NO pageData here (architecture decision: jabatan-specific pageData injected at Web JSON layer)

Otorisasi Menu Web (user → permitted menus)
  + Otorisasi Cost Center (user → cost centers)
  + Web Menu 2 N col (level-1 menu JSON)
  → Web JSON C col MAP formula: per-user full JSON
```

---

## Web JSON C col formula (CURRENT, working)

Written to C6, spills C6:C100. Formula file: `file/webjson_c_formula.txt`

```
=MAP(B6:B100;LAMBDA(eml;IF(eml="";"";LET(
  q;CHAR(34);
  ccstr;IFERROR(TEXTJOIN("◆";TRUE;FILTER(
    'Otorisasi Cost Center'!$B$2:$B$200;
    INDEX('Otorisasi Cost Center'!$A$2:$Z$200;0;MATCH(eml;'Otorisasi Cost Center'!1:1;0))=TRUE
  ));"");
  mrow;MATCH(eml;'Otorisasi Menu Web'!$D:$D;0);
  children;IFERROR("["&TEXTJOIN(",";TRUE;MAP(
    FILTER(TRANSPOSE('Otorisasi Menu Web'!$E$1:$J$1);TRANSPOSE(INDEX('Otorisasi Menu Web'!$E:$J;mrow;0))=TRUE);
    LAMBDA(lbl;IFERROR(INDEX('Web Menu 2'!$N:$N;MATCH(1;('Web Menu 2'!$F:$F=lbl)*('Web Menu 2'!$B:$B=1);0));"{}"))))
  &"]";"[]");
  "{"&q&"type"&q&":"&q&"MENU"&q&","&q&"name"&q&":"&q&$B$1&q&","&q&"description"&q&":"&q&$B$2&q&","&q&"logoUrl"&q&":"&q&$B$3&q&","&q&"email"&q&":"&q&eml&q&","&q&"costCenters"&q&":"&q&ccstr&q&","&q&"footer"&q&":"&q&"Powered by "&$E$3&q&","&q&"children"&q&":"&children&"}"
))))
```

Output per user (example suryawdj@gmail.com):
```json
{
  "type": "MENU",
  "name": "Vertika Tekno Lokacipta",
  "description": "Field Operations Platform",
  "logoUrl": "...",
  "email": "suryawdj@gmail.com",
  "costCenters": "Induk◆Kantor Pusat◆Product Group",
  "footer": "Powered by Consteon",
  "children": [ <level-1 menu items with nested children> ]
}
```

**Status:** ✅ Working. C6:C100 spills correctly.

**Known minor issue:** Users with permitted menus that have no matching level-1 row in Web Menu 2 get `[{}]` in children instead of `[]`. Data gap, not formula bug.

---

## Web Screen 2 formulas (DONE ✅)

- **T2**: MAP formula, spills T2:T16 — resolves each component+params row to JSON string
- **U2**: MAP formula, spills U2:U16 — assembles `{topbar, mainContent, bottomBar}` pageData per (pageKey, jabatan) group; only topbar rows get non-empty value

Formula files: `file/t_map_formula.txt`, `file/u_formula.txt`

---

## Web Menu 2 formulas (DONE ✅)

- **L2**: MAP, spills L2:L200 — level-3 detail JSON (no pageData)
- **M2**: MAP, spills M2:M200 — level-2 JSON with children from L (no pageData)
- **N2**: MAP, spills N2:N200 — level-1 JSON with children from M (no pageData)

Architecture decision: Web Menu 2 = jabatan-agnostic navigation structure only. pageData injected at Web JSON layer (not yet wired).

---

## PENDING TASKS

### 1. Wire pageData into Web JSON C formula
Currently `children` array items come from Web Menu 2 N col — navigation JSON WITHOUT pageData.
Need to add `pageData` lookup from Web Screen 2 U col, keyed by `(pageKey=key, jabatan)`.

**Blocker:** User's jabatan per row not yet in Web JSON sheet. Need a "Jabatan" column in Web JSON (col D or E per user), or a separate mapping sheet.
**Outstanding question to ask user:** Where does each user's jabatan live / how to determine it?

### 2. Add Web Screen 2 rows for missing pages
Current Web Screen 2 only has rows for some pages. Missing pages → `pageData` = `{}`.
Pages to add: perubahanData, mutasi, phk, laporanPekerjaan, laporanInsiden, rekapAbsensi, rekapPayroll, operations pages, etc.

### 3. Web JSON pageData injection (depends on 1 & 2)
Once jabatan source known and Web Screen 2 has all pages:
- Per user: lookup jabatan → get pageData per permitted page from U col → inject into children items

---

## Key conventions

- `◆` = multi-value delimiter (e.g. costCenters)
- `in_ID` locale: `;` as function separator, `,` as decimal
- `CHAR(34)` → variable `q` for `"` in formula string output
- LET variable naming: avoid patterns matching cell refs (`A1`, `B2` etc.) — use 4+ chars
- MAP+LAMBDA+IF+LET = 4 opens → `))))` at end
- Formula files stored in `file/` directory of project

---

## MCP tool gotcha (CRITICAL)

When writing formula via `mcp__gsheets__update_cells` data parameter:

- **CORRECT:** `[["=FORMULA_BODY"]]` — plain `"` closes JSON string, `]]` closes 2D array
- **WRONG:** `[["=FORMULA_BODY\"]]` — `\"` is escaped quote INSIDE string, string never closes → API error
- **WRONG:** `[["=FORMULA_BODY"]]]` — 3 closing brackets, invalid JSON

The `◆` char passes as Unicode `\u25c6` or directly — both work.

---

### Lesson: HR Process-flag dispatch pattern (Pendaftaran / Perubahan / PHK / Mutasi)
- **Context**: 2026-05-13 deep-dive of VTL spreadsheet (1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8).
- **Wrong**: Assume HR transaction tabs are flat data tables.
- **Good**: Every HR tab uses col B=Process (TRUE/FALSE) + last col = ◆-joined payload string `<action>◆<tenantVID>◆<field1>◆<field2>◆...`. Action prefixes: `new` (Pendaftaran), `Perubahan` (Perubahan Data), `Status` (PHK, Mutasi). Payload field order matches column header text 1:1. RPA bot reads payload when Process flips TRUE, then unsets Process + updates Status update col.
- **Date**: 2026-05-13

### Lesson: D tab is the RPA dispatch hub with ★ separator
- **Context**: Deep-diving the D tab during VTL SSOT analysis.
- **Wrong**: Treat D as scratch / debug sheet.
- **Good**: D aggregates payloads from all HR tabs grouped by action lane (col E=PegawaiBaru, F=UpdateData, G=PHK, H=mutasi, I=checker, K=Trickle down). col B=Presensi Hari Ini list using ★ (U+2605) as field delim — DIFFERENT from ◆ payload delim. Schema for K col: vid★name★cc★site★wilayah★jabatan★status joined by ◆ for multi-row.
- **Date**: 2026-05-13

### Lesson: Multi-delimiter inventory — never strip blindly
- **Context**: Found multiple delim chars across tabs during deep-dive.
- **Wrong**: Assume ◆ is the only delim.
- **Good**: Inventory: ◆ U+25C6 (primary, payloads/costCenters), ★ U+2605 (D tab field sep), ▶ U+25B6 (legacy widget registry, old spreadsheet), ◼ U+25FC (Filter tab CC list), ☆ U+2606 (Filter tab alt joiner), 🠈/🠊 (UI button label arrows only, not data). Pick the right delim per consumer; do not strip without confirming target.
- **Date**: 2026-05-13

### Lesson: Versioned tabs — v1 deprecated but kept (Web Menu, Web Screen, Otorisasi Cost Center)
- **Context**: Discovered duplicate "Web Menu" + "Web Menu 2", "Web Screen" + "Web Screen 2", "Otorisasi Cost Center" + "Otorisasi Cost Center 2".
- **Wrong**: Treat v1 and v2 as equivalent or edit v1.
- **Good**: v1 tabs are deprecated fossils. ACTIVE: Web Menu 2 (hierarchical L/M/N formulas), Web Screen 2 (component-driven 14-param resolver), Otorisasi Cost Center 2 (user-per-row matrix). Read v1 for reference; never write to v1.
- **Date**: 2026-05-13

### Lesson: Component tab placeholders use [BRACKET_TOKEN] not ◀N▶ / ◁N▷
- **Context**: Inspecting Component tab templateJSON during deep-dive.
- **Wrong**: Conflate Component placeholders with widget DSL tokens (◀N▶ = system stream, ◁N▷ = form input).
- **Good**: Component tab uses bracketed-token placeholders: [ALIGNMENT], [KEY1], [PLACEHOLDER1], [OPTION1], [FETCH_URL], [CENTER_LAT], [CUSTOM_JSON], etc. Different layer from widget DSL. Web Screen 2 T col resolves them via SPLIT(Component!D, ", ") + 14x SUBSTITUTE chained in LET.
- **Date**: 2026-05-13

### Lesson: Cost Center URL bundle order is fixed (7 menu slots)
- **Context**: Reading Cost Center + Site tab col G ◆-joined URL bundles.
- **Wrong**: Assume URL order is arbitrary.
- **Good**: Fixed 7-slot order matching header: # Admin ◆ # Absensi ◆ # Rekap Absensi ◆ # Rekap Payroll ◆ # Presensi Hari Ini ◆ # Laporan Pekerjaan ◆ # IT Admin. Empty slots leave consecutive ◆◆. Both Cost Center (cols H-N) and Site (cols Q-W) repeat the same URLs in individual cols.
- **Date**: 2026-05-13

### Lesson: VID is 14-digit universal entity ID, used across all entity types
- **Context**: Found 14-digit numeric IDs in Pegawai, Klien, Cost Center, Site, Profil Perusahaan.
- **Wrong**: Treat VID as per-table primary key.
- **Good**: VID = single universal ID space. Tenant VID 84214220504259 (Vertika Tekno Lokacipta) appears baked as literal in HR payloads. Cost Center VIDs (VTL): Induk 84214220504259 (same as tenant — root), Kantor Pusat 32639062303108, Product Group 83674161979544. When writing HR payload formulas, the tenant/CC VIDs are spreadsheet-baked literals, NOT session tokens.
- **Date**: 2026-05-13

### Lesson: Pegawai Filter uses Google QUERY syntax in helper cells
- **Context**: Pegawai Filter tab P1 cell holds query string.
- **Wrong**: Reimplement filter logic in MAP/LAMBDA.
- **Good**: Pegawai Filter uses: select * where LOWER(C) = LOWER('active') and 1=1 Order by H Asc — Google QUERY string. Filter state lives in row 1 (Status, Site, Cost Center cells), then injected into query string. Reuse this pattern for filtered views rather than reinventing.
- **Date**: 2026-05-13

### Lesson: Per-user proxy spreadsheet ≠ master SSOT
- **Context**: Deep-dive of `1xk_p10C303QWJQq7h435dVXrQaXsXRZQ9IYjO1lYQGU` (Agenia Demo-7 proxy). Same 58-tab template as op1Screen sheet `14-pQyZfq28kXGCSe0Ys0ue2IiqN3PKFjSmeYRshzHk4`.
- **Wrong**: Assume any Consteon sheet with `op1Screen`/`Widget` tabs is a master SSOT.
- **Good**: Two distinct sheet kinds: (a) **master SSOT** (VTL `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8`) — admin/web UI, RBAC, Pegawai master, HR Process flags; (b) **per-user proxy session** (one sheet per mobile user; agenia-demo7 family) — mirrors mobile state, decrypts inbound ledger, queues outbound. Proxy has Widget(172)/op1Screen/op1Script/Event/InLedger/OutLedger but NO Pegawai/RBAC. Identify by: Settings tab has crypto keys, Keys tab points to master LIF, op1 tab holds single-user config, Event tab holds single current event.
- **Date**: 2026-05-13

### Lesson: Expanded delimiter inventory (proxy layer)
- **Context**: Proxy sheet uses more sigil chars than VTL master.
- **Wrong**: Apply only ◆/▶/★/◼ delimiter set.
- **Good**: Full proxy inventory: ● U+25CF (control-block kv `●vid=...●user=...●`), ◻ U+25FB (log record separator), ◼ U+25FC (log field sep INSIDE record), ①-⑳ U+2460+ (row-marker prefix), ☆ U+2606 (VID-label binder `VID☆Name`), ⬤ U+2B24 (section break/event terminator), ◇ U+25C7 (ledger action sep `report◇daily`, `approve-final◇leave`), ★ U+2605 (checksum-name binder UpdateHistory + D-tab field sep in VTL). System.J15 (or similar cell) literally lists the allowed sigil inventory — read this cell as ground truth before adding new delims.
- **Date**: 2026-05-13

### Lesson: Event payload encoding pattern (mobile → spreadsheet)
- **Context**: Decoding Event!C1 in proxy sheet.
- **Wrong**: Treat encrypted payloads as opaque.
- **Good**: Mobile submits payload prefixed with `0` (encrypted marker) as `0<action>◆<ts>◆<type>◆<QR>◆<lat>◆<lng>◆◆<country>◆<postal>◆<province>◆<kab>◆<kec>◆<village>◆<street>◆<#>◆<loc-flag>⬤`. Event tab formulas strip leading `0`, split into 16 fields, then build log record `01<ts>◼<VID>◼<SiteVID>◼log◼<position>-<action>◼<locName>◼<QRtoken>◼[lat,lng]◼<imgURL>◼<address>◻<header VID☆Name records>◻<rowNum☆excelDate>`. Outbound envelope adds prefix `<TTL>◆<txID>◆<SiteVID>◆◆<log>◆`. Master log corpus = `◻`-join of all events in System.B1.
- **Date**: 2026-05-13

### Lesson: Plug tab col O = pre-assembled VTL workflow JSONs
- **Context**: Looking for where per-action screens live in proxy.
- **Wrong**: Search op1Screen for ApproveFinal screens.
- **Good**: `Plug` tab col O holds the full JSON for VTL sub-screens: `vertikaTeknoLokaciptaApproveFinal{Attendance,Backup,DayOff,Leave,Overtime,SickLeave,Trip}`, `LogHistory`, `LogPresensi`, `LogReport{Briefing,Complaint,Daily,Inspection,...}`. Each has tableSearch widget pointing to `vtl.workforce` (external master query), DRD dropdown, dateTime fields, GET_IMAGES, RBT savesend with `flag:approve-final-X` and `route:vertikaTeknoLokacipta`. These are jabatan-agnostic templates — RBAC enforced at master master, not proxy.
- **Date**: 2026-05-13

### Lesson: Approval subsystem = Otorisasi Approval + Approval Mapping + _Helper Approval
- **Context**: 2026-05-19 re-scan VTL spreadsheet, 4 new tabs since 2026-05-13.
- **Wrong**: Treat approval routing as part of generic Otorisasi RBAC.
- **Good**: 3-tab pipeline. (1) `Otorisasi Approval` (input): cols A=#, B=VID, C=Nama-NIP, D=Status, E-N=Level 1..10 — per user, each level cell holds Cost Center name or `all-cost-center`. Sparse: user fills only the levels relevant to them. (2) `_Helper Approval` (staging): cols A=Per-Row Rumus, B=Per-Row CC, D=All-CC × Level, E=Chain × Level, G=Dropdown CC Options, H=Detected Level Count. D/E grow per level row (10 rows = 10 levels). G2=`all-cost-center` sentinel; G3+=actual CC names from Cost Center tab. (3) `Approval Mapping` (output): cols A=VID, B=Nama, C=VID Cost Center (◆-joined), D=Cost Center (◆-joined), E=Rumus — final assembled JSON-like routing chain.
- **Date**: 2026-05-19

### Lesson: Approval Rumus DSL = [[chain1],[chain2],...] with ◀7▶◼<CC_VID>◁N▷◼<STATUS>
- **Context**: Reading Approval Mapping col E during 2026-05-19 deep-dive.
- **Wrong**: Treat the rumus string as opaque text or as widget DSL.
- **Good**: Outer `[[...],[...]]` = list of approval chains per CC scope. Each inner `[...]` = ONE chain. Inside chain, comma-joined steps: `◀7▶◼<CC_VID>◁1▷◼<STATUS>,◁2▷◼<STATUS>,...`. Tokens: `◀7▶` = system stream token (approval level slot index/route marker, NOT user input), `◼` U+25FC = intra-record field separator (same as proxy log delim), `◁N▷` = form input slot for level N approval action, `<STATUS>` = `APPROVED` | `PENDING`. `all-cost-center` keyword in Otorisasi Approval expands to ALL active CC VIDs at runtime. Chain progression: previous levels marked `APPROVED`, current pending level marked `PENDING`. Helper col E ("Chain × Level") shows the trailing pattern for level N.
- **Date**: 2026-05-19

### Lesson: System tab is sparse — most values offset, not row-1/col-A
- **Context**: 2026-05-19 read System!A1:O20, only A1:I2 populated, mostly empty.
- **Wrong**: Look for tenant config in A1:B5 like normal config sheets.
- **Good**: System tab populated at offset cols F-I, not A-B. Known cells: F1=spreadsheet_id `1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A` (Dashboard child sheet), G1=tenant name `Vertika Tekno Lokacipta`, H1=tenant VID `84214220504259`, F2=`attendance` action key, G2=`auz1` (tenant short-code?), H2=`# Absensi` menu label, I2=`7,00` (id_ID decimal = 7.0). When reading System tab, scan WIDE not from origin.
- **Date**: 2026-05-19

### Lesson: Konfigurasi App = per-user feature flag matrix
- **Context**: Discovered Konfigurasi App tab during 2026-05-19 deep-dive.
- **Wrong**: Treat as global app config.
- **Good**: Row 2 = headers grouped under banner row 1 ("Pengajuan" col R, "Persetujuan" col V). Cols: A=#, B=VID, C=Status, D=NIP, F=Varian posisi, G=Timezone (WIB/WITA/WIT), H=Check in/out, I=Status, J=Tracking, K=Report, L=Time sheet, N=Checker, O=Rekruter, P=Interviewer, R=Cuti (Pengajuan), S=Expense (Pengajuan), T=Pinjaman (Pengajuan), V-X=same triple under Persetujuan. Each cell = action key (e.g. `request-leave`, `report`, `active`) or `--` (not enabled). Per-user per-feature switch table.
- **Date**: 2026-05-19

### Lesson: Otorisasi vs Kewenangan vs Otorisasi Checker — three different RBAC scopes
- **Context**: 3 similar tabs found 2026-05-19, need to disambiguate.
- **Wrong**: Assume all three are equivalent RBAC.
- **Good**: (1) `Otorisasi` (col A1=FALSE process flag, cols B=Process, C=VID, D=Nama-NIP, E=Status, F=ponsel, G=Jabatan, H=CC, I=Site, J=Panic Button Receiver, K=Announcement Broadcast, L=Checker, M=Reset, N+=Approval/Monitoring/Reporting/Patrol). Per-user feature assignment with process-flag dispatch. (2) `Kewenangan` (similar cols but adds Akun Email, Zona, Approval Leave) — appears to be a NEWER/SUCCESSOR draft of Otorisasi but mostly empty rows. (3) `Otorisasi Checker` (A1=TRUE flag, cols match Otorisasi but Nama-NIP holds 16-digit KTP/NIK not internal NIP) — specifically for external/contractor checker assignments. Action keys like `checker-back-multiple-qr-photo` and `checker-lqr-back-multiple-qr-photo`.
- **Date**: 2026-05-19

### Lesson: Web URL tab has dual-layout — left block (A-D) per-CC menu links, right block (H-J) per-CC primary URL bundle
- **Context**: Reading Web URL during 2026-05-19 deep-dive.
- **Wrong**: Assume single layout `# | CC | Menu | URL`.
- **Good**: Cols A-D: per-row (CC, Menu, URL) entries — flat list. Cols H-J on the SAME rows: a SECOND independent listing (CC, Menu/`# Admin`, URL) for primary admin sheet per cost center. The 4 admin spreadsheet IDs that appear: `1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A` (Induk Admin), `1XTomLvkt3FbPOI6cJWS6mFHzxQDHxv1qQvs7ulKnI4M` (Kantor Pusat Admin), `1yhRupdq0RabucCMpW0gR7wRTLIuMgZBd3O8CArfhO2Q` (Product Group Admin), plus per-menu sheets `1r2cZvs0...` (Log Presensi), `1BXA0naH...` (Laporan Pekerjaan), `18ohF8BQ...` (Daftar Pegawai). Treat as TWO joined tables in one sheet, not one wide table.
- **Date**: 2026-05-19

### Lesson: JSON tab = name → JSON registry (legacy lookup, not auto-generated)
- **Context**: 2026-05-19 found `JSON` tab alongside `Web JSON` / `Web Screen 2`.
- **Wrong**: Confuse with Web JSON (per-user assembled output) or Web Screen 2 (per-page resolver).
- **Good**: JSON tab is a small lookup: A=Name (e.g. `logPresensi`), B=JSON (full pre-assembled page JSON string). Hand-edited or legacy. Contains the FULL inline JSON for a screen (TOPBAR + SPREADSHEET + BOTTOMBAR with DROPDOWN options, FETCH_CONTENT/SUBMIT URLs, cell-binding like `Filter Presensi!B7`). Use as reference fixtures, not as the SSOT generation pipeline. Modern flow goes Component → Web Screen 2 T/U → Web JSON C.
- **Date**: 2026-05-19

### Lesson: VTL master refactor (2026-05-20) — new sheet `14kDPqAw...` supersedes `1uWKx...`
- **Context**: Deep-dive 2026-05-20 of `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`. Same VTL tenant + logo + Dashboard child as legacy `1uWKx...`.
- **Wrong**: Treat the new sheet as a different tenant or sibling clone.
- **Good**: It's the refactored CURRENT VTL master. Adds 9 tabs over legacy: `Jabatan Hirarki`, `Konfigurasi Approval Modul`, `Web Menu3 ` (trailing space), `helper dashboard`, `Dasbor Umum`, `Location`, `LQR`, `Print - 2 - 16QR per page`, `Kuota`. Web Menu 2 still present alongside Web Menu3 — migration likely in-flight. Settings!A1=#REF! broken. RPA tab empty placeholder.
- **Date**: 2026-05-20

### Lesson: Web Menu3 (trailing space) = flat menu schema replacing Web Menu 2 L/M/N chain
- **Context**: New tab `Web Menu3 ` in 14kDPqAw sheet (NOTE: trailing space in tab name).
- **Wrong**: Assume Web Menu 2 hierarchical L/M/N MAP-chain is still authoritative.
- **Good**: Web Menu3  flattens nav: col A holds full self-contained JSON per menu node (e.g. `{"label":"PHK",...,"parent":"Mutasi"}`), cols C-K hold flat metadata (Main/Sub/Detail Menu, URL, Path, Icon, Parent, Key, Label). No level-chained formulas. Children resolved at Web JSON assembly. PHK now nests under Mutasi (parent fix vs legacy direct Workforce child). Tab name has trailing space — always quote when addressing via `sheet:"Web Menu3 "`.
- **Date**: 2026-05-20

### Lesson: Approval pipeline now has 3 inputs (added Konfigurasi Approval Modul)
- **Context**: New `Konfigurasi Approval Modul` tab in 14kDPqAw sheet supplements existing Otorisasi Approval + _Helper Approval.
- **Wrong**: Assume per-user Otorisasi Approval alone drives the rumus.
- **Good**: 3-input pipeline now: (1) `Konfigurasi Approval Modul` per (CC, fitur) policy template with simpler ordinal DSL `[[1, PENDING, , , , ], [2, PENDING, , , , ], ...]` — 6-slot inner array (level, status, 4 reserved). (2) `Otorisasi Approval` per-user × level → CC scope. (3) `_Helper Approval` staging matrix produces final per-user rumus in `Approval` output tab. Output DSL unchanged: `[[◀7▶◼<CC_VID>◁N▷◼<STATUS>,...],...]`.
- **Date**: 2026-05-20

### Lesson: Jabatan Hirarki = ordinal w-* role rank (was inside Posisi matrix)
- **Context**: 14kDPqAw extracts hierarchy out of Posisi industry-matrix into its own ordinal list.
- **Wrong**: Conflate with Posisi industry × role enable matrix.
- **Good**: Jabatan Hirarki = pure ordered rank list. Cols A=#, B=Jabatan code. Order top→bottom: w-ceo, w-bod, w-director, w-management, w-general-manager, w-senior-manager, w-manager, w-hr, w-hr-admin, w-payroll, w-trainer, w-secretary, w-finance, w-general-affair, w-administration, w-accounting, w-crew, w-tax, ... Use for supervisor-level comparison logic; Posisi still drives industry-specific enable flags.
- **Date**: 2026-05-20

### Lesson: Location + LQR + Print = geo/QR subsystem (TPI-* sub-points, `0l<40hex>` LID prefix)
- **Context**: New triple of tabs in 14kDPqAw for QR-based location attendance.
- **Wrong**: Look in Site tab for QR/lat-long.
- **Good**: `Location` row 1 = process flag at A1 + "Print LQR" trigger at E1, header row 2: `# | Site flag | Lattitude | Longitude | ID/Nama Lokasi | LID | Radius (m) | Map | All`. `LQR` cols H/I/J per row = `<TPI-name> | 0l<40-hex LID> | <~140-char QR token>`. LID prefix `0l` = location token marker. TPI-* prefix = site sub-points (Absensi, Parkiran Motor/Mobil Tamu/Mobil Manajemen, Office, Smoking Area, Collecting Tank, Loker Karyawan, Gedung MPB, Loading Warehouse Belakang). `Print - 2 - 16QR per page` batches 16 LQRs per A4 sheet.
- **Date**: 2026-05-20

### Lesson: Kuota tab = monthly headcount × month-bundle ledger
- **Context**: New `Kuota` tab tracks VTL subscription usage.
- **Wrong**: Treat as free-text billing notes.
- **Good**: Row 2 header: `Periode | Jumlah Pegawai Awal Bulan | Penambahan | Pengurangan | Pembelian Kuota | (units row) | Bonus | Kuota Terpakai | Kuota Tersedia`. Units = Pegawai × Bulan. Example: Jan-2026 buys 50 pegawai × 12 bulan = 600 unit, decrements ~50 unit/month → Apr-2026 shows 450 remaining. Period codes use id_ID short month (Okt, Nov, Des, Jan, etc.).
- **Date**: 2026-05-20

### Lesson: 14kDPqAw Web JSON formula still references Web Menu 2 N col (not Web Menu3)
- **Context**: 2026-05-20 live read of Web JSON!C6 formula in new VTL master `14kDPqAw...`.
- **Wrong**: Assume new Web Menu3 (flat schema) supersedes Web Menu 2 hierarchical L/M/N chain in the active pipeline.
- **Good**: Web JSON C6 STILL pulls from `'Web Menu 2'!$N:$N` (Main JSON col) via label match against row 2 of `Otorisasi Menu Web` (header offset fixed from legacy row 1). Web Menu3 exists in parallel as future replacement but unwired. Web Menu 2 itself has the PHK-under-Mutasi parent fix already merged in N col — so the user-visible output matches Web Menu3 design without needing the cutover yet. Migration to Menu3 = pending.
- **Date**: 2026-05-20

### Lesson: Approval rumus generator uses _Helper Approval static matrix, NOT Konfigurasi Approval Modul
- **Context**: 2026-05-20 verifying how Approval col E rumus is assembled in 14kDPqAw sheet.
- **Wrong**: Assume Konfigurasi Approval Modul (per-CC × fitur policy with `[[1,PENDING,,,,,]...]` DSL) drives the final rumus.
- **Good**: Konfigurasi Approval Modul is currently UNWIRED (only 4 seed rows: KP/PG × leave/overtime). Final Approval rumus assembled from `_Helper Approval` 10-row precomputed template matrix: A=Per-Row Rumus (single-CC×single-level), D=All-CC × Level (rows 1-10 with 3-VTL-CC permutations), E=Chain × Level suffix, G=Dropdown CC, H=10 (level cap). Otorisasi Approval per-user assignment is also sparse (5 users, single-level only) → current output only single-level rumus tested. Konfigurasi Modul = planned future merge into Helper template trimming.
- **Date**: 2026-05-20

### Lesson: 14kDPqAw spreadsheet IS the Induk CC Admin master (renamed from 1uWKx legacy)
- **Context**: Reading spreadsheet properties.title during 2026-05-20 deep-dive.
- **Wrong**: Treat 14kDPqAw as a new sibling/parallel sheet to 1uWKx legacy.
- **Good**: Title = `Salinan dari Vertika Tekno Lokacipta Induk # Admin` ("Copy of VTL Induk # Admin"). It IS the Induk CC admin master, refactored copy of legacy. Same VTL VID, same Dashboard child sheet `1FTaIA...K7Hb4A`. Locale in_ID, TZ Asia/Jakarta, autoRecalc ON_CHANGE. Web JSON sheet = 604 rows × 10 cols, sheetId 39406268. Treat 14kDPqAw as authoritative going forward.
- **Date**: 2026-05-20

### Lesson: Posisi tab = jabatan taxonomy matrix (industry × role)
- **Context**: Reading Posisi during 2026-05-19 deep-dive.
- **Wrong**: Treat as a flat jabatan list.
- **Good**: Wide matrix. Row 1 = TRUE/FALSE flags per industry (col A = "Pilih posisi 🠊", cols B+ = enable flag). Row 2 = industry headers: Semua, General, Cleaning Service, Security, School, Airline, Call Center, Parking, Hotel, Building, Bank, Hospital, Consultant, Sales, Warehouse, Bakery. Rows 3+ = role codes prefixed `w-` per industry column (e.g. `w-ceo`, `w-security-danru`, `w-bank-teller`). Used as picker source for jabatan assignment. The `🠊` arrow in A1 = UI hint sigil, not data.
- **Date**: 2026-05-19

---
