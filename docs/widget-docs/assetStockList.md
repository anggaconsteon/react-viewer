# ASSET_STOCK_LIST (`assetStockList`)

**Status:** LIVE di app (sebaran stok per item × lokasi × kondisi)
**Dev spec:** ADA — `docs/asset-stock-list-widget-dev-spec.md`
**Widget tab:** row 282

## Buat apa

Daftar **sebaran stok** aset: berapa item ada di mana, per kondisi (isi/kosong/rusak), dengan tampilan pivot (kolom per kondisi) + tab filter + ringkasan. Dipakai untuk melihat posisi stok galon/tabung di gudang/mobil/customer.

## Tampilan

```
┌─ Stok Aset ────────────────────────┐
│ [ Semua ][ Gudang ][ Mobil ]       │  ← filterTabs
│ Galon 19L   Isi 120 · Kosong 45    │  ← pivot per kondisi
│ Tabung 3kg  Isi 30                 │
│ Total: 195                         │  ← summary
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"ASSET_STOCK_LIST","vidtable":"20342033315492","table":"84214220504259//asset_cache","search":"","hideZero":"TRUE","groupField":"ii","valueField":"qt","pivotField":"cond","pivotValues":"full◆empty◆broken","condField":"cond","condValues":"full◆empty◆broken","showCondition":"TRUE","joinTable":"84214220504259//stock_item","joinKey":"ii","nameField":"in","catField":"cat","detailField":"lt","detailNameField":"ln","detailSubField":"la","itemIconMap":"galon◼water_drop","filterTabs":"Semua◆Gudang◆Mobil◆Customer","summary":"Total","title":"Stok Aset","subtitle":"Sebaran per lokasi","text":"item◆Cari","condNote":"","emptyText":"Belum ada stok"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `ASSET_STOCK_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data stok (mis. `asset_cache`) | `asset_cache` |
| `hideZero` | Opsional | Sembunyikan saldo 0 | `TRUE` |
| `groupField` / `valueField` | Wajib | Pengelompok item / field nilai | `ii` / `qt` |
| `pivotField` / `pivotValues` | Wajib | Field & nilai kolom pivot (kondisi) | `cond` / `full◆empty◆broken` |
| `condField` / `condValues` / `showCondition` | Opsional | Kondisi + nilai + tampilkan | `cond` / `full◆empty◆broken` / `TRUE` |
| `joinTable` / `joinKey` / `nameField` / `catField` | Opsional | Referensi nama & kategori item | `stock_item`, … |
| `detailField` / `detailNameField` / `detailSubField` | Opsional | Rincian lokasi (saat dibuka) | `lt` / `ln` / `la` |
| `itemIconMap` | Opsional | Peta ikon `nilai◼ikon★…` | `galon◼water_drop` |
| `filterTabs` | Opsional | Tab filter (dipisah `◆`) | `Semua◆Gudang◆Mobil◆Customer` |
| `summary` | Opsional | Label ringkasan total | `Total` |
| `title` / `subtitle` | Wajib | Judul & subjudul | `Stok Aset` |
| `text` / `condNote` / `emptyText` | Wajib/Opsional | Label + catatan + teks kosong | lihat contoh |

## Posisi field gabungan

`pivotValues` / `condValues` / `filterTabs` / `text` dipisah `◆`. `itemIconMap` = `nilai◼ikon★…`.

## Tips & catatan

- Tampilan pivot: satu item, banyak kolom kondisi (isi/kosong/rusak).
- Tab filter menyaring per jenis lokasi (gudang/mobil/customer).
- Spec: `docs/asset-stock-list-widget-dev-spec.md`.
