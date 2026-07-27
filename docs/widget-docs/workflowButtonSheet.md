# RBT — tombol aksi + form bottom-sheet (`workflowButtonSheet`)

**Status:** LIVE di app (tombol alur, 1 aksi + form isian)
**Widget tab:** row 189

## Buat apa

Satu tombol sticky yang membuka **form bottom-sheet** (isi keterangan + pilih hasil tindakan) sebelum kirim. Versi generik 1-tombol dari keluarga workflow dengan input. Cocok untuk "lapor tindakan lapangan".

## Tampilan

```
┌ (sticky di bawah layar) ───────────────┐
│ [           Aksi           ]           │
└─────────────────────────────────────────┘
── tap ──▶ bottom-sheet:
   Keterangan Tindakan [ … ]
   Hasil Tindakan: [Sudah diperbaiki] [Perlu tindak lanjut] …
   [ Kirim ]
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar; sheet berisi TXF keterangan pos 22 + SELECTABLE_BTN hasil pos 23)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Lapor Tindakan","search":"st◼jalan","action":"savesend","route":"","delay":5,"gpsPosition":"2","flag":"report-incident","buttonColor":"blue","textColor":"white","chain":{"type":"DO_BOTTOM_SHEET","height":"0.7","title":"Laporan Lapangan","children":[{"type":"TXF","variant":"text","icon":57527,"label":"Keterangan Tindakan","currentValue":"","hint":"Jelaskan kondisi & tindakan","maxLength":0,"size":14,"position":22,"line":3,"border":true},{"type":"SELECTABLE_BTN","variant":"vertical","icon":"assessment","title":"Hasil Tindakan","height":64,"position":23,"bgSelected":"gray","text":"Sudah diperbaiki◆Perlu tindak lanjut◆Menunggu suku cadang◆Eskalasi ke pihak lain"},{"type":"RBT","alignment":"center","children":[{"text":"Kirim","action":"savesend","addToTable":"[ADDTOTABLE]","updateTableRow":"[UPDATETABLEROW]","route":"","buttonColor":"red","textColor":"white"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `text` (child) | Wajib | Label tombol | `Lapor Tindakan` |
| `search` (child) | Opsional | Gerbang tampil `field◼nilai` | `st◼jalan` |
| `gpsPosition` | Wajib | Slot form koordinat GPS | `2` |
| `flag` | Wajib | Penanda kiriman | `report-incident` |
| `chain` (DO_BOTTOM_SHEET) | Wajib | Form isian: TXF keterangan (pos 22) + SELECTABLE_BTN hasil (pos 23) + tombol Kirim | lihat contoh |
| `[ADDTOTABLE]` / `[UPDATETABLEROW]` | Wajib | Perintah tulis pada tombol Kirim di sheet (DSL) | — |

## Posisi field gabungan

Tidak ada field ◆-gabungan di tombolnya. Isian sheet memakai slot form (`position`) TXF/SELECTABLE_BTN yang lalu dibaca `◁N▷` di perintah tulis.

## Tips & catatan

- `search:"sticky"` = menempel di bawah; `search:"field◼nilai"` = gerbang tampil.
- Isi sheet (label keterangan, opsi hasil) = konfigurasi TXF + SELECTABLE_BTN di dalam `chain` — ganti sesuai kebutuhan.
- Tanpa form isian → pakai `workflowButtonDialog` (188).
