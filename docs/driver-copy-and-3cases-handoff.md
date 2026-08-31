# Handoff — 3 Case Galon (Outstanding aging · Teks driver manusiawi · Failed trackable)

**Tanggal:** 2026-08-06/07
**Buat:** sesi lain yang nerusin.
**Proxy:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` (tab `op1Screen`). Tenant `20342033315492`, table `84214220504259`.
**Status ringkas:** #1 DONE (CF pushed, nunggu deploy). #2 DONE (Batch 1+2+3, 2026-08-07). #3 DONE (config-only, 2026-08-07).

---

## #1 — Outstanding aging: DONE ✅
Bug: seed "berapa hari" gak keluar (umur 0). Akar: `seed_nota.go` backdate movement `t` bener, tapi `created.go` nimpa `asset_cache.t = nowMs`.
Fix: CF **BUILT + PUSHED `3e74253`** (branch event-push, BELUM DEPLOY) — `created.go` + `reconcile.go` pakai **max(existing_t, movement_t)**. Spec: `docs/outstanding-aging-asset-cache-t-cf-dev-spec.md`.
**Sisa:** devops deploy `onMovementCreated` + `reconcileAssetCache`. Test acceptance di spec §6.

---

## #2 — Teks driver manusiawi: DONE ✅ (2026-08-07)
**Batch 2 kelar** (26 cell, `="..."` form, ◆-count dijaga). Verified: D re-resolve valid JSON, scanner trailing ◆ utuh, Returnable/Consumable + token `<kurang>/<value>/<extra>` KEEP.
Cell diubah Batch 2: I611·H613 (DriverScanLogin) · L619·W621·**O622**·**P624** (DriverHome) · G653·I654·L655 (CustodySuccess) · G662·I663·L664 (MismatchReport) · I671·H672·I673 (MismatchSubmitted) · W677·X678 (TaskFeed) · U683 (DeliveryWorkspace itemExecution) · H692·T693·S694·I695 (ReturnVehicle) · N699·I700 (RejectTask) · N706·I707 (FailedDelivery).
Batch 3 (2026-08-07, humanize lanjut buat gaptek): I611(re) W621 O622 S623 L655 L664 H672 I673 X678 U683 I700 — Item→Barang, Task→Tugas, Update→Keisi sendiri, ≠→"bukan berarti", penanda/kesimpulan→simpel, Dikonfirmasi→Sudah Dicek, aktual→asli, order→pesanan, plan→rencana, driverStopCard@623 dihumanize.
Batch 4 (Customer→Pelanggan, driver-block, user-approved): S631·S694 (circulationSummary "per pelanggan") · S623·X678 ("Pelanggan setuju") · U683 (5 seg Jual/Beli/Refill) · I684 (signaturePad). **Supervisor DITAHAN** (biarin dulu — user). Admin/web pages GAK disentuh (Customer di sana tetap).
Batch 5 (audit-ulang manusiawi, user "se-manusiawi mungkin"): **"Stop"→"Tujuan"** (I707·S623·X678·W677·L619 — jargon English) · U683 jargon Jual/Beli dihumanize (Kepemilikan/operator/Permanen/pickup → "jadi milik pelanggan/kita·gak ada yang diambil·Masuk mobil·Selamanya milik pelanggan") · **F672=FALSE** (disable TXT list bernomor di MismatchSubmitted — 3 blok reassurance jadi 2, cegah wall-of-text). noticeBar lain udah oke. RETURNABLE/CONSUMABLE tetap LOCK.
Cara disable widget = set kolom **F{row}=FALSE** (E-arrayformula skip kalau F≠TRUE) — gak ngerusak struktur, gampang revert (F=TRUE lagi).

### SWEEP WAREHOUSE + ADMIN (user: "semuanya, full kayak driver — admin bisa gaptek juga") — IN-PROGRESS
> ⚠️ **KOREKSI GLOSSARY 2026-08-07: Vehicle → `Kendaraan` (BUKAN Mobil).** User: armada bisa motor juga, jadi "Kendaraan" lebih tepat. Semua "Mobil"/"mobil" yg sempet ditulis (28 cell lintas batch 3–9) UDAH di-revert ke Kendaraan. Batch selanjutnya: pakai **Kendaraan**. (Catatan "Kendaraan→Mobil" di Batch 6 di bawah = OBSOLETE, udah dibalik.)
Scope = SEMUA page galon warehouse+admin+ops (~27), full humanize. Di LUAR scope: Service AC, Patroli/Titik, Reward, Approval, Incident/Supervisor (vertikal lain).
**Batch 6 — WAREHOUSE DONE (5 page, 21 cell):** WarehouseFeed@713 (Q714·V715) · WarehouseOpeningCheck@718 (N719·O720·I721·V722·H723·H728·J728·P729) · WarehouseClosingCheck@732 (N733·I735·H736·T737·H738·P739) · WarehouseClosingMatch@744 (I745·L746) · WarehouseClosingMismatch@750 (I751·L752·I753). Jargon dibunuh: Vehicle Runtime→Gudang, Opening/Closing Check→Cek Berangkat/Cek Pulang, Verify+Plan→"hitung barang asli vs rencana", Load Origin→Dari Tugas, Planned Loading/aggregate task→"barang yg harusnya dimuat dari semua tugas", available→yang bisa, Checker→Petugas, Submit→Simpan, Ekspektasi→Harusnya, Kendaraan→Mobil, trip→jalan lagi, investigation/flag/judgement→laporan/penanda/nyari salah, Pengemudi→Sopir, Penerimaan→barang turun. Verified B718 valid JSON.
**Batch 7 — ADMIN INTI (sebagian) DONE:** AdminHome@757 (AJ759 coordinationSignalList=kolom TINGGI!, I760, I761 launch-menu: Walk-in→Kasir/Movement→Mutasi Stok/Outstanding→Titipan/Seed→Saldo Awal/Invoice→Nota/Reorder→Order Ulang/Assign→Tugaskan) · CreateTaskCustomer@771 (N772·P775·T775·U775·W775·X775·Z775·G776) · CreateTaskItem@779 (I780·I783·AF784·I785·G786) · CreateTaskVehicle@787 (I788·Q790·R790·Z790·AA790·AB790·I791·G792: On Route→Lagi Jalan/Available→Nganggur/KENDARAAN→MOBIL) · CreateTaskSummary@795 (I796·G797·J798·O799·I801·I802·R803·Q804·R804·S804: Review→Cek/Task→Tugas/submit→kirim/loading→dimuat). Verified B718+B795 valid JSON. ⚠️ coordinationSignalList/taskCreateSubmit/whatsappSend/pickerList text di kolom TINGGI (AC–AJ) — kudu baca lebar.
**Batch 8 — NewCustomer@805 + AdminTaskList@1173 DONE:** NewCustomer (N806·G808·H809·I810·N810·H812·K814·L814·H815·L815: Customer→Pelanggan, TIPE→JENIS, HoReCa→Hotel/Resto/Kafe, PIC→Nama Kontak, verified→beres, Outstanding→Titipan) · AdminTaskList (M1174 workspaceHeader text=kolom **M** bukan N! layout beda; N1179 groupLabels Perlu Kendaraan→Perlu Mobil/Assign Ulang→Tugaskan Ulang; W1179 stats Tugas◼; AA1179 text Task→Tugas/customer→pelanggan). groupRoutes AB1179 (wiring Case 3) VERIFIED utuh. Verified B1173 valid JSON.
**Batch 9 — Assign flow + CustodyAck + FailedTaskDetail DONE:** AssignVehicle@1181 (M1182 workspaceHeader=admin-layout kolom **M**! · I1183 · W1184 stats Mobil◼ · AA1184 listCard text) · AssignConfirm@1187 (M1188·I1189·H1190·L1190·M1190: Assign→Tugaskan, Kendaraan→Mobil, Item→Barang) · CustodyAck@1343 (driver-layout N=text; N1345·I1346·G1349·H1349·L1350·M1350: muatan→barang) · FailedTaskDetail@1337 (N1338·I1339 Task→Tugas). Verified B1181 valid + routeParams intact.
**⚠️ workspaceHeader 2 LAYOUT:** driver/CustodyAck/FailedDelivery = **N**=text (G=vidtable). Admin (AdminTaskList/AssignVehicle/AssignConfirm) = **M**=text (N=vidtable). SELALU baca G:N dulu buat pin.
**Batch 10 — Ops sebagian DONE:** WalkIn@816 (N817·Q821·U825: Walk-in→Kasir, Item→Barang, Qty→Jumlah) · WalkInHistory@836 (listCard AA838+AA839 Walk-in→Kasir; **wsHeader "Walk-in" SKIP** — gremlin alignment) · StockHistory@844 (N845 Audit→Lihat) · StockHistoryDetail@852 (N853·V854 Audit→Lihat, item→barang) · SuratJalanList@860 (N861·AA862·AB862·Z862 Task→Tugas). Verified B844/B852/B860/B836 valid.
> ⚠️ **2 lesson batch ini:** (1) SuratJalan pickerList **salah kolom** (emptyText/text = AA/AB, BUKAN Z/AA — adhocLabel=Z) → sempet korup, udah fix. (2) **Gremlin alignment**: bulk-read wide (G:AF lintas banyak empty row) bisa geser vs D-col — SELALU verify assembled B{header} sesudah tulis, fix kalau salah. Aman: overwrite cell yg current-value = string target persis.
**Batch 11 — Supplier×5 + Seed×2 DONE (verified):** SupplierList@892(N893·AA894) SupplierTransaksi@900(N901) SupplierHistory@927(N928·AA929) SupplierNotaDetail@935(N936·N937 detailCard rows) SupplierDetail@943(N944·AA947) — **Supplier→Pemasok**. SeedCustomerList@909(N910·AA911) SeedSaldoAwal@917(N918·I919·H920·O921·H922·AA924) — **Seed→Saldo Awal, customer→pelanggan, Outstanding→Titipan**. Method tight-read(contiguous)+verify assembled = bersih, no gremlin.
**Batch 12 — Outstanding/AssetStock/DeliveryInvoice/ReorderCustomer DONE (verified):** CustomerOutstanding@876 (customerOutstandingList AB879·AC879·AD879·AE879·AG879·AH879 — Outstanding→Titipan, Customer→Pelanggan, doctrine simplify) · AssetStock@884 (assetStockList N887 pivotValues Mobil→Kendaraan/Customer→Pelanggan · Y887·Z887 Aset→Barang · AB887 condNote de-jargon · I888·J888 noticeBar Outstanding→Titipan) · DeliveryInvoiceList@961 (M962 admin-layout·W963·AA963 Invoice→Nota) · DeliveryInvoice@968 (M969·H970·I971 receiptDoc title·AC971 Invoice→Nota/Customer→Pelanggan) · ReorderCustomer@1311 (N1312 Follow-up→Tindak Lanjut). Semua verified assembled.

## ✅ SWEEP SUBSTANSIAL SELESAI (~30 page, semua verified)
Glossary final (Vehicle→**Kendaraan**, Customer→**Pelanggan**, Task→**Tugas**, Item→**Barang**, Qty→**Jumlah**, Walk-in→**Kasir**, Movement→**Mutasi Stok**, Outstanding→**Titipan**, Seed→**Saldo Awal**, Invoice→**Nota**, Reorder→**Order Ulang**, Assign→**Tugaskan**, Supplier→**Pemasok**, Audit→**Lihat**, Review→**Cek**, Aset→**Barang**, Follow-up→**Tindak Lanjut**, Opening/Closing Check→**Cek Berangkat/Cek Pulang**, Pengemudi→**Sopir**; DITAHAN: Supervisor, driver). Rule: `="..."`, ◆-count tetep, verify assembled, 2 gotcha (kolom [ICON]-shift + workspaceHeader M-vs-N layout).
**Batch 13 — RESIDUAL DONE (verified):** ReorderRadar@1305 (N1306 Radar Reorder→Order Ulang · S1308 signalList Follow up→Tindak Lanjut/Radar Order Ulang) · ReorderCustomer@1311 (N1312 Follow-up→Tindak Lanjut · O1320 dialog "Cadence di-override. Sinyal re-derive."→"Ritme diubah. Sinyal dihitung ulang." · G1317 btn→Tindak Lanjut) · **WalkInHistory@836 wsHeader FIX**: D837 ternyata **baked LITERAL** (N837 stale/unused — ITU penyebab "gremlin"! bukan drift) → overwrite D837 literal `="{...text:Kasir◆Transaksi & riwayat}"` → verified B836 "Kasir". **Pelajaran: kalau helper N≠assembled text, D-nya baked literal → edit D langsung.**
### Batch 14 — BAKED→PARAMETERIZE AUDIT (2026-08-07)
Scan formula col D (grid `include_grid_data`, grep `userEnteredValue.stringValue:"{` = raw-baked; `formulaValue:"="{` = formula-literal baked; `=SUBSTITUTE/VLOOKUP` = param). Galon 609–1345: cuma 4 baked, semua **di-parameterize + verified byte-identik**:
- **D817** WalkIn wsHeader → `workspaceHeader` template (SUBSTITUTE, helper G-N). Tadinya raw-baked yg diam-diam nge-BLOCK humanize (N817 unused → app nampil "Walk-in · Counter"). +bug: backRoute helper M817 stale "AdminHome" vs baked "WalkInHistory" → dibetulin.
- **D837** WalkInHistory wsHeader → `workspaceHeader` (fix N837 stale "Riwayat Transaksi◆Walk-in" → "Kasir◆Transaksi & riwayat").
- **D687** Delivery fail-btn → `rbtCta` (D632 pola: [TEXT]G·[ROUTE]H).
- **D838** WalkInHistory btn → `rbtCtaFull` (D945 pola: [TEXTCOLOR]J·[TEXT]G·[ROUTE]H·[COLOR]I·[WIDTH]K; B838 diubah rbtCta→rbtCtaFull).
**Pelajaran:** baked D bisa diam-diam nge-block edit helper (humanize silent-fail) — cek baked via formula-scan. Sisa baked = TitikPatroli wsHeader (patrol vertical, luar scope).

