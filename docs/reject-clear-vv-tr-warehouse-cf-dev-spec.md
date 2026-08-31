# Reject clear `vv`+`tr` — rejected task lepas dari scope warehouse (Dev Spec)

**Tanggal:** 2026-08-05
**Buat:** dev Go (CF — `internal/movement/task_reject.go`).
**Status:** PROPOSED (keputusan user 2026-08-05).
**Konteks / Konsumen pertama:** galon VTL (tenant `20342033315492`, table `84214220504259`). Repo `cloud-function` branch `event-push`.
**Referensi:** `internal/movement/task_reject.go` (`TaskRejected`), `task_write_trigger.go` (`OnTaskWrite`/`taskAction`), memory `project_asset_cache_cf` · `project_task_onwrite_consolidation` · `project_driver_return_pindah_fixes`.

---

## 1. Kenapa

Reject (Tolak) = **pre-custody**, udah bener: driver liat "Rute Hari Ini" sebelum konfirmasi, tolak task yang ga searah → CF `recomputeIE` nge-shrink `ie[]` (10→5) + `emitUnloadMovements` nurunin barang task ditolak balik gudang → custody driver ngitung 5, match. Flow ini OK, JANGAN diubah.

**Bug:** setelah reject, task jadi `tst:load_rejected` tapi **`vv` (dan `tr`) nya masih keset**. Warehouse `VEHICLE_FEED_LIST` (WarehouseFeed) nentuin status mobil dari:
```
taskSearch: "vv◼{lv}⭘tdt◼{today}"   (per-mobil/hari, TANPA exclude load_rejected)
```
→ task rejected masih keitung **stop aktif** → gudang liat **"Dalam Perjalanan"** walau driver udah return (`rt:returned`) → **gak bisa closing**, list gak keklik.

Driver-side aman (widget-nya `excludeStatus:load_rejected` + scope `tr◼{activeTrip}`). Warehouse-side ENGGAK punya exclude → nyangkut.

**Kenapa fix di CF (bukan Flutter/config):** clear via `updateEventRow` config = Flutter nulis `vv◼` kosong di write yang sama → CF baca fields BARU (`f`) → kehilangan `vv`/`tr` buat unload/recompute. Di CF, clear dilakuin **setelah** unload+recompute (nilai udah kepakai), jadi aman. Nol Flutter, nol config, deploy cepet.

## 2. Konsep

Task `load_rejected` = ditolak, balik ke admin buat assign ulang → **lepas dari mobil + trip ini**. Jadi `vv`+`tr` harus dikosongin. Efeknya sekali beres di semua scope:
- warehouse `vv◼{lv}` → rejected task drop → gudang liat "Selesai" → closing kebuka
- driver `tr◼{activeTrip}` + `{allClosed}` → drop (udah aman via excludeStatus, ini backstop)
- admin "Assign Ulang" (grup `tst:load_rejected`, gak pake vv) → tetep muncul → reassign nge-set `vv` baru

## 3. Kontrak CF (dev Go)

**File:** `internal/movement/task_reject.go`, fungsi `TaskRejected`.

**Tambahan:** SETELAH `emitUnloadMovements` + `recomputeIE` sukses (baris ~124-127), tambah 1 langkah — clear `vv` + `tr` di task:
```go
// Rejected task lepas dari mobil + trip: kosongin vv+tr biar keluar dari
// scope per-vehicle warehouse (VEHICLE_FEED_LIST taskSearch vv◼{lv}) dan
// per-trip driver (tr◼{activeTrip}). Dilakuin PALING AKHIR — unload &
// recompute di atas udah pake vv/gl/tr dari event payload (frozen), jadi
// clear di sini gak ganggu mereka. Admin "Assign Ulang" nge-set vv baru.
if _, err := client.Doc(paths.Base(db, tid)+"/"+taskCollection+"/"+tnm).
    Set(ctx, map[string]interface{}{fieldVV: "", fieldTr: ""}, firestore.MergeAll); err != nil {
    log.Printf("ERROR clear vv/tr task %s: %v", tnm, err)
    return err // transient -> retry
}
```

**Urutan WAJIB:** clear = langkah TERAKHIR, sesudah (a) unload (b) recompute. Dua langkah itu butuh `vv`/`gl`/`tr`.

**Idempotensi & anti-loop:**
- Self-write ini update task tapi **`tst` gak berubah** (tetep `load_rejected`). `OnTaskWrite`/`taskAction` gate reject = `newTst == "load_rejected" && oldTst != "load_rejected"`. Karena `oldTst` udah `load_rejected` → gate GAGAL → **gak re-fire** reject. No loop.
- Retry-safe: reads (`vv`,`gl`,`tdt`) diambil dari **event payload `f` (frozen)**, bukan doc live. Retry event yang sama tetep bawa `vv`/`gl` asli → unload (id deterministik = idempotent) + recompute (idempotent) + clear (set "" lagi = no-op) semua aman walau doc-nya udah ke-clear.

