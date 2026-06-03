# Web JSON — Rewrite ke Idiom op1Screen (SKETSA LOKAL, rev2)

Ganti formula `Web JSON!C6` (sekarang `MAP`/`LAMBDA`/`LET`/`INDEX`/`MATCH`/`ISTEXT`/`CHAR(34)`)
jadi gaya op1Screen: **template + helper + VLOOKUP + SUBSTITUTE**.

rev2 — perbaikan PENEMPATAN: matrix config tetap bersih, semua build pindah ke tab hidden, range growth-safe.
rev3 — KEPUTUSAN dikunci: **Opsi A** (page = node Web Menu 2, grup existing) + kolom **Display** (saklar global). `<GROUP_PAGE>` dibuang.
rev4 — cek live: `N` ternyata **formula 3-tier MAP** (bukan statik). §7 baru: rewrite `L`/`M`/`N` ke idiom template+SUBSTITUTE, Display per-page, Patrol/Sales via VLOOKUP Web Screen.

Belum sentuh sheet live.

---

## PRINSIP PENEMPATAN (rev2 — ini inti concern)

1. **Matrix config TETAP BERSIH.** `Otorisasi Menu Web`, `Otorisasi Cost Center 2` cuma checkbox + identitas. **NOL helper column di dalamnya** — soalnya tumbuh ke kanan (grup/CC nambah → ketiban).
2. **Semua build-JSON di tab hidden** `_Helper Web JSON`. Skema kita kontrol, statis, user gak liat JSON.
3. **Range row-open buat matrix yang tumbuh:** `E2:2` (header), `E3:1000` (data block). Kolom baru ke kanan OTOMATIS kemasuk — gak usah edit formula.
4. **Key = email** (bukan posisi baris). Lookup via FILTER `D:D=email` → gak peduli baris geser.

---

## 0. Yang udah ada (live) + 2 bug

`Web JSON!C6` live = mega-formula `MAP(...LAMBDA(...LET(... CHAR(34) ...)))`.
- **Bug B1:** page Web Screen (Patrol, Sales) bocor — semua user dapat, gak di-RBAC. Bukti: `rika` (cuma Dashboard) tetap dapat Patrol+Sales.
- **Bug B2:** pakai tab lama (`Otorisasi Cost Center` transpose + `Web Menu 2`).

Keputusan: menu = **Web Menu 2**, CC = **Otorisasi Cost Center 2**.

---

## 1. Struktur tab (confirmed live)

### `Web Menu 2` — sumber node menu (tumbuh ke BAWAH, kolom tetap)
A=#, B=**Level** (1=grup atas), F=**Label**, J=Parent, N=**Main JSON** (node grup lengkap, isi cuma Level 1).
Level-1 urut: Dashboard, Workforce, Attendance, Operations, Reports, Request & Approval.

### `Otorisasi Menu Web` — RBAC menu (tumbuh ke KANAN)
Header **row 2**, data **row 3**. D=**Akun Gmail** (key). E–J = 6 grup (TRUE/FALSE).
→ **JANGAN tambah kolom apapun di sini.**

### `Otorisasi Cost Center 2` — RBAC CC (tumbuh ke KANAN)
Header **row 1**, data **row 2**. D=**Akun Gmail** (key). E–G = CC (boolean/checkbox asli).
→ **JANGAN tambah kolom apapun di sini.**

### `Web Screen` — GUDANG widget (tumbuh ke BAWAH)
**Opsi A:** Web Screen BERHENTI jadi pemancar page. Cuma simpan pageData/widget.
Page-row: `C`(section) KOSONG, `B`=page JSON penuh (ada token `[CC_LIST]`), `key`=join.
Widget-row: `C`=`topbar`, dst.
Patrol/Sales sekarang didaftar sbg **node Level-2 di `Web Menu 2`** (parent `Operations`/`Reports`); pageData di-VLOOKUP dari sini by `key`.

---

## 2. Tab BARU (hidden): `_Helper Web JSON`

Skema kita kontrol (tetap). Header row 1: `A=Akun Gmail`, `B=CC Join`, `C=Children`. Template di `E1`.

### A2 — daftar email (spill, 1 formula)
```excel
=FILTER('Otorisasi Menu Web'!$D$3:$D;'Otorisasi Menu Web'!$D$3:$D<>"")
```

