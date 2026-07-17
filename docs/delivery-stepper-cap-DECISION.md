# KEPUTUSAN — Stock-cap fix (greenlight)

**Untuk:** Flutter dev. **Tanggal:** 2026-06-26. **Balasan untuk:** `delivery-stepper-cap-not-applied-DEV-ANSWERS.md`. **Widget:** `ITEM_EXECUTION_LIST` @ P11 DeliveryWorkspace.

---

## Diagnosis diterima

Dua akar lo bener, dan analisa udah verify independen: **page P11 (`vertikaTeknoLokaciptaDeliveryWorkspace`) memang gak punya widget publisher vehicleId** (child cuma WORKSPACE_HEADER, ITEM_EXECUTION_LIST, SIGNATURE_PAD, TXF, GET_IMAGES, 2× RBT). Jadi `{vehicleId}` stay literal → cap=null → seed=plan. **Akar #2 confirmed.**

Koreksi lo juga diterima: (a) gak ada per-component model — komponen = `Map<String,dynamic>` dinamis, unknown key harmless; (b) `{vehicleId}` per-scrName, bukan global. Noted.

## Approved fix → **opsi `task.vv`** (yang contained)

Pilih **§3 utama** lo: resolve vehicleId dari `task.vv` di `item_execution_list.dart`. Alasan: terkurung di 1 file, gak mutate shared `DriverHomeState`, gak gantung ke publisher P11. **JANGAN** pakai alternatif "publish ke getDriverHomeState(P11)" (lebih invasif, mutate shared state) — kecuali nanti emang butuh benerin stop-number header sekalian (lihat catatan bawah).

## Dev TODO (2 hal)

