# MASTER Handoff — Fitur Patroli & Cleaning (Consteon Widget JSON)

**Tanggal:** 2026-06-02
**Untuk:** Sesi AI baru / dev Flutter. Baca dokumen ini dulu untuk paham keseluruhan fitur sebelum lanjut.
**Owner:** spreadsheet engineer (user, `dev@fungsitama.com`).

---

## 0. TL;DR (baca ini dulu)

Kita konversi fitur **PATROLI & CLEANING** dari UI mockup (`src/App.jsx`) jadi **Consteon widget JSON** (flat-DSL) yang dipakai dev Flutter. Kerja **per layar**, 3 layar, masing-masing punya spec sendiri. Semua spec sudah **SELESAI didraft**; sekarang tahap **testing pakai data dummy** (seed lewat form report-patrol).

3 layar (callback name yang user pakai):

| Callback name | Layar | Spec file | Widget type |
|---|---|---|---|
| **list cost center** | Layar 1 — daftar cost center, tiap kartu = header + 2 panel nav (Kehadiran + Patroli & Cleaning) | `docs/cost-center-card-dev-spec.md` | `LIST_MULTIPLE_PANEL_CARD` (type baru) |
| **list site detail** | Layar 2 — detail Patroli & Cleaning per cost center: tab periode + 3 box statistik + search + kartu titik | `docs/patrol-cleaning-detail-dev-spec.md` | `LIST_STATISTIC_CARD` (type baru) |
| **timeline** | Layar 3 — riwayat kunjungan 1 titik | `docs/patrol-cleaning-timeline-dev-spec.md` | `TIMELINE` (type existing) + `variant: "periodic"` (BARU) |

Alur navigasi: kartu cost center → panel "Patroli & Cleaning" → `patroliCleaningPerSite` (list site detail) → kartu titik → `patroliCleaningPointTimeline` (timeline). Panel "Kehadiran" → `checkinSiteDetail` (alur absensi, belum dispec).

---

## 1. Pembagian kerja (PENTING — jangan dilanggar)

- **User (spreadsheet engineer)** kasih: template tampilan (`text`/`content` di-pack `◆`) + catatan logic. User juga **pegang page wrapper** (app bar/title/back) — itu DI LUAR scope widget.
- **Dev Flutter** kerjain: counting/agregasi + render type/variant baru.
- **User TIDAK mendesain skema storage.** Jangan ngarang nama field storage.

### Konvensi token (dipakai di semua spec)
| Notasi | Arti | Siapa isi |
|---|---|---|
| `<...>` | Field yang **sudah ada di storage** (char-code schema) | system (read langsung) |
| `{...}` | Variable yang **dev hitung / inject** | developer |

### Simbol DSL
`◆` = pemisah baris/multi-doc · `◼` = pemisah field-name↔value & search · `★` = pemisah multi-entry (array) · `⭘` = penanda awal field · `◀N▶` = data kiri (system stream) · `◁N▷` = data kanan (form input field N) · `<no_request>` = ref id auto-inject system.

---

## 2. Widget JSON final per layar

### 2.1 list cost center — `LIST_MULTIPLE_PANEL_CARD`
```json
{
  "type": "LIST_MULTIPLE_PANEL_CARD",
  "ledgerCode": "site",
  "vidtable": "{tablevid}",
  "table": "$test/{tenantVid}//site",
  "search": "",
  "toDo": "",
  "text": "◆<an>◆<sn>◆Cari cost center◆Ketik nama cost center◆Data tidak ditemukan",
  "status": "{ws}",
  "showIcon": "FALSE",
  "showProgress": "FALSE",
  "panels": [
    {"icon": "users", "text": "Kehadiran◆{hadir}/<nm> hadir◆{issues}", "status": "{ps}", "route": "checkinSiteDetail"},
    {"icon": "clipboard-check", "text": "Patroli & Cleaning◆{llCount} titik◆{staleCount} titik jeda lama · terlama {longestGap} jam", "status": "{qs}", "route": "patroliCleaningPerSite"}
  ]
}
```
1 widget = search → ringkasan status → grup status (accordion danger→warn→ok) → kartu (header + strip `{ws}` + 2 panel nav). Sumber: collection `site`, satu doc = satu cost center (`<an>`=cost center name, `<sn>`=site name, `<nm>`, `<av>`/`<sv>`, `<st>`, dan array `ll`=array of objects {ln,li,la,lo,ra}). Pegawai (panel Kehadiran) = collection `workforce` TERPISAH, join via `<av>`.

