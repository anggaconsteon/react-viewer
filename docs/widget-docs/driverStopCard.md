# DRIVER_STOP_CARD (`driverStopCard`)

**Status:** LIVE di app (kartu titik antar/rute driver)
**Dev spec:** ADA — `docs/driver-stop-card-dev-spec.md`
**Widget tab:** row 204

## Buat apa

Kartu untuk satu titik pemberhentian rute driver: nama & alamat tujuan, tombol navigasi, plus tombol tolak (kalau tidak bisa diantar). Dipakai di runtime driver saat mengerjakan rute antar.

## Tampilan

```
┌────────────────────────────────────┐
│ 📍 Toko Budi                       │  ← nameField
│    Jl. Merdeka No. 5               │  ← addressField
│ [ Navigasi ]        [ Tolak ]      │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"DRIVER_STOP_CARD","variant":"default","vidtable":"20342033315492","table":"84214220504259//task","search":"dv◼{userVid}⭘tst◼assigned","navState":"","route":"vertikaTeknoLokaciptaDeliveryWorkspace","rejectRoute":"vertikaTeknoLokaciptaFailedDelivery","taskIdField":"tnm","gateTable":"84214220504259//vehicle_check","gateSearch":"dv◼{userVid}","icon":"local_shipping","iconLocked":"lock","text":"Titik Antar◆Belum ada titik","nameField":"kn","addressField":"al","excludeStatus":"completed"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `DRIVER_STOP_CARD` | — |
| `variant` | Opsional | Mode tampilan | `default` |
| `vidtable` / `table` / `search` | Wajib | Sumber data titik/tugas | `dv◼{userVid}⭘tst◼assigned` |
| `navState` | Opsional | `[?] status navigasi — cek dev` | `""` |
| `route` | Wajib | Halaman tujuan tombol utama | `…DeliveryWorkspace` |
| `rejectRoute` | Opsional | Halaman tujuan tombol tolak | `…FailedDelivery` |
| `taskIdField` | Wajib | Field id tugas (dibawa ke route) | `tnm` |
| `gateTable` / `gateSearch` | Opsional | Pengecek gerbang (mis. sudah muat/belum) | `dv◼{userVid}` |
| `icon` / `iconLocked` | Opsional | Ikon normal / saat terkunci | `local_shipping` / `lock` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Titik Antar◆Belum ada titik` |
| `nameField` / `addressField` | Wajib | Field nama tujuan / alamat | `kn` / `al` |
| `excludeStatus` | Opsional | Status yang dikecualikan dari daftar | `completed` |

## Posisi field gabungan

`text` dipisah `◆` (judul / teks kosong).

## Tips & catatan

- Kartu terkunci (ikon `iconLocked`) kalau prasyarat gerbang belum terpenuhi (mis. belum konfirmasi muatan).
- Tombol tolak → `rejectRoute` bawa `taskIdField` (pola routeParams).
- Spec: `docs/driver-stop-card-dev-spec.md`.
