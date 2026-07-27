# RBT — tombol kirim + notifikasi push (`sendButtonNotification`)

**Status:** LIVE di app (dipakai halaman TestBroadcast; pengiriman notifikasi lewat backend broadcast)
**Widget tab:** row 301

## Buat apa

Tombol kirim (simpan data + tutup halaman) yang sekaligus mengirim **notifikasi push** ke penerima terpilih — dipakai fitur broadcast/pengumuman. Setelah kirim, muncul dialog konfirmasi "Terkirim".

## Tampilan

```
[ Kirim Pengumuman ]  ── tap ──▶ simpan event + kirim notif
                                   │
                                   ▼
                        ┌─ Pengumuman ──────────────┐
                        │ Terkirim — pengumuman     │
                        │ dikirim ke target.        │
                        │          [ Ok ]           │
                        └───────────────────────────┘
```

## Contoh JSON

(dari referensi live halaman broadcast — produksi: `target` diisi `◁19▷` dari groupPicker, `message` = `◁3▷` dari input pesan)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Kirim Pengumuman","action":"savesend","route":"vertikaTeknoLokacipta","delay":5,"gpsPosition":2,"flag":"announcement","addToTable":"","addToEvent":"84214220504259//event⭘r◼4320⭘tablevid◼20342033315492⭘ty◼announcement⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶⭘cv◼85924392055168⭘cn◼Muhamad Angga⭘sv◼83674161979544⭘sn◼Product Group⭘av◼83674161979544⭘an◼Product Group","updateEventRow":"","notification":{"mode":"broadcast","target":"◁19▷","title":"Pengumuman","message":"◁3▷"},"chain":{"type":"DO_DIALOG","title":"Pengumuman","children":[{"type":"TXT","data":"Terkirim — pengumuman dikirim ke semua tim se-site.","route":""},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `text` (child) | Wajib | Label tombol | `Kirim Pengumuman` |
| `route` | Wajib | Halaman tujuan setelah kirim (dipakai juga tombol Ok dialog) | `vertikaTeknoLokacipta` |
| `gpsPosition` | Opsional | Posisi form tempat koordinat GPS disimpan saat kirim | `2` |
| `flag` | Wajib | Penanda jenis kiriman untuk backend | `announcement` |
| `addToTable` / `addToEvent` / `updateEventRow` | Minimal salah satu | Perintah tulis data (DSL); untuk broadcast yang dipakai `addToEvent` | lihat contoh |
| `notification.mode` | Wajib | Jenis notifikasi — `broadcast` | `broadcast` |
| `notification.target` | Wajib | Penerima: id atau gabungan id; boleh token `◁N▷` (biasanya hasil groupPicker) | `◁19▷` |
| `notification.title` | Wajib | Judul notifikasi di HP penerima | `Pengumuman` |
| `notification.message` | Wajib | Isi notifikasi; boleh token `◁N▷` + `{nama}` (diganti nama tiap penerima oleh backend) | `◁3▷` |
| `title` (chain) | Wajib | Judul dialog konfirmasi | `Pengumuman` |
| `confirmation` (chain TXT) | Wajib | Teks dialog konfirmasi | `Terkirim — …` |

## Posisi field gabungan

Tidak ada field ◆-gabungan. `addToEvent`/`notification.target` memakai simbol DSL biasa (lihat glossary README).

## Tips & catatan

- Pembagian tugas (jangan dibalik): **level** pilihan (`blv◼◁18▷`) masuk `addToEvent`; **penerima/judul/pesan** masuk objek `notification` — bukan di string addToEvent.
- `{nama}` di message ditulis apa adanya; backend yang menggantinya per penerima.
- Pasangan wajib: `groupPicker` (pemilih penerima, mengisi ◁18▷/◁19▷) + input pesan (◁3▷).
- Delay bawaan 5 detik sebelum kirim (bisa dibatalkan user) — baked di template.
- Spec: `docs/broadcast-page-dev-spec.md` §3.
