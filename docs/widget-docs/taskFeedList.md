# TASK_FEED_LIST (`taskFeedList`)

**Status:** LIVE di app (daftar tugas rute — driver runtime P10)
**Dev spec:** ADA — `docs/driver-task-feed-p10-dev-spec.md` (+ customer-namelist)
**Widget tab:** row 225

## Buat apa

Daftar tugas antar untuk driver, bisa dikelompokkan (mis. per status/waktu), tiap tugas tampil tujuan + rincian drop/pickup + tombol ke workspace. Ada gerbang tombol "kembalikan kendaraan" saat semua tugas selesai.

## Tampilan

```
┌─ Tugas Hari Ini ───────────────────┐
│ ▸ Belum dikerjakan                 │  ← groupField
│   Toko Budi · Jl. Merdeka 5        │
│   Drop 12 · Pickup 4     [ Kerjakan]│
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_FEED_LIST","vidtable":"20342033315492","table":"84214220504259//task","search":"vv◼{vehicleId}⭘tdt◼{today}","groupField":"tst","idField":"tnm","titleField":"kn","addressField":"al","typeField":"tty","itemsField":"it","dropField":"dp","pickupField":"pu","actualDropField":"adp","actualPickupField":"apu","route":"vertikaTeknoLokaciptaDeliveryWorkspace","returnGateTable":"84214220504259//task","returnGateSearch":"vv◼{vehicleId}⭘tst◼assigned","returnRoute":"vertikaTeknoLokaciptaReturnVehicle","text":"Tugas Hari Ini◆Belum ada tugas◆Kerjakan◆Kembalikan Kendaraan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_FEED_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data tugas + filter | `vv◼{vehicleId}⭘tdt◼{today}` |
| `groupField` | Opsional | Field pengelompok (kosong = daftar rata) | `tst` |
| `idField` / `titleField` / `addressField` / `typeField` | Wajib | Field id / judul / alamat / jenis | `tnm` / `kn` / `al` / `tty` |
| `itemsField` + `dropField`/`pickupField`/`actualDropField`/`actualPickupField` | Wajib | Field item + drop/pickup rencana & aktual | `it`, `dp`/`adp`, … |
| `route` | Wajib | Halaman kerja saat tugas di-tap | `…DeliveryWorkspace` |
| `returnGateTable` / `returnGateSearch` / `returnRoute` | Opsional | Gerbang + tujuan tombol kembalikan kendaraan | `…ReturnVehicle` |
| `text` | Wajib | Judul + teks kosong + label tombol (dipisah `◆`) | lihat contoh |

## Posisi field gabungan

`text` dipisah `◆` (judul / teks kosong / label kerjakan / label kembalikan). `groupField` kosong → daftar rata (tanpa grup).

## Tips & catatan

- `groupField` opsional — kalau kosong, daftar tampil rata (dipakai juga untuk daftar customer flat).
- Tombol "Kembalikan Kendaraan" muncul lewat gerbang `returnGate…` (mis. saat tidak ada tugas tersisa).
- Versi rata = `taskFeedListFlat` (247). Spec: `docs/driver-task-feed-p10-dev-spec.md`.
