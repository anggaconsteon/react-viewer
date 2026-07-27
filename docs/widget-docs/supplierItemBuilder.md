# TASK_ITEM_BUILDER — supplier (`supplierItemBuilder`)

**Status:** LIVE di app (penyusun item transaksi supplier)
**Dev spec:** ADA — `docs/supplier-transaction-flutter-dev-spec.md`
**Widget tab:** row 294

## Buat apa

Varian `taskItemBuilder` untuk **transaksi supplier** (beli/tukar/jual barang rusak): pilih item + jumlah keluar/masuk + harga, dengan pilihan jenis transaksi supplier. Dipakai di alur transaksi supplier.

## Tampilan

```
┌─ Item Supplier ────────────────────┐
│ 🔍 Cari item…                      │
│ Galon 19L   Beli [12]  @ [Rp …]    │  ← qty out/in + harga
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_ITEM_BUILDER","vidtable":"20342033315492","mode":"supplier","wizardKey":"supplier_tx","itemTable":"84214220504259//stock_item","itemIdField":"ii","itemNameField":"in","priceSourceField":"hrg","txOptions":"buy◆exchange◆sell","qtyOutField":"qo","qtyInField":"qi","priceField":"hrg","searchHint":"Cari item","text":"Item Supplier◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_ITEM_BUILDER` | — |
| `vidtable` / `mode` / `wizardKey` | Wajib | ID tenant + mode `supplier` + kunci wizard | `supplier` / `supplier_tx` |
| `itemTable` / `itemIdField` / `itemNameField` | Wajib | Sumber & pemetaan item | `stock_item` / `ii` / `in` |
| `priceSourceField` | Opsional | Field harga acuan | `hrg` |
| `txOptions` | Wajib | Jenis transaksi supplier (dipisah `◆`) | `buy◆exchange◆sell` |
| `qtyOutField` / `qtyInField` | Wajib | Field jumlah keluar / masuk | `qo` / `qi` |
| `priceField` | Wajib | Field harga | `hrg` |
| `searchHint` | Opsional | Hint cari | `Cari item` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Item Supplier◆Belum ada item` |

## Posisi field gabungan

`text` dan `txOptions` dipisah `◆`.

## Tips & catatan

- Supplier = pihak eksternal (tanpa saldo) — transaksi via nota `src◼supplier`.
- Keluarga item builder: `taskItemBuilder` (235, delivery), `taskItemBuilderWalkin` (277, kasir), `supplierItemBuilder` (294), `seedItemBuilder` (295).
- Spec: `docs/supplier-transaction-flutter-dev-spec.md`.
