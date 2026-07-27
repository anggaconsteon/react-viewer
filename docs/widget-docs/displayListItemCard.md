# LIST_ITEM_CARD (`displayListItemCard`)

**Status:** LIVE di app (daftar kartu satu-route — versi kini; `displayList` = versi lama)
**Widget tab:** row 177

## Buat apa

Daftar kartu dari data koleksi, tiap kartu bisa punya **tombol aksi** (mis. Setujui/Tolak) + navigasi ke halaman detail saat di-tap. Dipakai untuk antrian/daftar item yang butuh tindakan.

## Tampilan

```
┌──────────────────────────────────┐
│ Judul item                       │
│ detail…                          │
│ [ Tombol 1 ]   [ Tombol 2 ]      │  ← buttons[] (warna + aksi masing-masing)
└──────────────────────────────────┘
Tap kartu → route detail.
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar; 1 tombol)

```json
{"type":"LIST_ITEM_CARD","flag":"antrian","vidtable":"20342033315492","table":"84214220504259//request","search":"st◼menunggu","conditions":"","toDo":"","role":"","text":"Antrian Persetujuan◆Menunggu◆item","route":"vertikaTeknoLokaciptaRequestDetail","buttons":[{"text":"Setujui","color":"green","actions":"approve","event":"","chain":{"type":"DO_DIALOG","title":"OK","children":[{"type":"TXT","data":"Terkirim."},{"type":"RBT","alignment":"center","children":[{"text":"OK","route":"vertikaTeknoLokaciptaRequestDetail"}]}]}}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `LIST_ITEM_CARD` | — |
| `flag` | Wajib | Penanda daftar untuk backend | `antrian` |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter | `st◼menunggu` |
| `conditions` | Opsional | Syarat tampil tambahan | `""` |
| `toDo` | Opsional | `[?] belum terdokumentasi — cek dev` | `""` |
| `role` | Opsional | `[?] pembatas peran — cek dev` | `""` |
| `text` | Wajib | Label header/daftar (dipisah `◆`) | `Antrian…◆Menunggu◆item` |
| `route` | Wajib | Halaman detail saat kartu di-tap | `…RequestDetail` |
| `buttons[]` | Opsional (kosong = tanpa tombol) | Tombol aksi per kartu | 1-2 tombol |
| · `text` / `color` | Wajib | Label & warna tombol | `Setujui` / `green` |
| · `actions` | Wajib | Aksi yang dijalankan | `approve` |
| · `event` | Opsional | Perintah tulis event (DSL) | `""` |
| · `chain` | Opsional | Dialog konfirmasi setelah aksi | lihat contoh |

## Posisi field gabungan

`text` dipisah `◆`; posisi persis belum terdaftar di dict `widget_field_positions`. `[?]` Urutan segmen `text` belum terdokumentasi — konfirmasi ke dev (perkiraan: judul / status / satuan item).

## Tips & catatan

- Ini versi kini untuk daftar satu-route; `displayList` = versi lama. Untuk daftar tanpa tombol aksi, ada `displayListItemCardWithoutButton` (row 185).
- Widget list yang lebih baru & lebih rapi field-nya: `listCard` (universal), `listActionCard` (approve/reject inline + posisi ◆ terdokumentasi).
