# Task 0 — Catatan State Live (submission feed / request family)

**Tanggal:** 2026-08-31
**Sifat:** READ-ONLY. Nol `update_cells` / `batch_update_cells`.
**Spreadsheet:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`
— title `Salinan dari agenia demo-7 | Proxy`, locale `en_US`, timeZone `Asia/Jakarta`.

> Semua string di doc ini VERBATIM dari cell live (bukan parafrase).
> `get_sheet_data` default balikin **VALUE**, bukan formula. Semua cell param yang
> ditulis di sini yang berbentuk formula sudah di-baca ulang pakai
> `include_grid_data: true` → `userEnteredValue.formulaValue`.

---

## 0. Tab yang dibaca + peta tab

`list_sheets` = 63 tab. Yang relevan:

| Tab | Ukuran | Isi |
|---|---|---|
| `op1Screen` | 13510 × 55 | Home + Riwayat + Incident + Patrol dll |
| `op1Screen Driver` | — | mirror varian Driver |
| `op1Screen Incident, Request dan Approval` | 480 × 55 | **Incident + Complaint + 5 form Request + Approval** |
| `Widget` | — | library template |
| `auzSettings` | — | registry table (kolom J) |
| `Settings` | — | identitas user (B1 VID, B2 Name) |
| `op1` | — | K7/L7 = CC, K8/L8 = Site |
| `System` | — | B3 = offset timezone (`7`) |

⚠️ **TIDAK ADA** tab bernama `op1Screen Incident`, `Request`, atau `Approval` terpisah.
Yang ada **satu** tab: `op1Screen Incident, Request dan Approval` — namanya
mengandung **koma + spasi**, jadi di formula WAJIB dikutip:
`='op1Screen Incident, Request dan Approval'!L383`.

### Range yang dibaca
- `op1Screen!A180:V200`, `op1Screen!U190:AJ191`, `op1Screen!H190:I190` (grid)
- `op1Screen!A1625:V1645`, `op1Screen!U1636:AJ1637`, `op1Screen!H1637:I1637` (grid)
- `op1Screen!V140:V150`
- `op1Screen!A1030:A1080`
- `op1Screen Driver!A945:B965`
- `op1Screen Incident, Request dan Approval!A1:B400`, `A400:A520`, `B400:B481`
- `…!F383:BC383`, `F402:BC402`, `F421:BC421`, `F440:BC440`, `F456:BC456`, `F459:BC459`, `F471:BC471`, `F476:BC477`
- `…!L383` (grid), `…!L476` (grid), `…!R477` (grid)
- `auzSettings!I28:J50`, `I48:J75`, `I68:J110`
- `Settings!A1:C5`, `Plug!A1:D40`, `route!A1:C30`

---

## (a) Konvensi `//submission` yang SUDAH LIVE — mirror persis ini

Dipakai 2 tempat identik: card Home `op1Screen!190` dan page feed `op1Screen!1637`
(+ mirror Driver `op1Screen Driver!957`).

### Cell + formula VERBATIM

| Cell | Formula (`userEnteredValue.formulaValue`) | Nilai resolved |
|---|---|---|
| `op1Screen!H190` | `="84214220504259//submission"` | `84214220504259//submission` |
| `op1Screen!I190` | `="fc◼submission⭘cv◼"&Settings!$B$1` | `fc◼submission⭘cv◼87544551624342` |
| `op1Screen!H1637` | `="84214220504259//submission"` | `84214220504259//submission` |
| `op1Screen!I1637` | `="fc◼submission⭘cv◼"&Settings!$B$1` | `fc◼submission⭘cv◼87544551624342` |

Jadi:
- **Path table**: `84214220504259//submission` — di-hardcode di dalam formula
  (`="84214220504259//submission"`), **BUKAN** ref `auzSettings!$J$n`.
  Lihat kontradiksi (f)-1.
- **`fc◼submission` ADA** dan jadi segmen PERTAMA di `search`.
- **Filter `cv`** bentuknya `⭘cv◼"&Settings!$B$1` — formula ref, bukan token
  `{userVid}`, bukan literal. Persis kayak constraint plan.
- **TIDAK ada** `tablevid` di dalam `search`. `vidtable` adalah param terpisah
  (`G190` / `G1637` = `20342033315492`).

### LIST_CARD resolved (op1Screen!D190) — VERBATIM

```json
{"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//submission","search":"fc◼submission⭘cv◼87544551624342","conditions":"","sortField":"t","sortDir":"desc","groupBy":"","groupLabels":"","lead":"","title":"<ttl>","subtitle":"<d>","meta":"<ts>","badgeField":"st","badgeMap":"waiting◼Menunggu◼warn⭘processing◼Diproses◼info⭘approved◼Disetujui◼ok⭘done◼Selesai◼ok⭘rejected◼Ditolak◼danger","trailing":"","trailingLabel":"","stats":"","searchFields":"","route":"","routeParams":"","limit":3,"moreRoute":"vertikaTeknoLokaciptaRiwayatSaya","text":"Riwayat◆◆◆Cari◆Belum ada riwayat◆Lihat Semua"}
```

### Peta kolom param LIST_CARD (berlaku 190, 1637, dan 459 di tab Request)

