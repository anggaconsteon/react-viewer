# Review — `reorder-cache-cf-dev-spec.md`

**Reviewer:** CF session (grounded ke repo `cloud-function`, branch `event-push` @ `eb3f923`)
**Tanggal:** 2026-08-06
**STATUS: RESOLVED** — semua poin (A–E) di-fold ke spec REV2 (2026-08-06). A LOCKED (movement `mt◼DROP`/`tl`/`mrf`); B/C/D/E diterima; C+cron di-DEFER user ("cron nanti"). Doc ini arsip alasan.

**Verdict:** Konsep **kuat & benar** (generic config-driven projection + daily cron; doktrin "berhenti di status" jelas). Tapi **3 grounding-fix wajib** sebelum dev mulai (§A galon field mapping SALAH, §B cron infra beda dari yang diasumsikan, §C config location greenfield) + 2 gap algoritma. CF-only, tidak menyentuh kode existing.

---

## A. 🔴 Galon activity mapping SALAH — `movement` gak punya `ty`/`tx`/`lv`

Spec §3 galon: `activityColl=movement`, `activityFilter=ty◼delivery_executed⭘tx◼drop`, `activityCustomerField=lv`. **Grounded: doc `movement` TIDAK punya `ty`, `tx`, atau `lv`.** Skema movement asli (`internal/movement`, emit di `task_complete.go`/`task_reject.go`):

| field | isi |
|---|---|
| `mt` | movement type: `DROP`/`PICKUP`/`SALE`/`PURCHASE`/`REFILL`/`INTERNAL` (`mtDrop="DROP"`) |
| `fl` / `tl` | from-location / to-location vid (arah saldo) |
| `ii` `cd` `qt` | item / kondisi / qty |
| `t` / `ts` | epoch / string tanggal |
| `mrf` | = `tnm` (task id sumber) |
| `av`/`an`/`ac`/`fln`/`tln`/`tr`/`vv` | audit |

Untuk **DROP** (delivery ke customer): `mt="DROP"`, `fl=vv` (mobil), **`tl=kl` (customer location)**. Jadi mapping galon yang BENAR:

| Key | Nilai benar (galon/movement) |
|---|---|
| `activityFilter` | `mt◼DROP` (bukan ty/tx) |
| `activityCustomerField` | **`tl`** (bukan `lv`; `lv` itu field asset_cache) |
| `activityTimeField` | `t` ✓ (sudah benar) |
| `activityDedupField` | **`mrf`** (BARU — lihat §D) |

> Alternatif: kalau app nulis **event** `ty◼delivery-executed` per-order (1 doc/order, bukan per-line), sumber galon mending `activityColl=event` (punya `ty`, customer `cv`/`kl`, no dedup) — LEBIH bersih. **[VERIFY ke data/author: ada event delivery-completed per-order, atau harus dari movement?]** Kalau movement → wajib §D dedup.

---

## B. 🔴 Cron infra — bukan "reward-cron", template = `reconcileAssetCache` (HTTP)

Spec §6/§7 "pola reward-cron". **Grounded: TIDAK ada cron/reward-cron di repo ini** (grep Scheduler/cron/trigger-http → nol `.go`). Satu-satunya pola scheduler-able = **`reconcileAssetCache`** (`deploy.sh`: `--trigger-http --no-allow-unauthenticated`, entry `ReconcileAssetCache`). Jadi:
- Daily cron = **HTTP CF baru** (mirror `reconcileAssetCache`) + **Cloud Scheduler job** (OIDC auth) → **devops/infra**, di luar repo. Bukan Eventarc.
- ⚠️ **HTTP trigger gak bawa `{db}/{tid}`** (beda dari trigger Eventarc yang path-nya ada tenant). Cron harus **enumerate sendiri** tenant+vertikal aktif dari registry config (§C). Ini yang bikin §C jadi blocker, bukan opsional.

---

## C. 🔴 Config location — greenfield, harus registry yang bisa di-enumerate cron

Spec §10 "[KONFIRMASI lokasi config]". **Grounded: CF di repo ini TIDAK PERNAH baca config-doc / auzSettings** (auzSettings = tab sheet, bukan dibaca Go; `tenantRoutes` hardcoded di `tenant_write_trigger.go`; semua CF generic atas `{db}/{tid}` dari path trigger). Jadi mekanisme config = **baru total**.

