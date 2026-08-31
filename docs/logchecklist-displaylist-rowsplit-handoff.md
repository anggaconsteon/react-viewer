# displayList — LogChecklist: param `rowSplit` (split task|status jadi header+value)

Tanggal: 2026-08-25 · Untuk: dev Flutter (renderer `displayList`) · Status: config LIVE (config-ahead), nunggu renderer.

Page: `vertikaTeknoLokaciptaLogChecklist` · widget `displayList` variant `tableCardInteractive` (op1Screen **D1619**, baked literal).
Data: `84214220504259//report-checklist` (positional field `<N>`).

> Doc terpisah dari `DETAIL_CARD` summary (`docs/detail-card-summary-renderer-handoff.md`) — **UI beda**: di sini **stacked** (judul atas, value bawah), bukan 2-kolom.

---

## 0. Tujuan

Di popup detail, tiap task checklist harus kebaca kaya field meta yg udah ada (`TANGGAL` / value di bawah). Nama task jadi **header** (baris atas), status jadi **value** (baris bawah). **STACK vertikal**, BUKAN side-by-side.

**Target (record `checklist-outdoor`):**
```
TANGGAL
25 Aug 2026 11:17

JENIS
checklist-outdoor

LOKASI
BSD Tech Center #26

SITE
Product Group

KETERANGAN
hahaha

SAPU HALAMAN DAN AREA PEDESTRIAN
Selesai

BUANG SAMPAH DAN KOSONGKAN TEMPAT SAMPAH
Selesai

BERSIHKAN ASBAK DAN SMOKING AREA
Selesai
...
```

**Sekarang (SEBELUM PR):**
```
CHECKLIST
-
Sapu halaman dan area pedestrian|Selesai        ← nyatu 1 baris, "|" mesin
Buang sampah dan kosongkan tempat sampah|Selesai
...
```
(`PEL LANTAI / Selesai` yg keliatan bener kemarin itu LITERAL yg diketik di template — udah dibuang.)

---

## 1. Perubahan — param `rowSplit` (OPT-IN)

Param **opsional baru** `rowSplit` di `displayList` = 1 karakter separator (kita pakai `"|"`). Berlaku di string `detail` (dan `content`).

**Kontrak:**
- **`rowSplit` absen/kosong → TIDAK ada split. Perilaku persis sekarang.** ← jaminan aman (§3).
- `rowSplit` di-set → tiap **baris** (`\n`-separated) yg isinya cuma **placeholder telanjang** (`<field>`, tanpa teks literal lain):
  - Ambil value field. Ada separator → **split kemunculan PERTAMA**: kiri = **header** (render kaya label field meta: gaya sama, mis UPPERCASE abu), kanan = **value** (baris DI BAWAHNYA). **Trim spasi** → `"task|status"` & `"task | status"` sama2 jadi `task` + `status`.
  - Tanpa separator → render baris polos (kaya sekarang).
- Baris yg ADA teks literal-nya (mis `Tanggal: <2>`) → **tak disentuh**, tetap lewat jalur header `: ` (colon-spasi) yg lama.

**UI = STACKED**, identik gaya field meta existing:
```
SAPU HALAMAN DAN AREA PEDESTRIAN     ← header (baris atas)
Selesai                              ← value (baris bawah)
```

---

## 2. Acceptance

- `<11>..<19>` yg value-nya ada `|` → header=task (atas), value=status (bawah), gaya sama kaya `TANGGAL`/`JENIS`.
- Baris meta (`Tanggal: <2>`, `Jenis: <30>`, dst) → normal, gak berubah.
- Value tanpa `|` (mis slot kosong `*`) → render polos (lihat §4).
- **Regression: page `displayList` lain yg GAK punya `rowSplit` → output identik sebelum PR.**

---

## 3. Jaminan AMAN (non-breaking) — WAJIB

1. `rowSplit` **opt-in, default OFF**. Tanpa param → **nol** perubahan di SEMUA `displayList` existing (displayList = widget umum, banyak page). Cuma LogChecklist yg nyalain (`rowSplit:"|"`).
2. Split cuma di **baris placeholder telanjang**. Baris `Label: <field>` (ada literal) → tak tersentuh → field date/note yg kebetulan ada `|` **gak** ke-split.
3. Gak ada field/param existing yg dihapus/diubah arti — cuma NAMBAH param opsional.

---

## 4. Catatan

- **Config LIVE (D1619):**
  ```json
  {"type":"displayList","variant":"tableCardInteractive",...,"table":"84214220504259//report-checklist","content":"Tanggal: <2>\nJenis: <30>\nLokasi: <8>\nSite: <6>\nKeterangan: <9>","image":"<10>","detail":"Tanggal: <2>\nJenis: <30>\nLokasi: <8>\nSite: <6>\nKeterangan: <9>\n \n<11>\n<12>\n<13>\n<14>\n<15>\n<16>\n<17>\n<18>\n<19>","rowSplit":"|","sort":"desc","indexStart":1}
  ```
  (Literal `Pel Lantai: Selesai` + header `Checklist:` yg nelen udah dibuang; `<11>..<19>` polos; `rowSplit:"|"` ditambah.)
- **`*` di slot kosong** (dari bug per-slot `CHECKLIST_DYNAMIC`, doc `docs/checklist-dynamic-perslot-renderer-bug.md`): gak ada `|` → render polos `*`. Beres pas slot kosong = `""`, atau renderer skip value `*`/kosong.
- Data `report-checklist` ditulis page statik lama `vertikaTeknoLokaciptaChecklist*` (TASKLIST → `"task|status"` pipe-no-spasi). `rowSplit:"|"` + trim nangani ini + format `"task | status"` (dynamic) sekaligus.
- Field index `<N>` (Tanggal/Jenis/Lokasi/Site/Keterangan/foto/task) = mapping existing, **tidak diubah** — cuma checklist section yg dirapiin.
