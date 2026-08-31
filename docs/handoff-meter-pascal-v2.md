# Handoff: Pencatatan Meter Air — Paskal Hypersquare

**Status: rancangan mengeras, tiga layar sudah diprototipekan · direvisi setelah telepon dengan Paskal 18 Agustus 2026 · survei lapangan batal, sisa pertanyaan di bagian 2 masih terbuka**

> Vertikal baru di atas AUTSORZ. Dokumen terkait: `AUTSORZ_spesifikasi_work_assignment.docx` (§25, §31, §36–39), `AUTSORZ_product_v1_map_rev1_1.docx` (§6 DEFERRED, §8 NEVER), `AUTSORZ_spesifikasi_koreksi.docx`.

---

## 1. Konteks singkat

**Paskal Hypersquare** (Bandung) mengelola kawasan ruko dan menagih air ke tenant-nya. Mereka butuh pencatatan meter air bulanan.

Dua hal yang mengubah peta dibanding vertikal AUTSORZ yang sudah ada:

- **Paskal memakai worker sendiri**, bukan vendor outsourcing. Di model data, **Paskal = vendor sekaligus klien**. Toggle wajah-klien (§24) jadi tidak relevan untuk mereka.
- **Muncul lapisan baru di luar: tenant.** Rantainya bergeser satu lapis — dulu `worker → vendor → klien`, sekarang `worker → pengelola → tenant`. Pola "pihak berdaya-paksa menerima bukti jujur" tetap sama, cuma dipasang lebih jauh.

Fitur ini bukan permintaan liar: **"field measurement" sudah ada di daftar DEFERRED** (§6 peta produk / §39.3), menunggu tarikan nyata. Paskal adalah tarikan itu. §31.3 juga sudah menyiapkan jalannya: tipe item work definition boleh diperluas jadi *field isian/measurement*, dengan label jujur *"diisi petugas, bukan diukur sistem"*.

---

## 2. Fakta lapangan

### Sudah dikonfirmasi owner

- Pelaku = **worker Paskal sendiri** (bukan worker vendor)
- Ritme **bulanan, sekali putaran**
- Hilir = **tagihan air ke tenant ruko**; sengketa tagihan ditangani orang Paskal
- **~400 unit** (rincian di bawah), saat ini **spreadsheet manual** — tidak ada software incumbent (vakum, bukan penggusuran)
- Utilitas yang ditagih: **air (meteran) + service charge/IPL (flat)**. **Tidak ada listrik.**
- Jalur tagihan ke tenant sekarang: **WhatsApp + email**
- Meter **posisi tetap**, bisa ditempeli QR; QR mungkin **beberapa langkah** dari meternya. Akses di Paskal **bagus**. Biasanya **ada ID unik** di meter.
- **Angka terakhir bisa diambil dari spreadsheet** → di-seed ke database/Firebase
- Penilaian owner: kerjaan yang benar-benar berat = **memastikan nomor meternya benar**

### Dikonfirmasi lewat telepon, 18 Agustus (mendahului survei)

- **Sumber air = sumur artesis sendiri**, bukan PDAM. Tidak ada tagihan induk dari luar.
- **Tarif ditetapkan Paskal sendiri** → tarif = config stabil, tanpa tekanan pass-through.
- **DUA SITE, bukan satu**: **Kawasan Ruko ~300 unit, 6 blok, 6 petugas** (satu orang satu blok) + **Paskal Lodge ~100 kamar, 2 petugas**. Total **8 petugas, ~400 unit**.
- **Satu putaran selesai setengah hari sampai sehari.** Enam petugas di Kawasan bukan soal kapasitas (beban cuma ~2 jam per orang) tapi soal **serempak** — supaya panjang periode antar unit setara.
- **Air di Lodge DITAGIH ke penghuni per kamar**, bukan sekadar dipantau internal.
- **Jumlah digit berbeda per site**: Kawasan **5 hitam, merah tidak dicatat**. Lodge **5 hitam + 2 merah** → nilai asli = angka ÷ 100.
- **Nomor seri tidak selalu ada**: meter jadul tidak bernomor, meter baru bernomor.
- **QR berisiko dicopot** karena kawasan area umum.
- **Letak meter**: Kawasan di **carport tiap ruko**, terhalang teras — bukan berderet di satu panel. Lodge **menempel di dinding**.

