# Spreadsheet Deep Dive — op1Screen + Widget

**Spreadsheet**: `Salinan dari agenia demo-7 | Proxy`
**ID**: `14-pQyZfq28kXGCSe0Ys0ue2IiqN3PKFjSmeYRshzHk4`
**Timezone**: Asia/Jakarta
**Total tabs**: 58
**Recalc**: ON_CHANGE

## Tab inventory (58)

JSON, Icon, Locale, Channel, Service, Settings, System, ThemeVertika, ThemeAgenia,
CommSettings, Freq, HomeNews, News, Keys, SubmitSync, SubmitASync, Startup, Article,
**Widget**, **op1Screen**, MyAccountUpdate, Event, op1, Plug, JSON2, MyAccountData,
myAccountObject, myAccountScreen, auzSettings, route, Draft, Outbox, SS, SAS, Misc,
autsorzScreen, autsorzScript, SystemHealth, LocIDCorrection, CostCtrSite, ProxyHealth,
UpdateHistory, op1History, op1Script, InLedger, OutLedger, ReceiveASync, fixedChannel,
fixedArticle, auzChannel, auzArticle, auzWhiteLabel, base, op1RecentLedgers, op1Checker,
UQR, Format, RBD, StopService

---

## Widget tab — Component Library / SSOT

**Dimensions**: 1150 × 10, 1 frozen row.

### Column map

| Col | Header | Purpose |
|-----|--------|---------|
| A | Widget name | Unique key (e.g. `text`, `button1`, `checkInQrSelfieGps`) |
| B–F | Parameter 1–5 | Optional fill values (rarely used in row data; instances usually defined in op1Screen) |
| G | JSON | **Final composed JSON** with placeholders substituted from B–F |
| H | (registry) | Pointer string `widgetName▶Widget!Jrow` (or `◆widgetName▶Widget!Jrow` from row 3+) |
| I | Widget name | Duplicate of A (display) |
| J | Base JSON | **Template** with `[PLACEHOLDER]` tokens |

### Key formulas

- **`H1`** = `=CONCATENATE(H2:H)` — builds giant **registry string** of every widget pointer, separated by `◆`. Used as visual index in header (frozen row).
- **`H2`** = `=IF(A2="", "", IF(ROW()<=2, "", "◆")&$A2&"▶Widget!"&CHAR(64+COLUMN($J$1))&ROW())`
  - Builds `widgetName▶Widget!J<row>` per row, prefixed with `◆` from row 3+. `CHAR(64+COLUMN($J$1))` resolves to `J`.
- **`G2`** = `=IF(ISERROR(J2), "", J2)` — passes J through when no params needed.
- **`G3`** = `=SUBSTITUTE(J3, "[IMAGE]", B3)` — substitutes B param into J template (per-widget formula varies; columns C-F substituted similarly per widget).
- **`J col`** — hardcoded base JSON template strings.

### Placeholder tokens (in J col templates)

`[IMAGE]`, `[IMAGE1]`, `[IMAGE2]`, `[IMAGE3]`, `[DATA]`, `[DATA1]`, `[DATA2]`, `[DATA3]`,
`[ROUTE]`, `[ROUTE1]`, `[ROUTE2]`, `[ROUTE3]`, `[LABEL]`, `[VALUE]`, `[HINT]`,
`[ICON]`, `[POSITION]`, `[VARIANT]`, `[TEXT1]`, `[TEXT2]`, `[TEXT3]`,
`[FOLDER]`, `[FILENAME]`, `[LOCLIST]`, `[FLAG]`, `[OPTION1]`, `[OPTION2]`,
`[SIGNATURE]`, `[FAKEGPSALLOWED]`, `[OUTPOSITIONALLOWED]`, `[ADDTOTABLE]`

### Special separators in widget JSON

- `◆` (U+25C6) — multi-string separator inside `text` field (used for compact i18n / multi-message bundles e.g. clock-in screens).
- `▶` (U+25B6) — pointer separator in registry (`name▶Widget!Jrow`).

