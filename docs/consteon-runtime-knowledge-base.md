# Consteon Runtime — op1Screen Build Knowledge Base (START HERE)

Entry point buat **session baru** yang mau bangun page fitur baru (Admin, Gudang) di proxy op1Screen — sistem yang sama dengan Driver, cuma **beda page**. Baca file ini + `MEMORY.md` (auto-load) dulu, baru mulai.

Tujuan: session baru langsung paham arsitektur + konvensi + data model + workflow tanpa ngulang belajar dari nol. Driver runtime udah selesai (P4–P12 + reject + failed-delivery); Admin & Gudang ngikut pola yang sama.

---

## 0. Di mana semua tinggal

| hal | lokasi |
|---|---|
| **Proxy op1Screen** (CMS, sumber page) | sheet `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` — tab `op1Screen` (page registry), `Widget` (template widget), `Plug` (registry, mostly unused untuk VTL) |
| **Firestore live** (app baca dari sini) | project `otq-01` → `MobileTable/20342033315492/tables/84214220504259/{collection}`. App widget pakai `vidtable:"20342033315492"`, path collection prefix `84214220504259//{coll}` |
| **Seed** (generate data dummy) | bound Apps Script di dict book; baca tab admin-entry (`Master_*`/`Setup`/`Tugas`/`Barang`) → push Firestore. Mirror lokal: `scripts/driver-runtime-seed.js` |
| **Dict book** (SSOT data dictionary) | sheet `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw` — tab per collection (`task`/`vehicle_check`/`movement`/`evidence`/`addToEvent`/`item`...). Locale `in_ID` → pemisah formula `;` |

---

## 1. Konvensi build (KRITIS — langgar = proxy-wide breakage)

### Widget tab
- **`A1` = `=ARRAYFORMULA(I1:I)`** — spill SEMUA nama (col I) ke bawah col A. **JANGAN PERNAH tulis col A.** Literal di col A → `#REF!` → SELURUH col A kosong → SEMUA `VLOOKUP(...,Widget!A:G,...)` se-proxy jadi `#N/A` (semua page rusak). Recovery: clear literal-nya (tulis `""`) → arrayformula re-spill.
- col **I** = nama widget, col **J** = template JSON (surface edit), col **G** = `=IF(ISERROR(J{r}),"",J{r})`, col **H** = `=IF(A{r}="","",IF(ROW()<=2,"","◆")&$A{r}&"▶Widget!"&CHAR(64+COLUMN($J$1))&ROW())`.
- **Tambah widget:** tulis **I + J + G(formula) + H(formula)**, NEVER A. **Edit widget:** ubah **J** (G auto-mirror).

### op1Screen page-row
Per page = 1 name row + N widget rows + 2 buffer.
- **Name row:** A=route literal · B=`="{""title"":"""&$B$116&""",""hideBottomBar"":true,""children"":["&MID(CONCATENATE(E{first}:E{last}), 2, 50000)&"]}"` (rakit children dari E spill) · C kosong · D=`JSON--` · E=`=ARRAYFORMULA(IF(ROW(D{nr}:D{last})=ROW(D{nr}), "JSON", IF(ISERROR(D{nr}:D{last}), "", IF(D{nr}:D{last}="", "", IF(F{nr}:F{last}<>TRUE, "", ","&D{nr}:D{last})))))` · F=`Displayed`.
  - range `E{first}:E{last}` = baris widget + 2 buffer. `$B$116` = cell judul global ("Vertika Tekno Lokacipta").
- **Widget rows:** A=seq (1..N) · B=nama widget · C kosong · D=`=VLOOKUP(B{r},Widget!$A:$G,7,FALSE)` · **E kosong** (spill dari name-row arrayformula ngisi; JANGAN tulis) · F=`TRUE` (boolean).
- **col D = FORMULA, NEVER literal JSON.** Unique widget → `=VLOOKUP(...)`. Generic (ada `[PLACEHOLDER]`) → `=SUBSTITUTE(VLOOKUP(...),"[TOK]",{helperCol})` — value **point ke helper column** (G/H/I…), bukan literal inline.

