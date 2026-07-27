# TASK_ITEM_BUILDER — walk-in (`taskItemBuilderWalkin`)

**Status:** LIVE di app (penyusun item kasir walk-in)
**Dev spec:** ADA — alur walk-in POS (walkin specs)
**Widget tab:** row 277

## Buat apa

Varian `taskItemBuilder` yang ramping untuk **kasir walk-in (POS counter)**: cari item, atur jumlah, isi harga — untuk transaksi jual langsung di tempat. Lebih sederhana dari versi delivery (tanpa outstanding/tx-multi).

## Tampilan

```
┌─ Item Belanja ─────────────────────┐
│ 🔍 Cari item…                      │
│ Galon 19L   Qty [ 2 ]  @ Rp 20.000 │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_ITEM_BUILDER","vidtable":"20342033315492","mode":"walkin","wizardKey":"walkin_sale","itemTable":"84214220504259//stock_item","itemIdField":"ii","itemNameField":"in","priceSourceField":"hrg","qtyField":"qt","priceField":"hrg","searchHint":"Cari item","text":"Item Belanja◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_ITEM_BUILDER` | — |
| `vidtable` / `mode` / `wizardKey` | Wajib | ID tenant + mode `walkin` + kunci wizard | `walkin` / `walkin_sale` |
| `itemTable` / `itemIdField` / `itemNameField` | Wajib | Sumber & pemetaan item | `stock_item` / `ii` / `in` |
| `priceSourceField` | Opsional | Field harga acuan (prefill) | `hrg` |
| `qtyField` / `priceField` | Wajib | Field jumlah / harga | `qt` / `hrg` |
| `searchHint` | Opsional | Hint cari | `Cari item` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Item Belanja◆Belum ada item` |

## Posisi field gabungan

`text` dipisah `◆`.

## Tips & catatan

- Versi kasir counter: 1 jumlah + harga per item (jual langsung). Versi delivery (drop/pickup + outstanding) = `taskItemBuilder` (235).
- Hasil disusun jadi nota lewat `notaCreateSubmit` (278).
