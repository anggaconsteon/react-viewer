# Submission Feed — Fondasi + Request Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **REV 2 (2026-08-31 sore):** direvisi total setelah Task 0 recon (lihat `task0-live-state-notes.md` — WAJIB dibaca implementer). Task 1 canary buttons dibatalkan → staged rollout (Ijin = canary). Konstanta dikoreksi ke nilai LIVE.

**Goal:** Feed "Kiriman Saya" hidup end-to-end untuk 5 form request (Ijin/Sakit/Lembur/Koreksi/Cuti): submit → head `//submission` muncul di feed `waiting` → approve/reject → head jadi `processing`/`rejected` (final `approved` nyusul via CF, masuk dev-ask).

**Architecture:** Head collection `//submission` (1 doc = 1 kiriman) dirawat config-only: tombol submit dapat blok `◆` tambahan di `addToEvent`, tombol keputusan dapat blok `◆` tambahan di `updateEventRow` (merge by `nm`). Feed page + card Home SUDAH LIVE (`op1Screen!1635-1637`, `!190`) dari refactor Riwayat — plan ini melengkapi penulisnya. `//event` tidak disentuh.

**Tech Stack:** Google Spreadsheet proxy `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` (`Salinan dari agenia demo-7 | Proxy`), MCP `gsheets`, DSL addToEvent/updateEventRow keyed.

**Spec:** `docs/superpowers/specs/2026-08-31-my-submissions-head-collection-design.md`
**Recon (WAJIB baca sebelum task apapun):** `docs/superpowers/plans/task0-live-state-notes.md`

## Global Constraints

- Tab form/approval bernama **`op1Screen Incident, Request dan Approval`** (SATU tab, ada koma di nama — di formula wajib kutip tunggal; di MCP pakai nama persis).
- Registry table: `auzSettings!J71` = `84214220504259//submission` (didaftarkan Task 1). SEMUA blok `◆` baru mulai `=""&auzSettings!$J$71&"…` — JANGAN literal path.
- Identitas: `cv◼"&Settings!$B$1&"` `cn◼"&Settings!$B$2&"`. HARAM token `{userVid}`, HARAM literal VID.
- CC: `av◼"&'op1'!$K$7&"` `an◼"&'op1'!$L$7&"`; site: `sv◼"&'op1'!$K$8&"` `sn◼"&'op1'!$L$8&"` (K7=CC, K8=site — kebalikan dari draft plan lama; ikuti LIVE).
- Timezone: `T"&System!$B$3&"` — JANGAN hardcode `T7`.
- Status: blok `//request` TETAP `st◼pending` (jangan diubah); blok `//submission`: submit=`waiting`, approve=`processing`, reject=`rejected`. Key badge di widget = `badgeMap` (BUKAN `statusLabels`), separator `⭘`.
- `ty` di `//submission` = nilai `rty` LIVE verbatim: `request-day-off` (Ijin), `request-sick-leave` (Sakit), `request-overtime` (Lembur), `request-attendance` (Koreksi), `request-leave` (Cuti).
- **Param cell = FORMULA.** Sebelum edit: baca `include_grid_data: true` → `userEnteredValue.formulaValue` → edit → tulis balik sebagai FORMULA. Nulis nilai resolved = bake identitas = GAGAL.
- Tiap habis write: read-back grid verifikasi live, laporkan tabel `Sheet!Cell → isi`.
- Sheet bisa diedit user antar giliran — SELALU re-read cell sebelum nulis.

---

### Task 0: Baca state live — ✅ SELESAI (commit 3fd7f8c + fix round)

Output: `docs/superpowers/plans/task0-live-state-notes.md`. Tidak diulang.

### Task 1: Registry + align feed page

**Files (sheet):**
- Write: `auzSettings!J71` ← formula `="84214220504259//submission"` (mirror gaya J31-70; cek dulu J71 masih kosong)
- Write: `op1Screen!H190`, `op1Screen!H1637`, `op1Screen Driver!H957` ← `=""&auzSettings!$J$71` (flip dari hardcode; H957 VERIFIKASI dulu isinya memang hardcode path yang sama — kalau beda, jangan sentuh, lapor)
- Verify-only: `op1Screen!T190`/`T1637` badgeMap (harusnya sudah `waiting◼Menunggu◼warn⭘processing◼Diproses◼info⭘approved◼Disetujui◼ok⭘done◼Selesai◼ok⭘rejected◼Ditolak◼danger` — kalau sudah, JANGAN tulis)
- Skip sadar: `Y1637`/`Z1637` route/routeParams detail — DITUNDA (route per-`ty` belum ada page detail universal; catat sebagai dev-bundle item, jangan isi asal)

**Interfaces:**
- Produces: ref `auzSettings!$J$71` yang dipakai semua blok Task 2-4.

- [ ] **Step 1:** Read-back `auzSettings!I71:J71` (grid) — pastikan kosong. Tulis J71.
- [ ] **Step 2:** Read grid `H190`/`H1637`/`Driver!H957` → konfirmasi formula sekarang `="84214220504259//submission"` → flip ke `=""&auzSettings!$J$71`. Read-back: resolved value HARUS tetap `84214220504259//submission` persis.
- [ ] **Step 3:** Verify badgeMap T190/T1637 (read-only).
- [ ] **Step 4:** Lapor tabel cell→isi.

### Task 2: Canary — dual-write form IJIN saja

**Files (sheet):**
- Modify: `'op1Screen Incident, Request dan Approval'!L383` (addToEvent tombol kirim Ijin)