### Widget catalog (~140 widgets, by group)

- **Layout/Static**: `horizBanner`, `topImage`, `image`, `separator`, `text`, `textRoute`, `html`, `horizontalLine`, `displayStaticField`
- **Buttons**: `button1`, `button2`, `button3`, `button1Medium`, `signOutButton`, `buttonRoute`, `SendButton*`, `sendApprovalButton`, `deleteButton`, `approvalButton`, `iconRoute`, `routeBar1/2/3`
- **Form fields**: `textField`, `textFieldReadOnly`, `dateField`, `expDateField1/2`, `numericField/Medium/Large`, `entryField`, `qrScanner`, `qrTextField`, `lqrTextField/1/2`, `uqrTextField`, `pqrTextField`, `pinEntry`, `txfWithSendButton`, `getCCNumber`, `getCCExpire`, `getMoneyInput`, `autoNumber`
- **Choice**: `radio`, `radio2`, `radio3`, `radioEntry1/2`, `checkbox`, `checkbox1`, `switch`, `dropDown`, `dropDownInitValue`, `displayDropDownData`, `choiceButtonGroup`
- **Pickers**: `timePicker`, `datePicker`, `dateTimePicker`, `contactPicker`, `getImages`, `getImages1`
- **Display blocks**: `displayList`, `displayTable`, `displayTableInteractive`, `displayCard2Data`, `displayCardWalletTopup/Transfer`, `viewPdf`, `qrDisplay`, `photoDisplay1/2`, `vmenu`, `_displayWidgetList`, `progressBar`, `tasklist`, `headerApproval`, `workerCardDetail`, `approvalDetail`, `commentSection`
- **Composites (icons)**: `checkInQrSelfieGps`, `checkInQrSelfie`, `checkInQrGps`, `checkInQr`, `checkInSelfieGps`, `checkInSelfie`, `checkInGps` and `clockIn*`/`clockOut*` mirrors (7 each)
- **Domain**: `autsorzTracker/Report/Recruit/Recap`, `autsorzRequest{LeaveExpenseLoan,LeaveExpense,LeaveLoan,Leave,ExpenseLoan,Expense,Loan}`, `autsorzApproval*` (7 mirrors)
- **Icons** (SVG/font code): `icon-gps-1/2`, `icon-qr-display-1/2`, `icon-qr-scan-1/2`, `icon-selfie-1/2`
- **Misc**: `searchFromTable`, `searchFromTableConsteon`, `locationDetector`, `timePresence`, `passwordDialog`, `resetVid`, `checkerQRPhoto`, `sendButtonGpsAddTable/2`, `3LineBorderForm`, `display1/2SendButton[Gps]`, `display2CancelOk[GpsRight]`

### JSON `type` codes seen

`BNR` banner, `IMG` image, `TXT` text, `HTML`, `CTX` checkbox, `QR`, `RAD` radio, `RTF` rich/dropdown text-field, `TXF` text field (variants: `generic|date|numeric|pin`), `RBT` round button, `HORIZONTAL_ICON`, `location`.

---

## op1Screen tab — Page Definitions / SSOT

**Dimensions**: 13630 × 24, no frozen rows. Huge.

**Theme**: `autsorz` (`{"themeName":"Autsorz.autsorz","primaryColor":4278196850,"bottomAppBarColor":4293454582}`).

### Top header zone (rows 1–13)

