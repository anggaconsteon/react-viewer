# reorder_cache — CF projection GENERIC (galon + AC + case lain) (Dev Spec)

**Tanggal:** 2026-08-06
**Buat:** dev Go (Cloud Function — projection derivation + daily cron)
**Status:** ⚠️ **SUPERSEDED (trigger/derivation) oleh `docs/superpowers/specs/2026-08-06-reorder-cache-aging-projection-design.md` (APPROVED, CF dev).** Design itu ganti model: **renderer-aging** (server simpan `last_at` doang, WIDGET hitung ds/st) → **NOL CRON, nol Scheduler, nol registry global**; CF cuma numpang `onTenantWrite` +2 rute (movement/event) upsert `last_at` best-effort; config = `reorder_config/{vertical}` per-tenant. Yang SURVIVE dari spec ini: config generic + filter DSL galon (`mt◼DROP`/`tl`/`mrf`). Bagian §6 cron / §3.5 registry / ds-st-di-server = OBSOLETE. Baca design itu buat CF final.

— (histori) REV2 2026-08-06 (blocker kejawab user): (A) **galon = `movement` doang, `mt◼DROP` + dedup `mrf`** (no event — LOCKED). (C) **cron + registry config = DEFER** (user: "cron nanti lagi aja") → derive-logic + mapping siap; trigger (cron+registry) fase berikutnya. ⚠️ Konsekuensi: tanpa cron, deteksi "berhenti order" GAK jalan (status naik karena waktu butuh recompute harian) → fitur live pas cron dibangun.
**Konteks / Konsumen:** Reorder Radar delivery (galon, konsumen pertama) + Service AC (unit perlu servis). Widget: `SIGNAL_LIST` (`docs/signal-list-widget-dev-spec.md`). Doktrin: `src/component/Reorder_Signal_Doctrine.md`.
**Referensi:** `project_reorder_radar`, `project_asset_cache_cf` (pola derive), `project_reward_posting_freelance` (pola cron), Reorder Signal Doctrine §3-§6.

---

## 1. Kenapa

Butuh projection `reorder_cache` (customer berisiko berhenti order → sinyal follow-up). **Keputusan user 2026-08-06 (terkunci): CF HARUS GENERIC** — `reorder_cache` dipake **galon** (last-order = DROP delivery) DAN **AC** (last-order = servis selesai). Beda cuma **sumber aktivitas + coll customer**; logika (jeda, cadence 3-tingkat, status, anti-nag) IDENTIK. Jadi CF = **config-driven per-vertikal**, bukan 2 fungsi. **Doktrin: BUKAN analytics** — projection berhenti di status sinyal; nol chart/prediksi/auto-action.

## 2. Konsep

Untuk tiap customer di `customerColl`: cari **aktivitas terakhir** (dari `activityColl` yg match `activityFilter`) → `days_since` = now − last → resolve `expected_cadence_days` (tangga 3-tingkat) → `status` → tulis 1 doc `reorder_cache`. **Config nentuin SUMBER** (event/movement mana = "order", coll customer mana); **algoritma sama** buat semua vertikal. **⚠️ status berubah karena WAKTU** (days_since naik tiap hari) → **WAJIB daily cron** recompute, bukan event-triggered doang.

## 3. Config GENERIC (INI kuncinya — 1 CF, banyak vertikal)

Config per-tenant/per-vertikal (di doc config atau `auzSettings`). CF baca ini, derive generic:

| Key | Galon (delivery) | AC (service) | Fungsi |
|---|---|---|---|
| `activityColl` | `84214220504259//movement` (LOCKED — galon no event) | `84214220504259//event` | sumber "aktivitas order" |
| `activityFilter` | **`mt◼DROP`** | `ty◼workorder-completed` | filter = 1 order/aktivitas |
| `activityCustomerField` | **`tl`** (DROP to-location = customer) | `cv` | field id customer di doc aktivitas |
| `activityTimeField` | `t` | `t` | occurred_at (epoch) |
| `activityDedupField` | **`mrf`** (banyak DROP-line/order → dedup per task-id) | (kosong — event 1-doc/order) | collapse per-order sebelum gaps (§4/D) |
| `customerColl` | `84214220504259//stock_location` | `84214220504259//customer` | daftar customer |
| `customerFilter` | `lt◼client` | (kosong) | filter customer valid |
| `customerKeyField` | `lv` | `cv` | id customer |
| `customerNameField` | `ln` | `cn` | nama (denorm ke cache) |
| `customerTypeField` | `pic`/`ct` | `ct` | tipe/kategori (denorm) — opsional |
| `customerPhoneField` | `hpic` | `cp` | hp (buat follow-up WA) — opsional |
| `defaultCadenceDays` | `14` | `30` (mis.) | Tingkat-3 fallback |
| `minActForLearning` | `3` | `3` | min aktivitas buat auto-learned |
| `overdueMultiplier` | `1.0` | `1.0` | overdue saat d > cadence×mult |
| `attentionFraction` | `0.8` | `0.8` | approaching mulai |
| `dormantMultiplier` | `3.0` | `3.0` | dormant saat d > cadence×3 |
| `outputColl` | `84214220504259//reorder_cache` | `…//reorder_cache` | tujuan tulis |

