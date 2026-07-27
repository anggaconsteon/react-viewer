# ADMIN_COORDINATION_HEADER (`adminCoordinationHeader`)

**Status:** LIVE di app (header koordinasi admin — beranda admin)
**Dev spec:** ADA — bagian admin/coordination (admin-home & coordination specs)
**Widget tab:** row 232

## Buat apa

Header ringkasan koordinasi untuk admin: menampilkan hitungan sinyal yang perlu ditangani (tugas belum diassign, kendaraan kembali, dll.) dari beberapa tabel, plus tombol pindah tampilan. Dipakai di atas daftar sinyal koordinasi.

## Tampilan

```
┌────────────────────────────────────┐
│ Koordinasi · 3 perlu tindak  [⇄]  │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"ADMIN_COORDINATION_HEADER","vidtable":"20342033315492","taskTable":"84214220504259//task","vehicleTable":"84214220504259//vehicle_check","checkTable":"84214220504259//vehicle_check","evidenceTable":"84214220504259//evidence","switchRoute":"vertikaTeknoLokaciptaAdminHome","text":"Koordinasi◆perlu tindak"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `ADMIN_COORDINATION_HEADER` | — |
| `vidtable` | otomatis (baked) | ID koneksi tenant | `20342033315492` |
| `taskTable` / `vehicleTable` / `checkTable` / `evidenceTable` | Wajib | Sumber-sumber data yang dihitung sinyalnya | `84214220504259//task`, … |
| `switchRoute` | Opsional | Halaman tujuan tombol pindah tampilan | `…AdminHome` |
| `text` | Wajib | Judul + label (dipisah `◆`) | `Koordinasi◆perlu tindak` |

## Posisi field gabungan

`text` dipisah `◆` (judul / label). Angka sinyal dihitung sistem dari gabungan tabel.

## Tips & catatan

- Header untuk `coordinationSignalList` (233) di beranda admin.
- Menghitung dari beberapa tabel sekaligus (tugas + kendaraan + bukti).
