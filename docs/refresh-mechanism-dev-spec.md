# Otonomiq Refresh Mechanism — Dev Spec (backend)

**Purpose.** Give the backend team a complete, accurate mental model of how the mobile app's server‑driven UI is refreshed, why the AppBar "refresh" is slow today, and exactly how the proposed fix (a thin `mobileRefresh` Cloud Function that triggers the existing GAS `mobileRefresh`) closes the gap **without changing GAS**. Everything below is derived from the live GAS source (`Main.gs`, `Mobile.gs`, `Generic.gs`, `Server.gs`, `Dib.gs`, `Dispatcher.gs`), the `readSS` Cloud Function source, and the Flutter proxy listener.

**Companion docs**
- `.claude/plans/cf-mobilerefresh-handoff.md` — the deploy‑ready CF spec (contract + `index.js` + curl verify). Deploy from that.
- `.claude/plans/fix1-mobilerefresh-spec.md` — the 3 app‑side Flutter edits (done after the CF is live).

---

## 1. TL;DR

- The UI (pages + system + profile) lives in a **Google Sheet** ("proxy Sheet"). It is mirrored into **Firestore** at `/Proxy/<ssid>` so the app can read it fast and live.
- Two independent transports move data to the app:
  1. **`RDV` / `readSS`** — a direct, synchronous Sheet read. **Fresh but slow** (2–8 s) because it opens a bloated workbook. This is what the refresh button uses today.
  2. **Firestore proxy listener** — the app is permanently subscribed to `/Proxy/<ssid>` and repaints instantly when it changes. **Fast, but only as fresh as the last time something wrote Firestore.**
- The function that writes Firestore from the Sheet is GAS **`mobileRefresh`** (`Mobile.gs`), reachable via `doGet` `?action=MOBILEREFRESH`. **Nothing calls it** — no Apps Script trigger, not wired into the engine — so the Firestore proxy lags the Sheet. That is the entire problem.
- **Fix:** on refresh, the app fires a thin Cloud Function (fire‑and‑forget) that calls `?action=MOBILEREFRESH`. GAS writes Firestore, the app's existing listener repaints. The slow Sheet read moves **off the user's wait path**. No GAS change (the route + function already exist and are live in code_ver 4.2502.01).

---

## 2. Glossary

| Term | Meaning |
|---|---|
| **GAS / DIB** | Google Apps Script backend ("Collanium/DIB") — a Sheets‑as‑database opcode engine deployed as a Web App (`…/exec`). Entry points `doGet(e)` / `doPost(e)`. |
| **proxy Sheet / LIF** | The per‑tenant Google Sheet that holds the materialized UI: a `JSON` tab (system + pages), a `Settings` tab (profile), `op1!H11` (home). Also called the LIF workbook. |
| **ssid** | A Google Sheets file id (e.g. `1hdcFg4…`). Sometimes transported in a scrambled `od…` form; `pars()` normalizes it. |
| **`#INTERFACE_KEY`** | The app's stored ssid for the current tenant's proxy Sheet. Raw id for otonomiq. Used both as the `readSS` target and as the Firestore `/Proxy/<ssid>` document id. |
| **vid** | Numeric app/tenant id (otonomiq `60936087747650`; autsorz `70027002611015`). |
| **`/Proxy/<ssid>`** | Firestore materialization of the proxy Sheet (parent doc = profile+timestamp; `Page` & `System` subcollections = UI content). |
| **engine / dispatcher4** | The background job runner that executes sync opcodes; keeps the proxy Sheet current from the source Sheet. |

---

## 3. Architecture — three legs

```
  ┌─────────────┐   Leg ①  ┌──────────────┐   Leg ②  ┌────────────────────┐   Leg ③  ┌──────────┐
  │ SOURCE      │ engine   │ PROXY SHEET  │ mobile   │ FIRESTORE          │ listener │ APP UI   │
  │ sheets      │ (auto)   │ JSON/Settings│ Refresh  │ /Proxy/<ssid>      │ (auto)   │ (Flutter)│
  │ (data)      │─────────▶│ /op1 tabs    │─── ??? ─▶│  + Page/System sub │─────────▶│          │
  └─────────────┘          └──────────────┘          └────────────────────┘          └──────────┘
                                   │
                                   │ RDV / readSS (direct read, SLOW, blocks user)
                                   └───────────────────────────────────────────────▶ APP UI
```