**TRULY SISA (non-visible/teknis, sengaja biar):** PRN print-status "Cetak Invoice" (teknis, jarang kebaca) · WA messageTemplate (customer-facing, formal OK) · internal addToEvent `d◼`/`ttl◼` event-log fields (non-visible) · beberapa savesend dialog generik ("Terkirim" dst). Service AC / Patroli / Reward / Approval / Incident = SENGAJA di luar scope (vertikal lain). **SWEEP GALON 100% VISIBLE-TEXT DONE (~32 page).**
**⚠️ GOTCHA kolom [ICON]:** widget yg punya param `icon`/`iconReady`/`iconLocked` (INVENTORY_BUCKET_CARD, NAV_ACTION_CARD, DRIVER_STOP_CARD) geser kolom text. Text INVENTORY_BUCKET_CARD di **O** (bukan N=icon), NAV_ACTION_CARD di **P** (N=icon, O=iconReady). Batch 2 sempet salah tulis N622/N624→icon; udah dibetulin (verify via D-col `"text":`, JANGAN cuma hitung kolom). noticeBar simpel/header/list gak kena.
GAK diubah (di luar scope audit): submit-button dialog, cluster Jual/Beli/Refill explainer (customer/operator/pickup/Kepemilikan), role app-wide. Proxy `18v3w5YJ` sudah ditulis; mirror ke sheet prod manual.