| Col | Key |
|---|---|
| F | displayed (`TRUE`/`FALSE`) |
| G | `vidtable` |
| H | `table` |
| I | `search` |
| J | `conditions` |
| K | `sortField` |
| L | `sortDir` |
| M | `groupBy` |
| N | `groupLabels` |
| O | `lead` |
| P | `title` |
| Q | `subtitle` |
| R | `meta` |
| S | `badgeField` |
| T | `badgeMap` |
| U | `trailing` |
| V | `trailingLabel` |
| W | `stats` |
| X | `searchFields` |
| Y | `route` |
| Z | `routeParams` |
| AA | `text` |
| AB | `limit` |
| AC | `moreRoute` |

---

## (b) Page feed "Lihat Semua submission"

**Tab `op1Screen`, header row 1635** — route key `vertikaTeknoLokaciptaRiwayatSaya`.

| Row | A | B | Isi |
|---|---|---|---|
| 1630 | `vertikaTeknoLokaciptaRiwayatAbsensi` | page JSON | page absensi (sibling, `//event`) |
| 1631 | 1 | workspaceHeader | |
| 1632 | 2 | listCard | `//event` `grp◼attendance` |
| 1633-1634 | 3,4 | (buffer kosong) | |
| **1635** | `vertikaTeknoLokaciptaRiwayatSaya` | page JSON | **page feed submission** |
| **1636** | 1 | `workspaceHeader` | |
| **1637** | 2 | `listCard` | **`//submission`** |
| 1638-1639 | 3,4 | (buffer kosong) | |

Mirror Driver: `op1Screen Driver!951` = `…RiwayatAbsensi`, **`op1Screen Driver!956`** =
`…RiwayatSaya` (957 = listCard `//submission`, config identik).

### Isi param row 1636 (workspaceHeader)

| Cell | Isi |
|---|---|
| `op1Screen!F1636` | `TRUE` |
| `G1636` | `20342033315492` |
| `H1636`–`L1636` | (kosong: table, search, idField, titleField, addressField) |
| `M1636` | `vertikaTeknoLokacipta` (backRoute) |
| `N1636` | `Riwayat◆Semua kiriman Anda` |

### Isi param row 1637 (listCard `//submission`)

| Cell | Isi |
|---|---|
| `op1Screen!F1637` | `TRUE` |
| `G1637` | `20342033315492` |
| `H1637` | `84214220504259//submission` (formula `="84214220504259//submission"`) |
| `I1637` | `fc◼submission⭘cv◼87544551624342` (formula `="fc◼submission⭘cv◼"&Settings!$B$1`) |
| `J1637` | *(kosong)* |
| `K1637` | `t` |
| `L1637` | `desc` |
| `M1637`–`O1637` | *(kosong)* |
| `P1637` | `<ttl>` |
| `Q1637` | `<d>` |
| `R1637` | `<ts>` |
| `S1637` | `st` |
| `T1637` | `waiting◼Menunggu◼warn⭘processing◼Diproses◼info⭘approved◼Disetujui◼ok⭘done◼Selesai◼ok⭘rejected◼Ditolak◼danger` |
| `U1637`,`V1637` | *(kosong)* |
| `W1637` | `Kiriman◼` |
| `X1637` | `ttl◆d` |
| `Y1637`,`Z1637` | *(kosong — `route` & `routeParams` BELUM diisi)* |
| `AA1637` | `Riwayat◆Semua kiriman · terbaru di atas◆kiriman◆Cari◆Belum ada riwayat` |
| `AB1637`,`AC1637` | *(kosong → `limit:0`, `moreRoute:""`)* |

### Page JSON hasil rakit `op1Screen!B1635` — VERBATIM

```json
{"title":"Vertika Tekno Lokacipta","children":[{"type":"WORKSPACE_HEADER","vidtable":"20342033315492","table":"","search":"","idField":"","titleField":"","addressField":"","backRoute":"vertikaTeknoLokacipta","text":"Riwayat◆Semua kiriman Anda"},{"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//submission","search":"fc◼submission⭘cv◼87544551624342","conditions":"","sortField":"t","sortDir":"desc","groupBy":"","groupLabels":"","lead":"","title":"<ttl>","subtitle":"<d>","meta":"<ts>","badgeField":"st","badgeMap":"waiting◼Menunggu◼warn⭘processing◼Diproses◼info⭘approved◼Disetujui◼ok⭘done◼Selesai◼ok⭘rejected◼Ditolak◼danger","trailing":"","trailingLabel":"","stats":"Kiriman◼","searchFields":"ttl◆d","route":"","routeParams":"","limit":0,"moreRoute":"","text":"Riwayat◆Semua kiriman · terbaru di atas◆kiriman◆Cari◆Belum ada riwayat"}]}
```

Row Home yang nge-link ke sini: `op1Screen!190` (listCard, `AB190`=`3`,
`AC190`=`vertikaTeknoLokaciptaRiwayatSaya`) + `op1Screen!191` (routeBtn
"Lihat Semua" → `vertikaTeknoLokaciptaRiwayatSaya`).

---

## (c) Segmen "statusLabels" live

### ⚠️ Key `statusLabels` TIDAK MUNCUL di range mana pun yang gua baca

