# SHARE_PDF — PRN variant `share-pdf`: template → PDF → native share sheet (Dev Spec)

**Tanggal:** 2026-07-22
**Buat:** dev Flutter (renderer). Sheet-side nyusul (builder, 1 row swap).
**Status:** PROPOSED (nunggu dev Flutter — variant BARU, renderer duluan, config nyusul)
**Konteks / Konsumen pertama:** P3 TitikDetail (`op1Screen` @1006) — bagikan QR titik patroli sebagai PDF ke WhatsApp. Konsumen berikutnya yang udah antre: DeliveryInvoice (nota PDF via WA, gantiin keterbatasan `whatsappSend` teks-doang).
**Referensi:** `titik-patroli-app-first-location-dev-spec.md`, `aec2_lqr_crypto_spec.md`, `whatsapp-invoice-delivery-dev-spec.md`, template PRN existing (Widget `printBluetooth`/`printBluetoothKeyed`@276)

---

## 1. Kenapa

Admin perlu **bagikan** QR titik patroli (dan nanti nota) ke orang lain — bukan print bluetooth. Alur yang diminta user (dikonfirmasi 2026-07-22): render dokumen → **convert ke PDF di Flutter** → **native share sheet** (dialog "Bagikan via…" bawaan OS) → user pilih WhatsApp → PDF ke-attach.

Kenapa bukan jalur lain:
- `wa.me` (widget `whatsappSend`) **cuma bisa teks** — gak ada mekanisme lampir file lewat URL.
- Intent langsung ke package WhatsApp: rapuh (WA vs WA Business, iOS melarang). Share sheet = robust dua platform, nol backend.
- Engine render dokumen **sudah ada**: PRN (template + table + search keyed). Yang baru cuma muaranya: bluetooth-print → PDF + share. **1 engine, 2 sink** — bukan widget baru dari nol.

## 2. Konsep

Variant ke-3 keluarga `PRN`. Tombol di page; tap → baca 1 doc via `table`+`search` (pola printBluetoothKeyed) → resolve `{{field}}` di `template` → render ke **PDF** (bukan ESC/POS) → simpan file temporer → `share_plus` share sheet dengan PDF ter-attach. Selesai — OS yang handle sisanya.

## 3. Kontrak field

Mirror config LIVE `printBluetoothKeyed` (bukan shape ideal — `position` string, `vidtable` ada, `text` = ◆-segmen, `template` = baris dipisah `;` dengan tag `<TEXT>`/`<QRCODE>`), delta di-bold:

```jsonc
{
  "type": "PRN",
  "variant": "share-pdf",          // ← DELTA: sink PDF+share, bukan bluetooth
  "vidtable": "20342033315492",
  "table": "<tenant>//<coll>",
  "search": "key◼{routeToken}",    // keyed read, sama persis printBluetoothKeyed
  "paperSize": "A6",               // ← DELTA makna: ukuran halaman PDF (A4|A6), bukan lebar kertas termal
  "fileName": "titik-{{ln}}.pdf",  // ← BARU: nama file PDF; {{field}} resolve dari doc; default "share.pdf"
  "border": "#1FA0A6",             // ← BARU: frame keliling TEPI halaman; hex `#RRGGBB` (brand style guide) ATAU named color; absen = polos
  "borderWidth": "8",              // ← BARU: tebal frame dalam pt (string, ikut gaya live); default "8"; cuma kepake kalau border ada
  "icon": "share",
  "buttonColor": "blue", "textColor": "white", "width": "full",
  "position": "262",               // STRING, ikut live
  "text": "<◆-segmen, lihat §3b>",
  "template": "<baris;baris;…, lihat §3c>"
}
```

| Field | Isi | Catatan |
|---|---|---|
| `variant` | `share-pdf` | dispatch renderer; `keyed` (bluetooth) existing TIDAK disentuh |
| `table`+`search` | keyed read 1 doc | search kosong/doc gak ketemu → toast error (`text[4]`), jangan crash |
| `paperSize` | `A4` \| `A6` | halaman PDF; default `A6` (kartu QR) |
| `fileName` | template nama file | biar file di WA kebaca ("titik-Pos-Gerbang-Timur.pdf" bukan "share.pdf"); char ilegal filename di-strip |
| `border` | `#RRGGBB` \| named | frame di TEPI HALAMAN (page edge, ala stiker QR fisik) — BUKAN kotak keliling elemen QR. Hex langsung dipakai (brand style guide, sekarang `#1FA0A6`); named → hex dari theme. Ganti brand color = ganti 1 value di sheet |
| `borderWidth` | angka pt (string) | tebal frame; `"5"` tipis, `"12"` tebal ala stiker; default `"8"`; inner-margin konten ikut geser sebesar frame biar gak ketimpa |
| `grid` | `"KxB"` kolom×baris (string) | **mode BATCH** (§5): absen = single doc 1 halaman (default); `"2x4"` = 8 kartu/halaman, `"4x4"` = 16 kartu/halaman. Ukuran kartu OTOMATIS = halaman dibagi K×B — makin banyak makin kecil, nol config ukuran manual |
| `text`/`icon`/warna | UI tombol | semua dari config — **nol string hardcode di Flutter** |

