# PRN variant `share-pdf` (`sharePdfKeyed`)

**Status:** LIVE di app (PDF + share sheet jalan, mode grid teruji di device 2026-07-23; sisa polish dev: jarak isi dari bingkai, footer logo `<IMAGE>`)
**Widget tab:** row 304

## Buat apa

Tombol "Bagikan": mengubah data (misal QR titik patroli, nanti nota) jadi **file PDF** lalu membuka dialog bagikan bawaan HP — user pilih WhatsApp/email/print. Ini jalur kirim **file**; `whatsappSend` hanya bisa teks. Ada 2 mode: 1 dokumen = 1 halaman (stiker QR), atau `grid` = banyak kartu per halaman (cetak semua QR sekaligus, dipotong jadi stiker).

## Tampilan

```
[ Bagikan QR ]  ── tap ──▶  spinner (bikin PDF, <1 detik)
                              │
                              ▼
                   ┌─ Bagikan via… (OS) ───────┐
                   │  [WA] [Gmail] [Drive] …   │ ── pilih WA ──▶ PDF ke-attach
                   └───────────────────────────┘

Isi PDF (mode single, stiker QR):        Mode grid "4x4" (A4):
┌═══════════════════════┐                ┌───┬───┬───┬───┐
│   Pos Gerbang Timur   │  judul brand   │QR │QR │QR │QR │  16 kartu/halaman
│      ▓▓▓▓▓▓▓▓▓        │                ├───┼───┼───┼───┤  border per kartu
│      ▓▓ QR ▓▓▓        │  QR besar      │QR │QR │QR │QR │  urut nama titik
│      ▓▓▓▓▓▓▓▓▓        │                ├───┼───┼───┼───┤
│  powered by āutsorz   │  footer logo   │ … │   │   │   │
└═══════════════════════┘  border tepi   └───┴───┴───┴───┘
```

## Contoh JSON

(live — tombol "Cetak Semua QR" halaman TitikSiteList, mode grid)

```json
{"type":"PRN","variant":"share-pdf","vidtable":"20342033315492","table":"84214220504259//location","search":"lst◼active","grid":"4x4","paperSize":"A4","fileName":"qr-semua-titik.pdf","border":"#1FA0A6","borderWidth":"10","icon":"print","buttonColor":"blue","textColor":"white","width":"full","position":"263","text":"Cetak Semua QR◆Menyiapkan PDF...◆PDF siap — pilih aplikasi◆Gagal membuat PDF. Coba lagi.◆Belum ada titik aktif.","template":"<TEXT align='center' bold='true' color='#1FA0A6'>{{ln}}</TEXT>;<FEED/>;<QRCODE data='{{li}}' align='center'/>;<FEED/>;<ROW align='center'><COL width=6 align='right'>powered by </COL><COL width=6 align='left'><IMAGE asset='autsorz_logo' height=16/></COL></ROW>;"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `PRN` (keluarga cetak; variant menentukan muara) | — |
| `variant` | otomatis (baked) | `share-pdf` — hasil = PDF + dialog bagikan (bluetooth print tidak disentuh) | — |
| `vidtable` / `table` / `search` | Wajib | Data sumber. `search` 1 dokumen = mode single; match banyak = bahan mode grid | `lk◼{lk}` |
| `grid` | Opsional (kosong = single) | `"KolomxBaris"` kartu per halaman: `2x4` = 8, `4x4` = 16; ukuran kartu otomatis | `4x4` |
| `paperSize` | Wajib | Ukuran halaman PDF: `A4` / `A6` | `A6` |
| `fileName` | Wajib | Nama file PDF; boleh `{{field}}` (mode single) | `titik-{{ln}}.pdf` |
| `border` | Opsional (kosong = polos) | Warna bingkai: hex brand `#RRGGBB` atau nama warna. Single = tepi halaman; grid = per kartu | `#1FA0A6` |
| `borderWidth` | Opsional | Tebal bingkai (angka pt, ditulis sebagai teks) | `"10"` |
| `icon` / `buttonColor` / `textColor` / `width` | Wajib | Tampilan tombol | `share` / `blue` / `white` / `full` |
| `position` | Wajib | Nomor posisi form tombol (teks angka) | `"262"` |
| `text` | Wajib | Label & pesan status, 5 bagian `◆` (lihat tabel posisi) | — |
| `template` | Wajib | Isi dokumen — baris dipisah `;`, tag `<TEXT>` `<QRCODE>` `<IMAGE>` `<FEED/>` `<ROW><COL>` `<LOOP>` `{{field}}` `{{field\|idr}}` | lihat contoh |

## Posisi field gabungan

`text` — 5 segmen dipisah `◆` (sumber: spec):

| # | Isi | Kapan tampil |
|---|---|---|
| 1 | Label tombol | idle |
| 2 | `Menyiapkan PDF...` | sedang dibuat |
| 3 | `PDF siap — pilih aplikasi` | dialog bagikan terbuka |
| 4 | Pesan gagal | error |
| 5 | Data tidak ditemukan | pencarian 0 dokumen |

## Tips & catatan

- Ganti desain kartu = ubah `template` sekali; mode single & grid pakai template yang sama.
- Grid: kartu diurutkan nama (`ln`) A→Z biar gampang dicari saat dipotong; lebih dari muat halaman → otomatis lanjut halaman berikutnya.
- QR terlalu kecil (< ±20mm karena grid terlalu rapat) → renderer hanya memberi peringatan di log, tetap dirender — cek hasil scan dari kertas cetak.
- Footer versi terbaru = 1 tag `<IMAGE asset='powered_by_autsorz' …/>` (lockup PNG utuh); config live sebagian masih pakai susunan ROW/COL lama — akan diseragamkan.
- Print fisik = share sheet → layanan print HP; tidak ada jalur print khusus.
- Konsumen live: TitikDetail (1 QR) + TitikSiteList (semua QR). Antrean berikut: nota DeliveryInvoice. Spec: `docs/share-pdf-widget-dev-spec.md`, handoff `docs/share-pdf-DEV-HANDOFF.md`.
