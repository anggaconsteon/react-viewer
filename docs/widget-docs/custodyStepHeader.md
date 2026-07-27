# CUSTODY_STEP_HEADER (`custodyStepHeader`)

**Status:** LIVE di app (header langkah custody — driver runtime)
**Dev spec:** ADA — bagian alur custody count (driver-custody specs)
**Widget tab:** row 212

## Buat apa

Header ringkas untuk tahap custody: menampilkan kendaraan (plat) + driver (nama) sebagai konteks di atas layar langkah hitung/konfirmasi custody.

## Tampilan

```
┌────────────────────────────────────┐
│ 🚚 B 1234 XYZ · Budi               │  ← plat + nama driver
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_STEP_HEADER","vidtable":"20342033315492","vehicleTable":"84214220504259//stock_location","workforceTable":"84214220504259//workforce","plateField":"ln","nameField":"n","text":"Konfirmasi Muatan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_STEP_HEADER` | — |
| `vidtable` | otomatis (baked) | ID koneksi tenant | `20342033315492` |
| `vehicleTable` | Wajib | Sumber data kendaraan | `84214220504259//stock_location` |
| `workforceTable` | Wajib | Sumber data driver | `84214220504259//workforce` |
| `plateField` | Wajib | Field nomor plat | `ln` |
| `nameField` | Wajib | Field nama driver | `n` |
| `text` | Wajib | Judul header | `Konfirmasi Muatan` |

## Posisi field gabungan

`text` = judul (segmen `◆` bila ada).

## Tips & catatan

- Header konteks untuk rangkaian layar custody (hitung → reveal → konfirmasi).
- Beda dari `vehicleCustodyHeader` (207) yang menampilkan info muat lebih detail.
