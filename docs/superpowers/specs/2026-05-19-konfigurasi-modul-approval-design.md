# Design Spec: Konfigurasi Modul Approval (Dynamic Level Config)

**Date:** 2026-05-19
**Spreadsheet:** `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8` (VTL Master SSOT)
**Scope:** Formula only. Integration/distribution handled separately by user.

---

## Problem

Setiap modul (leave, expense, dll) hardcode jumlah level approval:
```
[[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]
```
Tidak bisa dikonfigurasi per tenant atau per cost center tanpa edit manual di setiap spreadsheet modul.

---

## Solution

Tab baru `Konfigurasi Modul` di master SSOT. Admin input jumlah level per CC × modul. Formula auto-generate rumus string. User/backend ambil string dari col E lalu push ke spreadsheet modul.

---

## Schema Tab `Konfigurasi Modul`

| Col | Header           | Tipe    | Keterangan                                  |
|-----|------------------|---------|---------------------------------------------|
| A   | `#`              | Number  | Row number (manual)                         |
| B   | `Cost Center`    | String  | Nama CC (e.g. `Induk`, `Kantor Pusat`)      |
| C   | `Modul`          | String  | Module key (e.g. `leave`, `expense`)        |
| D   | `Required Levels`| Integer | Jumlah level approval dibutuhkan (1–10)     |
| E   | `Rumus Modul`    | Formula | Auto-generated dari col D (lihat bawah)     |

**Contoh data:**

| # | Cost Center   | Modul   | Required Levels | Rumus Modul (auto)                                                      |
|---|---------------|---------|-----------------|-------------------------------------------------------------------------|
| 1 | Induk         | leave   | 3               | `[[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]`   |
| 2 | Induk         | expense | 2               | `[[1, PENDING, , , , ], [2, PENDING, , , , ]]`                          |
| 3 | Kantor Pusat  | leave   | 3               | `[[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]`   |
| 4 | Kantor Pusat  | expense | 2               | `[[1, PENDING, , , , ], [2, PENDING, , , , ]]`                          |
| 5 | Product Group | leave   | 2               | `[[1, PENDING, , , , ], [2, PENDING, , , , ]]`                          |

---

## Formula Col E

### Single cell (E2, non-spill):
```
=IF(D2=""; ""; "["&TEXTJOIN(", "; TRUE; ARRAYFORMULA("["&SEQUENCE(D2)&", PENDING, , , , ]"))&"]")
```

### Multi-row MAP (E2, spills E2:E100):
```
=MAP(D2:D100; LAMBDA(n; IF(n=""; ""; "["&TEXTJOIN(", "; TRUE; ARRAYFORMULA("["&SEQUENCE(n)&", PENDING, , , , ]"))&"]")))
```

**Output anatomy per item:**
```
[<level>, PENDING, <vid>, <nama>, <timestamp>, <timestamp_epoch>]
```
- `level` = integer dari SEQUENCE (1-based)
- `PENDING` = initial status literal
- `vid`, `nama`, `timestamp`, `timestamp_epoch` = kosong, diisi app saat approval trigger

---

## Edge Cases

| Kondisi           | Behavior                        |
|-------------------|---------------------------------|
| D = "" (kosong)   | E = "" (formula guard IF)       |
| D = 1             | `[[1, PENDING, , , , ]]`        |
| D = 10 (max)      | 10 entries, chain panjang       |
| CC baru           | Tambah row baru, formula otomatis |
| Modul baru        | Tambah row baru, formula otomatis |

---

## Locale Note

Spreadsheet locale `in_ID`: gunakan `;` sebagai function separator, bukan `,`.
Formula di atas sudah ditulis dalam format `in_ID`.

---

## Out of Scope

- Push/distribution ke spreadsheet modul (handled by backend/Apps Script)
- Lookup approver VID per level per CC (handled by `Approval Mapping` pipeline)
- Validasi bahwa `Required Levels` ≤ jumlah approver yang tersedia di `Otorisasi Approval`

---

## Relationship ke Subsistem Lain

```
Otorisasi Approval (who approves at what level per CC)
   → Approval Mapping.E (per-user rumus: chain of APPROVED/PENDING states)
   → Push to user spreadsheets (approver side)

Konfigurasi Modul.E (how many levels required per CC×module)     ← THIS SPEC
   → Push to module spreadsheets (request tracking side)
   → App fills VID/nama/timestamp when approver acts
```

---

## Implementation Steps

1. Buat tab `Konfigurasi Modul` di spreadsheet `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8`
2. Tulis header row (A1:E1)
3. Isi sample data admin (A2:D6 minimum)
4. Tulis MAP formula di E2 (spills E2:E100)
5. Verifikasi output E2:E6 match expected rumus
