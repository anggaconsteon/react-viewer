# Dev Spec (Flutter) — Trip sequence `tr`: token `{activeTrip}` + scope per-trip

**Tanggal:** 2026-07-06
**Buat:** Flutter dev (renderer). Pasangan spec CF: `trip-sequence-tr-cf-dev-spec.md`. Model & acceptance lengkap: `trip-sequence-tr-dev-spec.md`.
**Status:** ⛔ **POST-DEMO — jangan build/rilis sebelum demo.**
**Dependency (landing DULUAN):** ☆ multi-clause updateEventRow (`updateeventrow-star-search-type-dev-spec.md` §5.1, cst flip) + §6 empty-write (dv/dn clear) — lifecycle trip ngandelin dua-duanya.

---

## 0. Masalah (bukti live 2026-07-06)

Trip pagi selesai s/d closing; trip sore mobil+hari SAMA → driver home: custody count + rute nampilin item/task trip PAGI (harusnya cuma sore). Root: semua scope pake (vv, {today}) — gak ada konsep trip. CF bakal stamp **`task.tr`** (= doc-id opening vehicle_check yang ngangkut task itu); renderer tinggal ganti anchor scope.

## 1. Token baru: `{activeTrip}`

- Nilai = **doc-id** `vehicle_check` WHERE `cty=="opening" ⭘ vv=={vehicleId} ⭘ cst != "closed"`, terbaru by `t`.
- Query: anchor server-side `cty`+`vv` (String strict-safe), `cst`/`t` client-side — pola sama kaya fetch-anchor eq() yang udah ada.
- `{vehicleId}` kosong / gak ada doc match → `{activeTrip}` kosong → klausa search yang pake dia = **fail-CLOSED (match nothing)**, JANGAN di-drop (aturan `driver-home-scope-leak-dev-spec.md` — token-resolve-kosong ≠ literal-kosong).
- Lifecycle yang bikin token bener: opening `awaiting_custody` → Kirim custody `custody_confirmed` (trip MASIH aktif) → closing `closed` (trip selesai, token kosong lagi).

## 2. Scope yang pindah anchor (hari → trip)

| # | konsumen | search sekarang (resolved live) | jadi |
|---|---|---|---|
| 1 | `DRIVER_STOP_CARD` (rute + progress) | `vv◼{vehicleId}⭘tdt◼{today}` | `tr◼{activeTrip}` |
| 2 | `PRECONDITION_GATE_CARD` (gate custody) | `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}⭘cst◼awaiting_custody` | **TETEP** — filter `cst` udah otomatis milih trip aktif |
| 3 | Custody count driver P6 (baca `ie[]`) | opening (vv, hari) | `ie[]` dari doc **`{activeTrip}`** DOANG (bukan merge semua opening hari itu) |

