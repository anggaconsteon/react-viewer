# GROUP_PICKER (`groupPicker`)

**Status:** LIVE di app (sumber `doc` + `table` terkonfirmasi jalan 2026-07-24; dipakai broadcast & payout)
**Widget tab:** row 302

## Buat apa

Picker universal dengan tab level di dalamnya: user pilih dulu kelompok (misal Cost Center / Site / Orang), lalu centang target di kelompok itu. Semua interaksi terjadi di dalam 1 widget (widget lain di halaman tidak bisa saling bereaksi — itu alasan desain ini). Bisa juga dipakai sebagai picker biasa tanpa tab (1 kelompok, `selector:"none"`).

## Tampilan

```
┌─ Kirim ke ─────────────────────────────────┐
│ ┌──────────────┐┌──────┐┌───────┐          │  selector:"segmented"
│ │ Cost Center ▉││ Site ││ Orang │          │  tab aktif = terisi
│ └──────────────┘└──────┘└───────┘          │
│  🔍 Cari…                                  │
│  ┌──────────────────────────────────────┐ │
│  │ ☑  Product Group                     │ │  multi = checkbox
│  │ ☑  Kantor Pusat                      │ │  tampil NAMA, kirim id
│  │ ☐  Cabang Bandung                    │ │
│  └──────────────────────────────────────┘ │
│  2 dipilih                                 │
└────────────────────────────────────────────┘
```

## Contoh JSON

(live TestBroadcast — 3 kelompok baca 1 dokumen `notification_grant`, field beda per tab)

```json
{"type":"GROUP_PICKER","mode":"multi","selector":"segmented","display":"inline","keyPosition":18,"valuePosition":19,"labelPosition":20,"pairSep":"◆","itemSep":"⭘","selectAll":true,"joinSep":"|","title":"Kirim ke","hint":"Pilih level lalu centang target","text":"Cari◆Data tidak ditemukan◆Pilih◆Batal◆{n} dipilih","groups":[{"key":"cc","label":"Cost Center","src":"doc","vidtable":"20342033315492","table":"84214220504259//notification_grant","search":"gk◼broadcast_◁sessionVid▷","field":"cc"},{"key":"site","label":"Site","src":"doc","vidtable":"20342033315492","table":"84214220504259//notification_grant","search":"gk◼broadcast_◁sessionVid▷","field":"site"},{"key":"vid","label":"Orang","src":"doc","vidtable":"20342033315492","table":"84214220504259//notification_grant","search":"gk◼broadcast_◁sessionVid▷","field":"vid"}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `GROUP_PICKER` | — |
| `mode` | Wajib | `single` (pilih 1, radio) / `multi` (centang banyak) | `multi` |
| `selector` | Wajib | Bentuk pemilih kelompok: `segmented` (tab) / `dropdown` / `none` (sembunyikan — picker biasa) | `segmented` |
| `display` | Wajib | `inline` (langsung di halaman) / `sheet` (field ringkas → tap → bottom-sheet) | `inline` |
| `keyPosition` | Wajib | Posisi form tempat **kode kelompok aktif** disimpan (broadcast: jadi `blv`) | `18` |
| `valuePosition` | Wajib | Posisi form tempat **id terpilih** disimpan; multi = digabung `joinSep` (broadcast: jadi target) | `19` |
| `labelPosition` | Opsional (kosong = off) | Posisi form untuk **nama** terpilih (buat teks konfirmasi) | `20` |
| `pairSep` / `itemSep` | otomatis (baked) | Pemisah data mentah: `nama◆id⭘nama◆id` | `◆` / `⭘` |
| `selectAll` | otomatis (baked `true`) | Baris "pilih semua" | `true` |
| `joinSep` | otomatis (baked) | Pemisah gabungan id hasil pilihan | `\|` |
| `title` / `hint` | Wajib | Judul & petunjuk di atas picker | `Kirim ke` |
| `text` | Wajib | Label UI, 5 bagian `◆` (lihat tabel posisi) | — |
| `groups[]` — per slot (3 slot; slot tak terpakai dikosongkan): | | | |
| · `key` | Wajib | Kode kelompok yang dikirim ke `keyPosition` | `cc` |
| · `label` | Wajib | Nama tab | `Cost Center` |
| · `src` | Wajib | Sumber pilihan: `static` (teks di config) / `doc` (1 dokumen, 1 field teks) / `table` (query tabel) | `doc` |
| · `options` | Untuk `static` | Daftar pilihan langsung: `nama◆id⭘nama◆id` | — |
| · `vidtable` / `table` / `search` | Untuk `doc`/`table` | Lokasi + filter data (shared 3 slot di template) | lihat contoh |
| · `field` | Untuk `doc` | Nama field di dokumen yang berisi daftar `nama◆id⭘…` | `cc` |
| · `labelField` / `subField` / `valueField` | Untuk `table` | Field nama / baris-2 / id per baris data | `n` / `ps` / `vid` |

## Posisi field gabungan

`text` — 5 segmen dipisah `◆` (sumber: spec):

| # | Isi | Contoh |
|---|---|---|
| 1 | Hint kolom cari | `Cari` |
| 2 | Teks daftar kosong | `Data tidak ditemukan` |
| 3 | Label pilih | `Pilih` |
| 4 | Label batal | `Batal` |
| 5 | Template jumlah terpilih (`{n}`) | `{n} dipilih` |

## Tips & catatan

- Picker = pembatas otorisasi: yang tampil hanya isi dokumen grant milik user login (`gk◼broadcast_◁sessionVid▷`) — backend percaya pilihan picker, jadi jangan isi sumber dengan data di luar hak user.
- Tampil **nama**, yang terkirim **id** — jangan kaget nilai tersimpan berupa angka panjang.
- 1 kelompok + `selector:"none"` = pengganti `tablePicker` biasa.
- Belum bisa: kelompok saling filter (pilih CC → daftar Site ikut menyempit) — v2.
- Konsumen live: TestBroadcast (broadcast), RewardPayout (interim, akan diganti `payoutList`). Spec: `docs/group-picker-widget-dev-spec.md` + `docs/group-picker-src-doc-dev-spec.md`.
