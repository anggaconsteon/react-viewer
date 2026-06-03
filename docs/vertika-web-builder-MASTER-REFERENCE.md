# Vertika Web Builder — MASTER REFERENCE (single source of truth)

> **Untuk AI sesi baru:** baca dokumen ini DULUAN sebelum menyentuh apa pun.
> Ini snapshot lengkap dari awal sampai checkpoint terakhir. Setelah baca ini kamu
> harus langsung paham: spreadsheet mana, idiom formula apa yang dipakai, arsitektur
> tab, semua formula kunci, dan apa yang SUDAH selesai. Jangan minta user menjelaskan
> ulang dari nol.

---

## 0. CHECKPOINT TERAKHIR (status per 2026-06-01)

Semua di bawah ini **SUDAH SELESAI & TERVERIFIKASI live**:

1. ✅ Seluruh idiom `MAP/LAMBDA/LET/CHAR(34)/INDEX/MATCH/ISTEXT` sudah **dibuang**, diganti idiom op1Screen (template `[TOKEN]` + VLOOKUP + chained SUBSTITUTE). Backup formula MAP lama: `docs/vertika-web-menu2-MAP-backup-2026-06-01.md`.
2. ✅ `Web JSON` output per-user benar:
   - surya → `costCenters:"Induk"`, `children:[]` (RBAC semua FALSE)
   - denny → Dashboard + Attendance + Request&Approval
   - dyani → Request&Approval saja, CC=`Induk◆Kantor Pusat◆Product Group`
   - rika → Dashboard saja, CC kosong
3. ✅ Bug B1 (RBAC-bypass: page nempel ke semua user) **FIXED** — page didaftarkan sebagai node Level-2 di `Web Menu 2` jadi ikut RBAC menu.
4. ✅ **Auto-sync** `Web JSON` jalan: tambah orang di `Otorisasi Menu Web` (wajib isi kolom Akun Gmail) → baris `Web JSON` otomatis keisi. Pakai **buffer pattern** (per-row formula baris 6-25), bukan spill.
5. ✅ Token `[CC_LIST]` resolve per-user di `Web JSON` (1× SUBSTITUTE terakhir mengisi SEMUA kemunculan).
6. ✅ Probe column observability ditambah di `_Helper Web JSON!D` (lihat §10).

**Yang BELUM (opsional, tunggu perintah user):**
- Hide tab `_Helper Web JSON`.
- Isi email untuk Deardo/Angga/Oki di `Otorisasi Menu Web` (sekarang kosong → mereka tidak muncul di Web JSON, by design karena sistem key by gmail login).

---

## 1. Identitas spreadsheet

| Hal | Nilai |
|---|---|
| **VTL master (AKTIF, kerja di sini)** | `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` |
| Locale | in_ID → **pemisah argumen formula = `;`** (bukan `,`) saat ditulis live |
| Timezone | Asia/Jakarta |
| Mode tulis | User otorisasi **tulis langsung live** via gsheets MCP untuk tuning iteratif |
| Spreadsheet lama (SUPERSEDED) | `1uWKx...` — jangan dipakai lagi |
| Sumber idiom (proxy op1Screen) | `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` |

### Perbandingan 2 spreadsheet (kenapa pindah)
- Spreadsheet **lama `1uWKx...`**: arsitektur awal, formula pakai MAP/LAMBDA (susah dibaca user).
- Spreadsheet **baru `14kDPqAw...`** (VTL master): refactor 2026-05-20, 42 tab, mirror pola op1Screen mobile tapi untuk **web**. Inilah yang aktif.
- **op1Screen proxy `18v3w5YJ...`**: BUKAN tempat kerja — ini **sumber gaya/idiom**. User minta web builder meniru cara proxy: producer cell "dumb", logika di template string + SUBSTITUTE. Proxy & VTL master sama-sama pakai **tab terpisah** untuk compute antara (mis. `_Helper Approval`, `helper dashboard`, `Filter`) — BUKAN hidden column. Makanya `_Helper Web JSON` dibikin tab sendiri.

---

## 2. IDIOM op1Screen (ATURAN MUTLAK)

User **tidak suka** dan **dilarang** pakai: `MAP`, `LAMBDA`, `LET`, `CHAR(34)`, `INDEX`, `MATCH`, `ISTEXT`.

**Boleh:** `VLOOKUP`, `FILTER`, `COUNTIF`, `TEXTJOIN`, `SUBSTITUTE`, `IFERROR`, `IF`, `OR`, `ISNUMBER`, `ARRAYFORMULA`.

