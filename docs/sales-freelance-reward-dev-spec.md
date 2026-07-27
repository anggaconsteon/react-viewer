# REWARD POSTING — bukti posting IG harian freelance + RULES ENGINE validasi generik (Dev Spec)

**Tanggal:** 2026-07-24 (rev 2 — rules engine, hasil brainstorming user 2026-07-24)
**Buat:** campur — dev Go (CF: engine + case) · builder op1Screen (pages, reuse) · dev Flutter (kecil: 2 item)
**Status:** DESIGN APPROVED (brainstorming 2026-07-24) — beberapa aturan produk nunggu product development, lihat §OPEN
**Konteks / Konsumen pertama:** client freelance sales ±1.800 worker (mockup `src/component/SalesFreelanceV1.jsx`, 3 layar Worker/Admin Review/Payout). Build di proxy demo dulu (tenant `84214220504259`, vidtable `20342033315492`).
**Referensi:** mockup SalesFreelanceV1.jsx · `docs/group-picker-widget-dev-spec.md` · workflow btn library (Widget 283-289) · dict book.

---

## 1. Kenapa

Client bayar ±1.800 freelancer buat repost konten promosi di IG masing-masing, 1 post per hari. Sekarang tracking manual. Keputusan user (2026-07-24, terkunci):

- **Konten TIDAK lewat app** — admin siapkan ±30 gambar/bulan, disebar **via WA**. App murni: worker kirim bukti, admin ngetrack.
- **Kuota hitung DINAMIS** — jangan patok harian; per jam / hari / bulan = parameter (`limit:N:period`), case reward pakai `limit:1:day`.
- **Validasi = RULES ENGINE generik, bukan kode per case.** Case lain tinggal bawa field rules yang sama. Validator dibangun SEKARANG sekalian (sample/burst/duplicate/link) biar tinggal di-ON-kan; `ai` slot terdaftar nyusul. Launch: screening konten OFF (auto-approve), cuma kuota yang jalan.
- **Approval konten 1 step**; payout = gerbang manusia terpisah (transfer manual di luar app, "Tandai Lunas" bulk).
- **10 approved = 1 batch** reward; tarif per batch = config per tenant.

## 2. Konsep

```
worker posting IG (di luar app, gambar dari WA)
   │
   ▼ submit bukti: screenshot WAJIB + link opsional
[post_claim doc, st:pending, rl:"<rules dari sheet>"]
   │
   ▼ CF: validate.Run(doc, rl)   ← ENGINE generik internal/validate
   ├─ verdict extra    → st:extra (kuota bucket penuh, gak dihitung)
   ├─ verdict review   → st:review + fl:<rule>  → antrian admin → approve/reject+alasan
   └─ verdict pass     → st:approved (auto)
   │
   ▼ CF case: recompute reward_cache → ap++, bt = floor(ap/10) − pdt
   │
   ▼ akhir bulan: admin Payout → multi-select worker → transfer manual → "Tandai Lunas"
```

**Batas tanggung jawab:** engine = saringan + kuota (verdict doang). Logika case — batch math, payout, cache — domain `post_claim`, di LUAR engine. Case lain pakai engine tanpa kebawa logika reward.

## 3. RULES ENGINE — `internal/validate` (Go, reusable lintas case)

### 3.1 Kontrak

`Run(doc, rl string) → verdict{pass | review(rule) | extra}`

**Format `rl`** — string **pipe-split `|`**, param `:` (`◼` dan `◆` DUA-DUANYA haram di value addToEvent):
```
rl◼limit:1:day|burst:10|sample:5
```

> ⚠ **REV 2026-07-27 (bug live, test-confirmed): separator rules GANTI `◆` → `|`.** Parser addToEvent di app split `◆` SEBELUM parse pair `⭘` — nilai rl ber-◆ kepotong di ◆ pertama DAN semua pair setelahnya (cv/cn/t/ts) IKUT KEBUANG → doc cacat stuck pending (bukti: doc `sonjam8lJEMkyMfXVt1R`). `|` dipilih (bukan koma) karena konsisten precedent platform "list dalam 1 field": `wl` payout `|`-join, output groupPicker/payoutList `joinSep:"|"`. **DELTA DEV CF: `parseRules` split `|` (bukan `◆`)** — sisanya nol perubahan. Nilai 1-rule tanpa separator (mis. `limit:10:day`) kebukti lewat bersih.

