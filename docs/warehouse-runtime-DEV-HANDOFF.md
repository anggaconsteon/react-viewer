# Warehouse Runtime (Vehicle Runtime) — DEV HANDOFF (kirim ini ke dev)

**Apa ini:** sisi **gudang/checker** dari Driver Runtime — bukan fitur terpisah. Dia **memproduksi** `vehicle_check` opening (`ie[]`/`gv`/`gn`/`ldt`) + designate driver (`stock_location.dv`) yang selama ini di-hand-seed buat driver custody (P5/P6), dan **memvalidasi** hasil rute (closing reconcile). 0 collection baru; **+1 field denorm `dn`**.

**Konteks config:** H1/O1/C1/R1/R2 **config sheet SEMUA udah live** (op1Screen 1101/1106/1120/1132/1138). Renderer 4 page warehouse udah dev build (review-clean). Yang dev kerjain = on-device QA + fix di bawah + CF (§C).

---

## ⚠️ UPDATE 2026-06-25 — AS-BUILT delta + keputusan executor designate

Bagian A/B/C/D di bawah ditulis **SEBELUM** dev build → sebagian STALE. AS-BUILT (SSOT = `warehouse-runtime-feedback.md`):
- Submit = **`createNativeDoc`** one-shot (scalar+array sekaligus), **BUKAN** `addToEvent`+native split (A4 salah — addToEvent void/async → array di-query sebelum doc ada → race → array ilang).
- Designate = **`executor_designate_card`** (kartu amber + sheet picker), **BUKAN** `searchFromTableConsteon` (A3/D-O2 stale).
- Masih bener: schema `dn` (B), tier logic (A5), handshake.

### Keputusan designate (FINAL): KEEP `executor_designate_card`
Sempet ditimbang ganti ke `searchFromTableConsteon` (capture `◁N▷` position) / picker baru → **DITOLAK**. Alasan: kartu token-based (`{chosenVid}`+`{chosenName}`) pas ke keyed write `…⭘search◼lv★{vehicleId}⭘dv◼{chosenVid}⭘dn◼{chosenName}` — nangkep **vid + nama sekaligus**, udah dibangun. searchFromTableConsteon cuma capture vid (nama jadi lookup PR). **JANGAN switch. Capture tetap token.** Live submit D1117 udah bener.

### 2 fix di `executor_designate_card` (kecil, bukan redesign)
1. **Click nama di sheet (O2) gak ke-select** — tap baris driver gak ada efek. Fix select handler renderer sheet. (test 2026-06-25 11:24)
2. **Sheet munculin tenant/system row** ("Autsorz / ? / Agenia Demo-7"), bukan driver — query `workforce` TANPA filter → ketarik semua. Fix:
   - **Tambah param filter** ke `executor_designate_card` (cth `workforceSearch:"<key>◼<staff>"`) + renderer apply ke query. Begitu field-nya ada, isi config-nya tinggal 1 cell.
   - **DATA prereq:** driver demo (Budi/Dirgahayu/Anton di `Master_Driver`) harus ADA di collection `workforce` yang di-query picker. Sekarang seeder **TIDAK** seed workforce (cuma item/stock_location/task/vehicle_check/movement) → driver demo kemungkinan gak ada di workforce. Verify; kalau kosong → seed `Master_Driver`→`workforce` atau pakai employee existing. **Verify field role/jabatan workforce** (Master_Driver pakai `role`; live tampil `Position <5>`) buat nentuin filter value.

---

## ✅ ROOT CAUSE 2026-06-26 — O1 task/count blank = CONFIG token mismatch (BUKAN dev)

**Gejala:** O1 Opening → Load Origin "0 task", count returnable/consumable kosong, header gak nampil plat. PADAHAL data + Firestore bener.

