# Dev Spec — Cloud Function: Movement-Driven Derivation

**Domain:** Driver Runtime (galon / gas delivery).
**Scope:** 1 Cloud Function yg trigger di tiap penulisan `movement`, lalu menurunkan (derive) 2 hal: `asset_cache` (saldo stok) + `task.it[]` actual qty (`ad`/`ap`).
**SSOT field codes:** dictionary sheet `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw` (tab `movement`, `task`, `asset_cache`, `item`, `stock_location`) + `docs/driver-runtime-field-dictionary.md`. Doc ini TIDAK mendefinisikan ulang field — selalu cek dua sumber itu.

> **Verified vs live Firestore (firebase-app-dev1) 2026-06-17:** skema `item`/`task`/`stock_location` cocok SSOT (item `tc`=array, task `it[]`=`{ii,in,cdo,cdi,pd,pp,ad,ap}` ad/ap=null, stock_location `al`/`lv`(F62…)/`lt`). Semua doc-id **AUTO** (FK = field: ii/lv/tnm). Path: `MobileTable/6093608774765…/tables/84214220504259/{coll}`.

---

## 0. Untuk AI yg menganalisa dokumen ini

Dokumen ini sengaja dibuat agar AI bisa membacanya + dictionary, lalu meng-generate Cloud Function. Urutan kerja yg disarankan:

1. **Baca §3–§5** = kontrak data (input `movement`, output `asset_cache`, output `task.it[]`). Konfirmasi tiap short-code ke dictionary sheet sebelum dipakai — JANGAN mengarang field.
2. **Pegang invariant di §4.1** (`−qt @ fl`, `+qt @ tl`). Itu inti akuntansi; `mt` cuma validasi + penentu field actual mana di task.
3. **Implement trigger §2 + algoritma §9** sebagai transaksi idempoten (§7). Idempotency WAJIB — CF Firestore bisa fire >1x.
4. **Selesaikan dulu OPEN questions §11** sebelum tulis kode final. Yg "DECIDED" boleh langsung; yg "NEEDS-CONFIRM" harus ditanyakan ke owner.
5. **Pakai §10 worked-example + §13 test cases** sebagai test yg harus hijau.

Aturan emas: kalau sebuah rule tidak ada di doc/dictionary, **tanya** — jangan asumsi.

---

## 1. Prinsip inti

| # | Prinsip | Konsekuensi ke CF |
|---|---|---|
| P1 | `movement` = ledger **append-only, immutable** (SSOT semua pergerakan stok). | App tdk pernah edit/hapus movement. Koreksi = movement baru (`mt:ADJUSTMENT`). |
| P2 | `asset_cache` + `task.it[].ad/ap` = **DERIVED** dari movement. | App **tidak pernah** menulis angka saldo / actual qty. Hanya CF. |
| P3 | Urutan: **movement ditulis dulu → CF baru menurunkan**. | App: tulis movement(s) (+ lifecycle `task.tst`/`tce`). CF: derive `ad`/`ap` + cache. Lihat §6. |
| P4 | Konsistensi = **eventual**. | UI boleh optimistic, tapi nilai otoritatif = hasil CF. Tampilkan stale, jangan kosong. |
| P5 | CF **idempoten**. | Aman kalau event sama fire berkali-kali. Lihat §7. |

---

## 2. Trigger & path

- **Trigger:** Firestore `onCreate` (document created) di koleksi `movement`.
- **Path movement:** `MobileTable/{db}/tables/{tableVID}/movement/{movementId}`
- **Path asset_cache:** `MobileTable/{db}/tables/{tableVID}/asset_cache/{lv}__{ii}__{cd}`
- **Path task:** `MobileTable/{db}/tables/{tableVID}/task/{autoId}` — doc-id AUTO (verified live); resolve by query `where tnm==mrf` (§5). Idem item-by-`ii`, stock_location-by-`lv` (semua doc-id auto).
- `{db}` & `{tableVID}` = wildcard path → CF ambil dari `context.params` (BUKAN json). **CONFIRMED live 2026-06-17:** `{db}=6093608774765…`, `{tableVID}=84214220504259` (registry doc: `tf=vtl◆master`, `tn=Vertika Tekno Lokacipta`). Koleksi (item/task/stock_location/movement/asset_cache) = sibling subcollection di bawah tableVID.
- Hanya `onCreate` (bukan update/delete) karena movement immutable.