**Semantik (terkunci user 2026-07-24, rev: default-kosong):**
1. `rl` = **saklar tunggal**. Engine jalanin PERSIS yang tertulis di event — semua rule ditulis → jalanin semua; cuma `link` → link doang. **Engine sendiri nol default.**
2. `rl` kosong/absen → **case adapter nyuplai default-nya** (post_claim: `limit:1:day`) — jadi cell sheet boleh dibiarin KOSONG, kuota tetap jalan, screening nol. Default = milik case (1 konstanta di adapter), engine tetap generik.
   ⚠ **`rl` TERISI = override TOTAL** — yang jalan cuma yang tertulis. Nyalain sample nanti = tulis `limit:1:day|sample:5`; nulis `sample:5` doang justru MATIIN kuota.
3. Eksekusi **berurutan sesuai tulisan**; kena 1 → berhenti (`review` + `fl:<rule>`, atau `extra` untuk limit). Konvensi: tulis `limit` paling depan (murah + nentuin extra duluan).
4. Rule **belum ada di katalog** (mis. `ai` sebelum landing) → **skip + WARN log**, lanjut rule berikutnya. Nulis duluan di sheet = aman.
5. Aksi kena rule v1 = `review`. **Syntax reserve** `rule:param:action` (mis. `burst:10:reject`) buat eskalasi nanti — keputusan user: burst launch = flag→review, eskalasi tinggal ganti cell.

### 3.2 Katalog v1

| rule | param | cek | verdict kena | status |
|---|---|---|---|---|
| `limit` | `:N:period` (`hour`\|`day`\|`month`; +`minute`\|`second` TESTING-ONLY, PROPOSED — `docs/limit-period-testing-cf-dev-spec.md`) | kuota N per bucket per worker. Bucket key `bk` dari `t`+TZ: `2026072414`/`20260724`/`202607`. Udah ada approved di bucket → **extra**; ada pending/review → yang lama `superseded` (ganti bukti), yang baru dinilai | `extra` | BUILD |
| `sample` | `:5` = % | undian acak | `review` | BUILD |
| `burst` | `:10` = menit | submit < N menit dari submit terakhir cv sama | `review` | BUILD |
| `duplicate` | — | hash foto == submission lama **cv sama** (per-worker — semua orang posting gambar sama, antar-worker emang mirip) | `review` | BUILD ([VERIFY] akses hash file storage) |
| `link` | reserve `:req` | link **udah pernah dipakai SIAPA PUN** (global — link IG unik per post; klaim link orang lain = fraud). Normalisasi dulu: strip query-string/trailing-slash/scheme. Link kosong → skip (opsional; `:req` nanti = wajib+unik) | `review` | BUILD |
| `ai` | — | cek gambar via AI | `review` | SLOT terdaftar, implementasi nyusul |

### 3.3 Sheet side (saklar)

`rl` = **1 helper cell** di tombol submit: `⭘rl◼"&<cell>&"`. Ganti aturan = edit cell, berlaku submit berikutnya, **nol deploy**. Tiap doc kerekam `rl`-nya → audit "doc ini dulu disaring pakai aturan apa".

**Blok identitas WAJIB (rev user 2026-07-27) — SEMUA addToEvent reward bawa lengkap:** `⭘cv◼Settings!B1⭘cn◼Settings!B2⭘av◼'op1'!K7⭘an◼'op1'!L7⭘sv◼'op1'!K7⭘sn◼'op1'!L7` (pola broadcast; av/an=cost center, sv/sn=site per dict addToEvent). Terpasang di L1011 (submit) + L1029 (payout).

**Launch state case reward:** cell **KOSONG** → default case `limit:1:day` jalan (screening konten OFF = "auto-approve semua", kuota tetap hidup). Isi cell = ambil alih total (lihat ⚠ §3.1.2).

## 4. Data

### 4.1 Collection baru `post_claim` (append-only, auto-id, via addToEvent)

`84214220504259//post_claim`

