# NOTA_CREATE_SUBMIT — supplier (`notaCreateSubmitSupplier`)

**Status:** LIVE di app (tombol buat nota transaksi supplier)
**Dev spec:** ADA — `docs/supplier-transaction-flutter-dev-spec.md`
**Widget tab:** row 296

## Buat apa

Varian `notaCreateSubmit` untuk **transaksi supplier**: mengubah item supplier (dari `supplierItemBuilder`) jadi nota `src◼supplier`, dengan info supplier (sv/sn) + catatan. Menutup transaksi beli/tukar/jual-rusak.

## Tampilan

```
[       Simpan Transaksi Supplier      ]  ── tap ──▶ nota supplier → dialog
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"NOTA_CREATE_SUBMIT","vidtable":"20342033315492","table":"84214220504259//nota","wizardKey":"supplier_tx","gl":"{warehouseId}","src":"supplier","sv":"{supplierId}","sn":"{supplierName}","notePosition":9,"paymentPosition":"7","buyerPosition":"8","action":"savesend","flag":"supplier-nota","delay":5,"gpsPosition":2,"run":"","numberPos":"1","route":"vertikaTeknoLokaciptaSupplierNota","text":"Simpan Transaksi Supplier","chain":{"type":"DO_DIALOG","title":"Tersimpan","children":[{"type":"TXT","data":"Transaksi supplier tersimpan."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaSupplierNota"}]}]}}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `NOTA_CREATE_SUBMIT` | — |
| `vidtable` / `table` / `wizardKey` | Wajib | ID tenant + tabel nota + kunci wizard | `supplier_tx` |
| `gl` / `src` | Wajib | Gudang asal + sumber `supplier` | `{warehouseId}` / `supplier` |
| `sv` / `sn` | Wajib | Id & nama supplier | `{supplierId}` / `{supplierName}` |
| `notePosition` | Opsional | Slot form catatan | `9` |
| `paymentPosition` / `buyerPosition` | Opsional | Slot cara bayar / pembeli | `7` / `8` |
| `action` / `flag` / `delay` / `gpsPosition` | Wajib | Aksi / penanda / delay / slot GPS | `savesend` / `supplier-nota` |
| `numberPos` | Opsional | Slot nomor nota otomatis | `1` |
| `route` | Wajib | Halaman tujuan | `…SupplierNota` |
| `text` | Wajib | Label tombol | `Simpan Transaksi Supplier` |
| `chain` (DO_DIALOG) | Wajib | Dialog konfirmasi | `Tersimpan` |

## Posisi field gabungan

`text` = label tombol.

## Tips & catatan

- `src◼supplier` → CF proses sebagai transaksi supplier (supplier = eksternal, tanpa saldo).
- Versi walk-in = `notaCreateSubmit` (278); versi seed = `notaCreateSubmitSeed` (297).
- Spec: `docs/supplier-transaction-flutter-dev-spec.md`.