**Scope klaim (jujur):** gua TIDAK nge-scan seluruh spreadsheet. Yang gua baca cuma:
`op1Screen!A180:V200`, `U190:AJ191`, `A1625:V1645`, `U1636:AJ1637`, `V140:V150`,
`A1030:A1080`; `op1Screen Driver!A945:B965`;
`op1Screen Incident, Request dan Approval!A1:B400`, `A400:A520`, `B400:B481`,
`F383:BC383`, `F402:BC402`, `F421:BC421`, `F440:BC440`, `F456:BC456`, `F459:BC459`,
`F471:BC471`, `F476:BC477`; `auzSettings!I28:J110`; `Settings!A1:C5`; `Plug!A1:D40`;
`route!A1:C30`. Tab `Widget` (library template) **BELUM dibaca sama sekali**.

Di semua range di atas, key yang dipakai LIST_CARD / DETAIL_CARD / LIST_ACTION_CARD /
TIMELINE adalah **`badgeMap`** (+ `badgeField`) — `statusLabels` nol kemunculan.
`statusLabels` ketemunya cuma di dev-spec lokal repo
(`docs/cost-center-card-dev-spec.md`, `docs/admin-home-dev-spec.md`) dan sebagai
placeholder `[STATUSLABEL]` di `json/widget-library/_widget-catalog.csv`.

➡️ Sebelum Task 2 nulis key apa pun, **cek tab `Widget`** buat mastiin template
LIST_CARD emang gak punya slot `statusLabels`. Rekomendasi tetap: pakai `badgeMap`,
karena itu yang terbukti kepakai di page live yang mau dimodifikasi.

### Bentuk segmen: `value◼Label◼tier`, antar-entry = separator

**Ada DUA konvensi separator yang hidup bareng:**

**Konvensi ⭘ (dipakai card Riwayat / `//submission` — `op1Screen!T190` & `T1637`):**
```
waiting◼Menunggu◼warn⭘processing◼Diproses◼info⭘approved◼Disetujui◼ok⭘done◼Selesai◼ok⭘rejected◼Ditolak◼danger
```
Sibling absensi `op1Screen!T185` / `T1632`:
```
clock-in◼Masuk◼ok⭘clock-out◼Pulang◼info
```

**Konvensi ★ (dipakai semua page di tab Request/Approval):**
- `'op1Screen Incident, Request dan Approval'!T459` (MyRequestLog listCard):
```
pending◼Menunggu◼neutral★approved◼Disetujui◼ok★rejected◼Ditolak◼danger
```
- `…!K471` (LIST_ACTION_CARD `fields`, badgeMap ada di ekor setelah `◆`):
```
<cn>◆<lt>◆i◆<ts>◆st◆pending◼Menunggu◼warn★approved◼Disetujui◼ok★rejected◼Ditolak◼danger
```
- DETAIL_CARD MyRequestDetailLog & ApprovalDetail (embedded di page JSON B462/B473):
```
pending◼Menunggu◼warn★approved◼Disetujui◼ok★rejected◼Ditolak◼danger
```
- TIMELINE badgeMap (B462/B473):
```
Disetujui◼Disetujui★Ditolak◼Ditolak
```

**Tier yang muncul live:** `ok`, `warn`, `info`, `danger`, `neutral`
(5 tier, bukan 3-tier `danger/warn/ok` seperti di dev-spec).

➡️ **Buat feed `//submission` (Task 2): mirror konvensi `⭘` + `warn/info/ok/danger`
yang SUDAH ada di `T190`/`T1637`.** Jangan campur `★`.

---

## (d) 5 form request + tombol approval

Semua ada di tab **`op1Screen Incident, Request dan Approval`** (bukan `op1Screen`).

### Peta page di tab itu

| Row header | Route key | Isi |
|---|---|---|
| 126 | `vertikaTeknoLokacipta` | landing |
| 128 | `vertikaTeknoLokaciptaHome` | home (snapshot lama; row 185/190 = `textVariant`, BUKAN listCard) |
| 197 | `vertikaTeknoLokaciptaProfile` | |
| 223 | `vertikaTeknoLokaciptaReportIncident` | form incident (positional) |
| 237 / 246 | `…IncidentTaskList` / `…IncidentTaskDetail` | |
| 260 / 269 | `…IncidentSupervisorList` / `…IncidentSupervisorDetail` | |
| **287** | `vertikaTeknoLokaciptaComplaintForm` | **complaint** (lihat (f)-10) |
| 304 / 309 | `…LogReportComplaint` / `…ComplaintClientDetail` | |
| 322 / 331 | `…ComplaintSupervisorList` / `…ComplaintSupervisorDetail` | |
| 344 / 353 | `…ComplaintTaskList` / `…ComplaintTaskDetail` | |
| **366** | `vertikaTeknoLokaciptaRequestDayOff` | **IJIN** |
| **385** | `vertikaTeknoLokaciptaRequestSickLeave` | **SAKIT** |
| **404** | `vertikaTeknoLokaciptaRequestOvertime` | **LEMBUR** |
| **423** | `vertikaTeknoLokaciptaRequestAttendance` | **KOREKSI ABSENSI** |
| **442** | `vertikaTeknoLokaciptaRequestLeave` | **CUTI** (form ke-5, di luar hitungan plan) |
| 457 | `vertikaTeknoLokaciptaMyRequestLog` | list permohonan saya (`//request`) |
| 462 | `vertikaTeknoLokaciptaMyRequestDetailLog` | detail + timeline |
| 468 | `vertikaTeknoLokaciptaApproval` | antrian approval (LIST_ACTION_CARD) |
| 473 | `vertikaTeknoLokaciptaApprovalDetail` | detail + tombol Setujui/Tolak |

