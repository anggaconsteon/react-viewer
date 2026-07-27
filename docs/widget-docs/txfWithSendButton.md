# txf variant `commentBox` (`txfWithSendButton`)

**Status:** LIVE di app (keluarga `txf` — kolom komentar + tombol kirim)
**Widget tab:** row 181

## Buat apa

Kotak isian komentar/catatan dengan **tombol kirim menempel**, bisa lampir foto/berkas — sekali tap kirim, isinya langsung ditulis ke tabel. Dipakai untuk kolom komentar (mis. di halaman detail laporan).

## Tampilan

```
┌────────────────────────────────────┐
│ [ Tulis komentar… ]        [ 📎 ]  │  ← lampiran (kalau aktif)
│                            [ Kirim ]│  ← tombol kirim menempel
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"txf","variant":"commentBox","table":"84214220504259//comment","text":"Komentar","icon":"comment","label":"","hint":"Tulis komentar…","maxLength":500,"size":12,"position":21,"buttonIcon":"send","buttonLabel":"Kirim","disabledWhenEmpty":"true","attachmentEnabled":"true","attachmentFolder":"comment","attachmentFilename":"<no_request>-<timestamp>","attachmentMax":3,"addToTable":"84214220504259//comment⭘tablevid◼20342033315492⭘d◼◁21▷","source":""}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `txf` (field isian) | — |
| `variant` | otomatis (baked) | `commentBox` | — |
| `table` | Wajib | Koleksi tujuan tulis komentar | `84214220504259//comment` |
| `text` | Wajib | Teks yang tampil | `Komentar` |
| `icon` / `buttonIcon` | Wajib | Ikon field / ikon tombol kirim | `comment` / `send` |
| `label` | Opsional | Judul field | `""` |
| `hint` | Wajib | Placeholder | `Tulis komentar…` |
| `maxLength` | Opsional | Batas panjang teks | `500` |
| `size` | Opsional | Ukuran teks | `12` |
| `position` | Wajib | Slot form tempat isi komentar disimpan (`◁N▷`) | `21` |
| `buttonLabel` | Wajib | Label tombol kirim | `Kirim` |
| `disabledWhenEmpty` | Wajib | `true` = tombol mati kalau kosong | `true` |
| `attachmentEnabled` | Wajib | `true` = boleh lampir foto/berkas | `true` |
| `attachmentFolder` | Opsional | Folder simpan lampiran | `comment` |
| `attachmentFilename` | Opsional | Pola nama file lampiran | `<no_request>-<timestamp>` |
| `attachmentMax` | Opsional | Maks jumlah lampiran | `3` |
| `addToTable` | Wajib | Perintah tulis komentar (DSL) | lihat contoh |
| `source` | Opsional | `[?] sumber data — cek dev` | `""` |

## Posisi field gabungan

Tidak ada field ◆-gabungan; `addToTable` pakai simbol DSL (lihat glossary README).

## Tips & catatan

- Gabungan field isi + tombol kirim dalam satu widget — praktis untuk komentar cepat tanpa tombol terpisah.
- `attachmentFilename` mendukung token `<no_request>` / `<timestamp>` untuk nama file otomatis.
