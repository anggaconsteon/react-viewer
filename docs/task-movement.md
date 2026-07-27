# Contoh Data Task & Movement

## Task (di dalam `it[]`)

Sekarang (live, deliver):
```json
{ "ii":"8886008101138", "in":"Aqua Galon 19 Liter", "cdo":"full", "cdi":"empty", "pd":5, "pp":5, "ad":null, "ap":null }
```

Nanti, deliver eksplisit (cuma tambah `tx`, perilaku sama):
```json
{ "ii":"8886008101138", "in":"Aqua Galon 19 Liter", "tx":"deliver", "cdo":"full", "cdi":"empty", "pd":5, "pp":5, "ad":null, "ap":null }
```

Jual (tanpa pickup, pakai `ps`/`as`):
```json
{ "ii":"8886008101138", "in":"Aqua Galon 19 Liter", "tx":"sale", "cdo":"full", "ps":5, "as":null }
```

Beli (masuk mobil, pakai `pb`/`ab`):
```json
{ "ii":"8886012560310", "in":"Amidis Galon 19 Liter", "tx":"purchase", "cdi":"empty", "pb":4, "ab":null }
```

Tukar/refill (pakai `pr`/`ar` + `wt`):
```json
{ "ii":"9990019000019", "in":"Pristine Galon RO 19 Liter", "tx":"refill", "wt":"ro", "pr":2, "ar":null }
```

Satu task bisa campur (Honda Bintaro, mobil B 1234 XY):
```json
{
  "tnm":"TASK-20260619-101", "tty":"delivery", "tst":"assigned",
  "kl":"F62793a15928ca", "kn":"Honda Bintaro", "vv":"F621a02a983500", "tdt":1782320400000,
  "it":[
    { "ii":"2000000000123", "in":"LPG 12kg",             "tx":"deliver",  "cdo":"full", "cdi":"empty", "pd":3, "pp":3, "ad":null, "ap":null },
    { "ii":"8886008101138", "in":"Aqua Galon 19 Liter",  "tx":"sale",     "cdo":"full", "ps":5, "as":null },
    { "ii":"8886012560310", "in":"Amidis Galon 19 Liter","tx":"purchase", "cdi":"empty", "pb":4, "ab":null },
    { "ii":"9990019000019", "in":"Pristine Galon RO 19 Liter","tx":"refill","wt":"ro", "pr":2, "ar":null }
  ]
}
```

---

## Movement (catatan barang pindah)

Dari task di atas, pas dikerjakan, jadi baris-baris movement ini.

Deliver (LPG 12kg) jadi 2 baris:
```json
{ "mt":"DROP",   "fl":"F621a02a983500", "tl":"F62793a15928ca", "ii":"2000000000123", "cd":"full",  "qt":3, "dv":"87544551624342", "dn":"Budi Santoso", "mrf":"TASK-20260619-101" }
{ "mt":"PICKUP", "fl":"F62793a15928ca", "tl":"F621a02a983500", "ii":"2000000000123", "cd":"empty", "qt":3, "dv":"87544551624342", "dn":"Budi Santoso", "mrf":"TASK-20260619-101" }
```

Jual (Aqua), keluar sistem (`tl` null):
```json
{ "mt":"SALE", "fl":"F621a02a983500", "tl":null, "ii":"8886008101138", "cd":"full", "qt":5, "dv":"87544551624342", "dn":"Budi Santoso", "mrf":"TASK-20260619-101" }
```

Beli (Amidis), naik ke mobil:
```json
{ "mt":"PURCHASE", "fl":"F62793a15928ca", "tl":"F621a02a983500", "ii":"8886012560310", "cd":"empty", "qt":4, "dv":"87544551624342", "dn":"Budi Santoso", "mrf":"TASK-20260619-101" }
```

Tukar (Pristine), 1 baris (`cd` diabaikan, sistem hitung isi keluar + kosong masuk):
```json
{ "mt":"REFILL", "fl":"F621a02a983500", "tl":"F62793a15928ca", "ii":"9990019000019", "qt":2, "dv":"87544551624342", "dn":"Budi Santoso", "mrf":"TASK-20260619-101" }
```

---

## Dictionary

### Task
| kode | arti |
|---|---|
| `tnm` | nomor task |
| `tty` | jenis task (delivery / pickup_return) |
| `tst` | status (assigned, completed, load_rejected, dll) |
| `kl` | kode lokasi customer |
| `kn` | nama customer |
| `al` | alamat |
| `gl` | gudang asal |
| `vv` | mobil |
| `cv` / `cn` | pembuat task (admin): kode / nama |
| `tdt` | tanggal kirim |
| `it` | daftar barang |
| `tce` | waktu selesai |