### B2 — CC Join (fill down, key=$A2) → CC TRUE digabung `◆`
```excel
=IF($A2="";"";TEXTJOIN("◆";TRUE;
  IF(FILTER('Otorisasi Cost Center 2'!$E$2:$200;'Otorisasi Cost Center 2'!$D$2:$D$200=$A2);
     'Otorisasi Cost Center 2'!$E$1:$1;"")))
```
- `FILTER('CC 2'!$E$2:$200; D=email)` → baris CC user (row-open ke kanan → CC baru auto-masuk).
- `IF(barisItu; headerCC; "")` → nama CC yang TRUE. `TEXTJOIN ◆`.
- surya → `Induk◆Kantor Pusat◆Product Group`. rika → ``.
- Fungsi: `IF`, `FILTER`, `TEXTJOIN`. Nol INDEX/MATCH.

### C2 — Children (fill down, key=$A2) → node menu, GATED (RBAC + Display), token `[CC_LIST]` utuh
**Opsi A:** Patrol/Sales udah jadi node Level-2 di Web Menu 2 → ke-bake di N grup induknya. Gak ada lagi arg-2 (Web Screen flat). 1 FILTER aja.
```excel
=IF($A2="";"";TEXTJOIN(",";TRUE;
  FILTER('Web Menu 2'!$N$2:$N;
    ('Web Menu 2'!$B$2:$B=1)*
    ('Web Menu 2'!$O$2:$O=TRUE)*
    (COUNTIF(
       FILTER('Otorisasi Menu Web'!$E$2:$2;
              FILTER('Otorisasi Menu Web'!$E$3:$1000;'Otorisasi Menu Web'!$D$3:$D$1000=$A2)=TRUE);
       'Web Menu 2'!$F$2:$F)>0)))
```
Bedah:
- **grupBoleh** = `FILTER(headerGrup row2; barisUser=TRUE)` → grup yang user ini boleh. (nested FILTER, row-open → grup baru auto-masuk).
- **Node menu:** `FILTER('Web Menu 2'!N; (Level=1)*(Display=TRUE)*(COUNTIF(grupBoleh;Label)>0))`.
- **`$O$2:$O=TRUE`** = gate global Display (kolom baru, lihat §5b). Display=FALSE → grup hilang buat SEMUA user, tanpa hapus baris / uncheck matrix.
- `COUNTIF(grupBoleh; arrayKolom)>0` = pengganti MAP.
- **Patrol/Sales nutup bug B1** karena sekarang lewat jalur node yang sama (parent `Operations`/`Reports`) → kena RBAC otomatis. Gak perlu `<GROUP_PAGE>` lagi.
- Fungsi: `IF`, `FILTER`, `COUNTIF`, `TEXTJOIN`. Nol MAP/LAMBDA/LET/INDEX/MATCH/ISTEXT.

### E1 — Template envelope (petik diketik SEKALI → bunuh CHAR(34))
```
{"type":"MENU","name":"[NAME]","description":"[DESC]","logoUrl":"[LOGO]","email":"[EMAIL]","costCenters":"[CC_LIST]","footer":"Powered by [PROVIDER]","children":[[CHILDREN]]}
```
`[[CHILDREN]]` = kurung array `[ ]` + token `[CHILDREN]`.

---

## 3. `Web JSON!C6` — cell utama (per baris, fill down, `eml=B6`)

Matrix config gak disentuh. Cell ini cuma VLOOKUP ke helper + SUBSTITUTE berantai:
```excel
=IF(B6="";"";
 SUBSTITUTE(
  SUBSTITUTE(
   SUBSTITUTE(
    SUBSTITUTE(
     SUBSTITUTE(
      SUBSTITUTE(
       SUBSTITUTE('_Helper Web JSON'!$E$1;
        "[NAME]";     $B$1);
        "[DESC]";     $B$2);
        "[LOGO]";     $B$3);
        "[PROVIDER]"; $E$3);
        "[EMAIL]";    B6);
        "[CHILDREN]"; VLOOKUP(B6;'_Helper Web JSON'!$A:$C;3;FALSE));
        "[CC_LIST]";  VLOOKUP(B6;'_Helper Web JSON'!$A:$C;2;FALSE)))
```
Urutan: inject `[CHILDREN]` dulu (bawa `[CC_LIST]` di dalam node) → `[CC_LIST]` di-substitute TERAKHIR (1× ganti semua = trik join-then-sub).

`A6`/`B6` tetap (VID + email list spill). `C6` drag turun.

---

## 4. Fungsi sebelum vs sesudah

