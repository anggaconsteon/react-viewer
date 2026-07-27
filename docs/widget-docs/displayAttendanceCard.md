# LIST_STATISTIC_CARD variant `keyed` — kehadiran (`displayAttendanceCard`)

**Status:** Config siap — butuh dukungan baca tabel `keyed` di renderer (belum terkonfirmasi landing; lihat spec kehadiran)
**Dev spec:** ADA — `docs/kehadiran-card-dev-spec.md`
**Widget tab:** row 197

## Buat apa

Preset khusus kehadiran dari `LIST_STATISTIC_CARD`: daftar pekerja hari ini per site — berapa hadir/total, berapa belum scan, berapa perlu ditindak — plus jam masuk/keluar per pekerja + status warna. Tap kartu → halaman koreksi kehadiran.

## Tampilan

```
┌ 8/10 Hadir · 2 Belum scan · 3 Perlu tindak ┐  ← stats (computed)
│ ┌────────────────────────────────────────┐ │
│ │ Nama Pekerja                    ● Belum │ │ ← content + status/badge
│ │ login 08:01 · logout —          scan    │ │
│ └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
Tap kartu → halaman koreksi kehadiran.
```

## Contoh JSON

(resolved live — dari template Widget row 197)

```json
{"type":"LIST_STATISTIC_CARD","variant":"keyed","vidtable":"20342033315492","table":"84214220504259//workforce","search":"sv◼{ccVid}","conditions":"[[◀sv▶◼{ccVid}]]","text":"Cari worker◆Ketik nama worker◆Data tidak ditemukan","stats":"{hadir}/{total}◆Hadir★{belumScan}◆Belum scan★{perluTindak}◆Perlu tindak","content":"<n>◆login◼<is>◆logout◼<os>","badge":"{statusLine}","status":"{status}","route":"vertikaTeknoLokaciptaCheckinWorkerCorrection"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `LIST_STATISTIC_CARD` | — |
| `variant` | Wajib | `keyed` — baca tabel berkunci (workforce), bukan positional | `keyed` |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter (token nav `{ccVid}`) | `sv◼{ccVid}` |
| `conditions` | Opsional | Syarat tambahan | `[[◀sv▶◼{ccVid}]]` |
| `text` | Wajib | Label pencarian, 3 bagian `◆` | `Cari worker◆…◆Data tidak ditemukan` |
| `stats` | Wajib | Statistik header — `{token}◆label★…` | lihat contoh |
| `content` | Wajib | Isi kartu — `<field>◆label◼<field>◆…` | `<n>◆login◼<is>◆logout◼<os>` |
| `badge` | Opsional | Badge computed | `{statusLine}` |
| `status` | Opsional | Status computed (warna tema) | `{status}` |
| `route` | Wajib | Halaman koreksi saat kartu di-tap | `…CheckinWorkerCorrection` |

## Posisi field gabungan

`stats` — `{hadir}/{total}◆Hadir★{belumScan}◆Belum scan★…` (token `{}` dihitung sistem: total/hadir/belumScan/perluTindak). `content` — `<n>◆login◼<is>◆logout◼<os>` (`<field>` = isi data workforce). `status`/`badge` = computed 3-tier.

## Tips & catatan

- `variant:"keyed"` = baca tabel `workforce` (field bernama), bukan tabel positional. Renderer harus dukung ini — per spec kehadiran belum tentu landing; halaman non-fungsi sampai itu ada.
- Dipasangkan dengan halaman koreksi (`workerCardDetail` + tombol tulis-balik). Spec: `docs/kehadiran-card-dev-spec.md`.
- Ini preset kehadiran dari `displayStatisticCard` (195) yang lebih generik.