### Masih terbuka — belum ada jawabannya

*(Direvisi 18 Agu: pertanyaan yang sudah terjawab lewat telepon dipindah ke daftar fakta di atas. Yang tersisa di bawah ini benar-benar belum ada jawabannya.)*

**Yang menentukan risiko terbesar:**

1. **Apakah jumlah digit SERAGAM di tiap site?** Semua meter Kawasan benar 5 hitam? Semua Lodge benar 5+2? Ini menyambung ke risiko nomor 1 — **satu meter yang menyimpang cukup untuk bikin tagihan unit itu meleset 100×**, dan tidak ada pemeriksaan lain yang menangkapnya.
2. **Foto 20–30 meter air apa adanya, dari DUA site** → bahan uji kelayakan OCR. Tanpa ini, OCR tidak boleh diputuskan.
3. **Berapa proporsi meter yang tidak bernomor seri?** Menentukan seberapa besar bagian yang kehilangan pendeteksi "meter diganti".
4. **Nomor seri yang ada — unik se-kawasan, atau nomor pabrik yang bisa kembar antar merek?**

**Yang menentukan kapan bagian tertunda perlu dibangun:**

5. **Seberapa sering kamar Lodge berganti penghuni?** Ini pemicu untuk §7.1 (serah-terima). Sewa bulanan tapi rata-rata tinggal setahun = jarang; kalau tiap 2–3 bulan, gapnya menganga lebih cepat.
6. **Apakah Paskal sekarang membaca meter saat check-out kamar?** Kalau belum, berarti selama ini penghuni baru menanggung pemakaian penghuni lama — kemungkinan **sumber protes yang sudah ada tapi belum pernah terdengar**.

**Yang menentukan detail config & lapangan:**

7. **Apakah meter tetap terjangkau saat ruko tutup atau kamar terkunci?** Kawasan ada di carport (bukan di dalam), tapi apakah ada rolling door / pagar yang menutupnya di luar jam buka? Ini penentu tingkat "tidak bisa dibaca" — dan tingkat itu yang menentukan apakah taksiran jadi kebiasaan atau tetap langka.
8. **Tarif Lodge sama atau beda dengan Kawasan?** Berjenjang atau flat? Pernah berubah berapa kali?
9. **QR di Lodge bisa dipasang di posisi terlindung?** (keputusan: QR hanya di Lodge, dilewati di Kawasan)
10. Siapa yang sekarang **mengetik spreadsheet** — sekutu, atau merasa terancam?

**Bukan pertanyaan ke Paskal, tapi masih menggantung ke owner:** library/design system apa yang dipakai AUTSORZ (Tailwind+shadcn / MUI / Ant / lainnya) — diperlukan kalau tiga komponen mau ditulis ulang mengikuti produk yang sudah jalan.

---

## 3. Posisi produk & batas

### Koreksi atas argumen awal (ditarik sebagian)

Argumen "billing = payroll, jadi di luar produk" **di-overstate**. Payroll ditolak bukan cuma karena rumusnya kacau, tapi karena **vendor sudah punya spreadsheet yang mereka percaya dan tidak akan pindah**. Tarif air kawasan beda: rumusnya sederhana dan stabil, dan Paskal **belum punya sistem apa pun** — ada vakum. Alasan menolak jauh lebih lemah.

### Yang tetap berdiri