---

## 3. Kontrak input — `movement` doc

Sumber: dictionary tab `movement`. (Ringkasan; field code = otoritatif di sheet.)

| code | field | tipe | catatan utk CF |
|---|---|---|---|
| `mt` | movement_type | enum `GENESIS\|DROP\|PICKUP\|INTERNAL\|SALE\|DAMAGE\|LOST\|ADJUSTMENT` | qty selalu +; arah dari `fl`/`tl` (§4.1) |
| `fl` | from_location | String FK → `stock_location` \| null | null = GENESIS (stok masuk dari luar sistem) |
| `tl` | to_location | String FK → `stock_location` \| null | null = LOST/DAMAGE/SALE (stok keluar sistem) |
| `ii` | item | String FK → `item` | kunci cache + kunci match `it[]` |
| `cd` | condition | `full\|empty` | bagian doc id cache; 1 movement = 1 kondisi |
| `qt` | quantity | Number > 0 | besar perpindahan |
| `dv`/`dn` | driver vid / nama | String | aktor scan (≠ id login) |
| `mrf` | task ref | String FK → `task.tnm` \| null | null = GENESIS/INTERNAL/ADJUSTMENT; jika ada → update `it[]` |
| `t` | occurred_at (epoch) | Number | waktu device |
| `ts` | occurred_at (string) | String | hanya movement yg punya `ts` |
| `et` | synchronized_at | Number | waktu server tulis |
| `er` | emitter_runtime | `DRIVER\|VEHICLE\|SUPERVISOR` | asal app |
| `d` | notes | String? | |

> 1 aksi driver di customer biasanya = **2 movement**: `DROP cd=full` + `PICKUP cd=empty`. Tiap movement satu kondisi, jadi CF tdk perlu logika transisi kondisi.

---

## 4. Efek turunan #1 — `asset_cache`

`asset_cache` doc id = `{lv}__{ii}__{cd}`. Field: `lv`, `lt` (denorm dari stock_location), `ii`, `cd`, `qt` (saldo), `lm` (last_movement ref), `t`, `et`.

### 4.1 Invariant inti (INI yg paling penting)

```
delta saldo, untuk key (location, ii, cd):
    if fl != null:  cache[ fl__ii__cd ].qt -= qt
    if tl != null:  cache[ tl__ii__cd ].qt += qt
```

- 1 movement menyentuh **maksimal 2 cache doc** (sumber & tujuan), keduanya pada `(ii, cd)` yg sama.
- `mt` **tidak** menentukan tanda saldo — `fl`/`tl` yg menentukan. `mt` dipakai utk validasi (§8) + menentukan field actual di task (§5).
- Saat buat cache doc baru: isi `lt` = `stock_location[lv].lt` (denorm), set `qt` = delta awal.
- Setelah apply: set `lm` = movementId, `t` = movement.`t`, `et` = waktu CF tulis.

### 4.2 Cek invariant per `mt` (untuk validasi, bukan logika cabang)

| `mt` | `fl` | `tl` | efek cache |
|---|---|---|---|
| GENESIS | null | warehouse | hanya `+qt @ tl` |
| INTERNAL | warehouse | vehicle (atau sebalik) | `−qt @ fl`, `+qt @ tl` |
| DROP | vehicle | client | `−qt @ vehicle`, `+qt @ client` |
| PICKUP | client | vehicle | `−qt @ client`, `+qt @ vehicle` |
| SALE | vehicle/client | null | hanya `−qt @ fl` (consumable keluar sistem) |
| DAMAGE / LOST | fl | null | hanya `−qt @ fl` (write-off; lihat OPEN-Q2) |
| ADJUSTMENT | tergantung | tergantung | ikut aturan §4.1 by `fl`/`tl` (lihat OPEN-Q1) |

