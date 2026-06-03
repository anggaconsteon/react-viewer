# Design Spec: Per-Cost-Center Spreadsheet Routing (Sheet-Side)

**Date:** 2026-06-03
**Spreadsheet:** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` (VTL Master, locale `in_ID`)
**Scope:** Sheet-side mechanism only (Web URL config, Web Screen mode flag, _Helper per-user resolution). FE/BE wire contract lives in `docs/2026-06-03-per-cc-spreadsheet-routing-contract.md`.
**Idiom:** op1Screen — template `[TOKEN]` + VLOOKUP + chained SUBSTITUTE. ALLOWED: IF/IFERROR/FILTER/TEXTJOIN/SUBSTITUTE/VLOOKUP/SPLIT/ARRAYFORMULA/COUNTIF/COUNTIFS/REGEXEXTRACT. FORBIDDEN: MAP/LAMBDA/LET/CHAR(34)/INDEX/MATCH.

---

## 1. Problem

Tiap web page hardcode satu spreadsheet `src`. Tapi tiap cost center punya **file spreadsheet sendiri** per menu. Butuh: satu menu nampilin spreadsheet beda tergantung cost center user, mengikuti RBAC per-user.

- User akses 1 CC → langsung lihat spreadsheet itu (perilaku lama).
- User akses >1 CC → dropdown cost center; pilih → spreadsheet diganti.

---

## 2. Dua mode (recap)

| Mode | Peran CC | Aksi | File |
|---|---|---|---|
| **FILTER** (existing) | dimensi filter | tulis ke cell → re-filter | tetap (1 file agregat) |
| **ROUTED** (baru) | pemilih file | kirim URL → load file | ganti per CC |

FILTER = perilaku sekarang (patrolReport, salesPerformance). Spec ini cuma soal **ROUTED**. Filter lain (tanggal/site) tetap tulis-cell di kedua mode.

Beda key dropdown: ROUTED = `costCenterSrc` (value=URL); FILTER = `costCenter` (value=nama CC).

---

## 3. Layer & tanggung jawab

| Tab | Peran | Yang edit |
|---|---|---|
| **Web URL** | config: spreadsheet mana per (page × CC) | **user/operator** (sering) |
| **Web Screen** | template page + flag `mode` | dev (jarang) |
| **Cost Center** | registry CC + file per kategori (existing) | admin |
| **_Helper Web JSON** | assembly per-user, resolve token | otomatis (formula) |

Ganti spreadsheet routing = edit **Web URL**, BUKAN Web Screen.

---

## 4. Tab `Web URL` (SUDAH diimplementasi 2026-06-03)

Long-form, 1 baris = 1 (page key × cost center) → 1 URL.

| Col | Header | Tipe | Sumber |
|---|---|---|---|
| A | `No` | auto | `=ARRAYFORMULA(IF(B2:B500="";"";ROW(B2:B500)-1))` di A2 |
| B | `Page Key` | dropdown | data-validation from range `='Web Menu'!$J$2:$J$500` |
| C | `Cost Center` | dropdown | data-validation from range `='Cost Center'!$D$3:$D$20` |
| D | `Menu (auto)` | auto label | `=ARRAYFORMULA(IF(B2:B500="";"";IFERROR(VLOOKUP(B2:B500;{'Web Menu'!$J$2:$J$500\'Web Menu'!$F$2:$F$500};2;FALSE);"❓ key tdk dikenal")))` di D2 |
| E | `Spreadsheet URL` | free text | paste URL penuh (file+gid); boleh sama antar-CC / placeholder |

- User isi **B, C, E** saja. A & D auto (spill ARRAYFORMULA dari baris 2).
- VLOOKUP label pakai array-literal `{J\F}` karena label (F) ada di KIRI key (J) — VLOOKUP biasa gak bisa nengok kiri. `\` = pemisah kolom array (locale `in_ID`).

### Anti-duplikat
Pakai **Conditional Formatting** (bukan kolom rumus, bukan data-validation — karena B/C sudah dipakai dropdown, 1 cell = 1 rule validation):
- Range: `A2:E500`
- Custom formula: `=AND($B2<>"";$C2<>"";COUNTIFS($B$2:$B$500;$B2;$C$2:$C$500;$C2)>1)`
- Style: fill merah. Baris (page key × CC) kembar → merah. Visual flag (bukan hard-reject).

### Catatan dropdown (manual setup)
MCP gsheets tidak bisa set data-validation; user set sekali via UI (Data → Data validation → Dropdown from a range). Persist permanen.

---

## 5. Tab `Web Screen` — kolom `mode` (BELUM)

Tiap page di Web Screen punya HEADER row (A=page key, B=pageData JSON, dst). Tambah kolom `mode` di header row:

- Nilai: `ROUTED` atau kosong (=FILTER, default, tak berubah).
- Builder pageData (col B) bercabang:
  - `mode` kosong → bangun pageData seperti sekarang (src statis dari G).
  - `mode=ROUTED` → bangun pageData versi dropdown: topbar dapat DROPDOWN `costCenterSrc` + BUTTON SUBMIT, `content[0].src` = token `[SRC]`, dropdown `options` = token `[CC_OPTIONS]`. Token dibiarkan literal (di-resolve di _Helper).

Template ROUTED (Web Widget base baru, mis. `pageWrapperRouted`): sama seperti `pageWrapper` tapi topbar prefilled dropdown+button dan src=`[SRC]`. Lihat contoh JSON final di contract §5a.

---

## 6. Resolusi per-user di `_Helper Web JSON` (BELUM — inti)

### Kenapa di _Helper
`[CC_OPTIONS]`/`[SRC]` = fungsi **(page × user)**. Hanya `_Helper` yang tahu CC per-user (col B, hasil RBAC). Web Screen user-agnostic. Sama seperti `[CC_LIST]` yang baru di-substitute per-user di assembly akhir.

### Beda dari `[CC_LIST]`
`[CC_LIST]` = fungsi user saja (1 nilai, dipakai semua page). `[CC_OPTIONS]`/`[SRC]` beda per page → token harus **mengandung page key**: `[CC_OPTIONS:dashboard]`, `[SRC:dashboard]`.

### Options per (page, user)
Untuk page `K`, user di baris `r` (CC list di `$B{r}`, ◆-joined):
```
=TEXTJOIN("◆";TRUE;
  FILTER('Web URL'!$C$2:$C$500 & "▶" & 'Web URL'!$E$2:$E$500;
    ('Web URL'!$B$2:$B$500="K") *
    (COUNTIF(SPLIT($B{r};"◆");'Web URL'!$C$2:$C$500)>0) *
    ('Web URL'!$E$2:$E$500<>"")))