Yang berat bukan rumusnya, tapi **siklus hidup invoice**: terbit, koreksi, batal, tunggakan, denda telat, tenant pindah di tengah periode, deposit, bayar sebagian, rekonsiliasi. Itu akuntansi, bukan aritmetika. Rumus tarif selesai sehari; siklus hidup invoice berbulan-bulan dan tidak pernah selesai.

### Pembayaran — pagar keras

**Produk tidak pernah menyentuh dana.** QRIS di-generate **payment gateway berlisensi** (Midtrans/Xendit/sejenis), dana **settle langsung ke rekening Paskal**, produk cuma menerima webhook "lunas" dan mengubah status. Menampung dana orang = wilayah lisensi BI.

Konsekuensi yang harus disadari: begitu tagihan lewat produk, **produk jadi jalur kas Paskal**. Field ops mati sehari = laporan telat; billing mati di tanggal tagih = kas mereka macet. Kelas SLA, support, dan harga semuanya naik.

### Peringatan strategis

Ini kemungkinan **produk kedua, bukan fitur**. Field ops outsourcing dan utility billing kawasan cuma berbagi **satu** komponen: mesin tangkap-fakta. Pembelinya beda (vendor outsourcing vs pengelola properti), pesaingnya beda, cara jualnya beda.

Upside-nya nyata: nilainya nempel ke **arus uang**, jadi jauh lebih gampang dihargai mahal dan jauh lebih lengket daripada field ops per-worker. Tapi jangan menyebutnya "fitur meter" ke diri sendiri — istilah itu bikin ukurannya diremehkan.

---

## 4. Keputusan yang DIKETOK

### Bentuk produk

1. **JANGAN bangun app tenant. Bangun tautan.** Satu tautan per tagihan, dikirim ke WhatsApp (jalur yang sudah dipakai tenant). Buka → angka meter, foto meternya, jam pembacaan, selisih, tagihan → tombol bayar. Nol install, nol login. Tenant buka sebulan sekali; app berarti install + akun + lupa password → adopsi hampir pasti gagal.
2. **Tiga fase berurutan**: (1) pembacaan terbukti → (2) tagihan + tautan bukti → (3) bayar QRIS. Urutannya bukan cuma kehati-hatian tapi **ketergantungan** — fase 2 tidak punya bahan kalau fase 1 gagal di lapangan. Tapi **fase 1 sendirian nilainya tipis** ("spreadsheet-mu jadi bersih"); harga baru naik di fase 2, karena yang membuat tenant berhenti protes adalah bukti yang nempel **di tagihan**, bukan bukti yang rapi di app pengelola.
3. **Satu unit = satu tagihan utuh.** Boleh menerbitkan sebagian di level **putaran** (135 terbit, 79 tertahan); **tidak boleh** memecah tagihan satu unit (IPL terbit, air menyusul) — itu neraka rekonsiliasi.
4. **Daftar meter-yang-diharapkan WAJIB.** Ini pembalikan sadar dari §25 (tangkap-fakta murni tanpa daftar seharusnya): kalau satu unit kelewat, **tagihannya tidak bisa terbit**. Ketidaklengkapan di sini = kegagalan, bukan sekadar sinyal. Pajak input config-nya nol — pengelola pasti sudah punya daftar unit, karena mereka yang menagih.

### Bukti & kejujuran