### 2.2 list site detail — `LIST_STATISTIC_CARD`
```json
{
  "type": "LIST_STATISTIC_CARD",
  "ledgerCode": "event-patrol",
  "vidtable": "{tablevid}",
  "table": "$test/{tenantVid}//site",
  "search": "av◼{ccVid}",
  "conditions": "[[◀av▶◼{ccVid}]]",
  "text": "Cari titik◆Ketik nama titik◆Data tidak ditemukan",
  "period": "24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000",
  "periodDefault": "86400000",
  "stats": "{totalVisits}◆Total kunjungan★{noVisitCount}◆Titik tanpa kunjungan★{typedCount}◆Lokasi diketik",
  "content": "<ln>◆{type}◆Terakhir {lastAgo} · {lastBy}◆{visits} kunjungan dalam {period}",
  "status": "{ps}",
  "badge": "{evidence}",
  "route": "patroliCleaningPointTimeline"
}
```
1 widget = tab periode + 3 box statistik + search + kartu titik (1 kartu = 1 route). Data source = SATU doc `site` (filter `<av>`==`{ccVid}` inject), expand array `ll[]` jadi titik (titik 0-kunjungan harus dari `ll`). Visit = event ledger, join event `lq` == `ll[].li` (fallback `ln`==`ll[].ln` exact match).

### 2.3 timeline — `TIMELINE` variant `periodic`
```json
{
  "type": "TIMELINE",
  "variant": "periodic",
  "flag": "timeline",
  "ledgerCode": "event-patrol",
  "table": "$test/{tenantVid}/event//{eventTable}",
  "search": "ln◼<point>",
  "conditions": "[[◀ln▶◼<point>◁site▷◼<site>]]",
  "period": "24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000",
  "periodDefault": "604800000",
  "title": "<ln>",
  "subtitle": "{type} · {visitCount} Kunjungan Periode Ini",
  "text": "<ts>◆oleh <cn>◆{method}◆<d>",
  "badge": "{evidence}",
  "divider": "{gap}"
}
```
Variant `periodic` = variant general (bukan khusus patrol; variant biasa = `timeline`). Beda dari `timeline`: ada `title`+`subtitle`+`period` tab. `divider` = gap marker "Jeda X jam" (tampil jika ≥ 12 jam). Header ADA di widget (bukan wrapper) buat variant ini.

---

## 3. Konvensi periode & threshold — `label◼offsetMs` (epoch ms offset)

**KEPUTUSAN FINAL (user, 2026-06-02): simpan ms offset, BUKAN keyword `24h`/`today`.**

- Tiap tab = `label◼offsetMs`, `★` antar tab. Dev SATU rumus: `start = now − offsetMs`. `periodDefault` = string offset tab awal.
- Konstanta ms: 24 jam=`86400000`, 7 hari=`604800000`, 30 hari=`2592000000`, 90 hari=`7776000000`.
- **Threshold stale/gap juga ms** biar konsisten: 12 jam = `43200000` (dipakai `{ps}`/`{staleCount}`/gap `divider`).
- Semua count filter event `t` (epoch ms), **JANGAN** `ts` (string display).
- **Trade-off diterima:** semua tab jadi **ROLLING**. Tab kalender ("Hari ini"=midnight, "Minggu ini"=Senin) DI-DROP dari list site detail → jadi rolling "24 jam"/"7 hari". Buat monitoring patroli rolling lebih konsisten. Kalau nanti butuh anchor kalender → balik ke keyword khusus tab itu.
- **Kenapa ms offset:** dev gak perlu kamus resolve keyword + math timezone/kalender. Ini **membalik** rekomendasi awal (keyword) — user pilih kesederhanaan dev.

---

## 4. Kosakata status & evidence

| Status (`{ws}`/`{ps}`/`{qs}`) | warna | label grup/ringkasan | label pill panel |
|---|---|---|---|
| `danger` | merah | Perlu tindak | Perlu tindak |
| `warn` | amber | Perhatian | Perhatian |
| `ok` | hijau | Aman | Beres |

**Evidence (per kunjungan):** ada `<lq>` (QR) → `{evidence}`=strong ("Bukti kuat", hijau), `{method}`="Scan QR + foto". `<lq>` kosong → weak ("GPS saja", amber), `{method}`="Lokasi diketik + foto".

