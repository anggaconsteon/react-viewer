# Dev Spec — Movement EMIT (driver app side)

**Domain:** Driver Runtime (galon / gas delivery).
**Scope:** Sisi **EMIT** — kapan & gimana **driver app menulis `movement`** doc(s) ke ledger. Pasangannya = sisi **DERIVE** (`docs/driver-runtime-movement-cf-dev-spec.md`, Cloud Function yg nurunin `asset_cache` + `task.it[].ad/ap` dari movement).
**SSOT field codes:** `docs/driver-runtime-field-dictionary.md` + dictionary sheet `1_XHmo5…` (tab `movement`/`task`/`stock_location`). Doc ini **tidak** mendefinisikan ulang field — selalu cek dua sumber itu. JANGAN ngarang field.

> Prinsip (dari CF spec P1–P3): `movement` = SSOT append-only immutable. App tulis **movement DULU**; `asset_cache` & `task.it[].ad/ap` = DERIVED (CF only, app gak pernah nulis saldo/actual). App pegang lifecycle (`task.tst`/`tce`).

---

## 0. ARSITEKTUR — CF-emit (PIVOT 2026-06-24, owner ACC)

⚠️ **Movement EMIT delivery = CF (`OnTaskCompleted`), BUKAN app-emit (◆-loop).** Mirror `OnTaskRejected`:
- **App** (DeliveryWorkspace "Kirim"): set `tst=completed` (UDAH jalan). Phase 2: tulis actual ke `task.it[]` (native array `ad/ap/as/ab/ar`).
- **CF `OnTaskCompleted`** (trigger task `tst→completed`, fresh transition): loop `it[]` + cabang by `tx` → emit movement → CF (`OnMovementCreated`) derive asset_cache.
- **qt = `actual ?? plan`** (`ad ?? pd`, dst) → Phase 1 (demo, actual belum ditulis) pakai PLAN; Phase 2 (app tulis actual) auto-pakai ACTUAL. **1 CF, no rework, demo jalan tanpa nyentuh app.**

**Kenapa CF (bukan app ◆-loop):** konsisten `OnTaskRejected` (CF loop it[] + create movement, N dinamis gampang); app gak perlu build payload `addToEvent` dinamis. §3-4 di bawah (app-emit/renderer loop) = **SUPERSEDED** → jadi referensi shape movement doang.

**Movement per tx (CF emit; lokasi dari task `vv`=mobil, `kl`=customer):**
| `tx` | movement(s) | fl→tl | cd | qt |
|---|---|---|---|---|
| `deliver` | **DROP** + **PICKUP** | vv→kl ; kl→vv | `cdo`(full) ; `cdi`(empty) | `ad??pd` ; `ap??pp` |
| `sale` | **SALE** | vv→∅ (keluar sistem) | `cdo`(full) | `as??ps` |
| `purchase` | **PURCHASE** | kl→vv | `cdi`(empty) | `ab??pb` |
| `refill` | **REFILL** (DROP full + PICKUP empty) | vv→kl ; kl→vv | full ; empty | `ar??pr` (dua-duanya) |

Idempotent: deterministic mid (`drop-{tnm}-{ii}`, `pickup-{tnm}-{ii}`, `sale-{tnm}-{ii}`, dst), AlreadyExists→skip. `mrf=tnm`, `dv`=driver, `er=DRIVER`, `t`/`ts` WAJIB (monthly bucket). Skip baris qt≤0. Gate FRESH `tst→completed` (old≠completed).

**Status:** ✅ CF `task_complete_trigger.go` (+`_test.go`) **CODED 2026-06-24** (go build/vet/test green; pure `deliveryMovements`/`qtFor` unit-tested). Deploy pending (`--entry-point=OnTaskCompleted`, trigger task document.updated; no new index). Phase-2 TODO (renderer): ITEM_EXECUTION_LIST capture + tulis actual (`ad/ap/as/ab/ar`) ke it[] → CF auto-pakai actual. Detail: `cloud-function/docs/CF-SESSION-HANDOFF.md` §2B.

---

## 1. Di mana movement di-emit (driver app)

| page / aksi (route) | emit movement? | tipe | sumber qty |
|---|---|---|---|
| **DeliveryWorkspace "Kirim"** (`…DeliveryWorkspace`, RBT savesend) | ✅ **YA** | per item-line, by `tx`: DROP+PICKUP / SALE / PURCHASE / REFILL | **driver-entered actual** (eksekusi) |
| **RejectTask "Kembalikan ke Admin"** (`…RejectTask`, RBT savesend) | ✅ **YA** | per item-line: INTERNAL (unload mobil→gudang) | **planned** `pd+ps+pr` dari `task.it[]` |
| CustodyNotification / CustodyCount / CustodyReveal / CustodySuccess / MismatchReport | ❌ tidak | — | custody confirm = flip `cst` aja; loading mobil = movement GUDANG (di luar driver app) |
| FailedDelivery | ❌ tidak | — | barang tetap di kendaraan (`tst=failed`, reschedule) |
| ReturnVehicle "Serahkan ke Gudang" | ❌ **tidak** (owner confirm 2026-06-24) | — | driver cuma lapor "selesai"; closing + movement = **GUDANG** (CF kedua `vehicle_check cty=closing`) |

---

## 2. Resolusi lokasi (`fl`/`tl`) — dari field `task`

Semua lokasi = FK ke `stock_location` (`lv`), diambil dari task aktif:

| token task | arti | dipakai sbg |
|---|---|---|
| `vv` | mobil | vehicle `lv` |
| `kl` | lokasi customer | client `lv` |
| `gl` | gudang asal | warehouse `lv` |
| `tnm` | task id | `mrf` (ref task di movement) |