| field | isi | catatan |
|---|---|---|
| `cv`/`cn` | worker vid/nama | standar |
| `hn` | handle IG terdaftar | denorm saat submit — sumber: §OPEN registrasi |
| `pl` | link post (opsional) | CF simpan versi normalized (buat cek `link` global) |
| `i` | screenshot bukti (foto) | field evidence existing "seperti sebelumnya" (user 2026-07-24) — mekanisme savesend standar |
| `rl` | rules yang dibawa submit | audit + input engine |
| `st` | `pending` → `approved`\|`review` → (`rejected`) · `extra` · `superseded` | CF transisi |
| `fl` | nama rule yang kena (`sample`/`burst`/`duplicate`/`link`/`ai`) | vocab == katalog, nol mapping kedua |
| `rr` | alasan reject | dari tombol reject (note) |
| `bk` | bucket key (ex-`dy`) | CF stamp dari `t` + TZ `System!B3`, format sesuai period `limit` |
| `ck` | **claim key = `{cv}-{t}`** (BARU 2026-07-24, builder) | **CF stamp saat create (pola `lk`)** — doc auto-id gak bisa di-address widget; dipakai routeParams A1→A2 (`ck◼{ck}`), search A2, dan updateEventRow tombol approve/reject (`search◼ck★{ck}`). ✅ DELTA DONE 2026-07-24: `postclaim.ClaimKey` stamp saat create (deterministik → replay restamp nilai sama; t absen → WARN + ck gak distamp). Terdaftar di dict tab post_claim row 13 |
| `t`/`ts` | epoch + formatted | standar |

### 4.2 Cache `reward_cache` (CF-derived, doc-id = `cv`)

| field | isi |
|---|---|
| `cv`/`cn`/`hn` | identitas (denorm) |
| `ap` | total approved ke-count |
| `bt` | batch siap = `floor(ap/10) − pdt` |
| `pdt` | batch dibayar total |
| `pnd` | pending+review milik dia (stat "Menunggu") |
| `rd` | `1` kalau `bt>0` — flag buat search DSL (eq-only) |

### 4.3 Config per tenant (yang BUKAN rules)

| key | isi |
|---|---|
| tarif per batch | rupiah — riil nunggu client |
| batch size | 10 (terkunci; config biar aman) |

(sample rate / burst threshold / period = param di `rl`, bukan config terpisah.)

## 4b. Pipeline CF (case `post_claim`)

Router wildcard existing (`onTenantWrite`), **case baru** — pola location/fate: 1 case, bukan fn baru.

- **CREATE**: `validate.Run(doc, rl)` — engine yang derive + stamp `bk` (format ikut period rule `limit`; tanpa `limit` → `bk` kosong) → set `st` (+`fl`) sesuai verdict (extra/review/approved; superseded di-handle rule limit) → approved? recompute cache.
- **UPDATE** (tombol admin): `review→approved` / `review→rejected`+`rr` → recompute. Rejected → worker submit ulang (CREATE baru, yang lama di-supersede rule limit).
- **EVENT `ty◼reward-payout`** (`wl` = list cv `|`-join): per cv `pdt += bt`, `bt=0`, `rd=0` — idempotent (pola claimPush `pushProcessed`).
- recompute idempotent: `ap` = count approved per (cv,bk) unik.

**Mismatch handle: TIDAK otomatis** (scraping IG gak realistis) — layar review tampilkan `hn` vs link, admin eyeball. = perilaku mockup.

**Skala:** 1.800 submit/hari kecil; cek `link` = 1 equality query (`pl` normalized), `limit` = 1 query bucket — aman.

## 5. Pages op1Screen (builder) — reuse-first

Ikut skill `op1screen-genericize-widget`, semua generic+SUBSTITUTE.

### W1 RewardHome (worker)
| Elemen | Widget | Status |
|---|---|---|
| Header | `workspaceHeader`/`text` | reuse |
| 3 stat (Approved/Batch siap/Menunggu) | `DETAIL_CARD` keyed `reward_cache` `cv◼{userVid}` rows `Approved◼<ap>★Batch siap◼<bt>★Menunggu◼<pnd>` | reuse (KV rows, bukan 3 kartu — kompromi sadar; widget stat-row = deferred) |
| Callout batch siap | `noticeBar` | reuse |
| Foto **galeri** + link + submit | foto evidence + `TXF` + RBT savesend addToEvent `post_claim` (`st◼pending`, `hn`, `pl◼◁N▷`, `rl◼<cell>`) | ⚠ galeri = dev Flutter §7 |
| Riwayat | `LIST_CARD` `cv◼{userVid}` sort `t desc`, badgeField `st` badgeMap 5 status, subtitle `<rr>` | reuse |

### A1 ReviewQueue (admin)
`LIST_CARD` search `st◼review` sort `t asc`, badgeField `fl` badgeMap (sample/burst/duplicate/link), route → A2. (Counter auto-approved harian = deferred v2.)

### A2 ReviewDetail (admin)
`DETAIL_CARD` + `images` + rows `Worker◼<cn>★Terdaftar◼<hn>★Link◼<pl>★Flag◼<fl>★Waktu◼<ts>` + `workflowEventBtn`@288 (Approve → `st◼approved`) + `workflowEventNoteBtn`@289 (Reject+note → `st◼rejected`+`rr`). 1 tombol = 1 row.

