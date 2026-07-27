# Driver Runtime — Test Scenarios

Panduan testing manual driver flow end-to-end + **expected movement & asset_cache per langkah**. Grounded di seed sekarang (1 task, 1 item) + behavior yang udah kebukti live (Skenario A tervalidasi di otq-01, 2026-06-25).

---

## 0. Prasyarat

| Hal | Nilai |
|---|---|
| Project Firestore | **otq-01** (prod), location `asia-northeast1` |
| MobileTable doc | `20342033315492` · table vid `84214220504259` |
| CF live | `OnMovementCreated`, `OnTaskCompleted`, `OnTaskRejected`, `ReconcileAssetCache` (semua harus deployed) |
| Seed CONFIG | ⚠️ file `scripts/driver-runtime-seed.js` default `fir-app-dev1`. **Buat test otq-01 → ganti CONFIG ke blok otq-01** (`FIRESTORE_PROJECT_ID:'otq-01'`, `MOBILE_TABLE_DOC_ID:'20342033315492'`) + service account otq-01. |

asset_cache **gak pernah** ditulis manual — selalu di-derive CF dari `movement`. Kalau asset_cache keliatan salah, jangan edit langsung; cek movement / panggil `ReconcileAssetCache`.

---

## 1. Seed baseline (data sekarang)

**Task** `TASK-20260625-101` · Warung Jauh Cikupa (kl `F629FAR0000001`) · vv mobil `F621a02a983500` · gl gudang `F621558e33b612`.

**1 line** `it[]`: **Amidis Galon 19 Liter** (ii `8886012560310`), returnable —
- tx=`deliver`, cdo=`full`, cdi=`empty`, **pd=3** (drop), **pp=3** (pickup), ad/ap=`null` (plan-only).
- stok gudang `ga=50`.

**Movement opening (seed):**
| mid | mt | fl→tl | cd | qt |
|---|---|---|---|---|
| `seedstock-F621558e33b612-8886012560310-full` | ADJUSTMENT | ∅→gudang | full | 50 |
| `seedload-F621a02a983500-8886012560310-full` | INTERNAL | gudang→mobil | full | 3 |

**asset_cache abis opening** (CF derive):
| lokasi | full | empty |
|---|---|---|
| gudang (gl) | **47** | 0 |
| mobil (vv) | **3** | 0 |

**vehicle_check** opening: cst=`awaiting_custody`, ie[]=`[{ii:Amidis, cd:full, qt:3}]`, rt=`pending`.

---

## 2. Reset antar-skenario

Seed = **upsert-only, gak pernah hapus**. Re-run seed BUKAN reset penuh: task/vehicle_check balik ke opening (di-upsert), TAPI `movement` (drop/pickup hasil CF) + `asset_cache` dari test sebelumnya **nyangkut**.

**Reset bersih:**
1. **Hapus** koleksi: `movement`, `asset_cache`, `asset_cache_applied`, `asset_cache_monthly` (semua doc).
2. **Re-run seed** "Push SEMUA" → recreate item · stock_location · task(tst=assigned) · vehicle_check(cst=awaiting_custody, rt=pending) · movement(seedstock+seedload).
3. CF `OnMovementCreated` re-derive asset_cache → gudang 47 / mobil full 3. **Clean.**

> Alternatif (tanpa hapus movement): cukup hapus `asset_cache*` lalu panggil `ReconcileAssetCache` (HTTP) → rebuild dari seluruh ledger. Tapi ledger masih nyimpen drop/pickup lama → hasil bukan opening-state. Buat fresh per-skenario, **hapus 4 koleksi + re-seed** (cara 1).

---

## 3. Skenario A — Happy path (✅ VALIDATED live)

**Alur:** custody confirm (match) → deliver → serahkan ke gudang.