**Bukti data BENAR:** Firestore `task` doc ADA: `vv:"F629GD0000099"`, `it[]` 2 item (Aqua Galon pd:10, Aqua 600ml pd:5), `tnm:"TASK-20260626-901"`. Mobil test `B 9999 GD` / `lv=F629GD0000099` (loading tier).

**Akar (config, salah author config — bukan renderer):** config O1 pake token `{vehicleId}`, TAPI resolver dev (`resolveDriverCurlyTokens`, per `warehouse-runtime-feedback.md` baris 53) handle-nya **`{activeVehicle}`** (tap kartu H1 nulis `lv` ke `#ACTIVE_VEHICLE`, resolver `{activeVehicle}`→`#ACTIVE_VEHICLE`). `{vehicleId}` GAK di resolver list → gak ke-substitusi → query `vv◼{vehicleId}` literal → 0 row. Config + renderer dibangun kepisah, beda nama token vehicle.

**FIX (DONE 2026-06-26): rename `{vehicleId}`→`{activeVehicle}` di config O1** — 5 cell: D1107 (WORKSPACE_HEADER `lv◼`), D1110 (TASK_MANIFEST_LIST `vv◼`), D1113/D1115 (CUSTODY_COUNT_LIST `vv◼`), D1117 (CUSTODY_COUNT_SUBMIT updateEventRow `lv★`). Verified B1106 assembled.

### ✅ DONE config sejenis (`{vehicleId}`→`{activeVehicle}`) di page warehouse lain (2026-06-29)
- **C1 ClosingCheck** (D1121 WORKSPACE_HEADER + D1122 closing_context_rail search+checkSearch + D1125 CUSTODY_COUNT_LIST) → `{activeVehicle}` ✅
- **R1** (D1134 custodyConfirmedList) + **R2** (D1140 custodyDiscrepancyList) search `cty◼closing⭘vv◼{activeVehicle}⭘cdt◼{today}` ✅ (catatan: R2 discrepancy list = row 1140, BUKAN 1141; 1141 = NOTICE_BAR info).
- Semua warehouse token rename beres. `cdt◼{today}` sengaja DIBIARIN (cuma rename token, no scope-creep).

### Plus: drop `tdt◼{today}` (DONE O1, sisa H1)
- **Drop `tdt◼{today}`** dari O1 task/count (D1110/D1113/D1115) → tinggal `vv◼{activeVehicle}`. Alasan: 1 mobil=1 trip → `vv` udah unik; `tdt◼{today}` getas + stale cross-day.
- **MASIH ada** di H1 `VEHICLE_FEED_LIST.taskSearch` (`vv◼{lv}⭘tdt◼{today}`) — drop juga biar tier in_route/returning + count "Hari Ini" gak stale (sekunder, gak ngeblok loading).

### Seed gudang (BUAT TEST O1/C1) — `scripts/warehouse-gudang-seed.js`
File `.gs` KEDUA (additive, 0 sentuh driver seed). Baca tab `Gudang_Mobil`/`Gudang_Tugas`/`Gudang_Barang` → push `stock_location`(loading, dv kosong) + `task`. Run `previewGudang` → `pushGudangAll` dari editor. Mobil test `B 9999 GD`. Detail di file header.

---

## 🔴 ON-DEVICE BUG 2026-06-26 — O1 submit nulis opening doc `vv` KOSONG (DEV, renderer)

**Gejala:** setelah O1 submit (designate + count), balik H1 → tap mobil → **buka O1 LAGI** (gak pindah ke custody_pending). Mobil nyangkut di tier `loading`.