### 3b. Kontrak `text` (◆-segmen, renderer baca by index)

Mirror pola printBluetoothKeyed (16 segmen status bluetooth). share-pdf cuma butuh 5:

| Idx | Isi | Kapan tampil |
|---|---|---|
| 0 | label tombol (`Bagikan QR`) | idle |
| 1 | `Menyiapkan PDF...` | render in-progress |
| 2 | `PDF siap — pilih aplikasi` | share sheet kebuka |
| 3 | `Gagal membuat PDF. Coba lagi.` | render/share error |
| 4 | `Data titik tidak ditemukan.` | search 0 doc |

### 3c. Kontrak `template` (subset tag PRN + tambahan)

Baris dipisah `;`. Tag yang WAJIB disupport PDF sink:

| Tag | Status | Catatan |
|---|---|---|
| `<TEXT align='center' bold='true' color='#1FA0A6'>…</TEXT>` | `align`/`bold` existing; **`color` BARU** | `#RRGGBB` langsung ATAU named (→ hex theme); default hitam. **`align` hasil tes 2026-07-23 masih di-ignore PDF sink — wajib dibenerin** |
| `<QRCODE data='{{x}}' align='center'/>` | existing | `data` resolved kosong → **skip + tampilkan `text[3]`**, jangan diam-diam (kejadian tes 2026-07-23: field bolong → PDF tanpa QR tanpa penjelasan) |
| `<IMAGE asset='powered_by_autsorz' align='center' height=14/>` | **BARU** | gambar dari **asset bundle Flutter** (key `asset`), bukan URL — offline-safe; `width`/`height` pt opsional (default: ukuran asli, fit halaman); asset gak ketemu → skip diam-diam. **Footer = 1 lockup PNG utuh "powered by āutsorz"** (keputusan 2026-07-23: footer versi teks font-nya default renderer + underline nyasar + gak center — image utuh = font persis style guide, 1 tag, nol urusan font) |
| `<FEED/>` | existing | spasi vertikal |
| `<HR/>`, `<LOOP source>`, `<ROW><COL>`, `{{x\|idr}}` | existing | dipakai konsumen nota (DeliveryInvoice) — jangan di-drop |
| `<CUT/>` | termal-only | ignore diam-diam |

## 4. Contoh resolved (konsumen pertama — P3 TitikDetail)

```json
{"type":"PRN","variant":"share-pdf","vidtable":"20342033315492","table":"84214220504259//location","search":"lk◼{lk}","paperSize":"A6","fileName":"titik-{{ln}}.pdf","border":"#1FA0A6","borderWidth":"10","icon":"share","buttonColor":"blue","textColor":"white","width":"full","position":"262","text":"Bagikan QR◆Menyiapkan PDF...◆PDF siap — pilih aplikasi◆Gagal membuat PDF. Coba lagi.◆Data titik tidak ditemukan.","template":"<TEXT align='center' bold='true' color='#1FA0A6'>{{ln}}</TEXT>;<FEED/>;<QRCODE data='{{li}}' align='center'/>;<FEED/>;<IMAGE asset='powered_by_autsorz' align='center' height=14/>;"}
```

Hasil PDF = replika stiker QR fisik existing: **border brand tebal keliling**, nama titik brand-color bold center di atas, QR gede center, footer 1 baris "powered by" (teks config) + logo autsorz (image asset) di bawah.

**QR payload = `{{li}}` PERMANEN** (keputusan user 2026-07-23: QR mengacu ke li aja, TANPA link/URL — field `lu` + aec2 DICABUT, jangan implement). `search` = `lk◼{lk}` (`lk` = `{li}-{sv}` = doc-id, unik per site — `li` shared antar site jadi `li◼{li}` ambil doc pertama yang salah; lihat titik-patroli spec).

## 4b. Alur UI

```
[ Bagikan QR ]  ── tap ──▶  spinner di tombol (baca doc + render PDF, <1s)
                              │
                              ▼
                   ┌─ Native share sheet (OS) ─┐
                   │  [WA] [Gmail] [Drive] …   │ ── pilih WA ──▶ PDF ke-attach di chat
                   └───────────────────────────┘
   doc gak ketemu / template error → toast, tombol balik normal
```

