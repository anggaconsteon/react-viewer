# CUSTODY_COUNT_LIST — versi gudang (`custodyCountListWarehouse`)

**Status:** LIVE di app (daftar hitung custody sisi gudang — opening/closing)
**Dev spec:** ADA — `docs/warehouse-opening-check-o1-dev-spec.md` / `docs/warehouse-closing-check-c1-dev-spec.md`
**Widget tab:** row 243

## Buat apa

Varian `custodyCountList` (210) untuk **sisi gudang**: selain hitung, bisa **agregat** dari rencana tugas (drop/jual/isi-ulang) untuk membandingkan muatan buka/tutup. Dipakai petugas gudang saat cek buka/tutup kendaraan.

## Tampilan

```
┌─ Cek Muatan (Gudang) ──────────────┐
│ Galon 19L   Rencana 40 · Hitung [__]
│ Tabung 3kg  Rencana 8  · Hitung [__]
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_COUNT_LIST","vidtable":"20342033315492","table":"84214220504259//task","search":"vv◼{vehicleId}⭘tdt◼{today}","aggregate":"TRUE","planField":"dp","saleField":"sale","refillField":"refill","excludeStatus":"cancelled","joinTable":"84214220504259//stock_item","joinKey":"ii","labelField":"cd","catField":"cat","filter":"","blind":"FALSE","writeField":"ac","text":"Cek Muatan◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_COUNT_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data (bisa dari tugas untuk agregat) | `vv◼{vehicleId}⭘tdt◼{today}` |
| `aggregate` | Opsional | `TRUE` = jumlahkan rencana dari banyak tugas | `TRUE` |
| `planField` + `saleField`/`refillField` | Opsional | Field rencana per jenis transaksi | `dp` / `sale` / `refill` |
| `excludeStatus` | Opsional | Status yang dikecualikan | `cancelled` |
| `joinTable` / `joinKey` / `labelField` / `catField` | Opsional | Referensi nama & kategori item | `stock_item` / `ii` / `cd` / `cat` |
| `filter` / `blind` | Opsional | Saring item / mode buta | `""` / `FALSE` |
| `writeField` | Wajib | Field simpan hasil hitung | `ac` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Cek Muatan◆Belum ada item` |

## Posisi field gabungan

`text` dipisah `◆`. Beda utama dari `custodyCountList` (210): `aggregate` + `planField` (jumlahkan rencana dari tugas).

## Tips & catatan

- Versi driver (per kendaraan, `ie[]`) = `custodyCountList` (210).
- Dipasangkan `custodyCountSubmitOpening` (244) / `custodyCountSubmitClosing` (245).
- Spec: `docs/warehouse-opening-check-o1-dev-spec.md`, `docs/warehouse-closing-check-c1-dev-spec.md`.
