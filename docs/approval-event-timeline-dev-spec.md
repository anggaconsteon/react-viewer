# Approval Event Ledger + Timeline Detail (Dev Spec)

**Tanggal:** 2026-07-29
**Buat:** builder op1Screen (config `addToEvent` di tombol) · dev Flutter (widget timeline)
**Status:** PROPOSED
**Konteks / Konsumen pertama:** detail request approval (`ApproveLeaveDetail` @1055 / `MyRequestDetailLog` @1062) — nampilin **timeline** perjalanan approval. Coll `//event` (activity ledger yg udah ada).
**Referensi:** `docs/approval-flow-keyed-dev-spec.md` · `docs/approve-leave-gating-and-note-dev-spec.md` · dict `addToEvent` + `event_taxonomy` · pola tombol RejectTask (savesend + addToEvent + updateEventRow).

---

## 1. Kenapa

Butuh timeline approval di detail. **NOL CF change** (CF udah beres direview): tombol approve/reject di `ApproveLeaveDetail` udah `savesend` + `updateEventRow` (trigger CF geser level). Tinggal **nambah `addToEvent`→`//event`** di tombol yang SAMA → tiap keputusan nulis 1 row event. Timeline baca `//event` by `ref`. Config murni — pola persis RejectTask (1 tombol bawa `updateEventRow` + `addToEvent` sekaligus).

## 2. Konsep

**App (tombol) nulis event, BUKAN CF.** Tombol approve/reject udah `savesend`:
- `updateEventRow` → `//request` (`dv◼approve/reject` — trigger CF, udah ada).
- **+ `addToEvent` → `//event`** (row timeline — TAMBAHAN).

Timeline detail = query `//event` `ref◼{nm}` sort `t` asc → render kronologis. `l{n}` di doc request TETAP (detailCard ringkas). **"Diajukan" = dari doc request** (`ts`/`cv`/`cn`) yang detail page udah punya — gak perlu event submit.

| aksi | tombol | event ty |
|---|---|---|
| submit | (RequestLeave) | — (timeline ambil dari doc `ts`/`cv`/`cn`) |
| approve | ApproveLeaveDetail ✓ Setujui | `request-approved` (lvl=`{cl}`) |
| reject | ApproveLeaveDetail ✕ Tolak | `request-rejected` (lvl=`{cl}`, `d`=alasan) |

## 3. Kontrak field — row `//event`

Path: `84214220504259//event`. Ditulis via `addToEvent` (keyed). Fields:
| field | isi | wajib |
|---|---|---|
| `r` | retention 4320 | ✓ |
| `nm` | key event = `{reqNm}-L{cl}` (deterministik per level) | ✓ |
| `ty` | `request-approved` / `request-rejected` | ✓ |
| `ref` | request `nm` (link timeline) | ✓ |
| `lvl` | level = `{cl}` | ✓ |
| `cv`/`cn` | approver (= `dvby`/`dvbn`) | ✓ |
| `d` | alasan tolak (reject) / kosong | — |
| `t`/`ts` | `◀2▶` + `◀2\|T7\|…▶` | ✓ |

## 4. Contoh resolved (REQ-2026-000365)

addToEvent tombol **Setujui** (di ApproveLeaveDetail, `{nm}`/`{cl}` dari doc):
```
84214220504259//event⭘r◼4320⭘tablevid◼20342033315492⭘nm◼{nm}-L{cl}⭘ty◼request-approved⭘ref◼{nm}⭘lvl◼{cl}⭘cv◼{userVid}⭘cn◼{userName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```
resolved (approve L2 Agenia): `nm◼REQ-2026-000365-L2⭘ty◼request-approved⭘ref◼REQ-2026-000365⭘lvl◼2⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘…`

Tombol **Tolak** (+ alasan `◁5▷`):
```
…⭘nm◼{nm}-L{cl}⭘ty◼request-rejected⭘ref◼{nm}⭘lvl◼{cl}⭘cv◼{userVid}⭘cn◼{userName}⭘d◼◁5▷⭘t◼◀2▶⭘ts◼◀2|T7|…▶
```

Timeline (query `ref◼REQ-2026-000365` sort t):
`Diajukan (Agenia, 11:54 — dari doc) → Disetujui L1 (Agenia) → Disetujui L2 (Agenia) → …`

## 5. Deliverable

### 5.1 Config op1Screen (builder) — tambah `addToEvent` di tombol
- `ApproveLeaveDetail` tombol Setujui (`workflowEventBtnFlat`@309) + Tolak (`workflowEventNoteBtnFlat`@310): tombol udah punya `updateEventRow`. **Tambah field `addToEvent`** (§4) — genericize helper col. Kalau template widget belum punya slot `addToEvent`, tambah `[ADDTOEVENT]` placeholder (ikut `op1screen-genericize-widget`).
- `{nm}`/`{cl}` = token doc request (routeParams). `{userVid}`/`{userName}` = approver (skarang demo `Settings!B1/B2`, samain sama `dvby/dvbn`).
- ApproveLeave (list `listActionCard`) `action1`/`action2` juga bisa bawa event kalau approve dari list (opsional — sekarang dari detail).