### Peta kolom param `SendButtonGpsExeConsteonEvent`

| Col | Key |
|---|---|
| F | displayed |
| G | `text` |
| H | `run` |
| I | `action` (`savesend`) |
| J | `route` |
| K | `flag` |
| **L** | **`addToEvent`** |
| M | chain dialog `title` |
| N | chain dialog body `data` |
| O | `width` · P `buttonColor` · Q `textColor` · R `position` · S `height` · T `delay` · U `gpsPosition` |

### d.1 — IJIN — `vertikaTeknoLokaciptaRequestDayOff` (header row 366)

Tombol kirim: row **383** (`A383`=`17`, `B383`=`SendButtonGpsExeConsteonEvent`).
Cell addToEvent: **`'op1Screen Incident, Request dan Approval'!L383`**

Formula VERBATIM:
```
=""&auzSettings!$J$59&"⭘r◼4320⭘rty◼request-day-off⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁8▷⭘de◼◁9▷⭘d◼◁10▷⭘i◼◁3▷⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘av◼"&'op1'!$K$7&"⭘an◼"&'op1'!$L$7&"⭘sv◼"&'op1'!$K$8&"⭘sn◼"&'op1'!$L$8&"⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶"
```
Resolved VERBATIM:
```
84214220504259//request⭘r◼4320⭘rty◼request-day-off⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁8▷⭘de◼◁9▷⭘d◼◁10▷⭘i◼◁3▷⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘av◼83674161979544⭘an◼Product Group⭘sv◼83674161979544⭘sn◼Product Group⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```
Cell note (Google Sheets note di L383): `table code as vid reference`
`K383` = `request-day-off` · `N383` = `Permohonan ijin terkirim, menunggu approval.`

### d.2 — SAKIT — `vertikaTeknoLokaciptaRequestSickLeave` (header row 385)

Tombol kirim: row **402**. Cell addToEvent: **`'op1Screen Incident, Request dan Approval'!L402`**

Formula VERBATIM:
```
=""&auzSettings!$J$59&"⭘r◼4320⭘rty◼request-sick-leave⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁6▷⭘de◼◁7▷⭘d◼◁10▷⭘i◼◁3▷⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘av◼"&'op1'!$K$7&"⭘an◼"&'op1'!$L$7&"⭘sv◼"&'op1'!$K$8&"⭘sn◼"&'op1'!$L$8&"⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶"
```
Resolved VERBATIM:
```
84214220504259//request⭘r◼4320⭘rty◼request-sick-leave⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁6▷⭘de◼◁7▷⭘d◼◁10▷⭘i◼◁3▷⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘av◼83674161979544⭘an◼Product Group⭘sv◼83674161979544⭘sn◼Product Group⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```
`K402` = `request-sick-leave` · `N402` = `Pemberitahuan sakit terkirim, menunggu approval.`

### d.3 — LEMBUR — `vertikaTeknoLokaciptaRequestOvertime` (header row 404)

Tombol kirim: row **421**. Cell addToEvent: **`'op1Screen Incident, Request dan Approval'!L421`**

Formula VERBATIM:
```
=""&auzSettings!$J$59&"⭘r◼4320⭘rty◼request-overtime⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁8▷⭘de◼◁9▷⭘d◼◁10▷⭘i◼◁3▷⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘av◼"&'op1'!$K$7&"⭘an◼"&'op1'!$L$7&"⭘sv◼"&'op1'!$K$8&"⭘sn◼"&'op1'!$L$8&"⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶"
```
Cell note di `L421`: `table code as vid reference`
Resolved VERBATIM:
```
84214220504259//request⭘r◼4320⭘rty◼request-overtime⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁8▷⭘de◼◁9▷⭘d◼◁10▷⭘i◼◁3▷⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘av◼83674161979544⭘an◼Product Group⭘sv◼83674161979544⭘sn◼Product Group⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```
`K421` = `request-overtime` · `N421` = `Permohonan lembur terkirim, menunggu approval.`

### d.4 — KOREKSI ABSENSI — `vertikaTeknoLokaciptaRequestAttendance` (header row 423)

Tombol kirim: row **440**. Cell addToEvent: **`'op1Screen Incident, Request dan Approval'!L440`**

Formula VERBATIM:
```
=""&auzSettings!$J$59&"⭘r◼4320⭘rty◼request-attendance⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁6▷⭘de◼◁7▷⭘d◼◁10▷⭘i◼◁3▷⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘av◼"&'op1'!$K$7&"⭘an◼"&'op1'!$L$7&"⭘sv◼"&'op1'!$K$8&"⭘sn◼"&'op1'!$L$8&"⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶"
```
Resolved VERBATIM:
```
84214220504259//request⭘r◼4320⭘rty◼request-attendance⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁6▷⭘de◼◁7▷⭘d◼◁10▷⭘i◼◁3▷⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘av◼83674161979544⭘an◼Product Group⭘sv◼83674161979544⭘sn◼Product Group⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```
`K440` = `request-attendance` · `N440` = `Permohonan koreksi absensi terkirim, menunggu approval.`

### d.5 — CUTI (BONUS, tidak disebut plan) — `vertikaTeknoLokaciptaRequestLeave` (header row 442)

