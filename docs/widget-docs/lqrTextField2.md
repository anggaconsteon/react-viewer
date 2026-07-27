# txf variant `qrScan` (`lqrTextField2`)

**Status:** LIVE di app (keluarga `txf` + scan QR lokasi; varian ke-3 dari `lqrTextField`)
**Widget tab:** row 167

## Buat apa

Field isian yang diisi dengan **scan QR lokasi (LQR)** — bukan diketik. Dipakai untuk memastikan petugas benar-benar ada di titik yang ditentukan: tap tombol scan → kamera baca QR titik → field terisi + nama lokasi ikut tampil. Ada penjaga anti-curang (GPS palsu / di luar area).

## Tampilan

```
┌ [LABEL] ───────────────────────────┐
│  [ hint / hasil scan ]      [ 📷 ] │  ← tombol scan QR
│  📍 nama lokasi hasil scan         │  ← locationNamePosition
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder template diisi nilai wajar)

```json
{"type":"txf","variant":"qrScan","qr":"lqr","table":"84214220504259//location","text":"Scan QR titik","margin":"0,0,0,0","icon":"qr_code_scanner","label":"Titik Patroli","hint":"Belum di-scan","maxLength":0,"size":14,"position":"10","buttonIcon":"qr_code_scanner","locationNamePosition":"11","fakeGpsAllowed":"false","outPositionAllowed":"false"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `txf` (field isian) | — |
| `variant` | otomatis (baked) | `qrScan` — mode scan QR | — |
| `qr` | Wajib | Jenis QR yang diterima | `[?] kode jenis QR — cek dev (mis. lqr)` |
| `table` | Wajib | Koleksi data lokasi yang dicocokkan hasil scan | `84214220504259//location` |
| `text` | Wajib | Teks yang tampil | `Scan QR titik` |
| `margin` | Wajib | Jarak sekeliling | `0,0,0,0` |
| `icon` / `buttonIcon` | Wajib | Ikon field / ikon tombol scan | `qr_code_scanner` |
| `label` | Wajib | Judul field | `Titik Patroli` |
| `hint` | Wajib | Teks bantuan sebelum diisi | `Belum di-scan` |
| `maxLength` | Opsional | Batas panjang (0 = tanpa batas) | `0` |
| `size` | Opsional | Ukuran teks | `14` |
| `position` | Wajib | Slot form tempat nilai hasil scan disimpan (`◁N▷`) | `10` |
| `locationNamePosition` | Opsional | Slot form tempat nama lokasi hasil scan disimpan | `11` |
| `fakeGpsAllowed` | Wajib | `true`/`false` — boleh lolos kalau terdeteksi GPS palsu | `false` |
| `outPositionAllowed` | Wajib | `true`/`false` — boleh lolos kalau scan di luar area titik | `false` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- Keluarga QR text-field: `lqrTextField` (136), `lqrTextField1` (147), `lqrTextField2` (167) = LQR (QR lokasi); `uqrTextField`, `pqrTextField` = jenis QR lain; `qrTextField`, `qrScanner`, `scanner` = scan QR umum. Beda utama antar-varian biasanya di penjaga anti-curang + slot posisi.
- `[?]` Beda persis `lqrTextField2` dari `lqrTextField`/`lqrTextField1` (dan nilai valid `qr`) belum ada spec tertulis — konfirmasi ke dev kalau perlu pasti.
