# Driver Runtime — Collection & Document yang Dibutuhkan Flow (PROVISIONAL)

Diturunkan dari konstanta mock di prototype (`Driverruntimefull.jsx`: `INITIAL_TASKS`, `PENDING_CUSTODY`, `DRIVER`, `VEHICLE`, `DEVICE_OWNER`). **Tiap konstanta di code = 1 collection berisi dokumen.** Inilah set lengkap yang harus ada supaya demo jalan ujung-ke-ujung.

---

## 0. Pemetaan: konstanta code → collection

```
  CODE (Driverruntimefull.jsx)        FIRESTORE
  ─────────────────────────────       ─────────────────────────
  const DRIVER       = {Budi}    ─┐
  const DEVICE_OWNER = {Andi}    ─┴─▶  driver/   (2 dok)
  const VEHICLE      = {V-007}   ───▶  vehicle/  (1 dok)
  const PENDING_CUSTODY = {...}  ───▶  trip/     (1 dok)  ← manifest custody jadi cl[]
  const INITIAL_TASKS   = [4]    ───▶  task/     (4 dok)
  (aksi runtime saat dijalankan) ───▶  event/    (0 → tumbuh)
```

---

## 1. Set lengkap (apa yang ada SEBELUM Budi mulai = seed)

```
tables/{driverTableVID}/
│
├── driver/                          2 dokumen
│     ├── DRV-001   Budi Santoso     ← driver yg ditugaskan hari ini
│     └── DRV-002   Andi Wijaya      ← pemilik HP (skenario "HP dipinjam")
│
├── vehicle/                         1 dokumen
│     └── V-007     B 1234 XY
│
├── trip/                            1 dokumen
│     └── TRIP-20260611-001          gs:pending · cl[4 item] · 4 stop
│
├── task/                            4 dokumen
│     ├── T-050     Mandiri Tower        stop1 · deliver
│     ├── T-051     Honda Bintaro        stop2 · deliver (ada pickup)
│     ├── T-052     BCA Cabang Bintaro   stop3 · deliver
│     └── T-053     Toko Sumber Rejeki   stop4 · pickup_return
│
└── event/                           0 dokumen (kosong; diisi saat flow jalan)
```
> 8 dokumen seed (2 driver + 1 vehicle + 1 trip + 4 task). `event` mulai kosong.

---

## 2. Isi tiap dokumen seed (console-style)

### driver/DRV-001  &  driver/DRV-002
```
DRV-001 → { vid:"DRV-001", n:"Budi Santoso", ro:"Driver", card:"QR-9F3A…", ss:"off" }
DRV-002 → { vid:"DRV-002", n:"Andi Wijaya",  ro:"Driver", card:"QR-2B7C…", ss:"on"  }
```

### vehicle/V-007
```
{ vid:"V-007", pl:"B 1234 XY", st:"idle", dv:null, tv:null, cg:[] }
```
> `cg` (cargo) kosong dulu — keisi setelah custody confirmed.

### trip/TRIP-20260611-001   (= PENDING_CUSTODY)
```
{ vid:"TRIP-20260611-001", d8:"2026-06-11",
  dv:"DRV-001", dn:"Budi Santoso", vv:"V-007", vp:"B 1234 XY",
  gt:"custody", gs:"pending",
  lb:"Anton Pratama", lt:1781160000000, ls:"LS-2026-06-11-001",
  cl:[ {iid:"gas_12",     in:"Gas 12kg",         ity:"returnable", wr:10, dc:null},
       {iid:"gas_3",      in:"Gas 3kg",          ity:"returnable", wr:3,  dc:null},
       {iid:"aqua_galon", in:"Aqua Galon",       ity:"returnable", wr:8,  dc:null},
       {iid:"aqua_600",   in:"Aqua 600ml (Dus)", ity:"consumable", wr:4,  dc:null} ],
  tc:4, cc:0, st:"active" }
```

