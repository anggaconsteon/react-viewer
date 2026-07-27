# ROUTE_FEED_HEADER (`routeFeedHeader`)

**Status:** LIVE di app (header feed rute — driver runtime P10)
**Dev spec:** ADA — `docs/driver-task-feed-p10-dev-spec.md`
**Widget tab:** row 224

## Buat apa

Header untuk halaman daftar tugas rute (task feed): nama driver + plat kendaraan + ringkasan drop/pickup rencana vs aktual. Dipakai di atas daftar tugas antar.

## Tampilan

```
┌────────────────────────────────────┐
│ 👤 Budi   🚚 B 1234 XYZ            │
│ Drop 40 (35) · Pickup 30 (28)      │  ← rencana (aktual)
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"ROUTE_FEED_HEADER","vidtable":"20342033315492","workforceTable":"84214220504259//workforce","workforceSearch":"VID◼{driverVid}","nameField":"n","vehicleTable":"84214220504259//stock_location","vehicleSearch":"lv◼{vehicleId}","plateField":"ln","taskTable":"84214220504259//task","taskSearch":"vv◼{vehicleId}⭘tdt◼{today}","stateField":"tst","itemsField":"it","dropField":"dp","pickupField":"pu","actualDropField":"adp","actualPickupField":"apu","backRoute":"vertikaTeknoLokaciptaDriverHome","text":"Rute Hari Ini"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `ROUTE_FEED_HEADER` | — |
| `vidtable` | otomatis (baked) | ID koneksi tenant | `20342033315492` |
| `workforceTable` / `workforceSearch` / `nameField` | Wajib | Sumber & field nama driver | `VID◼{driverVid}` / `n` |
| `vehicleTable` / `vehicleSearch` / `plateField` | Wajib | Sumber & field plat kendaraan | `lv◼{vehicleId}` / `ln` |
| `taskTable` / `taskSearch` | Wajib | Sumber tugas (hitung ringkasan) | `vv◼{vehicleId}⭘tdt◼{today}` |
| `stateField` | Opsional | Field status tugas | `tst` |
| `itemsField` + `dropField`/`pickupField`/`actualDropField`/`actualPickupField` | Wajib | Field item + drop/pickup rencana & aktual | `it`, `dp`/`adp`, … |
| `backRoute` | Wajib | Halaman tujuan tombol kembali | `…DriverHome` |
| `text` | Wajib | Judul header | `Rute Hari Ini` |

## Posisi field gabungan

`text` = judul (segmen `◆` bila ada). Angka ringkasan dihitung sistem dari `taskTable`.

## Tips & catatan

- Header untuk `taskFeedList` (225) di halaman task feed.
- Spec: `docs/driver-task-feed-p10-dev-spec.md`.
