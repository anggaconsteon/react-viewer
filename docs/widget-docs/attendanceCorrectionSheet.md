# RBT — koreksi jam kehadiran (`attendanceCorrectionSheet`)

**Status:** Config siap — butuh tulis-balik keyed (`updateEventRow`) di renderer (cek dev; lihat spec kehadiran)
**Dev spec:** ADA — `docs/kehadiran-card-dev-spec.md` §3
**Widget tab:** row 198

## Buat apa

Tombol sticky yang membuka **form koreksi jam kehadiran**: supervisor isi jam clock-out/clock-in yang benar + alasan, lalu simpan — mengubah data pekerja + mencatat jejak ke buku event. Dipakai di halaman koreksi kehadiran (setelah tap kartu pekerja).

## Tampilan

```
┌ (sticky di bawah layar) ───────────────┐
│ [           Koreksi jam           ]    │
└─────────────────────────────────────────┘
── tap ──▶ bottom-sheet:
   Fakta terkunci (dari scan): Masuk <is> · Keluar <os>
   Jam clock-out (koreksi) [ HH:mm ]
   Jam clock-in (koreksi)  [ HH:mm ]
   Keterangan              [ Alasan koreksi ]
   [ Simpan & catat jejak ]
```

## Contoh JSON

(resolved live — dari template Widget row 198; tombol Simpan menulis ke workforce + event)

```json
{"type":"RBT","alignment":"spaceevenly","search":"sticky","children":[{"text":"Koreksi jam","action":"savesend","route":"","delay":5,"flag":"attendance","buttonColor":"blue","textColor":"white","chain":{"type":"DO_BOTTOM_SHEET","height":"0.6","title":"Koreksi jam","children":[{"type":"TXT","data":"Fakta terkunci (dari scan)"},{"type":"TXT","size":14,"data":"Masuk <is> · Keluar <os>"},{"type":"TXF","variant":"text","label":"Jam clock-out (koreksi)","hint":"HH:mm","currentValue":"","maxLength":0,"size":14,"position":1,"border":true},{"type":"TXF","variant":"text","label":"Jam clock-in (koreksi)","hint":"HH:mm","currentValue":"","maxLength":0,"size":14,"position":2,"border":true},{"type":"TXF","variant":"text","label":"Keterangan","hint":"Alasan koreksi","currentValue":"","maxLength":0,"size":14,"position":3,"line":3,"border":true},{"type":"RBT","alignment":"center","children":[{"text":"Simpan & catat jejak","action":"savesend","buttonColor":"green","textColor":"white","updateEventRow":"84214220504259//workforce⭘tablevid◼20342033315492⭘search◼vid★<vid>⭘os◼◁1▷⭘is◼◁2▷","addToEvent":"84214220504259//event⭘r◼4320⭘tablevid◼20342033315492⭘ty◼koreksi-presensi⭘p◼vertikaTeknoLokaciptaCheckinWorkerCorrection⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm▶⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘sv◼<sv>⭘sn◼<n>⭘d◼Koreksi: keluar ◁1▷ masuk ◁2▷ — ◁3▷","route":""}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `search` (RBT) | otomatis (baked) | `sticky` — menempel di bawah | `sticky` |
| `text` (child) | Wajib | Label tombol | `Koreksi jam` |
| `flag` | Wajib | Penanda kiriman | `attendance` |
| `chain` (DO_BOTTOM_SHEET) | Wajib | Form: fakta terkunci + 3 TXF (clock-out pos1 / clock-in pos2 / keterangan pos3) + tombol Simpan | lihat contoh |
| · tombol Simpan `updateEventRow` | Wajib | Ubah data pekerja (jam is/os) | lihat contoh |
| · tombol Simpan `addToEvent` | Wajib | Catat jejak koreksi ke buku event | lihat contoh |

## Posisi field gabungan

Tidak ada field ◆-gabungan di tombol. Isian sheet pakai slot form (`position` 1/2/3) lalu dibaca `◁1▷`/`◁2▷`/`◁3▷` di perintah tulis.

## Tips & catatan

- v1 mengubah **string tampilan** `is`/`os` (yang tampak di kartu), bukan epoch `ci`/`co`.
- `updateEventRow` keyed (`vid★<vid>`) mungkin belum landing di build — cek dev.
- Pasangan halaman: `workerCardDetail` (178) menampilkan detail, tombol ini menulis balik. Spec: `docs/kehadiran-card-dev-spec.md`.
