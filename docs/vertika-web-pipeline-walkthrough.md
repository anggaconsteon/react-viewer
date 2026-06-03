
# Vertika Web — Pipeline Walkthrough (1 Page, 2 User)

Tujuan: lihat ALUR UTUH dari "define page + widget" sampai "JSON final per user".
Page contoh sengaja dibuat KECIL (1 dropdown + 1 tombol) biar gampang diikuti.

---

## Pemain (tab) & perannya

| Tab | Peran | Analogi op1Screen mobile |
|---|---|---|
| `Web Widget` | Gudang template komponen (ber-token `[X]`) | `Widget` |
| `Web Screen` | Susun komponen jadi 1 page | `op1Screen` (baris widget) |
| `Web Menu3` | Pohon menu (nav) | `routeBar`/`vmenu` |
| `Otorisasi Cost Center 2` | Matrix: user mana boleh CC mana | (mobile gak ada, 1 user) |
| `Otorisasi Menu Web` | Matrix: user mana boleh menu mana | (mobile gak ada) |
| `Web JSON` | OUTPUT akhir, 1 baris per user | `JSON` |

---

## Aktor contoh

Tenant: **Vertika Tekno Lokacipta**

| User email | Cost Center yang dia punya |
|---|---|
| `admin@vertikatekno.com` | Head Office, Sales Division, Retail Channel |
| `budi@goto.com` | GoTo Kemang Timur, GoTo Bekasi |

Page contoh: **Sales Report** (`key: salesReport`), isi:
- topbar: dropdown Cost Center + tombol Apply
- spreadsheet (mainContent)
- bottomBar kosong

---

# LANGKAH 1 — `Web Widget` (tulis template SEKALI, dipakai semua page)

| A `widgetName` | B `paramList` | G `template` |
|---|---|---|
| `DROPDOWN` | `KEY,CELL,PLACEHOLDER,OPTIONS,EMPTY_TEXT,VARIANT` | `{"type":"DROPDOWN","key":"[KEY]","cell":"[CELL]","placeholder":"[PLACEHOLDER]","options":"[OPTIONS]","emptyText":"[EMPTY_TEXT]","variant":"[VARIANT]"}` |
| `BUTTON_SUBMIT` | `TEXT,DATA,ICON,TARGET,API_URL,SUCCESS,ERROR,THEN` | `{"type":"BUTTON","variant":"outline","size":"icon","icon":"[ICON]","text":"[TEXT]","data":"[DATA]","onClick":{"type":"SUBMIT","url":"[API_URL]","method":"POST","target":"[TARGET]","onSuccess":{"toast":"[SUCCESS]","then":"[THEN]"},"onError":{"toast":"[ERROR]"}}}` |

Token `[X]` = lubang kosong. Belum diisi.

---

# LANGKAH 2 — `Web Screen` (isi lubang, susun jadi page)

1 page = **1 baris header** + **N baris widget**.

### Baris-baris widget (isi param di kolom kanan):

| A `order` | B `widget` | C `section` | (param cells) | F `Displayed` |
|---|---|---|---|---|
| `1` | `DROPDOWN` | `topbar` | KEY=`costCenter` CELL=`Sales!B2` PLACEHOLDER=`Choose cost center` OPTIONS=`Semua◆[CC_LIST]` EMPTY_TEXT=`Cost center not found` VARIANT=`outline` | TRUE |
| `2` | `BUTTON_SUBMIT` | `topbar` | TEXT=`Apply` DATA=`costCenter` ICON=`FilterIcon` TARGET=`mainContent` API_URL=`https://autsorz.consteon.ai/api/spreadsheet` SUCCESS=`Filter applied successfully.` ERROR=`Failed to load data.` THEN=`REFRESH_CONTENT` | TRUE |

### Kolom D = hasil resolve (formula: `VLOOKUP(B, 'Web Widget'!A:G, 7) → SUBSTITUTE tiap token`)

