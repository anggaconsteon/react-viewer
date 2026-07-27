# CUSTODY_CONFIRMED_LIST (`custodyConfirmedList`)

**Status:** LIVE di app (daftar custody yang sudah cocok — driver runtime P7)
**Dev spec:** ADA — `docs/driver-custody-p7p8p9-dev-spec.md`
**Widget tab:** row 215

## Buat apa

Daftar barang custody yang **sudah dikonfirmasi cocok** (hasil hitung = harapan). Tampilan ringkas untuk halaman "custody berhasil".

## Tampilan

```
┌─ Muatan Terkonfirmasi ─────────────┐
│ ✓ Galon 19L      12                │
│ ✓ Tabung 3kg      8                │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_CONFIRMED_LIST","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"vv◼{vehicleId}⭘cty◼opening","actualField":"ac","joinTable":"84214220504259//stock_item","text":"Muatan Terkonfirmasi◆Semua cocok"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_CONFIRMED_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data custody | `vv◼{vehicleId}⭘cty◼opening` |
| `actualField` | Wajib | Field jumlah hasil hitung (yang dikonfirmasi) | `ac` |
| `joinTable` | Opsional | Referensi nama item | `84214220504259//stock_item` |
| `text` | Wajib | Judul + teks (dipisah `◆`) | `Muatan Terkonfirmasi◆Semua cocok` |

## Posisi field gabungan

`text` dipisah `◆`.

## Tips & catatan

- Dipakai di halaman custody sukses (P7) setelah `custodyReveal` (213) menyatakan cocok.
- Lawannya: `custodyDiscrepancyList` (216) untuk yang ada selisih.
- Spec: `docs/driver-custody-p7p8p9-dev-spec.md`.
