# Walk-in Counter (POS) — Design Spec

Design hasil brainstorm 2026-06-30. Scope: **counter ("Dibawa Langsung") only**; "Dikirim" nyusul (mode/tx-type tambahan, reuse P3–P5). Semua widget **generic**. Nota = **layer komersial cross-runtime** (admin walk-in SEKARANG + driver delivery NANTI + tempat lain). Analisa keputusan + opsi: `walkin-pos-analysis.md`.

**Prinsip inti:** stok TETEP via `movement`→CF→`asset_cache` (flow existing, gak berubah). Nota = SSOT **komersial** (harga/total/bayar) yang **nempel di atas** movement — gak ganggu stok.

---

## 1. Flow + Widget inventory

```
W1 Intake ──proceed: tulis movement(stok) + nota(komersial)──▶ W3 Nota ──cetak / transaksi baru
```

### W1 — Intake Pembelian
| # | widget | jenis | isi |
|---|---|---|---|
| 1 | `workspaceHeader` | reuse 225 | "Intake Pembelian", backRoute Home |
| 2 | payment toggle | reuse `selectableGrid` maxGrid 2 | Tunai/Transfer → capture `bym` (pindah dari W3, biar nota nulis lengkap pas proceed) |
| 3 | buyer name | reuse `textField` | opsional ("Umum") → `by` |
| 4 | item builder | **`taskItemBuilder` mode `walkin`** (EXTEND) | txTypes `sale,refill` + `priceField:hg` (sale=qty+harga override dari `item.hrg`; refill=waterType+qty, tukar 1:1) |
| 5 | total + proceed | reuse `sendButtonGpsWithEvent` 192 | total Rp (renderer Σ sale) → tulis nota+movement → W3 |

### W3 — Nota Penjualan
| # | widget | jenis | isi |
|---|---|---|---|
| 1 | `workspaceHeader` | reuse 225 | "Nota Penjualan" |
| 2 | nota render | **`RECEIPT_DOC`** (NEW generic) | baca nota tertulis by `nno`: header depo · meta · lines · total · metode · stamp LUNAS |
| 3 | Cetak Nota | reuse `printBluetooth` | thermal 80mm |
| 4 | Transaksi Baru | reuse `rbtCta` | → W1 reset |

**Cuma 1 widget BARU = `RECEIPT_DOC`.** Sisanya reuse/extend. Fulfillment toggle (Dibawa/Dikirim) OMIT sekarang (counter implied); pas Dikirim dibikin → +`switch`/mode + reuse P3–P5.

---

## 2. JSON resolved (generic)

### NEW `RECEIPT_DOC` (reusable: nota/invoice/tanda-terima)
```json
{
  "type": "RECEIPT_DOC",
  "vidtable": "20342033315492",
  "table": "84214220504259//nota",
  "search": "nno◼{notaId}",
  "title": "NOTA PENJUALAN",
  "headerTable": "84214220504259//stock_location",
  "headerSearch": "lv◼{gl}",
  "headerNameField": "ln", "headerAddrField": "al", "headerContactField": "ph",
  "noField": "nno", "buyerField": "by", "dateField": "ts",
  "linesField": "li", "lineNameField": "in", "lineQtyField": "qt", "linePriceField": "hg", "lineSubField": "sub",
  "totalField": "tot", "methodField": "bym", "statusField": "st",
  "text": "NOTA PENJUALAN◆No.◆Pembeli◆TOTAL◆LUNAS◆Terima kasih 🙏◆consteon"
}
```
Generic: header depo (query `{gl}`), meta (no/pembeli/tgl), lines table (`li[]`: nama×qty×harga=sub), total, metode, stamp `statusField`. Ganti table/field → dokumen cetak apapun.

### W1 (reuse)
```json
{"type":"SELECTABLE_BTN","variant":"grid","title":"PEMBAYARAN","maxGrid":2,"position":1,"text":"Tunai◆Transfer"}
{"type":"TXF","variant":"text","label":"Pembeli","currentValue":"","hint":"Nama pembeli — kosongkan untuk Umum","position":2,"size":14,"line":1,"border":true}
{"type":"TASK_ITEM_BUILDER","vidtable":"20342033315492","mode":"walkin","itemTable":"84214220504259//item","itemIdField":"ii","itemNameField":"in","itemCatField":"ic","waterTypeField":"wt","priceSourceField":"hrg","searchField":"in","searchHint":"Cari produk…","txTypes":"sale,refill","writeTarget":"nota.li","qtyField":"qt","priceField":"hg","text":"Tambah Item◆+ Produk◆+ Refill Galon◆Jual◆Refill◆Air RO◆Isi Ulang"}
```
W3 reuse: `workspaceHeader` + `printBluetooth` + `rbtCta`.

