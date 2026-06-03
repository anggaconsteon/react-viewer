# VTL Web-Builder — Session Handoff (Pre-Go-Live, "Request C") — 2026-06-02

> **ENTRY POINT untuk session AI baru.** Baca file ini dulu → langsung paham apa yang dikerjakan sesi terakhir di web-builder VTL menjelang go-live. Tiap bagian ada pointer ke detail.

---

## 0. Konteks

- **Spreadsheet:** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` — "Salinan dari Vertika Tekno Lokacipta Induk # Admin" (STAGING/copy; mau dipindah ke sheet LIVE/produksi).
- **Locale `in_ID`:** formula pakai `;`, array-literal `\`. autoRecalc ON_CHANGE, Asia/Jakarta.
- **Idiom WAJIB (op1Screen):** template ber-`[TOKEN]` + VLOOKUP + chained SUBSTITUTE. DILARANG MAP/LAMBDA/LET/CHAR(34)/INDEX/MATCH. Boleh IF/IFERROR/FILTER/TEXTJOIN/SUBSTITUTE/VLOOKUP.
- **Output akhir:** `Web JSON` per-user. Pipeline: `Web Widget` (template) → `Web Screen` (page) + `Web Menu` (tree) → `Otorisasi Menu Web` (RBAC) → `_Helper Web JSON` (assembly per-user) → `Web JSON`.
- Arsitektur pipeline penuh: lihat memory `web_builder_pattern.md` + `docs/vertika-web-builder-MASTER-REFERENCE.md`.

**Sesi ini ngerjain 5 hal (urut):** (1) resolusi patrolReport `then`, (2) hapus `pageData:{}` kosong, (3) hapus `children:[]` kosong (leaf menu) — topbar/bottomBar DIBIARKAN, (4) theme masuk Web JSON, (5) restructure Web Theme + tambah theme.

---

## 1. patrolReport `then` — RESOLVED (bukan bug)

- **Gejala:** output lama sempat tampil `then:""`, padahal Web Menu/Web Screen/fixture = `REFRESH_CONTENT`.
- **Sebab:** `_Helper Web JSON!C2` itu LIVE formula chain (Web Menu M → _Helper C → Web JSON C). `""` cuma artefak stale pre-recalc.
- **Status:** Web JSON C6 sekarang `REFRESH_CONTENT`. **Tidak ada bug.** Jangan dikejar lagi.

---

## 2. Hapus `pageData:{}` kosong — DONE (request dev)

Node tanpa page **jangan** emit `"pageData":{}` → hilangin total.

- **Lokasi fix:** `_Helper Web JSON!C2:C6` (chokepoint per-user, future-proof; bukan ngedit ratusan cell Web Menu K/L/M).
- **Mekanisme:** SUBSTITUTE strip literal `,"pageData":{}` → `""`.
- Fixture lokal `json/web-json.json`: 10 `pageData:{}` dihapus, 13 pageData asli tetap.

## 3. Hapus `children:[]` kosong (leaf menu) — DONE (request dev) — topbar/bottomBar DIBIARKAN

Leaf menu-node tanpa anak jangan emit `"children":[]`.

- **Lokasi fix:** sama, `_Helper Web JSON!C2:C6` (SUBSTITUTE ke-2, nested).
- **⚠️ LOCKED (user):** topbar/bottomBar `"children":[]` **JANGAN dirubah** ("biarkan seperti itu jangan dirubah"). Aman karena anchor di KOMA: leaf menu = `"children":[],` (ada koma, diikuti `,"pageData"`); topbar/bottomBar = `"children":[]` diikuti `}` (tanpa koma) → tak kena.
- **Urutan kritis:** strip children DULUAN (saat body mentah masih ada `,"pageData"` di belakang menu children), baru strip pageData.
- Fixture: 17 leaf-menu children dihapus; 24 topbar/bottomBar `children:[]` tetap.

### Formula final `_Helper Web JSON!C2` (verified live 2026-06-02; C3:C6 sama, ganti `$A2`→`$A{r}`)
```
=SUBSTITUTE(SUBSTITUTE(IF($A2="";"";IFERROR(TEXTJOIN(",";TRUE;FILTER('Web Menu'!$M$2:$M$200;('Web Menu'!$B$2:$B$200=1)*('Web Menu'!$N$2:$N$200=TRUE)*(COUNTIF(FILTER('Otorisasi Menu Web'!$E$2:$Z$2;FILTER('Otorisasi Menu Web'!$E$3:$Z$1000;'Otorisasi Menu Web'!$D$3:$D$1000=$A2)=TRUE);'Web Menu'!$F$2:$F$200)>0)));""));"""children"":[],";"");",""pageData"":{}";"")
```
- Inner SUBSTITUTE target `"""children"":[],"` (= `"children":[],`) → `""`.
- Outer target `",""pageData"":{}"` (= `,"pageData":{}`) → `""`.
- 5 user: `A2`=suryawdj@gmail.com, `A3`=dsambas@vertesc.com, `A4`=dyani.saryono@gmail.com, `A5`=aaaa@gmail.com, `A6`=rika39538@gmail.com.

---

## 4 & 5. Theme subsystem — DONE

Theme masuk `Web JSON` sebagai **kolom `D` terpisah** (BUKAN ke dalam MENU envelope kolom C), lalu `Web Theme` di-restructure (registry+template pindah ke bawah, editor value-column bebas tumbuh ke kanan) dan ditambah theme ke-3 `MIDNIGHT_BLUE`.

- **Ringkas:** `Web Theme` editor per-token → registry `A24:B100` → `Web Screen!B7` (selektor) / `B6` (VLOOKUP, cell dibaca) → `Web JSON!D6:D10` per-user. Per-tenant (semua user 1 theme).
- **📖 DETAIL LENGKAP:** `docs/vertika-web-theme-subsystem.md` (layout penuh, formula, cara edit/tambah/aktifkan, gotchas). **Untuk apa pun soal theme, baca itu.**

---

## 6. Fixture lokal

`json/web-json.json` (UNTRACKED di git) di-sync manual via script sementara (dibuat→jalan→hapus): pageData-strip + children-strip. `JSON.parse` OK. Indent 4-space.

---

## 7. Node `perubahanData` malformed — RESOLVED 2026-06-03

- **Gejala:** node `"key":"perubahanData","parent":"Workforce","pageData":contentSpreadsheet}` — `pageData` = literal `contentSpreadsheet` (tak ter-quote). JSON rusak.
- **Akar:** blok page `perubahanData` di `Web Screen` (rows 25-26) ke-geser turun 1 baris dari pola standar (bandingin `pendaftaranPegawai` rows 23-24). Formula header relatif ke-drag tanpa anchor:
  - `A25` (header key) KOSONG — harusnya spill `ARRAYFORMULA` range `A25:A26`.
  - `A26` (sub-row) malah isi single-cell spill → key `perubahanData` jatuh di sini (harusnya `1`).
  - `B25` (pageData) guard/title ref `A26` (harusnya `A25`).
  - `E25` (comma-form spill) range `A26` single → gak spill ke `E26` → `E26` kosong → `content:[]`.
  - Akibat: `VLOOKUP("perubahanData";'Web Screen'!A:B;2;0)` nyangkut di `A26`→`B26`=`"contentSpreadsheet"` (token content-row literal), bukan pageData JSON.
- **Fix (live 2026-06-03):** rewrite rows 25-26 samain pola `pendaftaranPegawai`:
  - `A25` = `=IF($B$16="";"";ARRAYFORMULA(IF(ROW(A25:A26)=ROW(A25);VLOOKUP("perubahanData";'Web Menu'!$J:$J;1;FALSE);ROW(A25:A26)-ROW(A25))))`
  - `A26` = **clear** (terima spill `1`).
  - `B25` = pageData formula, guard/title ref `A25`, sections `$E$26`/`$C$26`.
  - `E25` = `=ARRAYFORMULA(IF(A25:A26="";"";IF(NOT(ISNUMBER(A25:A26));"JSON";IF(ISERROR(D25:D26);"";IF(D25:D26="";"";IF(F25:F26<>TRUE;"";","&D25:D26))))))`
  - `E26` = **clear** (terima spill).
  - Sub-row (B26=`contentSpreadsheet`, C26=`content`, D26=widget gid=1209827602, F26=`TRUE`) DIBIARKAN — udah bener.
- **Verified:** `Web Menu!L6` node sekarang `"pageData":{...content:[{SPREADSHEET gid=1209827602}]...}` (object valid). Nyebar ke `_Helper Web JSON` + `Web JSON` via formula chain.
- **Gotcha clear-for-spill:** MCP `update_cells` dgn `""` BENER-BENER nge-clear cell (verified: gak ada `userEnteredValue` sisa) → array spill bisa flow. Aman dipakai buat reset cell sebelum tulis spill formula.

---

## 8. Pre-live move checklist (standing)

Saat pindah staging → live:
- Sheet live WAJIB locale `in_ID`.
- Pindah SELURUH dependency closure barengan: `Web Widget`, `Web Screen`, `Web Menu`, `Otorisasi Menu Web`, `_Helper Web JSON`, `Web JSON`, `Web Theme`. (`_Helper Web JSON` kritis — wrapper/envelope hidup di sana.)
- Hindari tabrakan nama tab.
- Setelah pindah: re-verify recalc (formula chain), cek `Web Screen!B6` resolve theme, `Web JSON` C+D terisi.

---

## 9. Pointer memory

- `web_builder_pattern.md` — index pola web-builder (incl. §Web Theme + §UPDATE 2026-06-02 late).
- `theme_subsystem.md` — index theme + pointer ke deep-dive.
- `feedback_mcp_gsheets_formula.md` — gotcha encoding formula MCP.
- `feedback_user_manual_edits.md` — user sering edit manual antar-turn; selalu re-read sebelum edit.
