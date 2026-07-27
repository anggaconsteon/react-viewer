# CUSTODY_REVEAL (`custodyReveal`)

**Status:** LIVE di app (tampil selisih hitung custody — driver runtime P6)
**Dev spec:** ADA — `docs/driver-custody-reveal-dev-spec.md`
**Widget tab:** row 213

## Buat apa

Setelah driver hitung custody (mode buta), widget ini **membuka hasil**: bandingkan jumlah harapan vs jumlah hitung, tandai selisih, lalu arahkan ke jalur sesuai (cocok / ada selisih / hitung ulang).

## Tampilan

```
┌─ Hasil Hitung ─────────────────────┐
│ Galon 19L   Harusnya 12 · Hitung 12 ✓
│ Tabung 3kg  Harusnya 8  · Hitung 7  ⚠ selisih -1
│ ── [ Cocok ]  atau  [ Lapor Selisih ] ──
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_REVEAL","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"vv◼{vehicleId}⭘cty◼opening","expectedField":"ie","actualField":"ac","joinTable":"84214220504259//stock_item","joinKey":"ii","labelField":"cd","categoryField":"cat","discrepancyField":"disc","reconcileField":"rec","matchRoute":"vertikaTeknoLokaciptaCustodyConfirmed","mismatchRoute":"vertikaTeknoLokaciptaMismatchReport","recountRoute":"vertikaTeknoLokaciptaCustodyCount","text":"Hasil Hitung◆Cocok◆Ada selisih"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_REVEAL` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data custody | `vv◼{vehicleId}⭘cty◼opening` |
| `expectedField` / `actualField` | Wajib | Field jumlah harapan / hasil hitung | `ie` / `ac` |
| `joinTable` / `joinKey` / `labelField` | Opsional | Referensi nama item | `stock_item` / `ii` / `cd` |
| `categoryField` | Opsional | Field kategori item | `cat` |
| `discrepancyField` / `reconcileField` | Opsional | Field selisih / rekonsiliasi | `disc` / `rec` |
| `matchRoute` | Wajib | Tujuan kalau semua cocok | `…CustodyConfirmed` |
| `mismatchRoute` | Wajib | Tujuan kalau ada selisih | `…MismatchReport` |
| `recountRoute` | Wajib | Tujuan kalau mau hitung ulang | `…CustodyCount` |
| `text` | Wajib | Judul + label (dipisah `◆`) | `Hasil Hitung◆Cocok◆Ada selisih` |

## Posisi field gabungan

`text` dipisah `◆` (judul / label cocok / label selisih).

## Tips & catatan

- Selisih = `actualField − expectedField` per item, dihitung sistem.
- Tiga jalur keluar: cocok → confirmed, selisih → lapor, ragu → hitung ulang.
- Spec: `docs/driver-custody-reveal-dev-spec.md`.
