# CUSTODY_COUNT_LIST (`custodyCountList`)

**Status:** LIVE di app (daftar hitung custody — driver runtime P6)
**Dev spec:** ADA — `docs/driver-custody-count-p6-dev-spec.md`
**Widget tab:** row 210

## Buat apa

Daftar barang bawaan kendaraan untuk **dihitung ulang** driver (stok opname custody). Bisa mode "buta" (angka harapan disembunyikan supaya driver hitung jujur). Hasil hitung disimpan ke slot form.

## Tampilan

```
┌─ Hitung Muatan ────────────────────┐
│ Galon 19L        [  __  ]          │  ← isi jumlah hasil hitung
│ Tabung 3kg       [  __  ]          │  ← blind = angka harapan disembunyikan
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_COUNT_LIST","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"vv◼{vehicleId}⭘cty◼opening","itemsField":"ie","joinTable":"84214220504259//stock_item","joinKey":"ii","labelField":"cd","filter":"","blind":"TRUE","writeField":"ac","text":"Hitung Muatan◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_COUNT_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data custody | `vv◼{vehicleId}⭘cty◼opening` |
| `itemsField` | Wajib | Field daftar item (mis. `ie[]`) | `ie` |
| `joinTable` / `joinKey` | Opsional | Tabel referensi nama item + kunci join | `stock_item` / `ii` |
| `labelField` | Wajib | Field nama item yang ditampilkan | `cd` |
| `filter` | Opsional | Saring item tertentu | `""` |
| `blind` | Opsional | `TRUE` = mode buta (angka harapan disembunyikan) | `TRUE` |
| `writeField` | Wajib | Field tempat menyimpan hasil hitung | `ac` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Hitung Muatan◆Belum ada item` |

## Posisi field gabungan

`text` dipisah `◆`. Sumber item = `itemsField` (`vehicle_check.ie[]`).

## Tips & catatan

- `blind:"TRUE"` = driver hitung tanpa lihat angka harapan (anti-contek) — selisih ketahuan di tahap reveal.
- Sumber item = `ie[]` flat (tanpa link tugas) → tidak bisa difilter per-tugas seperti list lain.
- Pasangan: `custodyCountSubmit` (214, tombol simpan) → `custodyReveal` (213, tampil selisih).
- Versi gudang = `custodyCountListWarehouse` (243). Spec: `docs/driver-custody-count-p6-dev-spec.md`.