5. **Foto meter WAJIB**, bukan opsional per config. Beda tingkat bukti yang penting: di cleaning, foto membuktikan worker tiba — bukan ruangan bersih. Di meter, **foto benar-benar memverifikasi ulang angkanya** oleh siapa pun, termasuk tenant yang protes. Ini bukti terkuat yang pernah produk punya.
6. **OCR dibalik arahnya: petugas mengisi, OCR memeriksa.** Kalau OCR mengisi kolom, kolom terisi akan di-tap-lanjut tanpa dibaca (automation bias) — dan hilirnya uang tenant. Dengan arah dibalik: cocok → lolos tanpa suara; beda → baru muncul, dan petugas yang memutuskan. Dua pembacaan independen harus sepakat (kontrol setara double-entry). **Cara rusaknya** yang menentukan: arah ini rusak dengan aman (satu prompt mengganggu), arah sebaliknya rusak dengan berbahaya (tagihan salah terkirim).
7. **OCR jalan on-device, bukan server.** Seluruh nilainya ada di "ketahuan saat petugas masih di depan meter". **Jangan blokir V1** — bangun setelah uji foto lapangan.
8. **Nomor seri meter direkam sekali saat pendataan, lalu cuma DITAMPILKAN untuk dicocokkan mata**
   **8b. Sebagian meter jadul TIDAK punya nomor seri.** Butuh status eksplisit *"meter ini tidak bernomor"* — bukan kolom dikosongkan, karena kosong tidak bisa dibedakan dari "belum diisi". Untuk meter itu, pendeteksi "meter diganti / QR salah tempel" **hilang**, dan tingkat buktinya harus terlihat lebih rendah. Penghiburan: kalau meter jadul itu kelak diganti, meter barunya hampir pasti bernomor — transisi *"dulu tidak ada nomor, sekarang ada"* justru terdeteksi sendiri sebagai penggantian. — tanpa tap konfirmasi. Tap "Ya, cocok" 214 kali berturut-turut adalah refleks, bukan pemeriksaan (argumen yang sama dengan penolakan OCR-mengisi). Label bukti jujur: **"nomor ditampilkan, petugas tidak melaporkan beda"** — bukan "terverifikasi".
9. **QR turun pangkat — dipasang di Lodge saja, dilewati di Kawasan.** *(Direvisi 18 Agu; sebelumnya QR jalur utama di semua site.)* Stiker di area umum bisa dicopot orang, dan sistem yang bertumpu pada benda yang bisa hilang akan keropos pelan-pelan. Yang menyelamatkan: meter Kawasan ada di **carport ruko masing-masing**, jadi "unit mana" hampir tidak ambigu — petugas **melanjutkan urutan keliling, bukan memilih**. Penjaga salah-unit yang sebenarnya adalah **banding riwayat dari seed**: gratis, permanen, tidak bisa dicopot siapa pun. QR = jalur cepat kalau bertahan, **bukan tulang punggung**.
   **9b. Tingkat bukti dibaca RELATIF terhadap config site.** Di Lodge, "dipilih manual" = penurunan bukti (ada QR tapi tidak dipakai). Di Kawasan, tidak ada QR sama sekali → itu bukan penyimpangan dan **tidak boleh ditandai**. Kalau ditandai, semua bacaan Kawasan tampak bermasalah → orang belajar mengabaikan tanda → semua penjaga lain ikut mati.
10. **Taksiran disediakan, tidak dilarang** — dengan syarat keras: **nama penaksir wajib**, **dasar taksiran wajib ditulis**, dan angkanya **tidak pernah muncul sebagai hasil pembacaan** (label "taksiran kantor" sampai ke tautan tenant). Alasannya: kalau produk tidak menyediakannya, taksiran tetap terjadi di spreadsheet **tanpa jejak sama sekali**. Yang dijaga bukan mencegahnya, tapi memastikan ia tidak menyamar.
11. **Tidak ada aksi pengelola yang menimpa angka petugas.** "Terima", "minta baca ulang", "taksiran" — semuanya menambah catatan bertanggal + nama. Fakta terkunci, tafsir di atasnya.
12. **Kejujuran bulan pertama:** kalau angka awal diimpor dari spreadsheet, tagihan pertama = (bacaan terbukti) − (angka spreadsheet tanpa bukti). Cuma separuh terbukti. Paskal harus tahu di depan agar tidak overclaim ke tenant.

### Interaksi lapangan

