# PRECONDITION_GATE_CARD (`preconditionGateCard`)

**Status:** LIVE di app (kartu gerbang prasyarat — driver runtime)
**Dev spec:** ADA — `docs/precondition-gate-card-manifest-dev-spec.md` (+ memory date-scope)
**Widget tab:** row 202

## Buat apa

Kartu "gerbang": menampilkan daftar barang bawaan (custody) + status apakah prasyarat terpenuhi sebelum boleh lanjut ke aksi berikutnya. Dipakai di runtime driver untuk memastikan muatan sudah benar sebelum mulai rute.

## Tampilan

```
┌─ Muatan kendaraan ─────────────────┐
│ Galon 19L      12                  │  ← item + qty (per kategori tx)
│ Tabung 3kg      8                  │
│ ── status gerbang: SIAP ──         │
│ [ Lanjut ]                         │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar; banyak field sumber data)

```json
{"type":"PRECONDITION_GATE_CARD","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"dv◼{userVid}","gateTable":"84214220504259//vehicle_check","gateSearch":"dv◼{userVid}","statusField":"cst","reconcileField":"","itemsTable":"84214220504259//vehicle_check","itemsField":"ie","itemsSearch":"dv◼{userVid}","labelField":"cd","qtyField":"qt","txField":"tx","saleField":"sale","refillField":"refill","buyField":"buy","excludeStatus":"","hideZero":"TRUE","route":"vertikaTeknoLokaciptaCustodyCount","text":"Muatan kendaraan◆Belum ada muatan","itemTable":""}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `PRECONDITION_GATE_CARD` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data utama | `dv◼{userVid}` |
| `gateTable` / `gateSearch` | Wajib | Data pengecek gerbang (ada/tidaknya prasyarat) | `dv◼{userVid}` |
| `statusField` | Wajib | Field status gerbang | `cst` |
| `reconcileField` | Opsional | Field rekonsiliasi | `""` |
| `itemsTable` / `itemsField` / `itemsSearch` | Wajib | Sumber daftar item bawaan (mis. `ie[]`) | `ie` |
| `labelField` / `qtyField` | Wajib | Field nama item / jumlah | `cd` / `qt` |
| `txField` / `saleField` / `refillField` / `buyField` | Opsional | Field jenis transaksi & kategori | `tx` |
| `excludeStatus` | Opsional | Status yang dikecualikan | `""` |
| `hideZero` | Opsional | `TRUE` = sembunyikan item bersaldo 0 | `TRUE` |
| `route` | Wajib | Halaman tujuan tombol lanjut | `…CustodyCount` |
| `text` | Wajib | Label/teks kosong (dipisah `◆`) | `Muatan kendaraan◆Belum ada muatan` |
| `itemTable` | Opsional | `[?] tabel item tambahan — cek dev` | `""` |

## Posisi field gabungan

`text` dipisah `◆` (judul / teks kosong). Sumber item = `itemsField` (mis. `vehicle_check.ie[]`), bukan `text`.

## Tips & catatan

- Sumber item custody = `vehicle_check.ie[]` (bukan `asset_cache`, bukan `task.it[]`) — per spec §9.
- Gerbang mengecek keberadaan prasyarat lintas-hari (fix stale-seed) via `gateSearch`.
- `hideZero` menyembunyikan baris item saldo 0.
- Spec: `docs/precondition-gate-card-manifest-dev-spec.md`.
