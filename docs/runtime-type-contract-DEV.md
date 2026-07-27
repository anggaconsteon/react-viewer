# Runtime Type Contract — DEV (anti type-mismatch)

**Tanggal:** 2026-06-29
**Konteks:** custody stuck (`cst` gak ke-`custody_confirmed`) + ghost doc `xx...` + reveal `vid` string-vs-int + Tolak gak ngurangin item. **Akar = SATU**: field key dipakai di query (`cdt`, `vid`, `vv`) punya **tipe campur** antar-doc/antar-path (String vs Number).
**SSOT tipe:** `docs/driver-runtime-field-dictionary.md`.

---

## TL;DR

1. **Bukan bug updateTableRow.** `updateEventRow`/`updateTableRow` itu **sparse** — cuma PAKAI `cdt`/`vid` di `search`, gak pernah NULIS-nya.
2. **Seed repo BENER** (`driver-runtime-seed.js` nulis `cdt: num()` = Number). Doc String-cdt lahir dari **seeder live yang diverge** (di luar repo), bukan dari flow app.
3. **Fix = paksa 1 tipe kanonik per field di WRITE + token-injection (dictionary-driven), BUKAN adaptive-per-read.** Adaptive-per-read = nambah kode tiap path, fragile (udah kebukti divergen), gak benerin write → ghost doc terus lahir.

---

## 1. Hasil investigasi — siapa nulis `cdt` String

| sumber | nulis `cdt`? | tipe | bukti |
|---|---|---|---|
| `scripts/driver-runtime-seed.js` | ya | **Number** | `:299` `cdt: num(s.tdt)`; `:266` `tdt: num(t.tdt)` |
| `scripts/warehouse-gudang-seed.js` | **TIDAK** | — | `:13` komentar "GAK ADA vehicle_check ... gudang O1 yang bikin nanti"; 0 baris `cnm/cty/cdt` |
| DSL app-write (semua `json/**` + op1Screen) | **TIDAK** | — | `updateEventRow`/`updateTableRow` sparse; `cdt` cuma muncul di `search◼cdt★{today}`, gak pernah jadi field yang ditulis |
| Doc live `CHK-F629GD0000099-20260629` | — | **String** `"1782666000000"` | cnm BUKAN format repo (`CHK-VEH-{plat}-{ymd}-OPEN`); punya `ie/ip/dp/gv` lengkap = real opening doc |

**Kesimpulan (UPDATE 2026-06-30 — PASTI, bukan seeder):** doc String-cdt ditulis renderer widget **`CUSTODY_COUNT_SUBMIT`** (mode `opening` @ page `WarehouseOpeningCheck`, mode `closing` @ `WarehouseClosingCheck`) — **native write, BUKAN seed/CF/DSL**. Stamp `cdt`/`ldt` String, tapi `t` Number (inkonsisten dalam 1 widget). Seeder repo semua BENER (`num()` = Number). Detail + rekomendasi ganti → **§8**.

**`updateEventRow` = korban, bukan sumber:** search `cdt★{today}` di-inject **Number**, stored `cdt` **String** → gak match → fallback **bikin doc baru** = ghost `xxGpSQBkwS09AFjiCwet`. Read/reveal **match** (path itu treat `{today}` sebagai String) → **divergensi tipe antar-path di renderer**.

---

## 2. Kontrak tipe kanonik (SSOT = field-dictionary)

| field | tipe | catatan |
|---|---|---|
| `cdt` `tdt` | **Number** | epoch-midnight-ms, eq-match `{today}` (dict `:81`, `:115`) |
| `vid` `cv` `dv` `gv` (actor id) | **String** | **KOREKSI 2026-06-30: String, BUKAN Number.** Seed nulis `String(...)` (workforce.js:796 `vid`; Kode.gs `cv:str()`). Reveal-bug = renderer salah inject Number; fix = treat String |
| `qt` `pd` `pp` `ad` `ap` `ps` `as` `pb` `ab` `pr` `ar` `ex` `ac` `dl` | **Number** | qty / plan / aktual / selisih |
| `t` `et` `tce` `ldt` `vce` | **Number** | epoch ms |
| `vv` `lv` `kl` `gl` `ii` | **String** | location/item id (`VEH-...`, `F629GD...`, `8886008101138`) |
| `cnm` `tnm` `vnm` | **String** | doc number/id |
| `cst` `cty` `rs` `tst` `tty` `mt` `cd` `tx` `ic` `lt` | **String** | enum |
| `tablevid` `vidtable` | **String** | segmen PATH Firestore (`MobileTable/{db}/tables/{tablevid}/...`) — selalu string, JANGAN samakan sama field `vid` |
| `ts` | **String** | occurred string, **cuma `movement`** |

