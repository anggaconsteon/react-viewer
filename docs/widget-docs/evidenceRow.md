# EVIDENCE_ROW (`evidenceRow`)

**Status:** LIVE di app (baris tambah catatan + foto bukti — driver runtime)
**Dev spec:** ADA — bagian delivery workspace / evidence (driver specs)
**Widget tab:** row 227

## Buat apa

Baris ringkas untuk menambahkan **catatan** + **foto** sebagai bukti pada suatu langkah. Dua tombol (catatan / foto) yang mengisi slot form, dengan penanda kalau sudah terisi.

## Tampilan

```
┌────────────────────────────────────┐
│ 📝 Tambah Catatan    ✓ Catatan     │  ← notePosition
│ 📷 Ambil Foto        Foto · 1      │  ← photoPosition
└────────────────────────────────────┘
```

## Contoh JSON

(resolved live — dari template Widget row 227)

```json
{"type":"EVIDENCE_ROW","notePosition":7,"photoPosition":8,"text":"📝◆Tambah Catatan◆Catatan ditambah◆📷◆Ambil Foto◆Foto · 1"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `EVIDENCE_ROW` | — |
| `notePosition` | Wajib | Slot form tempat catatan disimpan (`◁N▷`) | `7` |
| `photoPosition` | Wajib | Slot form tempat foto disimpan (`◁N▷`) | `8` |
| `text` | Wajib | Ikon + label catatan/foto (6 segmen `◆`) | lihat tabel posisi |

## Posisi field gabungan

`text` — 6 segmen `◆`: ikon catatan / label tombol catatan / label sudah-ada-catatan / ikon foto / label tombol foto / label sudah-ada-foto.

## Tips & catatan

- Isian catatan & foto masuk slot form, lalu dibaca `◁7▷`/`◁8▷` di tombol submit langkah itu.
- Dipakai di dalam langkah pengiriman/custody untuk lampiran bukti ringkas.
