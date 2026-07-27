# SELECTABLE_BTN variant `vertical` (`selectableVertical`)

**Status:** LIVE di app (renderer SELECTABLE_BTN terkonfirmasi — dipakai picker alasan/kategori)
**Widget tab:** row 183

## Buat apa

Daftar tombol pilihan tersusun **ke bawah (vertikal)**, pilih satu — hasilnya disimpan ke slot form. Dipakai untuk pilih alasan/kategori/hasil tindakan.

## Tampilan

```
┌ [TITLE] ───────────────────────────┐
│ [  Sudah diperbaiki             ]  │  ← pilih satu (single-select)
│ [  Perlu tindak lanjut          ]  │
│ [  Menunggu suku cadang         ]  │
│ [  Eskalasi ke pihak lain       ]  │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"SELECTABLE_BTN","variant":"vertical","icon":"assessment","title":"Hasil Tindakan","height":64,"position":23,"bgSelected":"gray","text":"Sudah diperbaiki◆Perlu tindak lanjut◆Menunggu suku cadang◆Eskalasi ke pihak lain"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `SELECTABLE_BTN` | — |
| `variant` | Wajib | `vertical` — tombol tersusun ke bawah | `vertical` |
| `icon` | Opsional | Ikon di judul | `assessment` |
| `title` | Wajib | Judul (biasa HURUF BESAR) | `Hasil Tindakan` |
| `height` | Opsional | Tinggi tiap tombol | `64` |
| `position` | Wajib | Slot form tempat pilihan disimpan (`◁N▷`) | `23` |
| `bgSelected` | Opsional | Warna tombol saat terpilih | `gray` |
| `text` | Wajib | Daftar opsi, dipisah `◆` (label-only, satu nilai per opsi) | `Sudah diperbaiki◆Perlu tindak lanjut◆…` |

## Posisi field gabungan

`text` — tiap segmen `◆` = satu opsi (label = nilai). Single-select.

## Tips & catatan

- Kembar dengan `selectableGrid` (184) — beda cuma tata letak (vertikal vs kotak-kotak `maxGrid`).
- Single-select (pilih satu). Nilai yang tersimpan = label opsi.
- BUKAN `HORIZONTAL_BUTTON_CHOICE` (widget lain). Untuk picker alasan/kategori, pakai keluarga `SELECTABLE_BTN` ini.
