# TASK_ITEM_BUILDER — seed (`seedItemBuilder`)

**Status:** LIVE di app (penyusun item seed saldo awal)
**Dev spec:** ADA — `docs/customer-seed-nota-dev-spec.md`
**Widget tab:** row 295

## Buat apa

Varian `taskItemBuilder` paling ramping untuk **seed / saldo awal** (mis. mendata galon yang sudah ada di customer sebagai titik awal): cari item + jumlah. Tanpa harga/transaksi.

## Tampilan

```
┌─ Saldo Awal ───────────────────────┐
│ 🔍 Cari item…                      │
│ Galon 19L   Qty [ 5 ]              │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_ITEM_BUILDER","vidtable":"20342033315492","mode":"seed","wizardKey":"seed_saldo","itemTable":"84214220504259//stock_item","itemIdField":"ii","itemNameField":"in","qtyField":"qt","searchHint":"Cari item","text":"Saldo Awal◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_ITEM_BUILDER` | — |
| `vidtable` / `mode` / `wizardKey` | Wajib | ID tenant + mode `seed` + kunci wizard | `seed` / `seed_saldo` |
| `itemTable` / `itemIdField` / `itemNameField` | Wajib | Sumber & pemetaan item | `stock_item` / `ii` / `in` |
| `qtyField` | Wajib | Field jumlah | `qt` |
| `searchHint` | Opsional | Hint cari | `Cari item` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Saldo Awal◆Belum ada item` |

## Posisi field gabungan

`text` dipisah `◆`.

## Tips & catatan

- Paling sederhana (cuma jumlah, tanpa harga/transaksi) — untuk mendata saldo awal / outstanding awal customer.
- Hasil jadi nota seed lewat `notaCreateSubmitSeed` (297).
- Spec: `docs/customer-seed-nota-dev-spec.md`.
