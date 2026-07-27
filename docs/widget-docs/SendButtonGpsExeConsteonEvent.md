# RBT — tombol eksekusi + event (`SendButtonGpsExeConsteonEvent`)

**Status:** LIVE di app (tombol eksekusi RBT + tulis event)
**Dev spec:** ⚠ TIDAK ADA spec khusus — grounded dari template (varian tombol RBT)
**Widget tab:** row 256

## Buat apa

Tombol eksekusi (kanal Consteon) yang menulis ke **buku event** (`addToEvent`) sambil merekam GPS + posisi, lalu dialog konfirmasi. Varian tombol RBT dengan lebar/tinggi & warna yang bisa diatur.

## Tampilan

```
[          Eksekusi          ]  ── tap ──▶ rekam GPS + tulis event + dialog
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"position":"1","text":"Eksekusi","run":"","action":"savesend","width":"full","height":"64","buttonColor":"blue","textColor":"white","route":"vertikaTeknoLokacipta","delay":"5","gpsPosition":"2","flag":"execute","addToEvent":"84214220504259//event⭘r◼4320⭘tablevid◼20342033315492⭘ty◼execute⭘t◼◀2▶⭘d◼◁3▷","chain":{"type":"DO_DIALOG","title":"Terkirim","children":[{"type":"TXT","data":"Tersimpan."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `position` | Opsional | Slot tombol | `1` |
| `text` (child) | Wajib | Label tombol | `Eksekusi` |
| `run` | Opsional | `[?] pemicu/mode jalan — cek dev` | `""` |
| `action` | Wajib | `savesend` | `savesend` |
| `width` / `height` / `buttonColor` / `textColor` | Opsional | Tampilan tombol | `full` / `64` / `blue` / `white` |
| `route` | Wajib | Halaman tujuan | `vertikaTeknoLokacipta` |
| `delay` / `gpsPosition` / `flag` | Opsional | Delay / slot GPS / penanda | `5` / `2` / `execute` |
| `addToEvent` | Wajib | Perintah tulis event (DSL) | lihat contoh |
| `chain` (DO_DIALOG) | Wajib | Dialog konfirmasi | `Terkirim` |

## Posisi field gabungan

Tidak ada field ◆-gabungan; `addToEvent` pakai simbol DSL (lihat glossary README).

## Tips & catatan

- Kanal Consteon + tulis event — mirip `sendButtonGpsWithEvent` (192) dengan opsi tampilan tombol lebih banyak.
- `[?]` Arti `run` belum terdokumentasi — cek dev.
