# SIGNAL_LIST — kartu sinyal generic (obligation-at-risk) via `text` ◆-posisi (Dev Spec)

**Tanggal:** 2026-08-06
**Buat:** dev Flutter (renderer — type baru `SIGNAL_LIST`) · builder op1Screen (config)
**Status:** PROPOSED — **REV2 2026-08-06 (align handoff `docs/reorder-cache-pending-handoff.md` + design APPROVED).** Widget WAJIB dukung **aging-compute** — server (`reorder_cache`) simpan **`lo`** (epoch order-terakhir) + **`cad`** (cadence) STABIL; **widget hitung `ds`/`st` pas render** (renderer-aging, NOL cron). Lihat §3.3. **v1: `never_ordered` CUT** (lo kosong → skip kartu). Type BARU. **Kontrak field CF final: `rc`/`cn`/`cp`/`lo`/`cad` (BUKAN last_at/cd — cd=condition).**
**Konteks / Konsumen pertama:** Reorder Radar delivery (galon) — `op1Screen!vertikaTeknoLokaciptaReorderRadar` (@~1307). Konsumen ke-2 antre: Service AC (aset perlu servis / reorder). Doktrin: `src/component/Reorder_Signal_Doctrine.md`, mockup `src/component/ReorderRadar.jsx`.
**Referensi:** `feedback_config_driven_labels` (label ◆-index), `project_reorder_radar`, LIST_ACTION_CARD (sibling), `timeline-ledger-variant-dev-spec.md`.

---

## 1. Kenapa

Butuh kartu **sinyal** (customer/aset yang "berisiko" → picu follow-up) yang **generic lintas-case**: sekarang Reorder galon, nanti AC (unit perlu servis), besok apa pun yang "obligation-at-risk". **Keputusan user 2026-08-06 (terkunci):**
1. **1 widget generic**, bukan per-case (jangan galon-only).
2. **JSON RINGKAS** — semua label (title/subtitle/metric/meta/action/empty/hint) digabung ke **1 field `text`**, dipisah `◆` **by-posisi** (index → peran). Bukan 8 field terpisah. Konsisten pola `feedback_config_driven_labels` (renderer baca label by index).
3. Nol hardcode string di Flutter — semua dari `text`.

## 2. Konsep

`SIGNAL_LIST` = list kartu sinyal. Renderer baca `table`+`search`+`sort` → tiap row = 1 kartu. **Semua teks kartu dari 1 field `text` (◆-split, posisi tetap)**; token `<field>` di tiap segmen di-resolve per-row. Status badge dari `statusField`+`statusMap` (amber-only). Tap kartu → `route` (detail, tempat aksi follow-up/atur beneran). Opsional: **mini-timeline** (deretan gap-dot + marker "N hari") kalau `gapsField`/`markerField` diisi. **Silence=success**: yang gak match `search` gak nongol.

## 3. Kontrak field

```jsonc
{
  "type": "SIGNAL_LIST",
  "vidtable": "20342033315492",
  "table": "<tenant>//<coll>",
  "search": "fs◼none",            // filter actionable (DSL biasa)
  "sort": "ds◼desc",              // field◼asc/desc
  "groupField": "st",             // opsional: grup kartu per nilai field (section). "" = flat
  "statusField": "st",            // field sumber badge
  "statusMap": "dormant◼Lama menghilang◼warn★overdue◼Telat◼warn",  // value◼label◼tone (★-list)
  "gapsField": "gaps",            // opsional: field ARRAY jeda (mini-timeline). "" = no timeline
  "markerField": "ds",           // opsional: field angka marker ("N hari"). pair sama gapsField
  "route": "<detailRoute>",       // tap kartu → detail
  "routeParams": "rc◼{rc}",       // token → dest
  "text": "<title>◆<subtitle>◆<metric>◆<meta>◆<actionLabel>◆<emptyText>◆<searchHint>◆<listTitle>"
}
```

