# ITEM_CARD_DETAIL (`displayItemCardDetail`)

**Status:** LIVE di app (dipakai halaman detail insiden/laporan)
**Widget tab:** row 179

## Buat apa

Kartu detail satu item/laporan: baca 1 dokumen lalu tampilkan isinya lengkap — konten, alasan, status, dan gambar. Dipakai di halaman detail (mis. detail insiden, detail temuan).

## Tampilan

```
┌────────────────────────────────────┐
│ [status]                           │
│ Isi laporan / konten…              │
│ Alasan: …                          │
│ [ gambar ]                         │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"ITEM_CARD_DETAIL","variant":"detail","flag":"insiden","table":"84214220504259//event","search":"id◼{id}","conditions":"","text":"Detail Laporan","content":"d","reason":"rr","status":"st","image":"i"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `ITEM_CARD_DETAIL` | — |
| `variant` | otomatis (baked) | `detail` | — |
| `flag` | Wajib | Penanda untuk backend | `insiden` |
| `table` | Wajib | Koleksi data | `84214220504259//event` |
| `search` | Wajib | Cara memilih 1 dokumen (biasa pakai token dari kartu sebelumnya) | `id◼{id}` |
| `conditions` | Opsional | Syarat tambahan | `""` |
| `text` | Wajib | Judul/teks kartu | `Detail Laporan` |
| `content` | Wajib | Nama field isi konten yang ditampilkan | `d` |
| `reason` | Wajib | Nama field alasan | `rr` |
| `status` | Wajib | Nama field status | `st` |
| `image` | Wajib | Nama field gambar | `i` |

## Posisi field gabungan

Tidak ada field ◆-gabungan; `content`/`reason`/`status`/`image` = nama field lepas (diisi nama field database yang mau ditampilkan).

## Tips & catatan

- `content`/`reason`/`status`/`image` diisi **nama field** di database (bukan nilai) — renderer ambil isinya dari dokumen hasil `search`.
- Widget detail yang lebih baru & universal: `detailCard` (row 293). Untuk daftar (bukan detail satu item), lihat `displayListItemCard`/`listCard`.
