# RBT — workflow button (`workflowBtn`)

**Status:** LIVE di app (tombol aksi sticky + tulis tabel + dialog)
**Dev spec:** ⚠ TIDAK ADA spec khusus — rujukan memory library workflow button (bukan spec doc)
**Widget tab:** row 283

## Buat apa

Tombol aksi menempel di bawah (sticky) yang menulis ke **tabel** (updateTableRow / addToTable / addToEvent) lalu dialog konfirmasi. Dasar keluarga "workflow button" — 1 tombol = 1 row. Muncul kondisional lewat gerbang `search`.

## Tampilan

```
┌ (sticky) ─────────────────────────┐
│ [           Proses           ]    │
└────────────────────────────────────┘
── tap ──▶ tulis data → dialog konfirmasi
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Proses","search":"st◼menunggu","action":"savesend","route":"","delay":5,"gpsPosition":"2","flag":"proses","buttonColor":"blue","textColor":"white","updateTableRow":"84214220504259//task⭘tablevid◼20342033315492⭘search◼id★{id}⭘st◼proses","addToTable":"","addToEvent":"","chain":{"type":"DO_DIALOG","title":"Diproses","children":[{"type":"TXT","data":"Diproses."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":""}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` — menempel di bawah | `sticky` |
| `text` (child) | Wajib | Label tombol | `Proses` |
| `search` (child) | Opsional | Gerbang tampil `field◼nilai` | `st◼menunggu` |
| `gpsPosition` / `flag` | Wajib | Slot GPS / penanda | `2` / `proses` |
| `buttonColor` | Wajib | Warna | `blue` |
| `updateTableRow` / `addToTable` / `addToEvent` | Wajib (salah satu) | Perintah tulis (DSL) | lihat contoh |
| `title` / `confirmation` (chain) | Wajib | Dialog konfirmasi | `Diproses` |

## Posisi field gabungan

Tidak ada field ◆-gabungan.

## Tips & catatan

- `search:"sticky"` (RBT) = pinned footer; `search:"field◼nilai"` (child) = gerbang tampil.
- Keluarga workflow button (283-289): `workflowBtn` (dialog+tabel), `workflowRouteBtn` (route), `workflowNoteBtn` (sheet catatan), `workflowAssignBtn` (sheet assign), `workflowFormBtn` (sheet catatan+pilihan), `workflowEventBtn` (event), `workflowEventNoteBtn` (event+catatan). Prinsip: 1 tombol = 1 row.
- Versi menulis ke buku event = `workflowEventBtn` (288). Rujukan: memory `reference_workflow_btn_library`.
