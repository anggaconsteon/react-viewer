# CF `onFateWrite` — Dev Spec (Go, repo `Consteon/asset_cache`)

Tanggal: 2026-07-14 · Status: PROPOSED
Induk: `docs/fate-runtime-dev-spec.md` (schema & widget). Spec ini = detail implementasi Cloud Function saja.

---

## 1. Keputusan arsitektur

**SATU function deployed: `onFateWrite`.** Bukan dua. Trigger Firestore `onDocumentWritten` dengan path pattern wildcard di segmen collection, routing internal berdasarkan nama coll + jenis perubahan. Alasan: 1x deploy, nambah domain berikutnya (complaint/sales) = nambah `case` bukan function baru. Trade-off yang sudah di-ACC owner: function kepanggil untuk SEMUA write coll tenant → wajib early-return secepat mungkin untuk coll yang bukan urusan.

## 2. Trigger

```
Event    : google.cloud.firestore.document.v1.written  (onDocumentWritten)
Document : MobileTable/{root}/tables/{tenant}/{coll}/{docId}
```
- Path pattern EXACT: samakan dengan trigger fn existing di repo (movement/task/vehicle_check sudah pakai struktur doc yang sama) — jangan hardcode id `root`/`tenant`, ambil dari wildcard.
- `{coll}` dan `{tenant}` dibaca dari `event.PathParams` (atau parse resource name).

## 3. Routing (isi function)

```go
func onFateWrite(ctx context.Context, e FirestoreEvent) error {
    coll := e.Param("coll")
    switch coll {
    case "fate_project":
        if e.Before == nil && e.After != nil {          // CREATE only
            return handleProjectCreated(ctx, e)
        }
    case "fate_assign":
        if e.Before != nil && e.After != nil {          // UPDATE only
            return handleAssignUpdated(ctx, e)
        }
    }
    return nil // coll lain / event type lain: early return, no log spam
}
```
Log prefix per handler: `[fate/project]` / `[fate/assign]` — biar monitoring 1 function tetap kebaca per domain.

## 4. Data contract

### In: `//fate_project` (ditulis form ops)
`pn` S (FPRJ-…), `bn` `tt` `vn` S, `dt` S display, `dts` N epoch, `st` `et` S "HH:mm", `mv[]` arr vid, `mn[]` arr nama, `cv/cn/av/an/sv/sn` S, `t/ts`.

### In/Out: `//fate_assign` (CF create; app update via updateEventRow)
Doc id = AUTO-ID Firestore (revisi owner 2026-07-15). `anm` S = auto-id doc (identitas logis, = doc id) · `pn` S · denorm `bn tt vn dt dts st et` · `mv mnn` S · `ast` S (assigned/scheduled/present/awaiting/closed) · `arr cmp` S "HH:mm" · `ai ci` S url · `ovm` N · `ss` S (pending/confirmed/disputed) · `scn sct` S.

### Out: `//model_cache` (CF only, doc id = `mv` — vid model POLOS; dipertahankan non-auto: jaminan 1 doc per model tanpa query, jelek di data live hanya karena bug backtick)
`mv mnn` S · `cst` S (on_job/awaiting/scheduled/assigned/idle) · `cpn cbn ctt` S · `pa` N · `na` N · `lat` N epoch.

## 5. Handler A — `handleProjectCreated`

