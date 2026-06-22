# Driver Runtime — Firestore Seed + Trigger (FLAT + NORMALIZED, v4 FINAL-provisional)

**Flat + ternormalisasi.** Tiap item = doc sendiri (bukan array/map, karena `updateEventRow` gak support map). **Nama dipisah dari id** — operasional table simpan REF (id) doang, nama diambil dari master table lewat lookup (AND search). Cuma `event` (ledger snapshot) yg denorm id+nama.

Path: `MobileTable/{tenantVID}/tables/{tableVID}/{collection}/{docId}`

**9 collection driver** + **2 hook gudang (separate-feature):** master → `driver` `vehicle` `customer` `item` · operasional → `trip` `task` `custodyItem` `taskItem` · ledger → `event` · 🔶 gudang → `warehouse` `stock` (fitur lain)

> Supersede v2/v3. Doc ini sumber tunggal.

---

## A. Key convention (hasil revisi user)
**Tiap entity = 1 id key, dipakai jadi primary di table-nya + FK di table lain.** Key unik global.

| entity | id key | catatan |
|---|---|---|
| driver (orang) | `vid` | reserved buat id orang — JANGAN diubah |
| vehicle | `vv` | |
| trip | `tp` | (bukan `tv` — `tv`=tenant di ledger) |
| customer | `sv` | customer = site/store; pakai `sv` (site vid, sesuai ledger) |
| item | `iid` | kode tipe item |
| task | `tk` | |
| custodyItem | `cu` | |
| taskItem | `ti` | |

**Tabrakan key yg dibenerin (efek "key harus unik"):**
- `card` → **`ca`** (driver). Konsekuensi: task completed-at `ca` → **`ce`**.
- task alamat `ad` bentrok taskItem actual-drop `ad` → alamat pindah ke `customer.al`; `ad`=actual-drop saja.

**Doc ID = REQ-style generated** (`TRP-20260611-001`), BUKAN composite. Search nemu lewat FK (`tp★…☆iid★…`) — pasangan FK unik di data → 1 match.

---

# MASTER (admin seed, jarang/tak berubah saat runtime)

## 1. `driver` — orang

| key | type | arti |
|---|---|---|
| vid | string | id driver |
| n | string | nama |
| ro | string | role |
| ca | string | isi QR kartu fisik (resolve scan) ← was `card` |
| ss | string | session `off`/`on`/`paused` |

```
driver/DRV-001 → { vid:"DRV-001", n:"Budi Santoso", ro:"Driver", ca:"QR-9F3A2B", ss:"off" }
driver/DRV-002 → { vid:"DRV-002", n:"Andi Wijaya",  ro:"Driver", ca:"QR-2B7C11", ss:"on"  }
```
**Trigger:** seed admin · **P2** ss→on · **S1** →paused · **P2** resume→on · **P12** →off

## 2. `vehicle` — mobil

| key | type | arti |
|---|---|---|
| vv | string | id mobil |
| pl | string | plat |
| st | string | `idle`/`loaded`/`on_route`/`returned` |
| vid | string\|null | FK driver yg bawa |
| tp | string\|null | FK trip aktif |

```
vehicle/V-007 → { vv:"V-007", pl:"B 1234 XY", st:"idle", vid:null, tp:null }
```
**Trigger:** seed admin · **P7/8/9** st→loaded + set vid+tp · **P12** st→returned, vid:null, tp:null

## 3. `customer` — penerima (store/site)

| key | type | arti |
|---|---|---|
| sv | string | id customer (site vid) |
| sn | string | nama |
| al | string | alamat ← pindahan dari task |

```
customer/CST-001 → { sv:"CST-001", sn:"Mandiri Tower",      al:"Jl. Jend. Sudirman Kav. 54-55" }
customer/CST-002 → { sv:"CST-002", sn:"Honda Bintaro",      al:"Jl. Bintaro Utama 23, Tangerang" }
customer/CST-003 → { sv:"CST-003", sn:"BCA Cabang Bintaro", al:"Jl. Bintaro Sektor 7, Tangerang" }
customer/CST-004 → { sv:"CST-004", sn:"Toko Sumber Rejeki", al:"Jl. Bintaro Permai Blok C2" }
```
**Trigger:** seed admin · **P10/P11** read (lookup `sn`/`al` by `sv`). Tak ada tulis runtime.

## 4. `item` — master tipe item (hapus duplikasi nama/tipe)