| | Live | rev2 |
|---|---|---|
| MAP/LAMBDA | ✅ nested | ❌ |
| LET | ✅ | ❌ |
| INDEX/MATCH | ✅ | ❌ |
| ISTEXT | ✅ | ❌ (gate `C=""`) |
| CHAR(34) | ✅ | ❌ (template) |
| VLOOKUP | — | ✅ |
| SUBSTITUTE berantai | sebagian | ✅ inti |
| FILTER/COUNTIF/TEXTJOIN/IF | ✅ | ✅ (tame, nol lambda) |
| helper di matrix user | — | ❌ (pindah tab hidden) |

---

## 5. KEPUTUSAN — DIKUNCI: Opsi A + grup existing

**Dipilih: Opsi A.** Patrol/Sales didaftar sbg **node Level-2 di `Web Menu 2`**, parent grup yang **udah ada**:
- Patrol Report → parent `Operations`
- Sales Performance → parent `Reports`

pageData tetap dari `Web Screen` (join by `key`). Page lewat **1 jalur RBAC** = jalur menu. Nol kolom matrix baru. Bug B1 nutup sendiri.

Alasan tolak Opsi B (tabel mapping `pageKey→grup`): nyimpen 2 mekanisme RBAC permanen. Opsi A = page emang "menu" (diklik dari nav), jadi tempat benernya di pohon menu.

**Harga Opsi A:** page didaftar 2 tempat — node di `Web Menu 2` (nav+grup) + pageData di `Web Screen` (widget), disambung lewat `key`.

### Sinkron Web Menu 2 ↔ Otorisasi Menu Web (auto)
- Tambah/hapus baris menu → FILTER auto-tangkap (range row-open). Match by **label**, bukan nomor baris.
- Tambah **PAGE** di bawah grup existing → matrix NOL ubah (ikut grup induk).
- Tambah **GRUP** baru (Level 1) → matrix WAJIB 1 kolom baru (RBAC per-grup). Lupa = COUNTIF 0 = menu hilang semua (aman, gak bocor).

---

## 5b. Kolom Display (TRUE/FALSE) di `Web Menu 2` — saklar global per-node

BISA & AMAN: `Web Menu 2` tumbuh ke BAWAH (kolom tetap) → nambah kolom gak ketiban. (Beda matrix yang tumbuh ke kanan.)

**Posisi:** append kolom **`O` = Display** (kanan dari `N`). Boolean checkbox.

**Semantik:** beda fungsi dari RBAC, di-AND:
```
node TAMPIL = Display=TRUE (global, Web Menu 2)  AND  grup-user=TRUE (per-user, Otorisasi Menu Web)
```
Guna: matiin menu buat SEMUA user tanpa hapus baris / uncheck matrix. Kayak draft/publish.

**Wiring:** 2 tempat —
1. Level-GRUP: faktor `('Web Menu 2'!$O$2:$O=TRUE)` di FILTER §2-C2 (udah dipasang).
2. Level-PAGE: faktor `($O$2:$O$200=TRUE)` di FILTER anak dalam rumus `M`/`N` (lihat §7).

**✓ RESOLVED (cek live 2026-06-01):** `N` ternyata **FORMULA** (MAP 3-tier `L←M←N`), BUKAN statik. (N3 tadi keliatan kosong-formula karena MAP di N2 spill ke bawah.) Jadi Display per-page **BISA auto** — tinggal tambah faktor `(O=TRUE)` di FILTER anak. Gak perlu refactor besar.

---

## 6. Kalau approve → urutan tulis test sheet
1. `Web Menu 2`: append kolom `O = Display` (boolean checkbox), default TRUE semua baris existing.
2. Tab `_Helper Web JSON`: tulis 3 template node (`H1`=tplLeaf, `H3`=tplBranch, `H4`=tplRoot) + envelope `E1`.
3. `Web Menu 2`: ganti `L2`/`M2`/`N2` (MAP) → formula fill-down idiom §7. Drag L2:N2 ke bawah (sampai :200). **Hapus MAP lama dulu** (spill bentrok sama fill-down).
4. `Web Menu 2`: daftar Patrol (parent `Operations`) + Sales (parent `Reports`) sbg baris Level-2; `key` = pageKey Web Screen. M cabang VLOOKUP auto-tarik pageData.
5. Tab `_Helper Web JSON`: isi `A2` (email spill), `B2` (CC Join), `C2` (Children) fill-down.
6. `Web JSON!C6` → formula envelope, drag turun.
7. Verifikasi: `rika` TANPA Patrol/Sales (Operations/Reports gak dicentang); `surya` CC lengkap; set 1 Display=FALSE → cek node itu hilang semua user; JSON valid (LEN sanity).
8. Matrix `Otorisasi Menu Web` & `Otorisasi Cost Center 2` = TETAP, gak disentuh.

---

