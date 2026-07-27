# CUSTODY_EVENT_SUBMIT (`custodyEventSubmit`)

**Status:** LIVE di app (tombol lapor selisih custody + gerbang bukti — driver runtime)
**Dev spec:** ADA — bagian alur custody/opening check (driver-custody & warehouse specs)
**Widget tab:** row 217

## Buat apa

Tombol "Lapor Selisih & Lanjut Kerja": mengubah status custody jadi terkonfirmasi + mencatat bukti (catatan alasan + foto). Ada **gerbang**: tombol baru aktif setelah catatan (min. panjang) & foto diisi.

## Tampilan

```
[ LAPOR SELISIH · LANJUT KERJA ]  ← nonaktif sampai catatan + foto diisi
  Isi alasan (min 10 karakter) + lampirkan foto dulu
```

## Contoh JSON

(resolved live — dari template Widget row 217)

```json
{"type":"CUSTODY_EVENT_SUBMIT","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}","gateNotePosition":5,"gatePhotoPosition":6,"minNoteLength":10,"updateEventRow":"84214220504259//vehicle_check⭘tablevid◼20342033315492⭘search◼cty★opening☆vv★{vehicleId}☆cdt★{today}⭘cst◼custody_confirmed⭘d◼◁5▷","addToEvent":"84214220504259//evidence⭘r◼4320⭘tablevid◼20342033315492⭘ty◼photo⭘ept◼check⭘erf◼{cnm}⭘i◼◁6▷⭘cv◼{driverVid}⭘cn◼{driverName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶","route":"vertikaTeknoLokaciptaMismatchSubmitted","text":"LAPOR SELISIH · LANJUT KERJA◆LAPOR SELISIH · LANJUT KERJA◆Isi alasan (min 10 karakter) + lampirkan foto dulu"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_EVENT_SUBMIT` | — |
| `vidtable` / `table` / `search` | Wajib | Sasaran custody yang diperbarui | `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}` |
| `gateNotePosition` | Wajib | Slot form catatan (gerbang) | `5` |
| `gatePhotoPosition` | Wajib | Slot form foto (gerbang) | `6` |
| `minNoteLength` | Wajib | Panjang minimal catatan supaya tombol aktif | `10` |
| `updateEventRow` | Wajib | Ubah status custody → `custody_confirmed` + catatan | lihat contoh |
| `addToEvent` | Wajib | Catat bukti foto ke koleksi `evidence` | lihat contoh |
| `route` | Wajib | Halaman tujuan setelah submit | `…MismatchSubmitted` |
| `text` | Wajib | Label aktif + label nonaktif + pesan gerbang (dipisah `◆`) | lihat contoh |

## Posisi field gabungan

`text` — 3 segmen `◆`: label tombol aktif / label tombol nonaktif / pesan syarat gerbang. Gerbang baca slot form `◁5▷` (catatan) & `◁6▷` (foto).

## Tips & catatan

- Gerbang ganda: catatan ≥ `minNoteLength` **dan** foto terisi baru tombol aktif.
- Menulis 2 tempat sekaligus: status custody (`updateEventRow`) + bukti foto (`addToEvent` ke `evidence`).
