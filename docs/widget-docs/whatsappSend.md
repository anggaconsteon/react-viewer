# WHATSAPP_SEND (`whatsappSend`)

**Status:** LIVE di app (renderer selesai 2026-07-21 — bottom-sheet nomor + kontak + pesan jalan)
**Widget tab:** row 300

## Buat apa

Tombol "Kirim WhatsApp": menyiapkan pesan WA otomatis dari data (misal invoice dari nota), lalu membuka aplikasi WhatsApp dengan nomor + pesan sudah terisi. Admin tinggal tekan Send di WA. Tanpa backend, tanpa biaya — pakai link wa.me (teks saja, tidak bisa lampir file; untuk kirim PDF pakai `sharePdfKeyed`).

## Tampilan

```
[ Kirim WhatsApp ]  ── tap ──▶ bottom-sheet:
┌────────────────────────────────────┐
│ Nomor tujuan   [ 6281234567890 ]   │ ← prefill dari data, bisa diedit
│ [ Pilih Kontak ]                   │ ← muncul kalau allowContactPick TRUE
│ Pesan (bisa diedit)                │
│ ┌────────────────────────────────┐ │
│ │ *INVOICE INV-123*              │ │ ← prefill dari messageTemplate
│ │ ...                            │ │
│ └────────────────────────────────┘ │
│ [ Buka WhatsApp ]                  │ ← buka WA + tandai terkirim
└────────────────────────────────────┘
```

## Contoh JSON

```json
{"type":"WHATSAPP_SEND","vidtable":"20342033315492","phoneField":"hpic","phoneFallback":"","allowContactPick":"TRUE","countryCode":"62","messageTable":"84214220504259//stock_location","messageSearch":"lv◼{customerId}","messageTemplate":"Halo {{ln}},\nPesanan Anda sudah kami terima & dijadwalkan untuk diantar. Terima kasih 🙏","logTable":"","logSearch":"","logField":"","logValue":"","text":"Kirim WA ke Customer◆Nomor tujuan◆Pilih Kontak◆Pesan (bisa diedit)◆Buka WhatsApp◆Nomor tidak valid◆✅ Terkirim"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `WHATSAPP_SEND` | — |
| `vidtable` | otomatis (baked) | ID koneksi data tenant | `20342033315492` |
| `phoneField` | Wajib | Nama field nomor HP di data yang dibaca `messageSearch` | `hpic` |
| `phoneFallback` | Opsional (kosong = off) | Token cadangan kalau field nomor kosong | `{custPhone}` |
| `allowContactPick` | Wajib | `TRUE` → tampil tombol pilih dari kontak HP | `TRUE` |
| `countryCode` | Wajib | Kode negara buat merapikan nomor: `08xx` otomatis jadi `628xx` | `62` |
| `messageTable` | Wajib | Alamat tabel sumber isi pesan (misal nota) | `84214220504259//nota` |
| `messageSearch` | Wajib | Cara mencari 1 baris data sumber pesan | `ref◼{taskVid}` |
| `messageTemplate` | Wajib | Template pesan — `{{field}}` diganti isi data, `{{field\|idr}}` format Rupiah, `<LOOP source='li'>…{{item.X}}…</LOOP>` mengulang per baris item, `\n` ganti baris | lihat contoh |
| `logTable` | Opsional (kosong = off) | Tabel yang diberi penanda "sudah dikirim" saat tombol Buka WhatsApp ditekan | `84214220504259//task` |
| `logSearch` | Opsional | Cara mencari baris yang ditandai | `tnm★{taskVid}` |
| `logField` | Opsional | Field penanda | `iv` |
| `logValue` | Opsional | Nilai penanda | `sent` |
| `text` | Wajib | Label UI, 7 bagian `◆` (lihat tabel posisi) | — |

## Posisi field gabungan

`text` — 7 segmen dipisah `◆` (sumber: spec):

| # | Isi | Contoh |
|---|---|---|
| 1 | Label tombol utama | `Kirim WhatsApp` |
| 2 | Label kolom nomor | `Nomor tujuan` |
| 3 | Tombol pilih kontak | `Pilih Kontak` |
| 4 | Label kolom pesan | `Pesan (bisa diedit)` |
| 5 | Tombol buka WA | `Buka WhatsApp` |
| 6 | Error nomor tidak valid | `Nomor tidak valid` |
| 7 | Badge sudah terkirim | `✅ Terkirim` |

## Tips & catatan

- Satu widget banyak kegunaan: invoice, konfirmasi order, reminder — cukup ganti `messageTemplate` + `messageSearch` di sheet, tanpa update aplikasi.
- "Terkirim" dicatat saat tombol **Buka WhatsApp** ditekan (niat kirim) — app tidak bisa tahu apakah user benar-benar menekan Send di WA.
- wa.me tidak bisa melampirkan file. Butuh kirim PDF → pakai `sharePdfKeyed` (share sheet).
- Konsumen live: halaman `DeliveryInvoice` (invoice pengiriman) + `CreateTaskSummary` (WA konfirmasi order). Spec: `docs/whatsapp-invoice-delivery-dev-spec.md`.
- ⚠️ **Sintaks LOOP:** `<LOOP source='li'>` — pakai `source='…'`, sama persis kaya `PRN`. Versi lama doc ini nulis `<LOOP li>` (tanpa `source=`) — **itu salah**, dibetulin 2026-08-27. Ground truth: config live `DeliveryInvoice` (op1Screen 892).
- **`messageTable` nentuin apa yang bisa di-loop.** Widget cuma baca SATU dokumen. Mau nampilin baris item → `messageTable` harus nunjuk doc yang punya array-nya (`nota.li[]`, `task.it[]`), bukan doc pelanggan.
- **Konsekuensi ganti `messageTable`:** `phoneField` ikut dibaca dari doc yang sama. Pindah dari `stock_location` (punya `hpic`) ke `task` (belum punya `hpic`) = nomor HP gak keisi otomatis, admin harus pilih kontak manual. Pastiin nomornya ada di doc yang dibaca, atau isi `phoneFallback`.