| Cell | Content / Formula |
|------|-------------------|
| A1 | `op1Screen` (sheet identity) |
| C1 | Formula: `="●"&LOWER($A$1)&"-version="&B3&"●"&LOWER($A$1)&"-sheet-dimensions="&B4&"●"` → `●op1screen-version=2411.1●op1screen-sheet-dimensions=24x13630●` |
| A3:B4 | Version `2411.1`, dimensions `24x13630` |
| A6:B13 | Theme JSON, theme name, color1/2/3 (decimal + hex) |
| C3:E13 | Mock action codes (e.g. `check-in`/`302001`, `check-out`/`302002`, `clock-in`/`302003`, `clock-out`/`302004`) — formula `=OFFSET(auzSettings!$C$3:$I$112, 0, 0)` pulls a 110-row slab from the `auzSettings` tab. |
| H3:I8 | Mock employee fields (NIP, Nama Depan, Nama Belakang, Label, No. Ponsel, Akun Gmail, Grade, Grup) |
| M3:O75 | **Schedule lookup table** (date → shift). |
| M3 | `=TODAY()-WEEKDAY(TODAY(),2)+1` (week-start Monday). |
| N3 | `=VLOOKUP($M3, $M$14:$O$75, 2, False)` (shift code). |
| O3 | `=VLOOKUP(M3, $M$14:$O$74, 3, False)` (shift label). |
| Q14+ | Date strip (1-Dec → ...) with shift label and combined `Day, dd-Mmm - Shift`. |
| V/W cols | Recent attendance log (date, in time, out time). |

### Role code lookup (rows 10–113)

Cols C/D = role code → label (one slab), cols F/G = same (sorted differently). `w-account-officer 301005`, `w-administration 301010`, `w-bank-teller 301020`, … all the way through `w-collection 301520`. **~110 employee role codes**, all numeric in the 301xxx range.

### **Screen Definition zone (rows 130 onward)** — THE MERGE

Each row = **one widget instance on a screen**. Rows are grouped to compose pages.

| Col | Purpose |
|-----|---------|
| A | Sequence # within page (`2`, `3`, …) |
| B | **Widget name** — looked up in Widget tab via VLOOKUP |
| C | (route / page key — sometimes blank) |
| D | **Final filled JSON** for this widget instance — produced by VLOOKUP + chained SUBSTITUTE |
| E | `,{...}` form (D prefixed with comma) — used for concatenation when row visible |
| F | Visibility flag (`TRUE`/`FALSE`) — gates inclusion |
| G | Size hint (`small`/`medium`/`normal`) — also fed back as `[ROUTE]` substitution in some rows |
| H–T | Per-row parameter slots: `[LOCLIST]`, `[FOLDER]`, `[FILENAME]`, `[IMAGE1/2/3]`, `[FLAG]`, `[FAKEGPSALLOWED]`, `[OUTPOSITIONALLOWED]`, `[ADDTOTABLE]`, … |
| I | Suffix string concatenated into VLOOKUP key (with `◆` stripped) for variant lookup |

### **The Master Merge Formula** (col D, e.g. row 146 = `clockIn`)

```excel
=SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
   SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
     VLOOKUP(B146 & SUBSTITUTE(I146,"◆",""), Widget!$A:$G, 7, FALSE),
   "[ROUTE]",   G146),
   "[LOCLIST]", H146),
   "[LABEL]",   J146),
   "[FLAG]",    P146),
   "[FOLDER]",  K146),
   "[FILENAME]",L146),
   "[IMAGE1]",  M146),
   "[IMAGE2]",  N146),
   "[IMAGE3]",  O146),
   "[FAKEGPSALLOWED]",    R146),
   "[OUTPOSITIONALLOWED]",S146),
   "[ADDTOTABLE]",        T146),
   "✔️ Check in dg",
     IF($E113<>"off","✔️ Check IN dg","✔️ Check IN dg")
)
```

**How it works:**
1. **Lookup** — `VLOOKUP(B146 & I146-stripped, Widget!$A:$G, 7, FALSE)` finds the widget by name in column A of Widget tab and pulls col **G (final JSON template)**.
2. **Substitute** — Each `[PLACEHOLDER]` token in the returned template is replaced with the per-row value (cols G–T).
3. **Conditional patch** — Trailing `SUBSTITUTE(..., "✔️ Check in dg", IF(...))` flips a default i18n string when the screen is in/out variant.
4. **Result** lands in col D as a complete JSON object string for that widget instance.
5. Col E = `,` + D (only when col F = TRUE) — prep for array concatenation. Final per-page JSON = `CONCATENATE` of col E across the page's row range (built elsewhere — likely op1Script or further down op1Screen).

