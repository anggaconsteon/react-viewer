# RBT — tombol tangani laporan (`workflowButtonHandle`)

**Status:** LIVE di app (tombol alur laporan insiden — tahap sedang ditinjau)
**Widget tab:** row 187

## Buat apa

Set 2 tombol sticky untuk **laporan yang sedang ditinjau**: Re-assign (tugaskan ulang ke petugas lain) atau Selesai (tutup laporan). Muncul hanya saat status laporan = DITINJAU.

## Tampilan

```
┌ (sticky di bawah layar) ───────────────┐
│ [ Re-assign ]        [ Selesai ]       │
└─────────────────────────────────────────┘
Re-assign → sheet cari & pilih petugas → tugaskan ulang
Selesai   → langsung + dialog "Laporan Selesai"
```

## Contoh JSON

Template baked alur insiden (2 tombol, gate `2◼DITINJAU`, sheet cari petugas dari `workforce`). Yang di-isi builder = perintah tulis: `[UPDATETABLEROW1]`/`[ADDTOTABLE1]` (re-assign), `[UPDATETABLEROW2]`/`[ADDTOTABLE2]` (selesai).

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `children[]` | Wajib | 2 tombol: Re-assign / Selesai | — |
| · `search` (child) | otomatis (baked) | Gerbang tampil `2◼DITINJAU` | `2◼DITINJAU` |
| · `flag` | otomatis (baked) | `report-incident` | — |
| · `[UPDATETABLEROW1/2]` / `[ADDTOTABLE1/2]` | Wajib | Perintah tulis per aksi (DSL) — diisi builder | — |

## Posisi field gabungan

Tidak ada field ◆-gabungan. Gerbang tampil `search:"2◼DITINJAU"` per child.

## Tips & catatan

- Lanjutan dari `workflowButtonTriage` (186): begitu laporan Diterima (status → DITINJAU), set tombol MENUNGGU hilang dan set ini muncul.
- `search:"sticky"` = menempel di bawah; `search:"2◼DITINJAU"` = gerbang tampil per status.
- ⚠ Template baked flow insiden.
