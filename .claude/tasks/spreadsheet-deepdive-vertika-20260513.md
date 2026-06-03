# Spreadsheet Deep Dive — Vertika Tekno SSOT

**ID**: `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`
**Tenant**: Vertika Tekno Lokacipta (VTL) — `VID 84214220504259`
**Date**: 2026-05-13
**Tabs**: 38

---

## Past Lessons (from SSOT_MEMORY.md)
- `◆` (U+25C6) primary multi-value delimiter
- `▶` (U+25B6) legacy registry pointer
- `in_ID` locale (`;` sep, `,` decimal)
- MCP `update_cells` formula encoding: end with plain `"]]`
- LET var naming: avoid cell-ref patterns
- Field ordering in addToTable/updateTableRow: session/tenant tokens low, user-input high
- DSL tokens: ◀N▶=system stream, ◁N▷=form input
- User edits files mid-turn → re-read before edit

---

## Tab Catalog (38 tabs) — Roles

### 1. Master / Identity
| Tab | Role |
|---|---|
| **System** | F1-I1: stream config (`attendance`/`auz1`/`# Absensi`/version). F2-H2: master sheet ID + tenant name + tenant VID |
| **Profil Perusahaan** | Single-record vertical: VID, name, NPWP, BPJS, alamat, logo URL. col A=label, col C=value |
| **Pegawai** | Master employee table. Cols 1-11: #/VID/Status/NIP/Nama/Ponsel/Gmail/Jabatan/Site/Cost Center/Wilayah. Cols 12-26+: KTP/personal data |
| **Posisi** | 16-col category matrix. Row 1=TRUE/FALSE pick flags. Row 2=category (Semua/General/CleaningService/Security/School/Airline/CallCenter/Parking/Hotel/Building/Bank/Hospital/Consultant/Sales/Warehouse/Bakery). Rows 3+=role codes (w-ceo/w-bod/w-director/...) |
| **Klien** | Client master. # / VID Klien / Nama / Site / Wilayah / No PKS / Tgl Awal-Akhir Kerjasama / Alamat |
| **Cost Center** | # / VID / Nama klien / Cost center / Wilayah / Status / G=multi-URL bundle (◆-joined) / H-N: 7 individual menu URLs (Admin/Absensi/RekapAbsensi/RekapPayroll/Presensi/LaporanPekerjaan/ITAdmin) |
| **Site** | Per-site config. Same 7-URL bundle as Cost Center. Extra: TAD active / Periode gaji / Cut-off / Tgl pengajian / Tipe pekerjaan / `vtl◆<slug>` flag strings |
| **Location** | GPS geofence. # / Site flag / Lat / Lng / Nama Lokasi / LID / Radius (m) / Map |
| **LQR** | Location-QR registry. col H=name (TPI-Absensi, TPI-Parkiran...) / I=short token (`0l...`) / J=long QR token (`26...`) |

### 2. HR Transaction (Process-flag pattern)
All HR tabs share same pattern: **col B = Process (TRUE/FALSE) trigger**, last col = `◆`-joined payload string sent to RPA when Process flips to TRUE.

| Tab | Action prefix | Payload schema (`◆`-joined) |
|---|---|---|
| **Pendaftaran Pegawai** | `new` | `new◆<tenantVID>◆NIP◆Nama◆Ponsel◆Gmail◆Jabatan◆VID◆VID◆BerlakuMulai` |
| **Perubahan Data** | `Perubahan` | `Perubahan◆<tenantVID>◆VID◆Nama◆PonselBaru◆GmailBaru◆Ponsel◆Gmail◆VID◆VID` |
| **PHK** | `Status` | `Status◆<tenantVID>◆VID◆Nama◆Alasan◆TglEfektif◆Keterangan◆Ponsel◆VID◆VID` |
| **Mutasi** | `Status` | `Status◆<tenantVID>◆VID◆Nama◆VIDCCBaru◆VIDSiteBaru◆TglEfektif◆Ponsel◆VIDCCAsal◆VIDSiteAsal` |
| **Kontrak Kerja** | (master, no Process flag) | Full employment contract: Grade/Grup/Divisi/Departemen/Seksi/TglMasuk/NomorKontrak/TglAwal-Akhir/NamaServis/Posisi/StatusPegawai/PeriodCutoff |