### task/T-050 … T-053   (= INITIAL_TASKS, persis)
```
T-050 → { vid:"T-050", tv:"TRIP-…001", so:1, sn:"Mandiri Tower",
          ad:"Jl. Jend. Sudirman Kav. 54-55", ds:"0 km · current",
          st:"assigned", tt:"deliver",
          it:[ {iid:"gas_12",     in:"Gas 12kg",   ity:"returnable", pd:4, ad:0, pp:0, ap:0},
               {iid:"aqua_galon", in:"Aqua Galon", ity:"returnable", pd:2, ad:0, pp:0, ap:0} ] }

T-051 → { vid:"T-051", tv:"TRIP-…001", so:2, sn:"Honda Bintaro",
          ad:"Jl. Bintaro Utama 23, Tangerang", ds:"8.4 km",
          st:"assigned", tt:"deliver",
          it:[ {iid:"gas_12",   in:"Gas 12kg",          ity:"returnable", pd:3, ad:0, pp:3, ap:0},
               {iid:"gas_3",    in:"Gas 3kg",           ity:"returnable", pd:3, ad:0, pp:3, ap:0},
               {iid:"aqua_600", in:"Aqua 600ml (Dus)",  ity:"consumable", pd:4, ad:0, pp:0, ap:0} ] }

T-052 → { vid:"T-052", tv:"TRIP-…001", so:3, sn:"BCA Cabang Bintaro",
          ad:"Jl. Bintaro Sektor 7, Tangerang", ds:"1.2 km",
          st:"assigned", tt:"deliver",
          it:[ {iid:"gas_12",     in:"Gas 12kg",   ity:"returnable", pd:3, ad:0, pp:0, ap:0},
               {iid:"aqua_galon", in:"Aqua Galon", ity:"returnable", pd:6, ad:0, pp:0, ap:0} ] }

T-053 → { vid:"T-053", tv:"TRIP-…001", so:4, sn:"Toko Sumber Rejeki",
          ad:"Jl. Bintaro Permai Blok C2", ds:"3.8 km",
          st:"assigned", tt:"pickup_return",
          it:[ {iid:"gas_3", in:"Gas 3kg", ity:"returnable", pd:0, ad:0, pp:3, ap:0} ] }
```

---

## 3. Tiap PAGE butuh dokumen yang mana

```
PAGE                 BUTUH DOKUMEN
──────────────────   ────────────────────────────────────────────────
P1 DeviceOwnerGate   driver/DRV-002 (Andi, pemilik HP)
P2 ScanLogin         driver/DRV-001 (resolve QR)  +  trip (cek paused?)
P4 Home              trip/TRIP-…001  +  task/T-050..053  +  vehicle/V-007
P5 CustodyNotif      trip.cl[]  +  task/T-050..053 (manifest per stop)
P6 CustodyCount      trip.cl[].wr  (dibuka setelah hitung)
P7 Success           → tulis event + ubah trip + vehicle
P8/P9 Mismatch       trip.cl[]  → tulis event + ubah trip + vehicle
P10 Feed             task/T-050..053  (filter by state)
P11 Workspace        task/T-051 (1 stop)  → tulis event + task + vehicle
P12 Return           vehicle/V-007.cg  → tulis event + vehicle + trip
S1 Pause             trip (sisa task)  → tulis event + trip + driver
```

---

## 4. event/ tumbuh saat flow jalan (mulai 0)

```
                                                event/ isi
mulai (seed)                              ──▶   (kosong)
P2 scan          + driver-session-open    ──▶   1 dok
P7 custody ok    + custody-confirm        ──▶   2 dok
P11 submit T-051 + delivery-submit        ──▶   3 dok
P11 submit T-052 + delivery-submit        ──▶   4 dok
P11 fail  T-053  + delivery-fail          ──▶   5 dok
P12 return       + vehicle-return         ──▶   6 dok
```
Tiap dok event = denormalisasi `cv/cn` (driver) · `vv/vp` (vehicle) · `sv/sn` (customer) · `tv` (trip) · `ev` (payload mentah).

---

## 5. Ringkas
- **5 collection:** `driver`, `vehicle`, `trip`, `task`, `event`.
- **Demo butuh 8 dok seed** + `event` tumbuh ~6 dok selama 1 trip.
- **Master** (`driver`,`vehicle`) = jarang berubah · **operasional** (`trip`,`task`) = berubah tiap aksi · **`event`** = append-only, shared.
- `trip` = jantung Home; 1 trip punya banyak `task`; tiap aksi nempel 1 `event`.

## Pertanyaan tech lead
1. `driver` tabel master, atau identitas dari isi QR kartu saja?
2. Operasional (trip/task/vehicle) = mutable (rekomendasi) atau event-sourced?
3. `trip` per-driver/hari atau per-vehicle/hari?
4. Item = count (sekarang) atau serialized per-unit (QR tiap tabung)?
5. Customer (`sn`/`ad`) embedded di task (sekarang), atau perlu collection `customer` sendiri?
