# closing_context_rail (`closingContextRail`)

**Status:** LIVE di app (rail konteks tutup gudang — warehouse C1)
**Dev spec:** ADA — `docs/warehouse-closing-check-c1-dev-spec.md`
**Widget tab:** row 242

## Buat apa

Bilah konteks di layar cek tutup (closing) gudang: menampilkan info kendaraan/driver + kategori barang sebagai acuan saat petugas mengecek muatan kembali. Widget pendukung (tanpa teks label sendiri).

## Tampilan

```
┌────────────────────────────────────┐
│ B 1234 XYZ · Budi · [kategori bar] │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"closing_context_rail","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"vv◼{vehicleId}⭘cty◼closing","checkTable":"84214220504259//vehicle_check","checkSearch":"vv◼{vehicleId}","driverField":"dv","joinTable":"84214220504259//stock_item","joinKey":"ii","catField":"cat"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `closing_context_rail` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data tutup | `vv◼{vehicleId}⭘cty◼closing` |
| `checkTable` / `checkSearch` | Wajib | Sumber data cek | `vv◼{vehicleId}` |
| `driverField` | Wajib | Field driver | `dv` |
| `joinTable` / `joinKey` / `catField` | Opsional | Referensi kategori item | `stock_item` / `ii` / `cat` |

## Posisi field gabungan

Tidak ada `text` (widget pendukung konteks, bukan penampil label).

## Tips & catatan

- Widget konteks untuk alur cek tutup gudang (C1) — pelengkap `custodyCountListWarehouse` (243) + `custodyCountSubmitClosing` (245).
- Spec: `docs/warehouse-closing-check-c1-dev-spec.md`.