---

## 3. Aturan movement per page

Catatan umum tiap movement doc:
`84214220504259//movement ⭘ r◼<ret> ⭘ tablevid◼20342033315492 ⭘ mt◼<TYPE> ⭘ fl◼<lv|—> ⭘ tl◼<lv|—> ⭘ ii◼<itemId> ⭘ cd◼<full|empty> ⭘ qt◼<n> ⭘ mrf◼{tnm} ⭘ dv◼{driverVid} ⭘ dn◼{driverName} ⭘ er◼DRIVER ⭘ t◼◀2|T7|epoch▶ ⭘ ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶`
(`qt` selalu > 0; arah dari `fl`/`tl`; omit field = null.)

### 3.1 DeliveryWorkspace "Kirim" — per baris `it[]`, cabang by `tx`

| `tx` | movement(s) | fl | tl | cd | qt |
|---|---|---|---|---|---|
| `deliver` (default) | **DROP** + **PICKUP** | DROP `vv`→`kl`; PICKUP `kl`→`vv` | — | DROP `cdo`, PICKUP `cdi` | DROP = actual_drop, PICKUP = actual_pickup |
| `sale` | **SALE** | `vv` | `null` (keluar sistem) | `cdo` (full) | actual_sale |
| `purchase` | **PURCHASE** | `kl` | `vv` (naik ke mobil) | `cdi` | actual_buy |
| `refill` | **REFILL** | `kl`↔`vv` (swap) | — | per kondisi | actual_refill — **OPEN R1: 1 doc REFILL atau 2 doc (DROP full + PICKUP empty)?** |

`mrf◼{tnm}` di semua (task-bound → CF isi `ad`/`ap`).
`qt` = **actual yg di-input driver** di ITEM_EXECUTION_LIST (bukan `task.it[].ad` — itu hasil CF). Skip baris yg actual-nya 0.

### 3.2 RejectTask "Kembalikan ke Admin" — per baris `it[]`

Unload muatan balik ke gudang (handoff §6, confirmed):
- **INTERNAL** · `fl◼{vv}` · `tl◼{gl}` · `ii◼<line.ii>` · `cd◼<line.cdo>` (full, sesuai dimuat) · `qt◼<line: pd+ps+pr>` (exclude `pb` — pb tak pernah dimuat) · `mrf◼{tnm}`.
- Cuma fase **opening** (sebelum `cst=custody_confirmed`; tombol Tolak udah ke-gate). Idempotency: app guard transisi `tst` (double-reject = 1 unload).

---

## 4. ⚠️ Kebutuhan RENDERER (bukan config DSL biasa)

Jumlah movement = **dinamis = N baris `task.it[]`** (×2 utk deliver). `addToEvent ◆` = blok statis di authoring → **gak bisa** ekspresikan N yang berubah. Maka:

**Renderer (RBT savesend / ITEM_EXECUTION_LIST) WAJIB:**
1. Loop baris `task.it[]` yg dieksekusi (skip actual 0).
2. Per baris → bangun movement block by `tx` (§3), isi dari per-line + task token.
3. Gabung semua block pakai `◆` → satu payload `addToEvent`.

**Token per-line yg renderer resolve** (dari `it[]` baris berjalan): `ii`, `cdo`, `cdi`, `tx`, dan actual qty (`ad`/`ap`/`as`/`ab`/`ar` — *nilai input driver*, bukan field CF-derived). **Token task-level:** `{vv}`,`{kl}`,`{gl}`,`{tnm}`,`{driverVid}`,`{driverName}`.

> Config (sheet) cuma nyimpen **template per-line** + aturan cabang. Loop + resolusi per-line = **kerjaan renderer Flutter** (fitur baru — ITEM_EXECUTION_LIST sekarang belum punya emit-movement). Ini gating item utama implementasi.

---

## 5. Open items (ACC owner / dev)

| id | topik | default usul |
|---|---|---|
| ~~**R1**~~ | ✅ **RESOLVED §0** — `tx=refill` = **2 doc** (DROP full + PICKUP empty), konsisten invariant cache | — |
| ~~**R2**~~ | ✅ **RESOLVED §0** — `tx=purchase` `cd` = **empty (`cdi`)** | — |
| **R3** | qty `qt` ambil dari mana di runtime (state ITEM_EXECUTION_LIST) | renderer pegang actual input per-line |
| **R4** | idempotency re-submit DeliveryWorkspace (double "Kirim") | app guard: 1 task completed = 1 set movement (cek `tst` udah completed → block) |
| **R5** | fitur renderer loop-emit udah ada atau perlu dibangun | asumsi **perlu dibangun** (ITEM_EXECUTION_LIST belum punya config movement) |

---

## 6. Yang TIDAK berubah

- DeliveryWorkspace tetap tulis `evidence`(photo) + `updateEventRow task tst◼completed⭘tce◼◀2▶` (lifecycle). Movement = **tambahan**, bukan pengganti.
- RejectTask tetap `updateEventRow task tst◼load_rejected` + `evidence`(notes). Movement INTERNAL = tambahan.
- CF derive-side (`movement-cf-dev-spec.md`) gak berubah — dia konsumsi movement yg di-emit di sini.

---

**Referensi:** `docs/driver-runtime-movement-cf-dev-spec.md` (derive side), `docs/driver-runtime-movement-cf-handoff.md` (§6 reject-unload), `docs/driver-runtime-field-dictionary.md` (SSOT field), `docs/driver-runtime-transaction-delta.md` (tx slot pd/ps/pb/pr).
