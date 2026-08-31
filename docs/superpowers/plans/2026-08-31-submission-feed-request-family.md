# Submission Feed — Fondasi + Request Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Feed "Kiriman Saya" hidup end-to-end untuk request family (Ijin/Sakit/Lembur/Koreksi): submit → head `//submission` muncul di feed status Menunggu → approve/reject → status head berubah.

**Architecture:** Head collection `//submission` (1 doc = 1 kiriman) dirawat config-only: tombol submit dapat blok `◆` tambahan di `addToEvent`, tombol keputusan dapat blok `◆` tambahan di `updateEventRow` (merge by `nm`). Feed = LIST_CARD existing (sudah ada versi live dari refactor Riwayat home 2026-08-31 — page 1630/1635) yang di-align ke kontrak spec. `//event` tidak disentuh.

**Tech Stack:** Google Sheets proxy `18v3w5YJ…` (tab op1Screen, Widget, auzSettings, Settings), MCP `gsheets`, DSL addToEvent/updateEventRow keyed.

**Spec:** `docs/superpowers/specs/2026-08-31-my-submissions-head-collection-design.md`

## Global Constraints

- Workspace prefix payload: `84214220504259`; `tablevid◼20342033315492`; retention `r◼4320`.
- Identitas: `cv◼"&Settings!$B$1&"` `cn◼"&Settings!$B$2&"` — SELALU formula ref, HARAM token `{userVid}` dan HARAM literal VID (kecuali test).
- CC: `av◼"&'op1'!$K$8&"` `an◼"&'op1'!$L$8&"`.
- Status kanonik (spec §4): `waiting` / `processing` / `approved` / `done` / `rejected` — machine-key di doc, label via `statusLabels` di widget config.
- op1Screen col D = FORMULA (VLOOKUP+SUBSTITUTE / ref), col A/G+ = param — JANGAN tulis JSON literal di D (konvensi Widget tab: nama=I, resolved=G, template=J).
- Route di config WAJIB dynamic-cell (`=""&$B$120&"…"` style) — template dicopy antar tenant.
- Tiap habis write sheet: read-back verifikasi live (pelajaran: agent pernah wipe & lapor sukses), lalu laporkan tabel `Sheet!Cell → isi` ke user.
- Sheet bisa diedit user antar giliran — SELALU re-read cell sebelum nulis.

---

### Task 0: Baca state live (read-only, nol tulis)

**Files:**
- Read (MCP gsheets, spreadsheet proxy op1Screen/…): `op1Screen!A180:V200` (Home hasil refactor Riwayat), `op1Screen!A1625:V1645` (page Lihat Semua 1630/1635), `op1Screen!V140:V150` (V146/147 ref grp+cv), `auzSettings!I28:J50` (registry table J31-48)
- Create: `docs/superpowers/plans/task0-live-state-notes.md` (catatan kerja, commit)

**Interfaces:**
- Produces: catatan berisi (a) format path `//submission` yang SUDAH dipakai card Riwayat (mirror ini, jangan ngarang format baru), (b) row page feed "Lihat Semua submission" + isi D/param-nya, (c) format segmen `statusLabels` dari LIST_CARD live mana pun, (d) row 4 form request + row tombol approval (langkah cari di Step 3), (e) baris auzSettings kosong berikutnya kalau `//submission` belum teregistrasi.

- [ ] **Step 1: Baca 4 range di atas** via `mcp__gsheets__get_sheet_data`. Kalau range meleset (sheet berubah), scan `op1Screen!B:B` cari teks `Riwayat`/`submission`.

- [ ] **Step 2: Ekstrak konvensi `//submission`** — dari config LIST_CARD Riwayat: path lengkap table (`…//submission`), ada/tidaknya `fc◼submission`, bentuk filter `cv`. Catat VERBATIM.

- [ ] **Step 3: Temukan row 4 form request + tombol approval.** Scan `op1Screen!B:B` (nama page) cari: `Ijin`, `Sakit`, `Lembur`, `Koreksi`, `Approve`. Untuk tiap page: catat row header, cell param yang MEMEGANG string `addToEvent` (form) / `updateEventRow` (approval) — telusuri dari D formula → kolom G+ param.

