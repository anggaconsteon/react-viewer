# STEPPER (`stepper`)

**Status:** LIVE di app (spec v1.0 2026-05-26; renderer 4 varian)
**Widget tab:** row 190

## Buat apa

Input angka dengan tombol `[−]` dan `[+]` — untuk memilih jumlah tanpa mengetik. Satu widget mencakup 4 gaya: counter biasa, dengan satuan + teks bantu (mis. "36 tersisa"), tekan-tahan cepat, dan versi ringkas. Tombol otomatis mati saat mentok batas min/maks.

## Tampilan

```
Galon 19L
Stok tersedia: 48          [−] 12 pcs [+]
                           36 tersisa setelah pengambilan   ← teks bantu (<remain>)
```

## Contoh JSON

(contoh resolved — spec §6.2, varian `withUnit`)

```json
{"type":"STEPPER","variant":"withUnit","icon":"","currentValue":"12","min":0,"max":48,"step":1,"longPress":"FALSE","stockAvailable":48,"position":4,"text":"Galon 19L◆Stok tersedia: 48◆pcs◆<remain> tersisa setelah pengambilan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `STEPPER` | — |
| `variant` | Wajib | `default` / `withUnit` / `longPress` / `compact` | `withUnit` |
| `icon` | Opsional | Ikon (kode/nama material); kosong = tanpa ikon | `""` |
| `currentValue` | Wajib | Nilai awal (ditulis sebagai teks), harus di antara min–max | `"12"` |
| `min` | Wajib | Batas bawah — `[−]` mati saat nilai = min | `0` |
| `max` | Wajib | Batas atas — `[+]` mati saat nilai = max | `48` |
| `step` | Opsional | Loncatan per tap | `1` |
| `longPress` | Opsional | `"TRUE"` = tahan tombol untuk cepat | `"FALSE"` |
| `stockAvailable` | Opsional | Sumber angka untuk token `<remain>`; `0` = tanpa batas stok | `48` |
| `position` | Wajib | Slot form tempat nilai disimpan (`◁N▷`) | `4` |
| `text` | Wajib | 4 bagian `◆` (lihat tabel posisi) | — |

## Posisi field gabungan

`text` — 4 segmen dipisah `◆` (sumber: spec §4). Segmen kosong tetap ditulis `◆`:

| # | Isi | Contoh |
|---|---|---|
| 1 | Judul (wajib) | `Galon 19L` |
| 2 | Subjudul (range/stok/hint) | `Stok tersedia: 48` |
| 3 | Satuan (tampil di samping angka) | `pcs` |
| 4 | Teks bantu di bawah — dukung token `<remain>` | `<remain> tersisa setelah pengambilan` |

## Tips & catatan

- Token `<remain>` = `stockAvailable − currentValue`, dihitung live saat angka berubah (mis. stok 48, isi 12 → "36 tersisa"). Kalau `stockAvailable` = 0, teks bantu disembunyikan/`<remain>` mentah.
- Batas mati otomatis dari `min`/`max` — tidak ada field terpisah untuk itu.
- Nilai stepper dibaca tombol kirim lewat `◁[position]▷` di `addToTable`.
- `longPress` ditulis sebagai teks `"TRUE"`/`"FALSE"` (bukan boolean).
- Spec lengkap: `docs/stepper-widget-dev-spec.md`.
