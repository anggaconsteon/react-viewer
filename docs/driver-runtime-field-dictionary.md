# Driver Runtime — Field Dictionary (short code, UNIK per fungsi)

Acuan reuse = dictionary book `1_XHmo5…` (tab `addToEvent`, `location`). Aturan: **fungsi sama → key lama; fungsi beda → key UNIK (gak nabrak, gak dipakai 2 collection untuk arti beda).**
Legend src: ✓ = reuse key existing · ✚ = key baru.

---

## A. Key DIPAKAI BARENG (fungsi IDENTIK di semua collection)
| code | field | kenapa boleh bareng |
|---|---|---|
| `r` `tablevid` `p` `ev` | envelope DSL | sama di tiap doc |
| `t` (/ `ts`) | occurred_at: `t`=epoch (semua coll, sort/query) / `ts`=string **cuma `movement`** (ledger; coll lain format `t` di widget) | "kapan kejadian" |
| `et` | waktu server tulis | synchronized_at / last_computed_at |
| `search` | kunci cari `★…☆…` | doc yg di-update |
| `VID` / `n` | driver vid / nama | identitas orang (workforce) |
| `cv` / `cn` | creator/actor vid / nama | pembuat doc (task admin / evidence uploader / investigation supervisor). **movement actor = `dv`/`dn`** (driver yg scan) per SSOT |
| `ii` | item id | identitas item (master + FK) — barang yg sama |
| `lv` | location id | identitas stock_location (master + FK) |
| `lt` | location_type | tipe lokasi (warehouse/vehicle/client) |
| `ln` | location name | nama lokasi |
| `la` / `lo` | geo lat / long | titik koordinat |
| `i` | image url | foto / tanda tangan |
| `d` | free text | catatan / notes / content |
| `cd` | kondisi (full\|empty) | nilai kondisi 1 baris |
| `qt` | quantity (unit count) | jumlah unit |

> Ini SATU barang yg muncul di banyak tempat (item id, lokasi id, waktu, aktor, foto, qty). Bukan "key beda arti" — jadi tetap 1 key.

## B. Key UNIK per collection (fungsi BEDA → key beda)
Yg dulu dipakai ulang (`ty`,`st`,`nm`,`rf`,`dt`,`ce`) sekarang dipecah:
| konsep | task | movement | vehicle_check | evidence | investigation | item | stock_location |
|---|---|---|---|---|---|---|---|
| **type** | `tty` | `mt` | `cty` | `ety` | — | `ic`(kategori) | — |
| **status/state** | `tst` | — | `rs`(rekon) | — | `vst` | `ist` | `lst` |
| **doc number/id** | `tnm` | (auto) | `cnm` | (auto) | `vnm` | `ii` | `lv` |
| **ref induk** | — | `mrf`→task | — | `erf`→induk | `vrf`→sumber | — | — |
| **parent type** | — | — | — | `ept` | `vpt` | — | — |
| **date (bisnis)** | `tdt` | — | `cdt` | — | — | — | — |
| **end time** | `tce` | — | — | — | `vce` | — | — |

---

## workforce — driver (REUSE, no field baru) — Delta 9
`VID`✓ vid · `n`✓ nama · `st`✓ status(existing "on") · `search`✓ `VID★…☆sv★…`
> buang `role` & `active`.

## item — master barang
| code | src | field | allowed / contoh |
|---|---|---|---|
| `ii` | ✓ | item id | galon |
| `in` | ✚ | nama | Galon Air 19L |
| `ic` | ✚ | kategori | returnable \| consumable |
| `tc` | ✚ | kondisi dilacak (array) | [full, empty] (returnable) \| [full] (consumable) |
| `un` | ✚ | unit | pcs \| kg |
| `ist` | ✚ | status | active \| inactive |
| `wt` | ✚ | water_type (SKU refill; null non-refill) | ro \| refill \| null |

