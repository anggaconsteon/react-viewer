# RUNNING_TASK_LIST (`runningTaskList`)

**Status:** LIVE di app (daftar tugas berjalan — beranda admin)
**Dev spec:** ADA — `docs/admin-home-dev-spec.md`
**Widget tab:** row 238

## Buat apa

Daftar tugas yang **sedang berjalan** (sudah diassign & dikerjakan): tujuan, kendaraan, pelaksana, progress item selesai. Dipakai admin untuk pantau tugas aktif.

## Tampilan

```
┌─ Sedang Berjalan ──────────────────┐
│ Toko Budi · B 1234 XYZ · Budi      │
│ 3/5 item selesai                   │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RUNNING_TASK_LIST","vidtable":"20342033315492","table":"84214220504259//task","search":"tst◼assigned⭘tdt◼{today}","titleField":"kn","vehicleTable":"84214220504259//stock_location","vehicleNameField":"ln","execField":"dv","workforceTable":"84214220504259//workforce","nameField":"n","itemsField":"it","doneMarker":"done","noteField":"note","status":"{status}","text":"Sedang Berjalan◆Belum ada tugas berjalan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RUNNING_TASK_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber tugas + filter | `tst◼assigned⭘tdt◼{today}` |
| `titleField` | Wajib | Field judul (tujuan) | `kn` |
| `vehicleTable` / `vehicleNameField` | Opsional | Referensi kendaraan | `stock_location` / `ln` |
| `execField` / `workforceTable` / `nameField` | Opsional | Pelaksana + nama | `dv` / `workforce` / `n` |
| `itemsField` / `doneMarker` | Opsional | Field item + penanda selesai (hitung progress) | `it` / `done` |
| `noteField` | Opsional | Field catatan | `note` |
| `status` | Opsional | Status computed | `{status}` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Sedang Berjalan◆…` |

## Posisi field gabungan

`text` dipisah `◆`. Progress item selesai dihitung dari `itemsField` + `doneMarker`.

## Tips & catatan

- Pasangan: `upcomingTaskList` (240, yang akan datang) di beranda admin.
- Spec: `docs/admin-home-dev-spec.md`.
