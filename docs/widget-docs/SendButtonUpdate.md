# RBT — tombol kirim + ubah baris (`SendButtonUpdate`)

**Status:** LIVE di app (varian tombol RBT standar)
**Widget tab:** row 174

## Buat apa

Tombol simpan-kirim yang **mengubah baris data yang sudah ada** (bukan menambah baru), sambil merekam GPS + dialog konfirmasi. Dipakai untuk update status/isi record.

## Tampilan

```
[            Kirim            ]   ← tombol lebar penuh, tinggi 64
        ── tap ──▶ ubah baris + dialog "Berhasil"
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"position":251,"text":"Kirim","run":"","action":"savesend","com":"auz","width":"full","height":64,"buttonColor":"grey","textColor":"","route":"vertikaTeknoLokacipta","delay":5,"gpsPosition":"2","flag":"update","updateTableRow":"84214220504259//task⭘tablevid◼20342033315492⭘search◼tnm★{taskVid}⭘st◼selesai","chain":{"type":"DO_DIALOG","title":"Berhasil","children":[{"type":"TXT","data":"Status diperbarui."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `position` | otomatis (baked) | Slot tombol | `251` |
| `text` (child) | Wajib | Label tombol | `Kirim` |
| `run` | Wajib | `[?] pemicu/mode jalan — cek dev` | — |
| `action` | otomatis (baked) | `savesend` | — |
| `com` | otomatis (baked) | `auz` (kanal Autsorz) | — |
| `width` / `height` / `buttonColor` / `textColor` | baked | Tampilan tombol | `full` / `64` / `grey` |
| `route` | Wajib | Halaman tujuan | `vertikaTeknoLokacipta` |
| `gpsPosition` | Wajib | Slot form koordinat GPS | `2` |
| `flag` | Wajib | Penanda kiriman | `update` |
| `updateTableRow` | Wajib | Perintah ubah baris (DSL) | lihat contoh |
| `title` / `confirmation` (chain) | Wajib | Dialog konfirmasi | `Berhasil` |

## Posisi field gabungan

Tidak ada field ◆-gabungan; `updateTableRow` pakai simbol DSL (lihat glossary README).

## Tips & catatan

- `updateTableRow` = ubah baris yang cocok dengan `search`. Untuk menambah baris baru, pakai `sendButtonGpsAddTable`/`2`.
- `[?]` Arti field `run` belum terdokumentasi — konfirmasi ke dev.