## stock_location — gudang / mobil / customer (1 collection)
| code | src | field | allowed / contoh |
|---|---|---|---|
| `lv` | ✓ | location id | VEH-B1234XY |
| `lt` | ✓ | tipe | warehouse \| vehicle \| client \| store |
| `ln` | ✓ | nama | B-1234-XY |
| `al` | ✚ | alamat | — |
| `la`/`lo` | ✓ | geo | -6.31 / 106.64 |
| `dv` | ✚ | driver aktif (vehicle only) | 8754… |
| `lst` | ✚ | status | active \| inactive |

## task — 1 stop pengiriman
| code | src | field | allowed / contoh |
|---|---|---|---|
| `tnm` | ✚ | task no (id) | TASK-20260612-001 |
| `tty` | ✚ | task_type | delivery \| pickup_return |
| `tst` | ✚ | execution_state | draft\|assigned\|ready\|on_delivery\|completed\|validated\|closed\|load_rejected |
| `kl` | ✚ | lokasi customer (FK id) | →stock_location |
| `kn` | ✚ | nama customer (denorm, buat tampil) | Honda Bintaro |
| `al` | ✚ | alamat (denorm) | Jl. Sudirman 54 |
| `gl` | ✚ | gudang asal (FK id) | →stock_location |
| `vv` | ✚ | mobil | →stock_location |
| `cv`/`cn` | ✓ | dibuat oleh (admin) | — |
| `tdt` | ✚ | scheduled_date (**Number epoch-midnight-ms**, eq-match `{today}`) | 1781715600000 |
| `it` | ✚ | items (array, plan vs aktual; multi-tx) | [{ii,in,tx,cdo,cdi,pd,pp,ad,ap,ps,as,pb,ab,pr,ar}] |
| `t` | ✓ | created_at (epoch; format widget) | — |
| `tce` | ✚ | completed_at | epoch |
| `search` | ✓ | `tnm★TASK-…` | — |

**`it[]`:** `ii`✓ item id (FK) · `in`✓ nama item (denorm) · `tx`✚ transaction_type (deliver\|sale\|purchase\|refill, default deliver) · `cdo`✚ condition_out (full\|empty) · `cdi`✚ condition_in (full\|empty\|null) · `pd`✚ planned_drop · `pp`✚ planned_pickup · `ad`✚ actual_drop · `ap`✚ actual_pickup · `ps`✚ plan_sale · `as`✚ actual_sale · `pb`✚ plan_buy · `ab`✚ actual_buy · `pr`✚ plan_refill · `ar`✚ actual_refill
> `pd`/`pp` = deliver-only (Σ bersih). tx≠deliver pakai slot sendiri (`ps/as` sale, `pb/ab` buy, `pr/ar` refill). Reject task = `tst→load_rejected` (vv DIPERTAHANKAN buat audit Admin) + evidence note. Reassign=Admin set vv+tst. Detail: `docs/driver-runtime-transaction-delta.md`.

## movement — ledger pindah (collection sendiri → robot baca → asset_cache)
| code | src | field | allowed / contoh |
|---|---|---|---|
| `mt` | ✚ | movement_type | GENESIS\|DROP\|PICKUP\|INTERNAL\|SALE\|PURCHASE\|REFILL\|DAMAGE\|LOST\|ADJUSTMENT |
| `fl` | ✚ | from_location | →stock_location? |
| `tl` | ✚ | to_location | →stock_location? |
| `ii` | ✓ | item | galon |
| `cd` | ✓ | kondisi | full \| empty |
| `qt` | ✓ | qty (selalu +) | 5 |
| `dv`/`dn` | ✓ | driver yg scan (Delta 3) | 8754… |
| `mrf` | ✚ | ref task | →task `tnm` |
| `t`/`ts` | ✓ | occurred_at (HP) | — |
| `et` | ✓ | synchronized_at (server) | — |
| `er` | ✚ | emitter_runtime (Delta 4) | DRIVER\|VEHICLE\|SUPERVISOR\|ADMIN |
| `d` | ✓ | notes | — |

