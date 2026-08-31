# DETAIL_CARD — Ringkasan Kunjungan: 3 perubahan renderer

Tanggal: 2026-08-25 · Untuk: dev Flutter · Status: config LIVE (config-ahead), nunggu renderer.

Page: `vertikaTeknoLokaciptaCleaningSummary` · widget `DETAIL_CARD` (template baru `detailCardTwoPhoto`, Widget row 326).
Data: `84214220504259//cleaning_visit` (search `nm◼{nm}`).

Config sudah di-flip di sheet. Sampai renderer deploy, summary **degrade** (Foto Akhir ilang, checklist row bisa kerender aneh). Ship 3 ini **1 PR**.

---

## 0. Tujuan (target output)

Kartu Ringkasan Kunjungan harus kebaca **manusiawi**: nama task jadi JUDUL, status jadi NILAI (sama layout kaya baris "Kategori / Pantry"). Foto awal & akhir **kepisah** — awal di atas, akhir di bawah, tiap grup scroll horizontal.

**Target (setelah 3 perubahan + fix per-slot):**
```
┌──────────────────────────────────────────────┐
│ Ringkasan Kunjungan              [ Selesai ]  │
│ CLN-2026-000538                               │
│ ──────────────────────────────────────────── │
│ Kategori           Pantry                     │
│ Mulai              25 Aug 2026 08:39          │
│ Selesai            25 Aug 2026 08:40          │
│ Catatan Sebelum    b3foreee                   │
│ Catatan Sesudah    mwntap after               │
│                                               │
│ Bersihkan sink & keran           Selesai      │  ← judul=task | nilai=status
│ Cuci & rapikan peralatan         Selesai      │
│ Lap pintu kulkas & dispenser     Selesai      │  ← ck3 bener stlh fix per-slot
│ Buang sampah & ganti liner       Selesai      │
│ ──────────────────────────────────────────── │
│ Foto Awal                                     │
│ [img][img][img]  →                            │  ← grup 1, scroll kanan
│                                               │
│ Foto Akhir                                    │
│ [img][img]  →                                 │  ← grup 2, stack di bawah
└──────────────────────────────────────────────┘
```

**Sekarang (SEBELUM PR) — kenapa jelek:**
```
Checklist 1   Bersihkan sink & keran | Selesai      ← label angka gak berarti, status " | " mesin
Checklist 2   Cuci & rapikan peralatan | Selesai
Checklist 3   Bersihkan sink & keran | Selesai      ← DUPLIKAT (bug per-slot)
...
[Foto Awal] [Foto Akhir]                            ← 1 baris, gak kepisah
```

Data contoh (visit CLN-2026-000538 Pantry): `ck1="Bersihkan sink & keran | Selesai"`, `ck2="Cuci & rapikan peralatan | Selesai"`, `ck3=<dupe, harusnya task3>`, `ck4="Lap pintu kulkas & dispenser | Selesai"`, `ck5=""`, `ck6=""`, `ia`=foto awal (bisa >1), `ib`=foto akhir (bisa >1).

---

> **Scope:** doc ini KHUSUS `DETAIL_CARD` (Ringkasan Kunjungan). Perubahan `displayList` LogChecklist ada di doc terpisah `docs/logchecklist-displaylist-rowsplit-handoff.md` (UI beda — stacked).

## Config LIVE — `DETAIL_CARD` (op1Screen D1599, widget `detailCardTwoPhoto`)
```json
{"type":"DETAIL_CARD","vidtable":"20342033315492","table":"84214220504259//cleaning_visit","search":"nm◼{nm}","title":"Ringkasan Kunjungan","subtitle":"<nm>","badgeField":"st","badgeMap":"open◼Aktif◼warn★closed◼Selesai◼ok","rows":"Kategori◼<cat>★Mulai◼<tsa>★Selesai◼<tsb>★Catatan Sebelum◼<dsa>★Catatan Sesudah◼<dsb>★<ck1>★<ck2>★<ck3>★<ck4>★<ck5>★<ck6>★<ck7>★<ck8>★<ck9>★<ck10>","hideEmptyRows":"TRUE","rowSplit":"|","images":"<ia>","imageLabels":"Foto Awal","images2":"<ib>","imageLabels2":"Foto Akhir","text":"Kunjungan tidak ditemukan"}
```

---

## Perubahan 1 — CHECKLIST_DYNAMIC per-slot (SUDAH ada doc)

