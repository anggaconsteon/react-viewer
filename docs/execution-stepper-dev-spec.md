# Execution Stepper + Item Execution Row — Dev Spec

Core input of the Driver Runtime workspace. Two coupled widgets:

- **`executionStepper`** — a single-direction (drop OR pickup) numeric stepper with a **plan reference** and a **plan-vs-actual status state machine**. Unlike the existing `stepper`, it has no `stockAvailable` / `<remain>`; instead it color-codes the value against `planned` (partial / sesuai / opportunistic / extra).
- **`itemExecutionRow`** — composite that renders one product line: item name + type chip + 1-2 `executionStepper`s (drop and/or pickup) + a conditional pickup hint.

Source: `src/component/Driverruntimeintegrated.jsx` — `ExecutionStepper` (319-423), `ItemExecutionRow` (425-494).
Parent context: `docs/driver-runtime-widgets-MASTER-handoff.md`. Format reference: `docs/stepper-widget-dev-spec.md`.

| | Widget!A | Type code | Base row | Master index entry |
|--|----------|-----------|----------|--------------------|
| Atom | `executionStepper` | `EXECUTION_STEPPER` | `Widget!J200` | `◆executionStepper▶Widget!J200` |
| Composite | `itemExecutionRow` | `ITEM_EXECUTION_ROW` | `Widget!J201` | `◆itemExecutionRow▶Widget!J201` |

> **Relationship to `stepper`:** spec'd as a NEW widget, not a variant of `stepper`. Reason: different data model — `stepper` compares to `stockAvailable` and exposes `<remain>`; `executionStepper` compares to `planned` and exposes 4 plan-relative states (partial/complete/opportunistic/extra) + a direction (drop/pickup). If dev prefers one widget, this can fold into `stepper` as `variant:"execution"` with `planned` replacing `stockAvailable` — flagged as an open decision in the MASTER handoff §6.

---

## 1. Konsep

`executionStepper` = `[−] value [+]` with:
- a **direction** (`drop` ↓ indigo / `pickup` ↑ violet) driving symbol + label + accent,
- a **plan badge** ("plan N") top-right,
- a **status line** under the value, derived at runtime from `value` vs `planned`.

`itemExecutionRow` stacks: item header (name + type chip) → flex row of 1-2 steppers → optional hint. It emits **two** form positions (drop + pickup) so a sibling send button can read both via `◁N▷`.

Default value = plan (workspace seeds `actuals` from `planDrop`/`planPickup`); driver edits only on deviation.

---

## 2. Base JSON Templates

### 2.1 `executionStepper` — `Widget!J200`

```json
{"type":"EXECUTION_STEPPER","kind":"[KIND]","planned":[PLANNED],"currentValue":"[INITIAL]","min":0,"position":[POSITION],"text":"[STATUSPARTIAL]◆[STATUSCOMPLETE]◆[STATUSOPPORTUNISTIC]◆[STATUSEXTRA]◆[PLANLABEL]"}
```

**Demo resolved (drop), `Widget!G200`:**

```json
{"type":"EXECUTION_STEPPER","kind":"drop","planned":3,"currentValue":"3","min":0,"position":5,"text":"Partial · <kurang> kurang◆✓ Sesuai◆Opportunistic · <value>◆+<extra> extra◆plan"}
```

### 2.2 `itemExecutionRow` — `Widget!J201`

```json
{"type":"ITEM_EXECUTION_ROW","itemType":"[ITEMTYPE]","planDrop":[PLANDROP],"planPickup":[PLANPICKUP],"dropPosition":[DROPPOS],"pickupPosition":[PICKUPPOS],"text":"[ITEMNAME]◆[TYPECHIP]◆[HINTTEMPLATE]"}
```

**Demo resolved (returnable, drop+pickup), `Widget!G201`:**

```json
{"type":"ITEM_EXECUTION_ROW","itemType":"returnable","planDrop":3,"planPickup":3,"dropPosition":5,"pickupPosition":6,"text":"Gas 12kg◆Returnable◆💡 Customer juga punya tabung lama buat dibalikin? Tap [+] di pickup."}
```

---