### A3 Payout (admin)
`GROUP_PICKER`@302 `src:"table"` 1 group `selector:"none"` multi — table `reward_cache` search `rd◼1`, labelField `cn`, subField `hn`, valueField `cv` → RBT savesend `ty◼reward-payout` + `wl◼◁N▷` + konfirmasi ([VERIFY] `submitConfirmSheet`@222, fallback chain DO_DIALOG). Nominal per worker TIDAK tampil v1 (kompromi sadar; `PAYOUT_LIST` = deferred). Log lunas = `LIST_CARD` event `ty◼reward-payout`.

## 7. Deliverable dev

**dev Go (CF):**
1. **Package `internal/validate`** — katalog §3.2 (limit/sample/burst/duplicate/link + slot ai), parser `rl`, semantik §3.1. Tests: rl kosong→pass, unknown rule skip+WARN, urutan eksekusi, limit bucket hour/day/month + supersede + extra, burst delta, link normalisasi+global, sample injectable-random.
2. Case `post_claim` di router (§4b) + config §4.3. Tests: supersede→count tetap 1, batch math, payout idempotent, recompute idempotent.

**dev Flutter (SPEC TERPISAH 2026-07-24, kirim sebagai 1 paket):**
1. **GET_IMAGES `source:"gallery"`** — `docs/getimages-gallery-source-dev-spec.md`. WAJIB (screenshot dari galeri, gak ada gantinya). Builder: Widget row variant `getImagesGallery` + swap B1009 setelah live.
2. **`STAT_CARD_ROW`** (type BARU) — `docs/stat-card-row-widget-dev-spec.md`. DETAIL_CARD buat stat = aneh di device (test user 2026-07-24). Builder: row `statCardRow` + swap @1007 setelah live.
3. **`PAYOUT_LIST`** — `docs/payout-list-widget-dev-spec.md`. **APPROVED masuk paket** (user 2026-07-24; `selectAll` = parameter on/off). GROUP_PICKER src:table = interim sampai live, lalu builder swap @1028.
4. ~~fix split src:"doc"~~ SELESAI (user confirm 2026-07-24) — broadcast picker jalan.

**builder op1Screen: ✅ 4 PAGE BUILT 2026-07-24** (config-ahead, data nunggu CF deploy): `RewardHome@1005` (workspaceHeader + DETAIL_CARD stat + noticeBar + getImages1 pos6 + textField pos10 + submit + LIST_CARD riwayat), `RewardReview@1014`, `RewardReviewDetail@1019` (DETAIL_CARD images:i + workflowEventBtn/NoteBtn gate `st◼review`), `RewardPayout@1026` (GROUP_PICKER src:table `rd◼1` + Tandai Lunas + log). Plug 144-147. Registry auzSettings **J57**=post_claim **J58**=reward_cache. Template `groupPicker@302` v3 (+`labelField/subField/valueField` shared, 30 ph; D980 TestBroadcast ikut di-extend, verified). `rl` saklar = **op1Screen!S1011** (kosong = default CF `limit:1:day`). Foto pakai `getImages1` mirror ReportPatrol (folder J22, max 1, pos 6 → `i◼◁6▷`). **Menu/launcher entry BELUM** (AdminHome + worker home). Catatan: `hn` gak dikirim submit (registrasi OPEN) — kolom Terdaftar kosong sampai diputusin.

## 8. Dictionary — ✅ TERDAFTAR 2026-07-24

Dict book `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw`, 3 tab baru:
- **`post_claim`** (schema, 12 field + grup event payout `wl`) — `rd` di reward_cache SENGAJA String "0"/"1" (bug search DSL numeric match 0 row).
- **`reward_cache`** (schema, 8 field).
- **`validation_rules`** (DSL) — field `rl` + 4 baris SEMANTIK (ORDER/UNKNOWN/ACTION/DEFAULT) + katalog 6 rule (limit/sample/burst/duplicate/link BUILD, ai SLOT). Rujukan permanen biar gak bingung.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| `internal/validate` (engine + katalog 5 rule) | dev Go | ✅ BUILT 2026-07-24 (uncommitted, branch event-push; action `:reject` jalan; bucket dari `ts` wall-clock, fallback `t`+env `TENANT_TZ` — BUKAN System!B3, CF gak baca sheet) |
| CF case `post_claim` (+3 route router, ck, rd String, payout marker) | dev Go | ✅ BUILT 2026-07-24 (build+vet+135 test pass; duplicate hash = HTTP GET kalau `i` URL, selain itu skip+WARN — §12 [VERIFY] tetap open) |
| PAYOUT_LIST renderer (spec sendiri) | dev Flutter | PROPOSED |
| GET_IMAGES source:gallery (spec sendiri) | dev Flutter | PROPOSED |
| 4 page op1Screen | builder | NUNGGU CF |
| Implementasi rule `ai` + `link:req` | dev Go | SLOT, nyusul |
| Registrasi handle IG worker | ? | OPEN |

