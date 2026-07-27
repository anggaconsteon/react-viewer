# UPCOMING_TASK_LIST (`upcomingTaskList`)

**Status:** LIVE di app (daftar tugas akan datang + assign — beranda admin)
**Dev spec:** ADA — `docs/admin-home-dev-spec.md` §5.2
**Widget tab:** row 240

## Buat apa

Daftar tugas yang **akan datang / terjadwal** tapi belum diassign, dengan tombol **assign** (buka bottom-sheet pilih kendaraan) yang muncul kondisional. Dipakai admin untuk menugaskan tugas mendatang.

## Tampilan

```
┌─ Akan Datang ──────────────────────┐
│ Toko Budi · besok 08:00            │
│ 12 galon drop          [ Assign ]  │  ← assign muncul kondisional
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"UPCOMING_TASK_LIST","vidtable":"20342033315492","table":"84214220504259//task","search":"tst◼unassigned⭘tdt◼{today}","titleField":"kn","schedField":"sdt","summaryField":"sum","assignField":"vv","plateField":"ln","vehicleTable":"84214220504259//stock_location","vehicleNameField":"ln","assignSheet":"","assignText":"Assign","emptyText":"Tidak ada tugas akan datang","updateEventRow":"84214220504259//task⭘tablevid◼20342033315492⭘search◼tnm★{tnm}⭘vv◼◁1▷⭘tst◼assigned","text":"Akan Datang"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `UPCOMING_TASK_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber tugas belum diassign | `tst◼unassigned⭘tdt◼{today}` |
| `titleField` / `schedField` / `summaryField` | Wajib | Field judul / jadwal / ringkasan | `kn` / `sdt` / `sum` |
| `assignField` / `plateField` | Wajib | Field tujuan assign (kendaraan) + plat | `vv` / `ln` |
| `vehicleTable` / `vehicleNameField` | Opsional | Sumber kendaraan untuk sheet assign | `stock_location` / `ln` |
| `assignSheet` / `assignText` | Opsional | Konfigurasi & label tombol assign | `Assign` |
| `emptyText` | Opsional | Teks saat kosong | `Tidak ada…` |
| `updateEventRow` | Wajib | Perintah tulis saat assign (DSL) | lihat contoh |
| `text` | Wajib | Judul | `Akan Datang` |

## Posisi field gabungan

`text` = judul. Tombol assign membuka sheet pilih kendaraan → `updateEventRow` menulis penugasan.

## Tips & catatan

- Tombol assign muncul kondisional (tugas belum ada kendaraan).
- Pasangan: `runningTaskList` (238, sedang berjalan).
- Spec: `docs/admin-home-dev-spec.md` §5.2.