```
- `(B=K)` → baris page K.
- `COUNTIF(SPLIT(userCC);CC)>0` → CC ada di akses user (vectorized, pola sama dgn _Helper existing).
- `E<>""` → skip URL kosong.
- Output: `Induk▶url◆Kantor Pusat▶url◆...`.

### SRC (initial load = URL pertama)
```
=IFERROR(REGEXEXTRACT(<options di atas>;"▶([^◆]+)");"")
```
Ambil URL setelah `▶` pertama, sebelum `◆` pertama.

### Injeksi token (chained SUBSTITUTE, bounded)
Routed pages JUMLAHNYA SEDIKIT & diketahui (admin set `mode=ROUTED`). Bungkus children per-user dengan SUBSTITUTE berantai, satu pasang per routed page:
```
SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(rawChildren;
  "[CC_OPTIONS:dashboard]"; optDashboard);
  "[SRC:dashboard]"; srcDashboard);
  "[CC_OPTIONS:<page2>]"; opt2);
  "[SRC:<page2>]"; src2)
```
Tiap `optX`/`srcX` = formula §6 untuk page X. Verbose tapi idiom-legal (no MAP/LAMBDA). Tambah routed page = tambah 1 pasang SUBSTITUTE (dev edit, jarang). Letakkan helper `optX`/`srcX` di kolom helper per-user supaya formula chokepoint tetap kebaca.

---

## 7. Edge cases

| Kasus | Hasil |
|---|---|
| User 1 CC | options 1 entry; FE boleh sembunyikan dropdown; src = CC itu. |
| User >1 CC | dropdown muncul; src = CC pertama. |
| User 0 CC untuk page | options kosong → src kosong → FE empty state. |
| gid beda per CC | URL di Web URL sudah penuh (file+gid) per baris — gak perlu hitung gid. |
| URL kosong di Web URL | baris di-skip (`E<>""`). |
| Page key salah ketik | ke-block dropdown; kalau lolos, col D = `❓ key tdk dikenal`. |

---

## 8. Status

- [x] Web URL direstruktur + seed contoh (dashboard × 3 CC) + rumus A/D — live 2026-06-03.
- [ ] Dropdown B/C (user setup manual via UI).
- [ ] Conditional formatting anti-dup (user setup manual via UI).
- [ ] Web Screen kolom `mode` + cabang builder pageData ROUTED.
- [ ] Web Widget template `pageWrapperRouted` (atau token di pageWrapper existing).
- [ ] _Helper resolusi `[CC_OPTIONS:key]`/`[SRC:key]` (helper cols + chained SUBSTITUTE).
- [ ] Verifikasi end-to-end di Web JSON per-user.

---

## 9. Open items

- Konfirmasi gid: kalau workbook per-CC di-clone (gid sama), bisa simplify ke file(Cost Center)+gid(Web Screen) dan Web URL jadi opsional. Saat ini asumsi URL penuh per (page×CC) (kasus paling aman).
- Nama token final (`[CC_OPTIONS:key]` / `[SRC:key]`) — konfirmasi tidak bentrok dengan token existing.
- Shape response backend untuk `REFRESH_CONTENT` (samakan dgn FILTER) — domain FE/BE, lihat contract §10.