## 5. Mode grid (batch — cetak semua QR sekaligus)

Kebutuhan riil (foto print manual existing): 1 kertas A4 isi banyak kartu QR (2 kolom × 4 baris = 8 kartu), 1 kartu per titik, dipotong-potong jadi stiker. Sekarang manual; ini gantinya: **1 tombol → 1 PDF berisi SEMUA titik**.

Mekanisme = widget yang SAMA, 2 delta config (nol tipe baru):
1. `search` yang match banyak doc — mis. `lst◼active` (semua titik aktif tenant), bukan `li◼{li}`.
2. `grid:"KxB"` (kolom×baris per halaman) — renderer render **template kartu yang sama, diulang per doc**, susun grid di halaman `paperSize` (A4), overflow otomatis lanjut halaman berikutnya. `"2x4"` = 8/halaman (ala foto existing), `"4x4"` = 16/halaman.

**Sizing kartu (otomatis, nol config manual):**
- Cell = area halaman dibagi rata K kolom × B baris. A4 `4x4` → cell ±52×74mm.
- **Inner padding kartu (feedback tes 2026-07-23: konten mepet frame):** konten inset dari frame border ± 5% sisi cell (min 2× borderWidth) di SEMUA sisi — judul/QR/footer gak boleh nempel border. Berlaku juga mode single (inset dari frame halaman).
- Konten kartu di-scale muat cell: QR = kotak terbesar yang muat setelah baris teks + padding; font ikut skala cell (judul mengecil wajar di grid rapat).
- `borderWidth` di grid dibaca relatif cell (frame `4x4` lebih tipis dari `2x4` — proporsional, bukan pt absolut halaman).
- **Guard scannability:** payload `li` 42 char → QR ringan; ≥ ±20mm cetak aman. `4x4` A4 (QR ±40mm) longgar. Renderer WARN di log kalau hasil hitung QR < 20mm (grid kebanyakan utk paperSize-nya) — tetap render, jangan gagal.

Aturan mode grid:
- **`border` berlaku PER KARTU** (tiap sel dapat frame sendiri, ala foto), bukan tepi halaman — kartu dipotong jadi stiker individual, frame harus ikut kartu.
- Urutan kartu: sort `ln` A→Z (deterministik, gampang nyari pas motong).
- Search 0 doc → toast `text[4]`. 1 doc → tetap jalan (grid isi 1).
- `fileName` tanpa `{{field}}` per-doc (banyak doc) — pakai literal, mis. `qr-semua-titik.pdf`.
- Print fisik: share sheet → print service / save → print. NOL pipeline print baru.

Contoh resolved (tombol "Cetak semua QR" di P2 TitikList):

```json
{"type":"PRN","variant":"share-pdf","vidtable":"20342033315492","table":"84214220504259//location","search":"lst◼active","grid":"4x4","paperSize":"A4","fileName":"qr-semua-titik.pdf","border":"#1FA0A6","borderWidth":"10","icon":"print","buttonColor":"blue","textColor":"white","width":"full","position":"263","text":"Cetak Semua QR◆Menyiapkan PDF...◆PDF siap — pilih aplikasi◆Gagal membuat PDF. Coba lagi.◆Belum ada titik aktif.","template":"<TEXT align='center' bold='true' color='#1FA0A6'>{{ln}}</TEXT>;<FEED/>;<QRCODE data='{{li}}' align='center'/>;<FEED/>;<IMAGE asset='powered_by_autsorz' align='center' height=14/>;"}
```

Template kartu IDENTIK dengan mode single — 1 sumber layout, ubah desain kartu = ubah 1 template, dua mode ikut.

## 6. Sheet-side (builder — nyusul, JANGAN config-ahead)

Variant BARU → renderer landing dulu (renderer lama ketemu `variant:"share-pdf"` = perilaku tak terdefinisi). Setelah live:
1. Widget row baru `sharePdfKeyed` (template mirror printBluetoothKeyed@276 + `fileName`, ikut generic+SUBSTITUTE). Catatan: P3 D1002 sekarang LITERAL baked share-pdf (user manual swap 2026-07-23) — genericize balik pas bikin row ini.
2. Tombol batch grid (§5) di P2 TitikList — row Widget sama, beda param.

## 7. Deliverable dev (Flutter)

