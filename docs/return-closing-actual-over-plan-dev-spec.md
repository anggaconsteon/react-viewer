# Layar Return/Closing — angka wajib `actual ?? plan`, bukan plan (Dev Spec)

**Tanggal:** 2026-07-31
**Buat:** dev Flutter (renderer). Nol kerjaan sheet/CF.
**Status:** PROPOSED
**Konteks:** live QA demo galon VTL 2026-07-31 — trip drop 2 / pickup plan 4 / **actual pickup 2**.

## 1. Kenapa

Di layar sirkulasi pas **return ke gudang** dan **closing (sebelum & sesudah submit)**, angka pickup masih tampil **4** (plan `pp`) padahal driver submit actual **2** (`ap`). Data akhir BENAR (asset_cache gudang 42/26, customer 2) karena CF `task_complete.qtFor` sudah pakai `actual ?? plan` — yang salah cuma tampilan.

## 2. Kontrak

Semua tampilan qty yang diturunkan dari `task.it[]` SETELAH task tereksekusi wajib pakai aturan yang sama dengan CF:

```
qty tampil = actual jika field actual ADA (termasuk 0) — kalau absen/null, fallback plan
  drop   : ad ?? pd      pickup : ap ?? pp
  sale   : as ?? ps      buy    : ab ?? pb      refill : ar ?? pr
```

Catatan penting: `ap: 0` = actual nol (tampilkan 0), BUKAN "kosong → pakai plan". Cek presence, bukan truthiness — sama seperti `intFieldSet` di CF.

Layar yang kena (audit semua konsumen `it[]`): sirkulasi/ekspektasi di ReturnVehicle, closing check gudang (angka "harusnya turun"), ringkasan sesudah submit closing. Layar SEBELUM eksekusi (order, custody) tetap plan — memang belum ada actual.

## 11. Acceptance

- [ ] Kasus §1: layar return + closing tampil pickup **2**, bukan 4.
- [ ] Actual 0 tampil 0 (tidak fallback ke plan).
- [ ] Layar pra-eksekusi tetap plan (nol regresi).
