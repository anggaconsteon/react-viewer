# TASK_ITEM_BUILDER (`taskItemBuilder`)

**Status:** LIVE di app (penyusun item tugas — admin buat tugas)
**Dev spec:** ADA — `docs/task-item-picker-search-sort-dev-spec.md`
**Widget tab:** row 235

## Buat apa

Alat untuk menyusun daftar barang sebuah tugas: cari item, atur jumlah per jenis transaksi (drop/pickup/jual/beli/isi-ulang), lihat outstanding customer, urutkan berdasar keseringan. Inti wizard "buat tugas".

## Tampilan

```
┌─ Item Tugas ───────────────────────┐
│ 🔍 Cari item…                      │
│ Galon 19L   Drop [12] Pickup [4]   │  ← per jenis transaksi
│ (outstanding customer: 3)          │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar; banyak field pemetaan)

```json
{"type":"TASK_ITEM_BUILDER","vidtable":"20342033315492","mode":"delivery","itemTable":"84214220504259//stock_item","itemIdField":"ii","itemNameField":"in","itemCatField":"cat","itemUnitField":"un","waterTypeField":"wt","searchField":"in","searchHint":"Cari item","sortField":"freq","sortDir":"desc","outstandingTable":"84214220504259//asset_cache","outstandingSearch":"lv◼{customerId}","outstandingQtyField":"qt","outstandingCondField":"cond","txTypes":"drop◆pickup◆sale","writeTarget":"it","dropField":"dp","pickupField":"pu","saleField":"sale","buyField":"buy","refillField":"refill","priceField":"hrg","condOutField":"co","condInField":"ci","wizardKey":"create_task","text":"Item Tugas◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_ITEM_BUILDER` | — |
| `vidtable` / `mode` | Wajib | ID tenant + mode alur | `delivery` |
| `itemTable` + `itemIdField`/`itemNameField`/`itemCatField`/`itemUnitField`/`waterTypeField` | Wajib | Sumber & pemetaan field katalog item | `stock_item`, `ii`/`in`/… |
| `searchField` / `searchHint` | Wajib | Field & hint pencarian | `in` / `Cari item` |
| `sortField` / `sortDir` | Opsional | Urutan (mis. `freq` = keseringan) | `freq` / `desc` |
| `outstandingTable`/`outstandingSearch`/`outstandingQtyField`/`outstandingCondField` | Opsional | Data outstanding customer (galon di customer) | `asset_cache`, … |
| `txTypes` | Wajib | Jenis transaksi yang aktif (dipisah `◆`) | `drop◆pickup◆sale` |
| `writeTarget` + `dropField`/`pickupField`/`saleField`/`buyField`/`refillField`/`priceField`/`condOutField`/`condInField` | Wajib | Field tujuan tulis per jenis transaksi | `it`, `dp`/`pu`/… |
| `wizardKey` | Wajib | Kunci wizard (menyimpan draft antar-langkah) | `create_task` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Item Tugas◆Belum ada item` |

## Posisi field gabungan

`text` dan `txTypes` dipisah `◆`. Sebagian besar field = pemetaan nama field data per jenis transaksi.

## Tips & catatan

- `sortField:"freq"` = item paling sering dipakai muncul dulu; pencarian bisa dikonfigurasi (spec search+sort).
- Versi walk-in POS = `taskItemBuilderWalkin` (277); supplier = `supplierItemBuilder` (294); seed = `seedItemBuilder` (295).
- Spec: `docs/task-item-picker-search-sort-dev-spec.md`.
