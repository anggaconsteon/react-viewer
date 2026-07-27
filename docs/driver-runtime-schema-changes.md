# Driver Runtime — Usulan Perubahan Struktur Data (DRAFT, buat Tech Lead)

> **STATUS: DRAFT — BELUM FINAL.** Catatan buat diskusi sama tech lead. Bisa berubah. Tanggal: 2026-06-19.
> Sumber: mockup `src/component/web/Driverruntimefull2.jsx`. Detail teknis: `docs/driver-runtime-transaction-delta.md`. Dictionary SSOT: spreadsheet `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw` (tab `item`/`task`/`movement`/`stock_location`).

## Ringkasan 1 paragraf
Ada 3 kebutuhan baru: (1) **transaksi jual/beli/tukar** per item (gak cuma antar/ambil), (2) **batal/reject task** sebelum berangkat, (3) **walk-in customer** (beli di toko, tanpa driver). Semua ini **gak butuh collection baru** — cukup tambah beberapa field + nilai enum. Driver flow yang udah ada (P4–P12) **gak berubah**.

---

## 1. Transaksi Jual / Beli / Tukar (per item di dalam task)

Dulu tiap item di stop cuma bisa **antar (drop)** & **ambil (pickup)**. Sekarang tiap item punya **jenis transaksi** sendiri:

| Jenis (`tx`) | Artinya | Contoh |
|---|---|---|
| `deliver` (default) | Antar barang, nanti tabung kosong dibalikin | Galon/gas reguler |
| `sale` (Jual) | Jual putus, kepemilikan pindah ke customer, gak ada balik | Jual tabung baru |
| `purchase` (Beli) | Beli dari customer, barang naik ke mobil | Beli tabung kosong customer |
| `refill` (Tukar) | Tukar galon customer 1-lawan-1 (kosong masuk, isi keluar) | Isi ulang galon RO |

**Field baru di `task.it[]`** (array item per stop):
| Kode | Arti |
|---|---|
| `tx` | jenis transaksi (deliver/sale/purchase/refill) |
| `ps` / `as` | qty jual rencana / aktual |
| `pb` / `ab` | qty beli rencana / aktual |
| `pr` / `ar` | qty tukar rencana / aktual |

> Catatan: `pd`/`pp`/`ad`/`ap` (antar/ambil) tetap **khusus deliver**. Tiap jenis transaksi punya kolom qty sendiri biar penjumlahan gak campur.

**Field baru di `item` (master):**
| Kode | Arti |
|---|---|
| `wt` | jenis air (`ro` / `refill` / kosong) — buat produk refill |

**Nilai baru di `movement.mt` (jenis pergerakan stok):**
- Tambah `PURCHASE` (beli) & `REFILL` (tukar). `SALE` (jual) sudah ada sebelumnya.
- Untuk REFILL: 1 baris movement saja; field `cd` diabaikan, CF yang hitung (mobil: isi −qty, kosong +qty).

---

## 2. Batal / Reject Task (sebelum Konfirmasi Penerimaan)

Driver bisa **menolak task** dari daftar, **hanya selama belum Konfirmasi Penerimaan** (saat Rute masih terkunci). Alasannya: tujuan gak searah rute, dsb.

**Cara kerjanya:**
- Task ditandai status baru: **`tst = load_rejected`**.
- **Mobil (`vv`) TIDAK dikosongkan** — biar Admin tetap tahu task ini tadinya di driver/mobil mana (buat audit & re-assign).
- Alasan (wajib, min 10 karakter) disimpan di `evidence` (siapa yang nolak + kenapa).
- Barang **tetap di gudang**, gak naik ke kendaraan → stok gudang gak berubah, gak ada movement.
- **Admin re-assign:** ganti `vv` ke mobil lain + ubah `tst` balik ke `assigned`. Driver ikut berganti otomatis (driver diambil dari mobil, bukan disimpan di task).

**Field baru:**
| Lokasi | Tambah |
|---|---|
| `task.tst` | nilai enum baru `load_rejected` |

> Reject **gak** bikin field/collection baru. Cuma 1 nilai status baru + pakai evidence yang sudah ada.

---

## 3. Walk-in Customer (NANTI — sistem terpisah, page Admin)

Customer datang ke toko, beli langsung ambil. **Bukan bagian driver** — gak ada task/mobil/custody. Nanti diinput lewat **page Admin sendiri**.