> Karena invariant §4.1 sudah menangani semua baris di atas lewat null-checking `fl`/`tl`, CF **tidak butuh switch besar per `mt`** untuk akuntansi — cukup untuk validasi.

### 4.3 Makna saldo di lokasi `client`

`asset_cache.qt` desc (dictionary): *"client = outstanding"*. Artinya saldo di lokasi client = barang yg masih di customer (mis. galon full terkirim yg belum balik sbg empty). Polaritas DROP `+qt @ client` / PICKUP `−qt @ client` **per kondisi** perlu dikonfirmasi → **OPEN-Q2**.

---

## 5. Efek turunan #2 — `task.it[]` actual (`ad`/`ap`)

`task.it[]` = `[{ii,in,cdo,cdi,pd,pp,ad,ap}]`:
`cdo`=condition_out, `cdi`=condition_in, `pd`=planned_drop, `pp`=planned_pickup, `ad`=actual_drop, `ap`=actual_pickup.

Saat movement punya `mrf` (task-bound), CF update array `it[]`:

```
task = query task where tnm == movement.mrf (limit 1)  (doc-id auto, verified live)
line = task.it[ where ii == movement.ii ]              (match by ii)
if movement.mt == DROP   :  line.ad = Σ qt semua movement(DROP,   mrf, ii)
if movement.mt == PICKUP :  line.ap = Σ qt semua movement(PICKUP, mrf, ii)
```

- **Match line by `ii`.** (Validasi opsional: DROP `cd` harus == `line.cdo`; PICKUP `cd` harus == `line.cdi`.)
- **DROP → `ad`** (actual_drop). **PICKUP → `ap`** (actual_pickup).
- **Set, bukan increment** — hitung ulang dari ledger (`Σ` query movement utk task+ii+mt). Ini bikin idempoten (§7).
- movement tanpa `mrf` (GENESIS/INTERNAL/ADJUSTMENT/SALE non-task) → **skip** update `it[]`.
- CF **tidak** mengubah `task.tst`/`tce` (lifecycle dipegang app, P3) — kecuali diputuskan lain (OPEN-Q3).

---

## 6. Urutan tulis & konsistensi

```
[App / Driver]                       [Cloud Function]
  1. tulis movement DROP   ───────▶  trigger onCreate
  2. tulis movement PICKUP ───────▶  trigger onCreate
  3. update task.tst=completed,           ┌─ derive asset_cache (§4)
     tce=<jam>  (lifecycle)               └─ derive task.it[].ad/ap (§5)
```

- **movement dulu, derive belakangan** (P3). it[].ad/ap & cache adalah hasil, bukan input.
- App boleh tulis movement + lifecycle dalam batch; CF jalan async per movement.
- Eventual consistency: ada jeda antara movement tertulis dan cache/it[] ter-update. UI handle dgn optimistic + refresh.

---

## 7. Idempotency (WAJIB)

CF Firestore bisa men-deliver event yg sama >1x. `+= qt` polos = **bug double-count**. Strategi:

- **`task.it[]` (§5):** pakai **recompute-from-ledger** (`Σ` query movement per task+ii+mt, lalu SET). Idempoten alami. Array kecil → murah.
- **`asset_cache` (§4):** dua opsi —
  - **(A) Transactional additive + guard:** dalam txn, cek apakah movementId sudah diterapkan (mis. simpan pointer/append ke `cache.appliedMovements` atau marker terpisah). Apply delta hanya jika belum. Murah, butuh penyimpanan marker.
  - **(B) Recompute-from-ledger:** `Σ` semua movement yg menyentuh `(lv,ii,cd)`. Akurat tapi mahal kalau ledger panjang.
  - **Rekomendasi:** (A) transactional additive dgn idempotency key = movementId. Semua mutasi dalam **satu Firestore transaction** agar konsisten.

> Karena movement immutable, hasil recompute selalu deterministik — boleh dipakai sbg self-heal/reconcile job berkala.

---

