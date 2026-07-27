# RBT — workflow form button (`workflowFormBtn`)

**Status:** LIVE di app (tombol sticky + sheet catatan + pilihan + tulis)
**Dev spec:** ⚠ TIDAK ADA spec khusus — rujukan memory library workflow button
**Widget tab:** row 287

## Buat apa

Tombol sticky yang membuka **bottom-sheet dengan form**: kolom catatan + pilihan (SELECTABLE_BTN, mis. hasil tindakan) sebelum menulis data. Untuk aksi yang butuh keterangan + kategori sekaligus.

## Tampilan

```
┌ (sticky) ─────────────────────────┐
│ [       Lapor Tindakan       ]    │
└────────────────────────────────────┘
── tap ──▶ sheet: [ Keterangan … ] + [pilih hasil] → [ Kirim ]
```

## Contoh JSON

(potongan — sheet berisi TXF catatan + SELECTABLE_BTN pilihan + tombol kirim)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Lapor Tindakan","search":"st◼jalan","action":"savesend","route":"","delay":5,"gpsPosition":"2","flag":"lapor","buttonColor":"blue","textColor":"white","chain":{"type":"DO_BOTTOM_SHEET","height":"0.7","title":"Laporan","children":[{"type":"TXF","variant":"text","icon":57527,"label":"Keterangan","currentValue":"","hint":"Jelaskan tindakan","maxLength":0,"size":14,"position":"22","line":3,"border":true},{"type":"SELECTABLE_BTN","variant":"vertical","icon":"assessment","title":"Hasil","height":64,"position":"23","bgSelected":"gray","text":"Selesai◆Perlu tindak lanjut◆Eskalasi"},{"type":"RBT","alignment":"center","children":[{"text":"Kirim","action":"savesend","addToTable":"[ADDTOTABLE]","updateTableRow":"[UPDATETABLEROW]","addToEvent":"[ADDTOEVENT]","route":"","buttonColor":"blue","textColor":"white"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `text` (child) | Wajib | Label tombol | `Lapor Tindakan` |
| `search` (child) | Opsional | Gerbang tampil | `st◼jalan` |
| `gpsPosition` / `flag` | Wajib | Slot GPS / penanda | `2` / `lapor` |
| `chain` (DO_BOTTOM_SHEET) | Wajib | Sheet: TXF catatan (pos N) + SELECTABLE_BTN pilihan (pos M) + tombol kirim | lihat contoh |
| · tombol kirim `addToTable`/`updateTableRow`/`addToEvent` | Wajib | Perintah tulis (baca `◁N▷`/`◁M▷`) | — |

## Posisi field gabungan

Tidak ada di tombol. Catatan (mis. pos 22) + pilihan (mis. pos 23) masuk slot form, dibaca `◁N▷` di perintah tulis. Opsi SELECTABLE_BTN dipisah `◆`.

## Tips & catatan

- Kombinasi catatan + pilihan opsi dalam satu sheet (lebih kaya dari `workflowNoteBtn` 285).
- Setara `workflowButtonSheet` (189, versi lama flow insiden) tapi 1 tombol = 1 row.