Lihat `docs/checklist-dynamic-perslot-renderer-bug.md`. 1 task = 1 slot (`ck1..ckN`), jangan numpuk di `ck1`. Ini yg bikin `ck1`=`ck3` duplikat di summary. **Prasyarat** biar perubahan 3 kebaca bener.

---

## Perubahan 2 — DETAIL_CARD `images2` + `imageLabels2` (grup foto ke-2)

Tambah 2 param **opsional** di renderer `DETAIL_CARD`:

- `images` + `imageLabels` = grup foto **pertama** (di sini `<ia>` = Foto Awal).
- `images2` + `imageLabels2` = grup foto **kedua**, render **stack DI BAWAH** grup pertama (di sini `<ib>` = Foto Akhir).

Kelakuan:
- Tiap grup = strip thumbnail **scroll horizontal** kalau > 1 foto (delimiter antar-foto = `◆`, sama kaya `images` sekarang).
- Tiap grup punya label sendiri (`imageLabels` / `imageLabels2`).
- `images2` kosong/absen → render persis kaya sekarang (1 grup). **Backward-compatible** — page `DETAIL_CARD` lain (tanpa `images2`) gak berubah.

Acceptance:
- `<ia>` = 3 foto, `<ib>` = 1 foto → baris "Foto Awal" [3 thumb, scroll →], DI BAWAHNYA "Foto Akhir" [1 thumb].
- Page detailCard lain (tanpa images2) tampil sama kaya sebelum PR.

## Perubahan 3 — param `rowSplit` (OPT-IN, `DETAIL_CARD` doang)

Param **opsional baru** `rowSplit` = 1 karakter separator (kita pakai `"|"`).

**Kontrak:**
- **`rowSplit` absen/kosong → TIDAK ada split. Perilaku persis sekarang.** ← jaminan aman (§4).
- `rowSplit` di-set → untuk `rows` entry yg cuma **placeholder telanjang** (`<field>` TANPA `◼`):
  - Ambil value. Ada separator → **split kemunculan PERTAMA**: kiri = **judul baris**, kanan = **value**. **Trim spasi** → `"task|status"` & `"task | status"` sama2 jadi `task` + `status`.
  - Tanpa separator → render polos.
- Entry berlabel `Label◼<field>` (mis `Kategori◼<cat>`) → **tak disentuh** (label literal + value, gak displit walau value ada `|`).

**UI = layout row DETAIL_CARD yg lama (2 kolom: judul kiri, value kanan)** — sama kaya baris `Kategori   Pantry`.
```
Bersihkan sink & keran        Selesai
```

- `hideEmptyRows:TRUE` → `<ckN>` kosong (`ck5`,`ck6`) di-skip.

Acceptance:
- `ck1..ck4` isi, `ck5..ck10` kosong → 4 baris, judul=task, value=status, tanpa "Checklist N", tanpa duplikat (stlh perubahan 1).
- Meta rows (Kategori/Mulai/Selesai/Catatan) normal.

---

## 4. Jaminan AMAN (non-breaking) — WAJIB dijaga

1. **`images2`/`imageLabels2`** = param baru opsional. Absen → 1 grup kaya sekarang. Widget lama `detailCard` (row 292) **gak disentuh** — cuma varian `detailCardTwoPhoto` (row 326) punya param ini. ~5 page detailCard lain **aman**.
2. **`rowSplit`** = opt-in, default OFF. Tanpa param → **nol** perubahan di semua `DETAIL_CARD` existing. Cuma CleaningSummary nyalain.
3. Split cuma di **placeholder telanjang**; entry berlabel (`Label◼`) tak tersentuh → date/note yg kebetulan ada `|` gak ke-split.
4. Perubahan 1 (per-slot) internal `CHECKLIST_DYNAMIC`, gak nyentuh widget lain.

---

## Catatan sheet (JANGAN diubah dev)

- Widget row 326 `detailCardTwoPhoto` = template `detailCard` + `rowSplit`/`images2`/`imageLabels2`. Template lama `detailCard` (row 292) **sengaja gak disentuh**.
- Delimiter multi-foto `ia`/`ib` diasumsikan `◆` (GET_IMAGES max:5). **[VERIFY]** pas visit multi-foto.
- displayList LogChecklist = doc terpisah `docs/logchecklist-displaylist-rowsplit-handoff.md`.