**Root (dari Firestore, di-trace tuntas):**
- `stock_location/F629GD0000099` ✅ BENER: 1 doc, `dv`+`dn` set, `lt:vehicle`+`lst:active`. Designate (`updateEventRow`) sukses, gak dobel.
- `vehicle_check` opening doc ❌: **`vv: ""` KOSONG**. `cnm:"CHK--20260626"` (dobel-dash) — format `CHK-{vv}-{YYYYMMDD}` ke-build dgn vv kosong. cst/cty/gl/ie[] bener; cuma vv (+ cnm) yang ilang.
- Akibat: H1 openingGate `vehicle_check⭘cty◼opening⭘vv◼{lv}` cari `vv=F629GD0000099` → opening doc `vv=""` GAK ke-match → H1 anggap "belum ada opening" → mobil tetep `loading` → tap buka O1 lagi. Opening doc gak punya linkage ke mobil (vv kosong + cnm tanpa vv) → **GAK bisa di-workaround dari config**.

**Fix (renderer, `CUSTODY_COUNT_SUBMIT mode:opening` doc-build):** isi `vv` + `cnm` opening doc dari `#ACTIVE_VEHICLE` — token yg SAMA yg O1 list-widget resolve sukses (`F629GD0000099`). Sekarang ke-write kosong. Submit config gak punya field vv (renderer derive internal) → murni kode renderer.

**~~Bonus bug~~ — RETRACTED 2026-06-29 (BUKAN bug):** `gn`/`dn` = `"Agenia Demo-7"` itu BENER. User konfirmasi vid `87544551624342` = akun Agenia beneran; "Budi Santoso" di `Master_Driver`/`Setup` cuma **label dummy**. Jadi workforce lookup `VID◼{checkerVid}` return "Agenia Demo-7" = nama akun asli buat vid itu, bukan "kena baris tenant". Gak ada orang lain yg harusnya muncul. 1 akun (Agenia) main semua peran (driver+checker+loader) di demo 1-device. **Gak ada fix workforce-filter yg diperluin** utk demo ini. (Prod multi-user nanti: pastiin lookup return orang yg dimaksud — tapi itu beda konteks, bukan bug sekarang.)

**Verifikasi config UDAH bener (bukan ini):** O1 token `{vehicleId}`→`{activeVehicle}` (ROOT CAUSE block atas) + tdt drop → task list + count + header SEKARANG MUNCUL. Yg sisa = 2 bug renderer di atas.

### Update: opening-vv FIXED, muncul bug closing-nav (2026-06-26 sore)
O1 submit→custody_pending SEKARANG JALAN (opening doc vv keisi, mobil pindah tier ✅). Bug baru pas test C1:
- **Closing-tap load mobil SALAH (stale `#ACTIVE_VEHICLE`).** Tap "Pengecekan Penutupan" di B 1234 XY (returning) → C1 malah nampil B 9999 GD (`F629GD0000099`, mobil terakhir yg di-O1). **closingRoute tap gak nge-set `#ACTIVE_VEHICLE`** ke `lv` mobil ke-tap (openingRoute udah, closingRoute belum — sama mekanik feedback.md L62). FIX renderer: closing card tap set `#ACTIVE_VEHICLE`=tapped lv (+`routeStack.push`), sama kaya opening.
- **C1 count kosong krn asset_cache kosong** (bukan bug): C1 baca `asset_cache` (saldo mobil). Mobil gudang-seed (B 9999 GD) GAK punya asset_cache (seed cuma stock_location+task, no movement) + belum lewat rute. Buat test C1 pake mobil yg PUNYA asset_cache (driver vehicle B 1234 XY / `F621a02a983500`, dari driver seed movement→CF). Sampai CF/movement ada utk mobil gudang, C1 mobil gudang = "TUNGGU DATA ITEM" (degrade-safe).

