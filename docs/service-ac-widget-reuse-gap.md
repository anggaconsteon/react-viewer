# Service AC — Reuse-vs-New Widget Gap Table (Analisa)

**Tanggal:** 2026-08-04
**Buat:** basis design doc vertikal Service AC (3 surface: Admin / Teknisi / Asset Registry)
**Sumber mockup:** `src/component/AdminServiceRuntimeMaintenance.jsx` · `TeknisiRuntimeMaintenance.jsx` · `AssetRegistryMaintenance.jsx`
**Status:** ANALISA (belum design final — 7 keputusan di §6 belum dikunci)
**Referensi:** widget catalog `json/widget-library/_widget-catalog.csv`, driver-runtime specs, walkin-* specs, `docs/timeline-ledger-variant-dev-spec.md`

---

## 0. Verdict

**~85-90% reuse.** Mockup sengaja didesain di atas substrat Consteon (komentar file nyebut reuse eksplisit). Family yang cocok: **Driver** (Teknisi runtime ~1:1) + **Admin** (koordinasi). **Warehouse = SKIP** (custody/movement/isi-kosong — paradigma salah; case ini no-stock, aset = di-maintain bukan returnable). Ambil shell LIST_CARD/TIMELINE-nya doang, bukan logika custody.

Legend: ✅ reuse apa-adanya · 🔧 reuse + mode/param baru · 🆕 baru · ⛔ jangan pakai

---

## 1. Teknisi Runtime (← Driver runtime, ~1:1)

