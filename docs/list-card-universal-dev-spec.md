# LIST_CARD — Universal List Widget (Dev Spec)

Tanggal: 2026-07-15 · Status: PROPOSED (menunggu dev renderer)
Pemilik kasus pertama: fate (3 list) — sekarang jalan pakai LIST_MULTIPLE_PANEL_CARD sebagai interim; LIST_CARD = standar list ke depan.

---

## 1. Kenapa

Sekarang ada ±7 tipe list yang saling tumpang tindih (LIST_ITEM_CARD, PICKER_LIST, LIST_MULTIPLE_PANEL_CARD, LIST_STATISTIC_CARD, TASK_FEED_LIST, taskFeedListFlat, displayList) — tiap fitur baru harus milih dan sering nabrak gap: PICKER_LIST tap-nav belum diimplement, TASK_FEED_LIST token hardcode `{activeTaskVid}`, panelCard `routeParam` cuma single pair, LIST_ITEM_CARD positional-only. **LIST_CARD = satu renderer list keyed generik, config-driven penuh, dipakai semua fitur berikutnya.** Tipe lama tetap hidup (back-compat), tidak di-rename (aturan owner).

## 2. Anatomi

```
[HEADER  judul + subjudul + count]      ← opsional
[STATS   kotak count per filter ×N]     ← opsional
[SEARCH  bar cari]                      ← opsional (searchFields kosong = hilang)
[GROUP   label section]                 ← opsional (groupBy kosong = flat)
[CARD]
  ┌────────────────────────────────────────┐
  │ (lead)  TITLE                 [BADGE]  │
  │         subtitle                       │
  │         meta                trailing   │
  │                        trailingLabel   │
  └────────────────────────────────────────┘
[EMPTY   emptyText kalau 0 row]
```
- Tap = SELURUH kartu → navigate `route` + push `routeParams`.
- Baris teks yang config-nya kosong → tidak dirender (kartu mengecil sendiri).

## 3. Kontrak field

```json
{
  "type": "LIST_CARD",
  "vidtable": "[VIDTABLE]",
  "table": "[TABLE]",             // keyed coll, prefix {tenant}//
  "search": "[SEARCH]",           // WHERE DSL: key◼value⭘… (semantik search existing)
  "conditions": "[CONDITIONS]",   // live-query conditions (opsional, pola timeline)
  "sortField": "[SORTFIELD]",     // kosong = urutan datang
  "sortDir": "[SORTDIR]",         // asc | desc
  "groupBy": "[GROUPBY]",         // nama key; kosong = flat
  "groupLabels": "[GROUPLABELS]", // value◼Label★value2◼Label2 — urutan = urutan section; value di luar daftar → section paling bawah apa adanya
  "lead": "[LEAD]",               // "" = tanpa leading | "initial" = inisial dari title | nama icon
  "title": "[TITLE]",             // template: <field> + literal, mis. "<tt>"
  "subtitle": "[SUBTITLE]",       // template, mis. "<bn> · <vn>"; kosong = hide
  "meta": "[META]",               // template, mis. "<dt> · <st>–<et>"; kosong = hide
  "badgeField": "[BADGEFIELD]",   // key yang menentukan badge; kosong = tanpa badge
  "badgeMap": "[BADGEMAP]",       // value◼Label◼tier★… ; tier ∈ danger|warn|ok|neutral (warna dari THEME, bukan config)
  "trailing": "[TRAILING]",       // template nilai kanan; kosong = hide
  "trailingLabel": "[TRAILINGLABEL]", // caption kecil di bawah trailing
  "stats": "[STATS]",             // Label◼filterDSL★Label2◼filterDSL2 ; filter kosong = count semua row hasil `search`; kosong total = strip hilang
  "searchFields": "[SEARCHFIELDS]", // key◆key2 buat search bar; kosong = bar hilang
  "route": "[ROUTE]",
  "routeParams": "[ROUTEPARAMS]", // MULTI pair: key◼{field}⭘key2◼{field2} — resolve di ROW yang di-tap (row-first, fallback session); kontrak = rbt-route-params-dev-spec §9
  "text": "[TEXT]"                // label statis: headerTitle◆headerSubtitle◆countLabel◆searchHint◆emptyText  (segmen kosong = elemen hilang)
}
```

Aturan renderer:
1. **Keyed reader** — `<field>` di template = lookup key doc (bukan index posisi). Field tidak ada → render "".
2. **Semua label statis dari `text`** — DILARANG hardcode string di Flutter (aturan config-driven labels).
3. **`stats` = count murni** — tiap kotak menghitung row (dari hasil `search` page) yang match filter kotak itu. Tidak ada agregasi domain lain di v1 (sum field = fase 2 kalau kepake).
4. **`routeParams` multi-pair WAJIB** — ini sekaligus implementasi kontrak tap-list `docs/rbt-route-params-dev-spec.md` §9–§10 (value `{x}` resolve dari row yang di-tap dulu, fallback token session; key jadi token `{key}` di halaman tujuan; push semua pair).
5. Badge tier → warna theme (danger/warn/ok/neutral). Tidak menerima hex dari config.
6. Null-safe semua field opsional: kosong = elemen tidak dirender, bukan error.

