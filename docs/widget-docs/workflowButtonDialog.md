# RBT — tombol aksi + dialog konfirmasi (`workflowButtonDialog`)

**Status:** LIVE di app (tombol alur, 1 aksi + dialog)
**Widget tab:** row 188

## Buat apa

Satu tombol sticky yang menjalankan aksi (tulis/ubah data) lalu menampilkan **dialog konfirmasi**. Versi generik 1-tombol dari keluarga workflow (tanpa form isian). Bisa dipasang gerbang tampil per status.

## Tampilan

```
┌ (sticky di bawah layar) ───────────────┐
│ [           Aksi           ]           │
└─────────────────────────────────────────┘
── tap ──▶ tulis data → dialog "[TITLE1]" → Ok
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Tandai Selesai","search":"st◼jalan","action":"savesend","route":"","delay":5,"gpsPosition":"2","flag":"report-incident","buttonColor":"green","textColor":"white","updateTableRow":"84214220504259//task⭘tablevid◼20342033315492⭘search◼id★{id}⭘st◼selesai","addToTable":"","chain":{"type":"DO_DIALOG","title":"Selesai","children":[{"type":"TXT","data":"Tugas selesai."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":""}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `text` (child) | Wajib | Label tombol | `Tandai Selesai` |
| `search` (child) | Opsional | Gerbang tampil `field◼nilai` (mis. `st◼jalan`) | `st◼jalan` |
| `route` | Wajib | Halaman tujuan (boleh kosong = tetap) | `""` |
| `gpsPosition` | Wajib | Slot form koordinat GPS | `2` |
| `flag` | Wajib | Penanda kiriman | `report-incident` |
| `buttonColor` | Wajib | Warna tombol | `green` |
| `updateTableRow` / `addToTable` | Wajib (salah satu) | Perintah tulis (DSL) | lihat contoh |
| `title` / `confirmation` (chain) | Wajib | Dialog konfirmasi | `Selesai` |

## Posisi field gabungan

Tidak ada field ◆-gabungan.

## Tips & catatan

- `search:"sticky"` (RBT) = menempel di bawah; `search:"field◼nilai"` (child) = gerbang tampil (tombol muncul hanya saat data cocok).
- Butuh form isian sebelum kirim → pakai `workflowButtonSheet` (189). Butuh banyak tombol status → `workflowButtonTriage`/`Handle`.
