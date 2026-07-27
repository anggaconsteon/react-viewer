# Driver Runtime — Struktur Data Visual (PROVISIONAL)

Dirender mirip Firebase console (key: value) biar gampang kebayang. Data contoh = prototype (Budi, B 1234 XY, Mandiri Tower, gas/galon).

---

## 1. Pohon koleksi (path hierarchy)

```
MobileTable
└── 2034203331549…                         ← tenant (sudah ada)
    └── tables
        └── 9911…  (n: "Driver Runtime")   ← TABEL BARU, khusus fitur driver
            │
            ├── driver        → DRV-001, DRV-002 …          (master, admin seed)
            ├── vehicle       → V-007 …                     (master + state cargo)
            ├── trip          → TRIP-20260611-001 …         (rute 1 hari + gate)
            ├── task          → T-050, T-051, T-052, T-053  (per stop)
            └── event         → {auto}, {auto}, {auto} …    ← SHARED ledger
```
> `event` = satu-satunya yang konsepnya sama dgn ledger yang sudah ada. `driver/vehicle/trip/task` = milik fitur driver, tabel terpisah.

---

## 2. Diagram relasi (siapa nunjuk siapa, lewat VID)

```
         ┌─────────────┐         drives          ┌──────────────┐
         │  driver     │ ───────────────────────▶│  vehicle     │
         │  DRV-001    │  (vv: "V-007")           │  V-007       │
         │  Budi       │                          │  cg[] cargo  │
         └─────┬───────┘                          └──────┬───────┘
               │ owns (dv)                                │ (vv)
               ▼                                          │
         ┌───────────────────────────────┐               │
         │  trip  TRIP-20260611-001       │◀──────────────┘
         │  gs: pending→confirmed         │
         │  cl[] manifest custody         │
         └─────┬─────────────────────────┘
               │ has many (tv)
               ▼
   ┌────────┬────────┬────────┬────────┐
   │ task   │ task   │ task   │ task   │   each: it[] item lines (plan vs aktual)
   │ T-050  │ T-051  │ T-052  │ T-053  │
   └────────┴────────┴────────┴────────┘

   setiap aksi ────────────────▶  event (ledger, append-only)
   tiap dok event denormalisasi:  cv/cn=driver · vv/vp=vehicle · sv/sn=customer · tv=trip
```

---

## 3. Isi tiap dokumen (console-style, terisi data)

### driver/DRV-001   (master — admin seed)
```
vid : "DRV-001"
n   : "Budi Santoso"
ro  : "Driver"
card: "QR-9F3A…"          ← isi QR di kartu fisik (dipakai P2 scan resolve)
ss  : "off"               ← session: off | on | paused
```

### vehicle/V-007   (master + state cargo berjalan)
```
vid : "V-007"
pl  : "B 1234 XY"
st  : "loaded"            ← idle | loaded | on_route | returned
dv  : "DRV-001"           dn : "Budi Santoso"
tv  : "TRIP-20260611-001"
cg  : [                   ← MUATAN SEKARANG — generik N-bucket
        { ic:"gas",   in:"Tabung", bk:[ {k:"isi",v:13}, {k:"kosong",v:0} ] },
        { ic:"galon", in:"Galon",  bk:[ {k:"isi",v:8},  {k:"kosong",v:0} ] }
      ]
```

### trip/TRIP-20260611-001   (rute 1 hari + GATE custody)  ← jantung Home (P4)
```
vid : "TRIP-20260611-001"
d8  : "2026-06-11"
dv  : "DRV-001"           dn : "Budi Santoso"
vv  : "V-007"             vp : "B 1234 XY"
gt  : "custody"           ← jenis gate (generik: bisa briefing/equipment)
gs  : "pending"           ← STATUS GATE: pending | confirmed | confirmed_selisih
lb  : "Anton Pratama"     lt : 1781160000000     ls : "LS-2026-06-11-001"
cl  : [                   ← MANIFEST custody (gudang vs hitung driver)
        { iid:"gas_12",     in:"Gas 12kg",          ity:"returnable", wr:10, dc:null },
        { iid:"gas_3",      in:"Gas 3kg",           ity:"returnable", wr:3,  dc:null },
        { iid:"aqua_galon", in:"Aqua Galon",        ity:"returnable", wr:8,  dc:null },
        { iid:"aqua_600",   in:"Aqua 600ml (Dus)",  ity:"consumable", wr:4,  dc:null }
      ]
tc  : 4                   cc : 0                 st : "active"
```

