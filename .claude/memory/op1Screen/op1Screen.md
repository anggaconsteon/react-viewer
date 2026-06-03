---
name: op1Screen sheet (agenia-demo-7 Proxy)
description: Live worker attendance/shift dashboard sheet. Spreadsheet ID, layout, data sources, and where the formula patterns live.
type: reference
originSessionId: 1e07e1d5-347f-4225-9467-ef62e00f1fc4
---
# op1Screen — Worker Live Dashboard

## Access

- **Spreadsheet URL:** https://docs.google.com/spreadsheets/d/18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg/edit?gid=1503242745#gid=1503242745
- **Spreadsheet ID:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`
- **Title:** `Salinan dari agenia demo-7 | Proxy`
- **Timezone:** Asia/Jakarta
- **Tab name:** `op1Screen`
- **Sheet ID:** `296861564` (gid)
- **Dimensions:** 24 cols × 13632 rows
- **Version tag (A1 line):** `●op1screen-version=2411.1●op1screen-sheet-dimensions=24x13632●`

## Role in the system

Per-worker live dashboard. Single subject (e.g. Bob Kosasih, NIP 123456). Renders:
- Current-week schedule (shift per day, Mon–Sun)
- Trailing 32-day check-in / check-out log
- Attendance statistics (Terjadwal, Bekerja, Lembur, WFH, Off, Libur, Resign, Sisa hari, Alpa, Cuti, CB, CM, Total cuti, IK, Ijin, Total ijin, Sakit, SD, Total sakit, Terlambat <5m / 5-15m / >15m, Plg awal …, etc.)
- Profile fields (NIP, Nama, Label, Phone, Email, Grade, Group, Division, Department, Section, Resign date, Company emails 1-3, Office phones, Status pegawai)
- Role-code mapping tables (`w-*` → 6-digit code, e.g. `w-security` → `301165`)
- Action codes (`check-in` 302001, `check-out` 302002, `clock-in` 302003, `clock-out` 302004)
- Theme JSON pull (themeName, primaryColor, bottomAppBarColor)

## Layout (column-by-column)

| Col | Purpose |
|-----|---------|
| A | Field labels (Version, Sheet dimensions, Theme JSON, Theme color hex/dec ×3) |
| B | Field values (theme colors, theme name, JSON string) |
| C | Action key (check-in / check-out / clock-in / clock-out / `w-*` role keys) |
| D | Code (3020xx for actions, 3010xx for roles) |
| E | Indonesian label for action / role |
| F | Alt role key (parallel mapping list) |
| G | Alt code (parallel mapping list) |
| H | Personal profile field name |
| I | Personal profile value |
| J | Role group label (Teammate / Buffer / Approver / Site / Schedule) |
| K | JSON array string of names per group (`["BSD","Bandung"]`) |
| L | JSON array string of IDs per group (`["47670566154242",…]`) |
| M | Date (row 3–9 = current week, rows 14+ = lookup schedule table) |
| N | Shift label for that date (VLOOKUP from M14:O75) |
| O | `"ddd, d-mmm - shiftLabel"` combined display string |
| P | Trailing 32-day date list (`TEXT(now()-n, "yyyy-mm-dd")`) |
| Q | Earliest `attendance-check-in` time that day (QUERY Event sheet) |
| R | Latest `attendance-check-out` time that day (QUERY Event sheet) |
| S | ARRAYFORMULA bulk concat `"day, dd-mmm \| in - out"` |
| T | Status label per row (Terjadwal/Bekerja/Lembur/WFH/Off/Libur/Resign/Sisa hari/Alpa/Cuti/CB/CM/Total cuti/IK/Ijin/Total ijin/Sakit/SD/Total sakit/Terlambat…/Plg awal…/C-in tanpa c-out/C-out tanpa c-in/Clk di luar jadwal/Terlambat/Pulang awal) |
| U | (formatting only) |
| V | Stat counter values (static demo data; formatted h:mm for time totals) |

## Data source

- **`Event` tab** = ledger of all worker events. Schema (relevant):
  - col F = ledger type (`attendance-check-in`, `attendance-check-out`, `request-leave`, `clock-in`, `profile`, `ktp`, `personal`, `profileSdm`, `acmeOutsourcing`, etc.)
  - col G = timestamp (`d-mmm-yyyy hh:mm:ss`)
  - First useful row: `Event!$F$5:$G`

## Sibling tabs worth knowing

- `JSON` — master JSON compiler (rows 5+, col B label + col C compiled JSON). op1Screen is NOT pulled by JSON tab in this spreadsheet (the tab is a live view, not a JSON producer).
- `op1` — provider/flag/cost-center config (different shape from op1Screen)
- `op1Script` / `op1Checker` / `op1History` / `op1RecentLedgers` — companion tabs to op1
- `Locale`, `ThemeVertika`, `ThemeAgenia`, `Channel`, `Service` — compiled JSON producers feeding `JSON` tab
- `Redirection` — IMPORTRANGE proxy table (used by JSON!C6 + similar live-pull formulas)

## Pattern reference

Canonical formula patterns now live at **`../patterns/sheet-formula-patterns.md`** (global lib, sheet-agnostic). Local pointer file: `formula-patterns.md` (same folder).

op1Screen is the **origin sheet** for those patterns — every formula in the lib was extracted from here.

## Last accessed

- 2026-05-20 — initial reverse-engineering, formula extraction via gsheets MCP `include_grid_data`
