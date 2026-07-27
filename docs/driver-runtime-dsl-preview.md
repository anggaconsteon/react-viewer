# Driver Runtime — DSL Preview (addToEvent + updateEventRow di struktur MAP)

Preview gimana tiap aksi nulis ke Firestore pakai 2 primitive keyed:
- **`addToEvent`** = append 1 row ke ledger `event` (append-only, flat keyed, sparse).
- **`updateEventRow`** = merge 1 doc state yg udah ada (`trip`/`task`/`driver`/`vehicle`) — search + sparse keyed, NO prefill.

Pola tiap aksi = **2 tulisan** (mirror attendance): `updateEventRow` (ubah state) **+** `addToEvent` (catat jejak). Beda component di JSON, jalan barengan 1 submit.

> ⚠️ **Status:** preview buat matengin sebelum tech lead. Token `◀N▶`/`◁N▷` & VID placeholder LIKELY-TO-CHANGE.

---

## 0. Legenda token (contoh)
```
◀2|T7|epoch▶                 waktu epoch (system stream)
◀2|T7|Ddd MMM yyyy HH:mm:ss▶ waktu kebaca
◀5▶  driver VID sesi   ◀6▶ driver name   ◀7▶ vehicle VID   ◀8▶ trip VID
◁1▷ ◁2▷ …                    input form (hitungan driver per item)
literal (DRV-001, confirmed) baked
```

---

## 1. Visual data (bentuk MAP)

```
trip/TRIP-20260611-001
├ vid  "TRIP-20260611-001"   gs "pending"   st "active"   tc 4   cc 0
├ dv "DRV-001"  dn "Budi"   vv "V-007"  vp "B 1234 XY"
└ cl  (MAP keyed iid)
   ├ gas_12     { in:"Gas 12kg",   ity:"returnable", o:1, wr:10, dc:null }
   ├ gas_3      { in:"Gas 3kg",    ity:"returnable", o:2, wr:3,  dc:null }
   ├ aqua_galon { in:"Aqua Galon", ity:"returnable", o:3, wr:8,  dc:null }
   └ aqua_600   { in:"Aqua 600",   ity:"consumable", o:4, wr:4,  dc:null }

task/T-050
├ vid "T-050"  tv "TRIP-…001"  so 1  sn "Mandiri Tower"  st "assigned"  tt "deliver"
└ it  (MAP keyed iid)
   ├ gas_12     { in:"Gas 12kg",   o:1, pd:4, ad:0, pp:0, ap:0 }
   └ aqua_galon { in:"Aqua Galon", o:2, pd:2, ad:0, pp:0, ap:0 }
```

Item = sub-map. Alamat field bersarang = **dot-path**: `cl.gas_12.dc`, `it.gas_12.ad`.

---

## 2. updateEventRow — ubah state

Grammar (dari spec): `…//<col>⭘tablevid◼<VID>⭘search◼<key>★<val>[☆<key>★<val>]⭘<key>◼<val>…`

### 2a. Field TOP-LEVEL (flat) → jalan VERBATIM ✅
Contoh: tutup gate jadi confirmed, ubah status task.
```
$<env>/<ws>//trip⭘tablevid◼<TRIP_VID>⭘search◼vid★◀8▶⭘gs◼confirmed
```
```
$<env>/<ws>//task⭘tablevid◼<TASK_VID>⭘search◼vid★T-051⭘st◼completed⭘oc◼full⭘ca◼◀2|T7|epoch▶⭘i◼◁9▷
```
Resolve → `doc.set({ gs:"confirmed" }, merge:true)`. Field lain (cl, dv, …) aman.

### 2b. Field BERSARANG di MAP (cl/it) → butuh dot-path ⚠️
Custody confirm: set `dc` tiap item + gate. Search = trip; body = dot-path per item.
```
$<env>/<ws>//trip⭘tablevid◼<TRIP_VID>⭘search◼vid★◀8▶⭘cl.gas_12.dc◼◁1▷⭘cl.gas_3.dc◼◁2▷⭘cl.aqua_galon.dc◼◁3▷⭘cl.aqua_600.dc◼◁4▷⭘gs◼confirmed
```
Submit (sama qty → confirmed):
```dart
doc.update({ "cl.gas_12.dc":10, "cl.gas_3.dc":3, "cl.aqua_galon.dc":8, "cl.aqua_600.dc":4, "gs":"confirmed" })
```
Beda qty → `gs:"confirmed_selisih"`, `dc` = hitungan driver (mis. `cl.gas_12.dc:9`).

Delivery submit: set `ad`/`ap` tiap item di 1 task.
```
$<env>/<ws>//task⭘tablevid◼<TASK_VID>⭘search◼vid★T-051⭘it.gas_12.ad◼◁1▷⭘it.gas_3.ad◼◁2▷⭘it.gas_3.ap◼◁3▷⭘it.aqua_600.ad◼◁4▷⭘st◼completed⭘oc◼full⭘ca◼◀2|T7|epoch▶
```