---

## 3. Write architecture + schema (nyambung flow existing)

**1 transaksi SALE = 2 tulisan (stok + komersial), link via `nno`:**
```
W1 proceed →
  ├─ per line SALE   → movement {mt:SALE,  fl:{gl}, tl:null, ii, qt, er:ADMIN, t, nref:{nno}}   ← STOK (CF→asset_cache, existing)
  ├─ per line REFILL → movement {mt:REFILL, fl:{gl}, ii, qt, er:ADMIN, t, nref:{nno}}            ← STOK
  └─ 1 nota          → header scalar + li[] native snapshot                                      ← KOMERSIAL
→ W3 RECEIPT_DOC(nota by nno) → printBluetooth
```
**Movement schema GAK berubah** (cuma +`nref` opsional buat trace). Stok turun lewat movement→CF→asset_cache **kayak biasa**.

### Schema `nota` (NEW collection, cross-runtime)
```
nota (key nno):
  nno   nomor (generated)
  src   walkin | delivery          ← cross-runtime (driver: src=delivery)
  ref   counter-session | task tnm ← sumber
  kl    customer id (OPTIONAL; counter Umum = kosong; delivery = client stock_location)
  by    nama pembeli (Umum=kosong)
  bym   tunai | transfer
  st    LUNAS                       ← counter selalu lunas
  gl    depo (warehouse)
  tot   total Rp
  li[]  [{ii,in,qt,hg,sub}, …]      ← NATIVE ARRAY snapshot beku
  cv/cn kasir · t/ts
```

### `kl` optional — counter gak butuh stock_location
Counter = LUNAS, no outstanding, no custody → pembeli "Umum" anonim, **gak bikin stock_location**. Stok keluar depo (`movement fl:{gl}, tl:null`). `nota.kl` kosong. (Opsional link `kl` kalau pembeli = client existing yg dikenal.) `kl` keisi cuma di `src:delivery` (driver, customer terdaftar).

### Cross-runtime (driver, nanti — NOL rombak)
Driver delivery yg ada sale line (`task.it[]` tx=sale+hg) → selesai antar → tulis nota `src:delivery, ref:tnm, kl:{customer}` + reuse `RECEIPT_DOC`. Schema + widget udah generic.

---

## 4. Dependencies / blocker
| dep | sama dengan | status |
|---|---|---|
| native-array write `nota.li[]` | keystone `task.it[]` / custody `ip[]`/`dp[]` | solve sekali, kebuka semua |
| movement-per-line emit (loop) | driver movement-emit (per `it[]` line) | renderer |
| `taskItemBuilder` mode `walkin` | extend builder existing (multi-use P2 order) | renderer |
| `RECEIPT_DOC` widget | NEW generic | renderer |
| `item.hrg` price source | D1 tech-lead | ratify |
| schema `nota` (+src/ref/kl) | D3 tech-lead | ratify |
| `getMoneyInput` (harga override) | D10 — bisa internal taskItemBuilder | renderer |

## 5. Tech-lead decisions (ratify dulu — detail `walkin-pos-analysis.md`)
Resolved di brainstorm: nota=widget generic (RECEIPT_DOC) · write pas W1→W3 · payment di W1 · nota cross-runtime (src/ref/kl) · `kl` optional (counter no stock_location). **Sisa butuh ratify:** D1 (item.hrg) · D3 (schema nota final) · D5 (harga refill/parkir) · D9 (gl depo dari session?).

## 6. Build order (abis ratify)
1. Tech-lead ratify D1/D3/D5/D9.
2. `RECEIPT_DOC` widget (generic) + `nota` collection.
3. `taskItemBuilder` mode `walkin` (extend) + harga input.
4. native-array write `nota.li[]` + movement-per-line emit (shared keystone).
5. W1+W3 op1Screen page (generic, pola P1–P5).
6. Driver nota (reuse) — fase lain.

**Core galon (P1–P5) gak kena.** Walk-in = layer komersial terpisah di atas movement existing.
