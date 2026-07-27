# STAT_CARD_ROW (`statCardRow`)

**Status:** Renderer belum ada (config sudah siap) — pengaturan di sheet sudah terpasang dan dipakai halaman Reward Posting, tapi aplikasi belum bisa menampilkannya sampai dev Flutter selesai (spec dikirim ke dev 2026-07-24).
**Widget tab:** row 306

## Buat apa

Menampilkan deretan kartu angka ringkas dalam satu baris — angka besar di atas, label kecil di bawah. Contoh: "17 Approved · 1 Batch siap · 3 Menunggu". Dipakai kalau halaman butuh ringkasan angka yang sudah dihitung sistem (misalnya beranda worker reward). Widget ini cuma membaca satu dokumen data yang angkanya sudah jadi — dia tidak menghitung apa-apa.

## Tampilan

(salinan dari dev spec)

```
┌─────────┐ ┌═════════┐ ┌─────────┐
│   17    │ ║    1    ║ │    3    │     angka gede (bold)
│Approved │ ║Batch    ║ │Menunggu │     label kecil muted
└─────────┘ ║siap     ║ └─────────┘
   tone:ok  └═════════┘  tone:muted
             highlight (border tone accent)
```

Kartu sama lebar, satu baris. Lebih dari 4 kartu → turun ke baris kedua. Dokumen tidak ketemu → seluruh baris diganti satu baris tulisan dari `text`.

## Contoh JSON

Contoh nyata dari halaman Reward Posting (RewardHome) yang sudah terpasang:

```json
{
  "type": "STAT_CARD_ROW",
  "vidtable": "20342033315492",
  "table": "84214220504259//reward_cache",
  "search": "cv◼87544551624342",
  "cards": "Approved◼ap◼ok★Batch siap◼bt◼accent★Menunggu◼pnd◼muted",
  "highlight": "bt",
  "text": "Belum ada data reward — mulai submit bukti hari ini"
}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | Wajib (sudah terpasang di template) | Selalu `STAT_CARD_ROW` | `STAT_CARD_ROW` |
| `vidtable` | Wajib | Field umum (lihat glossary README) | `20342033315492` |
| `table` | Wajib | Alamat tabel yang dibaca — widget ambil **1 dokumen** dari sini | `84214220504259//reward_cache` |
| `search` | Wajib | Kunci pencari 1 dokumen, bentuk `field◼nilai` (cuma cocok persis). 0 dokumen ketemu → tampil `text` | `cv◼87544551624342` |
| `cards` | Wajib | Daftar kartu. Per kartu `Label◼field◼tone`, antar kartu disambung `★`. Jumlah bebas (1–4 wajar; lebih → wrap 2 baris). Rincian di tabel posisi di bawah | `Approved◼ap◼ok★Batch siap◼bt◼accent` |
| `highlight` | Opsional | Nama field yang kartunya ditonjolkan (border/latar lebih tebal). Kosong = semua kartu tampil biasa | `bt` |
| `text` | Wajib | Tulisan pengganti kalau dokumen tidak ketemu (1 baris, menggantikan seluruh baris kartu) | `Belum ada data reward — mulai submit bukti hari ini` |

## Posisi ◆ (field gabungan)

`statCardRow` belum terdaftar di dict tab `widget_field_positions`. Field gabungannya cuma `cards`, dan pemisahnya `★` (antar kartu) + `◼` (di dalam kartu) — bukan `◆`. Rincian per kartu (sumber: dev spec §3):

| Sub-posisi (dalam 1 kartu) | Isi | Contoh |
|---|---|---|
| 1 | Label kartu — teks bebas, tampil kecil di bawah angka | `Approved` |
| 2 | Nama field di dokumen yang angkanya ditampilkan | `ap` |
| 3 | Tone warna: `ok` · `warn` · `danger` · `accent` · `muted`. Warna ikut THEME aplikasi — tidak bisa pilih warna sendiri di sini | `ok` |

## Tips & catatan

- Field tidak ada di dokumen → tampil `0` (bukan kosong/error). Nilai berupa teks tampil apa adanya.
- Tone salah ketik → otomatis jatuh ke `muted`, widget tetap tampil.
- Ganti label, tambah/kurangi kartu = cukup edit `cards` di sheet — tidak perlu update aplikasi.
- Yang sengaja TIDAK bisa (dari spec, bagian Not Doing):
  - Tidak menghitung/menjumlah data sendiri — angka harus sudah jadi di dokumen. Butuh hitungan live → itu tugas LIST_STATISTIC_CARD, widget berbeda.
  - Kartu tidak bisa di-tap untuk pindah halaman (v1 tampilan saja).
  - Warna bebas (kode hex) di config — ditolak, warna selalu dari theme.
  - Grafik tren / sparkline / ikon — tidak dibuat.
- Catatan dari spec §12: tone `accent`/`muted` tergantung theme aplikasi punya warna itu; kalau belum ada, dev memetakan ke warna terdekat.
- Widget terkait: `detailCard` (DETAIL_CARD) — mesin baca datanya sama, tapi DETAIL_CARD untuk halaman detail (baris kunci-nilai). Dulu stat ini dipaksakan pakai DETAIL_CARD dan hasilnya jelek di device — `statCardRow` dibuat untuk menggantikannya.

### Catatan teknis

Pemakai pertama: `RewardHome@1005` (widget row 1007, sudah di-swap dari `detailCard` 2026-07-24, resolve bersih). Engine baca data sama dengan DETAIL_CARD (keyed read `table`+`search`). Spec: `docs/stat-card-row-widget-dev-spec.md` (induk: `docs/sales-freelance-reward-dev-spec.md`).
