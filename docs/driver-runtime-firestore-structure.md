# Driver Runtime — Firestore Structure (PROVISIONAL recommendation)

**Status:** Draft for tech-lead review. Everything here is a *suggestion derived from the prototype*, not a decision. Field names, codes, and the mutable-vs-event-sourced split are all open.

**Derived from:** the driver-runtime React prototype mock data — `INITIAL_TASKS`, `Item`, `DRIVER`, `VEHICLE`, `DEVICE_OWNER`, `PENDING_CUSTODY` (`src/component/Driverruntimefull.jsx`, the same model App.jsx carried as the integrated flow). **Not** derived from the gas-cylinder data-dictionary sheet (`Transaction`/`Customers`/node model) — that direction is explicitly out of scope here.

**Mapped onto:** the *existing* live Firestore conventions observed in the `otq-01` console (the 4 screenshots): path shape, short field codes, and the `event` / `site` / `workforce` collection roles.

---

## 1. Existing conventions (decoded from the live `otq-01` Firestore)

**Path shape:**
```
MobileTable / {tenantVID} / tables / {tableVID} / {collection} / {docId}
   e.g.  MobileTable/2034203331549.../tables/8421422050425.../event/8VtrxGirnWfUa6NwEoh8
```
- `{tableVID}` doc carries `n` = provider name (`"Vertika Tekno Lokacipta"`).
- Under it, three collections are live today: **`event`**, **`site`**, **`workforce`**.

**Collection roles observed:**
| Collection | Role | Mutability |
|---|---|---|
| `event` | Append-only ledger. Every action = one new doc. Holds raw payload in `ev`. | write-once |
| `site` | Master location record + geofence array `ll[]`. | mutable (`updateTableRow`) |
| `workforce` | A person (worker/driver). Current clock state `ci`/`co`/`st`. | mutable |

**Field-code style (short, 1–3 chars).** Observed across the 3 collections:

| Code | Meaning | Seen in |
|---|---|---|
| `n` | name | all |
| `vid` | the record's own VID (numeric string id) | workforce |
| `sv` / `sn` | site VID / site name | event, site, workforce |
| `cv` / `cn` | "creator"/client VID + name (the actor) | event |
| `av` / `an` | cost-center/asset VID + name | event, site |
| `st` | status (`active`, `off`, …) | site, workforce |
| `t` / `et` | epoch-ms timestamp (string) | event |
| `ts` | formatted timestamp `"11 Jun 2026 14:41:02"` | event |
| `ty` | type / discriminator (`report-patrol`) | event |
| `p` | process / page-route key (`vertikaTeknoLokaciptaReportPatrol`) | event |
| `r` | retention (minutes, e.g. `4320`) | event |
| `d` | free-text description | event |
| `i` | image URL(s) | event |
| `ln` | location name | event, site(`ll[].ln`) |
| `ev` | **raw DSL payload string** (the whole `◆`/`★` event blob) | event |
| `en` | encryption marker — lists which fields are encrypted | site, workforce |
| `ci` / `co` | clock-in / clock-out epoch (`-1` = none) | workforce |
| `ll[]` | location list — geofence array of `{la, lo, ra, li, ln}` | site |
| `af` / `sf` | asset-folder / site-folder (`"vtl◆product-group"`) | site |

> Convention to keep: **denormalize** the actor/site/cost-center name+VID onto each record (so the ledger reads standalone), keep one universal `event` ledger, and store state on a mutable "actor" doc (like `workforce` holds clock state).

---

## 2. What the prototype needs to store (the mock model)

From the prototype, verbatim shapes:

```
Task   { id, customer, address, distance, stopNumber,
         state: assigned|in_execution|completed|failed|blocked,
         taskType?: pickup_return, completedAt?, customerConfirmed?, items[] }

Item   { id, name, type: returnable|consumable,
         planDrop, actualDrop, planPickup, actualPickup }

Driver { name, id, role }          Vehicle { id, plate }

Custody { custodyEventId, vehicleId, vehiclePlate, loadedBy, loadedAt,
          loadSessionId,
          items[ {id, name, type, warehouseRecorded} ],   // what driver verifies against
          tasks[ {id, customer, address, stopNumber, items[{id,name,type,drop,pickup}]} ] }

SubmitPayload  { actuals: {itemId:{drop,pickup}}, hasSignature, hasNote, hasPhoto,
                 outcome: success|partial|failed }
MismatchPayload{ deltas[], note, photo }
```

