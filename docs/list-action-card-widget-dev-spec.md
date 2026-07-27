# LIST_ACTION_CARD — list + approve/reject inline per-row (Dev Spec)

**Tanggal:** 2026-07-27
**Buat:** dev Flutter (renderer) + builder op1Screen
**Status:** APPROVED (design user-approved 2026-07-27; renderer belum ada)
**Konteks / Konsumen pertama:** `RewardReview@1014` row 1017 — antrian review submission reward (±1.800 worker). Dulu LIST_CARD → route detail → approve/reject → balik; page di-rebuild 2026-07-27: noticeBar@1016 + listActionCard@1017 (config-ahead bareng paket reward — runtime nunggu renderer 4-spec + CF deploy).
**Referensi:** `docs/sales-freelance-reward-dev-spec.md` (induk) · mockup `src/component/SalesFreelanceV1.jsx` (Admin Review tab) · dict book tab `widget_field_positions`

---

## 1. Kenapa

Admin review roundtrip: list → detail → vonis → balik list → ulang. Buat antrian puluhan-ratusan/hari itu lambat. Mayoritas vonis bisa diputus dari list (flag + link udah kelihatan); detail cuma perlu buat lihat screenshot gede. Keputusan user 2026-07-27: tombol Approve/Reject inline di row, tap card tetap route ke detail (lihat gambar), reject inline tetap wajib alasan via popup note.

Komplain tech lead (2026-07-27, terkunci): field display jangan kebanyakan — **yang bisa digabung 1 field ◆-split, gabungkan**, posisinya didokumentasikan. Makanya kontrak ini pakai `fields` / `actionMeta` / `text` posisi-fixed, bukan 18 field lepas.

## 2. Konsep

LIST_CARD + 2 tombol write per-row. Tiap tombol bawa write DSL `updateEventRow` utuh di config; token `{field}` di DSL di-resolve dari **doc row yang ditap** (mekanisme sama persis `routeParams`). Tombol bisa langsung kirim atau lewat popup note dulu (mekanisme sama `workflowEventNoteBtn`: isi popup → position N → DSL baca `◁N▷`). Row hilang sendiri via listener begitu `st` berubah dan gak match `search` lagi. Nol token baru, nol logika case di Flutter — semua dari config.

## 3. Kontrak field

```jsonc
{
  "type": "LIST_ACTION_CARD",
  "vidtable": "[VIDTABLE]",
  "table": "[TABLE]",              // keyed coll
  "search": "[SEARCH]",            // filter antrian, mis. st◼review
  "sort": "[SORT]",                // field◼dir → t◼asc  (merge sortField+sortDir LIST_CARD)
  "fields": "[FIELDS]",            // ◆-split 6 posisi FIXED — lihat §3.1
  "stats": "[STATS]",              // header count, sama LIST_CARD ("Antrian◼"); kosong = off
  "searchFields": "[SEARCHFIELDS]",// search box client-side ("cn"); kosong = off
  "route": "[ROUTE]",              // tap CARD → detail; kosong = tap mati
  "routeParams": "[ROUTEPARAMS]",  // ck◼{ck}
  "action1": "[ACTION1]",          // write DSL updateEventRow UTUH; kosong = tombol off
  "action2": "[ACTION2]",
  "actionMeta": "[ACTIONMETA]",    // ◆-split per action — lihat §3.2
  "text": "[TEXT]"                 // ◆-split 13 posisi FIXED — lihat §3.3
}
```

14 field. `action1`/`action2` SENGAJA gak digabung: isinya DSL panjang ber-⭘◼★ yang di-assembly formula sheet (`=""&auzSettings!$J$57&…`) — digabung ◆ bikin formula helper monster.

### 3.1 `fields` — 6 posisi (selalu 6 segmen, kosongin = fitur off)