- **Leg ① (source → proxy Sheet): AUTOMATIC.** `dispatcher4` (`Dispatcher.gs`) is driven by an **external VM** that pings the Web App `?action=DSP4A`/`SVR4` on a loop; each cycle runs `exec_job4` opcodes (`[COPYVALUE]`, `[REFRESHFORMULA]`, …) that copy source → proxy Sheet. Note: this is **not** an Apps Script trigger — that's why the Triggers panel is empty yet the proxy Sheet still updates.
- **Leg ② (proxy Sheet → Firestore): the gap.** GAS `mobileRefresh` does this, but **nothing triggers it** (see §5).
- **Leg ③ (Firestore → app): AUTOMATIC.** The Flutter proxy listener is always attached to `/Proxy/<ssid>` and repaints on any change (see §11). Device‑confirmed working.
- **The bypass (RDV):** because Leg ② is dead, the refresh button reads the proxy Sheet **directly** via `RDV`/`readSS` (fresh, but slow, and it blocks the user). Fixing Leg ② lets us stop using this bypass.

---

## 4. Current refresh flow (the slow path)

```
User taps refresh (AppBar)
  app: ConnectionData.getConnection(...)                    // connectivity/preamble
  app: readSettingsContext(context, lifKey, 1)              // lib/api.dart
     → HTTP POST  https://asia-northeast1-otq-01.cloudfunctions.net/readSS
        body { clt, job: [ {ssid:lifKey, type:"A1", rg:"JSON!B1:E"}, {…system ranges…} ] }
     → readSS CF: for each job → GET  {otqma000x}/exec?action=RDV&type=A1&ssid=<lif>&a1=<range>
        (random of otqma0001..0020, retry up to 5, rotate on failure)
        → GAS readValue(par)  [Server.gs]:
             data = SpreadsheetApp.openById(pars(ssid)).getRange(a1).getValues();   // 1 open + 1 read
     ← readResult (fresh) → app rebuilds linkElement / repaints (reloadPage)
```

**Why it's slow.** `readValue` itself is trivial (one `openById` + one `getValues`). The cost is **`openById` of the bloated proxy/LIF workbook** — that one spreadsheet carries the whole Collanium engine (Startup/Instructions/Lock/Checksum/System/JSON tabs + volatile formulas), so Google load+recalc on every open is **2.5–8 s** (confirmed against the Apps Script Executions "Duration" — it is real execution time, i.e. the Sheet read, not queueing and not the JS). Every refresh pays this synchronously.

---

## 5. The gap: Leg ② has no trigger

`mobileRefresh` is reachable only through `doGet`:

```js
// Main.gs
case "MOBILEREFRESH": returnResult = mobileRefreshFromProxy(parsed.parameter); break;
```

Nothing calls that route automatically. Evidence:
- **Apps Script → Triggers = empty** ("0 pemicu"). No time‑driven trigger, no `onEdit`.
- **No `onEdit`/`onOpen`/`ScriptApp.newTrigger`** anywhere in the source.
- The engine has the intended hook **commented out**: in `addFromLink` (`Mobile.gs`) there is literally `// add mobile refresh here to write JSON2 to firestore` — never implemented.
- The app never calls `MOBILEREFRESH` either.

Consequence: after the engine updates the proxy Sheet (Leg ①), **Firestore is never told**, so `/Proxy/<ssid>` stays stale until someone manually hits `MOBILEREFRESH`. The app compensates with the slow `RDV` bypass. (The app even persists `@proxyCS_$ssid` locally specifically to stop the stale Firestore proxy from overwriting a fresh `readSS` pull — direct evidence the proxy chronically lags the Sheet.)

---

## 6. Firestore data model (`/Proxy/<ssid>`)

Written by `mobileRefresh` / `writeToFirestoreProxy` (`Mobile.gs`). Read by the app's proxy listener.

**Parent document `Proxy/<ssid>`** (profile + change clock):

| Field | Source (proxy Sheet) | Notes |
|---|---|---|
| `v` | `Settings!B1` | vid |
| `n` | `Settings!B2` | name |
| `e` | `Settings!B3` | email |
| `p` | `Settings!B4` | phone |
| `ty` | `Settings!B5` | type ('P'/'C', reserved) |
| `t` | `start_time` | **the change clock** — epoch‑ms stamped per invocation; the app's listener gate keys on this. |

**Subcollection `Proxy/<ssid>/Page/<docId>`** — one doc per UI page. Same shape for **`Proxy/<ssid>/System/<docId>`** (system components):

