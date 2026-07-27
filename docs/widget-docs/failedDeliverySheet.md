# FAILED_DELIVERY_SHEET (`failedDeliverySheet`)

**Status:** LIVE di app (lembar lapor pengiriman gagal — driver runtime)
**Dev spec:** ADA — `docs/driver-failed-delivery-sheet-dev-spec.md`
**Widget tab:** row 223

## Buat apa

Lembar untuk melaporkan pengiriman **gagal**: pilih alasan dari daftar (dengan penjelasan), tulis catatan tambahan, submit → admin dapat sinyal untuk reschedule. Alasan didefinisikan di config (`reasons`).

## Tampilan

```
┌─ Lapor Delivery Gagal ─────────────┐
│ Pilih Alasan:                      │
│ [ Customer Tutup ] [ Akses Ditolak]│
│ [ Customer Tolak ] [ Kapasitas … ] │
│ Catatan Tambahan [ … ]             │
│ [ Batal ]        [ Lapor Gagal ]   │
└────────────────────────────────────┘
```

## Contoh JSON

(resolved live — dari template Widget row 223)

```json
{"type":"FAILED_DELIVERY_SHEET","failEvent":"","reasons":"customer_closed^Customer Tutup^Lokasi tutup / tidak ada orang~access_denied^Akses Ditolak^Tidak diizinkan masuk lokasi~customer_refused^Customer Tolak^Customer menolak menerima~capacity_full^Kapasitas Penuh^Customer tidak punya tempat","notePosition":9,"text":"Lapor Delivery Gagal◆Pilih Alasan◆Catatan Tambahan◆Detail tambahan untuk admin...◆Setelah submit, admin akan dapat signal untuk reschedule atau create task lanjutan.◆Batal◆Lapor Gagal"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `FAILED_DELIVERY_SHEET` | — |
| `failEvent` | Opsional | Event tambahan saat lapor gagal | `""` |
| `reasons` | Wajib | Daftar alasan — tiap alasan `kode^Label^Penjelasan`, antar-alasan dipisah `~` | lihat contoh |
| `notePosition` | Wajib | Slot form catatan tambahan | `9` |
| `text` | Wajib | Semua label (7 segmen `◆`) | lihat tabel posisi |

## Posisi field gabungan

`reasons` — pola `kode^Label^Penjelasan~kode^Label^Penjelasan…` (pemisah `^` dalam alasan, `~` antar-alasan). `text` — 7 segmen `◆`: judul / label pilih alasan / label catatan / hint catatan / pesan info submit / tombol batal / tombol lapor.

## Tips & catatan

- Alasan gagal 100% dari config (`reasons`) — owner bisa ubah tanpa update aplikasi.
- Perhatikan pemisah **`^` dan `~`** di `reasons` (bukan `◆`).
- Spec: `docs/driver-failed-delivery-sheet-dev-spec.md`.
