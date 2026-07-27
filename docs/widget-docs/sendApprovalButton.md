# RBT — tombol setuju/tolak (`sendApprovalButton`)

**Status:** LIVE di app (varian tombol RBT 2-aksi)
**Widget tab:** row 175

## Buat apa

Dua tombol berdampingan untuk **menyetujui (hijau) / menolak (merah)** — masing-masing mengubah baris data + dialog konfirmasi. Dipakai di alur persetujuan (approval).

## Tampilan

```
[  ✗ Tolak  ]   [  ✓ Setuju  ]      ← merah (kiri) / hijau (kanan)
     ── tap ──▶ ubah baris + dialog konfirmasi
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar; 2 tombol)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Tolak","action":"savesend","route":"vertikaTeknoLokacipta","delay":5,"gpsPosition":"2","flag":"reject","updateTableRow":"84214220504259//request⭘tablevid◼20342033315492⭘search◼id★{id}⭘st◼ditolak","buttonColor":"red","textColor":"white","chain":{"type":"DO_DIALOG","title":"Ditolak","children":[{"type":"TXT","data":"Permintaan ditolak."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}},{"text":"Setuju","action":"savesend","route":"vertikaTeknoLokacipta","delay":5,"gpsPosition":"2","flag":"approve","updateTableRow":"84214220504259//request⭘tablevid◼20342033315492⭘search◼id★{id}⭘st◼disetujui","buttonColor":"green","textColor":"white","chain":{"type":"DO_DIALOG","title":"Disetujui","children":[{"type":"TXT","data":"Permintaan disetujui."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}}]}
```

## Field

Per tombol (dua child: tombol 2 = tolak/merah, tombol 1 = setuju/hijau):

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `text` | Wajib | Label tombol | `Setuju` / `Tolak` |
| `route` | Wajib | Halaman tujuan | `vertikaTeknoLokacipta` |
| `gpsPosition` | Wajib | Slot form koordinat GPS | `2` |
| `flag` | Wajib | Penanda kiriman | `approve` / `reject` |
| `updateTableRow` | Wajib | Perintah ubah baris (DSL) | lihat contoh |
| `buttonColor` | baked | `green` (setuju) / `red` (tolak) | `green` |
| `title` / `confirmation` (chain) | Wajib | Dialog konfirmasi per tombol | `Disetujui` |

## Posisi field gabungan

Tidak ada field ◆-gabungan.

## Tips & catatan

- Urutan child di template: tombol 2 (BUTTON2 = tolak merah) lebih dulu, lalu tombol 1 (BUTTON1 = setuju hijau) — tampil berdampingan.
- Untuk approval yang lebih kaya (level bertingkat), lihat keluarga `autsorzApproval*` / `approvalButton`.
