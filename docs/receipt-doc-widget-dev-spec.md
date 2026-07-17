# Dev Spec (Flutter) — RECEIPT_DOC: on-screen nota card (named-field + li[] loop)

**Tanggal:** 2026-07-08
**Buat:** Flutter dev (renderer — widget BARU `RECEIPT_DOC`). Design induk: `walkin-counter-pos-design.md` v2 (§1 sempat DEFER; sekarang diaktifkan buat detail on-screen).
**Kenapa baru:** `ITEM_CARD_DETAIL` (approval-flow) baca token POSISIONAL `<N>` + record tunggal → gak bisa baca nota named-field (`nno`/`by`/`tot`) apalagi loop array `li[]`. Nota = doc named-field + array. Butuh widget yang: (1) baca doc by search, tampilin field by NAMA, (2) loop 1 array field jadi baris. Generic → reusable nota driver (`src:delivery`) nanti, nol rombak.

---

## 0. Layout (target render)

```
┌─────────────────────────────────────┐
│          DEPO GALON BINTARO          │  header depo (lookup gl → ln/al)
│    Jl. Raya Serpong No.10, Bintaro   │
│                                      │
│           NOTA PENJUALAN             │  title
│  ··································· │
│  No.      NOTA-2026-000001           │  noField
│  Tanggal  08 Jul 2026 09:39          │  dateField
│  Pembeli  Angga                      │  buyerField (kosong → "Umum")
│  Bayar    Tunai                      │  paymentField
│  ─────────────────────────────────   │
│  Amidis Galon 19 Liter               │  ┐ loop li[] — 2 BARIS per item:
│    1x 21.000            21.000        │  ┘ baris-1 nama · baris-2 qtyxharga (kiri)+subtotal (kanan)
│  LPG 3kg                             │
│    2x 25.000            50.000        │
│  ─────────────────────────────────   │
│  TOTAL                   71.000      │  totalField (bold)
│         ┌──────────┐                 │
│         │  LUNAS    │                │  statusField (badge)
│         └──────────┘                 │
│           Terima kasih               │
└─────────────────────────────────────┘
```

Read-only kartu (bukan form). Angka rupiah: format ribuan (`71000` → `71.000`) di renderer.

## 1. Config resolved (live target — page WalkInNota, di ATAS tombol PRN)

```json
{"type":"RECEIPT_DOC","vidtable":"20342033315492","table":"84214220504259//nota","search":"nno◼{nno}","title":"NOTA PENJUALAN","headerName":"Gudang Bintaro","headerAddr":"Jl. Raya Serpong No.10, Bintaro","headerTable":"84214220504259//stock_location","headerSearch":"lv◼{gl}","headerNameField":"ln","headerAddrField":"al","noField":"nno","buyerField":"by","buyerEmpty":"Umum","dateField":"ts","paymentField":"bym","statusField":"st","totalField":"tot","linesField":"li","lineNameField":"in","lineQtyField":"qt","linePriceField":"hg","lineSubField":"sub","money":"id","text":"NOTA PENJUALAN◆No.◆Tanggal◆Pembeli◆Bayar◆TOTAL◆Terima kasih"}
```
(LIVE: `headerName`/`headerAddr` keisi literal → header pakai itu, lookup di-skip.)

- **`search:"nno◼{nno}"`** → 1 doc nota (token `{nno}` udah ke-inject dari NOTA_CREATE_SUBMIT, jalur yang sama dipakai PRN keyed di page yang sama).
- **Header depo — HYBRID (literal > lookup), user decision 2026-07-08:** prioritas **`headerName`/`headerAddr`** (literal config, di-define owner di spreadsheet). **Kalau dua-duanya NON-KOSONG → pakai literal, JANGAN query database.** Kalau kosong → fallback lookup `headerTable`+`headerSearch:"lv◼{gl}"` → `headerNameField`/`headerAddrField` (`ln`/`al`). Walk-in v1 = literal keisi ("Gudang Bintaro" + alamat) → gak nyentuh stock_location. Multi-depo/dinamis nanti = kosongin literal → lookup jalan.
- **Scalar by NAMA:** `noField`/`buyerField`/`dateField`/`paymentField`/`statusField`/`totalField` = nama field doc. `buyerEmpty:"Umum"` = fallback kalau `by` kosong.
- **Loop array:** `linesField:"li"` → tiap elemen render `lineNameField`(in) besar, baris kecil `lineQtyField × linePriceField` + `lineSubField` rata-kanan.
- **`text`** = label ◆-sep (index): 0 title · 1 "No." · 2 "Tanggal" · 3 "Pembeli" · 4 "Bayar" · 5 "TOTAL" · 6 footer. Semua label dari config (jangan hardcode di Flutter — owner bisa reword lewat sheet).
- **`money:"id"`** = format ribuan `.` (id locale): `20000`→`20.000`. Berlaku ke linePrice/lineSub/total. **"Rp" HANYA di total** (`Rp71.000`); per-item cuma grouping tanpa Rp (`1x 21.000` · `21.000`). Konsisten dgn PRN print (`walkin-flutter-dev-spec` §3b).

## 2. Perilaku

- Doc gak ketemu (`{nno}` kosong / belum ada) → kartu kosong/placeholder "Belum ada nota", JANGAN crash.
- `li[]` kosong → tampil header+total doang (total 0).
- Read-only, no write, no action. Murni display.
- Semua binding by NAMA (bukan `<N>` posisional) — INI beda kunci dari ITEM_CARD_DETAIL.

## 3. Reusable (kenapa generic)

Nota driver (`src:delivery`, spec `walkin-counter-pos-design.md` §5) pakai widget SAMA, cuma beda `search` (`nno◼{deliveryNota}`) — struktur nota identik (li[] named). Nol widget baru buat fase itu. Field labelnya juga bisa beda via `text` (mis. "SURAT JALAN" bukan "NOTA PENJUALAN").

## 4. Acceptance

1. Abis Buat Nota → route W3 → RECEIPT_DOC nampil: header depo (nama+alamat dari lookup gl), No/Tanggal/Pembeli/Bayar, tiap baris li[] (nama·qty×harga·subtotal), TOTAL = Σ sub, badge LUNAS.
2. Pembeli kosong → "Umum".
3. Angka tampil `71.000` (ribuan), bukan `71000`.
4. 3 baris item → 3 baris ke-render (loop bener).
5. Tombol PRN di bawah tetap cetak (dua widget koeksis, sumber data sama).
6. Nota lain (search nno beda) → kartu ganti sesuai doc itu.

---

**Referensi:** `walkin-counter-pos-design.md` v2 (schema nota §2, RECEIPT_DOC deferred §5), `walkin-flutter-dev-spec.md` (PRN keyed — sumber data + token {nno} sama), dict book tab `nota`. CATATAN sheet: widget baru → gue set config di WalkInNota row + Widget template BARENG build renderer (config-ahead-of-renderer rule); kabarin build ready.