**Strukturnya sudah disiapin sekarang biar gak perlu ubah lagi nanti** — pakai `movement` yang sudah ada, **0 collection baru**:
- Walk-in = 1 baris `movement` jenis `SALE`, dari lokasi toko, tanpa task.
- Pembeda dari jual-via-driver: `er = ADMIN` (diinput dari app admin) + tanpa ref task + lokasi asal = toko.

**Hook yang sudah ditambah (supaya siap):**
| Lokasi | Tambah |
|---|---|
| `stock_location.lt` | nilai `store` (lokasi toko, kalau beda dari gudang) |
| `movement.er` | nilai `ADMIN` (penanda diinput dari app admin) |

**Uang / struk:** pakai tab **`Transaction`** yang sudah ada (DO/Invoice/Receipt) — **bukan** collection baru.

---

## Yang TIDAK berubah (penting)
- **0 collection baru** untuk ketiga fitur.
- Driver flow & page P4–P12 **gak berubah**.
- Seed/dummy lama **gak disentuh** — yang ditambah cuma **row contoh baru** di dictionary (item Pristine RO, 3 task contoh tx + reject, 3 movement SALE/REFILL/PURCHASE).

## Rekap semua yang ditambah
| Collection | Tambahan |
|---|---|
| `item` | +`wt` |
| `task.it[]` | +`tx` `ps` `as` `pb` `ab` `pr` `ar` |
| `task.tst` (enum) | +`load_rejected` |
| `movement.mt` (enum) | +`PURCHASE` +`REFILL` |
| `movement.er` (enum) | +`ADMIN` |
| `stock_location.lt` (enum) | +`store` |
| collection baru | **tidak ada** |

Total: **8 field/kode baru + 4 nilai enum baru.**

---

# 4. Rekap Stok Bulanan per Toko (`asset_cache_monthly`)

> **Kategori beda dari Bagian 1–3.** Ini **bukan** schema yang ditulis app. Ini collection **turunan** yang diisi otomatis oleh **Cloud Function** (sodara-nya `asset_cache`). App **gak nulis apa-apa** ke sini — cuma **baca** buat tampilin rangkuman bulanan. Jadi dari sisi app: 0 perubahan.

## Kebutuhan
Selain saldo **sekarang** (`asset_cache`, 1 angka per item per lokasi), butuh **rangkuman per bulan per toko**: bulan ini di toko X item Y **masuk berapa, keluar berapa, sisa berapa**, dan bulan depan **lanjut dari sisa bulan lalu**.

Contoh (1 item, 1 toko):
```
MEI  buka 0   masuk 15  keluar 5  → tutup 10
JUNI buka 10  masuk 9   keluar 7  → tutup 12   (buka Juni = tutup Mei)
JULI buka 12  ...
```

## Prinsip desain (penting)
`tutup(bulan) = tutup(bulan-lalu) + net(bulan)` — ini cuma **jumlah-lari (prefix sum)**.
Jadi yang **disimpan cuma angka per bulan** (`in`/`out`/`net`), **bukan** saldo lari.
- Carry-forward ("mulai dari sisa bulan lalu") → **otomatis**, gak ada logika khusus.
- Movement yang di-**backdate** (entry telat masuk bulan lalu) → cukup update **1 doc bulan itu**; bulan-bulan setelahnya ikut bener sendiri pas dihitung. **Gak ada tulis-ulang beruntun (ripple).**

## Collection: `asset_cache_monthly`
Sejajar `asset_cache` & `asset_cache_applied` di bawah path tenant
(`MobileTable/{db}/tables/{tid}/asset_cache_monthly`).

Doc-id (deterministik, biar bisa upsert + idempotent):
```
{lv}__{ii}__{cd}__{YYYYMM}
contoh: TOKO1__ITEM1__full__202606
```

Kode field pakai singkatan ala dictionary, dicek unik (gak nabrak key lain). Catatan: `in` udah dipakai (= nama item di `item`/`task.it[]`), jadi "masuk" dikodein `qi`, bukan `in`.

| Field | Arti |
|---|---|
| `lv` | lokasi (toko) vid |
| `ii` | item id |
| `cd` | kondisi (full/empty) |
| `prd` | bulan, `"YYYYMM"` (mis. `"202606"`) |
| `qi` | qty masuk bulan itu (Σ qty sisi `tl`) |
| `qo` | qty keluar bulan itu (Σ qty sisi `fl`) |
| `qn` | `qi − qo` (perubahan bersih bulan itu, bisa negatif) |
| `t` | epoch update terakhir |

**Buka & tutup TIDAK disimpan** — dihitung pas baca:
```
saldo akhir bulan M = Σ qn (semua bulan ≤ M)
saldo awal  bulan M = Σ qn (semua bulan <  M)
```