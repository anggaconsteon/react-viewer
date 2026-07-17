# Dev Spec (Flutter) — Walk-in transaction history (list → tap → nota detail)

**Tanggal:** 2026-07-08
**Buat:** Flutter dev (renderer). Bagian dari walk-in POS (`walkin-counter-pos-design.md` v2). Nyambung: `receipt-doc-widget-dev-spec.md` (halaman tujuan), `walkin-flutter-dev-spec.md` (token `{nno}`).
**Fitur:** kasir bisa buka riwayat nota walk-in, tap satu → masuk halaman nota (RECEIPT_DOC + cetak).

---

## 0. Yang UDAH di sheet (config LIVE)

- **AdminHome launcher grid** (`SELECTABLE_BTN mode:launch`): +1 item **"Riwayat" 🧾 → `vertikaTeknoLokaciptaWalkInHistory`** (jadi 4: Customer Baru·Order Masuk·Walk-in·Riwayat).
- **Page BARU `vertikaTeknoLokaciptaWalkInHistory`** (op1Screen row 930): `WORKSPACE_HEADER` + `TASK_FEED_LIST` flat, reuse template `taskFeedListFlat`. Config resolved:

```json
{"type":"TASK_FEED_LIST","vidtable":"20342033315492","table":"84214220504259//nota","search":"src◼walkin","groupField":"","idField":"nno","titleField":"nno","addressField":"by","picField":"","iconField":"","dateField":"ts","amountField":"tot","sortField":"t","sortDir":"desc","searchHint":"Cari nota…","badgeTable":"","badgeSearch":"","badgeField":"","badgeLabel":"","seedLabel":"","route":"vertikaTeknoLokaciptaWalkInNota","countLabel":"nota","emptyText":"Belum ada transaksi walk-in","wizardKey":"","text":"Riwayat Transaksi"}
```

> Update 2026-07-15: +`dateField`/`amountField`/`sortField`/`sortDir` (lihat §1.A2) — config-ahead LIVE, nunggu renderer.

## 1. Yang perlu renderer (2 hal)

### A. TASK_FEED_LIST flat baca koleksi `nota` (named field)
Sama seperti customer-list (flat mode, `groupField` kosong): render tiap doc `nota` (search `src◼walkin`) — `titleField:nno` (judul), `addressField:by` (sub, kosong→"Umum"). Harus jalan kalau flat-mode named-field udah kebangun (customer-list dep).

### A2. Tanggal + amount + sort (WAJIB — user request 2026-07-15, config SUDAH LIVE di sheet)

4 param BARU di TASK_FEED_LIST (staged di config row 838, template Widget J247 di-extend; usage lain kosong = perilaku lama, nol regresi):

| param | nilai walkin | fungsi |
|---|---|---|
| `dateField` | `ts` | on-doc scalar (string formatted) → tampil tanggal per baris (sub/meta kanan) |
| `amountField` | `tot` | on-doc Number → trailing, format ribuan |
| `sortField` | `t` | field sort (epoch Number) |
| `sortDir` | `desc` | `desc`=terbaru dulu / `asc`. Kosong = urutan default lama |

Semua on-doc scalar, BUKAN badge-lookup. Kosong (`""`) = fitur off → widget lama gak berubah (customer-list D775 di-resolve kosong semua).

### B. Tap baris → route WalkInNota bawa `{nno}` (KUNCI)
Tap satu nota → route `vertikaTeknoLokaciptaWalkInNota`, dan **nilai `nno` baris yang di-tap WAJIB ke-inject sebagai token `{nno}`** di halaman tujuan. WalkInNota (PRN keyed + RECEIPT_DOC) search `nno◼{nno}` → nampilin nota yang benar.

- Ini mekanisme yang SAMA dengan driver TaskFeed→DeliveryWorkspace (tap task → `{activeTaskVid}`). Bedanya token tujuan = `{nno}` (match idField), bukan nama fixed.
- **Kontrak token: `{nno}`** — dipakai 2 pintu masuk WalkInNota: (1) dari Buat Nota (NOTA_CREATE_SUBMIT inject `{nno}`), (2) dari Riwayat (tap inject `{nno}`). Dua-duanya harus resolve ke token yang sama.
- Cara bersih (kalau `routeParams` udah/mau dibangun — `rbt-route-params-dev-spec.md`): `routeParams:"nno◼{nno}"` di TASK_FEED_LIST. Kalau belum, generalisasi mekanisme tap-id existing biar inject token bernama `{nno}` (= idField).

## 2. Acceptance

1. AdminHome → tap "Riwayat" → WalkInHistory: list semua nota `src:walkin`, tiap baris = No nota + pembeli (+ total/tanggal kalau §1A dibangun), terbaru dulu (idealnya sort `t` desc).
2. Tap 1 nota → WalkInNota nampilin nota ITU (RECEIPT_DOC/PRN search `nno◼{nno}` resolve) — bukan nota lain, bukan kosong.
3. Belum ada nota → "Belum ada transaksi walk-in".
4. Kembali dari WalkInNota → balik ke Riwayat (backRoute WalkInNota = WalkIn; mungkin mau backRoute kontekstual — lihat catatan).

## 3. Catatan

- **backRoute WalkInNota** sekarang hardcode ke `vertikaTeknoLokaciptaWalkIn` (alur create). Dari Riwayat idealnya balik ke Riwayat — kalau perlu kontekstual, itu isu nav terpisah (bisa 2 halaman nota atau backRoute dinamis); demo: hardcode ke WalkIn dulu, gak blocking.
- Scope search `src◼walkin` = SEMUA nota walk-in (belum di-scope tanggal). Kalau kebanyakan, tambah scope tanggal nanti (`⭘tdt◼{today}` gak ada di nota; pakai range `t` — future).
- Label `text`/`countLabel`/`searchHint` semua dari config (owner reword lewat sheet).

---

**Referensi:** `receipt-doc-widget-dev-spec.md` (WalkInNota detail), `walkin-flutter-dev-spec.md` (token `{nno}` dari create), `customer-namelist-and-creator-token-dev-spec.md` (TASK_FEED_LIST flat named-field — dep sama), `rbt-route-params-dev-spec.md` (routeParams — cara bersih pass token), op1Screen WalkInHistory row 930 + AdminHome launcher row 759.
