# PICKER_LIST (`pickerList`)

**Status:** LIVE di app (daftar pilih generik + status/hitung/busy)
**Dev spec:** ADA — `docs/picker-list-widget-dev-spec.md`
**Widget tab:** row 248

## Buat apa

Daftar untuk **memilih satu entitas** (customer, kendaraan, pekerja, dll.) dengan info pendukung: subjudul, meta, hitung terkait, status on/off, penanda sibuk. Saat dipilih, id ditangkap ke token untuk halaman berikutnya. Picker serba-guna wizard.

## Tampilan

```
┌─ Pilih ────────────────────────────┐
│ 🔷 Toko Budi         [aktif]       │  ← title + status
│    Jl. Merdeka · 3 tugas           │  ← sub + count
│ [ Ad-hoc / Nanti ]                 │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"PICKER_LIST","mode":"single","vidtable":"20342033315492","table":"84214220504259//stock_location","search":"lt◼customer⭘lst◼active","titleField":"ln","subField":"al","metaField":"pic","busySelfField":"","busySelfLabelField":"","countTable":"84214220504259//task","countSearch":"kl◼{lv}⭘tst◼assigned","statusSearch":"lst◼active","statusOnLabel":"aktif","statusOffLabel":"nonaktif","rowIcon":"store","titleMono":"FALSE","accentColor":"","captureToken":"customerId","wizardKey":"create_task","route":"vertikaTeknoLokaciptaCreateTaskItem","routeParams":"customerId◼{lv}","adhocLabel":"Ad-hoc / Nanti","emptyText":"Belum ada data","text":"Pilih Customer◆Cari"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `PICKER_LIST` | — |
| `mode` | Wajib | `single` (pilih satu) | `single` |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter | `lt◼customer⭘lst◼active` |
| `titleField` / `subField` / `metaField` | Wajib | Field judul / subjudul / meta | `ln` / `al` / `pic` |
| `busySelfField` / `busySelfLabelField` | Opsional | Penanda sibuk + label | — |
| `countTable` / `countSearch` | Opsional | Hitung entitas terkait per baris | `task` / `kl◼{lv}⭘tst◼assigned` |
| `statusSearch` / `statusOnLabel` / `statusOffLabel` | Opsional | Aturan & label status on/off | `lst◼active` / `aktif` |
| `rowIcon` / `titleMono` / `accentColor` | Opsional | Ikon baris / judul monospace / warna aksen | `store` |
| `captureToken` | Wajib | Token yang diisi id terpilih | `customerId` |
| `wizardKey` | Opsional | Kunci wizard | `create_task` |
| `route` / `routeParams` | Wajib | Halaman tujuan + data yang dibawa | `…CreateTaskItem` / `customerId◼{lv}` |
| `adhocLabel` / `emptyText` | Opsional | Label ad-hoc / teks kosong | `Ad-hoc / Nanti` |
| `text` | Wajib | Judul + hint cari (dipisah `◆`) | `Pilih Customer◆Cari` |

## Posisi field gabungan

`text` dipisah `◆` (judul / hint cari).

## Tips & catatan

- Picker generik — ganti `table`/field untuk pilih customer/kendaraan/pekerja tanpa widget baru.
- `captureToken` + `routeParams` bawa id terpilih ke halaman berikutnya.
- Spec: `docs/picker-list-widget-dev-spec.md`.