### 5.2 Renderer (Flutter) — widget timeline detail
- Reuse widget timeline (varian ledger / `timelinePeriodic`) — keyed, baca `//event`.
- **Impl aktual (2026-07-31):** event ditulis `ty◼approval` (satu tipe; approve vs reject dibedain lewat status/`d`), + **`ref◼{nm}`** (link ke request).
- **⚠️ SCOPE VIA `conditions`, BUKAN `search`.** Live-test 2026-07-31: `variant:"periodic"` **ABAIKAN `search`** → semua event `//event` nongol (bocor lintas-pemohon). Periodic nyaring lewat **`conditions`** (spec `timeline-periodic-dynamic.md` line 52). Fix LIVE:
  - `conditions:"[[◀ref▶◼{nm}]]"` (double-bracket, resolve route-param `{nm}`). Multi-klausa concat: `[[◀ref▶◼{nm}◀ty▶◼approval]]`.
  - `sort:"t◼asc"`. `search:"ref◼{nm}"` boleh tetep (harmless) tapi periodic gak baca.
  - `ref` = klausa **utama** (per-request); `ty◼approval` = filter sekunder opsional.
- Config resolved (ledger):
```json
{"type":"TIMELINE","variant":"ledger","vidtable":"20342033315492","table":"84214220504259//event",
 "conditions":"[[◀ref▶◼{nm}⭘◀ty▶◼approval]]","sort":"t◼asc",
 "title":"Riwayat Approval","subtitle":"{count} langkah",
 "titleField":"cn","subField":"ts","badgeField":"lvl","noteField":"d"}
```
- Per-row: title `<cn>`, sub `<ts>`, badge `Level <lvl>`, note `<d>` (alasan reject). Label dari config, **nol hardcode**.
- Taruh di `ApproveLeaveDetail` + `MyRequestDetailLog` (bawah detailCard). Baris "Diajukan" dari doc request (`ts/cv/cn`) atau digabung.
- **[VERIFY renderer]** `variant:ledger` udah landing? Kalau belum → interim `variant:periodic` (W195, LIVE) + `conditions ref◼{nm}` yang sama.

### 5.3 Dictionary
- `event_taxonomy`: tambah `request-approved` · `request-rejected` (+ future `request-submitted`/`-completed` kalau nanti mau full-event).
- `addToEvent`: pastiin `ref`/`lvl` ada (tambah `lvl` kalau belum).

## 6. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| `addToEvent`→//event di tombol approve/reject | **builder op1Screen** | PENDING |
| Widget timeline detail (baca //event by ref) | **dev Flutter** | PENDING |
| dict `event_taxonomy`+`lvl` | builder dict | PENDING |
| CF | — | **NOL change** (gak perlu) |

## 7. Not Doing (dan kenapa)
- **CF nulis event** — GAK PERLU. App (tombol) nulis via `addToEvent`; CF udah beres, jangan disentuh.
- **Event `request-submitted` di //event** — timeline ambil "Diajukan" dari doc request (`ts`/`cv`/`cn`); hemat 1 write. (Bisa ditambah nanti kalau mau full-event ledger.)
- **`request-completed` event** — "Selesai" derivable dari `st==approved` di doc; gak perlu row khusus.

## 8. Acceptance
- [ ] Approve/reject → row `//event` `ty:approval lvl={cl} ref={nm}` (reject bawa `d`=alasan).
- [ ] Timeline detail scope `ref◼{nm}` sort t → urut: (Diajukan dari doc) → L1 → L2 → …
- [ ] **Anti-leak:** request A cuma nampil event ref-nya sendiri; buka request B ≠ liat event A (bukti `ref` kefilter, bukan `ty` doang).
- [ ] Label timeline dari config, nol hardcode Flutter.
- [ ] `l{n}` di doc + detailCard tetep utuh.

## 9. Asumsi & risiko
- [ ] **Idempotency:** `addToEvent` append pakai key `nm◼{nm}-L{cl}` (deterministik per level). Kalau addToEvent bikin auto-id (nm cuma field), dobel-klik level sama = row dobel. Mitigasi: button `delay` + tombol ilang abis approve (request maju level). Kalau perlu STRICT → pakai `updateEventRow` (upsert by `nm★{nm}-L{cl}`) ganti addToEvent. [VERIFY mekanisme key addToEvent.]
- [ ] Event ditulis pas app klik (sebelum CF proses). Normal aman (gating app + CF). Edge: kalau CF akhirnya skip (mis. cl malformed), event terlanjur ketulis (inkonsisten). Jarang.
- [ ] `{cl}` di tombol = level SAAT klik (dari doc). CF baru advance setelah. Jadi event lvl = level yg baru di-approve. Bener.
- [ ] `lvl` field baru dict — [VERIFY] char-code gak bentrok.

---

**Referensi:** `docs/approval-flow-keyed-dev-spec.md` · `docs/approve-leave-gating-and-note-dev-spec.md` · dict `addToEvent`+`event_taxonomy` · RejectTask (savesend+addToEvent+updateEventRow) · op1Screen ApproveLeaveDetail @1055.