Baris 1 (DROPDOWN) col D jadi:
```json
{"type":"DROPDOWN","key":"costCenter","cell":"Sales!B2","placeholder":"Choose cost center","options":"Semua◆[CC_LIST]","emptyText":"Cost center not found","variant":"outline"}
```
> PERHATIKAN: `[CC_LIST]` SENGAJA TIDAK diisi di sini. Dibiarkan utuh. Diisi nanti di Langkah 4 per-user.

Baris 2 (BUTTON_SUBMIT) col D jadi:
```json
{"type":"BUTTON","variant":"outline","size":"icon","icon":"FilterIcon","text":"Apply","data":"costCenter","onClick":{"type":"SUBMIT","url":"https://autsorz.consteon.ai/api/spreadsheet","method":"POST","target":"mainContent","onSuccess":{"toast":"Filter applied successfully.","then":"REFRESH_CONTENT"},"onError":{"toast":"Failed to load data."}}}
```

### Baris header page (kolom B) = bungkus semua widget jadi `pageData`:
(formula: ambil semua col D widget yg pageKey=salesReport, kelompokkan per section)
```json
{
  "label":"Sales Report","icon":"ChartLine","path":"/sales/report","key":"salesReport","parent":"Sales & Marketing",
  "pageData":{
    "title":"Sales Report",
    "topbar":{"alignment":"start","children":[
      {"type":"DROPDOWN","key":"costCenter","cell":"Sales!B2","placeholder":"Choose cost center","options":"Semua◆[CC_LIST]","emptyText":"Cost center not found","variant":"outline"},
      {"type":"BUTTON","variant":"outline","size":"icon","icon":"FilterIcon","text":"Apply","data":"costCenter","onClick":{"type":"SUBMIT","url":"https://autsorz.consteon.ai/api/spreadsheet","method":"POST","target":"mainContent","onSuccess":{"toast":"Filter applied successfully.","then":"REFRESH_CONTENT"},"onError":{"toast":"Failed to load data."}}}
    ]},
    "spreadsheet":{"id":"mainContent","src":"https://docs.google.com/spreadsheets/d/1B19.../edit","permission":"C◆U◆D"},
    "bottomBar":{"alignment":"end","children":[]}
  }
}
```
> Ini PAGE TEMPLATE. Masih ada `[CC_LIST]`. Sama buat semua user. Ditulis sekali.

---

# LANGKAH 3 — `Web Menu3` (taruh page di pohon menu)

| A `node JSON` | Main Menu | Sub Menu | Parent | Menu Key |
|---|---|---|---|---|
| `{"label":"Sales & Marketing","icon":"TrendingUp","path":"","key":"salesMarketing"}` | Sales & Marketing | | | salesMarketing |
| `{"label":"Sales Report",...,"key":"salesReport","parent":"Sales & Marketing"}` | | Sales Report | Sales & Marketing | salesReport |

Pohon: `Sales & Marketing` (grup) → `Sales Report` (page). pageData dari Langkah 2 nyangkut di node page ini.

---

# LANGKAH 4 — Matrix RBAC (siapa boleh apa)

### `Otorisasi Cost Center 2` (user × CC)

| email | Head Office | Sales Division | Retail Channel | GoTo Kemang Timur | GoTo Bekasi |
|---|---|---|---|---|---|
| `admin@vertikatekno.com` | TRUE | TRUE | TRUE | FALSE | FALSE |
| `budi@goto.com` | FALSE | FALSE | FALSE | TRUE | TRUE |

### `Otorisasi Menu Web` (user × menu)

| email | Dashboard | Sales & Marketing | Patrol |
|---|---|---|---|
| `admin@vertikatekno.com` | TRUE | TRUE | TRUE |
| `budi@goto.com` | FALSE | TRUE | FALSE |

---

# LANGKAH 5 — `Web JSON` (OUTPUT, 1 baris per user)