1. Dispatch `variant:"share-pdf"` di renderer PRN existing (bluetooth path nol sentuhan).
2. Render template → PDF (package `pdf`; QR pakai painter yang sama dgn `qrDisplay`). `paperSize` A4/A6.
3. File temporer + `share_plus` `Share.shareXFiles([...], mimeType application/pdf)`; `fileName` resolved.
4. Error path: doc gak ketemu / template rusak → toast (`text` idx sesuai §3b), no crash.
5. **Layout (gap hasil tes 2026-07-23):** `align='center'` beneran center di PDF; atribut `color` di `<TEXT>` (terima `#RRGGBB` langsung + named→theme hex); field `border`+`borderWidth` gambar frame di TEPI HALAMAN (bukan keliling QR), tebal = borderWidth pt, konten dapat inner-margin ≥ borderWidth biar gak ketimpa frame.
6. **Tag `<IMAGE asset='…'/>`:** bundle lockup `powered_by_autsorz` (PNG transparan UTUH "powered by āutsorz", dikasih owner) ke assets Flutter, render dari asset key, hormati `align`/`height`. Asset gak ketemu → skip diam-diam. Footer TEKS dibuang (font default+underline nyasar+gak center — hasil tes 2026-07-23). ROW/COL di PDF sink tetap wajib jalan (dibutuhkan nota).
7. **Temuan tes 2026-07-23 (baseline PDF sink sekarang):** tag/atribut tak dikenal di-IGNORE diam-diam — `align`/`color` di TEXT, `border`, `<IMAGE>` semua dicuekin. Item 5-6 = gap yang harus ditutup; jangan anggap sudah ada.
8. **Mode grid (§5):** `grid:"KxB"`, render kartu per doc hasil search (multi-doc), cell auto-size (halaman ÷ K×B, konten scale-to-fit), border per kartu, sort `ln`, pagination otomatis, WARN kalau QR hasil hitung < 25mm. Bangun fungsi render-kartu SEKALI, dipakai single (1 kartu/halaman) + grid (K×B kartu/halaman).

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Renderer variant `share-pdf` (PDF + share sheet) | dev Flutter | PROPOSED |
| Widget row `sharePdfKeyed` + swap P3 D1010 | builder | NUNGGU renderer |
| CF / field baru | — | NOL (pakai `lu` yang udah di-spec) |

## 10. Not Doing (dan kenapa)

- **Kirim langsung ke nomor WA tertentu** — wa.me gak bisa attach; intent-to-package rapuh + iOS melarang. Share sheet = 1 tap ekstra, robust.
- **PDF server-side (CF)** — nol kebutuhan; render lokal cukup, offline jalan.
- ~~Batch multi-doc~~ — **DICABUT 2026-07-23**: kebutuhan riil muncul (print manual grid A4 existing) → jadi mode `grid` §5. Nota multi-item tetap 1 doc (li[] di-loop template), itu bukan batch.
- **Hapus variant bluetooth** — tetap dipakai (struk kasir walk-in).

## 11. Acceptance

- [ ] Tap tombol → share sheet OS muncul dengan 1 PDF ter-attach.
- [ ] Pilih WhatsApp → PDF terkirim; nama file sesuai `fileName` resolved.
- [ ] Isi PDF: QR **scannable dari layar & hasil print** (app lain scan → `lqrVerify` resolve), label sesuai template.
- [ ] Layout = stiker fisik: border biru di tepi halaman (bukan keliling QR), semua elemen center, judul biru bold, logo image di bawah.
- [ ] `<QRCODE>` dengan data resolved kosong → toast `text[3]`, BUKAN PDF tanpa QR diam-diam.
- [ ] `paperSize` A6 vs A4 beda ukuran halaman.
- [ ] Doc gak ketemu → toast, tombol usable lagi, no crash.
- [ ] Mode grid: `grid:"4x4"` + search multi-doc → 1 PDF A4 16 kartu, sort ln, border PER KARTU, titik ke-17 lanjut halaman 2, tiap QR scannable setelah dipotong (uji scan dari hasil PRINT, bukan cuma layar).
- [ ] Ganti `grid` `"4x4"`→`"2x4"` di config → kartu membesar otomatis, nol perubahan lain.
- [ ] Variant `keyed` (bluetooth) regresi nol.
- [ ] Nol string hardcode di Flutter — semua label/isi dari config (logo = asset, bukan string).

## 12. Asumsi & risiko

- [ ] Package `pdf` + `share_plus` belum ada di project → tambah dependency (keduanya standar pub.dev, no native config selain file-provider Android yang share_plus urus sendiri).
- [ ] Markup PRN yang didukung PDF = tabel §3c; `<CUT/>` (termal-only) di-ignore diam-diam.
- [ ] QR payload `{{li}}` (42 char `0l`+40hex) — ringan, error-correction default aman bahkan di grid `4x4`.

**Referensi:** `titik-patroli-app-first-location-dev-spec.md` (field `lu`), `aec2_lqr_crypto_spec.md` (isi QR), `whatsapp-invoice-delivery-dev-spec.md` (konsumen berikutnya), memory `feedback_reuse_first_widget`.
