# Rules Engine — `limit` period `minute` + `second` (testing gear, CF delta mini)

**Tanggal:** 2026-07-27
**Buat:** dev Go (CF `internal/validate` / `internal/period`)
**Status:** PROPOSED
**Konteks:** Testing E2E reward butuh `ap` (unique bucket) numpuk cepat — `day` = 10 hari buat 1 batch, `hour` = 10 jam. Gak kekejar buat verifikasi payout hari-H. Seed Firestore jalan tapi ribet diulang-ulang.

## Delta

Tambah 2 period di parser `limit:N:period`:

| period | bucket key | contoh |
|---|---|---|
| `minute` | per menit | `202607271151` |
| `second` | per detik | `20260727115134` |

- Format bucket ikut pola existing (`hour`=`2026072711`, `day`=`20260727`, `month`=`202607`) — tinggal perpanjang presisi.
- Semantik lain nol perubahan (extra/supersede/ap unique-bucket).
- **TESTING-ONLY convention** — bukan buat produksi (second ≈ kuota mati + ap per-submit). Gak perlu guard khusus; `rl` saklar sheet, salah tulis di produksi ketangkep review config. Cukup WARN biasa kalau mau.

## Resep testing yang bakal dipakai (sheet-side, sudah siap)

- `limit:1:second|sample:100` → tiap submit masuk review (test tombol inline) → tiap approve manual `ap+1` → 10 approve = `bt=1`, `rd="1"` → payout test full.
- `limit:1:second` doang → auto-approve semua → `ap` naik per submit tanpa sentuh review (jalur tercepat isi batch).
- Selesai testing: cell dikosongin → default `limit:1:day`.

## Acceptance

- [ ] `limit:1:second` → 2 submit beda detik = 2 bucket, `ap` naik per approve.
- [ ] `limit:1:minute` → 2 submit menit sama = ke-2 `extra`/supersede sesuai aturan existing.
- [ ] `hour/day/month` nol regresi.

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` §3.2 · `docs/rules-separator-pipe-cf-dev-spec.md` (delta sebelumnya, sudah live 29b2acd).
