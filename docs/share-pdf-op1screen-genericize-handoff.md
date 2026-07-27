# HANDOFF sesi op1Screen — genericize share-pdf (`sharePdfKeyed` + P3 + tombol batch)

**Tanggal:** 2026-07-23
**Untuk:** sesi lain yang ngerjain op1Screen genericize — WAJIB invoke skill `op1screen-genericize-widget` + baca memory `op1screen_widget_tab_convention` sebelum nyentuh sheet.
**Status:** A+B DONE 2026-07-23 (sharePdfKeyed@304, D1002 generic); C = HOLD nunggu renderer grid. **DELTA BARU 2026-07-23 sore:** [TEMPLATE] footer diganti (ROW/COL teks → 1 tag `<IMAGE asset='powered_by_autsorz' align='center' height=14/>`) — update helper [TEMPLATE] P3 D1002 + pakai nilai baru ini pas bikin tombol batch C.
**Spec kontrak:** `docs/share-pdf-widget-dev-spec.md` (SSOT field/template) · `docs/share-pdf-DEV-HANDOFF.md` (sisi Flutter, JSON final §4).

---

## 1. State live sekarang (verifikasi dulu, user sering edit manual)

- **Row shift 2026-07-23:** P1 TitikSiteList @984 (widget 985-987), P2 TitikSitePoints @991 (992-993), P3 TitikDetail @998 (999-1002). Nomor lama 992/999/1006 OBSOLETE.
- **P3 PRN D1002 = LITERAL baked** — user manual swap ke `variant:"share-pdf"` (bukan formula; FORMULATEXT #N/A). Ini yang di-genericize balik (kerjaan B).
- **Keputusan terkunci 2026-07-23:** QR payload = `{{li}}` PERMANEN (lu/aec2 BATAL); search single = `lk◼{lk}` (li shared antar site, lk = `{li}-{sv}` = doc-id).
- Renderer share-pdf BASIC live (PDF+share jalan); layout (align/color/border/IMAGE) + mode grid MASIH gap dev Flutter.
- Widget tab: row 303 = `routeBtn` (terakhir yang kutahu) — **cek live next free row sendiri**, jangan percaya angka ini.

## 2. Kerjaan

### A. Widget row baru `sharePdfKeyed`

- **Copy J dari `printBluetoothKeyed`@276** (jangan ngarang template dari nol), lalu delta:
  - `"variant":"share-pdf"` literal (bukan placeholder — identitas widget).
  - Tambah token: `[FILENAME]`, `[BORDER]`, `[BORDERWIDTH]`, `[GRID]` (grid kosong = mode single).
  - `[PAPER]` tetap (makna jadi halaman PDF A4/A6).
- **Prosedur tulis (INSIDEN col-A wipe A303 — jangan diulang):** isi **I (nama) + J (template) + G formula `=IF(ISERROR(Jxxx),,Jxxx)` + H master-index** SAJA. **JANGAN tulis col A literal** — blokir ARRAYFORMULA `A1:I` → semua VLOOKUP #N/A sesheet.

### B. P3 TitikDetail — genericize balik D1002

D1002 = VLOOKUP+SUBSTITUTE ke `sharePdfKeyed`, helper param di G1002.. (kolom bebas ikut konvensi sibling; J276-family 12ph G-R + 4 token baru). Nilai resolved target = **persis JSON single di DEV-HANDOFF §4**:

| Token | Nilai |
|---|---|
| [TABLE] | `84214220504259//location` |
| [SEARCH] | `lk◼{lk}` |
| [PAPER] | `A6` |
| [FILENAME] | `titik-{{ln}}.pdf` |
| [BORDER] | `#1FA0A6` |
| [BORDERWIDTH] | `10` |
| [GRID] | (kosong) |
| [ICON] | `share` |
| [POSITION] | `262` |
| [TEXT] | `Bagikan QR◆Menyiapkan PDF...◆PDF siap — pilih aplikasi◆Gagal membuat PDF. Coba lagi.◆Data titik tidak ditemukan.` |
| [TEMPLATE] | `<TEXT align='center' bold='true' color='#1FA0A6'>{{ln}}</TEXT>;<FEED/>;<QRCODE data='{{li}}' align='center'/>;<FEED/>;<IMAGE asset='powered_by_autsorz' align='center' height=14/>;` |
| warna/width tombol | `blue` / `white` / `full` |

⚠️ [TEMPLATE] penuh `'` dan `;` — cek escaping di SUBSTITUTE; hasil D harus JSON.parse-able.

**Sebelum overwrite D1002: simpan literal existing** (copy ke kolom scratch/note) — itu satu-satunya config live yang jalan; kalau genericize meleset, restore cepat.

### C. Tombol batch "Cetak Semua QR" di P1 TitikSiteList — **HOLD**

JANGAN dibuat sekarang: param `grid` belum ada di renderer → tombol bakal keluarin PDF 1 titik doang (search `lst◼active` multi-doc, renderer single ambil doc pertama) = misleading. Config final udah siap di DEV-HANDOFF §4 (batch). Pas renderer grid live: tambah 1 widget row di window P1 (@984, window 985-987 → **page-window-extend**: insert row + geser range E-spill header + B984 reassemble verify), pakai `sharePdfKeyed` yang sama beda param ([GRID]=`4x4`, [SEARCH]=`lst◼active`, [PAPER]=`A4`, [POSITION]=`263`, [ICON]=`print`, [FILENAME]=`qr-semua-titik.pdf`).

## 3. Verifikasi wajib post-write (insiden lama: agent lapor sukses padahal rusak)

- [ ] Widget row baru: G resolve (bukan #N/A), col A kespill otomatis dari ARRAYFORMULA.
- [ ] D1002: FORMULATEXT jalan (bukan literal lagi), hasil resolve == JSON target di atas (diff manual), JSON.parse OK.
- [ ] B998 (header P3) reassemble utuh; page lain (B984/B991) TIDAK berubah.
- [ ] Nol edit di luar scope (jangan sentuh P4+ / Widget row lain).

**Referensi:** memory `op1screen_widget_tab_convention` (kolom I/J/G/H, col-A wipe) · `feedback_op1screen_agent_destructive` (kenapa verifikasi live wajib) · `project_titik_patroli_appfirst` (row shift, lk, keputusan li) · spec + DEV-HANDOFF share-pdf.