1. **Commit kode cap** (Akar #1 — HEAD = 0 baris). Pastikan build/device jalanin working-tree yang ada logika cap.
2. **Implement `task.vv` resolution** (Akar #2):
   - baca `vehicleId = taskDoc['vv']` (configurable `vehicleField`, default `'vv'`).
   - substitusi `{vehicleId}` → `task.vv` di `dropCapSearch` SEBELUM `filterDriverHomeDocs`.
   - `capResolved = taskVv.isNotEmpty && snapshotArrived` (lepas dari `vehicleIdResolved`).

## Sheet — GAK ada perubahan

Config 5 field di `Widget!J219` udah bener (verified match data firebase). Default `vehicleField='vv'` cukup → **gak perlu** tambah field ke sheet. (Kalau lo mau eksplisit, boleh tambah `vehicleField:"vv"`, tapi opsional — bukan keharusan.)

## Acceptance test (stok mobil Amidis = 1)

- [ ] drop stepper Amidis **seed = 1** (bukan 3)
- [ ] `[+]` **disabled** di 1
- [ ] label **"Maks 1 — stok mobil"**
- [ ] submit → `task.it[].ad == 1`, movement drop `qt == 1`, "Isi Kendaraan" → **0** (gak minus)
- [ ] pickup stepper TANPA cap (bebas)
- [ ] regresi: `dropCapTable` kosong / task tanpa `vv` → stepper normal (no-cap)

## Catatan tambahan (lo yang nyebut, bukan blocker)

Lo bilang `workspace_header` stop-number P11 juga pakai `{vehicleId}` → kemungkinan **0/rusak** juga karena vehicleId kosong di P11. **Tolong cek di device.** Kalau iya rusak: itu masalah terpisah tapi seakar (P11 gak punya vehicleId). Bisa dibenerin bareng pakai pendekatan publish `task.vv` → state P11, ATAU per-widget resolve dari task.vv (konsisten sama fix cap). Kabarin kalau mau dijadiin 1 paket.

---

## UPDATE 2 — TEST RESULT: cap UI jalan, TAPI actual-write masih KOSONG (blocker baru)

Setelah fix cap, di-test: drop stepper **ke-cap ke 1** (gak bisa ditambah) ✓. **TAPI** abis submit, mobil full jadi **−2** (harusnya 0). Bukti firebase:

| sumber | field | nilai | arti |
|---|---|---|---|
| `task.it[0]` | `ad` | **null** | app GAK nulis aktual drop |
| `task.it[0]` | `ap` | **null** | app GAK nulis aktual pickup |
| `task` | `tst` | `completed` | submit jalan |
| `movement` `drop-6kaYTvoBgNeIdA3rv0hX-8886012560310` | `qt` | **3** | CF pake plan (`pd`), karena `ad` null |

**Diagnosis:** cap cuma batesin UI; nilai capped (1) **gak pernah ditulis** ke `it[].ad`. Submit (`sendButtonGpsWithEvent`) cuma `updateEventRow tst◼completed⭘tce` — **gak nyentuh array `it[]`**. CF `OnTaskCompleted` `qt = ad ?? pd` → `null ?? 3` = **3** → mobil `1 − 3 = −2`.

**Akar = ACTUAL-WRITE belum diimplement** (fitur terpisah dari cap; spec `item-execution-actual-write-dev-spec.md`). `updateEventRow`/DSL **gak bisa** nulis elemen array → WAJIB native write di renderer.

**Dev TODO (actual-write):**
1. Pas submit "Kirim", `ITEM_EXECUTION_LIST` tulis nilai stepper (yang **UDAH ke-cap**) ke `task.it[]` per line, by `tx`: `deliver`→`ad`,`ap` · `sale`→`as` · `purchase`→`ab` · `refill`→`ar`.
2. Native array write, **atomik bareng** `tst=completed`:
   ```dart
   doc.update({ 'it': updatedItArray, 'tst': 'completed', 'tce': nowEpochMs });
   ```
3. Urutan kritis: `it[]` ke-tulis SEBELUM/BARENG `tst` flip (CF trigger di flip `tst`, langsung baca `it[]`).

**Acceptance:** drop capped 1 → submit → `task.it[].ad == 1`, movement `drop qt == 1`, mobil full → **0**. (Sekarang: `ad=null`, `qt=3`, mobil `−2`.)

---

## UPDATE 3 — actual-write DIKLAIM "udah diimplement" tapi FIREBASE BILANG BELUM

Dev bilang DECISION.md + `item-execution-actual-write-dev-spec.md` **udah diimplement**. Tapi test ulang masih gagal — **bukti firebase nunjukin `it[].ad/ap` tetap NULL** abis submit. Jadi kode actual-write **gak efektif** di build yang dites (gak nulis nilai stepper ke `it[]`).

**Skenario test:** custody 2 dari 3 (mobil → 2 full). Delivery: drop di-cap 2 ("Maks 2 — stok mobil"), pickup di-set 2 (dari plan 3). Submit.

**Hasil (SALAH):** mobil **−1 full, 3 empty**. Harusnya **0 full, 2 empty**.

**Bukti (cek di task + movement abis submit):**

| sumber | field | nilai SEKARANG | harusnya |
|---|---|---|---|
| `task.it[0]` | `ad` | **null** | `2` (drop capped) |
| `task.it[0]` | `ap` | **null** | `2` (pickup di-set) |
| `task` | `tst` | `completed` | completed |
| `movement drop-…` | `qt` | **3** (= plan `pd`) | `2` |
| `movement pickup-…` | `qt` | **3** (= plan `pp`) | `2` |

`ad=null` + movement `qt=3` = app **gak nulis aktual sama sekali** → CF `qt = ad??pd = null??3 = 3`. Mobil `2 − 3 = −1` full, `0 + 3 = 3` empty. Persis gejala plan-kepake.

**Berarti salah satu:**
1. Build yang dites **bukan** yang ada actual-write (uncommitted / APK lama) — cek dulu (sama kaya kasus cap kemaren yang HEAD=0).
2. Kode actual-write **ada tapi gak nulis `ad/ap`** (no-op: nulis `it[]` original tanpa inject nilai stepper).
3. Actual-write **gak ke-trigger di submit path ini.** ⚠️ Page DeliveryWorkspace submit = RBT **"Kirim"** (`sendButtonGpsWithEvent`, `action:savesend`) — **GAK ada `submitConfirmSheet`** di page ini. Kalau actual-write di-hook ke confirm-sheet / tombol lain, gak akan jalan di sini.
4. `it[]` write ke-**overwrite** sama `updateEventRow tst◼completed⭘tce` (write terpisah yang gak bawa actuals).

**PERTANYAAN ke dev (jawab satu-satu, sertakan `file:line`):**
1. Commit/build yang dites = yang ADA kode actual-write? (kasih commit hash; cek `git show HEAD:... | grep ad`)
2. Actual-write di-hook ke **mana**? Ke RBT "Kirim" (`savesend`) di DeliveryWorkspace, atau ke widget lain (confirm-sheet) yang **gak ada** di page ini?
3. **Log pas submit:** isi `updatedItArray` yang ditulis — field `ad`/`ap` keisi nilai stepper (2/2), atau null/plan? Tunjukin lognya.
4. `doc.update({it:...})` beneran kepanggil + sukses? Cek firestore PERSIS abis submit — `ad` keisi gak?
5. Urutan: `it[]` write vs `updateEventRow tst=completed` — yang mana duluan? Ada kemungkinan `it[]` ke-overwrite?

**Acceptance (ulang):** drop 2 / pickup 2 → submit → `task.it[0].ad == 2`, `ap == 2`; movement `drop qt == 2`, `pickup qt == 2`; mobil → **0 full, 2 empty** (gak minus).
