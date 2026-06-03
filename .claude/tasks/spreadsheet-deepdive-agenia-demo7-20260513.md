# Spreadsheet Deep Dive — Agenia Demo-7 (per-user proxy)

**ID**: `1xk_p10C303QWJQq7h435dVXrQaXsXRZQ9IYjO1lYQGU`
**Title**: "Salinan dari agenia demo-7 | Proxy" (sibling of op1Screen deep-dive sheet `14-pQyZfq28kXGCSe0Ys0ue2IiqN3PKFjSmeYRshzHk4`)
**Date**: 2026-05-13
**Tabs**: 58 (same tab list as op1Screen sheet — same proxy template)

---

## Identity & Role

This sheet is the **per-user proxy / session backend** for ONE Autsorz mobile app user, not the master Vertika SSOT. It mirrors mobile-app state, queues outbound events, decrypts inbound ledger payloads.

| Field | Value |
|---|---|
| User VID | `87544551624342` |
| User name | Agenia Demo-7 |
| Phone | `62812981761217` |
| Gmail (corrupted) | `5/6/2026 17:17:01` (timestamp stored as email — proxy bug `profile-qr-display`/`org-vids-different`) |
| Provider | Vertika Tekno Lokacipta (VID `84214220504259`) |
| Cost center / Site | Product Group (VID `83674161979544`) |
| Position | `w-security` |
| Provider flag | `autsorz◆vtl◆product-group` |
| Theme | autsorz (primary `4278196850` / bg `4293454582` / accent `4294111986`) |
| Mobile version | `0.9.78.28` (deprecated → mandatory update banner) |
| Proxy version | `2210.1` |
| Master LIF sheet | `1hdcFg4_0_sbj3bOjP4YKlzlqdAlV1qdaGfdsIaQ4WkE` |
| Master VID listener | `1Wy75JA2sM7OZbKk-OaJqPr0d_BfMvStbkF6-RlJqAlE` (VTL master `84214220504259`) |
| Last event row | 491 (`491100229`) |
| Recovery stamp UTC | 31-Jan-2026 (`1769817600000`) |
| RBC stamp UTC | 5-May-2026 (`1777939200000`) |
| RBD stamp | `1778645712035` (last login `13-May-2026 11:15`) |
| Proxy health | `op1-blockchain-node-blank, profile-qr-display, org-vids-different, sheet-dimention-21x700` |

---

## Tab Catalog (58) — Roles

### 1. Identity / Auth
| Tab | Role |
|---|---|
| **System** | A1=last event row. **B1** = giant log payload (`◻`-sep records, `◼` field sep, `①` prefix) + `●`-control block (vid/user/ssid/phone/email/time-zone/version/last-login/last-event/bad-event-ledgers...). J15 = literal delimiter inventory cell |
| **Settings** | VID/Name/Gmail/Phone + crypto keys (priv, pub, Otonomiq pub, Auth1/Auth2 version/prefix/marker/aux/expiration) |
| **Keys** | Pointer to master sheet IDs (LIF + Account) |
| **Profil** (in op1) | Provider/CC/Site/Position/verification toggles |

### 2. Theme / Locale / Icons
| Tab | Role |
|---|---|
| **JSON** | 4 named JSON blocks: `Mobile` (bottomBar 4 icons), `ThemeVertika`, `ThemeAgenia`, `Locale` |
| **ThemeVertika** | JSON: `{"themeName":"vertika","primaryColor":4278196850,"bottomAppBarColor":4293454582}` + brandColor1..4 |
| **ThemeAgenia** | Same shape, `brandColor2=4294935040` (orange) |
| **Locale** | id_ID config + token-by-token formula scratch (column B=key, C=value) |
| **Icon** | Icon name → Flutter material code map (`person`=59389, `mobilePhone`=58148, `mail`=57569, `home`=59530...) + data-type tag |
| **Format** | Font-size visual rendering scratch (`Abc Abc Abc...` rows for 10/11/12/14/18) |