### ⚠️ LIVE-BUG 2026-07-08 — vehicle_check ie[] reads GAK di-scope ke trip aktif (belum ke-implement)
Renderer udah scope TASK reads ke `tr◼{activeTrip}` ✓, TAPI **vehicle_check ie[] reads MASIH `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}`** (belum activeTrip). Bukti: trip-3, "Konfirmasi Penerimaan Muatan" (PRECONDITION_GATE_CARD) + custody count nampilin ie[] **trip-2** (opening trip-2 masih match `cdt◼{today}` walau udah closed). Task manifest bener (trip-3), tapi gate/count salah trip.
Kena widget: `PRECONDITION_GATE_CARD` (`itemsSearch`/`gateSearch`), `CUSTODY_COUNT_LIST` (`search`), `CUSTODY_COUNT_SUBMIT` (`search`) — semua read `vehicle_check` by `cdt◼{today}`.
**Fix PROPER (dev):** scope semua vehicle_check ie reads ke opening **{activeTrip}** (doc yang tr-nya = task aktif; = opening `cst≠closed` terbaru). Sama prinsip kayak task tr-scope.
**Band-aid config LIVE 2026-07-08 (sementara, demo):** +`cst◼awaiting_custody` ke itemsSearch/count/submit search (Z621/J640/J642/I643) — cuma opening aktif yang awaiting (trip-2 closed gak match). Valid selama 1 opening awaiting pada satu waktu. Ganti ke activeTrip-scope pas renderer landing.
| 4 | `{allClosed}` → tombol Return (`return-gate-allclosed-dev-spec.md`) | semua task (vv, hari, excl `load_rejected`) ∈ {completed, failed} | semua task **`tr◼{activeTrip}`** (excl `load_rejected`) ∈ {completed, failed}. **Kalau allClosed belum kebangun → langsung build versi trip ini, jangan 2x kerja** |
| 5 | Gate closing gudang ("semua task selesai") | rollup task (vv, hari) | rollup task `tr` = opening yang mau di-close |
| 6 | `VEHICLE_FEED_LIST` tier gudang | rollup task (vv, hari) + existence opening/closing hari itu | anchor **opening TERBARU** utk vv: gak ada opening aktif + `dv` kosong = backlog/loading; ada aktif → tier dari rollup task `tr` doc itu |
| 7 | O1 manifest + expectedSummary gudang | `vv◼{activeVehicle}⭘tdt◼{today}⭘tst◼assigned` | **TETEP** — pre-trip by definition (task belum punya `tr`) |
| 8 | Supervisor / laporan harian (belum ada) | — | by `tdt` — semua trip sehari keliatan (intended, JANGAN di-trip-kan) |

Task `tr` = String doc-id ↔ `{activeTrip}` String → semua compare string-vs-string, gak kena isu tipe.

## 3. `cnm` (display)

2 trip/hari → `CHK-{vv}-{ymd}` tabrakan. `CUSTODY_COUNT_SUBMIT` pas nulis opening: hitung opening existing (vv, hari) → suffix `-2`, `-3` (`CHK-B1234XY-20260706-2`). Doc-id tetep auto (uniqueness asli). JANGAN ada logic yang ngandelin cnm unik.

## 4. Urutan ship (WAJIB — lesson `feedback_config_ahead_of_renderer`)

1. CF stamping deploy (field `tr` mulai keisi — nganggur, harmless).
2. Renderer: token `{activeTrip}` + perubahan §2 rilis.
3. **BARU** config sheet diganti (`tr◼{activeTrip}` dst) — bagian ini GUE yang pegang, kabarin build ready. Config token-bearing yang mendahului renderer = widget ke-DROP total (kasus dropCap J219).
4. Rilis pas semua mobil `closed` / abis reset data — task mid-trip belum punya `tr` (gak ada backfill, gak perlu).

## 5. Acceptance

1. Trip pagi normal end-to-end (regresi nol: rute, custody, deliver, Return, closing).
2. **Admin bikin task sore SAAT trip pagi jalan** → rute driver TETEP stop pagi doang, tombol Return pagi TETEP muncul, closing gudang TETEP bisa. (Bug utama yang di-fix.)
3. Opening sore (mobil sama, hari sama) → home driver: gate + custody count = item task sore DOANG; rute = stop sore doang, stop pagi (Selesai) GAK nongol.
4. Abis closing sore: `{activeTrip}` kosong → home "belum ada trip", nol data (fail-closed).
5. Driver bukan pilihan / mobil tanpa opening aktif → nol data (no leak, konsisten scope-leak spec).
6. Console: task hari itu tetep keliatan semua (pagi+sore) via `tdt` — buat supervisor nanti.

---

**Referensi:** `trip-sequence-tr-dev-spec.md` (model), `trip-sequence-tr-cf-dev-spec.md` (stamping + gate transisi), `driver-home-scope-leak-dev-spec.md` (fail-closed), `return-gate-allclosed-dev-spec.md` (di-supersede scope-nya), `vehicle-feed-h1-dev-spec.md` §3 (tier).
