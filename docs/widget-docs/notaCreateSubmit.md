# NOTA_CREATE_SUBMIT (`notaCreateSubmit`)

**Status:** LIVE di app (tombol buat nota — kasir walk-in)
**Dev spec:** ADA — alur walk-in POS (walkin specs)
**Widget tab:** row 278

## Buat apa

Tombol final kasir walk-in: mengubah item yang disusun (dari `taskItemBuilderWalkin`) jadi **1 nota** (dengan nomor otomatis, cara bayar, pembeli), diakhiri dialog. Menutup transaksi POS.

## Tampilan

```
[        Buat Nota & Bayar        ]  ── tap ──▶ simpan nota → dialog
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"NOTA_CREATE_SUBMIT","vidtable":"20342033315492","table":"84214220504259//nota","wizardKey":"walkin_sale","gl":"{warehouseId}","src":"walkin","paymentPosition":"7","buyerPosition":"8","action":"savesend","flag":"walkin-nota","delay":"5","gpsPosition":"2","run":"","numberPos":"1","route":"vertikaTeknoLokaciptaWalkInNota","text":"Buat Nota & Bayar","chain":{"type":"DO_DIALOG","title":"Nota Dibuat","children":[{"type":"TXT","data":"Nota berhasil dibuat."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaWalkInNota"}]}]}}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `NOTA_CREATE_SUBMIT` | — |
| `vidtable` / `table` | Wajib | ID tenant + tabel nota | `84214220504259//nota` |
| `wizardKey` | Wajib | Kunci wizard yang item-nya disimpan | `walkin_sale` |
| `gl` | Wajib | Gudang/lokasi asal (id) | `{warehouseId}` |
| `src` | Wajib | Sumber nota (mis. `walkin`) | `walkin` |
| `paymentPosition` / `buyerPosition` | Opsional | Slot form cara bayar / pembeli | `7` / `8` |
| `action` / `flag` / `delay` / `gpsPosition` | Wajib | Aksi / penanda / delay / slot GPS | `savesend` / `walkin-nota` |
| `run` | Opsional | `[?] pemicu/mode jalan — cek dev` | `""` |
| `numberPos` | Opsional | Slot nomor nota otomatis | `1` |
| `route` | Wajib | Halaman tujuan setelah simpan | `…WalkInNota` |
| `text` | Wajib | Label tombol | `Buat Nota & Bayar` |
| `chain` (DO_DIALOG) | Wajib | Dialog konfirmasi | `Nota Dibuat` |

## Posisi field gabungan

`text` = label tombol.

## Tips & catatan

- `src` menentukan jenis nota (walkin/delivery/supplier/seed) — CF memproses sesuai sumbernya.
- Varian: `notaCreateSubmitSupplier` (296), `notaCreateSubmitSeed` (297).
