# RBT — tombol kirim + GPS + event (`sendButtonGpsWithEvent`)

**Status:** LIVE di app (tombol dasar dari base-library; dipakai banyak halaman)
**Dev spec:** ⚠ TIDAK ADA spec khusus — grounded dari template + katalog (tombol generik, dipakai lintas fitur)
**Widget tab:** row 192

## Buat apa

Tombol simpan-kirim serba-guna: merekam GPS lalu menulis data ke **tabel** (`addToTable`) dan/atau **buku event** (`addToEvent` / `updateEventRow`), diakhiri dialog konfirmasi. Tombol andalan untuk submit form di banyak halaman.

## Tampilan

```
[            Kirim            ]  ── tap ──▶ rekam GPS + tulis data + dialog
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Kirim","action":"savesend","route":"vertikaTeknoLokacipta","delay":5,"gpsPosition":"2","flag":"laporan","addToTable":"","addToEvent":"84214220504259//event⭘r◼4320⭘tablevid◼20342033315492⭘ty◼laporan⭘t◼◀2▶⭘d◼◁3▷","updateEventRow":"","chain":{"type":"DO_DIALOG","title":"Terkirim","children":[{"type":"TXT","data":"Laporan tersimpan."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `text` (child) | Wajib | Label tombol | `Kirim` |
| `route` | Wajib | Halaman tujuan setelah kirim | `vertikaTeknoLokacipta` |
| `gpsPosition` | Wajib | Slot form koordinat GPS | `2` |
| `flag` | Wajib | Penanda kiriman untuk backend | `laporan` |
| `addToTable` | Salah satu wajib | Tulis 1 baris ke tabel (DSL) | `""` |
| `addToEvent` | Salah satu wajib | Tulis 1 baris ke buku event (DSL keyed) | lihat contoh |
| `updateEventRow` | Salah satu wajib | Ubah baris event yang ada (DSL keyed) | `""` |
| `title` / `confirmation` (chain) | Wajib | Dialog konfirmasi | `Terkirim` |

## Posisi field gabungan

Tidak ada field ◆-gabungan; `addToEvent`/`updateEventRow` pakai simbol DSL (lihat glossary README).

## Tips & catatan

- Ini tombol event (buku besar) — beda dari `sendButtonGpsAddTable` (nulis tabel biasa) & `SendButtonUpdate` (`updateTableRow`).
- Karena generik & tanpa `search:"sticky"`, sering dipakai sebagai submit di badan halaman. Keluarga `workflowBtn` (283+) yang sticky/pinned.
- Dipakai lintas fitur (reward, titik patroli, invoice non-WA, dll.) — perilaku persis mengikuti isi DSL yang di-assembly di sheet.
