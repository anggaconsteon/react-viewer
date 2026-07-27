# Dokumentasi Widget

Kumpulan dokumentasi widget aplikasi — 1 widget = 1 file. Ditulis buat semua orang (bukan cuma dev): apa gunanya, seperti apa tampilannya, dan field apa saja yang bisa diatur dari sheet.

## Glossary — simbol yang dipakai di config

Config widget ditulis sebagai teks dengan simbol pemisah khusus. Artinya selalu sama di semua widget:

| Simbol | Nama | Artinya |
|---|---|---|
| `◆` | pemisah segmen | Memisahkan bagian-bagian dalam 1 field gabungan (posisi tiap segmen FIXED — lihat tabel posisi di doc widget-nya) |
| `◼` | pasangan | Menghubungkan kunci dengan nilai: `st◼review` = "field st = review" |
| `★` | daftar | Memisahkan item dalam daftar: `a◼1★b◼2` = dua item |
| `⭘` | dan / antar-bagian | Menyambung beberapa pasangan dalam satu perintah tulis |
| `◁N▷` | input form | Nilai diambil dari isian user di posisi N pada halaman (misal isi popup) |
| `◀N▶` | nilai sistem | Nilai otomatis dari sistem (misal `◀2▶` = tanggal-jam saat kirim) |
| `{field}` | nilai dari data | Diganti nilai field dari dokumen/baris data yang sedang diproses — nama di dalam `{}` = nama field persis di database |
| `<field>` | template teks | Di field tampilan (title/subtitle): diganti isi field dokumen, boleh dicampur teks biasa |

## Field umum (ada di hampir semua widget)

| Field | Artinya |
|---|---|
| `vidtable` | ID koneksi data tenant — nilainya sama untuk semua widget dalam satu app, jangan diubah-ubah |
| `table` | Alamat tabel/koleksi data yang dibaca widget |
| `search` | Filter data: `field◼nilai` (cocok persis). Bisa digabung beberapa syarat dengan `⭘` |
| `text` | Semua label/tulisan widget, dipisah `◆` — ganti kata-kata cukup edit di sheet, tanpa update aplikasi |

## Index

