# Dev Spec (CF/Go) — movement audit denorm: `vv`/`tr`/`av`/`an`/`in`

**Tanggal:** 2026-07-08
**Buat:** CF dev (Go — repo cloud-function). Konsumen: timeline audit stok admin/supervisor (`stock-history` page). Tujuan: bisa filter movement per-mobil/per-trip + tau SIAPA + nama item kebaca.
**Sifat:** field AUDIT-ONLY. `OnMovementCreated` (derive engine) **TIDAK diubah** — balance tetap dari `fl`/`tl`/`qt`. Idempotency tetap (mid deterministik). Backfill gak perlu (data demo di-reset).

---

## 0. Kenapa

Timeline audit butuh:
1. **Filter per-mobil/trip** — movement gak punya `vv`/`tr` (cuma `fl`/`tl` = 2 field OR-query, gak bisa search DSL single-field). → tambah `vv` + `tr`.
2. **Akuntabilitas "siapa"** — `dv`/`dn` driver-only + gudang movement (openload/closeunload) gak ada actor sama sekali. → tambah `av`/`an` generik, SEMUA emitter isi.
3. **Nama item kebaca** — widget TIMELINE gak bisa join → `<ii>` tampil ID. → denorm `in`.

## 1. Field baru (5)

| field | isi | tipe |
|---|---|---|
| `vv` | vehicle vid yang terlibat | String |
| `tr` | trip id (= doc-id opening vehicle_check trip itu) | String |
| `av` | actor vid (yang MICU movement) | String |
| `an` | actor name (denorm) | String |
| `in` | item name (denorm) | String |

## 2. Sumber per emitter (grounded ke kode)

