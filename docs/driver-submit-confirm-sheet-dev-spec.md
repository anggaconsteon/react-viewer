# Submit Confirm Sheet — Dev Spec

Review-and-confirm bottom sheet shown before a delivery is committed. Recaps every item's actual-vs-plan, totals, the computed outcome, and an evidence checklist; the confirm button triggers the DROP+PICKUP movement write.

Source: `src/component/Driverruntimeintegrated.jsx` — `SubmitConfirmSheet` (1192-1403); trigger + payload in `DeliveryExecutionWorkspace` (1155-1172, 917-926).
Parent: `docs/driver-runtime-widgets-MASTER-handoff.md`. Format ref: `docs/stepper-widget-dev-spec.md`.

**Widget tab name:** `submitConfirmSheet`
**Type code:** `SUBMIT_CONFIRM_SHEET`
**Base template row:** `Widget!J202`
**Master index entry:** `◆submitConfirmSheet▶Widget!J202`

> Presented as a bottom sheet over a scrim via a `DO_DIALOG` chain from the workspace submit button. The sheet's primary action ("Konfirmasi & Catat Movement") is the actual commit — it fires the `sendButtonGpsWithEvent` `addToEvent` writes (MASTER §4.1). "Cek Lagi" dismisses back to the workspace.

---

## 1. Konsep

Read-only summary gate. Pulls the in-progress actuals (workspace form positions) + the task's items and renders:
1. **Item recap** — per item: name (+ `C` chip if consumable), drop row, pickup row, with deviation chips.
2. **Totals** — Total Drop `{totalDrop}/{plannedDrop}`, Total Pickup `{totalPickup}/{plannedPickup}`.
3. **Outcome banner** — one of clean / partial / opportunistic (MASTER §3 rollup).
4. **Evidence checklist** — signature / note / photo ✓ or ○.
5. **Footer** — confirm (commit) + cancel (review again).

---

## 2. Base JSON Template

`Widget!J202`:

```json
{"type":"SUBMIT_CONFIRM_SHEET","source":"[SRC]","confirmEvent":"[CONFIRMEVENT]","text":"[TITLE]◆[CONFIRM_LABEL]◆[CANCEL_LABEL]◆[TOTAL_DROP_LABEL]◆[TOTAL_PICKUP_LABEL]◆[OUT_CLEAN]◆[OUT_PARTIAL]◆[OUT_OPPORTUNISTIC]◆[EV_SIGN]◆[EV_NOTE]◆[EV_PHOTO]◆[CHIP_PARTIAL]◆[CHIP_ZERO]◆[CHIP_OPPORTUNISTIC]◆[CHIP_EXTRA]"}
```

**Demo resolved, `Widget!G202`:**

```json
{"type":"SUBMIT_CONFIRM_SHEET","source":"[FORM]","confirmEvent":"[EVENT:movementSubmit]","text":"Konfirmasi Pengiriman◆Konfirmasi & Catat Movement◆Cek Lagi◆Total Drop◆Total Pickup◆Clean execution. Semua item sesuai rencana. Movement DROP/PICKUP akan dicatat.◆Partial execution akan dicatat. Sisa item yang kurang akan trigger follow-up coordination dengan admin.◆Clean + opportunistic pickup. Drop sesuai plan. Customer balikin lebih banyak — outstanding berkurang lebih banyak.◆Tanda tangan◆Catatan◆Foto◆Partial◆0◆Opportunistic◆extra"}
```

---

## 3. Placeholder Catalog

