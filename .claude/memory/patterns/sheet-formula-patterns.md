---
name: Sheet formula patterns (canonical)
description: Reusable formula patterns for Consteon SSOT spreadsheets. Originally extracted from op1Screen — reference these from any sibling sheet to keep behaviour uniform.
type: reference
originSessionId: 1e07e1d5-347f-4225-9467-ef62e00f1fc4
---
# Sheet Formula Pattern Reference

**Origin:** `op1Screen` tab of spreadsheet `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`. See `../op1Screen/op1Screen.md` for the source sheet's full layout. When applying to a new sheet, swap cell refs / sheet names only — keep formula shape identical.

Use this file as the canonical pattern set for: week-aligned dates, shift-table lookup, day-bounded MIN/MAX event queries, and bulk-concat display columns. Every formula below was extracted from the live `op1Screen` tab (spreadsheet `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`).

When you reuse these in another sheet, keep the **shape exactly**; only swap the cell refs and source-sheet name. The whole point of this file is uniformity.

---

## P1 — Monday-anchored current-week date column

Builds a 7-cell vertical date list, top = Monday of this week, going down to Sunday.

```excel
M3: =TODAY()-WEEKDAY(TODAY(),2)+1   // Monday
M4: =TODAY()-WEEKDAY(TODAY(),2)+2   // Tuesday
M5: =TODAY()-WEEKDAY(TODAY(),2)+3
M6: =TODAY()-WEEKDAY(TODAY(),2)+4
M7: =TODAY()-WEEKDAY(TODAY(),2)+5
M8: =TODAY()-WEEKDAY(TODAY(),2)+6
M9: =TODAY()-WEEKDAY(TODAY(),2)+7   // Sunday
M11: =TODAY()                       // today anchor (used by some lookups)
```

**Why `WEEKDAY(...,2)`:** type `2` returns 1=Mon … 7=Sun (ISO-ish). Without the `,2` you'd get Sunday=1 and the math flips by one day.

**Reuse tip:** if you want week starting Sunday, drop the `,2` and shift by `+0..+6`.

---

## P2 — Date → shift label via VLOOKUP

Schedule table sits in `M14:O75` (date in col M, shift label in col N, combined text in col O). Look up the shift for any of the week dates above:

```excel
N3: =VLOOKUP($M3, $M$14:$O$75, 2, False)   // shift label, e.g. "P (08-20)"
O3: =VLOOKUP(M3, $M$14:$O$74, 3, False)    // combined "Mon, 5-Dec - P (08-20)"
```

**Conventions:**
- Lock the lookup range with `$$` on both ends.
- Lock only the column (`$M3`) on the lookup key when you'll fill the formula down a column.
- 4th arg always `False` — exact match. Approximate match silently corrupts on missing dates.

---

## P3 — Date + label concat for human display

Row-level concat used to build the row 3 ↦ row 75 display labels:

```excel
O14: =(TEXT(M14, "ddd, d-mmm") &" - "& N14)
```

Output: `"Mon, 5-Dec - P (08-20)"`.

**Format tokens used in this sheet (memorize):**

| Token | Means | Example |
|-------|-------|---------|
| `ddd` | 3-letter weekday | Mon |
| `dd` | 2-digit day | 05 |
| `d` | day no leading zero | 5 |
| `mmm` | 3-letter month | Dec |
| `yyy` / `yyyy` | year | 2026 |
| `hh:mm` | 24h time | 17:08 |
| `h:mm` | hours, no leading zero | 9:11 |

---

## P4 — Day-bounded MIN/MAX event query against `Event` tab

The headline pattern. Reads the Event ledger and returns the **first check-in** and **last check-out** for a given day, falling back to `"--"` when no event exists.

### First row (newest day, only lower bound)

```excel
Q14: =IF(
  MIN(Query(Event!$F$5:$G,
    "select G where G > date '"&$P14&"'
     and F contains 'attendance-check-in'
     ORDER by G ASC"
  )) = 0,
  "--",
  MIN(Query(Event!$F$5:$G,
    "select G where G > date '"&$P14&"'
     and F contains 'attendance-check-in'
     ORDER by G ASC"
  ))
)

R14: =IF(
  MAX(Query(Event!$F$5:$G,
    "select G where G > date '"&$P14&"'
     and F contains 'attendance-check-out'
     ORDER by G DESC"
  )) = 0,
  "--",
  MAX(Query(Event!$F$5:$G,
    "select G where G > date '"&$P14&"'
     and F contains 'attendance-check-out'
     ORDER by G DESC"
  ))
)
```

### Subsequent rows (older days — upper bound = the day above)

```excel
Q15: =IF(
  MIN(Query(Event!$F$5:$G,
    "select G where G > date '"&$P15&"'
     and G < date '"&$P14&"'
     and F contains 'attendance-check-in'
     ORDER by G ASC"
  )) = 0,
  "--",
  MIN(Query(Event!$F$5:$G,
    "select G where G > date '"&$P15&"'
     and G < date '"&$P14&"'
     and F contains 'attendance-check-in'
     ORDER by G ASC"
  ))
)
```

**Hard rules — do not deviate:**