### 3. UI / Widget Layer
| Tab | Role |
|---|---|
| **Component** | Widget template library. A=componentId, B=type, C=variant, D=Placeholders (comma-sep), E=templateJSON with `[TOKEN]` slots. 9 components: topBar1-no-dd / topBar1-1dd / topBar1-2dd / topBar1 (3dd) / mainContent-spreadsheet / mainContent-map / mainContent-custom / bottomBar / bottomBar-reset-only |
| **Web Screen 2** ⭐ | Per-page rows. B=pageKey, C=jabatan, D=section(topbar/mainContent/bottomBar), E=componentId, F-S=14 param slots. **T col formula**=Component resolver (VLOOKUP template + 14× SUBSTITUTE). **U col formula**=topbar/mainContent/bottomBar assembler keyed by (pageKey, jabatan), populated only on topbar rows |
| **Web Menu 2** ⭐ | Hierarchical nav. B=level(1/2/3), F=Label, G=Icon, H=Path, I=urlSheet, J=Parent, K=key. L/M/N=spilled MAP formulas building level-3/2/1 JSON. NO pageData (architecture: jabatan-agnostic) |
| **Web JSON** ⭐ | Per-user output. A1-B3=tenant header. Row 5=headers (VID/Gmail/JSON). Rows 6+: one user per row. C6 spills full MENU JSON per user (LET+MAP+FILTER+INDEX assembling menus + cost centers from RBAC matrices) |
| **Web URL** | Cost center × menu → spreadsheet URL lookup (per-CC menu URL inventory) |
| **JSON** | Literal sample/cached pages. A=Name, B=JSON. Page samples (logPresensi, etc.) for testing |
| **Web Menu** (v1) | DEPRECATED. Flat menu rows. Replaced by Web Menu 2 |
| **Web Screen** (v1) | DEPRECATED. Header-only stub. Replaced by Web Screen 2 |

### 4. RBAC
| Tab | Role |
|---|---|
| **Otorisasi Menu Web** | Menu RBAC matrix. # / Nama-NIP / VID / Gmail / Dashboard / Workforce / Attendance / Operations / Reports / Request & Approval (cells TRUE/FALSE) |
| **Otorisasi Cost Center 2** ⭐ | Cost-center RBAC matrix. # / Nama-NIP / VID / Gmail / Induk / Kantor Pusat / Product Group (cells TRUE/FALSE). Active version |
| **Otorisasi Cost Center** (v1) | DEPRECATED transposed layout (cost-center per row, email per column) |
| **Otorisasi** | Per-user feature flags. Process / VID / Status / Ponsel / Jabatan / Cost Center / Site / Panic Button / Announcement / Checker / Reset / Approval{Expense,Placement,Backup} / Monitoring / Reporting / Patrol |
| **Otorisasi Checker** | Bulk role assignment to KTP IDs. Process=TRUE rows ship `checker-back-multiple-qr-photo` role |
| **Kewenangan** | Similar to Otorisasi, cleaner schema. Likely WIP/abandoned |
| **Konfigurasi App** | Per-user app config: Status / Timezone / Check in/out / Status / Tracking / Report / Time sheet / Checker / Rekruter / Interviewer / Pengajuan{Cuti,Expense,Pinjaman} / Persetujuan{Cuti,Expense,Pinjaman} |

### 5. Filters / Query Helpers
| Tab | Role |
|---|---|
| **Filter** | Cross-CC scratch (A1=CC name, C1=`Kantor Pusat◼Product Group` with `◼` delim). Used by frontend filter dropdowns |
| **Pegawai Filter** | Filtered employee view. Row 1 cells=filter state (Status, Site, Cost Center). P1=QUERY string `select * where LOWER(C) = LOWER('active') and 1=1 Order by H Asc`. Spills filtered Pegawai rows |

### 6. Reporting / Dashboard
| Tab | Role |
|---|---|
| **Dasbor Umum** | Dashboard display layout (Tren Pengeluaran Gaji, Dasbor Karyawan, date filters) |
| **helper dashboard** | Helper computations for dashboard charts (Gender / Status / Nama Jabatan / Tk Pendidikan / Lama Bekerja / Umur / Gaji bins + DV helper columns) |
| **D** | **Dispatch/data hub**. Column inventory: A=Perubahan Data payloads, B=Presensi Hari Ini list (`VID★Nama★CC★Site★Wilayah★Jabatan★Status` with **`★` delim**), C=Validasi Nama-NIP, D=VID, E-J=HR action payloads grouped by type, K=Trickle down per cost center |
| **Kuota** | Monthly quota tracker. Pegawai count × bulan = total kuota. Jan-2026: 50 × 12 = 600 |
| **Print - 2 - 16QR per page** | Print layout for QR badges |
| **RPA** | Empty. RPA receiver placeholder |
| **Settings** | `#REF!` — broken/deprecated |

---

## Three Core Pipelines

### A. Component → Web Screen 2 → Web JSON