| Placeholder | Type | Required | Default | Notes |
|-------------|------|----------|---------|-------|
| `[SRC]` | form/route token | YES | — | Source of in-progress actuals + items (`[FORM]` bus / `[SRC:page]`) |
| `[CONFIRMEVENT]` | event token | YES | — | `addToEvent` reference fired on confirm (DROP+PICKUP) — points at the `sendButtonGpsWithEvent` payload |
| `[TITLE]` | string | NO | `Konfirmasi Pengiriman` | ◆0, header label (customer name rendered under it from data) |
| `[CONFIRM_LABEL]` | string | NO | `Konfirmasi & Catat Movement` | ◆1, primary button |
| `[CANCEL_LABEL]` | string | NO | `Cek Lagi` | ◆2, dismiss button |
| `[TOTAL_DROP_LABEL]` | string | NO | `Total Drop` | ◆3 |
| `[TOTAL_PICKUP_LABEL]` | string | NO | `Total Pickup` | ◆4 |
| `[OUT_CLEAN]` | string | NO | (clean banner text) | ◆5, emerald |
| `[OUT_PARTIAL]` | string | NO | (partial banner text) | ◆6, amber |
| `[OUT_OPPORTUNISTIC]` | string | NO | (opportunistic banner text) | ◆7, blue |
| `[EV_SIGN]` | string | NO | `Tanda tangan` | ◆8 |
| `[EV_NOTE]` | string | NO | `Catatan` | ◆9 |
| `[EV_PHOTO]` | string | NO | `Foto` | ◆10 |
| `[CHIP_PARTIAL]` | string | NO | `Partial` | ◆11, per-line deviation chip |
| `[CHIP_ZERO]` | string | NO | `0` | ◆12 |
| `[CHIP_OPPORTUNISTIC]` | string | NO | `Opportunistic` | ◆13 |
| `[CHIP_EXTRA]` | string | NO | `extra` | ◆14, rendered `+N extra` |

---

## 4. Text Mapping (`◆`-delimited)

15 segments:
```
"[TITLE]◆[CONFIRM_LABEL]◆[CANCEL_LABEL]◆[TOTAL_DROP_LABEL]◆[TOTAL_PICKUP_LABEL]◆[OUT_CLEAN]◆[OUT_PARTIAL]◆[OUT_OPPORTUNISTIC]◆[EV_SIGN]◆[EV_NOTE]◆[EV_PHOTO]◆[CHIP_PARTIAL]◆[CHIP_ZERO]◆[CHIP_OPPORTUNISTIC]◆[CHIP_EXTRA]"}
```

---

## 5. Per-line chip logic (from data, MASTER §3)

For each item, given `actDrop`/`actPickup` vs `planDrop`/`planPickup`:

| Chip | Condition | Variant |
|------|-----------|---------|
| `[CHIP_PARTIAL]` (drop) | `actDrop < planDrop && actDrop > 0` | amber |
| `[CHIP_ZERO]` (drop) | `actDrop == 0 && planDrop > 0` | amber |
| `[CHIP_PARTIAL]` (pickup) | `actPickup < planPickup && actPickup > 0` | amber |
| `[CHIP_ZERO]` (pickup) | `actPickup == 0 && planPickup > 0` | amber |
| `[CHIP_OPPORTUNISTIC]` | `planPickup == 0 && actPickup > 0` | blue |
| `+N [CHIP_EXTRA]` | `actPickup > planPickup > 0` (N = `actPickup-planPickup`) | blue |

Row visibility: drop row when `planDrop > 0`; pickup row when `returnable && (planPickup > 0 || actPickup > 0)`.

Outcome banner select: `hasPartial` → `[OUT_PARTIAL]`; else `hasOpportunistic||hasExtra` → `[OUT_OPPORTUNISTIC]`; else → `[OUT_CLEAN]`.

---

## 6. Renderer Contract

1. Mount as bottom sheet (slide-up) over a tap-to-dismiss scrim; drag handle on top; `maxHeight 85%`.
2. Header: `[TITLE]` (caps, muted) + customer (bold) from data.
3. Item recap box: iterate items → name (+ `C` chip if consumable) → drop row (`↓ actDrop / planDrop` + chips) → pickup row (`↑ actPickup / planPickup` + chips). Mono values; deviation values colored amber, opportunistic/extra blue.
4. Totals box: `[TOTAL_DROP_LABEL] {totalDrop}/{plannedDrop}` (indigo) when `plannedDrop>0`; `[TOTAL_PICKUP_LABEL] {totalPickup}/{plannedPickup}` (violet) when `plannedPickup>0 || totalPickup>0`.
5. Outcome banner per §5.
6. Evidence checklist: `✓`/`○` + label for signature / note / photo (✓ when the corresponding flag true, emerald; else ○, dim).
7. Footer: primary `[CONFIRM_LABEL]` (amber bg when `hasPartial`, else indigo) → fire `[CONFIRMEVENT]` (commit), then dismiss + return to feed; secondary `[CANCEL_LABEL]` → dismiss only.