### Barang (`it[]`)
| kode | arti |
|---|---|
| `ii` | kode barang (seperti barcode), sama di mana-mana |
| `in` | nama barang (ditulis ulang biar gampang dibaca) |
| `tx` | jenis transaksi: deliver / sale / purchase / refill (kosong = deliver) |
| `cdo` | kondisi waktu keluar (full / empty) |
| `cdi` | kondisi waktu balik (full / empty / null) |
| `pd` / `ad` | antar: rencana / aktual |
| `pp` / `ap` | ambil: rencana / aktual |
| `ps` / `as` | jual: rencana / aktual |
| `pb` / `ab` | beli: rencana / aktual |
| `pr` / `ar` | tukar: rencana / aktual |
| `wt` | jenis air galon refill (ro / refill) |

### Movement
| kode | arti |
|---|---|
| `mt` | jenis pindah (DROP / PICKUP / SALE / PURCHASE / REFILL / dll) |
| `fl` | dari lokasi |
| `tl` | ke lokasi (null = keluar sistem, misal terjual) |
| `ii` | kode barang |
| `cd` | kondisi yang pindah (full / empty) |
| `qt` | jumlah (selalu positif) |
| `dv` / `dn` | yang mencatat (driver; kalau walk-in = admin/kasir) |
| `mrf` | nomor task terkait |
| `t` / `ts` | waktu kejadian (angka / tulisan) |
| `et` | waktu masuk server |
| `er` | dari app mana (DRIVER / VEHICLE / SUPERVISOR / ADMIN) |
| `d` | catatan |

---

## Asset cache bulanan (rekap per bulan)

Rekap stok per bulan, per lokasi, per barang, per kondisi.
ID dokumennya gabungan: `{lokasi}__{barang}__{kondisi}__{YYYYMM}`.

Yang disimpan cuma angka per bulan: masuk (`qi`), keluar (`qo`), dan selisihnya (`qn`). Kodenya pakai singkatan ala dictionary, dicek gak nabrak kode lain (`in` udah kepakai buat nama barang, jadi "masuk" jadi `qi`). Saldo awal dan saldo akhir **tidak disimpan**, dihitung waktu dibaca dengan menjumlahkan `qn` bulan-bulan sebelumnya. Jadi "lanjut dari sisa bulan lalu" terjadi sendiri, dan kalau ada movement yang dicatat mundur ke bulan lalu, cukup dokumen bulan itu yang berubah. Bulan-bulan setelahnya ikut benar tanpa ditulis ulang.

Contoh, satu barang di satu toko selama dua bulan:
```json
// Aqua Galon, toko Bintaro, Mei 2026: masuk 15, keluar 5, selisih +10
{ "lv":"F62toko0099bee", "ii":"8886008101138", "cd":"full", "prd":"202605", "qi":15, "qo":5, "qn":10, "t":1780300000000 }

// Juni 2026: masuk 9, keluar 7, selisih +2
{ "lv":"F62toko0099bee", "ii":"8886008101138", "cd":"full", "prd":"202606", "qi":9, "qo":7, "qn":2, "t":1782900000000 }
```

Saldo akhir Mei = 0 + 10 = 10. Itu jadi saldo awal Juni. Saldo akhir Juni = 10 + 2 = 12, dan seterusnya buat Juli.

Rumusnya:
```
saldo akhir bulan ini = saldo akhir bulan lalu + qn bulan ini
saldo awal  bulan ini = saldo akhir bulan lalu
```

Bulan diambil dari `ts` (waktu lokal yang dicatat user), bukan dari `t` (epoch), supaya bulannya ikut waktu setempat tanpa hitung zona waktu.

Dictionary:
| kode | arti |
|---|---|
| (doc id) | `{lv}__{ii}__{cd}__{YYYYMM}` = lokasi + barang + kondisi + bulan |
| `lv` | lokasi (toko / gudang / mobil) |
| `ii` | kode barang |
| `cd` | kondisi (full / empty) |
| `prd` | bulan, `"YYYYMM"` (mis. `"202606"`) |
| `qi` | total masuk bulan itu |
| `qo` | total keluar bulan itu |
| `qn` | `qi - qo`, perubahan bersih bulan itu (bisa negatif) |
| `t` | waktu update terakhir |