13. **Kotak digit terkunci**, bentuknya meniru muka meter → petugas **menyalin**, bukan menerjemahkan. Kelebihan/kurang digit jadi mustahil secara bentuk.
14. **Digit merah DIPAKAI di Lodge.** *(Direvisi 18 Agu; sebelumnya diputuskan "merah tidak pernah ditampung" — itu salah.)* Config disimpan sebagai **dua angka: berapa hitam + berapa merah**, BUKAN satu angka "7". Kalau disimpan sebagai "7 digit", **letak komanya hilang**: `0013162` bisa berarti 131,62 atau 13,162 — beda 10×, dan itu langsung jadi tagihan salah 10 kali lipat.
    - Kawasan: **5 hitam, 0 merah** (satuan m³)
    - Lodge: **5 hitam + 2 merah** (nilai asli = angka ÷ 100)
    - **Bahayanya dua arah**: di Kawasan merah ikut tersalin → tagihan **1000× kebesaran**; di Lodge merah lupa disalin → tagihan **100× kekecilan**.
    - Karena itu **bentuk dan warna kotak isian wajib mengikuti meternya per site**, lengkap dengan koma yang terlihat. Ini bukan kosmetik, ini pengaman.
    - Simpan angka sebagai **bilangan bulat mentah** apa adanya seperti tertera di meter; pembagian ke m³ hanya saat ditampilkan. Menghindari galat pembulatan pada angka yang jadi tagihan.
15. **Foto dulu, angka belakangan.** Petugas menyalin dari foto di layar, bukan mendongak ke meter. Keterbacaan foto ketahuan dengan sendirinya karena dia butuh membacanya.
16. **Pemeriksaan jalan saat petugas masih di depan meter** (mundur / lonjakan / beda-dengan-foto). Koreksi di sana = 5 detik; koreksi seminggu kemudian = kirim orang balik, atau ditaksir.
17. **Petugas selalu menang.** "Angkanya memang segitu" menyimpan apa adanya dan cuma menambah tanda. **Satu-satunya pengecualian: pendataan awal** — lihat #21.
18. **"Tidak bisa dibaca" = status kelas satu** dengan alasan wajib dan kalimat pelindung. Bukan kegagalan petugas.
19. **Kamera dibuka sekali.** QR terdeteksi sendiri (0 tap) lalu layar yang sama jadi kamera meter — petugas boleh jalan beberapa langkah dari stiker ke meter. Target: **7 tap per unit, 5 di antaranya digit angka.**
20. **Tidak ada layar kuitansi.** Konfirmasi = banner di layar unit berikutnya (pola centang WhatsApp), berubah oranye + "ditandai" kalau bacaannya bermasalah.

### Pendataan awal (putaran nol)

21. **Seed spreadsheet dipakai sebagai PENJAGA PEMETAAN.** Meter air tidak bisa mundur dan pemakaian sebulan punya rentang wajar — jadi angka yang diketik di lapangan langsung menguji apakah meter itu mungkin milik unit tersebut. **Ini satu-satunya tempat di seluruh sistem yang memblokir**, karena salah petakan berulang tiap bulan dan tidak tertangkap pemeriksaan mana pun.
22. **Tiga tingkat keyakinan pemetaan**: diuji aliran (kuat) · label fisik (sedang) · ikut daftar kantor (lemah). Yang lemah tetap lewat — kalau dilarang, pendataan tidak akan pernah selesai — tapi ditandai, dan komposisinya ditampilkan.
23. **Urutan keliling = turunan dari urutan pendataan.** Jangan pernah bikin layar "susun urutan keliling"; orang kantor tidak tahu jalan kakinya.
24. **Pendataan ADALAH pembacaan** → putaran pertama sudah punya pembanding, tidak telanjang.
25. **Fase meja dulu**: impor daftar unit → cetak QR yang sudah tahu dirinya, **dengan nomor unit tercetak besar** supaya penempel tidak salah tempel.

### Penjadwalan

