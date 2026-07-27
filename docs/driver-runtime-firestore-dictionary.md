# Driver Runtime — Firestore Data Dictionary (PROVISIONAL v2)

Struktur final buat dev. Hasil keputusan:
1. **Field code pendek + dictionary ini wajib nemenin** (kode hemat, dictionary jadi peta)
2. **`vehicle.cg` dibuang → cargo DIHITUNG** (derived, anti-melenceng)
3. **`cl`/`it` array → MAP keyed by item-id** (update qty & insert item jadi gampang)

Path: `MobileTable/{tenantVID}/tables/{driverTableVID}/{collection}/{docId}`

5 collection: `driver` · `vehicle` · `trip` · `task` · `event`

---

## Aturan baku (baca dulu)
- **Map keyed by item-id** dipakai buat `trip.cl` & `task.it`. Update 1 item = `update(doc, {'cl.gas_12.dc': 9})`. Insert item baru = `update(doc, {'cl.solar_5': {...}})`. JANGAN balik ke array.
- **`o` (order)** ada di tiap item map → buat urutan tampil (map tidak terurut). Sort client-side by `o`.
- **`vehicle` tidak menyimpan muatan.** Cargo dihitung dari `trip.cl` − Σ`task.it`. Lihat §6.
- **`event` append-only.** Tidak pernah di-update/hapus. Field tetap pendek (ikut ledger lama).
- **`stop` nambah = tambah dokumen `task`** (bukan array di trip). Trip bisa tumbuh tanpa rewrite.

---

## 1. `driver` — master orang (jarang berubah)

| code | type | arti |
|---|---|---|
| `vid` | string | ID driver, mis. `"DRV-001"` |
| `n` | string | nama |
| `ro` | string | role, `"Driver"` |
| `card` | string | isi QR kartu fisik; dipakai P2 resolve siapa yg scan |
| `ss` | string | session state: `off` \| `on` \| `paused` |

**Contoh**
```
driver/DRV-001 → { vid:"DRV-001", n:"Budi Santoso", ro:"Driver", card:"QR-9F3A2B", ss:"off" }
driver/DRV-002 → { vid:"DRV-002", n:"Andi Wijaya",  ro:"Driver", card:"QR-2B7C11", ss:"on"  }
```

**Tulis/update**
| aksi | page | perubahan |
|---|---|---|
| seed admin | — | buat dok (master) |
| buka sesi (scan) | P2 | `ss: off→on` |
| pause | S1 | `ss: on→paused` |
| resume (scan lagi) | P2 | `ss: paused→on` |
| return | P12 | `ss: →off` |

---

## 2. `vehicle` — master mobil (TANPA muatan; cargo dihitung)

| code | type | arti |
|---|---|---|
| `vid` | string | ID mobil, `"V-007"` |
| `pl` | string | plat |
| `st` | string | `idle` \| `loaded` \| `on_route` \| `returned` |
| `dv` | string\|null | driver VID yg bawa skrg |
| `tv` | string\|null | trip VID yg lagi jalan |

> ❌ TIDAK ADA `cg`. Muatan dihitung on-the-fly (lihat §6).

**Contoh**
```
vehicle/V-007 → { vid:"V-007", pl:"B 1234 XY", st:"idle", dv:null, tv:null }
```

**Tulis/update**
| aksi | page | perubahan |
|---|---|---|
| seed admin | — | buat dok (master) |
| custody beres | P7/P8/P9 | `st: idle→loaded`, ikat `dv`+`tv` |
| return | P12 | `st: →returned`, lepas `dv`+`tv` |

---

## 3. `trip` — surat tugas 1 hari (akar / jantung Home)

| code | type | arti |
|---|---|---|
| `vid` | string | `"TRIP-20260611-001"` |
| `d8` | string | tanggal kerja `"2026-06-11"` |
| `dv` / `dn` | string | driver VID + nama |
| `vv` / `vp` | string | vehicle VID + plat |
| `gt` | string | jenis gerbang, `"custody"` (generik: bisa `briefing`/`equipment`) |
| `gs` | string | **status gerbang**: `pending` \| `confirmed` \| `confirmed_selisih` |
| `lb` / `lt` / `ls` | str/num/str | pemberi muatan / waktu / no surat |
| `tc` | number | total task |
| `cc` | number | task selesai |
| `st` | string | `active` \| `paused` \| `closed` |
| `cl` | **map** | manifest custody, keyed by item-id (lihat di bawah) |