> **`vid` (field) ≠ `tablevid` (path).** `vid` di-query → ikut tipe stored (**String**). `tablevid` segmen path → String. Jangan ketuker.
> **Field-name case (2026-06-30):** workforce simpan **`vid`** (lowercase, workforce.js:796). Widget yang query **`VID`** (uppercase) = MISS (Firestore case-sensitive). Pakai `vid` di SEMUA. Sempet salah di `vehicleFeedHeader.checkerSearch` + `CUSTODY_COUNT_SUBMIT(closing).vidField` → **FIXED.**

---

## 3. Tipe token (di-inject renderer)

| token | inject sebagai | match ke field |
|---|---|---|
| `{today}` | **Number** | `cdt` / `tdt` |
| `{driverVid}` `{checkerVid}` `{chosenVid}` | **String** | `vid` / `cv` / `dv` |
| `{vehicleId}` | **String** | `vv` / `lv` |
| `{taskVid}` | **String** | `tnm` |

**Aturan emas:** token di-inject **sekali**, di **satu** resolver, tipe per tabel di atas. SEMUA path (`search` widget, `gateSearch`, `updateEventRow`/`updateTableRow` search, reject, CF) baca resolver yang SAMA. **Jangan tiap path nentuin tipe sendiri** — itu sumber divergensi reveal-jalan-updateEventRow-mati.

---

## 4. Tempat token dipakai (enforce di sini)

Tiap klausa `search`/`gateSearch`/`itemsSearch`/`updateEventRow`/`updateTableRow` yang ngandung `{today}`/`{vehicleId}`/`{driverVid}`/`{taskVid}` atau key `cdt`/`tdt`/`vid`/`vv`. Contoh live:

- **DriverHome** (op1Screen 1007): `vid◼{driverVid}` · `lv◼{vehicleId}` · `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}⭘cst◼custody_confirmed` (PRECONDITION_GATE/INVENTORY/STOP/NAV `search`+`gateSearch`) · task `vv◼{vehicleId}⭘tdt◼{today}`
- **Custody P5/P6/Reveal**: `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}`
- **CustodySuccess / MismatchReport** (1042/1050): `updateEventRow ...search◼cty★opening☆vv★{vehicleId}☆cdt★{today}⭘cst◼custody_confirmed`
- **Admin** (`json/admin-runtime/*`): `updateEventRow ...search◼tnm★{taskVid}⭘vv◼{vehicleId}⭘tst◼assigned`

---

## 5. Rencana fix (urut)

1. **Renderer: 1 token-resolver** sesuai §3. Reveal + updateEventRow + reject + semua baca ini → tipe konsisten. (root fix; mecahin cst-stuck + ghost.)
2. **Live seeder**: konsisten-in dengan repo → `cdt`/`tdt` = `num()`, `vid` = Number. (samakan ke `driver-runtime-seed.js`.)
3. **Migrasi doc lama** (1 script sekali jalan): `cdt` String→Number; **hapus ghost** (`xxGpSQBkwS09AFjiCwet` + auto-id liar di `vehicle_check`).
4. **Copot adaptive-per-read** (band-aid reveal) setelah #1–#3 — biar regresi tipe baru ke-detect, gak ke-mask.

---

## 6. Kenapa BUKAN "adaptive di semua path"

1. Field campur tipe antar-doc → **gak ada 1 query yang match semua doc** (list/range pecah).
2. `updateEventRow` HARUS nemu 1 doc buat merge → write-type ≠ stored-type → **bikin ghost doc** → makin banyak doc salah-tipe (lingkaran setan).
3. Nambah kode di **tiap read selamanya**, dan **tetap gak benerin write**. Write-side fix lebih sedikit + permanen.

---