**Pola inti:**
```
template string ber-[TOKEN] di tab helper  →  VLOOKUP ambil template  →  chained SUBSTITUTE isi tiap token
```
Producer cell tetap "bodoh": dia cuma nyolok nilai ke lubang `[TOKEN]`. Tidak ada string-building manual pakai `&"..."&q&...`.

**Konsekuensi MCP penting:** `update_cells`/`batch_update_cells` **TIDAK** auto-adjust relative ref. Jadi setiap formula per-row **harus ditulis dengan nomor baris eksplisit** (tidak bisa tulis 1 lalu copy-down via MCP). Spill cell boleh direferensi by address (mis. `$A2`).

---

## 3. Arsitektur tab & alur pipeline

```
DEFINE SEKALI (user-agnostic, ber-[CC_LIST])          RESOLVE PER USER
┌───────────────────────────────────────┐         ┌──────────────────────────┐
│ Web Widget   → gudang template [TOKEN] │         │ _Helper Web JSON         │
│ Web Screen   → susun widget jadi page  │  ────►  │  - spill email & VID     │
│ Web Menu 2   → pohon menu (L1/L2/L3)   │ [CC_LIST]│  - join CC per user      │
│ Otorisasi*   → matrix RBAC TRUE/FALSE  │  utuh   │  - children gated RBAC   │
└───────────────────────────────────────┘         └────────────┬─────────────┘
                                                                │
                                                   ┌────────────▼─────────────┐
                                                   │ Web JSON (buffer 6-25)   │
                                                   │  envelope + SUBSTITUTE    │
                                                   │  [CC_LIST]→CC user → 1 row│
                                                   │  per user                 │
                                                   └──────────────────────────┘
```

Urutan kerja build:
1. `Web Widget` — pastikan komponen ada (DROPDOWN/BUTTON_SUBMIT/dst).
2. `Web Screen` — tulis baris widget + isi param; **biarkan `[CC_LIST]` utuh**.
3. `Web Menu 2` — daftarkan page sebagai node (Level-1/2/3) di pohon menu.
4. `Otorisasi Cost Center 2` + `Otorisasi Menu Web` — centang TRUE/FALSE per user.
5. `_Helper Web JSON` — compute per-user (email, CC, children-gated-RBAC).
6. `Web JSON` — envelope + resolve `[CC_LIST]`, 1 baris per user (auto-sync buffer).

---

## 4. Schema tiap tab

### 4.1 `Web Widget` (gudang template) — mirror sheet `Widget` referensi (2026-06-01)
Layout dimiripin sheet `Widget` op1Screen. **Template ("Base JSON") pindah col G→J.**
| Kol | Header | Isi |
|---|---|---|
| A | `Widget name` | kunci VLOOKUP |
| B | `paramList` | daftar token bernama (CSV) — info doang |
| C–F | — | kosong (referensi pakai Parameter 2-5) |
| G | `JSON` | contoh resolved JSON (eyeball; `[CC_LIST]` dibiarkan utuh) |
| H | index map | `◆<name>▶Web Widget!J<row>`; H1 = list penuh ◆-join |
| I | `Widget name` | ulang col A |
| J | `Base JSON` | **TEMPLATE ber-`[TOKEN]`** (yang dibaca VLOOKUP Web Screen, kol ke-10) |

Template existing (di col **J**): DROPDOWN, DATE, SPACER, BUTTON_SUBMIT.
**Row 6 = `PAGE_ENVELOPE`** (ditambah 2026-06-01): template page-level skeleton, dipakai col B `Web Screen` (assembler header). A6=`PAGE_ENVELOPE`, B6=paramList `LABEL,ICON,PATH,KEY,PARENT,TITLE,TB_ALIGN,CONTENT,BT_ALIGN,TB_CHILDREN,BT_CHILDREN`, J6=Base JSON template (**polymorphic content sejak 2026-06-01:** blok konten jadi 1 token `[CONTENT]`, bukan `spreadsheet` hardcode):
```
{"label":"[LABEL]","icon":"[ICON]","path":"[PATH]","key":"[KEY]","parent":"[PARENT]","pageData":{"title":"[TITLE]","topbar":{"alignment":"[TB_ALIGN]","children":[[TB_CHILDREN]]},[CONTENT],"bottomBar":{"alignment":"[BT_ALIGN]","children":[[BT_CHILDREN]]}}}
```