| Field | Isi | Wajib |
|---|---|---|
| `type` | `SIGNAL_LIST` | ✓ |
| `vidtable`/`table`/`search` | sumber + filter (row = kartu) | ✓ |
| `sort` | `field◼asc/desc` | — (default no-sort) |
| `groupField` | grup kartu per nilai (section header pakai `statusMap` label) | — (kosong=flat) |
| `statusField` + `statusMap` | badge: `value◼label◼tone★…`, tone ∈ `warn`/`ok`/`neutral`/`accent`. **DOKTRIN: JANGAN `danger`/merah** — sinyal operasional = amber (`warn`) | ✓ |
| `gapsField` + `markerField` | **mini-timeline** (§3.2): `gapsField`=array jeda antar-event, `markerField`=angka "belum" terakhir. Dua-duanya kosong → timeline gak dirender | — |
| `route` + `routeParams` | tap kartu → detail (tempat aksi beneran) | — (kosong=non-nav) |
| `text` | 8 segmen ◆ (§3.1) — **satu-satunya sumber semua label** | ✓ |

### 3.1 `text` — 8 segmen ◆ (INI inti-nya: 1 field, posisi tetap)

Renderer split `text` by `◆`, baca **by index**. Segmen 1-5 = per-kartu (boleh `<field>` token, resolve per-row). Segmen 6-8 = level-list (literal).

| # | Peran | Contoh | Token? |
|---|---|---|---|
| 1 | **title** kartu | `<cn>` | ya (field) |
| 2 | **subtitle** | `<ct>` | ya |
| 3 | **metric** (baris besar/tebal) | `<ds> hari belum order` | ya (literal+field) |
| 4 | **meta** (baris kecil) | `biasa tiap <cd> hari` | ya |
| 5 | **actionLabel** (tombol) | `Follow up` | literal |
| 6 | **emptyText** (list kosong) | `Semua dalam ritme — aman` | literal |
| 7 | **searchHint** | `Cari nama` | literal |
| 8 | **listTitle** (header seksi, opsional) | `Radar Reorder` | literal |

Segmen kosong = fitur off (mis. segmen 8 kosong → no list title). Token `<field>` gak ada nilainya → dibiarkan literal (pola existing).

### 3.2 Mini-timeline (sub-elemen opsional)

Kalau `gapsField`+`markerField` diisi: render deret **dot kecil** (tiap jeda di array `gaps`, label `Nh`) → **dot solid** (last event) → **garis putus warna badge** → marker `<markerField> hari` + dot outline. = viz "ritme + jeda sekarang" (mockup MiniTimeline). Warna garis/marker = tone dari `statusMap`. Kalau kosong → skip (kartu tetap valid tanpa timeline). **v1 mini-timeline = DEFER** (butuh histori order di doc; design 2026-08-06 potong dari v1).

### 3.3 Aging-compute — widget HITUNG `ds`/`st` (renderer-aging, NOL cron) ⭐

**Kunci design (final 2026-08-06):** server (`reorder_cache`) simpan **`lo`** (epoch ms order-terakhir) + **`cad`** (cadence) — STABIL, cuma berubah pas ada aktivitas. `ds`/`st` **TIDAK** disimpan server. **Widget hitung sendiri pas render** (field `lo`/`cad` = default galon; generic lewat config key):

```
cadDays = cad × (cadenceUnit == "bulan" ? 30 : 1)      // unit → hari
ds = floor((now() − lo) / 86400000)                     // hari sejak order terakhir
st = tier(ds, cadDays, attentionFraction, dormantMultiplier):
     ds ≤ cadDays × attFraction   → "fresh"       (silence — bisa di-hide via search/statusMap)
     ds ≤ cadDays                 → "approaching"
     ds ≤ cadDays × dormantMult   → "overdue"
     ds >  cadDays × dormantMult  → "dormant"
```

**`lo` kosong → kartu di-SKIP** (`never_ordered` = **CUT v1**, per handoff §4; CF cuma bikin doc buat customer yg PERNAH aktivitas). Jangan render tier "never".

Field aging (di config widget):

| field | isi | default |
|---|---|---|
| `agingTimeField` | nama field epoch order-terakhir (galon: `lo`). **DIISI = mode aging nyala** (widget hitung ds/st); kosong = display-only (backward-compat, pemakaian lama gak berubah) | — |
| `cadenceField` | nama field cadence (galon: `cad`) | — |
| `cadenceUnit` | `hari` (galon) / `bulan` (servis AC, STNK, garansi) — `cad × 30` kalau `bulan` | `hari` |
| `attentionFraction` | `fresh` batas (ds ≤ cadDays×f) | `0.8` |
| `dormantMultiplier` | `dormant` batas (ds > cadDays×m) | `3.0` |