<details><summary>Arsip aturan Batch (historis)</summary>
**Wording SSOT:** `docs/driver-copy-humanize-audit.md` (glosarium + per-page current→usul). **IKUTI ITU.**

### Aturan WAJIB (jangan langgar)
1. **Jumlah ◆-segmen HARUS tetep** (renderer baca by index). Cuma ganti isi, jangan tambah/kurangin ◆.
2. **`returnable`/`consumable` JANGAN diubah** (keputusan user).
3. Tulis cell `=`-form: `="teks"`. Unicode: ◆=`◆` · `·`=`·`.

### Cara nemu cell teks (per widget)
- Baca child rows page: `get_sheet_data` range `A{header+1}:{col}` (FORMATTED, bukan grid — grid kegedean).
- Teks (`◆`-string) ada di **helper col** (kolom setelah param). Edit cell itu → verify `D{row}` resolve.
- Kalo widget **gak punya helper** (G+ kosong, mis. `rbtCta` baked) → teks inline di **D**, edit D langsung (literal JSON).
- Verify: baca `D{row}` (harus keganti) + `B{header}` (assembled, harus kebawa). E-spill/arrayformula auto-update dari D.

### Row header tiap page driver
`DriverScanLogin@609 · DriverHome@617 · CustodyNotification@626 · CustodyCount@635 · CustodyReveal@645 · CustodySuccess@652 · MismatchReport@660 · MismatchSubmitted@669 · TaskFeed@676 · DeliveryWorkspace@681 · ReturnVehicle@691 · RejectTask@698 · FailedDelivery@705`
(⚠️ sync bisa geser row — verify by page-route di col A dulu.)

