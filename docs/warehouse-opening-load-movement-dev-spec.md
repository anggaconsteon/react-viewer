# Dev Spec — Warehouse Opening LOAD movement (fix asset_cache base)

**Tanggal:** 2026-07-01
**Buat:** Dev (CF + gudang config).
**Bug:** Abis run LIVE admin→gudang→driver, "Isi Kendaraan Sekarang" (INVENTORY_BUCKET_CARD) **minus + cuma 1 item** pas custody mismatch. Ke-trace: `asset_cache` mobil cuma punya 1 doc = item mismatch `qt:-1`.

---

## 0. Root cause (kebukti dari data live otq-01)

Prinsip sistem: **`asset_cache` = Σ `movement`** (CF derive, `−qt@fl / +qt@tl`; app gak pernah nulis saldo). Lihat `driver-runtime-movement-cf-handoff.md`.

Buat mobil `F621a02a983500`, movement yang ADA **cuma 1** = `custodyadj-…-2000000000123` (`-1`, dari `OnCustodyConfirmed`). **Movement MUAT (gudang→mobil) buat 3 item `ie[]` (154:1, 8886:1, 123:2) GAK PERNAH ke-emit.**

Bukti tanpa liat coll movement: asset_cache di-key `{lv}__{ii}__{cd}`. Doc `…__123__full` = `qt:-1` → base `+2` gak pernah masuk. Item 154/8886 gak punya doc → base mereka juga gak ada.

→ **base kosong (0) + adjustment (−1) = −1**, cuma item mismatch yang nongol.

**Kenapa lolos selama ini:** test pakai **seed** (`driver-runtime-seed.js:347` `buildMovementsOpening` phase-2) yang nulis `seedload-{vv}-{ii}-{cd}` INTERNAL gudang→mobil. Run **LIVE** (gudang muat via app `CUSTODY_COUNT_SUBMIT`) **gak ada padanannya** → base gak pernah di-lay-down.

**Konfirmasi lokasi:** `movement-emit-dev-spec.md` §1 baris 40 eksplisit — *"loading mobil = movement GUDANG (di luar driver app)"*. Sisi gudang-nya **belum dibangun**. Custody/driver/adjustment SEMUA bener; yang bolong = **emit muat di gudang-opening**.

---

## 1. Fix bagian A — wire `gl` (warehouse id)

`vehicle_check` + `task` sekarang `gl:""` (kosong). O1 spec (`warehouse-opening-check-o1-dev-spec.md` §16/§103) udah **nge-spec** gudang-opening nulis `gl◼{warehouseId}`, tapi token `{warehouseId}` belum ke-source (§124 OPEN).

| item | isi |
|---|---|
| `gl`/`fl` value | lv gudang = `stock_location` doc `st=warehouse`, string (format kaya `vv`/`kl`) |
| sumber | **Flutter** (opsi a, DIPUTUS 2026-07-02) — resolve token `{warehouseId}` dari sesi gudang (WarehouseFeed) → native-write ke `vehicle_check.gl`. Detail: `warehouse-id-token-dev-spec.md`. |
| CF | baca `vehicle_check.gl` → `fl` movement muat. |

**DIPUTUS (2026-07-02): opsi a — handle di Flutter.**

`gl` di `vehicle_check` = **native write Flutter** (kaya `vv`/`cdt`/`gv`/`gn`). Sekarang lahir `""` krn `{warehouseId}` belum di-resolve (sesi gudang belum bawa identitas warehouse). Fix:
- **Flutter** resolve `{warehouseId}` (lv gudang checker, dari sesi WarehouseFeed) → isi `vehicle_check.gl`. Lihat `warehouse-id-token-dev-spec.md`.
- **CF `OnVehicleOpening`** tinggal baca `vehicle_check.gl` → `fl` (§2). Kalau `gl` masih `""` → `fl=null` (aman, non-blocking).

**Catatan (non-blocking):** `fl`/`gl` cuma buat **saldo gudang** berkurang (`−qt @ fl`). Bug "isi kendaraan" udah beres tanpa ini (`+qt @ tl=vv`). Nyusul pas Flutter isi `gl`.

---

## 2. Fix bagian B — emit LOAD movement

Per item `ie[]` (manifest gudang di `vehicle_check` opening), emit 1 movement — **niru `seedload` phase-2**:

```
mt : INTERNAL
fl : {gl}              // = vehicle_check.gl (di-isi Flutter dari {warehouseId}, §1). boleh null kalau belum
tl : {vv}              // lv mobil
ii : <ie[].ii>
cd : full              // muat selalu full
qt : <ie[].qt>         // qty manifest per item
er : GUDANG
gv/gn : checker (opsional, audit)
mid : openload-{checkId}-{ii}-{cd}   // deterministik → idempoten
t, ts : jam muat (WAJIB, buat bucket monthly)
```

`OnMovementCreated` (EXISTING, live) derive → `asset_cache` mobil `+qt @ vv` per item = base kebentuk. Terus `OnCustodyConfirmed` adjustment (`-1` item 123) landing di atas base → hasil bener.

### 2.1 Mekanisme emit — DIPUTUS: opsi A (CF-emit)

**CF baru `OnVehicleOpening`** (trigger `vehicle_check` created, `cty=opening`) → loop `ie[]` → create LOAD movement (§2 shape). `OnMovementCreated` (existing) derive asset_cache.