> 🔴 **GANJALAN (the one real wrinkle):** spec updateEventRow §5.4 nulis pakai `doc.set(body, merge:true)`. Tapi `set(merge:true)` perlakuin key ber-titik sebagai **nama field literal "cl.gas_12.dc"** (BUKAN path bersarang) → salah. Key dot-path WAJIB lewat `doc.update(...)` (update memperlakukan titik sebagai path). Lihat §4 keputusan.

---

## 3. addToEvent — append jejak (flat keyed, gampang ✅)

Tiap aksi → 1 row baru di `event`. `ev` = payload mentah (delimiter `★` internal, ikut konvensi Event C).

### Custody confirm
```
addToEvent:
driver-event
⭘r◼4320
⭘tablevid◼<EVENT_VID>
⭘ty◼custody-confirm
⭘t◼◀2|T7|epoch▶
⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
⭘cv◼◀5▶⭘cn◼◀6▶
⭘vv◼◀7▶⭘vp◼B 1234 XY
⭘tv◼◀8▶
⭘ev◼gas_12 w10 c10 ★ gas_3 w3 c3 ★ aqua_galon w8 c8 ★ aqua_600 w4 c4
```

### Delivery submit
```
addToEvent:
driver-event
⭘r◼4320
⭘tablevid◼<EVENT_VID>
⭘ty◼delivery-submit
⭘t◼◀2|T7|epoch▶
⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
⭘cv◼◀5▶⭘cn◼◀6▶
⭘vv◼◀7▶⭘vp◼B 1234 XY
⭘sv◼STORE-HND⭘sn◼Honda Bintaro
⭘tv◼◀8▶
⭘d◼◁8▷⭘i◼◁9▷
⭘ev◼T-051 ★ gas_12 d3 p0 ★ gas_3 d3 p3 ★ aqua_600 d4 p0 ★ sig:1
```
Required cuma `r/ty/t/ts`; sisanya sparse — omit = NULL.

---

## 4. Per-aksi: tulisan apa yg nembak (the 2-write pattern)

| Page | Aksi | updateEventRow (state) | addToEvent (ledger) |
|---|---|---|---|
| P2 | scan / buka sesi | `driver` ss=on (search vid★◀5▶) | `driver-session-open` |
| P7 | custody cocok | `trip` cl.*.dc + gs=confirmed | `custody-confirm` |
| P8/9 | custody selisih | `trip` cl.*.dc + gs=confirmed_selisih | `custody-mismatch` |
| P11 | submit anter | `task` it.*.ad/ap + st=completed + oc/ca/i | `delivery-submit` |
| P11 | gagal | `task` st=failed + fr | `delivery-fail` |
| P12 | return | `vehicle` st=returned,dv=null,tv=null ◆ `driver` ss=off ◆ `trip` st=closed | `vehicle-return` |
| S1 | pause | `driver` ss=paused ◆ `trip` st=paused | `driver-session-pause` |

> Multi-update 1 aksi (return/pause) = `updateEventRow` di-chain `◆`.
> `trip.cc` & `trip.tc` & cargo vehicle = **DIHITUNG** (derived) — gak ada update di submit (lihat dictionary §6). Jadi submit cuma sentuh `task`-nya, gak nyentuh `trip`.

---

## 5. Kenapa map COCOK sama keyed DSL
- `addToEvent` emang **keyed by char-code** → ledger gak kena map sama sekali (flat). 100% verbatim.
- `updateEventRow` body **keyed `key◼value`** → top-level map field (gs/st/ss/dc lewat path) pas. Sparse merge = cuma item yg disebut keubah, item lain & field lain aman → **persis alasan lo pilih map** (update/insert 1 item gak ganggu yg lain).
- Insert item baru nanti (galon jenis baru) = tambah pair `⭘cl.solar_5.wr◼20` → key baru kebentuk, gak rewrite.

---

## 4-DECISION — ganjalan dot-path (butuh diputusin sebelum tech lead)

Map bersarang bikin `updateEventRow` harus nulis key ber-titik. 2 jalan:

| Opsi | Apa | Implement | Catatan |
|---|---|---|---|
| **A. `update()` buat dot-key** (rekomen) | updateEventRow §5.4: kalo key ada titik → `doc.update(body)` bukan `set(merge)` | tweak kecil 1 fungsi | doc state SELALU udah ada (trip/task ke-seed) → `update()` aman; spec udah skip kalo 0-match |
| **B. Item jadi SUBCOLLECTION** | `trip/{id}/custody/{iid}` & `task/{id}/items/{iid}` tiap item 1 doc | DSL jalan VERBATIM (body flat `dc◼…`), search `vid★gas_12☆tv★TRIP-…` | +1 read per render; tapi paling "lurus" sama DSL existing |

**Rekomendasi: A.** Map-in-doc tetap (1 read, sesuai pilihan lo), cuma updateEventRow pakai `update()` buat key ber-titik. Perubahan spec 1 baris. B cuma kalo tech lead mau item bener-bener berdiri sendiri (riwayat per-item, N gede).

---

## 6. Sisa pertanyaan tech lead (gabung dari dictionary)
1. Dot-path `update()` (A) atau item subcollection (B)?
2. `trip` scope per-driver/hari atau per-vehicle/hari?
3. Customer & item master embedded (sekarang) atau collection sendiri?
4. Vocab gate: `confirmed_selisih` vs `confirmed_mismatch`?
