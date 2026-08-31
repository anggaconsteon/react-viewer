# Handoff: Pencatatan Meter Air — Paskal Hypersquare

**Status: rancangan mengeras, tiga layar sudah diprototipekan · menunggu survei lapangan Kamis 20 Agustus 2026**

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
- **100–500 unit**, saat ini **spreadsheet manual** — tidak ada software incumbent (vakum, bukan penggusuran)
- Utilitas yang ditagih: **air (meteran) + service charge/IPL (flat)**. **Tidak ada listrik.**
- Jalur tagihan ke tenant sekarang: **WhatsApp + email**
- Meter **posisi tetap**, bisa ditempeli QR; QR mungkin **beberapa langkah** dari meternya. Akses di Paskal **bagus**. Biasanya **ada ID unik** di meter.
- **Angka terakhir bisa diambil dari spreadsheet** → di-seed ke database/Firebase
- Penilaian owner: kerjaan yang benar-benar berat = **memastikan nomor meternya benar**

### Belum diketahui — bahan survei Kamis

1. **Foto 20–30 meter air apa adanya** → bahan uji kelayakan OCR (tanpa ini, OCR tidak boleh diputuskan)
2. **Ada meter induk PDAM di kawasan?** Kalau ada, `induk − Σ submeter` = air yang hilang dan ditanggung Paskal — biasanya pain nomor satu pengelola, dan angkanya gratis begitu semua submeter terbaca. **Kandidat wedge terkuat.**
3. **Berapa orang petugas meter?** Kalau cuma satu, lapisan pembagian wilayah tidak usah dibangun sama sekali.
4. **Meter berderet di satu panel, atau menempel di ruko masing-masing?** Kalau berderet, uji aliran bukan opsi mewah — itu satu-satunya cara memetakan, dan waktu pendataan berlipat.
5. Ada meter **di dalam ruko** (butuh tenant buka)? Berapa banyak? → ini sumber taksiran.
6. **Nomor seri unik se-kawasan**, atau nomor pabrik yang bisa kembar antar merek?
7. **Berapa digit** meternya (4/5/6), seragam atau campur?
8. Siapa yang **menetapkan tarif air**, pernah berubah berapa kali?
9. Siapa yang sekarang **mengetik spreadsheet** — sekutu, atau merasa terancam?

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
8. **Nomor seri meter direkam sekali saat pendataan, lalu cuma DITAMPILKAN untuk dicocokkan mata** — tanpa tap konfirmasi. Tap "Ya, cocok" 214 kali berturut-turut adalah refleks, bukan pemeriksaan (argumen yang sama dengan penolakan OCR-mengisi). Label bukti jujur: **"nomor ditampilkan, petugas tidak melaporkan beda"** — bukan "terverifikasi".
9. **QR = anti-salah-unit, bukan bukti kehadiran** (foto meter jauh lebih kuat untuk itu). Jalur pilih-manual tetap dibuka kalau QR rusak, tapi **ditandai beda tingkat buktinya**.
10. **Taksiran disediakan, tidak dilarang** — dengan syarat keras: **nama penaksir wajib**, **dasar taksiran wajib ditulis**, dan angkanya **tidak pernah muncul sebagai hasil pembacaan** (label "taksiran kantor" sampai ke tautan tenant). Alasannya: kalau produk tidak menyediakannya, taksiran tetap terjadi di spreadsheet **tanpa jejak sama sekali**. Yang dijaga bukan mencegahnya, tapi memastikan ia tidak menyamar.
11. **Tidak ada aksi pengelola yang menimpa angka petugas.** "Terima", "minta baca ulang", "taksiran" — semuanya menambah catatan bertanggal + nama. Fakta terkunci, tafsir di atasnya.
12. **Kejujuran bulan pertama:** kalau angka awal diimpor dari spreadsheet, tagihan pertama = (bacaan terbukti) − (angka spreadsheet tanpa bukti). Cuma separuh terbukti. Paskal harus tahu di depan agar tidak overclaim ke tenant.

### Interaksi lapangan

13. **Kotak digit terkunci** sepanjang digit meter (config per meter), bentuknya meniru kotak hitam di meter → petugas **menyalin**, bukan menerjemahkan. Kelebihan/kurang digit jadi mustahil secara bentuk.
14. **Digit merah (liter) tidak ditampung.** Ikut tersalin = tagihan meleset 1000×.
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
28. **Pembagian wilayah = keputusan berdiri** (carry-forward §31), dan **default-nya tanpa pembagian sama sekali** — satu daftar bersama, yang sudah terbaca hilang dari daftar yang lain. Pembagian per blok = config opsional (pola degenerasi-lewat-config §37.3).
29. **Jangan bikin tombol "Buat Putaran September".** Suatu bulan orang lupa menekan → petugas nganggur, tagihan telat.
30. **Jendela baca = harapan, bukan gerbang.** Baca di luar jendela tetap ditangkap apa adanya dengan tanggal aslinya.
31. **Push notification**: gerbangnya secara doktrin **terbuka** (syarat di peta produk: "vertikal ber-cadence-rendah commit" — ini vertikalnya). Tapi **jangan dibangun untuk Paskal**: putaran bulanan itu event terencana, dua petugas, WA sudah cukup. Baru masuk akal untuk pengelola dengan belasan petugas lintas kawasan.

---

## 5. Materi yang sudah jadi

