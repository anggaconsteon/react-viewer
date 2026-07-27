# RBT — tombol hapus (`deleteButton`)

**Status:** LIVE di app (varian tombol RBT standar)
**Widget tab:** row 176

## Buat apa

Tombol yang **menghapus baris dari tabel** (dan bisa sekaligus menulis catatan ke tabel lain), plus dialog konfirmasi. Dipakai untuk membuang data — batalkan item, hapus draft, dsb.

## Tampilan

```
[          Hapus          ]  ── tap ──▶ hapus baris + dialog konfirmasi
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Hapus","action":"savesend","route":"vertikaTeknoLokacipta","delay":5,"gpsPosition":"2","flag":"delete","addToTable":"","deleteFromTable":"84214220504259//cart⭘tablevid◼20342033315492⭘search◼id★{id}","chain":{"type":"DO_DIALOG","title":"Terhapus","children":[{"type":"TXT","data":"Item dihapus."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `text` (child) | Wajib | Label tombol | `Hapus` |
| `route` | Wajib | Halaman tujuan setelah hapus | `vertikaTeknoLokacipta` |
| `gpsPosition` | Wajib | Slot form koordinat GPS | `2` |
| `flag` | Wajib | Penanda kiriman | `delete` |
| `addToTable` | Opsional (kosong = off) | Tulis 1 baris catatan ke tabel lain saat hapus (mis. log) | `""` |
| `deleteFromTable` | Wajib | Perintah hapus baris (DSL: tabel + `search` baris yang dihapus) | lihat contoh |
| `title` / `confirmation` (chain) | Wajib | Dialog konfirmasi | `Terhapus` |

## Posisi field gabungan

Tidak ada field ◆-gabungan.

## Tips & catatan

- `deleteFromTable` menghapus baris yang cocok `search` — pastikan `search` mengarah ke baris unik supaya tidak salah hapus.
- Bisa dipasangkan: `deleteFromTable` (buang data) + `addToTable` (catat jejak penghapusan) dalam satu tap.