1. The two `MIN(Query(...))` / `MAX(Query(...))` calls inside the `IF` **must be byte-identical** — same SELECT, same WHERE, same ORDER. If they drift, the empty-day branch returns `0` instead of `"--"` and downstream date math breaks.
2. Date literals in the QUERY string must be ISO `yyyy-mm-dd`. Generate them with `TEXT(now()-n, "yyyy-mm-dd")` in col P first, then reference (don't inline `TEXT(...)` inside the QUERY).
3. Bounds direction: `G > date 'this row'` AND `G < date 'row above'`. Strict `<` on the upper bound so the next day's events don't leak in.
4. `F contains 'attendance-check-in'` / `'attendance-check-out'` — substring match, not equality. Don't switch to `=`; the ledger types sometimes carry suffixes.
5. The IF-wrapper exists ONLY because empty `MIN`/`MAX` over Query returns `0`, which a downstream `TEXT(...,"dd-mmm hh:mm")` would render as `"30-Dec 00:00"`. The `"--"` keeps the UI clean.

**Why `now()` not `TODAY()` in P:** col P feeds these queries with second-resolution timestamps; `TODAY()` only updates on edit/recalc, `now()` updates per recalc tick. In practice both work here, but the sheet uses `now()` for the rolling window.

---

## P5 — ARRAYFORMULA bulk display concat

One formula in S14 builds 32 rows of display label at once:

```excel
S14: =ARRAYFORMULA(
  TEXT(P14:P45, "ddd, dd-mmm") &" | "&
  IF(Q14:Q45="","", TEXT(Q14:Q45, "dd-mmm hh:mm") &" - "&
    IF(R14:R45="","", TEXT(R14:R45, "dd-mmm hh:mm"))
  )
)
```

Output per row: `"Tue, 19-May | 19-May 08:34 - 19-May 17:31"` or, when missing, `"Sun, 17-May | "`.

**Rules:**
- Always wrap an ARRAYFORMULA when you want a single anchor cell to spill a column. Never copy 32 row-formulas if the body is identical.
- Range sizes inside one ARRAYFORMULA must match exactly (`P14:P45`, `Q14:Q45`, `R14:R45` — all 32 rows).
- Nest `IF(X="","", ...)` to suppress `"30-Dec 00:00"` artifacts on empty cells.

---

## P6 — Range-bounds header label (newest → oldest)

Print "first-date – last-date" header above a date-range table:

```excel
P13: =TEXT(P44, "d-mmm-yyy") &" - "&TEXT(P14, "dd-mmm-yyy")
```

(P44 = oldest row, P14 = newest row. The order in the literal is `oldest - newest`.)

---

## P7 — Relative-date strings (anchor + offset)

```excel
P14: =TEXT(now(),   "yyyy-mm-dd")   // today
P15: =TEXT(now()-1, "yyyy-mm-dd")   // yesterday
P16: =TEXT(now()-2, "yyyy-mm-dd")
...
P45: =TEXT(now()-31,"yyyy-mm-dd")   // 31 days ago
```

Always emit ISO `yyyy-mm-dd` here — it's the format QUERY's `date '...'` literal expects.

---

## P8 — Auto-numbered index column (with header swap)

```excel
A5: =ARRAYFORMULA(IF(ROW(A5:A48)=5, "#", ROW(A5:A48)-5))
```

Renders `#` in the header row, then `1, 2, 3, …` below. Cheaper than typing them.

---

## P9 — Length / sanity check column

Watch JSON output length next to each compiled cell:

```excel
G6: =LEN(C6)
G7: =LEN(C7)
G8: =LEN(C8)
```

Keep this column wired up while editing JSON producers — character-count delta is the fastest "did my edit break the string" signal.

---

## P10 — Conditional cross-spreadsheet IMPORTRANGE (live mode)

Used by the `JSON` tab to optionally pull a remote compile via a redirection lookup table:

```excel
=IF(
  $E$1 = TRUE,
  IMPORTRANGE(
    VLOOKUP($C$1, Redirection!$A$3:$C, 3, FALSE),
    "JSON!B5:C85"
  ),
  ""
)
```

**Pattern:**
- `$E$1` is the master "live mode" toggle (TRUE = pull remote).
- `$C$1` is the project/proxy key; `Redirection` tab maps key → remote spreadsheet ID.
- Always pair IMPORTRANGE with a kill-switch IF — without it, every recalc on the proxy spreadsheet hits the remote.

---

## P11 — Trivial sibling-tab pull

```excel
C9: =Locale!$C$1
```

When a sibling tab compiles its own JSON into a single cell (typically `C1`), just reference it. No need for IMPORTRANGE for same-spreadsheet pulls.

---

## Replicating to a new sheet — checklist

When you start a new dashboard sheet that needs these behaviours:

1. **Pick anchor column for dates** (here = `P`). Generate ISO `yyyy-mm-dd` with `TEXT(now()-n, "yyyy-mm-dd")` for N rows below the newest row.
2. **Add a header row above** with P6's range label.
3. **For each "first event of day" / "last event of day" pair:** use P4. Keep the inner Query string identical inside the IF.
4. **For a display-only label column:** prefer one ARRAYFORMULA (P5) over N row-formulas.
5. **For a schedule/shift lookup column:** mirror P2's VLOOKUP into a static table further down the same sheet (here = `M14:O75`).
6. **For week-anchored navigation:** drop in P1.
7. **For cross-sheet pulls:** P11 first; P10 only when crossing spreadsheets.
8. **Always add a `LEN(...)` debug column (P9)** when the sheet produces a JSON string.

## Pitfalls observed in op1Screen

- `#N/A` shows up in N14:N75 when the schedule lookup range (`$M$14:$O$75` vs `$M$14:$O$74`) is off by one — some formulas in this sheet use `:75` and others `:74`. Standardize on the larger bound when copying.
- `#REF!` appears in K15:L19 (group columns Teammate/Buffer/Approver) when source IDs aren't filled. Defensive wrap: `IFERROR(<expr>, "")`.
- All stat counters in col V (Terjadwal/Bekerja/…) are **manual demo values** in this sheet, not formula-driven. If you want them computed, build COUNTIFS over the col S labels.