| # | Posisi | Isi | Contoh konsumen pertama |
|---|---|---|---|
| 1 | title | template `<field>` (pola LIST_CARD) | `<cn>` |
| 2 | subtitle | template `<field>` | `<pl>` |
| 3 | image | nama field thumbnail (pola `images` DETAIL_CARD) | `i` |
| 4 | meta/waktu | template `<field>`, tampil kanan-atas | `<ts>` |
| 5 | badgeField | nama field | `fl` |
| 6 | badgeMap | `value◼label◼tone★…` (◼/★ DI DALAM segmen ◆ aman — split ◆ duluan) | `sample◼Sampel acak◼neutral★…` |

### 3.2 `actionMeta` — segmen N = action N; per segmen `tone◼flag[◼posisiNote]`

| # | Isi | Catatan |
|---|---|---|
| 1 | tone | `ok` \| `warn` \| `danger` \| `neutral` — warna dari THEME, bukan hex (aturan 3-tier) |
| 2 | flag | savesend-flag registry CF (`flags_functions`), mis. `reward-approve` |
| 3 | posisiNote (opsional) | terisi angka N = tap → popup note dulu, isi masuk position N → DSL action baca `◁N▷`. Kosong/absen = langsung kirim |

Contoh: `ok◼reward-approve◆danger◼reward-reject◼5`.

### 3.4 Token `{field}` — identitas row (klarifikasi user 2026-07-27)

- Tiap row list = 1 doc Firestore. Tap tombol → renderer substitusi tiap `{xxx}` di DSL action **dari doc row yang ditap**: `{xxx}` = ambil `doc["xxx"]` literal. **BUKAN token spesial / daftar baked** — nama di dalam `{}` = nama short-code field persis di Firebase. Mekanisme sama persis `routeParams` existing.
- Konsumen pertama pakai `{ck}` karena `post_claim` punya field `ck` unik (`{cv}-{t}`). Case lain pakai field masing-masing (`{lk}` titik patroli, `{tnm}` task, dst) — config yang nentuin, renderer nol perubahan.
- Syarat field yang dipakai di `search◼…★{field}`: **ada di doc + unik** (atau kombinasi `☆` AND sampai unik) — dia target write.
- **Token gak ke-resolve (field absen/kosong di doc) → ABORT: jangan kirim, tombol balik, WARN log.** Substitusi kosong bahaya — `search◼ck★` kosong bisa nyasar ke doc lain.

### 3.3 `text` — 13 posisi (pad kosong, index renderer FIXED, nol string hardcode di Flutter)

| # | Isi | Contoh |
|---|---|---|
| 1 | judul header list | Antrian Review |
| 2 | subjudul header | Cuma yang kena flag / sampel — sisanya auto |
| 3 | unit item (buat stats) | item |
| 4 | hint search box | Cari nama worker |
| 5 | empty-state | Antrian kosong — semua bersih |
| 6 | label action1 | Approve |
| 7 | label action2 | Reject |
| 8 | judul popup note | Reject Submission |
| 9 | body popup | Kasih alasan biar worker tahu harus perbaiki apa. |
| 10 | label input popup | Alasan reject |
| 11 | hint input popup | Mis. screenshot buram |
| 12 | label tombol kirim popup | Reject |
| 13 | fallback subtitle kosong | Tanpa link |

## 4. Contoh resolved (konsumen pertama — id REAL dari live @1016 + tombol detail @1022/@1023)

```json
{"type":"LIST_ACTION_CARD","vidtable":"20342033315492","table":"84214220504259//post_claim","search":"st◼review","sort":"t◼asc","fields":"<cn>◆<pl>◆i◆<ts>◆fl◆sample◼Sampel acak◼neutral★burst◼Submit cepat◼warn★duplicate◼Foto duplikat◼warn★link◼Link bekas◼warn★ai◼Cek AI◼warn","stats":"Antrian◼","searchFields":"cn","route":"vertikaTeknoLokaciptaRewardReviewDetail","routeParams":"ck◼{ck}","action1":"84214220504259//post_claim⭘tablevid◼20342033315492⭘search◼ck★{ck}⭘st◼approved","action2":"84214220504259//post_claim⭘tablevid◼20342033315492⭘search◼ck★{ck}⭘st◼rejected⭘rr◼◁5▷","actionMeta":"ok◼reward-approve◆danger◼reward-reject◼5","text":"Antrian Review◆Cuma yang kena flag / sampel — sisanya auto◆item◆Cari nama worker◆Antrian kosong — semua bersih◆Approve◆Reject◆Reject Submission◆Kasih alasan biar worker tahu harus perbaiki apa.◆Alasan reject◆Mis. screenshot buram◆Reject◆Tanpa link"}
```

