---
name: op1Screen formula patterns (pointer)
description: Pointer to canonical sheet-formula-patterns. op1Screen is the origin sheet for these patterns.
type: reference
originSessionId: 1e07e1d5-347f-4225-9467-ef62e00f1fc4
---
# op1Screen Formula Patterns — Pointer

Canonical patterns moved to global location for reuse across sheets:

→ **`../patterns/sheet-formula-patterns.md`**

That file holds:
- P1 Monday-anchored week dates
- P2 Date → shift VLOOKUP
- P3 TEXT date+label concat
- P4 Day-bounded MIN/MAX QUERY on Event sheet (`"--"` fallback)
- P5 ARRAYFORMULA bulk concat
- P6 Range header `oldest - newest`
- P7 Relative ISO date strings
- P8 Auto-index column
- P9 LEN sanity column
- P10 IMPORTRANGE with live-mode kill-switch
- P11 Trivial sibling-tab pull
- Replication checklist + observed pitfalls

**Why pointer instead of duplicate:** patterns are sheet-agnostic. Other sheets (`attendanceDashboard`, `payrollScreen`, etc.) reference the same file. One source of truth = no drift.

**op1Screen is the origin** — see `op1Screen.md` (same folder) for the live sheet that birthed these patterns.
