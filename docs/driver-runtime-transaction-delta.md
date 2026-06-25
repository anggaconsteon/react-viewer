# Driver Runtime — Transaction Delta (jual/beli/tukar + reject task)

**Sumber:** mockup `src/component/web/Driverruntimefull2.jsx`. **Acuan schema:** `docs/driver-runtime-field-dictionary.md` + dict book `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw` (tab `item`/`task`/`movement`).

2 fitur baru → **0 collection baru.** Cuma +8 key + 2 enum + reuse evidence.

---

## 1. Transaksi `transactionType` (per baris `task.it[]`)

Tiap item di stop sekarang punya jenis transaksi. **Per LINE, bukan item master** (item sama bisa beda tx antar task — `gas_12` SALE di T-052, DELIVER di T-051).

| tx | UI | arah | qty | kondisi | movement |
|---|---|---|---|---|---|
| **deliver** (default) | stepper drop+pickup | mobil→customer + balik | `pd`/`pp` → `ad`/`ap` | cdo/cdi | DROP + PICKUP |
| **sale** "Jual" | read-only | mobil→customer **permanen** (ownership pindah) | `ps` → `as` | cdo=full | SALE (`tl=null`) |
| **purchase** "Beli" | read-only | customer→mobil (ownership ke operator, **naik kendaraan**) | `pb` → `ab` | cdi=empty | PURCHASE |
| **refill** "Tukar" | read-only | galon customer ditukar 1-1 (kosong in / isi out, **milik customer**) | `pr` → `ar` | full out + empty in | **DROP full + PICKUP empty** (2 doc, qt=`ar??pr` dua-duanya) |

## 2. Reject task (load rejection) — opening-only

- Tombol **batal per task** di Home, **cuma sebelum Konfirmasi Penerimaan** (saat Rute masih locked).
- Efek: **`task.tst → load_rejected`**. **`vv` DIPERTAHANKAN** (jangan di-null) — Admin perlu tau driver/mobil terakhir (`vv`→`stock_location.dv`). Balik ke pool Admin buat re-assign.
- **Reassign (Admin app, di luar driver):** `vv`→mobil baru + `tst`→`assigned`. Driver ikut berubah (derived dari `vv`.dv; task gak simpan driver langsung). Penolak lama tetep kerekam di evidence.
- "Barang tetap di gudang, nggak naik kendaraan" → **stock gudang TIDAK berkurang**; manifest custody exclude `tst=load_rejected`.
- Alasan (≥10 char) + siapa nolak → **evidence** (`cv`/`cn`=driver penolak, `d`=alasan).
- Karena pre-confirm = pre-load (INTERNAL load belum nembak) → **NO reverse movement**.

---

## Schema Delta

### `item` master — +1 key
| code | field | type | allowed | desc |
|---|---|---|---|---|
| `wt` ✚ | water_type | String\|null | ro \| refill \| null | Jenis air utk SKU refill; null utk non-refill. SSOT di item (bukan line); denorm ke `it[]` opsional |

### `task.it[]` — +7 key (existing `ii in cdo cdi pd pp ad ap`)
| code | field | type | allowed | desc |
|---|---|---|---|---|
| `tx` ✚ | transaction_type | String | deliver \| sale \| purchase \| refill | Jenis transaksi baris ini (default deliver) |
| `ps` ✚ | plan_sale | Number | — | Qty jual rencana (tx=sale) |
| `as` ✚ | actual_sale | Number\|null | — | Qty jual aktual (null sblm submit) |
| `pb` ✚ | plan_buy | Number | — | Qty beli rencana (tx=purchase) |
| `ab` ✚ | actual_buy | Number\|null | — | Qty beli aktual |
| `pr` ✚ | plan_refill | Number | — | Qty tukar rencana (tx=refill) |
| `ar` ✚ | actual_refill | Number\|null | — | Qty tukar aktual |

> `pd`/`pp` tetap **deliver-only** (biar Σ drop/pickup bersih). Tiap tx punya slot qty sendiri.