**Langkah klik (app):**
1. **Reset** dulu (§2). Buka app → DriverHome. Liat: card "Konfirmasi Penerimaan Muatan" (badge *Perlu Aksi*) + "Rute Hari Ini" **terkunci** (🔒 "Konfirmasi muatan dulu").
2. Tap **"Konfirmasi Penerimaan"** → page CustodyNotification. Cek manifest = **Amidis Galon 19 Liter ×3**.
3. Tap **"MULAI KONFIRMASI PENERIMAAN"** → page CustodyCount.
4. Hitung Amidis = **3** (sesuai). Tap lanjut/submit → reveal **COCOK** → CustodySuccess.
5. Balik ke Home: "**Isi Kendaraan Sekarang**" muncul (full **3**, empty 0) + "Rute Hari Ini" **kebuka** (1 tujuan: Warung).
6. Tap route / **"Buka Tasklist (eksekusi)"** → TaskFeed → tap stop **Warung Jauh Cikupa** → DeliveryWorkspace.
7. Stepper biarin default: DROP **3**, PICKUP **3** (✓ Sesuai). Foto/ttd opsional. Tap **Selesai/Kirim**.
8. CF emit DROP+PICKUP. Balik Home: "**Isi Kendaraan Sekarang**" jadi **full 0, empty 3**.
9. Tap **"Return Kendaraan"** → ReturnVehicle → tap **"Serahkan ke Gudang"** → dialog → balik Home, card Return **ilang** (rt=returned).

| checkpoint | Movement (CF emit) | mobil full | mobil empty | gudang full | Doc state |
|---|---|---|---|---|---|
| abis langkah 1 (opening) | seedstock 50 · seedload 3 | 3 | 0 | 47 | cst=awaiting, rt=pending |
| abis langkah 4 (confirm) | — *(status only)* | 3 | 0 | 47 | cst=**custody_confirmed** |
| abis langkah 7 (deliver) | `drop-{tnm}-{ii}` DROP full 3 (vv→kl) · `pickup-{tnm}-{ii}` PICKUP empty 3 (kl→vv) | **0** | **3** | 47 | task tst=completed |
| abis langkah 9 (serahkan) | — *(no movement)* | 0 | 3 | 47 | rt=**returned** |
| *(gudang closing — bukan driver)* | INTERNAL empty 3 (vv→gl) | 0 | 0 | 47 (+empty 3) | cst=closed |

**Verifikasi firebase:** `movement` ada `drop-…` (mt=DROP, cd=full, qt=3, fl=vv, tl=kl) + `pickup-…` (mt=PICKUP, cd=empty, qt=3, fl=kl, tl=vv). asset_cache mobil = full 0 / empty 3. ✅ (udah kebukti). customer Warung: full +3, empty −3 (−3 = cosmetic, abaikan).

---

## 4. Skenario B — Custody mismatch (selisih)

**Alur:** sama kaya A langkah 1–3, TAPI hitung custody SENGAJA salah.

**Langkah klik (app):**
1. **Reset** (§2). Home → tap **"Konfirmasi Penerimaan"** → CustodyNotification → **"MULAI KONFIRMASI PENERIMAAN"** → CustodyCount.
2. Hitung Amidis = **2** (SENGAJA kurang 1, manifest 3). Tap lanjut/submit.
3. Reveal nampil **SELISIH** (dp=1, fisik 2 vs catatan 3) → page MismatchReport.
4. Isi alasan/keterangan → submit → MismatchSubmitted ("udah dilaporkan, Supervisor review").

| checkpoint | Movement | mobil full | Doc state |
|---|---|---|---|
| abis submit selisih — **SEKARANG** | — (NOL) | 3 *(= gudang muat)* | cst=custody_confirmed, ip=2, dp=1 |
| abis submit selisih — **TARGET** (blm build) | ADJUSTMENT −1 (mobil) | **2** *(= hitungan driver)* | sama + asset_cache=ip |

**B LANJUT ke return** — verified config: `MismatchReport` (1050) RBT set `cst◼custody_confirmed` (PERSIS sama kaya match path `CustodySuccess`). Route kebuka, `MismatchSubmitted` button "Lanjut · Mulai Kerja". **Dari deliver→return, B = A** (movement & asset_cache identik), bedanya cuma bawa flag `dp` + evidence.

