# Design — reorder_cache: projeksi aging generic (renderer-aging, config-driven)

**Tanggal:** 2026-08-06
**Status:** APPROVED (brainstorming, siap → writing-plans)
**Konteks:** Reorder Radar (galon konsumen pertama) + semua case "aging/pengingat" ke depan (servis AC, STNK, garansi, follow-up, returnable asset lain: CNG/logistik). Widget: `SIGNAL_LIST`.
**Merevisi:** `docs/reorder-cache-cf-dev-spec.md` (REV2) — bagian trigger. Dev-spec REV2 pilih **daily cron** + simpan `st`/`ds` di server. Design ini **ganti** ke **renderer-aging** (server simpan `last_at` doang; layar hitung `ds`/`st`) → **nol cron**. Sisa dev-spec (config generic, filter DSL) tetap.
**Referensi:** `internal/reorder` (baru), `tenant_write_trigger.go` (router), `internal/movement` (skema movement), `docs/signal-list-widget-dev-spec.md`, `src/component/Reorder_Signal_Doctrine.md`, memory `project_asset_cache_cf` / `project_reorder_radar`.

---

## 1. Ringkasan keputusan

- **Semua case masa depan = model AGING** ("X hari sejak terakhir Y → warnai kalau lewat"). Satu mesin generic muat semua (keputusan user 2026-08-06).
- **Renderer-aging:** server simpan **tanggal aktivitas terakhir** (`last_at`) + info stabil; **layar (SIGNAL_LIST)** yang hitung "berapa hari (`ds`) + tier/warna (`st`)" pas render. → status selalu akurat **tanpa cron**, tanpa recompute berkala, tanpa trigger dari Flutter saat buka.
- **1 CF generic**, numpang router `onTenantWrite` (wildcard `{coll}` — sudah dengar semua write). v1 tambah **1 rute**: `movement`/create (galon DROP). Rute `event`/create (case aging event-sourced, mis. AC) **ditunda** — slot itu sudah dimiliki payout, butuh perubahan router kecil (lihat §4b). **Nol CF baru, nol Scheduler.**
- **Case baru = tambah baris setelan** (config doc + widget config). Nol kode selama sumbernya `movement`/`event`.
- **`ty` di movement** (pembeda vertikal returnable: galon/CNG/logistik) = **ditunda** (butuh dev Flutter stamp field). Mesin dibuat siap filter multi-klausa (`mt◼DROP⭘ty◼X`) → tinggal aktif pas multi-vertikal.

## 2. Masalah

Reorder Radar tampil "N hari belum order". `N` **naik karena waktu** walau nol event → komputer tak update tanpa disuruh. Opsi lama:
- **Cron** (dev-spec REV2): recompute harian → butuh Cloud Scheduler + registry global (HTTP trigger buta tenant) + batch mubazir + status telat ≤1 hari.
- **Recompute-on-open** (write-trigger): Flutter tulis doc pemicu saat buka → per-case plumbing di Flutter, langgar doktrin reuse.

Doktrin Reorder = **pull dashboard, nol auto-action** → tak butuh jam latar. Cukup: **simpan `last_at`, layar hitung selisih ke `now()` pas dibuka.** Selalu akurat, nol infra.

## 3. Keputusan arsitektur

**Pisah field jadi 2 berdasarkan penyebab berubahnya:**

| Jenis | Field | Siapa isi | Kapan berubah |
|---|---|---|---|
| **Stabil** | `last_at`, `cd`, `cn`, `cp`, `derived_at` | CF (server) | hanya pas ada aktivitas (DROP/servis) |
| **Volatile (jam)** | `ds` (hari), `st` (tier/warna) | SIGNAL_LIST (layar) | dihitung tiap render dari `last_at`+`cd`+threshold vs `now()` |

Analogi: simpan **tanggal lahir** (stabil), umur dihitung saat ditanya (volatile). Tak pernah simpan "umur=30" lalu update tiap tahun.

**Wiring:** `onTenantWrite` = ONE `document.written` trigger, wildcard `{coll}`, sudah fire untuk SEMUA tenant-coll write (incl. `movement`/`event`) — unrouted early-return zero-I/O (`tenant_write_trigger.go` header). Tambah domain = append 1 `tenantRoute`. Reorder v1 = append 1 rute (`movement`; `event` ditunda — §4b).

## 4. Komponen

