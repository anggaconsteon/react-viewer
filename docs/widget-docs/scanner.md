# scanner (`scanner`)

**Status:** LIVE di app (sibling ramping dari `location`, khusus scan QR)
**Dev spec:** ADA — `docs/scanner-widget-dev-spec.md`
**Widget tab:** row 199

## Buat apa

Widget scan QR generik — versi ramping dari `location` (mesin absensi) yang hanya fokus baca QR + ambil foto, tanpa mesin geofence penuh. Dipakai untuk aksi scan QR umum (mis. scan barang/titik) dengan opsi tulis data.

## Tampilan

```
┌────────────────────────────────────┐
│        [ kamera / preview QR ]      │
│        arahkan ke kode QR           │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"scanner","url":"","text":"Scan QR◆Arahkan ke kode","height":"300","width":"100","folder":"scan","filename":"<timestamp>","flag":"scan","route":"","opMode":"qr","displayMode":"inline","addToTable":"","qr":"uqr","table":"84214220504259//asset","search":"","com":"auz"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `scanner` | — |
| `url` | Opsional | Gambar/overlay | `""` |
| `text` | Wajib | Label/petunjuk (dipisah `◆`) | `Scan QR◆Arahkan ke kode` |
| `height` / `width` | Opsional | Ukuran area scan | `300` / `100` |
| `folder` / `filename` | Opsional | Lokasi & nama file foto hasil scan | `scan` / `<timestamp>` |
| `flag` | Wajib | Penanda kiriman | `scan` |
| `route` | Opsional | Halaman tujuan setelah scan | `""` |
| `opMode` | Wajib | `[?] mode operasi scan — cek dev (mis. qr)` | `qr` |
| `displayMode` | Wajib | `[?] mode tampilan — cek dev (mis. inline)` | `inline` |
| `addToTable` | Opsional | Tulis data hasil scan (DSL) | `""` |
| `qr` | Opsional | Jenis QR yang diterima | `uqr` |
| `table` / `search` | Opsional | Koleksi yang dicocokkan hasil scan | `84214220504259//asset` |
| `com` | Opsional | Kanal | `auz` |

## Posisi field gabungan

`text` dipisah `◆` (label/petunjuk); urutan segmen `[?]` belum terdaftar di dict — lihat spec scanner.

## Tips & catatan

- Beda dari `location` (mesin absensi geofence) — `scanner` = QR + foto saja, lebih ringan. Beda juga dari `qrScanner`/`qrTextField`.
- `[?]` Nilai valid `opMode`/`displayMode` di spec scanner — konfirmasi kalau butuh pasti. Spec: `docs/scanner-widget-dev-spec.md`.
