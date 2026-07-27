# Task — P2 ScanLogin → op1Screen pages

**Status:** DONE + FIXED — written 2026-06-15. Flutter dev confirmed `type:"scanner"` and `type:"noticeBar"` supported. Widget rows **scanner@198, noticeBar@199** (agent misreported 206/207; grid max=202). op1Screen pages rows 1001-1010; Plug rows 72-73. **FIX 2026-06-15:** scanner J198 un-wrapped (removed HORIZONTAL_ICON — it rendered as a small icon; `◆` text dumped literally). Now `{"type":"scanner",...}` direct → fullscreen card + parses ◆ slots. Verified D1003 re-resolved. Placeholders `[TABLE_PATH]`, `[FOLDER]`, `[FILENAME]` still for user.
**UPDATE 2026-06-15 (P4 + cleanup):**
- **DriverScanResume DROPPED** (user: gak perlu). Single scan page only. Fresh-vs-resume dibedain POST-scan di DriverHome (gate). Plug row 73 cleared.
- **P4 DriverHome WRITTEN**: Widget tab `routeProgressHeader@200`, `preconditionGateCard@201`, `inventoryBucketCard@202`, `driverStopCard@203`, `navActionCard@204`. op1Screen page `vertikaTeknoLokaciptaDriverHome` @ rows 1008-1016 (header + 6 widget + 2 buffer). Plug row 74.
- **scanner route → `vertikaTeknoLokaciptaDriverHome`** (L1003 + JSON).
- **INCIDENT:** P4 agent clobbered DriverScanResume (1006-1010) + left stray `text` @1004/1005. Both recovered manually (stray cleared, DriverScanResume retired, Plug fixed). DriverHome intact + verified.
- Consolidation (gateSearch per widget) now MOOT — single scan page; gateSearch still used INSIDE DriverHome cards.
- DriverHome placeholders for user: `[AVATAR]` `[DRIVERNAME]` `[VEHICLEID]` `[PLATE]` `[ICON]` `[ICON_LOCKED]` `[ICON_READY]` `[ROUTE:pauseConfirm]` `[ROUTE:custodyConfirm]` `[ROUTE:taskFeed]` `[ROUTE:returnVehicle]`.
**Target:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` (proxy/agenia-demo-7), tab `op1Screen` + `Widget` + `Plug`.
**Scope confirmed:** P2 only (scanner + noticeBar). P4 deferred (renderer belum support table/search).
**Source of truth:** `json/driver-runtime/p2-scan-login.json`, `json/scanner.json`, `json/notice-bar.json`.

---

## Pages (2 separate op1Screen pages)

| Suffix | State | Widgets |
|---|---|---|
| `DriverScanLogin` | fresh login | noticeBar(warn) + scanner(login) |
| `DriverScanResume` | resume paused trip | noticeBar(info) + scanner(resume) |

Provider prefix `$B$120 = vertikaTeknoLokacipta` → full names `vertikaTeknoLokaciptaDriverScanLogin` / `...DriverScanResume`. `hideBottomBar` = true.

---

## NEW Widget-tab rows needed (create first)

### `scanner` — DRAFT base template (J col)
> ⚠️ LIVE-RECONCILE: read live `location` Widget row first; mirror its exact placeholder names + HORIZONTAL_ICON wrapper. Drop location's geofence/selfie fields.
```json
{"type":"scanner","url":"[URL]","text":"[TEXT]","imgHeight":[IMGHEIGHT],"imgWidth":[IMGWIDTH],"folder":"[FOLDER]","filename":"[FILENAME]","width":[WIDTH],"flag":"[FLAG]","route":"[ROUTE]","opMode":"qr-single","displayMode":"full-screen","addToTable":"[ADDTOTABLE]"}
```

### `noticeBar` — DRAFT base template (J col)
> P2 pakai variant+icon+text aja. Full template (label/title/iconAlign) buat P5/P6 nanti.
```json
{"type":"noticeBar","variant":"[VARIANT]","icon":"[ICON]","text":"[TEXT]"}
```

Plus G/H mirror formulas + master-index `◆scanner▶Widget!J<r>` / `◆noticeBar▶Widget!J<r>` (copy sibling shape).

---

## Param VALUES (grounded — no guessing)

### Page DriverScanLogin
**Widget 1 — noticeBar** (F=TRUE)
- VARIANT `warn`
- ICON `[ICON]` (TBD)
- TEXT `Device ini bisa jadi bukan punya lo (HP kantor / admin / temen). Identitas lo dibawa di kartu, bukan di HP ini.`

**Widget 2 — scanner** (F=TRUE)
- URL `[QR_ICON_URL]` (TBD — reuse location qr-scan icon)
- TEXT `Scan Kartu◆Batal◆Sesi dibuka◆Login berhasil◆◆◆◆✔️ Scan kartu ID berhasil. Sesi Driver Runtime aktif.◆OK◆QR salah◆QR yang anda scan salah, coba scan lagi.◆Scan Lagi◆◆◆◆◆◆◆◆◆◆◆◆◆◆`
- IMGHEIGHT `600` · IMGWIDTH `600` · WIDTH `100`
- FOLDER `[FOLDER]` · FILENAME `[FILENAME]` (TBD storage path)
- FLAG `driver-session-open`
- ROUTE `driverHome`
- ADDTOTABLE `[TABLE_PATH]//driver.session⭘retention◼4320⭘description◼driver-session-open⭘flag◼driver-session-open⭘<1>◼driver-session-open⭘<2>◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶⭘<3>◼◀3▶⭘<4>◼◀5▶⭘<5>◼◀6▶`