### UDAH DIKERJAIN (Batch 1)
| Page | Cell diubah |
|---|---|
| CustodyCount | G637, H638, L643 |
| CustodyReveal | G646, H648, U649 |
| CustodyNotification | J628, K628, L628, Q629, V630, S631, G632 |
| DeliveryWorkspace | N682 (header), D687 (tombol gagal, baked) |

### SISA (kerjaan lo)
1. **DeliveryWorkspace `itemExecution`** (row 683) — teks 27-segmen. Ganti: "Catat aktual · default = rencana, sesuaikan kalau beda"→"Isi jumlah asli · udah keisi sesuai order, ubah kalau beda"; "Drop"→"Antar"; "Pickup"→"Ambil"; "Partial · <kurang> kurang"→"Kurang <kurang>"; "Opportunistic · <value>"→"Lebih <value>". **KEEP** Returnable/Consumable + segmen `<kurang>`/`<value>`/`<extra>` (token). Cell = helper terakhir row 683 (cari kolom yang isinya "Catat aktual...").
2. **Batch 2** (9 page): DriverScanLogin, DriverHome, CustodySuccess, MismatchReport, MismatchSubmitted, TaskFeed, ReturnVehicle, RejectTask, FailedDelivery — semua di `driver-copy-humanize-audit.md`.
3. Tiap page: verify `B{header}` resolve bersih + refresh app.
4. Report cell berubah (tabel Sheet!Cell) buat migrasi prod (konvensi user).
</details>

