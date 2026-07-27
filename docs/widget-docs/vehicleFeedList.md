# VEHICLE_FEED_LIST (`vehicleFeedList`)

**Status:** LIVE di app (daftar kendaraan untuk dicek — gudang/checker H1)
**Dev spec:** ADA — `docs/vehicle-feed-h1-dev-spec.md`
**Widget tab:** row 231

## Buat apa

Daftar kendaraan dari sisi gudang: plat + siapa pelaksananya (executor) + status buka/tutup (opening/closing) + jumlah tugas. Tiap kartu mengarah ke cek buka atau cek tutup sesuai tahap.

## Tampilan

```
┌─ Kendaraan ────────────────────────┐
│ B 1234 XYZ · Budi                  │
│ Buka: belum   →  [ Cek Buka ]      │  ← opening/closing gate → route
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"VEHICLE_FEED_LIST","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"cdt◼{today}","plateField":"ln","executorField":"dv","executorNameField":"dn","openingGate":"cty◼opening","cstField":"cst","closingGate":"cty◼closing","taskTable":"84214220504259//task","taskSearch":"vv◼{vehicleId}","taskStateField":"tst","itemsField":"ie","openingRoute":"vertikaTeknoLokaciptaOpeningCheck","closingRoute":"vertikaTeknoLokaciptaClosingCheck","text":"Kendaraan◆Belum ada kendaraan◆Cek Buka◆Cek Tutup"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `VEHICLE_FEED_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data kendaraan | `cdt◼{today}` |
| `plateField` | Wajib | Field nomor plat | `ln` |
| `executorField` / `executorNameField` | Wajib | Field id / nama pelaksana | `dv` / `dn` |
| `openingGate` / `closingGate` | Wajib | Syarat tahap buka / tutup | `cty◼opening` / `cty◼closing` |
| `cstField` | Opsional | Field status custody | `cst` |
| `taskTable` / `taskSearch` / `taskStateField` | Opsional | Sumber tugas + status | `vv◼{vehicleId}` / `tst` |
| `itemsField` | Opsional | Field daftar item | `ie` |
| `openingRoute` / `closingRoute` | Wajib | Tujuan cek buka / cek tutup | `…OpeningCheck` / `…ClosingCheck` |
| `text` | Wajib | Judul + teks kosong + label tombol (dipisah `◆`) | lihat contoh |

## Posisi field gabungan

`text` dipisah `◆` (judul / teks kosong / label cek buka / label cek tutup).

## Tips & catatan

- Kartu mengarah ke `openingRoute` atau `closingRoute` tergantung tahap kendaraan (gerbang buka/tutup).
- Header pasangannya: `vehicleFeedHeader` (230). Spec: `docs/vehicle-feed-h1-dev-spec.md`.
