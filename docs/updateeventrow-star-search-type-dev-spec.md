# Dev Spec — updateEventRow ☆-search: type-tolerant compare + non-silent miss

**Tanggal:** 2026-07-03
**Buat:** Flutter dev (renderer — updateEventRow ☆-search path).
**Bug:** Custody "Kirim" (CustodySuccess & MismatchReport) gak flip `cst` → DriverHome tetep ke-kunci abis custody. Data bener, gate bener — **write-nya yang miss, diam-diam.**

---

## 0. Bukti live (otq-01, 2026-07-03, doc `vehicle_check/qNopQSuM6MJndzcpVsPn`)

User pencet **Kirim** di MismatchReport (dialog "Terkirim" muncul). Hasil doc:

| field | nilai | catatan |
|---|---|---|
| `cst` | `"awaiting_custody"` | ❌ **GAK ke-flip** (harusnya `custody_confirmed`) |
| `ip` (4 baris), `dp`, `rs:"discrepancy_detected"` | ✅ ketulis | write **reveal (native widget)** sukses di doc yang SAMA |
| `cdt` | `1783011600000` (**Number**) | fix type renderer udah landing, bener |
| `gl` | `"F621558e33b612"` | wiring {warehouseId} udah jalan ✓ |
| koleksi | **cuma 1 doc** | **gak ada ghost** — miss sekarang = silent no-op |

→ Doc **ada & bisa ditulis** (reveal buktinya). Yang gagal spesifik = **updateEventRow** dari RBT savesend:

```
updateEventRow: 84214220504259//vehicle_check⭘tablevid◼20342033315492
  ⭘search◼cty★opening☆vv★{vehicleId}☆cdt★{today}
  ⭘cst◼custody_confirmed
```

## 1. Root cause — `{today}` inject STRING, `cdt` stored NUMBER

`updateEventRow` = payload **string DSL**. Token `{today}` disubstitusi **tekstual** → semua value klausa search nyampe comparator sebagai **String**. Firestore strict:

| klausa | stored | injected | hasil |
|---|---|---|---|
| `cty★opening` | String | String | ✓ |
| `vv★F621a02a983500` | String | String | ✓ |
| `cdt★{today}` | **Number** `1783011600000` | **String** `"1783011600000"` | ✗ MISS |

AND-join → 1 gagal = semua gagal → **0 doc match** → `cst` gak ketulis → **silent** (gak ada error, gak ada ghost).

**Kenapa cuma custody yang kena:** delivery/reject/failed updateEventRow search pake `tnm` (String vs String ✓). Custody = satu-satunya ☆-search yang bawa field **Number** (`cdt`).

**Kenapa baru sekarang:** dulu `cdt` stored String (bug lama) → kebetulan match sama injected String. Dev benerin `cdt`→Number (BENER per kanon `runtime-type-contract`) → ☆-search yang string-injected jadi miss. Fix satu sisi tanpa sisi lain = mindahin bug.

## 2. Fix A (WAJIB) — pasang eq() tolerant di jalur ☆

**Reuse comparator yang UDAH DIBUILD** buat search-DSL `◼` (spec `dsl-eq-type-tolerance-dev-spec.md` — numeric-compare kalau dua-duanya angka kanonik round-trip, fallback string). **Pasang fungsi yang SAMA di evaluasi klausa ☆ updateEventRow** (dan updateTableRow kalau share path).

- 1 fungsi, reuse — jangan bikin comparator kedua yang beda perilaku.
- JANGAN per-field coercion (butuh schema, rapuh) dan JANGAN buang `cdt` dari search (bisa match opening hari lain).

## 3. Fix B (WAJIB) — miss JANGAN silent

Sekarang: search miss → no-op tanpa jejak (ghost-create udah gak ada — bagus, tapi gagalnya invisible; user liat dialog "Terkirim" padahal gak ketulis).

Minimal: **log error** ("updateEventRow miss: <search resolved> — 0 doc match") biar kegagalan write keliatan di log/debug. Ideal: surface ke UI (toast/dialog beda) — tapi log dulu cukup.

