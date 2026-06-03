# Konfigurasi Modul Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buat tab `Konfigurasi Modul` di VTL master SSOT dengan MAP formula yang auto-generate approval rumus string per CC × modul.

**Architecture:** Tab baru `Konfigurasi Modul` di spreadsheet `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8`. Admin input col A-D (manual). Col E = MAP formula spill dari D2:D100 → generate `[[1, PENDING, , , , ], ...]` string. Locale in_ID (`;` function separator).

**Tech Stack:** Google Sheets MCP (`mcp__gsheets__create_sheet`, `mcp__gsheets__update_cells`, `mcp__gsheets__get_sheet_data`), in_ID locale formulas (MAP, LAMBDA, SEQUENCE, TEXTJOIN, ARRAYFORMULA, IF)

---

## Constants

```
SPREADSHEET_ID = "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8"
TAB_NAME       = "Konfigurasi Modul"
```

---

### Task 1: Buat tab `Konfigurasi Modul`

**Files:**
- Create: Tab `Konfigurasi Modul` via MCP

- [ ] **Step 1: Create sheet via MCP**

```json
mcp__gsheets__create_sheet({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "title": "Konfigurasi Modul"
})
```

Expected: Sheet created, sheetId returned.

- [ ] **Step 2: Verify tab exists**

```json
mcp__gsheets__list_sheets({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8"
})
```

Expected: `"Konfigurasi Modul"` muncul di list.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-05-19-konfigurasi-modul-approval.md
git commit -m "plan: add konfigurasi modul approval implementation plan"
```

---

### Task 2: Tulis header row A1:E1

**Files:**
- Modify: Tab `Konfigurasi Modul` row 1

- [ ] **Step 1: Write headers via MCP**

```json
mcp__gsheets__update_cells({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "A1:E1",
  "data": [["#", "Cost Center", "Modul", "Required Levels", "Rumus Modul"]]
})
```

Expected: Row 1 terisi 5 header.

- [ ] **Step 2: Verify headers**

```json
mcp__gsheets__get_sheet_data({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "A1:E1"
})
```

Expected: `[["#", "Cost Center", "Modul", "Required Levels", "Rumus Modul"]]`

---

### Task 3: Isi sample data admin A2:D6

**Files:**
- Modify: Tab `Konfigurasi Modul` rows 2-6

- [ ] **Step 1: Write data rows via MCP**

```json
mcp__gsheets__update_cells({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "A2:D6",
  "data": [
    ["1", "Induk",         "leave",   "3"],
    ["2", "Induk",         "expense", "2"],
    ["3", "Kantor Pusat",  "leave",   "3"],
    ["4", "Kantor Pusat",  "expense", "2"],
    ["5", "Product Group", "leave",   "2"]
  ]
})
```

Expected: 5 baris terisi.

- [ ] **Step 2: Verify data**

```json
mcp__gsheets__get_sheet_data({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "A2:D6"
})
```

Expected: 5 rows dengan data persis seperti di atas.

---

### Task 4: Tulis MAP formula di E2

**Files:**
- Modify: Tab `Konfigurasi Modul` cell E2

**Formula logic:**
- `MAP(D2:D100; LAMBDA(n; ...))` — iterate setiap nilai di col D
- `IF(n=""; ""; ...)` — guard: kalau D kosong → E kosong
- `SEQUENCE(n)` → array `{1;2;3;...;n}`
- `"["&SEQUENCE(n)&", PENDING, , , , ]"` → array of entry strings
- `TEXTJOIN(", "; TRUE; ARRAYFORMULA(...))` → join dengan `, `
- `"["&...&"]"` → wrap outer bracket

- [ ] **Step 1: Write formula via MCP**

```json
mcp__gsheets__update_cells({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "E2",
  "data": [["=MAP(D2:D100;LAMBDA(n;IF(n=\"\";\"\";\"|\"&TEXTJOIN(\", \";TRUE;ARRAYFORMULA(\"[\"&SEQUENCE(n)&\", PENDING, , , , ]\"))&\"|\")))"]
  ]
})
```

> **STOP** — Formula di atas menggunakan `|` sebagai placeholder bracket luar. Gunakan formula exact berikut (string dalam JSON harus escape `"`):

Formula actual yang ditulis ke cell (tampilan di Sheets, sebelum JSON escape):
```
=MAP(D2:D100;LAMBDA(n;IF(n="";"";CHAR(91)&TEXTJOIN(", ";TRUE;CHAR(91)&SEQUENCE(n)&", PENDING, , , , ]")&"]")))
```

`CHAR(91)` = `[`. Digunakan untuk menghindari konflik escape dalam JSON payload.
ARRAYFORMULA **tidak** digunakan — implicit array expansion berlaku dalam LAMBDA context.

```json
mcp__gsheets__update_cells({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "E2",
  "data": [["=MAP(D2:D100;LAMBDA(n;IF(n=\"\";\"\";CHAR(91)&TEXTJOIN(\", \";TRUE;CHAR(91)&SEQUENCE(n)&\", PENDING, , , , ]\")&\"]\")))"]
  ]
})
```

Expected: Formula ditulis, Sheets mulai kalkulasi.

- [ ] **Step 2: Verifikasi output E2:E6**

```json
mcp__gsheets__get_sheet_data({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "E2:E6"
})
```

Expected (exact):
```
E2: [[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]
E3: [[1, PENDING, , , , ], [2, PENDING, , , , ]]
E4: [[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]
E5: [[1, PENDING, , , , ], [2, PENDING, , , , ]]
E6: [[1, PENDING, , , , ], [2, PENDING, , , , ]]
```

- [ ] **Step 3: Verifikasi edge case — tambah row D7=1 sementara, cek E7**

```json
mcp__gsheets__update_cells({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "A7:D7",
  "data": [["6", "Induk", "overtime", "1"]]
})
```

Verify E7:
```json
mcp__gsheets__get_sheet_data({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "E7"
})
```

Expected: `[[1, PENDING, , , , ]]`

- [ ] **Step 4: Verifikasi edge case — D kosong → E kosong**

```json
mcp__gsheets__get_sheet_data({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "E8"
})
```

Expected: `""` (empty string, bukan error)

- [ ] **Step 5: Hapus test row 7 jika tidak diperlukan**

```json
mcp__gsheets__update_cells({
  "spreadsheet_id": "1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8",
  "sheet": "Konfigurasi Modul",
  "range": "A7:D7",
  "data": [["", "", "", ""]]
})
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-05-19-konfigurasi-modul-approval-design.md
git commit -m "feat: konfigurasi modul approval - spec dan formula plan selesai"
```

---

## Troubleshooting

| Error | Kemungkinan penyebab | Fix |
|-------|----------------------|-----|
| `#VALUE!` di col E | `n` bukan integer (col D berisi string `"3"` bukan angka `3`) | Wrap dengan `VALUE(n)` di dalam LAMBDA: `IF(n="";"";CHAR(91)&TEXTJOIN(...SEQUENCE(VALUE(n))...)` |
| `#NAME?` | Fungsi MAP/LAMBDA tidak tersedia | Sheet locale bukan Google Sheets modern — cek versi |
| Formula tidak spill | E3+ sudah ada nilai | Clear E3:E100 dulu sebelum tulis formula |
| Output `[[` tanpa content | SEQUENCE(0) atau SEQUENCE negatif | Pastikan col D ≥ 1 |

---

## Catatan Locale in_ID

- Function separator: `;` (bukan `,`)
- String separator dalam TEXTJOIN: `", "` (ini adalah literal string, bukan separator fungsi)
- Decimal: `,` (tapi tidak relevan untuk formula ini)
