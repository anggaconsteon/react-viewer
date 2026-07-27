# TXT + gerbang tampil (`textSearch`)

**Status:** LIVE di app (teks statis dengan gerbang `search`)
**Widget tab:** row 191

## Buat apa

Teks statis biasa yang **hanya muncul kalau kondisi `search` terpenuhi**. Dipakai untuk label/keterangan bersyarat — mis. tampilkan "Menunggu persetujuan" hanya kalau status = menunggu.

## Tampilan

```
Teks tampil       ← hanya kalau data cocok dengan `search`
(kosong)          ← kalau tidak cocok, teks tidak muncul
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TXT","size":18,"data":"Menunggu persetujuan atasan","search":"st◼menunggu"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TXT` | — |
| `size` | otomatis (baked) | Ukuran teks | `18` |
| `data` | Wajib | Isi teks | `Menunggu persetujuan atasan` |
| `search` | Wajib | Gerbang tampil: `field◼nilai` — teks muncul hanya kalau data cocok | `st◼menunggu` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- Beda dari `text` biasa (row 6): `textSearch` punya `search` sebagai **gerbang tampil**. Sama dengan pola gerbang tampil di tombol (child `search:"field◼nilai"`).
- Untuk teks bergaya (judul bagian / timeline), lihat `textVariant`.