### Prosedur build (urutan aman)
1. Bikin Widget rows (I/J/G/H) buat widget baru. **Verify**: col A spill (nama muncul), G resolve JSON, no #REF.
2. Tulis page-row block: widget rows (A:D + F) → name row (A:F). E widget rows dibiarin kosong.
3. **Verify**: assembled `B{name row}` = JSON valid, no #N/A, no #REF.

### DSL token
| token | arti |
|---|---|
| `◼` | eq (`key◼value`) |
| `⭘` | AND (pemisah pasangan) |
| `★` | keyed search di `updateEventRow` (`search◼key★{tok}`) |
| `◁N▷` | input form di posisi N |
| `◀N▶` | system stream (mis. `◀2▶` = timestamp/gps) |
| `<N>` | token baked spreadsheet (mis. `<2>` = nama gudang) |
| `{x}` | token runtime/session (`{vehicleId}`,`{today}`,`{driverVid}`,`{driverName}`,`{activeTaskVid}`…) |

- **search** (state-read WHERE): `key◼value⭘key2◼value2`, left = short-code/index.
- **updateEventRow** (scalar write): `84214220504259//coll⭘tablevid◼20342033315492⭘search◼key★{tok}⭘field◼value`.
- **addToEvent** (event append): `84214220504259//coll⭘r◼4320⭘tablevid◼20342033315492⭘ety◼…⭘…⭘t◼◀2▶⭘ts◼◀2|T7|…▶`.
- Write dipicu **RBT savesend** (`updateEventRow`/`addToEvent`). **Array field** (ip[]/dp[]) = native Flutter, BUKAN DSL.

### Gotcha
- Flag boolean-ish (mis. `hideZero`) → **string `"TRUE"`** (konvensi user), bukan boolean.
- Token **TIDAK** auto ke-pass lintas route → pakai `routeParams` (usulan, dev pending — `docs/rbt-route-params-dev-spec.md`) ATAU reuse token session yang udah ada.
- Jangan ngarang field/widget. **Trace tiap field ke dict, tiap widget ke mockup.** Reuse/verify sebelum assert.

---

## 2. Data model (Firestore, tablevid `84214220504259`)

| collection | key | field penting |
|---|---|---|
| **item** | `ii` | `in`(nama), `ic`(kategori), `un`(unit); kardus: `cs`(child sku), `pq`(isi) |
| **stock_location** | `lv` | `ln`(nama), `lt`(type: warehouse/vehicle/client), `dv`(driver — utk vehicle) |
| **task** | `tnm` | `tty`, `tst`(status), `kl`/`kn`(customer id/nama), `al`(alamat), `vv`(mobil), `cv`/`cn`(driver), `tdt`(tgl), `it[]`(baris item) |
| **vehicle_check** | `cnm` | `cty`(opening), `vv`, `cdt`(tgl), `ie[]`(manifest gudang), `ip[]`(hitung driver), `cst`(status custody), `rs`(reconcile), `gv`/`gn`(loader), `ldt` |
| **movement** | — | SSOT immutable; `mt`(DROP/PICKUP/SALE/PURCHASE/REFILL/INTERNAL), `fl`/`tl`, `ii`, `cd`, `qt` (CF derive asset_cache) |
| **asset_cache** | `lv__ii__cd` | stok per (lokasi,item,kondisi); `qt`. CF-derived / hand-seed |
| **evidence** | — | `ety`(photo/gps/signature/notes), `erf`(parent ref), `ept`(parent type), `i`, `la`/`lo`, `d`(isi), `ec`(kategori — baru), `cv`/`cn`, `t` |

**Status:** `task.tst` ∈ `assigned` / `load_rejected` (tolak sebelum berangkat) / `failed` (gagal saat eksekusi) / `completed`. `vehicle_check.cst` ∈ `awaiting_custody` / `custody_confirmed`; `rs` = discrepancy_detected dll.