- [ ] **Step 4: Cek `auzSettings!J31-50`** — `//submission` udah teregistrasi (mungkin oleh sesi Riwayat)? Kalau belum, catat baris J kosong berikutnya.

- [ ] **Step 5: Tulis catatan + commit**

```bash
git add docs/superpowers/plans/task0-live-state-notes.md
git commit -m "docs(submission-feed): task0 live state notes"
```

### Task 1: Uji `◆` lintas-tabel (sandbox, 1 tombol test)

**Files:**
- Modify: 1 cell param tombol test di page `$test` env (row dari Task 0; kalau gak ada page test, pakai copy tombol di tab Copy)

**Interfaces:**
- Consumes: konvensi path Task 0.
- Produces: bukti `addToEvent` 2 blok `◆` beda tabel = 2 doc; `updateEventRow` 2 blok `◆` beda tabel = 2 merge. GO/NO-GO buat Task 3-4.

- [ ] **Step 1: Tulis tombol test** — addToEvent 2 blok: blok 1 → `…//event` `ty◼submission-canary`, blok 2 → `…//submission` profil penuh §3 spec dengan `nm◼CANARY-001`, `st◼waiting`, `ttl◼Canary Test`.

- [ ] **Step 2: Read-back cell** — pastikan string utuh (escape `⭘` benar, gotcha `⶘≠⭘`).

- [ ] **Step 3: USER ACTION — submit dari app**, lalu cek: doc `CANARY-001` muncul di feed Riwayat home? (feed = bukti doc kebentuk).

- [ ] **Step 4: Ulangi untuk updateEventRow** — tombol test kedua: blok 1 merge `//request` doc dummy, blok 2 merge `//submission⭘search◼nm★CANARY-001⭘st◼approved`. USER ACTION submit → feed harus nunjukin Canary jadi Disetujui.

- [ ] **Step 5: Catat hasil di task0-notes + commit.** Kalau NO-GO → STOP, tulis butir dev ask di spec §8, lapor user.

### Task 2: Align feed page ke kontrak spec

**Files:**
- Modify: param row page feed (row dari Task 0, ~1635) — `statusLabels`, map `ty`→label+icon, sort, route detail

**Interfaces:**
- Consumes: format segmen statusLabels live (Task 0c).
- Produces: feed nampilin `ty` sebagai label manusia + status 3 warna; kontrak buat semua penulis berikutnya.

- [ ] **Step 1: Re-read row feed page** (user bisa aja udah ngedit).

- [ ] **Step 2: Tulis `statusLabels`** (ikuti format segmen live persis; isi semantik): `waiting→Menunggu (warn)`, `processing→Sedang diproses (warn)`, `approved→Disetujui (ok)`, `done→Selesai (ok)`, `rejected→Ditolak (danger)`.

- [ ] **Step 3: Tulis map `ty`** (segmen ◆ di param `text`/sejenis, BUKAN hardcode): `request-leave◼Ijin Cuti★request-sick◼Ijin Sakit★request-overtime◼Lembur★attendance-correction◼Koreksi Absen★complaint◼Komplain★report-incident◼Laporan Kejadian★report-patrol◼Laporan Patroli`.

- [ ] **Step 4: Route detail (spec §8.4)** — cek `route`/`routeParams` feed sekarang: bisa conditional per `ty`? Coba pola token `route◼{ty-route}`/routeParams per row. Kalau TIDAK bisa: biarin route existing (perilaku Riwayat), catat sebagai butir dev bundle (fallback DETAIL_CARD universal), JANGAN paksa.

- [ ] **Step 5: Read-back + USER ACTION buka feed di app** — Canary Task 1 harus tampil rapi (label+warna). Lapor tabel cell→isi.

### Task 3: Dual-write submit — 4 form request

**Files:**
- Modify: 4 cell param `addToEvent` (Ijin / Sakit / Lembur / Koreksi Absen — cell dari Task 0 Step 3)

**Interfaces:**
- Consumes: GO Task 1; konvensi path Task 0; `nm` = ref autoNumber yang SAMA dgn yang dipakai blok `//request` existing di cell itu (copy token-nya persis, mis. `◁17▷`).
- Produces: tiap submit bikin head `//submission` `st◼waiting`.

