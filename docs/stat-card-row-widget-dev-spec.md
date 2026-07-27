# STAT_CARD_ROW — deretan kartu angka dari 1 doc cache (Dev Spec)

**Tanggal:** 2026-07-24
**Buat:** dev Flutter (renderer — TYPE BARU, renderer duluan, config nyusul)
**Status:** PROPOSED
**Konteks / Konsumen pertama:** `RewardHome@1005` row 1007 — 3 stat worker (Approved / Batch siap / Menunggu) dari `reward_cache`. Sekarang pakai DETAIL_CARD = tampil aneh (tabel KV, bukan kartu angka; test device user 2026-07-24). Gap lama: tiap butuh "deretan angka dari cache doc" selalu kompromi DETAIL_CARD/noticeBar.
**Referensi:** mockup `src/component/SalesFreelanceV1.jsx` (StatCard row WorkerScreen) · `docs/sales-freelance-reward-dev-spec.md` (induk) · dict tab `reward_cache`.

---

## 1. Kenapa

Angka ringkas (approved/batch/pending, nanti dashboard admin/driver/sales) = kebutuhan berulang. DETAIL_CARD didesain buat halaman detail (title+subtitle+baris KV) — dipaksa jadi stat = jelek. Widget kecil generic sekali bangun, kepake banyak page.

## 2. Konsep

Keyed read **1 doc** (engine sama DETAIL_CARD: table+search) → render **N kartu horizontal sejajar**: angka gede + label kecil, warna per kartu dari **theme 3-tier** (bukan hex di config — aturan tetap). Jumlah & isi kartu 100% dari config. **Nol hitung-hitungan** — angka udah precomputed CF di doc cache.

## 3. Kontrak field

```json
{
  "type": "STAT_CARD_ROW",
  "vidtable": "20342033315492",
  "table": "84214220504259//reward_cache",
  "search": "cv◼<vid>",
  "cards": "Approved◼ap◼ok★Batch siap◼bt◼accent★Menunggu◼pnd◼muted",
  "highlight": "bt",
  "text": "Belum ada data"
}
```

| field | isi |
|---|---|
| `vidtable`/`table`/`search` | keyed read 1 doc (search eq-only existing; 0 doc → empty state) |
| `cards` | `Label◼field◼tone` join `★`. Jumlah kartu bebas (1-4 wajar; >4 renderer boleh wrap 2 baris). `field` = field doc; `tone` = keyword theme |
| tone vocab | `ok` · `warn` · `danger` · `accent` · `muted` — **warna dari THEME, bukan config** (aturan status 3-tier; relabel bebas via `cards`, warna nggak) |
| `highlight` | opsional — field yang kartunya di-emphasize (border/bg tone-nya lebih tebal, ala "Batch siap" mockup). Kosong = semua flat |
| `text` | empty state saat doc gak ketemu (1 baris, gantiin seluruh row) |

**Nilai field:** doc ada tapi field absen → tampil `0` (cache CF sparse = nol). String angka ("3") → tampil apa adanya. Non-angka → tampil apa adanya (widget gak menghakimi).

## 4. Contoh resolved (konsumen pertama)

```json
{"type":"STAT_CARD_ROW","vidtable":"20342033315492","table":"84214220504259//reward_cache","search":"cv◼87544551624342","cards":"Approved◼ap◼ok★Batch siap◼bt◼accent★Menunggu◼pnd◼muted","highlight":"bt","text":"Belum ada data reward — mulai submit bukti hari ini"}
```

(`search` di sheet = formula `="cv◼"&Settings!$B$1` — udah gitu di row 1007 sekarang, tinggal ganti template.)

## 4b. UI / Layout (acuan mockup StatCard)

```
┌─────────┐ ┌═════════┐ ┌─────────┐
│   17    │ ║    1    ║ │    3    │     angka gede (bold)
│Approved │ ║Batch    ║ │Menunggu │     label kecil muted
└─────────┘ ║siap     ║ └─────────┘
   tone:ok  └═════════┘  tone:muted
             highlight (border tone accent)
```
Kartu flex sama lebar, 1 baris (>4 kartu → wrap). Doc gak ketemu → 1 baris `text` polos.

## 6. Sheet-side (builder, SETELAH renderer live — type baru, jangan config-ahead)

1. Widget row baru `statCardRow` (I+J+G+H, JANGAN col A): semua field placeholder ([VIDTABLE][TABLE][SEARCH][CARDS][HIGHLIGHT][TEXT] — 6 ph).
2. Swap `RewardHome@1007`: B `detailCard`→`statCardRow`, D 6-SUB, helper reuse (search formula udah ada). DETAIL_CARD tetap hidup buat konsumen detail beneran (SupplierNotaDetail dll — nol sentuhan).

## 7. Deliverable dev (Flutter)

1. Renderer STAT_CARD_ROW per §3-§4b: keyed read (engine DETAIL_CARD), parse `cards` ★/◼, tone→theme color, highlight, empty state.
2. Nol string/warna/ukuran hardcode — label dari `cards`, warna dari theme.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Renderer STAT_CARD_ROW | dev Flutter | PROPOSED |
| Widget row `statCardRow` + swap @1007 | builder | NUNGGU renderer |

## 10. Not Doing (dan kenapa)

- **Aggregation/hitung di widget** — angka = precomputed CF (pola cache). Widget baca doang. Butuh agregasi live → itu LIST_STATISTIC_CARD, beda alat.
- **Tap/route per kartu** — v1 display doang; routeParams per kartu = nanti kalau ada kebutuhan riil.
- **Hex warna di config** — ditolak (aturan 3-tier theme).
- **Trend/sparkline/ikon** — YAGNI.

## 11. Acceptance

- [ ] 3 kartu sejajar, angka dari doc, label dari config; `bt` di-highlight.
- [ ] Field absen di doc → `0` (bukan blank/crash).
- [ ] Search 0 doc → 1 baris `text`, no crash.
- [ ] Ganti `cards` di sheet (tambah kartu ke-4 `Dibayar◼pdt◼muted`) → tampil tanpa deploy.
- [ ] Tone salah ketik → fallback `muted` + WARN log, jangan drop widget.

## 12. Asumsi & risiko

- [ ] Theme punya tone `accent`/`muted` selain 3-tier ok/warn/danger — kalau belum, dev map ke yang ada + kabari.

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` · `docs/getimages-gallery-source-dev-spec.md` + `docs/payout-list-widget-dev-spec.md` (paket dev sama; payout-list = opsional).
