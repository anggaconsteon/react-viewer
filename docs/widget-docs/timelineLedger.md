# TIMELINE variant `ledger` (`timelineLedger`)

**Status:** LIVE di app (timeline buku besar mutasi — bisa expand)
**Dev spec:** ADA — `docs/timeline-ledger-variant-dev-spec.md`
**Widget tab:** row 280

## Buat apa

Garis waktu gaya **buku besar (ledger)**: kejadian dikelompokkan (mis. per hari / per entitas), tiap baris bisa **dibuka (expand)** untuk lihat rincian. Generik (tanpa hardcode) untuk riwayat mutasi barang/aktivitas.

## Tampilan

```
┌ [ periode ] ───────────────────────┐
│ ▸ 20 Jul                    [badge]│  ← group (expandable)
│   ▾ Drop 12 galon @ Toko Budi      │  ← item saat dibuka
│   ▾ Pickup 4 galon                 │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TIMELINE","variant":"ledger","flag":"movement","vidtable":"20342033315492","table":"84214220504259//movement","conditions":"","period":"7◆30◆bulan","periodDefault":"7","timeField":"ts","title":"<ac>","subtitle":"<ln>","groupField":"cdt","groupField2":"vv","sectionText":"","badgeField":"tx","badgeMap":"drop◼Drop◼ok★pickup◼Pickup◼warn","headText":"Mutasi","titleText":"","subText":"","itemText":"","refText":"","expandable":"TRUE"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TIMELINE` | — |
| `variant` | Wajib | `ledger` — buku besar bergrup | `ledger` |
| `flag` | Wajib | Penanda untuk backend | `movement` |
| `vidtable` / `table` | Wajib | Sumber data mutasi | `84214220504259//movement` |
| `conditions` | Opsional | Syarat tambahan | `""` |
| `period` / `periodDefault` | Opsional | Pilihan periode + default | `7◆30◆bulan` / `7` |
| `timeField` | Wajib | Field waktu | `ts` |
| `title` / `subtitle` | Wajib | Template baris — `<field>` | `<ac>` / `<ln>` |
| `groupField` / `groupField2` | Opsional | Pengelompok (mis. per hari / per kendaraan) | `cdt` / `vv` |
| `sectionText` | Opsional | Teks judul seksi | `""` |
| `badgeField` / `badgeMap` | Opsional | Field badge + peta value◼label◼tone★… | `tx` / `drop◼Drop◼ok★…` |
| `headText` / `titleText` / `subText` / `itemText` / `refText` | Opsional | Label-label tampilan | `Mutasi` |
| `expandable` | Opsional | `TRUE` = baris grup bisa dibuka | `TRUE` |

## Posisi field gabungan

`badgeMap` = `value◼label◼tone★…` (tone dari tema). `title`/`subtitle` = template `<field>`. `period` dipisah `◆`.

## Tips & catatan

- Generik, grouped, expandable — tanpa hardcode logika; cocok untuk riwayat mutasi (asset ledger).
- Keluarga timeline: `timeline` (180), `timelinePeriodic` (196), `timelineLedger` (280, ini).
- Spec: `docs/timeline-ledger-variant-dev-spec.md`.