Input: doc `fate_project` baru.
0. **PARSER `mv`/`mn` (WAJIB — BUG DITEMUKAN LIVE 2026-07-15).** Wire format actual dari renderer TABLE_PICKER multi = STRING dengan quote backtick-ganda, BUKAN array Firestore:
   ```
   mv: "[``eVUHmqhlfSkJ1hMI60Mn``,``nf34YyzwKPAHZWjlizYq``,``K5InPQUua1fSUKYmyFF5``]"
   mn: "[``Agenia Demo-7``,``Agenia Demo-3``,``Autsorz``]"
   ```
   Naive split-by-comma TANPA strip menghasilkan id kotor (`[`+backtick kebawa ke `anm` & doc id `model_cache` → lookup `mv◼{vid}` app tidak match — sudah terjadi di data live). Wajib normalize:
   **KEPUTUSAN FORMAT (owner + sheet, 2026-07-15): format backtick DIPERTAHANKAN** — alternatif ditolak: JSON `"` (risiko korup di layer transport/ev-embed), `◆`-separated (bentrok multi-statement separator addToTable/addToEvent, precedent `doc◆history`). Format backtick self-delimiting asal parser split pakai delimiter LENGKAP `` ``,`` `` (backtick-koma-backtick) — bukan koma polos — sehingga nama mengandung koma pun aman:
   ```go
   // parseModelList: terima array native, string backtick-array, atau string single vid
   func parseModelList(v interface{}) []string {
       out := []string{}
       clean := func(s string) string { return strings.Trim(strings.TrimSpace(s), "` ") }
       switch x := v.(type) {
       case []interface{}: // future: array native
           for _, e := range x { if s := clean(fmt.Sprint(e)); s != "" { out = append(out, s) } }
       case string:
           s := strings.TrimSpace(x)
           s = strings.TrimPrefix(s, "[")
           s = strings.TrimSuffix(s, "]")
           for _, p := range strings.Split(s, "``,``") { // delimiter penuh — koma dalam nama TIDAK pecah
               if c := clean(p); c != "" { out = append(out, c) }
           }
       }
       return out
   }
   ```
   Test wajib parser: `"[``a``,``b``,``c``]"` → 3 elemen polos; `"[``Test, Jr``]"` → 1 elemen `Test, Jr`; `"``vid``"` / `"vid"` polos → 1 elemen; `""` → 0 elemen.
   **SEMUA field turunan WAJIB pakai nilai hasil parse — dilarang copy potongan mentah** (bug live: `fate_assign.mv = "``K5InPQUua1fSUKYmyFF5``]"`, `mnn = "``Autsorz``]"` — trailing `]` & backtick nyangkut di VALUE, bukan cuma doc id). Cakupan nilai polos: `fate_assign.mv`/`.mnn`, `model_cache` doc id/`.mv`/`.mnn`, dan `mnn`/`cpn`/`cbn`/`ctt` yang diderivasi. Doc `fate_project` TIDAK dinormalize — `mv`/`mn` wire string dibiarkan apa adanya (source of truth).
1. Validasi: `pn` non-empty, `mv[]` non-empty. `mn[]` panjangnya harus sama dengan `mv[]`; kalau beda → pakai index yang ada, sisanya `mnn:""` + log WARN (jangan gagal total).
2. Untuk tiap `mv[i]` — **REVISI 2026-07-15 (owner): doc id = AUTO-ID Firestore, BUKAN `{pn}-{mv}`**:
   - **Existence check dulu (pengganti idempotency id deterministik — WAJIB):** query `fate_assign` where `pn == pn AND mv == mv[i]`; kalau sudah ada → skip create (trigger Firestore at-least-once, tanpa check ini replay = doc dobel).
   - Create: `ref := col.NewDoc()` lalu Set — field **`anm` = `ref.ID`** (auto-id jadi identitas logis; dipakai app buat routeParams/updateEventRow/erf):
     ```
     anm={autoId}, pn, bn, tt, vn, dt, dts, st, et,   // denorm
     mv=mv[i], mnn=mn[i], ast="assigned",
     ss="", ovm tidak diisi
     ```
3. Refresh `model_cache` untuk tiap `mv[i]` (lihat §7).
4. Tulis 1 event ledger per model ke `{tenant}//event` (keyed append): `r◼4320, ty◼fate, ept◼fate_assign, erf◼{anm}, epn◼{pn}, d◼"Di-assign ke project {tt}", cv/cn ← av? pakai cv/cn project, av/an/sv/sn ← copy dari doc project, t=epoch now, ts=display` — biar timeline assign (`[[◀erf▶◼{anm}]]`) & timeline project (`[[◀epn▶◼{pn}]]`) langsung punya entri pertama. (Event submit project sendiri sudah ditulis app.)
5. JANGAN menulis balik ke `fate_project` (hindari trigger loop).

Edge:
- `mv[]` berisi duplikat vid → dedup dulu.
- Project di-EDIT setelah create (tambah model) — OUT OF SCOPE v1 (trigger hanya create). Catat di README.

## 6. Handler B — `handleAssignUpdated`

Input: before+after doc `fate_assign`.

**Anti-loop guard (WAJIB, baris pertama):** handler ini sendiri menulis `fate_assign` → trigger fire lagi. Return cepat kalau tidak ada kerjaan:
```go
if after.Cmp == "" { goto refreshCacheOnly }          // belum lapor selesai
if after.Ovm != nil || after.Ast == "awaiting" || after.Ast == "closed" && before.Cmp == after.Cmp {
    goto refreshCacheOnly                              // sudah diproses
}
```
Kondisi kerja: `cmp` BARU terisi (before.cmp kosong, after.cmp ada) dan `ovm` belum di-set.

