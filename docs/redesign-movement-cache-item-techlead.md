# Catatan redesign: movement, cache, item

Status: draft, belum final. Hasil brainstorm 2026-06-22, buat bahan review tech lead sebelum diketok.

Isinya 5 perubahan plus 1 hal yang sengaja tidak diubah. Tiap bagian ada contohnya. Ini juga ngubah 1 hal dari `task-movement.md`: doc id cache jadi auto (bukan gabungan).

## 1. Movement jadi "dari/ke" (double-entry)

Sekarang movement nyatet 1 sisi: 1 barang, 1 kondisi, lokasi dari dan ke. Diubah jadi nyatet 2 sisi, sisi asal dan sisi tujuan. Satu bentuk ini nampung semua kasus: pindah lokasi (logistik), ganti kondisi (refill), sampai ganti SKU (kardus dibuka jadi satuan).

Pindah biasa (DROP galon), bedanya cuma tambah `la`/`lo` (titik gps kejadian):
```json
{ "mt":"DROP", "fl":"F621a02a983500", "tl":"F62793a15928ca", "ii":"8886008101138", "cd":"full", "qt":6, "la":-6.21, "lo":106.81, "dv":"87544551624342", "dn":"Budi", "mrf":"TASK-101" }
```
Sisi tujuan (`ti`/`tc`/`tq`) kosong, artinya sama kayak asal. 90% movement bentuknya begini, cuma nambah gps.

Kardus dibuka jadi satuan (kasus baru):
```json
{ "mt":"CONVERT", "fl":"F62toko001", "tl":"F62toko001", "ii":"pepsodent-DUS30", "cd":"sealed", "qt":1, "ti":"pepsodent-PCS", "tc":"loose", "tq":30, "la":-6.2, "lo":106.8, "dv":"...", "mrf":"..." }
```
1 kardus (`ii`, `qt` 1) jadi 30 satuan (`ti`, `tq` 30). Kondisi sealed jadi loose, di toko yang sama.

Semua jenis lama tetap kepakai lewat sisi dari/ke:
| jenis | asal | tujuan |
|---|---|---|
| INTERNAL (muat gudang ke mobil) | full, gudang | full, mobil |
| DROP (antar isi) | full, mobil | full, customer |
| PICKUP (ambil kosong) | empty, customer | empty, mobil |
| SALE (jual) | full, mobil | `tl` null (keluar sistem) |
| PURCHASE (beli) | empty, customer | empty, mobil |
| REFILL (tukar) | full, mobil | empty, mobil |
| CONVERT (buka kardus) | kardus, sealed | satuan, loose |
| TRANSFER (pindah gudang) | gudang A | gudang B |

### Kondisi (`cd`) diperbanyak, termasuk rusak/diperbaiki

`cd` tidak cuma full/empty lagi. Nambah sealed dan loose (buat kardus), plus rusak, diperbaiki, scrap (buat status barang). Galon rusak ditulis sebagai movement dengan kondisi tujuan (`tc`) "rusak". Diperbaiki ditulis sebagai movement dari `cd` "rusak" ke `tc` "empty" (balik ke pool).

Datanya: rusak/diperbaiki baru muncul kalau ada aksi yang nyatet, misal driver atau gudang "lapor rusak" dan "selesai perbaiki". Aksi itu belum dibikin, jadi schema-nya siap dan datanya nyusul.

### Field baru di movement

| kode | arti | dipakai saat |
|---|---|---|
| `ti` | barang tujuan (SKU jadi apa) | buka kardus, repack |
| `tc` | kondisi tujuan | refill, rusak, buka kardus |
| `tq` | jumlah tujuan | buka kardus (1 jadi 30) |
| `la` / `lo` | gps lintang/bujur kejadian | semua movement |

`la`/`lo` ini kode yang sudah ada di collection location, dipakai ulang biar konsisten (arti sama, jadi tidak nabrak). Field lama (`mt fl tl ii cd qt dv dn mrf er t ts`) tetap.

### CF jadi 1 aturan

Sekarang CF punya banyak aturan per jenis (DROP kurangi full, PICKUP nambah empty, dan seterusnya). Diganti 1 aturan: tiap movement, bucket asal (`fl`, `ii`, `cd`) dikurangi `qt`, bucket tujuan (`tl`, `ti` kalau ada, `tc` kalau ada) ditambah `tq` (atau `qt`). Semua jenis ngikut sendiri. CF jadi lebih ringkas, tapi yang sudah dibangun di Go harus ditulis ulang.

## 2. Item: kardus simpan isinya

Item kardus nambah 2 field: jadi SKU apa kalau dibuka, dan isi standarnya.
```json
{ "ii":"pepsodent-DUS30", "in":"Pepsodent Dus isi 30", "ic":"consumable", "un":"dus", "cs":"pepsodent-PCS", "pq":30 }
```
`cs` = kalau dibuka jadi SKU apa. `pq` = isi standar (30). Pas movement CONVERT, `pq` jadi acuan default, tapi jumlah aktual (`tq`) boleh beda kalau isi kardusnya tidak sesuai. Galon dan item satuan biasa tidak punya `cs`/`pq`.

## 3. Cache

### Doc id jadi auto

