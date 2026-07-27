# Gudang Feature — Handoff / Entry Point

**Status:** BELUM mulai. Nunggu mockup JSX. Dikerjain di **session sendiri** (parallel dengan Admin).

## Baca dulu (urutan)
1. `MEMORY.md` (auto-load) — konvensi + learning dari driver.
2. **`docs/consteon-runtime-knowledge-base.md`** — arsitektur, konvensi build op1Screen, data model, workflow. **Wajib.**

Gudang = **op1Screen mobile, sama pola dengan Driver, beda page.** Semua konvensi di KB langsung kepake.

## Scope (high-level — detail dari mockup)
Gudang app ngurus muat + serah-terima:
- Bikin **vehicle_check** opening — manifest `ie[]` (apa yang dimuat ke kendaraan).
- **Muat** kendaraan → INTERNAL `movement` → `asset_cache` (stok mobil).
- Validasi **return** kendaraan akhir hari (reconciliation sisa muatan; lihat driver ReturnVehicle @op1Screen 1079 sebagai pasangannya).

Tulis: `vehicle_check`, `movement`. Baca: `task` (buat manifest), `stock_location`, `asset_cache`. (Konfirmasi vs mockup.)

> Catatan: manifest gudang `ie[]` = `pd+ps+pr` (deliver+jual+tukar). Driver custody/manifest udah konsumsi ini — jaga konsisten (lihat `docs/precondition-gate-card-manifest-dev-spec.md`, `docs/driver-custody-*.md`).

## Cara kerja di session gudang
1. User kirim mockup JSX di session ini.
2. Ground tiap field/widget (dict + mockup), reuse-first.
3. Build Widget rows + op1Screen page-row block (ikutin KB §1 + §4).
4. Tulis dev spec `docs/gudang-<page>-dev-spec.md`.
5. Sync `json/gudang/*.json` + update memory.

## ⚠️ `vehicle_check.ie[]` = manifest muatan, dibuat SETELAH driver reject

**Flow (confirmed 2026-06-23):** driver login → liat rute (locked) → **reject** stop gak sesuai (tombol Tolak cuma ada selama custody belum confirmed) → **GUDANG muat rute non-rejected** → tulis `vehicle_check.ie[]` → driver konfirmasi (blind count `ie[]` → `ip[]`).

**Aturan `ie[]`:** karena gudang muat SETELAH reject → `ie[]` = `Σ(task NON-rejected `it[]` loaded: `pd+ps+pr`, **exclude purchase `pb`**)` per item, format `{ii, cd:"full", qt}`. Task `tst=load_rejected` **otomatis kekecuali** (gak dimuat). Jadi `ie[]` bener "by construction" — gudang-app yang jamin.

**Kenapa penting:** widget `CUSTODY_COUNT_LIST` (P6) baca `ie[]` (array flat `{ii,cd,qt}`, **gak ada link task / `tst`**) → gak bisa filter rejected sendiri. Jadi `ie[]` HARUS udah exclude rejected pas dibikin gudang.

**Demo (gudang-app belum ada):** `ie[]` di-hand-seed FULL di awal (sebelum reject) → stale. Interim: re-seed `ie[]` exclude rejected, atau **CF rebuild** `ie[]` on `task.tst→load_rejected`.

## Page (diisi pas mockup masuk)
- [ ] (TBD dari mockup)
