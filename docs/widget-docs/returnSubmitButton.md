# RBT — tombol submit kembali kendaraan (`returnSubmitButton`)

**Status:** LIVE di app (tombol serah-terima akhir rute — driver runtime P12)
**Dev spec:** ADA — `docs/driver-return-vehicle-p12-dev-spec.md`
**Widget tab:** row 219

## Buat apa

Tombol untuk **mengembalikan kendaraan** di akhir rute: menulis data serah-terima + memperbarui status, lalu dialog konfirmasi. Pada dasarnya tombol RBT dengan aksi tulis + dialog.

## Tampilan

```
[       Kembalikan Kendaraan       ]  ── tap ──▶ catat + dialog
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"center","children":[{"text":"Kembalikan Kendaraan","action":"savesend","route":"vertikaTeknoLokaciptaDriverHome","delay":"5","gpsPosition":"2","flag":"return-vehicle","addToTable":"","updateEventRow":"84214220504259//vehicle_check⭘tablevid◼20342033315492⭘search◼vv★{vehicleId}☆cty★closing⭘cst◼returned","chain":{"type":"DO_DIALOG","title":"Kendaraan Dikembalikan","children":[{"type":"TXT","data":"Terima kasih. Kendaraan sudah diserahkan."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaDriverHome"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `text` (child) | Wajib | Label tombol | `Kembalikan Kendaraan` |
| `action` | Wajib | `savesend` | `savesend` |
| `route` | Wajib | Halaman tujuan | `…DriverHome` |
| `delay` / `gpsPosition` / `flag` | Opsional | Delay kirim / slot GPS / penanda | `5` / `2` / `return-vehicle` |
| `addToTable` / `updateEventRow` | Wajib (salah satu) | Perintah tulis serah-terima (DSL) | lihat contoh |
| `title` / `dialogText` (chain) | Wajib | Dialog konfirmasi | `Kendaraan Dikembalikan` |

## Posisi field gabungan

Tidak ada field ◆-gabungan.

## Tips & catatan

- Dipakai di akhir alur pengembalian kendaraan (P12), setelah `returnHeader` (228) + `vehicleCargoSummary` (229).
- Spec: `docs/driver-return-vehicle-p12-dev-spec.md`.