```
Component tab
  A=componentId, D=Placeholder list, E=templateJSON with [TOKEN]
              │
              │  VLOOKUP by componentId
              ▼
Web Screen 2  (col E=componentId, F-S=14 param values, B=pageKey, C=jabatan, D=section)
  T col (MAP, spills T2:T16):
    LET(tmpl=VLOOKUP(E;Component!A:E;5);
        plist=SPLIT(VLOOKUP(E;Component!A:D;4);", ");
        nested 14× SUBSTITUTE(tmpl;"["&INDEX(plist;1;n)&"]";xn))
  U col (MAP/IF, spills U2:U16):
    Only fires if D2="topbar" (topbar row is the "anchor" row per page+jabatan group)
    Assemble {topbar:T-of-topbar-row, mainContent:T-of-mc-row, bottomBar:T-of-bb-row}
    by FILTERing T:T where B=pageKey AND C=jabatan AND D=section
              │
              ▼
Web JSON      (per-user MENU JSON, spilled C6:C100)
  MAP(B6:B100;LAMBDA(eml;
    costCenters from Otorisasi Cost Center matrix (col-major TRUE filter)
    children = JSON array of level-1 menus from Web Menu 2 N col,
               filtered by Otorisasi Menu Web row's TRUE columns
    output: {"type":"MENU","name":VTL,"description":...,"email":eml,
             "costCenters":eml's CC list ◆-joined,"children":[...]}))
```

⚠ **Open issue (from memory)**: pageData (Web Screen 2 U col) NOT yet wired into Web JSON children. Blocker: per-user jabatan not exposed in Web JSON. Children currently come from Web Menu 2 N (jabatan-agnostic nav, no pageData).

### B. HR Form → RPA Dispatch (Process flag)

```
User fills HR form on tab (Pendaftaran/Perubahan/PHK/Mutasi)
       │
       │  Form sets col B (Process) = TRUE
       │  Spreadsheet recomputes last col = `<action>◆<tenantVID>◆<field>◆<field>◆...`
       │
       ▼
RPA bot listens for Process=TRUE rows, reads payload from last col
       │
       │  Dispatches via D tab (action-grouped payload lanes)
       │
       ▼
Master tables updated (Pegawai status flipped, Mutasi reassigns CC/Site)
       │
       │  RPA toggles col O (Status update) and unsets Process
```

Payload schema is **column-named** (sheet header text matches placeholder name in payload string), e.g.:
`Status◆84214220504259◆VID◆Nama◆Alasan◆Tanggal Efektif ◆Keterangan◆No. Ponsel◆VID◆VID`
↔ headers: `Status / VID / Nama - NIP / Alasan / Tanggal Efektif / Keterangan / No. Ponsel / VID / VID`

### C. RBAC Resolution

```
Otorisasi Menu Web (user × 6 menu groups → TRUE/FALSE)
        +
Otorisasi Cost Center 2 (user × CC → TRUE/FALSE)
        +
Web Menu 2 N col (level-1 menu JSON per label)
        │
        ▼
Web JSON C col formula resolves per user:
  - INDEX/MATCH to find user's row in each matrix
  - TRANSPOSE+FILTER to get list of permitted menu labels
  - MAP each label → MATCH against Web Menu 2 F col (level-1 rows only) → fetch N col JSON
  - Assemble into children array
```

---

## Multi-Delimiter Inventory

| Char | Unicode | Use |
|---|---|---|
| `◆` | U+25C6 | Primary delim: payloads, costCenters, multi-strings, URL bundles |
| `★` | U+2605 | D tab dispatch row delim (`VID★Nama★CC★Site★...`) |
| `▶` | U+25B6 | Legacy widget registry pointer (Widget!H col, old spreadsheet) |
| `◼` | U+25FC | Filter tab CC list (`Kantor Pusat◼Product Group`) |
| `☆` | U+2606 | Filter tab alt joiner (`Consteon Jakarta☆Kantor Pusat`) |
| `🠈` / `🠊` | U+1F808/A | UI button label arrows (Kirim send buttons) |

⚠ Multiple delimiters coexist — **never strip blindly**. Pick the right one per consumer.

---

## VID System

- VID = **14-digit numeric universal entity ID** (e.g. `60181816889090`)
- Single key space across: Pegawai, Klien, Cost Center, Site, Profil Perusahaan
- Tenant VID: `84214220504259` (baked into HR payloads as static literal)
- Cost Center VIDs (VTL): `84214220504259` Induk / `32639062303108` Kantor Pusat / `83674161979544` Product Group
- Form/spreadsheet-baked VIDs appear as **literal strings** in HR payloads (not session tokens) — they're columns on the form row that the formula concatenates in

---