| key | type | arti |
|---|---|---|
| iid | string | kode item |
| in | string | nama ← was diulang di tiap custodyItem/taskItem |
| ity | string | `returnable`/`consumable` |
| o | number | urutan tampil |

```
item/gas_12     → { iid:"gas_12",     in:"Gas 12kg",         ity:"returnable", o:1 }
item/gas_3      → { iid:"gas_3",      in:"Gas 3kg",          ity:"returnable", o:2 }
item/aqua_galon → { iid:"aqua_galon", in:"Aqua Galon",       ity:"returnable", o:3 }
item/aqua_600   → { iid:"aqua_600",   in:"Aqua 600ml (Dus)", ity:"consumable", o:4 }
```
**Trigger:** seed admin · read di mana pun item ditampilkan (lookup `in`/`ity` by `iid`). Tak ada tulis runtime.

---

# OPERASIONAL (berubah saat runtime)

## 5. `trip` — surat tugas 1 hari (akar/jantung Home)

| key | type | arti |
|---|---|---|
| tp | string | id trip |
| d8 | string | tanggal |
| vid | string | FK driver |
| vv | string | FK vehicle |
| wh | string | FK warehouse (gudang sumber muatan) ← hook ke fitur stock |
| gt | string | jenis gate `custody` |
| gs | string | gate `pending`/`confirmed`/`confirmed_selisih` |
| lb / lt / ls | str/num/str | pemberi muatan / waktu / no surat |
| st | string | `active`/`paused`/`closed` |

> Nama driver/plat TIDAK disimpan di sini → lookup `driver` by `vid`, `vehicle` by `vv`.
> `tc`/`cc` TIDAK disimpan → derived (§D).

```
trip/TRP-20260611-001 → {
  tp:"TRP-20260611-001", d8:"2026-06-11",
  vid:"DRV-001", vv:"V-007", wh:"WH-BSD",
  gt:"custody", gs:"pending",
  lb:"Anton Pratama", lt:1781160000000, ls:"LS-2026-06-11-001",
  st:"active"
}
```
**Trigger:** seed admin (gs:pending) · **P2** ikat ke driver · **P7** gs→confirmed · **P8/9** gs→confirmed_selisih · **S1** st→paused · **P12** st→closed

## 6. `custodyItem` — manifest muatan, 1 doc/item

| key | type | arti |
|---|---|---|
| cu | string | id |
| tp | string | FK trip |
| iid | string | FK item (nama/tipe lookup ke `item`) |
| wr | number | jumlah versi GUDANG |
| dc | number\|null | hitungan DRIVER (null=blm; diisi hanya kalau selisih) |

```
custodyItem/CDY-20260611-001 → { cu:"CDY-20260611-001", tp:"TRP-20260611-001", iid:"gas_12",     wr:10, dc:null }
custodyItem/CDY-20260611-002 → { cu:"CDY-20260611-002", tp:"TRP-20260611-001", iid:"gas_3",      wr:3,  dc:null }
custodyItem/CDY-20260611-003 → { cu:"CDY-20260611-003", tp:"TRP-20260611-001", iid:"aqua_galon", wr:8,  dc:null }
custodyItem/CDY-20260611-004 → { cu:"CDY-20260611-004", tp:"TRP-20260611-001", iid:"aqua_600",   wr:4,  dc:null }
```
**Trigger:** seed admin · **P5/6** read (hitung ditahan di memori) · **P7** cocok → tak nulis dc (loaded=wr) · **P8/9** selisih → set `dc` item beda doang · insert item baru → `addToTable`

## 7. `task` — 1 stop per doc

| key | type | arti |
|---|---|---|
| tk | string | id task |
| tp | string | FK trip |
| so | number | urutan stop |
| sv | string | FK customer (nama/alamat lookup ke `customer`) |
| ds | string | jarak leg |
| st | string | `assigned`/`in_execution`/`completed`/`failed` |
| tt | string | `deliver`/`pickup_return` |
| oc | string\|null | outcome `full`/`partial`/`extra` |
| fr | string | alasan gagal |
| ce | number\|null | completed-at epoch ← was `ca` |
| nt / i / sg | string | catatan / foto / tandatangan |