## vehicle_check — custody opening + rekonsiliasi closing (driver, Delta 7)
| code | src | field | allowed / contoh |
|---|---|---|---|
| `cnm` | ✚ | check no (id) | CHK-VEH-B1234XY-20260612 |
| `cty` | ✚ | check_type | opening \| closing |
| `cst` | ✚ | **trip/custody status** — anchor di opening doc. **3 nilai (model B):** awaiting→confirmed (**tetep selama rute**)→closed. Fase rute (`on_delivery`/`returning`) = **`task.tst`**, BUKAN cst (biar gate `cst◼custody_confirmed` gak break pas rute). Gate P4 baca `custody_confirmed`; selisih via `rs` | awaiting_custody \| custody_confirmed \| closed |
| `vv` | ✚ | mobil | →stock_location |
| `gl` | ✚ | gudang | →stock_location |
| `cv`/`cn` | ✓ | checker = DRIVER | Budi |
| `cdt` | ✚ | check_date (**Number epoch-midnight-ms**, eq-match `{today}`) | 1781715600000 |
| `ip` | ✚ | items_physical | [{ii,cd,qt}] |
| `ie` | ✚ | items_expected — manifest GUDANG. Keisi saat **OPENING** juga (dibanding vs `ip` driver, P6 reveal), bukan cuma closing | [{ii,cd,qt}] |
| `rs` | ✚ | reconciliation_state | matched \| discrepancy_detected |
| `dp` | ✚ | discrepancies | [{ii,cd,ex,ac,dl}] |
| `t` | ✓ | occurred_at (epoch) | — |
| `gv`/`gn` | ✚ | loader gudang vid/nama ("dimuat oleh") — gudang-app nulis nanti, TAPI data **pre-seed wajib** (gudang muat sebelum driver dateng) | 80883902551147 / Anton Pratama |
| `ldt` | ✚ | load datetime (jam muat, epoch) — **pre-seed wajib** (sama: gudang precedes driver) | 1781744000000 |

**`dp[]`:** `ii`✓ · `cd`✓ · `ex`✚ expected · `ac`✚ actual · `dl`✚ delta

> **Trip model (2026-06-17):** opening vehicle_check = **anchor 1 trip** (1 driver=1 vehicle=1 trip SEKARANG; future driver bisa N trip & pilih). `cst` = custody status **3-nilai** (awaiting_custody→custody_confirmed→closed); diem di `custody_confirmed` selama rute (fase rute = `task.tst`); closing→`closed`. `cv`/`cn` = checker DRIVER (yg jalanin); `gv`/`gn` = loader GUDANG (yg muat) — beda aktor. Link task↔trip = `(vv, tanggal)`, bukan FK. `gv`/`gn`/`ldt`/`ie`@opening = **gudang-flow (next feature)**, struktur disiapin dari sekarang.

## evidence — foto / ttd / gps / note
| code | src | field | allowed / contoh |
|---|---|---|---|
| `ety` | ✚ | evidence_type | photo \| gps \| signature \| notes |
| `erf` | ✚ | ref induk | id |
| `ept` | ✚ | tipe induk | movement \| task \| check \| investigation |
| `i` | ✓ | storage_path (photo/ttd) | gs://… |
| `la`/`lo` | ✓ | gps | — |
| `d` | ✓ | content (note) | — |
| `cv`/`cn` | ✓ | uploaded_by | Budi |
| `t` | ✓ | occurred_at (epoch) | — |

## investigation — tindak lanjut selisih (supervisor)
| code | src | field | allowed / contoh |
|---|---|---|---|
| `vnm` | ✚ | inv no (id) | INV-2026-001 |
| `vst` | ✚ | investigation_state | pending_review\|under_investigation\|clarification_requested\|resolved\|closed |
| `rt` | ✚ | resolution_type | clean\|with_adjustment\|damage_confirmed\|loss_confirmed |
| `vrf` | ✚ | sumber | id (check/movement) |
| `vpt` | ✚ | tipe sumber | check \| movement |
| `cv`/`cn` | ✓ | supervisor | — |
| `t` | ✓ | opened_at (epoch) | — |
| `vce` | ✚ | resolved_at | epoch |
| `search` | ✓ | `vnm★INV-…` | — |

