# SIGNATURE_PAD (`signaturePad`)

**Status:** LIVE di app (renderer selesai 2026-06-23; generic)
**Dev spec:** ⚠ TIDAK ADA spec khusus — tercakup di `docs/driver-runtime-widgets-MASTER-handoff.md` (bukan spec sendiri)
**Widget tab:** row 221

## Buat apa

Area tanda tangan: penerima membubuhkan tanda tangan di layar, hasilnya disimpan (gambar) ke slot form / field. Dipakai sebagai bukti serah-terima pengiriman.

## Tampilan

```
┌─ Tanda tangan penerima ────────────┐
│                                    │
│        ✍  (area gores)             │
│                                    │
│ [ Hapus ]                          │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"SIGNATURE_PAD","optional":"FALSE","position":10,"writeField":"sig","text":"Tanda tangan penerima◆Hapus"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `SIGNATURE_PAD` | — |
| `optional` | Wajib | `TRUE`/`FALSE` — boleh dikosongkan atau wajib | `FALSE` |
| `position` | Wajib | Slot form tempat hasil tanda tangan disimpan (`◁N▷`) | `10` |
| `writeField` | Opsional | Field tujuan simpan (kalau langsung ke data) | `sig` |
| `text` | Wajib | Judul + label tombol hapus (dipisah `◆`) | `Tanda tangan penerima◆Hapus` |

## Posisi field gabungan

`text` dipisah `◆` (judul / label hapus).

## Tips & catatan

- `optional:"FALSE"` = wajib tanda tangan sebelum submit.
- Generik — bisa dipakai di luar driver (bukti persetujuan apa pun).
- Belum ada dev spec khusus; rujukan: `docs/driver-runtime-widgets-MASTER-handoff.md`.