## 10. Not Doing (dan kenapa)

- **Kalender konten / distribusi gambar** — via WA (user 2026-07-24).
- **Transfer uang** — manual di luar app.
- **Scraping/validasi IG otomatis** (handle di link, post beneran ada) — gak realistis; mismatch = eyeball admin.
- **Multi-level approval** — 1 step, terkunci.
- **Cooldown/block tombol di app buat burst** — mahal (renderer baru), bypass-able offline, aturan pindah dari `rl` ke config widget. Burst = flag→review (keputusan user 2026-07-24).
- **Un-approve/clawback pasca-auto-approve** — deferred v2 (window koreksi = sebelum payout bulanan).
- **Widget stat-row + PAYOUT_LIST ber-nominal** — deferred; v1 DETAIL_CARD/GROUP_PICKER.

## OPEN — nunggu product development / client (paralel, gak ngeblok)

- [ ] Hari kelewat hangus atau nyusul? V1 asumsi: hangus (`bk` = bucket waktu submit).
- [ ] Bulan 31 hari — gambar ke-31 atau libur (di luar app; ekspektasi "30/bulan" doang).
- [ ] **Registrasi handle IG** — sumber `hn`. Opsi termurah: field baru `workforce`, diisi admin onboarding.
- [ ] Tarif riil per batch.
- [ ] Salah-gambar-hari — v1 ke-count bucket submit, ketangkep via sampel/review. Cukup?

## 11. Acceptance

- [ ] `rl` kosong → default case jalan (`limit:1:day`): kuota hidup, screening nol.
- [ ] `rl` terisi = override total: `rl◼sample:5` (tanpa limit) → kuota MATI, cuma sample jalan (perilaku sadar, terkonfirmasi user 2026-07-24 — konvensi: rules lain selalu ditulis bareng `limit`).
- [ ] `limit:1:day` (default/tertulis): submit ke-2 hari sama pas ada approved → `extra` (count tetap 1); pas ada pending → lama `superseded`, baru dinilai.
- [ ] `limit:1:hour` / `limit:1:month` → bucket ganti tanpa perubahan kode.
- [ ] Rule ditulis tapi belum ada di katalog (`ai`) → skip + WARN, submission tetap diproses rule lain.
- [ ] `link`: link sama dari worker LAIN → review; link beda cuma query-string → tetap kedetect; tanpa link → skip.
- [ ] `burst:10` → submit < 10 menit → `fl:burst` masuk antrian; `burst:10:reject` → langsung rejected (action syntax).
- [ ] Reject+alasan → worker lihat `rr` di riwayat; submit ulang → bisa approved, count 1.
- [ ] 10 approved → `bt` naik 1; payout N worker → `bt` reset + log; event payout diulang → gak dobel.
- [ ] 1.800 worker: antrian admin ≈ kena-rule doang, bukan semua.
- [ ] Nol string hardcode Flutter.

## 12. Asumsi & risiko

- [ ] Hash foto (rule `duplicate`): CF bisa akses/hash file storage — verify mekanisme evidence.
- [ ] `hn` tersedia saat submit (nunggu registrasi) — tanpa itu kolom "Terdaftar" kosong.
- [ ] GROUP_PICKER renderer baru (bug split src:doc aktif 2026-07-23) — path src:table belum diuji device.
- [ ] Normalisasi link cukup strip scheme/query/trailing-slash — short-link (bit.ly dsb) TIDAK di-expand v1.
- [ ] Urutan rule ditulis sheet-author — salah urutan (limit di belakang) = sample bisa kena duluan sebelum kuota dicek; konvensi limit-duluan didokumentasiin, gak di-enforce.
- [ ] Override-total `rl`: sheet-author lupa nulis `limit` pas nyalain rule lain → kuota mati diam-diam. Mitigasi murah kalau kejadian: CF log WARN saat `rl` terisi tanpa `limit`.

**Referensi:** `src/component/SalesFreelanceV1.jsx` · `docs/group-picker-widget-dev-spec.md` · `docs/list-card-universal-dev-spec.md` + `detail-card-universal` · memory `project_group_picker_broadcast` · `reference_workflow_btn_library`.
