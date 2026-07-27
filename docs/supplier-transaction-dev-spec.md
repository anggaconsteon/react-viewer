# Dev Spec — Transaksi Supplier (beli / tukar-refill / jual ke supplier)

**Tanggal:** 2026-07-15
**Buat:** dev Go (CF — branch baru `OnNotaCreated`) + dev Flutter (page admin; MAYORITAS reuse).
**Fitur:** admin/CEO transaksi dgn supplier: **Beli** (stok masuk), **Tukar/refill** (kosong keluar ↔ isi masuk), **Jual** (keluar — termasuk barang rusak, keputusan user: rusak = jual biasa, TANPA status damaged).
**Pola:** mirror walk-in POS — 1 doc nota `li[]` native → CF fan-out movement. Supplier = **pihak eksternal** (bukan lokasi ber-balance).

---

## 0. Keputusan terkunci (user, 2026-07-15)

1. **Supplier registry = `stock_location` `lt◼supplier`** (nama+alamat), di-seed dari sheet client tab `Master_Supplier` (seeder patched, tab opsional). Registry buat picker + denorm nama — **BUKAN** buat balance.
2. **Harga dicatat semua** — `hrg` per line (beli/jual; tukar biasanya 0/ongkos refill).
3. **Rusak = Jual** — keluar sirkulasi via `ac:sale`, keterangan di note. Vocab `cd:damaged` JANGAN dibikin.

## 1. Model ledger (CF asset_cache NOL PERUBAHAN)

Aturan existing yg dipake: movement `fl` doang = keluar sistem (−qt), `tl` doang = masuk sistem (+qt). Precedent LIVE: walk-in sale (no tl) + stok-awal gudang (no fl). Supplier TIDAK pernah jadi `fl`/`tl` → nol drift saldo (Refill Doctrine kejawab: konversi empty→full terjadi DI supplier, luar sistem).

| tx line | movement yg di-emit | mid (idempotent) |
|---|---|---|
| **buy** qtIn=30 | `{tl:gudang, ii, cd:full, qt:30, ac:buy}` | `sup-{nno}-{ii}-buy` |
| **refill** qtOut=5, qtIn=5 | ① `{fl:gudang, ii, cd:empty, qt:5, ac:refill}` ② `{tl:gudang, ii, cd:full, qt:5, ac:refill}` | `sup-{nno}-{ii}-refout` / `-refin` |
| **sale** qtOut=5 | `{fl:gudang, ii, cd:empty, qt:5, ac:sale}` | `sup-{nno}-{ii}-sale` |

Field tambahan tiap movement: `sv` (lv supplier), denorm `fln`/`tln` = "Nama Supplier" di sisi eksternal (timeline kebaca: "Gudang → Tirta Jaya" badge Jual; badgeMap `buy◼Beli★refill◼Tukar★sale◼Jual` UDAH ADA), `mrf` = `nno` nota (group timeline), `an` = admin name, `hrg` ikut ke movement (opsional, buat laporan).

> Catatan `cd` jual: default **empty** (kasus rusak/retur galon). Kalo nanti butuh jual full ke supplier, line bawa `cd` eksplisit — struktur udah nampung.

## 2. Doc nota supplier (yang ditulis submit)

Coll `nota` (SAMA kaya walk-in), pembeda `src◼supplier`:

```json
{"nno":"SUP-20260715-001","src":"supplier","sv":"SUP-01","sn":"Tirta Jaya Abadi","gl":"<lv gudang>","by":"<adminName>","cv":"<adminVid>","d":"5 cleo rusak dijual","li":[{"ii":"8886008101138","in":"Aqua Galon 19 Liter","tx":"refill","qo":5,"qi":5,"hrg":6000},{"ii":"2000000000192","in":"Cleo Galon 19 Liter","tx":"sale","qo":5,"qi":0,"hrg":5000}],"tot":55000,"t":1784134800000,"ts":"15 Jul 2026 14:00"}
```

`li[]` = native array (pola walk-in PROVEN). `qo`=qty keluar, `qi`=qty masuk, `tx`: `buy`/`refill`/`sale`. `tot` = Σ hrg×qty (arah sesuai tx; boleh dihitung CF).

## 3. CF — branch `OnNotaCreated` case `src == "supplier"`

Mirror branch walkin: per `li[]` line → emit movement sesuai tabel §1 (create by mid deterministik → re-fire aman/idempotent). Lookup `stock_location[sv]` buat nama (atau pake `sn` denorm dari doc). Gudang = `gl` dari doc. **Movement emission doang — asset_cache jalan sendiri via OnMovementCreated existing.**

## 4. Page admin (2 page, mayoritas reuse)

**P1 `SupplierList`** — reuse `pickerList` (PROVEN atas stock_location): `search:"lt◼supplier⭘lst◼active"`, titleField `ln`, subField `al`, mode navigate → P2, `routeParams:"supplierId◼{lv}★supplierName◼{ln}"`.

**P2 `SupplierTransaksi`** — builder multi-line + submit:
- WORKSPACE_HEADER (nama supplier dari routeParams)
- **Item builder per line: item + tx (Beli/Tukar/Jual) + qty keluar/masuk + harga.** Kandidat reuse terdekat = `taskItemBuilder` (CreateTaskItem — udah punya vocab tx + qty dua arah) ATAU `taskItemBuilderWalkin` (+harga, tapi sale-only). **Keputusan dev**: extend salah satu (param `txOptions:"buy◼Beli★refill◼Tukar★sale◼Jual"` + output li[] shape §2) — JANGAN widget baru kalo extend cukup.
- 3LineBorderForm (catatan `d`)
- Submit pola `notaCreateSubmit` (nulis doc §2, `src◼supplier`, `nno` auto `SUP-{ymd}-{seq}`)

Entry: launcher AdminHome + "Supplier" (icon `local_shipping` kepake — pakai `storefront`).

## 5. Acceptance

1. Beli 30 → stok gudang isi +30; AssetStock & StockHistory (badge Beli) bener.
2. Tukar 5/5 → kosong −5, isi +5; timeline 2 baris ke-group 1 nota (`mrf`).
3. Jual rusak 5 → kosong −5, keluar sirkulasi; catatan kebaca di timeline.
4. Nota supplier kebaca di riwayat (filter `src◼supplier` — bisa reuse WalkInHistory pattern + dateField/sort baru).
5. Re-fire CF = nol dobel (mid deterministik). Supplier TIDAK pernah muncul sbg saldo di asset_cache.
6. Harga kecatat per line + total per nota.

---

**Referensi:** pola walk-in (`walkin-counter-pos-design.md`, `walkin-nota-cf-dev-spec.md` — CF branch sibling), seeder `driver-runtime-seed.js` (Master_Supplier → stock_location lt:supplier, patched 2026-07-15), badgeMap timeline (buy/refill/sale udah ada). Sibling masa depan: `src◼seed` (seed saldo awal customer in-app — pola CF sama persis, branch ke-3).
