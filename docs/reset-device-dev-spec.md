# Reset Device — Dev Spec

- **Date:** 2026-06-10
- **Target repo:** `consteon/web-dev` (Next.js 16 App Router)
- **Status:** Design — ready for implementation
- **Logic mirrored:** Apps Script `changeDevice()` (menu "Reset device") in `scripts/reset-device.js` — match user by **email**, reset device binding. Replaces the slow HTTP-to-Apps-Script call with native Firebase Admin SDK.
- **Queue sheet:** a NEW simple tab — columns `email`, `phone`, `status`. No VLOOKUP, no Apps Script. So web-dev "Add Row" works cleanly (admin types email + phone manually).

> **Why email-match, not vid / invitation:** the queue holds only email + phone, so the match key is **email** (`users_a1.e`). This mirrors `changeDevice`. Resets **all** devices of the matched user (fine for 1-user-1-phone; a multi-device demo account would have all devices reset). Earlier drafts matched by `vid` (1 device) or old invitation `c+i` (reassign) — see §9 note; swap is localized.

---

## 1. Context & Problem

Today operators reset a worker's device in the "autsorz | Support 1D" Google Sheet: pick a key (VID/name) → VLOOKUP fills the row → click a sheet button → Apps Script (`changeDevice` / `updatePhoneInvitation`) talks to Firestore via the `CiFirestore` Apps Script library. It is **slow** (Apps Script HTTP round-trips + 5.5-min execution budget).

This feature moves the operation into web-dev: a queue tab + one button, mutation runs server-side with the Admin SDK.

## 2. Goals / Non-goals

**Goals**
- DSL-driven page (config in Firestore menu JSON); no per-page hardcoded UI.
- Server-authoritative — client never holds/transmits the queue rows.
- Native Admin SDK reset (no Apps Script hop).
- Auditable + confirm-gated (destructive).

**Non-goals**
- Sync Pegawai (roster ↔ `users_a1`). Separate spec.
- Role gate on the endpoint (only admins curate the queue — product decision).
- Porting other Apps Script menu items (`updatePhoneInvitation`, `updateFlag`, `shareSS`, …). Same recipe can add them later.

## 3. Key Decision — Action type, NOT a content type

A new content type (`RESET_DEVICE` mirroring `SPREADSHEET`) was rejected — it would hardcode a button + logic inside the renderer, breaking the no-hardcode / config-in-JSON pattern.

**Decision:** `RESET_DEVICE` is a new **`ClickAction` action type** (sibling of `RESET` / `SUBMIT` / `FETCH_CONTENT`), handled generically in `bar-button.tsx`, backed by a new API route. Button stays fully declared in the menu JSON.

**No global store:** the button resolves `spreadsheetId` + `sheetName` from page config and POSTs those coordinates. The **server re-reads the queue** via `readSheet` — the same pattern `/api/spreadsheet` and `/api/spreadsheet/rows` already use.

Table + "Add Row via drawer" is reused 1:1 from the existing `SPREADSHEET` content + `permission "C"`. No new rendering code.

## 4. End-to-end implementation algorithm (step by step)

### A. Queue sheet (Spreadsheet Engineer)
1. New tab `ResetQueue` (own spreadsheet or a tab in an existing one).
2. Row 1 = header, **exact names** (case-insensitive match in the route):
   | A | B | C |
   |---|---|---|
   | `email` | `phone` | `status` |