---

## 5. Navigasi (no passParams)

- **TIDAK ada field `passParams`.** Elemen tappable cukup `route` = nama page tujuan.
- Konteks row ke-inject **otomatis** via token (`<request_vid>`, `{docId}`). Page tujuan filter sendiri: `search: "<col>◼<token>"` + `conditions: "[[◀col▶◼<token>]]"`.
- Multi elemen tappable dalam 1 widget = array (`panels`/`children`), tiap item punya `route` sendiri.

---

## 6. TESTING — seed data dummy lewat form report-patrol

⚠️ **UPDATE (2026-06-03, real Firebase):** doc `site` cost center (`84214220504259//site`, vid `83674161979544`) **SUDAH ADA** — `an`/`sn`/`nm`/`st` terisi + array `ll` (array of objects {ln,li,la,lo,ra}). Jadi **doc-2 (workforce master) OBSOLETE** — gak usah seed lagi. Cuma perlu seed **EVENT (doc-1)** biar kunjungan keliatan. 1 submit = **1 insert** event.

### addToEvent (copy ke RBT `addToEvent` form report-patrol)
```
$test/84214220504259//event⭘r◼4320⭘tablevid◼20342033315492⭘fc◼report-patrol⭘ty◼report-patrol⭘p◼vertikaTeknoLokaciptaReportPatrol⭘t◼◀2|T7|epoch▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm▶⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘av◼83674161979544⭘an◼A Product Group⭘sv◼83674161979544⭘sn◼S Product Group⭘ln◼◁11▷⭘lq◼◁5▷⭘d◼◁10▷⭘i◼◁3▷
```

### Nilai dummy tenant/cc/site (real)
| Item | Value |
|---|---|
| tenant vid | `84214220504259` |
| tenant nama | Vertika Tekno Lokacipta |
| cost center vid (`av`) | `83674161979544` |
| cost center nama (`an`) | A Product Group |
| site vid (`sv`) | `83674161979544` |
| site nama (`sn`) | S Product Group |
| titik (`ll[]`) | array of objects di doc `site`; join event via `lq`==`ll[].li` |

### Mapping posisi form (dari addToTable + displayList `content`)
- pos `◁5▷` = QR mentah hasil scan → `lq` (HARUS == salah satu `ll[].li` real biar nyambung ke titik).
- pos `◁11▷` = nama lokasi resolved → `ln` (set `"locationNamePosition":"11"` di txf qrScan, ganti placeholder `[LOCATIONNAMEPOSITION]`).
- pos `◁10▷` = Keterangan → `d`. pos `◁3▷` = images → `i`. pos `◁12▷` = RDO kondisi lapangan.

### Field event yang DIBENERIN vs form lama
`t` (epoch, REQUIRED+window/gap), `ln`, `lq`, `av` = **ditambah** (sebelumnya hilang). `an` diperbaiki jadi nama cost center ("A Product Group", dulu keisi VID). `sn`/`sv` diperbaiki jadi literal site nama/vid (dulu salah `◁5▷`/`◁11▷`).

### Sumber data per layar
| Layar | Baca | Perlu seed? |
|---|---|---|
| timeline | event doang | seed event |
| list site detail | doc `site` (`ll[]`) + event | doc `site` udah ada → seed event aja |
| list cost center | doc `site` (`an`/`sn`/`nm`/`ll`) + `workforce` (kehadiran) | doc `site` udah ada → seed event (+ workforce kalau mau test panel Kehadiran) |

### Caveat testing
- **Doc `site` udah ada** → JANGAN insert ulang (nanti dobel). Cukup seed EVENT.
- **`lq` event WAJIB match `ll[].li`** dari doc site real biar kunjungan masuk ke titik yang bener. Ambil `li` real dari doc, jangan ngarang.
- **`ty` konsisten:** form nulis `ty◼report-patrol`; read-side 3 layar HARUS filter `ty◼report-patrol` (bukan `patrol`).
- **Panel Kehadiran** (list cost center) baca collection `workforce` TERPISAH — kalau mau test panel itu, seed doc workforce (pegawai) sendiri; gak perlu buat patroli/cleaning.

---

## 7. Open TODO / pertanyaan dev (lintas spec)

