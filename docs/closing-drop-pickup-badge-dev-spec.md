# CUSTODY_CONFIRMED_LIST closing — badge drop/pickup dari hasil delivery (Dev Spec)

**Tanggal:** 2026-08-11
**Buat:** dev Flutter (renderer CUSTODY_CONFIRMED_LIST).
**Status:** PROPOSED — badge shape DECIDED = opsi X (user 2026-08-11).
**Konteks / Konsumen pertama:** galon VTL (tenant `20342033315492`). **WarehouseClosingMatch** (`vertikaTeknoLokaciptaWarehouseClosingMatch`, op1Screen header 744), widget `CUSTODY_CONFIRMED_LIST` (child 745).
**Referensi:** config live child 745 (baca bawah).

---

## 1. Kenapa
Di layar closing (gudang tutup mobil), `CUSTODY_CONFIRMED_LIST` cuma nampilin per item **kondisi isi/kosong** (mis. "isi 5, kosong 0"). User mau **badge per item yang nandain drop (antar) / pickup (ambil)** dari hasil delivery driver.

## 2. Kenapa sekarang gak keliatan (akar)
Config live:
```json
{"type":"CUSTODY_CONFIRMED_LIST","table":"84214220504259//vehicle_check",
 "search":"cty◼closing⭘vv◼{activeVehicle}⭘cdt◼{today}","actualField":"ip",
 "joinTable":"84214220504259//item","text":"Yang Diterima◆returnable◆consumable◆…"}
```
Sumber = **`vehicle_check` closing recount** (field `ip`) = **hitung-ulang fisik gudang** pas barang balik. Recount cuma tau **kondisi (isi/kosong)**, BUKAN arah gerakan.
- **Drop** = galon diantar → **turun di customer → GAK ADA di truk pas closing** (gak bisa di-badge dari recount).
- Yang nyampe balik ke truk cuma: **kosong** (hasil pickup) + **isi sisa** (gak jadi antar).

**Drop/pickup asli** = ada di **`task.it[]`** per tugas: `ad` (actual drop/antar), `ap` (actual pickup/ambil). Di-agregat se-trip (`search: tr◼{activeTrip}` atau `vv◼{vehicleId}⭘tdt◼{today}`). Badge WAJIB tarik dari sini, bukan `ip`.

## 3. Badge shape — DECIDED opsi X (user 2026-08-11)
1 item bisa **drop DAN pickup** di hari yang sama (antar 5 isi + ambil 5 kosong). Badge = **opsi X**:
- **2 badge kecil per item** — `Antar {Σad}` + `Ambil {Σap}`.
- **Sembunyiin yang 0** — item drop-only cuma badge Antar; pickup-only cuma Ambil; dua-duanya = dua badge.

## 3b. ⚠️ LANJUTAN 2026-08-12 — badge sudah jalan, tapi daftarnya membingungkan
> **➡️ DIPINDAH.** Permintaan ke dev untuk bagian ini sudah digabung ke **`docs/sisa-perbaikan-tampilan-dev-spec.md` §2** (satu dokumen berisi semua sisa perbaikan tampilan). Bagian di bawah disimpan sebagai riwayat.

Badge Antar/Ambil sudah tampil (dev sudah bangun `flow*`). Masalah baru dari uji lapangan:

```
Yang Diterima                                    2 item
✓ Amidis Galon 19 Liter [returnable] [↑ Antar 5] [↓ Ambil 5]     0
✓ Amidis Galon 19 Liter [returnable]                              5
```

**Sebabnya:** `ip` (hitungan closing) itu keyed per **item + kondisi**, jadi satu jenis barang muncul dua baris — baris Penuh (0) dan baris Kosong (5). Tapi **kondisinya tidak ditampilkan**, sehingga terbaca seperti baris duplikat. Ikutannya: counter "2 item" menyesatkan (barangnya 1 jenis), dan badge Antar/Ambil hanya menempel di salah satu baris.

**Keputusan (user 2026-08-12, kriteria: harus dimengerti petugas gudang yang gaptek): gabungkan menjadi 1 baris per item.**