Formula (1 cell, di-spill ke bawah; locale `;` saat ditulis live):
```excel
=LET(
  eml,      B6,
  ccNames,  TEXTJOIN("◆"; TRUE;
              FILTER('Otorisasi Cost Center 2'!$B$1:$Z$1;
                     FILTER('Otorisasi Cost Center 2'!$B:$Z;
                            'Otorisasi Cost Center 2'!$A:$A = eml) = TRUE)),
  labels,   FILTER('Otorisasi Menu Web'!$B$1:$Z$1;
                   FILTER('Otorisasi Menu Web'!$B:$Z;
                          'Otorisasi Menu Web'!$A:$A = eml) = TRUE),
  children, MAP(labels; LAMBDA(lbl;
              SUBSTITUTE(
                VLOOKUP(lbl; 'Web Menu3'!menuLabel:pageJSON; 2; FALSE);
                "[CC_LIST]"; ccNames))),
  "{""type"":""MENU"",""name"":""Vertika Tekno Lokacipta"",""email"":"""&eml&""","&
  """costCenters"":"""&ccNames&""",""children"":["&TEXTJOIN(","; TRUE; children)&"]}"
)
```

Yang formula kerjakan per user:
1. `ccNames` = ambil header CC yang TRUE di baris user → join `◆`
2. `labels` = ambil menu yang TRUE → tentukan page mana masuk
3. `SUBSTITUTE [CC_LIST] → ccNames` di tiap page template
4. bungkus jadi envelope final

---

## HASIL AKHIR — bandingkan 2 user (cuma 1 beda!)

### `admin@vertikatekno.com`
```json
{
  "type":"MENU","name":"Vertika Tekno Lokacipta",
  "email":"admin@vertikatekno.com",
  "costCenters":"Head Office◆Sales Division◆Retail Channel",
  "children":[ ...Sales Report page... 
     "options":"Semua◆Head Office◆Sales Division◆Retail Channel"
  ]
}
```

### `budi@goto.com`
```json
{
  "type":"MENU","name":"Vertika Tekno Lokacipta",
  "email":"budi@goto.com",
  "costCenters":"GoTo Kemang Timur◆GoTo Bekasi",
  "children":[ ...Sales Report page... 
     "options":"Semua◆GoTo Kemang Timur◆GoTo Bekasi"
  ]
}
```

Page template IDENTIK. Yang beda CUMA:
- `email`
- `costCenters`
- `[CC_LIST]` di dalam dropdown → jadi list CC milik user itu

---

## Inti yang harus nempel

```
   DEFINE SEKALI                          RESOLVE PER USER
┌────────────────────┐                  ┌──────────────────────┐
│ Web Widget         │   template       │ Web JSON loop email: │
│ Web Screen  ───────┼─ ber-[CC_LIST] ──┼→ FILTER RBAC         │
│ Web Menu3          │   (user-agnostic)│  SUBSTITUTE [CC_LIST]│
└────────────────────┘                  │  → N output JSON     │
                                        └──────────────────────┘
        1 template            ──────►        N user JSON
                        (beda cuma token CC + menu visibility)
```

> Define page = SAMA GAMPANGNYA kayak mobile (1 page sekali tulis).
> Multi-user = 1 formula di Web JSON. Kamu gak pernah nulis page per-user.

---

## Urutan kerja (build checklist)

1. `Web Widget` — pastikan komponen yang dibutuhkan ada (DROPDOWN, BUTTON_SUBMIT, dst)
2. `Web Screen` — tulis baris widget + isi param; biarkan `[CC_LIST]` utuh
3. `Web Screen` header row — formula bungkus pageData
4. `Web Menu3` — daftarkan page di pohon menu
5. `Otorisasi *` — centang TRUE/FALSE per user
6. `Web JSON` — formula resolver (tulis SEKALI), spill per user
7. App baca baris Web JSON sesuai email login → render
8. User pilih CC di dropdown saat jalan → POST API → mainContent refresh (CC aktif TIDAK disimpan di sheet)