1. Render 2 type baru (`LIST_MULTIPLE_PANEL_CARD`, `LIST_STATISTIC_CARD`) + variant `periodic` di `TIMELINE`.
2. `{type}` (kategori titik PATROLI/CLEANING) — sumber dari `ll` atau derive dari `ty` event? (belum diputus)
3. ✅ RESOLVED (real data): `<an>`=cost center name ("A Product Group"), `<sn>`=site name ("S Product Group").
4. Token inject konteks (analog `<request_vid>`) — nama final buat filter titik+site di timeline & cost-center→detail.
5. Threshold stale/gap (`43200000` ms) — taruh di mana biar configurable.
6. `{llCount}` = `ll.length` — token/syntax frontend-nya apa.

---

## 8. Index file & sumber

**Spec:** `docs/cost-center-card-dev-spec.md` · `docs/patrol-cleaning-detail-dev-spec.md` · `docs/patrol-cleaning-timeline-dev-spec.md`
**Sumber UI (read-only):** `src/App.jsx` — `SiteCard`/`SiteSubPanel` (L339–409), `ScreenPatrol`/`SummaryNum`/`PointRow` (L769–856), `ScreenTimeline`/`RANGES` (L861–963), `POINTS_BY_SITE`/`VISITS` (L114–134), `EvidenceBadge` (L139).
**DSL guide:** `file/addToEvent guide.txt` (keyed char-code, multi-doc `◆`).
**Form testing:** versi form report-patrol (txf qrScan + RDO + GET_IMAGES + RBT addToTable/addToEvent). Catatan: `json/report-patrol.json` di repo = versi `displayList` (list), BUKAN versi form.
**Whiteboard skema:** `Pictures\WhatsApp Image 2026-06-01 at 11.15.10 AM.jpeg` (event char-code + workforce schema).

---

## 9. Pattern currency — JANGAN salah (warning)

- `displayList` = **LAMA/outdated**. List single-route current = `LIST_ITEM_CARD`. Composite screen = type dedicated baru (lihat di atas).
- `json/checkin-per-site.json` = **outdated**. Field canonical ambil dari `json/list-item-card.json`, `json/report-incident-log.json`, `json/detail.json`, `json/rbt.json`.
- **NO `passParams`** (sec. 5). Nav lewat token inject.
- User prefer **type dedicated per layar composite** daripada LIST_ITEM_CARD+flag — TAPI jangan rename type yang sama berulang.
- Period = **ms offset** (sec. 3), bukan keyword. Threshold = ms.

---

## Appendix A — Riwayat keputusan & approach yang DITOLAK (biar AI ga ngulang salah)

Ini jejak proses (2026-06-02). AI baru: baca biar gak ngusulin approach yang udah ditolak.

| Topik | Awal/salah (ditolak) | FINAL | Kenapa |
|---|---|---|---|
| Widget list | `displayList` | `LIST_ITEM_CARD` (single-route) / type baru (composite) | `displayList` = LAMA. User: "biasanya pake LIST_ITEM_CARD bukan displayList (ini yang lama)". |
| Cost-center card | `displayList`→`cardMultiPanel`→`children` array di LIST_ITEM_CARD | type baru `LIST_MULTIPLE_PANEL_CARD` + array `panels` | Canonical LIST_ITEM_CARD = strict 1 card=1 route; butuh N panel nav → type dedicated. (AI churn nama 3x sebelum landing — JANGAN ulang.) |
| Detail screen | fold ke `LIST_ITEM_CARD` + feature flag (`period`/`stats`/`badge`) | type baru `LIST_STATISTIC_CARD` | User: "tetep bikin baru deh kayanya". User prefer type dedicated per layar composite. |
| Entity layar 1 | dilabel "Site" | "Cost center" | User: "bukan site, tapi cost center. mockup salah". |
| Timeline | reuse `TIMELINE` variant `timeline` apa adanya | `TIMELINE` variant baru `periodic` (+title/subtitle/period) | User mau fokus seperti mockup (title+subtitle+periode). Beda layout = variant baru. |
| Nama variant | `patrolVisit` | `periodic` | User mau nama general (variant ini umum, kebetulan dipake report visit). |
| Period config | label+timestamp (instinct) → label◼code keyword (validated) → **label◼offsetMs ms** | `label◼offsetMs` (ms offset) | User minta epoch biar gampang dev. Reversal dari keyword; trade: tab kalender di-drop jadi rolling. |
| Navigasi | invent `passParams`/`peekTailRoute`/`stripByStatus`/`filterTarget` | TIDAK ada — token inject otomatis (`<request_vid>`/`{docId}`) + `route` | Field-field itu gak ada di pattern live. User: "kasih field mirip pattern biasa". |
| Seed test data | form addToEvent cuma punya field Event (kurang `t`/`ln`/`lq`/`av`, `an` keisi VID) → 2-doc (event + workforce) | **1-doc EVENT aja** (field dibenerin) | Revisi 2026-06-03: doc `site` real SUDAH ADA (`an`/`sn`/`nm`/`ll` of objects). Doc-2 workforce master OBSOLETE. `lq` event harus match `ll[].li` real. |

