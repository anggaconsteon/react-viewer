# Dev Spec — Empty scope-token = FAIL-CLOSED (driver-home leak)

**Tanggal:** 2026-07-02
**Buat:** Flutter dev (renderer — search-DSL + driver-home state).
**Severity:** 🔴 **DATA-LEAK + salah-aksi.** Driver yang BUKAN pilihan bisa liat **DAN** aksi (Konfirmasi/Tolak/deliver) muatan+task mobil orang lain.

---

## 0. Gejala (bukti live otq-01, 2026-07-02)

Admin/gudang assign driver ke mobil **B 1234 XY**. Login pakai **Dirgahayu** (BUKAN driver pilihan) → DriverHome nampilin muatan (Amidis 2 / Cleo 4 / LPG 5) + rute (Indomaret BSD, Mandiri Tower) — **punya B 1234 XY**, bukan punya Dirgahayu.

Header udah bener: **"Dirgahayu · Belum ditugaskan kendaraan"**.

## 1. Data (assignment BENER, bukan salah data)

`stock_location` B 1234 XY:
```
lv:  "F621a02a983500"   lt: "vehicle"   lst: "active"
dv:  "87544551624342"   ← driver di-assign (Agenia Demo-7)
dn:  "Agenia Demo-7"
```
Dirgahayu = vid LAIN → gak ada mobil yg `dv`-nya = Dirgahayu → **`{vehicleId}` Dirgahayu = KOSONG** (bener). Header "belum ditugaskan" konfirmasi ini.

## 2. Root cause — empty token → klausa di-DROP → query UNFILTERED (fail-open)

Kartu driver-home search pake `{vehicleId}`:
| widget | search |
|---|---|
| `PRECONDITION_GATE_CARD` | `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}⭘cst◼awaiting_custody` |
| `DRIVER_STOP_CARD` | `vv◼{vehicleId}⭘tdt◼{today}` |
| `INVENTORY_BUCKET_CARD` | `lv◼{vehicleId}` |

Pas `{vehicleId}` **kosong**, renderer **drop klausa `vv◼`/`lv◼` yang kosong** → query sisanya:
- Stop: `tdt◼{today}` → SEMUA task hari ini → Indomaret + Mandiri (2 tujuan) bocor.
- Gate: `cty◼opening⭘cdt◼{today}⭘cst◼awaiting_custody` → opening doc B1234XY → muatan bocor.

Karena cuma 1 mobil → "tanpa filter `vv`" = kebuka semua data mobil itu.

> Kenapa header lolos: `INVENTORY`/header pake **single-clause** `lv◼{vehicleId}` — kosong → nol match → bener. Yang bocor = search **multi-clause** yg klausa lain-nya (`tdt`/`cdt◼{today}`) masih match.

## 3. Fix

**A. (GENERIC, wajib) Klausa search dgn token KOSONG → query WAJIB balik ZERO (fail-CLOSED).**
- JANGAN drop klausa kosong. `vv◼<empty>` = "match nothing", BUKAN "no filter".
- **"Kosong" = `""` (empty string) DAN `null`/absent — dua-duanya.** ⚠️ `dv` di-clear ke **`""`** pas closing (`stock_location dv◼⭘dn◼`), jadi `{vehicleId}` yg resolve dari `dv◼{driverVid}` lahir **`""` (bukan null)**. Kalau fail-closed cuma cek `null` → `""` **LOLOS → bocor lagi**. Wajib treat `""` sebagai empty juga. (Sistem emang pake `dv◼` empty-string sbg "unassigned": admin `noExecutorGate`, feed loading tier.)
- Fix di parser search-DSL = nutup leak **system-wide** (semua widget, semua page), bukan cuma driver-home.
- ⚠️ **JANGAN pukul rata ke SEMUA value kosong — bedain 2 kasus:**
  1. **Token resolve kosong** (config `vv◼{vehicleId}`, token → `""`) → **fail-CLOSED** (match nothing). Ini fix-nya.
  2. **Literal kosong yang DITULIS di config** (`dv◼` — tanpa token) = **disengaja "match docs yang field-nya kosong"**. Dipake LIVE: admin `noExecutorGate:"lt◼vehicle⭘dv◼"` + vehiclePicker `search:"lt◼vehicle⭘lst◼active⭘dv◼"`. Ini **HARUS tetep match-empty**, jangan ikut fail-closed — kalau kena, dua fitur itu mati.
  - Pembeda-nya di **raw config**: value mengandung `{token}` yang resolve kosong → kasus 1; value emang kosong dari sananya → kasus 2.
- Beda dari eq-type-tolerance (`dsl-eq-type-tolerance-dev-spec.md`): itu soal **tipe** (string↔number). Ini soal **token KOSONG**. Ortogonal — dua-duanya perlu.

**B. (driver-home) `{vehicleId}` kosong = "belum ditugaskan" state.**
- Kalau driver login gak punya mobil (`{vehicleId}` empty) → tampilin **cuma** header "belum ditugaskan"; **sembunyiin** gate muatan / rute / inventory. Layar bersih, gak ada data orang lain.

## 4. `{vehicleId}` resolution (confirm — udah bener)

`{vehicleId}` = `stock_location` `lv` WHERE `lt=vehicle ⭘ dv◼{driverVid}` (mobil yg `dv`-nya = driver login). Dirgahayu `dv`-nya bukan dia → kosong. **Resolution udah bener** (header buktinya) — fix cuma di empty-handling (§3), bukan resolution.

## 5. Acceptance

- Login driver **pilihan** (vid `87544551624342`) → `{vehicleId}` = `F621a02a983500` → muatan + rute B1234XY tampil. ✓
- Login driver **BUKAN pilihan** (Dirgahayu / vid lain) → `{vehicleId}` kosong → DriverHome **cuma** "belum ditugaskan", **NOL** muatan/rute/inventory. ✓
- Gak ada tombol Konfirmasi/Tolak yang ke-render buat non-assigned (gak bisa aksi task orang lain).
- Cek widget lain yg pake token scope (mis. gudang feed, admin) — empty token = fail-closed, gak bocor.

---

**Referensi:** `p4-driver-home.json` (search per widget pake `{vehicleId}`), `driverhome-p4-dev-spec.md` (state), `dsl-eq-type-tolerance-dev-spec.md` (fix TIPE — beda isu, jangan ketuker), `driver-home-state-machine-dev-spec.md` (token `{vehicleId}` = sesi/penugasan).