**a. `internal/reorder` (Go, CF):**
- `Config` struct dari doc setelan (§5).
- **Pure core (unit-test):** parse filter DSL (`key◼value⭘…`), `matches(doc, filter)`, `maxTime`.
- `OnActivity(ctx, client, db, tid, coll, after)`: doc aktivitas baru → cari config aktif utk `coll` → cocok filter? → resolve customer key (`activityCustomerField`) + waktu (`activityTimeField`) → **upsert** `reorder_cache/{key}`: `last_at = max(existing, new)` + denorm `cn`/`cp` (lookup customer) + `cd` default + `derived_at`. **Best-effort** (error di-log, return nil).
- Config di-cache in-process (TTL pendek) supaya tak baca doc setelan tiap movement write (optimisasi; MVP boleh baca per-invocation, config sedikit).

**b. Router (`tenant_write_trigger.go`): +1 `tenantRoute` (v1):**
- `{coll: "movement", on: onCreate, gate: nil, handle: reorder.OnActivity}`
- **Gate `nil` (sengaja):** filter (`mt◼DROP` dll) ada di **config**, bukan di-hardcode gate — supaya vertikal baru cukup ganti config. Konsekuensi: handler jalan tiap movement create → **config wajib di-cache in-process** (map lookup, bukan Firestore read per write) biar murah. Gate pure tak bisa baca config → filter di handler.
- Handler best-effort: bungkus supaya error reorder **tak** dipropagate ke router (jangan retry/blok domain lain).
- **`event`/create route DITUNDA (untuk AC dsb):** slot `(event, create)` sudah dimiliki rute reward-payout (`tenant_write_trigger.go`). Loop `OnTenantWrite` = **first (coll,kind)-match; gate-fail langsung `return nil`** (tak fall-through) → rute `event` ke-2 bakal **ke-shadow**. Galon = movement, jadi v1 tak butuh event. Pas case aging event-sourced (AC) masuk, pilih salah satu: (i) ubah loop `return nil`→`continue` pada gate-fail (aman: tak ada (coll,kind) yang punya 2 rute sekarang) + taruh rute reorder **sesudah** payout (gate nil = catch-all); atau (ii) gabung `reorder.OnActivity` ke handler event yang ada. Keputusan saat AC dibangun.

**c. Setelan `reorder_config/{vertical}`** (per tenant) — diisi sheet/seed 1×.

**d. Output `reorder_cache/{key}`** — CF tulis; SIGNAL_LIST baca live.

**e. Widget `SIGNAL_LIST` (dev Flutter):** kemampuan **generic** "umur→tier": dari `last_at`+`cd`+threshold → `ds`+`st` saat render → badge/sort/group pakai hasil hitung. **Gated by config** (cuma nyala kalau field umur diisi) → pemakaian lama tak berubah. Kemampuan ini reusable semua case aging (servis `od`/`cad` dll).

## 5. Kontrak data

**Config doc — `MobileTable/{db}/tables/{tid}/reorder_config/{vertical}`** (galon):

| field | galon | catatan |
|---|---|---|
| `activityColl` | `movement` | relatif; CF prefix `paths.Base` |
| `activityFilter` | `mt◼DROP` | DSL `key◼value⭘…`; siap `mt◼DROP⭘ty◼galon` nanti |
| `activityCustomerField` | `tl` | DROP to-location = pelanggan |
| `activityTimeField` | `t` | epoch |
| `customerColl` | `stock_location` | untuk denorm nama/hp |
| `customerFilter` | `lt◼client` | |
| `customerKeyField` | `lv` | cocok dgn `tl` |
| `customerNameField` | `ln` | → `cn` |
| `customerPhoneField` | `hpic` | → `cp` |
| `defaultCadenceDays` | `14` | dipakai widget utk threshold |
| `outputColl` | `reorder_cache` | |

Threshold tier (di **widget config**, bukan CF): `attentionFraction=0.8`, `dormantMultiplier=3.0`. Tier: `d≤cd×0.8`=fresh · `≤cd`=approaching · `≤cd×3`=overdue · `>cd×3`=dormant · `last_at` kosong=never_ordered.

**Output doc — `reorder_cache/{key}`** (CF tulis):

| field | isi |
|---|---|
| `rc` | customer id (=key) |
| `cn` / `cp` | nama / hp (denorm) |
| `last_at` | epoch aktivitas terakhir |
| `cd` | cadence default (hari) |
| `derived_at` | epoch derive terakhir |

`ds`/`st` **tidak** disimpan — dihitung widget.

## 6. Alur data

```
App tulis movement DROP ke Toko X (seperti sekarang, tak berubah)
  → onTenantWrite (rute movement, gate mt==DROP) → reorder.OnActivity
  → cocok config galon → key=tl(TokoX), waktu=t
  → upsert reorder_cache/TokoX { last_at=max(lama,t), cn, cp, cd:14, derived_at }

Admin buka Reorder Radar
  → SIGNAL_LIST baca reorder_cache (snapshot live)
  → hitung ds = floor((now − last_at)/hari); st = tier(ds, cd, threshold)
  → render + sort(ds) + group(st)
```