## asset_cache — saldo (ROBOT tulis, app BACA)
doc id = `{lv}__{ii}__{cd}` (cth `VEH-B1234XY__galon__full`)
| code | src | field | contoh |
|---|---|---|---|
| `lv` | ✓ | location | VEH-B1234XY |
| `lt` | ✓ | location_type (denorm) | vehicle |
| `ii` | ✓ | item | galon |
| `cd` | ✓ | kondisi | full |
| `qt` | ✓ | qty terkini | 25 |
| `lm` | ✚ | last_movement ref | mov-id |
| `t` | ✓ | last_movement_at | — |
| `et` | ✓ | last_computed_at (sistem) | — |

## asset_cache_monthly — rekap saldo per bulan (ROBOT tulis, app BACA) — 2026-06-22
doc id = `{lv}__{ii}__{cd}__{YYYYMM}` (cth `F62toko0099bee__galon__full__202606`). Sodara `asset_cache`; sama path tenant. Simpan angka per-bulan aja (qi/qo/qn), buka/tutup diturunkan saat baca via prefix-sum `Σ qn`. Ditulis di TRANSAKSI + marker yang SAMA dgn asset_cache (exactly-once). Bulan dari `ts` (lokal) → fallback `t` (UTC).
| code | src | field | allowed / contoh |
|---|---|---|---|
| `lv` | ✓ | location | →stock_location |
| `ii` | ✓ | item | galon |
| `cd` | ✓ | kondisi | full \| empty |
| `prd` | ✚ | period bulan `YYYYMM` | 202606 |
| `qi` | ✚ | qty masuk bulan itu (Σ sisi `tl`) | 15 |
| `qo` | ✚ | qty keluar bulan itu (Σ sisi `fl`) | 5 |
| `qn` | ✚ | net = `qi−qo` (bisa negatif) | 10 |
| `t` | ✓ | last_computed_at (epoch) | — |
> Kenapa bukan `in`/`out`/`net`: **`in` udah dipakai** (nama item di `item`+`task.it[]`). Pakai keluarga q (`qi`/`qo`/`qn`) biar konsisten sama `qt` & gak nabrak. `prd`/`qi`/`qo`/`qn`/`xa` semua dicek FREE vs **live sheet** (semua tab driver + addToEvent, 2026-06-22). Marker `asset_cache_applied` TTL field = `xa` (eXpire-At, dulu `expireAt`).
> ✅ **SUDAH dipush ke sheet `1_XHmo5…`** (tab `asset_cache_monthly`, 2026-06-22) + CODED di CF (build/test green). Tab CF-derived, gak ikut seed script.

---

## Daftar key BARU (✚) — 8 tab SUDAH ditulis ke `1_XHmo5…` (2026-06-15)
**item:** `ii`(id) `in ic tc un ist` `wt`✚(2026-06-19 tx-delta)
**stock_location:** `lt al dv lst` (+`lv` baru sbg id; `ad`→`al` biar gak nabrak task `ad`=actual_drop)
**task:** `tnm tty tst kl kn al gl vv tdt it tce` · it[]: `ii in cdo cdi pd pp ad ap` + `tx ps as pb ab pr ar`✚(tx-delta) · (`kl`/`gl`/`vv`=FK id ke stock_location; `kn`=denorm nama buat tampil; "kirim/ambil N"=derive Σpd/Σpp)
**movement:** `mt fl tl er mrf` (+`cd qt`; actor `dv`/`dn`) · `mt` enum +`PURCHASE` +`REFILL`✚(tx-delta)
**vehicle_check:** `cnm cty cdt ip ie rs dp ex ac dl`
**evidence:** `ety erf ept`
**investigation:** `vnm vst rt vrf vpt vce`
**asset_cache:** `lm`
**asset_cache_monthly:** `prd qi qo qn`✚ (2026-06-22; `in`=item-name kepakai → masuk=`qi`, keluar=`qo`, net=`qn`) · marker `asset_cache_applied` TTL field = `xa`✚ (rename dari `expireAt`)

Semua dicek gak nabrak key existing (`r fc tablevid p et ld ev ty t ts ln lq i d cv cn av an sv sn cl rf tv tn st nm ll VID n ci co is os ta la li lo ra sf en search`) DAN gak ada 1 key dipakai 2 collection untuk arti beda.

