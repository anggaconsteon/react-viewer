# Cloud Function `mobileRefresh` — hand-off spec (ready to deploy)

**Audience:** the Firebase `otq-01` owner / backend dev.
**Effort:** ~30 lines Node, clone of the existing `readSS` function. **Zero GAS changes.**
**Status:** fully specified — the GAS route AND its arg-parsing wrapper have both been read; no unknowns.
**Related (app-side, not needed to deploy this CF):** `.claude/plans/fix1-mobilerefresh-spec.md`.

---

## 1. What this does & why

The mobile app renders a server-driven UI stored in Google Sheets. A background engine already mirrors the *source* Sheet → a *proxy* Sheet automatically. The last hop — **proxy Sheet → Firestore `/Proxy/<ssid>`** — is done by the GAS function `mobileRefresh`, and **nothing currently triggers it** (verified: the Apps Script Triggers panel is empty; the engine is driven by an external VM that does *not* call `MOBILEREFRESH`). Result: the Firestore proxy lags the Sheet, so the app's AppBar refresh has to force-pull the Sheet the slow way (`readSS`, 2–8 s).

This CF is the missing trigger. When the app taps refresh it `POST`s this CF (fire-and-forget); the CF calls the already-live GAS route `?action=MOBILEREFRESH`, which reads the proxy Sheet (`getPage`), diffs against the current Firestore proxy, writes only the changed page/system/profile docs under `/Proxy/<ssid>` (checksum-gated), and bumps the parent `/Proxy/<ssid>` doc's `t` → the app's existing live listener repaints. The user never waits on the Sheet read.

**The GAS route already exists** — `doGet` in `Main.gs`: `case "MOBILEREFRESH": mobileRefreshFromProxy(parsed.parameter)`, live since code_ver 4.2311.02 (current deployment = 4.2502.01). No GAS edit.

---

## 2. Contract

| Item | Value |
|---|---|
| Function name / entry point | `mobileRefresh` |
| Project / region | `otq-01` / `asia-northeast1` |
| **Deployed URL (must be exactly this)** | `https://asia-northeast1-otq-01.cloudfunctions.net/mobileRefresh` — sibling of `/readSS`. The app hardcodes this host+path (`functionDomain['default']` + `functionName['mobileRefresh']='/mobileRefresh'`). |
| Auth | Unauthenticated (same as `readSS`). |
| App → CF | `POST`, `application/json`, body `{ "ssid": "<raw sheet id = app #INTERFACE_KEY>", "vid": "[\"<appVid>\"]", "page": "[\"all\"]" }` — **`vid` and `page` are JSON-array _strings_** (see §3). |
| CF → GAS | `GET {prefix}{deploymentId}{postfix}?action=MOBILEREFRESH&ssid=…&vid=…&page=…` — `encodeURI` the whole tail; reuse the `readSS` pool + `prefix`/`postfix`. |
| Response | Pass the GAS body through; app **ignores** it. Return HTTP 200 even on error so the app's un-awaited POST never sees a fatal non-2xx. |
| GAS deployment pool | **Reuse `readSS`'s `getDibArray` verbatim** (`otqma0001..0020`, code_ver 4.2502.01 → has the route). |

---

## 3. ✅ CONFIRMED contract (GAS wrapper read — no guessing)

The URL→args wrapper `mobileRefreshFromProxy` (in `Generic.gs`) is:

```js
function mobileRefreshFromProxy(param) {
  // action=MOBILEREFRESH&ssid=1DDo...&vid=%5B%2260936087747650%22%5D&page=%5B%22all%22%5D
  let retval = 1, result = '';
  try {
    result = mobileRefresh( pars(param.ssid),
                            JSON.parse(decodeURIComponent(param.vid)),
                            JSON.parse(decodeURIComponent(param.page)) );
    retval = 2;
  } catch (e) { retval = -retval; result = ''; }   // any failure → dibResult:-1, empty message
  return JSON.stringify({ "dibResult": retval, "dibMessage": result, "v": code_ver });
}
```

Everything the CF needs is fixed by this:

