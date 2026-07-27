# TASKLIST (`tasklist`)

**Status:** Status renderer belum terkonfirmasi — cek dev (di katalog widget masih ditandai `[draft]`)
**Widget tab:** row 171

## Buat apa

Daftar tugas/pilihan dalam satu kategori yang bisa dicentang — hasilnya disimpan ke satu slot form. Judul di atas, opsi-opsi di bawahnya.

## Tampilan

```
┌ [TITLE] ───────────────────────────┐
│  ☐ Opsi A                          │
│  ☐ Opsi B                          │
│  ☐ Opsi C                          │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASKLIST","position":10,"width":"100","height":40,"borderRadius":10,"category":"kebersihan","margin":"0,0,0,0","text":"Ceklis Kebersihan◆Sampah◆Lantai◆Toilet"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASKLIST` | — |
| `position` | Wajib | Slot form tempat hasil pilihan disimpan (`◁N▷`) | `10` |
| `width` / `height` / `borderRadius` | Opsional | Ukuran & sudut | `100` / `40` / `10` |
| `category` | Wajib | `[?] pengelompok / sumber daftar tugas — cek dev` | `kebersihan` |
| `margin` | Wajib | Jarak sekeliling | `0,0,0,0` |
| `text` | Wajib | Judul + opsi, dipisah `◆` (segmen 1 = judul, sisanya = opsi) | `Ceklis Kebersihan◆Sampah◆Lantai◆Toilet` |

## Posisi field gabungan

`text` — segmen `◆` (sumber: template):

| # | Isi |
|---|---|
| 1 | Judul daftar |
| 2+ | Tiap opsi (satu segmen per opsi) |

## Tips & catatan

- `[?]` Peran `category` (apakah menyaring daftar dari data atau sekadar label kelompok) belum ada spec tertulis — konfirmasi ke dev.
- Untuk daftar tugas berbasis data koleksi (bukan opsi statis), lihat keluarga `taskFeedList`/`runningTaskList`/`taskItemBuilder`.
