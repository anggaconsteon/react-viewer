# Walk-in Counter (POS) — Implementation Plan

> **Domain note:** ini bukan plan kode pytest — sistemnya **op1Screen sheet-CMS** (config JSON via Widget template + SUBSTITUTE) + **renderer Flutter** (baca config, gambar+write Firestore). "Test" tiap task = **verify resolved JSON / app render**, bukan unit-test. Cross-role: 🟣 tech-lead · 🔵 Flutter dev · 🟢 sheet-design.

**Goal:** Build Walk-in Counter (POS) — jual consumable+refill di counter, bayar LUNAS, cetak nota — sebagai layer komersial generic (`nota` + `RECEIPT_DOC`) di atas flow `movement` existing.

**Architecture:** W1 intake (reuse `taskItemBuilder` mode walkin + payment + buyer) → proceed nulis `movement`(stok, existing) + `nota`(komersial, native `li[]`) → W3 `RECEIPT_DOC`(generic) baca nota → printBluetooth. Nota cross-runtime (`src/ref/kl`) → driver delivery reuse nanti.

**Tech stack:** op1Screen proxy `18v3w5YJ…` · Firestore vidtable `20342033315492` coll prefix `84214220504259` · Flutter renderer · Document/print (printBluetooth).

## Global Constraints
- Stok TETEP via `movement`→CF→`asset_cache` (existing, JANGAN diubah). Nota = nempel di atas (link `nref`=nno).
- Counter = LUNAS, no outstanding, no custody, no stock_location (pembeli Umum).
- Semua widget generic/config-driven (label `text` ◆-seg, table/field=param). Genericize pattern (Widget J template + col-D SUBSTITUTE).
- Nota field code = PROPOSED sampai 🟣 D3 ratify.
- Scope = counter only; Dikirim = fase lain (reuse P3–P5).

---

## Phase 0 — GATES (🟣 tech-lead, prereq — block sampai kelar)

### Task 0: Ratify keputusan komersial
- [ ] **D1** — sumber harga: field `item.hrg` (atribut produk, pricelist global) — konfirmasi nama field + editor (luar fitur).
- [ ] **D3** — schema `nota` final: `nno/src/ref/kl/by/bym/st/gl/tot/li[]{ii,in,qt,hg,sub}/cv/cn/t/ts`. Ratify field codes + koleksi.
- [ ] **D5** — harga refill: di-charge? dari mana (`item.hrgRefill`?) + masuk `li[]` atau parkir?
- [ ] **D9** — `gl` depo: dari session admin (warehouse-nya) atau dipilih?
- [ ] **Verify:** dict book ke-update (`nota` coll + `item.hrg` + `nref` di movement). Tanpa ini, Phase A/B ketahan.

---

## Phase A — Renderer (🔵 Flutter dev)

### Task A1: `RECEIPT_DOC` renderer (generic printable doc)
**Files:** Flutter widget registry + `RECEIPT_DOC` renderer.
**Consumes:** config (lihat design §2). **Produces:** rendered receipt + print hook.
- [ ] Render: query `table` by `search` (1 doc) → header block (query `headerTable` by `headerSearch` `lv◼{gl}` → name/addr/contact), title, meta (`noField`/`buyerField`/`dateField`), lines table (`linesField[]` → `lineNameField`×`lineQtyField`×`linePriceField`=`lineSubField`), `totalField`, `methodField`, stamp `statusField`, footer (`text` ◆-seg).
- [ ] Empty `buyerField` → tampil "Umum".
- [ ] **Verify:** kasih nota dummy (Task B4) → widget render mirip mockup W3 (header depo · lines · TOTAL · LUNAS stamp).

### Task A2: `taskItemBuilder` mode `walkin`
**Files:** existing `taskItemBuilder` renderer (extend).
- [ ] `mode:walkin` → txTypes gate (sale,refill). Sale line: qty stepper + **harga input** (default `priceSourceField` `item.hrg`, override boleh) → `qtyField`/`priceField`. Refill line: water toggle (`waterTypeField`) + qty, no harga (atau D5).
- [ ] Footer total Rp = Σ(sale `hg×qty`) — renderer compute.
- [ ] Build draft `li[]` (writeTarget `nota.li`).
- [ ] **Verify:** W1 in-app → +Produk (sale, harga editable) + +Refill (water+qty) → total Rp bener.