Tombol kirim: row **456**. Cell addToEvent: **`'op1Screen Incident, Request dan Approval'!L456`**

Formula VERBATIM:
```
=""&auzSettings!$J$59&"⭘r◼4320⭘rty◼request-leave⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁6▷⭘de◼◁7▷⭘dn◼◁12▷⭘d◼◁10▷⭘i◼◁3▷⭘rpv◼◁16▷⭘rpn◼◁18▷⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘av◼"&'op1'!$K$7&"⭘an◼"&'op1'!$L$7&"⭘sv◼"&'op1'!$K$8&"⭘sn◼"&'op1'!$L$8&"⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶"
```
Resolved VERBATIM:
```
84214220504259//request⭘r◼4320⭘rty◼request-leave⭘st◼pending⭘nm◼◁17▷⭘lt◼◁4▷⭘ds◼◁6▷⭘de◼◁7▷⭘dn◼◁12▷⭘d◼◁10▷⭘i◼◁3▷⭘rpv◼◁16▷⭘rpn◼◁18▷⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘av◼83674161979544⭘an◼Product Group⭘sv◼83674161979544⭘sn◼Product Group⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```
`K456` = `request-leave` · `N456` = `Permohonan cuti terkirim, menunggu approval.`

### d.6 — Tombol approval A: antrian `vertikaTeknoLokaciptaApproval` row 471 (LIST_ACTION_CARD)

Peta kolom row 471: F displayed · G `vidtable` · H `table` · I `search` · J `sort` ·
K `fields` · L `stats` · M `searchFields` · N `route` · O `routeParams` ·
**P `updateEventRow1`** · **Q `updateEventRow2`** · R `actionMeta` · S `text` ·
**T `addToEvent1`** · **U `addToEvent2`** · V `gateTable` · W `gateSearch` ·
X `gateSlot` · Y `note`

Cell non-DSL (literal, bukan formula — nilai apa adanya):

| Cell | Isi |
|---|---|
| `…!I471` | `st◼pending` |
| `…!R471` (actionMeta) | `ok◼request-approve◆danger◼request-reject◼5` |
| `…!V471` / `W471` / `X471` | `grant` / `ty◼approver⭘vid◼{userVid}` / `sc◆ak◆cl` |
| `…!N471` / `O471` | `vertikaTeknoLokaciptaApproveLeaveDetail` / `nm◼{nm}` |

**4 cell DSL — SEMUANYA FORMULA** (dibaca ulang dengan `include_grid_data: true`;
tidak ada satu pun yang literal string):

**`…!P471` — `updateEventRow1` (SETUJUI)**
Formula VERBATIM:
```
=auzSettings!$J$59&"⭘search◼nm★{nm}⭘dv◼approve⭘dvby◼"&Settings!$B$1&"⭘dvbn◼"&Settings!$B$2
```
Resolved VERBATIM:
```
84214220504259//request⭘search◼nm★{nm}⭘dv◼approve⭘dvby◼87544551624342⭘dvbn◼Agenia Demo-7
```

**`…!Q471` — `updateEventRow2` (TOLAK)**
Formula VERBATIM:
```
=auzSettings!$J$59&"⭘search◼nm★{nm}⭘dv◼reject⭘rr◼◁5▷⭘dvby◼"&Settings!$B$1&"⭘dvbn◼"&Settings!$B$2
```
Resolved VERBATIM:
```
84214220504259//request⭘search◼nm★{nm}⭘dv◼reject⭘rr◼◁5▷⭘dvby◼87544551624342⭘dvbn◼Agenia Demo-7
```

**`…!T471` — `addToEvent1` (jejak SETUJUI ke `//event`)**
Formula VERBATIM:
```
=auzSettings!$J$31&"⭘r◼4320⭘nm◼◀2▶⭘ty◼request-approved⭘ttl◼Disetujui⭘nm◼{nm}⭘lvl◼{cl}⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶"
```
Resolved VERBATIM:
```
84214220504259//event⭘r◼4320⭘nm◼◀2▶⭘ty◼request-approved⭘ttl◼Disetujui⭘nm◼{nm}⭘lvl◼{cl}⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```

**`…!U471` — `addToEvent2` (jejak TOLAK ke `//event`)**
Formula VERBATIM:
```
=auzSettings!$J$31&"⭘r◼4320⭘nm◼◀2▶⭘ty◼request-rejected⭘ttl◼Ditolak⭘nm◼{nm}⭘lvl◼{cl}⭘d◼◁5▷⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶"
```
Resolved VERBATIM:
```
84214220504259//event⭘r◼4320⭘nm◼◀2▶⭘ty◼request-rejected⭘ttl◼Ditolak⭘nm◼{nm}⭘lvl◼{cl}⭘d◼◁5▷⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```

📌 **Catatan buat Task 4:** `T471`/`U471` ngambil path dari **`auzSettings!$J$31`**
(`//event`), sementara `P471`/`Q471` dari **`$J$59`** (`//request`). Dua ref beda di
satu row — jangan ketuker waktu nambah blok `◆`.

⚠️ **Varian penulisan formula:** `P471`/`Q471`/`T471`/`U471` mulai dengan
`=auzSettings!$J$nn&"…` (tanpa `""&` di depan), sedangkan `L383`/`L402`/`L421`/
`L440`/`L456`/`L476`/`R477` mulai dengan `=""&auzSettings!$J$nn&"…`. Hasilnya
identik; tapi kalau nulis balik, **pertahankan bentuk asli tiap cell** biar diff
bersih.

