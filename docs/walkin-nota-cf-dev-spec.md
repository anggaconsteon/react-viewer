# Dev Spec (CF/Go) — OnNotaCreated: SALE movement per line nota walk-in

**Tanggal:** 2026-07-07
**Buat:** CF dev (Go — repo cloud-function). Design: `walkin-counter-pos-design.md` v2. Pasangan Flutter: `walkin-flutter-dev-spec.md`.
**Pola:** mirror `OnVehicleOpening`/`OnVehicleClosing` — trigger doc → loop array → emit movement deterministik. Bisa dibangun SEKARANG (independen dari Flutter).

---

## 1. Konteks

Walk-in counter: kasir jual item langsung dari depo. App nulis **1 doc `nota`** (koleksi BARU, path `MobileTable/{db}/tables/{tid}/nota`, auto-id):

```
nno "NOTA-2026-000001" · src "walkin" · kl "" · by "" · bym "tunai" · st "LUNAS"
gl  "F621558e33b612" (depo) · tot 45000 (Number)
li[] [{ii,in,qt,hg,sub}, …]  ← baris jualan
cv/cn · t (Number) · ts · search "nno★…"
```

Stok HARUS turun dari depo via ledger (bukan direct asset_cache — Reconcile rebuild dari movement). CF ini yang nyatet.

## 2. Fungsi baru `OnNotaCreated`

- **Trigger:** `document.created` di `nota` (nota immutable — sekali tulis, gak ada update; `created` cukup, gak butuh gate transisi kayak ie[]/ip[]).
- Parse `li[]` (pola `parseCustodyLines`-ish; field: `ii` String, `qt` **Number-tolerant** — `intField`/`asInt64`, addEventRow-stringify guard sama).
- `gl := strField(f, "gl")`; `nno := strField(f, "nno")`. `nno` kosong → WARN skip (gak bisa bikin mid). `gl` kosong → movement **tanpa `fl`**... ⚠ BEDA dari opening: di sini `fl` = SUMBER stok; tanpa fl = stok gak turun dari mana-mana → **kalau `gl` kosong: WARN + skip total** (nota walk-in tanpa depo = data salah, jangan setengah-emit).
- Per line `qt > 0`:

```go
movID := fmt.Sprintf("sale-%s-%s", nno, l.II) // gak tabrakan sale-{tnm}-{ii}: nno=NOTA-…, tnm=TASK-…
doc := map[string]interface{}{
    fieldMT: "SALE",
    fieldFL: gl,        // keluar dari depo
    // TANPA tl — keluar sistem (sold), sama kayak SALE delivery
    fieldII: l.II,
    fieldCD: condFull,  // jual barang isi
    fieldQT: l.QT,
    "mrf":   nno,
    "nref":  nno,       // trace nota (field baru movement, opsional konsumen lain)
    "er":    "ADMIN",
    "d":     "walkin sale",
    fieldT:  nowMs,
    fieldTS: ts,
}
```

- `Create` dengan id deterministik → `AlreadyExists` = skip (idempotent, retry aman).
- `OnMovementCreated` existing yang derive asset_cache (depo −qt) — **jangan sentuh** kode balance.

## 3. Deploy

- `deploy.sh`: tambah case `onNotaCreated` → `deploy_fs onNotaCreated OnNotaCreated created "MobileTable/{db}/tables/{tid}/nota/{nid}"` + masuk list `ALL`.
- Unit test pola `vehicle_opening_trigger_test.go` (pure aggregate/parse + path parse).

## 4. Acceptance

1. Nota 2 line (qt 2 & 1) → 2 movement `sale-NOTA-2026-000001-{ii}` → asset_cache depo item A −2, item B −1.
2. Redelivery/retry event → nol movement dobel.
3. `qt` String `"2"` di li[] → tetep ke-emit 2 (tolerant).
4. `gl` kosong / `nno` kosong → WARN + skip, NOL movement (jangan partial).
5. `sale-{tnm}-{ii}` delivery existing gak keganggu (prefix beda: TASK- vs NOTA-).
6. ReconcileAssetCache abis ada nota → hasil sama (ledger konsisten).

---

**Referensi:** `vehicle_opening_trigger.go`/`vehicle_closing_trigger.go` (pola trigger+loop+deterministic mid), `task_complete_trigger.go` (pola SALE tanpa tl), `walkin-counter-pos-design.md` v2 §2-3.
