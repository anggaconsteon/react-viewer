# ApproveLeave — gating per-slot (hide kalau bukan slot lo) + field `note` (Dev Spec)

**Tanggal:** 2026-07-30 (revisi 2 — round-2 re-test GAGAL, akar = sumber vid salah; baca §1.1 + §4.0 DULU)
**Buat:** **dev Flutter (renderer)** — `LIST_ACTION_CARD` + tombol approve/reject di detail. (Sheet: NOL perubahan.)
**Status:** APPROVED (pendekatan disetujui user 2026-07-30: "hilangin aja kalo bukan levelnya")
**Konsumen pertama:** page **ApproveLeave** (op1Screen @1050 `LIST_ACTION_CARD`) + **ApproveLeaveDetail** (@1055, tombol Setujui/Tolak).
**Referensi:** `docs/approval-flow-keyed-dev-spec.md` (flow induk) · `docs/approval-grant-schema-cf-dev-spec.md` (grant `approver`: `ty/vid/n/sc`) · CF `internal/approval` (stamp `ak`/`cl`/`nl`).

---

## 1. Kenapa

Live-test 2026-07-30, **1 request PG-leave 3-level** (`REQ-2026-000369`, `av=83674161979544` "Product Group"). Hasil **SALAH** di level 3:

| | Yang terjadi | Harusnya |
|---|---|---|
| **Agenia** (login) | Level 3 request **masih muncul + tombol approve nyala** | **HILANG** (Agenia di L3 pegang KP-3, bukan PG-3) |
| **Dirgahayu** (login) | Level 3 request **gak muncul di list** (kepaksa approve lewat detail) | **MUNCUL di list** (Dirgahayu pegang PG-3) |

**Akar masalah (dikonfirmasi dari config op1Screen):** page ApproveLeave **gak punya gating slot sama sekali** — `search:"st◼pending"` doang → semua approver liat semua pending, dan tombol nyala selama `st◼pending` tanpa cek slot. Level 1-2 kebetulan approvernya Agenia jadi keliatan bener; level 3 approver pindah ke Dirgahayu → di situ bug-nya ketahuan.

**Identity/session di sisi WRITE bener** — `l3by:80883888051110` ke-stamp Dirgahayu (dari auth server). TAPI gate renderer di client baca sumber vid yang BEDA (§1.1 + §4.0).

**Keputusan user (terkunci 2026-07-30):** kalau request bukan slot lo → **list ilang + tombol ilang**. List = gerbang utama; tombol di-gate juga biar aman.

### 1.1 Round-2 (2026-07-30) — dev udah implement, MASIH SALAH (akar ketemu)

Setelah spec ini dikirim + dev implement gating, re-test (request PG sama):

| Level (`ak`) | Agenia list | Agenia tombol | Dirgahayu list | Dirgahayu tombol |
|---|---|---|---|---|
| 1 (PG-1) | ada | **ADA** | ada | **GAK** |
| 2 (PG-2) | ada | **ADA** | ada | **GAK** |
| 3 (PG-3) | ada | **ADA** | GAK | **GAK** |

**Smoking gun:** tombol = Agenia **SELALU ada**, Dirgahayu **GAK PERNAH ada**, di SEMUA level. Tombol **gak peduli level/slot** → gate **gak ngitung `req.ak ∈ sc`**, dia ngunci ke **identity Agenia**. Dan list Dirgahayu (ada L1/L2, hilang L3) PERSIS hasil di-filter pakai slot **AGENIA** (punya PG-1,PG-2 → lolos; gak punya PG-3 → hilang) — Dirgahayu di-gate pakai slot **Agenia**, bukan slot dia sendiri.

**AKAR: gate baca vid Agenia yang ke-BAKE (`Settings!B1` = `87544551624342`, sama yg dipake `dvby`), BUKAN vid user yang login.** Semua orang keukur jadi Agenia. → **§4.0.**

## 2. Konsep