```
task/TSK-20260611-001 → { tk:"TSK-20260611-001", tp:"TRP-20260611-001", so:1, sv:"CST-001", ds:"0 km · current", st:"assigned", tt:"deliver",       oc:null, fr:"", ce:null, nt:"", i:"", sg:"" }
task/TSK-20260611-002 → { tk:"TSK-20260611-002", tp:"TRP-20260611-001", so:2, sv:"CST-002", ds:"8.4 km",          st:"assigned", tt:"deliver",       oc:null, fr:"", ce:null, nt:"", i:"", sg:"" }
task/TSK-20260611-003 → { tk:"TSK-20260611-003", tp:"TRP-20260611-001", so:3, sv:"CST-003", ds:"1.2 km",          st:"assigned", tt:"deliver",       oc:null, fr:"", ce:null, nt:"", i:"", sg:"" }
task/TSK-20260611-004 → { tk:"TSK-20260611-004", tp:"TRP-20260611-001", so:4, sv:"CST-004", ds:"3.8 km",          st:"assigned", tt:"pickup_return", oc:null, fr:"", ce:null, nt:"", i:"", sg:"" }
```
**Trigger:** seed admin · **P10** read (filter st) · **P11** st→in_execution → completed/failed (+oc/ce/nt/i/sg / fr) · stop nambah → `addToTable`

## 8. `taskItem` — baris item per stop, 1 doc/item

| key | type | arti |
|---|---|---|
| ti | string | id |
| tp | string | FK trip (buat derive cargo) |
| tk | string | FK task |
| iid | string | FK item |
| pd | number | plan drop |
| ad | number | actual drop |
| pp | number | plan pickup |
| ap | number | actual pickup |

```
taskItem/TSI-20260611-001 → { ti:"TSI-20260611-001", tp:"TRP-…001", tk:"TSK-…001", iid:"gas_12",     pd:4, ad:0, pp:0, ap:0 }
taskItem/TSI-20260611-002 → { ti:"TSI-20260611-002", tp:"TRP-…001", tk:"TSK-…001", iid:"aqua_galon", pd:2, ad:0, pp:0, ap:0 }
taskItem/TSI-20260611-003 → { ti:"TSI-20260611-003", tp:"TRP-…001", tk:"TSK-…002", iid:"gas_12",     pd:3, ad:0, pp:3, ap:0 }
taskItem/TSI-20260611-004 → { ti:"TSI-20260611-004", tp:"TRP-…001", tk:"TSK-…002", iid:"gas_3",      pd:3, ad:0, pp:3, ap:0 }
taskItem/TSI-20260611-005 → { ti:"TSI-20260611-005", tp:"TRP-…001", tk:"TSK-…002", iid:"aqua_600",   pd:4, ad:0, pp:0, ap:0 }
taskItem/TSI-20260611-006 → { ti:"TSI-20260611-006", tp:"TRP-…001", tk:"TSK-…003", iid:"gas_12",     pd:3, ad:0, pp:0, ap:0 }
taskItem/TSI-20260611-007 → { ti:"TSI-20260611-007", tp:"TRP-…001", tk:"TSK-…003", iid:"aqua_galon", pd:6, ad:0, pp:0, ap:0 }
taskItem/TSI-20260611-008 → { ti:"TSI-20260611-008", tp:"TRP-…001", tk:"TSK-…004", iid:"gas_3",      pd:0, ad:0, pp:3, ap:0 }
```
**Trigger:** seed admin · **P11** submit → set `ad`/`ap` per item (`update`, 1 stmt/item ◆-chain) · item baru → `addToTable`

---

# WAREHOUSE — 🔶 SEPARATE FEATURE (hook only)

> **App driver TIDAK nulis stock.** Driver cuma REFER warehouse (`trip.wh`). Stock di-update fitur GUDANG/admin yg konsumsi `event` (custody-confirm = OUT, vehicle-return = IN). Ditaruh di sini biar pintu masuknya jelas; bukan scope build driver sekarang.

## 10. `warehouse` — master gudang

| key | type | arti |
|---|---|---|
| wh | string | id gudang |
| n | string | nama |
| loc | string | lokasi |

```
warehouse/WH-BSD → { wh:"WH-BSD", n:"Gudang BSD", loc:"BSD Tech Center" }
```
**Trigger:** seed admin · driver read-only (tampil sumber muatan di P7). Tak ada tulis runtime dari driver.

## 11. `stock` — saldo gudang per item (flat, mirror taskItem)

| key | type | arti |
|---|---|---|
| sk | string | id |
| wh | string | FK warehouse |
| iid | string | FK item |
| isi | number | saldo isi |
| kosong | number | saldo kosong |