## 3. Placeholder Catalog

### 3.1 `executionStepper`

| Placeholder | Type | Required | Default | Notes |
|-------------|------|----------|---------|-------|
| `[KIND]` | enum | YES | `drop` | `drop` (↓ indigo) \| `pickup` (↑ violet) — drives symbol, label, accent |
| `[PLANNED]` | int | YES | — | Plan reference; status computed against this. `0` ⇒ opportunistic-capable |
| `[INITIAL]` | int (as string) | YES | `"0"` | Start value; workspace seeds = `[PLANNED]` |
| `min` | int | fixed | `0` | Floor. No `max` — value may exceed plan (→ surplus/extra) |
| `[POSITION]` | int | YES | — | Form field index for `◁N▷` |
| `[STATUSPARTIAL]` | string | YES | `Partial · <kurang> kurang` | Shown when `0 < value < planned`. Token `<kurang>` |
| `[STATUSCOMPLETE]` | string | YES | `✓ Sesuai` | Shown when `value == planned` and `value > 0` |
| `[STATUSOPPORTUNISTIC]` | string | YES | `Opportunistic · <value>` | Shown when `planned == 0 && value > 0`. Token `<value>` |
| `[STATUSEXTRA]` | string | YES | `+<extra> extra` | Shown when `value > planned > 0`. Token `<extra>` |
| `[PLANLABEL]` | string | NO | `plan` | Label before the plan badge number |

### 3.2 `itemExecutionRow`

| Placeholder | Type | Required | Default | Notes |
|-------------|------|----------|---------|-------|
| `[ITEMTYPE]` | enum | YES | `returnable` | `returnable` (drop+pickup, indigo chip) \| `consumable` (drop-only, slate chip) |
| `[PLANDROP]` | int | YES | — | Drop stepper rendered only if `> 0` |
| `[PLANPICKUP]` | int | YES | — | Pickup stepper rendered only if `itemType==returnable` |
| `[DROPPOS]` | int | YES | — | Form position the drop stepper writes to |
| `[PICKUPPOS]` | int | YES | — | Form position the pickup stepper writes to |
| `[ITEMNAME]` | string | YES | — | Product name, ◆ segment 0 |
| `[TYPECHIP]` | string | YES | — | Chip label (`Returnable` / `Consumable`), ◆ segment 1 |
| `[HINTTEMPLATE]` | string | NO | `""` | Pickup hint, ◆ segment 2; shown only when `itemType==returnable && planPickup==0 && pickupValue==0` |

---

## 4. Text Mapping (`◆`-delimited)

**`executionStepper`** — 5 segments:
```
"[STATUSPARTIAL]◆[STATUSCOMPLETE]◆[STATUSOPPORTUNISTIC]◆[STATUSEXTRA]◆[PLANLABEL]"
```

**`itemExecutionRow`** — 3 segments:
```
"[ITEMNAME]◆[TYPECHIP]◆[HINTTEMPLATE]"
```

Empty trailing segments retain their `◆` (renderer counts by index). Empty hint: `"Gas 12kg◆Returnable◆"`.

---

## 5. Runtime Tokens

Resolved by the renderer at interaction time, NOT build time:

| Token | Resolution | Scope |
|-------|------------|-------|
| `<kurang>` | `planned - value` | inside `[STATUSPARTIAL]` |
| `<value>` | current value | inside `[STATUSOPPORTUNISTIC]` |
| `<extra>` | `value - planned` | inside `[STATUSEXTRA]` |
| `◁[POSITION]▷` | current stepper value | sibling send button `addToEvent` |
| `◁[DROPPOS]▷` / `◁[PICKUPPOS]▷` | row's drop / pickup values | sibling send button `addToEvent` |

---

## 6. Status state machine (the core logic)

Single `executionStepper` cell, given `value` and `planned`:

