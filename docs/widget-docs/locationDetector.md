# LOCATION_DETECTOR (`locationDetector`)

**Status:** Status renderer belum terkonfirmasi — cek dev (di katalog widget masih ditandai `[draft]`)
**Widget tab:** row 169

## Buat apa

Kotak status lokasi: menampilkan apakah petugas sedang **di dalam / di luar area (geofence)**, seberapa akurat GPS-nya, plus tombol lihat peta & refresh. Dipakai di layar absensi/patroli supaya petugas tahu posisinya sah atau tidak sebelum kirim.

## Tampilan

```
┌─ Location ─────────────────────────┐
│  ✓ Inside Site        ± 8 m        │  ← status geofence + akurasi
│  [ View Map ]   [ Refresh ]        │
└────────────────────────────────────┘
```

## Contoh JSON

(dari template — `text` sudah terisi bawaan; placeholder tinggal `showViewMap`/`showRefresh`)

```json
{"type":"LOCATION_DETECTOR","width":100,"height":40,"borderRadius":10,"showViewMap":"true","showRefresh":"true","text":"Location◆Inside Site◆Outside Site◆Unknown◆High Accuracy◆Low Accuracy◆±◆m◆View Map◆Refresh◆Posisi tidak ditemukan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `LOCATION_DETECTOR` | — |
| `width` / `height` / `borderRadius` | Opsional | Ukuran & sudut kotak | `100` / `40` / `10` |
| `showViewMap` | Wajib | `true`/`false` — tampil tombol lihat peta | `true` |
| `showRefresh` | Wajib | `true`/`false` — tampil tombol refresh posisi | `true` |
| `text` | Wajib | Semua label, 11 bagian `◆` (lihat tabel posisi) | — |

## Posisi field gabungan

`text` — 11 segmen dipisah `◆` (sumber: nilai bawaan template):

| # | Isi | Contoh |
|---|---|---|
| 1 | Judul | `Location` |
| 2 | Status di dalam area | `Inside Site` |
| 3 | Status di luar area | `Outside Site` |
| 4 | Status tidak diketahui | `Unknown` |
| 5 | Label akurasi tinggi | `High Accuracy` |
| 6 | Label akurasi rendah | `Low Accuracy` |
| 7 | Simbol ± akurasi | `±` |
| 8 | Satuan jarak | `m` |
| 9 | Tombol lihat peta | `View Map` |
| 10 | Tombol refresh | `Refresh` |
| 11 | Pesan posisi gagal | `Posisi tidak ditemukan` |

## Tips & catatan

- Widget tampilan status saja — tidak menyimpan nilai ke form. Untuk merekam koordinat saat kirim, itu tugas `gpsPosition` di tombol kirim.
- Beda dengan `mapPointPicker` (memilih titik) dan `location` (mesin scan absensi) — `locationDetector` hanya menampilkan status posisi sekarang.
- `[?]` Ada versi mock lama dengan struktur lebih kaya (data worker/shift/gps) di `json/consteon-field-app-v3/` — struktur SSOT di sheet = template di atas. Konfirmasi ke dev bentuk mana yang dipakai renderer.