1. **Param names** = exactly `ssid`, `vid`, `page`.
2. **`vid` / `page`** are read as `JSON.parse(decodeURIComponent(param.x))` → each must be a **URL-encoded JSON array string**. `encodeURI(tail)` on the CF side produces `vid=%5B%2260936087747650%22%5D`; Apps Script decodes it once to `["60936087747650"]`, the wrapper's own `decodeURIComponent` is then a no-op, and `JSON.parse` yields the array. ✔ (A bare `vid=60936087747650`/`page=all` would throw in `JSON.parse` → do **not** send that form.)
3. **`ssid`** goes through `pars()`, which **de-scrambles `od…`-prefixed keys and passes raw sheet ids through unchanged**. Otonomiq `#INTERFACE_KEY` is a raw id (device-confirmed `1hdcFg4…`), so `pars()` is a no-op and `mobileRefresh` writes `/Proxy/<the same id the app subscribes to>`. Send `#INTERFACE_KEY` as-is.
4. **Response** = `{ "dibResult": 2, "dibMessage": "<writeResult>", "v": "4.2502.01" }` on success (`dibResult:-1`, empty message on failure). `dibMessage` is the human string `getPage`/`writeToFirestoreProxy` produce, e.g. `home=Unmodified; login=Modified; …`.

