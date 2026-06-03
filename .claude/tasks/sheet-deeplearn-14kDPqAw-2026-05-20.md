# Deep-Learn: Spreadsheet `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`

Date: 2026-05-20
Verdict: **NEW VTL master SSOT** — refactor of legacy `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8`.

## Identity

- Tenant: Vertika Tekno Lokacipta (VTL), VID `84214220504259`
- Logo URL + Dashboard child sheet `1FTaIA...K7Hb4A` — identical to legacy
- System tab populated F1:I2 (same offset-not-origin pattern as legacy)
- Tab count: 42

## Tab inventory (42)

```
RPA, System, Cost Center, Site, Pegawai,
Web JSON, Web Menu 2, Web Screen 2, Otorisasi Menu Web,
Jabatan Hirarki,                              ← NEW
Otorisasi Approval, Approval,
Konfigurasi Approval Modul,                   ← NEW
_Helper Approval, Otorisasi Cost Center,
Component, Web URL,
Web Menu3 ,                                   ← NEW (trailing space!)
Otorisasi Cost Center 2, Otorisasi Checker,
JSON, Filter, Pegawai Filter,
Pendaftaran Pegawai, Perubahan Data, PHK, Mutasi,
Profil Perusahaan, Kontrak Kerja, Konfigurasi App, Klien,
Settings, Posisi, D, Kewenangan, Otorisasi,
helper dashboard, Dasbor Umum,                ← NEW pair
Location, LQR,                                ← NEW pair
Print - 2 - 16QR per page,                    ← NEW
Kuota                                         ← NEW
```

## What's NEW vs legacy

### `Web Menu3 ` (trailing space in name) — flat menu schema
Replaces Web Menu 2 hierarchical L/M/N. Single row per menu node.
Cols: A=full JSON, C=Main Menu, D=Sub Menu, E=Detail Menu, F=URL, G=Path, H=Icon, I=Parent Menu, J=Menu Key, K=Menu Label.
JSON in col A is hand-or-formula-built single-level object with `parent` field. Children resolved at Web JSON assembly time, NOT by chained MAP cols.
PHK now nests under Mutasi (`parent:"Mutasi"`) — fix of legacy "PHK as direct Workforce child".

### `Konfigurasi Approval Modul` — per-CC per-fitur approval policy
Cols: A=#, B=VID, C=Cost Center, D=Fitur, E=Level, F=Rumus.
Rumus DSL (NEW, simpler):
```
[[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]
```
Each inner `[level, status, , , , ]` = one step in N-level chain. 6 slots = level + status + 4 reserved.
Seeds: Kantor Pusat × request-leave/request-overtime, Product Group × same.
This is **policy template per (CC, fitur)** — distinct from per-user Otorisasi Approval and from final Approval rumus.

### `Jabatan Hirarki` — w-* role hierarchy
Cols A=#, B=Jabatan code. Ordinal ranking 1→N: `w-ceo, w-bod, w-director, w-management, w-general-manager, w-senior-manager, w-manager, w-hr, w-hr-admin, w-payroll, w-trainer, w-secretary, w-finance, w-general-affair, w-administration, w-accounting, w-crew, w-tax, ...`
Extracted out of legacy Posisi industry-matrix into pure ordered rank list. Use for level-comparison logic.

### `Location` + `LQR` + `Print - 2 - 16QR per page` — geo/QR subsystem
- Location: A=process flag, header row 2: `# | Site flag | Lattitude | Longitude | ID/Nama Lokasi | LID | Radius (m) | Map | All`. Process flag col A=FALSE, "Print LQR" trigger at E1, counter at G1.
- LQR: row N cols H/I/J = `<location-name> | 0l<40-hex LID> | <140-char QR token>`. LID prefix `0l` denotes location token. TPI-* = site sub-points (Absensi, Parkiran Motor/Mobil, Office, Smoking Area, Collecting Tank, Gedung MPB, etc.)
- Print sheet for batch-printing 16 QR codes per A4 page.

### `Kuota` — monthly headcount quota ledger
Row 1: title. Row 2 headers: `Periode | Jumlah Pegawai Awal Bulan | Penambahan | Pengurangan | Pembelian Kuota | (Unit row labels) | Bonus | Kuota Terpakai | Kuota Tersedia`.
Units: Pegawai × Bulan. Jan-2026: 50 pegawai × 12 bulan = 600 unit beli → decrements 50/month → Apr-2026 = 450 sisa.

### `Dasbor Umum` + `helper dashboard` — analytics
Dasbor Umum has #REF! errors (tanggal hari ini broken). Two sub-dashboards: Tren Pengeluaran Gaji, Dasbor Karyawan, date range starts 1 Agu 2025.
helper dashboard: per-pegawai roll-up — Nama, Gender, Status, Jabatan, Pendidikan, Lama Bekerja, Umur, Gaji + helper cols (Helper Umur, total jumlah, Helper DV Jabatan aktif, helper lama kerja, total, Helper dv tingkat pekerjaan). Some `#REF!` in row 3 col O.