| Field | Meaning |
|---|---|
| `v` | vid number (`storedVid`, see below) |
| `p` | page/component name (e.g. `home`, `login`) |
| `c` | content (the page's JSON/definition string) |
| `t` | `start_time` |

- **docId** = `getDocIdFromSha3(base64( SHA3‑256( storedVid + pageName ) ), 20, tried)` — a base64url slice (last ~20 chars, trailing `=` dropped). `tried` increments only on a hash collision to pick an alternate id.
- **`storedVid` is hard‑coded** to `supportedAppVid = '70027002611015'` (autsorz) for the hash — the passed `vid` is ignored for the docId. **This does not affect otonomiq** because the app reads these subcollections by **scanning and matching the `p` field**, not by recomputing the docId (see §11). So the docId scheme is opaque to the client and safe to leave as‑is.

---

## 7. `mobileRefresh` internals (what a call actually does)

`mobileRefresh(ssKey, appVid, page)` — `ssKey` is a raw ssid, `appVid`/`page` are **arrays** (e.g. `["60936087747650"]`, `["all"]`).

1. **Read the proxy Sheet** via `getPage(ssKey, appVid, page)`:
   - opens `JSON` sheet (or `JSON2` if `appVid[0] === 'updated'`),
   - pages ← `JSON!B51:E` (col B = page name, col C = content), included when `page[0]==='all'` or `page.includes(name)`,
   - system ← `JSON!B6:E49`,
   - profile ← `Settings!B1:B5`, home ← `op1!H11`,
   - returns a JSON object `{ <page>:content, …, _system:{…}, _profile:{…} }`.
2. **Profile diff** against `fsGetDocument('Proxy/'+ssKey)`; create if missing, update if any of `e/n/p/ty/v` changed.
3. **Pages diff**: read `fsGetDocuments('Proxy/'+ssKey+'/Page')` into `pageBefore[p]=c`; for each page where `content !== pageBefore[name]`, call `writeToFirestoreProxy(...)`.
4. **Prune** (only when `page[0]==='all'`): delete Firestore page docs whose page name no longer exists in the Sheet.
5. **System**: same diff/write/prune against `…/System`.
6. **Bump the clock**: if anything changed and the profile write didn't already stamp it, `fsUpdateDocument('Proxy/'+ssKey, { t: start_time })`. **This parent‑`t` change is what wakes the app.**

**`writeToFirestoreProxy` is idempotent / checksum‑gated:** it reads the target doc first and returns `Unmodified` (no write) when `content === c`, `Modified` on change, `Added` on create. The function's return string (e.g. `home=Unmodified; login=Modified; …`) becomes the CF response `dibMessage`.

**Cost note (from the GAS comment):** "expensive… external link for every page." Each call does a handful of Firestore reads (Page + System collections) even when nothing changed, plus one write per changed doc. Quota ceiling ~100k calls/day/account. Fine for on‑demand per‑tap; relevant when choosing a polling interval (§10).

---

## 8. Proposed mechanism (CF‑triggered `mobileRefresh`)

**Idea:** keep Legs ① and ③ as‑is; give Leg ② a trigger. On refresh, the app fires a thin Cloud Function that forwards to the live `MOBILEREFRESH` route. GAS writes Firestore; the app's listener repaints. The user waits on nothing.

**Before (blocking on the Sheet read):**
```
tap ─▶ readSS(RDV) ─▶ openById(bloated) 2–8s ─▶ return ─▶ repaint
        └──────────────── user waits ────────────────┘
```

**After (Sheet read is async, off the wait path):**
```
tap ─▶ POST /mobileRefresh {ssid,vid,page}  (fire-and-forget)   app keeps page usable, dot = amber
             └▶ CF ─▶ GET {otqma000x}/exec?action=MOBILEREFRESH&ssid=&vid=&page=
                          └▶ mobileRefreshFromProxy ─▶ mobileRefresh(pars(ssid),[vid],[page])
                                └▶ getPage(proxy Sheet)  ─▶ diff ─▶ write /Proxy/<ssid> + bump t
     app proxy listener (already attached) fires on parent-t change ─▶ scan Page/System ─▶ repaint ─▶ dot = green
```

The slow `openById` still happens — but **inside the CF/GAS, not in the user's tap**. The app fire‑and‑forgets, so a legitimately slow `mobileRefresh` (opens the proxy Sheet + writes N docs) is invisible to the user.

**Full‑refresh call the app will make:** `ssid = #INTERFACE_KEY` (raw), `vid = ["<appVid>"]`, `page = ["all"]` (all pages + prune stale).

---

## 9. The CF ↔ GAS contract (confirmed against source)

The URL→args wrapper is fixed (`Generic.gs`):

```js
function mobileRefreshFromProxy(param) {
  // action=MOBILEREFRESH&ssid=1DDo...&vid=%5B%2260936087747650%22%5D&page=%5B%22all%22%5D
  result = mobileRefresh( pars(param.ssid),
                          JSON.parse(decodeURIComponent(param.vid)),
                          JSON.parse(decodeURIComponent(param.page)) );
  return JSON.stringify({ "dibResult": retval /*2 ok / -1 err*/, "dibMessage": result, "v": code_ver });
}
```

| Aspect | Value / rule |
|---|---|
| Route | `GET …/exec?action=MOBILEREFRESH&ssid=…&vid=…&page=…` (already live) |
| `ssid` | Sent as the app's `#INTERFACE_KEY`. GAS applies `pars()` = de‑scramble `od…` / **pass raw ids through unchanged**. Otonomiq keys are raw → no‑op → writes exactly where the app subscribes. |
| `vid` / `page` | **URL‑encoded JSON‑array strings.** GAS does `JSON.parse(decodeURIComponent(param.x))`, so `vid=%5B%2260936087747650%22%5D`, `page=%5B%22all%22%5D`. (`encodeURI` of `["…"]` produces exactly this.) A bare `vid=…`/`page=all` throws in `JSON.parse` — do not send it. |
| Response | `{ "dibResult": 2, "dibMessage": "<writeResult>", "v": "4.2502.01" }` on success; `{ "dibResult": -1, "dibMessage": "" }` on failure. The app ignores the body. |

The Cloud Function that fronts this route is fully specified (with `index.js`) in `cf-mobilerefresh-handoff.md`. It is a near‑clone of `readSS`: same deployment pool (`otqma0001..0020`), same `prefix`/`postfix`; it only swaps the action + query builder, retries on **transport** error only (it's a write), and sets a 120 s axios timeout.

---

## 10. Trigger options (pick one or combine)

`mobileRefresh` needs a caller. Three ways, not mutually exclusive:

| | Trigger | Auto? | Backend work | Cost profile | Notes |
|---|---|---|---|---|---|
| **A** | App tap → CF `/mobileRefresh` | On demand | **None (app + 1 CF)** | 1 `mobileRefresh` per refresh tap | Ships now; no GAS/VM access needed. **Recommended first.** |
| **B** | Apps Script **time‑driven trigger** | ✅ every N min | Small GAS: a wrapper that iterates tenants + one trigger | N tenants × (every N min) | A time trigger calls with **no args**, so it needs a wrapper `refreshAllMobiles()` that loops the tenant list (`SSID` sheet) and calls `mobileRefresh(ssid, [vid], ['all'])` each. Needs GAS‑edit access. |
| **C** | **Wire into the engine** | ✅ right after each sync | Small GAS at the existing hook | 1 `mobileRefresh` per sync of that tenant | Uncomment/implement `// add mobile refresh here` in `addFromLink` (`Mobile.gs`), and/or after `refreshProxy` in `doSas`. Most precise (only the tenant that changed), but couples a Firestore write to every submit‑sync. |

**Recommendation.** **A** now (app‑owned, zero backend risk, user‑driven freshness). Add **C** later for hands‑free freshness scoped to actual changes; **B** is the simplest hands‑free option if a tenant list + interval is acceptable. **A + C** together is the ideal end state (C keeps Firestore warm from real edits; A guarantees an immediate refresh on demand).

---

## 11. App‑side consumer (what the backend can rely on)

`subscribeToProxy(ssid)` (`lib/page/main_page.dart`, attached at startup) — **device‑confirmed live**:

```
firestoreDb.collection('Proxy').doc(ssid).snapshots().listen((snap) {
  final rec = snap.data();
  if (rec['t'] == storedCS) return;                 // gate: only act on a NEW parent-t
  // profile → #NAME/#EMAIL/#PHONE from rec e/n/p
  // scan /Proxy/<ssid>/System  → rebuild systemUIComponent  (match by field 'p', content 'c')
  // scan /Proxy/<ssid>/Page    → rebuild screenUIComponent   (match by field 'p', content 'c')
  // constructAllPageElements() + rePaintScreen()             // live UI rebuild
  // persist ui_pages / ui_systems / @proxyCS_$ssid = rec['t']
});
```

Backend‑relevant guarantees:
- The trigger the app reacts to is a **change of the parent `Proxy/<ssid>` `t` field**. Bumping any subcollection doc alone will **not** wake the app — `mobileRefresh` already bumps the parent `t`, so this is handled.
- The app reads Page/System **by scanning the collection and matching the `p` field** — it is **docId‑agnostic**, so the hard‑coded `storedVid` in the docId hash is irrelevant to the client.
- Re‑writing the **same** `t` will not re‑fire (the gate + persisted `@proxyCS_$ssid`). `mobileRefresh` uses a fresh `start_time` each call, so real changes always advance `t`.

---

## 12. Verification & observability

1. **CF in isolation** (from `cf-mobirefresh-handoff.md`):
   ```bash
   curl -X POST https://asia-northeast1-otq-01.cloudfunctions.net/mobileRefresh \
     -H 'Content-Type: application/json' \
     -d '{"ssid":"<real #INTERFACE_KEY>","vid":"[\"60936087747650\"]","page":"[\"all\"]"}'
   ```
   Expect `{"dibResult":2,"dibMessage":"home=Unmodified; …","v":"4.2502.01"}`.
2. **Deterministic repaint proof:** edit one page's content (col B row on the proxy `JSON` sheet) → curl → that page = `Modified` **and** parent `Proxy/<ssid>.t` changes in the Firebase console. (Curling with no change leaves `t` unmoved — expected, not a bug.)
3. **Apps Script → Executions:** `mobileRefreshFromProxy` appears with a Duration ≈ the `openById` + write time; confirms it ran and how long.
4. **End‑to‑end:** edit source Sheet → tap refresh in app → title updates within a few seconds, refresh dot amber → green.

---

## 13. Open decisions for backend

1. **Trigger choice** — A only for now, or also add B/C? (A needs nothing from backend beyond the CF.)
2. **Deployment isolation** — `mobileRefresh` reuses the `readSS` `otqma0001..0020` pool. Acceptable, or isolate the MOBILEREFRESH deployment so a slow write doesn't contend with `RDV` reads under load?
3. **Scale/quota** — for option B/C, confirm the `mobileRefresh` call rate stays well under 100k/day/account; pick an interval (B) or accept per‑submit cost (C).
4. **`storedVid` hard‑code** — leaving `supportedAppVid='70027002611015'` is fine for the current single‑app‑per‑proxy model (client reads by `p`). Revisit only if multiple `vid`s must coexist under one `/Proxy/<ssid>`.
5. **Parent doc fields** — code writes `e/n/p/ty/v/t`. If the client relies on any other parent field (e.g. a `u`/`ty` variant seen on some tenants), confirm `mobileRefresh` populates it.

---

## 14. Appendix — reference

**`doGet` routes** (`Main.gs`): `RDV`→`readValue` (the refresh force‑pull), `MOBILEREFRESH`→`mobileRefreshFromProxy`, `GETPAGE`→`getPageFromSS`, `STARTUP`→`doStartup`, `GETLIST`→`getList`/`voteTable`, `DSP4A`/`SVR4`→`dispatcher4`/`dib4` (engine), plus `FL/SAS/WRV/APN/ADD/LOCK*/CR/CSU`.

**Key functions**: `mobileRefresh`, `getPage`, `writeToFirestoreProxy`, `getDocIdFromSha3` (`Mobile.gs`); `mobileRefreshFromProxy`, `getPageFromSS`, `pars` (`Generic.gs`); `readValue` (`Server.gs`); `dispatcher4` (`Dispatcher.gs`), `exec_job4`/`dib4` (`Dib.gs`).

**Proxy Sheet layout** (per tenant): `JSON!B6:E49` = system, `JSON!B51:E` = pages (B=name, C=content), `Settings!B1:B5` = vid/name/email/phone/type, `op1!H11` = home. `JSON2` = "updated/changed pages" variant (used when `appVid[0]==='updated'`).

**Endpoints**: app CFs on `asia-northeast1-otq-01.cloudfunctions.net` (`/readSS`, `/appStartup2`, and the new `/mobileRefresh`); GAS Web App deployment pool `otqma0001..0020` (`script.google.com/macros/s/…/exec`); the engine's SQL/dispatch backend is a separate GCP project on `us-central1-collanium1-4babc.cloudfunctions.net` (`dispatchServer4`, `endJob4`, `genericSql*`) — informational only, out of scope for this change.

**Security.** GAS holds live spreadsheet ids, `AKfyc…` deployment ids, and a TOTP secret. None are reproduced here; the CF must reuse `readSS`'s deployment list in place rather than copying ids into any tracked file.
```