- **Flutter: 0** (CF baca `ie[]` yang udah nempel di doc).
- **CF baru: +1 trigger emit** (di-retire kalau nanti pindah ke onMovement-dispatch, lihat §5).
- Alasan pilih: self-contained, gak nyentuh Flutter, gak nunggu renderer loop-emit, low-risk. Bug beres cepet.

> Catatan idempotency trigger: `vehicle_check` opening bisa ke-**update** (savesend nulis ie[] lalu evidence/gps). Pastiin CF fire di titik `ie[]` udah lengkap (idealnya on-create dgn ie[] native udah keisi; kalau ie[] nyusul lewat update → gate di transisi yang bener). Guard double-fire via `mid` deterministik (§3).

**Migrasi masa depan (kalau refactor 1-dispatcher, §5):** LOAD pindah app-emit → reuse `OnMovementCreated`, CF `OnVehicleOpening` di-retire. LOAD = kandidat termurah krn qty = `ie[]` (udah dihitung, bukan actual runtime).

---

## 3. Idempotency

`mid = openload-{checkId}-{ii}-{cd}` deterministik. `AlreadyExists` → skip. Re-open vehicle_check yang sama = mid sama = **gak double-muat**. (`checkId` = doc id vehicle_check opening → 1 opening = 1 set load.)

---

## 4. Acceptance + regresi

**Fix jalan:**
- Abis gudang-opening submit → coll `movement` nambah **N** doc INTERNAL `gl→vv` (1 per item `ie[]`).
- `asset_cache` mobil = `ie[]` (154:1, 8886:1, 123:2).
- Abis custody **mismatch** (`ip` 123=1) → `OnCustodyConfirmed` adj `-1` → asset_cache 123 = **1** → "Isi Kendaraan" = **154:1, 8886:1, 123:1** (3 item, **gak minus**).

**Regresi WAJIB:**
- Custody **match** (`ip=ie`) → base doang, **no adjustment** → asset_cache = `ie[]` penuh.
- **Reject SEBELUM custody** (`OnTaskRejected` unload INTERNAL mobil→gudang) tetep jalan → base muat berkurang sesuai item ditolak.
- `OnMovementCreated` / `OnTaskCompleted` (delivery DROP/PICKUP) **gak kesentuh**.
- Wire `gl` (bagian A) → cek saldo **gudang** ikut berkurang `−qt` pas muat (kalau `fl=gl` diisi).

---

## 5. Architecture note — ide "1 trigger `onMovement` dispatch by type" (INISIATIF TERPISAH)

Ide owner: CF trigger cuma 1 (`onMovement`), tiap movement bertipe, logic dispatch by type (mis. reject → fungsi reject).

**Assessment jujur:**
- **DERIVE side UDAH begitu.** `OnMovementCreated` = 1 trigger, dispatch by `mt` + `fl`/`tl` → asset_cache/it[]/monthly. Bagian elegan = **selesai**.
- **EMIT side** (`OnTaskCompleted`/`OnTaskRejected`/`OnCustodyConfirmed`) trigger di **perubahan STATE** (task/vehicle_check), BUKAN di movement. Gak bisa dilipet ke `onMovement` **kecuali** app nulis movement-bertipe **langsung** (app-emit di semua titik).
- Nyatuin = pensiunin 3 CF emit + **bangun renderer loop-emit** (delivery/reject/custody/load) + **regresi 4 flow live**. Ini **mbalikin pivot 2026-06-24** (emit dipindah ke CF karena app-loop susah). → **signifikan + risiko ke flow yang udah kerja.**

**Rekomendasi:** **pisahin dari fix ini.** Ship opening-load (§1–§4, opsi A) dulu. Refactor 1-dispatcher = spec sendiri + rencana regresi. LOAD (opsi B) = kandidat pertama kalau jadi.

**Arah owner (2026-07-01) — type BARU ke depan (mis. `logistik`) = case-by-type di `onMovement`, BUKAN trigger baru.**
- Pola yang jalan: **app nulis movement bertipe X** → `OnMovementCreated` **dispatch by type** → handle side-effect X. Cocok buat type yang emang **gerakan stok** (logistik = mobil↔lokasi↔gudang) — tinggal tambah `case` di dispatch, `asset_cache`/monthly ikut invariant `fl`/`tl` yang sama. **0 trigger baru.**
- Batas: pola ini **cuma buat logic yang di-trigger MOVEMENT** (given movement → do X). Logic yang mesti react ke **STATE non-movement** (mis. task lifecycle tanpa movement) tetep jalur lain.
- Implikasi ke fix ini: `OnVehicleOpening` (opsi A) = EMIT-trigger sementara. Pas adopsi arah ini, LOAD jadi salah satu `case` di `onMovement` (app-emit) + `OnVehicleOpening` di-retire. Konsisten sama migrasi §2.1.

---

**Referensi:** `driver-runtime-movement-cf-dev-spec.md` (derive), `driver-runtime-movement-emit-dev-spec.md` (§1 baris 40 = akui gap gudang-load), `warehouse-opening-check-o1-dev-spec.md` (§16/§103/§124 `gl`/`{warehouseId}`), `driver-runtime-seed.js:323` `buildMovementsOpening` (shape `seedload`), `driver-runtime-test-scenarios.md` §4 (Skenario B custody mismatch).
