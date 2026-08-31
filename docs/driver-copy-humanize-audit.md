# Audit Teks Driver — Manusiawi buat Driver Gaptek

**Tanggal:** 2026-08-06
**Tujuan:** ganti istilah teknis/English jadi bahasa sehari-hari. User: yang pake aplikasi = driver gaptek teknologi.
**Scope:** SEMUA page driver-facing (13). **`returnable`/`consumable` DIKECUALIKAN** (user: gak perlu diubah).
**Cara apply:** config murni (edit `text` ◆-segmen di helper/D cell). Nol dev. Per-page, verify tiap resolve.

---

## Glosarium (musuh berulang — ganti di semua page)
| Sekarang | Manusiawi |
|---|---|
| warehouse | gudang |
| custody / custody event | cek barang / (buang) |
| manifest | daftar antar |
| discrepancy | selisih |
| circulation | barang keluar-masuk |
| reschedule | atur ulang |
| reconciliation | (buang / "dicek gudang") |
| Driver Runtime | aplikasi driver |
| device | HP |
| flag | penanda |
| report (kt kerja) | catat / laporin |
| Match / Lost | Cocok / Hilang |
| eksekusi | antar / kerja |
| Vehicle | Mobil |
| Drop / Pickup | Antar / Ambil |
| load | muat / barang |
| Anda | kamu |

---

## Per-page (notice bar + label)

**DriverScanLogin (609)**
- NOTICE: "Device ini bisa jadi bukan punya anda…" → "HP ini bisa jadi bukan punyamu (HP kantor/admin/temen). Identitasmu ada di kartu, bukan di HP ini."
- scanner: "buka sesi Driver Runtime" → "masuk aplikasi driver"

**DriverHome (617)**
- "Konfirmasi Penerimaan Muatan" → "Cek Barang Dulu"; "hitung mandiri" → "hitung sendiri"
- "Ada selisih dari catatan gudang" → "Jumlahnya beda sama catatan gudang"; "Supervisor lagi review" → "Supervisor lagi cek"
- "Update otomatis tiap serah-terima" → "Update otomatis tiap antar/ambil"
- "Return Kendaraan / Balik & serahkan kendaraan + sisa muatan" → "Balikin Mobil / Balik & serahin mobil + sisa barang ke gudang"

**CustodyNotification (626)**
- NOTICE: "KONFIRMASI DIPERLUKAN" → "PERLU DICEK DULU"; "Vehicle siap berangkat, butuh konfirmasi penerimaan" → "Mobil siap jalan, cek barangnya dulu"; "Anda belum bisa mulai task… sebelum konfirmasi load dari warehouse" → "Belum bisa mulai kerja sebelum cek & setuju barang dari gudang"
- "Penerimaan Muatan / Waktu loading / Custody event" → "Terima Barang / Jam muat / (buang)"
- "Task Manifest" → "Daftar Antar"; "Total Circulation / Sirkulasi barang hari ini per tujuan" → "Total Barang / Barang keluar-masuk hari ini per customer"
- tombol "MULAI KONFIRMASI PENERIMAAN" → "MULAI CEK BARANG"

**CustodyCount (635)**
- "KONFIRMASI PENERIMAAN · STEP 1/2" → "CEK BARANG · Langkah 1/2"
- "Hitung independen · angka warehouse belum diperlihatkan" → "Hitung sendiri dulu · jumlah gudang disembunyiin"
- "Lihat Catatan Warehouse" → "Lihat Catatan Gudang"

**CustodyReveal (645)**
- "KONFIRMASI PENERIMAAN · STEP 2/2" → "CEK BARANG · Langkah 2/2"
- "Verifikasi hitungan vs catatan warehouse" → "Cocokin hitunganmu sama catatan gudang"
- "warehouse / hitungan lo / Match" → "gudang / hitunganmu / Cocok"
- "Konfirmasi Load · Siap Berangkat" → "Barang Cocok · Berangkat"; "Lanjut · Report Mismatch" → "Lanjut · Lapor Selisih"

