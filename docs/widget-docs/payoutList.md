# PAYOUT_LIST (`payoutList`)

**Status:** Renderer belum ada (config sudah siap & terpasang di halaman RewardPayout; spec dikirim ke dev 2026-07-24)
**Widget tab:** row 307

## Buat apa

Daftar centang ber-nominal untuk "tandai lunas": admin lihat siapa yang belum dibayar, berapa batch, **berapa rupiah** per orang + total yang dipilih, lalu centang (bisa pilih semua) dan tekan tombol tandai lunas. Menggantikan picker nama-doang yang rawan salah transfer. Yang sudah dibayar hilang sendiri dari daftar.

## Tampilan

```
┌─ Belum Dibayar ────────────────────────────┐
│ Total belum ditransfer Rp 15.000 · 5 worker│
│ ☑ Pilih semua (5)          2 dipilih · Rp 8.000
│ ┌──────────────────────────────────────┐  │
│ │ ☑ Ratna                              │  │  nama (labelField)
│ │   @ratna_official22                  │  │  baris-2 (subField)
│ │   3 batch siap · Rp 3.000            │  │  count × rate
│ ├──────────────────────────────────────┤  │
│ │ ☑ Dedi K.  · @dedi.bawangjaya        │  │
│ │   5 batch siap · Rp 5.000            │  │
│ └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
[ Tandai Lunas ]  ← tombol terpisah, membaca hasil pilihan
```

## Contoh JSON

```json
{"type":"PAYOUT_LIST","vidtable":"20342033315492","table":"84214220504259//reward_cache","search":"rd◼1","labelField":"cn","subField":"hn","countField":"bt","valueField":"cv","rate":"1000","sortField":"cn","sortDir":"asc","position":18,"labelPosition":19,"totalPosition":20,"selectAll":true,"joinSep":"|","text":"Belum Dibayar◆Semua worker sudah ditransfer◆Pilih semua ({n})◆{n} dipilih · {total}◆{c} batch siap · {nom}◆Total belum ditransfer {total} · {n} worker"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `PAYOUT_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Data sumber; `search` menyaring yang belum dibayar | `rd◼1` |
| `labelField` | Wajib | Field nama (baris pertama) | `cn` |
| `subField` | Opsional (kosong = 1 baris) | Field baris kedua | `hn` |
| `countField` | Wajib | Field jumlah satuan (misal batch siap) — dipakai hitung nominal | `bt` |
| `valueField` | Wajib | Field id yang dikirim saat dipilih; kosong = id dokumen | `cv` |
| `rate` | Opsional (kosong = tanpa uang) | Rupiah per satuan, dari config sheet (tarif per tenant). Nominal = count × rate; kosong/`0` = kolom nominal disembunyikan | `"1000"` |
| `sortField` / `sortDir` | Wajib | Urutan daftar | `cn` / `asc` |
| `position` | Wajib | Posisi form: id terpilih digabung `\|` | `18` |
| `labelPosition` | Opsional | Posisi form: nama terpilih digabung `\|` (buat teks konfirmasi) | `19` |
| `totalPosition` | Opsional | Posisi form: total nominal terpilih (angka polos, misal `8000`) | `20` |
| `selectAll` | Wajib | `true` = ada baris "Pilih semua"; `false` = pilih satu-satu | `true` |
| `joinSep` | otomatis (baked) | Pemisah gabungan hasil pilihan | `\|` |
| `text` | Wajib | Label UI, 6 bagian `◆` (lihat tabel posisi) | — |

## Posisi field gabungan

`text` — 6 segmen dipisah `◆` (sumber: spec §3b):

| # | Isi | Contoh |
|---|---|---|
| 1 | Judul daftar | `Belum Dibayar` |
| 2 | Teks daftar kosong | `Semua worker sudah ditransfer` |
| 3 | Label pilih semua (`{n}` = jumlah) | `Pilih semua ({n})` |
| 4 | Template jumlah terpilih (`{n}`, `{total}`) | `{n} dipilih · {total}` |
| 5 | Template baris nominal (`{c}` = count, `{nom}` = nominal) | `{c} batch siap · {nom}` |
| 6 | Ringkasan atas (`{total}`, `{n}`) | `Total belum ditransfer {total} · {n} worker` |

## Tips & catatan

- Ganti tarif = ganti `rate` di sheet, nominal langsung ikut — tanpa update aplikasi.
- Transfer uangnya tetap manual di luar app; widget ini hanya memilih + menandai lunas (tombol terpisah yang menulis data).
- `rate` kosong → widget tetap jalan sebagai daftar centang biasa tanpa nominal.
- Sampai renderer selesai, halaman RewardPayout memakai `groupPicker` (nama doang) sebagai pengganti sementara — sudah di-swap config-ahead.
- Spec: `docs/payout-list-widget-dev-spec.md` (induk: `docs/sales-freelance-reward-dev-spec.md`).