### 3. Channel / Article (community feed)
| Tab | Role |
|---|---|
| **Channel** | Channel registry. Cols: Selected (TRUE flag — current selection: Autsorz row 8) / Freq (click count) / VID / Order / Update / Label / Name / Flag◆Folder◆Icon / Count / News blob. Plus N×{Order, VID, Update, Label, Name, Icon, News} blocks side-by-side per channel |
| **Article** | Per-VID article entries aligned to Channel rows |
| **News** | Chronological news (col A=CBLNTime as Google date float `43616.5761...`, col B=HTML) |
| **HomeNews** | Per-VID home-screen articles. H1/I1 = HTML wrapper formula prefixes (`{"type":"HTML",...,"data":"<img...>...</p>"}`) |
| **fixedChannel** / **fixedArticle** | Legacy/seed channel registry (HS Test, RD Test, Dashboard, Issue, Banner, Qeera, Autsorz, Agenia, Schania, Acme...) |
| **auzChannel** | White-label tenant registry (SDM, Nawakara, KAM, GOS, SR Legals, BIJAK, SGrS, GDPS, DSM) |
| **auzArticle** | Articles per white-label tenant + Apklindo Jabar + Alteriz Team |
| **auzWhiteLabel** | Source→channel cross-walk (autsorz, apklindo-jabar, alteriz-team) |
| **Freq** | VID → click freq for channel-list sort |

### 4. UI Composition (Widget DSL pipeline)
| Tab | Role |
|---|---|
| **Widget** | 172 widget templates. Col A=name, J=base template `[TOKEN]` placeholders, G=substituted final, H=`name▶Widget!Jrow` registry, H1=`CONCATENATE(H2:H)` full registry string |
| **op1Screen** | Per-page widget rows (13630×24). Col A=seq, B=widget name, C=route, D=master merge formula (VLOOKUP+13×SUBSTITUTE), E=`,`+D when F=TRUE, F=visible flag, G=size hint, H-T=`[TOKEN]` param slots. Master formula in row 146 produces clockIn-style JSON. Theme JSON A6:B7. Schedule lookup M3:O75. Role codes ~110 rows |
| **op1Script** | Single-event ledger resolver (current event row 491). Decrypts `0attendance-check-in◆ts◆checkpoint◆QR◆lat◆lng◆◆ID◆postal◆province◆kab◆kec◆village◆street◆#◆loc-flag⬤` → tokenized cols + builds `01778636100229◼VID◼SiteVID◼log◼security-clock-in◼locName◼QR◼[lat,lng]◼img◼address◻VID☆Name◻CCVID☆CCName...` log string |
| **op1History** | Empty event-history layout (61 rows). Headers: #/Local time/Ledger code/Description 1/Description 2/Approval/Image/GPS/Event row |
| **op1Checker** | Bulk checker mode. A4 = list of event rows. A5 = time threshold + slot pointers. A6 = common-data template. A8 = tokenized current event |
| **op1RecentLedgers** | Recent ledger cache (large) |
| **autsorzScreen** | Legacy autsorz screen def (10x190 dim). Schema-identical to op1Screen but for old `autsorz` route — kept for migration |
| **autsorzScript** | Per-script localization table. K col=Text id (208201, 208221, 208151...), L=English, M=Selected language. Holds error strings like "Unknown location"→"Lokasi tidak dikenal", "Location QR unregistered", "GPS is not compatible" |
| **myAccountScreen** | Profile/Pribadi/KTP screen JSON definitions. Col C = full `{"title":..., "children":[{HGR},{TXF}...]}` JSON for `profile`, `personal`, `ktp` routes. Embedded `currentValue` shows user's actual data (NIP, NPWP, name, NIK, address) |
| **myAccountObject** | Per-route HGR icon registry (Profil, Pribadi, KTP, VTL routes) |
| **MyAccountData** | KTP master data (NIK / Nama / Tempat Lahir / Tanggal / Jenis Kelamin / Gol. Darah / Alamat / RT-RW...) per field with icon + type + text-id |
| **MyAccountUpdate** | Change-detection: Init / Last update / Updates triples per route. Includes Checksum + timestamp + ◆-joined payload data (profile/personal/ktp/future routes). "Time Stamp Differs" row 3 flags FALSE per field |
| **CommSettings** | SDM employee form schema (NIP*, Nama Depan, Nama Belakang, Label, No. Ponsel, Akun Gmail, Grade, Grup, Divisi...) |
| **Plug** | Per-screen integration map. Cols: Screen group (Info/Draft/Autsorz/Qeera) / Home screen JSON / Subscreen / Object name / Object prefix / Collation / Object / JSON / Row / Object / Collation / Object / JSON / Collation / Object / JSON. Col O lists VTL sub-screens: `vertikaTeknoLokaciptaApproveFinal{Attendance/Backup/DayOff/Leave/Overtime/SickLeave/Trip}` + `LogHistory/LogPresensi/LogReport{Briefing,Complaint,Daily,Inspection,...}` — each with full assembled `{"title":"VTL","children":[{HGR},{TXT},{TXF tableSearch table:vtl.workforce},{DRD},{TXF date},{GET_IMAGES},{RBT savesend flag:approve-final-X}]}` JSON |
| **base** | 3 primitive widget JSON building blocks: `home`, `topMain` (HGR Autsorz/VTL/Info), `topProfile` (HGR Profile/Pribadi/KTP/VTL). Plus need-to-update banner JSON. Used as common substrings concatenated into per-screen output |
| **Service** | Per-channel-object service JSON assembly (autsorz / vertikaTeknoLokacipta / info). Col G builds `{"title":...,"children":[{HGR icons row},{HTML body}]}`. F col holds `,{HTML,...,data:"<the news html>"}` chunk pattern |
| **route** | Per-route HGR JSON (purchase, finance, acmeNetworkMasterBatch). Multi-row pattern: row 1 = assembled JSON, rows 2-N = `,{url..,text..,route}` rows summed |
| **op1** | Provider config dashboard (Provider/Subscriber flag/CC VID/Base site VID/Theme settings/Attendance/Off-site flags). Row 9-15: 5×Location ID table (lat/lng/name/LocID/tolerance/CC flag/Site flag/Distance). Also LQR registry per location. Col B "QR/Selfie/GPS/Location verification" toggle TRUE/TRUE/TRUE = mode-1 |