## 7. Error handling & idempotency

- `OnActivity` **best-effort**: error internal di-log, **return nil** → tak nge-fail/retry `onTenantWrite` (reorder sinyal lunak; reward/approval/movement tak boleh terganggu). Self-heal di aktivitas berikutnya.
- `last_at = max(existing, new t)` (read-compare-write / transaction) → aman dari doc telat/retry (tak menimpa jadi lebih tua).
- Config coll tak ada → skip. Customer lookup gagal → tetap tulis `last_at` (nama/hp kosong; widget tampil id).
- Banyak baris movement 1 pengiriman = set `last_at` ke tanggal sama = idempotent.
- Self-write `reorder_cache` kena wildcard `onTenantWrite` tapi tak ada rute `reorder_cache` → no-op (tak ada loop).

## 8. Testing

- **Pure core (unit, `internal/reorder`):** parse+match filter DSL (`mt◼DROP`, multi-klausa), `maxTime`, resolve key/time dari field map.
- I/O (upsert, customer lookup) = tak di-unit-test (pola repo; nol emulator), konsisten movement/task.
- Tier/threshold = di **widget** (bukan CF) → test sisi Flutter.

## 9. Backward-compat (nol rusak existing)

- **Server:** `reorder_cache`/`reorder_config` = coll **baru**; 2 rute = **tambahan best-effort**; nol sentuh handler/skema existing (movement writer tak diubah — baca `mt`/`tl`/`t` yang sudah ada).
- **Widget:** aging-compute **gated by config** → SIGNAL_LIST yang lama (nampilin field jadi) tetap jalan.

## 10. Dipotong (YAGNI) + future

Potong v1: ❌ cron/Scheduler · ❌ `ty` movement · ❌ learned-cadence + `gaps` mini-timeline · ❌ `followup_state` anti-nag · ❌ AC config · ❌ **`never_ordered`** (lihat bawah).

**Penting — konsekuensi event-driven:** pendekatan ini cuma bikin `reorder_cache` buat customer yang **pernah ada aktivitas** (bereaksi ke movement/event, bukan enumerate customer). Customer yang **belum pernah order** (`never_ordered`) **tak dibuatkan doc** → tak muncul di radar v1. Nge-cover mereka = **enumerate seluruh customer** (`customerColl`+`customerFilter`) = persis kerjaan cron/on-open yang dibuang. Sinyal utama Reorder = "dulu order, sekarang melambat/berhenti" (overdue/dormant) → ke-cover sempurna event-driven. `never_ordered` = **potong v1**; kalau perlu nanti = fitur enumerate terpisah (on-open/cron), `customerFilter` dipakai di situ. Karena itu `customerFilter` **tak dipakai v1** (customer di-lookup by key buat denorm, bukan di-enumerate).

Future (config/aditif, tanpa rombak):
- **`ty` movement** → pas multi-vertikal returnable (CNG/logistik satu tenant). Stamp `ty` di penulis movement (dev Flutter) → filter `mt◼DROP⭘ty◼X`. Backward-compatible.
- **AC / case aging lain via `event`** → rute `event` sudah ada; tambah `reorder_config/{vertical}` (ty servis-selesai) → nol kode.
- **`gaps` + learned-cadence** → butuh histori order (bukan cuma last_at) → CF simpan deret order (dedup by `mrf`) → widget render mini-timeline.
- **`fs` anti-nag** → query task follow-up / event contacted.

## 11. Pembagian kerja

| Bagian | Siapa |
|---|---|
| `internal/reorder` (Config, pure core, OnActivity) + 2 rute router + test | dev Go (CF) |
| SIGNAL_LIST +aging-compute (ds/st dari last_at+cd+threshold), baca `reorder_cache` | dev Flutter |
| Isi `reorder_config` galon + widget config (field umur + threshold) | builder/sheet |

## 12. Open items

- Nilai `defaultCadenceDays` galon = `14` (asумsi; konfirmasi owner).
- Threshold `0.8`/`3.0` = default doktrin; expose di widget config.
- Lokasi `reorder_config`: per-tenant path `…/reorder_config/{vertical}` (bukan registry global, karena trigger via router path sudah bawa `{db}/{tid}`).
- Cache config in-process (TTL pendek, mis. 60s): **direkomendasikan dari awal** — gate `nil` bikin handler jalan tiap movement/event create; tanpa cache = 1 Firestore read per write. Cache = map lookup. Cold start / TTL habis = 1 read lalu reuse.
