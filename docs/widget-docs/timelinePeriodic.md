# TIMELINE periodic (`timelinePeriodic`)

**Status:** LIVE di app (timeline dengan pemilih periode; dipakai halaman patroli)
**Dev spec:** ADA — `docs/timeline-periodic-dynamic.md` (+ patrol-cleaning-timeline)
**Widget tab:** row 196

## Buat apa

Garis waktu kejadian dari buku event, dengan **pemilih periode** (7 hari / 30 hari / bulan). Dipakai untuk riwayat kegiatan yang bisa disaring rentang waktu — mis. timeline patroli/laporan per site.

## Tampilan

```
┌ [ 7 hari ][ 30 hari ][ bulan ] ────┐  ← pemilih periode
●  20-Jul · 12:41  [badge]           │
│  Judul kejadian                    │
│  subjudul…                         │
●  15-Jul · 15:42                    │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TIMELINE","variant":"periodic","flag":"report-patrol","vidtable":"20342033315492","table":"84214220504259//event","search":"sv◼{sv}⭘ty◼report-patrol","conditions":"","period":"7◆30◆bulan","periodDefault":"7","title":"<ty>","subtitle":"<sn>","text":"Riwayat Patroli◆Belum ada kegiatan","badge":"<st>","divider":"true","image":"i"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TIMELINE` | — |
| `variant` | Wajib | Mode timeline — `periodic` (dengan pemilih periode) | `periodic` |
| `flag` | Wajib | Penanda untuk backend | `report-patrol` |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter | `sv◼{sv}⭘ty◼report-patrol` |
| `conditions` | Opsional | Syarat tambahan | `""` |
| `period` | Wajib | Pilihan periode (dipisah `◆`) | `7◆30◆bulan` |
| `periodDefault` | Wajib | Periode awal terpilih | `7` |
| `title` | Wajib | Judul tiap baris — `<field>` | `<ty>` |
| `subtitle` | Opsional | Subjudul tiap baris — `<field>` | `<sn>` |
| `text` | Wajib | Judul timeline + teks kosong (dipisah `◆`) | `Riwayat Patroli◆Belum ada kegiatan` |
| `badge` | Opsional | Badge tiap baris — `<field>` | `<st>` |
| `divider` | Opsional | `true`/`false` — garis pemisah | `true` |
| `image` | Opsional | Nama field gambar tiap baris | `i` |

## Posisi field gabungan

`text` dipisah `◆` (judul timeline / teks daftar kosong). `title`/`subtitle`/`badge` = template `<field>` (diganti isi data).

## Tips & catatan

- Keluarga timeline: `timeline` (180, dasar), `timelinePeriodic` (196, ini — pemilih periode), `timelineLedger` (280, buku besar mutasi).
- Periode menyaring rentang tanggal event; default `periodDefault`.
