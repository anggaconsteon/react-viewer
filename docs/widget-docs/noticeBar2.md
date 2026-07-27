# NOTICE_BAR bertingkat (`noticeBar2`)

**Status:** LIVE di app (banner 2-3 tingkat: label + judul + teks)
**Dev spec:** ADA — `docs/notice-bar-widget-dev-spec.md`
**Widget tab:** row 206

## Buat apa

Versi `NOTICE_BAR` yang lebih kaya: bisa 2-3 tingkat teks (label kecil + judul + isi) plus atur perataan ikon. Untuk peringatan yang butuh judul menonjol, bukan cuma satu baris.

## Tampilan

```
┌────────────────────────────────────┐
│ ⚠  PERHATIAN                       │  ← label (kecil)
│    Stok menipis                    │  ← title (tebal)
│    Segera isi ulang sebelum rute   │  ← text (isi)
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"NOTICE_BAR","variant":"warn","icon":"warning","iconAlign":"top","label":"PERHATIAN","title":"Stok menipis","text":"Segera isi ulang sebelum rute berikutnya"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `NOTICE_BAR` | — |
| `variant` | Wajib | Nada → warna dari tema: `ok` / `warn` / `danger` | `warn` |
| `icon` | Opsional | Ikon | `warning` |
| `iconAlign` | Opsional | Perataan ikon (mis. `top` / `center`) | `top` |
| `label` | Opsional | Baris kecil di atas (mis. "PERHATIAN") | `PERHATIAN` |
| `title` | Opsional | Judul tebal | `Stok menipis` |
| `text` | Wajib | Isi banner | `Segera isi ulang…` |

## Posisi field gabungan

Tiga tingkat = field terpisah (`label` / `title` / `text`), bukan `◆`-gabungan. Tingkat yang kosong disembunyikan.

## Tips & catatan

- Versi 1 baris sederhana = `noticeBar` (200). Versi bisa di-tap ke halaman = `noticeBarRoute` (236).
- Warna dari `variant` (tema), bukan hex.
- Spec: `docs/notice-bar-widget-dev-spec.md`.
