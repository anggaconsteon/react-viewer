# Driver Runtime — Flow Penuh (Bahasa Bayi)

Schema = `docs/firebase-schema-galon.md` + revisi `docs/driver-runtime-techlead-schema-deltas.md`.
**Tanpa fase** — semua sekaligus: custody (`vehicle_check`) + anter (`movements`+`tasks`) + bukti (`evidence`) + rekonsiliasi + `investigation`.
Cerita: driver **Budi** (`vid` di `workforce`), mobil **VEH-B1234XY**, item **galon**, customer **Honda Bintaro** (`CLT-honda`), gudang **WH-bintaro**.

---

## BAGIAN 0 — Di mana semua data tinggal (struktur LIVE)

Semua nested di bawah 1 container tenant:
```
MobileTable / {db} / tables / {tableVID}          ← INI = tenant (cth: "Vertika Tekno Lokacipta")
        ├─ workforce      (UDAH ADA) ← orang. Driver = 1 doc di sini. (ganti "users")
        ├─ site           (UDAH ADA) ← lokasi
        ├─ event          (UDAH ADA) ← ledger universal (audit semua aksi)
        └─ (BARU, sibling) ← item · stock_location · task · movement · asset_cache · vehicle_check · evidence · investigation
```
> Tenant = path (`tables/{tableVID}`), jadi **gak ada field `tenant_id`** di doc. (Delta 1)

### `workforce` dipakai ulang buat driver (Delta 9)
Doc `workforce` live udah begini (gak bikin `users` baru, gak ada role/active):
```
tables/{tableVID}/workforce/{doc}
  vid    : 87544551624342          ← id orang (driver dikunci pakai ini)
  search : "vid★87544551624342☆sv★83674161979544"   ← kunci cari (vid AND sv)
  ev     : "0attendance-check-in◆…"  ← payload event terakhir (DSL)
  st     : "on"                     ← status
  p      : vertikaTeknoLokacipta    ← key tenant (denorm)
  ci,et  : <timestamp>
```
Driver = doc workforce, dicari pakai `search` (`vid★…`).

---

## BAGIAN 1 — Aturan Emas: cuma 3 cara nulis tabel

| Cara | Artinya | Tabel | DSL |
|---|---|---|---|
| **1. TAMBAH** (append) | baris BARU, gak pernah diedit | `movement`, `evidence`, `event`, `vehicle_check` | `addToEvent` |
| **2. UBAH** (update sparse) | edit field di baris yg udah ada | `task`, `workforce` | `updateEventRow` (cari by `search`, kirim field berubah doang) |
| **3. ROBOT** | app GAK nulis; Cloud Function isi; app cuma BACA | `asset_cache` | — |

> Mantra: **App nyatet PINDAH. Robot ngitung SISA. Status di-UBAH.**

---

## BAGIAN 2 — Tabel & isinya

### BACA-only buat driver (master, disiapin admin/gudang)
```
workforce/{vid}         vid, search, st, …                     ← driver (reuse)
item/galon              name, category:returnable, conditions:[full,empty], unit:pcs
stock_location/VEH-B1234XY   type:vehicle,  name,  current_driver:vid
stock_location/CLT-honda     type:client,   name:"Honda Bintaro"
stock_location/WH-bintaro    type:warehouse,name
```

### Driver PEGANG (tulis)
```
task/TASK-001           ← 1 stop (admin bikin assigned, driver UBAH completed)
  client_loc:CLT-honda  warehouse:WH-bintaro  vehicle:VEH-B1234XY
  driver:<vid yg scan>  type:delivery  state:assigned
  items:[{item:galon, condition:full, planned:5, actual:0}]
  date:2026-06-12

movement/{auto}         ← TAMBAH tiap galon pindah  (Bagian 3)
vehicle_check/{auto}    ← TAMBAH hitung fisik (opening custody / closing rekon)
evidence/{auto}         ← TAMBAH foto/ttd/gps/note
event/{auto}            ← TAMBAH audit tiap aksi penting
```

### Robot (driver BACA doang)
```
asset_cache/{loc}__{item}__{cond}    qty   ← saldo terkini, robot yg isi
  cth: VEH-B1234XY__galon__full  qty 30
```

---

## BAGIAN 3 — Flow 1 hari Budi (LENGKAP, step by step)

