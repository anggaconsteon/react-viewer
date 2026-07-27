# Dev Spec — Seed Saldo Awal Customer (nota `src◼seed`, branch ke-3)

**Tanggal:** 2026-07-16
**Buat:** dev Go (CF — branch ke-3 `OnNotaCreated`) + dev Flutter (extend 2 widget yang SAMA dengan supplier — kerjain bareng `supplier-transaction-flutter-dev-spec.md`).
**Fitur:** admin catat saldo awal galon/tabung yang MASIH di customer sejak sebelum pakai aplikasi (pengganti in-app dari tab spreadsheet `Genesis_Outstanding` — user putuskan seed customer lewat aplikasi, 2026-07-16). Sekali per customer; setelahnya outstanding jalan otomatis dari drop/pickup.
**Pola:** sibling PERSIS walk-in & supplier — 1 doc `nota` → CF fan-out movement → `asset_cache` (outstanding) otomatis. Ini branch ke-3 yang sudah diramal di spec supplier ("Sibling masa depan: src◼seed").

---

## 0. Page op1Screen — SUDAH LIVE (config-ahead 2026-07-16)

- **SeedCustomerList @1352** — workspaceHeader + **LIST_CARD** (stock_location `lt◼client⭘lst◼active`, title `<ln>`, subtitle `<al>`, meta `<ty>`, routeParams **multi-pair** `customerId◼{lv}⭘customerName◼{ln}`) → SeedSaldoAwal. LIST_CARD renderer sudah live (dipakai fate/model) → page 1 langsung jalan.
- **SeedSaldoAwal @1360** — workspaceHeader data-bound (`lv◼{customerId}`) + noticeBar + NUMBER `SEED-{{YYYY}}-{{COUNTER(vtl.nota,6)}}` pos17 + **TASK_ITEM_BUILDER `mode:"seed"`** (pending dev, §2) + TXF hari pos11 + TXF catatan pos10 + **NOTA_CREATE_SUBMIT `src:"seed"`** (pending dev, §3).
- Launcher AdminHome + item ke-10 "Seed Saldo" (fact_check) → SeedCustomerList.

## 1. Doc nota yang ditulis submit (kontrak CF)

Coll `nota` (sama), pembeda `src◼seed`:

```json
{"nno":"SEED-2026-000001","src":"seed","kl":"CUST-0001","kn":"Toko Contoh Jaya","gl":"F621558e33b612","by":"<adminName>","cv":"<adminVid>","d":"sisa galon dari langganan lama","days":30,"li":[{"ii":"8886008101138","in":"Aqua Galon 19 Liter","qt":3,"cd":"full"}],"t":<epoch>,"ts":"<formatted>"}
```

- `kl`/`kn` = customer (id + denorm nama) dari routeParams.
- `days` = umur hutang perkiraan, **per-NOTA** (bukan per-line — keputusan simpel: beda umur per item = bikin nota kedua). Kosong/0 = mulai hari ini.
- `li[]` line: `{ii, in, qt, cd}` — `cd` default `full` (galon di customer = isi belum balik). TANPA hrg/tx.
- TANPA `tot` (bukan transaksi uang).

## 2. CF — branch `OnNotaCreated` case `src == "seed"`

Mirror branch supplier (`supplier_nota_trigger.go` = template). Per `li[]` line emit 1 movement:

```
{tl: nota.kl, ii, cd (default full), qt, mt: "ADJUSTMENT", er: "GENESIS",
 mid: "seed-{nno}-{ii}-{cd}", mrf: nno, an: nota.by,
 d: "saldo awal outstanding (seed)",
 t: now - nota.days*86400000, ts: fmtTS(t)}
```

- `fl` DI-OMIT (masuk sistem dari luar — precedent seedstock gudang + genesis spreadsheet MID `seedout-*` yang sama semantiknya).
- **Backdate**: `t` mundur `days` hari → aging OUTSTANDING_PANEL/CUSTOMER_OUTSTANDING_LIST (danger/warn) langsung realistis.
- mid deterministik → re-fire idempotent. asset_cache & lt/ln/ty denorm jalan sendiri via OnMovementCreated existing — **NOL perubahan engine**.
- Guard: `kl` kosong / `li` kosong → log WARN, ACK (permanent).

## 3. EXTEND Flutter (bareng PR supplier — pola identik)

1. **TASK_ITEM_BUILDER `mode:"seed"`** — varian PALING SIMPEL: picker item (sama) + per line SATU field qty (`qtyField:"qt"`). Tanpa tx, tanpa harga, tanpa subtotal. Label dari `text` ◆-seg (0 judul · 1 tombol tambah · 2 label qty · 3 hapus). Output wizard (`seed_saldo`): `{ii, in, qt, cd:"full"}`.
2. **NOTA_CREATE_SUBMIT** +3 param (sibling `sv`/`sn`/`notePosition` yang sudah di-spec supplier):
   - `kl` → field `kl` (token dari routeParams)
   - `kn` → field `kn`
   - `daysPosition` → posisi TXF hari → field `days` (Number; kosong → omit/0)
   - `src:"seed"` = param existing. TOTAL bar: mode seed tanpa hrg → tampilkan total QTY (segmen text "TOTAL") atau hide — keputusan dev, jangan crash.
3. Walk-in & supplier **nol regresi** — mode/param baru semua opsional.
4. **EXTEND #3 — `gl` registry-fallback (berlaku SEMUA pemakai NOTA_CREATE_SUBMIT: walkin/supplier/seed).** Masalah: `gl` sekarang literal per-tenant di config (`"gl":"GDG-01"`) — onboarding client baru harus inget ganti manual = rawan lupa, salah gudang silent. Perilaku baru: **config `gl` KOSONG → widget query `stock_location` `lt◼warehouse⭘lst◼active`**: ketemu **1** → pakai (kasus umum, otomatis selamanya); ketemu **>1** → tampil picker gudang WAJIB sebelum submit (label dari `text`); ketemu **0** → submit disabled + pesan error dari `text`. `gl` keisi literal → perilaku lama persis (nol regresi). Setelah landing, config 3 tombol dikosongin — nol nilai per-tenant nyangkut.

## 4. Acceptance

1. Launcher "Seed Saldo" → list customer (LIST_CARD) → tap → form dengan nama customer di header (2 token routeParams resolve).
2. Isi Aqua Galon qty 3 + hari 30 → simpan → doc nota `src◼seed` sesuai §1.
3. CF emit `seed-SEED-2026-000001-8886008101138-full` → asset_cache[customer] +3 → Outstanding & AssetStock tab Customer nampil, **aging ±30 hari** (bukan 0).
4. Re-fire CF = nol dobel. Seed kedua buat customer sama = nota baru (nno beda) → mid beda → SALDO NAMBAH — noticeBar sudah memperingatkan "sekali per customer"; CF tidak perlu blokir (admin bisa memang perlu koreksi tambah).
5. Walk-in + supplier flow regresi nol.

---

**Referensi:** `supplier-transaction-dev-spec.md` + `supplier-transaction-flutter-dev-spec.md` (sibling terdekat — CF branch & param submit), `walkin-nota-cf-dev-spec.md` (pola nota→movement), seeder spreadsheet fase-3 Genesis (`driver-runtime-seed.js` `seedout-*` — semantik yang dipindah ke in-app), `list-card-universal-dev-spec.md` (LIST_CARD kontrak).