### Update: asset_cache GAK ADA sama sekali — CF belum deploy (2026-06-29)
Test C1 ulang pake driver vehicle `F621a02a983500` (B 1234 XY, `rt:returned` `rs:discrepancy_detected`, punya movement) → MASIH "TUNGGU DATA ITEM", 0 returnable · 0 consumable. **Koreksi note 2026-06-26 di atas: asumsi "driver vehicle punya asset_cache dari movement→CF" SALAH.**
- **Akar: collection `asset_cache` GAK ADA di Firestore (`otq-01`).** Collection list on-device = `item, movement, site, stock_location, task, vehicle_check, workforce`. `movement` ada, `asset_cache` enggak → **Go asset_cache CF belum deploy/jalan** di project ini. C1 100% gantung ke asset_cache → blank utk SEMUA mobil (driver & gudang), bukan cuma gudang-seed.
- **Unblock:** (A) deploy Go asset_cache CF ke `otq-01` (movement→asset_cache auto, chat infra terpisah), ATAU (B) hand-seed `asset_cache` `{lv,ii,cd,qt}` utk mobil retur (derive dari `vehicle_check.ie[]/ip[]` atau movement). B = test-unblock cepet, ga blok apa2.
- **Config token C1 sekalian DI-FIX (2026-06-29):** D1121/D1122/D1125 `lv◼{vehicleId}`→`lv◼{activeVehicle}` (sama kaya O1). Header + rail + count list sekarang resolve token bener. Necessary-but-not-sufficient: tetep butuh asset_cache ada.

### Catatan label B1125 (2026-06-29): col B = label kosmetik, assembly baca col D
C1 (+semua warehouse page) pakai pola **baked-literal col D**, BUKAN template-VLOOKUP. Assembly: `D → E(","&D, gated F=TRUE) → B1120(concat E)`. Col B widget-row = label doang, GAK dipake render. B1125 sempat stale `"custodyCountList"` utk isi `ITEM_EXECUTION_LIST` → di-rename `itemExecutionList` (kosmetik, gak ngaruh render).

### Update: C1 count → ITEM_EXECUTION_LIST varian `pivot` (2026-06-29)
asset_cache ADA + bener (token fix ✅) → C1 render. TAPI `CUSTODY_COUNT_LIST` tampil **2 card nama kembar** (Amidis Galon Penuh + Amidis Galon Kosong, per-`cd` doc) → user bingung. asset_cache emang keyed `(lv,ii,cd)` jadi full+empty = BY DESIGN (c1-spec §5/§2), bukan bug.
- **Keputusan:** reuse widget driver `ITEM_EXECUTION_LIST` (card nama-sekali + stepper di dalem) + **field `variant` BARU** biar 1 widget multi-case. Nama variant struktural/global: **`fields`** (existing driver delivery, default/back-compat) + **`pivot`** (closing, group asset_cache by `ii`, split by `cd`→stepper Penuh/Kosong).
- **Spec:** `docs/item-execution-list-variant-dev-spec.md` (resolved JSON 2 varian, mapping, sequencing). Dev kerja: (1) retrofit `variant` ke ITEM_EXECUTION_LIST (absent=`fields`, zero churn page live), (2) build varian `pivot`, (3) baru swap C1 D1125. JANGAN pre-stage config (config-ahead-of-renderer = widget blank).
- **Live UPDATE (2026-06-29 sore):** C1 D1125 UDAH di-swap ke `ITEM_EXECUTION_LIST variant:pivot` (staged ahead, user minta krn dev aktif build). ⚠️ Sampe varian `pivot` ke-build, C1 count = kosong/aneh (renderer lama fallback `fields`, field pivot gak ke-baca) — bukan clean-blank krn type-nya udah dikenal. Begitu pivot landing → tinggal test, harusnya langsung card grup Penuh/Kosong.

---

**Start here (urut):**
1. `docs/consteon-runtime-knowledge-base.md` — arsitektur op1Screen + DSL token + data model.
2. `docs/driver-runtime-field-dictionary.md` — semua field (Warehouse pakai collection driver yang SAMA).
3. Per-page: `docs/vehicle-feed-h1-dev-spec.md`, `docs/warehouse-opening-check-o1-dev-spec.md`, `docs/warehouse-closing-check-c1-dev-spec.md`.