### d.7 — Tombol approval B: `vertikaTeknoLokaciptaApprovalDetail` rows 476-477

**Row 476 — `workflowEventBtnFlat` = "✓ Setujui"**
Peta kolom: F displayed · G `text` · H `search` · I `gpsPosition` · J `flag` ·
K `buttonColor` · **L `updateEventRow`** · M `addToEvent` · N chain title ·
O chain body · P chain route

Cell: **`'op1Screen Incident, Request dan Approval'!L476`**
Formula VERBATIM:
```
=""&auzSettings!$J$59&"⭘search◼nm★{nm}⭘dv◼approve⭘dvby◼"&Settings!$B$1&"⭘dvbn◼"&Settings!$B$2
```
Resolved VERBATIM:
```
84214220504259//request⭘search◼nm★{nm}⭘dv◼approve⭘dvby◼87544551624342⭘dvbn◼Agenia Demo-7
```
`H476` = `st◼pending` · `J476` = `request-approve` · **`M476` = `` (addToEvent KOSONG)** ·
`P476` = `vertikaTeknoLokaciptaApproveLeave`

**Row 477 — `workflowEventNoteBtnFlat` = "✕ Tolak"**
Peta kolom: F displayed · G `text` · H `search` · I `gpsPosition` · J `flag` ·
K `buttonColor` · L sheet title · M sheet body · N field label · O hint ·
P field `position` · Q button text · **R `updateEventRow`**

Cell: **`'op1Screen Incident, Request dan Approval'!R477`**
Formula VERBATIM:
```
=""&auzSettings!$J$59&"⭘search◼nm★{nm}⭘dv◼reject⭘rr◼◁5▷⭘dvby◼"&Settings!$B$1&"⭘dvbn◼"&Settings!$B$2
```
Resolved VERBATIM:
```
84214220504259//request⭘search◼nm★{nm}⭘dv◼reject⭘rr◼◁5▷⭘dvby◼87544551624342⭘dvbn◼Agenia Demo-7
```
`H477` = `st◼pending` · `J477` = `request-reject` · `P477` = `5`

---

## (e) Registry `auzSettings` kolom J

`I30` = `vidtable (default) — produksi harusnya KOSONG, sekarang diisi buat testing`,
`J30` = `20342033315492`. Mulai `J31` = daftar path table.

| J | Isi | | J | Isi |
|---|---|---|---|---|
| J31 | `84214220504259//event` | | J51 | `…//model_cache` |
| J32 | `…//workforce` | | J52 | `…//sales_visit` |
| J33 | `…//stock_location` | | J53 | `…//sales_task` |
| J34 | `…//vehicle_check` | | J54 | `…//sales_task_assign` |
| J35 | `…//item` | | J55 | `…//product` |
| J36 | `…//asset_cache` | | J56 | `…//notification_grant` |
| J37 | `…//task` | | J57 | `…//post_claim` |
| J38 | `…//evidence` | | J58 | `…//reward_cache` |
| J39 | `…//investigation` | | **J59** | **`84214220504259//request`** |
| J40 | `…//movement` | | J60 | `…//location` |
| J41 | `…//nota` | | J61 | `…//work_order` |
| J42 | `…//report-incident` | | J62 | `…//asset` |
| J43 | `…//history` | | J63 | `…//report-checklist` |
| J44 | `…//site` | | J64 | `…//ocr` |
| J45 | `…//report` | | J65 | `…//cleaning_visit` |
| J46 | `…//report-incident-history` | | J66 | `…//checklist_template` |
| J47 | `…//comments` | | J67 | `…//checklist_map` |
| J48 | `…//complaint` | | J68 | `…//meter` |
| J49 | `…//fate_project` | | J69 | `…//reorder_cache` |
| J50 | `…//fate_assign` | | J70 | `84214220504259//customer` |

### ❌ `//submission` BELUM teregistrasi

- Terakhir terisi: **`J70` = `84214220504259//customer`**.
- **Baris kosong berikutnya: `auzSettings!J71`** (`I71` juga kosong; `I32:I70` semuanya
  kosong — kolom I cuma dipakai di `I30` sebagai catatan).
- Registry ini **load-bearing**: tiap cell addToEvent/updateEventRow form request
  mulai dengan `=""&auzSettings!$J$59&"…`. Jadi kalau `//submission` didaftarin di
  `J71`, semua blok `◆` baru harusnya nulis `=""&auzSettings!$J$71&"…` — BUKAN
  literal `84214220504259//submission`.

---

## (f) Kontradiksi terhadap asumsi plan/spec — ⚠️ BACA SEMUA

### f-1. Path table: card Riwayat HARDCODE, form request pakai registry ref
`op1Screen!H190`/`H1637` = `="84214220504259//submission"` (literal di dalam formula),
sementara `L383`/`L476`/`R477` = `=""&auzSettings!$J$59&"…`.
Dua konvensi beda di satu spreadsheet. Sesi Riwayat (2026-08-31) bikin card TANPA
daftarin table di registry. Keputusan yang harus diambil sebelum Task 2/3:
daftarin `//submission` di `J71` lalu flip `H190`/`H1637` ke `=""&auzSettings!$J$71`,
atau terima hardcode. **Plan tidak menyebut ini sama sekali.**