### 5. Event log / RPA bus / Blockchain ledger
| Tab | Role |
|---|---|
| **Event** | Current/last event resolver. A1=ts, B1=route, C1=encrypted payload `0attendance-check-in◆...⬤`, D1=full decrypted log string (`◻`-separated). H1=`32503593600000◆30724922102746◆83674161979544◆◆<log>◆` message envelope. Plus counters: Stored/Unstored, Mismatch time/Blank/VID/Site, Recov by Date (31). Below: route-typed event rows (`ktp`/`personal`/`profileSdm`/`profile`/`acmeOutsourcing`/...) with col C=tokenized payload, F=decrypted, G=Local time, H=control flag, K=Last login (Otonomiq), R=last 25+ event rows for backup |
| **System** | (above) — same log corpus, broader header context |
| **SystemHealth** | Orphan ledger rows (no row marker). col B=epoch ms, C=raw log `01605599546163◼VID◼SiteVID◼log◼...◼...◼...◼...◼...◼...◆` |
| **RBD** | Row-by-day backup buffer. col A=raw row, B=event row#, C=replay copy. Used for `rbd-setting=day-minus-7` recovery |
| **Misc** | Single-event scratch tokenizer. A1 = full `attendance-check-in◆ts◆checkpoint◆QR◆...` payload, A2 = split into 16 fields |
| **InLedger** / **OutLedger** | Blockchain ledger receive/send buffers. col A=ts ms, B=ledger code, C=`0`+payload, F=decrypted, G=local time. Header has `●inledger-version=alpha●●inledger-checksum=1420070442011●` |
| **Outbox** | Outbound submission queue (currently mostly empty / 0s) |
| **Draft** | Draft submission buffer. Col A schema: Expiry/TTL/Topic/AESNonce/Data/EnvNonce/MsgForBlockchain/MsgForMobile/FullMsg/SubmitScreen |
| **ReceiveASync** / **SubmitSync** / **SubmitASync** / **SS** / **SAS** | Job queue tables. All share schema: Job#/Switch/Description/Init Sheet/Init Range/Init Value/From Sheet/From Range/To Sheet/To Range |
| **Startup** | Boot jobs. Currently: 1 job = "Log startup time" → writes timestamp to LIF master `System!B4` |
| **UpdateHistory** | Migration/feature-flag log. Cols: # / Update time / Update code / Update code-- (`27770015★consolidation-1`) / Installed / Complete list. **`★` U+2605 binds checksum to feature name**. Features: consolidation-1, white-label, op2-op3-removal, live-attendance, provider-partner-vids, supervisor-list, locale-table, post-submit-refresh, widget-icon... |
| **op1History** | Per-event mobile history rendering |
| **LocIDCorrection** | Location ID normalization. col A=device code (JB/JK/BT/JT/IR/IL...), B=`◆name◆` pattern, C=corrected ID (most → `ID`) |
| **CostCtrSite** | Cross-tenant flag→VID mapping. col A=`tenant◆site-slug` flag, B=14-digit VID. 183+ rows (acme-outsourcing master/usa/indonesia/india, krusty-services, sdm cluster, ...) |
| **ProxyHealth** | Error code registry (TRUE=healthy). Codes: app-unsupported, home-json-too-short, op1-provider/position/corrupted, op1-geolocation-blank... |
| **StopService** | Shadow of op1 for OFF/ON service toggle without losing config (left half = ON values, right half = OFF values) |
| **UQR** | User QR registry (Agenia Demo-7 / VID) — current row has `#REF!` |

