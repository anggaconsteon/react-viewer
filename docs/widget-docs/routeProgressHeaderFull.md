# ROUTE_PROGRESS_HEADER variant `full` (`routeProgressHeaderFull`)

**Status:** LIVE di app (header driver versi lengkap — dengan progress stop/gagal/drop/pickup)
**Dev spec:** ADA — `docs/driver-route-progress-header-dev-spec.md`
**Widget tab:** row 218

## Buat apa

Versi lengkap `ROUTE_PROGRESS_HEADER`: selain nama driver + plat, juga menampilkan **ringkasan rute hari ini** — berapa stop, berapa gagal, total drop & pickup. Dipakai di atas halaman rute driver.

## Tampilan

```
┌────────────────────────────────────┐
│ 👤 Budi   🚚 B 1234 XYZ      [⏻]   │
│ Rute Hari Ini · 5 stop · 1 gagal   │
│ Drop 40 · Pickup 35                │
└────────────────────────────────────┘
```

## Contoh JSON

(resolved live — dari template Widget row 218)

```json
{"type":"ROUTE_PROGRESS_HEADER","variant":"full","vidtable":"20342033315492","table":"84214220504259//workforce","search":"VID◼{driverVid}","nameField":"n","vehicleTable":"84214220504259//stock_location","vehicleSearch":"lv◼{vehicleId}","plateField":"ln","taskTable":"84214220504259//task","taskSearch":"vv◼{vehicleId}⭘tdt◼{today}","logoutRoute":"vertikaTeknoLokaciptaDriverHome","text":"Rute Hari Ini◆stop◆gagal◆Drop◆Pickup◆kendaraan ditugaskan◆Keluar◆Belum ditugaskan kendaraan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `ROUTE_PROGRESS_HEADER` | — |
| `variant` | Wajib | `full` — versi dengan ringkasan rute | `full` |
| `vidtable` / `table` / `search` | Wajib | Sumber data driver | `VID◼{driverVid}` |
| `nameField` | Wajib | Field nama driver | `n` |
| `vehicleTable` / `vehicleSearch` / `plateField` | Wajib | Sumber & field plat kendaraan | `lv◼{vehicleId}` / `ln` |
| `taskTable` / `taskSearch` | Wajib | Sumber data tugas (untuk hitung stop/drop/pickup) | `vv◼{vehicleId}⭘tdt◼{today}` |
| `logoutRoute` | Wajib | Halaman tujuan tombol logout | `…DriverHome` |
| `text` | Wajib | Label ringkasan (8 segmen `◆`) | lihat tabel posisi |

## Posisi field gabungan

`text` — 8 segmen `◆` (dari contoh live): judul / label stop / label gagal / label Drop / label Pickup / label kendaraan-ditugaskan / label Keluar / pesan belum-ada-kendaraan.

## Tips & catatan

- Versi ringkas (tanpa ringkasan rute) = `routeProgressHeader` (201).
- Angka stop/gagal/drop/pickup dihitung sistem dari `taskTable`.
- Spec: `docs/driver-route-progress-header-dev-spec.md`.
