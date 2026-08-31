# PRICE_LINES — line-item harga editable + total + freeze (Dev Spec)

**Tanggal:** 2026-08-06
**Buat:** dev Flutter (renderer — type baru `PRICE_LINES`) · dev Go (CF — pre-seed lines) · builder op1Screen
**Status:** PROPOSED (nunggu dev — type BARU, renderer duluan)
**Konteks / Konsumen pertama:** Service AC Admin — **Requote** (tetapkan harga scope teknisi) + **Invoice** (nota frozen). Page: `ServiceJobDetail` (WO `st◼completed`) → tombol "Buat Invoice". Mockup: `AdminServiceRuntimeMaintenance.jsx` `RequoteSheet`/`InvoiceSheet`.
**Referensi:** `docs/service-ac-widget-reuse-gap.md`, `docs/service-ac-teknisi-execution-design.md`, `taskItemBuilder` (sibling — bedanya di §12), RECEIPT_DOC/PRN (print nota), `whatsappSend` (WA).

---

## 1. Kenapa

Admin perlu **tetapkan harga** pada baris (scope tambahan / invoice) → total → **kunci (freeze)**. Doktrin Service AC: **teknisi NEVER lihat harga** — teknisi lapor FAKTA (jenis+qty+scope, nol angka), **Admin yang isi harga**. Gak ada widget existing yang: **render baris pre-seeded + edit harga per-baris + total live + freeze-write**. `taskItemBuilder` = build-dari-katalog (search-pick), BUKAN edit-harga-baris-yang-udah-ada (§12). **Keputusan user 2026-08-06: widget baru.**

## 2. Konsep

`PRICE_LINES` = editor baris berharga. Baca 1 doc (`table`+`search` keyed, mis. WO by `wo`) → render **array baris** dari `lineField` (tiap elem = 1 baris {label, harga, fixed?, qty?}). Baris `fixed` = tampil harga (read-only, mis. jasa dari price-book); baris editable = input harga. **Total live** = Σ harga×qty. Submit → tulis balik array+total ke doc + status (freeze: `quoted`/`invoiced`), opsional WA. **Nol harga hardcode di Flutter** — semua dari doc/config.

**Pre-seed baris = UPSTREAM (bukan widget):** array `lineField` diisi sebelum widget kebuka:
- **Requote:** teknisi lapor scope → `pl[]` = partsNeeded (label, harga kosong) + 1 baris jasa. Admin isi harga.
- **Invoice:** CF (atau seed) susun `pl[]` = jasa (jenis×unit, harga dari price-book, `fixed`) + parts + revisi (dari requote, `fixed`). Admin bisa edit yang non-fixed.

Widget = bagian **edit + total + freeze**; SUMBER baris = CF/upstream (§9).

## 3. Kontrak field

```jsonc
{
  "type": "PRICE_LINES",
  "vidtable": "20342033315492",
  "table": "84214220504259//work_order",
  "search": "wo◼{wo}",            // keyed read doc
  "mode": "invoice",             // requote | invoice (beda status freeze + label)
  "lineField": "pl",             // array baris di doc: [{l,h,f,q}]
  "labelKey": "l",               // key label per elem
  "priceKey": "h",               // key harga per elem (angka)
  "fixedKey": "f",               // key flag fixed (true=read-only)
  "qtyKey": "q",                 // key qty (opsional; absen=1)
  "position": 40,                // slot form: array baris final (harga terisi) → ◁40▷
  "totalPosition": 41,           // slot total (angka) → ◁41▷
  "currency": "Rp ",             // prefix (locale id-ID di renderer)
  "waField": "cp",               // hp customer (WA toggle); kosong=no WA
  "submitEvent": "…updateEventRow/addToEvent…",  // freeze write (§4)
  "text": "<judul>◆<total-label>◆<button>◆<wa-label>◆<empty>◆<sub-context>"
}
```

