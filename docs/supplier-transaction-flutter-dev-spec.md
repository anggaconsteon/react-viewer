# Dev Spec (Flutter) — Transaksi Supplier: builder `mode:supplier` + submit `src:supplier`

**Tanggal:** 2026-07-15
**Buat:** dev Flutter (renderer). CF branch `OnNotaCreated src==supplier` **SUDAH BUILT** (commit f95e7c3, `supplier_nota_trigger.go` — deploy `make deploy-onNotaCreated`). Page op1Screen **SUDAH LIVE** (config-ahead): `SupplierList` @1154, `SupplierTransaksi` @1162, launcher AdminHome "Supplier" (storefront).
**Sifat:** EXTEND 2 widget existing (TASK_ITEM_BUILDER + NOTA_CREATE_SUBMIT). **NOL widget baru.** Sisanya (pickerList navigate+routeParams, WORKSPACE_HEADER, NUMBER counter, TXF) = existing, nol perubahan.
**Konteks bisnis:** admin/CEO transaksi dgn supplier — **Beli** (stok masuk), **Tukar/refill** (kosong keluar ↔ isi masuk), **Jual** (keluar; barang rusak = jual biasa). Desain: `docs/supplier-transaction-dev-spec.md`.

---

## 0. Flow

AdminHome → launcher "Supplier" → **SupplierList** (picker supplier, existing renderer — langsung jalan) → tap → **SupplierTransaksi** bawa routeParams `{supplierId}`/`{supplierName}` → isi barang per line + catatan → Simpan → 1 doc `nota src:supplier` → CF fan-out movement → stok gudang & timeline keupdate sendiri.

## 1. EXTEND #1 — `TASK_ITEM_BUILDER` `mode:"supplier"`

Config LIVE (op1Screen D1165, resolved):

```json
{"type":"TASK_ITEM_BUILDER","vidtable":"20342033315492","mode":"supplier","wizardKey":"supplier_tx","itemTable":"84214220504259//item","itemIdField":"ii","itemNameField":"in","priceSourceField":"hrg","txOptions":"buy◼Beli★refill◼Tukar★sale◼Jual","qtyOutField":"qo","qtyInField":"qi","priceField":"hrg","searchHint":"Cari barang…","text":"Barang◆+ Barang◆Keluar◆Masuk◆Harga◆Subtotal◆Hapus"}
```

Perilaku (mirror `mode:walkin` yg udah jalan, beda per-line):
1. "+ Barang" → picker item (itemTable, search by `in`) — SAMA kaya walkin.
2. Per line: **pilih tx** dari `txOptions` (`value◼Label★…` → segmented/chip Beli|Tukar|Jual), lalu:
   - **buy** → input `qi` doang (masuk) + `hrg` (prefill `priceSourceField`, editable — harga beli beda dari harga jual).
   - **refill** → input `qo` (kosong keluar) + `qi` (isi masuk) + `hrg` (ongkos refill per unit, boleh 0). Default qo=qi (biasanya tukar 1:1), dua-duanya editable.
   - **sale** → input `qo` doang (keluar) + `hrg`.
3. Line output ke wizard state (`wizardKey:supplier_tx`): `{ii, in, tx, qo, qi, hrg}` — qo/qi yang gak relevan = 0.
4. Subtotal per line = `hrg × max(qo,qi)`; total di submit bar.
5. Label SEMUA dari `text` ◆-segmen (0 judul · 1 tombol tambah · 2 label Keluar · 3 Masuk · 4 Harga · 5 Subtotal · 6 Hapus) — nol hardcode.

## 2. EXTEND #2 — `NOTA_CREATE_SUBMIT` (+3 param)

Config LIVE (op1Screen D1167, resolved):