**Interfaces:**
- Consumes: formula L383 existing (verbatim di recon d.1) + ref J71 Task 1.
- Produces: pola blok `◆` submission yang di-copy Task 3.

- [ ] **Step 1:** Read grid L383, cocokkan dengan recon d.1 (kalau beda = user udah edit, re-baca dan sesuaikan).
- [ ] **Step 2:** Append di DALAM formula (sebelum kutip penutup terakhir), blok:

```
◆"&auzSettings!$J$71&"⭘r◼4320⭘fc◼submission⭘ty◼request-day-off⭘nm◼◁17▷⭘ttl◼Ijin⭘st◼waiting⭘d◼◁10▷⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘av◼"&'op1'!$K$7&"⭘an◼"&'op1'!$L$7&"⭘sv◼"&'op1'!$K$8&"⭘sn◼"&'op1'!$L$8&"⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶
```

(Formula final = formula lama dengan `…HH:mm:ss▶"` diganti `…HH:mm:ss▶◆"&auzSettings!$J$71&"⭘…▶"` — blok baru pakai token `nm◼◁17▷` dan `d◼◁10▷` yang SAMA dengan blok //request-nya.)

- [ ] **Step 3:** Read-back grid: formulaValue utuh + resolved value mengandung `◆84214220504259//submission⭘…⭘cv◼87544551624342` (VID = hasil ref, bukan literal yang kita tulis).
- [ ] **Step 4:** Lapor tabel cell→isi. **PAUSE → USER TEST 1:** user submit Ijin dari app → item "Ijin / Menunggu" muncul di feed Riwayat. GO/NO-GO Task 3-4.

### Task 3: Dual-write 4 form sisanya

**Files (sheet):**
- Modify: `…!L402` (Sakit), `…!L421` (Lembur), `…!L440` (Koreksi), `…!L456` (Cuti) — tab `op1Screen Incident, Request dan Approval`

**Interfaces:**
- Consumes: pola blok Task 2; formula existing per recon d.2-d.5.
- Produces: semua submit request nulis head `waiting`.

- [ ] **Step 1:** Per cell: read grid → append blok yang SAMA dengan Task 2, beda 2 nilai: `ty` + `ttl` — Sakit: `request-sick-leave`/`Ijin Sakit`; Lembur: `request-overtime`/`Lembur`; Koreksi: `request-attendance`/`Koreksi Absensi`; Cuti: `request-leave`/`Cuti`. Token `nm◼◁17▷` dan `d◼◁10▷` sama di semua form (recon konfirmasi).
- [ ] **Step 2:** Read-back grid semua 4 cell.
- [ ] **Step 3:** Lapor tabel cell→isi.

### Task 4: Tombol keputusan — processing / rejected

**Files (sheet), tab `op1Screen Incident, Request dan Approval`:**
- Modify: `P471` (Setujui antrian), `Q471` (Tolak antrian), `L476` (Setujui detail), `R477` (Tolak detail) — semua `updateEventRow`

**Interfaces:**
- Consumes: formula existing per recon d.6/d.7 + fix-round notes (P471/Q471 formulaValue).
- Produces: approve → head `processing`; reject → head `rejected`. (`approved` final = CF, dev-ask, DILUAR plan ini.)

- [ ] **Step 1:** Read grid 4 cell. P471/Q471: pakai formulaValue dari fix-round recon; kalau ternyata literal (bukan formula), tulis balik sebagai FORMULA versi ref (J59 + Settings B1/B2) + blok baru — jangan lestarikan bake.
- [ ] **Step 2:** Append blok — Setujui (P471, L476):

```
◆"&auzSettings!$J$71&"⭘search◼nm★{nm}⭘st◼processing
```

Tolak (Q471, R477):

```
◆"&auzSettings!$J$71&"⭘search◼nm★{nm}⭘st◼rejected
```

- [ ] **Step 3:** Read-back grid 4 cell; resolved harus `…dvbn◼<nama>◆84214220504259//submission⭘search◼nm★{nm}⭘st◼…`.
- [ ] **Step 4:** Lapor tabel cell→isi. **PAUSE → USER TEST 2:** approve Ijin canary → feed "Diproses"; reject 1 request → "Ditolak"; TIDAK ada baris dobel. Sekalian verifikasi f-11 (navigasi approval — route `ApproveLeave*` vs page `Approval*`).

### Task 5: Closeout

**Files (repo):**
- Modify: spec §4 (kamus ty → nilai live), §5 (approve=processing interim + CF ask), §8 (hasil verifikasi), §7b (request family LIVE)
- Modify: memory `project_my_submissions_taxonomy.md`
- Create: draft butir dev-ask bundel (di spec §8 aja, belum jadi dev-spec file): (1) CF approval merge `//submission.st◼approved` saat `cl==nl` (+`rejected` guard), (2) route per-`ty` / DETAIL_CARD universal buat tap card feed, (3) pre-existing: f-11 nav mismatch, f-12 detail-approve gak nulis event, f-13 `nm` dobel di T471/U471.

**Interfaces:** — (dokumentasi)

- [ ] **Step 1:** Update spec + memory sesuai hasil USER TEST 1-2.
- [ ] **Step 2:** Commit docs.

---

## Di luar plan ini

- CF merge `//submission.st◼approved` (dev-ask, bundel).
- Refactor incident positional→keyed + complaint (plan berikutnya; PERHATIAN: lokasi page beda dari spec lama — lihat recon f-10; incident DOBEL di 2 tab).
- Patrol masuk feed `st◼done`.
- `//submission` buat non-request (complaint dst) nyusul di plan refactor masing-masing.
