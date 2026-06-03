# Change Manifest — Web Screen col B Refactor (2026-06-01)

**Test spreadsheet:** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` (Salinan VTL Induk)
**Tujuan:** ganti formula col B `Web Screen` (page assembler) dari `LET/MATCH/INDIRECT/MID` (outlier, gak kebaca) → idiom bersih `VLOOKUP PAGE_ENVELOPE + 13× SUBSTITUTE`.
**Status:** sudah live di test sheet, output **byte-identical** dgn versi lama (terverifikasi patrolReport + salesPerformance).

> Locale sheet ini `in_ID` → pemisah argumen `;`. Kalau sheet real-mu pakai locale `en` (US), ganti semua `;` jadi `,` saat paste.

---

## Ringkasan: 4 hal yang diubah/ditambah

| # | Sheet/Tab | Aksi | Lokasi |
|---|---|---|---|
| 1 | `Web Widget` | **RESTRUKTUR** layout dimiripin sheet `Widget` referensi (template pindah col G→J) + tambah row PAGE_ENVELOPE | A1:J6 |
| 2 | `_Helper Web Screen` | **TAMBAH TAB BARU** + 1 kolom stempel | Tab baru, kol A1:A40 |
| 3 | `Web Screen` | **GANTI** formula col B tiap baris header | B2, B7 (+ tiap baris header lain) |
| 4 | `Web Screen` | **REPOINT** VLOOKUP col D resolver + col B: `'Web Widget'!$A:$G;7` → `$A:$J;10` | D{widget rows} + B{header rows} |

Col E ARRAYFORMULA, col F, meta U:AE — **tidak berubah**.

---

## 1. `Web Widget` — restruktur layout (mirror sheet `Widget` referensi)

Layout dibikin MIRIP sheet `Widget` di spreadsheet op1Screen referensi. Beda kunci dari sebelumnya: **template ("Base JSON") pindah dari col G ke col J**. Col G sekarang isi JSON contoh (resolved sample) buat eyeball, bukan template lagi.

### Skema kolom baru

| Col | Header | Isi |
|---|---|---|
| A | `Widget name` | key widget (DROPDOWN/DATE/SPACER/BUTTON_SUBMIT/PAGE_ENVELOPE) |
| B | `paramList` | daftar token bernama (CSV). Mirror referensi pakai Parameter 1-5 positional, tapi widget kita param-nya bisa >5 jadi tetap CSV bernama |
| C–F | (kosong) | reserved (referensi pakai Parameter 2-5) |
| G | `JSON` | contoh JSON resolved (token diisi nilai contoh; `[CC_LIST]` sengaja dibiarkan utuh) |
| H | index map | `◆<name>▶Web Widget!J<row>`. H1 = list penuh ◆-join semua widget |
| I | `Widget name` | ulang col A |
| J | `Base JSON` | **TEMPLATE ber-token** `[X]` (yang dibaca Web Screen VLOOKUP) |

### Row 6 = `PAGE_ENVELOPE` (page-level)

**A6:** `PAGE_ENVELOPE`
**B6** (paramList): `LABEL,ICON,PATH,KEY,PARENT,TITLE,TB_ALIGN,SRC,PERM,SS_EXTRA,BT_ALIGN,TB_CHILDREN,BT_CHILDREN`
**H6:** `◆PAGE_ENVELOPE▶Web Widget!J6`
**I6:** `PAGE_ENVELOPE`
**J6** (Base JSON template, satu baris):
```
{"label":"[LABEL]","icon":"[ICON]","path":"[PATH]","key":"[KEY]","parent":"[PARENT]","pageData":{"title":"[TITLE]","topbar":{"alignment":"[TB_ALIGN]","children":[[TB_CHILDREN]]},"spreadsheet":{"id":"mainContent","src":"[SRC]","permission":"[PERM]"[SS_EXTRA]},"bottomBar":{"alignment":"[BT_ALIGN]","children":[[BT_CHILDREN]]}}}
```

Catatan token:
- `[SS_EXTRA]` = bagian opsional setelah `"permission":"[PERM]"`. Dirakit di col B (rowHeader/rowStartData/sheetName). Kalau page gak punya meta itu → kosong.
- `[TB_CHILDREN]`/`[BT_CHILDREN]` = isi array children topbar/bottomBar (sudah tanpa kurung siku; template yang kasih `[...]`).
- `[CC_LIST]` **tidak** ada di sini — dia datang dari string children (dropdown) & dibiarkan utuh sampai Web JSON.

> **Kalau sheet real-mu pertahankan template di col G** (gak mau mirror): skip section 1 & 4, dan col B/col D VLOOKUP tetap `$A:$G;7`. Mirror itu kosmetik (biar sebaris sama op1Screen); fungsional gak wajib.

---

## 2. Tab baru `_Helper Web Screen` — kolom stempel pageKey (A)

Bikin tab baru namanya **`_Helper Web Screen`**. Isi kolom A (carry-down, mirror baris `Web Screen`):

**A1** (label):
```
pageKey-stamp
```

**A2** (lalu copy ke bawah s/d A40 — referensi auto-naik):
```
=IF('Web Screen'!A2="";"";IF(NOT(ISNUMBER('Web Screen'!A2));'Web Screen'!A2;A1))
```

Hasil: baris header → pageKey-nya sendiri; baris widget → warisi pageKey baris atas (header terdekat). Inilah pengganti deteksi-blok `MATCH/INDIRECT` lama.

> **Kalau page-mu lebih dari ~38 baris total:** extend stempel ke bawah (A41, A42, …) dgn pola sama. MCP/copy tak auto-extend.

> **Alternatif (sheet real):** boleh juga taruh stempel sebagai **kolom lokal** di `Web Screen` (mis. AF) daripada tab terpisah — lebih tahan kalau kamu insert/hapus baris. Di test sheet kepaksa tab terpisah karena grid mentok 31 kolom & MCP gak bisa tambah kolom. Kalau pilih kolom lokal AF: A1=`pageKey-stamp`, AF2=`=IF(A2="";"";IF(NOT(ISNUMBER(A2));A2;AF1))` carry-down, lalu di formula col B ganti `'_Helper Web Screen'!$A$2:$A$1000` → `$AF$2:$AF$1000`.

---

## 3. `Web Screen` — ganti formula col B tiap baris header

Ganti **hanya baris header** (col A berisi pageKey teks, mis. row 2 = patrolReport, row 7 = salesPerformance). Baris widget col B tetap nama widget (DROPDOWN/DATE/dst) — jangan disentuh.

**B2** (patrolReport) — contoh lengkap:
```
=IF(OR(A2="";ISNUMBER(A2));"";SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(VLOOKUP("PAGE_ENVELOPE";'Web Widget'!$A:$J;10;FALSE);"[LABEL]";U2);"[ICON]";V2);"[PATH]";W2);"[KEY]";A2);"[PARENT]";X2);"[TITLE]";U2);"[TB_ALIGN]";AD2);"[SRC]";Y2);"[PERM]";Z2);"[SS_EXTRA]";IF(AA2<>"";",""rowHeader"":"&AA2;"")&IF(AB2<>"";",""rowStartData"":"&AB2;"")&IF(AC2<>"";",""sheetName"":"""&AC2&"""";""));"[BT_ALIGN]";AE2);"[TB_CHILDREN]";IFERROR(MID(TEXTJOIN("";TRUE;FILTER($E$2:$E$1000;'_Helper Web Screen'!$A$2:$A$1000=$A2;$C$2:$C$1000="topbar"));2;50000);""));"[BT_CHILDREN]";IFERROR(MID(TEXTJOIN("";TRUE;FILTER($E$2:$E$1000;'_Helper Web Screen'!$A$2:$A$1000=$A2;$C$2:$C$1000="bottomBar"));2;50000);"")))
```

**Untuk baris header lain** (mis. B7): copy B2, ganti SEMUA nomor baris `2` → nomor baris header itu. Yang berubah: `A2→A7`, `U2→U7`, `V2→V7`, `W2→W7`, `X2→X7`, `Y2→Y7`, `Z2→Z7`, `AA2→AA7`, `AB2→AB7`, `AC2→AC7`, `AD2→AD7`, `AE2→AE7`, dan dua FILTER `=$A2`→`=$A7`. Range absolut (`$E$2:$E$1000`, `'_Helper Web Screen'!$A$2:$A$1000`, `$C$2:$C$1000`) **tetap**.

### Peta token → kolom meta (baris header)
| Token | Kolom | Isi |
|---|---|---|
| `[LABEL]` & `[TITLE]` | U | label page |
| `[ICON]` | V | icon |
| `[PATH]` | W | path |
| `[KEY]` | A | pageKey |
| `[PARENT]` | X | parent menu |
| `[TB_ALIGN]` | AD | topbarAlign |
| `[SRC]` | Y | src spreadsheet |
| `[PERM]` | Z | permission |
| `[SS_EXTRA]` | AA/AB/AC | rowHeader/rowStartData/sheetName (opsional) |
| `[BT_ALIGN]` | AE | bottomAlign |
| `[TB_CHILDREN]` | (FILTER E) | children section=topbar |
| `[BT_CHILDREN]` | (FILTER E) | children section=bottomBar |

---

## 4. `Web Screen` — repoint VLOOKUP col D resolver col G→J

Karena template Web Widget pindah G→J (section 1), SEMUA VLOOKUP yang baca template harus naik dari kolom ke-7 (`$A:$G;7`) ke ke-10 (`$A:$J;10`):

- **Col D** (resolver widget, tiap baris widget — non-header): `VLOOKUP(B{n};'Web Widget'!$A:$G;7;FALSE)` → `VLOOKUP(B{n};'Web Widget'!$A:$J;10;FALSE)`. Sisa formula (14× SUBSTITUTE token→kol G:T Web Screen) **tetap**.
- **Col B** (page assembler, tiap baris header): `VLOOKUP("PAGE_ENVELOPE";'Web Widget'!$A:$G;7;FALSE)` → `$A:$J;10`. (sudah tercermin di contoh B2 atas).

Cari-ganti aman seluruh sheet: `'Web Widget'!$A:$G;7` → `'Web Widget'!$A:$J;10`. Gak ada formula lain yang baca col G Web Widget.

---

## Gotcha penting (biar gak `#ERROR!`)

1. **Urutan SUBSTITUTE:** `[TB_CHILDREN]`/`[BT_CHILDREN]` disubstitusi **paling akhir** (outermost). Supaya token yang nyangkut di string children (mis. `[CC_LIST]`) **tidak** ikut kena substitusi → `[CC_LIST]` tetap utuh sampai Web JSON.
2. **Quoting `sheetName`:** literal `,"sheetName":"` berakhir tanda kutip → di formula tulis `:"""&AC&""""` (3 kutip buka + nilai + 4 kutip tutup). Kalau cuma `:""` → string gak ketutup → `#ERROR! Formula parse error`. **Jangan kelebihan jadi 5 kutip** (`&AC&"""""`) — itu juga `#ERROR!`. Bandingkan `,"rowHeader":` yang berakhir `:` (cukup `:"`).
3. **Locale:** semua `;` di atas itu locale `in_ID`. Sheet en-US → ganti ke `,`.
4. **Verifikasi:** habis paste, banding output col B baris header vs versi lama harus **persis sama** (kecuali kalau memang mau ubah struktur).

---

## Verifikasi yang sudah dilakukan (test sheet)
- Web Widget restruktur (2026-06-01): A1:J6 = layout mirror; template di J1:J6; G1:G6 = JSON sample; H = index map; I = name ulang. Live OK.
- Col D resolver (D3:D10) repoint ke J: output widget identik (DROPDOWN/DATE/SPACER/BUTTON_SUBMIT resolve normal).
- B2 patrolReport: output identik, termasuk `,"rowHeader":8,"rowStartData":9` (dari AA2/AB2).
- B7 salesPerformance: output identik, `[SS_EXTRA]` kosong → `"permission":"C◆U◆D"}` langsung (AA7/AB7/AC7 kosong).
- Stempel `_Helper Web Screen!A`: rows 2-6 = patrolReport, 7-10 = salesPerformance, sisanya kosong.