| Berkas | Isi | Status |
| --- | --- | --- |
| `PencatatanMeter.jsx` + `autsorz_meter_v2_preview.html` | Layar petugas, versi ringkas 2 layar / 7 tap | Diuji semua cabang, responsif |
| `KokpitPutaran.jsx` + `autsorz_kokpit_putaran.html` | Layar pengelola: tiga tumpukan penghalang tagihan, panel bukti, aksi terima/baca-ulang/taksiran, kunci putaran | Diuji, layout sempit sudah diperbaiki |
| `PendataanMeter.jsx` + `autsorz_pendataan_meter.html` | Putaran nol: penjaga pemetaan, nomor seri, jumlah digit, tingkat keyakinan | Diuji semua cabang |
| `autsorz_meter_petugas.html` | Prototipe awal 5 layar | **Digantikan** versi 2 layar |

Semua komponen: React, **tanpa dependency**, style inline. **Belum mengikuti design system AUTSORZ** — owner menyebut "pakai library standar" tapi belum menyebut yang mana (Tailwind+shadcn / MUI / Ant / lainnya). Perlu ditanya sebelum penulisan ulang.

Kokpit disusun sebagai **daftar penghalang tagihan**, bukan tabel data: angka paling menonjol adalah *"menahan tagihan: 79 unit"*. Tumpukan "Siap" sengaja **tidak menampilkan daftarnya** (monitoring by exception §36.2).

---

## 6. Risiko utama (diranking)

1. **Pemetaan unit ↔ meter.** Kesalahan terjadi **sekali di awal**, biasanya oleh orang yang paling murah dikirim; akibatnya dua tenant salah tagih **tiap bulan**; angkanya tetap masuk akal sehingga **tidak ada pemeriksaan lain yang menangkapnya**; ketahuannya cuma kalau ada tenant protes, bisa setahun kemudian. Ini risiko tertinggi di seluruh produk.
2. **Taksiran menyebar.** Biaya "minta baca ulang" tinggi (petugas sudah pulang) → kantor pelan-pelan lari ke taksiran. **Cara menjaganya ada di lapangan** (pemeriksaan saat petugas masih di depan meter), bukan di kokpit. Kalau angka "perlu ditinjau" tinggi terus, yang rusak lapangannya.
3. **Putaran nol diremehkan.** ~214 unit × (tempel QR + rekam seri + jumlah digit + angka awal) realistis **2–3 hari kerja lapangan**. Harus masuk anggaran onboarding sejak awal.
4. **Ambang lonjakan salah kalibrasi.** Kalau kelewat sensitif, petugas **belajar mengabaikan** peringatan — dan begitu itu terjadi, semua pemeriksaan lain ikut mati. Ambang harus dari kebiasaan tiap unit, bukan angka global. Di kode masih konstanta sementara (`AMBANG_LONJAKAN`).
5. **Tagihan bulan pertama cuma separuh terbukti** (lihat keputusan #12).
6. **Fase 3 menaikkan kelas SLA** — produk jadi jalur kas.

---

## 7. Berikutnya

- **Setelah survei Kamis**: kalau ada meter induk PDAM, kartu **"air yang hilang bulan ini"** naik ke paling atas kokpit — kemungkinan lebih menggerakkan pengelola daripada seluruh sisa layar digabung, dan mungkin wedge jualan yang sebenarnya.
- **Belum digarap**:
  - **Tautan tagihan tenant** (fase 2) — isi, batas jujur, cara taksiran ditampilkan beda
  - **Model data & entitas** — terutama **okupansi tenant** (`unit ↔ tenant ↔ rentang tanggal`): riwayat pembacaan menempel di **meter**, tapi hak lihat menempel pada **siapa yang menghuni unit itu di periode tersebut**. Tenant baru tidak boleh lihat tagihan tenant lama. Kecil kalau dirancang sekarang, mimpi buruk kalau ditambal setelah data setahun menumpuk.
  - **Tarif ber-tanggal-berlaku** (pola §37.3) — tarif naik tidak boleh mengubah tagihan yang sudah terbit
- **Penulisan ulang komponen** ke design system AUTSORZ, setelah library disebut
- **Dokumen spesifikasi resmi**: baru ditulis setelah hasil survei masuk (poin meter induk bisa menggeser posisi wedge)
- Pengingat terjadwal: **Kamis 20 Agustus, 17.00 WIB**, membawa daftar pertanyaan survei di bagian 2

---

## 8. Cara kerja owner (untuk sesi baru)

Bahasa Indonesia santai ("bro"), presisi teknis. **Tanya konteks lapangan dulu, tahan rekomendasi** — asumsi yang salah memboroskan iterasi. Angkat tradeoff jujur dengan konsekuensi jelas; **tarik kembali tanpa segan** kalau realita lapangan menunjukkan rancangan salah (sudah terjadi dua kali di sesi ini: argumen billing-vs-payroll, dan penolakan app tenant). Suka men-challenge balik dan memangkas — pertanyaan "kok stepnya panjang, bisa digabung?" memangkas ongkos tap dari 5 jadi 2. **Jangan buru-buru bikin dokumen**; tulis setelah keputusan mengeras.

Untuk prototipe: dia melihatnya dari komputer **dan HP** — pastikan responsif dan tidak ada luber horizontal. Kirim `.jsx` untuk ditempel ke project, plus satu berkas HTML mandiri untuk dilihat langsung tanpa setup.