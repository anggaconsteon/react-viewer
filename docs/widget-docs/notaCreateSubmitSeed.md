# NOTA_CREATE_SUBMIT — seed (`notaCreateSubmitSeed`)

**Status:** LIVE di app (tombol buat nota seed / saldo awal)
**Dev spec:** ADA — `docs/customer-seed-nota-dev-spec.md`
**Widget tab:** row 297

## Buat apa

Varian `notaCreateSubmit` untuk **seed / saldo awal customer**: mengubah item seed (dari `seedItemBuilder`) jadi nota seed dengan info customer (kl/kn) + jangka waktu (days) + catatan. Untuk mencatat outstanding awal (galon yang sudah di customer sebelum sistem jalan).

## Tampilan

```
[        Simpan Saldo Awal         ]  ── tap ──▶ nota seed → dialog
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"NOTA_CREATE_SUBMIT","vidtable":"20342033315492","table":"84214220504259//nota","wizardKey":"seed_saldo","gl":"{warehouseId}","src":"seed","kl":"{customerId}","kn":"{customerName}","daysPosition":6,"notePosition":9,"paymentPosition":"7","buyerPosition":"8","action":"savesend","flag":"seed-nota","delay":5,"gpsPosition":2,"run":"","numberPos":"1","route":"vertikaTeknoLokaciptaSeedNota","text":"Simpan Saldo Awal","chain":{"type":"DO_DIALOG","title":"Tersimpan","children":[{"type":"TXT","data":"Saldo awal tersimpan."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaSeedNota"}]}]}}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `NOTA_CREATE_SUBMIT` | — |
| `vidtable` / `table` / `wizardKey` | Wajib | ID tenant + tabel nota + kunci wizard | `seed_saldo` |
| `gl` / `src` | Wajib | Gudang asal + sumber `seed` | `{warehouseId}` / `seed` |
| `kl` / `kn` | Wajib | Id & nama customer | `{customerId}` / `{customerName}` |
| `daysPosition` | Opsional | Slot form jangka waktu (umur saldo awal) | `6` |
| `notePosition` | Opsional | Slot form catatan | `9` |
| `paymentPosition` / `buyerPosition` | Opsional | Slot cara bayar / pembeli | `7` / `8` |
| `action` / `flag` / `delay` / `gpsPosition` | Wajib | Aksi / penanda / delay / slot GPS | `savesend` / `seed-nota` |
| `numberPos` | Opsional | Slot nomor nota otomatis | `1` |
| `route` | Wajib | Halaman tujuan | `…SeedNota` |
| `text` | Wajib | Label tombol | `Simpan Saldo Awal` |
| `chain` (DO_DIALOG) | Wajib | Dialog konfirmasi | `Tersimpan` |

## Posisi field gabungan

`text` = label tombol.

## Tips & catatan

- `daysPosition` = umur saldo awal (supaya perhitungan outstanding/umur mulai dari titik yang benar).
- `src◼seed` → CF proses sebagai saldo awal (bukan penjualan).
- Varian: walk-in `notaCreateSubmit` (278), supplier `notaCreateSubmitSupplier` (296).
- Spec: `docs/customer-seed-nota-dev-spec.md`.