**Pelajaran utama buat AI:** (1) Kalau render genuinely gak ada → usulin type/variant BARU yang bersih, jangan overload type lain. (2) Tapi pilih nama SEKALI, jangan rename berulang. (3) Pakai field name dari pattern live (`json/list-item-card.json`, `json/report-incident-log.json`, dll), jangan ngarang prop. (4) User pegang keputusan final — kalau dia override rekomendasi, ikutin + catat alasannya.

---

## Appendix B — Field dictionary (char-code) `addToEvent`

`<>` = field storage (read langsung). Char-code dipakai di `addToEvent` (keyed, sparse, append-only). Required tiap doc: `r`, `ty`, `t`, `ts`.

**Meta:** `r` retention(menit, REQ) · `fc` ledger code · `tablevid` collection VID · `p` page ref(B) · `et` event time(A) · `ld` ledger ref(D) · `ev` event ref(C).
**Content:** `ty` type(REQ) · `t` epoch ms(REQ) · `ts` time string(REQ) · `ln` location name · `lq` QR id · `i` image url · `d` description · `cv` creator VID(user) · `cn` creator name · `av` cost center VID · `an` cost center name · `sv` site VID · `sn` site name · `cl` checklist · `rf` ref id (bridge ke main table/approval chain; `<no_request>`=auto, `◁N▷`=form, literal, atau omit).
**Route/tenant:** `tv` tenant VID · `tn` tenant name · `st` status · `nm` number. (Catatan: di doc `site` real, `ll` = array of objects — lihat baris "Doc `site`" di bawah, BUKAN string `★`.)
**Workforce (per-pegawai, collection `workforce` TERPISAH):** `VID` id pegawai · `n` name · `ci` clock in · `co` clock out · `is` in string · `os` out string · `st` status · `ta` task (rename dari `t` — `t` reserved buat timestamp). Join ke cost center via `av`/`sv`.

**Doc `site` (real, collection `//site`, 1 doc = 1 cost center):** `an` cost center name ("A Product Group") · `sn` site name ("S Product Group") · `av` cost center VID · `sv` site VID · `nm` headcount needed · `st` status ("active") · `af`/`sf` slug ("vtl◆product-group") · `en` blob terenkripsi (jangan render) · **`ll` = ARRAY OF OBJECTS**, tiap titik `{ ln nama titik, li id/QR (==event lq), la lat, lo lng, ra radius }`.

**Token timestamp:** `◀2|T7|epoch▶` (epoch ms) · `◀2|T7|Ddd MMM yyyy HH:mm▶` (formatted). `T7` = timezone Asia/Jakarta UTC+7. Multi-doc pisah `◆`.

---

## Appendix C — LIST_ITEM_CARD canonical (referensi currency)

List single-route current (BUKAN `displayList`). Contoh: `json/list-item-card.json`, `json/report-incident-log.json`.

- **Field:** `type`, `ledgerCode`, `vidtable`, `table`, `search`, `conditions`, `toDo` (filter-tab string `[SEMUA, MENUNGGU, ...]`), `role`, `flag`, `text` (semua di-pack `◆`; TIDAK ada `content` terpisah), `route` (SINGLE), `showIcon`, `showProgress`.
- **Urutan slot `text` (canonical):** `title◆<field>◆<field>◆<field>◆searchLabel◆searchHint◆emptyStateText◆<field>◆fallbackText`. Leading `◆` = slot judul kosong (judul di app bar). User pegang packing ini.
- **`buttons` array = ACTION** (`actions` DSL + `chain` DO_DIALOG, mis. savesend/status-change) — BUKAN nav. (Nav multi-tujuan = `panels` di LIST_MULTIPLE_PANEL_CARD.)
- **Filter event:** pakai `t` (epoch), JANGAN `ts` (display string).