### task/T-050   (1 stop — plan vs aktual)
```
vid : "T-050"
tv  : "TRIP-20260611-001"
so  : 1                   ← urutan stop
sv  : "STORE-MND"         sn : "Mandiri Tower"
ad  : "Jl. Jend. Sudirman Kav. 54-55"     ds : "0 km · current"
st  : "assigned"          ← assigned | in_execution | completed | failed
tt  : "deliver"           ← deliver | pickup_return
it  : [                   ← baris item: plan(pd/pp) + aktual(ad/ap)
        { iid:"gas_12",     in:"Gas 12kg",   ity:"returnable", pd:4, ad:0, pp:0, ap:0 },
        { iid:"aqua_galon", in:"Aqua Galon", ity:"returnable", pd:2, ad:0, pp:0, ap:0 }
      ]
oc  : null   fr : null    ca : null   cc : false   nt : ""   i : ""   sg : ""
```

### event/{auto}   (SHARED ledger — 1 dok per aksi)
```
r  : 4320
ty : "delivery-submit"                     ← discriminator aksi
t  : 1781163662868
ts : "11 Jun 2026 10:42:10"
cv : "DRV-001"   cn : "Budi Santoso"       ← aktor (driver)
vv : "V-007"     vp : "B 1234 XY"
sv : "STORE-HND" sn : "Honda Bintaro"      ← lokasi/customer
tv : "TRIP-20260611-001"
d  : "Drop di pintu samping"   i : "https://…/foto.jpg"
p  : "driverRuntimeDeliverySubmit"
ev : "T-051 ★ gas_12 d3 p0 ★ gas_3 d3 p3 ★ aqua_600 d4 p0 ★ sig:1"   ← payload mentah DSL
```

---

## 4. Timeline 1 hari — dokumen apa berubah, kapan

```
WAKTU   PAGE              event (append)            STATE berubah
─────   ───────────────   ───────────────────────   ──────────────────────────────────
08:24   P2 Scan           + driver-session-open     driver.ss: off→on
                                                     trip dibuat/diikat (gs=pending)

08:25   P4 Home           —                         (baca: trip.gs=pending → rute 🔒)

08:30   P5/P6 Custody     —                         (hitung dc ditahan di memori)

08:34   P7 Success        + custody-confirm         trip.gs: pending→confirmed
        (semua match)                                trip.cl[].dc = wr
                                                     vehicle.cg seed (isi 13 tabung/8 galon)
        ─ ATAU ─
08:34   P8/P9 Mismatch    + custody-mismatch         trip.gs→confirmed_selisih
        (ada selisih)                                trip.cl[].dc = hitung driver
                                                     vehicle.cg seed dari dc (bukan wr)

08:35   P4 Home           —                         rute KEBUKA, kartu cargo muncul

09:10   P10 Feed          —                         (baca task[] by trip)

09:42   P11 Submit T-051  + delivery-submit          task T-051.st→completed, it[].ad/ap
                                                     vehicle.cg: isi−drop, kosong+pickup
                                                     trip.cc: 0→1

10:30   P11 Fail T-053    + delivery-fail            task T-053.st→failed, fr=customer_closed
                                                     trip.cc: …→+1

11:30   P12 Return        + vehicle-return           vehicle.st→returned
                                                     trip.st→closed, driver.ss→off
        ─ ATAU keluar tengah jalan ─
10:05   S1 Pause          + driver-session-pause      trip.st→paused, driver.ss→paused
                                                     (lanjut device manapun → P2 resume)
```

---

## 5. Pola inti (1 kalimat)
> **Master** (`driver`, `vehicle`) jarang berubah · **operasional** (`trip`, `task`) berubah tiap aksi · **`event`** nyimpen jejak tiap aksi (append-only, shared). Home = baca 1 `trip` + `task`-nya. Tiap tombol aksi = tulis 1 `event` + update 1-2 dok operasional.

## 6. Pertanyaan tech lead
1. `driver` perlu tabel master, atau identitas cukup dari isi QR kartu?
2. Operasional (trip/task/vehicle) = tabel mutable (rekomendasi) atau diturunkan dari `event`?
3. `trip` per-driver/hari atau per-vehicle/hari?
4. Item = count (sekarang) atau serialized per-unit (QR tiap tabung)?
5. Vocab gate: `confirmed_selisih` vs `confirmed_mismatch`?