**Params to send for a full refresh:** `vid = ["<appVid>"]` (the tenant's own vid, e.g. `["60936087747650"]`; its value only picks JSON-vs-JSON2 in `getPage`, and is irrelevant when `page=["all"]` because that already forces every page), `page = ["all"]` (includes all pages **and** prunes deleted ones).

---

## 4. `index.js` (copy-paste; only `getDibArray` is stubbed to reuse)

```js
/**
 * Cloud Function: mobileRefresh   (otq-01 / asia-northeast1)
 * Sibling of readSS — reuse its package.json + deploy pipeline.
 * Fire-and-forget trigger: tells GAS DIB to materialize the proxy Sheet into
 * Firestore /Proxy/<ssid> and bump the parent `t` so the app's live listener
 * repaints. GAS route ?action=MOBILEREFRESH is already live (code_ver 4.2502.01).
 */
const axios = require('axios').default;

const prefix  = 'https://script.google.com/macros/s/';
const postfix = '/exec';
let dibArray = [];

// ⚠️ COPY THIS BODY VERBATIM from the existing readSS CF (function-source/index.js
//    → getDibArray). It pushes the otqma0001..0020 deployment IDs. DO NOT retype
//    the IDs (secrets + typo risk) — reuse the exact same pool.
function getDibArray(a) {
  if (a.length < 1) {
    // a.push('AKfyc…');  // otqma0001
    // …                  // otqma0002 … otqma0020  (paste from readSS, unchanged)
  }
  return true;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Fire GAS MOBILEREFRESH. Retry on TRANSPORT error only (rotate server). A
// returned dibResult:-1 is NOT retried — it's a WRITE; a transport retry is still
// safe because the GAS write is checksum-gated (idempotent: re-running finds
// "Unmodified" and no-ops, and the parent `t` is only bumped when something
// actually changed).
async function fireMobileRefresh(ssid, vid, page) {
  getDibArray(dibArray);
  // vid & page are JSON-array strings, e.g. ["60936087747650"] and ["all"].
  // encodeURI escapes the [ ] " → %5B %5D %22, which the GAS wrapper JSON.parses.
  const tail = `?action=MOBILEREFRESH&ssid=${ssid}&vid=${vid}&page=${page}`;
  const encoded = encodeURI(tail);
  let ix = Math.floor(dibArray.length * Math.random());
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {              // ≤3 transport tries
    const url = prefix + dibArray[ix] + postfix + encoded;
    try {
      const res = await axios.get(url, { timeout: 120000 });   // slow: opens proxy Sheet + writes N docs
      return res.data;                                         // any 200 = fired; app ignores body
    } catch (e) {
      lastErr = e;
      ix = (ix + 1) % dibArray.length;                         // next server
      await sleep(200);
    }
  }
  throw lastErr;
}

exports.mobileRefresh = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.ssid) { res.status(400).send(JSON.stringify({ dibResult: -1, dibMessage: 'ssid required' })); return; }
    const data = await fireMobileRefresh(b.ssid, b.vid || '["--"]', b.page || '["all"]');
    res.status(200).send(typeof data === 'string' ? data : JSON.stringify(data));
  } catch (e) {
    console.error('mobileRefresh error:', (e && e.message) || e);
    res.status(200).send(JSON.stringify({ dibResult: -1, dibMessage: String((e && e.message) || e) })); // 200: app fire-forgets
  }
};
```

**Deliberate deviations from `readSS`:**
- `readSS` retries via `callAxiosG` (treats `dibResult<0` as error, retries 5×) — right for a *read*. This is a *write*, so it retries on **transport failure only** (≤3, rotating servers), never re-firing on a soft `dibResult:-1`.
- Added `axios timeout: 120000` (`readSS` has none) — `mobileRefresh` self-labels "expensive… external link for every page"; it legitimately takes longer. Nobody waits (app fire-and-forgets).

---

## 5. package.json + deploy

- **package.json:** reuse `readSS`'s verbatim (same `axios` version).
- **Deploy** with the same generation/runtime/pipeline used for `readSS`/`appStartup2`. Example (match `readSS`'s actual `--gen2`/`--runtime`):
```bash
gcloud functions deploy mobileRefresh \
  --project=otq-01 --region=asia-northeast1 \
  --runtime=nodejs18 --trigger-http --allow-unauthenticated \
  --entry-point=mobileRefresh --timeout=180s
```
Confirm the resulting URL is exactly `https://asia-northeast1-otq-01.cloudfunctions.net/mobileRefresh`.

---

## 6. Verify (independent of the app)

```bash
curl -X POST https://asia-northeast1-otq-01.cloudfunctions.net/mobileRefresh \
  -H 'Content-Type: application/json' \
  -d '{"ssid":"<a REAL tenant #INTERFACE_KEY, raw sheet id>","vid":"[\"60936087747650\"]","page":"[\"all\"]"}'
```
Get a real `#INTERFACE_KEY` from a device's `transactionStore['#INTERFACE_KEY']` or the `SSID` sheet.

**Pass criteria:**
1. Response is `{"dibResult":2,"dibMessage":"…","v":"4.2502.01"}`. The `dibMessage` lists page tokens like `home=Unmodified; login=Modified; …` → the whole CF → GAS → Firestore chain works. `dibResult:2` even with all-`Unmodified` = success. `dibResult:-1` = failure (empty message; suspect a bad ssid or an unreadable proxy Sheet).
2. **Deterministic repaint proof:** first edit one page's content (col B of that page's row in the proxy `JSON` sheet), *then* curl → that page shows `=Modified` **and** the parent `Proxy/<ssid>` doc's **`t` field changes** in Firebase Console. ⚠️ Curling **without changing anything** leaves `t` unmoved (all Unmodified) — correct, not a failure.
3. **End-to-end (after the app side ships):** edit a UI title in the source Sheet → tap refresh → within a few seconds the title updates and the refresh dot goes amber → green.

**Quota note:** `mobileRefresh` reads the `Page` + `System` Firestore collections on every call (a few reads even when nothing changed) and writes only diffs; the GAS comment flags a 100k-calls/day/account ceiling. On-demand per-tap is fine; just don't wire it to fire in a tight loop.

---

## 7. After this CF is live

The app team wires 3 small Flutter edits (`.claude/plans/fix1-mobilerefresh-spec.md`, Part B): register the function name, add a fire-and-forget `mobileRefreshFire()` helper (sends `{ssid: <#INTERFACE_KEY>, vid: ["<appVid>"], page: ["all"]}`), and swap the refresh button from the slow `readSS` force-pull to this CF. The existing Firestore proxy listener (device-confirmed live) does the repaint.

**Security:** do not paste the `getDibArray` deployment IDs, spreadsheet IDs, or any `AKfyc…` string into a tracked repo file — reuse them from the existing `readSS` source in place.
```
