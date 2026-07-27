# RBT — tombol 2-aksi bergaya `actions`/`event` (`approvalButton`)

**Status:** LIVE di app (varian tombol RBT 2-aksi)
**Widget tab:** row 182

## Buat apa

Dua tombol berdampingan yang masing-masing menjalankan sebuah **aksi** + menulis **event**, lalu tampil dialog "Terkirim". Mirip `sendApprovalButton`, tapi memakai gaya `actions`/`event` (seperti tombol di `LIST_ITEM_CARD`) — bukan `updateTableRow` langsung.

## Tampilan

```
[  Tombol 1  ]   [  Tombol 2  ]      ← warna & aksi masing-masing
     ── tap ──▶ jalankan aksi + tulis event + dialog "Terkirim."
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Setujui","buttonColor":"green","textColor":"white","actions":"approve","event":"","chain":{"type":"DO_DIALOG","title":"OK","children":[{"type":"TXT","data":"Terkirim."},{"type":"RBT","alignment":"center","children":[{"text":"OK","route":"vertikaTeknoLokacipta"}]}]}},{"text":"Tolak","buttonColor":"red","textColor":"white","actions":"reject","event":"","chain":{"type":"DO_DIALOG","title":"OK","children":[{"type":"TXT","data":"Terkirim."},{"type":"RBT","alignment":"center","children":[{"text":"OK","route":"vertikaTeknoLokacipta"}]}]}}]}
```

## Field

Per tombol (dua child):

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `alignment` | Wajib | Perataan | `spaceevenly` |
| `text` | Wajib | Label tombol | `Setujui` |
| `buttonColor` / `textColor` | Wajib | Warna tombol & teks | `green` / `white` |
| `actions` | Wajib | Aksi yang dijalankan | `approve` |
| `event` | Opsional | Perintah tulis event (DSL) | `""` |
| `chain` | Opsional | Dialog konfirmasi setelah aksi | lihat contoh |

## Posisi field gabungan

Tidak ada field ◆-gabungan.

## Tips & catatan

- Beda dari `sendApprovalButton` (175): itu pakai `updateTableRow` + GPS + `flag`; `approvalButton` pakai `actions`/`event`. Pilih sesuai cara backend memproses.
- Untuk approval inline di dalam daftar (per baris), lihat `listActionCard`.
