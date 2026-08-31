# Web URL → per-tenant resolve (design)

- **Tanggal:** 2026-08-20
- **Spreadsheet:** VTL Master `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` (locale `in_ID` → arg-sep `;`, array col-sep `\`)
- **Status:** **SELESAI DIEKSEKUSI 2026-08-20** — lihat §0
- **Supersedes:** memory `feedback_web_url_ssot` ("Web URL = SSOT src"). SSOT pindah ke `Site`.

---

## 0. Status eksekusi

**Rencana berubah saat eksekusi.** §4 (ganti token jadi `[SRC:# Kind]`) dan §6 (cutover 3 tulisan + jendela rusak) **DIBATALKAN** — diganti pendekatan dual-mode yang tidak punya jendela rusak sama sekali. Bagian itu disimpan sebagai catatan sejarah, bukan instruksi.

### Kenapa berubah

Rencana §4 diuji lebih dulu di sel kosong. Hasilnya: rumus baru mencari `[SRC:# Admin]`, tapi `Web Menu` masih berisi `[SRC:dashboard]` → dua `src` hilang. Ini membuktikan rencana lama **tidak bisa diverifikasi sebelum terlanjur** — cacat proses, bukan cacat rumus.

### Yang dikerjakan

**Kolom E `Web URL` dialih-fungsikan** dari "Spreadsheet URL" menjadi "Jenis File". Resolver baru membaca kolom itu **dual-mode**:

```
src = IF(LEFT(raw;4)="http"; raw; <cari kind `raw` di Site>)
```

Konsekuensinya rumus bisa dipasang **sebelum** data dipindah — outputnya identik byte-per-byte — lalu migrasi dilakukan **per baris**, sambil diverifikasi. Nol downtime.

Token `[SRC:dashboard]` dst **tidak diubah sama sekali**. `Web Screen`, `Web Screen For Tenant`, dan `Web Menu` **tidak disentuh**.

### Sel yang berubah

| Tab | Sel | Isi |
|---|---|---|
| `_Helper Web JSON` | `C2` | resolver baru (dual-mode, baca `Site`) |
| `Web URL` | `E1` | header → `Jenis File (cari di Site) — sisa URL = belum dimigrasi` |
| `Web URL` | `E2:E18` | URL → nama jenis file (17 baris) |

`E19:E23` (Reset Device ×2, Slip Gaji ×3) **sengaja dibiarkan berisi URL** — Reset Device tidak punya `src` (§2.6), Slip Gaji URL-nya di-hardcode di `Web Screen` (§2.12). Dual-mode membuat keduanya tetap jalan apa adanya.

### Bug yang ditemukan saat eksekusi

Percobaan pertama menulis `C2` menghasilkan `#ERROR!` — **menu live sempat mati beberapa detik**, langsung di-rollback dari §2.4.

Sebabnya: `MAP($A$2:$A;…)` = 1602 baris × 11 halaman. Rumus lama ringan; rumus baru (`LET` + `CHOOSECOLS` + 3 `FILTER` + `ARRAYFORMULA` per iterasi) menembus batas hitung Sheets.

Struktur lama memproses baris kosong secara penuh karena `IF(e="";"";…)` ada di **nilai awal REDUCE**, bukan membungkusnya. Perbaikan: pindahkan ke luar —

```
LAMBDA(e;ccstr; IF(e="";""; REDUCE(…)))
```

Baris kosong sekarang berbiaya nol. **Pelajaran: menguji dengan range dipendekkan menyembunyikan batas hitung.** Uji berikutnya harus memakai range yang sama persis dengan target.

### Verifikasi

- JSON utuh ketujuh user dibandingkan `=IF(C2:C8=I2:I8;"IDENTIK";"BEDA")` → **IDENTIK ×7** sebelum data dipindah
- Setelah migrasi, `src` berubah persis sesuai prediksi: Dashboard `1FTaIACx…` → `1XTomLvk…` (§2.13), sisanya tetap
- `C8` (user Kantor-Pusat-saja) dibaca utuh: JSON valid, tidak ada `[SRC:` maupun `[CC_OPTIONS:` yang tersisa mentah
- Sel uji di `_Helper Web JSON` kolom I sudah dibersihkan; kolom G/H/J tidak berubah

### Sisa pekerjaan

1. **4 halaman ber-URL-mentah** (§2.7) — belum tersentuh, masih akan bocor saat clone
2. `Web URL` kolom C (`Cost Center`) sekarang **tidak berpengaruh** — semua baris satu halaman punya jenis file yang sama. Bisa disederhanakan jadi satu baris per halaman
3. Validasi data `Web URL!C` rusak (`=#REF!`) — sudah rusak sebelum perubahan ini
4. Cabang `http` di resolver bisa dibuang setelah `E19:E23` ikut dimigrasi

---

## 1. Masalah

Onboarding tenant = clone spreadsheet master bulat-bulat (semua tab, rumus, dan **data**).

Tab `Web URL` nyimpen URL spreadsheet data per (page × cost center) sebagai **teks manual**. Habis clone, tenant baru bawa URL milik tenant lama. Page-nya render normal, gak ada error — tapi nunjuk ke data tenant lain, dengan `"permission":"C◆U◆D"` (baca **dan tulis**).

Akarnya bukan "URL-nya salah". Akarnya: **`Web URL` nyimpen data tenant di tab yang diperlakukan sebagai config.** Clone-semuanya jalan buat struktur dan rumus; gak akan pernah jalan buat data tenant.

`Site` gak kena masalah ini karena isinya jelas-jelas data tenant (VID, nama klien, cost center) — pasti diganti waktu onboarding.

---

## 2. Temuan dari sheet live

### 2.1 `Site` udah nyimpen URL yang sama

`Site` kolom Q–W, satu kolom per jenis file, satu baris per cost center:

| Kolom | Header (baris 2) | Induk | Kantor Pusat | Product Group |
|---|---|---|---|---|
| Q | `# Admin` | *(kosong)* | `1XTomLvk…` | `1yhRupdq…` |
| R | `# Absensi` | — | `1nEjhqVB…` | `1XNtStUS…` |
| S | `# Rekap Absensi` | — | `1thMR9Od…` | `1GY5jS7O…` |
| T | `# Rekap Payroll` | — | `1ixNarZB…` | `1C-BqFJb…` |
| U | `# Presensi Hari Ini` | `1r2cZvs0…` | — | — |
| V | `# Laporan Pekerjaan` | `1BXA0naH…` | — | — |
| W | `# IT Admin` | `18ohF8BQ…` | — | — |

Q2:W2 dan Q3:W3 semuanya **literal manual** — aman diedit.

Baris induk nyimpen file level-tenant, baris cost center nyimpen file level-CC. Makanya `Web URL` punya 3 baris `laporanPekerjaan` yang isinya URL sama persis — itu satu file induk yang dipinjem semua CC.

### 2.2 `Site!P2` = spill anchor, hardcode 7 kolom

```
=ARRAYFORMULA(IF(H2:H="";"";Q2:Q&"◆"&R2:R&"◆"&S2:S&"◆"&T2:T&"◆"&U2:U&"◆"&V2:V&"◆"&W2:W))
```

P2 anchor, P3+ hasil spill. **JANGAN nulis apa pun ke P3+.**

`Cost Center` narik P lewat `=QUERY(Site!B2:Z; "Select B,C,D,F,H,P WHERE D=E AND LOWER(H) Matches 'active.*'"; 1)` lalu di-split posisional. Konsekuensi: **kind baru wajib ditambah di ujung kanan (X, Y, …), jangan nyempil di tengah** — kalau nyempil, posisi 1–7 geser dan `Cost Center` ikut salah tanpa error.

`Site` baris 1 (P1:W1) **kosong** → ada tempat buat baris page key tanpa perlu insert row.

### 2.3 Baris induk udah punya penanda

`Site` kolom M (`Cost center flag`): Induk = `vtl◆master`, KP = `vtl◆kantor-pusat`, PG = `vtl◆product-group`.

`master` = baris induk. Bukan hardcode nama "Induk", jadi tenant yang nyebut cost center induknya "HQ"/"Pusat" tetap jalan.

**Terverifikasi 2026-08-20:** `M3` = `userEnteredValue.stringValue` `"vtl◆master"` — literal manual, bukan rumus. Aman dipakai sebagai kunci.

Prefix `vtl` itu kode tenant, jadi tenant lain kemungkinan nulis `maju◆master`. Pencocokan harus pakai `REGEXMATCH(flag;"(^|◆)master($|◆)")`, bukan `=` atau `ENDSWITH`.

### 2.4 Kontrak resolver `[SRC:page]`

Produsen — `Web Screen` col G di content SPREADSHEET nulis token mentah:

| Web Screen row | col G |
|---|---|
| 14 | `[SRC:dashboard]` |
| 29 | `[SRC:laporanPekerjaan]` |
| 39 | `[SRC:itAdmin]` |

Konsumen — `_Helper Web JSON!C2`:

```
=MAP($A$2:$A;$B$2:$B;LAMBDA(e;ccstr;
  REDUCE(
    <menu JSON per-user, RBAC-filtered>;
    UNIQUE(FILTER('Web URL'!$D$2:$D$101;'Web URL'!$D$2:$D$101<>""));
    LAMBDA(acc;p;
      SUBSTITUTE(SUBSTITUTE(acc;
        "[CC_OPTIONS:"&p&"]";
        IFERROR(TEXTJOIN("◆";TRUE;FILTER('Web URL'!$C$2:$C$101&"▶"&'Web URL'!$E$2:$E$101;
          ('Web URL'!$D$2:$D$101=p)
          *((COUNTIF(SPLIT(ccstr;"◆");'Web URL'!$C$2:$C$101)>0)+('Web URL'!$C$2:$C$101="Semua CC"))
          *('Web URL'!$E$2:$E$101<>"")));""));
        "[SRC:"&p&"]";
        IFERROR(REGEXEXTRACT(IFERROR(TEXTJOIN("◆";TRUE;FILTER(<sama>));"");"▶([^◆]+)");"")
      )))))
```

Semantik: buat tiap page key `p`, ambil baris `Web URL` yang page key-nya `p`, cost center-nya ada di CC list user, URL-nya gak kosong → pakai yang **pertama**.

Dua bug ketemu di sini:

1. **Range kepatok `$2:$101`.** Maksimum 100 baris `Web URL`. Sekarang kepakai 22. Kalau lewat, page-nya diam-diam gak ke-resolve.
2. **Cabang `="Semua CC"` dead code.** Data nulisnya `"Semua"`, bukan `"Semua CC"`. Jalan cuma karena `ccstr` user kebetulan berisi token literal `"Semua"`. Rapuh.

### 2.5 Kolom C `Web URL` juga data tenant

`Web URL` col C isinya nama cost center (`Induk`, `Kantor Pusat`, `Product Group`) — **beda tiap tenant.** Jadi bikin col E jadi rumus **tidak cukup**; col C tetap salah setelah clone.

Buat generate col C, `Web URL` harus jadi cross-product (page × cost center). Diperparah: pemetaan page → kind itu **many-to-one** — `# Admin` melayani `dashboard` *dan* `daftarPegawai`.

Ini yang bikin arah "Web URL col E jadi rumus" ditinggal.

### 2.6 Baris `Web URL` yang mati

`resetDevice` dan `resetDeviceTenant` (Web Screen row 40 & 49) pakai content type `RESET_DEVICE`, yang **gak punya field `src`** sama sekali. Dua baris itu di `Web URL` gak pernah dibaca siapa pun.

### 2.7 Pelanggaran SSOT yang udah ada — 4 halaman

Disisir 2026-08-20: seluruh `Web Screen` baris 1–120, semua kolom parameter (F–R).

| Row | Halaman | URL mentah |
|---|---|---|
| 56 | `registerEmployeeContent` (Pendaftaran Pegawai) | `1OHqMDgWbFLG…` |
| 66 | `phk` | `1OHqMDgWbFLG…` |
| 74 | `mutasi` | `1OHqMDgWbFLG…` |
| 91 | `slipGajiContent` | `1FQqc6KI…` |

Bandingkan: yang pakai `[SRC:]` cuma **3** (row 14 dashboard, row 29 laporanPekerjaan, row 39 itAdmin).

**Lebih banyak halaman yang menempel URL daripada yang lewat sistem.** Keempatnya akan tetap menunjuk file tenant lama setelah clone — masalah §1 persis, tapi di tempat yang design ini tidak sentuh.

Memindahkan keempatnya butuh jenis file baru di `Site` → terhalang batas kolom `Cost Center` (§2.11). Lihat §8.

### 2.8 Data yang bentrok antara dua SSOT

| Page / CC | `Web URL` | `Site` | Aksi |
|---|---|---|---|
| rekapAbsensi / Kantor Pusat | `1GY5jS7O…` | `1thMR9Od…` (col S) | **`Site` menang** — rekap absensi beda per CC (owner), `Web URL` menulis KP=PG=`1GY5jS7O…` yang tidak mungkin benar. Page belum nyala di menu, jadi belum ada dampak |
| dashboard + daftarPegawai / Induk | `1FTaIACx…` | Q kosong | **biarkan kosong** — `Site` yang benar. Induk = level tenant, tidak punya file `# Admin` terpisah; user turun ke file cost center masing-masing (§2.13) |
| slipGaji | `1lYsl2MG…` | tidak ada kolom | **data yatim** — nilai live-nya `1FQqc6KI…`, di-bake di `Web Menu`. Lihat §2.12 |

### 2.9 Dua idiom "dipakai semua CC"

`Web URL` punya dua cara nulis hal yang sama:

| Page | Cara |
|---|---|
| `logPresensi`, `itAdmin`, `slipGaji` | 1 baris, col C = `Semua` |
| `laporanPekerjaan` | 3 baris (Induk, KP, PG), col E identik |

Di `Site` dua-duanya jadi satu aturan: **file level-tenant diisi di baris induk, file level-CC diisi di baris CC-nya.** Cost center yang barisnya kosong jatuh ke induk (fallback §5).

Ini strictly lebih ekspresif — `Site` bisa nulis "5 cost center, 2 punya file sendiri, 3 nebeng induk" (isi 2, kosongin 3). `Web URL` gak bisa tanpa nulis 5 baris manual.

Karena itu cabang `="Semua CC"` di resolver bisa dibuang tanpa kehilangan semantik.

### 2.10 User multi-CC cuma dapat cost center pertama

Resolver ambil `INDEX(…;1)` — hasil pertama dari FILTER, urutannya ngikut urutan baris sheet.

Contoh, page `attendance` (KP dan PG punya file sendiri):

| User | Otorisasi CC | Dapat |
|---|---|---|
| A | Kantor Pusat | `1nEjhqVB…` (KP) |
| B | Product Group | `1XNtStUS…` (PG) |
| C, D, E | KP + PG | `1nEjhqVB…` — **PG tidak pernah terlihat** |

Token `[CC_OPTIONS:page]` di resolver kelihatannya disiapkan untuk ini (dia bikin daftar lengkap `CC▶URL`, bukan satu), tapi belum ada page yang memakainya.

**Keputusan owner 2026-08-20: dipertahankan apa adanya.** Perilaku first-match disalin persis ke resolver baru supaya hasil migrasi bisa dibandingkan 1:1. Lihat §8.

### 2.11 Proteksi & batas grid (BLOCKER)

Terverifikasi 2026-08-20 lewat `protectedRanges`.

**`Site`** (sheetId 805031195) diproteksi seluruhnya, dengan **dua jendela terbuka**:

| Jendela | Baris | Kolom |
|---|---|---|
| 1 | 3–199 | C–F (`Nama klien`, `Cost center`, `Site`, `Wilayah`) |
| 2 | 3–199 | H–L (`Status` … `Tipe pekerjaan`) |

**Kolom Q–W (URL), M (flag), dan baris 1–2 semuanya TERKUNCI.** Artinya: URL memang sengaja diperlakukan sebagai config admin, bukan isian operator — persis salah-filing yang jadi akar masalah di §1.

Semua tulisan ke `Site` yang dibutuhkan design ini jatuh di area terkunci. **Butuh owner buka proteksi atau eksekusi manual.**

**`Cost Center`** (sheetId 255730025) diproteksi seluruhnya tanpa jendela terbuka, dan grid-nya cuma **14 kolom (A–N)**.

`H2` = `=ARRAYFORMULA(IF(G2:G="";""; SPLIT(G2:G;"◆";True;False)))` — spill **dua arah**: ke kanan sebanyak jumlah token `◆`, dan ke bawah. I2:N2 dan H3:N3 semuanya hasil spill.

Sekarang 7 kind → spill mentok pas di N. **Kind ke-8 butuh kolom O yang tidak ada** → spill gagal → `Cost Center` mati, dan semua yang baca `Cost Center` ikut mati.

Konsekuensi: **nambah kind baru wajib nambah kolom di `Cost Center` DULUAN.** MCP tidak bisa nambah kolom dan sheet-nya terproteksi — ini langkah manual owner, bukan sesuatu yang bisa diotomatisasi dari sini.

### 2.12 `slipGaji` tidak lewat resolver

URL `1FQqc6KI…` yang muncul di JSON live **tidak ada di `Web URL` baris mana pun**. Sumbernya: `Web Screen` row 91 col H — URL mentah, salah satu dari empat di §2.7.

> Koreksi 2026-08-20: sebelumnya dicatat "di-bake di `Web Menu` L/M". Salah — asalnya `Web Screen`, lalu mengalir ke `Web Menu` lewat pageData. Efeknya sama (bypass `[SRC:]`), sumbernya beda.

Berarti baris `Web URL` `slipGaji` = `1lYsl2MG…` adalah **data yatim** — tidak pernah dibaca siapa pun. Itu menjelaskan konflik §2.8.

Implikasi: `slipGaji` belum ikut sistem `[SRC:]` sama sekali. Memindahkannya butuh jenis file baru di `Site` → terhalang §2.11. **Di luar scope**, lihat §8.

### 2.14 Dropdown cost center TIDAK terpengaruh

Diverifikasi 2026-08-20 setelah pertanyaan owner.

Dropdown cost center pakai token **`[CC_LIST]`**, bukan `[SRC:]` maupun `[CC_OPTIONS:]`. Rantainya:

```
Otorisasi Cost Center  →  _Helper Web JSON col B  →  [CC_LIST]  →  dropdown
```

`_Helper Web JSON!B2` = `MAP($A$2:$A;LAMBDA(e;… FILTER('Otorisasi Cost Center'!$E$2:$Z$2;…)…))`. **Tidak menyentuh `Web URL`.**

Dan dropdown itu **tidak mengganti spreadsheet**. Di halaman Laporan Pekerjaan:

```json
{"type":"DROPDOWN","key":"costCenter","options":"[CC_LIST]","cell":"Patroli!F5◆Patroli1!F5◆Rutin!F5"}
```

Dia menulis nama cost center terpilih ke sel `F5` **di file yang sama**, lalu `REFRESH_CONTENT`. Penyaringan terjadi di dalam file, bukan dengan pindah file.

Ini konsisten dengan `Site`: `# Laporan Pekerjaan` cukup diisi satu baris (Induk) karena memang satu file melayani semua cost center dan file itu menyaring sendiri.

**`[CC_OPTIONS:page]` tidak dipakai halaman mana pun.** Disisir `Web Screen` baris 1–120 kolom F–R, plus seluruh 19 template `Web Widget` (col J) — dropdown-nya pakai `[OPTIONS]` / `[SRCOPTIONS]`, tidak ada yang menghasilkan `[CC_OPTIONS:`. Fiturnya ada di resolver tapi belum pernah dipasang. Tetap diport ke versi `Site` (§5) supaya tidak hilang, tapi tidak ada yang bergantung padanya sekarang.

### 2.13 Hirarki, dan arah fallback (owner 2026-08-20)

```
Tenant  →  cost center  →  site  →  location
```

Baris `Induk` di tab `Site` **bukan cost center** — itu level tenant, tingkat paling tinggi. VID-nya (`84214220504259`) sama persis dengan `Profil Perusahaan!C2`.

File tenant = **spreadsheet master ini sendiri** (`1FTaIACx…`; file `14kDPqAw…` adalah salinannya). Fungsinya monitoring/agregasi. Data operasional yang sebenarnya ada di file per cost center — tambah pegawai misalnya tercatat di dua tempat: master ini dan file cost center-nya.

`Profil Perusahaan` adalah tab identitas tenant (VID, nama perusahaan, singkatan). **Tidak ada sel berisi URL spreadsheet ini sendiri**, dan tidak ada rumus yang bisa menghasilkan ID file-nya sendiri.

**Keputusan owner: file cost center yang menang.** User Kantor Pusat buka file KP, user Product Group buka file PG. Level tenant cuma dipakai kalau cost center-nya memang tidak punya file jenis itu.

Ini persis perilaku ladder di §5 (`baris cost center user` → `baris master`), jadi **tidak perlu penanganan khusus**.

**Perubahan perilaku yang disetujui.** Sekarang baris `Induk` ada di urutan teratas `Web URL` dan semua user punya `Induk` di daftar cost center-nya, sehingga Induk selalu menang duluan:

| Halaman | Sekarang (semua user) | Sesudah |
|---|---|---|
| Dashboard | `1FTaIACx…` (file tenant) | KP → `1XTomLvk…`, PG → `1yhRupdq…` |
| Daftar Pegawai | `1FTaIACx…` (file tenant) | KP → `1XTomLvk…`, PG → `1yhRupdq…` |

Artinya file cost center `1XTomLvk…` dan `1yhRupdq…` **selama ini tidak pernah terbuka dari web sama sekali**. Sesudah migrasi baru kepakai. Ini disengaja dan disetujui, bukan regresi.

Konsekuensi enaknya: `Site!Q<baris Induk>` (`# Admin` level tenant) **tidak perlu diisi** — setiap cost center sudah punya file `# Admin` sendiri. Jadi design ini **tidak menulis apa pun ke tab `Site`**, dan blocker proteksi §2.11 tidak berlaku untuk scope sekarang.

### 2.15 `Site` memuat baris site, bukan cuma cost center (JEBAKAN)

Hirarki §2.13: Tenant → cost center → **site** → location. Tab `Site` memuat baris untuk kedua level.

Pembedanya sudah dipakai QUERY tab `Cost Center`:

```
=QUERY(Site!B2:Z; "Select B,C,D,F,H,P WHERE D=E AND LOWER(H) Matches 'active.*'"; 1)
```

`D=E` artinya kolom `Cost center` **sama dengan** kolom `Site` → baris itu level cost center. Kalau beda, itu baris site di bawahnya.

Bahayanya: baris site punya nilai kolom `Cost center` yang **sama** dengan induknya, jadi baris site ikut lolos pencocokan `ccstr`. Kalau ada URL terisi di baris site, first-match bisa mengambilnya dan bukan milik cost center-nya — diam-diam, tanpa error.

Sekarang belum kejadian (`Site` cuma 3 baris, semuanya `D=E`), tapi begitu site pertama dibuat, bug ini muncul sendiri.

**Wajib:** filter resolver menyertakan `(cc=sname)`. Sudah masuk §5.

Sekalian: `Cost Center` mencocokkan status dengan `Matches 'active.*'` (awalan), bukan `=`. Resolver harus sama supaya dua tab tidak menyaring beda.

### 2.16 `Web Screen For Tenant` = salinan paralel dengan token yang sama

Tab terpisah, isinya cerminan `Web Screen` dan memuat **token `[SRC:` yang sama persis**:

| Row | Token |
|---|---|
| 14 | `[SRC:dashboard]` |
| 29 | `[SRC:laporanPekerjaan]` |
| 39 | `[SRC:itAdmin]` |

**Dikonfirmasi owner 2026-08-20:** ini memang disengaja — `Web Screen For Tenant` adalah versi yang tinggal di-copy-paste ke spreadsheet tenant lain. Isinya harus disamakan dengan `Web Screen`.

Karena itu tab ini justru **lebih penting** daripada `Web Screen` untuk masalah §1: kalau cuma `Web Screen` yang diubah, setiap tenant baru tetap lahir membawa token lama, dan perbaikannya tidak pernah sampai ke mereka.

**Wajib ikut diubah di cutover.** Total 6 sel, bukan 3.

### 2.17 Tujuh user; enam ber-`costCenters` identik

`_Helper Web JSON` col A berisi 7 akun (bukan 3 seperti dicatat sebelumnya). Enam pertama punya `costCenters` = `Semua◆Induk◆Kantor Pusat◆Product Group`; owner menambahkan `amesakh@otonomiq.com` = `Kantor Pusat` saja untuk keperluan uji.

**Penting: user Kantor Pusat saja TIDAK cukup sebagai bukti.** Kantor Pusat kebetulan baris cost-center pertama di `Site`, jadi filter yang rusak (selalu ambil baris pertama) menghasilkan output yang identik. Yang membedakan hanya Product Group.

Diuji lewat probe `ccstr` hardcode di `_Helper Web JSON!I13` — hasil lengkap di §5. Lulus.

**Tab tidak terpakai** (`Copy of Web URL`, `Web Screen 2`, `Web Menu3 `, `Otorisasi Cost Center33`): owner konfirmasi tidak dipakai. Tidak diperiksa, tidak disentuh.

---

## 3. Keputusan

**`Site` jadi satu-satunya tempat URL disimpan. `Web URL` dipensiunkan. Resolver baca `Site` langsung.**

Alasan:
- `Site` udah punya persis satu baris per cost center, dan isinya otomatis benar per tenant karena onboarding emang ngisi tab itu
- Gak ada yang perlu di-generate — no cross-product, no many-to-one mapping problem
- Satu tab hilang, satu duplikat hilang, satu kelas bug (drift antar dua SSOT) hilang

**Yang dijamin:** habis clone, begitu `Site` diisi data tenant, semua `[SRC:…]` ikut tenant itu. Nol isian manual di luar `Site`.

**Yang tidak dijamin:** kalau `Site` Q–X dibiarkan berisi URL tenant lama, hasilnya tetap salah — tapi sekarang cuma ada **satu** tempat yang harus dibenerin, dan tempat itu ada di sebelah VID + nama klien yang jelas-jelas harus diganti.

---

## 4. Token membawa nama kind (bukan page key)

Rencana awal — page key di `Site` baris 1 — **dibatalkan**: baris 1 tidak bisa dipakai (keputusan owner) dan lagi pula terkunci (§2.11).

Gantinya: **`[SRC:…]` isinya nama kind, bukan page key.**

| `Web Screen` | Sekarang | Jadi |
|---|---|---|
| row 14 col G | `[SRC:dashboard]` | `[SRC:# Admin]` |
| row 29 col G | `[SRC:laporanPekerjaan]` | `[SRC:# Laporan Pekerjaan]` |
| row 39 col G | `[SRC:itAdmin]` | `[SRC:# IT Admin]` |

Resolver mencocokkan isi token langsung ke header kind di `Site!$Q$2:$2`.

Yang hilang dengan ini:

- **Tidak perlu baris 1** — terkunci, dan owner bilang tidak bisa dipakai
- **Tidak perlu tab pemetaan** page key → kind
- **Masalah many-to-one lenyap.** `# Admin` melayani `dashboard` *dan* `daftarPegawai`; dua-duanya cukup nulis `[SRC:# Admin]`. Tidak ada lagi `◆`-list yang harus diurai.
- **Tidak ada perubahan schema `Site` sama sekali** untuk 7 kind yang sudah ada — sehingga langkah pertama tidak tersentuh proteksi §2.11

Ongkosnya: 3 sel di `Web Screen` col G, dan token jadi lebih panjang / mengandung spasi + `#`. Aman di `SUBSTITUTE` (pencocokan literal, bukan regex).

`resetDevice` / `resetDeviceTenant` tidak dapat kind — tipe `RESET_DEVICE` tidak punya `src` (§2.6).

### 4.1 Nambah kind baru ke depannya

Urutannya **wajib** begini, karena §2.11:

1. Owner nambah 1 kolom di `Cost Center` (grid sekarang mentok N)
2. Owner buka proteksi `Site` untuk kolom kind yang baru
3. Tulis header kind di `Site!<kolom baru>2`, isi URL di baris 3+
4. Perlebar `Site!P2` supaya ikut menggabungkan kolom baru
5. Verifikasi `Cost Center` G/H masih benar (spill 2 arah, gagal diam-diam kalau kehabisan kolom)
6. `Web Screen` col G tulis `[SRC:<nama kind>]`

Selalu tambah **di ujung kanan** — nyempil di tengah menggeser posisi slot dan merusak `Cost Center` tanpa error.

---

## 5. Resolver baru

Ganti `_Helper Web JSON!C2`. Struktur `MAP`/`REDUCE`-nya tetap; yang berubah cuma sumber page key dan cara ambil URL.

**Daftar token** (ganti `UNIQUE(FILTER('Web URL'!$D$2:$D$101;…))`):

```
TOCOL(Site!$Q$2:$2;1)
```

Header kind itu sendiri yang jadi daftar token. `1` = buang sel kosong. `Site!$Q$2:$2` open-ended ke kanan — nambah kind tidak perlu mengedit resolver. Terverifikasi: `Site` X–Z kosong, jadi tidak ada sampah yang keangkut.

**Resolve satu token `p`** (= nama kind, mis. `# Laporan Pekerjaan`) untuk CC list `ccstr`:

```
LET(
  kcol;  MATCH(p; Site!$Q$2:$Z$2; 0);
  urls;  CHOOSECOLS(Site!$Q$3:$Z; kcol);
  cc;    Site!$D$3:$D;
  sname; Site!$E$3:$E;
  flag;  Site!$M$3:$M;
  ok;    ARRAYFORMULA((urls<>"") * (cc=sname) * REGEXMATCH(LOWER(Site!$H$3:$H);"^active"));
  mine;  IFERROR(INDEX(FILTER(urls; (COUNTIF(SPLIT(ccstr;"◆");cc)>0) * ok);1);"");
  root;  IFERROR(INDEX(FILTER(urls; ARRAYFORMULA(REGEXMATCH(flag;"(^|◆)master($|◆)")) * ok);1);"");
  IF(mine<>"";mine;root)
)
```

Tiga hal di `ok` yang wajib ada — lihat §2.15:

- **`cc=sname`** — hanya baris level cost center. `Site` juga memuat baris level *site* (hirarki §2.13), dan baris site punya nilai `Cost center` yang sama dengan induknya, jadi tanpa penjaga ini sebuah site bisa merebut URL milik cost center-nya. Penjaga yang sama dipakai QUERY tab `Cost Center` (`WHERE D=E`).
- **`REGEXMATCH(LOWER(…);"^active")`** — cocokkan awalan, bukan `=`. Menyamai `Matches 'active.*'` di QUERY `Cost Center`; kalau pakai `=`, status seperti `active-pending` tersaring beda antara dua tab.
- **`ARRAYFORMULA(…)`** — `REGEXMATCH` tidak array-aware sendiri di dalam `LET`/`LAMBDA`.

Ladder-nya: **baris cost center user dulu, kalau kosong jatuh ke baris induk.** Ini yang bikin `laporanPekerjaan` (cuma keisi di baris induk) tetap kebaca user Kantor Pusat.

`MATCH(…;0)` = pencocokan persis, jadi `# Absensi` tidak pernah nyamber `# Rekap Absensi`.

Semua range open-ended ke bawah. Satu-satunya batas ke kanan: `$Q$3:$AZ` (27 slot kind, sekarang kepakai 8). Kalau kind tembus kolom AZ, formula ini harus dilebarin — catat di sini biar gak jadi bug diam-diam kayak `$2:$101`.

**`[CC_OPTIONS:p]`** pakai `LET` yang sama, ganti baris terakhir:

```
TEXTJOIN("◆";TRUE;FILTER(cc&"▶"&urls; (COUNTIF(SPLIT(ccstr;"◆");cc)>0)*(urls<>"")))
```

Sekalian beresin dua bug §2.4: range open-ended (bukan `$2:$101`), dan cabang `"Semua CC"` dibuang — scope "semua CC" sekarang diwakili baris induk lewat fallback `master`, bukan lewat nama cost center ajaib (§2.9).

**Perilaku first-match dipertahankan.** `INDEX(…;1)` tetap dipakai, jadi user multi-CC tetap cuma dapat cost center pertama, persis seperti sekarang (§2.10). Ini disengaja: migrasi harus bisa dibandingkan 1:1. Yang berubah cuma *dari mana* URL diambil, bukan *yang mana* yang dipilih.

Satu perbedaan urutan yang perlu diperhatikan waktu verifikasi: sekarang urutannya ngikut urutan baris `Web URL`, nanti ngikut urutan baris `Site`. Untuk page yang cuma punya satu kandidat, hasilnya identik. Untuk page multi-CC (`attendance`, `rekapAbsensi`, `rekapPayroll`, `dashboard`, `daftarPegawai`) hasilnya bisa beda kalau urutan cost center di kedua tab tidak sama — **wajib dicek di langkah 6.**

**Status uji 2026-08-20:** ladder di atas sudah dijalankan live di sel kosong `_Helper Web JSON!I2` (versi standalone, belum ditanam ke `REDUCE` C2). Hasil untuk keenam user:

```
# Admin = 1XTomLvk  |  # Absensi = 1nEjhqVB  |  # Rekap Absensi = 1thMR9Od  |
# Rekap Payroll = 1ixNarZB  |  # Presensi Hari Ini = 1r2cZvs0  |
# Laporan Pekerjaan = 1BXA0naH  |  # IT Admin = 18ohF8BQ
```

Sesuai prediksi: `laporanPekerjaan` identik dengan sekarang, `# Admin` pindah ke file cost center (§2.13).

**Uji pembeda cost center — LULUS.** Output yang sama untuk semua user tidak membuktikan apa pun, karena Kantor Pusat kebetulan baris pertama di `Site`; filter yang rusak (selalu ambil baris pertama) akan menghasilkan output identik. Pembedanya cuma Product Group. Dijalankan lewat probe `ccstr="Product Group"` di `_Helper Web JSON!I13`:

| Jenis file | ccstr = Kantor Pusat | ccstr = Product Group | |
|---|---|---|---|
| `# Admin` | `1XTomLvk…` | `1yhRupdq…` | beda ✓ |
| `# Absensi` | `1nEjhqVB…` | `1XNtStUS…` | beda ✓ |
| `# Rekap Absensi` | `1thMR9Od…` | `1GY5jS7O…` | beda ✓ |
| `# Rekap Payroll` | `1ixNarZB…` | `1C-BqFJb…` | beda ✓ |
| `# Presensi Hari Ini` | `1r2cZvs0…` | `1r2cZvs0…` | sama — cabang `root` ✓ |
| `# Laporan Pekerjaan` | `1BXA0naH…` | `1BXA0naH…` | sama — cabang `root` ✓ |
| `# IT Admin` | `18ohF8BQ…` | `18ohF8BQ…` | sama — cabang `root` ✓ |

Empat baris atas membuktikan pemilihan per-cost-center; tiga baris bawah membuktikan fallback ke baris master. **Kedua cabang tereksekusi.**

> **Masih belum diuji:** menanam `LET` ini ke dalam `REDUCE` di C2. C2 adalah satu-satunya sumber Web JSON — kalau dia `#ERROR!`, semua user kehilangan menu. Tetap tes di sel kosong dulu.

---

## 6. Urutan migrasi

Tiap langkah bisa diverifikasi sendiri; jangan digabung.

**Langkah 0 — audit grid.** SELESAI 2026-08-20. Hasilnya §2.2, §2.3, §2.11, §2.12.

**Langkah 1 & 2 — DIHAPUS.** Sebelumnya: buka proteksi `Site`, lalu isi `Site!Q<induk>`. Dua-duanya tidak diperlukan lagi setelah keputusan §2.13 (file cost center menang, level tenant tidak punya `# Admin`).

**Design ini tidak menulis apa pun ke tab `Site` maupun `Cost Center`.** Isi `Site` yang sekarang sudah benar apa adanya:

| Yang tadinya mau diubah | Keputusan |
|---|---|
| `Site!Q<induk>` (`# Admin` Induk) | Biarkan kosong (§2.13) |
| `Site!S<KP>` (`# Rekap Absensi` KP) | Biarkan `1thMR9Od…`. Owner konfirmasi rekap absensi beda per cost center → `Site` benar, `Web URL` (KP=PG=`1GY5jS7O…`) salah. Page belum nyala di menu, tidak ada yang terdampak |

**Langkah 3 — tes resolver di sel kosong** (mis. `_Helper Web JSON!H2`), jangan sentuh C2. Bandingkan `[SRC:…]` hasilnya dengan C2 sekarang untuk ketiga baris user.

Perhatian khusus page multi-CC (`attendance`, `rekapAbsensi`, `rekapPayroll`, `dashboard`, `daftarPegawai`): first-match sekarang ikut urutan baris `Web URL`, nanti ikut urutan baris `Site`. Kalau hasilnya beda, itu bukan bug baru — tapi harus **disadari dan disetujui**, bukan kelewat.

**Langkah 4 — cutover.** Perhatikan rantainya:

```
Web Screen col G  →  (paste manual)  →  Web Menu col L/M (STATIC)  →  _Helper C2 substitusi  →  Web JSON
```

Token yang dibaca C2 ada di **`Web Menu` L/M**, bukan di `Web Screen`. Jadi cutover-nya tiga tulisan yang harus berurutan rapat:

1. `Web Screen` col G row 14/29/39 → `[SRC:# Admin]` / `[SRC:# Laporan Pekerjaan]` / `[SRC:# IT Admin]`
2. **`Web Screen For Tenant` col G row 14/29/39 → token yang sama** (§2.16). Kalau dilewat, tiap tenant baru lahir membawa token lama
3. Salin `pageData` hasilnya ke `Web Menu` L/M — **simpan dulu isi lama L/M** untuk rollback
4. Ganti `_Helper Web JSON!C2` dengan resolver baru

**Ada jendela rusak di antara 3 dan 4**: resolver lama tidak kenal `[SRC:# Admin]`, jadi token bocor mentah ke `src`. JSON tetap parse, tapi spreadsheet tidak kebuka. Kerjakan 3 dan 4 berurutan tanpa jeda, di luar jam pakai.

**Langkah 5 — verifikasi.** Ketiga baris user di `_Helper Web JSON` col C parse sebagai JSON, dan setiap `src` sama dengan nilai sebelum migrasi (kecuali yang sudah disetujui di langkah 3).

**Langkah 6 — rename `Web URL` → `Web URL OLD`.** Kalau seminggu tidak ada yang rusak, hapus.

**Rollback:** balikin C2 dari §2.4, balikin `Web Menu` L/M dari salinan langkah 4.3, balikin token `Web Screen` + `Web Screen For Tenant` ke `[SRC:dashboard]` / `[SRC:laporanPekerjaan]` / `[SRC:itAdmin]`. Langkah 3 (tes di sel kosong) aditif, tidak merusak yang jalan.

**Di luar urutan ini** (kerjakan terpisah, jangan digabung):

- `Web Screen` row 56 — URL mentah `1OHqMDgWbFLG…` (§2.7)
- `slipGaji` — URL ke-bake di `Web Menu`, belum pernah lewat `[SRC:]` (§2.12, §8)

---

## 7. Risiko

| Risiko | Mitigasi |
|---|---|
| `C2` error → **semua user kehilangan menu** | Tes di sel kosong dulu (langkah 3); formula lama tersimpan §2.4 |
| Jendela rusak antara paste `Web Menu` dan swap `C2` | Kerjakan berurutan tanpa jeda, di luar jam pakai; simpan L/M lama (langkah 4) |
| Nulis literal ke sel spill (`Site!P3+`, `Cost Center!I2:N`) → `#REF!` menyebar | Sudah dipetakan §2.2 / §2.11; design ini **tidak menulis ke `Site` maupun `Cost Center` sama sekali** |
| Kind ke-8 → `Cost Center` kehabisan kolom, spill mati diam-diam | §2.11 — owner tambah kolom dulu. Scope sekarang tetap 7 jenis file, jadi tidak tersentuh |
| Dashboard + Daftar Pegawai pindah dari file tenant ke file cost center | **Disengaja & disetujui** (§2.13). File cost center selama ini tidak pernah terbuka dari web — verifikasi isinya masuk akal sebelum cutover |
| First-match berpindah karena urutan baris `Site` ≠ `Web URL` | Langkah 3 wajib bandingkan per-user, per-page |
| Onboarding lupa ganti `Site` Q–W → tetap menunjuk tenant lama | **Tidak diselesaikan design ini.** Lihat §8 |

---

## 8. Di luar scope

**Ngosongin `Site` Q–X waktu clone.** Design ini bikin cuma ada satu tempat yang harus benar. Yang mastiin tempat itu *diisi* adalah proses clone — dan itu punya user, bukan bagian dari perubahan sheet.

Yang direkomendasikan (bukan bagian spec ini): script clone ngosongin `Site` Q–X. URL kosong → page rusak keliatan. Jauh lebih murah daripada diam-diam nyambung ke data tenant lain dengan izin tulis.

**Provisioning otomatis** (script copy file template + nangkep ID hasilnya ke `Site`). Ditunda — sekarang cuma `laporanPekerjaan` yang dipakai tenant, jadi cuma 1 URL per tenant. Baru layak dibangun kalau menu lain nyala (7+ kind × N cost center).

**Mindahin 4 halaman ber-URL-mentah ke `[SRC:]`** (§2.7): Pendaftaran Pegawai, PHK, Mutasi, Slip Gaji. Keempatnya akan tetap menunjuk file tenant lama setelah clone.

Ini **lubang yang lebih besar dari yang ditutup design ini** — 4 halaman menempel URL vs 3 halaman yang lewat `[SRC:]`. Tapi memindahkannya butuh jenis file baru di `Site`, dan itu terhalang batas kolom `Cost Center` (§2.11) yang cuma bisa dibuka owner.

Tiga di antaranya (Pendaftaran Pegawai, PHK, Mutasi) menunjuk file yang **sama** (`1OHqMDgWbFLG…`), jadi kemungkinan cukup satu jenis file baru untuk ketiganya — bukan tiga.

**Picker cost center buat user multi-CC** (§2.10). User dengan 2+ cost center cuma lihat yang pertama; sisanya tidak bisa diakses sama sekali. Perbaikannya kemungkinan pakai `[CC_OPTIONS:page]` yang sudah ada di resolver + widget DROPDOWN yang ganti `src` on-change — butuh dukungan renderer, jadi fitur sendiri. Sengaja tidak disentuh di sini supaya migrasi bisa diverifikasi 1:1.

---

## 9. Pertanyaan terbuka — semua terjawab 2026-08-20

| # | Pertanyaan | Jawaban |
|---|---|---|
| 1 | `Site` kolom M manual atau rumus? | **Literal manual** (`"vtl◆master"`). Aman jadi kunci, tapi cocokkan pakai regex — prefix `vtl` itu kode tenant (§2.3) |
| 2 | slipGaji `1lYsl2MG…` atau `1FQqc6KI…`? | **`1FQqc6KI…`** (owner). Ternyata di-bake di `Web Menu`, tidak pernah lewat `[SRC:]`. Baris `Web URL`-nya data yatim (§2.12) |
| 3 | rekapAbsensi Kantor Pusat yang mana? | Owner: rekap absensi **beda per cost center** → `Site` yang benar (KP `1thMR9Od…`, PG `1GY5jS7O…`), `Web URL` salah (§2.8, langkah 2) |
| 4 | `Cost Center` H..N split posisional? | **Ya**, spill 2 arah dari `H2`. Grid mentok 14 kolom → kind ke-8 butuh kolom baru (§2.11) |
| 5 | `Site` baris 1 bisa dipakai? | **Tidak** (owner) — dan memang terkunci. Diganti: token yang membawa nama kind (§4) |

### Sisa yang butuh owner (bukan pertanyaan, tapi aksi)

1. **Cutover** langkah 4 §6 — `Web Menu` L/M static, butuh salinan sebelum-sesudah, dan ada jendela rusak singkat
2. **Verifikasi isi `1XTomLvk…` dan `1yhRupdq…`** sebelum cutover. Dua file itu selama ini tidak pernah terbuka dari web (§2.13); pastikan tab dan layoutnya cocok untuk halaman Dashboard + Daftar Pegawai
3. **Tambah kolom `Cost Center`** — hanya kalau/ketika jenis file ke-8 jadi dibuat (§2.11)

### Yang TIDAK lagi dibutuhkan

- ~~Buka proteksi `Site`~~ — design ini tidak menulis ke `Site` (§2.13)
- ~~Isi `Site!Q<induk>`~~ — level tenant memang tidak punya file `# Admin`