| Elemen mockup | Widget existing | Verd | Catatan |
|---|---|---|---|
| Jadwal hari ini (JobRow list) | `listCard` (task feed) | ✅ | title cust, sub jenis·unit, meta jam+alamat, badge state |
| Job execution (stepper by-state) | **pola DriverHome state-machine** (page, bukan 1 widget) | ✅ | StepDot done-flag = DERIVE dari field WO/event; action widget kondisional per `tstate` |
| Mulai kerja | `sendButtonGps` / `sendButtonGpsWithEvent` | ✅ | emit event `workorder-started` |
| Foto awal / akhir / scope | `getImagesGallery` (GET_IMAGES) | ✅ | bukti; max 1-N |
| Konfirmasi Unit (pilih aset multi) | `tablePicker` mode multi | 🔧 | select ✅; **tapi "Tambah Unit belum terdaftar" (inline-create) gak ada** → route/form terpisah (gap #3) |
| Parts terpakai (qty per item) | `taskItemBuilder` mode walkin ATAU `selectableGrid`+stepper | 🔧 | teknisi catat jenis+qty **TANPA harga** → mode/param buang harga (RBAC) |
| Lapor Temuan (scope) | `3LineBorderForm` + `selectableGrid` (parts needed) + GET_IMAGES | ✅ | non-blocking; emit `workorder-scope-reported` |
| Parts Kurang (hold) | `selectableGrid` (pilih part) | ✅ | emit `workorder-parts-hold` |
| Minta ganti teknisi | `selectableGrid` (alasan) + `3LineBorderForm` (note) | ✅ | non-blocking; emit `workorder-reassign-req` |
| Selesai: foto+TTD+bayar | GET_IMAGES + **`signaturePad`** + `selectableGrid` (tunai/transfer/belum) | ✅ | signaturePad LIVE; bayar = observasi tanpa nominal |
| Cetak Surat Selesai (no harga) | `printBluetoothKeyed` / `sharePdfKeyed` + `RECEIPT_DOC` | ✅ | slip tanpa harga = template RECEIPT tanpa `|idr` |
| Cetak Invoice (policy terbuka) | `printBluetoothKeyed` + `RECEIPT_DOC` | ✅ | harga frozen dari Admin; teknisi = print-terminal read-only (RBAC gate `printPolicy`) |
| Offline band + WA courtesy | existing (notification) | ✅ | — |

**Teknisi = ~nol widget baru.** Cuma gap #3 (picker-create).

---

## 2. Admin Runtime (← Admin/koordinasi)

| Elemen mockup | Widget existing | Verd | Catatan |
|---|---|---|---|
| Header identitas + counter | `workspaceHeader` | ✅ | — |
| Zona "Butuh keputusan" (VonisCard = kartu + tombol) | `listActionCard` | ✅ | action1/action2 = Assign/Tetapkan/Ganti/Tinjau; badge alasan |
| Zona Butuh aku / Lagi jalan / beres | `listCard` grouped (derive client) | ✅ | zoning = client-derive dari status (ala task feed) |
| Buat Order (wizard 3-step) | form widgets flat | 🔧 | **wizard multi-step gak ada** → split 3 route ATAU `STEPPER_FORM` baru (gap #2) |
| — step1 customer (pilih/baru) | `tablePicker` (customer) + `textField`×3 | 🔧 | pick ✅; customer-baru inline = sama isu picker-create |
| — step2 jenis/unit/keluhan | `selectableGrid` + numericField stepper + `3LineBorderForm` | ✅ | — |
| — step3 slot/prioritas | `selectableGrid` | ✅ | — |
| Assign / Ganti teknisi | `tablePicker` (workforce, badge beban) + `selectableGrid` (alasan) | ✅ | beban = field denorm/derive |
| Tetapkan Harga (requote, N baris editable) | `taskItemBuilder` **mode baru** | 🆕 | **gap #1** — pre-seed baris dari scope + admin isi harga + total. Mekanik ada, mode baru |
| Buat Invoice (lines + total + freeze) | `taskItemBuilder` (mode invoice) + `notaCreateSubmit` + `RECEIPT_DOC` | 🔧 | pipeline nota walk-in REUSE; freeze snapshot; lines pre-seed dari WO (jenis×unit) + parts + revisi |
| Kronologi WO | `timeline` (ledger) | ✅ | scope `ref◼{wo}` |
| WA estimasi / invoice | notification (existing) | ✅ | — |

---

## 3. Asset Registry (← shell Warehouse, BUKAN logika custody)

| Elemen mockup | Widget existing | Verd | Catatan |
|---|---|---|---|
| List aset group by kondisi (perhatian/normal) | `listCard` grouped ATAU `listStatisticCard` | 🔧 | **badge kondisi = DERIVED dari history** → client-derive ATAU CF-denorm field `cond` (gap #4, gotcha OUTSTANDING lama) |
| Asset card (label, cust, next-due) | `listCard` | ✅ | borderLeft warna = badge kondisi |
| Asset detail header | `workspaceHeader` | ✅ | load `asset_id` |
| Kondisi + next-due (2 stat) | `statCardRow` | ✅ | derive |
| Pengukuran terakhir (suhu/arus/freon chips) | `listCard`/text meta ATAU `noticeBar` | ✅ | chip pengukuran = meta string; warn = variant amber |
| Riwayat perawatan (timeline per-aset) | `timeline` (ledger) | ✅ | append-only, key `asset_id`; icon per type |
| ⛔ custodyCount / preconditionGateCard / nfcReader / asset_cache panel | — | ⛔ | **JANGAN** — custody/isi-kosong, salah paradigma |

---

## 4. Primitif data (schema — semua BARU, bukan reuse coll)

| Coll | Isi | Analogue |
|---|---|---|
| `work_order` | doc terstruktur (cust, jenis[], unit, keluhan, slot, prioritas, teknisi, status-derive, linked asset_id[], parts[], scope, revisiLines, bayar) | `task` (Driver) |
| `//event` | ledger append-only WO (timeline) — `ty:workorder-*`, `ref:{wo}` | addToEvent existing |
| `asset` (service) | ⚠️ **BUKAN `asset_cache`** — ledger perawatan per unit, kondisi DERIVE dari history | entity baru |
| `customer` | id/nama/hp/alamat | reuse kalau ada |
| `price_book` | harga jasa + parts (admin-only, RBAC) | config/coll baru |

Event taxonomy baru: `workorder-created/assigned/started/unit-linked/parts-recorded/scope-reported/parts-hold/reassign-req/reassign-done/scope-priced/completed/invoiced`.

## 5. CF (Go)

- **onWorkOrderComplete → fan-out** history entry ke tiap linked `asset_id` (+ update lastService/cadence). Pola onProjectCreate fan-out.
- (opt) denorm `cond`/`nextDueAt` ke asset doc (buat filter registry — gap #4).
- notif assign/reassign; WA scope-priced + invoice.
- Status WO: derive client ATAU CF (keputusan #1).

---

## 6. Yang BENER-BENER baru (ranked)

| # | Item | Effort | Alternatif lazy |
|---|---|---|---|
| 1 | **Mode `invoice`/`requote` di `taskItemBuilder`** (pre-seed baris + edit harga + total + freeze) | Sedang | mode = pola extend existing (walkin/delivery/supplier udah gitu), bukan widget nol |
| 2 | **Wizard 3-step** intake | Kecil | **split 3 route** (nol widget baru) — REKOMEN |
| 3 | **Picker + create-inline** (unit / customer baru) | Kecil | route "Tambah" terpisah |
| 4 | **Badge kondisi turunan** registry | Kecil | client-derive di listCard ATAU CF-denorm `cond` |

Sisanya = compose widget existing + page-pattern (DriverHome state-machine) + reuse pipeline nota.

## 7. Keputusan yang harus dikunci (sebelum design final)

1. WO storage: `work_order` doc + event ledger (rekomen) vs reuse `task`+`event`?
2. `asset` coll: nama (`service_asset`/`unit`), history inline vs derive-dari-WO-event? (jangan tabrak `asset_cache`)
3. Isolasi harga: price_book di sheet-config vs coll; teknisi doc-view buang field harga (RBAC); printPolicy = config tenant.
4. Kondisi turunan registry: client-derive vs CF-denorm.
5. Parts = fakta doang (no stock deduction) — confirm inventory OUT-OF-SCOPE v1.
6. Customer: coll baru vs reuse existing.
7. Roles: Admin + Teknisi (Customer cuma TTD, no app) = 2 app-role.

## 8. Not Doing (v1)

- Inventory/stock parts (mockup = fakta doang).
- Custody/movement/isi-kosong (bukan model bisnis ini).
- QR per-unit aset (mockup: "QR menyusul utk klien komersial" — defer).
- Customer app (TTD lewat teknisi device).