**CONTENT registry — kol `K:L` (ditambah 2026-06-01).** Tabel keyed buat resolve `[CONTENT]` per contentType. *(Catatan: ditaruh di K:L, bukan baris baru col A row 7+, karena grid `Web Widget` mentok 6 baris dan MCP gsheets gak punya tool extend-grid/insert-row. K:L masih dalam 26 kol.)* Header K1=`CONTENT type`, L1=`CONTENT template`:
| Key (col K) | Template (col L) |
|---|---|
| `CONTENT_SPREADSHEET` | `"spreadsheet":{"id":"mainContent","src":"[SRC]","permission":"[PERM]"[SS_EXTRA]}` |
| `CONTENT_MAP` | `"map":{"id":"mainContent","lat":[LAT],"lng":[LNG],"zoom":[ZOOM]}` |

Producer Web Screen pilih template via `VLOOKUP("CONTENT_"&UPPER($C{r});'Web Widget'!$K$2:$L$3;2;FALSE)` di mana `$C{r}` = contentType baris header (`spreadsheet`/`map`). **Tambah type baru** (mis. `others`) = tambah 1 baris di K:L (`CONTENT_OTHERS` + template ber-`[TOKEN]`) + tambah branch SUBSTITUTE token-nya di producer B{r}. Meta kol U–AE dipakai ulang per type: spreadsheet→Y=src/Z=perm/AA=rowHeader/AB=rowStartData/AC=sheetName; map→Y=lat/Z=lng/AA=zoom.

### 4.2 `Web Screen` (susun page) — kolom A:AE (31 kol)
- A–F struktural: pageKey/order, widgetName/pageJSON, section, widgetJSON, `JSON--`, Displayed
- G–T: 14 kol param `[KEY][CELL][PLACEHOLDER][OPTIONS][EMPTY_TEXT][VARIANT][TEXT][DATA][ICON][TARGET][API_URL][SUCCESS][ERROR][THEN]`
- U–AE: 11 meta page (baris header saja): label, icon, path, parent, src, permission, rowHeader, rowStartData, sheetName, topbarAlign, bottomAlign
- 1 page = **1 baris header** (col A non-numerik = pageKey) + **N baris widget** (col A numerik = order) sampai header berikut.
- **Registry mulai row 27** (restructure 2026-06-01, mirror op1Screen): rows 1–~24 = blok meta (label + version string C1) di atas; page pertama `patrolReport` header @ row 27 (widget 28–31), `salesPerformance` @ row 32 (widget 33–35). Cell error orphan op1Screen (C3, B6:B13 theme, B16/B17 GPS/Selfie, B19, A25:B25) sudah dibersihkan 2026-06-01.
- Peran kolom (terverifikasi live 2026-06-01):
  - **Col B** baris header = **assembler pageData** (idiom bersih sejak 2026-06-01: VLOOKUP `PAGE_ENVELOPE` + 11× SUBSTITUTE outer; salah satunya `[CONTENT]` di-resolve nested VLOOKUP `CONTENT_<type>` + 6× SUBSTITUTE, lihat §5). Baris widget col B = nama widget (DROPDOWN/DATE/dst).
  - **Col C** baris header = **contentType** (`spreadsheet`/`map`/...) — nyetir VLOOKUP `[CONTENT]`. Baris widget col C = section (`topbar`/`bottomBar`). Header C kosong = default; isi `spreadsheet` eksplisit biar jelas.
  - **Col D** baris header = literal `"JSON--"` (label, bukan formula). Baris widget col D = **resolver `VLOOKUP + 14× SUBSTITUTE`** (per-row, idiom bener).
  - **Col E** = 1 ARRAYFORMULA di E2 (spill). Header → `"JSON"`; baris widget → `","&D` (versi koma-prefix buat di-join assembler B).
- Author intent token: tulis `[CC_LIST]` di col J `[OPTIONS]`, mis. `Semua◆[CC_LIST]`. Biarkan utuh di sini.
- **✅ WART col B SUDAH DIROMBAK 3× (2026-06-01):** dulu `LET/MATCH/INDIRECT/MID` (outlier langgar §2). Lalu idiom bersih VLOOKUP `PAGE_ENVELOPE` + 13× SUBSTITUTE bounded. Sekarang (refactor ke-3) **content polymorphic**: blok `spreadsheet` jadi token `[CONTENT]`, di-resolve VLOOKUP `CONTENT_<type>` (K:L) → 11× SUBSTITUTE outer + 6× SUBSTITUTE nested. **Deteksi blok widget milik page = range page-local bounded** (idiom op1Screen B128): `FILTER($E$<h+1>:$E$<last>; $C$<h+1>:$C$<last>="topbar"/"bottomBar")` — `<h+1>` baris widget pertama, `<last>` baris widget terakhir page itu. **Tidak pakai stempel pageKey lagi**. Output byte-identical buat type `spreadsheet` (terverifikasi patrolReport B27 + salesPerformance B32); switch ke `map` terverifikasi (toggle C32 → emit blok `"map":{...}`). Lihat §5.
- **⚠️ DEPRECATED — `_Helper Web Screen` (sheetId 287818472):** dulu stempel pageKey carry-down buat FILTER col B. **Sudah TIDAK dipakai** sejak col B pindah ke range bounded (2026-06-01). Tab masih ada tapi vestigial (cuma baca `Web Screen`, gak ada yang baca dia). Aman dihapus manual (right-click → delete tab); MCP gsheets gak punya tool delete-sheet.