**Tx-delta keys (2026-06-19, anti-collision dicek):** `wt`(item) · `tx ps as pb ab pr ar`(task it[]) — semua FREE vs reserved+existing. Reject task = `vv→null` + evidence-note (no key/state/movement baru). Spec: `docs/driver-runtime-transaction-delta.md`.

## Next
8 tab driver-runtime SUDAH ditulis ke `1_XHmo5…` (2026-06-15): `item stock_location task movement vehicle_check evidence investigation asset_cache`. Plus `site` dipisah dari `location` (location = titik geo + `sv` FK ke site).

**Dummy data (seed Firestore) — skenario AKHIR-HARI lengkap, day 2026-06-15, vehicle F621a02a983500 / driver 87544551624342 Budi:**
- `item` (7) · `stock_location` (1 gudang + 2 mobil + 3 client) · `task` (3 stop, `tst=completed`, `it[].ad/ap` terisi = `pd/pp`, `tce` set).
- `vehicle_check` (2: OPEN custody + CLOSE rekon). OPEN `ip` full = Σ`pd`; OPEN `ie` = manifest gudang = `ip` (matched, no opening discrepancy); OPEN `gv`/`gn`/`ldt` pre-seed (Anton Pratama / `80883902551147`, muat @`1781744000000` < driver count @`1781744400000`). CLOSE `ie` empty = Σ`pp` (returnable only — Aqua600 consumable gak balik); CLOSE `gv`/`gn`/`ldt` kosong (load = opening-only); CLOSE `ip` LPG3 = 5 vs `ie` 6 → `rs=discrepancy_detected` + `dp` (−1). OPEN `cst`=`closed` (anchor, end-of-day final state; CLOSE blank — cst opening-only).
- `movement` (25 baris ledger; `mid`=seed-key): 6 GENESIS@gudang + 6 INTERNAL load gudang→mobil + 7 DROP mobil→client + 6 PICKUP client→mobil. Aqua600 = **SALE** (`tl=null`, exit system). `dv/dn` actor.
- `asset_cache` (11 baris, **hand-seed = simulasi CF**, doc-id `{lv}__{ii}__{cd}`): gudang full = GENESIS−load (Aqua41 LPG12-17 Aqua600-20 LPG3-34 LPG15-13 Amidis22); mobil empty = Σpickup (Aqua9 LPG12-3 **LPG3-6** LPG15-2 Amidis3). Mobil full = 0 (omit). Client outstanding = net 0 (DROP=PICKUP balanced, Model B) → no client row. **LPG3 mobil = 6 (ledger truth) ≠ 5 fisik** = persis selisih yg di-flag vehicle_check CLOSE (belum di-adjust, nunggu investigation).
- BELUM seed: `evidence` · `investigation`.

> ⚠️ `asset_cache` + `task.it[].ad/ap` aslinya **DITURUNKAN Cloud Function** dari `movement` (app gak pernah nulis). Hand-seed di atas = bootstrap test biar UI ada data tanpa deploy CF. Kalau CF live → CF jadi SSOT, JANGAN hand-push asset_cache lagi (`scripts/driver-runtime-seed.js` udah ada warning + skip-guidance). CF: `docs/driver-runtime-movement-cf-handoff.md`.

**Divergensi doc↔sheet — RESOLVED 2026-06-17 (SSOT = sheet `1_XHmo5…`):**
- movement_type: **`mt`** (bukan `mty`) ✓
- movement actor: **`dv`/`dn`** (Driver VID/Name, bukan `cv`/`cn`) ✓
- `ts` (occurred string): cuma di `movement`; coll lain simpan epoch `t`, format di widget (ikut `task.tdt` "raw; format in widget").

> ⚠️ `docs/driver-runtime-tables-dev-spec.md` MASIH stale (pakai `iv`/`mty`/movement `cv`-`cn`/`it[]` `pq`-`aq`/`ad`=alamat). Dokumen ini (field-dictionary) = SSOT-aligned. Re-sync tables-dev-spec belum dilakukan.