## 4. Acceptance

- Custody count → reveal → **Kirim** (CustodySuccess ATAU MismatchReport) → `vehicle_check.cst` = `custody_confirmed`. DriverHome kebuka ("Isi Kendaraan Sekarang" + rute unlock).
- `cdt` stored Number + `{today}` injected string → **tetep match** (tolerant).
- Doc cdt String lama (data lawas) → juga match (tolerant dua arah).
- Regresi: delivery `tnm★`, reject, failed, return `rt◼returned` — semua updateEventRow existing tetep jalan (comparator tolerant gak mecahin String-vs-String).
- Leading-zero guard: `"0123"` ≠ `123` (aturan round-trip canonical dari spec eq-tolerance — barcode/ii aman).
- Search miss → **ada log error**, bukan silent.

---

## 5. ⚠️ ADDENDUM 2026-07-03 sore — MASIH GAGAL setelah fix dev

Dev lapor fix §2 udah masuk. Re-test 2 trip (2 mobil): **dua-duanya tetep gagal, identik.**

| doc | mobil | jalur | rs | cst |
|---|---|---|---|---|
| `2ZclpcbFvMtJ4QvLhaTy` | B 1234 XY (`F621a02a983500`) | **CustodySuccess (match)** | `matched` | ❌ `awaiting_custody` |
| `hXFZ5d7H8Wx2KAf33aJk` | B 5678 CD (`F6260618c7bcdf`) | **MismatchReport (selisih)** | `discrepancy_detected` | ❌ `awaiting_custody` |

- Dua-duanya: reveal native write LANDING (`ip`/`dp`/`rs` keisi), `cdt` Number bener, `{today}`-value cocok, **nol ghost**.
- Manual flip `cst` di console → home kebuka normal (gate READ beres).
- → Jalur ☆ updateEventRow → vehicle_check **gak pernah landing**, match & mismatch sama. Sistemik, bukan flaky.

**3 pertanyaan implementasi (jawab ini dulu sebelum coding lagi):**

1. **Tolerance-nya ditaruh di mana?** Kalau di **Firestore `where('cdt','==',…)` server-side → GAK BISA tolerant** (server strict, harus pilih 1 tipe). Yang bener per `dsl-eq-type-tolerance` §3: **fetch pake anchor strict-safe (`cty`+`vv`, dua-duanya String) → filter `cdt` CLIENT-SIDE pake `eq()`**. Konfirmasi implementasinya yang mana.
2. **Fix beneran ada di build yang di-test?** Versi APK/build number yang include fix vs yang ke-install di device test.
3. **Semantics ☆ sebenernya apa?** (a) per-field AND query, atau (b) **literal string match ke field `search` doc**? Doc vehicle_check bawa `search:"cnm★CHK-…"`; kalau semantics = (b), query `"cty★opening☆vv★…☆cdt★…"` **gak akan pernah** match apapun tipenya — dan delivery jalan justru karena `tnm★{activeTaskVid}` == doc.search persis. Kalau (b) → fix-nya BUKAN tolerance, tapi ganti mekanisme match (atau config search custody diganti ke bentuk yang bisa match doc.search — butuh token `cnm` di sesi driver, belum ada).

**Debug cepet yang minta dijalanin dev:** log **search string ter-resolve** + **jumlah doc match** + **doc-id yang ke-update** tiap updateEventRow fire (Fix B §3). 1 kali reproduce = langsung keliatan miss-nya di step mana.

### §5.1 BUKTI BARU 2026-07-06 — jawaban pertanyaan #3: kemungkinan besar **parser ☆ (AND-join) gak ke-implement**

Trip baru (Honda Bintaro, Cleo 1). Doc `vehicle_check/4BKHgB02a44oJTocomoJ`: `cst:"awaiting_custody"` (STUCK lagi), `cdt:1783270800000` Number ✓, **doc-id AUTO** ✓ (fix landed), `cnm:"CHK-F621a02a983500-20260706"` ✓, `search:"cnm★CHK-F621a02a983500-20260706"`, `ie:[{cd:full,ii:2000000000192,qt:1}]`.