- [ ] **Step 1: Re-read cell param form Ijin.** Salin string existing ke catatan (backup rollback).

- [ ] **Step 2: Append blok** (satu baris, nyambung di ekor string existing; `ty`/`ttl` per form — Ijin: `request-leave`/`Ijin Cuti`, Sakit: `request-sick`/`Ijin Sakit`, Lembur: `request-overtime`/`Lembur`, Koreksi: `attendance-correction`/`Koreksi Absen`):

```
◆84214220504259//submission⭘r◼4320⭘tablevid◼20342033315492⭘fc◼submission⭘ty◼request-leave⭘nm◼<token nomor SAMA dgn blok existing>⭘ttl◼Ijin Cuti⭘st◼waiting⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘av◼"&'op1'!$K$8&"⭘an◼"&'op1'!$L$8&"⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```

- [ ] **Step 3: Read-back cell + cek D formula page masih ngerakit** (E snapshot kolom page gak error).

- [ ] **Step 4: Ulangi Step 1-3 untuk Sakit, Lembur, Koreksi.**

- [ ] **Step 5: USER ACTION — submit 1 ijin beneran dari app** → muncul di feed `Menunggu`. Lapor tabel cell→isi.

### Task 4: Dual-write keputusan — tombol approve/reject

**Files:**
- Modify: cell param `updateEventRow` tombol Approve + Reject (cell dari Task 0 Step 3; termasuk ApproveLeave@1052 kalau masih dipakai)

**Interfaces:**
- Consumes: GO Task 1 Step 4; `{nm}` token row-resolve existing di tombol itu.
- Produces: keputusan FINAL ubah head: approve→`approved`, reject→`rejected`. Approval non-final (L1 dari multi-level): JANGAN sentuh `//submission` (spec §5).

- [ ] **Step 1: Re-read cell tombol Approve final.** Backup string.

- [ ] **Step 2: Append blok**:

```
◆84214220504259//submission⭘tablevid◼20342033315492⭘search◼nm★{nm}⭘st◼approved
```

Reject: sama, `st◼rejected`.

- [ ] **Step 3: Identifikasi tombol level non-final** (dari flow approval keyed cost-center) — pastikan TIDAK dapat blok. Catat mana yang final per flow di task0-notes.

- [ ] **Step 4: Read-back semua cell.**

- [ ] **Step 5: USER ACTION — approve ijin test Task 3** → feed berubah `Disetujui` tanpa nambah baris. Reject 1 lagi → `Ditolak`. Lapor tabel cell→isi.

### Task 5: Tutup putaran — spec, memory, cleanup canary

**Files:**
- Modify: `docs/superpowers/specs/2026-08-31-my-submissions-head-collection-design.md` (§8 hasil verifikasi, status request family LIVE), memory `project_my_submissions_taxonomy.md`
- Modify: hapus 2 tombol test canary Task 1 dari sheet (doc canary biarin — retention yang hapus; sekalian bukti ⬜ retention §7.2)

**Interfaces:**
- Consumes: hasil QA Task 3-4.
- Produces: entry point plan berikutnya (incident refactor) + tanggal cek retention canary (submit + 3 hari).

- [ ] **Step 1: Hapus tombol canary** (re-read dulu, hapus blok yang gua tambah aja), read-back.

- [ ] **Step 2: Update spec** — §8.3 ✅/❌ hasil test `◆`; §7b tandai request family LIVE + tanggal; catat tanggal cek retention (H+3 dari canary).

- [ ] **Step 3: Update memory** file taxonomy (status LIVE, next = incident refactor plan).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-31-my-submissions-head-collection-design.md docs/superpowers/plans/task0-live-state-notes.md
git commit -m "docs(submission-feed): request family live, verification results"
```

---

## Di luar plan ini (plan berikutnya)

- Refactor incident positional→keyed + dual-write (spec §7.1) — plan sendiri, pakai temuan Task 1.
- Refactor complaint (7 page @989-1071) — plan sendiri.
- Patrol masuk feed `st◼done`.
- Dev-spec bundel `docs/submission-feed-dev-spec.md` — cuma kalau ada NO-GO di Task 1 / route per-`ty` gagal.
