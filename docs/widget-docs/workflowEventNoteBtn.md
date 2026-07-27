# RBT — workflow event note button (`workflowEventNoteBtn`)

**Status:** LIVE di app (tombol sticky + sheet catatan + tulis buku event)
**Dev spec:** ⚠ TIDAK ADA spec khusus — rujukan memory library workflow button
**Widget tab:** row 289

## Buat apa

Gabungan `workflowNoteBtn` (sheet catatan) + `workflowEventBtn` (tulis buku event): tombol sticky → sheet isi catatan → tulis event keyed. Untuk aksi event yang wajib alasan (mis. reject reward dengan alasan).

## Tampilan

```
┌ (sticky) ─────────────────────────┐
│ [           Reject           ]    │
└────────────────────────────────────┘
── tap ──▶ sheet: [ Alasan … ] → tulis event
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Reject","search":"st◼review","action":"savesend","route":"","delay":5,"gpsPosition":"2","flag":"reward-reject","buttonColor":"red","textColor":"white","chain":{"type":"DO_BOTTOM_SHEET","title":"Reject","children":[{"type":"TXT","data":"Beri alasan reject."},{"type":"TXF","variant":"text","icon":57527,"label":"Alasan","currentValue":"","hint":"Mis. bukti kurang jelas","maxLength":0,"size":14,"position":"5","line":3,"border":true},{"type":"RBT","alignment":"center","children":[{"text":"Kirim","action":"savesend","updateEventRow":"84214220504259//post_claim⭘tablevid◼20342033315492⭘search◼ck★{ck}⭘st◼rejected⭘rr◼◁5▷","addToEvent":"","route":"","buttonColor":"red","textColor":"white"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `text` (child) | Wajib | Label tombol | `Reject` |
| `search` (child) | Opsional | Gerbang tampil | `st◼review` |
| `gpsPosition` / `flag` | Wajib | Slot GPS / penanda | `2` / `reward-reject` |
| `chain` (DO_BOTTOM_SHEET) | Wajib | Sheet: teks + TXF catatan (pos N) + tombol kirim | lihat contoh |
| · tombol kirim `updateEventRow` / `addToEvent` | Wajib | Perintah tulis event (baca `◁N▷` catatan) | lihat contoh |

## Posisi field gabungan

Tidak ada. Catatan masuk slot form `position` (mis. 5), dibaca `◁5▷` di perintah tulis event.

## Tips & catatan

- Versi tanpa catatan (langsung + dialog) = `workflowEventBtn` (288); versi tulis-tabel (bukan event) = `workflowNoteBtn` (285).
- Dipakai mis. tombol reject reward (RewardReviewDetail).