---

## Three Core Pipelines

### A. Widget → op1Screen → Event JSON

```
Widget tab (172 entries)
   A=name, J=template w/ [TOKEN], G=substituted
        │ H col registers `name▶Widget!Jrow`. H1=CONCATENATE(H2:H)
        ▼
op1Screen rows 130+
   B=widget name (+ I-suffix) → VLOOKUP(B & strip(I,"◆"), Widget!A:G, 7, FALSE)
   D col = 13×SUBSTITUTE replaces [ROUTE]/[LOCLIST]/[LABEL]/[FLAG]/[FOLDER]/
           [FILENAME]/[IMAGE1-3]/[FAKEGPSALLOWED]/[OUTPOSITIONALLOWED]/[ADDTOTABLE] +
           conditional i18n flip (`Check in dg` vs `Check IN dg` per $E113 off-toggle)
   E col = ","&D (when F=TRUE)
        │
        ▼
op1Script / Plug col-O / base tab assemble per-route JSON
        │
        ▼
Mobile app pulls assembled JSON via route key
```

### B. Mobile event → Encrypted payload → Ledger

```
User taps button on mobile (e.g. attendance-check-in)
        │ App writes `0<action>◆ts◆type◆QR◆lat◆lng◆◆country◆postal◆province◆kab◆kec◆village◆street◆#◆loc-flag⬤`
        ▼
Event!C1 receives encrypted payload, A1=ts ms, B1=route
        │ Spreadsheet formulas decrypt + tokenize:
        │   Event!A4:Q4 = split payload into 16 fields
        │   Misc!A2:P2 = independent split
        │   Event!D1 = build `01778636100229◼VID◼SiteVID◼log◼security-clock-in◼QRLoc◼QRtoken◼[lat,lng]◼imgURL◼address◻<header records>◻<row☆time>` log line
        │   Event!H1 = `32503593600000◆30724922102746◆SiteVID◆◆<log>◆` envelope for blockchain
        ▼
