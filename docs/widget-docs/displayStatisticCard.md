# LIST_STATISTIC_CARD (`displayStatisticCard`)

**Status:** LIVE di app (kartu daftar + statistik ringkas per item)
**Dev spec:** ADA — `docs/list-statistic-card-dynamic.md` (+ memory field live)
**Widget tab:** row 195

## Buat apa

Daftar kartu yang menampilkan **statistik yang dihitung sistem** per item (mis. per site: berapa titik selesai, berapa masalah) + header ringkasan + badge status. Dipakai untuk daftar berbasis angka agregat, bisa dengan pemilih periode.

## Tampilan

```
┌─ Ringkasan (stats) ────────────────┐
│ 12/15 selesai · 2 masalah          │ ← stats header (computed)
│ ┌────────────────────────────────┐ │
│ │ Nama item              ● badge │ │ ← content + status/badge
│ │ detail…                        │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar; token `{...}` = dihitung sistem)

```json
{"type":"LIST_STATISTIC_CARD","vidtable":"20342033315492","table":"84214220504259//event","mergeTyped":"","search":"ty◼patrol⭘sv◼{ccVid}","conditions":"","text":"Cari titik◆Ketik nama titik◆Data tidak ditemukan","period":"7◆30◆bulan","periodDefault":"7","stats":"{selesai}/{total}◆Selesai★{masalah}◆Masalah","content":"<sn>◆<la>","status":"{status}","badge":"{statusLine}","route":"vertikaTeknoLokaciptaPatrolDetail"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `LIST_STATISTIC_CARD` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter (token nav mis. `{ccVid}`) | `sv◼{ccVid}` |
| `mergeTyped` | Opsional | Gabung lokasi bertipe (untuk merge titik) | `""` |
| `conditions` | Opsional | Syarat tambahan | `""` |
| `text` | Wajib | Label pencarian (dipisah `◆`) | `Cari titik◆…` |
| `period` | Opsional | Pilihan periode (dipisah `◆`) | `7◆30◆bulan` |
| `periodDefault` | Opsional | Periode awal | `7` |
| `stats` | Wajib | Statistik header — template `{token}` + label, dipisah `◆`/`★` | lihat contoh |
| `content` | Wajib | Isi kartu — `<field>` + label, dipisah `◆` | `<sn>◆<la>` |
| `status` | Opsional | Status kartu (computed → warna tema) | `{status}` |
| `badge` | Opsional | Teks badge (computed) | `{statusLine}` |
| `route` | Opsional | Halaman detail saat kartu di-tap | `…PatrolDetail` |

## Posisi field gabungan

`stats` — template `{token}◆label★{token}◆label…` (token `{}` = angka dihitung sistem). `content` — `<field>◆login◼<field>◆…` (`<field>` = isi data). `status`/`badge` = computed 3-tier (danger/warn/ok, warna dari tema).

## Tips & catatan

- Token `{}` (mis. `{total}`, `{selesai}`) = **dihitung sistem**, jangan diisi angka manual. Token `<>` = ambil nilai field data.
- Ada preset khusus kehadiran: `displayAttendanceCard` (197) = varian `keyed` dari widget ini untuk tabel `workforce`.
- Status = 3-tier baku; label bisa diganti lewat `statusLabels`, warna dari tema (bukan hex).
