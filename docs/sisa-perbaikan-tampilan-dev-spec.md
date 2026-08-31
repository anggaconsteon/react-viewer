# Sisa perbaikan tampilan — barang jual tidak muncul, daftar closing kembar

**Untuk:** dev Flutter · **Tanggal:** 2026-08-12 · **Tenant:** `20342033315492`, coll `84214220504259`
**Visual sebelum/sesudah:** https://claude.ai/code/artifact/c18efb3e-4529-416e-b198-a5ea373736bf

**Semua config di spreadsheet sudah dipasang ke bentuk FINAL** — tidak ada yang perlu diminta ke builder. Begitu renderer jadi, layarnya langsung benar.

---

## Ringkasan permintaan (2)

| # | Permintaan | Layar / widget |
|---|---|---|
| **1** | **Tampilkan baris barang jual** (jual `as` / beli `ab` / tukar `ar`) + ikutkan ke angka total | `TASK_MANIFEST_LIST` @Terima Muatan · `CIRCULATION_SUMMARY` @Balikin Kendaraan |
| **2** | **Gabungkan baris per jenis barang** (sekarang satu barang tampil dua baris nama kembar) | `CUSTODY_CONFIRMED_LIST` @Closing gudang |

✅ **Sudah beres, tidak perlu dikerjakan lagi:** token `{activeTrip}` yang sempat basi (ringkasan menampilkan data kendaraan lain) — sudah diperbaiki dan diverifikasi 2026-08-12.

---

## 1. Baris barang jual tidak dirender — 2 widget, satu perbaikan

### 1.1 `TASK_MANIFEST_LIST` — "Terima Muatan" (`op1Screen` 1348)

Driver mengecek muatan sebelum berangkat. Tiga barang jual ikut naik ke kendaraan, tapi di daftar **hanya tertulis namanya, tanpa angka**:

```
Air RO 19 Liter            ↓ 4 antar   ↑ 4 ambil
Aqua 330ml                 (kosong)
Aqua 1500ml                (kosong)
Amidis Galon 19 Liter      ↓ 2 antar   ↑ 2 ambil
LeMinerale Galon 15 Liter  (kosong)
Aqua Galon 19 Liter        ↓ 2 antar   ↑ 2 ambil
```

Header ringkasannya **"↓8 ↑8"** = 4+2+2 — penjualan **tidak ikut terhitung sama sekali**, padahal barangnya ikut dimuat. Driver menerima muatan tanpa tahu berapa yang harus dijual.

Config sudah menyediakan fieldnya (`op1Screen!D1348`):
```json
"saleField":"ps", "buyField":"pb", "refillField":"pr"
```

Catatan label: `text` widget ini saat ini hanya punya segmen antar/ambil (`…◆tujuan◆barang◆antar◆ambil◆tap buat tolak`). Kalau butuh label khusus jual/beli/tukar, sebutkan — builder tinggal menambah segmen ◆.

### 1.2 `CIRCULATION_SUMMARY` — "Total Barang" @Balikin Kendaraan (`op1Screen` 694)

Contoh nyata **TASK-2026-000470** (`SLANk8iKnTGY47sO6flN`) — satu task, dua baris item:

| # | item | `tx` | rencana | aktual |
|---|---|---|---|---|
| it[0] | Amidis Galon 19 Liter (`9990019000045`) | `deliver` | `pd:5` `pp:5` | `ad:5` `ap:5` |
| it[1] | **Amidis 330ml** (`9990019000047`) | `sale` | `ps:5` | **`as:5`** |

Di layar **hanya muncul galonnya**; baris Amidis 330ml hilang. Pada **TASK-2026-000474** (`as:2`, murni penjualan) ringkasannya **kosong sama sekali**.

Config sudah menyediakan fieldnya (`op1Screen!D694`):
```json
"actualSaleField":"as", "actualBuyField":"ab", "actualRefillField":"ar",
"text":"Total Barang◆Antar◆Ambil◆Jual◆Tukar◆Beli◆Barang keluar-masuk hari ini per pelanggan."
```
Label **Jual / Tukar / Beli** sudah disiapkan di `text` tapi tidak pernah dipakai.

### 1.3 Permintaan
**Kalau field barang jual ada di config, tampilkan barisnya + ikutkan ke angka total.** Berlaku sama untuk kedua widget. Barang jual tidak punya kondisi penuh/kosong — cukup angkanya saja.

