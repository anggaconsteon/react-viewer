# TASK_MANIFEST_LIST (`taskManifestList`)

**Status:** LIVE di app (daftar manifest tugas rute — driver runtime)
**Dev spec:** ADA — bagian alur custody/delivery (driver specs)
**Widget tab:** row 208

## Buat apa

Daftar tugas rute beserta rincian barang tiap tugas (berapa drop, berapa pickup, per jenis transaksi). Dipakai driver untuk lihat manifest muatan per tujuan sebelum jalan.

## Tampilan

```
┌────────────────────────────────────┐
│ Toko Budi · Jl. Merdeka 5          │  ← title / subtitle
│   Galon 19L   Drop 12  Pickup 4    │  ← items: drop/pickup per item
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_MANIFEST_LIST","vidtable":"20342033315492","table":"84214220504259//task","search":"vv◼{vehicleId}⭘tdt◼{today}","idField":"tnm","titleField":"kn","subtitleField":"al","itemsField":"it","dropField":"dp","pickupField":"pu","txField":"tx","saleField":"sale","refillField":"refill","buyField":"buy","excludeStatus":"completed","route":"vertikaTeknoLokaciptaTaskDetail","text":"Manifest Rute◆Belum ada tugas"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_MANIFEST_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data tugas + filter | `vv◼{vehicleId}⭘tdt◼{today}` |
| `idField` | Wajib | Field id tugas | `tnm` |
| `titleField` / `subtitleField` | Wajib | Field judul / subjudul (nama & alamat) | `kn` / `al` |
| `itemsField` | Wajib | Field daftar item per tugas (mis. `it[]`) | `it` |
| `dropField` / `pickupField` | Wajib | Field jumlah drop / pickup per item | `dp` / `pu` |
| `txField` + `saleField`/`refillField`/`buyField` | Opsional | Field jenis transaksi & kategori (jual/isi-ulang/beli) | `tx` |
| `excludeStatus` | Opsional | Status tugas yang disembunyikan | `completed` |
| `route` | Opsional | Halaman detail saat baris di-tap | `…TaskDetail` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Manifest Rute◆Belum ada tugas` |

## Posisi field gabungan

`text` dipisah `◆`. Angka drop/pickup per item dihitung dari `itemsField` (bukan diisi manual).

## Tips & catatan

- Field `*Field` = nama field di data yang dipetakan renderer (bukan nilai). Jumlah per item diambil dari array `itemsField`.
- Versi draft (belum submit) = `taskManifestListDraft` (249).
