# Spreadsheet Deep-Learn — 2026-05-18

**Spreadsheet ID:** `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8`
**Tenant:** Vertika Tekno Lokacipta (VTL)
**Domain:** Consteon / Autsorz / Adrifa E-Patrol — field operations + HR + workforce platform
**Scope of task:** Onboarding (read-only deep-learn), no modifications

---

## Spreadsheet Schema (42 tabs)

### A. WEB BUILDER / CMS LAYER (SSOT for UI)

| Tab | Role | Key columns |
|---|---|---|
| `Component` | Component template library | A=componentId, B=type, C=variant, D=Placeholders (comma-sep), E=templateJSON with `[PLACEHOLDER]` tokens |
| `Web Screen 2` | Per-page config (current) | A=#, B=Page Key, C=Jabatan, D=Section (topbar/mainContent/bottomBar), E=Component, F-S=param values (≤14), T=Resolved JSON (MAP), U=pageData JSON (only topbar row carries assembled `{topbar,mainContent,bottomBar}`) |
| `Web Screen` | Legacy/v1 of Web Screen | Sparse |
| `Web Menu 2` | Navigation tree (current) | A=#, B=Level (1/2/3), C-E=menu hierarchy, F=Label, G=Icon, H=Path, I=urlSheet, J=Parent, K=Menu Key, L=Detail JSON (lvl3), M=Sub JSON (lvl2), N=Main JSON (lvl1, recursive children) |
| `Web Menu` | Legacy/v1 | A=JSON, C=Main, D=Sub, E=Detail, F=URL, G=Path, H=Icon, I=Parent, J=Key, K=Label |
| `Web URL` | Per-CostCenter menu→sheet URL routing | A=#, B=Cost Center, C=Menu, D=URL (multi-block pattern repeats horizontally) |
| `Web JSON` | Final per-user output | Rows 1-3 metadata: Tenant, Description, Logo, Provider. Row 5 headers: A=VID, B=Akun Gmail, C=JSON. C6 = MAP LAMBDA spills full per-user menu JSON |
| `JSON` | Reference catalog of page JSON | A=Name, B=JSON (full PAGE object for `logPresensi` etc.) |

### B. RBAC / OTORISASI LAYER

| Tab | Role | Key columns |
|---|---|---|
| `Otorisasi Menu Web` | User → menu group flags | A=#, B=Nama-NIP, C=VID, D=Akun Gmail, E-J=Dashboard/Workforce/Attendance/Operations/Reports/Request&Approval (TRUE/FALSE) |
| `Otorisasi Cost Center` | Cost Center × user matrix (legacy: emails as cols) | A=#, B=Cost Center, C+=email columns (TRUE/FALSE) |
| `Otorisasi Cost Center 2` | Cost Center × user (normalized: users as rows) | A=#, B=Nama-NIP, C=VID, D=Akun Gmail, E+=cost-center-name cols (TRUE/FALSE) |
| `Otorisasi` | Per-user operational rights (mobile/field) | VID, Status, Jabatan, CC, Site, Panic Receiver, Announcement, Checker, Reset, Approval Expense/Placement/Backup, Monitoring, Reporting, Patrol |
| `Otorisasi Checker` | Checker config per user | Process, VID, Nama-NIP, Jabatan, CC, Site, Zona, Checker, Reset, Approval Expense/Placement/Backup, Monitoring, Reporting, Patrol |
| `Otorisasi Approval` | Approver chain (up to 10 levels of cost centers) | VID, Nama-NIP, Status, Level 1..Level 10 |
| `Kewenangan` | Detailed authority matrix per user | VID, Nama-NIP, Jabatan, CC, Email, No.Ponsel 2, Zona, Checker, Approval Leave/Expense/Placement/Backup, Monitoring, Reporting, Patrol |

### C. APPROVAL ENGINE

| Tab | Role | Key columns |
|---|---|---|
| `Approval Mapping` | Per-approver flat `Rumus` chain | VID, Nama, Cost Center (◆-list), Rumus (`[[◀7▶◼<vid>◁1▷◼PENDING],...]` 2D array DSL) |
| `_Helper Approval` | Working scratch for Rumus assembly | Per-Row Rumus, Per-Row CC, All-CC × Level, Chain × Level, Dropdown CC Options, Detected Level Count |
| `Copy of Approval Mapping` | Stale clone — Level/Chain dropdown source | VID, CC, Jabatan, Rumus + Level/Chain reference cols |

**Rumus DSL** (matches `feedback_dsl_tokens.md`):
- `◀N▶` = system stream token (here ◀7▶ = approver VID slot fed from system)
- `◼` = field separator inside a row
- `◁N▷` = form-input level marker (◁1▷..◁N▷ = approval level N)
- `[ ]` row brackets, `[[ ]]` array of rows = chain of (CC × level) tuples
- Each inner row = approval path for one (CostCenter, levelCount) combination

### D. HR / EMPLOYEE FORMS (addToTable / updateTableRow targets)

| Tab | Role |
|---|---|
| `Pegawai` | Master employee table (NIK, NIP, Nama, Akun Gmail, Jabatan, Site, CC, Wilayah, ...) |
| `Pendaftaran Pegawai` | New hire form |
| `Perubahan Data` | Profile change (phone/email) form |
| `PHK` | Termination form |
| `Mutasi` | Transfer form (site/CC) |
| `Kontrak Kerja` | Employment contract details |
| `Konfigurasi App` | Per-user mobile app capabilities (timezone, check-in/out, status, tracking, report, time sheet, checker, recruiter, interviewer, request: leave/expense/loan, approve: leave/expense/loan) |
| `Profil Perusahaan` | Company profile (key-value layout, col A=label, col C=value) |
| `Klien` | Client master (VID, ID, Name, Site, Wilayah, PKS, dates, contact, address) |
| `Posisi` | Position taxonomy (16 industry groups × position codes `w-*`) |

