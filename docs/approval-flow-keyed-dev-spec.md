# Approval Flow (Keyed) — Dev Spec

**Tanggal:** 2026-07-28
**Buat:** dev Go (CF — pusat spec) + builder op1Screen (5 page) + builder sheet (config baru)
**Status:** CF ✅ BUILT + PUSHED `cebf85f` 2026-07-28 (branch event-push — `internal/approval` + 2 route request create/update di onTenantWrite, all-cc fallback; build+vet+test ijo). Sheet 5 page + config push + [VERIFY §7] masih PROPOSED.
**Konteks:** Rebuild flow approval cuti/lembur dari pola LAMA (positional `<N>` addToTable, tab `Copy of op1Screen 1 baru lagi` row 655/674/694) ke **keyed modern**. Model **cost-center**, multi-level, level digeser CF.
**Referensi:** config VTL master `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` (sheet Konfigurasi Approval Modul + Otorisasi Approval) · pola reward `docs/sales-freelance-reward-dev-spec.md` (CF onTenantWrite route, updateEventRow, dv-trigger) · pola fate onProjectCreate (CF stamp saat create).

---

## 1. Model (keputusan terkunci user 2026-07-28)

- **Cost-center based**, BUKAN per-pemohon. Request **diem di CC pemohon**, naik level 1..N. Approver tiap level = **penghuni slot (CC, level)**.
- **Config 2 sumber**: `Konfigurasi Approval Modul` (per CC×fitur → jumlah level) + `Otorisasi Approval` (per approver → slot (CC,level)). Bukan per-pegawai → kecil.
- **Pemohon nol-config**: CC pemohon dari profil (join `sv`→Site→CC). Cuma approver yang didaftar.
- **Self-approve DIBOLEHIN** (v1, user 2026-07-28) — nol cek `cv≠approver`. Toggle nanti.
- **Multi-orang per level** = inheren (gating by CC/slot, banyak orang 1 slot).
- **Level digeser CF** (bukan client). Bagian fragile lama (Rumus/conditions parsing per render) DIBUANG.

Beda inti dengan lama: **lama** = level dibakar di record + digeser tiap HP (Rumus). **baru** = HP cuma kirim `dv◼approve`; CF stamp + geser `ak`.

## 2. Config → Firebase (collection `grant`, universal `gt`)

Push dari 2 sheet baru (§6). Contoh record dari **data asli**:

**policy** (dari Konfigurasi Modul — CF baca pas create):
```json
{ "gt":"approval-policy", "cc":"32639062303108", "ft":"request-leave",    "nl":3 }
{ "gt":"approval-policy", "cc":"84214220504259", "ft":"request-leave",    "nl":3 }
{ "gt":"approval-policy", "cc":"83674161979544", "ft":"request-overtime", "nl":3 }
```
doc-id `policy-{cc}-{ft}`.

**slot** (dari Otorisasi — app approver baca buat gating):
```json
{ "gt":"approval-slot", "uv":"91234922513369", "un":"Denny",   "slots":"32639062303108-1|83674161979544-2|84214220504259-3" }
{ "gt":"approval-slot", "uv":"41999994632117", "un":"Marita",  "slots":"32639062303108-2" }
{ "gt":"approval-slot", "uv":"72333032338989", "un":"Autsorz", "slots":"32639062303108-1" }
```
doc-id `slot-{uv}`. `slots` = `{ccVID}-{level}`, `|`-join.

## 3. Skema `request` (keyed, coll `84214220504259//request`, universal semua jenis)

