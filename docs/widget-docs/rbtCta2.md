# RBT — dua tombol CTA (`rbtCta2`)

**Status:** LIVE di app (dua tombol navigasi ringkas)
**Dev spec:** ⚠ TIDAK ADA spec khusus — grounded dari template (tombol dasar)
**Widget tab:** row 250

## Buat apa

Dua tombol berdampingan yang masing-masing pindah halaman — tanpa tulis data. Versi 2-tombol dari `rbtCta` (211). Untuk pilihan navigasi sederhana (mis. "Lanjut" / "Batal").

## Tampilan

```
[   Batal   ]        [   Lanjut   ]
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Batal","route":"vertikaTeknoLokaciptaAdminHome"},{"text":"Lanjut","route":"vertikaTeknoLokaciptaCreateTaskItem"}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `alignment` | otomatis (baked) | `spaceevenly` | — |
| `text` (per child) | Wajib | Label tombol | `Batal` / `Lanjut` |
| `route` (per child) | Wajib | Halaman tujuan | `…AdminHome` / `…CreateTaskItem` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- Versi 1 tombol = `rbtCta` (211); versi lengkap (dengan aksi tulis) = `rbtCtaFull` (293).
- Murni navigasi — tidak menyimpan data.
