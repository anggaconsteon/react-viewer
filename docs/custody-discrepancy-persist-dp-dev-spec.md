# Dev Spec (Flutter) — persist `dp` (custody discrepancy) biar list selisih muncul di MismatchReport

**Tanggal:** 2026-07-09
**Buat:** Flutter dev (renderer — `CUSTODY_REVEAL` + `CUSTODY_DISCREPANCY_LIST`).
**Bug live:** halaman **MismatchReport** (driver, `vertikaTeknoLokaciptaMismatchReport`) — `CUSTODY_DISCREPANCY_LIST` **kosong**, padahal CustodyReveal jelas nampilin "Selisih: -1". Sama masalah di **WarehouseClosingMismatch** (closing side).

---

## 0. Chain + root cause

```
CustodyCount (blind count)   →  CustodyReveal (compare)      →  MismatchReport
CUSTODY_COUNT_SUBMIT              CUSTODY_REVEAL                  CUSTODY_DISCREPANCY_LIST
writeField:ip (SIMPAN ip)        expectedField:ie                discrepancyField:dp
                                 actualField:ip                  ← baca dp
                                 discrepancyField:dp             = KOSONG
                                 mismatchRoute→MismatchReport
```

`ie` (catatan warehouse) + `ip` (hitungan driver) **dua-duanya tersimpan** di vehicle_check opening doc. CustodyReveal ngitung selisih (`ie`−`ip`) **client-side** buat display — TAPI **`dp` (array discrepancy) gak pernah di-PERSIST**. MismatchReport `CUSTODY_DISCREPANCY_LIST` baca `dp` → kosong → list blank.

Search dua widget IDENTIK (`cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}`) → bukan salah doc, emang field `dp`-nya kosong.

## 1. Fix A (BENER) — `CUSTODY_REVEAL` persist `dp`

Pas driver tap **"Lanjut · Report Mismatch"** (`mismatchRoute`), `CUSTODY_REVEAL` **tulis `dp`** ke vehicle_check opening doc SEBELUM navigate. Widget udah declare `discrepancyField:"dp"` — tinggal renderer nulis hasil compute-nya.

**`dp` = array** (native, per item yang selisih; atau semua item + delta):
```
dp: [ {ii, cd, ie, ip, delta}, … ]   // delta = ip - ie (negatif = kurang, positif = lebih)
```
- `ii` = item id, `cd` = kondisi (full/empty), `ie` = expected (warehouse), `ip` = actual (driver), `delta` = selisih.
- Cukup item yang `delta≠0` (yang selisih doang), atau semua — renderer list yang filter.
- Tulis ke doc yang SAMA dengan search reveal (`cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}`).

**Kenapa persist (bukan cukup recompute):** `dp` = **record investigasi Supervisor**. Discrepancy harus kesimpen permanen (bukan cuma display sesaat) biar Supervisor bisa review + kontak. Ini bagian dari audit trail, sama pentingnya kaya movement ledger.

**Juga di WAREHOUSE closing:** `CustodyCountClosing`/closing reveal harus persist `dp` yang sama pola (search `cty◼closing`) → `WarehouseClosingMismatch` `CUSTODY_DISCREPANCY_LIST` baca.

## 2. Fix B (interim, UDAH dipasang di sheet 2026-07-09) — recompute dari `ie`+`ip`

MismatchReport `CUSTODY_DISCREPANCY_LIST` (op1Screen D664) +`expectedField:"ie"`+`actualField:"ip"`+`joinKey:"ii"`+`labelField:"in"`+`categoryField:"ic"` — biar list **recompute** `ie`−`ip` (dua-duanya tersimpan) instead of andelin `dp`.

- **JALAN cuma kalo renderer `CUSTODY_DISCREPANCY_LIST` support recompute** dari expected/actual (kaya `CUSTODY_REVEAL`). Kalo renderer strict baca `dp` → tetep kosong (plain-field, gak drop widget, aman).
- Ini **nyembunyiin gejala** — record `dp` buat Supervisor TETEP gak kesimpen. Bukan pengganti Fix A.
- Kalo Fix A landing, `dp` keisi → list jalan lewat `dp`; `expectedField`/`actualField` jadi fallback harmless.

**Resolved config B (live):**
```json
{"type":"CUSTODY_DISCREPANCY_LIST","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}","discrepancyField":"dp","expectedField":"ie","actualField":"ip","joinTable":"84214220504259//item","joinKey":"ii","labelField":"in","categoryField":"ic","text":"Item dengan Selisih◆Warehouse◆Anda Hitung◆Selisih◆Kurang◆Lebih"}
```

## 3. Acceptance

1. Driver count ≠ warehouse → Report Mismatch → MismatchReport nampilin list item selisih (item · warehouse `ie` · hitung `ip` · delta).
2. `dp` tersimpan di vehicle_check opening doc (Supervisor bisa baca record selisih walau sesi driver udah kelar).
3. Warehouse closing mismatch: sama, `dp` closing tersimpan → `WarehouseClosingMismatch` list muncul.
4. Match (nol selisih) → gak ada `dp` / list kosong wajar → route CustodySuccess.

---

**Referensi:** op1Screen MismatchReport (row 660) `CUSTODY_DISCREPANCY_LIST`, CustodyReveal (645) `CUSTODY_REVEAL`, CustodyCount (635) `CUSTODY_COUNT_SUBMIT writeField:ip`, WarehouseClosingMismatch (750). vehicle_check field `ie`/`ip`/`dp` (dict book).
