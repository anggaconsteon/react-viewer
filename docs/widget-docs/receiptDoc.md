# RECEIPT_DOC (`receiptDoc`)

**Status:** LIVE di app (tampilan struk/nota di layar)
**Dev spec:** ADA — `docs/receipt-doc-widget-dev-spec.md`
**Widget tab:** row 279

## Buat apa

Menampilkan **struk/nota di layar** (bukan cetak): kepala (nama & alamat toko), nomor, pembeli, tanggal, daftar item (nama × qty = subtotal), dan total. Dipakai di halaman nota/invoice sebelum cetak/kirim.

## Tampilan

```
┌─ INVOICE ──────────────────────────┐
│ Gudang A · Jl. Industri 1          │  ← headerName/headerAddr
│ No: INV-123 · 27 Jul · Tunai       │
│ ────────────────────────────────── │
│ Galon 19L  x12  = Rp 240.000       │  ← lines
│ ────────────────────────────────── │
│ TOTAL           Rp 240.000         │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RECEIPT_DOC","vidtable":"20342033315492","table":"84214220504259//nota","search":"nno◼{nno}","title":"INVOICE","headerName":"","headerAddr":"","headerTable":"84214220504259//stock_location","headerSearch":"lv◼{gl}","headerNameField":"ln","headerAddrField":"al","noField":"nno","buyerField":"by","buyerEmpty":"Umum","dateField":"ts","paymentField":"pay","statusField":"st","totalField":"tot","linesField":"li","lineNameField":"in","lineQtyField":"qt","linePriceField":"hg","lineSubField":"sub","money":"idr","text":"INVOICE◆No◆Tanggal◆Total◆Terima kasih"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RECEIPT_DOC` | — |
| `vidtable` / `table` / `search` | Wajib | Data nota | `nno◼{nno}` |
| `title` | Wajib | Judul dokumen | `INVOICE` |
| `headerName` / `headerAddr` | Opsional | Nama/alamat statis (kalau tidak dari tabel) | `""` |
| `headerTable` / `headerSearch` / `headerNameField` / `headerAddrField` | Opsional | Sumber nama/alamat kepala dari data | `stock_location` / `lv◼{gl}` |
| `noField` / `buyerField` / `buyerEmpty` | Wajib | Field nomor / pembeli / teks kalau pembeli kosong | `nno` / `by` / `Umum` |
| `dateField` / `paymentField` / `statusField` | Opsional | Field tanggal / pembayaran / status | `ts` / `pay` / `st` |
| `totalField` | Wajib | Field total | `tot` |
| `linesField` + `lineNameField`/`lineQtyField`/`linePriceField`/`lineSubField` | Wajib | Field daftar item + nama/qty/harga/subtotal | `li`, `in`/`qt`/`hg`/`sub` |
| `money` | Opsional | Format uang | `idr` |
| `text` | Wajib | Label dokumen (dipisah `◆`) | `INVOICE◆No◆Tanggal◆Total◆Terima kasih` |

## Posisi field gabungan

`text` dipisah `◆` (label-label struk). Baris item dari `linesField` (array), subtotal per baris = qty × harga.

## Tips & catatan

- Ini tampilan layar; untuk cetak termal pakai `printBluetoothKeyed` (276), untuk PDF/WA pakai `sharePdfKeyed` (304)/`whatsappSend` (300).
- Field kepala bisa statis (`headerName`) atau dari data (`headerTable`).
- Spec: `docs/receipt-doc-widget-dev-spec.md`.