26. **Tidak ada objek "tugas" di vertikal ini.** Putaran + daftar titik **sudah** merupakan pekerjaannya. Satu lapisan penuh yang tidak perlu dibangun dan tidak perlu diisi orang tiap bulan.
27. **Putaran bulanan = config berulang**, bukan tugas yang dibuat ulang. Yang lahir adalah **harapan** (214 titik berstatus "belum terbaca di periode ini"), bukan baris tugas dan bukan penugasan orang — jadi **tidak melanggar NEVER §8** (auto-generation task / mesin menetapkan assignment).
28. **Pembagian wilayah = keputusan berdiri** (carry-forward §31). *(Direvisi 18 Agu: default-nya BUKAN lagi "tanpa pembagian".)* Paskal sudah bekerja per blok — 2 petugas membagi 6 blok di Kawasan, 2 petugas lagi di Lodge. Jadi **pembagian per blok jadi default untuk Paskal**; "satu daftar bersama" tetap tersedia sebagai bentuk paling sederhana untuk klien lain. Doktrinnya tidak berubah: ditetapkan sekali, berlaku terus, bukan input bulanan.
    **28b. Site = wadah config kelas satu.** Jumlah digit, tarif, petugas, dan ada-tidaknya QR melekat di site, bukan global. Paskal multi-site sejak hari pertama.
29. **Jangan bikin tombol "Buat Putaran September".** Suatu bulan orang lupa menekan → petugas nganggur, tagihan telat.
30. **Jendela baca = harapan, bukan gerbang.** Baca di luar jendela tetap ditangkap apa adanya dengan tanggal aslinya.
31. **Push notification**: gerbangnya secara doktrin **terbuka** (syarat di peta produk: "vertikal ber-cadence-rendah commit" — ini vertikalnya). Tapi **jangan dibangun untuk Paskal**: putaran bulanan itu event terencana, dua petugas, WA sudah cukup. Baru masuk akal untuk pengelola dengan belasan petugas lintas kawasan.

---

## 5. Materi yang sudah jadi

| Berkas | Isi | Status |
| --- | --- | --- |
| `PencatatanMeter.jsx` + `autsorz_meter_v3_preview.html` | Layar petugas, 2 layar / 7 tap, **dua site** (Kawasan 5+0 tanpa QR · Lodge 5+2 dengan QR) | Diuji semua cabang, responsif. Ada pengalih site untuk keperluan prototipe |
| `KokpitPutaran.jsx` + `autsorz_kokpit_putaran.html` | Layar pengelola: tiga tumpukan penghalang tagihan, panel bukti, aksi terima/baca-ulang/taksiran, kunci putaran | Diuji, layout sempit sudah diperbaiki |
| `PendataanMeter.jsx` + `autsorz_pendataan_meter.html` | Putaran nol: penjaga pemetaan, nomor seri, jumlah digit, tingkat keyakinan | Diuji semua cabang |
| `autsorz_meter_petugas.html` | Prototipe awal 5 layar | **Digantikan** versi 2 layar |

Semua komponen: React, **tanpa dependency**, style inline. **Belum mengikuti design system AUTSORZ** — owner menyebut "pakai library standar" tapi belum menyebut yang mana (Tailwind+shadcn / MUI / Ant / lainnya). Perlu ditanya sebelum penulisan ulang.

Kokpit disusun sebagai **daftar penghalang tagihan**, bukan tabel data: angka paling menonjol adalah *"menahan tagihan: 79 unit"*. Tumpukan "Siap" sengaja **tidak menampilkan daftarnya** (monitoring by exception §36.2).

---

## 6. Risiko utama (diranking)