| CF (file) | movement | `vv` | `tr` | `av`/`an` | `in` |
|---|---|---|---|---|---|
| `OnVehicleOpening` (vehicle_opening_trigger.go, emitOpeningLoad) | openload | check `vv` | check doc-id (`cnm`/parsed = trip) | `gv`/`gn` (gudang loader) | lookup `item.in` by ii |
| `OnVehicleClosing` (vehicle_closing_trigger.go, closingUnloadDoc) | closeunload | check `vv` | opening trip id (derive: opening yg `cty=opening⭘vv=check.vv⭘cdt=check.cdt`, ambil doc-id) | `cv`/`cn` (checker) | lookup `item.in` |
| `OnTaskCompleted` (task_complete_trigger.go) | drop/pickup/sale/buy/refill | `task.vv` | `task.tr` | `task` driver = stock_location.dv/dn (vehicle's driver) | `it[].in` (udah ada) |
| `OnTaskRejected` (task_reject_trigger.go, emitUnloadMovements) | unload | `task.vv` | `task.tr` | vehicleDriver() (udah dipanggil) + name | `it[].in` (udah ada) |
| `OnCustodyConfirmed` (custody_confirm_trigger.go) | adjustment | check `vv` | opening trip id | driver yg confirm (check `gv`? atau dv) | lookup `item.in` |
| `OnNotaCreated` (walkin_nota_trigger.go) | sale | `""` (bukan mobil — depot) | `""` | nota `cv`/`cn` (kasir) | `li[].in` (udah ada) |

- **`vv`/`tr`/`av`/`an`/`in`** ditambah ke map doc movement tiap emitter (1-5 baris per file).
- **`in` lookup (open/close/adjustment):** ie[]/ip[] cuma bawa `ii` (gak ada nama). ⚠️ **item doc-id = AUTO-ID, `ii` = FIELD** (seed line 24 + `key:'ii'` = field-match upsert, BUKAN docIdFields). Jadi **`Where("ii","==",ii).Limit(1)`, BUKAN `Get(ii)`.** Optimasi: query SEMUA item 1× per-invocation → map `ii→in` cache (item ~10 doc), jangan per-line. Task/nota movement gak perlu (it[].in / li[].in udah denorm).
- `tr` open/close/adjustment: derive dari opening doc trip itu (sama pola `recomputeIE` yg udah query opening by vv+cdt). Task movement: `task.tr` langsung.

## 2b. ⚠️ Konfirmasi dev CF 2026-07-08 (jawaban 4 pertanyaan)

1. **`an` = stock_location.dn — dn LIVE.** Komentar `task_reject_trigger.go:179` ("no name source") STALE. dn di-set pas O1 opening designate (`updateEventRow stock_location⭘dv◼{chosenVid}⭘dn◼{chosenName}`), clear `""` pas closing. Reject = fase opening → dn keisi. `vehicleDriver()` return dv **DAN** dn.
2. **OnCustodyConfirmed `av`/`an` = vehicleDriver() dv/dn.** ACC — yg confirm = DRIVER. Bukan gv.
3. **`in` lookup = query by field `ii`, BUKAN Get(ii)** (item doc-id auto). Lihat §2 (dikoreksi).
4. **Opening `gv`/`gn` LIVE** (Firestore opening doc: gv/gn keisi). openload `av`/`an` = gv/gn (loader gudang). Fallback `""` cuma kalo kebetulan kosong (tolerant, jangan block).

## 3. Yang GAK berubah

- `OnMovementCreated` — derive balance dari fl/tl/qt, field baru diabaikan (audit-only). Nol perubahan.
- mid deterministik → idempotent tetep.
- `dv`/`dn` existing dibiarin (driver-specific, backward-compat). `av`/`an` = actor generik (buat driver movement, `av`==`dv`).

## 4. Acceptance

1. Tiap movement baru punya `vv` (kecuali walk-in nota = `""`), `av`/`an` keisi (siapa pun rolenya), `in` = nama item.
2. Task-based movement: `tr` = task.tr. Open/close/adjustment: `tr` = opening trip doc-id.
3. Query `movement WHERE vv==<vehicleId>` balik semua event mobil itu (timeline per-mobil). `WHERE tr==<tripId>` = per-trip.
4. Balance asset_cache TIDAK berubah vs sebelum (audit field gak ganggu derive). Reconcile hasil sama.
5. Walk-in nota movement: `vv:""`, `av`/`an` = kasir, `in` = nama produk.

---

## 5. SEKALIAN — task `dn`/`ln` denorm buat Surat Jalan (2026-07-08)

Surat Jalan (dokumen kirim driver) butuh **Sopir** (nama driver) + **No. Pol** (plat) — dua-duanya GAK ada di `task` (task cuma punya `vv`=vid mobil + `cn`=admin pembuat). PRN gak bisa join → denorm.

**Stamp di `OnVehicleOpening` (tempat yang SAMA dgn `tr` — `stampTrips`):** pas trip di-load, tiap task di-stamp:
- **`dn`** = `stock_location.dn` (nama sopir) — lookup by vv (dv/dn udah di-set pas O1 designate, dn LIVE per §2b#1).
- **`ln`** = `stock_location.ln` (plat mobil) — lookup by vv (same doc).
- **`ts`** = tanggal ter-format (buat Surat Jalan "19 Jun 2026 · 08:42") — CF format `tdt` (atau waktu load) → String, mis. `time.Unix(tdt/1000,0).In(wibZone).Format("02 Jan 2006 · 15:04")`. Task cuma punya epoch (`t`/`tdt`), gak ada string ter-format (beda dari nota yg `ts`-nya ditulis submit). PRN gak bisa format epoch → butuh `ts` denorm. `{{ts}}` di template Surat Jalan.

1 lookup stock_location by vv (udah ke-query buat vehicleDriver pola sejenis) → ambil `dn` + `ln` → merge ke task bareng `tr`. Nol emitter tambahan, nebeng stampTrips.

**Acceptance:** task hasil opening punya `dn` (nama sopir) + `ln` (plat) → Surat Jalan PRN bisa tampil "Sopir: Budi Santoso / No.Pol: B 9214 KXM" tanpa join.

Task dict: +`dn` (#17) +`ln` (#18) denorm (mirror stock_location; di-set OnVehicleOpening, ikut lifecycle trip).

---

## 6. ADDENDUM 2026-07-08 — 3 field buat timeline `TIMELINE:ledger` (badge aksi + nama lokasi)

Konsumen `stock-history` = widget BARU `TIMELINE variant:ledger` (spec `timeline-ledger-variant-dev-spec.md`). Butuh 3 field lagi (nebeng lookup §2 yg udah ada, `OnMovementCreated` tetep abaikan — audit-only):

| field | isi | catatan |
|---|---|---|
| `ac` | aksi spesifik (string konstan per-emitter) | `openload`/`closeunload`/`drop`/`pickup`/`sale`/`buy`/`refill`/`adjust`/`unload`. Tiap emitter udah action-specific → tulis 1 literal. **Fix ambiguitas: dulu openload & closeunload sama-sama `mt:INTERNAL`; `ac` pisahin jadi Muat vs Turun.** WAJIB (murah). |
| `fln` | nama lokasi asal (kebaca) | task movement: `fl`=mobil → `task.ln` (plat); opening: nama gudang; closing: `fl`=mobil → plat. Fallback `""` |
| `tln` | nama lokasi tujuan (kebaca) | drop: `tl`=customer → `task.kn` (denorm udah ada di task); opening: `tl`=mobil → plat; closing: nama gudang. Fallback `""` |

- `ac` = **wajib** (badge kebaca). `fln`/`tln` = nice-to-have; kalo susah dapet nama boleh `""` (widget degrade, gak block). JANGAN block emit gara2 nama kosong.
- Per emitter `ac` literal: `OnVehicleOpening`→`openload`, `OnVehicleClosing`→`closeunload`, `OnTaskCompleted`→per-tx (`drop`/`pickup`/`sale`/`buy`/`refill` — udah ada mapping tx→movement), `OnTaskRejected`→`unload`, `OnCustodyConfirmed`→`adjust`, `OnNotaCreated`→`sale`.
- `fln`/`tln` nebeng lookup yg udah dipake buat `in`/`an` (nol emitter/query baru signifikan — task movement malah udah punya `ln`/`kn` di task).

**Acceptance tambahan:** tiap movement punya `ac` (badge ledger kebaca, openload≠closeunload). `fln`/`tln` keisi kalo nama tersedia.

### ⚠️ LIVE-BUG 2026-07-09 — `fln`/`tln` INKONSISTEN antar-emitter (nama gudang kosong di close/adjust)

Timeline ledger LIVE nampilin arah, TAPI **tujuan kosong** ("B 5678 CD → ") di beberapa movement:

| ac (badge) | emitter | fln | tln | status |
|---|---|---|---|---|
| openload (Muat) | OnVehicleOpening | Gudang Bintaro ✓ | B 5678 CD ✓ | **JALAN** |
| drop (Antar) | OnTaskCompleted | B 5678 CD ✓ | Honda Bintaro ✓ | **JALAN** (task.ln/kn) |
| **closeunload (Turun)** | OnVehicleClosing | B 5678 CD ✓ | **KOSONG** ✗ | harusnya **Gudang Bintaro** |
| **adjust (Sesuai)** | OnCustodyConfirmed | ? | **KOSONG** ✗ | harusnya nama gudang/mobil |

**Root:** `OnVehicleOpening` udah lookup nama gudang buat `fln` (jalan). `OnVehicleClosing` + `OnCustodyConfirmed` **gak isi `tln` (nama gudang)** — skip lookup. Kode lookup gudang-name UDAH ADA (opening pake) → tinggal close/adjust panggil yg sama buat `fl`/`tl` yang = warehouse.

**Fix:** SEMUA emitter denorm `fln`+`tln` KONSISTEN. Buat lokasi = warehouse → lookup `stock_location.ln` by lv (sama kaya opening). Buat mobil → plat. Buat customer → task.kn. Target: tiap movement `fln`/`tln` KEDUANYA keisi nama kebaca (Gudang → Mobil, Mobil → Customer, Mobil → Gudang), gak ada tujuan kosong.

**Acceptance:** Turun = "B 5678 CD → Gudang Bintaro". Sesuai = arah lengkap dua sisi. Nol "→ " (tujuan kosong) di ledger.

---

**Referensi:** `movement` dict (tab, + ADDENDUM audit-denorm), `vehicle_opening_trigger.go`/`vehicle_closing_trigger.go`/`task_complete_trigger.go`/`task_reject_trigger.go`/`custody_confirm_trigger.go`/`walkin_nota_trigger.go` (emitters), timeline audit page `stock-history` (konsumen — widget `TIMELINE:ledger`, spec `timeline-ledger-variant-dev-spec.md`).