## 7. Web Menu 2 — rewrite `L`/`M`/`N` ke idiom (ganti MAP/LET/CHAR34)

### Live sekarang (3-tier MAP, gaya "aneh")
```
L2 = MAP(...LAMBDA... IF Level=3 → {label,icon,path,key,urlSheet,parent}  pakai CHAR(34))
M2 = MAP(...        IF Level=2 → {…,parent[,children]}; children=FILTER(L;L3;Parent=label) kalau ada)
N2 = MAP(...        IF Level=1 → {…,children};         children=FILTER(M;L2;Parent=label) selalu)
```
Semua spill dari row 2, `:200`. Sumber: B=Level, F=Label, G=Icon, H=Path, I=urlSheet, J=Parent, K=Key.

### Template (di `_Helper Web JSON`, quote diketik SEKALI → bunuh CHAR34)
```
H1 tplLeaf  : {"label":"[LABEL]","icon":"[ICON]","path":"[PATH]","key":"[KEY]","urlSheet":"[URLSHEET]","parent":"[PARENT]"}
H3 tplBranch: {"label":"[LABEL]","icon":"[ICON]","path":"[PATH]","key":"[KEY]","urlSheet":"[URLSHEET]","parent":"[PARENT]","children":[[CHILDREN]]}
H4 tplRoot  : {"label":"[LABEL]","icon":"[ICON]","path":"[PATH]","key":"[KEY]","urlSheet":"[URLSHEET]","children":[[CHILDREN]]}
```
`[[CHILDREN]]` = kurung `[ ]` + token `[CHILDREN]`. tplRoot NOL parent (Level-1).

### L2 — fill-down L2:L200 (Level-3 leaf)
```excel
=IF($B2<>3;"";
  SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
    '_Helper Web JSON'!$H$1;
    "[LABEL]";$F2);"[ICON]";$G2);"[PATH]";$H2);"[KEY]";$K2);"[URLSHEET]";$I2);"[PARENT]";$J2))
```

### M2 — fill-down M2:M200 (Level-2; cabang Web Screen buat Patrol/Sales)
```excel
=IF($B2<>2;"";
  IF(COUNTIF('Web Screen'!$A:$A;$K2)>0;
     VLOOKUP($K2;'Web Screen'!$A:$B;2;FALSE);
     SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
       '_Helper Web JSON'!$H$3;
       "[LABEL]";$F2);"[ICON]";$G2);"[PATH]";$H2);"[KEY]";$K2);"[URLSHEET]";$I2);"[PARENT]";$J2);
       "[CHILDREN]";IFERROR(TEXTJOIN(",";TRUE;
          FILTER($L$2:$L$200;($B$2:$B$200=3)*($J$2:$J$200=$F2)*($O$2:$O$200=TRUE)));""))))
```
- Cabang-1: kalau `key` ketemu di `Web Screen` col A → tarik pageData penuh (ada `[CC_LIST]` utuh) by key. ← Patrol/Sales.
- Cabang-2: node generik (template + anak Level-3 ter-gate Display).

### N2 — fill-down N2:N200 (Level-1, nol parent)
```excel
=IF($B2<>1;"";
  SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
    '_Helper Web JSON'!$H$4;
    "[LABEL]";$F2);"[ICON]";$G2);"[PATH]";$H2);"[KEY]";$K2);"[URLSHEET]";$I2);
    "[CHILDREN]";IFERROR(TEXTJOIN(",";TRUE;
       FILTER($M$2:$M$200;($B$2:$B$200=2)*($J$2:$J$200=$F2)*($O$2:$O$200=TRUE)));"")))
```

### Beda perilaku vs live (sadar pilih)
- **MAP-spill → fill-down:** rumus di TIAP baris 2:200 (bukan 1 anchor). op1Screen idiom. Hapus MAP lama dulu (spill bentrok). Range `:200` (sama kayak live); kalau menu >200 baris, panjangin.
- **Display per-level:** faktor `($O...=TRUE)` di FILTER anak → matiin 1 page tanpa hapus baris.
- **Level-2 leaf:** sekarang emit `"children":[]` (live lama OMIT kalau gak ada anak). Simplifikasi biar nol LET. Kalau WAJIB sama persis (omit), pakai IF 2-template (tplLeaf vs tplBranch) — nambah dikit, masih nol LET/CHAR34.
- Fungsi: `IF/SUBSTITUTE/TEXTJOIN/FILTER/IFERROR/VLOOKUP/COUNTIF`. **Nol MAP/LAMBDA/LET/INDEX/MATCH/ISTEXT/CHAR34.**