Tiap step: **BACA** (buat ditampilin) + **TULIS** (yg berubah).

### Step 0 · gudang muat mobil (bukan driver — biar ngerti datanya udah ada)
TAMBAH `movement` INTERNAL gudang→mobil galon full 30 → robot isi `asset_cache VEH…full = 30`.

---

### Step 1 · Scan QR (P2)
- **BACA** `workforce` by `search:"vid★<hasil-scan>"` → ketemu Budi.
- **BACA** `task where driver==<vid> && date==today` → tugas hari ini.
- **TULIS** `event` 1 dok `ty:"driver-session-open"` (audit). *(Login = auth; event cuma jejak.)*

### Step 2 · Home (P4)
- **BACA** `asset_cache where location==VEH-B1234XY` → muatan (galon isi 30).
- **BACA** `task where driver==<vid>` → daftar stop.
- **BACA** `vehicle_check where vehicle==VEH-B1234XY && date==today && type==opening` → udah custody belum?
- **TULIS** — gak ada (read-only). Rute kekunci 🔒 sampai custody confirmed.

### Step 3 · CUSTODY = `vehicle_check` OPENING (P5–P9) — DRIVER yg ngitung
Budi hitung fisik muatan (angka gudang disembunyiin, hitung jujur, baru reveal).
- **BACA** `asset_cache` mobil (buat dibandingin SETELAH reveal).
- **TULIS** `vehicle_check/{auto}`:
  ```
  vehicle:VEH-B1234XY  warehouse:WH-bintaro  checker:<vid Budi>   ← driver yg isi (Delta 7)
  type:opening   date:2026-06-12
  items_physical:[{item:galon, condition:full, qty_physical:30}]
  reconciliation_state: matched           (kalau cocok sama yg dimuat)
  occurred_at:<jam HP>
  ```
- **TULIS** `event` `ty:"custody-confirm"` (audit).
- **TULIS** `evidence` (foto muatan, opsional).
- Kalau **selisih** pas opening → `reconciliation_state:discrepancy_detected` + `discrepancies:[…]`, dan buka `investigation` (lihat Step 7). Rute tetap kebuka pakai angka aktual.
→ gate confirmed, rute kebuka.

### Step 4 · Pilih stop (P10 Feed)
- **BACA** `task where driver==<vid>` dikelompokin by `state` (assigned/completed/failed).
- **TULIS** — gak ada.

### Step 5 · ANTER (P11) — INTI
Budi di Honda: kasih 5 isi, ambil 5 kosong, foto, ttd, GPS. 1 tombol "Selesai" → **4 macam tulisan:**

**(a) TAMBAH `movement` DROP** (isi keluar):
```
from:VEH-B1234XY  to:CLT-honda  item:galon  condition:full  type:DROP  qty:5
driver:<vid yg scan>  task:TASK-001  occurred_at:<jam>  emitter_runtime:DRIVER
```
**(b) TAMBAH `movement` PICKUP** (kosong masuk):
```
from:CLT-honda  to:VEH-B1234XY  item:galon  condition:empty  type:PICKUP  qty:5
driver:<vid yg scan>  task:TASK-001  occurred_at:<jam>  emitter_runtime:DRIVER
```
**(c) UBAH `task/TASK-001`** (sparse — cuma field berubah):
```
items.actual:5   state:completed   completed_at:<jam>
```
**(d) TAMBAH `evidence` ×3:**
```
type:photo      storage_path:…   movement:<drop>  task:TASK-001
type:signature  storage_path:…                    task:TASK-001
type:gps        location:<geo>                     task:TASK-001
```
**ROBOT** baca (a)+(b) → UBAH `asset_cache`:
```
VEH-B1234XY__galon__full   30→25
VEH-B1234XY__galon__empty   0→5
CLT-honda__galon__full      0→5    (outstanding Honda)
```
**Kalau "Lapor Gagal":** UBAH `task` `state:failed` + alasan; TAMBAH `evidence` (foto alasan); GAK ada movement (barang gak pindah).

> Tiap stop = pola SAMA: movement(s) → task completed → evidence → robot benerin cache.

