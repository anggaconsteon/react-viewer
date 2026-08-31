# Guard: kendaraan terkunci sesudah gudang submit cek berangkat (Dev Spec)

> ## ✅ SELESAI & TERUJI — 2026-08-12
> Ketiga pintu sudah diuji user dan berperilaku benar: **AdminHome "Tugaskan"**, **Daftar Tugas → AssignVehicle**, dan **Buat Order → CreateTaskVehicle**. Dokumen disimpan sebagai referensi aturan dan riwayat keputusan.

**Untuk:** dev Flutter · **Tanggal:** 2026-08-11 (rev5 — aturan diseragamkan) · **Tenant:** `20342033315492`, coll `84214220504259`

---

## 1. Aturan (satu, berlaku di semua picker)

> **Begitu gudang submit cek berangkat untuk sebuah kendaraan, kendaraan itu TIDAK BISA DIPILIH lagi — sampai diserahkan balik ke gudang.**

### Kenapa titik potongnya di situ
Order yang ditambahkan **sesudah** gudang submit **tidak ikut tertulis ke muatan** (`ie`), sehingga **tidak muncul di layar cek barang driver**. Akibatnya barang order itu tidak pernah naik ke mobil, tapi tasknya ikut jalan → `asset_cache` kendaraan bisa minus dan hitungan closing gudang jadi selisih. (Dikonfirmasi user 2026-08-11 dari perilaku lapangan.)

### Perjalanan satu trip

| Tahap | Doc `vehicle_check` | Kendaraan bisa dipilih? |
|---|---|---|
| Gudang tunjuk sopir, belum submit cek berangkat | belum ada | ✅ **boleh** — barang masih bisa ikut dimuat |
| **Gudang submit cek berangkat** (`ie` ditulis) | `cty=opening`, `rt=pending` | ❌ **terkunci** |
| Driver konfirmasi → berangkat | `cty=opening`, `rt=pending` | ❌ terkunci |
| Driver serahkan mobil ke gudang | `rt=returned` | ✅ boleh lagi |

---

## 2. Sinyal — pakai `dv` (jalan sekarang), `vehicle_check` sebagai cadangan

**Temuan 2026-08-11 (dari config, bukan dugaan):** `stock_location.dv` **ditulis persis saat gudang submit cek berangkat** — bukan saat sopir ditunjuk.
- `CUSTODY_COUNT_SUBMIT`@WarehouseOpeningCheck (`op1Screen!D729`): `updateEventRow: …//stock_location⭘search◼lv★{activeVehicle}⭘dv◼{chosenVid}⭘dn◼{chosenName}`
- `executor_designate_card`@720 (kartu "Pilih Sopir") hanya **membaca** `dv` (`busyTable`/`busyField`), tidak menulis.

Artinya **`dv` terisi ⟺ gudang sudah submit** = persis titik potong di §1. Jadi:

### 2A. Cara yang sudah bekerja — `busySelfField` (PRIORITAS)
`PICKER_LIST`@CreateTaskVehicle sudah men-disable dengan benar memakai:
```
"busySelfField":"dv","busySelfLabelField":"dn"
```
Renderer sudah mendukungnya. **Permintaan utama: dukung 2 field yang sama di `LIST_CARD` dan di picker native AdminHome** (`busySelfField` / `busySelfLabelField`, + flag disable kalau perlu). Ini jauh lebih ringan daripada query silang — satu tabel, tanpa `{lv}` cross-table.

> Catatan atas feedback dev sebelumnya: keberatan "`dv` mencakup kendaraan yang masih muat sehingga alur gabung-trip mati" **sudah tidak berlaku** — user memutuskan alur gabung-trip memang dihentikan (§1), karena order yang masuk sesudah gudang submit tidak ikut tertulis ke muatan.

### 2B. Cadangan — query `vehicle_check`
Kalau `busySelfField` tidak bisa dipakai di widget tertentu, sinyal setara lewat query silang:

```
tabel  : 84214220504259//vehicle_check
search : vv◼{lv}⭘cty◼opening⭘cdt◼{today}⭘rt◼pending
```
Match ≥1 doc → **label "Lagi Jalan" + tidak bisa dipilih**.

- `cty◼opening` + `cdt◼{today}` — cek berangkat hari ini.
- **`rt◼pending` wajib.** Saat driver serahkan mobil, submit ReturnVehicle hanya membalik `rt → returned` (`cst` tidak pernah di-reset). Tanpa segmen ini kendaraan terkunci selamanya sesudah trip pertama.
- **Tidak memakai `cst`** — sengaja. Kunci dimulai sejak gudang submit, bukan sejak driver konfirmasi.
- **Tidak memakai `dv`** — `dv` sudah terisi sejak sopir ditunjuk, padahal saat itu barang masih bisa ikut dimuat.
- `vv` di `vehicle_check` berisi **vehicle key** (sama dengan `lv`/`kd` di `stock_location`) → token `{lv}` tepat, harus di-resolve per-baris.

