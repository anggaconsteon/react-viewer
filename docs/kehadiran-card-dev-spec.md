# Kehadiran (Attendance) Card — Dev Spec

Screen reached from the **"Kehadiran" panel** on the cost-center card (`LIST_MULTIPLE_PANEL_CARD`), route `vertikaTeknoLokaciptaCheckinSiteDetail`. Source UI: `src/App.jsx` `ScreenPresence` (~line 414). Shift grouping dropped — flat worker list.

Deployed (handoff-ready, NON-FUNCTIONAL until the `keyed` variant + write-back land) in op1Screen proxy `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`:
- `vertikaTeknoLokaciptaCheckinSiteDetail` — header row 986, worker-list widget row 989.
- `vertikaTeknoLokaciptaCheckinWorkerCorrection` — header row 992, detail row 995, write-back RBT row 996.

---

## 0. The core dev ask — a new `variant:"keyed"`

`type` = widget render name. `variant` = the **behavior** differentiator (Dart). The existing list/statistic widgets read **POSITIONAL** tables (numbered fields `1`,`2`,`7` + `c` = row-as-array, e.g. `report-incident`). The attendance data lives in a **KEYED** table (`workforce`: named string keys `n`,`ci`,`co`,`is`,`os`,`st`,`sv`,`vid` — no `c` array).

Add a generic, domain-neutral **`variant:"keyed"`** to `LIST_STATISTIC_CARD` (and, for the detail, support keyed read in `WORKER_CARD_DETAIL`). Behavior of `variant:"keyed"`:
1. Read `table` as a **keyed collection** (each doc = an object with string keys), NOT positional+`c`.
2. Apply `search` / `conditions`, resolving the nav-injected token `{ccVid}` (same as the existing `LIST_STATISTIC_CARD` already does for patrol).
3. Build `items[]` = one entry per matching doc.
4. Render one card per item, resolving `<key>` raw tokens from that item; resolve `{...}` computed tokens via the per-card / aggregate logic below.
5. Card tap → `route`, passing the doc's keys (e.g. `<vid>`) to the destination page.

Reusable for ANY keyed collection, not just workforce.

---

## 1. Data: `workforce` table (KEYED)

`84214220504259//workforce` — 1 doc per worker, live state for **today** (resets daily).

| key | meaning | note |
|-----|---------|------|
| `vid` | worker id (unique) | route param to correction page |
| `n` | name | |
| `ci` | clock-in EPOCH | `-1` = not yet |
| `co` | clock-out EPOCH | `-1` = not yet |
| `is` | clock-in STRING (display, e.g. "06:58") | shown on card |
| `os` | clock-out STRING (display) | shown on card; empty = belum |
| `st` | status | |
| `sv` | site vid (FK → site.sv / site.av = cost center) | filter key |

`sv` value == the cost center's `av`/`sv`. `{ccVid}` (injected from the cost-center card tap) carries that value.

Issue is NOT stored — derive from `ci`/`co`: `ci==-1` → belum scan; `ci!=-1 && co==-1` → belum clock-out; else ok.

---

## 2. Widget 1 — worker list (today) · `LIST_STATISTIC_CARD` + `variant:"keyed"`