### 4.3 `Web Menu 2` (sheetId 818409044) — pohon menu
Kolom: A=#, B=Level, C=Main Menu, D=Sub Menu, E=Detail Menu, F=Label, G=Icon, H=Path, I=urlSheet, J=Parent Menu, K=Menu Key, L=Detail JSON(L3), M=Sub JSON(L2), N=Main JSON(L1), **O=Display (TRUE/FALSE)**.

Layout baris aktual (terverifikasi):
| Row | Node | Level |
|---|---|---|
| 2 | Dashboard | L1 |
| 3 | Workforce | L1 |
| 4-7 | Daftar Pegawai / Pendaftaran / Perubahan Data / Mutasi | L2 |
| 8 | PHK | L3 |
| 9 | Attendance | L1 |
| 10-11 | Log Presensi / Detail Presensi | L2 |
| 12 | Operations | L1 |
| 13-14 | Task & Assignment / Monitoring | L2 |
| 15 | Reports | L1 |
| 16-19 | Reports L2 | L2 |
| 20 | Request & Approval | L1 |
| 21-22 | All Requests / Approval Queue | L2 |
| 23 | **Patrol Report** (parent=Operations, key=patrolReport) | L2 |
| 24 | **Sales Performance** (parent=Reports) | L2 |

Semua `O=TRUE`. Nesting 3-tier: L (L3) ← M (L2) ← N (L1), digabung via child's Parent Menu (col J) = parent's Label (col F) lewat FILTER. **Resolver akhir cuma baca node Level-1 (col N).**

### 4.4 `Otorisasi Cost Center 2` (matrix user × CC)
v2: email di kolom D, CC di header kolom E-G (range `E1:G1` header, `E2:G` data). `TRUE` = user punya CC itu.

### 4.5 `Otorisasi Menu Web` (matrix user × menu) — RBAC menu
- Header row 2; data rows 3+.
- Kol: A=#, B=Nama-NIP, C=VID, D=Akun Gmail, **E-J = label Level-1**: Dashboard / Workforce / Attendance / Operations / Reports / Request&Approval.
- **PENTING:** kolom RBAC ini cuma **grup Level-1**. Page Level-2 (Patrol di bawah Operations, Sales di bawah Reports) di-gate oleh toggle L1 induknya, BUKAN per-page. Mau matiin 1 page global → pakai Display col O di `Web Menu 2`.
- 7 orang: surya(suryawdj@gmail.com), denny(dsambas@vertesc.com), dyani(dyani.saryono@gmail.com), Deardo(email KOSONG), Angga(KOSONG), Oki(KOSONG), rika(rika39538@gmail.com).
- **Sistem key by Akun Gmail.** Email kosong = user tidak masuk Web JSON.

### 4.6 `_Helper Web JSON` (sheetId 635207194) — compute per-user (TAB TERPISAH)
| Sel | Isi |
|---|---|
| A1:C1 | header `["Akun Gmail","costCenters","children"]` |
| **A2** (spill email) | `=IFERROR(FILTER('Otorisasi Menu Web'!$D$3:$D;'Otorisasi Menu Web'!$D$3:$D<>"");"")` |
| **B2:Bn** (CC join) | per-row, lihat §5 |
| **C2:Cn** (children gated RBAC) | per-row, lihat §5 — `[CC_LIST]` dibiarkan utuh |
| **D1:Dn** (probe debug) | tampil label L1 yang diizinkan per user, buat eyeball test (§10) |
| **E1** (envelope template) | template MENU ber-token, lihat §5 |
| **F1:F2** (spill VID auto) | `=IFERROR(FILTER('Otorisasi Menu Web'!$C$3:$C;'Otorisasi Menu Web'!$D$3:$D<>"");"")` — sejajar baris dgn email A2 |
| H1 (leaf L3 template) | `{"label":"[LABEL]","icon":"[ICON]","path":"[PATH]","key":"[KEY]","urlSheet":"[URLSHEET]","parent":"[PARENT]"}` |
| H3 (branch L2) | sama + `,"children":[[CHILDREN]]}` |
| H4 (root L1) | `{"label":"[LABEL]","icon":"[ICON]","path":"[PATH]","key":"[KEY]","urlSheet":"[URLSHEET]","children":[[CHILDREN]]}` |

