# RBT — tombol pindah halaman (`routeBtn`)

**Status:** LIVE di app (tombol dasar RBT; dipakai halaman Titik Absensi)
**Widget tab:** row 303

## Buat apa

Tombol sederhana untuk pindah ke halaman lain — tanpa menyimpan data apa pun. Contoh: tombol "+ Tambah Titik" yang membuka form tambah titik. Bisa membawa data ke halaman tujuan lewat `routeParams`.

## Tampilan

```
        [ + Tambah Titik ]          ← 1 tombol, warna & posisi dari config
```

## Contoh JSON

(live — tombol "+ Tambah Titik" halaman TitikSiteList)

```json
{"type":"RBT","alignment":"center","search":"","children":[{"text":"+ Tambah Titik","route":"vertikaTeknoLokaciptaTitikPatroli","routeParams":"","buttonColor":"blue","textColor":"white"}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `RBT` (tombol) | — |
| `alignment` | Wajib | Posisi tombol: `center` / `spaceevenly` dll | `center` |
| `search` | Wajib (boleh kosong) | `"sticky"` = tombol nempel di bawah layar; `""` = ikut isi halaman biasa | `""` |
| `text` (child) | Wajib | Label tombol | `+ Tambah Titik` |
| `route` | Wajib | Halaman tujuan | `…TitikPatroli` |
| `routeParams` | Opsional (kosong = off) | Data yang dibawa ke halaman tujuan: `key◼{field}` | `sv◼{sv}` |
| `buttonColor` | Wajib | Warna tombol | `blue` |
| `textColor` | otomatis (baked) | Warna teks | `white` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- Beda dengan keluarga `workflowBtn` (row 283-289): keluarga itu semua `search:"sticky"` (nempel footer, tidak muncul di badan halaman). `routeBtn` dibuat justru supaya sticky-nya bisa diatur.
- ⚠ Belum diverifikasi di device: `search:""` seharusnya tampil biasa di badan halaman — kalau tombol malah hilang, laporkan ke dev (catatan spec).
- ⚠ `routeParams` lebih dari 1 pasangan (`a◼{x}⭘b◼{y}`): kasus lapangan pernah menunjukkan bagian setelah `⭘` tidak terbawa — status dukungan multi-pasangan masih dicek dev. Aman: 1 pasangan.
- Tombol yang MENYIMPAN data bukan ini — itu keluarga `sendButton…`/`workflow…`.
