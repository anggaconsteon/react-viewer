# LIST_MULTIPLE_PANEL_CARD (`listMultiplePanelCard`)

**Status:** LIVE di app (kartu daftar dengan panel navigasi; varian 1 panel)
**Dev spec:** ADA — `docs/# LIST_MULTIPLE_PANEL_CARD — Rekomendasi.md` (+ memory pola nav)
**Widget tab:** row 193

## Buat apa

Daftar kartu dari koleksi data, tiap kartu punya **panel aksi** (ikon + label + status warna) yang bisa di-tap ke halaman berbeda. Dipakai untuk kartu ringkas dengan pintu masuk ke sub-halaman (mis. kartu cost-center → panel "Kehadiran"). Varian ini = **1 panel** per kartu.

## Tampilan

```
┌──────────────────────────────────┐
│ Nama item                        │
│ subjudul…                        │
│ ┌────────────────┐               │
│ │ 🔷 Kehadiran ● │ ← panel (status warna, tap → route)
│ └────────────────┘               │
└──────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — 1 panel, status computed `{qs}`)

```json
{"type":"LIST_MULTIPLE_PANEL_CARD","vidtable":"20342033315492","table":"84214220504259//site","search":"st◼active","conditions":"","searchFields":"sn◆an","thresholdMs":"43200000","routeParam":"sv◼{sv}","showIcon":"true","showProgress":"false","variant":"default","groupBy":"","statusLabels":"","text":"Daftar Site◆Cari site","status":"","panels":[{"icon":"groups","text":"Kehadiran","status":"{qs}","route":"vertikaTeknoLokaciptaCheckinSiteDetail"}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `LIST_MULTIPLE_PANEL_CARD` | — |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter | `st◼active` |
| `conditions` | Opsional | Syarat tambahan | `""` |
| `searchFields` | Opsional | Field yang bisa dicari | `sn◆an` |
| `thresholdMs` | Opsional | Ambang waktu (ms) untuk status berbasis waktu | `43200000` (12 jam) |
| `routeParam` | Wajib | Data yang dibawa ke halaman tujuan panel | `sv◼{sv}` |
| `showIcon` / `showProgress` | Opsional | Tampil ikon / bar kemajuan | `true` / `false` |
| `variant` | Opsional | Mode tampilan | `default` |
| `groupBy` | Opsional | Kelompokkan kartu berdasar field | `""` |
| `statusLabels` | Opsional | Peta label status per warna (`value◼groupLabel◼pillLabel★…`) | `""` |
| `text` | Wajib | Judul & hint (dipisah `◆`) | `Daftar Site◆Cari site` |
| `status` | Opsional | Status kartu (level kartu) | `""` |
| `panels[]` | Wajib | Panel aksi per kartu (ikon/label/status/route) | 1 panel |

## Posisi field gabungan

`text` dipisah `◆` (judul / hint). `statusLabels` (kalau dipakai): `value◼groupLabel◼pillLabel★…` — status 3-tier (danger/warn/ok), warna dari tema, bukan hex.

## Tips & catatan

- Status panel `{qs}`/`{ps}` = nilai **dihitung sistem** per kartu (bukan diisi manual) — warna pil mengikuti tema.
- Varian 2 panel = `listMultiplePanelCard2` (194).
- Ini pengganti pola lama; navigasi lewat `routeParam` (token disuntik), bukan `passParams`.
