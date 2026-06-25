# Admin Feature — Handoff / Entry Point

**Status:** BELUM mulai. Nunggu mockup JSX. Dikerjain di **session sendiri** (parallel dengan Gudang).

## Baca dulu (urutan)
1. `MEMORY.md` (auto-load) — konvensi + learning dari driver.
2. **`docs/consteon-runtime-knowledge-base.md`** — arsitektur, konvensi build op1Screen, data model, workflow. **Wajib.**

Admin = **op1Screen mobile, sama pola dengan Driver, beda page.** Semua konvensi di KB langsung kepake (Widget col-A rule, page-row VLOOKUP, DSL token, reuse-first, dll).

## Scope (high-level — detail dari mockup)
Admin app ngurus sisi kantor:
- Bikin / assign **task** (`tnm`, `vv`=mobil, `cv`=driver, `it[]` item lines).
- Assign mobil ke driver (`stock_location.dv`).
- **Reschedule** task `load_rejected` (tolak opening) + `failed` (gagal eksekusi) — baca `evidence` (`ec`=alasan, `d`=catatan) dari driver.
- Monitoring rute / status.

Tulis: `task` (+ status). Baca: `evidence`, `vehicle_check`, `task`. (Konfirmasi vs mockup.)

## Cara kerja di session admin
1. User kirim mockup JSX di session ini.
2. Ground tiap field/widget (dict + mockup), reuse-first.
3. Build Widget rows + op1Screen page-row block (ikutin KB §1 + §4).
4. Tulis dev spec `docs/admin-<page>-dev-spec.md`.
5. Sync `json/admin/*.json` + update memory.

## Page (diisi pas mockup masuk)
- [ ] (TBD dari mockup)
