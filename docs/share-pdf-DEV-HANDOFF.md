# DEV HANDOFF (Flutter) — Bagikan & Cetak QR Titik (share-pdf + grid full-site)

**Tanggal:** 2026-07-23
**Buat:** dev Flutter (renderer). CF/backend & builder sheet BUKAN kerjaanmu — dependency-nya kutandai.
**Status:** PROPOSED — variant BARU, renderer duluan, config sheet nyusul.
**Spec detail:** `share-pdf-widget-dev-spec.md` (SATU-SATUNYA sumber kontrak — handoff ini cuma cover + urutan kerja).

---

## 1. Yang dibangun (2 tombol, 1 engine)

| Tombol | Page | Hasil |
|---|---|---|
| **Bagikan QR** (single) | P3 TitikDetail | 1 titik → PDF A6 kartu QR → native share sheet → WhatsApp dll. |
| **Cetak Semua QR** (batch full-site) | P2 TitikList | SEMUA titik aktif → 1 PDF A4 grid kartu (`4x4` = 16/halaman, auto lanjut halaman) → share sheet → print service. Gantiin print manual grid yang sekarang dikerjain tangan. |

Dua-duanya = **variant baru `share-pdf` di keluarga PRN** existing (printBluetoothKeyed). Engine baca doc (`table`+`search`+`vidtable`) dan parser template SAMA — yang baru cuma sink: bluetooth-print → PDF + share sheet. Path bluetooth NOL sentuhan (spec §2, §7.1).

Layout kartu = replika stiker fisik: border brand `#1FA0A6` keliling, judul titik center bold brand-color, QR center, footer "powered by" + logo autsorz (image). Foto referensi ada di user.

## 2. Baseline sekarang (hasil tes 2026-07-23 — jangan anggap sudah ada)

PDF sink yang ada sekarang cuma ngerti `<TEXT bold>` + `<QRCODE>`; sisanya di-IGNORE diam-diam:
- `align='center'` dicuekin (semua rata kiri)
- `color` dicuekin (hitam semua)
- `border`/`borderWidth` dicuekin
- `<IMAGE>` dicuekin (baris hilang)

Ini gap yang kamu tutup. Detail per-item: spec §7.

## 3. Urutan kerja (rekomendasi)

1. **Render-kartu core** — fungsi render 1 kartu dari template ke area (x,y,w,h). Semua di spec §3c:
   `align` beneran jalan, `color` (`#RRGGBB` langsung ATAU named→theme), `<IMAGE asset>` (+`width`/`height` pt), `<ROW><COL>` di PDF, `border`+`borderWidth` (§3: single = TEPI HALAMAN, bukan keliling QR).
2. **Mode single** — 1 doc → 1 kartu full halaman A6 → file temporer + `share_plus` → share sheet. `fileName` resolved `{{field}}`. Error path pakai `text` ◆-segmen idx §3b (nol string hardcode).
3. **Mode grid (full-site)** — `grid:"KxB"` → semua doc hasil search, sort `ln` A→Z, cell = halaman ÷ K×B, konten scale-to-fit, **border per KARTU** (beda makna dgn single!), pagination otomatis, WARN kalau QR < 25mm. Spec §5.
4. **Guard QR kosong** — `data` resolved kosong → toast `text[3]`, JANGAN diam-diam keluarin PDF tanpa QR (kejadian tes 2026-07-23, sisa waktu kebuang nyari misteri).
5. **Polish hasil tes grid 2026-07-23** (grid udah jalan — sisa 3): (a) inner padding kartu — konten inset ±5% sisi cell / min 2×borderWidth dari frame, sekarang mepet; (b) footer ganti 1 tag `<IMAGE asset='powered_by_autsorz' align='center'/>` (lockup PNG utuh) — versi teks dibuang; (c) hormati `align`+`height` di IMAGE.

Fungsi kartu dibangun SEKALI — single = 1 kartu/halaman, grid = K×B kartu/halaman. `<LOOP>`/`<HR/>`/`|idr` jangan di-drop dari parser: konsumen berikutnya nota DeliveryInvoice (PDF invoice via WA) pakai persis itu.

## 4. Config final (dari sheet — kamu TIDAK hardcode ini, cuma buat tes lokal)

