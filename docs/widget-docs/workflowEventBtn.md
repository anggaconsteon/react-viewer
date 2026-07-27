# RBT — workflow event button (`workflowEventBtn`)

**Status:** LIVE di app (tombol sticky + tulis buku event + dialog)
**Dev spec:** ⚠ TIDAK ADA spec khusus — rujukan memory library workflow button
**Widget tab:** row 288

## Buat apa

Sama seperti `workflowBtn` (283) tapi menulis ke **buku event** (`updateEventRow` / `addToEvent`) — bukan tabel biasa — lalu dialog konfirmasi. Untuk aksi yang tercatat sebagai event keyed (mis. approve reward).

## Tampilan

```
┌ (sticky) ─────────────────────────┐
│ [          Approve           ]    │
└────────────────────────────────────┘
── tap ──▶ tulis event → dialog
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Approve","search":"st◼review","action":"savesend","route":"","delay":5,"gpsPosition":"2","flag":"reward-approve","buttonColor":"green","textColor":"white","updateEventRow":"84214220504259//post_claim⭘tablevid◼20342033315492⭘search◼ck★{ck}⭘st◼approved","addToEvent":"","chain":{"type":"DO_DIALOG","title":"Disetujui","children":[{"type":"TXT","data":"Disetujui."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"[ROUTE1]"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `text` (child) | Wajib | Label tombol | `Approve` |
| `search` (child) | Opsional | Gerbang tampil | `st◼review` |
| `gpsPosition` / `flag` | Wajib | Slot GPS / penanda | `2` / `reward-approve` |
| `updateEventRow` / `addToEvent` | Wajib (salah satu) | Perintah tulis buku event (DSL keyed) | lihat contoh |
| `title` / `confirmation` (chain) | Wajib | Dialog konfirmasi | `Disetujui` |

## Posisi field gabungan

Tidak ada field ◆-gabungan; DSL keyed pakai `◼`/`★`/`☆` (lihat glossary README).

## Tips & catatan

- Versi tulis-tabel = `workflowBtn` (283). Versi event + catatan = `workflowEventNoteBtn` (289).
- Dipakai mis. tombol approve reward (RewardReviewDetail).