RBD col A appends one row per event (for day-minus-7 recovery)
System!B1 concatenates ALL events as `◻`-separated record stream (master log)
        │
        ▼
op1Checker batches event rows for verification + RBC promotion
```

### C. Profile / KTP / Personal update

```
myAccountScreen col C: full screen JSON for `profile`/`personal`/`ktp`
   - Embeds user values as `currentValue` (NIK, NPWP, name, address...)
   - On submit: RBT button `action:savesend`, `flag:profile-{contact,personal,ktp}`, `route:vertikaTeknoLokacipta`
        │
        ▼
MyAccountData rows: per-field {value, type, icon-id, text-id, icon-name}
   (NIK 4421362610860005, Nama Bob Kosasih, Tempat Lahir Kota Subulussalam, ...)
        │
        ▼
MyAccountUpdate computes per-route Checksum + Last update + Init/Updates
   "Time Stamp Differs" row 3 → FALSE per field = no divergence
   Data 1 row = full ◆-joined payload string per route
   → sent to ledger / Outbox when Changed=TRUE
```

---

## Delimiter Inventory (NEW vs op1Screen sheet)

| Char | Unicode | Use |
|---|---|---|
| `●` | U+25CF | **Control-block kv separator** (`●vid=...●user=...●mobile-version=...●`). Wraps in System B1, op1 R1, op1 S1, ProxyHealth, op1Script, auzSettings, etc. |
| `◻` | U+25FB | **Log RECORD separator** in System B1 / Event D1 / RBD — separates one event log from next |
| `◼` | U+25FC | **Field separator** INSIDE one log record (VID◼SiteVID◼type◼action◼locName◼QR◼[gps]◼img◼address) |
| `①`-`⑳` | U+2460-U+2473 | **Row-marker prefix** for log lines (`①01777943119656...`) |
| `☆` | U+2606 | **VID-label binder** (`87544551624342☆Agenia Demo-7`, `83674161979544☆Product Group`). Same as Filter tab in VTL sheet |
| `⬤` | U+2B24 | **Section break / event terminator** (`...loc-flag⬤`) |
| `◇` | U+25C7 | **Ledger-action separator** (`reset◇device`, `report◇daily`, `approve-final◇leave`) in auzSettings col B |
| `★` | U+2605 | **Checksum↔name binder** in UpdateHistory (`27770015★consolidation-1`). Also D tab usage from VTL sheet |
| `◆` | U+25C6 | **Primary payload delim** (payloads, costCenters bundles, multi-string fields, addToTable VIDs) |
| `▶` | U+25B6 | **Widget registry pointer** (`name▶Widget!Jrow`) |
| `⨝` | U+2A1D | Literal delimiter-inventory cell only — appears in System J15 listing all allowed special chars |
| `🠈/🠊` | U+1F808/A | UI arrows (send buttons) |

System.J15 / op1Screen variants explicitly list the full inventory: `◀◁▶▷⬤⭘◆◇◈◻◼★☆○●⨝①②...⑳` — these are the **allowed sigil chars** for this Consteon proxy system.

---

## Key Architectural Insights

1. **This sheet = per-user proxy session**, not master SSOT. One row in master "Account" sheet → one proxy spreadsheet. ID lives in `Keys!B2`. Mirrors mobile-app state for ONE user.

2. **op1 vs op1Screen vs op1Script vs op1History vs op1Checker vs op1RecentLedgers vs autsorzScreen vs autsorzScript** = 8 op1-related tabs forming the **screen/event subsystem**. op1=config, op1Screen=widget rows, op1Script=event resolver (single-row focus), op1Checker=bulk verification, op1History=display, op1RecentLedgers=cache, autsorzScreen/autsorzScript=legacy/fallback.

3. **myAccount* cluster (myAccountScreen / myAccountObject / MyAccountData / MyAccountUpdate / CommSettings)** = standalone profile editor with checksum-based dirty detection.

4. **Plug tab is the page-composition keystone** — Col O contains pre-assembled VTL workflow screens (ApproveFinal Attendance/Backup/DayOff/Leave/Overtime/SickLeave/Trip + LogPresensi/LogHistory/LogReport*) with full JSON including `tableSearch table:vtl.workforce qr:uqr` widgets and `savesend` RBT buttons.

5. **3 versions of channel registry** coexist: Channel (live), fixedChannel/fixedArticle (seed), auzChannel/auzArticle/auzWhiteLabel (white-label tenants). Channel.A col TRUE flag picks the active channel.

6. **Email field is corrupted on this proxy**: `Settings!B3` = `5/6/2026 17:17:01` (timestamp got written where Gmail should be). Listed as `org-vids-different` proxy-health issue.

7. **Mobile version 0.9.78.28 is below `update-threshold=0.915`** → home screen replaced with `Need to update` banner per `base!D9`. Mandatory update gate.

8. **Encryption layer** is present but light: payload prefix `0` is the "encrypted" marker, Settings holds private/public/Otonomiq keys, Auth1/Auth2 prefixes are AES prefix material. Auth1 expired 7-Dec-2022 (`1670371200000`). Real auth runs via Otonomiq off-sheet.

9. **The 491-event history** (`bad-event-ledgers={415;416;417;...;486}` — 58 bad rows out of 491) means **~12% of events are bad ledgers** that failed RBC processing and need recovery.

10. **VTL workforce table lookups** (`tableSearch table:vtl.workforce qr:uqr` in Plug col O) reference an external master sheet (the VTL one from prior task) — this proxy DOESN'T hold workforce data, it queries the master at runtime.

---

## Open Questions

1. Where is the master Account sheet? `Keys!B2` shows empty — only LIF master is configured.
2. `JSON2` tab is empty (header only). Same with `SS`, `SAS`, `Outbox`. Provisioned but unused for this user, or migrated away?
3. `UQR` shows `#REF!` — UQR registry intended to hold user's QR token but broken; mobile-version banner blocks UQR usage anyway.
4. `op1Script` shows `#N/A` for Ledger code despite event row 491 being populated — suggests downstream ledger encoding step incomplete or skipped due to `(GPS) ≠ BSD Tech Center #26 (QR)` ERROR 823 mismatch.
5. `op1Checker.A4` "Event rows" list shows 31 rows in decreasing order (`000213 000211 ... 000170`) — what's the selection rule? Likely "approved subset for batch RBC promotion".

