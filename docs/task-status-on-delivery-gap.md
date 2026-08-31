# Status task `tst` — `assigned` vs `on_delivery`: siapa nulis, siapa baca, dan celahnya

**Tanggal:** 2026-08-11 · **Proxy:** `18v3w5YJ…` tab `op1Screen` · **Tenant:** `20342033315492`, coll `84214220504259//task`
**Tujuan dokumen:** buat ditanyakan ke sesi/orang yang dulu membuat config `on_delivery` — apakah itu memang rencana yang belum kelar, atau salah tulis.

---

## 1. Temuan inti

Cek data Firestore (collection `task`, field `tst`): nilai yang benar-benar ada hanya
**`unassigned` · `assigned` · `completed`**. **`on_delivery` tidak pernah ada.**

Cek seluruh config `op1Screen`: string `on_delivery` **hanya muncul di sisi BACA (2 tempat)**, dan **tidak ada satu pun yang MENULIS**-nya.

Artinya alur status yang tersirat di config — `unassigned → assigned → on_delivery → completed` — **putus di tengah**: tidak ada yang menaikkan `assigned → on_delivery`, jadi task loncat langsung `assigned → completed`.

---

## 2. `assigned` — lengkap (verified)

### 2.1 Yang MENULIS (2 tempat, dua-duanya aksi admin "Tugaskan")

| Layar | Sel | DSL |
|---|---|---|
| **AdminHome** — card "Perlu Dikerjain" → tombol **Tugaskan** (`COORDINATION_SIGNAL_LIST`) | `D759` | `updateEventRow: …//task⭘search◼tnm★{taskVid}⭘vv◼{vehicleId}⭘tst◼assigned` |
| **AssignConfirm** — tombol "Tugaskan ke Kendaraan Ini →" (jalur Daftar Tugas) | `D1190` | `updateEventRow: …//task⭘search◼tnm★{taskVid}⭘vv◼{assignVeh}⭘ln◼{vehiclePlate}⭘tdt◼{today}⭘tst◼assigned` |

### 2.2 Yang MEMBACA

| Baris | Widget | Layar | Dipakai untuk |
|---|---|---|---|
| `722` | `TASK_MANIFEST_LIST` | WarehouseOpeningCheck | manifest muat: `search vv◼{activeVehicle}⭘tdt◼{today}⭘tst◼assigned` |
| `725`, `727` | `custodyCountListWarehouse` | WarehouseOpeningCheck | daftar hitung barang gudang |
| `766` | `UPCOMING_TASK_LIST` | AdminHome | section **"Akan Datang"**: `search tst◼assigned⭘tdt◼{today}` |
| `790` | `PICKER_LIST` | CreateTaskVehicle | badge jumlah: `countSearch vv◼{lv}⭘tst◼assigned` → "N tugas aktif" |
| `1175`, `1177` | `LIST_CARD` | AdminTaskList | grup daftar tugas |

**Kesimpulan: `assigned` sehat** — ada yang nulis, ada yang baca, cocok.

---

## 3. `on_delivery` — hanya dibaca, tidak pernah ditulis

| Baris | Widget | Layar | Config | Akibat karena nilainya tidak pernah ada |
|---|---|---|---|---|
| `763` | `RUNNING_TASK_LIST` | AdminHome | `search: "tst◼on_delivery"` | **Section "Berjalan" tidak akan pernah terisi** — selalu kosong |
| `790` | `PICKER_LIST` | CreateTaskVehicle | `statusSearch: "vv◼{lv}⭘tst◼on_delivery"` + `statusOnLabel:"Lagi Jalan"` + `statusOffLabel:"Nganggur"` | **Badge "Lagi Jalan"/"Nganggur" tidak pernah muncul** |

Catatan penting soal baris `790`: penjagaan di CreateTaskVehicle **tetap bekerja dengan benar** — tapi bukan dari `statusSearch` ini, melainkan dari **`busySelfField:"dv"` + `busySelfLabelField:"dn"`** (mobil yang `stock_location.dv`-nya terisi = sedang dipegang sopir → tidak bisa dipilih). Jadi yang mati hanya badge status, bukan penjagaannya.

---

## 4. Pertanyaan untuk pembuat config `on_delivery`

1. **`on_delivery` itu memang direncanakan?** Kalau ya, siapa yang seharusnya menulisnya — app Flutter saat driver menekan "Mulai Antar" (`DRIVER_STOP_CARD`@DriverHome), atau Cloud Function? Sampai sekarang tidak ada satu pun di config.
2. Kalau **tidak** direncanakan / salah tulis: dua config di §3 perlu diarahkan ke sinyal lain. Kandidat yang sudah terbukti ada datanya:
   - `stock_location.dv` terisi = mobil sedang dipegang sopir (dipakai `busySelfField` yang sudah jalan), atau
   - `vehicle_check`: `cty=opening` + `cst=custody_confirmed` + `rt=pending` = trip terbuka, driver sudah terima muatan, belum diserahkan balik.
3. **`RUNNING_TASK_LIST` (section "Berjalan") ini masih dipakai/diinginkan?** Kalau ya perlu diperbaiki; kalau tidak, sebaiknya di-`Displayed FALSE` supaya tidak jadi kolom kosong yang membingungkan.

---

## 5. Aturan yang berlaku sejak sekarang

**Jangan memakai `tst◼on_delivery` di config baru mana pun** sampai §4 diputuskan. Config lama yang sudah live BUKAN bukti bahwa nilainya valid — dua contoh di §3 sudah live lama tapi tidak pernah bekerja.

---

**Referensi sel:** `D759` · `D1190` (write) · `D722` `D725` `D727` `D766` `D790` `D1175` `D1177` (read `assigned`) · `D763` `D790` (read `on_delivery`).
