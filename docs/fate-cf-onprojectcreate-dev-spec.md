# Fate — Cloud Function `onProjectCreate` (fan-out) — DEV SPEC

> **Owner:** backend (Go) · **Repo:** numpang module asset_cache (`C:\...\consteon\cloud-function`), **function baru terpisah** · **Stack:** Go, Firestore Gen2 trigger, deploy `gcloud`
> **Tujuan:** 1 form create → 1 `project` doc; CF pecah `project.mv[]` jadi N baris `assign` (1 per model, snapshot sama, beda `vid`/`mn`). App TIDAK menulis `assign`.

---

## 1. Kenapa CF (bukan app tulis N baris)
`addToTable`/`addToEvent` menulis jumlah doc **fixed di design-time** (`◆` static). Jumlah model **dinamis runtime** (1–8). Jadi assign = **derived** dari `project.mv[]` — ditulis CF, bukan app. Pola identik `movement → asset_cache` (derived state = CF-only).

---

## 2. Trigger
- **Event:** Firestore `create` (Gen2 `cloudevent`, `google.cloud.firestore.document.v1.created`)
- **Path:** `MobileTable/{tenant}/tables/{tv}/project/{pv}`
  (nested path Consteon; `{tenant}`,`{tv}`,`{pv}` = wildcard)
- **Bukan** trigger `movement` — function sendiri, deploy name sendiri (`onFateProjectCreate`), biar bug Fate gak maksa redeploy asset_cache.

---

## 3. Input — `project` doc (snapshot on create)
```json
{
  "br": "Bloom Jewelry",
  "ti": "Editorial — Fine Line",
  "ve": "Studio Nine, SCBD",
  "d8": "5 Jul",
  "s1": "09:00",
  "e1": "17:00",
  "av": "AG-01",
  "an": "Fate",
  "cat": 1751000000000,
  "mv": ["Kirana", "Dara", "Sasha"]
}
```
`mv` = **array<string>** (Firestore array type, BUKAN CSV string — lihat Flutter spec §serialize). `pv` = doc id (`context.params.pv`).

---

## 4. Output — N baris `assign`
Doc-id **keyed** `{pv}_{vid}` (idempotent). Per model:
```json
// assign/{pv}_Kirana
{
  "pv": "PRJ-002",
  "vid": "Kirana",
  "mn": "Kirana",          // resolve dari //user/{vid}.n (lihat §5)
  "br": "Bloom Jewelry", "ti": "Editorial — Fine Line",
  "ve": "Studio Nine, SCBD", "d8": "5 Jul",
  "s1": "09:00", "e1": "17:00",
  "st": "assigned",
  "ar": null, "co": null, "ai": null, "ci": null,
  "ss": null, "cft": null
}
```
Snapshot `br/ti/ve/d8/s1/e1` = copy dari project (denorm, Model Home render tanpa baca project).

---

## 5. Algoritma
```
onFateProjectCreate(event):
  p   = event.value.fields
  pv  = event.params["pv"]; tenant, tv = event.params[...]
  mv  = p["mv"].arrayValue            // []string
  if mv empty: log warn, return       // gak ada model = no-op

  base = { pv, br:p.br, ti:p.ti, ve:p.ve, d8:p.d8, s1:p.s1, e1:p.e1,
           st:"assigned", ar:null, co:null, ai:null, ci:null, ss:null, cft:null }

  batch = firestore.BulkWriter()      // atau WriteBatch (≤500)
  for vid in mv:
     mn = resolveName(tenant, tv, vid)         // //user/{vid}.n ; fallback = vid
     ref = assign/{pv}_{vid}
     batch.Set(ref, {...base, vid, mn}, MergeMissing)   // set, aman re-run
  batch.Flush()
```
- **`resolveName`**: read `MobileTable/{tenant}/tables/{tv}/user/{vid}` → field `n`. Kalau `mv` udah bawa nama (MVP baked pool), skip lookup, `mn = vid`. Cache per-invocation biar gak double-read.
- **Idempotent**: doc-id keyed `{pv}_{vid}` + `Set` → re-trigger/retry = overwrite sama, gak dobel. **JANGAN** auto-id.
- **Type contract** [[project_runtime_type_contract]]: `vid/pv/mn/br/ti/ve/d8/s1/e1/st` = **String**; `cat/ar/co/cft` = **Number** epoch (null kalau belum); `mv` input = array<string>.

---

## 6. Idempotency & retry
- Gen2 = at-least-once → CF bisa jalan >1×. Doc-id keyed + `Set` = aman.
- Partial write (batch putus di tengah): retry ulang loop penuh, doc yg udah ada ke-overwrite identik. No dupe, no drift.
- **Anti-clobber state**: kalau `assign` udah ada & model udah lapor (`st!=assigned`), **JANGAN timpa** `st/ar/co/ai/ci`. Pakai `Create` (fail-if-exists) per doc ATAU merge hanya field snapshot. → Rekom: `Create`; kalau `AlreadyExists`, skip (create hanya nulis yg belum ada). Ini bikin re-trigger gak reset progress model.

---

## 7. Scope
- **IN:** `onCreate` project → fan-out assign.
- **OUT (nanti, function/spec lain):**
  - Project **update** (agency tambah/hapus model setelah create) → `onProjectUpdate` diff `mv[]`, add baru / soft-remove. TIDAK di spec ini.
  - Denorm sync (agency edit brand/title) → fan-out update snapshot. TIDAK di spec ini.
- **Non-goal:** hitung selisih/lembur (derived client), tulis event (app yg addToEvent).

---

## 8. Deploy
- Numpang module asset_cache (reuse firestore client init, helper idempotency, tooling). **Function baru**, entrypoint `OnFateProjectCreate`.
- `gcloud functions deploy on-fate-project-create --gen2 --runtime go122 --trigger-event-filters ...project/{pv} ...`
- Firestore SDK pin **v1.17.0** (go122 compat, sama kaya asset_cache).
- **Cek dulu:** Fate 1 GCP project sama VTL atau beda. Beda → deploy target beda.

---

## 9. Acceptance
1. Create project `mv:["Kirana","Dara","Sasha"]` → **3 doc** `assign/{pv}_Kirana|Dara|Sasha`, `st:"assigned"`, snapshot cocok.
2. `mv:["Kirana"]` → 1 doc. `mv:[]` → 0 doc, no error.
3. Re-trigger manual (retry) → tetap 3 doc, **gak dobel**, progress model (`st=present`) **gak ke-reset**.
4. `mn` = nama dari `//user`, bukan vid (kalau lookup mode).
5. `mv` string CSV (`"Kirana,Dara"`) → **REJECT/log error** (harus array). Bukti Flutter serialize bener.
