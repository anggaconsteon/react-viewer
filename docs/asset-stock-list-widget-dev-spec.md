# Dev Spec (Flutter) — widget `ASSET_STOCK_LIST` (sebaran stok per item × lokasi × kondisi)

**Tanggal:** 2026-07-10
**Buat:** Flutter dev (renderer — widget BARU generik). Konsumen pertama: Admin/Owner "Stok & Sebaran Aset". Mockup: `AssetStockMobile.jsx`.
**Sifat:** widget BARU. **100% generik** — engine = "pivot saldo keyed by (entity × dimensi × sub-kondisi)". Reusable buat distribusi balance apa pun (swap table/field).
**Dependency:** `asset-cache-lt-denorm-cf-dev-spec.md` (butuh `lt` di asset_cache). Deployed 2026-07-10.

---

## 0. Bentuk (dari mockup)

```
┌───────────────────────────────────────┐
│ Stok & Sebaran Aset                    │
│ [sirkulasi 407][di gudang 300][kosong 175]│ ← summary strip (config)
│ [Semua][🏠 Gudang][🚚 Mobil][👤 Customer]│ ← filter tab (pivotValues)
├───────────────────────────────────────┤
│ 💧 Aqua Galon            total 245     │ ← entity + total sirkulasi
│  ▓▓▓▓▓▓░░░  (bar proporsi per lokasi)   │
│  🏠 Gudang 160   🚚 Mobil 30  👤 Cust 55│ ← per pivotValue total
│    Isi 160 · Kosong 85 (kalo showCondition)│ ← sub-split kondisi (opsional)
│ 🛢️ Gas 12kg              total 98      │
└───────────────────────────────────────┘
   filter "Gudang" → tiap item cuma tampil kolom Gudang (Isi/Kosong)
   filter "Customer" → cuma angka customer (dipinjam)
```

## 1. Engine agregasi (generik)

1. Query `table` (`asset_cache`) + `search` (opsional filter). `hideZero` skip qt 0.
2. **Group by `groupField`** (`ii` = item) → tiap entity.
3. Per entity, **pivot by `pivotField`** (`lt` = tipe lokasi) → **sum `valueField`** (`qt`) per pivot-value = total per lokasi.
4. (Opsional) per (pivot × `condField`) → sum = sub-split kondisi (Isi/Kosong).
5. **Join** `joinTable` (by `joinKey`) → nama (`nameField`) + kategori (`catField`).
6. Entity total = Σ semua pivot. **Summary** (config) = agregat lintas entity.
7. **Filter tab** = "Semua" + tiap `pivotValues` → filter tampilan ke lokasi itu.

## 2. Param (semua generik)

| param | fungsi | contoh |
|---|---|---|
| `type` | `ASSET_STOCK_LIST` | |
| `vidtable`/`table` | keyed balance coll | `84214220504259//asset_cache` |
| `search` | filter (opsional) | `""` (semua) |
| `hideZero` | skip 0 | `TRUE` |
| `groupField` | entity (baris) | `ii` |
| `valueField` | angka di-sum | `qt` |
| `pivotField` | dimensi (kolom/segmen) | `lt` |
| `pivotValues` | `value◼label◼icon★…` (urut + label + ikon) | `warehouse◼Gudang◼🏠★vehicle◼Mobil◼🚚★client◼Customer◼👤` |
| `condField` | sub-split (opsional) | `cd` |
| `condValues` | `value◼label★…` | `full◼Isi★empty◼Kosong` |
| `showCondition` | `TRUE`=tampil Isi/Kosong, `FALSE`=total doang | `TRUE` |
| `joinTable`/`joinKey`/`nameField`/`catField` | join entity→nama | `item`/`ii`/`in`/`ic` |
| `itemIconMap` | (opsional) `key◼emoji★…` by ii/ic; fallback dot | `""` |
| `filterTabs` | `TRUE`=tampil tab filter | `TRUE` |
| `summary` | strip atas: `scope◼label★…`; scope = `all` \| `<pivotVal>` \| `<pivotVal>.<condVal>` | `all◼total sirkulasi★warehouse◼di gudang★warehouse.empty◼kosong di gudang` |
| `title`/`subtitle` | header | `Stok & Sebaran Aset`/`Semua aset · per lokasi & kondisi` |
| `text` | label ◆-seg | lihat §3 |
| `condNote` | catatan caveat (tampil kalo showCondition) | lihat §4 |
| `emptyText` | kosong | `Belum ada stok` |