**tx model (`task.it[]`):** `tx` ∈ `deliver`/`sale`/`refill`/`purchase`. Qty: `pd`(antar/drop), `pp`(ambil/pickup), `ps`(jual/sale), `pb`(beli/purchase), `pr`(tukar/refill); `cdo`/`cdi`(kondisi keluar/masuk). **Muat ke kendaraan = `pd+ps+pr`** (deliver+jual+tukar). `pb`(beli di customer) + `pp`(kosong balik) TIDAK dimuat.

Redesign movement/cache/item (DRAFT, belum diketok): `docs/redesign-movement-cache-item-techlead.md`.

---

## 3. Yang udah dibangun (Driver) — contoh pola

Driver runtime LIVE di op1Screen. Page (route = `vertikaTeknoLokacipta`+suffix):

| row | page | row | page |
|---|---|---|---|
| 1007 | DriverHome | 1066 | TaskFeed |
| 1016 | CustodyNotification | 1071 | DeliveryWorkspace |
| 1024 | CustodyCount | 1079 | ReturnVehicle |
| 1035 | CustodyReveal | 1086 | RejectTask |
| 1042 | CustodySuccess | 1093 | FailedDelivery |
| 1050 | MismatchReport | | |
| 1059 | MismatchSubmitted | | |

Widget rows 198–237. Index lengkap: `docs/driver-runtime-widgets-MASTER-handoff.md`. Spec per-page: `docs/driver-*.md`. JSON snapshot: `json/driver-runtime/*.json`.

---

## 4. Workflow build (ikutin proses ini)

1. **Ground di mockup** — trace tiap field ke dict, tiap widget ke mockup. NO hallucination.
2. **Reuse-first** — komposisi widget existing dulu (bikin gap table reuse-vs-new). Type baru = biaya koordinasi dev.
3. **Build** — Widget rows (kalau baru) → op1Screen page-row block (VLOOKUP) → **verify live** (no #N/A, col-A utuh).
4. **Dev spec** — tulis `docs/<fitur>-dev-spec.md` (audience: Flutter dev): struktur page, widget, write DSL, open items. Yang jadi tugas dev = **renderer + CF**; config sheet = lo.
5. **Sync json** — `json/<fitur>/*.json` (snapshot assembled page = cell B name-row).
6. **Memory** — simpan konvensi/learning durable ke `MEMORY.md` + file memory.

---

## 5. Gimana Admin & Gudang nyambung ke data Driver

Collection sama, pola build sama, **page beda**.

- **Admin** — bikin/assign `task` (tnm, vv=mobil, cv=driver, it[]), assign mobil ke driver (`stock_location.dv`), reschedule task `load_rejected`/`failed` (baca `evidence` ec/notes), monitoring. Tulis `task` + baca `evidence`/`vehicle_check`.
- **Gudang** — bikin `vehicle_check` opening (manifest `ie[]`), muat kendaraan (INTERNAL `movement` → `asset_cache`), validasi return (ReturnVehicle reconciliation). Tulis `vehicle_check` + `movement`.

Detail page = dari mockup masing-masing (dikirim di session fitur-nya).

---

## 6. Pointer

- **Memory** (auto-load via MEMORY.md) — wajib paham: `op1screen_widget_tab_convention` (col-A rule + page-row + col-D resolver), `reference_driver_write_dsl` (updateEventRow/addToEvent), `reference_op1screen_driver_widgets` (Widget rows live + renderer pending), `feedback_no_hallucination`, `feedback_reuse_first_widget`, `reference_selectable_btn_widget`, `reference_route_params`.
- **Dev spec contoh** — `docs/driver-*.md`, `docs/rbt-route-params-dev-spec.md`, `docs/precondition-gate-card-manifest-dev-spec.md`.
- **Seed** — `scripts/driver-runtime-seed.js` + dict book `1_XHmo5…` (Master_*/Setup/Tugas/Barang).
- **Detail mentah** — transcript session driver (`.jsonl` di folder session) kalau butuh keputusan super spesifik.
