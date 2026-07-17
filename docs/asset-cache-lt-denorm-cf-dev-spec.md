# Dev Spec (CF/Go) — denorm `lt`/`ln` ke asset_cache biar OUTSTANDING kebaca

**Tanggal:** 2026-07-09
**Buat:** CF dev (Go — repo asset_cache/cloud-function). Konsumen: OUTSTANDING_PANEL (AdminHome "Prioritas Pengambilan") + Owner Runtime "Customer Outstanding"/"Asset Paling Lama Outstanding".
**Bug live:** OUTSTANDING_PANEL **kosong**. Root: asset_cache doc **gak punya `lt`** (tipe lokasi) → filter `lt◼client` match nol, walau saldo customer ADA.

---

## 0. Kondisi sekarang (dari Firestore)

asset_cache doc (key `lv__ii__cd`):
```
cd: "full"        kondisi
ii: "2000..154"   item
lm: "openload-…"  last movement id
lv: "F621558…"    lokasi (gudang/mobil/customer — DOC GAK NUNJUKIN yang mana)
qt: -1            saldo
t:  1783587832793 waktu movement terakhir
```
**Gak ada `lt`.** Jadi "mana lv yang client" cuma bisa ditau dgn JOIN ke `stock_location.lt` — widget gak lakuin itu → outstanding kosong.

## 1. Fix — denorm 2 field ke asset_cache

Tiap asset_cache doc di-stamp (CF udah tau `lv` doc itu → lookup `stock_location[lv]`):

| field | isi | guna |
|---|---|---|
| `lt` | tipe lokasi (`client`/`vehicle`/`warehouse`) dari `stock_location.lt` | filter `lt◼client` LANGSUNG (nol join) |
| `ln` | nama lokasi (customer/plat) dari `stock_location.ln` | tampil nama tanpa join |

- Di **`OnMovementCreated`** (derive engine): pas update balance doc `lv__ii__cd`, sekalian stamp `lt`+`ln` (lookup `stock_location` by lv). Cache lookup per-invocation (lokasi sedikit) biar gak query berulang.
- Di **`ReconcileAssetCache`** (rebuild dari ledger): sama — stamp `lt`+`ln` pas rebuild. Ini yang **backfill doc lama**.

## 2. Cara jalanin (biar data langsung nongol)

1. Tambah stamp `lt`/`ln` di `OnMovementCreated` + `ReconcileAssetCache`.
2. Deploy CF.
3. **Run `ReconcileAssetCache`** (rebuild semua asset_cache dari movement ledger) → backfill `lt`/`ln` ke doc existing. Movement baru otomatis dapet `lt`/`ln`.
4. OUTSTANDING_PANEL `search:"lt◼client"` → nongol saldo customer (`qt≠0`, hideZero udah aktif).

## 3. Outstanding = apa (recap mekanisme)

Outstanding = aset returnable kita (galon/tabung) yg lagi di CUSTOMER, belum balik. Byproduct ledger:
- `drop` (mobil→customer) → asset_cache[customer] +qt (outstanding naik)
- `pickup` (customer→mobil) → asset_cache[customer] −qt (outstanding turun)
Outstanding = saldo asset_cache di lokasi client (`lt◼client`, `qt>0`). Aging dari `t` (movement terakhir).

## 4. Opsional — aging presisi (`since`)

`t` = movement TERAKHIR (aproksimasi "outstanding sejak"). Aset nangkring gak keutak → `t`=tanggal drop=akurat; ada movement lain → reset. Buat "Asset Paling Lama Outstanding" (days akurat), tambah `since` = tanggal saldo pertama jadi >0 (di-set pas balance 0→>0, gak di-reset selama masih >0). Nice-to-have; `t` cukup buat demo.

## 5. Acceptance

1. Tiap asset_cache doc punya `lt` (client/vehicle/warehouse) + `ln` (nama).
2. OUTSTANDING_PANEL nongol customer + saldo + aging (dari `t`).
3. Owner Runtime "Customer Outstanding" + "Asset Paling Lama" baca sumber sama (`asset_cache lt◼client`).
4. Balance (`qt`) TIDAK berubah (cuma nambah field denorm; `OnMovementCreated` derive tetep dari fl/tl/qt).
5. (Opsional) `since` keisi → aging presisi.

---

**Catatan `qt:-1` di gudang:** F621558e33b612 (warehouse) `qt:-1` = saldo negatif (over-issued / seed imbalance). Buat outstanding client (`qt>0`) gak ngaruh, tapi worth investigasi kenapa gudang minus (kemungkinan seed GENESIS ke customer belum lengkap vs openload ke mobil).

**Referensi:** OUTSTANDING_PANEL (AdminHome, `table:asset_cache⭘search:lt◼client⭘locationTable:stock_location`), asset_cache CF (`OnMovementCreated`/`ReconcileAssetCache`), stock_location (`lt`/`ln`), OwnerRuntimeDesktopDriver.jsx (konsumen desktop).
