# LIST_ITEM_CARD tanpa tombol (`displayListItemCardWithoutButton`)

**Status:** LIVE di app (varian `LIST_ITEM_CARD` tanpa tombol aksi)
**Widget tab:** row 185

## Buat apa

Daftar kartu dari data koleksi **tanpa tombol aksi** — hanya tampil + bisa di-tap ke halaman detail. Dipakai kalau daftar cuma untuk dilihat/dibuka, bukan diproses langsung dari list.

## Tampilan

```
┌──────────────────────────────────┐
│ 🔷 Judul item          [▓▓▓░ 60%]│  ← showIcon / showProgress opsional
│    detail…                       │
└──────────────────────────────────┘
Tap kartu → route detail.
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"LIST_ITEM_CARD","ledgerCode":"task","vidtable":"20342033315492","table":"84214220504259//task","search":"st◼jalan","toDo":"","text":"Tugas Berjalan◆Sedang dikerjakan◆tugas","route":"vertikaTeknoLokaciptaTaskDetail","showIcon":"true","showProgress":"true"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `LIST_ITEM_CARD` | — |
| `ledgerCode` | Wajib | `[?] kode kategori/ledger — cek dev` | `task` |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter | `st◼jalan` |
| `toDo` | Opsional | `[?] belum terdokumentasi — cek dev` | `""` |
| `text` | Wajib | Label header/daftar (dipisah `◆`) | `Tugas Berjalan◆Sedang…◆tugas` |
| `route` | Wajib | Halaman detail saat kartu di-tap | `…TaskDetail` |
| `showIcon` | Opsional | `true`/`false` — tampil ikon | `true` |
| `showProgress` | Opsional | `true`/`false` — tampil bar kemajuan | `true` |

## Posisi field gabungan

`text` dipisah `◆`; `[?]` urutan segmen belum terdaftar di dict `widget_field_positions` — perkiraan: judul / subjudul / satuan item. Konfirmasi ke dev.

## Tips & catatan

- Sama seperti `displayListItemCard` (177) tapi tanpa `buttons[]` — untuk daftar yang hanya dilihat/dibuka.
- Widget list lebih baru & field-nya lebih terdokumentasi: `listCard` (universal).
