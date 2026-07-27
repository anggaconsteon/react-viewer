# CUSTOMER_OUTSTANDING_LIST (`customerOutstandingList`)

**Status:** LIVE di app (daftar outstanding lintas customer — lookup)
**Dev spec:** ADA — `docs/customer-outstanding-list-*` (outstanding subsystem)
**Widget tab:** row 281

## Buat apa

Daftar **barang tertinggal di banyak customer** sekaligus (lookup lintas-customer): dikelompokkan per customer, tampil item + jumlah + kondisi + umur (makin lama makin merah). Dipakai admin untuk pantau/menagih outstanding.

## Tampilan

```
┌─ Outstanding Customer ─────────────┐
│ 🔍 Cari customer…                  │
│ ▸ Toko Budi                        │  ← groupField (customer)
│   Galon 19L  3  🔴 12 hari         │
│ ▸ Warung Ani                       │
│   Galon 19L  1  🟡 5 hari          │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar; banyak field pemetaan)

```json
{"type":"CUSTOMER_OUTSTANDING_LIST","vidtable":"20342033315492","table":"84214220504259//asset_cache","search":"lt◼customer","hideZero":"TRUE","groupField":"lv","itemField":"ii","qtyField":"qt","condField":"cond","ageField":"ldt","customerTable":"84214220504259//stock_location","customerKey":"lv","nameField":"ln","typeField":"lt","itemTable":"84214220504259//stock_item","itemKey":"ii","itemNameField":"in","itemCatField":"cat","itemIconMap":"galon◼water_drop★tabung◼propane_tank","dangerAge":"10080","warnAge":"4320","sortBy":"age","searchHint":"Cari customer","title":"Outstanding Customer","subtitle":"Barang belum kembali","text":"item◆Total◆customer","detailText":"Detail","emptyText":"Tidak ada outstanding","doctrineText":"","closeText":"Tutup"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTOMER_OUTSTANDING_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber outstanding (mis. `asset_cache`) | `lt◼customer` |
| `hideZero` | Opsional | Sembunyikan saldo 0 | `TRUE` |
| `groupField` | Wajib | Pengelompok (per customer) | `lv` |
| `itemField` / `qtyField` / `condField` / `ageField` | Wajib | Field item / jumlah / kondisi / tanggal umur | `ii` / `qt` / `cond` / `ldt` |
| `customerTable` / `customerKey` / `nameField` / `typeField` | Opsional | Referensi nama customer | `stock_location` / `lv` / `ln` / `lt` |
| `itemTable` / `itemKey` / `itemNameField` / `itemCatField` / `itemIconMap` | Opsional | Referensi nama & ikon item | `stock_item`, … |
| `dangerAge` / `warnAge` | Opsional | Ambang umur (menit) → merah / kuning | `10080` / `4320` |
| `sortBy` / `searchHint` | Opsional | Urutan & hint cari | `age` |
| `title` / `subtitle` | Wajib | Judul & subjudul | `Outstanding Customer` |
| `text` / `detailText` / `emptyText` / `doctrineText` / `closeText` | Wajib/Opsional | Label-label + teks kosong | lihat contoh |

## Posisi field gabungan

`text` dipisah `◆`. `itemIconMap` = `nilai◼ikon★…`. Umur → warna via `dangerAge`/`warnAge`.

## Tips & catatan

- Beda dari `outstandingPanel` (237, 1 customer): ini lintas-banyak customer (lookup + grup per customer).
- Baca `asset_cache` (butuh denorm `lt`/`ln` supaya tidak kosong — catatan subsystem outstanding).
- Spec: outstanding subsystem (`docs/customer-outstanding-list-*`, `docs/asset-cache-lt-denorm-*`).