## 8. Validasi yg CF tegakkan (sebelum apply)

1. `qt > 0`.
2. `fl != tl` (kalau dua-duanya non-null).
3. `cd ∈ item[ii].tc` (kondisi valid utk item itu).
4. `ii` ada di `item`; `fl`/`tl` (non-null) ada di `stock_location`.
5. Kalau `mt ∈ {DROP,PICKUP}` → `mrf` wajib ada & task-nya ada.
6. Bila validasi gagal: jangan apply diam-diam — log + (opsional) tulis ke koleksi dead-letter / `investigation`. **NEEDS-CONFIRM** perilaku gagal.

---

## 9. Algoritma (pseudocode)

```ts
// onCreate: MobileTable/{db}/tables/{tableVID}/movement/{movementId}
export async function onMovementCreate(mv, ctx) {
  const { db, tableVID, movementId } = ctx.params;
  validate(mv);                                   // §8

  await runTransaction(async tx => {
    // --- §4 asset_cache ---
    if (mv.fl) await applyDelta(tx, key(mv.fl, mv.ii, mv.cd), -mv.qt, movementId, mv);
    if (mv.tl) await applyDelta(tx, key(mv.tl, mv.ii, mv.cd), +mv.qt, movementId, mv);

    // --- §5 task.it[] actual ---
    if (mv.mrf && (mv.mt === 'DROP' || mv.mt === 'PICKUP')) {
      const task = await queryTaskByTnm(tx, mv.mrf);             // where tnm==mrf, doc-id auto
      const sum  = await sumLedger(tx, mv.mrf, mv.ii, mv.mt);    // Σ qt (idempoten)
      const it   = task.it.map(l =>
        l.ii === mv.ii
          ? { ...l, ...(mv.mt === 'DROP' ? { ad: sum } : { ap: sum }) }
          : l);
      tx.update(task.ref, { it });
    }
  });
}

function applyDelta(tx, cacheKey, delta, movementId, mv) {
  // idempotency: skip kalau movementId sudah diterapkan ke doc ini (§7-A)
  // upsert: qt += delta; set lm=movementId, t=mv.t, et=now(); isi lt denorm saat create
}
```

---

## 10. Worked example (it[] 2 baris — sesuai contoh owner)

**task awal** (`tnm=TASK-20260615-001`, vehicle `F621a02a983500`, client `F62793a15928ca`):
```json
"it": [
  {"ii":"8886008101138","in":"Aqua Galon 19 Liter","cdo":"full","cdi":"empty","pd":5,"pp":5,"ad":null,"ap":null},
  {"ii":"2000000000123","in":"LPG 12kg","cdo":"full","cdi":"empty","pd":3,"pp":3,"ad":null,"ap":null}
]
```

**Driver di customer → 4 movement:**
```
mt=DROP   fl=F621a02a983500 tl=F62793a15928ca ii=8886008101138 cd=full  qt=5 mrf=TASK-20260615-001
mt=PICKUP fl=F62793a15928ca tl=F621a02a983500 ii=8886008101138 cd=empty qt=5 mrf=TASK-20260615-001
mt=DROP   fl=F621a02a983500 tl=F62793a15928ca ii=2000000000123 cd=full  qt=3 mrf=TASK-20260615-001
mt=PICKUP fl=F62793a15928ca tl=F621a02a983500 ii=2000000000123 cd=empty qt=3 mrf=TASK-20260615-001
```

**CF → task.it[] jadi:**
```json
"it": [
  {"ii":"8886008101138", ... ,"ad":5,"ap":5},
  {"ii":"2000000000123", ... ,"ad":3,"ap":3}
]
```

**CF → asset_cache (delta):**
```
F621a02a983500__8886008101138__full   -5     (vehicle, galon full)
F62793a15928ca__8886008101138__full   +5     (client outstanding full)   ← polaritas: OPEN-Q2
F621a02a983500__8886008101138__empty  +5     (vehicle, galon empty)
F62793a15928ca__8886008101138__empty  -5
... idem utk LPG 12kg (±3)
```