### Page DriverScanResume
**Widget 1 — noticeBar** (F=TRUE)
- VARIANT `info`
- ICON `[ICON]`
- TEXT `Lanjutkan trip. Sesi {executorName} di-pause — {remaining} task belum kelar masih nunggu. Scan kartu buat lanjut dari titik terakhir, di device manapun.`

**Widget 2 — scanner** (F=TRUE)
- URL `[QR_ICON_URL]`
- TEXT `Scan Kartu◆Batal◆Sesi dibuka◆Lanjut trip berhasil◆◆◆◆✔️ Scan kartu ID berhasil. Sesi Driver Runtime dilanjutkan.◆OK◆QR salah◆QR yang anda scan salah, coba scan lagi.◆Scan Lagi◆◆◆◆◆◆◆◆◆◆◆◆◆◆`
- IMGHEIGHT `600` · IMGWIDTH `600` · WIDTH `100`
- FOLDER `[FOLDER]` · FILENAME `[FILENAME]`
- FLAG `driver-session-resume`
- ROUTE `driverHome`
- ADDTOTABLE `[TABLE_PATH]//driver.session⭘retention◼4320⭘description◼driver-session-resume⭘flag◼driver-session-resume⭘<1>◼driver-session-resume⭘<2>◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶⭘<3>◼◀3▶⭘<4>◼◀5▶⭘<5>◼◀6▶`

---

## TBD before/at write (needs live or user)
- `[TABLE_PATH]` — real driver.session table path (config).
- `[QR_ICON_URL]` — reuse location's qr-scan icon URL (read live).
- `[FOLDER]`/`[FILENAME]` — scan-photo storage path.
- `[ICON]` — noticeBar icon source (URL vs key) unverified.
- scanner HORIZONTAL_ICON wrapper — confirm from live `location` row.
- `<N>` payload index mapping — confirm vs Event tab schema.

---

## LIVE FINDINGS (2026-06-15, read op1Screen Widget tab)
- Widget NAME ≠ JSON `type` (e.g. `horizBanner`→`BNR`).
- **`type:"location"` IS real = ATTENDANCE scan engine** (templates `checkInQr`/`checkInQrGps`): HORIZONTAL_ICON>location, opMode qr-single, geofence (locList/tolerance), timeClockOut/actionLast. **NO `addToTable`** — attendance write is internal by `flag`.
- **`horizBanner` = `type:"BNR"` = image-carousel ad banner**, NOT a text alert. `noticeBar` has NO renderer equivalent.
- `qrScanner` = `type:"TXF"` inline QR-to-field.
- ⇒ `scanner` (relies on addToTable, identity-card not geofence) and `noticeBar` (colored text alert) both need NEW renderer types. Publishing now = blank/wrong render.
- Full detail: memory `reference_op1screen_driver_widgets.md`.

## Resolve-before-publish (Flutter dev)
1. Define renderer `type:"scanner"` — QR card read → `addToTable` write, NO geofence. (Or adapt `location` to read addToTable + skip locList.)
2. Define renderer `type:"noticeBar"` — variant→theme color, label/title/text tiers, iconAlign.
3. Then run the execution steps below.

## Execution steps (AFTER renderer support, when ready to write)
1. Read live `Widget` tab: `location` row (basis scanner), a sibling for G/H formula shape.
2. Create Widget rows: `scanner`, `noticeBar` (A + J + G/H formulas). Append master-index to `Widget!G1`.
3. Read live `op1Screen` page registry tail → next free header row (last widget + 3).
4. Write page block `DriverScanLogin` (header formulas + 2 widget rows + 2 buffer).
5. Write page block `DriverScanResume`.
6. Register both in `Plug` (copy sibling row, change object name).
7. QA: re-read, check no `#REF!`/`#NAME?`, page name unique, `<N>` sequential, JSON parses.

Run via `op1screen-page-engineer` agent (has gsheets tools) once MCP connected.