**`cl` — manifest custody (MAP keyed by iid)**
| sub-field | type | arti |
|---|---|---|
| `in` | string | nama item, `"Gas 12kg"` |
| `ity` | string | `returnable` (tukar kosong) \| `consumable` (habis pakai) |
| `o` | number | urutan tampil |
| `wr` | number | **w**arehouse **r**ecord — jumlah versi gudang |
| `dc` | number\|null | **d**river **c**ount — hasil hitung driver (null = belum dihitung) |

**Contoh**
```
trip/TRIP-20260611-001 → {
  vid:"TRIP-20260611-001", d8:"2026-06-11",
  dv:"DRV-001", dn:"Budi Santoso", vv:"V-007", vp:"B 1234 XY",
  gt:"custody", gs:"pending",
  lb:"Anton Pratama", lt:1781160000000, ls:"LS-2026-06-11-001",
  tc:4, cc:0, st:"active",
  cl:{
    gas_12:     { in:"Gas 12kg",          ity:"returnable", o:1, wr:10, dc:null },
    gas_3:      { in:"Gas 3kg",           ity:"returnable", o:2, wr:3,  dc:null },
    aqua_galon: { in:"Aqua Galon",        ity:"returnable", o:3, wr:8,  dc:null },
    aqua_600:   { in:"Aqua 600ml (Dus)",  ity:"consumable", o:4, wr:4,  dc:null }
  }
}
```

**Tulis/update**
| aksi | page | perubahan |
|---|---|---|
| trip dibuat/diikat | P2 | buat/ikat dok, `gs: pending` |
| custody cocok | P7 | `gs: →confirmed`, set tiap `cl.{iid}.dc = wr` |
| custody selisih | P8/P9 | `gs: →confirmed_selisih`, set tiap `cl.{iid}.dc = hitung driver` |
| stop kelar | P11 | `cc: +1` |
| pause | S1 | `st: →paused` |
| return | P12 | `st: →closed` |
| tambah item custody (nanti) | — | `update(trip, {'cl.solar_5': {...}})` |

**Update qty 1 item (custody selisih):**
```
update(trip, { 'cl.gas_12.dc': 9, 'cl.gas_3.dc': 3, 'cl.aqua_galon.dc': 8, 'cl.aqua_600.dc': 4, gs:'confirmed_selisih' })
```

---

## 4. `task` — 1 stop per dokumen (rencana vs aktual)

| code | type | arti |
|---|---|---|
| `vid` | string | `"T-050"` |
| `tv` | string | trip induk |
| `so` | number | urutan stop |
| `sv` / `sn` | string | customer VID + nama |
| `ad` | string | alamat |
| `ds` | string | jarak, `"8.4 km"` |
| `st` | string | `assigned` \| `in_execution` \| `completed` \| `failed` |
| `tt` | string | `deliver` \| `pickup_return` |
| `oc` | string\|null | outcome: `full` \| `partial` \| `extra` \| null |
| `fr` | string | alasan gagal (kalo `st=failed`) |
| `ca` | number\|null | waktu kelar (epoch) |
| `nt` | string | catatan |
| `i` | string | URL foto bukti |
| `sg` | string | URL tanda tangan |
| `it` | **map** | baris item, keyed by item-id (lihat di bawah) |

> ⚠️ `ad` muncul 2x beda konteks: di **task** = alamat (string). Di **item `it`** = actual drop (number). Beda level, gak tabrakan.

**`it` — baris item (MAP keyed by iid)**
| sub-field | type | arti |
|---|---|---|
| `in` | string | nama item |
| `ity` | string | `returnable` \| `consumable` |
| `o` | number | urutan tampil |
| `pd` | number | **p**lan **d**rop — rencana anter |
| `ad` | number | **a**ctual **d**rop — beneran keanter |
| `pp` | number | **p**lan **p**ickup — rencana ambil kosong |
| `ap` | number | **a**ctual **p**ickup — beneran keambil |

**Contoh**
```
task/T-050 → {
  vid:"T-050", tv:"TRIP-20260611-001", so:1,
  sv:"STORE-MND", sn:"Mandiri Tower",
  ad:"Jl. Jend. Sudirman Kav. 54-55", ds:"0 km · current",
  st:"assigned", tt:"deliver", oc:null, fr:"", ca:null, nt:"", i:"", sg:"",
  it:{
    gas_12:     { in:"Gas 12kg",   ity:"returnable", o:1, pd:4, ad:0, pp:0, ap:0 },
    aqua_galon: { in:"Aqua Galon", ity:"returnable", o:2, pd:2, ad:0, pp:0, ap:0 }
  }
}
```