```json
{"type":"NOTA_CREATE_SUBMIT","vidtable":"20342033315492","table":"84214220504259//nota","wizardKey":"supplier_tx","gl":"F621558e33b612","src":"supplier","sv":"{supplierId}","sn":"{supplierName}","notePosition":10,"paymentPosition":"","buyerPosition":"","action":"savesend","flag":"admin-supplier-tx","delay":5,"gpsPosition":2,"run":"17:generate_number","numberPos":"17","route":"vertikaTeknoLokaciptaAdminHome","text":"Simpan Transaksi◆TOTAL◆Lengkapi barang dulu◆Gagal menyimpan","chain":{"type":"DO_DIALOG","title":"Transaksi Tersimpan","children":[{"type":"TXT","data":"Stok gudang akan terupdate otomatis"},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaAdminHome"}]}]}}
```

Param BARU (3):
| param | fungsi |
|---|---|
| `sv` | token → field `sv` doc nota (id supplier dari routeParams) |
| `sn` | token → field `sn` (nama supplier, denorm) |
| `notePosition` | posisi form catatan → field `d` doc |

Param existing yg dipakai beda: `paymentPosition`/`buyerPosition` **kosong** = skip field (jangan crash — guard empty). `src:"supplier"` udah param existing.

> **+1 EXTEND penting:** `gl` registry-fallback (gl kosong → auto-resolve dari stock_location lt◼warehouse; >1 → picker) — detail di `customer-seed-nota-dev-spec.md` §3.4. Berlaku semua pemakai NOTA_CREATE_SUBMIT, kerjain bareng PR ini.

### Doc nota yang HARUS ke-tulis (kontrak CF, sudah built):

```json
{"nno":"SUP-2026-000001","src":"supplier","sv":"SUP-01","sn":"Tirta Jaya Abadi","gl":"F621558e33b612","by":"<adminName>","cv":"<adminVid>","d":"5 galon Cleo rusak — dijual","li":[{"ii":"8886008101138","in":"Aqua Galon 19 Liter","tx":"refill","qo":5,"qi":5,"hrg":6000},{"ii":"2000000000192","in":"Cleo Galon 19 Liter","tx":"sale","qo":5,"qi":0,"hrg":5000}],"tot":55000,"t":<epoch>,"ts":"<formatted>"}
```

`li[]` = **native array** (pola walkin PROVEN). `tot` = Σ subtotal. CF per line emit movement mid `sup-{nno}-{ii}-{buy|refout|refin|sale}` (idempotent) → asset_cache & timeline otomatis.

## 3. Yang TIDAK perlu disentuh

- SupplierList (D1156 `PICKER_LIST` navigate + routeParams multi-pair `supplierId◼{lv}⭘supplierName◼{ln}`) — renderer existing. **Cek 1 hal:** routeParams multi-pair (⭘) ke-support? SuratJalan baru pake single pair. Kalo belum → extend parser split ⭘ (kecil).
- WORKSPACE_HEADER data-bound `lv◼{supplierId}` — existing.
- NUMBER counter `SUP-{{YYYY}}-{{COUNTER(vtl.nota,6)}}` — existing (pola walkin/complaint).
- CF & asset_cache — done.
- Walk-in — **nol regresi wajib**: `mode:walkin` + submit tanpa sv/sn tetep byte-identical.

## 4. Acceptance

1. Launcher Supplier → list supplier (dari stock_location `lt◼supplier`) → tap → form transaksi dgn nama supplier di header.
2. Line Beli 30 → simpan → gudang isi +30 (AssetStock), timeline badge **Beli** "→ Gudang".
3. Line Tukar 5/5 → gudang kosong −5 isi +5, timeline 2 baris ke-group 1 nota, badge **Tukar**.
4. Line Jual 5 (rusak, catatan keisi) → gudang kosong −5, badge **Jual**, catatan kebaca.
5. Multi-line campur (contoh doc §2) dalam 1 nota → semua movement ke-emit, `tot` bener.
6. Submit tanpa line → disabled ("Lengkapi barang dulu"). Walk-in flow regresi nol.
7. routeParams 2 pair ke-resolve dua-duanya di page tujuan.

---

**Referensi:** `supplier-transaction-dev-spec.md` (desain+CF), walkin builder/submit LIVE (op1Screen 821/825 — pola yg di-mirror), page live 1154/1162, `rbt-route-params-dev-spec.md` (routeParams). Registry supplier di-seed dari sheet client tab `Master_Supplier` (sudah siap).