## Pipelines (vs legacy)

### Web JSON generation — UNCHANGED skeleton
- Component templates with `[BRACKET_TOKEN]` placeholders (same Component tab).
- Web Screen 2: 19 param cols (F-T), T col=Resolved JSON, U col=pageData per (pageKey, jabatan). Row 1 has 4 active pages so far: `dashboard`, `logPresensi` (rows 1-4 only).
- Web JSON: headers row 1-3 (Tenant/Description/Logo+Provider), row 5 headers `VID | Akun Gmail | JSON`, row 6+ per-user. C6 spilled MAP formula produces full nested children JSON. Live output verified for 4 users (suryawdj, dsambas, dyani.saryono, rika39538).

### Approval pipeline — 3 inputs now (was 2)

```
Konfigurasi Approval Modul   (per-CC × fitur policy: level count, status seed)
  +
Otorisasi Approval           (per-user × level → CC scope; all-cost-center keyword)
  +
Cost Center tab              (CC name → CC VID resolution)
  ↓
_Helper Approval             (staging matrix: Per-Row Rumus, Per-Row CC,
                              All-CC × Level (rows 1-10), Chain × Level,
                              Dropdown CC Options, Detected Level Count)
  ↓
Approval                     (output: VID, Nama, VID Cost Center ◆-join,
                              Cost Center ◆-join, Rumus)
```

Output DSL = SAME as memory lesson 2026-05-19:
```
[[◀7▶◼<CC_VID>◁1▷◼PENDING],
 [◀7▶◼<CC_VID>◁1▷◼APPROVED,◁2▷◼PENDING],
 ...]
```
Tokens: `◀7▶` system stream marker, `◼` U+25FC field sep, `◁N▷` form input level N slot, status ∈ {PENDING, APPROVED}.

Example output (Surya Widjaja, all-cost-center on Level 2, Induk◆Kantor Pusat◆Product Group):
8-chain rumus combining single-level scenarios + 2/3-level approval chains across all 3 CCs.

### RPA dispatch — D tab unchanged
Col A starts populated again with Process payload rows. Col B=Presensi Hari Ini list (`VID★Nama★Cost Center★Site★Wilayah★Jabatan★Status`). Action lanes E-K identical to legacy memory: PegawaiBaru / UpdateData / PHK / mutasi / checker / Trickle down. `★` U+2605 = field sep INSIDE record, `◆` = record sep.

### Settings + RPA tabs — broken/empty
- Settings!A1 = `#REF!` (formula breakage)
- RPA tab = empty (placeholder)

## Conventions confirmed (same as legacy)

| Delim | U+ | Use |
|---|---|---|
| `◆` | 25C6 | record sep / CC name list / payload field sep |
| `★` | 2605 | D-tab field-inside-record sep |
| `◼` | 25FC | Approval rumus intra-step field sep |
| `◀7▶` | 25C0/25B6 | system stream slot 7 marker (approval level scope) |
| `◁N▷` | 25C1/25B7 | form input slot N |
| `[TOKEN]` | brackets | Component template placeholder |
| `🠈 / 🠊` | 1F808/1F80A | UI hint arrows, not data |

## VID inventory (same)
- VTL Tenant / Induk CC: `84214220504259`
- Kantor Pusat CC: `32639062303108`
- Product Group CC: `83674161979544`

## Gaps / broken state
1. `Settings!A1 = #REF!` — must trace formula source
2. `Dasbor Umum!G3 = #REF!` (tanggal hari ini) + `helper dashboard!O3 = #REF!`
3. `RPA` tab empty — placeholder or migration in-flight
4. `Konfigurasi Approval Modul` only seeds 4 rows (KP/PG × leave/overtime). Other CCs (Induk) and fitur (request-trip, request-overtime-multi, etc.) missing.
5. `Web Screen 2` only 4 rows resolved (dashboard, logPresensi). Other pageKeys (laporanPekerjaan, daftarPegawai, etc.) need adding.
6. `Web Menu3 ` has trailing space in tab name — rename to `Web Menu3` recommended.
7. `Web Menu 2` still exists alongside `Web Menu3 ` → confirm which is wired into Web JSON C formula (legacy used Menu 2 N col).

## Open questions (RESOLVED 2026-05-20 live re-check)

### Q1: Web Menu3 vs Web Menu 2 — which drives Web JSON?
**ANSWER: Web Menu 2 still drives.** Web JSON C6 formula reads from `'Web Menu 2'!$N:$N` (Main JSON col). Web Menu3 NOT YET wired — migration in flight. Web Menu 2 N col already contains the PHK-under-Mutasi fix (parent rewrite happened in BOTH tabs). Web Menu 2 cols: A=#, B=Level, C=Main Menu, D=Sub Menu, E=Detail Menu, F=Label, G=Icon, H=Path, I=urlSheet, J=Parent Menu, K=Menu Key, L=Detail JSON, M=Sub JSON, N=Main JSON.

