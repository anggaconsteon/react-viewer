# RBT — tombol kirim + GPS + tulis tabel (`sendButtonGpsAddTable2`)

**Status:** LIVE di app (varian tombol RBT standar)
**Widget tab:** row 168

## Buat apa

Tombol simpan-kirim yang menulis 1 baris ke tabel data **sambil merekam GPS**, lalu menampilkan dialog konfirmasi. Varian ke-2 dari `sendButtonGpsAddTable` — sama fungsi, dengan tambahan penjaga GPS palsu / luar posisi.

## Tampilan

```
[        Kirim        ]  ── tap ──▶ rekam GPS + tulis tabel
                                     │
                                     ▼
                          ┌─ Berhasil ────────────┐
                          │ Data tersimpan.       │
                          │        [ Ok ]         │
                          └───────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Kirim","action":"savesend","route":"vertikaTeknoLokacipta","delay":5,"gpsPosition":"2","flag":"laporan","fakeGpsAllowed":"false","outPositionAllowed":"false","addToTable":"84214220504259//laporan⭘tablevid◼20342033315492⭘d◼◁3▷","chain":{"type":"DO_DIALOG","title":"Berhasil","children":[{"type":"TXT","data":"Data tersimpan."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `alignment` | otomatis (baked) | Perataan | `spaceevenly` |
| `text` (child) | Wajib | Label tombol | `Kirim` |
| `action` | otomatis (baked) | `savesend` — simpan lalu kirim | — |
| `route` | Wajib | Halaman tujuan setelah kirim | `vertikaTeknoLokacipta` |
| `gpsPosition` | Wajib | Slot form tempat koordinat GPS disimpan | `2` |
| `flag` | Wajib | Penanda jenis kiriman untuk backend | `laporan` |
| `fakeGpsAllowed` | Wajib | `true`/`false` — boleh kirim walau GPS palsu terdeteksi | `false` |
| `outPositionAllowed` | Wajib | `true`/`false` — boleh kirim walau di luar area | `false` |
| `addToTable` | Wajib | Perintah tulis 1 baris ke tabel (DSL) | lihat contoh |
| `title` / `confirmation` (chain) | Wajib | Judul & isi dialog konfirmasi | `Berhasil` |

## Posisi field gabungan

Tidak ada field ◆-gabungan; `addToTable` pakai simbol DSL biasa (lihat glossary README).

## Tips & catatan

- Beda dari `sendButtonGpsAddTable` (146): varian `2` menambah penjaga `fakeGpsAllowed`/`outPositionAllowed` (delay 5 detik bawaan).
- `addToTable` = tambah baris baru. Untuk mengubah baris yang ada, pakai tombol keluarga `updateTableRow` (mis. `SendButtonUpdate`).
