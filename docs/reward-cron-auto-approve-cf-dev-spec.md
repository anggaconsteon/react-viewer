# Reward — Cron auto-approve sample basi (CF scheduled, PRODUKSI-gated)

**Tanggal:** 2026-07-28
**Buat:** dev Go (CF — fungsi SCHEDULED baru, beda dari onTenantWrite yang event-driven)
**Status:** PROPOSED — **JANGAN develop dulu.** Arsip. Bangun kalau produksi butuh (antrian sample numpuk). Demo gak perlu.
**Konteks:** Rules engine reward (`docs/sales-freelance-reward-dev-spec.md`). `sample:%` masuk `st◼review` buat QC acak. Di produksi 1.800 worker ≈ 90 sample/hari — admin realistis gak sanggup review semua → antrian numpuk selamanya. Cron = katup pelepas.

## 1. Masalah + kenapa gak sekarang

- Sample = QC acak, BUKAN sinyal fraud. Kalau admin kelupaan, aman dilepas.
- Flag fraud (`duplicate`/`burst`/`link`/`ai`) = **WAJIB manual selamanya, GAK pernah kena cron** (mockup: "kena flag — wajib diputuskan manual, gak ada auto-approve").
- **Kenapa PROPOSED, bukan build:** (a) demo antrian kecil, gak kepepet; (b) infra baru (Cloud Scheduler); (c) butuh keputusan bisnis final: window "2 hari" + apakah cuma sample atau semua-non-flag.

## 2. Mekanisme

Fungsi **scheduled** (Cloud Scheduler → Pub/Sub/HTTP, jalan 1×/hari, TZ tenant):

```
sweep semua post_claim WHERE st==review AND fl==sample AND t < now - WINDOW
  → set st=approved, stamp aa◼1 (auto-approve marker, audit)
  → Recompute(cv) tiap doc kena  (fungsi existing, idempotent)
```

- **WINDOW** = env/config (default 2 hari = 172800000 ms). Bisa per-tenant nanti.
- Basis umur = `t` (submit epoch). Bucket `bk` gak berubah — approved masuk hitungan bucket-hari normal.
- **HANYA `fl==sample`.** Flag lain di-skip (biar admin tetap mutusin). `fl==""` (harusnya gak ada di review) → skip aman.
- **`aa◼1`** = field baru "auto-approved by cron" → bedain dari approve-manual & auto-approve-instant di audit. Sparse (cuma yang kena cron).
- Idempotent: doc yang udah approved gak ke-sweep lagi (gate `st==review`). Cron dobel-jalan aman.

## 3. Query / index

- Composite index kemungkinan: `st ASC, fl ASC, t ASC` (equality st+fl, range t). Error "requires index" → klik link log.
- Batch update pakai BulkWriter / batched writes; Recompute per-cv unik (dedup cv dulu biar gak recompute berkali-kali).

## 4. Sheet-side (kalau nanti mau tampilin — SEMUA OPSIONAL, bukan bagian cron)

Cron jalan tanpa UI apa pun. Kalau client demo minta baru tambah:
- **Tab Mencurigakan vs Belum-approve**: split `fl` (fraud vs sample). Butuh renderer tab di LIST_ACTION_CARD ATAU 2 section search beda — badge existing udah bedain, jadi opsional.
- **Countdown "auto-approve dalam Xh"**: renderer feature relative-future dari `t+WINDOW`. Dekorasi, cost tinggi. SKIP kecuali diminta.
- **Banner "N auto-approved hari ini"**: butuh stats doc (`docs/reward-stats-doc-cf-dev-spec.md`, di-revert). Dekorasi. SKIP.

## 5. Acceptance (pas nanti dibangun)

- [ ] Sample umur >WINDOW tanpa disentuh → approved + `aa◼1` + cache recompute.
- [ ] Flag fraud umur >WINDOW → **TETAP review** (gak kena cron).
- [ ] Manual approve sebelum cron → cron skip (gate st==review).
- [ ] Cron jalan 2× berturut → nol double-effect (idempotent).
- [ ] `ap` naik sesuai bucket-hari (bukan per-doc) — sama kayak approve biasa.

## 6. Keputusan bisnis PENDING (tanya sebelum build)

- [ ] Window final = 2 hari? per-tenant atau global?
- [ ] Cuma `sample`, atau semua non-fraud (kalau ada rule lain yang review tapi bukan fraud)?
- [ ] Cron auto-approve dihitung sebagai reward normal (masuk batch) — konfirmasi (asumsi: iya, sample yang lolos = valid).

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` §3 · `docs/rules-separator-pipe-cf-dev-spec.md` (LIVE) · `docs/reward-stats-doc-cf-dev-spec.md` (REVERTED — banner dekorasi).