---

## 7. Integration with `addToEvent`

The confirm button is the real submit. On tap it fires `[CONFIRMEVENT]` → `sendButtonGpsWithEvent` emits one keyed DROP and one keyed PICKUP per item (MASTER §4.1), carrying actuals via `◁N▷`, plan/meta baked, GPS+driver+ts via `◀N▶`, and the rolled-up `outcome` (`success|partial`). Evidence flags (signature/note/photo) included as fields. After write, host navigates back to feed and marks the task `completed`.

---

## 8. Op1Screen Integration

### 8.1 Widget row
col B = `submitConfirmSheet`, col D = resolved JSON, col E = `,`+JSON, col F = `TRUE`. Not a standing page row in the visible flow — instantiated by the workspace submit button's `DO_DIALOG` chain.

### 8.2 Param columns (sibling convention)

| Col | Param | | Col | Param |
|-----|-------|-|-----|-------|
| G | SRC | | O | OUT_OPPORTUNISTIC |
| H | CONFIRMEVENT | | P | EV_SIGN |
| I | TITLE | | Q | EV_NOTE |
| J | CONFIRM_LABEL | | R | EV_PHOTO |
| K | CANCEL_LABEL | | S | CHIP_PARTIAL |
| L | TOTAL_DROP_LABEL | | T | CHIP_ZERO |
| M | TOTAL_PICKUP_LABEL | | U | CHIP_OPPORTUNISTIC |
| N | OUT_CLEAN / OUT_PARTIAL | | V | CHIP_EXTRA |

---

## 9. Validation Rules

1. `[CONFIRMEVENT]` must reference a valid `addToEvent` payload (the DROP+PICKUP write).
2. `text` = 15 segments (14× `◆`).
3. Outcome banner selection must follow MASTER §3 precedence (partial → opportunistic → clean).
4. Sheet is read-only display except the confirm/cancel actions; no inline editing of values.
5. Confirm only enabled when page-level `canConfirm` (`totalDrop>0 || totalPickup>0`) — gate upstream in workspace.

---

## 10. Edge Cases

| Case | Behavior |
|------|----------|
| consumable item | no pickup row; `C` chip shown |
| drop or pickup == 0 with plan > 0 | `[CHIP_ZERO]` amber on that line |
| opportunistic + extra both present | header text "Opportunistic + extra"; per-line chips still distinct |
| no evidence captured | all three checklist items show `○` (still allowed to confirm) |
| user taps scrim / cancel | dismiss, no event fired, stay in workspace |

---

## 11. Add Widget to Spreadsheet (1-time)

`A202=submitConfirmSheet`, `I202=submitConfirmSheet`, `J202=`base template (§2), `G202=`demo resolved. Append `◆submitConfirmSheet▶Widget!J202` to `Widget!G1`. Verify `G202` renders with no `[X]` leftover.

---

## 12. Reference Checklist

- [ ] `Widget!J202` base template written
- [ ] `Widget!G1` master index updated
- [ ] `G202` demo renders OK
- [ ] per-line chip logic (§5) matches MASTER §3
- [ ] outcome banner precedence correct
- [ ] evidence checklist reflects flags
- [ ] confirm fires `addToEvent` DROP+PICKUP then returns to feed
- [ ] cancel dismisses without writing
- [ ] `widget-qa` sign-off

---

## 13. Test Cases

| # | Scenario | Expected |
|---|----------|----------|
| 1 | all actuals == plan | emerald clean banner; confirm → write |
| 2 | one item drop < plan | amber chip on that line; partial banner; amber confirm button |
| 3 | pickup with plan 0, actual 2 | blue Opportunistic chip; opportunistic banner |
| 4 | pickup actual > plan | `+N extra` blue chip |
| 5 | tap Cek Lagi | dismiss, no event |
| 6 | signature off, photo on | `○ Tanda tangan`, `✓ Foto` |

---

## 14. Versi & History

- v1.0 (2026-06-10) — Initial spec. Row 202. Review gate; confirm fires DROP+PICKUP addToEvent; outcome + per-line chip logic shared with MASTER §3.