### f-2. ⚠️ Ref cost-center di plan SALAH/ketuker
Plan Global Constraints bilang: `av◼"&'op1'!$K$8&"` `an◼"&'op1'!$L$8&"`.
**LIVE:** `av◼"&'op1'!$K$7&"` `an◼"&'op1'!$L$7&"` **dan** `sv◼"&'op1'!$K$8&"`
`sn◼"&'op1'!$L$8&"`. Jadi K8/L8 = **site (sv/sn)**, bukan av/an.
Kalau Task 3 ikut plan mentah-mentah, `av`/`an` di `//submission` bakal keisi
nilai SITE. **Ikuti live: av/an ← K7/L7.**

### f-3. Timezone: plan hardcode `T7`, live pakai ref
Plan snippet Task 3 nulis `ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶`.
Live: `ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶`.
Hardcode `T7` melanggar aturan template-dicopy-antar-tenant. **Pakai `System!$B$3`.**

### f-4. ⚠️ `statusLabels` tidak muncul di range mana pun yang dibaca
Task 2 Step 2 nyuruh "Tulis `statusLabels`". Di semua range yang gua baca (daftar
lengkap di bagian (c)), key yang kepakai = **`badgeMap`** (kolom T); `statusLabels`
nol kemunculan. **Tab `Widget` belum dibaca**, jadi ini bukan bukti absolut kalau
renderer gak kenal `statusLabels` — tapi cukup buat bilang: page yang mau kita
modifikasi pakai `badgeMap`. Nulis key `statusLabels` ke page itu = risiko
config-ahead-of-renderer → widget bisa DROP. Verifikasi tab `Widget` dulu.
Task 2 harus di-reframe jadi "isi/rapikan `badgeMap`", dan `badgeMap` di `T190`/`T1637`
**sudah** persis semantik yang diminta plan (waiting/processing/approved/done/rejected)
— kemungkinan besar Task 2 Step 2 = NO-OP.

### f-5. Separator badgeMap tidak konsisten antar-tab
`⭘` di `op1Screen` (card Riwayat) vs `★` di tab Request/Approval. Renderer jelas
nerima dua-duanya (dua-duanya live), tapi jangan campur dalam satu string.
Untuk feed: pakai `⭘` (ikut yang sudah live di `T190`/`T1637`).

### f-6. Vokabuler status beda antara `//request` dan `//submission`
Form nulis `st◼pending` ke `//request`. Card `//submission` nunggu `waiting`.
Dual-write Task 3 harus sadar: blok `//request` tetap `pending`, blok `//submission`
pakai `waiting`. Jangan copy-paste `st` dari blok existing.

### f-7. 🚨 BLOCKER Task 4 — tombol approve TIDAK tahu level final
Tombol Setujui cuma nulis **`dv◼approve`** ke `//request`. `st` di-hitung
**Cloud Function** (`docs/approval-flow-keyed-dev-spec.md` §4.2:
"`cl == nl` → `st◼approved`"; CF juga clear `dv`). Config sheet TIDAK punya
informasi apakah approval ini level terakhir.
➡️ Rencana Task 4 ("append `◆…//submission⭘st◼approved`" ke tombol approve) akan
menandai head **approved di level 1 dari N** — melanggar spec §5 yang bilang
approval non-final TIDAK boleh update `//submission`.
Opsi yang perlu diputuskan sebelum Task 4: (a) `//submission.st` diisi CF, bukan
config; (b) tombol nulis `st◼processing` (bukan `approved`) dan status final
menyusul lewat CF; (c) terima ketidakakuratan. **Butuh keputusan user/dev.**
Reject lebih aman — reject selalu final.

### f-8. ⚠️ Nama `ty` di plan Task 2/3 BENTROK dengan `rty` live
Plan Task 3 memetakan Ijin → `request-leave` / "Ijin Cuti".
**LIVE `request-leave` = form CUTI (row 442), bukan Ijin.** Ijin = `request-day-off`.
Peta yang benar (dari `K383/K402/K421/K440/K456`):

| Form | `rty` LIVE | `ty` di plan (SALAH) |
|---|---|---|
| Ijin (DayOff) | `request-day-off` | `request-leave` ❌ |
| Sakit | `request-sick-leave` | `request-sick` ❌ |
| Lembur | `request-overtime` | `request-overtime` ✅ |
| Koreksi Absensi | `request-attendance` | `attendance-correction` ❌ |
| Cuti | `request-leave` | (tidak ada di plan) ❌ |

**Rekomendasi: `ty` di `//submission` = nilai `rty` live persis**, biar 1 kamus.

### f-9. Ada 5 form request, bukan 4
Plan cuma nyebut 4 (Ijin/Sakit/Lembur/Koreksi). Form ke-5 = **Cuti**
(`vertikaTeknoLokaciptaRequestLeave` @442, cell `L456`) — sama-sama nulis ke
`//request` dan muncul di MyRequestLog + antrian approval yang sama. Kalau
di-skip, feed bakal bolong buat cuti. Perlu konfirmasi scope.