| Widget | Type | Buat apa | Status |
|---|---|---|---|
| [`lqrTextField2`](lqrTextField2.md) | txf `qrScan` | Field isi lewat scan QR lokasi (+ penjaga GPS palsu / luar area) | LIVE |
| [`sendButtonGpsAddTable2`](sendButtonGpsAddTable2.md) | RBT | Tombol kirim + rekam GPS + tulis 1 baris tabel (varian anti-curang) | LIVE |
| [`locationDetector`](locationDetector.md) | LOCATION_DETECTOR | Kotak status lokasi: di dalam/luar area + akurasi GPS + peta/refresh | Cek dev (draft) |
| [`progressBar`](progressBar.md) | PROGRESS_BAR | Bar kemajuan (persen / jumlah selesai) | Cek dev (draft) |
| [`tasklist`](tasklist.md) | TASKLIST | Daftar tugas/pilihan tercentang dalam 1 kategori → 1 slot form | Cek dev (draft) |
| [`timePresence`](timePresence.md) | TIME_PRESENCE | Kartu jam & kehadiran (live time, check-in, aksi terakhir) | Cek dev (draft) |
| [`choiceButtonGroup`](choiceButtonGroup.md) | CHOICE_BUTTON_GROUP | Kelompok tombol status (Aman/Perhatian/Masalah) + aksi berantai | ⚠ Prototype — cek dev |
| [`SendButtonUpdate`](SendButtonUpdate.md) | RBT | Tombol kirim + ubah baris data (updateTableRow) + GPS | LIVE |
| [`sendApprovalButton`](sendApprovalButton.md) | RBT | Dua tombol setuju (hijau) / tolak (merah), masing-masing ubah baris | LIVE |
| [`deleteButton`](deleteButton.md) | RBT | Tombol hapus baris tabel (+ opsi catat jejak) | LIVE |
| [`displayListItemCard`](displayListItemCard.md) | LIST_ITEM_CARD | Daftar kartu satu-route + tombol aksi per kartu (versi kini) | LIVE |
| [`workerCardDetail`](workerCardDetail.md) | WORKER_CARD_DETAIL | Kartu detail 1 pekerja (baca tabel keyed workforce) buat koreksi kehadiran | Config siap — baca keyed pending |
| [`displayItemCardDetail`](displayItemCardDetail.md) | ITEM_CARD_DETAIL | Kartu detail 1 item/laporan (konten/alasan/status/gambar) | LIVE |
| [`timeline`](timeline.md) | TIMELINE | Garis waktu kejadian dari koleksi data (dasar; varian aktif = periodic/ledger) | Cek dev |
| [`txfWithSendButton`](txfWithSendButton.md) | txf `commentBox` | Kolom komentar + tombol kirim menempel + lampiran | LIVE |
| [`approvalButton`](approvalButton.md) | RBT | Dua tombol aksi gaya `actions`/`event` + dialog "Terkirim" | LIVE |
| [`selectableVertical`](selectableVertical.md) | SELECTABLE_BTN `vertical` | Picker tombol tersusun ke bawah, pilih satu | LIVE |
| [`selectableGrid`](selectableGrid.md) | SELECTABLE_BTN `grid` | Picker tombol kotak-kotak (maxGrid kolom), pilih satu | LIVE |
| [`displayListItemCardWithoutButton`](displayListItemCardWithoutButton.md) | LIST_ITEM_CARD | Daftar kartu tanpa tombol aksi (tap → detail) | LIVE |
| [`workflowButtonTriage`](workflowButtonTriage.md) | RBT | 3 tombol triase laporan (Kembalikan/Terima/Assign), gate MENUNGGU | LIVE |
| [`workflowButtonHandle`](workflowButtonHandle.md) | RBT | 2 tombol tangani laporan (Re-assign/Selesai), gate DITINJAU | LIVE |
| [`workflowButtonDialog`](workflowButtonDialog.md) | RBT | 1 tombol aksi + dialog konfirmasi (sticky, gerbang tampil) | LIVE |
| [`workflowButtonSheet`](workflowButtonSheet.md) | RBT | 1 tombol aksi + form bottom-sheet (keterangan + hasil) | LIVE |
| [`textSearch`](textSearch.md) | TXT | Teks statis yang muncul hanya kalau kondisi `search` cocok | LIVE |
| [`stepper`](stepper.md) | STEPPER | Input angka `[−]`/`[+]` (4 varian: counter/satuan/tahan-cepat/ringkas) | LIVE |
| [`sendButtonGpsWithEvent`](sendButtonGpsWithEvent.md) | RBT | Tombol kirim + GPS + tulis tabel/event (serba-guna) | LIVE · ⚠ no spec |
| [`listMultiplePanelCard`](listMultiplePanelCard.md) | LIST_MULTIPLE_PANEL_CARD | Kartu daftar + 1 panel navigasi berstatus | LIVE |
| [`listMultiplePanelCard2`](listMultiplePanelCard2.md) | LIST_MULTIPLE_PANEL_CARD | Kartu daftar + 2 panel navigasi berstatus | LIVE |
| [`displayStatisticCard`](displayStatisticCard.md) | LIST_STATISTIC_CARD | Kartu daftar + statistik agregat computed + badge status | LIVE |
| [`timelinePeriodic`](timelinePeriodic.md) | TIMELINE | Garis waktu kejadian + pemilih periode (7h/30h/bulan) | LIVE |
| [`displayAttendanceCard`](displayAttendanceCard.md) | LIST_STATISTIC_CARD `keyed` | Preset kehadiran: daftar pekerja hari ini + hadir/belum-scan | Config siap — baca keyed pending |
| [`attendanceCorrectionSheet`](attendanceCorrectionSheet.md) | RBT | Tombol koreksi jam kehadiran (form + tulis workforce & event) | Config siap — tulis keyed pending |
| [`scanner`](scanner.md) | scanner | Scan QR ramping (QR + foto), sibling `location` | LIVE |
| [`noticeBar`](noticeBar.md) | NOTICE_BAR | Banner 1 baris berwarna sesuai nada (ok/warn/danger) | LIVE |
| [`routeProgressHeader`](routeProgressHeader.md) | ROUTE_PROGRESS_HEADER | Header driver: nama + plat kendaraan + progress rute + logout | LIVE |
| [`preconditionGateCard`](preconditionGateCard.md) | PRECONDITION_GATE_CARD | Kartu gerbang prasyarat + daftar muatan custody | LIVE |
| [`inventoryBucketCard`](inventoryBucketCard.md) | INVENTORY_BUCKET_CARD | Ringkasan stok/muatan per kategori (bucket) | LIVE |
| [`driverStopCard`](driverStopCard.md) | DRIVER_STOP_CARD | Kartu titik antar rute (nama/alamat + navigasi + tolak) | LIVE |
| [`navActionCard`](navActionCard.md) | NAV_ACTION_CARD | Kartu tombol aksi bergerbang (siap/belum berdasar prasyarat) | LIVE |
| [`noticeBar2`](noticeBar2.md) | NOTICE_BAR | Banner bertingkat (label + judul + teks) + perataan ikon | LIVE |
| [`vehicleCustodyHeader`](vehicleCustodyHeader.md) | VEHICLE_CUSTODY_HEADER | Header custody kendaraan (plat + pemuat + waktu muat) | LIVE |
| [`taskManifestList`](taskManifestList.md) | TASK_MANIFEST_LIST | Daftar manifest tugas rute (drop/pickup per item) | LIVE |
| [`circulationSummary`](circulationSummary.md) | CIRCULATION_SUMMARY | Ringkasan total sirkulasi barang (drop/pickup/jual/isi/beli) | LIVE |
| [`custodyCountList`](custodyCountList.md) | CUSTODY_COUNT_LIST | Daftar hitung custody (mode buta) → simpan hasil | LIVE |
| [`rbtCta`](rbtCta.md) | RBT | Tombol pindah halaman paling ringkas (label + route) | LIVE · ⚠ no spec |
| [`custodyStepHeader`](custodyStepHeader.md) | CUSTODY_STEP_HEADER | Header langkah custody (plat + nama driver) | LIVE |
| [`custodyReveal`](custodyReveal.md) | CUSTODY_REVEAL | Buka selisih hitung custody (harapan vs hitung → 3 jalur) | LIVE |
| [`custodyCountSubmit`](custodyCountSubmit.md) | CUSTODY_COUNT_SUBMIT | Tombol simpan hasil hitung custody → reveal | LIVE |
| [`custodyConfirmedList`](custodyConfirmedList.md) | CUSTODY_CONFIRMED_LIST | Daftar custody yang sudah cocok | LIVE |
| [`custodyDiscrepancyList`](custodyDiscrepancyList.md) | CUSTODY_DISCREPANCY_LIST | Daftar custody yang ada selisih | LIVE |
| [`custodyEventSubmit`](custodyEventSubmit.md) | CUSTODY_EVENT_SUBMIT | Tombol lapor selisih custody + gerbang catatan & foto | LIVE |
| [`routeProgressHeaderFull`](routeProgressHeaderFull.md) | ROUTE_PROGRESS_HEADER `full` | Header driver lengkap + ringkasan stop/gagal/drop/pickup | LIVE |
| [`returnSubmitButton`](returnSubmitButton.md) | RBT | Tombol submit kembali kendaraan (catat + dialog) | LIVE |
| [`itemExecutionList`](itemExecutionList.md) | ITEM_EXECUTION_LIST | Daftar eksekusi item (rencana vs aktual drop/pickup/jual/beli) | LIVE |
| [`signaturePad`](signaturePad.md) | SIGNATURE_PAD | Area tanda tangan (bukti serah-terima) | LIVE · ⚠ no spec khusus |
| [`submitConfirmSheet`](submitConfirmSheet.md) | SUBMIT_CONFIRM_SHEET | Lembar konfirmasi submit pengiriman (rangkum dari form) | LIVE |
| [`failedDeliverySheet`](failedDeliverySheet.md) | FAILED_DELIVERY_SHEET | Lembar lapor pengiriman gagal (alasan config + catatan) | LIVE |
| [`routeFeedHeader`](routeFeedHeader.md) | ROUTE_FEED_HEADER | Header feed rute (nama/plat + ringkasan drop/pickup) | LIVE |
| [`taskFeedList`](taskFeedList.md) | TASK_FEED_LIST | Daftar tugas rute (grup + drop/pickup + gerbang kembalikan kendaraan) | LIVE |
| [`workspaceHeader`](workspaceHeader.md) | WORKSPACE_HEADER | Header halaman kerja serba-guna (judul + konteks data + back) | LIVE |
| [`evidenceRow`](evidenceRow.md) | EVIDENCE_ROW | Baris tambah catatan + foto bukti | LIVE |
| [`returnHeader`](returnHeader.md) | RETURN_HEADER | Header ringkas halaman kembali kendaraan | LIVE |
| [`vehicleCargoSummary`](vehicleCargoSummary.md) | VEHICLE_CARGO_SUMMARY | Ringkasan sisa muatan kendaraan (isi/kosong per kondisi) | LIVE |
| [`vehicleFeedHeader`](vehicleFeedHeader.md) | VEHICLE_FEED_HEADER | Header feed kendaraan (checker + stasiun + menu) | LIVE |
| [`vehicleFeedList`](vehicleFeedList.md) | VEHICLE_FEED_LIST | Daftar kendaraan untuk dicek (buka/tutup → route) | LIVE |
| [`adminCoordinationHeader`](adminCoordinationHeader.md) | ADMIN_COORDINATION_HEADER | Header koordinasi admin (hitung sinyal dari banyak tabel) | LIVE |
| [`coordinationSignalList`](coordinationSignalList.md) | COORDINATION_SIGNAL_LIST | Daftar sinyal koordinasi admin (tier + aksi + umur warna) | LIVE |
| [`vehiclePicker`](vehiclePicker.md) | VEHICLE_PICKER | Pilih kendaraan untuk ditugaskan (+ hitung task aktif) | LIVE |
| [`taskItemBuilder`](taskItemBuilder.md) | TASK_ITEM_BUILDER | Penyusun item tugas (cari + drop/pickup/jual + outstanding) | LIVE |
| [`noticeBarRoute`](noticeBarRoute.md) | NOTICE_BAR | Banner berwarna + tombol aksi ke halaman | LIVE |
| [`outstandingPanel`](outstandingPanel.md) | OUTSTANDING_PANEL | Panel barang tertinggal di customer (qty + umur warna) | LIVE |
| [`runningTaskList`](runningTaskList.md) | RUNNING_TASK_LIST | Daftar tugas sedang berjalan (+ progress item) | LIVE |
| [`selectableRoute`](selectableRoute.md) | SELECTABLE_BTN | Grid tombol navigasi (tiap tombol ke halaman) | LIVE · ⚠ no spec |
| [`upcomingTaskList`](upcomingTaskList.md) | UPCOMING_TASK_LIST | Daftar tugas akan datang + tombol assign kondisional | LIVE |
| [`executorDesignateCard`](executorDesignateCard.md) | executor_designate_card | Kartu tunjuk pelaksana + penanda sibuk (busy-guard) | LIVE |
| [`closingContextRail`](closingContextRail.md) | closing_context_rail | Rail konteks cek tutup gudang | LIVE |
| [`custodyCountListWarehouse`](custodyCountListWarehouse.md) | CUSTODY_COUNT_LIST | Hitung custody sisi gudang (+ agregat rencana tugas) | LIVE |
| [`custodyCountSubmitOpening`](custodyCountSubmitOpening.md) | CUSTODY_COUNT_SUBMIT | Submit cek buka gudang (catat opening) | LIVE |
| [`custodyCountSubmitClosing`](custodyCountSubmitClosing.md) | CUSTODY_COUNT_SUBMIT | Submit cek tutup gudang (cocok/selisih → investigasi) | LIVE |
| [`itemExecutionListPivot`](itemExecutionListPivot.md) | ITEM_EXECUTION_LIST | Eksekusi item tampilan pivot (slot per item) | LIVE |
| [`taskFeedListFlat`](taskFeedListFlat.md) | TASK_FEED_LIST | Daftar tugas/entitas rata tanpa grup (mis. customer) | LIVE |
| [`pickerList`](pickerList.md) | PICKER_LIST | Daftar pilih generik (+ status/hitung/busy) → capture token | LIVE |
| [`taskManifestListDraft`](taskManifestListDraft.md) | TASK_MANIFEST_LIST | Manifest item dari draft wizard buat-tugas | LIVE |
| [`rbtCta2`](rbtCta2.md) | RBT | Dua tombol navigasi ringkas | LIVE · ⚠ no spec |
| [`contextCard`](contextCard.md) | CONTEXT_CARD | Kartu konteks pilihan wizard (baca draft, carry antar-langkah) | LIVE |
| [`workspaceHeaderStep`](workspaceHeaderStep.md) | WORKSPACE_HEADER | Header wizard + indikator langkah | LIVE |
| [`taskDraftInfo`](taskDraftInfo.md) | TASK_DRAFT_INFO | Info ringkas draft tugas (minimal) | LIVE |
| [`taskDraftInfoCard`](taskDraftInfoCard.md) | TASK_DRAFT_INFO | Kartu info draft tugas (judul + label) | LIVE |
| [`taskCreateSubmit`](taskCreateSubmit.md) | TASK_CREATE_SUBMIT | Tombol final simpan buat-tugas (draft → tugas + nomor) | LIVE |
| [`SendButtonGpsExeConsteonEvent`](SendButtonGpsExeConsteonEvent.md) | RBT | Tombol eksekusi + tulis event + GPS | LIVE · ⚠ no spec |
| [`clock…QrThenSelfie` family](clock-qrThenSelfie-family.md) | location | Absensi masuk/pulang, 16 kombinasi QR/Selfie/GPS (rows 258-274) | LIVE |
| [`printBluetoothKeyed`](printBluetoothKeyed.md) | PRN `keyed` | Cetak struk termal Bluetooth dari 1 dokumen | LIVE |
| [`taskItemBuilderWalkin`](taskItemBuilderWalkin.md) | TASK_ITEM_BUILDER | Penyusun item kasir walk-in (qty + harga) | LIVE |
| [`notaCreateSubmit`](notaCreateSubmit.md) | NOTA_CREATE_SUBMIT | Tombol buat nota kasir walk-in | LIVE |
| [`receiptDoc`](receiptDoc.md) | RECEIPT_DOC | Tampilan struk/nota di layar (kepala + item + total) | LIVE |
| [`timelineLedger`](timelineLedger.md) | TIMELINE `ledger` | Timeline buku besar mutasi (grup + expand) | LIVE |
| [`customerOutstandingList`](customerOutstandingList.md) | CUSTOMER_OUTSTANDING_LIST | Daftar outstanding lintas customer (grup + umur warna) | LIVE |
| [`assetStockList`](assetStockList.md) | ASSET_STOCK_LIST | Sebaran stok per item × lokasi × kondisi (pivot + tab) | LIVE |
| [`workflowBtn`](workflowBtn.md) | RBT | Tombol sticky aksi + tulis tabel + dialog | LIVE · ⚠ no spec khusus |
| [`workflowRouteBtn`](workflowRouteBtn.md) | RBT | Tombol sticky navigasi + routeParams | LIVE · ⚠ no spec khusus |
| [`workflowNoteBtn`](workflowNoteBtn.md) | RBT | Tombol sticky + sheet catatan + tulis tabel | LIVE · ⚠ no spec khusus |
| [`workflowAssignBtn`](workflowAssignBtn.md) | RBT | Tombol sticky + sheet cari & pilih orang + tulis | LIVE · ⚠ no spec khusus |
| [`workflowFormBtn`](workflowFormBtn.md) | RBT | Tombol sticky + sheet catatan + pilihan + tulis | LIVE · ⚠ no spec khusus |
| [`workflowEventBtn`](workflowEventBtn.md) | RBT | Tombol sticky + tulis buku event + dialog | LIVE · ⚠ no spec khusus |
| [`workflowEventNoteBtn`](workflowEventNoteBtn.md) | RBT | Tombol sticky + sheet catatan + tulis buku event | LIVE · ⚠ no spec khusus |
| [`tablePicker`](tablePicker.md) | TABLE_PICKER | Picker dari tabel (single/multi) → slot form | LIVE · ⚠ no spec khusus |
| [`listCard`](listCard.md) | LIST_CARD | Daftar kartu universal (judul/badge/trailing/grup/cari/route) | LIVE |
| [`detailCard`](detailCard.md) | DETAIL_CARD | Kartu detail universal (kolom-nilai + gambar) | LIVE |
| [`rbtCtaFull`](rbtCtaFull.md) | RBT | Tombol CTA lebar (warna & lebar diatur) | LIVE · ⚠ no spec |
| [`supplierItemBuilder`](supplierItemBuilder.md) | TASK_ITEM_BUILDER | Penyusun item transaksi supplier (beli/tukar/jual) | LIVE |
| [`seedItemBuilder`](seedItemBuilder.md) | TASK_ITEM_BUILDER | Penyusun item seed / saldo awal (qty saja) | LIVE |
| [`notaCreateSubmitSupplier`](notaCreateSubmitSupplier.md) | NOTA_CREATE_SUBMIT | Tombol buat nota transaksi supplier | LIVE |
| [`notaCreateSubmitSeed`](notaCreateSubmitSeed.md) | NOTA_CREATE_SUBMIT | Tombol buat nota seed / saldo awal | LIVE |
| [`mapPointPicker`](mapPointPicker.md) | MAP_POINT_PICKER | Field form pilih titik koordinat via GPS / cari / geser peta (anti salah desimal) | Config siap — renderer belum ada |
| [`textVariant`](textVariant.md) | TXT | Teks statis bergaya — `variant:section` (judul bagian) / `variant:history` (timeline dari teks) | LIVE |
| [`whatsappSend`](whatsappSend.md) | WHATSAPP_SEND | Tombol kirim WhatsApp: pesan otomatis dari data, buka WA tinggal Send | LIVE |
| [`sendButtonNotification`](sendButtonNotification.md) | RBT | Tombol kirim pengumuman: simpan event + kirim notifikasi push ke target | LIVE |
| [`groupPicker`](groupPicker.md) | GROUP_PICKER | Picker universal ber-tab level (CC/Site/Orang), sumber static/doc/table | LIVE |
| [`routeBtn`](routeBtn.md) | RBT | Tombol pindah halaman polos (sticky bisa diatur, bisa bawa routeParams) | LIVE |
| [`sharePdfKeyed`](sharePdfKeyed.md) | PRN `share-pdf` | Tombol bagikan data sebagai PDF (stiker QR / grid semua QR) via share sheet | LIVE — polish layout pending |
| `getImagesGallery` | GET_IMAGES | Variant `getImages1` dengan sumber galeri foto (`source:"gallery"` baked) — tidak ada file sendiri, beda cuma 1 field dari induknya | Config LIVE — dukungan `source:"gallery"` di renderer pending (spec `docs/getimages-gallery-source-dev-spec.md`) |
| [`statCardRow`](statCardRow.md) | STAT_CARD_ROW | Deretan kartu angka ringkas satu baris (statistik yang sudah dihitung sistem) | Config siap — renderer belum ada |
| [`payoutList`](payoutList.md) | PAYOUT_LIST | Daftar centang ber-nominal buat tandai lunas (count × rate + total) | Config siap — renderer belum ada |
| [`listActionCard`](listActionCard.md) | LIST_ACTION_CARD | Daftar kartu antrian dengan tombol Approve/Reject langsung di tiap baris | Config siap — renderer belum ada |