Target tampilan:
```
Yang Diterima                        1 item
✓ Amidis Galon 19 Liter  [returnable]
    Penuh 0 · Kosong 5
    ↑ Antar 5    ↓ Ambil 5
```

Alasan: satu jenis barang = satu baris (nama kembar adalah sumber bingung utama); angka diberi nama (`Penuh 0 · Kosong 5`) bukan angka telanjang; counter jadi benar. Istilah **Penuh/Kosong** dipakai karena sudah dipakai di layar driver — jangan buat kosakata baru.

### 3b.1 Parameter tambahan
| field | isi | fungsi |
|---|---|---|
| `groupByItem` | `TRUE` | gabungkan baris `ip` dengan `ii` yang sama menjadi satu baris; counter menghitung item unik |
| `condField` | `cd` | field kondisi pada baris `ip` |
| `condLabels` | `full◼Penuh⭘empty◼Kosong` | peta nilai kondisi → label tampil |
| `condText` | `Penuh◆Kosong` | (alternatif, kalau dev lebih suka ◆-segment seperti `text` lain) |

Untuk item **consumable** (tanpa kondisi): tampilkan angkanya saja, tanpa rincian Penuh/Kosong.

## 4. Kontrak parameter (renderer)
Tambah ke `CUSTODY_CONFIRMED_LIST` (opsional, absent = perilaku sekarang):

| field | fungsi | contoh |
|---|---|---|
| `flowTable` | table sumber gerakan hari itu | `84214220504259//task` |
| `flowSearch` | filter trip/mobil hari itu | `vv◼{activeVehicle}⭘tdt◼{today}` (exclude `load_rejected`) |
| `flowItemsField` | array item di task | `it` |
| `flowKeyField` | key item buat join ke baris list | `ii` (atau `in`) |
| `dropField` | field antar aktual per item | `ad` |
| `pickupField` | field ambil aktual per item | `ap` |
| `flowText` | label badge (◆-seg): `Antar◆Ambil` | `Antar◆Ambil` |

Renderer: per item di list, agregat `Σad`/`Σap` dari `flowTable` (match key) → render badge sesuai §3.

- Semua plain-string → aman config-ahead (no-op sampe renderer honor).
- Consumable (jual/beli) opsional ikut: `as`(jual)/`ab`(beli) — bahas kalo user mau.

## 5. Deliverable
| Bagian | Siapa | Status |
|---|---|---|
| Klarifikasi badge X vs Y (§3) | user | ✅ opsi X (2 badge, sembunyiin 0) |
| `CUSTODY_CONFIRMED_LIST` honor `flow*`/`dropField`/`pickupField` → badge drop/pickup dari agregat task | dev Flutter | ⬜ |
| Template `custodyConfirmedListFlow` (Widget 317, unwired) | builder | ✅ 2026-08-11 |
| Wire @WarehouseClosingMatch(B745→custodyConfirmedListFlow) + helper | builder (nyusul, pasca-renderer) | ⬜ |

## 6. Not Doing
- Nurunin drop/pickup dari kondisi isi/kosong (recount) — DITOLAK (gak akurat; user mau data delivery asli).
- Nampilin drop di recount closing — mustahil (barang drop udah turun, gak di truk).
- Ubah sumber utama widget (`ip` recount) — enggak, badge = LAPISAN tambahan dari `task`.

## 7. Acceptance
- [ ] `flow*` absent → CUSTODY_CONFIRMED_LIST perilaku sekarang (isi/kosong doang). Backward-compat.
- [ ] `flow*` diisi → per item muncul badge drop/pickup dari agregat `task.ad`/`ap` se-trip.
- [ ] Item drop-only → badge antar aja; pickup-only → ambil aja; dua-duanya → dua badge (opsi X).
- [ ] Angka badge = Σ dari task hari itu (exclude `load_rejected`), cocok sama gerakan driver.

---
**Referensi:** `CUSTODY_CONFIRMED_LIST`@WarehouseClosingMatch(744/745) · `task.it[]` `ad`/`ap` · `ITEM_EXECUTION_LIST`@DeliveryWorkspace(683) (sumber drop/pickup aktual driver).
