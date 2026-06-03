# VTL Web Theme Subsystem — Onboarding Reference

> **Tujuan dokumen:** Arahkan session AI baru ke file ini supaya langsung paham theme subsystem di VTL web-builder — apa, di mana, alur data, formula persis, cara edit/tambah/aktifkan theme, dan history restructure terakhir.
> **Status:** Live & verified 2026-06-02.

---

## 0. Konteks & lokasi

- **Spreadsheet:** `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` — "Salinan dari Vertika Tekno Lokacipta Induk # Admin" (staging/copy, mau dipindah ke live).
- **Locale `in_ID`:** argumen formula pakai `;` (bukan `,`), array-literal pakai `\`. autoRecalc ON_CHANGE, timezone Asia/Jakarta.
- **Idiom WAJIB (op1Screen):** template ber-`[TOKEN]` + VLOOKUP + chained SUBSTITUTE. **DILARANG:** MAP/LAMBDA/LET/CHAR(34)/INDEX/MATCH. Boleh: IF/IFERROR/FILTER/TEXTJOIN/SUBSTITUTE/VLOOKUP.

**3 tab terlibat:**

| Tab | sheetId | Peran theme |
|---|---|---|
| `Web Theme` | 1329323748 | Definisi semua theme (editor per-token + registry + template). Source of truth. |
| `Web Screen` | 1566428883 | Selektor theme aktif (`B7`) + cell yang dibaca konsumen (`B6`). |
| `Web JSON` | 39406268 | Output per-user. Kolom `D` = theme JSON (terpisah dari MENU JSON di kolom `C`). |

---

## 1. Alur data (end-to-end)

```
Web Theme editor (kolom C/E/F…, baris 4-18 per-token)
        │  15× SUBSTITUTE($B$21 template, [TOKEN], nilai)
        ▼
Web Theme row1 (C1/E1/F1) = JSON theme ter-assemble
        │  registry A24:B100 nunjuk: A=nama(=C4/E4/F4)  B=json(=C1/E1/F1)
        ▼
Web Screen!B7 = nama theme AKTIF (mis "MINIMAL_GRAY")  ← ganti theme di sini
Web Screen!B6 = VLOOKUP(B7; Web Theme!A24:B100; 2)  ← cell yang dibaca
        ▼
Web JSON!D6:D10 = ='Web Screen'!$B$6 (per user)  ← theme JSON per-baris user
```

**Penting — theme TERPISAH dari MENU envelope.** Theme TIDAK masuk MENU JSON (`Web JSON!C`) maupun `_Helper Web JSON!E1`/`[THEME]` token. Theme = JSON sendiri di `Web JSON!D`. Per-tenant (satu theme untuk semua user; `B6` sumber tunggal).

---

## 2. Web Theme — layout lengkap

```
        A              B              C                 D        E                    F
row1                                 {minimal json}             {forest json}        {midnight json}   ← hasil substitute
row3   token          property       value (vertika)   note     value (forest_moss)  value (midnight_blue)
row4   [NAME]         theme name     MINIMAL_GRAY       custom   FOREST_MOSS          MIDNIGHT_BLUE
row5   [BG]           background     #ffffff            …        #f7fee7              #0f172a
row6   [FG]           foreground     #0f172a                     #365314              #f8fafc
row7   [PRIMARY]      primary        #6366f1                     #65a30d              #3b82f6
row8   [PRIMARY_FG]   primary-foreground  #ffffff                #ffffff              #ffffff
row9   [SIDEBAR]      sidebar        #1e293b                     #ecfccb              #1e293b
row10  [SIDEBAR_FG]   sidebar-foreground  #f8fafc                #365314              #f8fafc
row11  [NAVBAR]       navbar         #ffffff                     #f7fee7              #0f172a
row12  [NAVBAR_FG]    navbar-foreground   #0f172a                #365314              #f8fafc
row13  [BORDER]       border         #e2e8f0                     #bef264              #334155
row14  [MUTED]        muted          #f1f5f9                     #ecfccb              #1e293b
row15  [MUTED_FG]     muted-foreground    #64748b                #4d7c0f              #94a3b8
row16  [FONT_SIZE]    font-size      normal                      normal               normal
row17  [FONT_FAMILY]  font-family    inter                       inter                inter
row18  [RADIUS]       radius         0.5rem                      0.65rem              0.65rem
─────────────────────────────────────────────────────────────────────────────────────
row21  template       {…[TOKEN]…}                ← template JSON 1-baris (pindah dari H1)
row23  theme          json                       ← REGISTRY header (pindah dari F1:G1)
row24  =C4            =C1                         ← MINIMAL_GRAY
row25  =E4            =E1                         ← FOREST_MOSS
row26  =F4            =F1                         ← MIDNIGHT_BLUE
       … (theme baru lanjut ke bawah)
