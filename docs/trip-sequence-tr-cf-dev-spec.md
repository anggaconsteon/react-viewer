# Dev Spec (CF/Go) — Trip sequence `tr`: stamping task saat opening

**Tanggal:** 2026-07-06
**Buat:** CF dev (Go — repo cloud-function). Pasangan spec renderer: `trip-sequence-tr-flutter-dev-spec.md`. Model & acceptance lengkap: `trip-sequence-tr-dev-spec.md`.
**Status:** ⛔ **POST-DEMO — jangan deploy sebelum demo.** Ship BARENG renderer (token `{activeTrip}`); CF duluan boleh (field `tr` nganggur = harmless), renderer/config jangan mendahului CF.

---

## 0. Tujuan

Multi-trip per mobil per hari. Trip = doc opening `vehicle_check` (auto-id, udah jalan). Task dapet **field baru `tr`** (String, = doc-id opening check) pas dimuat gudang. CF yang stamping — renderer nol perubahan write.

## 1. Di mana: extend `OnVehicleOpening` (vehicle_opening_trigger.go)

Fungsi ini udah loop manifest `ie[]` buat emit `openload-*` movement. Tambah step: **stamp `tr` ke task yang keangkut trip ini.**

## 2. ⚠️ Gate transisi WAJIB (beda dari movement yang aman via deterministic id)

Trigger = `document.written` → ke-fire ulang tiap update doc opening (savesend gps/evidence, **cst flip custody_confirmed/closed**). Movement aman (id `openload-{docid}-{ii}-{cd}` dedup). **Stamping GAK punya dedup id**: kalau jalan tiap fire, task sore (assigned, vv+hari sama, dibuat SETELAH opening pagi) bakal ke-stamp `tr` trip PAGI pas doc pagi ke-update (mis. cst flip) → bug yang mau kita bunuh malah balik.

**Gate: stamp HANYA pas transisi `ie[]` kosong → keisi** (momen loading), pola sama kayak `oldTst` guard di `task_reject_trigger.go`:

```go
oldLines := []custodyLine{}
if ov := data.GetOldValue(); ov != nil {
    oldLines = parseCustodyLines(ov.GetFields(), fieldIe)
}
freshLoad := len(oldLines) == 0 && len(lines) > 0
// emitOpeningLoad: tetep tiap fire (dedup by id, perilaku sekarang)
// stampTrips: HANYA kalau freshLoad
```

Doc create langsung bawa ie[] → OldValue nil → freshLoad true ✓.

## 3. Stamping

```go
const fieldTr = "tr" // task: trip ref = doc-id opening vehicle_check

// anchor server-side strict-safe (String semua): vv + tst.
// tdt = epoch campur String/Number antar-writer -> match CLIENT-SIDE pake asInt64,
// pola persis recomputeIE di task_reject_trigger.go.
cdt := intField(f, fieldCdt)
it := client.Collection(paths.Base(db, tid)+"/"+taskCollection).
    Where(fieldVV, "==", vv).
    Where(fieldTst, "==", "assigned").
    Documents(ctx)
for snap := range ... {
    if asInt64(snap.Data()[fieldTdt]) != cdt { continue }
    snap.Ref.Set(ctx, map[string]interface{}{fieldTr: checkID}, firestore.MergeAll)
}
```

- `checkID` = doc-id opening (hasil `parseVehicleCheckPath`, var `cnm` di kode sekarang).
- Scope stamping = SAMA dgn manifest O1 gudang (`vv ⭘ tdt hari-itu ⭘ tst assigned`) → yang dihitung gudang = yang di-stamp. Konsisten by construction.
- Idempotent: merge nilai sama; re-fire ke-gate §2.
- Set gagal sebagian → return err (transient retry); merge bikin retry aman.
- Task yang `load_rejected` SETELAH stamping: `tr` biarin (histori trip); exclude tetep via `tst`.

## 4. Yang GAK berubah

- `emitOpeningLoad` — tetep.
- `OnTaskRejected` (recomputeIE) — tetep anchor vv+tdt; task rejected punya `tr` gak ganggu.
- `OnCustodyConfirmed` / `OnTaskCompleted` / `OnMovementCreated` — tetep.
- `cnm` boleh non-unique (2 trip/hari) — CF gak boleh ada asumsi cnm unik; movement id pake doc-id (udah bener).

## 5. Acceptance (CF-side)

1. Opening pagi (ie[] keisi, 2 task assigned vv+hari itu) → dua task dapet `tr = <docid pagi>`; movement openload ke-emit (perilaku lama).
2. cst flip / update apapun di doc pagi → **NOL stamping ulang** (gate §2). Task sore yang dibuat siang TETEP tanpa `tr`.
3. Opening sore (doc baru, ie[] keisi) → CUMA task sore (assigned) dapet `tr = <docid sore>`; task pagi (completed) gak disentuh.
4. Re-delivery event / retry → hasil sama (idempotent).
5. `tdt` task String `"1783270800000"` vs `cdt` Number → tetep ke-stamp (tolerant client-side).

---

**Referensi:** `vehicle_opening_trigger.go` (fungsi yang di-extend), `task_reject_trigger.go` (pola fresh-transition guard + anchor+client-filter), `trip-sequence-tr-dev-spec.md` (model + acceptance end-to-end §7), `warehouse-opening-load-movement-dev-spec.md` (spec asal CF ini).