| State | Condition | Value color | Cell bg / border | Status line |
|-------|-----------|-------------|------------------|-------------|
| zero | `value == 0` | textDim | accent (idle) | — |
| partial | `0 < value < planned` | amber700 | amber50 / amber400 | `Partial · <kurang> kurang` |
| complete | `value == planned > 0` | emerald700 | emerald50 / emerald400 | `✓ Sesuai` |
| opportunistic | `planned == 0 && value > 0` | infoBlue | infoBlueBg / infoBlue44 | `Opportunistic · <value>` |
| surplus/extra | `value > planned > 0` | infoBlue | infoBlueBg / infoBlue44 | `+<extra> extra` |

Precedence (match source): complete → partial → (surplus OR opportunistic) → idle. Note `isComplete` wins ties; `opportunistic` only when `planned==0`.

This per-cell state feeds the page rollup in the MASTER handoff §3 (`hasPartial`, `hasOpportunistic`, `hasExtra`) consumed by the workspace banners and `submitConfirmSheet`.

---

## 7. Renderer Contract

### 7.1 `executionStepper`

1. Parse JSON; `value = parseInt(currentValue)`; register field handler at `position`.
2. Derive from `kind`: symbol (`↓`/`↑`), label (`Drop`/`Pickup`), accent (indigo/violet).
3. Header row: symbol + label (left), `[PLANLABEL] <planned>` (right, mono).
4. Control row: `[−]` (disabled when `value == 0`) · big mono value (color per §6) · `[+]` (never disabled).
5. Status line under value: pick template per §6, substitute `<kurang>`/`<value>`/`<extra>`, render in the state color. Hide when zero/idle.
6. Emit binding on every change.

### 7.2 `itemExecutionRow`

1. Header: `[ITEMNAME]` (bold) + type chip (`Returnable`=indigo / `Consumable`=slate).
2. Flex row:
   - if `planDrop > 0` → drop `executionStepper` (`planned=planDrop`, `position=dropPosition`).
   - if `itemType == returnable` → pickup `executionStepper` (`planned=planPickup`, `position=pickupPosition`).
3. Hint banner (info-blue, italic) when `itemType==returnable && planPickup==0 && pickupValue==0` → render `[HINTTEMPLATE]`.
4. Row emits two positions: `dropPosition`→drop value, `pickupPosition`→pickup value.

---

## 8. Integration with `addToEvent`

Each item contributes a DROP and a PICKUP movement (MASTER §4.1). The workspace's submit button (`sendButtonGpsWithEvent`) reads each row's two positions:

```
position 5 → Gas 12kg drop   (itemExecutionRow dropPosition)
position 6 → Gas 12kg pickup (itemExecutionRow pickupPosition)
position 7 → Gas 3kg drop
position 8 → Gas 3kg pickup
...
```

`addToEvent` payload (illustrative, keyed ledger) — one keyed write per direction per item, actuals from `◁N▷`, plan/meta baked, session via `◀N▶`:

```
...⭘r◼<taskVid>⭘ty◼movement-drop⭘item◼gas_12⭘plan◼3⭘actual◼◁5▷⭘outcome◼<outcome>⭘ts◼◀…|T?|D…▶
...⭘r◼<taskVid>⭘ty◼movement-pickup⭘item◼gas_12⭘plan◼3⭘actual◼◁6▷⭘outcome◼<outcome>⭘ts◼◀…|T?|D…▶
```

Ordering rule (memory): session/plan tokens low slots, `◁N▷` actuals high slots.

---

## 9. Op1Screen Integration

### 9.1 Widget rows
Standard: col B = widget name, col D = resolved JSON (no leading comma), col E = `,`+JSON, col F = `TRUE`.

### 9.2 Param columns (sibling convention)

`executionStepper`:

| Col | Param | | Col | Param |
|-----|-------|-|-----|-------|
| G | KIND | | L | STATUSCOMPLETE |
| H | PLANNED | | M | STATUSOPPORTUNISTIC |
| I | INITIAL | | N | STATUSEXTRA |
| J | POSITION | | O | PLANLABEL |
| K | STATUSPARTIAL | | | |

`itemExecutionRow`:

| Col | Param | | Col | Param |
|-----|-------|-|-----|-------|
| G | ITEMTYPE | | K | PICKUPPOS |
| H | PLANDROP | | L | ITEMNAME |
| I | PLANPICKUP | | M | TYPECHIP |
| J | DROPPOS | | N | HINTTEMPLATE |