```
stock/STK-WHBSD-001 → { sk:"STK-WHBSD-001", wh:"WH-BSD", iid:"gas_12",     isi:120, kosong:30 }
stock/STK-WHBSD-002 → { sk:"STK-WHBSD-002", wh:"WH-BSD", iid:"gas_3",      isi:60,  kosong:15 }
stock/STK-WHBSD-003 → { sk:"STK-WHBSD-003", wh:"WH-BSD", iid:"aqua_galon", isi:200, kosong:40 }
stock/STK-WHBSD-004 → { sk:"STK-WHBSD-004", wh:"WH-BSD", iid:"aqua_600",   isi:80,  kosong:0  }
```
**Trigger (oleh FITUR GUDANG, async dari `event` — BUKAN page driver):**
- konsumsi `custody-confirm` → `isi −= loaded` (barang keluar)
- konsumsi `vehicle-return` → `kosong += empties`, `isi += sisa` (barang balik)
- update flat: `$…//stock⭘search◼wh★WH-BSD☆iid★gas_12⭘isi◼…` (sama primitive, no map)

---

# LEDGER

## 12. `event` — append-only (addToEvent). Denorm id+nama (snapshot audit) — kode ledger lama TETAP.

| key | type | arti |
|---|---|---|
| r | number | retention |
| ty | string | type aksi |
| t / ts | num/str | epoch / kebaca |
| cv / cn | string | driver aktor (vid+nama) — **`cv`, std ledger** |
| vv / vp | string | vehicle (id+plat) |
| sv / sn | string | customer (id+nama) |
| tp | string | FK trip (bukan `tv` — `tv`=tenant) |
| d / i | string | catatan / foto |
| ev | string | payload mentah |

**Seed:** 0. **Trigger (append):** P2 `driver-session-open` · P7 `custody-confirm` · P8/9 `custody-mismatch` · P11 `delivery-submit` / `delivery-fail` · P12 `vehicle-return` · S1 `driver-session-pause`

---

## B. Ringkas seed
```
DRIVER (build sekarang):
  MASTER       driver 2 · vehicle 1 · customer 4 · item 4      = 11
  OPERASIONAL  trip 1 · custodyItem 4 · task 4 · taskItem 8    = 17
  LEDGER       event 0
  ─────────────────────────────────────────────────────────── = 28
🔶 GUDANG (separate-feature, hook):
  warehouse 1 · stock 4                                        = 5
─────────────────────────────────────────────────────────────
TOTAL 33 doc seed  (event tumbuh ~6-7/trip)
```

## C. updateEventRow flat (no map, no titik)
```
custody selisih   $…//custodyItem⭘search◼tp★◀8▶☆iid★gas_12⭘dc◼◁1▷
delivery submit   $…//taskItem⭘search◼tk★TSK-20260611-002☆iid★gas_12⭘ad◼◁1▷
gate              $…//trip⭘search◼tp★◀8▶⭘gs◼confirmed
task status       $…//task⭘search◼tk★TSK-20260611-002⭘st◼completed⭘oc◼full⭘ce◼◀2|T7|epoch▶
```
Lookup nama (rule "AND aja"): `driver⭘search◼vid★DRV-001` → ambil `n`; `customer⭘search◼sv★CST-001` → `sn`/`al`; `item⭘search◼iid★gas_12` → `in`/`ity`.

## D. Derived (tak disimpan)
```
trip.tc           = count(task where tp==TRIP)
trip.cc           = count(task where tp==TRIP and st=="completed")
cargo.isi(iid)    = loaded(iid) − Σ taskItem(tp==TRIP, iid).ad
cargo.kosong(iid) = Σ taskItem(tp==TRIP, iid).ap
   loaded(iid)    = custodyItem(iid).dc bila gs=confirmed_selisih, else custodyItem(iid).wr
```

## E. Matriks collection × page
```
                P1  P2  P4  P5/6 P7  P8/9 P10 P11 P12 S1
driver           R  U    R    -   -   -    -   -   U   U
vehicle          -  -    R    -   U   U    -   R   U   -
customer         -  -    -    -   -   -    R   R   -   -
item             -  -    R    R   -   -    R   R   -   -
trip             -  U    R    R   U   U    R   R   U   U
custodyItem      -  -    R    R   -   U    -   R   R   -
task             -  -    R    R   -   -    R   U   R   R
taskItem         -  -    R    R   -   -    R   U   R   -
event            -  T    -    -   T   T    -   T   T   T
🔶 warehouse     -  -    -    -   R   R    -   -   R   -
🔶 stock         -  -    -    -   ⟳   ⟳    -   -   ⟳   -
```
T=append(addToEvent) · U=update(updateEventRow) · R=baca · ⟳=di-update fitur GUDANG async via event (BUKAN page driver) · −=tak sentuh