# RBT — workflow note button (`workflowNoteBtn`)

**Status:** LIVE di app (tombol sticky + sheet isi catatan + tulis)
**Dev spec:** ⚠ TIDAK ADA spec khusus — rujukan memory library workflow button
**Widget tab:** row 285

## Buat apa

Tombol sticky yang membuka **bottom-sheet isi catatan** (satu kolom teks) sebelum menulis data. Untuk aksi yang wajib alasan/keterangan (mis. tolak dengan alasan).

## Tampilan

```
┌ (sticky) ─────────────────────────┐
│ [          Tolak            ]     │
└────────────────────────────────────┘
── tap ──▶ sheet: [ Alasan … ] → [ Kirim ]
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Tolak","search":"st◼review","route":"","delay":5,"gpsPosition":"2","flag":"reject","buttonColor":"red","textColor":"white","chain":{"type":"DO_BOTTOM_SHEET","title":"Tolak","children":[{"type":"TXT","data":"Beri alasan penolakan."},{"type":"TXF","variant":"text","icon":57527,"label":"Alasan","currentValue":"","hint":"Mis. bukti kurang jelas","maxLength":0,"size":14,"position":"5","line":3,"border":true},{"type":"RBT","alignment":"center","children":[{"text":"Kirim","action":"savesend","addToTable":"","addToEvent":"","route":"","buttonColor":"red","textColor":"white"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `text` (child) | Wajib | Label tombol | `Tolak` |
| `search` (child) | Opsional | Gerbang tampil | `st◼review` |
| `gpsPosition` / `flag` | Wajib | Slot GPS / penanda | `2` / `reject` |
| `chain` (DO_BOTTOM_SHEET) | Wajib | Sheet: teks + TXF catatan (posisi N) + tombol kirim | lihat contoh |
| · tombol kirim `addToTable`/`addToEvent` | Wajib | Perintah tulis (baca `◁N▷` catatan) | lihat contoh |

## Posisi field gabungan

Tidak ada. Catatan masuk slot form `position` (mis. 5), dibaca `◁5▷` di perintah tulis.

## Tips & catatan

- Versi menulis buku event = `workflowEventNoteBtn` (289).
- Untuk catatan + pilihan opsi = `workflowFormBtn` (287); untuk pilih orang = `workflowAssignBtn` (286).