**Field:** pakai `fieldVV` (udah ada, `"vv"`) + `fieldTr` (udah ada, `"tr"`). Nol field baru.

## 4. Interaksi yang udah dicek (aman)

- **`recomputeIE` cancel-branch** (semua task rejected → `cst=cancelled` + `clearVehicleDriver`): recompute query `Where(tr==vcRef.ID)`. Task yang tr-nya udah ke-clear (dari reject sebelumnya) drop dari query — TAPI dia rejected (kontribusi 0), jadi `entries` (dari non-rejected) gak kepengaruh. Reject TERAKHIR di trip yang all-rejected tetep liat `entries==0` → cancel jalan. ✓
- **Admin Assign Ulang:** AdminTaskList grup `tst:load_rejected` search by tst, kartu nampil `<kn>/<al>/<tnm>` — gak pake `vv`/`ln`. Clear vv gak ganggu tampilan. Reassign (AssignVehicle→AssignConfirm) nulis `vv` baru. ✓
- **Audit:** `vv` yang di-reject udah kerekam di `movement` (unload, `fl=vv`) + evidence. Clear di task doc gak ilangin jejak. ✓

## 5. Deliverable

| Bagian | Siapa | Status |
|---|---|---|
| `TaskRejected` +clear `vv`+`tr` (langkah terakhir) | dev Go | ✅ PUSHED `eb3f923` origin/event-push |
| Test: reject → task `vv`/`tr` kosong; self-write gak re-trigger; retry idempotent; all-rejected cancel tetep jalan | dev Go | ✅ anti-loop ketutup `TestTaskAction` (load_rejected→load_rejected="" ); I/O clear = straight Set (gak di-unit-test, konsisten unload/recompute) |
| Deploy `OnTaskWrite` (barengan konsolidasi yang pending) | devops | ⬜ BELUM DEPLOY |

> Nit doc: §3 "reads (vv,gl,tdt) dari frozen `f`" — `tr` GAK sepenuhnya frozen (ada live re-read baris 100-106 kalau `f.tr` kosong). Retry-safe TETAP valid (recomputeIE handle tr="" + semua idempotent), cuma kalimatnya perlu dikoreksi.

## 6. Not Doing (dan kenapa)

- **Gate tombol Tolak ke pre-custody (Problem A)** — DITOLAK sebagai isu: user KONFIRMASI reject emang pre-custody, flow-nya bener. Gak ada post-custody reject. (Kalau nanti kejadian, itu isu app-gate kepisah.)
- **Exclude load_rejected di `VEHICLE_FEED_LIST` (renderer)** — alternatif Flutter; ditinggal karena deploy Flutter lama + clear-vv nutup akar lebih bersih (rejected task lepas scope, bukan tambal per-widget).
- **Clear `vv` via config `updateEventRow`** — bikin CF kehilangan vv/tr buat unload (baca fields baru). Harus di CF sesudah reads.

## 7. Acceptance

- [ ] Reject task pre-custody → `recomputeIE` shrink `ie[]` + unload (UNCHANGED) → custody driver match. (regресi check flow lama)
- [ ] Sesudah reject → task doc `vv==""` DAN `tr==""`.
- [ ] Warehouse `VEHICLE_FEED_LIST` gak itung task rejected → mobil (dgn sisa task completed) nampil **"Selesai · Pengecekan Penutupan"**, closing keklik.
- [ ] Driver udah return → gak ke-blok gara2 rejected task.
- [ ] Self-write clear gak re-trigger reject (log cuma 1× "reject-unload").
- [ ] Retry event reject → tetep idempotent (unload/recompute/clear gak dobel-efek).
- [ ] Trip all-rejected → check tetep `cst=cancelled` + driver designation ke-clear (cancel-branch gak rusak).
- [ ] Admin "Assign Ulang" task ditolak → tetep muncul, reassign nge-set `vv` baru.

## 8. Asumsi & risiko

- [ ] `VEHICLE_FEED_LIST` nentuin "in route vs selesai" murni dari `taskSearch` state (bukan dari `rt:returned` opening check). Clear-vv nutup kasus ini; kalau ternyata warehouse juga baca sinyal lain, verifikasi.
- [ ] Gak ada konsumen lain yang butuh `vv`/`tr` bertahan di task `load_rejected` (dicek: admin reassign, audit — aman).
- [ ] `tr` kadang ke-stamp async (OnVehicleOpening) — kalau reject super-cepet `tr` masih "" pas clear, ya udah (emang mau dikosongin). vv pasti ada (di-gate baris 85).

---

**Referensi:** `internal/movement/task_reject.go` · `task_write_trigger.go` (`taskAction` gate) · `internal/movement/vehicle_closing.go` (closing yang keblok) · op1Screen `VEHICLE_FEED_LIST` @WarehouseFeed(715) `taskSearch:vv◼{lv}⭘tdt◼{today}` · memory `project_driver_return_pindah_fixes`.
