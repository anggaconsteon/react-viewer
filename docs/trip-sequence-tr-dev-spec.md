# Dev Spec — Trip sequence `tr`: multi-trip per mobil per hari

**Tanggal:** 2026-07-06
**Buat:** COVER — model + acceptance end-to-end. Spec per-role yang dikirim ke dev: **`trip-sequence-tr-flutter-dev-spec.md`** (renderer) + **`trip-sequence-tr-cf-dev-spec.md`** (Go). Kerjaan 2 sisi, ship bareng (urutan di spec Flutter §4).
**Status:** ⛔ **POST-DEMO. JANGAN build/deploy sebelum demo selesai.** Demo jalan pake aturan interim "1 mobil = 1 trip/hari" (retrip same-day → pake mobil lain).
**Dependency (WAJIB landing duluan):** ☆ multi-clause fix (`updateeventrow-star-search-type-dev-spec.md` §5.1 — cst flip) + §6 empty-write (dv/dn clear). Lifecycle trip di spec ini NGANDELIN `cst` flip & `dv` clear yang bener.

---

## 0. Masalah (bukti live test 2026-07-06)

Semua scope runtime pake kunci **(vv, hari)** — gak ada konsep trip. Test: trip pagi (2 task, B1234XY, full cycle sampai closing) → trip sore mobil SAMA hari SAMA (1 task baru):

1. **Custody count + task manifest driver nampilin item/task trip pagi** (harusnya cuma muatan trip sore). Opening trip-2 = kunci (vv,cdt) sama dengan trip-1 → dua doc match scope.
2. **Rute "Hari Ini" driver** = semua task hari itu, stop pagi (Selesai) nongol lagi sore → ambigu.
3. **`{allClosed}` / tombol Return + gate closing gudang pecah**: admin masukin orderan sore saat trip pagi masih jalan → rollup (vv,hari) liat task `assigned` baru → allClosed FALSE → tombol Return pagi ILANG + closing gudang ke-blok, padahal trip pagi beres.

## 1. Model — trip = doc opening `vehicle_check` (koleksi baru: NOL)

- Doc opening `vehicle_check` (auto-id, udah live) = anchor trip.
- **Field baru di `task`: `tr`** (String) = doc-id opening check yang ngangkut task itu.
- Task lahir TANPA `tr` (assigned = belum keangkut). Dapet `tr` pas gudang submit opening (loading). Orderan sore yang belum di-load = `tr` kosong → gak ganggu trip yang jalan.
- Lifecycle trip (udah ada semua, cuma dikasih makna): opening `cst:awaiting_custody` → driver Kirim `custody_confirmed` → closing set `closed`. **Trip AKTIF = opening (vv) dengan `cst ≠ closed`, terbaru.**

## 2. Stamping `tr` — di CF `OnVehicleOpening` (yang lagi dibangun buat LOAD movement)

Extend `warehouse-opening-load-movement-dev-spec.md`: selain emit LOAD movement per `ie[]`, CF juga:

```
tasks = query task WHERE vv == check.vv AND tst == "assigned" AND tdt == check.cdt (tdt match client-side tolerant, sama kayak recomputeIE)
for t in tasks: t.set({tr: checkId}, merge)
```

- Idempotent (set merge, nilai sama).
- Scope stamping = SAMA dgn manifest O1 (`vv⭘tdt◼{today}⭘tst◼assigned`) → yang keangkut = yang di-stamp, konsisten sama yang gudang hitung.
- `load_rejected` SETELAH stamping: task tetep punya `tr` (histori trip) — filter reject tetep via `tst`, bukan `tr`.

## 3. Token renderer baru: `{activeTrip}`

- Resolusi: `vehicle_check` WHERE `cty==opening ⭘ vv=={vehicleId} ⭘ cst != closed`, ambil **terbaru** (`t` desc), balikin doc-id.
- `{vehicleId}` kosong ATAU gak ada doc match → `{activeTrip}` kosong → klausa search pake token kosong = **fail-CLOSED** (aturan `driver-home-scope-leak-dev-spec.md` — jangan drop klausa).

## 4. Migrasi scope (config + renderer)