---

## #3 — Failed trackable: DONE ✅ (2026-08-07, config-only, NOL widget baru)
Viewer reuse `ITEM_CARD_DETAIL` (`displayItemCardDetail`, Widget ~179). Yg dibangun:
1. **Page baru `vertikaTeknoLokaciptaFailedTaskDetail`** @op1Screen row **1337** (Plug row 166): WORKSPACE_HEADER(search `tnm◼{taskVid}`, back→AdminTaskList) + NOTICE_BAR danger + ITEM_CARD_DETAIL(table `84214220504259//evidence`, search `ept◼task⭘erf◼{taskVid}`, content `d`, reason `ec`, status `ety`, image `i`). Token `{taskVid}` = routeParam AdminTaskList.
2. **AdminTaskList** (route `vertikaTeknoLokaciptaAdminTaskList`, listCardGrouped row 1179) — `groupRoutes` (cell **AB1179**) +`★failed◼vertikaTeknoLokaciptaFailedTaskDetail` (grup Gagal jadi tappable; 3 entri lama utuh; routeParams `taskVid◼{tnm}` udah ada).
3. **FailedDelivery** (@705) — +`getImages1`@**710** pos3 (sendButton digeser 710→711, window E705 tetep) + addToEvent `+i◼◁3▷` → foto kerekam ke evidence field `i`. Task gagal LAMA tetep tanpa foto (cuma alasan+catatan); yg BARU bawa foto.
Verified assembled JSON valid semua. Watch: ITEM_CARD_DETAIL resolve `"content":"d "` (spasi ekor = bawaan template, LIVE di incident-detail juga → renderer toleransi; cek pas refresh). Proxy ditulis; mirror prod manual.

<details><summary>Arsip desain awal (historis)</summary>
**Keputusan:** JANGAN pake movement (movement = ledger stok, bakal gerakin asset_cache — user khawatir, bener). Failed goods udah ke-account pas closing (closeunload). Failed EVENT udah kecatat di **evidence** (FailedDelivery@705 submit: `addToEvent evidence` ety◼notes/photo, ept◼task, ec◼{alasan}, d◼{catatan}).

**Yang kurang:** pas admin tap task gagal, alasan+foto belum keliatan. **Solusi = enhance task-detail (BUKAN page baru):** tambah panel evidence yang baca `evidence` search `ept◼task⭘erf◼{tnm}` (atau `erf◼{taskVid}`) → nampil alasan (`ec`/`d`) + foto (`i`). Reuse widget list/evidence yang ada (cek `RECEIPT_DOC`/`LIST_CARD`/evidence-viewer).
**TODO:** (a) cari page task-detail admin (route mana yg dipake AdminTaskList/coordination buat liat 1 task), (b) tambah panel evidence di situ, (c) failed task udah muncul di AdminTaskList grup "Gagal" (`tst◼failed`) — cukup, gak perlu list baru.
</details>
_(Resolusi: admin task-detail BELUM ada — grup Gagal read-only → dibikin page baru FailedTaskDetail, lihat atas.)_

---

## Related open (konteks, bukan bagian 3-case)
- CF deploy pending: `OnTaskWrite` (reject-clear-vv `eb3f923` + konsolidasi + tdt-stamp) + `onMovementCreated`/reconcile (#1 `3e74253`). Devops.
- Admin-edit-order strict-mode: SHELF spec `docs/admin-edit-order-qty-dev-spec.md` (CF-REVIEW applied), bangun pas ada permintaan.
- Stuck check `wsiCmao6FPouGsTJFYDd` (reject-multi-trip) — clear cst=cancelled manual pasca-deploy.

**Referensi:** `docs/driver-copy-humanize-audit.md` (wording) · `docs/outstanding-aging-asset-cache-t-cf-dev-spec.md` · memory `project_driver_return_pindah_fixes` · `feedback_report_changed_cells`.
