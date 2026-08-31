# Outstanding aging — `asset_cache.t` dari t movement (fix seed backdate) (Dev Spec)

**Tanggal:** 2026-08-06
**Buat:** dev Go (CF — `internal/movement/created.go`).
**Status:** PROPOSED. Repo `cloud-function` branch `event-push`.
**Konteks / Konsumen pertama:** galon VTL (tenant `20342033315492`). Outstanding aging di `CUSTOMER_OUTSTANDING_LIST` (op1Screen CustomerOutstanding@876, `ageField:"t"`).
**Referensi:** `internal/movement/seed_nota.go` (backdate), `created.go` (apply ke asset_cache), `reconcile.go`, memory `project_outstanding_subsystem`.

---

## 1. Kenapa

Seed Saldo Awal (SeedSaldoAwal@917) punya input **"Sudah berapa hari di customer"** (`daysPosition:11`) → masuk nota `src:seed`. CF `seed_nota.go` **backdate dengan BENAR**: movement `t = now − days` (baris 81). Input 5 hari → movement `t` = 5 hari lalu. ✓

**Bug:** `created.go` (OnMovementCreated), pas nulis balance ke `asset_cache`, pakai **`nowMs`**:
```go
doc := map[string]interface{}{ ..., fieldT: nowMs }   // ← waktu APPLY, bukan t movement
```
→ backdate **ILANG** di asset_cache. `CUSTOMER_OUTSTANDING_LIST` baca `asset_cache.t` = now → **umur 0** (harusnya "terlama 5 hari").

## 2. Fix

`created.go`, di blok tulis balance asset_cache: `fieldT` dari **t MOVEMENT**, bukan `nowMs`:
```go
mt := fsdoc.Int(f, fieldT)   // t movement (seed = backdated; normal = ~now)
if mt == 0 { mt = nowMs }     // guard movement tanpa t
doc := map[string]interface{}{ ..., fieldT: mt }
```
- Seed 5 hari → asset_cache.t = 5 hari lalu → outstanding "terlama 5 hari". ✓
- Normal delivery → movement t ≈ now → asset_cache.t ≈ now → umur 0 (bener, baru dikirim).
- **Cuma `asset_cache` balance doc** yang berubah. Marker idempotensi + monthly rollup TETAP pakai `nowMs`/`ts` (application-time, gak kepengaruh).
- Nol config change (widget `ageField:"t"` tetep).

## 3. Caveat & upgrade path (v2, bukan sekarang)
- **Reset-on-touch:** `asset_cache.t` = t gerakan TERAKHIR. Kalo balance kesentuh gerakan baru (pickup/drop lagi), umur balik ngitung dari gerakan itu — bukan sejak galon PERTAMA nyangkut. Buat **seed (1 gerakan) = aman**. Buat customer aktif = umur bisa under-count.
- **Upgrade (kalo perlu aging sejati):** field baru `asset_cache.ot` (outstanding-since) = **preserve-oldest** — set = t movement pas balance 0→+, `min(ot, t)` selama balance tetep >0, reset pas balance balik 0. Config: `ageField:"t"`→`"ot"`. Di luar scope spec ini; 1-baris di atas cukup buat bug seed yang dilapor.
- **Out-of-order apply:** kalo movement lama (backdated) apply SESUDAH yang baru, last-write-wins bisa mundurin t. Rare. Kalo mau aman: `fieldT: max(existing_t, mt)` (tapi butuh read balance dulu — udah ada di txn `reads`, bisa dipakai). Opsional.

## 4. Deliverable
**BUILT + PUSHED `3e74253` (branch event-push, BELUM DEPLOY).** Implementasi pakai **max-semantics** (lebih kuat dari movement-t polos §2): `asset_cache.t = pickCacheT(existing, movement, now)` = `max(existing_stamp, movement_t)`, fallback nowMs. Alasan: (a) reconcile rebuild dari ledger butuh max-per-key anyway, (b) created↔reconcile jadi konsisten, (c) nutup out-of-order (§3) gratis (read existing t udah ada di txn). Monthly rollup + marker tetep nowMs.

| Bagian | Siapa | Status |
|---|---|---|
| `created.go` asset_cache `fieldT` = movement-t (thread mvT ke applyMutations, read existing t, `pickCacheT`) | dev Go | ✅ `3e74253` |
| `reconcile.go` track `maxT` per cacheId → `asset_cache.t` = max movement-t (BUKAN now) | dev Go | ✅ `3e74253` (deliverable #2 real — reconcile emang pakai nowMs, difix) |
| Test: `pickCacheT` pure (seed backdate, movement-newer, out-of-order-existing-wins, fallback now) | dev Go | ✅ (I/O ikut pola repo no-emulator) |
| Deploy (`onMovementCreated` + `reconcileAssetCache`; internal/movement shared → deploy all aman) | devops | ⬜ BELUM DEPLOY |

## 5. Not Doing
- **Field `ot` preserve-oldest** — v2, kalo reset-on-touch jadi masalah nyata. 1-baris cukup buat seed.
- **Config ageField ubah** — gak perlu, tetep `t`.

## 6. Acceptance
- [ ] Seed Saldo Awal days=5 → Outstanding customer nampil **"terlama 5 hari"** (bukan 0).
- [ ] Delivery normal → outstanding umur mulai 0 (baru dikirim).
- [ ] Movement tanpa `t` → asset_cache.t fallback `nowMs` (gak 0/blank).
- [ ] Balance/qty asset_cache TIDAK berubah (cuma field `t`).
- [ ] Reconcile gak nge-reset seed aging (verifikasi reconcile pakai t movement).

## 7. Asumsi & risiko
- [ ] Gak ada konsumen `asset_cache.t` yang butuh application-time (bukan event-time). Cek: inventory/asset-stock display — movement-t ≈ now buat normal, cuma seed yang mundur; aman.
- [ ] `reconcile.go` rebuild dari ledger — pastiin set `t` = t movement terakhir, konsisten sama fix ini.

---

**Referensi:** `seed_nota.go` (backdate `t=now−days`) · `created.go` (apply asset_cache) · `reconcile.go` · `CUSTOMER_OUTSTANDING_LIST`@CustomerOutstanding(876) `ageField:t` · memory `project_outstanding_subsystem`.