---

## 3. Tiga picker yang harus ikut aturan ini

| # | Layar | Widget | Yang perlu dibangun |
|---|---|---|---|
| **A** | AdminHome — "Tugaskan" & "+ Tugaskan Kendaraan" | `COORDINATION_SIGNAL_LIST` · `UPCOMING_TASK_LIST` → bottom sheet **native** | honor `assignBusyTable` / `assignBusySearch` / `assignBusyLabel`, teruskan ke picker native |
| **B** | Daftar Tugas → AssignVehicle | `LIST_CARD` | honor `statusTable` / `statusSearch` / `statusOnLabel` / `statusOffLabel` / `disableWhenStatusOn` |
| **C** | Buat Order langkah 3 (CreateTaskVehicle) | `PICKER_LIST` | honor **`statusTable`** (baru) + **`disableWhenStatusOn`** (baru). `statusSearch` sudah ada tapi selama ini hanya untuk badge — sekarang harus bisa men-disable |

Semua field opsional: absent → perilaku lama, tanpa regresi.

### 3.1 ⚠️ Picker C sementara TANPA penjagaan sampai renderer siap
`PICKER_LIST`@CreateTaskVehicle dulu men-disable lewat **`busySelfField:"dv"`**. Nilai itu **sudah dikosongkan** (`busySelfField:""`, `busySelfLabelField:""`) supaya aturannya benar-benar satu — kendaraan yang sopirnya sudah ditunjuk tapi **belum** dimuat harus tetap bisa dipilih, dan `dv` tidak bisa membedakan itu.

**Konsekuensi sampai renderer honor `statusTable` + `disableWhenStatusOn`: picker C tidak memblokir apa pun.** Ini disetujui user (dev sedang develop). Tolong prioritaskan picker C supaya jendela tanpa penjagaan sependek mungkin.

---

## 4. Config (terpasang di proxy `18v3w5YJ…`)

| Sel | Isi |
|---|---|
| `AK759` · `W766` · `AC1184` · `P790` | `vv◼{lv}⭘cty◼opening⭘cdt◼{today}⭘rt◼pending` |
| `AL759` · `V766` · `AB1184` · `AE790` | `84214220504259//vehicle_check` |
| `AM759` · `X766` · `AD1184` | `Lagi Jalan` |
| `AE1184` | `Nganggur` · `AF1184` `TRUE` · `AF790` `TRUE` |
| `B1184` | `listCardGuarded` |
| `Widget!J233` · `J240` | +3 placeholder `assignBusy*` |
| `Widget!J248` (`pickerList`) | +`statusTable` +`disableWhenStatusOn` (kedua usage — 790 & 862 — sudah di-extend; 862 diisi kosong) |
| `Widget!J316` (`listCardGuarded`) | +5 placeholder `status*` |
| `I1183` | teks NOTICE_BAR@AssignVehicle diganti — janji lama "tugas ikut jalan berikutnya" sudah tidak berlaku |

Jangan sentuh `B757` / `E759` / `E766` (formula turunan). Untuk prod (`1hdcFg4…`): pasang **sesudah renderer live**.

---

## 5. Acceptance

- [ ] Kendaraan yang gudang **belum** submit cek berangkat → **bisa dipilih** (walau sopirnya sudah ditunjuk).
- [ ] Kendaraan yang cek berangkatnya **sudah** disubmit gudang → **tidak bisa dipilih** + label "Lagi Jalan" — walaupun driver belum konfirmasi.
- [ ] Kendaraan yang sudah diserahkan balik ke gudang → **bisa dipilih lagi** (tidak terkunci permanen).
- [ ] Perilaku **identik** di tiga picker (A, B, C) — tidak ada layar yang aturannya beda.
- [ ] Baris kendaraan terkunci **tidak bisa di-tap sama sekali**, bukan sekadar diberi label — supaya tidak pernah sampai ke submit.
- [ ] Field absent → perilaku lama, tanpa regresi.

---

**Referensi sel:** `COORDINATION_SIGNAL_LIST`@759 · `UPCOMING_TASK_LIST`@766 · `PICKER_LIST`@790 (+@862 picker tugas, guard dikosongkan) · `LIST_CARD`@1184 · NOTICE_BAR@1183 · submit AssignConfirm@1190 · submit ReturnVehicle@J696.
