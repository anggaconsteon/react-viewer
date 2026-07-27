# Dev Spec — `{warehouseId}` token + isi `gl` di gudang-opening

**Tanggal:** 2026-07-01
**Buat:** Flutter dev (renderer + token sesi).
**Pasangan:** `warehouse-opening-load-movement-dev-spec.md` (CF LOAD movement). CF baca `vehicle_check.gl` buat `fl` movement muat. Sekarang `gl:""` → `{warehouseId}` belum resolve.
**Sifat: FOLLOW-UP, NON-BLOCKING.** CF `OnVehicleOpening` jalan tanpa ini (`fl=null` → mobil tetep dapet stok). Spec ini nutup **saldo GUDANG** (`−qt` pas muat) + origin muat ter-audit — BUKAN bug "isi kendaraan minus".

---

## 1. Masalah

`vehicle_check` opening (dibikin widget `CUSTODY_COUNT_SUBMIT` gudang) punya field `gl` **tapi kosong** (`gl:""` — kebukti di otq-01). `task.gl` juga kosong.

O1 spec (`warehouse-opening-check-o1-dev-spec.md` §16/§103) UDAH nge-spec write-nya `…⭘vv◼{vehicleId}⭘gl◼{warehouseId}⭘…` — tapi token **`{warehouseId}` gak resolve** → `gl` ke-tulis kosong. §124 masih OPEN ("sumber `{warehouseId}` dari mana?").

**Akibat:** movement muat (CF `OnVehicleOpening`) gak punya `fl` (asal gudang) → `asset_cache` **gudang gak berkurang** pas muat + origin muat gak ke-track.

---

## 2. Requirement

### 2.1 Resolve token `{warehouseId}`

| item | isi |
|---|---|
| nilai | **`lv` `stock_location` `st=warehouse`** — gudang tempat checker sesi kerja. String, format kaya `vv`/`kl` (mis. `"F6xxxxxxxxxxxx"`). |
| sumber (rekomendasi) | **sesi gudang checker** — checker masuk lewat `WarehouseFeed` di 1 loading bay = 1 warehouse → `lv` warehouse itu. |
| fallback (demo 1-gudang) | lookup satu-satunya `stock_location lt◼warehouse`. |
| alternatif | `task.gl` (admin set origin di create-task) — tapi sekarang kosong juga; kalau mau pakai ini, admin-create-task harus ngisi `gl` dulu. |

> Token ini sekelas `{vehicleId}` / `{checkerVid}` / `{today}` — **runtime/sesi, renderer yang resolve.** Bukan CF, bukan config.

### 2.2 Tulis `{warehouseId}` → `vehicle_check.gl`

`CUSTODY_COUNT_SUBMIT` mode `opening` → native write `vehicle_check` → **set `gl = {warehouseId}`** (jangan empty). Field ini dibaca:
- **CF `OnVehicleOpening`** → `fl` movement muat (`INTERNAL` gudang→mobil).
- **Closing** (`cty=closing`) reconcile, kalau butuh origin.

---

## 3. Config (page `WarehouseOpeningCheck` — `json/warehouse/opening.json`)

Widget `CUSTODY_COUNT_SUBMIT` opening — **tambah 1 param `warehouseId`**; renderer tulis ke `vehicle_check.gl`. Sisanya PERSIS existing (jangan diubah):

```json
{
  "type": "CUSTODY_COUNT_SUBMIT",
  "mode": "opening",
  "vidtable": "20342033315492",
  "checkTable": "84214220504259//vehicle_check",
  "workforceTable": "84214220504259//workforce",
  "vidField": "vid",
  "nameField": "n",
  "writeCond": "full",
  "warehouseId": "{warehouseId}",
  "action": "savesend",
  "gpsPosition": 2,
  "flag": "warehouse-opening-check",
  "addToEvent": "84214220504259//evidence⭘r◼4320⭘tablevid◼20342033315492⭘ety◼notes⭘ept◼check⭘erf◼{activeVehicle}⭘d◼◁5▷⭘cv◼{checkerVid}⭘cn◼{checkerName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶",
  "updateEventRow": "84214220504259//stock_location⭘tablevid◼20342033315492⭘search◼lv★{activeVehicle}⭘dv◼{chosenVid}⭘dn◼{chosenName}",
  "route": "vertikaTeknoLokaciptaWarehouseFeed",
  "text": "Submit · Catat Muatan"
}
```

**Yang berubah:** cuma `"warehouseId": "{warehouseId}"` (baris baru). Renderer: pas native-write `vehicle_check`, isi `gl` = nilai `warehouseId` (resolve token). Kalau `{warehouseId}` belum ada → `gl` tetep kosong (behavior sekarang, aman — CF `fl=null`).

> Kalau renderer udah punya jalur nulis `gl` dari token lain, cukup **arahin ke `{warehouseId}`** — param `warehouseId` ini opsional kalau tokennya udah global.

---

## 4. Acceptance

- Abis gudang-opening submit → `vehicle_check.gl` = `lv` `stock_location st=warehouse` yang bener (bukan `""`).
- Nilai `gl` = doc `stock_location` beneran (movement `fl` bisa resolve).
- CF `OnVehicleOpening` (pasangan spec) → movement muat `fl=gl` → `asset_cache` **gudang** `−qt` per item muat.
- `{warehouseId}` konsisten lintas sesi checker di gudang yang sama.

---

## 5. Scope + non-blocking

- **Ini nutup:** saldo GUDANG (`−qt` muat) + origin muat.
- **BUKAN:** bug "isi kendaraan minus" (itu di CF spec, `tl=vv`, gak butuh `gl`).
- **CF dev gak nunggu spec ini.** Urutan aman: CF `OnVehicleOpening` ship dulu (`fl` null-tolerant) → bug isi-kendaraan beres → spec ini nyusul buat saldo gudang.

**Referensi:** `warehouse-opening-load-movement-dev-spec.md` (§1 wire gl + §2 movement), `warehouse-opening-check-o1-dev-spec.md` (§16/§103/§124 `gl`/`{warehouseId}`), `driver-runtime-field-dictionary.md` (`gl` = warehouse `lv`).