### `movement.mt` — +2 enum (SALE udah ada)
`GENESIS, DROP, PICKUP, INTERNAL, SALE, **PURCHASE**, **REFILL**, DAMAGE, LOST, ADJUSTMENT`
- **PURCHASE** ✚ — inbound beli (`fl`=customer, `tl`=mobil, `cd`=empty biasanya).
- **REFILL** ✚ — swap 1-1, di-emit sbg **2 doc** (`mt=REFILL` dua-duanya): DROP full (vv→kl, `cd=cdo`) + PICKUP empty (kl→vv, `cd=cdi`), qt=`ar??pr`. Net mobil = full−qt, empty+qt. ⚠️ **REVISI 2026-06-24:** dulu "1 doc, cd diabaikan, CF hardcode 2 bucket" — DIBATALKAN. `OnMovementCreated`/`delta.ToMutations` murni fl/tl + **wajib `cd≠""`** (doc cd-kosong = no-op). Jadi 2 doc cd-konkret = satu-satunya yg jalan sama engine. CF `OnTaskCompleted` yg emit (lihat `movement-emit-dev-spec.md` §0).

### Reject — `task.tst` +1 enum (keep vv)
`tst` += **`load_rejected`** (enum baru, vv DIPERTAHANKAN). Alasan → `evidence` (`ety=notes`, `ept=task`, `erf={tnm}`, `d={reason}`, `cv`/`cn`=penolak). Gak ada `mt`/field baru. Reassign = Admin set `vv`+`tst`.

---

## CF — cargo / asset_cache (behavior, bukan schema)
`deriveCargo` mockup (line 3491) baru handle drop/pickup. Extend:

| aksi | efek mobil (asset_cache) |
|---|---|
| deliver drop | full −`ad` |
| deliver pickup | empty +`ap` |
| sale | full −`as` (exit permanen, `mt=SALE tl=null`) |
| purchase | empty +`ab` (`mt=PURCHASE`) |
| refill | full −`ar` (DROP) **dan** empty +`ar` (PICKUP) — 2 doc `mt=REFILL`, derive generik fl/tl |
| reject | item gak naik → manifest −, gudang tetap (no movement) |

---

## SEED CONTOH (ROW BARU — day 2026-06-19, vehicle `F621a02a983500` / driver `87544551624342` Budi). Tidak menyentuh seed lama.

### item baru (refill SKU + `wt`)
```
item/9990019000019 → { ii:"9990019000019", in:"Pristine Galon RO 19 Liter", ic:"returnable", tc:["full","empty"], un:"pcs", ist:"active", wt:"ro" }
```

### task baru
```
// SALE + DELIVER + REFILL dalam 1 stop
task/TASK-20260619-101 → {
  tnm:"TASK-20260619-101", tty:"delivery", tst:"assigned",
  kl:"F6239569515300", kn:"Mandiri Tower", al:"Jl. Jend. Sudirman Kav. 54-55",
  gl:"F621558e33b612", vv:"F621a02a983500", cv:"80883888051110", cn:"Dirgahayu",
  tdt:1781802000000,
  it:[
    { ii:"2000000000123", in:"LPG 12kg",            tx:"sale",    cdo:"full",            ps:3, as:null },
    { ii:"8886008101138", in:"Aqua Galon 19 Liter", tx:"deliver", cdo:"full", cdi:"empty", pd:6, pp:0, ad:null, ap:null },
    { ii:"9990019000019", in:"Pristine Galon RO 19 Liter", tx:"refill",                   pr:2, ar:null }
  ]
}

// PICKUP + SALE + PURCHASE
task/TASK-20260619-102 → {
  tnm:"TASK-20260619-102", tty:"pickup_return", tst:"assigned",
  kl:"F62c903bbcdd00", kn:"Indomaret BSD", al:"Jl. Pahlawan Seribu, BSD",
  gl:"F621558e33b612", vv:"F621a02a983500", cv:"80883888051110", cn:"Dirgahayu",
  tdt:1781802000000,
  it:[
    { ii:"2000000000031", in:"LPG 3kg",             tx:"deliver", cdo:"full", cdi:"empty", pd:0, pp:3, ad:null, ap:null },
    { ii:"8886008101138", in:"Aqua Galon 19 Liter", tx:"sale",    cdo:"full",            ps:4, as:null },
    { ii:"8886012560310", in:"Amidis Galon 19 Liter", tx:"purchase", cdi:"empty",        pb:4, ab:null }
  ]
}

// REJECTED (load rejection) — tst=load_rejected, vv DIPERTAHANKAN (driver/mobil terakhir buat Admin)
task/TASK-20260619-103 → {
  tnm:"TASK-20260619-103", tty:"delivery", tst:"load_rejected",
  kl:"F629FAR0000001", kn:"Warung Jauh Cikupa", al:"Jl. Raya Cikupa KM 12",
  gl:"F621558e33b612", vv:"F621a02a983500", cv:"80883888051110", cn:"Dirgahayu",
  tdt:1781802000000,
  it:[ { ii:"2000000000031", in:"LPG 3kg", tx:"deliver", cdo:"full", cdi:"empty", pd:2, pp:0, ad:null, ap:null } ]
}
```

