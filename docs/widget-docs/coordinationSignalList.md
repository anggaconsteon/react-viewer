# COORDINATION_SIGNAL_LIST (`coordinationSignalList`)

**Status:** LIVE di app (daftar sinyal koordinasi admin — beranda admin)
**Dev spec:** ADA — `docs/coordination-invoice-tier-dev-spec.md` (+ admin-home)
**Widget tab:** row 233

## Buat apa

Daftar "hal yang perlu ditangani admin" dari beberapa sumber, dikelompokkan per jenis sinyal (tugas belum diassign, kendaraan kembali, tanpa pelaksana, terblokir, perlu invoice, dll.), dengan aksi cepat (assign, dll.) + penanda umur (makin lama makin merah). Widget koordinasi paling kompleks.

## Tampilan

```
┌─ Perlu Ditangani ──────────────────┐
│ ⚠ Belum diassign (2)               │  ← per gerbang jenis sinyal
│   Toko Budi · Jl. Merdeka   [Assign]│
│ 🔴 Kendaraan kembali (1)           │  ← warna umur (danger/warn)
└────────────────────────────────────┘
```

## Contoh JSON

Template banyak field (peta ke banyak sumber + gerbang per jenis sinyal + aksi). Bagian penting yang di-isi builder: `table`/`vehicleTable`/`checkTable`/`evidenceTable` (sumber), `*Gate` (gerbang per tier), `assignSheet`/`updateEventRow` (aksi), `dangerAge`/`warnAge` (ambang umur), `text` (label semua tier). Lihat spec untuk contoh resolved penuh.

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `COORDINATION_SIGNAL_LIST` | — |
| `vidtable` / `table` | Wajib | ID tenant + tabel utama (tugas) | `84214220504259//task` |
| `vehicleTable` / `checkTable` / `evidenceTable` | Wajib | Sumber tambahan (kendaraan / cek / bukti) | — |
| `statusField` / `vehicleField` / `customerNameField` / `addressField` / `scheduleField` / `itemsField` / `plateField` / `driverField` | Wajib | Pemetaan field yang ditampilkan | `tst`, `kn`, `al`, … |
| `checkTypeField` / `checkStatusField` | Opsional | Field jenis & status cek | — |
| `reasonSearch` / `reasonCatField` / `reasonNoteField` | Opsional | Sumber & field alasan (mis. gagal) | — |
| `unassignedGate` / `returnedGate` / `noExecutorGate` / `blockedGate` | Wajib | Gerbang per jenis sinyal (tier) | `tst◼unassigned`, … |
| `assignSheet` | Opsional | Konfigurasi bottom-sheet assign | — |
| `updateEventRow` | Opsional | Perintah tulis saat aksi (DSL) | — |
| `crossRoute` / `crossRouteParams` | Opsional | Navigasi silang + data yang dibawa | — |
| `dangerAge` / `warnAge` | Opsional | Ambang umur (menit) → warna merah / kuning | — |
| `text` | Wajib | Label semua tier + tombol (banyak segmen `◆`) | — |

## Posisi field gabungan

`text` dipisah `◆` — tiap tier sinyal + tombolnya punya label sendiri (lihat spec untuk urutan segmen). Umur item → warna via `dangerAge`/`warnAge`.

## Tips & catatan

- Menambah tier baru (mis. "perlu invoice") = tambah param gerbang + segmen `text` (lihat `docs/coordination-invoice-tier-dev-spec.md`) — **jangan** config-ahead ke widget live tanpa renderer (param token baru bisa men-drop seluruh widget).
- Header pasangannya: `adminCoordinationHeader` (232).
- Spec: `docs/coordination-invoice-tier-dev-spec.md`.
