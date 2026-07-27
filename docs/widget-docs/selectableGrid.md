# SELECTABLE_BTN variant `grid` (`selectableGrid`)

**Status:** LIVE di app (renderer SELECTABLE_BTN terkonfirmasi — dipakai picker alasan, mis. FailedDelivery)
**Widget tab:** row 184

## Buat apa

Kumpulan tombol pilihan tersusun **kotak-kotak (grid) beberapa kolom**, pilih satu — hasilnya disimpan ke slot form. Dipakai untuk pilih alasan/kategori yang jumlahnya sedikit.

## Tampilan

```
┌ [TITLE] ───────────────────────────┐
│ [ Kebersihan ]   [ AC & pendingin ]│  ← maxGrid=2 kolom
│ [ Listrik    ]   [ Maintenance    ]│  ← pilih satu (single-select)
└────────────────────────────────────┘
```

## Contoh JSON

(contoh live — dari memory referensi widget)

```json
{"type":"SELECTABLE_BTN","variant":"grid","icon":"pin_drop","title":"JENIS KELUHAN","height":50,"maxGrid":2,"position":7,"bgSelected":"gray","text":"Kebersihan◆AC & pendingin◆Listrik & lampu◆Maintenance"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `SELECTABLE_BTN` | — |
| `variant` | Wajib | `grid` — tombol tersusun kotak | `grid` |
| `icon` | Opsional | Ikon di judul | `pin_drop` |
| `title` | Wajib | Judul (biasa HURUF BESAR) | `JENIS KELUHAN` |
| `height` | Opsional | Tinggi tiap tombol | `50` |
| `maxGrid` | Wajib | Jumlah kolom | `2` |
| `position` | Wajib | Slot form tempat pilihan disimpan (`◁N▷`) | `7` |
| `bgSelected` | Opsional | Warna tombol saat terpilih | `gray` |
| `text` | Wajib | Daftar opsi, dipisah `◆` (label-only, satu nilai per opsi) | `Kebersihan◆AC & pendingin◆…` |

## Posisi field gabungan

`text` — tiap segmen `◆` = satu opsi (label = nilai). Single-select.

## Tips & catatan

- Kembar dengan `selectableVertical` (183) — beda cuma tata letak (grid `maxGrid` kolom vs vertikal).
- **Single-select** (tidak ada mode centang-banyak). Butuh pilih banyak → widget lain.
- Nilai tersimpan = label opsi yang dipilih.