| Grup | Field | Isi |
|---|---|---|
| Identitas | `nm` **(KEY logis)** | No REQ-YYYY-NNNNNN. **Doc-id request = AUTO-ID Firestore** (addToEvent, BUKAN nm); alamat update via field `nm` (`search◼nm★{nm}`). CF terima doc-id dari trigger, gak ngitung. Cuma doc CONFIG grant (policy/slot) yang doc-id dihitung |
| | `rty` | jenis fitur (= `ft`), mis. `request-leave` |
| | `cv`/`cn` | pemohon VID/nama |
| | `sv`/`sn` | site pemohon (dari profil) |
| | `av`/`an` | **cost center pemohon** (resolve `sv`→Site→CC pas submit — [VERIFY §7]) |
| | `t`/`ts` | waktu submit |
| Payload cuti | `lt` | jenis cuti |
| | `ds`/`de` | tgl mulai/selesai (epoch) |
| | `dn` | jumlah hari |
| | `rpv`/`rpn` | pengganti VID/nama |
| | `d` | keterangan |
| | `i` | dokumen (url/array) |
| **State approval (CF isi)** | `st` | pending / approved / rejected |
| | `nl` | total level (CF dari policy) |
| | `cl` | level aktif 1..nl (CF geser) |
| | `ak` | **active key** = `{av}-{cl}` (CF geser) — **pointer gating** |
| Jejak per-level (CF stamp) | `l1s`/`l1by`/`l1bn`/`l1t` | status/approver-vid/nama/waktu (l2…, l3… sparse) |
| Trigger keputusan (app tulis) | `dv` | `approve`/`reject` → CF konsumsi + clear |
| | `dvby`/`dvbn` | approver yang tekan |
| | `rr` | alasan tolak |

## 4. Kontrak CF (route `request` di onTenantWrite) — INTI

Pola: mirror reward (create-path + update-path + dv-trigger + idempotent marker).

### 4.1 onCreate (doc baru, `st==pending`, `cl` kosong)
1. Baca `av` dari doc (udah resolve sheet-side).
2. Lookup grant doc-id `policy-{av}-{rty}` → `nl` (direct Get, nol query/index). NotFound → **fallback `policy-ALL-{rty}`** (all-cost-center, config sheet `cc◼ALL`) → `nl`.
   - **Dua-duanya gak ketemu → LOLOS (`st◼approved`, `nl◼0`, `ak◼""`)** — keputusan user 2026-07-28: policy belum di-setup = emang gak butuh approval. (NotFound vs error transient dibedain: transient → retry, jangan auto-approve gara2 DB blip.)
   - `av` kosong (sv→CC resolve gagal) → WARN + jatuh ke jalur no-policy (lolos). Blocker [VERIFY §7.1].
3. Ketemu → Stamp: `nl◼{nl}`, `cl◼1`, `ak◼{av}-1`. `st` tetap pending.
4. Idempotent: kalau `cl` udah keisi (`>0`) → ACK skip (fresh-read).

### 4.2 onUpdate — approve (app set `dv◼approve⭘dvby◼…⭘dvbn◼…`)
1. Gate: `dv==approve` && `st==pending`.
2. Stamp jejak: `l{cl}s◼approved`, `l{cl}by◼{dvby}`, `l{cl}bn◼{dvbn}`, `l{cl}t◼{now}`.
3. Maju:
   - `cl < nl` → `cl◼{cl+1}`, `ak◼{av}-{cl+1}`.
   - `cl == nl` → `st◼approved`, `ak◼""`.
4. Clear `dv` (+ dvby/dvbn) → cegah re-trigger.
5. Anti-self-loop: CF write balik = update juga; pakai marker/gate biar CF gak proses tulisan sendiri (pola reward `payoutProcessed`).

### 4.3 onUpdate — reject (app set `dv◼reject⭘rr◼…`)
1. Gate: `dv==reject` && `st==pending`.
2. `st◼rejected`, `ak◼""`, stamp `l{cl}s◼rejected⭘l{cl}by/bn/t`, `rr` disimpan.
3. Clear `dv`.

### 4.4 Edge — level tanpa approver
Kalau slot `(av, cl)` gak ada penghuni (contoh data: `(KP,3)` kosong) → request nyangkut di `ak` itu (gak ada yang lihat). **[DECIDE §10]**: (a) v1 biarin nyangkut + validasi config peringatin; atau (b) CF ikut baca slot config, kalau level kosong → auto-maju/flag. Rekomendasi v1: (a) + tool validasi config.

## 5. Pages op1Screen (proxy `18v3w5YJ…`) — builder, widget SEMUA ADA

