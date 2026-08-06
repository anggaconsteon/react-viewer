# reorder_cache — Handoff pekerjaan PENDING (untuk analyst → dev-spec)

**Tanggal:** 2026-08-06
**Status:** CF (server) SUDAH dibangun (uncommitted→committed). Doc ini = daftar kerjaan SISA + kontraknya, biar analyst bisa tulis dev-spec terpisah per pihak (Flutter, builder).
**Sumber kebenaran desain:** `docs/superpowers/specs/2026-08-06-reorder-cache-aging-projection-design.md` (baca ini dulu). Plan CF: `docs/superpowers/plans/2026-08-06-reorder-cache-cf.md`. Review: `docs/reorder-cache-cf-REVIEW.md`.

---

## 0. Konteks singkat (biar nyambung)

Reorder Radar = sinyal "customer berisiko berhenti order". **Pola RENDERER-AGING**: server (CF) cuma simpan **tanggal order terakhir** (`last_at`) per customer; **layar (SIGNAL_LIST) yang hitung** "berapa hari (`ds`) + tier/warna (`st`)" pas render. → status selalu akurat **tanpa cron**. Generic: 1 mesin, semua case aging (galon dulu; servis AC/STNK/garansi/returnable lain nanti) = beda **setelan** doang.

**Yang SUDAH jadi (CF, Go):** `internal/reorder` + rute `movement`/create di `onTenantWrite`. Tiap movement DROP → `reorder_cache/{customer}.last_at` ter-update (best-effort, idempotent last_at=max). Deploy = `onTenantWrite` (devops).

**Yang PENDING = 2 pihak di bawah.**

---

## 1. PENDING — dev Flutter: SIGNAL_LIST "aging-compute"

**Masalah:** SIGNAL_LIST sekarang **display-only** (nampilin field jadi). Reorder butuh layar **menghitung sendiri** hari + tier dari tanggal, karena server sengaja TIDAK simpan `ds`/`st` (biar selalu akurat tanpa cron).

**Kerjaan:** tambah **kemampuan generic "umur→tier"** di SIGNAL_LIST:

1. **Input (dari config widget):** nama field timestamp (mis. `last_at`), nama field cadence (mis. `cd`), + threshold `attentionFraction` (default `0.8`), `dormantMultiplier` (default `3.0`). (Analyst tentukan nama key config-nya.)
2. **Hitung saat render**, per kartu:
   - `ds = floor((now − last_at) / 86400000)` (hari). `last_at` kosong → kartu di-skip (never_ordered TIDAK ada di v1).
   - `st` (tier):
     - `ds ≤ cd × 0.8` → `fresh`
     - `cd × 0.8 < ds ≤ cd` → `approaching`
     - `cd < ds ≤ cd × 3.0` → `overdue`
     - `ds > cd × 3.0` → `dormant`
3. **Pakai hasil hitung** buat: `markerField`/`sort` (pakai `ds` yang dihitung), `statusField`/badge/`groupField` (pakai `st` yang dihitung). Bukan baca field `ds`/`st` dari doc (doc gak punya).
4. **GATED by config:** kemampuan ini nyala HANYA kalau config kasih field aging (timestamp+cadence). Config lama tanpa itu → SIGNAL_LIST jalan apa adanya (display-only). **Backward-compatible wajib** — SIGNAL_LIST dipakai case lain (mis. asset-servis) yang gak boleh berubah.
5. **Baca collection** `reorder_cache` (via `table` config biasa; snapshot live).

**Kenapa generic penting:** "umur sejak tanggal X → warnai kalau lewat" kepakai BANYAK case (servis, STNK, garansi, follow-up, returnable). Bikin 1× di SIGNAL_LIST, reuse selamanya lewat config. JANGAN hardcode reorder.

**Yang analyst perlu putuskan/spec:** nama-nama key config aging di widget JSON; unit (hari vs bulan — asset-servis pakai bulan); default threshold; interaksi dgn `statusMap` existing (label/tone per `st`).

**Kontrak doc yang dibaca layar — `reorder_cache/{key}`** (ditulis CF):
| field | isi |
|---|---|
| `rc` | id customer (=doc key) |
| `cn` / `cp` | nama / hp (denorm) |
| `last_at` | epoch ms order terakhir |
| `cd` | cadence hari (default dari config) |
| `derived_at` | epoch derive terakhir |
(TANPA `ds`/`st` — layar yang hitung.)

---

## 2. PENDING — builder/sheet: 2 setelan

### 2a. Doc setelan CF — `reorder_config/{vertical}`
Path: `MobileTable/{db}/tables/{tid}/reorder_config/galon`. CF baca ini (di-cache 60s). Isi galon:

| field | nilai galon |
|---|---|
| `activityColl` | `movement` |
| `activityFilter` | `mt◼DROP` |
| `activityCustomerField` | `tl` |
| `activityTimeField` | `t` |
| `customerColl` | `stock_location` |
| `customerKeyField` | `lv` |
| `customerNameField` | `ln` |
| `customerPhoneField` | `hpic` |
| `defaultCadenceDays` | `14` |
| `outputColl` | `reorder_cache` |

**Yang analyst perlu putuskan/spec:** cara isi doc ini (seeder Apps Script dari sheet? manual? pola seeder existing) + konfirmasi `defaultCadenceDays` galon (14 = asumsi).

### 2b. Config widget SIGNAL_LIST
`table` = `reorder_cache`, + field aging (§1) + threshold (0.8/3.0) + `statusMap` (label/tone per tier, **amber-only, jangan merah** per doktrin) + `sort` (ds desc) + `groupField` (st). Analyst spec detail JSON-nya (ikut `signal-list-widget-dev-spec.md`).

---

## 3. PENDING — devops: deploy
`bash deploy.sh onTenantWrite` (reorder numpang router itu; nol function baru, nol Scheduler). Setelah CF live + §1 + §2 → fitur jalan.

---

## 4. DITUNDA (bukan sekarang — konteks biar analyst gak salah scope)
- **`never_ordered`** (customer belum pernah order): CF event-driven cuma bikin doc buat yang PERNAH aktivitas. Nge-cover never-ordered = enumerate semua customer (fitur terpisah, on-open/cron). Potong v1.
- **event/AC rute** (servis via `event` ledger): slot `(event,create)` udah dipakai payout + loop router return-on-gate-fail → rute event ke-2 ke-shadow. Pas AC masuk: ubah loop `return nil`→`continue` + reorder sesudah payout, ATAU gabung ke handler event. Lihat design §4b.
- **`ty` di movement** (mbedain galon/CNG/logistik 1 tenant): butuh dev Flutter stamp `ty` di movement. Galon-only skrg = `mt◼DROP` cukup. Filter config udah multi-klausa-ready.
- **`gaps` mini-timeline + learned-cadence** (rata-rata jarak order): butuh CF simpan histori order (dedup by `mrf`), bukan cuma last_at.
- **`followup_state` anti-nag** (task_open/recently_contacted): butuh query task/coordination.

---

**Ringkas untuk analyst:** tulis 2 dev-spec — (A) **dev Flutter** SIGNAL_LIST aging-compute (§1), (B) **builder** reorder_config + widget config (§2). Kontrak field ada di §1/§2 + design doc. Item §4 = future, jangan masuk v1.
