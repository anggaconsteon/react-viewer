# TASK_FEED_LIST — rata (`taskFeedListFlat`)

**Status:** LIVE di app (daftar tugas/entitas rata tanpa grup)
**Dev spec:** ADA — `docs/customer-namelist-and-creator-token-dev-spec.md` / `docs/driver-task-feed-p10-dev-spec.md`
**Widget tab:** row 247

## Buat apa

Varian `taskFeedList` (225) yang **rata (flat)** — tanpa pengelompokan — dengan field tampilan lebih fleksibel (PIC, ikon, tanggal, jumlah, badge). Dipakai untuk daftar customer / entitas, bukan cuma tugas rute.

## Tampilan

```
┌─ Daftar Customer ──────────────────┐
│ 🔍 Cari…                           │
│ 👤 Toko Budi · Jl. Merdeka 5       │
│    12 galon · badge                │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_FEED_LIST","vidtable":"20342033315492","table":"84214220504259//stock_location","search":"lt◼customer⭘lst◼active","groupField":"","idField":"lv","titleField":"ln","addressField":"al","picField":"pic","iconField":"","dateField":"","amountField":"","sortField":"ln","sortDir":"asc","searchHint":"Cari customer","badgeTable":"","badgeSearch":"","badgeField":"","badgeLabel":"","seedLabel":"","route":"vertikaTeknoLokaciptaCustomerDetail","countLabel":"customer","emptyText":"Belum ada customer","wizardKey":"create_task","text":"Daftar Customer"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_FEED_LIST` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter | `lt◼customer⭘lst◼active` |
| `groupField` | Opsional | Kosong = daftar rata (flat) | `""` |
| `idField` / `titleField` / `addressField` / `picField` | Wajib | Field id / judul / alamat / PIC | `lv` / `ln` / `al` / `pic` |
| `iconField` / `dateField` / `amountField` | Opsional | Field ikon / tanggal / jumlah | — |
| `sortField` / `sortDir` / `searchHint` | Opsional | Urutan & hint cari | `ln` / `asc` |
| `badgeTable`/`badgeSearch`/`badgeField`/`badgeLabel` | Opsional | Badge dari data lain | — |
| `seedLabel` | Opsional | Label item seed | `""` |
| `route` | Wajib | Halaman detail saat baris di-tap | `…CustomerDetail` |
| `countLabel` / `emptyText` | Opsional | Satuan hitung / teks kosong | `customer` |
| `wizardKey` | Opsional | Kunci wizard (kalau bagian alur buat tugas) | `create_task` |
| `text` | Wajib | Judul | `Daftar Customer` |

## Posisi field gabungan

`text` = judul. `groupField` kosong = tampilan rata (beda dari `taskFeedList` 225 yang bisa dikelompokkan).

## Tips & catatan

- Dipakai untuk daftar customer (name-list) — extend `groupField` optional supaya bisa rata.
- Spec: `docs/customer-namelist-and-creator-token-dev-spec.md`.