**Nol hardcode vertikal di kode** — semua sumber/field dari config. Ganti config = ganti vertikal.

## 4. Algoritma derivasi (sama semua vertikal)

Per customer `c` (dari `customerColl` match `customerFilter`):

```
1. acts = query activityColl WHERE activityFilter AND activityCustomerField == c.key
          ORDER BY activityTimeField ASC
1b. DEDUP per-order (§D): jika activityDedupField diisi → collapse acts yang sama nilai
    activityDedupField (mis. mrf/task-id) jadi 1 (ambil max time). Kosong = skip.
    → `orders` = deret order unik. WAJIB sebelum gaps/learned (galon: 1 order = N DROP-line,
      time sama → tanpa dedup gaps penuh 0 → learned ngaco).
2. last_at = max(orders.time)  |  null jika kosong
   days_since = null jika last_at==null; else floor((now − last_at)/86400000)

3. expected_cadence_days (tangga 3-tingkat, precedence):
   a. ADMIN OVERRIDE: event COORDINATION.reorder-cadence terakhir utk c → cadence_days ; source="admin_set"
   b. AUTO-LEARNED: else jika len(orders) >= minActForLearning →
        gaps = selisih antar orders berturut (hari); avg = mean(gaps); round → source="learned"
   c. DEFAULT: else defaultCadenceDays ; source="default"
   (auto-learned boleh fase-2; MVP = a + c cukup, kontrak field sama)

4. status:
   last_at==null                       → "never_ordered"
   d <= cadence×attentionFraction      → "fresh"
   cadence×attentionFraction < d <= c  → "approaching"
   c < d <= cadence×dormantMultiplier  → "overdue"
   d > cadence×dormantMultiplier       → "dormant"

5. followup_state (anti-nag, dari task/coordination events utk c):
   ada task follow-up OPEN               → "task_open"
   di-kontak dlm RECENT_CONTACT_DAYS(7)  → "recently_contacted"
   else                                  → "none"

6. gaps[] = deret selisih **orders** (post-dedup; buat mini-timeline SIGNAL_LIST) — array angka hari

7. UPSERT outputColl doc key=c.key: { rc, cn, ct, cp, last_at, ds:days_since,
   cd:expected_cadence_days, cs:cadence_source, st:status, fs:followup_state, gaps, derived_at }
```

`avg_gap` = aritmatika biasa (bukan ML). `learnedCadence` identik mockup `ReorderRadar.jsx`.

## 5. Output — doc `reorder_cache` (field = kontrak SIGNAL_LIST)

| field | isi |
|---|---|
| `rc` | customer id (= customerKeyField) — doc key |
| `cn`/`ct`/`cp` | nama/tipe/hp (denorm dari customer) |
| `last_at` | epoch aktivitas terakhir; kosong=never |
| `ds` | days_since (int); kosong=never |
| `cd` | expected_cadence_days |
| `cs` | `admin_set`/`learned`/`default` |
| `st` | `never_ordered`/`fresh`/`approaching`/`overdue`/`dormant` |
| `fs` | `none`/`task_open`/`recently_contacted` |
| `gaps` | array jeda (mini-timeline) |
| `derived_at` | epoch derive terakhir |

Read-only projection — nol endpoint set langsung (persis Outstanding/asset_cache).

## 6. Trigger (REV pasca-review §B/§E)

1. **⚠️ DAILY CRON = BACKBONE (WAJIB, MVP cukup ini doang).** Status naik karena WAKTU tanpa event (fresh→overdue) → cron nangkep semua; correctness cukup dari cron (telat maks 1 hari). **Bukan reward-cron** (gak ada di repo) — **HTTP CF baru mirror `reconcileAssetCache`** (`--trigger-http --no-allow-unauthenticated`) + **Cloud Scheduler job (OIDC)** = **devops/infra, di luar repo**. ⚠️ HTTP trigger **gak bawa `{db}/{tid}`** (beda Eventarc) → cron **enumerate sendiri** tenant+vertikal dari **registry config (§3.5)**, loop derive tiap config.
2. **Event-driven = FASE-2 (opsional, buat latency, bukan blocker):** re-derive seketika pas activity/cadence/task write. Nyolok ke banyak trigger existing (`OnMovementCreated`/`OnEventCreated`/`OnTaskWrite`) = kopling 4 domain + risiko race → tunda sampai perlu. MVP cron-only udah akurat.