| Page | Widget | Inti |
|---|---|---|
| **RequestLeave** | autoNumber, displayDropDownData, datePicker×2, numericField, searchFromTableConsteon, 3LineBorderForm, getImagesGallery, sendButtonGpsWithEvent | addToEvent `request⭘rty◼request-leave⭘st◼pending⭘nm◼◁17▷⭘…⭘cv◼{me}⭘sv◼{site}⭘av◼{CC resolve}` — **stop, CF isi nl/cl/ak** |
| **ApproveLeave** | **listActionCard** | gating `st◼pending⭘ak◼{slot user}` (multi-slot [VERIFY §7]); action1 approve `dv◼approve⭘dvby◼{me}⭘dvbn◼{name}`, action2 reject `dv◼reject⭘rr◼◁N▷` |
| **ApproveLeaveDetail** | detailCard + timeline(comment keyed) + txfWithSendButton + workflowEventBtn/NoteBtn | detail + komentar `//comment` keyed by `nm` + approve/reject sama `dv` |
| **MyRequestLog** | listCard | `cv◼{me}`, badge `st`, tampil level aktif (`cl`/`nl`) |
| **MyRequestDetailLog** | detailCard + timeline | request gua + progres tiap level (l1by/l1t…) |

Semua tombol via updateEventRow search `nm★{nm}`.

## 6. Sheet-side config — SHEET BARU (existing dibiarin, rename *OLD manual)

**NAMA FINAL (user 2026-07-28): `Approval Policy` → `Konfigurasi Approval`, `Approval Slot` → `Otorisasi Approval`.** Urutan rename: tab lama `Otorisasi Approval` WAJIB di-OLD-in dulu sebelum tab baru ngambil namanya. Mention nama lama di bawah = tab yang sama.

**Sheet `Approval Policy` (BUILT v3 2026-07-28, layout mirip Konfigurasi Approval Modul lama):**
`A=# (AUTO) | B=cc (AUTO dari nama) | C=Cost Center (ketik NAMA, dropdown) | D=Fitur | E=nl | F=warn (AUTO)` + **`Z=Push (AUTO, jauh kanan → HIDE)`**. Formula HANYA di header A2/B2/F2/Z2 (ARRAYFORMULA spill — row baru nol drag; user cuma isi C/D/E).
- `cc` = VLOOKUP nama → `{'Cost Center'!$D$3:$D\'Cost Center'!$B$3:$B}` open-range (CC baru auto kebaca; typo nama → `CC?`).
- **all-cost-center** di kolom Cost Center → `cc◼ALL` (sentinel, cabang IF skip VLOOKUP; CF fallback `policy-ALL-{ft}` — delta CF ~5 baris PENDING, lihat `docs/approval-config-sheet-dev-spec.md`).
- `warn` = `DUP!` kalau kombinasi (CC,Fitur) dobel (COUNTIFS) — guard bentrok data §10; SENGAJA visible di F (deket input), bukan di kolom hidden.
- Push (Z) = `gt◼approval-policy⭘cc◼{cc}⭘ft◼{Fitur}⭘nl◼{nl}`.

**Sheet `Approval Slot` (BUILT v3 2026-07-28, layout mirip Otorisasi Approval lama):**
`A=# (AUTO) | B=uv (AUTO) | C=Nama - NIP (MANUAL, dropdown-able) | D=Status (AUTO)` + band `Level 1..10` (E:N, isi NAMA CC — 10 slot sama kaya tab lama) + **`Y=slots | Z=Push (AUTO, jauh kanan → HIDE Y:Z)`**. Formula HANYA di header A2/B2/D2/Y2/Z2. **Input user CUMA: Nama + Level band** — `uv` = VLOOKUP Nama→`D!$C:$D` (mirror rumus per-row tab lama, dipindah ke header), `Status` = VLOOKUP uv→`Pegawai!$B$3:$K` idx 2; nama gak ketemu → uv/Status kosong → Push row itu gak kegenerate (guard B).
- Rumus jauh di Y/Z = band bebas tumbuh; kolom O..X kosong sebagai buffer visual. Level 11+ = insert kolom DALAM band + tambah 1 term di Y2 (insert dorong Y/Z ke kanan otomatis, referensi ikut).
- TANPA blok master CC lokal — VLOOKUP langsung ke tab `Cost Center` (open-range, sama kaya Policy).
- `slots` = rantai 10 term `IF(LevelN<>"";"|"&VLOOKUP(nama→vid)&"-N";"")` + `MID(…;2;9^9)` buang `|` depan.
- **all-cost-center** di Level N → slot `*-N` (wildcard semua CC; gating app cl-only [VERIFY renderer]).
- Dropdown list = `'_Helper Approval'!G` (spill `all-cost-center` + FILTER CC active) — shared kedua tab. Sisa `_Helper Approval` (A:E + H) JANGAN disentuh — punya pipeline lama, rollback safety (user 2026-07-28).
- Push (Z) = `gt◼approval-slot⭘uv◼{uv}⭘un◼{Nama}⭘slots◼{slots}`; **Status≠active → `slots◼` kosong = REVOKE** (doc `slot-{uv}` ke-overwrite nol slot; re-aktifin = balikin status).
- Verified 2026-07-28 (v2 dan v3): slots+Push byte-identik output lama (6 approver, 4 policy row); `#` auto 1-6 / 1-4.
- Manual (owner, UI): dropdown validation Level E3:N + Policy C3:C → range **`'_Helper Approval'!$G$2:$G`** (all-cost-center + CC active); HIDE kolom `Slot!Y:Z` + `Policy!Z`.