Tiap approver megang **slot = `{cost-center}-{level}`** (bisa banyak). Request punya pointer aktif `ak = {av}-{cl}` yang **digeser CF tiap naik level**. Approver X boleh liat + approve request **cuma kalau `ak` request cocok salah satu slot X**. Jadi request otomatis "pindah meja" antar approver pas level naik. Base `st◼pending` TETAP; gating = lapisan filter di renderer (search DSL gak bisa "ak IN daftar-dinamis" + wildcard).

## 3. Kontrak field (semua UDAH ada, gak nambah field)

### 3.1 Grant `approver` (sumber slot approver — 1 doc per approver)
```json
{ "ty":"approver", "vid":"80883888051110", "n":"Dirgahayu", "sc":"83674161979544-1|83674161979544-3" }
```
| field | isi |
|---|---|
| `vid` | vid approver — **match sama vid user yang login** |
| `sc` | slot yang dia pegang, `|`-join. Term = `{ccVID}-{lvl}` (konkret) ATAU `*-{lvl}` (all-cost-center) |

### 3.2 Request (field yang dibaca — udah di-stamp CF)
| field | isi |
|---|---|
| `st` | `pending` (base filter) |
| `ak` | pointer aktif `{av}-{cl}` — **INI yang di-match ke slot.** Kosong `""` kalau udah approved/rejected |
| `cl` | level aktif · `nl` = total level |
| `av` | cost-center request |

## 4.0 ⚠ AKAR SEBENERNYA — RESOLVED 2026-07-30 (dev feedback, verified not assumed)