Search string SEKARANG (resolved live) → BARU:

| widget | sekarang | baru |
|---|---|---|
| `DRIVER_STOP_CARD` (rute) | `vv◼{vehicleId}⭘tdt◼{today}` | `tr◼{activeTrip}` |
| `PRECONDITION_GATE_CARD` (gate custody) | `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}⭘cst◼awaiting_custody` | TETEP (cst-filter udah otomatis milih trip aktif) |
| Custody count P6 (baca `ie[]`) | opening (vv, today) | opening = doc `{activeTrip}` doang |
| `{allClosed}` (tombol Return, `return-gate-allclosed-dev-spec.md`) | semua task (vv, today, excl load_rejected) | semua task `tr◼{activeTrip}` (excl load_rejected) ∈ {completed, failed} — **kalau allClosed belum kebangun, langsung build versi ini** |
| Gate closing gudang (rollup "task selesai semua") | task (vv, today) | task `tr◼{trip yang di-close}` |
| Feed gudang tier (`VEHICLE_FEED_LIST`) | rollup task (vv, today) + opening/closing existence today | anchor ke **opening TERBARU** utk vv + rollup task `tr` doc itu; gak ada opening aktif + `dv` kosong = backlog/loading |
| O1 manifest + expectedSummary | `vv◼{activeVehicle}⭘tdt◼{today}⭘tst◼assigned` | TETEP (pre-trip by definition — `tr` belum ada) |
| Supervisor / laporan harian (belum ada) | — | by `tdt` — SEMUA trip sehari keliatan (intended) |

⚠️ **Urutan ship (lesson `feedback_config_ahead_of_renderer`):** renderer (token `{activeTrip}` + scope) + CF stamping deploy DULU, config sheet (`tr◼{activeTrip}`) diganti BARENG rilis — config token-bearing yang mendahului renderer = widget ke-DROP. Perubahan config sheet gue yang pegang, kabarin build-nya ready.

## 5. `cnm`

`CHK-{vv}-{ymd}` gak unique lagi (2 trip/hari). Doc-id udah auto → uniqueness aman. `cnm` display: tambah suffix seq `CHK-{vv}-{ymd}-2` (hitung existing opening vv+hari itu +1). Jangan ada logic yang ngandelin `cnm` unik.

## 6. Backfill

Gak perlu migrasi data: task lama (completed, tanpa `tr`) gak pernah di-query pake `tr`; data demo bakal di-reset. Satu-satunya rule: jangan rilis di tengah trip yang lagi jalan (task on-trip belum punya `tr` → rute kosong) — rilis pas semua mobil closed / abis reset.

## 7. Acceptance (skenario end-to-end, mobil SAMA hari SAMA)

1. Pagi: 2 task assigned → opening (stamp `tr=T1`, LOAD movement) → custody → deliver semua → Return muncul (allClosed scope T1) → closing (cst T1=closed, dv clear).
2. Admin bikin orderan sore (task assigned, vv sama) **SAAT trip pagi masih jalan** → rute driver TETEP 2 stop pagi, Return pagi TETEP muncul, closing gudang TETEP bisa. (Regresi utama yang di-fix.)
3. Sore: gudang opening ke-2 (doc baru T2, stamp task sore `tr=T2`) → driver home: gate + custody count = **CUMA item task sore**, rute = **CUMA stop sore**, stop pagi gak nongol.
4. Feed gudang: abis closing pagi mobil balik backlog; abis opening sore tier ikut trip T2.
5. Supervisor/console: query task `tdt` hari itu = semua task pagi+sore (2 trip) keliatan.
6. Driver tanpa mobil / mobil tanpa opening aktif → `{activeTrip}` kosong → nol data (fail-closed, no leak).

---

**Referensi:** `warehouse-opening-load-movement-dev-spec.md` (CF yang di-extend), `return-gate-allclosed-dev-spec.md` (di-supersede scope-nya ke trip), `driver-home-scope-leak-dev-spec.md` (aturan token kosong), `updateeventrow-star-search-type-dev-spec.md` §5.1+§6 (dependency), `vehicle-feed-h1-dev-spec.md` §3 (tier yang dianchor ulang).
