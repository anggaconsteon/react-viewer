# PROGRESS_BAR (`progressBar`)

**Status:** Status renderer belum terkonfirmasi — cek dev (di katalog widget masih ditandai `[draft]`)
**Widget tab:** row 170

## Buat apa

Bar kemajuan (progress) — menampilkan seberapa jauh sesuatu selesai, dalam bentuk garis terisi + persen/jumlah. Misal: "5 dari 8 titik selesai".

## Tampilan

```
┌──────────────────────────────────┐
│ ████████████░░░░░░░░   62% (5/8)  │
└──────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"PROGRESS_BAR","bgColor":"#FFF","lineColor":"#000","showPercent":"true","showCount":"true","width":100,"height":20,"borderRadius":10,"positionId":"5","text":"Kemajuan patroli"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `PROGRESS_BAR` | — |
| `bgColor` | Opsional | Warna latar bar | `#FFF` |
| `lineColor` | Opsional | Warna garis terisi | `#000` |
| `showPercent` | Wajib | `true`/`false` — tampil persen | `true` |
| `showCount` | Wajib | `true`/`false` — tampil jumlah (mis. 5/8) | `true` |
| `width` / `height` / `borderRadius` | Opsional | Ukuran & sudut bar | `100` / `20` / `10` |
| `positionId` | Wajib | `[?] sumber nilai kemajuan (slot form / id data) — cek dev` | `5` |
| `text` | Wajib | Teks/label yang menyertai bar | `Kemajuan patroli` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- `[?]` Cara `positionId` menentukan nilai kemajuan (dari slot form atau dari data) belum ada spec tertulis — konfirmasi ke dev.
- Ada versi mock lama di `json/consteon-field-app-v3/` — SSOT tetap template sheet di atas.
