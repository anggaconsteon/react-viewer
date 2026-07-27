# CUSTODY_DISCREPANCY_LIST (`custodyDiscrepancyList`)

**Status:** LIVE di app (daftar selisih custody — driver runtime P8)
**Dev spec:** ADA — `docs/driver-custody-p7p8p9-dev-spec.md`
**Widget tab:** row 216

## Buat apa

Daftar barang custody yang **ada selisih** (hitung ≠ harapan) — menampilkan jumlah harapan, hasil hitung, dan besar selisih per item. Dipakai di halaman lapor selisih.

## Tampilan

```
┌─ Selisih Ditemukan ────────────────┐
│ Tabung 3kg   Harusnya 8 · Hitung 7 │
│              Selisih -1            │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_DISCREPANCY_LIST","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"vv◼{vehicleId}⭘cty◼opening","discrepancyField":"disc","expectedField":"ie","actualField":"ac","joinTable":"84214220504259//stock_item","joinKey":"ii","labelField":"cd","categoryField":"cat","text":"Selisih Ditemukan◆Tidak ada selisih"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_DISCREPANCY_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data custody | `vv◼{vehicleId}⭘cty◼opening` |
| `discrepancyField` | Wajib | Field selisih | `disc` |
| `expectedField` / `actualField` | Wajib | Field jumlah harapan / hasil hitung | `ie` / `ac` |
| `joinTable` / `joinKey` / `labelField` | Opsional | Referensi nama item | `stock_item` / `ii` / `cd` |
| `categoryField` | Opsional | Field kategori item | `cat` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Selisih Ditemukan◆Tidak ada selisih` |

## Posisi field gabungan

`text` dipisah `◆`. Hanya menampilkan item yang selisihnya ≠ 0.

## Tips & catatan

- Kebalikan `custodyConfirmedList` (215) — ini yang bermasalah, itu yang cocok.
- Dipakai berbarengan tombol lapor selisih (`custodyEventSubmit` 217).
- Spec: `docs/driver-custody-p7p8p9-dev-spec.md`.