### movement baru (tipe baru aja — deliver DROP/PICKUP sama kaya seed lama, di-skip)
```
mov SALE     → { mt:"SALE",     fl:"F621a02a983500", tl:null,             ii:"2000000000123", cd:"full",  qt:3, dv:"87544551624342", dn:"Budi Santoso", mrf:"TASK-20260619-101" }
mov REFILL drop   → { mt:"REFILL", fl:"F621a02a983500", tl:"F6239569515300", ii:"9990019000019", cd:"full",  qt:2, dv:"87544551624342", dn:"Budi Santoso", mrf:"TASK-20260619-101" }   // mobil full−2
mov REFILL pickup → { mt:"REFILL", fl:"F6239569515300", tl:"F621a02a983500", ii:"9990019000019", cd:"empty", qt:2, dv:"87544551624342", dn:"Budi Santoso", mrf:"TASK-20260619-101" }   // mobil empty+2
mov PURCHASE → { mt:"PURCHASE", fl:"F62c903bbcdd00", tl:"F621a02a983500", ii:"8886012560310", cd:"empty", qt:4, dv:"87544551624342", dn:"Budi Santoso", mrf:"TASK-20260619-102" }
```

### evidence baru (reject note)
```
evidence/{auto} → { ety:"notes", ept:"task", erf:"TASK-20260619-103", d:"Cikupa kejauhan, berlawanan arah rute hari ini", cv:"87544551624342", cn:"Budi Santoso", t:1781853000000 }
```

---

## Walk-in channel (FUTURE — sistem terpisah, page admin)

Customer dateng ke toko, beli langsung ambil. **BUKAN driver runtime** — no task/vehicle/custody. Diinput lewat **page admin** sendiri nanti. **Struktur udah disiapin sekarang biar gak ubah lagi** — pakai `movement` existing, 0 collection baru:

```
mov walk-in SALE → { mt:"SALE", fl:"<store/warehouse lv>", tl:null, ii:"<item>", cd:"full", qt:N,
                     mrf:null, er:"ADMIN", dv:"<admin/kasir vid>", dn:"<nama>", t:… }
```
| aspek | walk-in | driver sale |
|---|---|---|
| `fl` | toko/gudang (`lt=store`/`warehouse`) | mobil (`lt=vehicle`) |
| `tl` | null (exit) | null (exit) |
| `mrf` | **null** (no task) | task `tnm` |
| `er` | **ADMIN** | DRIVER |
| aktor `dv`/`dn` | admin/kasir (label "driver" = recorder generik) | driver scan |

**Hook yang udah ditambah (2026-06-19):** `stock_location.lt` +`store` · `movement.er` +`ADMIN`. Combo `mt=SALE + er=ADMIN + mrf=null + fl=store` = walk-in (gak butuh marker channel khusus).

**Stock:** keluar dari asset_cache toko (CF derive sama kaya SALE biasa). **Duit/struk:** pakai tab **`Transaction`** existing (DO/Invoice/Receipt, 29 field) — BUKAN collection baru. Link Transaction↔movement (opsional) pas dibangun.

> Driver runtime **0 perubahan** buat walk-in. 2 enum di atas = future-proof; kalau toko = gudang, `store` gak kepake (no harm).

---

## Open / flag dev
1. **Manifest `ie[]` exclude rejected task** — sebelum custody-count, item dari task yg `tst=load_rejected` jangan diitung (biar ie-vs-ip gak mismatch palsu).
2. **`wt` denorm ke `it[]`?** SSOT di item; kalau renderer refill butuh offline → denorm (pola `in`).
3. ✅ **RESOLVED 2026-06-24** — REFILL = **2 doc** (DROP full + PICKUP empty), `cd` konkret per doc. CF emit lewat `OnTaskCompleted`; derive generik fl/tl. (Bukan 1-doc cd-ignored — engine drop doc cd-kosong.)
4. **Reject re-assign** = domain Admin app (di luar driver). Driver cuma set `vv=null` + evidence.
5. **Type renderer** SALE/PURCHASE/REFILL read-only + reject sheet = build dev (mockup `Driverruntimefull2.jsx`).