DSL action = **persis** string `updateEventRow` tombol detail existing (workflowEventBtn@1022 / NoteBtn@1023) — CF nol perubahan.

## 4b. UI / Layout

```
┌──────────────────────────────────────┐
│ Antrian Review                  [5]  │ ← text1 + stats count
│ Cuma yang kena flag / sampel …       │ ← text2
│ 🔍 Cari nama worker                  │ ← searchFields ("cn") + text4
│ ┌──────────────────────────────────┐ │
│ │ [img] Dedi K.           🕐 6 jam │ │ ← image/title/meta
│ │       instagram.com/p/Cx9k…      │ │ ← subtitle (kosong → text13)
│ │       ⚠ Foto duplikat            │ │ ← badgeField+badgeMap
│ │ [ ✓ Approve ]   [ ✕ Reject ]     │ │ ← action1 (ok) / action2 (danger)
│ └──────────────────────────────────┘ │
│ ┌── row berikutnya … ──────────────┐ │
└──────────────────────────────────────┘
Tap CARD (bukan tombol) → route detail (lihat screenshot gede).
Tap Reject → bottom sheet: text8 judul / text9 body / TXF(label=text10,
hint=text11) → position 5 / tombol kirim text12 → kirim action2.
```

Perilaku:
- Tap action → resolve `{field}` dari doc row → (popup dulu kalau posisiNote terisi) → savesend `updateEventRow` + flag.
- In-flight: **kedua** tombol row itu disabled + spinner. Sukses → nol dialog; row hilang sendiri via listener (itu feedback-nya). Gagal → tombol balik aktif + snackbar error standar renderer.
- Race / double-tap aman server-side: CF route post_claim/update gate `before=review` — tap kedua no-op.

## 6. Sheet-side (builder)

- Template `listActionCard` **@ Widget!I308:J308 (DITULIS 2026-07-27)** + G308/H308 formula standar. Semua placeholder string-quoted — nol quote-eat.
- **✅ Page RewardReview DI-REBUILD 2026-07-27 (user order — config-ahead konsisten paket reward, runtime belum live):** 1015 wsHeader (tetap) · **1016 = `noticeBar` variant `ok`** (banner "Auto-approve jalan…" — pengganti banner mockup; angka dinamis 214 gak bisa, noticeBar text-only) · **1017 = `listActionCard`** (row buffer kepake, sisa buffer 1018; window A1014:A1018 + CONCATENATE(E1015:E1018) udah nutup). Helper 1017 G:S urut placeholder: G vidtable · H table (=J57) · I search · J sort · K fields · L stats · M searchFields · N route (=$B$120&"RewardReviewDetail") · O routeParams · P action1 (`=""&auzSettings!$J$57&"⭘tablevid◼20342033315492⭘search◼ck★{ck}⭘st◼approved"`) · Q action2 (idem + `⭘st◼rejected⭘rr◼◁5▷`) · R actionMeta · S text. Helper listCard lama @1016 G..AA di-clear. B1014 verified resolve bersih.
- **Stat card mockup (Menunggu review / Ada flag anomali / angka auto-approved hari ini) DEFER** — butuh doc stats GLOBAL tenant (reward_cache per-worker, gak bisa) = CF delta maintain doc agregat; count antrian udah ke-cover `stats` header list.
- Detail page @1019 TETAP — masih dipakai buat lihat gambar + fallback vonis.

## 7. Deliverable dev Flutter