| Field | Isi | Wajib |
|---|---|---|
| `table`+`search` | keyed read doc | ✓ |
| `mode` | `requote` (kunci harga scope) / `invoice` (terbitkan nota frozen) | ✓ |
| `lineField`+`labelKey`/`priceKey`/`fixedKey`/`qtyKey` | array baris + peta key per-elem | ✓ |
| `position` | slot array baris final (harga terisi) → dipakai submitEvent `◁N▷` | ✓ |
| `totalPosition` | slot total angka | ✓ |
| `currency` | prefix; renderer format `toLocaleString(id-ID)` anti-locale | — (default `Rp `) |
| `waField` | hp → WA toggle (whatsappSend); kosong = no toggle | — |
| `submitEvent` | updateEventRow/addToEvent freeze (§4) | ✓ |
| `text` | 6 segmen ◆ (§3.1) | ✓ |

### 3.1 `text` — 6 segmen ◆

| # | Peran | Contoh |
|---|---|---|
| 1 | judul | `Invoice · <wo>` |
| 2 | label total | `Total` |
| 3 | tombol submit | `Terbitkan & Kunci` (invoice) / `Setujui & kunci harga` (requote) |
| 4 | label WA-toggle | `Kirim invoice ke customer via WhatsApp` |
| 5 | empty (nol baris) | `Belum ada baris` |
| 6 | sub-context | `Harga dikunci saat terbit — jadi fakta transaksi, bukan saldo` |

### 3.2 Aturan tampil/edit baris

- Baris `fixed:true` → harga **read-only** (jasa dari price-book / revisi terkunci). `fixed:false`/absen → **input angka** (numeric keyboard, anti-locale).
- Total = Σ (harga × qty) live tiap edit.
- Submit KE-BLOK kalau total ≤ 0 (mode requote) — label tombol jadi text[3] alt "Isi harga dulu" (opsional, mirror mockup).

## 4. Contoh resolved

**Invoice (Service AC, WO completed):**
```json
{"type":"PRICE_LINES","vidtable":"20342033315492","table":"84214220504259//work_order","search":"wo◼{wo}","mode":"invoice","lineField":"pl","labelKey":"l","priceKey":"h","fixedKey":"f","qtyKey":"q","position":40,"totalPosition":41,"currency":"Rp ","waField":"cp","submitEvent":"84214220504259//work_order⭘tablevid◼20342033315492⭘search◼wo★{wo}⭘pl◼◁40▷⭘tot◼◁41▷⭘st◼invoiced⭘iv◼1","text":"Invoice · <wo>◆Total◆Terbitkan & Kunci◆Kirim invoice via WhatsApp◆Belum ada baris◆Harga dikunci saat terbit — fakta transaksi, bukan saldo"}
```

**Requote (tetapkan harga scope):** `mode:"requote"`, `submitEvent` → `…⭘pl◼◁40▷⭘tot◼◁41▷⭘sc◼0⭘rl◼◁40▷` (clear flag scope `sc`, simpan revisiLines `rl`), text[3] `Setujui & kunci harga`.

## 4b. UI / Layout

```
┌ Invoice · JOB-2026-000001 ─────────────┐
│  PT Citra                     [DRAFT]  │
│  Cuci (2 unit)             Rp 130.000  │ ← fixed (jasa, price-book)
│  Part: Kapasitor         [ Rp 45.000 ] │ ← editable
│  Perbaikan (tambahan)      Rp 150.000  │ ← fixed (dari requote)
│  ────────────────────────────────────  │
│  Total                     Rp 325.000  │ ← text[2] · live
│  [✓] Kirim invoice via WhatsApp        │ ← waField
│  [   Terbitkan & Kunci   ]             │ ← text[3] → freeze
│  Harga dikunci saat terbit…            │ ← text[6]
└────────────────────────────────────────┘
```

## 6. Sheet-side (builder — SETELAH renderer live)

Widget row `priceLines` (generic + SUBSTITUTE). Taruh di page baru `ServiceInvoice`/`ServiceRequote` (route dari ServiceSignals "Perlu invoice" / ServiceJobDetail). Config-ahead HARAM sampai renderer landing.

## 7. Deliverable dev

