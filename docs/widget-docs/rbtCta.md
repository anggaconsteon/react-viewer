# RBT — tombol CTA sederhana (`rbtCta`)

**Status:** LIVE di app (tombol pindah halaman paling ringkas)
**Dev spec:** ⚠ TIDAK ADA spec khusus — grounded dari template (tombol dasar)
**Widget tab:** row 211

## Buat apa

Tombol paling sederhana: label + pindah halaman. Tanpa GPS, tanpa tulis data — cuma "call to action" untuk navigasi. Dipakai sebagai tombol lanjut/kembali ringkas.

## Tampilan

```
        [        Lanjut        ]
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"center","children":[{"text":"Lanjut","route":"vertikaTeknoLokaciptaCustodyCount"}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `alignment` | otomatis (baked) | `center` | — |
| `text` (child) | Wajib | Label tombol | `Lanjut` |
| `route` | Wajib | Halaman tujuan | `…CustodyCount` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- Tombol paling minimal — kalau butuh tulis data/GPS, pakai keluarga `sendButton…`/`routeBtn`.
- Versi dengan aksi tulis + dialog = `rbtCta2` (250); versi lebih lengkap = `rbtCtaFull` (293).
