# RBT — workflow route button (`workflowRouteBtn`)

**Status:** LIVE di app (tombol sticky navigasi + routeParams)
**Dev spec:** ⚠ TIDAK ADA spec khusus — rujukan memory library workflow button
**Widget tab:** row 284

## Buat apa

Tombol sticky yang **pindah halaman** (bawa data lewat `routeParams`) — tanpa tulis data. Anggota keluarga workflow button untuk navigasi bersyarat (muncul lewat gerbang `search`).

## Tampilan

```
┌ (sticky) ─────────────────────────┐
│ [        Lihat Detail        ]    │  → route + routeParams
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Lihat Detail","search":"st◼selesai","buttonColor":"blue","textColor":"white","route":"vertikaTeknoLokaciptaTaskDetail","routeParams":"tnm◼{tnm}"}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` | `sticky` |
| `text` (child) | Wajib | Label tombol | `Lihat Detail` |
| `search` (child) | Opsional | Gerbang tampil `field◼nilai` | `st◼selesai` |
| `buttonColor` | Wajib | Warna | `blue` |
| `route` | Wajib | Halaman tujuan | `…TaskDetail` |
| `routeParams` | Opsional | Data yang dibawa `key◼{field}` | `tnm◼{tnm}` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- Versi navigasi-saja dari keluarga workflow button (283-289) — tidak menulis data.
- Beda dari `routeBtn` (303): `workflowRouteBtn` selalu sticky + punya gerbang tampil child `search`.
