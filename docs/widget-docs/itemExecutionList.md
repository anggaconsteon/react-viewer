# ITEM_EXECUTION_LIST (`itemExecutionList`)

**Status:** LIVE di app (daftar eksekusi item pengiriman — driver runtime P11)
**Dev spec:** ADA — `docs/item-execution-list-variant-dev-spec.md` (+ delivery-stepper-stock-cap)
**Widget tab:** row 220

## Buat apa

Daftar item per tugas antar untuk **dieksekusi driver**: bandingkan rencana vs aktual drop/pickup/jual/beli/isi-ulang, catat kondisi barang keluar/masuk. Inti layar kerja pengiriman.

## Tampilan

```
┌─ Item Pengiriman ──────────────────┐
│ Galon 19L                          │
│ Drop  rencana 12 → aktual [ 12 ]   │  ← stepper aktual
│ Pickup rencana 4 → aktual [  4 ]   │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar; banyak field pemetaan data)

```json
{"type":"ITEM_EXECUTION_LIST","variant":"default","vidtable":"20342033315492","table":"84214220504259//task","search":"tnm◼{taskVid}","itemsField":"it","labelField":"in","planDropField":"dp","actualDropField":"adp","planPickupField":"pu","actualPickupField":"apu","txField":"tx","saleField":"sale","actualSaleField":"asale","buyField":"buy","actualBuyField":"abuy","refillField":"refill","actualRefillField":"arefill","condOutField":"co","condInField":"ci","waterField":"wl","dropCapTable":"84214220504259//stock_location","dropCapSearch":"lv◼{customerId}","dropCapKey":"ii","dropCapField":"cap","capLabel":"Kapasitas","text":"Item Pengiriman◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `ITEM_EXECUTION_LIST` | — |
| `variant` | Opsional | Mode tampilan/perilaku | `default` |
| `vidtable` / `table` / `search` | Wajib | Sumber data tugas | `tnm◼{taskVid}` |
| `itemsField` | Wajib | Field daftar item (mis. `it[]`) | `it` |
| `labelField` | Wajib | Field nama item | `in` |
| `planDropField` / `actualDropField` | Wajib | Rencana vs aktual drop | `dp` / `adp` |
| `planPickupField` / `actualPickupField` | Wajib | Rencana vs aktual pickup | `pu` / `apu` |
| `txField` + `sale/buy/refill` (+`actual…`) | Opsional | Jenis transaksi + rencana/aktual jual/beli/isi-ulang | `tx`, `sale`/`asale`, … |
| `condOutField` / `condInField` | Opsional | Kondisi barang keluar / masuk | `co` / `ci` |
| `waterField` | Opsional | Field air/isi | `wl` |
| `dropCapTable`/`dropCapSearch`/`dropCapKey`/`dropCapField`/`capLabel` | Opsional | Batas kapasitas drop customer (dari data lain) | `cap` / `Kapasitas` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Item Pengiriman◆Belum ada item` |

## Posisi field gabungan

`text` dipisah `◆`. Sebagian besar field = **pemetaan nama field data** (rencana/aktual per jenis transaksi). Aktual diisi driver via stepper per item.

## Tips & catatan

- Ada batas kapasitas drop (`dropCap…`) supaya tidak drop melebihi tempat customer.
- Versi pivot (tampilan per jenis) = `itemExecutionListPivot` (246).
- Spec: `docs/item-execution-list-variant-dev-spec.md`.