### f-10. Lokasi page Complaint/Incident ≠ yang ditulis spec/memory
Spec §7.1b bilang complaint @989-1071 di `op1Screen`. **Live: complaint ada di
`op1Screen Incident, Request dan Approval` rows 287-365** (ComplaintForm@287,
LogReportComplaint@304, ComplaintClientDetail@309, ComplaintSupervisorList@322,
ComplaintSupervisorDetail@331, ComplaintTaskList@344, ComplaintTaskDetail@353).
Incident ada **di dua tab**: tab ini rows 223-286 DAN `op1Screen` ~1037-1053
(`vertikaTeknoLokaciptaIncidentSupervisorList`@1037, `…SupervisorDetail`@1046).
Duplikasi = risiko edit di tab yang salah. Di luar scope plan ini, tapi wajib
diklarifikasi sebelum plan incident/complaint berikutnya.

### f-11. Route-string mismatch di approval + `ApproveLeave@1052` gak ketemu di range yang dibaca

**Yang TERBUKTI (kuat, dari cell yang gua baca):** nama route yang dituju ≠ nama page
yang ada di tab ini.

| Cell | Route yang ditulis | Page yang ADA di tab ini |
|---|---|---|
| `…!N471` (route antrian → detail) | `vertikaTeknoLokaciptaApproveLeaveDetail` | header @473 = `vertikaTeknoLokaciptaApprovalDetail` |
| `…!P476` (backRoute tombol Setujui) | `vertikaTeknoLokaciptaApproveLeave` | header @468 = `vertikaTeknoLokaciptaApproval` |

**Yang BELUM terbukti (jangan diklaim):** gua TIDAK bisa bilang page
`vertikaTeknoLokaciptaApproveLeave` / `…ApproveLeaveDetail` tidak ada. Gua cuma
baca `op1Screen!A1030:A1080` (di situ isinya region
`vertikaTeknoLokaciptaIncidentSupervisorDetail`, jadi referensi plan
"ApproveLeave@1052" **tidak cocok di baris itu**). Kolom A `op1Screen` selebihnya
(13.510 baris) + `op1Screen Driver` + tab lain **belum di-scan**. Page-nya bisa saja
ada di baris lain atau tab lain.

➡️ **Aksi sebelum Task 4:** scan kolom A semua tab `op1Screen*` buat route
`ApproveLeave` / `ApproveLeaveDetail`. Kalau ketemu → route mismatch ini cuma
penamaan ganda (2 flow paralel), aman. Kalau gak ketemu di mana pun → navigasi
approval kemungkinan patah dan perlu konfirmasi user di app.

### f-12. Tombol Setujui/Tolak di ApprovalDetail tidak nulis `//event`
`M476` (`addToEvent`) kosong dan row 477 tidak punya slot addToEvent sama sekali.
Padahal page yang sama punya TIMELINE yang baca `//event`. Artinya approve lewat
halaman detail = timeline kosong; cuma approve lewat LIST_ACTION_CARD (row 471,
`T471`/`U471`) yang nulis jejak. Pre-existing gap, catat.

### f-13. `addToEvent1`/`addToEvent2` @471 punya key `nm` DOBEL
`…⭘nm◼◀2▶⭘ty◼request-approved⭘ttl◼Disetujui⭘nm◼{nm}⭘…` — `nm` muncul 2×
(pertama `◀2▶` = epoch?, kedua `{nm}` = nomor). Kemungkinan yang pertama harusnya
`ref` atau `t`. Diperkuat: TIMELINE MyRequestDetailLog filter `[[◀nm▶◼{noref}]]`
tapi TIMELINE ApprovalDetail filter `[[◀ref▶◼{nm}]]` — dua field beda buat data
yang sama. Pre-existing bug, di luar scope, tapi mempengaruhi keandalan timeline.

### f-14. Catatan teknis: param cell = FORMULA
`get_sheet_data` tanpa `include_grid_data` balikin nilai RESOLVED (VID literal
`87544551624342`, `Agenia Demo-7`). Kalau Task 3/4 nulis balik nilai resolved itu,
formula ref hilang → identitas ke-bake → melanggar constraint plan.
**WAJIB baca dulu `include_grid_data: true`, ambil `formulaValue`, lalu tulis
formula (bukan value).**

### f-15. Nama tab mengandung koma
`op1Screen Incident, Request dan Approval` — di formula wajib pakai kutip tunggal.
Range MCP juga: `sheet` = nama persis, jangan disingkat.

---

## Ringkasan cell yang jadi target Task 2/3/4

| Task | Cell target | Isi sekarang |
|---|---|---|
| 2 | `op1Screen!T1637` (+ `T190`) | `badgeMap` submission — sudah sesuai semantik spec |
| 2 | `op1Screen!Y1637`/`Z1637` | `route`/`routeParams` masih KOSONG |
| 3 | `'op1Screen Incident, Request dan Approval'!L383` | Ijin — `rty◼request-day-off` |
| 3 | `…!L402` | Sakit — `rty◼request-sick-leave` |
| 3 | `…!L421` | Lembur — `rty◼request-overtime` |
| 3 | `…!L440` | Koreksi — `rty◼request-attendance` |
| 3? | `…!L456` | Cuti — `rty◼request-leave` (scope belum dikonfirmasi) |
| 4 | `…!L476` | Setujui (detail) — `dv◼approve` |
| 4 | `…!R477` | Tolak (detail) — `dv◼reject` |
| 4 | `…!P471` / `Q471` | Setujui / Tolak (antrian) |
| e | `auzSettings!J71` | KOSONG — slot buat `84214220504259//submission` |