### 4.7 `Web JSON` (OUTPUT, 1 baris/user)
- Rows 1-4 metadata: B1=name "Vertika Tekno Lokacipta", B2=desc "Field Operations Platform", B3=logo URL, E3="Consteon" (Provider).
- Row 5 header: A=VID, B=Akun Gmail, C=JSON.
- **Rows 6-25 = buffer auto-sync** (per-row formula). Web JSON row r ↔ helper row (r-4).

---

## 5. Formula kunci (EXACT — locale `;`)

> Saat menulis live pakai `;`. Kalau dibaca balik lewat MCP, Google bisa tampilkan `,` — normal.

### `Web Screen` producers (terverifikasi live 2026-06-01)

**Col D{r} — widget resolver (baris widget, per-row).** Idiom bener: VLOOKUP template + 14× SUBSTITUTE. Semua baris widget identik bentuknya, ganti nomor baris saja.
```
=IF(NOT(ISNUMBER(A3));"";IF(B3="";"";SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(VLOOKUP(B3;'Web Widget'!$A:$J;10;FALSE);"[KEY]";G3);"[CELL]";H3);"[PLACEHOLDER]";I3);"[OPTIONS]";J3);"[EMPTY_TEXT]";K3);"[VARIANT]";L3);"[TEXT]";M3);"[DATA]";N3);"[ICON]";O3);"[TARGET]";P3);"[API_URL]";Q3);"[SUCCESS]";R3);"[ERROR]";S3);"[THEN]";T3)))
```

**Col E2 — ARRAYFORMULA spill (1 cell, isi seluruh kolom E).** Header → `"JSON"`; widget → `","&D` (koma-prefix buat join).
```
=ARRAYFORMULA(IF(A2:A1000="";"";IF(NOT(ISNUMBER(A2:A1000));"JSON";IF(ISERROR(D2:D1000);"";IF(D2:D1000="";"";IF(F2:F1000<>TRUE;"";","&D2:D1000))))))
```