1. Type baru `LIST_ACTION_CARD` — display fork LIST_CARD (title/subtitle/meta template `<field>`, badge, stats, searchFields, route+routeParams) + **thumbnail** dari `fields` pos 3.
2. Parser `fields` / `actionMeta` / `text` posisi-fixed (§3.1–3.3) — segmen kosong = fitur off.
3. Tombol per-row: resolve `{field}` DSL dari doc row (reuse resolver routeParams) → submit pipeline savesend existing (updateEventRow + flag), disabled+spinner in-flight.
4. Popup note: reuse machinery bottom-sheet TXF (pola workflowEventNoteBtn) — isi ke position N, kirim DSL, clear.
5. Tone tombol dari THEME (`ok/warn/danger/neutral`) — bukan hex, bukan `buttonColor` legacy.

## 8. Dictionary

Nol field data baru (`st`/`rr`/`ck` udah ada di tab `post_claim`). Posisi `fields`/`actionMeta`/`text` didaftarkan di dict book tab **`widget_field_positions`** (komitmen ke tech lead biar gak lupa) — pola "1 field ◆-split posisi fixed" jadi rujukan widget berikutnya.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Renderer LIST_ACTION_CARD | dev Flutter | PROPOSED |
| Template Widget@308 | builder | DONE 2026-07-27 |
| Dict tab `widget_field_positions` | builder | DONE 2026-07-27 |
| Page rebuild: noticeBar@1016 + listActionCard@1017 | builder | DONE 2026-07-27 (config-ahead) |
| Stat card count global (CF doc agregat) | dev Go + builder | DEFER |
| CF | dev Go | NOL PERUBAHAN (DSL & flag sama persis tombol detail) |

## 10. Not Doing (dan kenapa)

- **Gate per-action** (`search st◼review` ala tombol detail) — row udah difilter `search` list + CF gate server-side; double protection cukup. Tambah kalau ada case list tanpa filter status.
- **Dialog sukses per action** — row hilang = feedback; dialog malah ganggu antrian cepat.
- **Bulk select approve** — pola bulk udah di PAYOUT_LIST; review harus per-item (itu esensinya).
- **Blok compare handle "Terdaftar vs Di link"** (mockup Ratna) — nunggu registrasi `hn` (OPEN di spec induk); badge `fl` udah nandain.
- **Aksi ke-3+** — 2 slot cukup; tambah `action3` + segmen kalau ada case nyata.

## 11. Acceptance

- [ ] Row tampil: thumbnail + title + subtitle (kosong → text13) + meta + badge sesuai `fields`.
- [ ] Tap card → route detail bawa `ck`; tap Approve → doc jadi `st◼approved`, row hilang tanpa refresh manual.
- [ ] Tap Reject → bottom sheet; kirim tanpa isi → [VERIFY kebijakan: boleh kosong?]; isi "buram" → doc `st◼rejected` + `rr◼buram`.
- [ ] Double-tap / 2 admin barengan → write kedua no-op (CF gate), UI gak crash.
- [ ] Write gagal (offline) → tombol balik aktif + error standar.
- [ ] Segmen `fields`/`text` kosong → fitur off / label kosong, nol crash.
- [ ] Nol string hardcode di Flutter — semua label dari `text`.
- [ ] Token `{field}` absen/kosong di doc row → write DI-ABORT (nol request keluar) + WARN; tombol balik aktif.
- [ ] 2 row beda ditap bergantian → masing-masing write bawa nilai `{ck}` doc-nya sendiri (nol kebocoran state antar row).

## 12. Asumsi & risiko

- [ ] Pipeline savesend dianggap jalan tanpa `gpsPosition`/`delay` (tombol detail bawa `gpsPosition:2, delay:5`) — kalau wajib GPS, tambah posisi 4 `actionMeta`. [VERIFY dev]
- [ ] Position note (5) = state page singleton transient — aman selama popup modal (1 row aktif at a time). [VERIFY]
- [ ] Popup note kirim kosong: v1 ikutin perilaku NoteBtn existing. [VERIFY kebijakan]
- [ ] `stats`/`searchFields` di-fork apa adanya dari LIST_CARD — kalau implementasi LIST_CARD beda dari asumsi, ikutin yang live.

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` · `docs/payout-list-widget-dev-spec.md` + `docs/stat-card-row-widget-dev-spec.md` + `docs/getimages-gallery-source-dev-spec.md` (paket dev yang sama) · dict book `1_XHmo5…` tab `widget_field_positions`