Single (P3):
```json
{"type":"PRN","variant":"share-pdf","vidtable":"20342033315492","table":"84214220504259//location","search":"lk◼{lk}","paperSize":"A6","fileName":"titik-{{ln}}.pdf","border":"#1FA0A6","borderWidth":"10","icon":"share","buttonColor":"blue","textColor":"white","width":"full","position":"262","text":"Bagikan QR◆Menyiapkan PDF...◆PDF siap — pilih aplikasi◆Gagal membuat PDF. Coba lagi.◆Data titik tidak ditemukan.","template":"<TEXT align='center' bold='true' color='#1FA0A6'>{{ln}}</TEXT>;<FEED/>;<QRCODE data='{{li}}' align='center'/>;<FEED/>;<IMAGE asset='powered_by_autsorz' align='center' height=14/>;"}
```

Batch full-site (P2):
```json
{"type":"PRN","variant":"share-pdf","vidtable":"20342033315492","table":"84214220504259//location","search":"lst◼active","grid":"4x4","paperSize":"A4","fileName":"qr-semua-titik.pdf","border":"#1FA0A6","borderWidth":"10","icon":"print","buttonColor":"blue","textColor":"white","width":"full","position":"263","text":"Cetak Semua QR◆Menyiapkan PDF...◆PDF siap — pilih aplikasi◆Gagal membuat PDF. Coba lagi.◆Belum ada titik aktif.","template":"<TEXT align='center' bold='true' color='#1FA0A6'>{{ln}}</TEXT>;<FEED/>;<QRCODE data='{{li}}' align='center'/>;<FEED/>;<IMAGE asset='powered_by_autsorz' align='center' height=14/>;"}
```

**QR payload = `{{li}}` PERMANEN** — keputusan user 2026-07-23: QR isi li langsung (42 char `0l`+40hex), TANPA link/URL. Field `lu` + spec aec2 **BATAL dipakai — jangan implement handling URL apa pun**. Search single pakai `lk` (= `{li}-{sv}`, doc-id unik per site) karena `li` shared antar site.

## 5. Dependency (bukan kerjaanmu, tapi ngaruh ke tes)

- [ ] **Field `lk`** (`{li}-{sv}`) di-stamp CF `onTenantWrite` — CF BUILT belum deploy. Doc seed manual buat tes wajib diisi `lk` tangan.
- [ ] **Asset lockup** `powered_by_autsorz` — PNG transparan UTUH "powered by āutsorz" (~600px lebar), dikasih owner. Bundle ke `assets/` + `pubspec.yaml`. Footer TEKS dibuang (feedback 2026-07-23: font default renderer + underline nyasar + gak center — image utuh = font style guide, center via align).
- [ ] **Dependency pub**: `pdf` + `share_plus` (kalau belum ada). QR painter pakai yang sama dgn `qrDisplay` existing.

## 6. Acceptance kunci (full list: spec §11)

- [ ] Share sheet muncul, PDF ke-attach, nama file sesuai `fileName`.
- [ ] Layout = stiker fisik (border tepi, center, brand color, logo image).
- [ ] Grid `4x4`: 16 kartu A4, sort ln, border per kartu, halaman 2 otomatis, **QR scannable dari hasil PRINT** (bukan cuma layar).
- [ ] Ganti `grid` `4x4`→`2x4` di config → kartu membesar sendiri, nol perubahan kode.
- [ ] QR data kosong → toast, bukan PDF bolong.
- [ ] Variant bluetooth (`keyed`) regresi nol.
- [ ] Nol string/warna/ukuran hardcode — semua dari config.

## 7. Not Doing (jangan dibangun — spec §10)

- Kirim langsung ke nomor WA (wa.me gak bisa attach; intent rapuh/iOS melarang).
- PDF server-side.
- Pipeline print native sendiri — print lewat share sheet cukup.
- Config ukuran kartu manual — ukuran SELALU turunan `grid`/`paperSize`.

**Referensi:** `share-pdf-widget-dev-spec.md` (kontrak penuh) · `titik-patroli-app-first-location-dev-spec.md` (field `li`/`lk`, alur titik) · `whatsapp-invoice-delivery-dev-spec.md` (konsumen berikutnya). ~~aec2_lqr_crypto_spec~~ BATAL dipakai (QR = li polos).
