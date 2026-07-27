# CIRCULATION_SUMMARY (`circulationSummary`)

**Status:** LIVE di app (ringkasan sirkulasi barang — driver runtime)
**Dev spec:** ADA — driver return-vehicle/p12 spec §3 (per-item tx-driven)
**Widget tab:** row 209

## Buat apa

Ringkasan total sirkulasi barang untuk kendaraan/rute: berapa yang keluar (drop), masuk (pickup), terjual, isi-ulang, dibeli — per item. Dipakai di akhir rute / ringkasan kendaraan.

## Tampilan

```
┌─ Sirkulasi Hari Ini ───────────────┐
│ Galon 19L   Drop 40  Pickup 35     │
│             Jual 5   Isi 30        │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CIRCULATION_SUMMARY","vidtable":"20342033315492","table":"84214220504259//task","search":"vv◼{vehicleId}⭘tdt◼{today}","itemsField":"it","nameField":"in","txField":"tx","dropField":"dp","pickupField":"pu","saleField":"sale","refillField":"refill","buyField":"buy","excludeStatus":"","text":"Sirkulasi Hari Ini◆Belum ada data"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CIRCULATION_SUMMARY` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data tugas + filter | `vv◼{vehicleId}⭘tdt◼{today}` |
| `itemsField` | Wajib | Field daftar item (mis. `it[]`) | `it` |
| `nameField` | Wajib | Field nama item | `in` |
| `txField` + `dropField`/`pickupField`/`saleField`/`refillField`/`buyField` | Wajib | Field jenis transaksi & jumlah per kategori | `tx`, `dp`, `pu`, … |
| `excludeStatus` | Opsional | Status yang dikecualikan | `""` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Sirkulasi Hari Ini◆Belum ada data` |

## Posisi field gabungan

`text` dipisah `◆`. Semua angka dihitung sistem dari `itemsField` per jenis transaksi (`txField`).

## Tips & catatan

- Label per item = **config-driven** (dari `text`/field), dihitung per transaksi — bukan hardcode di aplikasi.
- Beda dari `taskManifestList` (per tugas) — `circulationSummary` = total agregat semua item.
