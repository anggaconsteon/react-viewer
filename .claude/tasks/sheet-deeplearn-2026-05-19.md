# Deep Learning — VTL SSOT (2026-05-19)

**Spreadsheet:** `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8` (Vertika Tekno Lokacipta)
**Goal:** Deep-learn current state. Prior deep-dive 2026-05-13. Detect new subsystems.

## Tab Inventory (42 tabs)

```
RPA, System, Cost Center, Site, Pegawai, Web JSON, Otorisasi Menu Web, Web URL,
Web Menu, Component, Otorisasi Cost Center, Web Screen 2, Web Menu 2, Web Screen,
Otorisasi Cost Center 2, Otorisasi Checker, JSON, Filter, Pegawai Filter,
Pendaftaran Pegawai, Perubahan Data, PHK, Mutasi, Profil Perusahaan, Kontrak Kerja,
Konfigurasi App, Klien, Settings, Posisi, D, Kewenangan, helper dashboard,
Dasbor Umum, Location, LQR, Print - 2 - 16QR per page, Kuota,
Otorisasi, Otorisasi Approval, Approval Mapping, _Helper Approval, Copy of Approval Mapping
```

## NEW subsystem (added since 2026-05-13)

- `Otorisasi Approval` — RBAC for approvals
- `Approval Mapping` — Approval routing config
- `_Helper Approval` — Computed helper (underscore prefix = internal)
- `Copy of Approval Mapping` — Backup (skip, deprecated)

## Past Lessons Summary (from SSOT_MEMORY.md)

- Master SSOT VTL `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8`
- Versioned tabs: v2 active, v1 fossils (Web Menu/Screen/Cost Center)
- HR Process flag dispatch: col B=Process, last col=◆-joined `<action>◆<tenantVID>◆<fields>`
- D tab = RPA hub, ★ field sep (different from ◆)
- Delim inventory: ◆ U+25C6, ★ U+2605, ▶/◀ U+25B6/C, ◁/▷ U+25C1/3, ◼ U+25FC, ☆ U+2606, ● U+25CF, ◻/◇ proxy-only
- VID = 14-digit universal entity ID. Tenant VTL = 84214220504259
- Component placeholders = `[BRACKET_TOKEN]`, NOT widget DSL ◀N▶/◁N▷
- Cost Center URL bundle: fixed 7-slot order
- Web JSON C col MAP formula spills full user JSON

---

## New Findings (2026-05-19)

### Approval subsystem (NEW since 2026-05-13)

**3-tab pipeline:**

```
Otorisasi Approval (input, per-user level→CC matrix)
   │   col E-N = Level 1..10, each cell = CC name or "all-cost-center"
   ▼
_Helper Approval (staging)
   col A  Per-Row Rumus       — chain steps for the row's user
   col B  Per-Row CC           — joined CC names (◆)
   col D  All-CC × Level       — fan-out per CC at level N (10 rows)
   col E  Chain × Level        — trailing "APPROVED,...,PENDING" pattern
   col G  Dropdown CC Options  — picker source (G2 = sentinel "all-cost-center")
   col H  Detected Level Count — 10
   ▼
Approval Mapping (output cache, NOT formula in E2 — static string)
   A=VID  B=Nama  C=VID Cost Center (◆)  D=Cost Center (◆)
   E=Rumus → "[[chain1],[chain2],...]"
```

**Rumus DSL:**
```
[[◀7▶◼<CC_VID>◁1▷◼PENDING],
 [◀7▶◼<CC_VID>◁1▷◼APPROVED,◁2▷◼PENDING],
 [◀7▶◼<CC_VID>◁1▷◼APPROVED,◁2▷◼APPROVED,◁3▷◼PENDING]]
```
- `◀7▶`  = system stream token (approval slot marker — likely route/flag id 7)
- `◼`    = intra-record field separator U+25FC
- `◁N▷`  = form input slot for level N approval action
- comma  = step sep within one chain
- outer brackets = list of chains per CC
- `all-cost-center` = wildcard expanding to all CC VIDs at runtime

Sample (Marita NIP 7, levels 1-3 across Kantor Pusat/Induk/Product Group):
- Chain 1 (level 1 at Kantor Pusat): `[◀7▶◼32639062303108◁1▷◼PENDING]`
- Chain 2 (level 1-2 at Induk): `[...◁1▷◼APPROVED,◁2▷◼PENDING]`
- Chain 3 (level 1-3 at Product Group): `[...◁1▷◼APPROVED,◁2▷◼APPROVED,◁3▷◼PENDING]`

### Other findings

| Tab | Role |
|-----|------|
| `Otorisasi` | Per-user feature toggle matrix (Process flag in B, jabatan/CC/Site, action keys for Panic Button, Announcement, Checker, Reset, Approval, Monitoring, Reporting, Patrol). Cell value = action-key literal or `--`. |
| `Kewenangan` | Newer/successor draft of Otorisasi (adds Akun Email, Zona, Approval Leave). Mostly empty. Not yet active. |
| `Otorisasi Checker` | External/contractor checker assignments. Nama-NIP holds 16-digit KTP/NIK. A1=TRUE flag. |
| `Konfigurasi App` | Per-user feature flag matrix. Row 1 has banners (`Pengajuan` col R, `Persetujuan` col V). Per-user toggles for Tracking, Report, Time sheet, Checker, Cuti, Expense, Pinjaman + their approval counterparts. |
| `System` | Sparse, populated at col F-I row 1-2. F1=Dashboard sheet ID `1FTaIACxtt0...`, G1=tenant name, H1=tenant VID, I2=`7,00`. Scan WIDE not from A1. |
| `Web URL` | Dual-layout: cols A-D = per-CC menu→URL list; cols H-J = per-CC primary admin URL bundle. 4 admin sheet IDs (Induk, Kantor Pusat, Product Group + 3 menu-specific). |
| `JSON` | Legacy name→JSON registry (e.g. `logPresensi` → full inline TOPBAR+SPREADSHEET+BOTTOMBAR JSON). Fixture/reference, NOT the modern Component→Web Screen 2→Web JSON pipeline. |
| `Posisi` | Wide industry × role matrix. Row 1 = TRUE/FALSE enable flags per industry. Row 2 = industry headers (General/Security/Bank/...). Rows 3+ = `w-`-prefixed role codes per industry column. |
| `helper dashboard` | Staging for Dasbor Umum aggregations. Demographics: Gender, Status, Jabatan, Tingkat Pendidikan, Lama Bekerja, Umur, Gaji, plus helper bucket cols. |
| `Settings` | A1 = `#REF!` — broken or no longer used. |
| `RPA` | Empty in A1:Z5 (header offset elsewhere or unused). |
| `Copy of Approval Mapping` | Backup snapshot — IGNORE. |

## Open questions / pending probes

1. Where is the formula that *generates* Approval Mapping col E? E2 is a static string — confirm if there's a script (Apps Script) writing it, or a hidden formula in another cell that gets pasted as value.
2. What does `◀7▶` semantically denote — approval-route-id 7, or stream slot 7? Need to confirm vs the addToTable lesson "static first, dynamic last".
3. `Kewenangan` vs `Otorisasi`: is Kewenangan replacing Otorisasi, or both kept?
4. Settings tab `#REF!` — broken dependency?
