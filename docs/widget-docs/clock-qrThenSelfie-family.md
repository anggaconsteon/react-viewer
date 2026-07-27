# Clock In/Out — kombinasi QR-lalu-Selfie (`clockIn…QrThenSelfie` / `clockOut…QrThenSelfie`)

**Status:** LIVE di app (mesin absensi `location` — 16 kombinasi)
**Dev spec:** ADA — `docs/location-qrselfie-mode-dev-spec.md`
**Widget tab:** row 258-265 (clock in) + 267-274 (clock out) — 16 kombinasi

## Buat apa

Tombol absensi masuk (clock in) / pulang (clock out) yang menjalankan **rangkaian verifikasi**: QR titik lalu selfie, dengan/atau GPS. Ini bukan 16 widget berbeda-beda logika — semuanya varian dari **1 mesin `location`**, beda cuma di kombinasi metode verifikasi (`opMode`) + urutan. Menggantikan absensi manual, anti-titip.

## Kenapa 1 doc

16 baris Widget (258-265 masuk, 267-274 pulang) hanya berbeda **kombinasi metode**: QR / Selfie / GPS / QR+Selfie, plus alur "QR dulu baru Selfie". Field & perilakunya identik; yang beda cuma `opMode` per langkah + gambar/label. Jadi didokumentasikan sebagai satu keluarga.

## Tampilan

```
┌─ (layar penuh) ────────────────────┐
│   [ Scan QR titik ]                │  ← langkah 1 (opMode qr…)
│         ↓ berhasil                 │
│   [ Ambil Selfie ]                 │  ← langkah 2 (opMode selfie)
│   ✔️ Check IN berhasil             │
└────────────────────────────────────┘
```

## Contoh JSON (potongan — 1 langkah dari kombinasi)

Tiap langkah = 1 elemen `location` di dalam `HORIZONTAL_ICON`. Contoh langkah QR+Selfie:

```json
{"type":"location","url":"[IMAGE1]","opMode":"qr-selfie","displayMode":"full-screen","tolerance":80,"folder":"[FOLDER]","filename":"[FILENAME]","locList":[LOCLIST],"flag":"[FLAG]","route":"[ROUTE]","fakeGpsAllowed":"[FAKEGPSALLOWED]","outPositionAllowed":"[OUTPOSITIONALLOWED]","addToTable":"[ADDTOTABLE]","updateTableRow":"[UPDATETABLEROW]","addToEvent":"[ADDTOEVENT]","updateEventRow":"[UPDATEEVENTROW]","text":"QR + Selfie◆Batal◆Absensi berhasil◆Clock in berhasil◆Clock out berhasil◆…(27 segmen pesan status)…"}
```

## Field (per elemen `location`)

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `location` (mesin absensi) | — |
| `opMode` | Wajib | Metode langkah: `qr-selfie` / `qr-single` / `selfie` / `gps-single` | `qr-selfie` |
| `displayMode` | otomatis (baked) | `full-screen` | `full-screen` |
| `tolerance` | otomatis (baked) | Toleransi cocok selfie/QR | `80` |
| `url` / `[IMAGE1..3]` | Wajib | Gambar panduan tiap langkah | `[IMAGE1]` |
| `folder` / `filename` | Wajib | Lokasi & nama file foto | — |
| `locList` | Wajib | Daftar titik/geofence yang sah | `[LOCLIST]` |
| `flag` | Wajib | Penanda kiriman | — |
| `route` | Wajib | Halaman tujuan setelah berhasil | — |
| `fakeGpsAllowed` / `outPositionAllowed` | Wajib | Izinkan GPS palsu / di luar area | `FALSE` |
| `addToTable`/`updateTableRow`/`addToEvent`/`updateEventRow` | Wajib (salah satu) | Perintah tulis absensi (DSL) | — |
| `text` | Wajib | 27 segmen pesan status `◆` (lihat catatan) | — |

## Posisi field gabungan

`text` = **27 segmen `◆`** — semua pesan status absensi (label metode, batal, berhasil masuk/pulang, overtime, QR salah, perlu selfie, di luar lokasi, fake GPS, dll.). Dari template baked; owner ubah kata-kata cukup di sheet. Urutan persis: lihat contoh baked row 258/259 + spec.

## Tips & catatan

- 16 kombinasi = pilih baris Widget sesuai metode yang diinginkan (mis. `clockInQrSelfieGpsQrThenSelfie` = QR+Selfie+GPS dengan alur QR-dulu). Logika sama, `opMode` beda.
- "QrThenSelfie" = urutan: scan QR titik dulu, baru selfie wajah (bukan sekaligus).
- Mesin `location` di sini = engine absensi/geofence (BUKAN `mapPointPicker` pemilih titik, BUKAN `scanner` QR umum).
- Keluarga clock lama tanpa "QrThenSelfie" ada di rows 116-130 (belum didokumentasikan terpisah — kontrak sama).
- Spec: `docs/location-qrselfie-mode-dev-spec.md`.
