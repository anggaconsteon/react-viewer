# DETAIL_CARD — Universal Detail Widget (Dev Spec)

Tanggal: 2026-07-15 · Status: PROPOSED · Pasangan: `docs/list-card-universal-dev-spec.md` (LIST_CARD)
Build bareng LIST_CARD — satu paket "reader universal".

---

## 1. Kenapa

Detail page sekarang cuma punya 2 pilihan: `ITEM_CARD_DETAIL` (positional-only — cuma bisa coll indexed model request) dan `WORKSPACE_HEADER` (keyed tapi cuma id/title/address). Akibat live: detail fate (AssignDetail/ModelDetail) TIDAK menampilkan brand/venue/tanggal/jam/hadir/selesai/selfie — datanya ada di doc, widgetnya gak ada. DETAIL_CARD = kartu detail keyed generik: title + badge + KV rows + galeri foto, config-driven penuh.

## 2. Anatomi

```
┌────────────────────────────────────────┐
│ TITLE                        [BADGE]   │
│ subtitle                               │
│ ───────────────────────────────────    │
│ Label 1        nilai templated         │  ← KV rows (N baris, config)
│ Label 2        nilai templated         │
│ Label 3        nilai templated         │
│ ───────────────────────────────────    │
│ [foto] [foto]                          │  ← galeri (opsional, url dari field)
│ caption foto                           │
└────────────────────────────────────────┘
```
Read-only murni. Tombol/aksi TIDAK di sini (tetap RBT/workflow* terpisah di bawahnya — pola existing).

## 3. Kontrak field

```json
{
  "type": "DETAIL_CARD",
  "vidtable": "[VIDTABLE]",
  "table": "[TABLE]",
  "search": "[SEARCH]",            // resolve 1 doc: key◼{token}, mis. anm◼{assignVid}
  "title": "[TITLE]",              // template <field>+literal
  "subtitle": "[SUBTITLE]",        // template; kosong = hide
  "badgeField": "[BADGEFIELD]",    // + badgeMap value◼Label◼tier★… (tier danger|warn|ok|neutral, warna THEME)
  "badgeMap": "[BADGEMAP]",
  "rows": "[ROWS]",                // Label◼template★Label2◼template2★… ; template hasil "" → baris disembunyikan (hideEmpty)
  "hideEmptyRows": "[HIDEEMPTY]",  // TRUE (default) | FALSE (tampil "-")
  "images": "[IMAGES]",            // template field url, ◆-sep: "<ai>◆<ci>" — url kosong di-skip; kosong total = galeri hilang
  "imageLabels": "[IMAGELABELS]",  // caption per slot, ◆-sep: "Selfie hadir◆Selfie selesai"
  "text": "[TEXT]"                 // label statis: notFoundText (doc gak ketemu)
}
```

Aturan renderer (sama dengan LIST_CARD):
1. Keyed reader, `<field>` lookup by key; field absen → "" (row auto-hide kalau hideEmptyRows).
2. Label statis dari config, tier badge → warna theme.
3. Search value pakai token route/session (`{assignVid}` dsb) — resolusi sama WORKSPACE_HEADER.
4. Numeric coercion di `search` (bug docs/list-search-numeric-type-dev-spec.md JANGAN diwarisi).
5. Coll indexed juga kebaca (`<15>` = key "15") — bisa gantikan ITEM_CARD_DETAIL bertahap, tanpa hapus tipe lama.

## 4. Contoh resolved — FateAssignDetail (kasus live yang sekarang buta data)

```json
{"type":"DETAIL_CARD","vidtable":"20342033315492","table":"84214220504259//fate_assign","search":"anm◼{assignVid}","title":"<mnn>","subtitle":"<tt> · <bn>","badgeField":"ast","badgeMap":"assigned◼Menunggu Konfirmasi◼warn★scheduled◼Terjadwal◼neutral★present◼On Job◼ok★awaiting◼Selisih — Perlu Tindak◼danger★closed◼Selesai◼neutral","rows":"Venue◼<vn>★Tanggal◼<dt>★Jam kerja◼<st>–<et>★Lapor hadir◼<arr>★Lapor selesai◼<cmp>★Selisih◼<ovm> menit★Status selisih◼<ss>★Catatan brand◼<scn>","hideEmptyRows":"TRUE","images":"<ai>◆<ci>","imageLabels":"Selfie hadir◆Selfie selesai","text":"Data tidak ditemukan"}
```
Acceptance data live: `{assignVid}` dari list → kartu menampilkan Autsorz ID / Photoshoot · Wardah / badge "Menunggu Konfirmasi" / rows BSD Eternity, 5 Jul, 09:00–17:00; arr/cmp/ovm/ss/scn kosong = baris hilang; setelah lapor hadir → foto selfie muncul.

## 5. Test checklist
1. Contoh §4 render lengkap; row kosong hilang; foto muncul setelah field terisi.
2. Doc tidak ketemu → notFoundText, bukan crash.
3. Badge tier warna theme.
4. Search numeric field (mis. vid angka) → tetap match (coercion).
5. Semua opsional dikosongkan → kartu title-only.

## 6. Pemakaian setelah live
Fate: ProjectDetail (+DETAIL_CARD project), AssignDetail & ModelDetail (contoh §4 + variasi) — gantiin kekosongan data detail. Berikutnya: sales detail, complaint/incident detail (opsional, migrasi santai).
