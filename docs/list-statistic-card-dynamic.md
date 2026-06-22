# LIST_STATISTIC_CARD — Rekomendasi Dynamic & Reusable

**Tanggal:** 2026-06-04
**Tujuan:** Bikin `LIST_STATISTIC_CARD` bisa dipakai ulang di halaman lain (bukan cuma detail titik patrol) dengan menambah beberapa field config, tanpa merombak engine render-nya.

> ⚠️ **SUPERSEDED sebagian (2026-06-11) — JSON di bawah pakai nama field LAMA. Koreksi terkini:**
> - **`ledgerCode` DIBUANG** — cuma buat addToEvent, gak kepake read/list.
> - **`computeMode` DITOLAK** — agregasi = default behavior type, generic reuse = pakai `<charcode>`.
> - **`tapContext` → `routeParam`** (rename).
> - **`staleMs` → `thresholdMs`** (rename).
> - `searchField` → cek penamaan live (`searchFields`).
> Lihat memory `project_list_statistic_card_fields` + `docs/patrol-point-merge-typed-dev-spec.md` buat bentuk terkini.

---

## 1. Ringkasan

Pola dasar widget = **ambil 1 doc yang match (`conditions`) → render array-of-object di dalam doc sebagai kartu**, tiap kartu boleh meng-agregasi 1 subcollection sibling. Layer **render** (search, tab periode, 3 stat box, list kartu, badge, status strip) sudah generic. Yang ngunci reuse: nama **array field**, **subcollection sibling**, **join key**, dan **rumus agregasi** — semua di-hardcode ke patrol. Rekomendasi: jadikan agregasi **opt-in** (`computeMode`) + buka field-field itu sebagai config.

---

## 2. Kondisi sekarang

### Sudah dinamis (config-driven) ✓
`table`, `vidtable`, `conditions` / `search` (filter doc by `<av>`=`{ccVid}`), `text`, `period`, `periodDefault`, `stats` (template 3 box), `content` (template kartu), `status`, `badge`, `route`, `staleMs`. Resolusi token `<charcode>` (dari item) + `{token}` (dari hitung) generic.

### Masih hardcode (pengunci reuse)
| Hardcode | Akibat |
|---|---|
| array field item = `ll` (titik di dalam doc) | domain lain pakai nama array beda |
| subcollection sibling = `event` | beda nama / tak ada |
| join item→event by `ln` | join key beda |
| field cari = `ln` | cari field lain |
| agregasi per-titik → `{visits}`/`{lastAgo}`/`{lastBy}`/`{evidence}`/`{ps}` + stats `{totalVisits}`/`{noVisitCount}`/`{typedCount}` (dari `lq`/`t` event) | rumus & token patrol-only |
| tap → inject `li`→`pointId`, `ln`→`point`/`pointName`, `sv`→`site` | konteks titik patrol-only |

---

## 3. Field config baru

| Field | Nilai | Default | Fungsi |
|---|---|---|---|
| `computeMode` | `"patrolPoint"` / kosong | **kosong** (tanpa agregasi) | pilih strategy hitung. Kosong → kartu murni dari `<charcode>` item, token `{...}` tak dihitung → **reusable** |
| `itemsField` | nama field array, mis. `"ll"` | `ll` | array-of-object di doc yang dirender jadi kartu |
| `searchField` | char-code, mis. `"ln"` | `ln` | field item yang dicari di search box |
| `tapContext` | `itemField◼screenTxKey`, multi pisah `◆`, mis. `"li◼pointId◆ln◼point◆sv◼site"` | (default patrol) | nilai yang di-inject ke `screenTx` saat kartu ditekan |

> Subcollection sibling (`event`) + join key (`ln`) dipegang **strategy** `patrolPoint`, bukan config — domain baru yang butuh agregasi sendiri = tambah strategy Dart. Hindari DSL deklaratif (YAGNI).

---

## 4. JSON — detail titik patrol (sekarang)

Cukup tambah `computeMode` (field baru lain opsional, default sama):

```json
{
  "type": "LIST_STATISTIC_CARD",
  "ledgerCode": "site",
  "vidtable": "20342033315492",
  "table": "84214220504259//site",
  "computeMode": "patrolPoint",
  "itemsField": "ll",
  "searchField": "ln",
  "tapContext": "li◼pointId◆ln◼point◆ln◼pointName◆sv◼site",
  "staleMs": "43200000",
  "search": "av◼{ccVid}",
  "conditions": "[[◀av▶◼{ccVid}]]",
  "text": "Cari titik◆Ketik nama titik◆Data tidak ditemukan",
  "period": "24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000",
  "periodDefault": "86400000",
  "stats": "{totalVisits}◆Total kunjungan★{noVisitCount}◆Titik tanpa kunjungan★{typedCount}◆Lokasi diketik",
  "content": "<ln>◆PATROLI◆Terakhir {lastAgo} · {lastBy}◆{visits} kunjungan dalam {period}",
  "status": "{ps}",
  "badge": "{evidence}",
  "route": "vertikaTeknoLokaciptaPatrolPointTimeline"
}
```

**Token hasil agregasi (`computeMode:"patrolPoint"`):** per-titik `{visits}` (event window, join `ln`), `{lastAgo}`/`{lastBy}` (event terbaru), `{evidence}` (dari `lq`), `{ps}` (no-visit→danger, stale/GPS→warn, else ok); stats `{totalVisits}`/`{noVisitCount}`/`{typedCount}`.

---

## 5. JSON — halaman lain (generic, TANPA agregasi)

Contoh: 1 doc gedung berisi array `rooms`, tiap ruang jadi kartu, status & isi panel dari char-code item langsung:

```json
{
  "type": "LIST_STATISTIC_CARD",
  "vidtable": "20342033315492",
  "table": "84214220504259//building",
  "itemsField": "rooms",
  "searchField": "rn",
  "tapContext": "ri◼roomId◆rn◼room",
  "search": "av◼{bldVid}",
  "conditions": "[[◀av▶◼{bldVid}]]",
  "text": "Cari ruangan◆Ketik nama ruangan◆Data tidak ditemukan",
  "stats": "<tot>◆Total ruangan★<occ>◆Terisi★<free>◆Kosong",
  "content": "<rn>◆<rt>◆Kapasitas <cap>◆<note>",
  "status": "<rs>",
  "badge": "<rb>",
  "route": "roomDetail"
}
```

Tanpa `computeMode` → tak subscribe sibling, tak hitung token. `stats`/`content`/`status`/`badge` pakai `<charcode>` item langsung.

---

## 6. Aturan token

Tiap `stats` / `content` / `status` / `badge` boleh isi `{computedToken}` (kalau `computeMode` aktif), `<charcode>` (dari item), atau literal (`ok`/`warn`/`danger`). Token tanpa nilai dibiarkan literal.

---

## 7. Backward compatibility

- `itemsField`/`searchField`/`tapContext` default = perilaku patrol → layar lama jalan tanpa field tsb.
- **Wajib ditambah** di layar patrol lama: `"computeMode":"patrolPoint"`.

---

## 8. Tahap implementasi (usulan)

- **P1 — `computeMode` gate + strategy `patrolPoint`** (pegang subscribe `event` + agregasi titik). Kosong = render item dari char-code, tanpa agregasi.
- **P2 — `itemsField` + `searchField` + `tapContext`** (ganti hardcode `ll`/`ln`/`av`).
- **P3 (opsional)** — vokab status configurable.
