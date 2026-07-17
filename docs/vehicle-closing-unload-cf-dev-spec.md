# Dev Spec (CF/Go) — OnVehicleClosing: unload movement mobil→gudang per `ip[]`

**Tanggal:** 2026-07-07
**Buat:** CF dev (Go — repo cloud-function). Kembaran persis `OnVehicleOpening` (vehicle_opening_trigger.go), arah kebalik.
**Bug yang di-fix:** "Isi Kendaraan Sekarang" (asset_cache mobil) trip ke-2 masih bawa barang trip sebelumnya — closing gudang gak pernah nge-emit movement, jadi ledger nganggep barang gak pernah turun dari mobil.

---

## 0. Bukti live (otq-01, 2026-07-07, multi-trip B 1234 XY)

Trip-2 abis custody: inventory bucket nampilin **LPG 3kg 1 empty + Amidis 1 empty (sisa pickup trip-1)** + LPG 12kg 1 full (trip-2, bener). Harusnya cuma LPG 12kg — trip-1 udah closing, barang fisik udah diturunin gudang, tapi `asset_cache` mobil gak berubah karena **nol movement pas closing**.

Desainnya sendiri udah RESOLVED di `warehouse-closing-check-c1-dev-spec.md` §6.1 (2026-06-29): trigger = closing doc, qty = `ip[]`, BUKAN P12/widget. Spec ini = versi build-ready.

## 1. Trigger + gate (pola sama persis OnVehicleOpening)

- `document.written` di `vehicle_check`, filter `cty == "closing"`.
- Baca `ip[]` via `parseCustodyLines(f, "ip")` (qt String-tolerant, sama kayak `ie[]` di opening).
- **Gate transisi: `ip[]` kosong → keisi** (pola `freshLoad`/`oldTst`) — closing doc bisa ke-update lagi (evidence/rs); movement aman via deterministic id, tapi gate tetep biar konsisten & murah.
- `vv` dari doc; kosong → WARN + skip. `gl` dari doc; kosong → movement **debit-only** (mobil −qt, gudang gak disentuh) — mirror perilaku `fl` kosong di opening.

## 2. Emit

Per line `ip[]` dengan `qt > 0`:

```go
movID := fmt.Sprintf("closeunload-%s-%s-%s", checkID, l.II, l.CD)
doc := map[string]interface{}{
    fieldMT: mtInternal,
    fieldFL: vv,          // turun dari mobil
    // fieldTL: gl        // masuk gudang — set HANYA kalau gl != ""
    fieldII: l.II,
    fieldCD: l.CD,        // full & empty dua-duanya (pickup balik kosong)
    fieldQT: l.QT,
    "mrf":   checkID,
    "er":    "GUDANG",
    "d":     "closing unload: vehicle -> warehouse",
    fieldT:  nowMs,
    fieldTS: ts,
}
```

`OnMovementCreated` existing yang derive: mobil −qt, gudang +qt. AlreadyExists → continue (idempotent).

## 3. Aturan qty (dari C1 §6.1 — jangan diubah)

- **qty = `ip[]` (hitungan fisik checker), BUKAN expected/asset_cache.** ip = truth barang yang beneran diturunin.
- Selisih (`dp[]`) **gak ngubah qty** — cuma flag investigation. Efek samping yang BENER: sisa `asset_cache` mobil setelah unload = expected − ip = persis barang yang gak keitung (hilang/ketinggalan) → keliatan "nyangkut di mobil" di ledger = jejak buat investigation. Jangan di-zero-kan paksa.

## 4. Yang GAK berubah

- `OnVehicleOpening` / `OnTaskCompleted` / `OnTaskRejected` / `OnCustodyConfirmed` / Reconcile — tetep.
- Renderer + config sheet — **NOL perubahan** (inventory bucket udah baca asset_cache; begitu ledger bener, tampilan bener).
- ReturnVehicle driver (`rt◼returned`) tetep tanpa movement (handover marker; closing = domain gudang).

## 5. Data lama (stale sekarang)

Closing yang udah kejadian gak bakal retro-emit (trigger on write). Buat test bersih: **reset data** (paling gampang), atau hand-emit movement unload buat closing lama terus `ReconcileAssetCache`.

## 5b. ADDENDUM (2026-07-07) — sekalian: stamp `rt:"pending"` di `OnVehicleOpening`

Temuan live: card "Return Kendaraan" (driver) gak pernah muncul karena `gateSearch` config butuh `rt◼pending` di doc opening, tapi **gak ada yang nulis `rt` pas opening** (field-nya absent; bukti isolasi: copot klausa `rt` → card langsung muncul). `rt` baru ditulis driver pas serah-terima (`rt◼returned`).

**Fix (1 baris, di `OnVehicleOpening` yang udah ada):** pas fresh load (gate transisi `ie[]` kosong→keisi, momen yang sama kayak stamping `tr`), set merge `{rt: "pending"}` ke doc opening. Idempotent, gak nyentuh field lain.

Lifecycle `rt` jadi: `pending` (opening, CF) → `returned` (driver serah-terima) → doc closed. Config gate (`rt◼pending`) gue pasang balik setelah CF ini deploy.

## 6. Acceptance

1. Trip full → closing gudang (isi `ip[]`, submit) → movement `closeunload-{checkId}-{ii}-{cd}` ke-emit per line → `asset_cache` mobil = 0 semua item, gudang nambah (empty balik stok).
2. Trip berikutnya (mobil sama): "Isi Kendaraan Sekarang" CUMA muatan trip baru. (Kasus bukti §0 beres.)
3. Closing dgn selisih (`rs=discrepancy_detected`): unload = ip; sisa expected−ip tetep nyangkut di asset_cache mobil (jejak investigation).
4. Re-fire / retry → idempotent (0 movement dobel).
5. `ip[]` qt String (addEventRow stringify) → tetep kebaca (parseCustodyLines tolerant).

---

**Referensi:** `vehicle_opening_trigger.go` (template kode — copy pola, balik arah), `warehouse-closing-check-c1-dev-spec.md` §6.1 (keputusan desain), `driver-runtime-movement-cf-handoff.md` §C, `task_reject_trigger.go` (gate transisi).