### Special widget rows seen in screen def (rows 130–146 sample)

```
2  separator   {"type":"TXT",...,"size":4,"data":" "}      (small)
3  text        {"type":"TXT","size":28,"data":"Tugas"}     (medium)
4  text        ...Jadwal hari ini 08:00-17:00              (small)
5–8 text       Cek kebersihan koridor / kelengkapan / kaca / lapor   (small)
9  text        Lokasi tugas: Teraskota                      (normal)
10 separator                                                (small)
11 text        Lokasi saat ini: BSD Tech Center #26         (normal)
12 separator                                                (small)
13 text        Jadwal Hari Ini                              (normal)
14 separator   afterSpacing:12                              (normal)
15 vmenu       (#N/A — composite, expects external data)
16 separator                                                (small)
17 checkIn     full HORIZONTAL_ICON cluster (QR/Selfie/GPS) — produced by VLOOKUP into checkInQrSelfieGps base
...
146 clockIn   produced by master formula above
147 clockOut  same pattern
```

---

## Pipeline summary (data flow)

```
Widget tab (col A=name, J=base template, G=substituted JSON)
        │
        │  H col registers each widget as `name▶Widget!Jrow`
        │  H1 = CONCATENATE(H2:H) → full registry string (header)
        ▼
op1Screen tab (rows 130+ = screen rows)
   col B  pick widget by name
   col D  = SUBSTITUTE…(VLOOKUP(B & I-suffix, Widget!A:G, 7, FALSE), [tokens], local-cells)
   col E  = "," & D   (gated by col F = TRUE)
   col G  size hint, also feeds [ROUTE] substitution in some rows
        │
        ▼
A consumer (op1Script / op1 tab) concatenates col E across each page's row range
→ final screen JSON = `[{widget1},{widget2},…]`
        │
        ▼
Frontend reads the merged JSON page and renders.
```

## Key gotchas / non-obvious

- `◆` (U+25C6) is a **load-bearing delimiter** in two contexts: (a) widget registry separator in `Widget!H1`, and (b) i18n/multi-string packer inside individual widget `text` fields (e.g. clock-in error catalogues). Do not strip blindly.
- Col I in op1Screen rows is a **variant suffix** appended to widget name for the VLOOKUP key (e.g. lookup `clockIn` vs `clockIn-overtime`). The leading `◆` is stripped before the join.
- `_displayWidgetList` (Widget!J105) is a meta-widget: indicates the screen's body slot for nested widget arrays.
- `op1Screen!C3` pulls 110 rows from `auzSettings!C3:I112` — auzSettings is the upstream source for action codes / employee strings. Editing op1Screen C–G data won't stick unless auzSettings is updated.
- `#N/A` cells in row 15 (`vmenu`) and N/O cols are EXPECTED — they get resolved at consume time when the row's lookup key matches actual runtime data.
- Trailing IF in clock formula references `$E113` (a row 113 cell) for off-shift toggling — schema-coupled, do not move that anchor.
- Widget rows occasionally have **gaps** (J20, J28, J40, J45, J54, J62, J70, J72, J77, J84, J99, J102, J115, J123, J131, J133, J142, J149) — H col formula `IF(A=, "", ...)` correctly produces empty string so registry stays clean.

## Open questions (worth confirming before edits)

1. Where exactly is the per-page `CONCATENATE` of col E? (Likely `op1Script` tab or a hidden col in op1Screen.) → Inspect `op1Script` next.
2. How does the frontend know which row range = which page/route? Look for a "page index" formula keyed by route name.
3. Is `JSON` tab populated dynamically (it appears empty) or is it the publish target?