**KEPUTUSAN 2026-06-25 — mobil ngikut HITUNGAN DRIVER, bukan catatan gudang:**
Pas confirm-mismatch (`ip ≠ ie`), sistem emit **ADJUSTMENT movement** sebesar `(ip − ie)` di mobil → asset_cache = `ip` (yang driver beneran pegang). Selisih (`dp`) + evidence tetep ke-flag buat Supervisor reconcile.
- **Logika:** custody = driver TERIMA `ip`. Mobil isi = `ip`. Driver operasi pake stok asli yang dia pegang (gak ada "phantom" yang kebawa ke delivery).
- **SEKARANG (gap):** asset_cache = gudang muat (3), GAK ada adjustment. Mockup `Driverruntimefull2.jsx` nampil hitungan driver (2) = arah yang bener, tapi belum kebangun di data.
- **BUTUH BUILD (dev):** CF baru `OnCustodyConfirmed` — trigger `vehicle_check` `cst→custody_confirmed`; banding `ie[]` vs `ip[]`; per item yang beda → emit ADJUSTMENT mobil sebesar `ip−ie`. Konsisten pola CF-emit (kaya OnTaskCompleted/OnTaskRejected). MATCH (ip=ie) → no adjustment.

**Verifikasi (sekarang):** `movement` gak nambah, asset_cache mobil **3** (gudang muat), vehicle_check ip=2/dp=1. Abis CF `OnCustodyConfirmed` dibuild → asset_cache mobil **2**.

> ⚠️ Prasyarat lain: reveal harus banding `ip` vs `ie` + tulis `ip`/`dp` ke vehicle_check. Kalau belum jalan → custody lolos tanpa deteksi selisih. Cek dulu.

---

## 5. Skenario C — Reject task (Tolak)

**Alur:** tolak muatan SEBELUM deliver → `tst→load_rejected`.

**Langkah klik (app):**
1. **Reset** (§2). Home — custody **BELUM** confirm. Di card "Rute Hari Ini" (terkunci) ada tombol **"Tolak"**.
2. Tap **"Tolak"** → page RejectTask → pilih **alasan** → submit.
3. task `tst=load_rejected` → CF OnTaskRejected jalan. Balik Home: route → **0 tujuan**.

| checkpoint | Movement (CF OnTaskRejected) | mobil full | gudang full | Doc state |
|---|---|---|---|---|
| abis submit tolak | INTERNAL **unload** full 3 (vv→gl), qt=pd+ps+pr=3 | **0** | **50** | ie[] recompute → kosong; tst=load_rejected |

**Inti:** reject = balikin muatan ke gudang. asset_cache mobil 3→0, gudang 47→50. Route ilang.

**Verifikasi:** `movement` ada INTERNAL (fl=vv, tl=gl, cd=full, qt=3). asset_cache mobil 0 / gudang 50. `vv` di task **TETEP** (admin reassign).

> ⚠️ Tombol "Tolak" di driverStopCard locked = renderer **pending**. Kalau belum ada di app → trigger manual: edit `task` doc di firebase, set `tst="load_rejected"` → CF tetep jalan (trigger = doc update).

---

## 6. Skenario D — Failed delivery (gagal di customer)

**Alur:** udah confirm + sampe customer, tapi gagal → `tst→failed`.

**Langkah klik (app):**
1. **Reset** (§2). Confirm custody dulu (kaya **A langkah 1–5**) → route kebuka.
2. TaskFeed → stop **Warung** → DeliveryWorkspace (atau detail stop) → tombol **"Lapor Gagal"**.
3. Page FailedDelivery → pilih **alasan** (4 opsi grid) → isi note → submit → `tst=failed`.

| checkpoint | Movement | mobil full | mobil empty | Doc state |
|---|---|---|---|---|
| abis lapor gagal | **— (NOL)** | 3 | 0 | task tst=failed, evidence ec/d |

**Inti:** gagal = barang **tetep di truk**, gak ada serah-terima → **gak ada movement**. asset_cache mobil tetep full 3. Driver balik bawa barang → gudang closing yang unload.

**Verifikasi:** `movement` gak nambah. asset_cache mobil full 3 (utuh). task tst=failed.

> ⚠️ Tombol "Lapor Gagal" (trigger P11) = **open/belum wired**. Kalau belum ada → trigger manual: set `task.tst="failed"` di firebase.

---

## 7. Skenario E — Partial actual (Phase 2)