**Tulis/update**
| aksi | page | perubahan |
|---|---|---|
| seed admin | — | buat dok per stop |
| baca feed | P10 | read-only (filter by `st`) |
| mulai kerja | P11 | `st: assigned→in_execution` |
| submit anter | P11 | `st: →completed`, set `it.{iid}.ad/ap`, `oc`, `nt/i/sg`, `ca` |
| gagal | P11 | `st: →failed`, `fr` |
| tambah stop (trip tumbuh) | — | buat dok task baru (bukan array) |

**Update qty saat submit:**
```
update(task, { 'it.gas_12.ad': 4, 'it.aqua_galon.ad': 2, st:'completed', oc:'full', ca:<epoch>, i:'<foto>' })
```

---

## 5. `event` — ledger (append-only, SHARED, kode tetap pendek)

| code | type | arti |
|---|---|---|
| `r` | number | row/seq |
| `ty` | string | **discriminator aksi** (lihat tabel bawah) |
| `t` / `ts` | num/str | epoch / string kebaca |
| `cv` / `cn` | string | aktor: driver VID + nama |
| `vv` / `vp` | string | vehicle VID + plat |
| `sv` / `sn` | string | lokasi/customer VID + nama |
| `tv` | string | trip VID |
| `d` | string | catatan |
| `i` | string | URL foto |
| `p` | string | proxy token |
| `ev` | string | payload mentah DSL |

**Contoh**
```
event/{auto} → {
  r:4320, ty:"delivery-submit", t:1781163662868, ts:"11 Jun 2026 10:42",
  cv:"DRV-001", cn:"Budi Santoso", vv:"V-007", vp:"B 1234 XY",
  sv:"STORE-HND", sn:"Honda Bintaro", tv:"TRIP-20260611-001",
  d:"Drop pintu samping", i:"https://.../foto.jpg",
  p:"driverRuntimeDeliverySubmit",
  ev:"T-051 ★ gas_12 d3 p0 ★ gas_3 d3 p3 ★ aqua_600 d4 p0 ★ sig:1"
}
```

**Tulis (APPEND saja — 1 dok per aksi, NEVER update)**
| `ty` | page |
|---|---|
| `driver-session-open` | P2 scan |
| `custody-confirm` | P7 |
| `custody-mismatch` | P8/P9 |
| `delivery-submit` | P11 |
| `delivery-fail` | P11 |
| `vehicle-return` | P12 |
| `driver-session-pause` | S1 |

---

## 6. Cargo dihitung (vehicle TANPA simpan muatan)

```
isi(item)    = trip.cl[item].dc  −  Σ_alltask task.it[item].ad     (dimuat − total dianter)
kosong(item) = Σ_alltask task.it[item].ap                           (total kosong diambil balik)
```
- Home (P4) udah baca semua `task` → hitung ini murah, gak ada read tambahan.
- Anti-melenceng: gak ada angka muatan tersimpan yg bisa beda dari kenyataan.
- `event` ledger tetap jejak audit tiap perubahan.

**Contoh hitung** (setelah T-050 submit 4 Gas 12kg, T-051 submit 3 Gas 12kg):
```
isi(gas_12) = dc(10) − [T050.ad 4 + T051.ad 3] = 3 tabung Gas 12kg sisa
```

---

## 7. Matriks collection × page

```
                P1  P2  P4  P5/6 P7  P8/9 P10 P11 P12 S1
driver           R  U    R    -   -   -    -   -   U   U
vehicle          -  -    R    -   U   U    -   R   U   -
trip             -  TU   R    R   U   U    R   U   U   U
task             -  -    R    R   -   -    R   U   -   R
event            -  T    -    -   T   T    -   T   T   T
```
T=tulis baru · U=update · R=baca · −=tak sentuh

---

## 8. Pertanyaan tech lead (sisa)
1. `trip` di-scope per-driver/hari atau per-vehicle/hari?
2. Customer (`sv`/`sn`/`ad`) embedded di `task` (sekarang) atau perlu collection `customer` sendiri?
3. `driver.card` (isi QR) unik & cukup buat resolve, atau perlu index terpisah?
4. Item master (`gas_12`, `aqua_galon`, ...) perlu collection `item` sendiri buat nama/ity, atau cukup embedded di `cl`/`it`?
5. Vocab gerbang: `confirmed_selisih` vs `confirmed_mismatch` — pilih mana?
