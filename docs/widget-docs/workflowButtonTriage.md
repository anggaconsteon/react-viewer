# RBT — tombol triase laporan (`workflowButtonTriage`)

**Status:** LIVE di app (tombol alur laporan insiden — tahap masuk/triase)
**Widget tab:** row 186

## Buat apa

Set 3 tombol aksi menempel di bawah (sticky) untuk **menangani laporan yang baru masuk**: Kembalikan (ke pelapor + alasan), Terima (tinjau), atau Assign (tugaskan ke petugas via pencarian). Muncul hanya saat status laporan = MENUNGGU.

## Tampilan

```
┌ (sticky di bawah layar) ───────────────────────┐
│ [ Kembalikan ]   [ Terima ]   [ Assign ]       │
└─────────────────────────────────────────────────┘
Kembalikan → sheet isi alasan → kirim
Terima     → langsung + dialog
Assign     → sheet cari & pilih petugas → tugaskan
```

## Contoh JSON

Template besar & baked untuk alur insiden (3 tombol, gate `2◼MENUNGGU`, cari petugas dari `workforce`). Bagian yang di-isi builder = perintah tulis: `[ADDTOTABLE1]` (kembalikan), `[ADDTOTABLE2]`/`[UPDATETABLEROW2]` (terima), `[ADDTOTABLE3]` (assign). Selebihnya (label tombol, dialog, sheet cari petugas) sudah baked.

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `alignment` | otomatis (baked) | `spaceevenly` | — |
| `search` (RBT) | otomatis (baked) | `sticky` — tombol menempel di bawah layar | `sticky` |
| `children[]` | Wajib | 3 tombol: Kembalikan / Terima / Assign | — |
| · `search` (child) | otomatis (baked) | Gerbang tampil: `2◼MENUNGGU` (muncul hanya kalau status = MENUNGGU) | `2◼MENUNGGU` |
| · `flag` | otomatis (baked) | `report-incident` | — |
| · `[ADDTOTABLE1..3]` / `[UPDATETABLEROW2]` | Wajib | Perintah tulis per aksi (DSL) — diisi builder | — |

## Posisi field gabungan

Tidak ada field ◆-gabungan. Gerbang tampil pakai `search:"2◼MENUNGGU"` di tiap child (kolom index `2` = status).

## Tips & catatan

- `search:"sticky"` (level RBT) = tombol menempel di bawah, tidak ikut isi halaman.
- `search:"2◼MENUNGGU"` (level child) = **gerbang tampil**: tombol muncul hanya kalau field index `2` (status) = MENUNGGU. Begitu status berubah, set tombol ini hilang, digantikan `workflowButtonHandle` (tahap DITINJAU).
- Keluarga alur insiden: `workflowButtonTriage` (186, MENUNGGU) → `workflowButtonHandle` (187, DITINJAU); `workflowButtonDialog` (188) & `workflowButtonSheet` (189) = versi 1-tombol generik.
- ⚠ Template baked untuk flow insiden — sesuaikan gate/label/DSL kalau dipakai flow lain. Beda dari keluarga baru `workflowBtn` (283+, 1 tombol = 1 row).