**Alur:** deliver tapi aktual ≠ plan (mis. cuma 2 keangkut customer).

**Langkah klik (app):**
1. **Reset** (§2). Confirm custody (kaya **A langkah 1–5**) → route → TaskFeed → Warung → DeliveryWorkspace.
2. Di stepper, tekan **"−"** sampe DROP = **2**, dan PICKUP = **2** (override default 3). Badge berubah dari "✓ Sesuai" jadi tanda beda.
3. Tap **Selesai/Kirim**.

| checkpoint | Movement (CF) | mobil full | mobil empty | Catatan |
|---|---|---|---|---|
| abis submit (kalau actual-write jalan) | DROP full **2** · PICKUP empty **2** | 3→**1** | 0→**2** | sisa 1 full + 2 empty di truk |
| abis submit (kalau MASIH plan) | DROP full 3 · PICKUP empty 3 | 0 | 3 | = Skenario A |

CF rumus `qt = actual ?? plan`. **Verifikasi:** cek `task.it[]` di firebase abis submit — ada `ad:2`/`ap:2` gak? Kalau ADA → movement qt=2, asset_cache mobil full 1 empty 2. Kalau `ad`/`ap` masih `null` → CF pakai plan 3 (= A).

**✅ TEST LIVE 2026-06-25 — Phase 1 confirmed:** set stepper drop 2/pickup 2, submit → movement **qt=3** (plan). Sebab: submit RBT cuma `updateEventRow: tst◼completed⭘tce◼◀2▶` — **gak nulis `ad`/`ap`**. Stepper ke-capture di UI doang. CF bener (fallback plan). **BUKAN CF bug.**

**Phase 2 = Flutter dev** (bukan CF — angka aktual cuma app yang tau; CF udah siap `actual ?? plan`). Renderer `ITEM_EXECUTION_LIST` harus nulis aktual ke `task.it[]` (native array, atomik bareng `tst=completed`). Config field `actualDropField:ad`/`actualPickupField:ap`/`actualSaleField:as`/`actualBuyField:ab`/`actualRefillField:ar` **UDAH live** (Widget!J219). Full spec: **`docs/item-execution-actual-write-dev-spec.md`**.

---

## 8. Appendix — variasi tx (butuh ubah seed `Barang`)

Skenario A–E pakai `deliver`. Buat test tx lain, tambah/ubah line di tab **Barang** (kolom Transaksi + qty), re-seed. Expected movement per tx:

| tx | isi qty | Movement (CF OnTaskCompleted) | efek asset_cache mobil |
|---|---|---|---|
| `deliver` | pd, pp | DROP full pd (vv→kl) + PICKUP empty pp (kl→vv) | full −pd, empty +pp |
| `sale` | ps | SALE full ps (vv→∅, **no tl**) | full −ps *(laku, gak balik)* |
| `purchase` | pb | PURCHASE empty pb (kl→vv) | empty +pb *(beli kosong dari customer)* |
| `refill` | pr | DROP full pr (vv→kl) + PICKUP empty pr (kl→vv) | full −pr, empty +pr |

Manifest LOAD opening (seed) = `pd+ps+pr` (full keluar gudang). `pb`/`pp` TIDAK dimuat dari gudang (datang dari customer). Jadi kalau Barang ada sale/refill, asset_cache mobil awal naik sesuai pd+ps+pr.

---

## 9. Cheat-sheet "liat hasil di mana"

| Mau cek | Tempat |
|---|---|
| Movement emitted | Firebase `…/movement` (drop/pickup/seedload/seedstock/unload) |
| Stok mobil | Firebase `…/asset_cache` (lv=vv) **atau** app card "**Isi Kendaraan Sekarang**" (DriverHome, abis custody confirm) |
| Stok gudang | Firebase `…/asset_cache` (lv=gl) |
| Status custody/return | Firebase `vehicle_check` (cst, rt, ie[], ip/dp) |
| Status task | Firebase `task` (tst) **atau** app route card |

> Custody item card ("Konfirmasi Penerimaan") baca **`task.it[]`**, BUKAN asset_cache. "Isi Kendaraan Sekarang" baca **asset_cache**. Jangan ketuker.
