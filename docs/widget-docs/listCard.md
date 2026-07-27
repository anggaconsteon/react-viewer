# LIST_CARD (`listCard`)

**Status:** LIVE di app (daftar kartu universal — reader keyed)
**Dev spec:** ADA — `docs/list-card-universal-dev-spec.md`
**Widget tab:** row 291

## Buat apa

Daftar kartu serba-guna dari koleksi data: judul, subjudul, meta, badge status, trailing (mis. nominal), pengelompokan, pencarian, hitung, dan navigasi ke detail. Widget list utama yang dipakai di banyak halaman.

## Tampilan

```
┌─ [stats] ──────────────────────────┐
│ 🔍 [searchFields]                  │
│ ▸ [groupBy]                        │
│ Judul               [badge]  Rp X  │  ← title / badge / trailing
│ subjudul · meta                    │
└────────────────────────────────────┘
Tap kartu → route (+ routeParams).
```

## Contoh JSON

(contoh live — halaman TitikSiteList, daftar site)

```json
{"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//site","search":"st◼active","conditions":"","sortField":"sn","sortDir":"asc","groupBy":"","groupLabels":"","lead":"","title":"<sn>","subtitle":"<an>","meta":"","badgeField":"","badgeMap":"","trailing":"","trailingLabel":"","stats":"Site◼","searchFields":"sn◆an","route":"vertikaTeknoLokaciptaTitikSitePoints","routeParams":"sv◼{sv}","text":"Titik Absensi◆Pilih site untuk lihat titik◆site◆Cari site◆Belum ada site aktif"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `LIST_CARD` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter | `st◼active` |
| `conditions` | Opsional | Syarat tambahan | `""` |
| `sortField` / `sortDir` | Opsional | Urutan | `sn` / `asc` |
| `groupBy` / `groupLabels` | Opsional | Pengelompokan + label grup | `""` |
| `lead` | Opsional | Ikon/gambar di kiri | `""` |
| `title` / `subtitle` / `meta` | Wajib | Template `<field>` judul / subjudul / meta | `<sn>` / `<an>` |
| `badgeField` / `badgeMap` | Opsional | Field badge + peta `value◼label◼tone★…` | — |
| `trailing` / `trailingLabel` | Opsional | Nilai kanan (mis. nominal) + label | — |
| `stats` | Opsional | Penghitung header `Label◼` | `Site◼` |
| `searchFields` | Opsional | Field yang bisa dicari (dipisah `◆`) | `sn◆an` |
| `route` / `routeParams` | Opsional | Halaman detail + data yang dibawa | `…TitikSitePoints` / `sv◼{sv}` |
| `text` | Wajib | Judul + subjudul + satuan + hint + teks kosong (dipisah `◆`) | lihat contoh |

## Posisi field gabungan

`text` dipisah `◆` (judul / subjudul / satuan item / hint cari / teks kosong). `badgeMap` = `value◼label◼tone★…`. `title`/`subtitle`/`meta` = template `<field>`.

## Tips & catatan

- Widget list universal — dipakai luas. Untuk list + tombol aksi inline = `listActionCard` (308).
- Detail pasangannya = `detailCard` (292).
- Spec: `docs/list-card-universal-dev-spec.md`.