1. Hitung selisih: `ovm = max(0, toMin(cmp) − toMin(et))`, `toMin("HH:mm") = HH*60+mm`.
   - Edge lintas-hari: kalau `cmp < st` (lapor selesai dini hari setelah jadwal malam) → v1: anggap `ovm = toMin(cmp) + 1440 − toMin(et)`? TIDAK — v1 SIMPLE: kalau `cmp < et` maka `ovm = 0`. Kasus lintas tengah malam dicatat sebagai limitation v1 (fase 2 pakai epoch penuh, bukan "HH:mm").
2. Update doc yang sama (1 write):
   - `ovm` = hasil, dan
   - `ovm > 0` → `ast="awaiting"`, `ss="pending"`
   - `ovm == 0` → `ast="closed"`
3. Refresh `model_cache` model tsb (§7).

Perubahan lain (`ast` di-update app: assigned→scheduled→present; ops konfirmasi selisih: `ss`+`ast=closed`) → cukup refresh `model_cache`, tanpa hitung ulang.

## 7. `refreshModelCache(mv)`

Query semua `fate_assign` where `mv == {mv}` AND `ast != "closed"` (atau ambil semua lalu filter — volume kecil).
```
prioritas cst: present→"on_job" > awaiting→"awaiting" > scheduled→"scheduled" > assigned→"assigned" > (kosong)→"idle"
```
Tulis/upsert `model_cache/{mv}`:
- `cst` = prioritas tertinggi; `cpn/cbn/ctt` = dari assignment pemenang prioritas (kosongkan kalau idle)
- `pa` = count `ast=="assigned"` · `na` = count non-closed · `lat` = now epoch · `mnn` dari assignment terbaru.
Full recompute per model tiap panggil (bukan incremental) = idempotent & self-healing, pola sama dengan reconcile asset_cache.

## 8. Deploy & repo

- Repo `Consteon/asset_cache` (dir `consteon\cloud-function`), tambah handler di samping 7 fn existing.
- Makefile: tambah target `deploy-onFateWrite`, deploy DIRECT sebagai `dsatria` (build submit via SA kena 403 IAM — pola deploy existing).
- Region/project: ikut fn existing (`otq-01`).
- Env/konstanta: TIDAK hardcode tenant — semua dari path params.

## 8b. Cleanup data kotor (sekali, sebelum re-test)

Build pertama CF sudah nulis id kotor. Setelah patch parser deployed:
1. Hapus 3 doc `fate_assign` `FPRJ-2026-000001-*` (yang mengandung `[`/backtick).
2. Hapus 3 doc `model_cache` (id backtick).
3. Doc `fate_project` FPRJ-2026-000001 boleh dibiarkan ATAU dihapus — trigger hanya CREATE, jadi re-test = bikin project BARU dari app (bukan edit doc lama).

## 9. Test checklist (manual, Firestore console)

1. Create `fate_project` dgn `mv[]` 2 model → muncul 2 doc `fate_assign` (doc id auto, field `anm`=doc id, ast=assigned, denorm benar) + 2 doc `model_cache` (id = vid polos, cst=assigned, pa=1). **Assert nilai FIELD polos: `fate_assign.mv`/`mnn` & `model_cache.mv`/`mnn` TANPA `[` `]` backtick** — elemen pertama & TERAKHIR dicek dua-duanya (bug live: elemen terakhir bawa trailing `]`).
2. Create project yang sama lagi (replay) → tidak ada doc dobel.
3. Update assign `ast=scheduled` → model_cache cst=scheduled; TIDAK ada perubahan ovm.
4. Update assign `arr` + `ast=present` → cst=on_job.
5. Update assign `cmp="17:04"` (et="17:00") → CF set `ovm=4, ast=awaiting, ss=pending`; cst=awaiting; **tidak infinite loop** (cek log: invocation kedua early-return).
6. Update assign `cmp="16:50"` → `ovm=0, ast=closed`; model tanpa assignment aktif lain → cst=idle, cpn kosong.
7. Ops konfirmasi: `ss=confirmed, ast=closed` → cache refresh, tanpa hitung ulang.
8. Write ke coll lain (mis. `event`) → function early-return (cek log tidak ada noise).
