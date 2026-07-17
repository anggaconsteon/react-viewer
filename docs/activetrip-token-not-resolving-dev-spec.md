# Dev Spec — token `{activeTrip}` gak resolve (trip-scope widgets 0 data)

**Tanggal:** 2026-07-07
**Buat:** Flutter dev (renderer — session token resolution).
**Konteks:** lanjutan implementasi `trip-sequence-tr-flutter-dev-spec.md` §1. CF + config udah jalan; tinggal token ini.

---

## 0. Bukti live (otq-01, 2026-07-07 pagi)

Trip baru B 1234 XY (fresh reset). Status tiap lapisan:

| lapisan | bukti | status |
|---|---|---|
| CF stamping `tr` | task `WgqPALkcY8tjeQQUWm5D` (TASK-2026-000252) → `tr:"ZbjH1nJw1UWzD4WAFcsa"` keisi ABIS opening gudang | ✅ |
| Opening doc ketemu di page | header custody nampil (B1234XY · CHK-F621a02a983500-20260707 · Agenia Demo-7) | ✅ |
| Query field `tr` | **TEST ISOLASI:** search manifest diganti literal `tr◼ZbjH1nJw1UWzD4WAFcsa` → task NAMPIL | ✅ |
| Token `{activeTrip}` | search dibalikin ke `tr◼{activeTrip}` → **0 task · 0 item line** | ❌ |

→ Data ✓, CF ✓, field ✓, query ✓. **Yang gagal cuma resolusi token.** (0-data = fail-closed yang bener buat token kosong — perilakunya sesuai scope-leak spec; yang salah token-nya gak keisi.)

## 1. Config live yang kena (resolved op1Screen, contoh 2 dari 7)

```json
{"type":"TASK_MANIFEST_LIST","vidtable":"20342033315492","table":"84214220504259//task","search":"tr◼{activeTrip}","idField":"tnm","titleField":"kn","subtitleField":"al","itemsField":"it","dropField":"pd","pickupField":"pp","txField":"tx","saleField":"ps","refillField":"pr","buyField":"pb","excludeStatus":"load_rejected","route":"[ROUTE:taskDetail]","text":"Task Manifest◆task◆item line◆drop◆pickup◆tap untuk lihat detail"}
```

```json
{"type":"DRIVER_STOP_CARD","variant":"preview", "vidtable": "20342033315492","table":"84214220504259//task","search":"tr◼{activeTrip}", ...}
```

Semua pemakai `tr◼{activeTrip}` (idup barengan begitu token bener): DriverHome `DRIVER_STOP_CARD` + `NAV_ACTION_CARD` (allClosed) · CustodyNotification `TASK_MANIFEST_LIST` + `CIRCULATION_SUMMARY` · TaskFeed `ROUTE_FEED_HEADER.taskSearch` + `TASK_FEED_LIST` · ReturnVehicle `CIRCULATION_SUMMARY`.

## 2. 3 hal yang harus dicek (salah satu ini penyebabnya)

1. **Nama token.** Yang di-implement persis `{activeTrip}`? Kalau dev pake nama lain (mis. `{tripId}`/`{activeCheckId}`) → kabarin, config gue samain — tapi prefer rename di renderer ke `{activeTrip}` (udah kadung di 7 config + spec).
2. **Nilai yang dibalikin.** WAJIB **doc-id** opening vehicle_check (`ZbjH1nJw1UWzD4WAFcsa`) — **BUKAN `cnm`** (`CHK-F621a02a983500-20260707`). CF stamp `task.tr` = doc-id; kalau token balikin cnm → gak akan pernah match.
3. **Resolusi jalan di semua page driver.** Spec §1: `vehicle_check` WHERE `cty=="opening" ⭘ vv=={vehicleId} ⭘ cst != "closed"`, terbaru by `t`, ambil **doc-id**. Doc-nya ada & ke-query di page yang sama (header custody buktinya) — jadi kalau resolusi diimplement, harusnya dapet.

**Debug 1 reproduce:** log nilai `{activeTrip}` pas page load (CustodyNotification / DriverHome). Langsung keliatan: kosong / cnm / doc-id.

## 3. Acceptance

- Buka CustodyNotification abis opening: Task Manifest = 1 task (TASK-2026-000252) + Total Circulation keisi — **tanpa** ubah config (config tetep `tr◼{activeTrip}`).
- DriverHome: Rute Hari Ini = 1 tujuan; abis custody confirm → deliver → Return card muncul (allClosed scope trip).
- Driver tanpa mobil / mobil tanpa opening aktif (`cst=closed` semua) → `{activeTrip}` kosong → widget trip-scoped NOL data (fail-closed, jangan drop klausa).
- `{activeTrip}` == nilai `task.tr` (doc-id) — bandingin di log.

---

**Referensi:** `trip-sequence-tr-flutter-dev-spec.md` §1 (definisi token), `trip-sequence-tr-cf-dev-spec.md` §3 (CF stamp doc-id — sisi yang udah kebukti jalan), `driver-home-scope-leak-dev-spec.md` (aturan fail-closed token kosong).
