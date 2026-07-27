# VEHICLE_CARGO_SUMMARY (`vehicleCargoSummary`)

**Status:** LIVE di app (ringkasan sisa muatan kendaraan — driver runtime P12)
**Dev spec:** ADA — `docs/driver-return-vehicle-p12-dev-spec.md`
**Widget tab:** row 229

## Buat apa

Ringkasan **sisa muatan** kendaraan saat pengembalian: item apa saja yang masih di kendaraan (isi/kosong per kondisi), dari cache stok kendaraan. Dipakai untuk cek sebelum serah-terima.

## Tampilan

```
┌─ Sisa Muatan ──────────────────────┐
│ Galon 19L   Isi 3 · Kosong 5       │  ← per kondisi
│ Tabung 3kg  Isi 1                  │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"VEHICLE_CARGO_SUMMARY","vidtable":"20342033315492","vehicleTable":"84214220504259//stock_location","vehicleSearch":"lv◼{vehicleId}","plateField":"ln","cacheTable":"84214220504259//asset_cache","cacheSearch":"lt◼{vehicleId}","itemTable":"84214220504259//stock_item","itemKey":"ii","nameField":"cd","unitField":"un","condField":"cond","fullValue":"full","emptyValue":"empty","hideZero":"TRUE","text":"Sisa Muatan◆Kendaraan kosong"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `VEHICLE_CARGO_SUMMARY` | — |
| `vidtable` | otomatis (baked) | ID koneksi tenant | `20342033315492` |
| `vehicleTable` / `vehicleSearch` / `plateField` | Wajib | Sumber & field plat kendaraan | `lv◼{vehicleId}` / `ln` |
| `cacheTable` / `cacheSearch` | Wajib | Cache stok yang masih di kendaraan | `lt◼{vehicleId}` |
| `itemTable` / `itemKey` / `nameField` | Opsional | Referensi nama item | `stock_item` / `ii` / `cd` |
| `unitField` | Opsional | Field satuan | `un` |
| `condField` / `fullValue` / `emptyValue` | Opsional | Field kondisi + nilai isi/kosong | `cond` / `full` / `empty` |
| `hideZero` | Opsional | `TRUE` = sembunyikan item saldo 0 | `TRUE` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Sisa Muatan◆Kendaraan kosong` |

## Posisi field gabungan

`text` dipisah `◆`. Jumlah per kondisi (isi/kosong) dihitung sistem dari cache stok.

## Tips & catatan

- Baca `asset_cache` (stok yang masih nempel di kendaraan) — idealnya kosong saat pengembalian.
- `hideZero:"TRUE"` = skip item saldo 0.
- Dipakai di halaman pengembalian (P12) bareng `returnHeader` (228). Spec: `docs/driver-return-vehicle-p12-dev-spec.md`.
