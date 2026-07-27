# MAP_POINT_PICKER (`mapPointPicker`)

**Status:** Renderer belum ada (config sudah siap) — spec dikirim ke dev Flutter 2026-07-17; widget belum tampil di app sampai renderer selesai
**Widget tab:** row 298

## Buat apa

Field form untuk memilih titik koordinat (latitude,longitude) tanpa pernah mengetik angka. User tinggal tap "Lokasi Saya" (GPS) atau "Cari di Peta" (geser peta / cari nama tempat). Menggantikan input koordinat lewat spreadsheet yang sering korup gara-gara format desimal Indonesia (koma vs titik).

## Tampilan

```
SEBELUM dipilih:                      SESUDAH dipilih:
┌────────────────────────────────┐    ┌────────────────────────────────┐
│ Titik Lokasi                   │    │ Titik Lokasi              ✓    │
│ ┌────────────────────────────┐ │    │ 📍 Pos Satpam Gerbang Timur    │
│ │ Belum ada lokasi terpilih  │ │    │    Jl. BSD Raya Utama, Serpong │
│ └────────────────────────────┘ │    │    -6.30215, 106.65342         │
│ [📍 Lokasi Saya] [🗺️ Cari di Peta] │    │ [Ganti Lokasi]                 │
└────────────────────────────────┘    └────────────────────────────────┘
```

Layar peta fullscreen (setelah tap "Cari di Peta"): pin diam di tengah, peta yang digeser (pola Gojek), plus kolom cari alamat.

## Contoh JSON

```json
{"type":"MAP_POINT_PICKER","label":"Titik Lokasi","position":12,"addressPosition":"","latPosition":"14","lngPosition":"15","currentValue":"","initialCenter":"","zoom":17,"searchEnabled":"TRUE","searchCountry":"id","text":"Belum ada lokasi terpilih◆📍 Lokasi Saya◆🗺️ Cari di Peta◆Ganti Lokasi◆Cari alamat / tempat…◆Pakai Lokasi Ini◆Mencari lokasi…◆GPS gagal — cek izin lokasi◆Jaringan bermasalah, coba lagi"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `MAP_POINT_PICKER` | — |
| `label` | Wajib | Judul field di form | `Titik Lokasi` |
| `position` | Wajib | Nomor posisi form tempat nilai utama `"lat,long"` disimpan (dibaca `◁N▷`) | `12` |
| `addressPosition` | Opsional (kosong = off) | Posisi form terpisah untuk nama/alamat hasil pencarian; kosong = nama cuma tampilan | `13` |
| `latPosition` | Opsional (kosong = off) | Posisi form untuk latitude sendiri (dipakai kalau database butuh lat & long terpisah) | `14` |
| `lngPosition` | Opsional (kosong = off) | Posisi form untuk longitude sendiri | `15` |
| `currentValue` | otomatis (selalu kosong) | Nilai awal | `""` |
| `initialCenter` | Opsional | Pusat peta awal `"lat,long"` saat belum ada nilai; kosong = coba GPS dulu | `-6.302,106.653` |
| `zoom` | Wajib | Zoom awal peta fullscreen (angka) | `17` |
| `searchEnabled` | Wajib | `TRUE`/`FALSE` — tampil kolom cari alamat atau tidak | `TRUE` |
| `searchCountry` | Opsional | Batasi hasil pencarian ke negara tertentu | `id` |
| `text` | Wajib | Semua label/pesan widget, 9 bagian dipisah `◆` (lihat tabel posisi) | — |

## Posisi field gabungan

`text` — 9 segmen dipisah `◆` (sumber: spec):

| # | Isi | Contoh |
|---|---|---|
| 1 | Placeholder saat kosong | `Belum ada lokasi terpilih` |
| 2 | Tombol GPS | `📍 Lokasi Saya` |
| 3 | Tombol buka peta | `🗺️ Cari di Peta` |
| 4 | Tombol ganti lokasi | `Ganti Lokasi` |
| 5 | Hint kolom cari | `Cari alamat / tempat…` |
| 6 | Tombol konfirmasi | `Pakai Lokasi Ini` |
| 7 | Pesan loading | `Mencari lokasi…` |
| 8 | Error GPS / izin ditolak | `GPS gagal — cek izin lokasi` |
| 9 | Error jaringan | `Jaringan bermasalah, coba lagi` |

## Tips & catatan

- Nilai tersimpan SELALU pakai titik desimal 6 angka (contoh `-6.302154,106.653428`) — apapun setting bahasa HP. Ini justru alasan widget ini dibuat.
- Internet mati / pencarian nama gagal → koordinat tetap bisa dipakai, nama diganti angka koordinat.
- Radius geofence (`ra`) BUKAN urusan widget ini — itu field angka biasa di form yang sama.
- Tidak bisa: peta langsung di dalam form (berat), ketik koordinat manual (sumber bug), gambar polygon.
- Konsumen pertama: form Tambah Titik Patroli (`TitikPatroli`). Spec lengkap: `docs/map-point-picker-widget-dev-spec.md`.
- Widget sibling: `location` (itu mesin absensi scan, beda fungsi — jangan ketuker).