**CustodySuccess (652)**
- header "CUSTODY CONFIRMED" → "BARANG SUDAH DICEK"
- NOTICE: "✓ Konfirmasi Tercatat — custody event sudah confirmed. Vehicle ditandai siap berangkat." → "✓ Sudah tercatat — barang sudah dicek. Mobil siap jalan."
- "Mulai eksekusi task hari ini, dimulai dari stop 1" → "Mulai antar hari ini, dari tujuan pertama"

**MismatchReport (660)**
- "Report Mismatch · Custody Discrepancy" → "Lapor Selisih Barang"
- NOTICE: "Penting - submit ketidaksesuaian dengan catatan warehouse. Ini bukan judgement siapa yang salah; Supervisor yang investigasi." → "Laporin kalau jumlahnya beda sama catatan gudang. Ini bukan nyari siapa yang salah — Supervisor yang bakal cek."
- "Warehouse / Anda Hitung" → "Gudang / Hitunganmu"

**MismatchSubmitted (669)**
- NOTICE: "✓ Siap Berangkat — dengan Catatan Selisih. dikonfirmasi pakai jumlah aktual yang anda hitung; selisih + foto dikirim ke Supervisor." → "✓ Siap Jalan — dengan catatan selisih. Dipakai jumlah hasil hitunganmu; selisih + foto dikirim ke Supervisor."
- TXT: "Apa yang terjadi: (1) Anda lanjut kerja, (2) selisih masuk antrian Supervisor, (3) Supervisor bisa kontak. Discrepancy ≠ Lost." → "Yang terjadi: (1) kamu lanjut kerja, (2) selisih masuk antrian Supervisor, (3) Supervisor bisa hubungi kamu. Selisih ≠ Hilang."
- NOTICE: "Selisih itu flag, bukan kesimpulan. Tugas anda report akurat & jalan" → "Selisih itu penanda, bukan kesimpulan. Tugasmu: catat jujur & lanjut kerja."

**TaskFeed (676)**
- "Drop/Pickup" → "Antar/Ambil"; "Mulai Eksekusi" → "Mulai Antar"
- "Semua Stop Selesai · Anda bisa kembali ke gudang untuk closing check · Kembali ke Gudang" → "Semua Tujuan Selesai · Balik ke gudang buat serah barang · Balik ke Gudang"

**DeliveryWorkspace (681)**
- "Catat aktual · default = rencana, sesuaikan kalau beda" → "Isi jumlah asli · udah keisi sesuai order, ubah kalau beda"
- "Partial · <kurang> kurang / Opportunistic · <value>" → "Kurang <kurang> / Lebih <value>"
- "Drop/Pickup" → "Antar/Ambil"; "Tidak bisa dieksekusi · Lapor sebagai gagal" → "Gak bisa dikirim · Lapor Gagal"

**ReturnVehicle (691)**
- "Akhir Hari · Return Kendaraan" → "Akhir Hari · Balikin Mobil"
- "Gudang yang hitung & validasi (reconciliation = domain Vehicle Runtime)" → "Gudang yang hitung & cek."
- "Setelah gudang konfirmasi return, sesi anda otomatis ketutup (logout terminal)" → "Setelah gudang terima, kamu otomatis keluar."
- "Total Circulation" → "Total Barang"

**RejectTask (698)**
- "Tolak Task · Tidak Searah" → "Tolak · Gak Searah"
- "dikembalikan ke Admin buat di-assign ke mobil lain" → "dibalikin ke Admin buat dikasih ke mobil lain"

**FailedDelivery (705)**
- "Lapor Delivery Gagal · Tidak Bisa Dieksekusi" → "Lapor Gagal Kirim"
- "dikembalikan ke Admin buat reschedule" → "dibalikin ke Admin buat diatur ulang"

---

## Apply plan
Per-page, config (edit `text` ◆-segmen). Batch 1 = 4 page tersering dipake driver: **CustodyNotification, CustodyCount, CustodyReveal, DeliveryWorkspace**. Verify resolve tiap page. Lanjut sisa. Jumlah ◆-segmen HARUS tetep sama (renderer baca by index) — cuma ganti isi, jangan tambah/kurangin ◆.