## 3.5 Registry config (REV §C — greenfield, WAJIB)

CF di repo ini **gak pernah baca config-doc/auzSettings** (auzSettings=tab sheet, gak kebaca Go; semua CF generic atas `{db}/{tid}` dari path trigger). Config `reorder` = **mekanisme BARU**: **collection registry Firestore GLOBAL** (bukan per-path), tiap doc = **1 vertikal × 1 tenant**, **self-describing** (bawa `db`, `tid`, SEMUA field-mapping §3). Cron `list()` registry → loop; env/auzSettings DITOLAK (env gak multi-tenant dinamis, auzSettings gak kebaca CF). **[BLOCKER author: path registry fixed (mis. `MobileTable/_config/reorder/{vertical}`) + siapa yang isi — admin via sheet? seed manual?]**

## 7. Deliverable dev (Go)

1. Fungsi derive generic: baca config → algoritma §4 → upsert §5. **Nol hardcode coll/field** (semua config).
2. Event trigger (§6.1): re-derive customer terkait pas activity/cadence/task write.
3. **Daily cron (§6.2)**: recompute semua (Cloud Scheduler → CF; pola reward-cron).
4. Multi-vertikal: 1 deploy, N config (galon + AC jalan barengan, config beda). Loop config aktif per-tenant.
5. `followup_state` derive dari task lifecycle (jangan set manual).
6. Idempotent + replay-safe (re-run = hasil sama).

## 8. Not Doing (dan kenapa)

- **2 fungsi (galon vs AC)** — DITOLAK; 1 CF config-driven (user 2026-08-06).
- **ML / prediksi tanggal order** — doktrin: aritmatika biasa, berhenti di status. Prediksi = parked.
- **Auto-action** (auto-WA/auto-DROP/auto-churn) — doktrin: sinyal picu perhatian, bukan tindakan. Follow-up = manusia + task biasa.
- **Konsumsi PICKUP** — Reorder murni soal kedatangan order (DROP/servis), bukan balik aset.
- **Chart/tren/kohort** — BUKAN analytics.
- **SALE sbagai order (galon)** — parked; MVP cukup DROP.

## 9. Acceptance

- [ ] 1 CF, 2 config (galon movement-DROP + AC event-completed) → dua-duanya isi `reorder_cache` bener, nol perubahan kode.
- [ ] Customer tanpa aktivitas → `never_ordered`; ada → status per §4 (fresh silence, overdue/dormant amber).
- [ ] Cadence 3-tingkat: override>learned>default; `cs` bener.
- [ ] **Daily cron**: customer fresh, lewat H+ tanpa order → status auto-naik overdue TANPA event.
- [ ] Anti-nag: task_open/recently_contacted → `fs` bener, sinyal diredam.
- [ ] `gaps` array kebentuk (mini-timeline SIGNAL_LIST kebaca).
- [ ] Idempotent (re-run/replay = sama).

## 10. Asumsi & risiko

- [x] ~~galon = movement `lv`/`tx`~~ → **DIKOREKSI review §A**: movement pakai `mt◼DROP`/`tl`/`mrf` (bukan ty/tx/lv). Lihat blocker A.
- [x] ~~cron pola reward-cron~~ → **DIKOREKSI §B**: HTTP CF mirror reconcileAssetCache + Scheduler.
- [x] ~~config auzSettings/env~~ → **DIKOREKSI §C**: registry Firestore global (§3.5).
- [ ] AC "last order" = `event ty◼workorder-completed` — [VERIFY nama `ty` persis].
- [ ] Cron scope: semua customer/registry tiap hari — perf tenant besar? paginate. Depot kecil aman.
- [ ] `gaps` bentuk (array angka) — samain sama `gapsField` SIGNAL_LIST.

## 11. BLOCKER — status (user 2026-08-06)

- [x] **A — sumber galon = `//movement` (`mt◼DROP`, customer=`tl`, dedup `mrf`). LOCKED** (galon no event).
- [~] **C — registry config + cron = DEFER** (user: "cron nanti lagi aja"). Derive-logic + mapping siap; trigger mechanism (HTTP-cron mirror reconcileAssetCache + Scheduler + registry Firestore) = fase berikutnya, garap pas mau ngidupin cron. **Sampai cron ada, fitur belum jalan** (deteksi berhenti-order butuh recompute harian).

---

**Referensi:** `src/component/Reorder_Signal_Doctrine.md` · `docs/signal-list-widget-dev-spec.md` · `project_reorder_radar` · `project_asset_cache_cf` (derive) · `project_reward_posting_freelance` (cron).