### E. OPERATIONAL / FIELD-OPS

| Tab | Role |
|---|---|
| `LQR` | Patrol QR code map: position name, internal ID, long-form token |
| `Location` | Site geofence: Lat/Lng, ID/Nama, LID, Radius (m), Map URL |
| `Print - 2 - 16QR per page` | Print layout for LQR sheets |
| `Site` | Site master (extended Cost Center attrs: TAD, payroll period, cut-off, payroll date, work type) |
| `Cost Center` | Cost Center master (per-CC menu URL block: Admin/Absensi/Rekap Absensi/Rekap Payroll/Presensi Hari Ini/Laporan Pekerjaan/IT Admin) |
| `Kuota` | License usage tracking (period, employee count delta, purchased units, consumed) |

### F. DASHBOARDS / FILTERS / HELPERS

| Tab | Role |
|---|---|
| `Filter` | Generic scratch filter values |
| `Pegawai Filter` | QUERY-driven employee filter (`select * where LOWER(C)=LOWER('active') ...`) |
| `helper dashboard` | Aggregation helper (Nama/Gender/Status/Jabatan/Pendidikan/Lama/Umur/Gaji + DV helpers) |
| `Dasbor Umum` | Public dashboard view (currently `#REF!`) |
| `Settings` | Settings (currently `#REF!`) |
| `D` | Multi-purpose scratch tab — holds per-flow row templates (Presensi, Pegawai Baru, Update, PHK, Mutasi, Checker, Trickle-down) using `◆` and `★` delimiters |
| `RPA` | Empty / RPA target placeholder |
| `System` | Tenant constants: F1=`attendance`, G1=`auz1`, H1=`# Absensi`, I1=`7,00`, F2=master spreadsheet ID `1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A`, G2=`Vertika Tekno Lokacipta`, H2=VID `84214220504259` |

---

## Data Flow (current state)

```
Component.templateJSON                    Otorisasi Menu Web (user→menu flags)
   + Web Screen 2 params (F-S)            + Otorisasi Cost Center (user→CC flags)
     ↓ MAP T col                          + Web Menu 2 N col (lvl-1 JSON tree)
   Resolved JSON per row                    ↓ Web JSON C6 MAP LAMBDA
     ↓ MAP U col (topbar row)               Per-user MENU JSON {type,name,desc,logo,email,
   pageData {topbar,mainContent,bottomBar}  costCenters,footer,children}
                  ↓ (NOT yet wired)         ↓ spill C6:C100
              merge into children pageData
```

Approval flow (separate engine):
```
Otorisasi Approval (per-user Level1..LevelN cost centers)
  → _Helper Approval (build per-CC × per-Level chains)
  → Approval Mapping.Rumus (final 2D DSL: [[◀7▶◼VID◁1▷◼STATUS,...],...])
```

---

## Key conventions

- `◆` = multi-value separator (most lists, costCenters, options)
- `◼` = field separator inside a Rumus row
- `★` = field separator in `D` tab row templates
- `◀N▶` system-stream slot, `◁N▷` form-input slot (per `feedback_dsl_tokens.md`)
- `[ ]` Rumus row, `[[ ]]` Rumus array
- `[PLACEHOLDER]` in Component.templateJSON, substituted from F-S param cells
- VID = 14-digit numeric tenant-scoped entity id
- Locale `in_ID`: formula separator `;`, decimal `,`
- Indonesian + English mixed (Jabatan=position, Mutasi=transfer, Kewenangan=authority, PHK=termination)

---

## Known issues / gaps

1. **Web JSON pageData not wired** — children come from Web Menu 2 N col (no pageData). Jabatan source per user undefined.
2. **`[{}]` children edge case** — Otorisasi Menu Web label without matching `Web Menu 2.F` at level=1.
3. **`Settings` + `Dasbor Umum` show `#REF!`** — broken refs, low priority.
4. **`Copy of Approval Mapping` row 2 all `#REF!`** — stale clone.
5. **`Otorisasi Cost Center` (v1) vs `Otorisasi Cost Center 2` (v2)** — both live; v2 normalized (users as rows). Formulas reference v1.
6. **`Web Menu` (v1) vs `Web Menu 2` (v2)** — both live; current C6 formula references v2.
7. **Web Screen 2 only ~16 rows** — most pages (perubahanData, mutasi, phk, laporanPekerjaan, laporanInsiden, rekap*, operations) missing.
8. **`Site.G3 = #REF!`** (TAD active).

---

## Reference resources

- Memory: `project_spreadsheet_cms.md` (10 days old — verify before asserting)
- Memory: `feedback_dsl_tokens.md` (token semantics)
- Memory: `project_realestate_flow_design.md` (sibling RE flow spec)
- Formula files: `file/webjson_c_formula.txt`, `file/t_map_formula.txt`, `file/u_formula.txt`
- Local JSON dumps: `json/*.json` (live sources of truth user edits manually — re-read before any change)

---

## Next-step menu (when user picks a task)

- **Wire pageData** → need jabatan source decision
- **Add missing Web Screen 2 rows** → list of pages + component templates
- **Approval engine consolidation** → drop `Copy of Approval Mapping`, formalize `_Helper Approval`
- **Normalize Otorisasi v1 → v2** → migrate C6 formula and retire v1
- **Reverse-engineer `json/*.json`** → push into Component + Web Screen 2 (json-to-sheet-reverse agent)
- **Mock data seeding** → fill Pegawai/CC/Site sample rows for UI testing