**Col B{r} — page-header pageData assembler (baris header). ✅ IDIOM BERSIH + BOUNDED + POLYMORPHIC CONTENT (refactor 2026-06-01, idiom op1Screen B128).** VLOOKUP template `PAGE_ENVELOPE` (Web Widget J6) + **11× SUBSTITUTE outer**. Token meta langsung dari U{r}:AE{r}. **`[CONTENT]` di-resolve nested:** `VLOOKUP("CONTENT_"&UPPER($C{r});'Web Widget'!$K$2:$L$3;2;FALSE)` (pilih template per contentType) + **6× SUBSTITUTE** (`[SRC]/[PERM]/[SS_EXTRA]` buat spreadsheet, `[LAT]/[LNG]/[ZOOM]` buat map — token yang gak ada di template kepilih = no-op). `[SS_EXTRA]` = bagian opsional `,"rowHeader":..,"rowStartData":..,"sheetName":".."` (3 IF rakit per AA/AB/AC). `[TB_CHILDREN]`/`[BT_CHILDREN]` = **FILTER range page-local bounded** (`$E$<h+1>:$E$<last>` widget rows page itu) by section, TEXTJOIN, strip koma awal via MID. **Tidak ada LET/MATCH/INDIRECT, tidak ada stempel `_Helper Web Screen`.** Tiap baris header punya formula sendiri (ganti nomor baris header + range widget page). Contoh **B27 (patrolReport, header@27, widget 28–31, C27=`spreadsheet`)** — live & terverifikasi:
```
=IF(OR(A27="";ISNUMBER(A27));"";SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(VLOOKUP("PAGE_ENVELOPE";'Web Widget'!$A:$J;10;FALSE);"[LABEL]";U27);"[ICON]";V27);"[PATH]";W27);"[KEY]";A27);"[PARENT]";X27);"[TITLE]";U27);"[TB_ALIGN]";AD27);"[CONTENT]";SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(VLOOKUP("CONTENT_"&UPPER($C27);'Web Widget'!$K$2:$L$3;2;FALSE);"[SRC]";Y27);"[PERM]";Z27);"[SS_EXTRA]";IF(AA27<>"";",""rowHeader"":"&AA27;"")&IF(AB27<>"";",""rowStartData"":"&AB27;"")&IF(AC27<>"";",""sheetName"":"""&AC27&"""";""));"[LAT]";Y27);"[LNG]";Z27);"[ZOOM]";AA27));"[BT_ALIGN]";AE27);"[TB_CHILDREN]";IFERROR(MID(TEXTJOIN("";TRUE;FILTER($E$28:$E$31;$C$28:$C$31="topbar"));2;50000);""));"[BT_CHILDREN]";IFERROR(MID(TEXTJOIN("";TRUE;FILTER($E$28:$E$31;$C$28:$C$31="bottomBar"));2;50000);"")))
```
B32 (salesPerformance) sama, ganti meta U32:AE32, `UPPER($C32)`, range widget `$E$33:$E$35`/`$C$33:$C$35`.
Urutan SUBSTITUTE penting: `[TB_CHILDREN]`/`[BT_CHILDREN]` disubstitusi **paling akhir** (outermost) supaya token meta yang mungkin nyangkut di string children (mis. `[CC_LIST]` di options dropdown) **tidak** ikut tergantikan — `[CC_LIST]` tetap utuh sampai Web JSON. **Gotcha quoting (BIKIN ERROR DI SESI INI):** literal `,"sheetName":"<val>"` — penutup kutip value = string literal `""""` (**4 kutip** = open + `""` escaped + close → 1 char `"`); kalau salah tulis **5 kutip** (`"""""`) → string gak ketutup → `#ERROR! Formula parse error`. `,"rowHeader":` berakhir `:` (value angka, tanpa kutip) jadi cukup `:"`. **Gotcha paren:** `[CONTENT]` resolver nested net-0 (6 buka = 6 tutup di dalam) lalu butuh `)` ekstra nutup SUBSTITUTE `[CONTENT]` → cari pola `AA27))` (dobel). Total **34 buka = 34 tutup**; ekor formula `...50000);"")))` (3 paren).

**⚠️ DEPRECATED — `_Helper Web Screen!A{r}` (stempel pageKey carry-down):** dulu mirror baris Web Screen buat FILTER col B. **Sudah tidak dipakai** sejak col B pindah bounded page-local. Tab vestigial, aman dihapus manual.

### `_Helper Web JSON!B2` (CC join per user, isi ke B2:Bn)
```
=IF($A2="";"";IFERROR(TEXTJOIN("◆";TRUE;FILTER('Otorisasi Cost Center 2'!$E$1:$G$1;FILTER('Otorisasi Cost Center 2'!$E$2:$G$1000;'Otorisasi Cost Center 2'!$D$2:$D$1000=$A2)=TRUE));""))
```

### `_Helper Web JSON!C2` (children gated RBAC, isi ke C2:Cn) — **ini join RBAC, fix bug B1**
```
=IF($A2="";"";IFERROR(TEXTJOIN(",";TRUE;FILTER('Web Menu 2'!$N$2:$N$200;('Web Menu 2'!$B$2:$B$200=1)*('Web Menu 2'!$O$2:$O$200=TRUE)*(COUNTIF(FILTER('Otorisasi Menu Web'!$E$2:$Z$2;FILTER('Otorisasi Menu Web'!$E$3:$Z$1000;'Otorisasi Menu Web'!$D$3:$D$1000=$A2)=TRUE);'Web Menu 2'!$F$2:$F$200)>0)));""))
```
Logika: ambil node L1 (`B=1`) yang Display ON (`O=TRUE`) DAN label-nya (`F`) ada di daftar menu TRUE milik user. `[CC_LIST]` tetap utuh di sini.

### `_Helper Web JSON!E1` (envelope template)
```
{"type":"MENU","name":"[NAME]","description":"[DESC]","logoUrl":"[LOGO]","email":"[EMAIL]","costCenters":"[CC_LIST]","footer":"Powered by [PROVIDER]","children":[[CHILDREN]]}
```

