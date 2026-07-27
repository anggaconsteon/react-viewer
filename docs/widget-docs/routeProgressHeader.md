# ROUTE_PROGRESS_HEADER (`routeProgressHeader`)

**Status:** LIVE di app (header runtime driver — nama + kendaraan + progress rute)
**Dev spec:** ADA — `docs/driver-route-progress-header-dev-spec.md`
**Widget tab:** row 201

## Buat apa

Header untuk layar driver: menampilkan nama driver + plat kendaraan yang sedang dipakai, plus kemajuan rute hari ini, dengan tombol logout. Dipakai di atas halaman runtime driver.

## Tampilan

```
┌────────────────────────────────────┐
│ 👤 Budi   🚚 B 1234 XYZ      [⏻]   │  ← nama + plat + logout
│ Rute hari ini: 5/8 selesai          │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"ROUTE_PROGRESS_HEADER","variant":"default","vidtable":"20342033315492","table":"84214220504259//workforce","search":"vid◼{userVid}","logoutRoute":"vertikaTeknoLokacipta","text":"Rute hari ini","nameField":"n","vehicleTable":"84214220504259//vehicle_check","vehicleSearch":"dv◼{userVid}","plateField":"kl"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `ROUTE_PROGRESS_HEADER` | — |
| `variant` | Opsional | Mode tampilan | `default` |
| `vidtable` / `table` / `search` | Wajib | Sumber data driver | `vid◼{userVid}` |
| `logoutRoute` | Wajib | Halaman tujuan tombol logout | `vertikaTeknoLokacipta` |
| `text` | Wajib | Label/judul header | `Rute hari ini` |
| `nameField` | Wajib | Field nama driver | `n` |
| `vehicleTable` / `vehicleSearch` | Opsional | Sumber data kendaraan yang dipakai | `dv◼{userVid}` |
| `plateField` | Opsional | Field nomor plat kendaraan | `kl` |

## Posisi field gabungan

`text` = label/judul (segmen `◆` bila ada; lihat spec).

## Tips & catatan

- Versi lebih lengkap = `routeProgressHeaderFull` (218).
- Header ini terikat data (nama dari workforce, plat dari vehicle_check) — bukan teks statis.
- Spec: `docs/driver-route-progress-header-dev-spec.md`.