**Token computed di `text` (§3.1):** `{ds}` = hasil hitung days-since, `{st}` = tier. Beda dari `<field>` (doc). Contoh metric segmen: `{ds} hari belum order`. `statusMap` di-key by **`{st}` computed** (bukan field doc). `sort`/`groupField` boleh pakai `{st}`/`{ds}` (hasil hitung) — renderer sort/group by computed. **Status selalu akurat tiap buka, nol cron/refresh.**

> **Kontrak field CF (final):** `reorder_cache/{rc}` = `rc`(id customer=doc key) · `cn`/`cp`(nama/hp denorm) · **`lo`**(epoch ms order-terakhir) · **`cad`**(cadence hari; BUKAN `cd` — cd=condition). TANPA `ds`/`st`/`derived_at`. Terdaftar Dict book tab `reorder_cache` (`1_XHmo5…`).

## 4. Contoh resolved (konsumen pertama — Reorder galon)

```json
{"type":"SIGNAL_LIST","vidtable":"20342033315492","table":"84214220504259//reorder_cache","search":"","agingTimeField":"lo","cadenceField":"cad","cadenceUnit":"hari","attentionFraction":"0.8","dormantMultiplier":"3.0","sort":"{ds}◼desc","groupField":"{st}","statusMap":"overdue◼Telat order◼warn★dormant◼Lama menghilang◼warn","route":"vertikaTeknoLokaciptaReorderCustomer","routeParams":"rc◼{rc}","text":"<cn>◆<cp>◆{ds} hari belum order◆biasa tiap <cad> hari◆Follow up◆Semua pelanggan dalam ritme — aman◆Cari nama◆Radar Reorder"}
```
Field align final: `reorder_cache` simpan `rc`/`cn`/`cp`/`lo`/`cad` (BUKAN ds/st/ct). Widget hitung `{ds}`/`{st}` dari `lo`+`cad`+threshold (§3.3). `lo` kosong → kartu skip (never_ordered CUT v1). `search:""` = semua (followup_state anti-nag = future); fresh customer di-hide via statusMap (cuma overdue/dormant di-map) atau search threshold.

**Reuse Service AC (aset perlu servis — WIDGET SAMA, config beda):** cadence bulanan → `cadenceUnit:"bulan"` (widget `cad × 30` → hari).
```json
{"type":"SIGNAL_LIST","vidtable":"20342033315492","table":"84214220504259//asset","search":"","agingTimeField":"lo","cadenceField":"cad","cadenceUnit":"bulan","attentionFraction":"0.8","dormantMultiplier":"3.0","sort":"{ds}◼desc","groupField":"{st}","statusMap":"overdue◼Servis lewat◼warn★dormant◼Lama tak servis◼warn","route":"vertikaTeknoLokaciptaServiceAssetDetail","routeParams":"as◼{as}","text":"<al>◆<cn> · <mk>◆{ds} hari sejak servis◆servis tiap <cad> bln◆Jadwalkan◆Semua unit terawat◆Cari unit◆Aset Perlu Servis"}
```
Widget identik — cuma `cadenceUnit`/`table`/`statusMap`/`text`/token beda → **generic terbukti**.

## 4b. UI / Layout (per state)

```
┌ Radar Reorder ──────────────────────────┐   ← text[8] listTitle (opsional)
│  [Lama menghilang]  ← group section (statusMap label)
│  ┌────────────────────────────────────┐ │
│  │ Bu Sari                [Telat order]│ │  ← text[1] title · badge(statusMap warn=amber)
│  │ Warung Makan                        │ │  ← text[2] subtitle
│  │ ● 7h ● 6h ● 8h ● ┈┈ 24 hari ○       │ │  ← mini-timeline (gapsField+markerField)
│  │ 24 hari belum order                 │ │  ← text[3] metric (tebal, warna badge)
│  │ biasa tiap 7 hari      [ Follow up ]│ │  ← text[4] meta · text[5] action → route
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘

Empty:  "Semua pelanggan dalam ritme — aman"   ← text[6]
```

## 6. Sheet-side (builder — SETELAH renderer live)

Widget row baru `signalList` (generic + SUBSTITUTE, ikut `op1screen-genericize-widget`): template J = shape §3 dengan `[PLACEHOLDER]` tiap field (`type` baked `SIGNAL_LIST`). op1Screen col D = SUBSTITUTE → helper cols. Swap `vertikaTeknoLokaciptaReorderRadar` seq3 (`listCardGrouped` sekarang) → `signalList`. **Config-ahead HARAM** sampai renderer landing (type baru; kalau di-set duluan, app DROP widget-nya).