1. **Salah config digit per site.** *(Naik ke peringkat 1 setelah temuan 18 Agu.)* Satu angka salah di config = **semua** tagihan site itu salah 10×, 100×, atau 1000×, konsisten, dan tampak wajar karena semua unit salah dengan arah yang sama. Tidak ada pemeriksaan lain yang menangkapnya — banding riwayat pun ikut salah kalau seed-nya diimpor dengan asumsi digit yang sama.
2. **Pemetaan unit ↔ meter.** *(Turun dari peringkat 1: meter Kawasan ada di carport ruko masing-masing, bukan berderet di panel, jadi ambiguitasnya jauh lebih kecil dari dugaan awal.)* Tetap serius: kesalahan terjadi **sekali di awal**, akibatnya dua tenant salah tagih **tiap bulan**, angkanya tetap masuk akal, dan ketahuannya cuma kalau ada yang protes.
3. **Taksiran menyebar.** Biaya "minta baca ulang" tinggi (petugas sudah pulang) → kantor pelan-pelan lari ke taksiran. **Cara menjaganya ada di lapangan** (pemeriksaan saat petugas masih di depan meter), bukan di kokpit. Kalau angka "perlu ditinjau" tinggi terus, yang rusak lapangannya.
4. **Putaran nol diremehkan.** ~214 unit × (tempel QR + rekam seri + jumlah digit + angka awal) realistis **2–3 hari kerja lapangan**. Harus masuk anggaran onboarding sejak awal.
5. **Ambang lonjakan salah kalibrasi.** Kalau kelewat sensitif, petugas **belajar mengabaikan** peringatan — dan begitu itu terjadi, semua pemeriksaan lain ikut mati. Ambang harus dari kebiasaan tiap unit, bukan angka global. Di kode masih konstanta sementara (`AMBANG_LONJAKAN`).
6. **Tagihan bulan pertama cuma separuh terbukti** (lihat keputusan #12).
7. **Fase 3 menaikkan kelas SLA** — produk jadi jalur kas.

---

## 7. Ditunda dengan sadar

Bagian ini menyimpan keputusan yang **sudah dipikirkan sampai selesai lalu sengaja tidak dibangun**. Tujuannya supaya sesi berikutnya tidak menurunkannya lagi dari nol — dan tidak salah mengira ini belum terpikirkan.

### 7.1 Serah-terima kamar Lodge — DITUNDA (keputusan owner, 18 Agu)

**Keputusan: V1 Lodge = pembacaan bulanan saja, sama persis dengan Kawasan. Nol tambahan di produk.**

Yang sudah diketok tapi tidak dibangun sekarang:

- **Air tetap jalan walau kamar kosong** — bersih-bersih, bocor, pengecekan. Jadi satu bacaan saat check-out **tidak cukup**; serah-terima yang benar butuh **dua bacaan: saat keluar dan saat masuk**.
- **Garis waktu meter terbelah tiga, tiap potongan punya pemilik**: penghuni lama (masuk→keluar) · **pengelola** (periode kosong) · penghuni baru (masuk→seterusnya). Penghuni baru tidak mewarisi apa pun.
- **Bacaan check-out diambil SEBELUM bersih-bersih**, supaya air bersih-bersih jatuh ke periode kosong, bukan ke penghuni lama.
- **Kalau bacaan check-in kelewat, bebannya ke PASKAL — bukan ke penghuni baru.** Alasannya bukan kebaikan hati tapi insentif: pihak yang bisa mencegah datanya hilang harus jadi pihak yang menanggung kalau hilang. Kalau default-nya dibebankan ke penghuni, tidak ada yang berkepentingan menjaga datanya, dan setahun lagi semua kamar punya lubang.
- **Nilai yang ikut tertunda:** pemakaian saat kamar kosong adalah **sinyal bocor paling murni yang bisa didapat** — di kamar berpenghuni, bocor tidak bisa dibedakan dari pemakaian; di kamar kosong tidak ada penyebab yang sah. Dan karena airnya dari sumur sendiri, tiap m³ bocor itu langsung biaya listrik pompa Paskal. Ini kandidat pengganti wedge "air hilang": cakupannya lebih kecil, tapi bukti sebabnya jauh lebih tajam.

**Lubang yang diterima selama ditunda:** di bulan yang ada pergantian penghuni, penghuni baru menanggung pemakaian penghuni lama **dan** periode kosong. Paskal menangani kasus itu manual di spreadsheet, seperti yang mereka lakukan sekarang. Ini lubang yang **diketahui dan dibatasi**, bukan yang tersembunyi — dan sebaiknya disampaikan ke Paskal apa adanya, bukan ditemukan sendiri oleh penghuni yang protes.

**Pemicu untuk membangunnya:** protes tagihan pertama dari penghuni baru mulai muncul, ATAU saat fase 2 (penerbitan tagihan) dibangun — mana yang lebih dulu.

**Yang ikut tertunda karena ini:** entitas okupansi (unit ↔ penghuni ↔ rentang) dan tagihan ber-rentang-tanggal. Catatan: kalaupun tetap bulanan, **tagihan Lodge sebaiknya menyebut rentang tanggal ("1–31 Agustus") bukan nama bulan** — murah sekarang, dan sudah benar saat serah-terima kelak masuk.

---

## 8. Berikutnya

- **Wedge "air hilang" diturunkan, tapi belum mati.** *(Direvisi 18 Agu.)* Airnya dari **sumur artesis sendiri**, jadi tidak ada meter induk PDAM yang memberi angka pembanding gratis. Ironisnya kehilangan air justru **lebih menyakitkan** bagi Paskal — tiap m³ yang tidak tertagih adalah listrik pompa yang mereka bayar sendiri — cuma sekarang tidak terlihat. **Rekomendasi murah: pasang satu meter di keluaran pompa/tandon.** Sekali pasang, dan "berapa air yang hilang bulan ini" berubah dari perasaan jadi angka. Itu saran operasional, bukan fitur produk — tapi ia yang memberi produk bahannya.
- **Belum digarap**:
  - **Tautan tagihan tenant** (fase 2) — isi, batas jujur, cara taksiran ditampilkan beda
  - **Model data & entitas** — terutama **okupansi tenant** (`unit ↔ tenant ↔ rentang tanggal`): riwayat pembacaan menempel di **meter**, tapi hak lihat menempel pada **siapa yang menghuni unit itu di periode tersebut**. Tenant baru tidak boleh lihat tagihan tenant lama. Kecil kalau dirancang sekarang, mimpi buruk kalau ditambal setelah data setahun menumpuk.
  - **Tarif ber-tanggal-berlaku** (pola §37.3) — tarif naik tidak boleh mengubah tagihan yang sudah terbit
- **Penulisan ulang komponen** ke design system AUTSORZ, setelah library disebut
- **Dokumen spesifikasi resmi**: baru ditulis setelah hasil survei masuk (poin meter induk bisa menggeser posisi wedge)
- Pengingat terjadwal: **Kamis 20 Agustus, 17.00 WIB**, membawa daftar pertanyaan survei di bagian 2

---

## 9. Cara kerja owner (untuk sesi baru)

Bahasa Indonesia santai ("bro"), presisi teknis. **Tanya konteks lapangan dulu, tahan rekomendasi** — asumsi yang salah memboroskan iterasi. Angkat tradeoff jujur dengan konsekuensi jelas; **tarik kembali tanpa segan** kalau realita lapangan menunjukkan rancangan salah (sudah terjadi dua kali di sesi ini: argumen billing-vs-payroll, dan penolakan app tenant). Suka men-challenge balik dan memangkas — pertanyaan "kok stepnya panjang, bisa digabung?" memangkas ongkos tap dari 5 jadi 2. **Jangan buru-buru bikin dokumen**; tulis setelah keputusan mengeras.

Untuk prototipe: dia melihatnya dari komputer **dan HP** — pastikan responsif dan tidak ada luber horizontal. Kirim `.jsx` untuk ditempel ke project, plus satu berkas HTML mandiri untuk dilihat langsung tanpa setup.