3. Data from row 2. So page config: `rowHeader: 1`, `rowStartData: 2`.
4. Format `phone` column as **plain text** (rec #4 — avoid scientific-notation / leading-zero loss). `email` is already text.
5. Share the spreadsheet with `GOOGLE_SERVICE_ACCOUNT_EMAIL` (Editor).
6. `email` = the match key (required). `phone` = display / backup verification. `status` = written back per failed row.

### B. DSL type (Backend dev — `types/menu.type.ts`)
7. Add the action type + generic `confirm`:
```ts
interface BaseAction {
  url: string
  method: HttpMethod
  onSuccess?: OnSuccess
  onError?: OnError
  confirm?: string                  // show AlertDialog with this text before firing
}
interface ResetDeviceAction extends BaseAction {
  type: "RESET_DEVICE"
  target: string                    // content.id of the queue SpreadsheetContent
}
type ClickAction = FetchContentAction | SubmitAction | ResetAction | ResetDeviceAction
```

The route finds the `email` column **by convention** — it scans the header row for a column titled `email` (case-insensitive). No field-mapping config in the JSON. The SE only has to name the column `email` in the sheet.

### C. Button handler (Backend dev — `bar-button.tsx`)
8. In `handleAction`, BEFORE the generic FILTER/ROUTED logic, add a dedicated branch (see §6). It:
   - (rec #3) if `onClick.confirm` set → open `AlertDialog`, fire on confirm.
   - find `pageData.content` where `type==="SPREADSHEET" && id===onClick.target`.
   - resolve `src = srcOverrides[id] ?? content.src`; `spreadsheetId = extractSpreadsheetId(src)`.
   - `POST onClick.url` with `{ spreadsheetId, sheetName, rowHeader, rowStartData }`.
   - on success → toast + `bumpSpreadsheetSyncKey()` (grid refresh).

### D. DTO (Backend dev — `dto/reset-device.dto.ts`)
9. Zod schema for the POST body (§7).

### E. API route (Backend dev — `app/api/reset-device/route.ts`)
10. `getSession()` guard → 401 if none.
11. `ResetDeviceSchema.safeParse(body)` → 400 if invalid.
12. `all = await readSheet(spreadsheetId, sheetName)` (service account).
13. **Column resolution — by convention (no JSON field config):**
    - `header = all[rowHeader - 1] ?? []`
    - `emailCol = header.findIndex(h => String(h).trim().toLowerCase() === "email")`
    - if `emailCol < 0` → 400 `"email column not found"`.
    - (the SE just names the column `email` in the sheet; nothing to declare in JSON)
14. `dataRows = all.slice(rowStartData - 1)`.
15. For each row (see §9 for the Firestore mutation):
    - `email = String(row[emailCol] ?? "").trim()`; if empty → skip (not counted).
    - match + mutate `users_a1`; push to `succeeded` / `failed`.
16. (rec #5) Bounded drain: clear only the rows read, rewrite failed rows at top.
17. Return `{ processed, failed, results }`.

### F. Audit (Backend dev — `lib/firebase/device-reset-logger.ts`)
18. Fire-and-forget writer to `device_reset_logs` (before-state + operator). Modeled on `lib/firebase/spreadsheet-logger.ts`.

### G. Ops
19. Firestore index: single-field on `users_a1.e` is auto-indexed by default — no composite index needed for `where("e","==",…)`.
20. Confirm the queue header names match step 2 exactly.

## 5. DSL changes — `types/menu.type.ts`

(See step 7 above for the full block.)

## 6. Page JSON config (Firestore `users/{uid}.j`)

```jsonc
{
  "label": "Reset Device",
  "icon": "Smartphone",
  "path": "/tools/reset-device",
  "key": "resetDevice",
  "parent": "Tools",
  "pageData": {
    "title": "Reset Device",
    "description": "Queue & proses reset device",
    "topbar": { "alignment": "start", "children": [] },
    "content": [
      {
        "type": "SPREADSHEET",
        "id": "resetQueue",
        "src": "https://docs.google.com/spreadsheets/d/<QUEUE_SHEET_ID>/edit?gid=<GID>",
        "sheetName": "ResetQueue",
        "rowHeader": 1,
        "rowStartData": 2,
        "permission": "C◆U◆D"
      }
    ],
    "bottomBar": {
      "alignment": "end",
      "children": [
        {
          "type": "BUTTON",
          "variant": "destructive",
          "size": "default",
          "text": "Reset Device",
          "icon": "RefreshCw",
          "onClick": {
            "type": "RESET_DEVICE",
            "url": "/api/reset-device",
            "method": "POST",
            "target": "resetQueue",
            "confirm": "Reset device semua baris di queue? Tidak bisa dibatalkan.",
            "onSuccess": { "toast": "Reset device diproses", "then": "REFRESH_CONTENT" },
            "onError": { "toast": "Gagal proses reset" }
          }
        }
      ]
    }
  }
}
```

## 7. `bar-button.tsx` handler + DTO

Handler branch (do NOT reuse `executeAction`, which builds a `{cell,value}[]` payload):

```ts
if (item.onClick.type === "RESET_DEVICE") {
  const action = item.onClick
  // rec #3: if action.confirm set, gate this whole block behind an AlertDialog confirm
  const content = pageData?.content.find(
    (c) => c.type === "SPREADSHEET" && c.id === action.target
  )
  const src = content
    ? (usePageStore.getState().srcOverrides[content.id] ?? content.src)
    : null
  const spreadsheetId = src ? extractSpreadsheetId(src) : null
  if (!spreadsheetId || !content) {
    toast.error("Error!", { description: "Queue spreadsheet not found. Re-sync data." })
    return
  }
  setIsLoading(true)
  try {
    const res = await fetch(action.url, {
      method: action.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spreadsheetId,
        sheetName: content.sheetName,
        rowHeader: content.rowHeader,
        rowStartData: content.rowStartData,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? "")
    if (action.onSuccess?.toast) {
      toast.success("Success!", { description: `${json.processed} reset, ${json.failed} gagal` })
    }
    if (action.onSuccess?.then === "REFRESH_CONTENT") bumpSpreadsheetSyncKey()
  } catch {
    if (action.onError?.toast) toast.error("Error!", { description: action.onError.toast })
  } finally {
    setIsLoading(false)
  }
  return
}
```

`dto/reset-device.dto.ts` (NEW):
```ts
import { z } from "zod"
export const ResetDeviceSchema = z.object({
  spreadsheetId: z.string(),
  sheetName: z.string(),
  rowHeader: z.number().int().min(1),
  rowStartData: z.number().int().min(1),
})
export type ResetDeviceType = z.infer<typeof ResetDeviceSchema>
```

## 8. Apps Script reference — `changeDevice()` (the logic being mirrored)

`scripts/reset-device.js` lines 563–621. Per row:
```
query users_a1 where e == email          → first doc
user doc:  update { u: "TBD" }
dvc:       getDocuments(doc/dvc) → for EACH dvc doc: update { in: false, did: "TBD" }
```
Notes: it takes only the **first** matching doc; loops **all** devices in `dvc`; does NOT touch `e`/`i`/`c`. Status written to col M.

## 9. web-dev port — Firestore mutation (core)

```ts
// per row, after email extracted (§4 step 15)
const snap = await getAdminDb()
  .collection("users_a1")
  .where("e", "==", email)
  .limit(1)                                   // mirror "first doc"
  .get()
if (snap.empty) { results.push({ email, ok:false, reason:"No user with this email" }); continue }

const userDoc = snap.docs[0]
const dvcSnap = await userDoc.ref.collection("dvc").get()

// rec #1: capture before-state BEFORE mutation
const userBefore = userDoc.data()
const dvcBefore  = dvcSnap.docs.map(d => ({ id: d.id, data: d.data() }))

const batch = getAdminDb().batch()
batch.update(userDoc.ref, { u: "TBD" })                         // identity reset (keep e — it's the key)
dvcSnap.docs.forEach(d =>
  batch.update(d.ref, { in: false, did: "TBD" })               // detach every device
)
await batch.commit()

logDeviceReset({                                                // rec #1, fire-and-forget
  email,
  user_doc_id: userDoc.id,
  dvc_ids: dvcSnap.docs.map(d => d.id),
  applied: { user: { u: "TBD" }, dvc: { in: false, did: "TBD" } },
  before: { user: pick(userBefore, ["u"]), dvc: dvcBefore },
  operator: { uid: session.uid, email: session.email ?? "", name: session.name ?? "" },
  ts: new Date().toISOString(),
})

results.push({ email, ok:true, reason:`Done (${dvcSnap.size} device)` })
```

> `pick` = lodash (already a dep).

**Field-value choice (mirror-first):** values mirror `changeDevice` (`u:"TBD"`, dvc `did:"TBD"`, `in:false`). If you want a deeper wipe, add dvc `acc/clt/lif → "-"` — but do **NOT** blank `e` (it is the match key; blanking it breaks re-runs and dedupe).

**Match-key swap (localized):** to target one device instead of the whole user, replace the query with `getAdminDb().collectionGroup("dvc").where("vid","==",vid)` + `dvcDoc.ref.parent.parent` for the user doc, and add a `vid` column to the queue. Nothing else in the route changes.

### 9.1 Queue columns → usage

| Queue header | Used for |
|---|---|
| `email` | match key → `users_a1.e` (required) |
| `phone` | display / manual verification (not queried in email-match mode) |
| `status` | written back on failed rows |

## 10. `users_a1` schema (reference, from prod)

```
users_a1/{userDocId}                       // top-level user doc
  b   "autsorz◆yuna-asia◆kantor-pusat"
  c   "62"
  d   1
  e   "noviana...@gmail.com"               // MATCH KEY (not modified)
  i   "81212143671"
  u   "KwcWF1xucK..."                       // → "TBD"

users_a1/{userDocId}/dvc/{dvcDocId}        // device subcollection — EVERY doc reset
  acc "Dummy"
  clt "DEV2"
  ctr "62"
  did "AP3A.240905..."                      // → "TBD"
  in  true                                  // → false
  lif "1qLM9pJuKi..."
  ph1 ""
  pk1 null
  vid "67382536531130"
```

## 11. API route — `app/api/reset-device/route.ts` (NEW)

```
POST(req):
  session = getSession(); if (!session) → 401
  { spreadsheetId, sheetName, rowHeader, rowStartData } = ResetDeviceSchema.safeParse(body)  // else 400

  all      = await readSheet(spreadsheetId, sheetName)         // service account
  header   = all[rowHeader - 1] ?? []
  emailCol = header.findIndex(h => norm(h) === "email")        // 400 if < 0
  dataRows = all.slice(rowStartData - 1)
  results  = []

  for (row of dataRows):
     email = String(row[emailCol] ?? "").trim()
     if (!email) continue
     match + mutate users_a1 (§9) → results.push({ ok, reason })

  succeeded = results.filter(r => r.ok)
  failed    = results.filter(r => !r.ok)

  // rec #5: bounded drain — clear only the rows read
  bound = rowStartData + dataRows.length - 1
  await clearSheetRange(spreadsheetId, `${sheetName}!A${rowStartData}:Z${bound}`)
  if (failed.length) await updateSheet(spreadsheetId, `${sheetName}!A${rowStartData}`, failed.rows)

  return { processed: succeeded.length, failed: failed.length, results }
```

`lib/google-sheets/sheet.ts` — add:
```ts
export async function clearSheetRange(spreadsheetId: string, range: string) {
  const sheets = getSheets()                 // service account
  return sheets.spreadsheets.values.clear({ spreadsheetId, range })
}
```

## 12. Firestore collection names — fixed in code, never in JSON

- **`users_a1`** — existing prod collection (mobile app `otonomiq` reads/writes it for device binding). NOT created here; only updated. Name = a backend **constant / env var** (`const RESET_COLLECTION = "users_a1"`).
- **`device_reset_logs`** — NEW audit collection (rec #1). Firestore auto-creates on first write.
- **Never** read a collection name from the menu JSON — JSON is editable data; sourcing the collection from it allows arbitrary destructive writes.

## 13. Folded recommendations

| # | Recommendation | Where |
|---|---|---|
| #1 | **Audit before-state** to `device_reset_logs` before mutation (operator + user `u` + full dvc snapshot). Reset is irreversible. | route + `lib/firebase/device-reset-logger.ts` |
| #3 | **Confirm dialog** before firing (destructive bulk). Generic `onClick.confirm`, reuse `AlertDialog`. | menu.type + bar-button |
| #4 | **`phone` plain-text + `.trim()`** on read. Email is text already. | sheet (SE) + route |
| #5 | **Bounded drain** — clear only rows read (`A{start}:Z{start+count-1}`); rows added during processing survive. | route + sheet.ts |
| #6 | **Idempotent** — `e` is the key and is NOT modified, so re-running re-applies the same `u:"TBD"` / `in:false`. Safe to re-run. | (no code) |

> #2 (role gate) intentionally skipped — only admins curate the queue (product decision).

## 14. Auth model

- **Sheet read / clear / write-back:** Google **service account** (`getSheets()` no token). Already proven by `/api/spreadsheet`. Avoids `google_token` 1-hour expiry mid-batch.
- **Firestore:** Firebase **Admin SDK** (`getAdminDb()`).
- **Attribution:** audit log records `session.uid/email/name`.

## 15. Error handling

| Case | Behavior |
|---|---|
| No session | 401 |
| Bad payload | 400 (Zod) |
| `email` column missing | 400 |
| Blank email in a row | skip (not counted) |
| No user with that email | row → failed, stays in queue with reason |
| Batch commit throws | row → failed, continue others |
| Unexpected exception | 500, queue NOT drained |
| Partial success | succeeded rows drained; failed rows rewritten at top with reason |

## 16. Division of labor

**Spreadsheet Engineer (you):**
- Build `ResetQueue` tab: header `email`, `phone`, `status`; data row 2+.
- `phone` column = plain text.
- Share the spreadsheet with the service account.
- Author the page JSON (§6).

**Backend dev:**
- `ResetDeviceAction` + `confirm` in `types/menu.type.ts`.
- `RESET_DEVICE` handler (+ generic confirm dialog) in `bar-button.tsx`.
- `clearSheetRange` in `sheet.ts`.
- `app/api/reset-device/route.ts` (email-match `changeDevice` port: column resolve, query `e==email`, reset user `u` + all dvc, audit, bounded drain).
- `dto/reset-device.dto.ts`, `lib/firebase/device-reset-logger.ts`.

## 17. Test plan (manual e2e)

1. Add a row via Add Row drawer: type `email` + `phone` → row appears.
2. Click Reset Device → confirm dialog → confirm.
3. Verify Firestore: matched user doc `u="TBD"`; every `dvc` doc `in=false`, `did="TBD"`.
4. Verify `device_reset_logs` has a before-state entry + operator.
5. Verify grid refreshes; succeeded rows gone.
6. Bad email: queue an email not in `users_a1` + a valid one → only valid processed; bad row remains with reason; toast `1 reset, 1 gagal`.
7. Multi-device user: verify all that user's dvc docs reset.
8. Concurrency (rec #5): start processing 2 rows, add a 3rd during processing → 3rd survives the drain.

## 18. Future work

- Optional match-key swap to `vid` (1-device precision) — §9 note.
- Port sibling Apps Script ops (`updatePhoneInvitation`, `updateFlag`) as additional `ClickAction` types reusing this recipe.
- **Sync Pegawai** — reconcile roster sheet with `users_a1`. Separate spec.