Warna pivot/kondisi = **theme** (Isi=ok/emerald, Kosong=warn/amber; lokasi = palette kategori). BUKAN config hex.

## 3. Label ◆-seg

`text`: `total sirkulasi◆Semua◆pcs◆dipinjam (lagi dipakai)`
- 0 label total per-entity · 1 label tab "semua" · 2 unit · 3 sub-label pivot customer (opsional)

## 4. Caveat Isi/Kosong (`condNote`)

`showCondition:TRUE` → tampilin `condNote` di bawah list:
> Angka Isi/Kosong ilustratif — konversi konsumsi (Isi→Kosong di customer/mobil) belum di-model sbg movement (Refill Doctrine deferred). **Total per lokasi akurat**; split kondisi bisa drift.

`showCondition:FALSE` → total per-lokasi doang (nol caveat, paling akurat). **Rekomendasi default v1 = FALSE** (bersih), nyalain kalo Refill Doctrine udah dikunci.

## 5. Resolved JSON (SETELAH renderer)

```json
{"type":"ASSET_STOCK_LIST","vidtable":"20342033315492","table":"84214220504259//asset_cache","search":"","hideZero":"TRUE","groupField":"ii","valueField":"qt","pivotField":"lt","pivotValues":"warehouse◼Gudang◼🏠★vehicle◼Mobil◼🚚★client◼Customer◼👤","condField":"cd","condValues":"full◼Isi★empty◼Kosong","showCondition":"FALSE","joinTable":"84214220504259//item","joinKey":"ii","nameField":"in","catField":"ic","itemIconMap":"","filterTabs":"TRUE","summary":"all◼total sirkulasi★warehouse◼di gudang★warehouse.empty◼kosong di gudang","title":"Stok & Sebaran Aset","subtitle":"Semua aset · per lokasi & kondisi","text":"total sirkulasi◆Semua◆pcs◆dipinjam (lagi dipakai)","condNote":"Angka Isi/Kosong ilustratif — konversi konsumsi belum di-model (Refill Doctrine deferred). Total per lokasi akurat.","emptyText":"Belum ada stok"}
```

## 6. Reusability (bukti generik — nol perubahan renderer)

Swap field → distribusi lain:
- **Stok per kategori × lokasi:** `groupField:"ic"` (kategori), pivotField tetap `lt`.
- **Custody per driver:** `table:asset_cache`, `groupField:"ii"`, `pivotField:"dv"` (driver) + `pivotValues` driver.
- **Distribusi apa pun** yg bentuknya (entity × dimensi → Σ value) + join nama.

## 6b. UX enhancement round-2 (2026-07-15 — widget udah LIVE, ini polish)

Dari review live (screenshot user). Semua renderer-side, config gak berubah:

