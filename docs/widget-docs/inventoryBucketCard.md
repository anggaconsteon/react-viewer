# INVENTORY_BUCKET_CARD (`inventoryBucketCard`)

**Status:** LIVE di app (kartu ringkasan stok per kategori — driver runtime)
**Dev spec:** ADA — `docs/driverhome-p4-dev-spec.md` §3.4 + `docs/inventory-bucket-hidezero-dev-spec.md`
**Widget tab:** row 203

## Buat apa

Kartu yang meringkas stok/muatan ke dalam **kelompok (bucket)** per kategori — mis. berapa galon isi, galon kosong, tabung. Dipakai di beranda driver untuk lihat cepat isi kendaraan.

## Tampilan

```
┌─ Isi kendaraan ────────────────────┐
│ Galon isi     12                   │  ← bucket per kategori
│ Galon kosong   4                   │
│ Tabung 3kg     8                   │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"INVENTORY_BUCKET_CARD","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"dv◼{userVid}","categoryField":"cd","buckets":"Galon isi◆Galon kosong◆Tabung","hideZero":"TRUE","gateTable":"84214220504259//vehicle_check","gateSearch":"dv◼{userVid}","icon":"inventory","text":"Isi kendaraan◆Belum ada muatan","itemTable":""}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `INVENTORY_BUCKET_CARD` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data stok | `dv◼{userVid}` |
| `categoryField` | Wajib | Field kategori item (dasar pengelompokan) | `cd` |
| `buckets` | Wajib | Daftar kelompok yang ditampilkan (dipisah `◆`) | `Galon isi◆Galon kosong◆Tabung` |
| `hideZero` | Opsional | `TRUE` = sembunyikan bucket bersaldo 0 | `TRUE` |
| `gateTable` / `gateSearch` | Opsional | Pengecek apakah kartu tampil | `dv◼{userVid}` |
| `icon` | Opsional | Ikon kartu | `inventory` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Isi kendaraan◆Belum ada muatan` |
| `itemTable` | Opsional | `[?] tabel item tambahan — cek dev` | `""` |

## Posisi field gabungan

`buckets` dan `text` dipisah `◆`. Angka per bucket dihitung sistem dari data (bukan diisi manual).

## Tips & catatan

- `hideZero:"TRUE"` = skip item saldo 0 (per spec hidezero).
- Kartu ini bisa disembunyikan saat kondisi terkunci (mis. `gateSearch`) — per spec driver home.
- Spec: `docs/driverhome-p4-dev-spec.md` §3.4, `docs/inventory-bucket-hidezero-dev-spec.md`.