---

## 11. Edge cases & OPEN questions

| id | topik | status | catatan |
|---|---|---|---|
| — | DROP→`ad`, PICKUP→`ap` | **DECIDED** | owner confirm |
| — | match `it[]` by `ii` | **DECIDED** | |
| — | movement dulu, derive belakangan | **DECIDED** | P3 |
| — | invariant `−qt@fl / +qt@tl` | **DECIDED** | konsisten dgn null-semantics fl/tl di dictionary |
| ~~Q1~~ | arah `ADJUSTMENT` | **DECIDED** | reuse invariant §4.1: `fl=null`→naik, `tl=null`→turun; qt selalu +; UI Supervisor set fl/tl per arah. CF tdk butuh logika khusus. |
| OPEN-Q2 | makna saldo `client` (outstanding) + polaritas DROP/PICKUP per kondisi | NEEDS-CONFIRM | apakah cache client di-track penuh, atau hanya vehicle+warehouse? |
| OPEN-Q3 | apakah CF juga flip `task.tst`/`tce` | NEEDS-CONFIRM | default: tidak (app pegang lifecycle) |
| ~~Q4~~ | resolve task | **DECIDED (verified live)** | doc-id AUTO → query `where tnm==mrf` (limit 1). Butuh index tnm. Idem item-by-ii, stock_location-by-lv. |
| ~~Q5~~ | `{db}`/`{tableVID}` | **DECIDED (verified live)** | dari path wildcard `context.params`; `db=6093608774765…`, `tableVID=84214220504259`. Bukan json. |
| OPEN-Q9 | asset_cache doc-id: composite `{lv}__{ii}__{cd}` vs auto-id+query | NEEDS-CONFIRM | semua coll lain auto-id; tapi cache enaknya **composite** (1 get, upsert idempoten, no query). Rekomendasi: composite. |
| OPEN-Q6 | beberapa DROP utk `ii` yg sama dlm 1 task (partial) | handle by Σ | recompute-from-ledger sudah benar |
| OPEN-Q7 | perilaku saat validasi gagal | NEEDS-CONFIRM | dead-letter vs investigation vs drop |
| OPEN-Q8 | SALE consumable: lokasi `fl` = vehicle atau client? | NEEDS-CONFIRM | pengaruh ke cache mana yg −qt |

---

## 12. CF terkait (di luar scope, tapi sadari)

- **Closing reconcile:** trigger di `vehicle_check` `cty=closing` → CF hitung `ie` (items_expected) dari cache/ledger, banding vs `ip` (physical) → isi `dp` (discrepancies) + `rs`. Jika `discrepancy_detected` → buat `investigation` (`vst=pending_review`). Ini CF **kedua**, terpisah dari movement-CF ini.
- **Genesis seeding:** movement `GENESIS` saat onboarding stok awal warehouse — lewat invariant §4.1 sama.

---

## 13. Test cases (harus hijau)

1. **Happy 1-line:** task 1 item, DROP 5 + PICKUP 5 → `ad=5,ap=5`; cache vehicle/client/full/empty sesuai §10.
2. **Multi-line:** contoh §10 (2 item) → kedua line ter-update independen.
3. **Idempotent:** fire event movement yg sama 3x → cache & it[] **tidak** berubah dari hasil 1x.
4. **Partial drop:** DROP 2 lalu DROP 3 utk ii sama → `ad=5` (Σ), bukan 3.
5. **No-mrf:** GENESIS / INTERNAL → cache berubah, `it[]` **tidak** disentuh.
6. **Write-off:** LOST (`tl=null`) → hanya `−qt @ fl`.
7. **Validasi:** `qt=0` / `cd` tak valid utk item → ditolak (§8), tdk ada mutasi.

---

**Referensi:** `docs/driver-runtime-field-dictionary.md` (SSOT field codes), `docs/driver-runtime-tables-dev-spec.md` (skema koleksi + flow per page), dictionary sheet `1_XHmo5…`. Schema deltas: `docs/driver-runtime-techlead-schema-deltas.md`.