```

- **Editor value-column tumbuh ke KANAN:** C (vertika/minimal), E (forest), F (midnight), G+ (future). `D` = note (nyempil sekali antara C dan E; bukan referenced, biarkan).
- **Registry + template di BAWAH (col A/B)** supaya editor bebas ke kanan tanpa nabrak.

### Template (`B21`)
```
{"theme":"[NAME]","colors":{"background":"[BG]","foreground":"[FG]","primary":"[PRIMARY]","primary-foreground":"[PRIMARY_FG]","sidebar":"[SIDEBAR]","sidebar-foreground":"[SIDEBAR_FG]","navbar":"[NAVBAR]","navbar-foreground":"[NAVBAR_FG]","border":"[BORDER]","muted":"[MUTED]","muted-foreground":"[MUTED_FG]"},"typography":{"font-size":"[FONT_SIZE]","font-family":"[FONT_FAMILY]"},"radius":"[RADIUS]"}
```

### Assembler (`C1`, mirror di `E1`/`F1` ganti ref kolom)
```
=SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE($B$21;"[NAME]";C4);"[BG]";C5);"[FG]";C6);"[PRIMARY]";C7);"[PRIMARY_FG]";C8);"[SIDEBAR]";C9);"[SIDEBAR_FG]";C10);"[NAVBAR]";C11);"[NAVBAR_FG]";C12);"[BORDER]";C13);"[MUTED]";C14);"[MUTED_FG]";C15);"[FONT_SIZE]";C16);"[FONT_FAMILY]";C17);"[RADIUS]";C18)
```
- Token aman dari collision: base selalu tutup `]`, varian `_FG]` — substring base gak nyangkut di varian (urutan SUBSTITUTE bebas).

---

## 3. Web Screen — selektor & cell konsumen

| Cell | Isi |
|---|---|
| `A6` / `B6` | `Theme JSON` / `=IFERROR(VLOOKUP($B$7;'Web Theme'!$A$24:$B$100;2;FALSE);"")` — **cell yang dibaca** (output theme aktif). |
| `A7` / `B7` | `Theme name` / nama theme AKTIF (text, mis `MINIMAL_GRAY`). **Ganti theme = ubah B7.** |

- ⚠️ Blok `Web Screen` A6-A13 versi mobile lama (Theme color decimal/hex Android op1Screen) BEDA TOTAL — bukan dipakai web. A6/A7 di-repurpose buat web theme.

---

## 4. Web JSON — output per-user

```
       A          B               C            D
row1   Tenant     Vertika Tekno Lokacipta
row2   Description Field Operations Platform
row3   Logo …     https://…/vtl-icon-90x90.png
row5   VID        Akun Gmail      (MENU json)  Theme JSON
row6   60181816889090  suryawdj@gmail.com   {MENU envelope}  {theme json}
row7…  (4 user lain)
```
(metadata tenant lain: `E2`=Powered By, `E3`=Provider "Consteon")

- `D5` = `Theme JSON` header.
- `D6:D10` (5 user) = `=IF($B{r}="";"";'Web Screen'!$B$6)` → tiap user dapat theme aktif. Per-tenant (semua sama).
- **Kolom `C` (MENU envelope) TIDAK disentuh** — theme adalah JSON terpisah, bukan bagian menu.

---

## 5. Cara pakai (cheat-sheet)

### Edit warna theme yang ada
Ubah cell di kolom editor-nya. Contoh ganti background `MIDNIGHT_BLUE`: edit `Web Theme!F5` (lihat label `Web Theme!B5` = `background`). → `F1` auto re-assemble → registry `B26` auto → kalau aktif, propagate ke `Web JSON!D`.

### Tambah theme baru (mis. theme #4)
1. **Kolom editor baru** `G`: `G3` = `value (nama_theme)`, `G4:G18` = 15 nilai (urutan = baris 4-18), `G1` = copy formula `F1` ganti semua ref `F`→`G`.
2. **Registry +1 baris** (lanjut ke bawah): `A27` = `=G4`, `B27` = `=G1`.
3. Selesai — VLOOKUP `A24:B100` otomatis cover.

### Aktifkan theme
Set `Web Screen!B7` = nama theme (mis `MIDNIGHT_BLUE`). `B6` auto-VLOOKUP, `Web JSON!D` ikut.
⚠️ **Per-tenant:** ganti `B7` = ganti theme **semua user** sekaligus (B6 sumber tunggal).

---

## 6. Gotchas

- **Encoding formula via MCP gsheets `update_cells`:** akhiri string formula dengan `"` polos lalu `]]` — JANGAN `\"]]` atau `"]]]`.
- **MCP gak auto-adjust relative ref** di batch → tulis formula per-cell eksplisit (sebab assembler `E1`/`F1` ditulis manual, bukan fill-down).
- **`include_grid_data=true`** balon error kalau range kena cell JSON besar (mis Web JSON col C). Baca sempit / values-only.
- **Theme value-column vs note:** `D` = note nyempil antara C dan E. Tidak di-referenced assembler; abaikan, theme baru lanjut F/G/H… kontiguous.

---

## 7. History restructure (2026-06-02)

1. Theme awal: assembler `C1`, template parkir di `H1`, registry di `F:G`, value col cuma C+E. Plafon: theme ke-3 nabrak registry kol F.
2. **Theme masuk Web JSON kolom D** (request dev) — JSON terpisah, bukan ke MENU envelope.
3. **Restructure "registry ke bawah"** (request user): template `H1`→`B21`, registry `F:G`→`A24:B100`, repoint `Web Screen!B6` VLOOKUP ke `A24:B100`, editor value-column bebas tumbuh ke kanan. `MIDNIGHT_BLUE` ditambah sebagai editor kolom `F`. Sisa lama (`F2`,`G1:G4`,`H1`) dibersihkan.

Verified live: 3 theme di registry, JSON benar, `B6` resolve `MINIMAL_GRAY` aktif.

---

## 8. Referensi terkait

- Memory index: `web_builder_pattern.md` §"Web Theme tab 2026-06-02" + §"UPDATE 2026-06-02 (late)".
- Onboarding web-builder umum: `docs/vertika-web-builder-MASTER-REFERENCE.md`.