> Pola yang sama sudah pernah diperbaiki di `ITEM_EXECUTION_LIST` (stepper barang jual + batas maksimal sesuai stok kendaraan sudah berjalan). Dua widget ini sisanya.

---

## 2. Daftar closing menampilkan satu barang jadi dua baris

`CUSTODY_CONFIRMED_LIST` @WarehouseClosingMatch (`op1Screen` 746). Tampilan sekarang:

```
Yang Diterima                                                6 item
✓ Aqua Galon 19 Liter   [returnable] [↑Antar 2] [↓Ambil 2]        0
✓ Aqua Galon 19 Liter   [returnable]                              2
✓ Amidis Galon 19 Liter [returnable] [↑Antar 7] [↓Ambil 7]        0
✓ Amidis Galon 19 Liter [returnable]                              2
✓ Air RO 19 Liter       [returnable] [↑Antar 4] [↓Ambil 4]        0
✓ Air RO 19 Liter       [returnable]                              4
```

**Sebabnya:** `ip` (hitungan closing) di-key per **item + kondisi**, jadi satu jenis barang keluar dua baris — Penuh dan Kosong. Tapi kondisinya tidak ditampilkan, sehingga terbaca seperti baris duplikat. Ikutannya: penghitung "6 item" menyesatkan (sebenarnya 3 jenis barang), dan badge Antar/Ambil hanya menempel di salah satu dari dua baris kembar.

**Target** (kriteria yang dipilih user: harus dimengerti petugas gudang yang gaptek):

```
Yang Diterima                        3 item
✓ Amidis Galon 19 Liter  [returnable]
     Penuh 0 · Kosong 2
     ↑ Antar 7    ↓ Ambil 7
```

Satu jenis barang = satu baris; angka diberi nama (`Penuh 0 · Kosong 2`) bukan angka telanjang; penghitung item jadi benar. Istilah **Penuh/Kosong** dipakai karena sudah dipakai di layar driver — jangan buat kosakata baru.

Config sudah menyediakan fieldnya (`op1Screen!D746`):
```json
"groupByItem":"TRUE", "condField":"cd", "condLabels":"full◼Penuh⭘empty◼Kosong"
```
Untuk barang jual (tanpa kondisi): tampilkan angkanya saja, tanpa rincian Penuh/Kosong.

---

## 3. Yang TIDAK bermasalah — sudah diverifikasi, mohon jangan diubah

- **Stok kendaraan benar.** `asset_cache` `MBL-02__9990019000047__full`: `cd:"full"`, `qt:0`, `lm:"sale-PHAhCzmf5Dfi01K572yR-9990019000047"`. Kendaraan membawa 2, terjual 2, sisa 0 — penjualan sudah memotong stok dengan benar.
- **"Sisa di Kendaraan — Tidak ada sisa muatan" benar**, karena `hideZero:"TRUE"` dan `qt:0`.
- **Barang jual memakai `cd:"full"`** di `asset_cache` (bukan kosong) — berguna kalau perlu query stok barang jual.

---

## 4. Acceptance

**Barang jual**
- [ ] Task berisi penjualan → muncul baris barangnya dengan label **Jual** + jumlahnya, di kedua layar (§1.1 dan §1.2).
- [ ] Task campuran (antar/ambil + jual) → dua-duanya muncul, tidak ada yang hilang.
- [ ] Beli (`ab`) dan Tukar (`ar`) juga tampil dengan labelnya.
- [ ] Angka total di header ikut menghitung barang jual.

**Closing**
- [ ] Satu jenis barang = **satu baris**, dengan rincian `Penuh x · Kosong y`.
- [ ] Penghitung item menghitung jenis barang, bukan jumlah baris kondisi.
- [ ] Badge Antar/Ambil menempel di baris barangnya, tidak menggantung di salah satu baris kembar.

---
**Referensi sel:** `TASK_MANIFEST_LIST`@1348 · `CIRCULATION_SUMMARY`@694 (search `I694`) · `CUSTODY_CONFIRMED_LIST`@746 (`T746`/`U746`/`V746`) · `VEHICLE_CARGO_SUMMARY`@693 · TASK-2026-000470 / 000474 · `asset_cache` `MBL-02__9990019000047__full`.
