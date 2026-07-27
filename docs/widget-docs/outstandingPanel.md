# OUTSTANDING_PANEL (`outstandingPanel`)

**Status:** LIVE di app (panel outstanding barang di customer)
**Dev spec:** ADA — outstanding subsystem (asset-cache / customer-outstanding-list)
**Widget tab:** row 237

## Buat apa

Panel yang menampilkan **barang yang masih tertinggal di customer** (outstanding — mis. galon belum dikembalikan), berapa jumlahnya, dan sudah berapa lama (makin lama makin merah). Bisa dilipat (collapsible).

## Tampilan

```
┌─ Outstanding ──────────────────────┐
│ Galon 19L   3    🔴 12 hari         │  ← qty + umur (warna)
│ Tabung 3kg  1    🟡 5 hari          │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"OUTSTANDING_PANEL","vidtable":"20342033315492","table":"84214220504259//asset_cache","search":"lv◼{customerId}","hideZero":"TRUE","collapsible":"TRUE","titleField":"ln","locationTable":"84214220504259//stock_location","locationNameField":"ln","itemField":"cd","qtyField":"qt","ageAnchorField":"ldt","dangerAge":"10080","warnAge":"4320","actionText":"Tagih","emptyText":"Tidak ada outstanding","text":"Outstanding◆di customer"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `OUTSTANDING_PANEL` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data outstanding (mis. `asset_cache`) | `lv◼{customerId}` |
| `hideZero` | Opsional | `TRUE` = sembunyikan item saldo 0 | `TRUE` |
| `collapsible` | Opsional | `TRUE` = panel bisa dilipat | `TRUE` |
| `titleField` | Opsional | Field judul panel | `ln` |
| `locationTable` / `locationNameField` | Opsional | Referensi nama lokasi/customer | `stock_location` / `ln` |
| `itemField` / `qtyField` | Wajib | Field nama item / jumlah | `cd` / `qt` |
| `ageAnchorField` | Opsional | Field tanggal acuan umur | `ldt` |
| `dangerAge` / `warnAge` | Opsional | Ambang umur (menit) → merah / kuning | `10080` / `4320` |
| `actionText` | Opsional | Label tombol aksi | `Tagih` |
| `emptyText` | Opsional | Teks saat kosong | `Tidak ada outstanding` |
| `text` | Wajib | Judul + label (dipisah `◆`) | `Outstanding◆di customer` |

## Posisi field gabungan

`text` dipisah `◆`. Umur item → warna via `dangerAge`/`warnAge` (menit).

## Tips & catatan

- Baca `asset_cache` (saldo barang di customer). Catatan subsystem: `asset_cache` perlu denorm `lt`/`ln` supaya panel tidak kosong.
- Daftar outstanding lintas-customer (lookup) = `customerOutstandingList` (281).