op1Screen row 989. Stat header = **today** (workforce is today's live state — no period selector, unlike patrol).

```json
{
  "type": "LIST_STATISTIC_CARD",
  "variant": "keyed",
  "vidtable": "20342033315492",
  "table": "84214220504259//workforce",
  "search": "sv◼{ccVid}",
  "conditions": "[[◀sv▶◼{ccVid}]]",
  "text": "Cari worker◆Ketik nama worker◆Data tidak ditemukan",
  "stats": "{hadir}/{total}◆Hadir★{belumScan}◆Belum scan★{perluTindak}◆Perlu tindak",
  "content": "<n>◆login◼<is>◆logout◼<os>",
  "badge": "{statusLine}",
  "status": "{status}",
  "route": "vertikaTeknoLokaciptaCheckinWorkerCorrection"
}
```

> **Refactor UI kaya (2026-06-11):** kartu polos → ikon-chip. **NOL field baru** — pakai `content` + `badge` (sudah ada). Buang ide `chips`/`pill` (field asing). Sumber UI live yang kurang: jam tanpa ikon/warna, nilai kosong render blank, timestamp mentah ("10 Jun 2026 15:10:29"), teks "Masuk/Keluar" kepanjangan.

**Cara render kartu (reuse field existing):**
- **`content`** = segmen `◆`. **Segmen ber-`◼` = chip ikon**: `iconName◼value`. Segmen tanpa `◼` = teks biasa.
  - `<n>` → nama (teks)
  - `login◼<is>` → ikon 🔓 + jam masuk
  - `logout◼<os>` → ikon 🔒 + jam keluar
  - **`iconName` = nama resmi Flutter Material Icons** (`login`, `logout`, `camera_alt`, `location_on`, `schedule`, …). Renderer map nama → `IconData`. **Dinamis**: ganti ikon = ganti nama di config; ikon baru = pakai nama Flutter mana pun (dev maintain map nama→IconData / pakai package).
- **`badge`** = status pill kanan (reuse field `badge` yg patrol pakai buat pill kanan "GPS saja"/"Bukti kuat"). Di sini `{statusLine}`, warna ikut `{status}` tone. **Kosong → pill hilang**.

**Raw `<>` (from each workforce doc):** `<n>`, `<is>`, `<os>`, `<st>`, `<vid>`, `<ci>`, `<co>` (epochs for logic).

**Computed `{}` (dev):**
| token | scope | logic |
|-------|-------|-------|
| `{total}` | aggregate | count items matching filter |
| `{hadir}` | aggregate | count where `ci != -1` |
| `{belumScan}` | aggregate | count where `ci == -1` |
| `{perluTindak}` | aggregate | count where `ci == -1` OR (`ci != -1 && co == -1`) |
| `{status}` | per card | `ci==-1` → danger ; `ci!=-1 && co==-1` → warn ; else ok |
| `{statusLine}` | per card | `ci==-1` → "Belum scan" ; `ci!=-1 && co==-1` → "Belum clock-out" ; else "" |

**Evidence — SKIP v1.** Workforce tak punya field evidence; JANGAN ngarang `<charcode>`. Kalau field evidence (mis. `ev`) muncul di schema → tambah segmen chip / pakai `badge` ikut pola patrol ("Bukti kuat"/"GPS saja").

**Dev-logic OUT (bukan JSON):** warna ikon chip (🔒 hijau kalau `co` terisi, merah/amber kalau belum — derive dari `ci`/`co`, gak perlu deklarasi tone); format jam HH:MM dari nilai mentah; `—` kalau kosong; sort issue-dulu (`{status}` danger→warn→ok); suppress `badge` kalau `{statusLine}` kosong; map nama-ikon Flutter → `IconData`. (Kalau nanti mau tone eksplisit di config, tambah part ke-3: `login◼<is>◼{tone}`.)

---

## 3. Widget 2 — correction page · `WORKER_CARD_DETAIL` + write-back

op1Screen rows 995 (detail) + 996 (write-back RBT). Reads ONE keyed worker doc by `<vid>` (route param from the list tap). Supervisor fixes the missing clock time + note; saves to workforce and logs to the event ledger.

**Detail (fakta terkunci, read-only) — row 995:**
```json
{
  "type": "WORKER_CARD_DETAIL",
  "table": "84214220504259//workforce",
  "search": "vid◼<vid>",
  "conditions": "[[◀vid▶◼<vid>]]",
  "text": "<n>◆<is>◆<os>◆Worker◆Masuk (scan)◆Keluar (scan)"
}
```
(`WORKER_CARD_DETAIL` must read the keyed workforce doc. If it doesn't yet, it needs the same keyed-read support.)

**Write-back (RBT sticky → bottom-sheet form) — row 996** (already on the sheet): TXF clock-out (pos 1) + clock-in (pos 2) + keterangan (pos 3), then save:
- `updateTableRow` (keyed / **updateEventRow**): `84214220504259//workforce⭘tablevid◼20342033315492⭘search◼vid★<vid>⭘os◼◁1▷⭘is◼◁2▷`
- `addToTable` (event ledger jejak): `84214220504259//event⭘…⭘ty◼koreksi-presensi⭘…⭘sv◼<sv>⭘sn◼<n>⭘d◼Koreksi: …`

v1 updates the **display strings** `is`/`os` only (what the card shows), not epoch `ci`/`co`. Fine for raw display.

**Caveat:** keyed write-back (`updateEventRow`, `key◼value` form) may not be landed in the build yet — confirm. Design doc: `docs/2026-06-04-updateEventRow-design.md`.

---

## 4. Out of scope here — worker history (period)

"Lihat riwayat {worker}" (`ScreenWorkerHistory`, App.jsx:1674) is a **separate** per-worker, **period-based** screen (7d/30d/bulan selector; daily records over time; aggregates presentDays/anomaly/leave/off). That is its own widget (period pattern, like the patrol `TIMELINE periodic` over the event ledger) — NOT this today-list. Spec separately when needed.
