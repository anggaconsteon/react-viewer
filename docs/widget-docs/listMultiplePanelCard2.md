# LIST_MULTIPLE_PANEL_CARD — 2 panel (`listMultiplePanelCard2`)

**Status:** LIVE di app (varian 2 panel dari `listMultiplePanelCard`)
**Dev spec:** ADA — `docs/# LIST_MULTIPLE_PANEL_CARD — Rekomendasi.md`
**Widget tab:** row 194

## Buat apa

Sama seperti `listMultiplePanelCard` (193), tapi tiap kartu punya **2 panel aksi** — dua pintu masuk ke dua sub-halaman berbeda (mis. "Kehadiran" + "Titik"). Status tiap panel dihitung sistem.

## Tampilan

```
┌──────────────────────────────────┐
│ Nama item                        │
│ ┌─────────────┐ ┌─────────────┐  │
│ │ 🔷 Panel 1 ●│ │ 🔶 Panel 2 ●│  │ ← 2 panel, status warna masing-masing
│ └─────────────┘ └─────────────┘  │
└──────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — 2 panel, status computed `{ps}`/`{qs}`)

```json
{"type":"LIST_MULTIPLE_PANEL_CARD","vidtable":"20342033315492","table":"84214220504259//site","search":"st◼active","conditions":"","searchFields":"sn◆an","thresholdMs":"43200000","routeParam":"sv◼{sv}","showIcon":"true","showProgress":"false","variant":"default","groupBy":"","statusLabels":"","text":"Daftar Site◆Cari site","status":"","panels":[{"icon":"groups","text":"Kehadiran","status":"{ps}","route":"vertikaTeknoLokaciptaCheckinSiteDetail"},{"icon":"pin_drop","text":"Titik","status":"{qs}","route":"vertikaTeknoLokaciptaTitikSitePoints"}]}
```

## Field

Sama persis `listMultiplePanelCard` (193) — lihat doc itu untuk daftar field. Beda cuma `panels[]` berisi **2 panel** (bukan 1).

## Posisi field gabungan

Sama `listMultiplePanelCard` (193).

## Tips & catatan

- Pilih varian sesuai jumlah pintu masuk: 1 panel = row 193, 2 panel = row 194.
- Status tiap panel (`{ps}`, `{qs}`) dihitung sistem terpisah — bisa beda warna.
