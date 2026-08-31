# Review — `admin-edit-order-qty-dev-spec.md` (fokus §3.3 CF audit)

**Reviewer:** CF session (grounded ke repo `cloud-function`, branch `event-push` @ `cc8679b`)
**Tanggal:** 2026-08-06
**Scope review:** cuma **§3.3 CF audit branch** (`OnTaskWrite` → `order_edit_log`) — itu lane CF. Flutter (§3.1/§3.2) + builder (§3.4/§6) di-luar review ini kecuali interaksinya.
**Verdict:** Desain CF **sehat & arahnya bener** (array lewat Go bukan DSL, server-otoritatif, 1 write atomik, no-cascade). Tapi **5 hal wajib dibenerin sebelum ngoding** — 3 bisa bikin **audit palsu / audit gak jalan / dobel**. Nol asumsi spec yang salah; asumsi §10.4 malah gue verify BENAR.

---

## R1 🔴 — Penempatan di `OnTaskWrite` (early-return bakal nelen audit)
`OnTaskWrite` sekarang (committed):
```go
act := taskAction(oldTst, newTst)
if act == "" { return nil }        // ← early-return SEBELUM parse path
db, tid, tnm, _ := parseTaskPath(newVal.GetName())
switch act { ... }
```
Edit qty **gak flip `tst`** → `act == ""` → **early-return kepicu → cabang audit gak akan jalan.** Jadi audit HARUS dievaluasi sebelum early-return itu. Usul struktur:
```go
act := taskAction(oldTst, newTst)
isEdit := before != nil &&
    strField(after, fieldLedt) != strField(before, fieldLedt) &&
    strField(after, fieldLed) != ""
if act == "" && !isEdit { return nil }        // early-return tetep (update biasa) — tapi edit lolos
db, tid, tnm, err := parseTaskPath(newVal.GetName())
if err != nil { log; return nil }
if isEdit { orderaudit.Audit(ctx, client, db, tid, tnm, before, after) }  // independen, best-effort
switch act { ... }                            // dispatch tst tetep jalan (kalau ada)
```
Audit + dispatch **independen** (spec §3.3 bener) — dua-duanya bisa jalan di 1 write. Optimisasi early-return kejaga (update non-edit + act="" → return).

## R2 🔴 — Gate pakai `ledt`-berubah, BUKAN "diff-dulu-lalu-cek-led"
Spec §3.3: diff dulu → `if len(diff)>0 AND new.led != ""`. Masalah: `led`/`ledt` **nempel permanen** di task sesudah edit pertama. Update lain (delivery nulis `ad`) → `led` masih keisi (leftover) → lolos gate `led!=""`. Sekarang keselametan cuma karena "pd gak berubah" (kebetulan). Rapuh.

Lebih bersih + murah + robust: gate **`new.ledt != old.ledt`** = ada edit BARU (idiom fresh-transition, sama kaya reject/complete/assign). Cek `ledt` (murah) DULU → baru diff `it[]`. Delivery/reject/assign `ledt` gak berubah → skip total, nol diff-cost.

## R3 🔴 — Diff WAJIB numeric-tolerant (bukan string-compare)
`pd/ps/pp` ditulis **String ATAU Number** (addEventRow stringify vs table CRUD native). Pseudocode `old[f] != new[f]` = string-compare → `5` (num) vs `"5"` (str) ke-detect **beda** → **audit palsu** (from:5 to:5). Wajib banding **`fsdoc.AsInt64(old[f]) != fsdoc.AsInt64(new[f])`**. Ini bug diam kalau kelewat.

## R4 🟡 — Best-effort vs retry (keputusan tech-lead)
Audit-write gagal (transient) → 2 pilihan:
- **Retry** (`return err`): Eventarc ulang, reject/complete re-run (idempotent, aman), audit akhirnya keTulis. Bagus buat compliance. Id deterministik (`ledt`) = gak dobel.
- **Best-effort** (`log + return nil`): audit bisa ilang kalau write gagal, tapi gak ganggu router.

Usul: **transient write-err → return err (retry)**; **parse/logic-err → log + nil** (jangan infinite-loop di doc rusak). Audit = catatan penting → condong retry. Konfirmasi.

## R5 🟢 — Asumsi §10.4 "nol konsumen lain nulis `pd`" = VERIFIED
Cek semua penulis task di CF: delivery=`ad`, reject=`vv/tr`, opening=`tr/dn`, assign=`tdt`, reject-clear=`vv/tr`. **Nol yang nulis `pd/ps/pp`.** Jadi diff-pd = murni admin edit. ✅ (Gate tetep pakai R2 `ledt` biar robust, bukan cuma andelin ini.)

---

## Interaksi sama CF yang UDAH ke-commit (aman — verified)
- **reject clear-vv/tr** (`eb3f923`): update `vv/tr`, `ledt` gak berubah → gate R2 gagal → **nol audit palsu.** ✅
- **assign stamp tdt** (`731ed2b`): update `tdt`, `ledt` gak berubah → nol audit. ✅
- **Edit gak flip tst** → `taskAction` dispatch no-op; audit branch jalan sendiri (R1). ✅

## Rumah kode (usul)
`internal/orderaudit` (paket baru, tipis kaya `internal/reorder`):
- **pure** `diffOrder(before, after) []Change` — parse `it[]` old+new (union by `ii`), banding `pd/ps/pp` numeric-tolerant → `[]{ii,in,field,from,to}`. Unit-test penuh (added/removed item, num-vs-string, multi-field).
- `Audit(ctx, client, db, tid, tnm, before, after)` — I/O: bangun `changes[]`, tulis `order_edit_log/{edit-tnm-ledt}` (Set, idempotent).
Dipanggil `OnTaskWrite` (R1). Deploy = **`onTaskWrite`** (udah pending deploy).

## Scope / dependency
- **SHELF + depend Flutter:** CF audit gak nyala sampai Flutter `TASK_EDIT_SUBMIT` nulis `led/ler/ledt`. CF bisa dibangun+ditest sekarang (pure diff), tapi **idle** sampai Flutter jadi. Aman (gak ganggu apa-apa selama `ledt` gak pernah keisi).
- **Dict:** daftar `task.led/ler/ledt` + coll `order_edit_log` (`erf/changes[]/by/reason/at/ts`) ke Dictionary book (`1_XHmo5…`) — pola sama reorder (cek collision: `led`/`ler`/`ledt`/`erf` ke tab existing).

## Nits kecil
- §3.3 id `"edit-"+tnm+"-"+ledt`: pastiin `ledt` epoch-ms konsisten (Number). Kalau Flutter nulis String, id tetep konsisten asal formatnya sama.
- `changes[].in` (nama item) denorm dari `it[]` new (fallback old kalau item di-hapus).
- Field `order_edit_log` — konsisten short-code? `erf/by/at/ts` udah pendek; `changes/reason` agak panjang. Samain gaya sama tab lain kalau mau (opsional).

---

**Ringkas buat author:** desain CF greenlight, tapi sebelum implement: **(R1)** taruh audit sebelum early-return `act==""`, **(R2)** gate `ledt`-berubah bukan led-present, **(R3)** diff numeric-tolerant (`fsdoc.AsInt64`). R4 (retry vs best-effort) = keputusan. R5 udah verified aman. Rumah = `internal/orderaudit`, deploy `onTaskWrite`.