**✅ KODE BENAR (dev trace):** gate baca `{userVid}→screenTx['#VID']` (driver_home_support.dart:305-307) = sumber **SAMA** kayak write `l{N}by` (api.dart:4699/4802 · #VID ditulis cuma pas login: api.dart:1676 · user_repository.dart:527/798). **NOL Settings!B1/dvby/konstanta** di jalur gate. Agenia `87544551624342` & Dirgahayu `80883888051110` ke-stamp beda dari #VID = bukti. **→ Teori "baked Settings!B1" di bawah KELIRU, di-skip.**

**AKAR ASLI = CONFIG, bukan kode.** Gate config-driven, butuh field **`gateSearch`** buat tau grant mana di-fetch. @1050 & @1055 **GAK punya `gateSearch`** → gate jalan tanpa instruksi → rusak.

**FIX (sheet):**
- @1050 `LIST_ACTION_CARD` → `gateSearch: ty◼approver⭘vid◼{userVid}`
- @1055 RBT (Setujui/Tolak) → `gateSearch: ty◼approver⭘vid◼{userVid}`

`{userVid}` WAJIB verbatim — literal vid = jalanin slot 1 orang di SEMUA device (dev doc forbid). Free win: #VID unset → token tetep literal `{userVid}` → filter empty → **fail-closed** (aman).

**OPEN (cek dev):** (a) `gateSlot: sc◆ak◆cl` (list) / `gateRowSlot: sc◆5◆7` (tombol) — config-needed atau default? (b) nilai NO-GATE buat widget shared di Reward (RewardReview @1018, RewardReviewDetail @1022/1023) biar gak ikut ke-gate / fail-closed.

---

_(⬇ analisa lama sumber-vid — SEBAGIAN KELIRU (baked-vid theory), disimpen buat trail doang)_

`sessionVid` di §4 = **vid user yang login secara AUTH di CLIENT** (yang lagi megang HP). Ini **BUKAN**:
- ❌ `Settings!B1` / `op1!K7` / nilai apa pun dari **sheet** — itu ke-bake `87544551624342` (Agenia) buat demo org-value, BUKAN user login. **Ini yang kepake sekarang → sumber bug.**
- ❌ `dvby` / `cv` di config — juga baked Agenia.
- ❌ konstanta / cached demo user.

**2 sumber identity yang KEPISAH — jangan ketuker:**

| | Sumber | Status |
|---|---|---|
| Write (`l{n}by`) | auth server (tau siapa manggil) | ✅ bener (l3by=Dirgahayu) |
| **Gate renderer (client)** | **HARUS auth session client yang SAMA** | ❌ skarang baca sheet-baked Agenia |

Pakai vid auth yang **SAMA** kayak yang bikin `l3by` ke-stamp Dirgahayu. Kalau client belum punya API vid-login bersih → itu **prasyarat #0**, harus ada dulu sebelum gate bisa bener.

**Instrumentasi (WAJIB sebelum ngoding ulang):** log per render, tiap login:
```
sessionVid  = <vid yg dipake gate>
sc          = <grant.sc hasil fetch>
req.ak, req.cl, visible
```
Login **Dirgahayu** tapi `sessionVid` ke-log `87544551624342` (Agenia) → **KEBUKTI** gate baca vid baked. Benerin sumber vid, baru gate §4 jalan.

## 4. Algoritma gating (INTI — copy ini)

```
sessionVid = vid user login AUTH di client    // ⚠ §4.0 — BUKAN Settings!B1/dvby (baked Agenia)

// 1. ambil slot approver yang login
doc = query grant WHERE ty == "approver" AND vid == sessionVid
if (doc == null) return []                // approver-less → antrian KOSONG (BUKAN semua pending)
slots = doc.sc.split("|")                 // ["83674161979544-1","83674161979544-3"]

// 2. pisah konkret vs wildcard
concrete       = { s in slots : !s.startsWith("*") }        // set string "{cc}-{lvl}"
wildcardLevels = { int(s.substringAfter("*-")) : s in slots, s.startsWith("*-") }  // set int

// 3. untuk tiap request pending, VISIBLE kalau:
visible(req) = concrete.contains(req.ak)  OR  wildcardLevels.contains(req.cl)
```

- **List:** render kartu cuma yang `visible(req) == true`.
- **Tombol Setujui/Tolak di detail:** hitung ulang `visible(req)` buat request yang dibuka; kalau `false` → **tombol jangan dirender** (di atas cek `st◼pending` yang udah ada). Kalau `visible==true` → tombol tampil normal.

`req.ak = "{av}-{cl}"`. Konkret string-match, gak usah parse cc/level kecuali buat wildcard.

## 4b. Contoh resolved (data live — `REQ-2026-000369`, av=PG=`83674161979544`, nl=3)

Slot approver (dari grant live):
- **Agenia** `87544551624342`: `sc = 83674161979544-1|83674161979544-2|32639062303108-3` → PG-1, PG-2, **KP-3**
- **Dirgahayu** `80883888051110`: `sc = 83674161979544-1|83674161979544-3` → PG-1, **PG-3**
- **Surya** (PG-3), **Marita** (`*-1` wildcard) — contoh dari spec induk

| cl | `ak` | Agenia liat? | Dirgahayu liat? | Yang harusnya megang |
|---|---|---|---|---|
| 1 | `83674161979544-1` | ✅ (punya PG-1) | ✅ (punya PG-1) | Agenia, Dirgahayu, Marita(`*-1`) |
| 2 | `83674161979544-2` | ✅ (punya PG-2) | ❌ (gak punya PG-2) | Agenia |
| 3 | `83674161979544-3` | ❌ (dia KP-3, bukan PG-3) | ✅ (punya PG-3) | Dirgahayu, Surya |

→ Di L3: **Agenia list & tombol HILANG**, **Dirgahayu list MUNCUL**. Kebalik dari yang sekarang.

## 5. Field `note` (opsional, sekalian — biar approver tau lagi di level berapa)

Kartu/detail sekarang gak nunjukin "lagi level berapa". Tambah 1 slot display **generic**:
```json
LIST_ACTION_CARD / DETAIL_CARD: { …, "note": "Level <cl> dari <nl>", … }
```
| field | tipe | isi |
|---|---|---|
| `note` | string (opsional) | teks ber-token `<field>`, resolve dari doc row (reuse resolver `title`/`subtitle`). **Kosong/absen → GAK dirender.** Isi bebas per-case (BUKAN khusus level) |

Nol string hardcode di Flutter — semua dari config.

## 6. Sheet-side — KONTRAK GATE (dev feedback 2026-07-30, FINAL)

Gate itu **config-driven**. `search:"st◼pending"` TETAP (base). Tambah field gate:

**Saklar = `gateTable`** (bukan gateSearch). Truth table:
| gateTable | gateSearch | hasil |
|---|---|---|
| absent / `""` | apa pun | **NO GATE** (lolos semua) — buat layar non-gated |
| present | `""` | **FAIL-CLOSED** (list kosong) |
| present | `{userVid}` clause | gate jalan |

→ Layar non-gated (RewardReview @1018, RewardReviewDetail @1022/1023) = **gateTable KOSONG**. Jangan author gateTable = byte-identik pre-gating. (Blank key LAIN = queue kosong; cuma gateTable yg switch.)

**No renderer defaults — semua key wajib di-author verbatim.**

**@1050 `LIST_ACTION_CARD`:**
```
gateTable  : grant                        (bare — resolve ikut docId table list)
gateSearch : ty◼approver⭘vid◼{userVid}    ({userVid} → #VID login; literal vid = 1 org di semua device, FORBID)
gateSlot   : sc◆ak◆cl                      (FIELD NAMES — list baca doc['ak'] keyed)
```
**@1055 RBT (Setujui/Tolak):**
```
gateTable  : 84214220504259//grant        (FULL path — RBT gak punya primary table)
gateSearch : ty◼approver⭘vid◼{userVid}
vidtable   : 20342033315492               (SAMA @1050 — else subscription beda → grant kosong → tombol hidden)
gateSlot   : sc◆ak◆cl                      (field-names, via currentDoc — lihat ⚠ di bawah)
```

**⚠ @1055 = DETAIL_CARD (keyed //request) → butuh PATCH renderer.** DetailCard "publishes nothing" ke `currentRow` → `gateRowSlot` (index-based) fail-closed selamanya. Patch ~15 baris (dev): tambah `ItemCardDetail.currentDoc` (RxMap static), publish `matched.first` dari DetailCard post-frame, clear di route listener (approver_sticky_bar.dart:86-90), gate **prefer gateSlot field-names pas currentDoc non-empty**, fallback gateRowSlot. Hasil = simetri `sc◆ak◆cl` dua layar. Fail-closed rules tetap. **STATUS: patch di-request ke dev 2026-07-30.** (`gateRowSlot: sc◆<akIdx>◆<clIdx>` index-based cuma relevan buat koleksi POSITIONAL kayak //report-incident, BUKAN //request keyed.)

Field `note` (§5): builder tambah `note:"Level <cl> dari <nl>"` via genericize helper col, nyusul SETELAH renderer support.

## 7. Deliverable dev (renderer)
1. **Fetch slot approver** — query `grant` `ty=="approver" ∧ vid==sessionVid` → `sc`. Gak ada doc → antrian kosong.
2. **Gating LIST** (`LIST_ACTION_CARD` ApproveLeave) — filter kartu pakai `visible(req)` (§4). Self-approve DIBOLEHIN (jangan exclude "request sendiri").
3. **Gating TOMBOL** (Setujui/Tolak di ApproveLeaveDetail) — hitung `visible(req)` buat request yg dibuka; `false` → sembunyiin tombol. (Defense-in-depth: detail bisa ke-reach via route param `nm`, jadi jangan cuma ngandelin list.)
4. **Field `note`** — baca dari config, kosong→skip, resolve `<field>`, render 1 baris muted. Generic.

Implementasi #2/#3: **v1 client-side filter** (query `st==pending` kaya sekarang → filter in-memory pakai §4). Simpel, nol index. Scale nanti: server-side `where st==pending where ak in [concrete]` (`in` ≤30) + query kedua `where cl in [wildcardLevels]` → merge+dedup, butuh index (`st,ak`)+(`st,cl`).

## 9. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| Fetch `sc` approver login | dev Flutter | **PENDING (bug)** |
| Gating LIST (kartu hilang kalau `ak ∉ sc`) | dev Flutter | **PENDING (bug)** |
| Gating TOMBOL detail (tombol hilang kalau `ak ∉ sc`) | dev Flutter | **PENDING (bug)** |
| Field `note` generic | dev Flutter | PENDING (nice-to-have) |
| **Sumber vid gate = auth client (BUKAN sheet-baked)** | **dev Flutter** | **PENDING (akar bug round-2, §4.0)** |
| CF stamp `ak`/`cl`/`nl` | — | ✅ LIVE (bener) |
| Identity WRITE (`l{n}by`, auth server) | — | ✅ LIVE (bener) · gate CLIENT ❌ masih baked (§4.0) |
| Grant `approver` doc `sc` | — | ✅ LIVE |

## 10. Not Doing (dan kenapa)
- **Gating di search DSL / sheet** — GAK BISA. Search cuma eq tunggal; approver punya banyak slot + ada wildcard `*-N`. Wajib renderer.
- **Exclude self-approve** — dibolehin v1 (user). Gating murni slot; Agenia boleh approve request-nya sendiri di level yg dia pegang.
- **Server-side query dulu** — v1 client-side (simpel, nol index). Pindah kalau antrian ratusan.
- **`note` khusus level** — sengaja generic (`<field>` bebas); widget kepake banyak case.

## 11. Acceptance (pakai `REQ-2026-000369`, PG 3-level)
- [ ] L1 (`ak=83674161979544-1`) → muncul di **Agenia, Dirgahayu** (+ Marita `*-1`) — list & tombol.
- [ ] L2 (`ak=83674161979544-2`) → muncul di **Agenia doang**. Dirgahayu: list kosong + tombol gak ada.
- [ ] L3 (`ak=83674161979544-3`) → **Agenia: list kosong + tombol HILANG**; **Dirgahayu: list muncul + bisa approve**.
- [ ] Approver tanpa slot cocok → antrian kosong (BUKAN semua pending).
- [ ] Tombol detail: buka request yg `ak ∉ sc` via route → tombol Setujui/Tolak **gak muncul**.
- [ ] Self-approve tetep jalan (Agenia approve request PG-nya sendiri di L1/L2).
- [ ] `note:"Level <cl> dari <nl>"` → "Level 3 dari 3"; `note` kosong → gak ada baris.
- [ ] Nol string hardcode di Flutter (semua label dari config).

## 12. Asumsi & risiko
- [x] **AKAR ROUND-2:** gate baca vid sheet-baked (Agenia `87544551624342`), bukan vid auth client. Renderer WAJIB akses vid login AUTH client (§4.0) — beda dari `Settings!B1`. Auth server udah tau (l3by bener), pastiin CLIENT juga expose vid itu buat query grant + gate.
- [ ] Wildcard `*-N` = "level N, CC apa pun". Punya `*-N` DAN konkret di level sama → union (dedup).
- [ ] `req.ak` kosong pas `st != pending` → gate cuma relevan buat pending (aman, base filter udah `st◼pending`).
- [ ] Client-side fetch semua `st==pending` tenant → mahal kalau ratusan. Volume kecil OK.
- [ ] Multi-slot 1 approver (Agenia 3 slot) → `sc` bisa panjang; `in` query server-side ≤30 term (aman).

---

**Referensi:** `docs/approval-flow-keyed-dev-spec.md` · `docs/approval-grant-schema-cf-dev-spec.md` · op1Screen ApproveLeave @1050 / ApproveLeaveDetail @1055 · grant live: Agenia `HSD579bu4UX16DJYGxHq`, Dirgahayu `4T43PQJ9zI14bCUDrMQo`.
