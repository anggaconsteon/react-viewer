# RBT — tombol CTA lebar (`rbtCtaFull`)

**Status:** LIVE di app (tombol navigasi lebar, warna & lebar bisa diatur)
**Dev spec:** ⚠ TIDAK ADA spec khusus — grounded dari template (tombol dasar)
**Widget tab:** row 293

## Buat apa

Tombol pindah halaman dengan **warna & lebar bisa diatur** (mis. tombol utama lebar penuh). Versi paling lengkap dari keluarga `rbtCta` — tetap navigasi-saja (tanpa tulis data).

## Tampilan

```
[             Lanjut ke Ringkasan             ]  ← width penuh, warna diatur
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"center","children":[{"text":"Lanjut ke Ringkasan","route":"vertikaTeknoLokaciptaCreateTaskSummary","buttonColor":"blue","textColor":"white","width":"full"}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `alignment` | otomatis (baked) | `center` | — |
| `text` (child) | Wajib | Label tombol | `Lanjut ke Ringkasan` |
| `route` | Wajib | Halaman tujuan | `…CreateTaskSummary` |
| `buttonColor` / `textColor` | Wajib | Warna tombol & teks | `blue` / `white` |
| `width` | Opsional | Lebar tombol (mis. `full`) | `full` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- Keluarga CTA navigasi: `rbtCta` (211, minimal), `rbtCta2` (250, 2 tombol), `rbtCtaFull` (293, ini — 1 tombol + warna/lebar).
- Untuk tombol yang menulis data, pakai keluarga `sendButton…` / `workflow…`.