**Flutter (renderer `PRICE_LINES`):**
1. Baca doc keyed → render baris dari `lineField` (peta key), fixed=read-only/else input.
2. Total live Σ harga×qty; format `currency`+id-ID (anti-locale).
3. Submit → susun array baris (harga terisi) → `◁position▷`, total → `◁totalPosition▷` → savesend `submitEvent` (freeze). WA toggle (waField) → whatsappSend.
4. Nol string/harga hardcode — semua `text`/doc/config.

**Go (CF — pre-seed `pl[]`):** susun baris invoice (jasa jenis×unit dari price-book + parts + revisiLines) → tulis `pl[]` ke WO pas `st◼completed` (atau pas requote). **[SEPARATE — price-book + seed = CF/upstream, bukan widget.]**

## 8. Dictionary

- `work_order`: `pl` (array baris {l,h,f,q}), `tot` (total), `iv` (flag invoiced), `rl` (revisiLines), `sc` (flag scope). Dict + `event_taxonomy` (`workorder-quoted`/`workorder-invoiced`).

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Renderer `PRICE_LINES` (render+edit+total+freeze+WA) | dev Flutter | PROPOSED |
| Pre-seed `pl[]` (jasa price-book + parts + revisi) | dev Go (CF) | PROPOSED (separate) |
| price_book (harga jasa per jenis) | builder/config | PENDING |
| Page ServiceInvoice/Requote + widget row | builder | NUNGGU renderer |

## 10. Not Doing (dan kenapa)

- **Widget seeding baris sendiri (jasa dari price-book)** — GAK; itu upstream/CF. Widget = edit+total+freeze doang (biar generic).
- **Teknisi lihat/edit harga** — HARAM (doktrin). PRICE_LINES = Admin-runtime only.
- **Harga = saldo/pool** — bukan; frozen snapshot (fakta transaksi, pola walk-in nota).
- **Tambah baris manual dari katalog** — itu `taskItemBuilder` (search-pick); PRICE_LINES = edit baris pre-seeded. Kalau butuh tambah-dari-katalog, pakai taskItemBuilder (§12).
- **Print** — reuse RECEIPT_DOC/PRN existing (bukan bagian widget ini).

## 11. Acceptance

- [ ] Baris `fixed` read-only, non-fixed editable; total live Σ harga×qty.
- [ ] Submit → `pl[]`(harga terisi) + `tot` ke doc + status freeze (`st◼invoiced`/`iv◼1`); regresi nol ke field lain.
- [ ] `mode:requote` vs `invoice` → status/label beda per config; nol hardcode.
- [ ] WA toggle (waField) → whatsappSend; kosong → toggle ilang.
- [ ] Currency id-ID anti-locale (Rp 130.000 bukan 130,000).
- [ ] Teknisi gak pernah bisa buka/lihat (RBAC Admin-runtime).

## 12. Asumsi & risiko

- [ ] **Reuse vs baru:** bisa jadi **mode `edit` di `taskItemBuilder`** (pre-seed + edit-price) ketimbang type baru — tapi taskItemBuilder = katalog-search-build (beda paradigma). Rekomendasi type baru `PRICE_LINES` (fokus edit-baris); konfirmasi dev mana lebih murah.
- [ ] Pre-seed `pl[]` (jasa×price-book) = CF belum ada → interim: seed manual / requote isi semua baris tangan. [VERIFY price-book lokasi + siapa isi].
- [ ] `pl` array {l,h,f,q} — bentuk fix; kalau CF nulis beda → sesuaikan key config.
- [ ] Freeze idempotent: re-submit invoice = jangan dobel; gate `iv◼` (udah invoiced → read-only). [VERIFY].

---

**Referensi:** `docs/service-ac-widget-reuse-gap.md` · `docs/service-ac-teknisi-execution-design.md` · `AdminServiceRuntimeMaintenance.jsx` (RequoteSheet/InvoiceSheet) · `taskItemBuilder` · walk-in nota (frozen snapshot pola) · RECEIPT_DOC/PRN · whatsappSend.