## 4. Contoh resolved — acceptance pakai kasus live fate

### 4.1 FateKokpit (list project, ops)
```json
{"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//fate_project","search":"","conditions":"","sortField":"t","sortDir":"desc","groupBy":"","groupLabels":"","lead":"initial","title":"<tt>","subtitle":"<bn> · <vn>","meta":"<dt> · <st>–<et>","badgeField":"","badgeMap":"","trailing":"","trailingLabel":"","stats":"Total◼","searchFields":"tt◆bn","route":"vertikaTeknoLokaciptaFateProjectDetail","routeParams":"projectVid◼{pn}","text":"Fate Agency◆Semua project◆project◆Ketik judul atau brand◆Belum ada project"}
```
Tap kartu "Photoshoot" → token `{projectVid}` = `FPRJ-2026-000002` → FateProjectDetail header resolve.

### 4.2 FateProjectDetail (list model per project) — MULTI routeParams
```json
{"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//fate_assign","search":"pn◼{projectVid}","conditions":"","sortField":"","sortDir":"","groupBy":"","groupLabels":"","lead":"initial","title":"<mnn>","subtitle":"","meta":"Hadir <arr> · Selesai <cmp>","badgeField":"ast","badgeMap":"assigned◼Menunggu Konfirmasi◼warn★scheduled◼Terjadwal◼neutral★present◼On Job◼ok★awaiting◼Selisih — Perlu Tindak◼danger★closed◼Selesai◼neutral","trailing":"<ovm>","trailingLabel":"menit selisih","stats":"Model◼★On Job◼ast◼present★Selisih◼ast◼awaiting","searchFields":"mnn","route":"vertikaTeknoLokaciptaFateAssignDetail","routeParams":"assignVid◼{anm}⭘projectVid◼{pn}","text":"Model◆Progres & selisih◆model◆Ketik nama model◆Belum ada model di project ini"}
```
Tap → DUA token ke-push: `{assignVid}` + `{projectVid}` (event `epn` hidup lagi di semua flow).

### 4.3 FateModelHome (list assignment milik model)
```json
{"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//fate_assign","search":"mv◼87544551624342","conditions":"","sortField":"t","sortDir":"desc","groupBy":"ast","groupLabels":"assigned◼Perlu Konfirmasi★scheduled◼Terjadwal★present◼Sedang Berjalan★awaiting◼Menunggu Brand★closed◼Selesai","lead":"initial","title":"<tt>","subtitle":"<bn> · <vn>","meta":"<dt> · <st>–<et>","badgeField":"ast","badgeMap":"assigned◼Konfirmasi!◼warn★scheduled◼Terjadwal◼neutral★present◼On Job◼ok★awaiting◼Menunggu Brand◼warn★closed◼Selesai◼neutral","trailing":"","trailingLabel":"","stats":"","searchFields":"tt◆bn","route":"vertikaTeknoLokaciptaFateModelDetail","routeParams":"assignVid◼{anm}⭘projectVid◼{pn}","text":"Project Kamu◆Assignment dari agency◆project◆Cari project◆Belum ada assignment"}
```

## 5. Catatan stats filter DSL
Format satu kotak: `Label◼filter`. Filter pakai DSL `key◼value⭘key2◼value2` yang SAMA dengan `search`; string kosong setelah `◼` = tanpa filter tambahan (count semua). Separator antar kotak `★`. Contoh: `Model◼★On Job◼ast◼present` = kotak1 "Model" count semua, kotak2 "On Job" count `ast==present`. (Perhatikan: `◼` pertama misahin label dari filter; `◼` berikutnya bagian dari filter DSL — parser split label di `◼` PERTAMA saja.)

## 6. Test checklist
1. 4.1: header + count "2 project", search bar filter judul, tap → detail resolve.
2. 4.2: badge tier bener (awaiting = danger/warna theme), stats 3 kotak count bener, tap push 2 token.
3. 4.3: grouping 5 section sesuai urutan groupLabels, section kosong disembunyikan.
4. Semua field opsional dikosongkan → kartu title-only, tanpa error.
5. Row tanpa key yang dirujuk template → "" (bukan crash).
6. `routeParams` value yang bukan `{token}` (literal) → dipush apa adanya.

## 7. Migrasi (setelah live, bertahap — bukan bagian build ini)
Fate 3 list (ganti panelCard interim) → SuratJalanList/StockHistory (ganti pickerList) → complaint/incident list (opsional, LIST_ITEM_CARD tetap jalan). Tipe list lama TIDAK dihapus.