asset_cache dan cache bulanan: doc id-nya random (auto), bukan gabungan `{lokasi}__{barang}__{kondisi}` lagi. Pencariannya tetap pakai field `lv`/`ii`/`cd`. Konsekuensinya, CF pas nulis harus query dulu (cari doc yang cocok) di dalam transaksi biar tidak dobel, plus butuh composite index. Untungnya konsisten sama collection lain, dan doc id-nya lepas dari isi, jadi aman kalau nilai `cd` berubah atau nanti nambah dimensi.

Sisi baca tidak kena. Widget inventoryBucketCard sudah cari by field (`lv`), bukan ambil by doc id. Jadi ganti doc id tidak ngubah widget sama sekali.

### Status di cache = kondisi (`cd`), bukan field baru

Tadinya kepikir bikin field status sendiri, tapi tidak jadi. Status (rusak/diperbaiki) masuk ke `cd`. Jadi cache bulanan yang sudah ngitung per (lokasi, barang, kondisi) otomatis ngitung jumlah rusak/diperbaiki juga. "Status awal bulan" = saldo bucket `cd` di awal bulan, tidak perlu nambah apa-apa.

### Snapshot gps bulanan per lokasi

Buat jaga histori kalau koordinat lokasi diubah, ada snapshot bulanan per lokasi. Cuma buat lokasi tetap (gudang/toko), bukan mobil yang gps-nya hidup terus. Collection kecil, 1 baris per lokasi per bulan:
```json
{ "lv":"F62toko001", "prd":"202606", "la":-6.31607, "lo":106.64483, "ln":"Toko Bintaro", "lt":"store", "t":1782900000000 }
```

## 4. Rename collection `location` jadi `geofence`

Karena movement sekarang punya field gps (`la`/`lo`), nama collection `location` jadi rancu. Isinya sebenarnya titik geofence (titik plus radius `ra`), jadi lebih pas dinamai `geofence`. Yang kena: referensi di widget patrol dan mapping event `lq` ke `li`, tinggal ganti nama path.

## 5. Yang sengaja tidak diubah: `it[]` tetap array

Sempat kepikir mecah barang task jadi collection terpisah, tapi tidak jadi, tetap array `it[]` di dalam task. Alasannya: kasus kardus dibuka itu urusan movement (collection movement sudah terpisah), bukan mecah baris task. Task line tetap rencana (bawa 2 kardus), eksekusinya (buka kardus, jual satuan) jadi movement. Laporan diambil dari movement (`mrf` = task), bukan dari task line. Mecah jadi collection malah maksa rombak ulang renderer aplikasi tanpa untung.

## Ringkasan dampak

| keputusan | movement | item | cache | CF | widget/JSON | seed |
|---|---|---|---|---|---|---|
| movement dari/ke + gps | +5 field | - | - | tulis ulang (1 aturan) | aman, tidak baca movement mentah | tambah sisi tujuan pas konversi |
| `cd` diperbanyak | value baru | - | bucket baru | - | mapping bucket inventoryBucketCard (opsional) | - |
| item `cs`/`pq` | - | +2 field (kardus) | - | - | - | setup kardus |
| cache doc id auto | - | - | doc id auto + index | upsert query dalam transaksi | aman | seed pakai auto-id |
| snapshot gps bulanan | - | - | +collection kecil | job/CF nulis tiap bulan | - | - |
| rename `location` jadi `geofence` | - | - | - | - | path patrol + event `lq` | - |
| `it[]` tetap array | - | - | - | - | aman, tidak rombak | - |

## Yang belum kelar

- Aksi runtime di aplikasi: "buka kardus / jual satuan" dan "lapor rusak / selesai perbaiki" belum ada. Schema sudah siap, data nyusul pas aksinya dibangun.
- Kardus isi campur (1 kardus jadi 2 SKU beda): 1 doc movement cuma punya 1 SKU tujuan. Kalau ada kardus campur, butuh 2 doc atau sisi tujuan dijadiin array. Galon dan Pepsodent biasanya 1 jenis, jadi aman.
- CF Go ditulis ulang ke aturan double-entry plus upsert auto-id.

## Dictionary (kode baru)

### Movement
| kode | arti |
|---|---|
| `ti` | barang tujuan (SKU jadi apa kalau ganti) |
| `tc` | kondisi tujuan |
| `tq` | jumlah tujuan |
| `la` / `lo` | gps lintang / bujur kejadian |

### Item
| kode | arti |
|---|---|
| `cs` | kalau dibuka jadi SKU apa |
| `pq` | isi standar per kardus |

### Snapshot gps bulanan
| kode | arti |
|---|---|
| `lv` | lokasi |
| `prd` | bulan (`YYYYMM`) |
| `la` / `lo` | gps lokasi, beku di awal bulan |
| `ln` | nama lokasi |
| `lt` | jenis lokasi (store / warehouse) |

Catatan kode: yang baru (`ti tc tq cs pq lt`) masih usulan, perlu dicek dulu tidak nabrak kode lain. `tc` kebetulan sama dengan `tc` di item (daftar bucket full/empty), jadi kemungkinan diganti pas finalisasi. `la`/`lo`/`prd` sudah ada dan dipakai ulang.
