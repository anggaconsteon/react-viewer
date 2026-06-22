# Flow di Schema Tech Lead — Cerita 1 Hari (biar kebayang)

Sumber data RESMI = `docs/firebase-schema-galon.md` (schema tech lead). Doc ini cuma **menjelaskan flow**-nya pakai contoh nyata (Budi, mobil B-1234-XY, galon, Honda Bintaro).

---

## 1. Model paling gampang: ikutin 1 galon
Galon gak "dimiliki". Dia cuma **pindah tempat**. Tiap tempat punya hitungan. Tiap pindah = 1 `movement`.

```
GUDANG(isi) ──INTERNAL──▶ MOBIL(isi) ──DROP──▶ CUSTOMER(isi = outstanding)
                                                      │
CUSTOMER(kosong) ◀────────────────────────────────── (numpuk kosong)
     │
     └──PICKUP──▶ MOBIL(kosong) ──INTERNAL──▶ GUDANG(kosong)
```
- **Tempat** (gudang/mobil/customer) = semua `stock_locations`, beda `location_type`.
- **Pindah** = `movements` (DROP/PICKUP/INTERNAL/...).
- **Hitungan tiap tempat** = `stock_cache` — DIITUNG ROBOT (Cloud Function), bukan app.

> Mantra: **App nyatet PINDAH. Robot ngitung SISA.** App gak pernah nulis angka stok.

---

## 2. Pemain (4 orang + 1 robot)
| pemain | runtime | kerja |
|---|---|---|
| Admin | admin | bikin `tasks`, atur jadwal |
| **Checker** | checker | cek mobil (`vehicle_checks` opening & closing) — NGITUNG custody |
| **Driver (Budi)** | driver | eksekusi anter: `movements` DROP/PICKUP + update `tasks` + `evidence` |
| Supervisor | supervisor | beresin selisih (`investigations`) |
| 🤖 Cloud Function | — | tiap `movements` masuk → update `stock_cache` |

> ‼️ **Custody (ngitung muatan) = kerjaan CHECKER, bukan Budi.** Beda sama prototype kita (dulu driver yg ngitung). Ini pertanyaan kunci — lihat §6.

---

## 3. Timeline 1 hari

### 08:00 — Admin siapin (sebelum Budi dateng)
- `tasks/TASK-001`: client=CLT-honda, vehicle=VEH-B1234XY, driver=Budi, type=delivery,
  items=`[{galon, full, planned_qty:5}]`, execution_state=**assigned**
- Gudang muat mobil → append `movements`:
  ```
  INTERNAL  WH-bintaro → VEH-B1234XY  galon full  qty 30
  ```
  🤖 → cache VEH galon|full: 0→**30** · cache WH galon|full: 200→**170**

### 08:15 — Checker cek mobil (vehicle_checks OPENING) = CUSTODY
- Checker hitung fisik → `items_physical:[{galon, full, 30}]`
- `check_type:opening`, `reconciliation_state:matched` (cocok sama yg dimuat)
- Inilah "custody confirm" kita. **Yang ngitung checker.**

### 08:30 — Budi scan & mulai (DRIVER runtime)
- `users/Budi` role=driver · `stock_locations/VEH-B1234XY.current_driver_id=Budi`
- Budi baca task: `where driver_id==Budi, scheduled_date==today`
- Budi liat muatan: baca **`stock_cache` where location=VEH-B1234XY** → galon full 30
  (gak ngitung sendiri — baca cache robot)

### 09:42 — Nyampe Honda: anter 5 isi, ambil 5 kosong
Append 2 `movements`:
```
DROP    VEH-B1234XY → CLT-honda   galon full   qty 5
PICKUP  CLT-honda → VEH-B1234XY   galon empty  qty 5
```
🤖 → VEH galon|full 30→**25** · CLT-honda galon|full 0→**5** (outstanding isi) · VEH galon|empty 0→**5**

Update + lampiran:
- `tasks/TASK-001`: items.actual_qty=5, execution_state→**completed**, completed_at set
- `evidence`: photo + signature + gps → nempel ke movement & task

> Tiap stop = pola sama: DROP (+PICKUP kalau ada) → cache gerak → task completed → evidence.

### 11:30 — Balik gudang (vehicle_checks CLOSING)
- Checker hitung fisik mobil → `items_physical:[{galon,full,sisa},{galon,empty,kumpul}]`
- `items_expected` = **dihitung server** dari movements (robot tau harusnya berapa)
- `reconciliation_state`: **matched** atau **discrepancy_detected**
- Kalau cocok → barang balik: `movements` INTERNAL VEH→WH (sisa isi + kosong)
  🤖 → cache gudang naik lagi
- task → validated → closed

### Kalau ADA SELISIH (closing)
```
vehicle_check.discrepancies:[{galon, full, expected:25, actual:24, delta:-1}]
   │ (kurang 1)
   ▼
investigations  state:pending_review, source_check_id=...
   │
   ▼ supervisor review
resolution_type:  clean | with_adjustment | damage_confirmed | loss_confirmed
   │ (kalau beneran ilang)
   ▼
movements  ADJUSTMENT/LOST  (by supervisor)  🤖 → cache dikoreksi
```
> Selisih ≠ ilang. Gak loncat ke "loss" tanpa supervisor. (Insting kita bener.)

---

## 4. Apa berubah di tiap collection (ringkas)
```
WAKTU  AKSI              movements    stock_cache(🤖)   tasks         lain
08:00  muat mobil        +INTERNAL    VEH+ WH−          create(assigned)
08:15  opening check     —            —                 —             vehicle_checks +opening
08:30  Budi mulai        —            (baca)            (baca)
09:42  anter Honda       +DROP+PICKUP VEH± CLT±         completed     evidence +
11:30  closing check     +INTERNAL    VEH− WH+          validated     vehicle_checks +closing
(selisih)                +ADJUSTMENT  koreksi           —             investigations +
```

---

## 5. Beda besar vs desain kita (v4) — biar gak ketuker
| konsep kita | jadi apa di tech lead |
|---|---|
| `trip` (1 hari) | TIDAK ada wrapper; diganti opening→closing `vehicle_checks` + `tasks` |
| custody count (driver) | `vehicle_checks` opening — **oleh checker** |
| `event` kita | `movements` (lebih kaya: from→to, type, condition) |
| cargo diitung app | `stock_cache` diitung 🤖 CF — app cuma BACA |
| stok isi/kosong dempet | `condition: full|empty` first-class, 2 baris cache |
| customer = entitas | customer = `stock_locations` (titik stok); outstanding = cache-nya |
| mismatch flow | `investigations` (supervisor) |

---

## 6. ‼️ Pertanyaan kunci sebelum remap widget
1. **Custody count siapa?** Schema bilang `vehicle_checks` by **checker**. Prototype kita driver yg ngitung. → Page custody (P5-P9) masuk **driver app** atau **checker app**?
2. **Driver app nulis apa aja persisnya?** Dugaan: `movements` (DROP/PICKUP) + `tasks` update + `evidence`. Opening/closing check kemungkinan BUKAN driver. Konfirm.
3. **Driver app baca cargo dari `stock_cache`** (location=vehicle) — betul?
4. Movement DROP+PICKUP = 1 submit Budi → 2 movement. Evidence nempel ke movement mana (DROP, PICKUP, atau task)?

Jawab ini → gue bikin doc jembatan: tiap page driver → movement/task/evidence yg ditulis + cache yg dibaca.
