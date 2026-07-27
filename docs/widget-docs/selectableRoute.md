# SELECTABLE_BTN + route (`selectableRoute`)

**Status:** LIVE di app (grid tombol navigasi — tiap tombol ke halaman)
**Dev spec:** ⚠ TIDAK ADA spec khusus — grounded dari template (varian SELECTABLE_BTN)
**Widget tab:** row 239

## Buat apa

Kumpulan tombol yang **langsung mengarah ke halaman** (bukan menyimpan pilihan ke form). Semacam menu kotak-kotak: tiap tombol punya label + ikon + tujuan route sendiri.

## Tampilan

```
┌────────────────────────────────────┐
│ [ 📋 Tugas ]   [ 🚚 Kendaraan ]    │  ← maxGrid kolom
│ [ 👥 Pekerja ] [ 📊 Laporan ]      │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"SELECTABLE_BTN","mode":"route","maxGrid":"2","text":"Tugas◆Kendaraan◆Pekerja◆Laporan","icons":"assignment◆local_shipping◆groups◆assessment","routes":"vertikaTeknoLokaciptaTaskFeed◆vertikaTeknoLokaciptaVehicleFeed◆vertikaTeknoLokaciptaWorker◆vertikaTeknoLokaciptaReport","height":64}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `SELECTABLE_BTN` | — |
| `mode` | Wajib | `route` — tiap tombol navigasi | `route` |
| `maxGrid` | Wajib | Jumlah kolom | `2` |
| `text` | Wajib | Label tiap tombol (dipisah `◆`) | `Tugas◆Kendaraan◆…` |
| `icons` | Opsional | Ikon tiap tombol (dipisah `◆`, sejajar `text`) | `assignment◆…` |
| `routes` | Wajib | Halaman tujuan tiap tombol (dipisah `◆`, sejajar `text`) | `…TaskFeed◆…` |
| `height` | Opsional | Tinggi tombol | `64` |

## Posisi field gabungan

`text` / `icons` / `routes` dipisah `◆` dan **sejajar per posisi** (tombol ke-N pakai `text[N]` + `icons[N]` + `routes[N]`).

## Tips & catatan

- Beda dari `selectableGrid`/`selectableVertical` (183/184) yang menyimpan pilihan ke form — `selectableRoute` = navigasi langsung.
- Pastikan `text`, `icons`, `routes` jumlah segmennya sama & urut sejajar.
