# Dev Spec — WarehouseFeed `expectedSummary` status-scope

**Tanggal:** 2026-07-02
**Buat:** Flutter dev (renderer — `VEHICLE_FEED_LIST`).
**Bug:** Kartu WarehouseFeed (H1) nampilin **"3 returnable"** buat B 1234 XY padahal task-nya udah `completed`. Harusnya 0 (gak ada muatan baru).

---

## 0. Bukti (otq-01, 2026-07-02)

- Task `TASK-2026-000212` (Indomaret) + `000213` (Mandiri): `tst="completed"`, `tdt="1782925200000"` (= **2 Juli = hari ini**), `vv="F621a02a983500"`.
- Feed card B1234XY: **"3 returnable"** (masih ke-itung).

## 1. Sumber angka

`VEHICLE_FEED_LIST` config: `"taskSearch":"vv◼{lv}⭘tdt◼{today}"` + `itemsField:"it"`.
`expectedSummary` (spec H1 §83/§138) = `Σ task.it[] group item.ic` atas hasil `taskSearch`.

`taskSearch` = `vv◼{lv}⭘tdt◼{today}` → scope MOBIL + HARI INI, **TANPA filter status**. Task completed hari ini tetep ke-agregasi → summary basi.

## 2. Root cause + kenapa gak bisa fix di `taskSearch`

`taskSearch` dipake **2 tujuan** dgn kebutuhan status BEDA:

| konsumen | butuh status apa |
|---|---|
| **expectedSummary** ("3 returnable") | cuma **loadable** (`tst=assigned`) |
| **tier derivation** (§3) | **SEMUA status** — rollup `task.tst` ("semua `completed` → returning" butuh liat completed) |

Kalau `tst◼assigned` ditambahin ke `taskSearch` bersama → **tier rusak** (gak pernah liat `completed` → gak pernah masuk tier `returning`/`in_route`). Jadi filter status **cuma** boleh di sisi **summary**.

## 3. Fix (renderer)

`expectedSummary` aggregation → hitung `Σ task.it[] group item.ic` **HANYA dari task `tst=assigned`** (loadable). Task `completed`/`failed`/`load_rejected` **exclude** dari summary.

- **Tier derivation TETEP** pakai semua status (jangan disentuh).
- Konsisten sama O1 manifest yg udah di-fix: `WarehouseOpeningCheck` search = `vv◼{activeVehicle}⭘tdt◼{today}⭘tst◼assigned`. Summary di feed = **preview** dari manifest itu → scope-nya harus **sama** (`assigned` + `today`).

**Opsi implementasi:**
- (a) Hardcode di renderer: summary loop skip task `tst≠assigned`.
- (b) Config field baru, mis. `summaryStatusField:"tst"` + `summaryStatus:"assigned"` → renderer filter summary by itu. Lebih fleksibel, tapi +field.

Rekomendasi: **(a)** — summary emang selalu "muatan yg mau di-load" = assigned. Gak perlu config.

## 4. Acceptance

- Mobil yg semua task hari ini `completed` + gak ada `assigned` baru → **expectedSummary = 0 / kosong** (kartu "available, belum ada muatan"). ✓ (kasus B1234XY sekarang).
- Ada task `assigned` baru hari ini → summary = Σ it[] task assigned itu.
- **Tier gak berubah**: `dv` kosong → tetep `loading`; `dv` keisi + semua task completed → tetep `returning`. Summary-scope gak ganggu tier.
- Summary feed == manifest O1 (angka sama) buat mobil yg sama.

## 5. Catatan (tier `loading` — bukan bug ini)

B1234XY nampil tier `loading` ("opening check") krn `dv` kosong ("Pengemudi belum ditentukan") — per H1 §3 rule 1 (`dv` kosong = backlog, no date filter). Itu **intended** (mobil available nunggu assign). Fix summary bikin kartu loading-nya nunjukin muatan yg BENER (0), bukan basi. Kalau `dv` harusnya keisi (trip barusan) tapi ke-reset → itu isu lain (lifecycle `dv`), telusuri terpisah kalau perlu.

---

**Referensi:** `vehicle-feed-h1-dev-spec.md` §83/§100/§105-126/§138 (`expectedSummary` + `taskSearch` + tier), `warehouse-opening-load-movement-dev-spec.md` (manifest O1 scope — konsisten), `driverhome`/`return-gate-allclosed-dev-spec.md` (kelas status-scope yg sama).