### Q2: Konfigurasi Approval Modul wiring
**ANSWER: NOT YET wired into Approval rumus generation.** Approval col E rumus assembled from `_Helper Approval` static template matrix (10-level pre-computed). Konfigurasi Approval Modul = future seed/policy doc (4 rows: KP+PG × leave+overtime, simpler `[1,PENDING,,,,,]` per-level DSL). Likely planned: ordinal `Level` count → trim Helper template to N levels; current Helper hard-coded to 10.

### Q3: Jabatan Hirarki consumer — unknown, likely supervisor-level comparison logic (not yet wired).

### Q4: Location/LQR — standalone QR-printing system. Not yet linked to Pegawai Site col (no FK observed). TPI-* sub-points are sub-locations of a single Site, printed via Print sheet.

## Verified live state (2026-05-20)

### Web JSON C6 formula (CURRENT — uses Web Menu 2 N col)
```
=MAP(B6:B100;LAMBDA(eml;IF(eml="";"";LET(
  q;CHAR(34);
  ccstr;IFERROR(TEXTJOIN("◆";TRUE;FILTER(
    'Otorisasi Cost Center'!$B$2:$B$200;
    INDEX('Otorisasi Cost Center'!$A$2:$Z$200;0;MATCH(eml;'Otorisasi Cost Center'!1:1;0))=TRUE
  ));"");
  mrow;MATCH(eml;'Otorisasi Menu Web'!$D:$D;0);
  children;IFERROR("["&TEXTJOIN(",";TRUE;MAP(
    FILTER(TRANSPOSE('Otorisasi Menu Web'!$E$2:$J$2);TRANSPOSE(INDEX('Otorisasi Menu Web'!$E:$J;mrow;0))=TRUE);
    LAMBDA(lbl;IFERROR(INDEX('Web Menu 2'!$N:$N;MATCH(1;('Web Menu 2'!$F:$F=lbl)*('Web Menu 2'!$B:$B=1);0));"{}"))))
  &"]";"[]");
  "{"&q&"type"&q&":"&q&"MENU"&q&...
))))
```
Header row offset fixed: `FILTER(TRANSPOSE('Otorisasi Menu Web'!$E$2:$J$2);...)` — uses row 2 labels not row 1 (was row 1 in legacy formula). Verified output for 4 users.

### _Helper Approval matrix layout (10-row × 4-col template)
- A col `Per-Row Rumus`: single-CC single-level (per-user CC scope)
- B col `Per-Row CC`: CC name for A
- D col `All-CC × Level` (rows 1-10): `[3-CC × N-level pattern]` precomputed for all 3 VTL CCs at each level depth N=1..10
- E col `Chain × Level` (rows 1-10): trailing suffix per N
- G col `Dropdown CC Options`: `all-cost-center`, Induk, Kantor Pusat, Product Group
- H col: `10` (level cap)

### Otorisasi Approval per-user assignment (sparse, single-level)
| VID | Nama | Lv1 | Lv2-10 |
|---|---|---|---|
| 91234922513369 | Denny D Sambas | Induk | — |
| 60181816889090 | Surya Widjaja | — | — |
| 72333032338989 | Autsorz ID | Kantor Pusat | — |
| 80883888051110 | Dirgahayu | Product Group | — |
| 87544551624342 | Agenia Demo-7 | — | — |

→ Approval output rumus = single-CC-single-level only. Multi-level chains untested in current data.

### Konfigurasi Approval Modul (4 seed rows)
| CC | Fitur | Level | Rumus |
|---|---|---|---|
| Kantor Pusat | request-leave | 3 | `[[1,PENDING,,,,],[2,PENDING,,,,],[3,PENDING,,,,]]` |
| Kantor Pusat | request-overtime | 3 | same |
| Product Group | request-leave | 3 | same |
| Product Group | request-overtime | 3 | same |
Note: NOT yet read by Approval formula. Future use.

### Spreadsheet identity
- Title: `Salinan dari Vertika Tekno Lokacipta Induk # Admin` — this IS the Induk CC Admin master (renamed/copied from `1uWKx...`)
- Locale: `in_ID`, timezone `Asia/Jakarta`, autoRecalc `ON_CHANGE`
- Dashboard child: `1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A` — same as legacy
- Web JSON sheet dimensions: 604 rows × 10 cols, sheetId `39406268`

## Next steps (proposed)
1. Migrate Web JSON C formula to read from `Web Menu3 ` col A (resolve parent→children at JSON-assembly time instead of pre-chained M/N cols)
2. Wire Konfigurasi Approval Modul Level/Rumus into _Helper Approval matrix (variable depth per CC × fitur)
3. Populate Otorisasi Approval Level 2-10 for at least 1 test user to validate multi-step chain
4. Fix Settings!A1 #REF! + Dasbor Umum!G3 / helper dashboard!O3 #REF!
5. Wire Location LID into Pegawai Site col (if intended)
6. Rename `Web Menu3 ` → `Web Menu3` (drop trailing space)
