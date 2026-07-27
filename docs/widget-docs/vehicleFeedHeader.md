# VEHICLE_FEED_HEADER (`vehicleFeedHeader`)

**Status:** LIVE di app (header feed kendaraan — gudang/checker H1)
**Dev spec:** ADA — `docs/vehicle-feed-h1-dev-spec.md`
**Widget tab:** row 230

## Buat apa

Header untuk halaman daftar kendaraan (dari sisi petugas gudang/checker): nama checker + stasiun + tombol menu, plus konteks gerbang buka (opening). Dipakai di atas daftar kendaraan yang perlu dicek.

## Tampilan

```
┌────────────────────────────────────┐
│ 👤 Checker Andi · Gudang A    [≡]  │
│ Kendaraan hari ini                 │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"VEHICLE_FEED_HEADER","vidtable":"20342033315492","workforceTable":"84214220504259//workforce","checkerSearch":"VID◼{userVid}","nameField":"n","station":"Gudang A","menuRoute":"vertikaTeknoLokaciptaAdminHome","table":"84214220504259//vehicle_check","search":"cdt◼{today}","openingGate":"cty◼opening","taskTable":"84214220504259//task","text":"Kendaraan Hari Ini"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `VEHICLE_FEED_HEADER` | — |
| `vidtable` | otomatis (baked) | ID koneksi tenant | `20342033315492` |
| `workforceTable` / `checkerSearch` / `nameField` | Wajib | Sumber & field nama checker | `VID◼{userVid}` / `n` |
| `station` | Opsional | Nama stasiun/gudang | `Gudang A` |
| `menuRoute` | Wajib | Halaman tujuan tombol menu | `…AdminHome` |
| `table` / `search` | Wajib | Sumber data kendaraan | `cdt◼{today}` |
| `openingGate` | Opsional | Syarat gerbang buka (opening) | `cty◼opening` |
| `taskTable` | Opsional | Sumber tugas (untuk konteks) | `84214220504259//task` |
| `text` | Wajib | Judul header | `Kendaraan Hari Ini` |

## Posisi field gabungan

`text` = judul (segmen `◆` bila ada).

## Tips & catatan

- Header untuk `vehicleFeedList` (231) di halaman feed kendaraan (sisi gudang).
- Spec: `docs/vehicle-feed-h1-dev-spec.md`.
