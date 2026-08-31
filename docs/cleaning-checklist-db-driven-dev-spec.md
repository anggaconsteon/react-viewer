# Cleaning Checklist — DB-driven (scan QR → task dari database) — dev spec

Tanggal: 2026-08-20 · Status: PROPOSED (hasil brainstorming) · Tenant contoh: `84214220504259`

Supersedes bertahap: 5 page checklist statik (`vertikaTeknoLokaciptaCleaning{Restroom,Pantry,PublicArea,WorkArea,Outdoor}`).

---

## 1. Kenapa

Sekarang task checklist **baked di page** — 5 page beda per kategori, tiap task = 1 widget `TASKLIST` statik. Nambah/ubah task = ngedit page. Gak multi-tenant (tiap tenant butuh page sendiri).

Target: task **ditarik dari database** by kategori. Scan QR lokasi → app tau template kategori-nya → render task dari DB. Nambah task = tambah baris di sheet admin, page gak disentuh. Multi-tenant gratis (collection tenant-prefixed).

## 2. Model data

Tiga lapis. Lokasi = punya sistem (baca aja). Kita cuma punya **mapping kategori** + **template task**.

```
//location  (SISTEM, existing)        ← LID/lk/koordinat/nama, di-sync sistem, NO kategori. Kita READ.
      │  lk = LID + sv (LID gak unik antar cost-center → dibikin unik pake +site-vid)
      ▼
//checklist_map  (BARU, kita seed)    ← lk → template   (1 lokasi = 1 template)
//checklist_template (BARU, kita seed)← template → task  (1 template = N task; banyak lokasi share)
```

Relasi tasklist ke lokasi **lewat `template`** (per-kategori), BUKAN per-`lk`. Banyak lokasi nunjuk 1 template.

### 2.1 `//checklist_template` — doc per task

```json
{ "ord": 1, "tmp": "Restroom", "tsk": "Sapu & pel lantai" }
```
> **Field code LIVE DB** (owner set manual): `ord`=order, `tmp`=template, `tsk`=task. `tablevid`/`r` DIDROP owner (tenancy dari prefix collection). Seed sheet header `template|order|task` tetap human-readable; sync map ke `tmp|ord|tsk`.

- **`template`** = key kategori. Kanonik = ikut nilai kolom `Checklist` di Tab Location (PAKAI SPASI): `Restroom`, `Pantry`, `Work Area`, `Public Area`, `Outdoor`.
- **`order`** = urutan tampil.
- **`task`** = nama task (teks yg tampil).
- Opsi status **standar** (Selesai / Tidak Tersedia / Dilewati / Masalah) → **baked di widget**, TIDAK per-task.

### 2.2 `//checklist_map` — doc per lokasi

```json
{ "li": "0lefc05...371d8", "lk": "0lefc05...371d8-83674161979544", "ln": "BSD Tech Center #18", "tmp": "Restroom" }
```
> **Field code LIVE DB**: `li`=LID, `lk`=LID-siteVID (key), `ln`=nama lokasi, `tmp`=template. Scanner match `lk◼{...}`, ambil `tmp`.

- **`lk`** = `LID` + `sv` (site vid). Key unik lokasi.
- **`template`** = template yg di-assign admin (dropdown, controlled → gak typo).
- Di-seed dari kolom `Checklist` Tab Location. TIDAK nempel ke `//location` (sistem gak nampung kategori).

## 3. Seed di spreadsheet (admin-editable)

### Tab `Location` (existing, di sheet Induk # Admin)
- Baris lokasi keisi OTOMATIS oleh sistem (LID, koordinat, nama).
- Admin cuma isi kolom **`Checklist`** = dropdown template (`Restroom`/`Pantry`/`Work Area`/`Public Area`/`Outdoor`).
- Kolom `Checklist` (+ `lk`) → sync ke `//checklist_map`. Kolom lain = milik sistem, gak disentuh.