### Task A3: native-array write `nota.li[]` + movement-per-line (KEYSTONE — shared `task.it[]`)
**Files:** savesend renderer (native Firestore write).
- [ ] On `sendButtonGpsWithEvent` submit: tulis `nota` doc — header scalar via addToEvent (`nno` gen, `src:walkin`, `ref`, `kl` opt, `by`, `bym`, `st:LUNAS`, `gl`, `tot`, `cv/cn`, `t/ts`) **+ append draft `li[]` native array** (= cap `task.it[]`).
- [ ] Per line: emit `movement` ({mt:SALE/REFILL, fl:{gl}, tl:null, ii, qt, er:ADMIN, t, nref:{nno}}) — loop draft lines (= driver movement-emit).
- [ ] Navigate W3 bawa `{notaId}`=nno.
- [ ] **Verify:** submit → Firestore: 1 `nota` (li[] terisi) + N `movement` SALE; CF turunin stok depo (asset_cache −qt).

### Task A4: print wiring
- [ ] `RECEIPT_DOC` "Cetak" → `printBluetooth` (reuse driver impl) render thermal 80mm.
- [ ] **Verify:** cetak → struk 80mm keluar (atau preview).

---

## Phase B — Sheet config (🟢 sheet-design — gue, abis A siap / paralel)

### Task B1: Widget template `RECEIPT_DOC`
**Files:** Widget tab (proxy) baris fresh (mis. 250) — tulis G(mirror)/H(idx)/I(name)/J(template); JGN col A.
- [ ] J = template generic semua field `[PLACEHOLDER]` (lihat design §2). I=`receiptDoc`.
- [ ] **Verify:** `=IF(ISERROR(J250)…)` G250 resolve, A250 spill `receiptDoc` (col-A gak break).

### Task B2: op1Screen W1 page (`vertikaTeknoLokaciptaWalkIn`)
**Files:** op1Screen page-row block (W1 udah ADA ~829 sbg literal — refactor ke generic + selaras design). **Cari by route name (sheet re-order pas sync).**
- [ ] Widget rows (col B name + col D SUBSTITUTE + helper): workspaceHeader(225) · selectableGrid payment(184, Tunai/Transfer) · textField buyer · `taskItemBuilder` mode walkin · sendButtonGpsWithEvent(192, addToEvent nota header + writeTarget nota). Drop fulfillment toggle (counter only).
- [ ] **Verify:** header B(W1) reassemble JSON valid, no leftover `[TOKEN]`, no #N/A.

### Task B3: op1Screen W3 page (`vertikaTeknoLokaciptaWalkInNota`)
**Files:** op1Screen page-row block baru (W3). Cari by route name.
- [ ] Widget rows: workspaceHeader(225) · `RECEIPT_DOC` (search `nno◼{notaId}`) · printBluetooth · rbtCta "Transaksi Baru"→W1.
- [ ] **Verify:** header B(W3) reassemble valid; RECEIPT_DOC config resolve (no leftover token).

### Task B4: nota dummy (test data)
- [ ] Seed 1 `nota` doc (Firestore atau script) — li[] 2 baris, tot, bym, LUNAS — buat test render A1/B3 sebelum write (A3) jadi.
- [ ] **Verify:** buka W3 dgn {notaId} dummy → RECEIPT_DOC render.

---

## Phase C — Verify E2E
- [ ] In-app: W1 intake (+Produk harga, +Refill) → proceed → W3 nota (nomor, lines, total, LUNAS) → Cetak. Firestore: nota + movement + asset_cache turun.
- [ ] Cross-runtime check: schema nota muat `src:delivery` (driver nanti) — gak perlu build, cuma konfirm field ada.

---

## Self-review (spec coverage)
- §1 widget inventory → Task A2/B2 (W1) + A1/B3 (W3). ✓
- §2 JSON (RECEIPT_DOC + W1 reuse) → B1/B2/B3. ✓
- §3 write (movement+nota+native li[]+nref) → A3. ✓ schema nota → Task 0/D3. ✓
- `kl` optional / counter no stock_location → A3 (kl opt) + global constraint. ✓
- cross-runtime src/ref/kl → schema (Task 0) + Phase C check. ✓
- printBluetooth → A4. ✓
- deps (native-array keystone, movement-emit) → A3 (flagged shared). ✓
Gap: none. Semua section spec ke-cover.

## Urutan eksekusi
**0 (tech-lead) → A1+A2 paralel → A3 (keystone) → A4 · B1→B2/B3 (paralel A) → B4 (test render) → C (E2E).** B (sheet) bisa jalan duluan (config siap) tapi app baru render abis A.