Handshake lengkap (siapa nulis apa):
```
GUDANG opening (O1) → muat, count ie[], designate driver (dv/dn), gv/gn/ldt, cst=awaiting_custody   [vehicle_check opening]
DRIVER custody P5/6 → count ip[], reveal vs ie[], confirm → cst=custody_confirmed
DRIVER rute P10/11  → movement DROP/PICKUP
DRIVER return P12   → serah ke gudang; driver SELESAI
GUDANG closing (C1) → count fisik turun = ip[] vs expected ie[] → R1 match=approve / R2 selisih=eskalasi   [vehicle_check closing]
```

---

## A. RENDERER (Flutter)

### A1. Type BARU — bangun dari nol (2)
| type | page | spec | catatan |
|---|---|---|---|
| `VEHICLE_FEED_HEADER` | H1 | h1 §1 | identitas checker (`workforce.n` via `VID◼{checkerVid}`) + 3 snapshot count (Perlu Tindakan / Opening Check / Hari Ini). Config live @ Widget 229. |
| `VEHICLE_FEED_LIST` | H1 | h1 §2–3 | feed kendaraan tier-grouped + kartu (plat `ln`, executor `dn`, state-action). **Tier = composite gate** (A5). Config live @ Widget 230. |

### A2. Variant/extension dari type driver EXISTING
| type | dari | extension | spec |
|---|---|---|---|
| `CUSTODY_COUNT_LIST` | driver P6 (Widget 209) | **O1 variant**: `blind:false` (tampil plan), source = `task` aggregate (`Σ pd+ps+pr`, exclude `load_rejected`/purchase), `writeField:ie`, full-only, `groupBy` ic. **C1 variant**: source = `asset_cache` (`lv◼{vehicleId}`), `writeField:ip`, full+empty. | o1 §4, c1 §2 |
| `TASK_MANIFEST_LIST` | driver P5 (Widget 207) | +`hideQty` +`collapsible` (LoadOrigin: task list tanpa qty) | o1 §5 |

### A3. Reuse APA ADANYA (udah ada / udah di-spec driver)
- **`searchFromTableConsteon`** (Widget 156, EXISTING) — designate+pick pengemudi: search `workforce` → capture **vid** di `[POSITION]` → `dv`. Ganti executor card + picker sheet sekaligus. (o1 §2)
- `WORKSPACE_HEADER` (225), `NOTICE_BAR` (199), `3LineBorderForm`/`TXF` (88), `SUBMIT_CONFIRM_SHEET` (202), `CUSTODY_CONFIRMED_LIST` (214), `CUSTODY_DISCREPANCY_LIST` (215), `sendButtonGpsWithEvent` (192).

### A4. Submit = send-button multi-write (per page)
Array (`ie`/`ip`/`dp`) = **native Flutter write** (DSL gak support array — sama aturan driver P6). Scalar + create = DSL (`addToEvent`/`updateEventRow`).
- **O1 submit:** (1) `addToEvent` create opening `vehicle_check` (`cnm`/`cty◼opening`/`vv`/`gl`/`cdt`/`cst◼awaiting_custody`/`gv`/`gn`/`ldt`); (2) native `ie[]`; (3) `updateEventRow` `stock_location` designate `dv`/`dn`. (o1 §6)
- **C1 submit:** (1) `addToEvent` create closing doc; (2) native `ip[]`; (3) reconcile → native `dp[]` + `rs`; (4) `updateEventRow` opening `cst◼closed`; (5) R2: `addToEvent` `investigation` (`vst◼pending_review`). (c1 §4)

### A5. H1 tier derivation (logic penting — composite, bukan 1 field)
Sinyal "belum di-assign" = `stock_location.dv` kosong → tier **loading**, **TANPA filter tanggal** (backlog persist). Sisanya: `vehicle_check.cst` (3-nilai) + opening/closing doc existence + `task.tst` rollup. Detail tabel: h1 §3.

**Token runtime:** `{checkerVid}` `{vehicleId}`/`{lv}` `{today}` `{warehouseId}` `{chosenVid}`/`{chosenName}` `{openingCnm}` + generated `cnm`. (mekanik inject = ikut driver session.)