### Tab `Checklist` (BARU, di sheet Induk # Admin) — long format
| template | order | task |
|---|---|---|
| Restroom | 1 | Sapu & pel lantai |
| Restroom | 2 | Sikat kloset & urinoir |
| Restroom | 3 | Bersihkan wastafel & cermin |
| Restroom | 4 | Isi ulang sabun & tisu |
| Restroom | 5 | Buang sampah & ganti liner |
| Restroom | 6 | Semprot pengharum |
| Pantry | 1 | Lap meja & kursi |
| Pantry | 2 | Cuci & rapikan peralatan |
| Pantry | 3 | Bersihkan sink & keran |
| Pantry | 4 | Lap pintu kulkas & dispenser |
| Pantry | 5 | Buang sampah & ganti liner |
| Public Area | 1 | Sapu & pel lantai lobi |
| Public Area | 2 | Lap meja resepsionis |
| Public Area | 3 | Bersihkan kaca pintu & lift |
| Public Area | 4 | Rapikan sofa & majalah |
| Public Area | 5 | Buang sampah |
| Work Area | 1 | Rapikan meja kerja |
| Work Area | 2 | Lap peralatan kantor |
| Work Area | 3 | Bersihkan papan tulis |
| Work Area | 4 | Buang sampah |
| Outdoor | 1 | Sapu area outdoor |
| Outdoor | 2 | Bersihkan saluran air |
| Outdoor | 3 | Rapikan pot & tanaman |
| Outdoor | 4 | Buang sampah outdoor |

(= task op1Screen sekarang, 1:1.) 1 baris = 1 task = 1 doc. Nambah task = tambah baris.

## 4. Runtime flow

```
[Beranda] widget `scanner`
   → scan QR → LID
   → resolve: //checklist_map[ lk = LID + {sv sesi} ] → template   (+ //location[lk] → nama/koordinat)
   → route "Form Awal" + routeParams: template◼{template}⭘lk◼{lk}⭘lt◼{nama}
[Form Awal] foto awal + create visit (bawa template/lk/lt/foto)   ← scanner GANTIIN lqr + grid kategori manual
   → (worker kerja)
[Form Akhir] widget CHECKLIST_DINAMIS baca task by {template} → render → foto akhir → close
[Ringkasan] before/after (udah ada)
```

- `scanner` (Widget row 199) **udah ada** — reuse. Field kepake: `qr`, `table`, `search`, `route`, `routeParams`.
- 5 page Form Akhir statik → **1 page dinamis** (task ditentuin `{template}` routeParam).
- `cat` di doc visit = nilai `template` (spasi). Downstream (Beranda group, Ringkasan) nyesuain ke bentuk spasi.

## 5. Widget BARU — `checklistDynamic` (satu-satunya yg dibangun)

Mirror `TASKLIST` sekarang (tampilan + 4 opsi status IDENTIK), beda: task dari collection, jumlah dinamis.

### Referensi — `TASKLIST` statik sekarang (1 task = 1 widget)
```json
{"type":"TASKLIST","position":12,"width":"100","height":40,"borderRadius":10,"category":"","margin":"0,5,0,0",
 "text":"Sapu & pel lantai◆Selesai◆Tidak tersedia di area ini◆Dilewati - Kunjungi kembali nanti◆Masalah - jelaskan dalam laporan.",
 "options":"✓◆Selesai◆Tandai Selesai◆✖◆Tidak Tersedia◆Barang tidak ada di area ini◆>◆Dilewati◆Kembali lagi nanti"}
```
`text` = `namaTask◆label4status`. `options` = `ikon◆label◆desc` per status. Hasil disimpan `ck<position>` = `"namaTask|status"`.

### Contract widget baru
```json
{
  "type": "CHECKLIST_DYNAMIC",
  "vidtable": "20342033315492",
  "table": "84214220504259//checklist_template",
  "search": "tmp◼{template}",           // field DB = tmp; {template} dari routeParam scan
  "sortField": "ord",
  "taskField": "tsk",                   // field DB nama task
  "width": "100", "height": 40, "borderRadius": 10, "margin": "0,5,0,0",
  "text": "◆Selesai◆Tidak tersedia di area ini◆Dilewati - Kunjungi kembali nanti◆Masalah - jelaskan dalam laporan.",
  "options": "✓◆Selesai◆Tandai Selesai◆✖◆Tidak Tersedia◆Barang tidak ada di area ini◆>◆Dilewati◆Kembali lagi nanti",
  "output": "ck"                        // field hasil di doc visit
}
```