## 7. "Tolak gak ngurangin item" — kemungkinan kelas sama

Reject = `tst→load_rejected` + CF unload movement + rebuild `vehicle_check.ie[]` (`docs/driver-runtime-reject-unload-cf-spec.md`). Kalau query/CF nge-key field mismatch tipe (`ii`/`vv`/`lv` String vs di-inject lain, atau `vid`), unload gak ke-apply → item gak berkurang. **Cek tipe key di reject path + CF pakai kontrak §2.** Kemungkinan beres bareng fix §5.1.

---

## 8. `CUSTODY_COUNT_SUBMIT` (opening/closing) — sumber cdt/ldt String + ganti ke savesend

**Sumber PASTI cdt/ldt String** = renderer widget `CUSTODY_COUNT_SUBMIT`, native write doc `vehicle_check`:
- `mode:"opening"` @ page `vertikaTeknoLokaciptaWarehouseOpeningCheck` (submit "Submit · Catat Muatan")
- `mode:"closing"` @ page `vertikaTeknoLokaciptaWarehouseClosingCheck` (submit "Simpan Penutupan")

Bukti Firestore (2026-06-30):
- opening `CHK-F629GD0000099-20260630`: `cdt:"…"` `ldt:"…"` **String**, `t` Number.
- closing `CHK-F621a02a983500-20260630-C`: `cdt:"…"` **String**.
- seed `uEp6ZJp2ucAGr0UZmRLP` (auto-id, `CHK-VEH-{plat}-OPEN`): `cdt` **Number** = bener.

**3 masalah widget ini:**
1. **cdt/ldt String** (harus Number) → query `cdt◼{today}` (custody gate + closing list) miss.
2. **Doc-id deterministik `CHK-{vv}-{ymd}`** ≠ seed (auto-id). Closing "set opening `cst=closed`" target `CHK-{vv}-{ymd}`, tapi opening asli = seed auto-id → gak ketemu → **ghost 1-field `{cst:"closed"}`** (doc `CHK-F621a02a983500-20260630`).
3. **Gak nulis Event (audit)** — bypass `addToEvent`. Aksi lain (savesend) ninggalin Event; opening/closing kosong.

**Kenapa native dipake:** cuma buat nulis array `ie[]`/`ip[]` (DSL gak bisa array). Itu **satu-satunya** alasan.

**KEPUTUSAN (user 2026-06-30): ganti `CUSTODY_COUNT_SUBMIT` → `sendButtonGpsWithEvent` (savesend).** Satu tombol:
- `addToEvent` → **Event audit** ✓
- `addToTable`(auto-id) / `updateEventRow`(search-based) → scalar incl `cdt` **Number**; set opening `cst=closed` via **search** (`cty◼opening⭘vv◼{vv}⭘cdt◼{today}`), bukan constructed-id → **no ghost, auto-id** ✓
- **1 kapabilitas renderer BARU:** tulis array field (`ie`/`ip`) dari state list-widget (`CUSTODY_COUNT_LIST` / `ITEM_EXECUTION_LIST`) pas savesend. = **SAMA hook actual-write `it[].ad/ap`.** Build sekali, reuse 2 fitur.
- Hapus `CUSTODY_COUNT_SUBMIT` (opening + closing).

**Interim (kalau array-hook belum siap):** fix `CUSTODY_COUNT_SUBMIT` → cdt/ldt Number + auto-id + opening-cst-update via search (bukan constructed-id) + emit `addToEvent`. Tetep diganti ke savesend ujungnya.

---

## Acceptance

- `cdt`/`tdt`/`ldt` semua doc = Number; `{today}` inject Number.
- CustodySuccess "Kirim" → opening doc `cst` jadi `custody_confirmed` (UPDATE doc asli, **bukan** bikin ghost).
- Opening/closing submit → **nulis Event (audit)** + doc **auto-id** + `cdt` Number.
- Closing set opening `cst=closed` via search → **0 ghost 1-field** di `vehicle_check`.
- Reveal `vid` match tanpa adaptive; `{driverVid}`/`{checkerVid}`/`{chosenVid}` inject String; query pakai `vid` (lowercase) di semua widget.
- Tolak → `ie[]`/asset_cache berkurang sesuai.