1. **Chip lokasi per-item TAPPABLE** — tap "🏠 Gudang 100" di kartu item → **pindah ke filter tab Gudang** (sinkron sama tab atas). Sekarang chip statis. Berlaku semua pivotValue (Mobil→tab Mobil, Customer→tab Customer).
2. **Summary chip atas TAPPABLE** — tap "674 di gudang" → tab Gudang; "140 kosong di gudang" → tab Gudang (kalo bisa sekalian highlight bagian Kosong). Scope `all` → tab Semua.
3. **Chip qty 0 di-redupkan** — "Mobil 0"/"Customer 0" render abu/50% opacity (info tetep ada, gak berisik). Jangan di-hide (0 itu informasi).
4. **`showCondition:"TRUE"` SUDAH di-set live** (op1Screen Q887) → per lokasi tampil sub-split `Isi n · Kosong n` + `condNote` di bawah list (§4). Kalo renderer belum implement bagian ini (acceptance #2), ini PRIORITAS pertama — user butuh angka full/empty per lokasi; total doang membingungkan.
5. (opsional) Tab aktif → summary strip ikut ke-scope (tab Gudang → strip angka gudang). Nilai tambah, bukan wajib.

Acceptance round-2: tap chip = pindah tab (instan, tanpa reload); split Isi/Kosong per lokasi muncul saat `showCondition:TRUE`; chip 0 redup; regresi nol pas `showCondition:FALSE`.

## 6c. Round-3 — breakdown per LOKASI SPESIFIK di tab lokasi (2026-07-15, user request)

**Masalah:** tab Mobil nampil "Isi 10 · Kosong 0" per item TANPA info mobil MANA; tab Customer sama (customer mana?).

**Model UX: "tab = level detail".** Tab Semua = overview per tipe (kaya sekarang, gak berubah). Tab lokasi (Gudang/Mobil/Customer) = kartu item pecah **per doc lokasi**:

```
[Tab Mobil]                          [Tab Customer]
Aqua 600ml 1 Karton   10 pcs        Aqua Galon 19 Liter   5 pcs
 🚚 B 1234 XY   Isi 10 · Kosong 0    👤 Honda Bintaro   3
 🚚 B 5678 CD   Isi 0 · Kosong 0     👤 Indomaret BSD   2
```

**Data:** SAMA dari asset_cache — doc udah keyed per `lv` dan punya **`ln`** (nama, denorm CF). Gak ada query/join baru; cuma pas tab aktif ≠ Semua, group tambahan by `lv` sebelum sum, label = `ln`.

**2 param baru (generic):**
| param | nilai page ini | fungsi |
|---|---|---|
| `detailField` | `lv` | field id lokasi spesifik (group level-2 di tab lokasi) |
| `detailNameField` | `ln` | field nama tampil per baris |

Kosong = perilaku sekarang (nol regresi). `showCondition:TRUE` → tiap baris detail ikut split Isi/Kosong; FALSE → total doang. `hideZero` berlaku per baris detail.

**Resolved JSON (SESUDAH, D887) — cuma nambah 2 field:**
`...,"catField":"ic","detailField":"lv","detailNameField":"ln","itemIconMap":"",...` (sisanya identik §5 + showCondition TRUE).

**Cross-link (SUDAH LIVE, zero-dev):** NOTICE_BAR di bawah list (op1Screen row 888) → "Lihat Outstanding" → CustomerOutstanding, buat aksi lanjutan (aging/doctrine). Breakdown ≠ pengganti Outstanding: breakdown = saldo per lokasi sekarang; Outstanding = piutang + umur + doctrine.

Acceptance round-3: tab lokasi nampil baris per `lv` dgn nama `ln`; angka konsisten sama chip overview; `detailField` kosong = tampilan lama; Customer tab + notice link dua-duanya jalan.

## 6d. Round-4 — subtitle jenis lokasi di baris detail (2026-07-16, user request)

Baris detail tab Mobil cuma plat (`🚚 B 1234 XY`) — kurang informatif. Registry `stock_location` sekarang punya `ty` (jenis: Pickup/Motor/Truck utk vehicle; HoReCa/Retail utk client) dan CF denorm `ty` ke asset_cache (sibling `lt`/`ln` — deploy + reconcile prasyarat).

**1 param baru:** `detailSubField` (page ini: `ty`) — render kecil/abu di samping/bawah nama baris detail: `🚚 B 1234 XY · Pickup`, `👤 Toko Contoh Jaya · HoReCa`. Kosong / field gak ada di doc = tampilan sekarang (nol regresi).

Acceptance round-4: tab Mobil nampil `plat · jenis`; tab Customer `nama · jenis`; doc tanpa `ty` (data lama belum reconcile) tetep render tanpa subtitle, gak error.

## 7. Acceptance

1. Per item: total sirkulasi + total per lokasi (Gudang/Mobil/Customer) dari `pivotValues`.
2. `showCondition:TRUE` → sub-split Isi/Kosong + `condNote`; `FALSE` → total doang (nol caveat).
3. Filter tab (Semua + per pivotValue) → filter tampilan.
4. Summary strip = agregat lintas entity per `summary` config.
5. `hideZero` → entity/lokasi saldo 0 gak nongol.
6. Nol string/warna baked — semua config/theme. Swap table+field = reusable (§6).
7. Total per lokasi = akurat (bukan kena Refill caveat); split kondisi = ilustratif.

---

**Referensi:** `AssetStockMobile.jsx` (mockup), `asset-cache-lt-denorm-cf-dev-spec.md` (dep lt), `CUSTOMER_OUTSTANDING_LIST` (sibling — sumber & pola sama), `OUTSTANDING_PANEL` (sibling). Page op1Screen + launcher nyusul pas renderer ready (config-ahead: jangan pasang sebelum renderer). GUE pegang.