## 7. Deliverable dev (Flutter)

1. Type `SIGNAL_LIST`: list dari `table`+`search`+`sort`, tiap row = kartu.
2. **`text` split `◆` by-index** (§3.1) — segmen 1-5 resolve `<field>` per-row, 6-8 literal level-list. **Nol string hardcode.**
3. Badge dari `statusField`+`statusMap` (`value◼label◼tone`); tone→warna dari theme (**amber-only, JANGAN merah**).
4. `groupField` → section (header = statusMap label). Kosong = flat.
5. Tap kartu → `route`+`routeParams`. Tombol action (text[5]) = ikut route kartu (atau primary tap).
6. **Mini-timeline** (§3.2) kalau `gapsField`+`markerField` ada; else skip.
7. Empty state = text[6]; search pakai text[7] hint atas `searchFields`(implisit title/subtitle).

## 8. Dictionary

- Dict `reorder_cache` (CF-derived, v1 final): `rc`/`cn`/`cp`/`lo`/`cad` **doang** (ds/st = widget compute; ct/cs/fs/gaps = future/DEFER). Terdaftar Dict book tab `reorder_cache` (`1_XHmo5…`).
- `event_taxonomy`: `coordination-reorder-cadence`, `coordination-contacted`, `coordination-task-created`.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Renderer `SIGNAL_LIST` (◆-text, badge, group, mini-timeline) | dev Flutter | PROPOSED |
| Widget row `signalList` + swap ReorderRadar | builder | NUNGGU renderer |
| Coll `reorder_cache` + derive + daily-cron | dev Go (CF) | separate spec |
| dict reorder_cache + event taxonomy | builder dict | PENDING |

## 10. Not Doing (dan kenapa)

- **8 field teks terpisah** — DITOLAK user 2026-08-06; 1 `text` ◆-index biar JSON ringkas.
- **`danger`/merah** — doktrin: sinyal operasional = amber. Merah = kegagalan engineering doang.
- **Aksi inline di kartu** (WA/mark-contacted 1-tap) — kartu cuma NAV ke detail; aksi beneran di detail (biar kartu ringan + generic). Sheet 3-opsi = di detail.
- **Chart/tren** — doktrin: BUKAN analytics. SIGNAL_LIST berhenti di "kartu → follow-up".
- **`never_ordered` tier** — CUT v1: CF cuma bikin doc buat yg pernah aktivitas; `lo` kosong → kartu skip (bukan tier baru). Enumerate customer belum-pernah = fitur terpisah.
- **`gaps` mini-timeline + learned-cadence** — DEFER (§3.2): butuh histori order di doc; v1 `lo`/`cad` doang. Config aditif nanti.

## 11. Acceptance

- [ ] `text` 1 field, 8 segmen ◆ → title/subtitle/metric/meta/action/empty/hint/listTitle kebaca by-index; `<field>` resolve per-row; nol string hardcode Flutter.
- [ ] Config Reorder galon (§4) render kartu bener; ganti ke config AC (§4) tanpa ubah kode → kartu AC bener (**generic**).
- [ ] Badge amber-only (warn); `danger` gak pernah merah muncul.
- [ ] `groupField` → section; kosong → flat.
- [ ] `gapsField`+`markerField` → mini-timeline; kosong → skip, kartu tetep valid.
- [ ] Search 0 row → text[6] empty; tap kartu → route+params.

## 12. Asumsi & risiko

- [ ] `gapsField` = array angka di doc (`[7,6,8,7]`). Kalau CF simpen beda bentuk (string ◆-join) → sesuaikan parse. [VERIFY bentuk gaps di reorder_cache CF]
- [ ] 8-segmen `◆` cukup buat semua case? Kalau nanti butuh segmen ke-9 (mis. sub-metric) → extend by-index (aman, append). Jangan pecah jadi field baru.
- [ ] search text[7] hint butuh `searchFields` — asumsi renderer cari di title+subtitle default; kalau perlu eksplisit, tambah field `searchFields`.
- [ ] mini-timeline di list padat (banyak kartu) — perf? viz ringan (dots), asumsi aman.

---

**Referensi:** `src/component/Reorder_Signal_Doctrine.md` · `src/component/ReorderRadar.jsx` · `feedback_config_driven_labels` · `project_reorder_radar` · LIST_ACTION_CARD (sibling reader) · `op1screen-genericize-widget`.