### Step 6 · RETURN = `vehicle_check` CLOSING (P12) — rekonsiliasi
Budi balik gudang, hitung fisik SISA.
- **BACA** `asset_cache` mobil (sisa: isi 25, kosong 5).
- **TULIS** `vehicle_check/{auto}`:
  ```
  vehicle:VEH-B1234XY  warehouse:WH-bintaro  checker:<vid Budi>
  type:closing  date:2026-06-12
  items_physical:[{galon,full,25},{galon,empty,5}]    ← hitung TANGAN Budi
  items_expected:[{galon,full,25},{galon,empty,5}]    ← DIITUNG SERVER dari movement
  reconciliation_state: matched | discrepancy_detected
  discrepancies:[{galon,full,expected:25,actual:24,delta:-1}]   ← kalau beda
  occurred_at:<jam>
  ```
  > `items_expected` **selalu diitung server** dari riwayat `movement`. Driver cuma submit fisik.
- **TULIS** `movement` INTERNAL mobil→gudang (sisa balik) → robot: cache gudang naik, mobil→0.
- **TULIS** `event` `ty:"vehicle-return"` + `evidence` (opsional).
- Cocok → `task`/sesi → closed.

### Step 7 · Kalau SELISIH → `investigation` (supervisor)
- **TULIS** `investigation/{auto}`:
  ```
  source_check:<check_id closing>   state:pending_review   opened_at:<jam>
  ```
- Supervisor review → set `resolution_type`: `clean | with_adjustment | damage_confirmed | loss_confirmed`.
- Kalau beneran ilang → supervisor TAMBAH `movement` `type:ADJUSTMENT/LOST` → robot koreksi cache.
- Subcollection `investigation/{id}/events` buat jejak.
> **Selisih ≠ ilang.** Gak loncat ke "loss" tanpa supervisor.

### S1 · Keluar tengah jalan (Pause)
- **BACA** sisa `task` assigned.
- **TULIS** `event` `ty:"driver-session-pause"`; `workforce` `st:"paused"` (UBAH sparse by `search`).
→ balik scan, varian resume.

---

## BAGIAN 4 — Cara pakai 3 tabel yg sering bikin bingung

**`evidence` (bukti):** collection sendiri. Tiap foto/ttd/gps/note = **1 doc TAMBAH**. Nempel ke induknya lewat id: `movement:<id>` / `task:<id>` / `check:<id>` / `investigation:<id>`. Append-only (gak diedit). 1 submit anter bisa lahirin 3 evidence (photo+signature+gps).

**`vehicle_check` (cek mobil):** **2 doc per hari** —
- `opening` (berangkat) = **custody**, driver hitung muatan awal.
- `closing` (pulang) = **rekonsiliasi**, driver hitung sisa; server hitung `items_expected`; beda → `discrepancies` → `investigation`.
Append-only. Driver isi `items_physical` doang; `items_expected` server.

**`asset_cache` (saldo):** app **GAK nulis**. Robot baca tiap `movement` masuk → tambah di `to_location`, kurang di `from_location`. App cuma BACA (muatan mobil, outstanding customer). Jangan pernah kosong — tampilin stale, jangan nol.

---

## Ringkas: tabel disentuh per page
| Page | workforce | task | movement | vehicle_check | evidence | event | asset_cache |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| P2 Scan | R | R | — | — | — | + | — |
| P4 Home | R | R | — | R | — | — | R |
| **P5–9 Custody** | — | — | — | **+ opening** | + | + | R |
| P10 Feed | — | R | — | — | — | — | — |
| **P11 Anter** | — | **U** | **+** | — | **+** | + | R(after) |
| **P12 Return** | — | U | **+** | **+ closing** | + | + | R |
| (selisih) | — | — | (+ADJ by SPV) | — | — | + | koreksi |
| S1 Pause | U | — | — | — | — | + | — |

R=baca · U=ubah(sparse) · +=tambah baris · asset_cache selalu robot.

---

## Putusan integrasi ✅ FIX
1. `stock_location` = **collection terpisah sendiri** (bukan reuse `site`).
2. `movement` = **collection terpisah sendiri** (bukan numpang `event`). `event` tetep ledger audit; `movement` ledger stok; robot baca `movement` → `asset_cache`.

Sibling final di `tables/{tableVID}/`: `workforce`·`site`·`event` (ada) + `item`·`stock_location`·`task`·`movement`·`vehicle_check`·`evidence`·`investigation`·`asset_cache` (baru).