### Kelakuan renderer
1. Query `table` where `search` (template = routeParam), sort `sortField`.
2. Tiap doc → render 1 baris TASKLIST (nama task = `<taskField>`, 4 tombol status dari `options`) — persis TASKLIST sekarang.
3. `text` sama kaya TASKLIST tapi **tanpa nama task di depan** (nama diambil dari doc, bukan config) — segmen `◆`-nya = label 4 status doang.
4. Progress bar (jumlah selesai / total) opsional — total = jumlah doc (dinamis).
5. **Capture hasil → PER-FIELD (1 task = 1 field).** ⚠️ REVISI 08-21 (setelah test device):
   Key = `<output>` + `<ord>` → `ck1`, `ck2`, … `ckN`. Value = `"<task> | <status>"` (**spasi-pipe-spasi**).
   ```
   ck1: "Sapu & pel lantai | Selesai"
   ck2: "Sikat kloset & urinoir | Selesai"
   ck3: "Bersihkan wastafel & cermin | Tidak Tersedia"
   ```
   Renderer **emit N field langsung ke payload submit (direct-output)**, `output` = PREFIX (bukan 1 field gabungan).
   **Sejarah:** versi awal renderer nulis 1 field gabungan `ck="task|status~task|status~…"` (pisah task↔status `|`, antar task `~`). LIVE + kerja, TAPI owner nolak — susah mapping per-item. Diubah jadi per-field (mirror static `ck12..ck17` dulu, tapi key by `ord`).
   **Config nyesuain (ship BARENG renderer):** tombol tutup DROP `ck◼◁12▷`; widget nyumbang `ck1..ckN` sendiri. Config-ahead → JANGAN drop sebelum renderer per-field siap (ntar `ck` kosong).

Laporan self-describing: hasil bawa teks task + status → walau template diedit nanti, laporan lama gak berubah (gak perlu snapshot).

## 6. Sync seed → Firestore
- Tab `Checklist` → `//checklist_template` (1 baris = 1 doc).
- Kolom `Checklist` Tab Location → `//checklist_map` (key `lk`).
- Mekanisme sync = ikut pipeline seed existing (dev/backend). **[VERIFY]** apakah pipeline sekarang bisa sync tab baru + kolom terpisah ke collection beda dari `//location`.

## 7. Open items / dev notes
1. **[VERIFY] `search` composite `lk`** — scanner nyusun `lk = {qr}(LID) + {sv}(sesi)`. Cek token DSL scanner dukung gabungin scan-value + session sv (mis. `search:"lk◼{qr}-{sv}"`). Kalau belum → tambah.
2. **[VERIFY] renderer** — `CHECKLIST_DYNAMIC` = tipe baru, butuh build Flutter (TASKLIST statik gak bisa data-driven). Config-ahead → JANGAN taruh di page live sebelum renderer siap (widget bakal DROP).
3. **Nama kanonik template** — pilih bentuk SPASI (`Work Area`) di SEMUA (Tab Location dropdown, Tab Checklist, doc visit `cat`). Samain `cat` op1Screen yg sekarang `WorkArea`/`PublicArea`.
4. **Result serialization — PER-FIELD `ckN` (§5.5, REVISI 08-21).** 1 task = 1 field `ck<ord>` value `"task | status"`. BUKAN 1 field gabungan (versi awal ditolak owner). Renderer direct-output N field.
5. **Retention `r`** pada `//checklist_template` — template = master data, retensi panjang / gak expire.
6. **Ringkasan Kunjungan (DETAIL_CARD) — 3 perubahan renderer** → `docs/detail-card-summary-renderer-handoff.md` (task=judul/status=nilai via param `rowSplit` UI 2-kolom, foto awal/akhir kepisah `images2`, per-slot). Config LIVE, nunggu renderer.
7. **LogChecklist (displayList) — param `rowSplit`** → `docs/logchecklist-displaylist-rowsplit-handoff.md` (split `task|status` jadi header+value, UI **stacked** judul-atas/value-bawah; opt-in default OFF). Config LIVE D1619, nunggu renderer.

## 8. Migrasi
- Fase 1: build `CHECKLIST_DYNAMIC` + seed 2 tab + sync.
- Fase 2: 1 page Form Akhir dinamis pakai widget baru; scanner di Form Awal (gantiin lqr+grid).
- Fase 3: 5 page statik di-pensiun (jangan dihapus dulu — fallback).