---

## 10. Validation Rules

1. `KIND` ∈ `{drop, pickup}`.
2. `ITEMTYPE` ∈ `{returnable, consumable}`.
3. `PLANNED >= 0`; `INITIAL >= 0` (no upper clamp — surplus allowed).
4. `consumable` ⇒ `PLANPICKUP == 0` and pickup stepper NOT rendered.
5. `PLANDROP == 0 && PLANPICKUP == 0` ⇒ invalid item (nothing to record).
6. `DROPPOS`, `PICKUPPOS`, `POSITION` unique per page (no collision).
7. `executionStepper.text` = 5 segments (4× `◆`); `itemExecutionRow.text` = 3 segments (2× `◆`).
8. `currentValue` encoded as string (existing widget convention); numeric fields (`planned`,`planDrop`,…) as ints.
9. If `[STATUSPARTIAL]`/`[STATUSEXTRA]`/`[STATUSOPPORTUNISTIC]` lack the matching token, render literal (no crash).

---

## 11. Edge Cases

| Case | Behavior |
|------|----------|
| `planned == 0`, value increments | Enters `opportunistic` state (blue), not partial |
| value exceeds plan | `surplus`/extra state, `[+]` stays enabled (no max) |
| `value == 0` with `planned > 0` | idle/zero look, but page rollup flags `isZero` (amber warning at page level) |
| `consumable` with `planPickup > 0` (config bug) | Ignore pickup; render drop only; log warning |
| hint tokens present but pickup already > 0 | Hint hidden (condition `pickupValue==0` false) |
| `DROPPOS == PICKUPPOS` | Validation error — two values cannot share one position |

---

## 12. Add Widgets to Spreadsheet (1-time)

**executionStepper:** `A200=executionStepper`, `I200=executionStepper`, `J200=`base template (§2.1), `G200=`demo resolved. Append `◆executionStepper▶Widget!J200` to `Widget!G1`.

**itemExecutionRow:** `A201=itemExecutionRow`, `I201=itemExecutionRow`, `J201=`base template (§2.2), `G201=`demo resolved. Append `◆itemExecutionRow▶Widget!J201` to `Widget!G1`.

Verify `G200`/`G201` render with no `[X]` leftover.

---

## 13. Reference Checklist

- [ ] `Widget!J200` / `J201` base templates written
- [ ] `Widget!G1` master index updated (both entries)
- [ ] `G200`/`G201` demos render OK
- [ ] Status state machine (§6) implemented with correct precedence
- [ ] `<kurang>`/`<value>`/`<extra>` runtime tokens computed
- [ ] Drop=indigo↓ / Pickup=violet↑ theming verified
- [ ] `consumable` hides pickup stepper; `returnable` shows hint when planPickup==0
- [ ] Two-position emission (`◁DROPPOS▷` + `◁PICKUPPOS▷`) tested in send button
- [ ] No-max behavior (surplus) verified
- [ ] `widget-qa` sign-off

---

## 14. Test Cases

| # | Scenario | Expected |
|---|----------|----------|
| 1 | drop, planned=3, tap `[−]` from 3 to 2 | value=2 amber, "Partial · 1 kurang" |
| 2 | drop, planned=3, value=3 | emerald, "✓ Sesuai" |
| 3 | pickup, planned=0, tap `[+]` to 1 | blue, "Opportunistic · 1" |
| 4 | pickup, planned=3, tap `[+]` to 5 | blue, "+2 extra", `[+]` still enabled |
| 5 | drop, value=0, planned=3 | idle look; page rollup flags isZero |
| 6 | consumable item | only drop stepper; no pickup; no hint |
| 7 | returnable, planPickup=0, pickupValue=0 | pickup stepper at 0 + blue hint shown |
| 8 | returnable, planPickup=0, tap pickup `[+]` | hint disappears, opportunistic state |

---

## 15. Versi & History

- v1.0 (2026-06-10) — Initial spec. `executionStepper` (rows 200) + `itemExecutionRow` (row 201). Plan-relative status state machine; dual-position emission. Folding-into-`stepper` flagged as open decision.