Rekomendasi: **collection registry Firestore global** (bukan per-path), tiap doc = 1 vertikal 1 tenant, self-describing (bawa `db`, `tid`, SEMUA field-mapping §3). Cron `list()` registry → loop derive tiap config. Event-trigger juga baca config yang match coll yang berubah.
- Lokasi registry fixed & discoverable (mis. `MobileTable/_config/reorder/{vertical}` atau collection khusus) — **[KONFIRMASI ke author: path registry + siapa yang isi (admin sheet? seed?)]**.
- `auzSettings`/env DITOLAK: env gak multi-tenant dinamis; auzSettings gak kebaca CF.

---

## D. 🟡 Gap algoritma: per-LINE vs per-ORDER (kalau sumber = movement)

1 delivery order = **banyak** movement DROP (1 per item-line, `t` sama, `mrf` sama). Efek:
- `days_since` (pakai `max(t)`) → **aman** (multiplicity gak ngaruh).
- `gaps[]` + auto-learned cadence (§4.3b) → **RUSAK**: jarak antar-line = 0 hari → gaps penuh 0 → avg ngaco.

Fix: dedup aktivitas jadi **per-order** sebelum hitung gaps — collapse by `activityDedupField` (`mrf`) atau by hari. Tambah 1 knob config `activityDedupField` (kosong = gak dedup, buat sumber yang emang 1-doc/order kayak event AC). Generic, nol hardcode.

## E. 🟡 Event-driven (§6.1) — sebar ke banyak trigger; usul cron-first MVP

Re-derive event-driven butuh nyolok ke **banyak** trigger existing: activity galon → `OnMovementCreated`; activity AC + cadence override (COORDINATION) → `OnEventCreated`; task follow-up → `OnTaskWrite`. Itu kopling ke 4 domain. **Daily cron (§6.2) = backbone yang WAJIB & cukup buat correctness** (status berubah karena waktu; cron nangkep semua). Usul:
- **MVP = cron-only** (semua status akurat, telat maks 1 hari).
- **Fase-2 = event-driven** buat latency (reset `days_since` seketika sesudah DROP, `fs` seketika sesudah follow-up). Opsional, bukan blocker.

Hemat kopling + ngurangin risiko sentuh trigger race-sensitive (`OnTaskWrite`/movement).

---

## F. Yang sudah SOLID (spec bener)
- Generic config-driven 1-CF-N-vertikal: arah benar, konsisten doktrin.
- Algoritma status 5-tier + cadence 3-tingkat (override>learned>default) + anti-nag `fs`: jelas, aritmatika biasa (bukan ML) ✓.
- Read-only projection (nol endpoint set), pola `asset_cache`/Outstanding ✓.
- Output field = kontrak `SIGNAL_LIST` ✓.
- `activityTimeField=t` ✓; AC `workorder-completed` dari `event` (punya `ty`) konsisten ✓ (tetap [VERIFY] nama ty).

## G. Deliverable revisi (kalau lanjut)
1. **Registry config** (§C) — collection + doc self-describing per vertikal+tenant. **[blocker: konfirmasi path + pengisi]**.
2. **Derive generic** (§4) baca config; galon mapping fix §A; dedup §D.
3. **Daily cron HTTP CF** (mirror `reconcileAssetCache`) enumerate registry → derive semua. + Scheduler job (devops).
4. Event-driven §E → **fase-2** (opsional).
5. Test: pure core (status tier, cadence precedence, gaps dedup, aggregate) unit-tested; derive I/O pola existing (emulator gak dipakai di repo — pure-core saja).
6. deploy.sh +case cron HTTP (mirror reconcileAssetCache) + case event-trigger kalau fase-2.

---

**Ringkas blocker sebelum ngoding:** (A) sumber galon = movement `mt◼DROP`/`tl` ATAU event delivery? (C) path registry config + siapa isi? — dua ini wajib dijawab author/data. Sisanya (B cron=HTTP+Scheduler, D dedup, E cron-first) = keputusan desain yang gue rekomendasi di atas.
