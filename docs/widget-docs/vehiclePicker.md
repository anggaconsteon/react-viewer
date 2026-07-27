# VEHICLE_PICKER (`vehiclePicker`)

**Status:** LIVE di app (pilih kendaraan untuk penugasan — admin)
**Dev spec:** ADA — admin-home / admin-create-task
**Widget tab:** row 234

## Buat apa

Daftar kendaraan yang bisa dipilih untuk ditugaskan (yang aktif & belum ada driver), lengkap jumlah tugas aktif per kendaraan. Saat dipilih, id kendaraan ditangkap ke token (`captureToken`) untuk dipakai halaman berikutnya.

## Tampilan

```
┌─ Pilih Kendaraan ──────────────────┐
│ B 1234 XYZ · 2 task aktif  [Tugaskan]
│ B 5678 ABC · 0 task aktif  [Tugaskan]
│ [ Ad-hoc / Nanti ]                 │
└────────────────────────────────────┘
```

## Contoh JSON

(resolved live — dari template Widget row 234)

```json
{"type":"VEHICLE_PICKER","vidtable":"20342033315492","table":"84214220504259//stock_location","search":"lt◼vehicle⭘lst◼active⭘dv◼","plateField":"ln","driverField":"dv","taskTable":"84214220504259//task","taskCountSearch":"vv◼{lv}⭘tst◼assigned","captureToken":"vehicleId","route":"vertikaTeknoLokaciptaAdminHome","text":"Pilih Kendaraan◆Tugaskan ke kendaraan ini◆task aktif◆Ad-hoc / Nanti◆Tugaskan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `VEHICLE_PICKER` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber kendaraan (aktif & belum ada driver) | `lt◼vehicle⭘lst◼active⭘dv◼` |
| `plateField` / `driverField` | Wajib | Field plat / driver | `ln` / `dv` |
| `taskTable` / `taskCountSearch` | Opsional | Hitung tugas aktif per kendaraan | `vv◼{lv}⭘tst◼assigned` |
| `captureToken` | Wajib | Nama token yang diisi id kendaraan terpilih | `vehicleId` |
| `route` | Wajib | Halaman tujuan setelah pilih | `…AdminHome` |
| `text` | Wajib | Judul + label (5 segmen `◆`) | lihat contoh |

## Posisi field gabungan

`text` — 5 segmen `◆`: judul / label tugaskan / satuan task aktif / label ad-hoc / label tombol tugaskan.

## Tips & catatan

- `captureToken:"vehicleId"` = id terpilih dipakai halaman berikutnya sebagai `{vehicleId}`.
- Hanya menampilkan kendaraan yang belum ada driver (`dv◼` kosong).
