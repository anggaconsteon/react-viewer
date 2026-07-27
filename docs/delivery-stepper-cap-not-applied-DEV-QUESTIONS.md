# BUG / PERTANYAAN DEV — Stock-cap belum jalan (drop default masih plan, gak ke-clamp ke stok)

**Untuk:** Flutter dev. **Tanggal:** 2026-06-26. **Widget:** `ITEM_EXECUTION_LIST` @ page `vertikaTeknoLokaciptaDeliveryWorkspace` (template `Widget!J219`). **Spec lengkap:** `delivery-stepper-stock-cap-dev-spec.md` (v2.0, §4).

---

## 1. Gejala

Stok mobil Amidis sekarang **1 full, 0 empty** (kelihatan bener di "Isi Kendaraan Sekarang" = 1). TAPI pas buka DeliveryWorkspace, drop stepper Amidis **default tetap 3** (plan), bukan ke-clamp ke **1** (stok). Driver masih bisa submit drop 3 → stok mobil `1 − 3 = −2` (minus). Cap-nya **gak jalan**.

> Catatan: test ini pakai DATA yang udah ada (asset_cache dari custody mismatch sebelumnya, qt=1) — bukan reset baru. Jadi baris stok-nya MEMANG ADA di firebase.

## 2. Yang UDAH bener (jangan diubah)

- Widget **muncul** (gak blank lagi) → deserializer `ITEM_EXECUTION_LIST` udah nampung 5 field cap. ✓ Bagus.
- Config sheet udah bener (verified match data firebase). Bukan masalah config.

## 3. Yang SALAH

Drop stepper di-seed ke **plan (3)**, BUKAN `min(plan, cap)` = `min(3, 1)` = **1**. Jadi entah (a) logika cap belum di-build, (b) query cap balik kosong, atau (c) async race. Lihat §6 pertanyaan.

## 4. Expected behavior (yang diminta)

| | sekarang (SALAH) | harusnya (BENER) |
|---|---|---|
| seed drop Amidis | 3 (plan) | **1** = `min(plan 3, cap 1)` |
| tombol `[+]` | jalan terus (bisa ke 4,5,…) | **disabled di 1** (mentok stok) |
| label | — | **"Maks 1 — stok mobil"** |
| submit | `ad=3` → stok −2 | `ad=1` → stok 0 |

## 5. Data nyata buat trace (dari firebase prod otq-01)

**Vehicle id** (`{vehicleId}` harus resolve ke ini): `F621a02a983500`

**asset_cache** doc (stok mobil Amidis, INI sumber cap):
```json
{ "lv": "F621a02a983500", "cd": "full", "ii": "8886012560310", "qt": 1 }
```

**task.it[]** line (sumber item + plan):
```json
{ "ii": "8886012560310", "in": "Amidis Galon 19 Liter", "pd": 3, "pp": 3, "tx": "deliver", "ad": null, "ap": null }
```

**Config cap** (resolved, yang app terima di `ITEM_EXECUTION_LIST`):
```json
"dropCapTable":"84214220504259//asset_cache",
"dropCapSearch":"lv◼{vehicleId}⭘cd◼full",
"dropCapKey":"ii",
"dropCapField":"qt",
"capLabel":"Maks <max> — stok mobil"
```
(`◼` = `=`, `⭘` = AND)

**Cap yang diharapkan:** query `asset_cache` WHERE `lv="F621a02a983500" AND cd="full"`, join `ii="8886012560310"` → ambil `qt` = **1**. → `seed = min(3, 1) = 1`.

## 6. PERTANYAAN ke dev (jawab satu-satu)

1. **Seed-clamp udah diimplement?** Apakah renderer udah hitung `dropInitial = min(planDrop, cap)` (spec §4 Step 3)? Atau baru benerin blank (deserializer toleran) tanpa logika cap? → kalau belum, ini akarnya.

2. **Query cap balik apa?** Pas buka DeliveryWorkspace, tolong **log** hasil query `dropCapTable` + `dropCapSearch`:
   - `{vehicleId}` resolve ke `"F621a02a983500"`? (page ini pakenya `{activeTaskVid}`; `{vehicleId}` apa ke-inject di scope DeliveryWorkspace?)
   - Query `asset_cache WHERE lv=... AND cd=full` balik berapa row? `qt`-nya berapa?
   - Map hasil join by `ii` → buat `ii=8886012560310` dapet cap berapa? (harusnya 1, kalau `null`/0 = query/token salah)

3. **Async race?** Apakah stepper di-seed ke plan **sync** duluan, terus query cap **async** baru selesai (tapi stepper udah keburu render 3 & gak di-re-clamp)? → kalau iya, **await cap SEBELUM seed**, atau re-clamp + setState pas cap resolve.

4. **Nama field cocok?** Renderer baca persis key: `dropCapTable`, `dropCapSearch`, `dropCapKey`, `dropCapField`, `capLabel`? (case-sensitive)

## 7. Yang harus dibenerin (kalau perlu)

- Implement spec §4 **Step 2** (resolve cap map dari asset_cache) + **Step 3** (`seed = min(plan, cap)`) + **Step 4** (`[+]` disabled di `value==cap`) + **Step 5** (`capLabel`).
- Pastikan `{vehicleId}` ke-resolve di DeliveryWorkspace (session-global token, sama yang dipake page TaskFeed `lv◼{vehicleId}`).
- Pastikan cap di-await sebelum seed (no async race).

## 8. Verify abis benerin

Buka DeliveryWorkspace (stok mobil Amidis = 1):
- drop stepper Amidis **seed = 1** (bukan 3).
- `[+]` **disabled** di 1.
- label **"Maks 1 — stok mobil"**.
- submit → `task.it[].ad == 1`, movement drop `qt == 1`, Isi Kendaraan → **0** (gak minus).

Pickup stepper TANPA cap (tetap bebas).