### `Web Menu 2` producer L/M/N (per-row IF + SUBSTITUTE)
- L{r} (Detail/L3): `=IF($B{r}<>3;"";SUBSTITUTE(...H1 template...))`
- M{r} (Sub/L2): `=IF($B{r}<>2;"";...)` — punya **cabang Web Screen**: `IF(COUNTIF('Web Screen'!$A:$A;$K{r})>0; VLOOKUP($K{r};'Web Screen'!$A:$B;2;FALSE); generic-template)` → narik full page node yg bawa `[CC_LIST]` utuh.
- N{r} (Main/L1): `=IF($B{r}<>1;"";...)` — kumpulin children L2 via FILTER yang di-AND dengan `($O$2:$O$200=TRUE)`.

### `Web JSON!C6` (envelope per-row, resolve [CC_LIST]) — pola untuk baris r
```
=IF($B6="";"";SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE('_Helper Web JSON'!$E$1;"[NAME]";$B$1);"[DESC]";$B$2);"[LOGO]";$B$3);"[PROVIDER]";$E$3);"[EMAIL]";$B6);"[CHILDREN]";IFERROR(VLOOKUP($B6;'_Helper Web JSON'!$A:$C;3;FALSE);""));"[CC_LIST]";IFERROR(VLOOKUP($B6;'_Helper Web JSON'!$A:$C;2;FALSE);"")))
```
`$B$1/$B$2/$B$3/$E$3` fixed (metadata); `$B{r}` ganti per baris.

---

## 6. Token `[CC_LIST]` — urutan SUBSTITUTE WAJIB

`[CHILDREN]` disubstitusi **SEBELUM** `[CC_LIST]`. Jadi setelah children dimasukkan ke envelope, SUBSTITUTE `[CC_LIST]` terakhir (1×) mengisi **SEMUA** kemunculan sekaligus: `costCenters` di envelope **plus** tiap dropdown `[CC_LIST]` di dalam children. Hasil: user A lihat CC dia, user B lihat CC dia.

---

## 7. Auto-sync (buffer pattern)

**Masalah lama:** email/VID di Web JSON diketik statis → tambah orang ≠ nambah baris.

**Solusi:** buffer per-row formula baris 6-25 (BUKAN spill; spill bentrok & MCP susah clear cell). Tiap baris guard `IF(key="";"";...)`.

- `Web JSON!A{r}` (VID): `=IF('_Helper Web JSON'!$A{n}="";"";'_Helper Web JSON'!$F{n})` (n = r-4)
- `Web JSON!B{r}` (email): `=IF('_Helper Web JSON'!$A{n}="";"";'_Helper Web JSON'!$A{n})`
- `Web JSON!C{r}` (envelope): formula §5, ganti `$B6`→`$B{r}`.

Helper spill A2 (email) & F2 (VID) pakai filter kondisi sama (`Otorisasi Menu Web!$D$3:$D<>""`) → sejajar baris. Tambah orang ber-email di Otorisasi → spill nangkep → baris buffer Web JSON kosong berikut keisi otomatis.

**Kalau buffer penuh (>20 user):** extend baris (A26:C…) dengan pola per-row yang sama (ingat: nomor baris eksplisit, MCP tak auto-adjust).

---

## 8. Display gate (col O Web Menu 2)
Global on/off per node. String `"TRUE"` via USER_ENTERED jadi boolean TRUE (confirmed). Di-AND `($O$2:$O$200=TRUE)` di FILTER M+N dan helper C. Set FALSE → node hilang dari semua user (beda dari RBAC yang per-user).

---

## 9. Opsi A — page sebagai node Level-2 (bug B1 FIXED)
Patrol Report (row 23, parent=Operations) & Sales Performance (row 24, parent=Reports) didaftar sebagai L2 `Web Menu 2` → ikut RBAC menu lewat induk L1-nya. Dulu page nempel ke SEMUA user (bug). Sekarang user yang Operations-nya FALSE tak dapat Patrol.

**Cosmetic (fungsional OK):** node Patrol/Sales bawa `"parent":"patrol"/"salesMarketing"` internal dari Web Screen walau di-nest di Operations/Reports — app pakai tree nesting bukan parent string. Leaf L2 emit `"children":[]`.

---

## 10. Observability / cara TEST
JSON cell raksasa → mustahil eyeball diff. Itu sebabnya ada **probe column** `_Helper Web JSON!D`:
```
D2: =IF($A2="";"";IFERROR(TEXTJOIN(", ";TRUE;FILTER('Otorisasi Menu Web'!$E$2:$J$2;FILTER('Otorisasi Menu Web'!$E$3:$J$1000;'Otorisasi Menu Web'!$D$3:$D$1000=$A2)=TRUE));"(kosong)"))
```
Tampil label L1 yang diizinkan per user. **Cara test perubahan RBAC:** uncheck di Otorisasi Menu Web → lihat kolom D helper berubah (bukan baca JSON mentah). Catatan: kalau menu di-uncheck semua, children jadi `[]` (kosong, valid) — bukan bug.

