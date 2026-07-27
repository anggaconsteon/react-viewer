# VEHICLE_CUSTODY_HEADER (`vehicleCustodyHeader`)

**Status:** LIVE di app (header custody kendaraan — driver runtime)
**Dev spec:** ADA — bagian alur custody/opening check (driver-custody & warehouse specs)
**Widget tab:** row 207

## Buat apa

Header untuk layar hitung custody: menampilkan kendaraan (plat), siapa yang memuat, dan kapan dimuat. Dipakai di atas halaman hitung barang bawaan supaya driver tahu konteks muatan.

## Tampilan

```
┌────────────────────────────────────┐
│ 🚚 B 1234 XYZ                      │  ← plat
│ Dimuat: Gudang A · 07:30           │  ← loader + waktu muat
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"VEHICLE_CUSTODY_HEADER","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"vv◼{vehicleId}⭘cty◼opening","vehicleTable":"84214220504259//stock_location","vehicleSearch":"lv◼{vehicleId}","plateField":"ln","eventField":"cnm","loaderField":"ldr","loadtimeField":"ldt","icon":"local_shipping","text":"Custody Kendaraan◆Dimuat"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `VEHICLE_CUSTODY_HEADER` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data custody | `vv◼{vehicleId}⭘cty◼opening` |
| `vehicleTable` / `vehicleSearch` | Wajib | Sumber data kendaraan | `lv◼{vehicleId}` |
| `plateField` | Wajib | Field nomor plat | `ln` |
| `eventField` | Opsional | Field nama event/sesi custody | `cnm` |
| `loaderField` / `loadtimeField` | Opsional | Field pemuat / waktu muat | `ldr` / `ldt` |
| `icon` | Opsional | Ikon header | `local_shipping` |
| `text` | Wajib | Judul + label (dipisah `◆`) | `Custody Kendaraan◆Dimuat` |

## Posisi field gabungan

`text` dipisah `◆` (judul / label waktu muat).

## Tips & catatan

- Header terikat data — plat dari `stock_location`, sesi muat dari `vehicle_check`.
- Dipakai berpasangan dengan `custodyCountList` (210) di halaman hitung custody.
