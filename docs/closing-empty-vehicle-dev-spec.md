# Dev Spec (Flutter) — closing mobil KOSONG: `CUSTODY_COUNT_SUBMIT mode:closing` allow empty/all-zero

**Tanggal:** 2026-07-10
**Buat:** Flutter dev (renderer — `CUSTODY_COUNT_SUBMIT` mode `closing`, + `ITEM_EXECUTION_LIST` variant `pivot`).
**Bug live:** delivery **drop-only** (semua diantar, nol pickup) → mobil balik KOSONG → WarehouseClosingCheck count list kosong (`hideZero:TRUE`) → tombol **"Simpan Penutupan"** GAK bisa diklik → **mobil nyangkut** di WarehouseFeed (perlu-closing terus) + driver keiket ke mobil itu (gak bebas trip baru).

---

## 0. Root

WarehouseClosingCheck (page `vertikaTeknoLokaciptaWarehouseClosingCheck`):
- count = `ITEM_EXECUTION_LIST variant:pivot` baca `asset_cache lv◼{activeVehicle}`, `hideZero:TRUE`.
- submit = `CUSTODY_COUNT_SUBMIT mode:closing`.

Mobil kosong → asset_cache mobil semua `qt=0` → hideZero → **pivot render 0 row** → `ip` (writeField) kosong → CUSTODY_COUNT_SUBMIT ke-gate (butuh ≥1 item) → tombol disabled.

**Closing mobil kosong = VALID** — gak ada yang diturunin, checker cuma "konfirmasi kosong". Submit HARUS tetep jalan.

## 1. Fix — allow empty/all-zero close

`CUSTODY_COUNT_SUBMIT mode:closing`: **submit boleh jalan walau count list kosong / semua 0** (empty vehicle). Artinya:
- Tombol "Simpan Penutupan" **enabled** walau `ip` kosong.
- Submit dengan `ip` kosong → interpret sebagai "nol item turun" → **match** (expected 0 = counted 0) → `matchRoute` (WarehouseClosingMatch).
- vehicle_check closing doc tetep ke-tulis (cst→closed, dv/dn clear via updateEventRow) → mobil LEPAS dari WarehouseFeed + driver bebas.

Tetep **hideZero:TRUE** (gak revert anti-clutter [[inventory-bucket-hidezero]]). Empty case = tombol enabled + submit valid tanpa item.

## 2. Interim LIVE (sementara, revert abis fix)

Sheet 2026-07-10: `ITEM_EXECUTION_LIST` closing (op1Screen D737) di-set **`hideZero:FALSE`** → item 0 nongol → checker count 0 → `ip` keisi → submit jalan. **Trade-off:** item saldo-0 nongol di SEMUA closing (revert anti-clutter). **Balikin `hideZero:TRUE` begitu Fix §1 landing.**

## 3. Acceptance

1. Mobil balik KOSONG (drop-only) → WarehouseClosingCheck → "Simpan Penutupan" **bisa diklik** (walau count kosong) → close → mobil lepas WarehouseFeed + driver bebas.
2. `hideZero:TRUE` dipertahanin (nol clutter item-0 di closing normal).
3. Closing normal (ada empties) tetep jalan (regresi nol).
4. Match: mobil kosong → counted 0 = expected 0 → WarehouseClosingMatch.

---

**Referensi:** op1Screen WarehouseClosingCheck (732) — `ITEM_EXECUTION_LIST pivot` (737) + `CUSTODY_COUNT_SUBMIT closing` (739). `inventory-bucket-hidezero-dev-spec.md` (kenapa hideZero ada). Konteks: drop-only = skenario test outstanding ([[project_outstanding_subsystem]]) tapi juga kasus real (deliver semua, nol pickup).