## Versioning (v1 deprecated vs v2 active)

| Deprecated | Active | Why migrated |
|---|---|---|
| Web Menu | Web Menu 2 | Hierarchical 3-level formulas (L/M/N) vs flat literal JSON |
| Web Screen | Web Screen 2 | Component-driven with 14-param resolver vs blank stub |
| Otorisasi Cost Center | Otorisasi Cost Center 2 | User-per-row matrix (cleaner) vs transposed CC-per-row |

v1 tabs remain for reference. Do NOT edit; treat as fossils.

---

## Cost Center Structure (VTL)

```
Vertika Tekno Lokacipta (tenant VID 84214220504259)
├── Induk (root, VID 84214220504259)
│      menu URLs: Rekap Absensi / Rekap Payroll / Presensi Hari Ini / Laporan Pekerjaan
├── Kantor Pusat (VID 32639062303108, Wilayah Kantor)
│      menu URLs: Admin / Absensi / Rekap Absensi / Rekap Payroll
└── Product Group (VID 83674161979544, Wilayah Product)
       menu URLs: Admin / Absensi / Rekap Absensi / Rekap Payroll
```

Each CC owns 7 menu URL slots: Admin / Absensi / Rekap Absensi / Rekap Payroll / Presensi Hari Ini / Laporan Pekerjaan / IT Admin. Bundled `◆`-joined in col G + repeated in individual cols H-N.

---

## Key Formulas (verified)

**Web Screen 2 T col** (`file/t_map_formula.txt`):
```
=MAP(E2:E16;F2:F16;...;S2:S16;LAMBDA(xcomp;xa;...;xn;
  LET(tmpl=VLOOKUP(xcomp;Component!A:E;5;FALSE);
      praw=VLOOKUP(xcomp;Component!A:D;4;FALSE);
      plist=SPLIT(praw;", ");
      sa=SUBSTITUTE(tmpl;"["&INDEX(plist;1;1)&"]";xa);
      sb=SUBSTITUTE(sa;"["&INDEX(plist;1;2)&"]";xb);
      ... 14 chained SUBSTITUTEs ...
      sn)))
```

**Web Screen 2 U col** (`file/u_formula.txt`):
```
=IF(D2<>"topbar";"";LET(pk=B2; jb=C2;
  tb=INDEX(FILTER(T$2:T$100; B$2:B$100=pk; C$2:C$100=jb; D$2:D$100="topbar"); 1);
  mc=...; bb=...;
  "{""topbar"":"&tb&",""mainContent"":"&mc&",""bottomBar"":"&bb&"}"))
```

**Web JSON C col** (per-user MENU): see SSOT_MEMORY.md, working ✅.

---

## New Lessons Worth Saving

1. **HR Process-flag pattern** — every HR transaction tab uses col B=Process(TRUE/FALSE) + last col=`<action>◆<tenantVID>◆<fields...>` payload. Payload field order matches column header text. RPA listens for TRUE rows.

2. **D tab is dispatch hub** — aggregates per-action payloads from all HR tabs into action-grouped lanes. Use `★` for record fields and `◆` for record separator in K col (`vid★name★cc★...◆vid★name★cc...`).

3. **Component tab uses bracketed-token placeholders** — `[ALIGNMENT]`, `[KEY1]`, `[OPTION1]`, `[FETCH_URL]`. NOT `◀N▶` or `◁N▷` (those are widget DSL tokens, different layer).

4. **Cost Center G col is `◆`-joined URL bundle** of 7 menu URLs in order: Admin / Absensi / Rekap Absensi / Rekap Payroll / Presensi Hari Ini / Laporan Pekerjaan / IT Admin. Cols H-N hold same URLs individually.

5. **Pegawai Filter uses QUERY syntax** in helper cells: `select * where LOWER(C) = LOWER('active') and 1=1 Order by H Asc`. Editable filter state lives in row 1.

6. **v1 tabs (Web Menu, Web Screen, Otorisasi Cost Center) deprecated** but kept. Read but do NOT write.

---

## Open Questions / Blockers

1. ⚠ **Web JSON pageData injection still pending** (memory pending #1). Per-user jabatan source still unclear.
2. ⚠ **Web Screen 2 needs rows for missing pages**: perubahanData, mutasi, phk, laporanPekerjaan, laporanInsiden, rekapAbsensi, rekapPayroll, operations sub-pages.
3. ⚠ **Settings tab = `#REF!`** — investigate; possibly safe to delete or repurpose.
4. ⚠ **Kewenangan tab nearly empty** — superseded by Otorisasi? Confirm before any rewrite.
5. ⚠ **RPA tab empty** — receiver placeholder or unused?