---

## B. Schema delta (cuma 1)
- **`dn`** (driver name) di **`stock_location`** — denorm, di-set bareng `dv` pas O1 designate. **Reuse code `dn`** (= driver name di `movement`; fungsi sama → no collision, sesuai aturan dict). Hindari N+1 lookup workforce di feed list. Tambah ke dict tab `stock_location`.

Sisanya pakai field driver existing: `vehicle_check` (`cnm cty cst vv gl cdt ie ip rs dp gv gn ldt`), `stock_location` (`lv lt ln dv` +`dn`), `task` (`tst it[] pd ps pr`), `asset_cache` (`lv ii cd qt`), `workforce` (`VID n`), `investigation` (`vnm vst vrf vpt`).

---

## C. CF / movement (POINTER — track Go terpisah, JANGAN di-detail di sini)
- **Expected closing** = `asset_cache` saldo mobil (`lv◼{vehicleId}`, full+empty) = loaded − dropped + picked, CF-derived. Sampe CF live → hand-seed (udah ada baris asset_cache mobil di seed).
- **Closing INTERNAL movement** (mobil→gudang) — **RESOLVED 2026-06-29 (rec, butuh dev CF build):**
  - **TRIGGER = closing `vehicle_check` doc ke-tulis** (saat checker tap "Simpan Penutupan"; doc `cty◼closing` + `ip[]` kebikin). BUKAN tombol Selesai, BUKAN driver P12.
  - **CF baru** (sibling, beda dari movement→asset_cache yg udah ada): Firestore onCreate/onWrite `vehicle_check` WHERE `cty◼closing` → baca `ip[]` → **emit movement INTERNAL `fl:mobil({vv})`→`tl:gudang({gl})`**, per item, qty = **`ip`** (fisik gudang = truth, BUKAN expected/`asset_cache`).
  - Efek: movement masuk ledger → CF asset_cache re-derive → **saldo mobil → 0** + **stok gudang nambah** sesuai yg diterima.
  - **Selisih (`dp`) GAK ngubah qty movement** — movement selalu `ip` (truth); `dp` cuma flag investigation ke supervisor (track paralel).
  - Idempotency: 1 closing doc = 1 batch movement (deterministic id dari `cnm` closing), re-run gak dobel.
  - Status SEBELUM build: tap Simpan Penutupan → closing doc + `ip` ketulis, TAPI movement mobil→gudang belum jalan → saldo mobil belum nol. Mekanik CF detail = `docs/driver-runtime-movement-cf-handoff.md`.

---

## D. Status + reuse map
| page | route | config sheet | renderer |
|---|---|---|---|
| H1 Feed | `…WarehouseFeed` (1101) | ✅ LIVE | ⬜ 2 type baru (A1) |
| O1 Opening | `…WarehouseOpeningCheck` | ⬜ pending | ⬜ CUSTODY_COUNT_LIST O1-variant + multi-write + reuse |
| O2 Picker | (in O1) | — | ✅ searchFromTableConsteon ada (wire) |
| C1 Closing | `…WarehouseClosingCheck` | ⬜ pending | ⬜ CUSTODY_COUNT_LIST C1-variant + reconcile multi-write |
| R1/R2 Result | `…WarehouseClosingResult` | ⬜ pending | ⬜ reuse CUSTODY_CONFIRMED/DISCREPANCY_LIST |

**Net widget baru seluruh fitur: 2** (`VEHICLE_FEED_HEADER`, `VEHICLE_FEED_LIST`). Sisanya variant-flag atau reuse.

**Open (konfirmasi sebelum/saat build):** `{warehouseId}` source (sesi vs task `gl`); closing blind atau visible (mock visible); `searchFromTableConsteon` `com:"auz"` tenant routing; P12↔C1 INTERNAL emitter (§C).