Three things the existing `event`/`site`/`workforce` trio does **not** cover:
1. A **vehicle** with running cargo + custody status.
2. A **trip** (the day's route) that holds the custody gate + groups stops.
3. **Tasks** (per-stop delivery state with plan-vs-actual items).

---

## 3. Proposed collection map

Reuse 3 existing, add 3 new — all siblings under `tables/{tableVID}/`:

| Collection | Status | Role | Read by | Written by |
|---|---|---|---|---|
| `workforce` | **REUSE** | driver identity + on/off + current trip/vehicle | P2 scan resolve, P4 header | scan open/pause/end |
| `site` | **REUSE** | customer & warehouse locations + geofence | task address, custody source | admin/seed |
| `vehicle` | **NEW** | one truck; running cargo tally + custody status | P4 cargo card | custody confirm, each delivery submit, return |
| `trip` | **NEW** | one day's route; **custody gate** + stop list + totals | P4 home (gate, route, return) | custody flow, submits |
| `task` | **NEW** | one stop; plan-vs-actual items + outcome | P4 route card, P10 feed, P11 workspace | delivery submit/fail |
| `event` | **REUSE** | append-only audit ledger of every action | reports/reconciliation | every step |

> Faithful alternative (note for tech lead): an **event-sourced** variant keeps only `event` (+ `workforce`/`site`) and *derives* trip/task/vehicle state by reducing the ledger — exactly how attendance derives `workforce.ci/co` from clock events. The mutable-collection version above is recommended because the P4 home needs cheap point queries (one `trip` doc + a `task` filter) rather than a ledger fold on every open.

---

## 4. Per-collection schema (short codes, faithful style)

All docs also carry the universal denormalized refs where relevant: `dv/dn` (driver), `vv/vp` (vehicle), `sv/sn` (site), `av/an` (cost-center), `tv` (trip vid), plus `t/ts` and `r` (retention).

### 4.1 `workforce` (REUSE — driver is a workforce member)
```
vid  driver VID (resolved from scanned card QR)
n    driver name
st   session state: off | on | paused
sv   site/depot VID            sn  site name
vv   current vehicle VID       vp  vehicle plate     (assigned)
tv   current trip VID                                 (active trip)
ci   session-open epoch        co  session-end epoch  (reuse clock fields)
ro   role  (Driver)
en   encryption marker
```

### 4.2 `vehicle` (NEW)
```
vid  vehicle VID
pl   plate
st   idle | loaded | on_route | returned
dv   current driver VID        dn  driver name
tv   current trip VID
cg[] running cargo tally — GENERIC N-bucket per item category:
       { ic: item-category key,  in: display name,
         bk[]: [ { k: bucket-key, v: count } ] }     // e.g. k:"isi"/"kosong" (filled/empty)
ts   last-update string        t   last-update epoch
en   encryption marker
```
> `cg[].bk[]` is deliberately an **array of named buckets**, not fixed `isi/kosong`, so the same shape serves filled/empty gas, full/empty water, or any inventory state set. Replaces the prototype's `isGas()/isGalon()` name-sniffing. Cargo may instead be **computed at render** from `task` actuals + custody baseline — store it only if you want cheap reads.

### 4.3 `site` (REUSE — customers + warehouse are sites)
```
vid  site VID
sn   site/customer name        an/av  cost-center name/VID
ad   address
ll[] geofence: [ { la, lo, ra, li, ln } ]   (existing shape; ra=radius m)
ty   site role: customer | warehouse
st   active | inactive
en   encryption marker
```

### 4.4 `trip` (NEW — the day's route + the gate)
```
vid  trip VID
d8   date (yyyy-mm-dd)
dv/dn  driver           vv/vp  vehicle
gt   gate type:  custody            (generic: could be briefing | equipment | safety)
gs   gate status:  pending | confirmed | confirmed_selisih   ← THE gate field
lb   loaded-by (checker name)       lt  loaded-at epoch       ls  load-session id
cl[] custody load (warehouse manifest vs driver count):
       { iid, in, ity,  wr: warehouse-recorded,  dc: driver-counted }
tc   total stops     cc  closed stops (completed+failed)      (or derive)
st   trip status:  active | paused | closed
t/ts/r
```
> `gs` is what `preconditionGateCard` reads (`[GATE_FIELD]`). The 3-value domain maps to the prototype's `pending` / `confirmed` / `confirmed_selisih`. `gt` keeps the gate **generic** — same widget gates a safety briefing or equipment checkout by changing `gt` + the source.

### 4.5 `task` (NEW — one stop)
```
vid  task VID  (prototype "T-050")
tv   trip VID            dv  driver VID
sv/sn  customer site VID/name      ad  address      ds  distance (display)
so   stop order (1-based)
st   assigned | in_execution | completed | failed | blocked
tt   task type:  deliver | pickup_return
it[] item lines:
       { iid, in, ity: returnable|consumable,
         pd: plan-drop, ad: actual-drop, pp: plan-pickup, ap: actual-pickup }
ca   completed-at string         cc  customer-confirmed (bool, mirror of signature)
oc   outcome:  success | partial | failed
fr   fail reason code  (customer_closed | access_denied | customer_refused | capacity_full)
nt   note     i  photo url(s)     sg  signature url/flag
t/ts/r
```

### 4.6 `event` (REUSE — universal ledger)
One doc per action. Standard envelope + `ev` payload. Event types (`ty`):

| `ty` | When | Updates |
|---|---|---|
| `driver-session-open` | P2 scan (fresh) | `workforce.st=on`, attach `tv` |
| `driver-session-resume` | P2 scan (paused trip) | `workforce.st=on` |
| `driver-session-pause` | exit mid-trip (S1 sheet) | `workforce.st=paused`, `trip.st=paused` |
| `driver-session-end` | clean logout / after return | `workforce.st=off` |
| `custody-confirm` | P6 all match | `trip.gs=confirmed`, seed `vehicle.cg` |
| `custody-mismatch` | P8 report selisih | `trip.gs=confirmed_selisih`, `trip.cl[].dc`, photo+note |
| `delivery-submit` | P11 submit (success/partial) | `task.st=completed` + actuals; `vehicle.cg` recompute |
| `delivery-fail` | P11 failed sheet | `task.st=failed`, `task.fr` |
| `vehicle-return` | P12 serah gudang | `vehicle.st=returned`, `trip.st=closed` |

Envelope per event: `r, ty, t, ts, p, cv/cn`=driver, `sv/sn`=customer-or-warehouse, `av/an`=cost-center, `d`=note, `i`=photo, `ln`=location, `ev`=raw DSL payload (the existing `addToTable`/`addToEvent` string).

---

## 5. Flow → read / write (per page)

| Step (page) | Reads | Writes |
|---|---|---|
| **P2 ScanLogin** | `workforce` by card VID | `event` `driver-session-open\|resume`; `workforce.st`, `tv` |
| **P4 Home** | `trip` (gate `gs`), `task[]` by `tv`, `vehicle.cg` | — |
| **P5 Custody notif** | `trip.cl[]`, `trip.tasks` manifest | — |
| **P6 Independent count** | `trip.cl[].wr` (revealed after count) | (holds `dc` in memory) |
| **P7 Success** | — | `event` `custody-confirm`; `trip.gs=confirmed`; `vehicle.cg` seed |
| **P8/P9 Mismatch** | `trip.cl[]` deltas | `event` `custody-mismatch`; `trip.gs=confirmed_selisih`, `cl[].dc`, photo |
| **P10 Feed** | `task[]` by `tv` grouped by `st` | — |
| **P11 Workspace** | one `task` | `event` `delivery-submit\|fail`; `task` actuals+state; `vehicle.cg` |
| **P12 Return** | `vehicle.cg` remainder | `event` `vehicle-return`; `vehicle.st`, `trip.st=closed` |
| **S1 Pause** | `trip` pending count | `event` `driver-session-pause`; `workforce.st=paused`, `trip.st=paused` |

---

## 6. Mapping to the P2/P4 widget JSON (the `[SRC:*]` / `<N>` tokens)

| Widget token | Resolves to |
|---|---|
| `[SRC:driverTasks]` | `task` collection, filter `tv == {activeTrip}` |
| `[SRC:custodyState]` | the `trip` doc (`gs` = `[GATE_FIELD]`) |
| `[TABLE_PATH]//driver.session` | physical `event` collection, `ty=driver-session-open` |
| `[GATE_FIELD]` / `[PENDING_VALUE]` / `[MISMATCH_VALUE]` | `gs` / `pending` / `confirmed_selisih` |
| `[ITEMS_FIELD]` / `[LABEL_FIELD]` / `[QTY_FIELD]` | `trip.cl` / `cl[].in` / `cl[].wr` |
| `[CATEGORY_FIELD]` (inventory) | `task.it[].ity` (or a new item-category field — see Q) |
| header `[DRIVERNAME]/[VEHICLEID]/[PLATE]` | session tokens from `workforce` + `vehicle` |
| movement `addToTable` `<N>` slots | `event` envelope fields (static low: VID/ts/site; input high: drop/pickup actuals) |

---

## 7. Open questions for the tech lead

1. **Mutable collections vs event-sourced.** Add `vehicle`/`trip`/`task` as real collections (recommended, cheap reads), or derive them from the `event` ledger (most faithful to the attendance pattern)?
2. **Cargo: stored or computed?** Persist `vehicle.cg`, or compute at render from custody baseline ± task actuals?
3. **Serialized vs counted items.** Prototype counts items (`planDrop:4`). Do real cylinders need per-unit QR identity (array of cylinder objects) like the older `Transaction` model, or are counts enough for v1?
4. **Status vocab.** Keep prototype `confirmed_selisih`, or generic `confirmed_mismatch`? (Lives in data → your call.)
5. **Item category field.** Add an explicit `ic` on items for the inventory buckets, or reuse `ity` (returnable/consumable)?
6. **Trip identity.** One `trip` per driver per day, or per vehicle per day (driver swap mid-day)?
7. **`event` vs new ledger.** Do these driver events go into the *shared* `event` collection (with new `ty` values) or a separate `event-driver` collection?
8. **Encryption (`en`).** Which driver fields are sensitive enough to encrypt (customer address? counts?)?

---

## 8. Notes
- All field codes above are **proposed**, chosen to match the observed short-code style — rename freely.
- Geofence reuses the existing `site.ll[]` shape exactly (`la/lo/ra/li/ln`).
- Retention `r` (minutes) and the denormalize-the-actor convention are carried over so these records behave like the live ones.