---

## Cross-reference vs VTL master sheet

| Concept | VTL master `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8` | This proxy `1xk_p...` |
|---|---|---|
| Layer | Master SSOT (web/admin UI build) | Per-user mobile proxy session |
| Widget catalog | `Component` tab (9 components, `[BRACKET_TOKEN]`) | `Widget` tab (172 widgets, `[BRACKET_TOKEN]`) — different layer, larger inventory |
| Page composition | `Web Screen 2` (component+14 params → JSON) | `op1Screen` (widget+13 params → JSON) — same pattern, different namespace |
| Per-user output | `Web JSON C6` MAP (one row per admin user) | `Plug col O` (one row per mobile screen) |
| RBAC | `Otorisasi Menu Web` / `Otorisasi Cost Center 2` | None — single-user proxy, op1 holds the user's config directly |
| Workforce data | `Pegawai` tab (master employee table) | None — queried at runtime via `tableSearch table:vtl.workforce` |
| HR transactions | `Pendaftaran`/`Perubahan`/`PHK`/`Mutasi` tabs with Process flag | None — this sheet only emits events to outbound ledger |
| Tenant | Single (VTL) | This proxy serves a VTL user but the sheet also has white-label channel inventory for other tenants (SDM, Apklindo, Alteriz...) |

Two sheets are **complementary layers** of the same Consteon stack: VTL master = admin/web SSOT, proxy = mobile session bus.