**Sheet lama** (`Konfigurasi Approval Modul`, `Otorisasi Approval`, `Approval`): **pensiun**, gak dipush. Rename `…OLD` manual (API gak bisa rename). **`_Helper Approval` DIPERTAHANKAN + JANGAN rename** — cuma kolom G (Dropdown CC Options) yang dipakai flow baru; SISANYA (A:E + H) punya pipeline lama, biarin utuh buat rollback sampe cutover beres.

**Push ke Firebase**: mekanisme sama `notification_grant` — kolom Push jadi record, sync ke coll `grant`. [VERIFY §7 plumbing].

## 7. [VERIFY] ke dev (blocker sebelum build tuntas)

1. **Resolve `sv`→CC di submit**: butuh token/formula CC user login (join Site). Reward pakai `'op1'!K7` — pastiin itu resolve per-user (bukan nilai demo kebake). Kalau belum, siapin VLOOKUP `sv`→Site→CC di op1 context.
2. **Gating multi-slot**: 1 approver bisa banyak slot (Denny 3). Eq-search gak bisa OR → app inject daftar-slot + N search, ATAU renderer conditions-lite. Konfirmasi cara.
3. **Push plumbing** `grant`: mekanisme persis notification_grant (sheet→doc) — konfirmasi jalurnya masih sama.
4. **Comment keyed**: timeline variant comment + commentBox ke `//comment` keyed by `nm` — pastiin renderer keyed comment jalan.

## 8. Dictionary (daftar ke book saat build)

### `grant`
| Field | Nama | Tipe | Isi |
|---|---|---|---|
| `gt` | grant type | String | `notification`\|`approval-policy`\|`approval-slot` |
| `cc` | cost center vid | String | policy: CC target |
| `ft` | fitur | String | policy: jenis request |
| `nl` | levels | Number | policy: jumlah level |
| `uv`/`un` | user vid/name | String | slot: approver |
| `slots` | slots | String | slot: `{cc}-{lvl}`, `\|`-join |

### `request`
(lihat tabel §3 — semua field.)

## 9. Acceptance

- [ ] Submit (CC pemohon KP, leave) → CF stamp `nl◼3 cl◼1 ak◼32639062303108-1`.
- [ ] Approver slot `32639062303108-1` (Denny/Autsorz/Agenia) lihat; slot lain nggak.
- [ ] Approve → `l1s◼approved`, `cl◼2`, `ak◼…-2`; pindah ke antrian slot-2 (Marita).
- [ ] Level terakhir approve → `st◼approved`, `ak◼""`.
- [ ] Reject → `st◼rejected` stop.
- [ ] Self-approve dibolehin (approver submit → bisa approve sendiri).
- [ ] Fitur beda (overtime) → policy beda → nl sesuai config.
- [ ] Idempotent: CF replay nol double-effect.

## 10. Open decisions (tanya user/PM)

- [x] ~~Policy `(cc,ft)` gak ketemu → reject vs default 1-level?~~ **DECIDED 2026-07-28: LOLOS (auto-approve)** — no policy = no approval needed. BUILT.
- [ ] Level tanpa approver (contoh `(KP,3)` kosong di data) → nyangkut vs CF auto-maju? (v1: nyangkut + validasi config)
- [ ] **Data config bentrok**: Konfigurasi Modul ada 2 baris `Kantor Pusat × request-overtime` (nl 3 & 2) → doc-id `policy-32639062303108-request-overtime` tabrakan. Tentuin 1.
- [ ] Self-approve toggle (kapan diaktifin exclude-self).
- [ ] Multi-slot gating: app-inject vs conditions-lite (§7.2).

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` · dict book `1_XHmo5…` · config VTL master `14kDPqAw…`.
