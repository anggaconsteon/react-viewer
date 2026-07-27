# WORKER_CARD_DETAIL (`workerCardDetail`)

**Status:** Config siap — butuh dukungan baca tabel `keyed` di renderer (belum terkonfirmasi landing; lihat spec kehadiran)
**Widget tab:** row 178

## Buat apa

Kartu detail satu pekerja: baca 1 dokumen pekerja lalu tampilkan datanya (nama, jam masuk-scan, jam keluar-scan, dsb). Dipakai di halaman koreksi kehadiran — supervisor lihat detail lalu perbaiki.

## Tampilan

```
┌────────────────────────────────────┐
│ Nama Pekerja           [Worker]    │
│ Masuk (scan): 08:01                │
│ Keluar (scan): 17:03               │
└────────────────────────────────────┘
```

## Contoh JSON

(dari spec kehadiran — halaman koreksi kehadiran)

```json
{"type":"WORKER_CARD_DETAIL","variant":"keyed","table":"84214220504259//workforce","search":"vid◼<vid>","conditions":"[[◀vid▶◼<vid>]]","text":"<n>◆<is>◆<os>◆Worker◆Masuk (scan)◆Keluar (scan)"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `WORKER_CARD_DETAIL` | — |
| `variant` | Wajib | Mode baca data — `keyed` untuk tabel berkunci (workforce). Template default `[VARIANT]` | `keyed` |
| `table` | Wajib | Koleksi data pekerja | `84214220504259//workforce` |
| `search` | Wajib | Cara memilih 1 dokumen pekerja (biasa `vid◼<vid>` dari kartu yang di-tap) | `vid◼<vid>` |
| `conditions` | Opsional | Syarat tambahan | `[[◀vid▶◼<vid>]]` |
| `text` | Wajib | Isi kartu: campuran `<field>` (diganti data) + label statis, dipisah `◆` | lihat contoh |

## Posisi field gabungan

`text` — segmen `◆` (sumber: spec kehadiran §3):

| # | Isi | Contoh |
|---|---|---|
| 1 | Nama pekerja — `<field>` | `<n>` |
| 2 | Jam masuk (scan) — `<field>` | `<is>` |
| 3 | Jam keluar (scan) — `<field>` | `<os>` |
| 4 | Label peran | `Worker` |
| 5 | Label masuk | `Masuk (scan)` |
| 6 | Label keluar | `Keluar (scan)` |

## Tips & catatan

- `<n>`/`<is>`/`<os>` = nama field di dokumen pekerja (workforce), diganti isinya saat render.
- Tabel `workforce` = **keyed** (field bernama, bukan kolom nomor). Renderer harus mendukung baca keyed — per spec kehadiran ini belum tentu sudah landing; halaman non-fungsi sampai itu ada. Cek dev.
- Biasanya dipasangkan dengan tombol koreksi (`updateEventRow`) di bawahnya untuk menulis balik perbaikan. Spec: `docs/kehadiran-card-dev-spec.md`.