---

## 11. Pegawai tanpa email (Deardo/Angga/Oki)
Tidak muncul di Web JSON **by design** — sistem key by gmail login. Isi kolom Akun Gmail di Otorisasi → otomatis nongol di baris buffer berikutnya.

---

## 12. File terkait
- Memory: `…/memory/web_builder_pattern.md` (ringkas, index di MEMORY.md)
- Walkthrough konsep 1-page-2-user: `docs/vertika-web-pipeline-walkthrough.md`
- Backup formula MAP lama (revert kalau perlu): `docs/vertika-web-menu2-MAP-backup-2026-06-01.md`
- Spec & plan: `docs/superpowers/specs/2026-05-26-web-builder-sheet-design.md`, `docs/superpowers/plans/2026-05-26-web-builder-sheet.md`

---

## 13. Changelog keputusan (kenapa, biar AI paham konteks)
- **2026-05-20** Pindah ke VTL master `14kDPqAw...` (42 tab) dari `1uWKx...`.
- **2026-05-26** Pola web builder 3-tab (Web Widget + Web Screen + Web JSON) diimplementasi mirror op1Screen.
- **2026-06-01** Rewrite idiom: buang MAP/LAMBDA/CHAR34/INDEX/MATCH → template+VLOOKUP+SUBSTITUTE. Backup disimpan.
- **2026-06-01** Bug B1 (RBAC-bypass) fix via Opsi A (page jadi node L2).
- **2026-06-01** Display gate col O ditambah.
- **2026-06-01** Probe column D ditambah (observability).
- **2026-06-01** Auto-sync buffer pattern (Web JSON baris 6-25 + helper VID spill F) — tambah orang auto-nambah baris.
- **Keputusan helper:** tetap **tab terpisah** `_Helper Web JSON`, bukan hidden column — sesuai precedent live (`_Helper Approval`, `helper dashboard`, `Filter` di VTL master; proxy op1Screen juga tab-per-stage).
- **2026-06-01** Mirror `Web Widget` ke sheet `Widget` referensi: template ("Base JSON") pindah col G→J; G jadi JSON sample; tambah H index map + I name-repeat + header `Widget name`/`JSON`/`Base JSON`. Repoint semua VLOOKUP Web Screen (col D resolver + col B assembler) dari `$A:$G;7` → `$A:$J;10`. Alasan: user minta layout sebaris sama op1Screen `Widget`. Mirror kosmetik; fungsional output byte-identical. Param kita bisa >5 jadi B tetap CSV bernama (bukan Parameter 1-5 positional).
- **2026-06-01** Refactor col B `Web Screen` (page assembler): buang `LET/MATCH/INDIRECT/MID` → VLOOKUP `PAGE_ENVELOPE` + 13× SUBSTITUTE. Tambah template `PAGE_ENVELOPE` (Web Widget row 6) + tab stempel `_Helper Web Screen` (col A pageKey carry-down). Alasan: col B satu-satunya outlier yang langgar idiom §2 & gak kebaca. **Kenapa stempel di tab terpisah, bukan kolom AF di Web Screen:** grid Web Screen mentok 31 kolom & MCP gsheets gak punya tool tambah-kolom; tab helper konsisten dgn precedent `_Helper Web JSON`. Untuk sheet REAL boleh pilih salah satu (kolom lokal lebih tahan row-insert; tab helper lebih gampang dari MCP). Output terverifikasi byte-identical.
- **2026-06-01 (restructure + bounded idiom)** User pindahkan page registry ke **row 27** (blok meta di atas, mirror op1Screen 1-127). Col B (B27/B32) di-rewrite ke **range page-local bounded** `FILTER($E$<h+1>:$E$<last>;$C...=section)` — idiom op1Screen **B128**, **buang dependency stempel `_Helper Web Screen`**. Alasan: user anchor ke B128 ("seharusnya refer ke json itu"); stempel range `$E$11:$E$1000` vs `$A$2:$A$1000` mismatch + stale setelah restructure → children kosong. **`_Helper Web Screen` jadi DEPRECATED** (vestigial, aman dihapus). Bonus: cell error orphan op1Screen di blok meta (C3, B6:B13, B16/B17, B19, A25:B25) dibersihkan. Bug sempat: rewrite pertama drop 1 paren penutup `IF(` → `#ERROR! parse`; fix tambah `)`. Output terverifikasi.
