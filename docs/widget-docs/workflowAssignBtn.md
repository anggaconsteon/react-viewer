# RBT — workflow assign button (`workflowAssignBtn`)

**Status:** LIVE di app (tombol sticky + sheet cari & pilih orang + tulis)
**Dev spec:** ⚠ TIDAK ADA spec khusus — rujukan memory library workflow button
**Widget tab:** row 286

## Buat apa

Tombol sticky yang membuka **bottom-sheet pilih petugas** (cari nama/scan QR name tag dari `workforce`) sebelum menulis penugasan. Untuk assign/re-assign orang ke tugas.

## Tampilan

```
┌ (sticky) ─────────────────────────┐
│ [          Assign           ]     │
└────────────────────────────────────┘
── tap ──▶ sheet: 🔍 cari petugas → pilih → [ Assign ]
```

## Contoh JSON

(potongan — sheet berisi pencarian `tableSearch` ke workforce + tombol Assign)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Assign","search":"st◼menunggu","action":"savesend","route":"","delay":5,"gpsPosition":"2","flag":"assign","buttonColor":"gray","textColor":"white","chain":{"type":"DO_BOTTOM_SHEET","title":"Assign Petugas","height":"0.7","children":[{"type":"TXT","data":"Pilih petugas:"},{"type":"TXF","variant":"tableSearch","com":"auz","table":"vtl.workforce","qr":"uqr","position":"16","format":"vtl.workforce","text":"Pilih Nama◆…"},{"type":"TXF","variant":"generic","label":"Nama","position":"26","isEnabled":"FALSE"},{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Batal","route":"","buttonColor":"red","textColor":"white"},{"text":"Assign","action":"savesend","com":"auz","updateTableRow":"[UPDATETABLEROW]","addToTable":"[ADDTOTABLE]","addToEvent":"[ADDTOEVENT]","route":"","buttonColor":"blue","textColor":"white"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `text` (child) | Wajib | Label tombol | `Assign` |
| `search` (child) | Opsional | Gerbang tampil | `st◼menunggu` |
| `gpsPosition` / `flag` | Wajib | Slot GPS / penanda | `2` / `assign` |
| `chain` (DO_BOTTOM_SHEET) | Wajib | Sheet: pencarian petugas (`tableSearch` workforce) + tombol Batal/Assign | lihat contoh |
| · tombol Assign `updateTableRow`/`addToTable`/`addToEvent` | Wajib | Perintah tulis penugasan (DSL) | — |

## Posisi field gabungan

Tidak ada. Petugas terpilih masuk slot form (mis. `position` 16), nama ke `position` 26.

## Tips & catatan

- Sheet pakai `TXF variant:tableSearch` ke `workforce` (cari nama / scan QR name tag).
- Untuk catatan (bukan pilih orang) = `workflowNoteBtn` (285).
