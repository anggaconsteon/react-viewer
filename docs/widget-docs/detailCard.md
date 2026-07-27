# DETAIL_CARD (`detailCard`)

**Status:** LIVE di app (kartu detail universal — key-value + gambar)
**Dev spec:** ADA — `docs/detail-card-universal-dev-spec.md`
**Widget tab:** row 292

## Buat apa

Kartu detail serba-guna untuk 1 dokumen: judul + subjudul + badge status + baris **kolom-nilai** (label : isi) + gambar. Widget detail utama, pasangan `listCard` (291).

## Tampilan

```
┌────────────────────────────────────┐
│ Judul                     [badge]  │
│ subjudul                           │
│ ────────────────────────────────── │
│ Nama    : Budi                     │  ← rows (label : field)
│ Alamat  : Jl. Merdeka 5            │
│ [ gambar1 ] [ gambar2 ]            │  ← images
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"DETAIL_CARD","vidtable":"20342033315492","table":"84214220504259//task","search":"tnm◼{taskVid}","title":"<kn>","subtitle":"<al>","badgeField":"tst","badgeMap":"assigned◼Ditugaskan◼warn★completed◼Selesai◼ok","rows":"Nama◼<kn>★Alamat◼<al>★Item◼<sum>","hideEmptyRows":"TRUE","images":"i","imageLabels":"Bukti","text":"Detail Tugas"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `DETAIL_CARD` | — |
| `vidtable` / `table` / `search` | Wajib | Data 1 dokumen | `tnm◼{taskVid}` |
| `title` / `subtitle` | Wajib | Template `<field>` judul / subjudul | `<kn>` / `<al>` |
| `badgeField` / `badgeMap` | Opsional | Field badge + peta `value◼label◼tone★…` | `tst` / `assigned◼Ditugaskan◼warn★…` |
| `rows` | Wajib | Baris kolom-nilai: `Label◼<field>★Label◼<field>…` | `Nama◼<kn>★Alamat◼<al>` |
| `hideEmptyRows` | Opsional | `TRUE` = sembunyikan baris yang isinya kosong | `TRUE` |
| `images` | Opsional | Nama field gambar (bisa banyak) | `i` |
| `imageLabels` | Opsional | Label gambar | `Bukti` |
| `text` | Wajib | Judul kartu | `Detail Tugas` |

## Posisi field gabungan

`rows` = `Label◼<field>★Label◼<field>…` (`◼` pisah label-nilai, `★` antar-baris). `badgeMap` = `value◼label◼tone★…`. `title`/`subtitle` = template `<field>`.

## Tips & catatan

- Widget detail universal — ganti `rows`/`images` untuk detail apa pun tanpa widget baru.
- Pasangan list = `listCard` (291). Untuk struk/nota gunakan `receiptDoc` (279).
- Spec: `docs/detail-card-universal-dev-spec.md`.
