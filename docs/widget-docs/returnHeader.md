# RETURN_HEADER (`returnHeader`)

**Status:** LIVE di app (header halaman kembali kendaraan — driver runtime P12)
**Dev spec:** ADA — `docs/driver-return-vehicle-p12-dev-spec.md`
**Widget tab:** row 228

## Buat apa

Header ringkas untuk halaman pengembalian kendaraan: judul + tombol kembali. Widget header paling sederhana (cuma teks + back route).

## Tampilan

```
┌────────────────────────────────────┐
│ ←   Kembalikan Kendaraan           │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RETURN_HEADER","backRoute":"vertikaTeknoLokaciptaTaskFeed","text":"Kembalikan Kendaraan◆Serah terima akhir rute"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RETURN_HEADER` | — |
| `backRoute` | Wajib | Halaman tujuan tombol kembali | `…TaskFeed` |
| `text` | Wajib | Judul + subjudul (dipisah `◆`) | `Kembalikan Kendaraan◆Serah terima akhir rute` |

## Posisi field gabungan

`text` dipisah `◆` (judul / subjudul).

## Tips & catatan

- Header khusus alur pengembalian (P12), dipakai bareng `vehicleCargoSummary` (229) + `returnSubmitButton` (219).
- Versi header serba-guna terikat data = `workspaceHeader` (226).
- Spec: `docs/driver-return-vehicle-p12-dev-spec.md`.
