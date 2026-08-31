# TASKLIST status separator `:` → `☆` — Flutter dev spec

**Status:** ready for Flutter
**Date:** 2026-08-18
**Scope:** Flutter renderer only (`TASKLIST` widget submit serialization). No sheet/DSL change.
**Related:** `docs/widget-docs/tasklist.md`, event-workflow skill (Event op1Script col D), 5 VTL checklist pages (`vertikaTeknoLokaciptaChecklist{PublicArea,Restroom,WorkArea,Pantry,Outdoor}`).

---

## 1. What changes

The `TASKLIST` widget, on submit, serializes each task into its form slot (`◁position▷`) as:

```
{title}:{statusLabel}
```

Change the delimiter between title and status from `:` (colon) to **`☆` (U+2606 WHITE STAR)**:

```
{title}☆{statusLabel}
```

One char. Everything else about `TASKLIST` output stays identical.

---

## 2. Before → after

Live example — one checklist submit resolves the `report-checklist` addToTable array. Elements `<8>…<13>` are the six `TASKLIST` results:

**Before**
```json
["checklist-publicarea","18 Aug 2026 08:31","87544551624342","Agenia Demo-7","Product Group","Product Group","0l114807f17536338c20fd13c3896308df116b295d",
 "Sapu dan pel lantai:Selesai",
 "Lap permukaan (meja/kursi):Selesai",
 "Lap touch point (handrail, gagang, tombol):Selesai",
 "Lap kaca, cermin, dan permukaan:Selesai",
 "Buang sampah:Selesai",
 "Semprot pewangi:Selesai",
 "aman","--"]
```

**After**
```json
[ … ,
 "Sapu dan pel lantai☆Selesai",
 "Lap permukaan (meja/kursi)☆Selesai",
 "Lap touch point (handrail, gagang, tombol)☆Selesai",
 "Lap kaca, cermin, dan permukaan☆Selesai",
 "Buang sampah☆Selesai",
 "Semprot pewangi☆Selesai",
 "aman","--"]
```

---

## 3. Why `☆` (not `:`)

1. **Titles contain `:`** (and timestamps like `08:31`) → `:` is ambiguous, `split(':')` breaks. `☆` never appears in user text.
2. **`☆` is the canonical Event sub-field separator.** The Event op1Script (col D) already uses `☆` to split sub-fields inside a cell (and `◻` for major blocks, `★` for section index). Emitting `title☆status` lets the report-spread reuse the same split convention — no special-casing.
3. **Distinct from `★` (U+2605 BLACK STAR)** used for Event `★N` section maps and addToTable `index◼3★N`. `☆`/`★` are different codepoints — no collision with the position-map machinery.

---

## 4. Scope / blast radius

The change is in the shared `TASKLIST` renderer → **every page using `TASKLIST` is affected**, not only the 5 checklist pages. Before shipping:

- Grep the app for other `TASKLIST` consumers. Today the only known live users are the 5 VTL checklist pages (all just built, no downstream report yet), so there is nothing currently parsing the old `:` form.
- If any existing flow already `split(':')` on a TASKLIST value, migrate it to `☆` in the same PR.

Recommendation: **hardcode `☆` as a system constant** (structural delimiter, like `◆`), not a per-widget config field — the report op1Script split char must stay globally consistent.

---

## 5. Downstream — Event op1Script (col D), report spread

When the checklist report page is built later, its op1Script D formula spreads the `report-checklist` row into task/status rows. Each TASKLIST element is its **own array cell** (`<8>`,`<9>`,…), so it is split individually:

```
"Sapu dan pel lantai☆Selesai"  →  split("☆")  →  ["Sapu dan pel lantai", "Selesai"]
                                                    task                    status
```

**Design constraint for whoever builds that op1Script:** `☆` is also the D-tail sub-field separator. Keep each TASKLIST value in its own cell — never concatenate multiple tasklist values into one `☆`-joined tail, or the inner `☆` collides with the tail delimiter. (One cell = one `task☆status` pair = exactly one `☆`.)

---

## 6. Test vector

| Input (title, status) | Expected slot value |
|---|---|
| `Sapu dan pel lantai`, `Selesai` | `Sapu dan pel lantai☆Selesai` |
| `Isi ulang tissue dan sabun`, `Tidak Tersedia` | `Isi ulang tissue dan sabun☆Tidak Tersedia` |
| `Cek jam: shift pagi`, `Dilewati` | `Cek jam: shift pagi☆Dilewati` (colon in title preserved, only the delimiter is `☆`) |

Assert: exactly one `☆` per emitted value; the substring before it equals the task title verbatim (colons and spaces intact).