Diskriminator lintas SEMUA jalur updateEventRow live:

| jalur | search ter-resolve | klausa | target doc | hasil |
|---|---|---|---|---|
| Delivery submit | `tnm★TASK-2026-000237` | **1** | task | ✅ jalan |
| Opening designate (dv/dn) | `lv★F621a02a983500` | **1** | stock_location | ✅ jalan |
| Custody Kirim (Success & Mismatch) | `cty★opening☆vv★F621a02a983500☆cdt★1783270800000` | **3 (☆)** | vehicle_check | ❌ SELALU miss |

- **Hipotesis (b) di pertanyaan #3 (literal match ke doc.`search`) GUGUR:** stock_location hasil seed **gak punya field `search`** (grep seeder: cuma task yang dikasih `search:"tnm★…"`) tapi designate `lv★` tetep jalan → matching per-field, bukan compare ke doc.search.
- **Pola yang fit semua bukti: single-clause ☆-search jalan, multi-clause GAK PERNAH.** Dugaan kuat: parser jalur ☆ berhenti di pasangan pertama / gak split di `☆` — string kebaca `cty = "opening☆vv★…☆cdt★…"` → gak mungkin match → 0 doc → silent no-op. Konsisten juga sama kenapa fix tolerance (§2) gak ngefek: bug-nya bukan tipe.
- **Fix:** split `☆` → N klausa AND, evaluasi per-field (anchor strict-safe server-side + sisanya client-side `eq()` — sama kayak jawaban pertanyaan #1). Acceptance §4 tetap berlaku.
- Verifikasi 1 menit buat dev: log search ter-resolve di jalur ☆ — kalau kebaca 1 pasangan doang, case closed.

## 6. ⚠️ SUB-BUG KE-2 (2026-07-03) — EMPTY-VALUE WRITE DI-DROP (dv/dn clear gagal)

**Bukti live** (`stock_location` B1234XY abis closing): `dv:"87544551624342"` + `dn:"Agenia Demo-7"` **MASIH KEISI** — harusnya di-clear `""` oleh closing.

**Diskriminator (ini yang bikin pasti):**

| write | search | value | hasil |
|---|---|---|---|
| Opening designate `…⭘dv◼{chosenVid}⭘dn◼{chosenName}` | `lv★{activeVehicle}` | ADA isi | ✅ jalan (dv kebukti keisi) |
| Closing clear `…⭘dv◼⭘dn◼` | `lv★{activeVehicle}` (SAMA) | **KOSONG** | ❌ dv/dn gak berubah |

Search identik + kebukti jalan → **failure BUKAN di search, tapi di write-value: klausa `field◼` (value kosong) DI-DROP parser/renderer.** Mekanisme BEDA dari §1 (type-miss) — 2 sub-bug terpisah di jalur updateEventRow, dua-duanya silent.

**Fix:** `field◼` (value kosong, tanpa token) = **tulis empty string `""`** eksplisit, JANGAN di-skip. `""` = nilai kanonik "unassigned" di sistem (admin `noExecutorGate:"dv◼"`, feed tier rule-1 `dv` kosong). Bedain dari field yang **di-omit** (gak ditulis sama sekali = biarin).

**Efek user-visible sekarang:** mobil abis closing gak balik ke backlog feed gudang (tier stuck `completed`, gak bisa dipilih buat trip baru) — karena tier rule-1 butuh `dv` kosong.

**Acceptance:** closing submit → `stock_location.dv` = `""` + `dn` = `""` → feed tier mobil balik `loading` (kalau ada task assigned baru) / backlog.

---

**Referensi:** `dsl-eq-type-tolerance-dev-spec.md` (comparator eq() — reuse persis), `runtime-type-contract-DEV.md` (kanon cdt Number), op1Screen live B647/B655 (config CustodySuccess/MismatchReport) + B711/B725 (warehouse opening/closing), `project_runtime_type_contract` (riwayat: kasus sama di jalur read, dulu ghost-create).
