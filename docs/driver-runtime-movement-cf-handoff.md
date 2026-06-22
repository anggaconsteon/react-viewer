# HANDOFF — Movement Cloud Function (driver runtime / galon)

**Untuk:** chat baru yg nerusin kerjaan Cloud Function. **Chat asal** (page work) sengaja dipisah — jangan campur.
**Tanggal:** 2026-06-17.
**Tujuan akhir:** dev (dibantu AI) baca spec → generate CF buat `movement` → turunin `asset_cache` + `task.it[]` actual.

---

## 0. Baca dulu (urutan)

1. **`docs/driver-runtime-movement-cf-dev-spec.md`** — SPEC UTAMA (AI-analyzable). Mulai sini.
2. `docs/driver-runtime-field-dictionary.md` — SSOT field codes (canonical).
3. `docs/driver-runtime-tables-dev-spec.md` — skema koleksi + flow per page (sudah di-resync 2026-06-17).
4. Dictionary sheet `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw` (tab `movement`/`task`/`asset_cache`/`item`/`stock_location`).
5. Memory: `project_movement_cf_spec`, `reference_dictionary_book`, `feedback_no_hallucination`.

---

## 1. Langkah PERTAMA di chat baru

**Minta owner ACC 5 keputusan pending (Q2,Q3,Q7,Q8,Q9).** Rekomendasi udah ditulis; tinggal yes/adjust. Sebelum ACC, JANGAN tulis kode final (rule akuntansi belum fix).

| Q | topik | rekomendasi (tinggal ACC) |
|---|---|---|
| **Q2** | cache lokasi `client` | **Model B**: warehouse/vehicle = per-kondisi fisik (invariant polos); client = **outstanding net** (1 key `{client}__{ii}__full`, DROP `+qt`, PICKUP `−qt`). CF cabang by `lt`. Owner udah lean "client penuh". |
| **Q3** | CF flip `task.tst`/`tce`? | **TIDAK**. App pegang lifecycle (completed = aksi driver), CF cuma angka turunan. |
| **Q7** | perilaku validasi gagal | **dead-letter** koleksi `movement_errors` + ACK event (jgn throw → no retry-loop) + alert. Payload-rusak ≠ investigation. |
| **Q8** | SALE `fl` lokasi | **`fl=vehicle, tl=null`** (consumable kejual dari mobil, exit sistem, no client outstanding). |
| **Q9** | asset_cache doc-id | **composite `{lv}__{ii}__{cd}`** (deterministik, 1 get, upsert idempoten, no query). Catatan: semua coll LAIN auto-id. |

Abis ACC → update `movement-cf-dev-spec.md` §11 (OPEN→DECIDED) + memory → spec final-ready.

---

## 2. Yg SUDAH fix (jangan diutak-atik)

**DECIDED + verified live (firebase-app-dev1, 2026-06-17):**
- **Path:** `MobileTable/{db}/tables/{tableVID}/{coll}`. Live `db=6093608774765…`, `tableVID=84214220504259`. CF ambil `db`/`tableVID` dari **wildcard `context.params`** (bukan json). [Q5]
- **Semua doc-id AUTO** (item/task/stock_location). FK = field (`ii`/`lv`/`tnm`). → resolve task = **query `where tnm==mrf` (limit 1)**, butuh index. [Q4]
- **ADJUSTMENT** = reuse invariant `fl`/`tl` (`fl=null`→naik, `tl=null`→turun; qt selalu +; Supervisor UI set arah). CF tdk butuh logika khusus. [Q1]
- **Schema cocok SSOT** (verified live): item `tc`=array `[full,empty]`; task `it[]`=`{ii,in,cdo,cdi,pd,pp,ad,ap}` (ad/ap=null awal); stock_location `al`(alamat)/`lv`(F62…)/`lt`(client/vehicle/warehouse), vehicle gak ada al/geo; task pakai `cv`/`cn`(admin).

---

## 3. Desain inti (recap 30 detik)

- `movement` = ledger **append-only immutable** = SSOT semua pergerakan stok.
- `asset_cache` + `task.it[].ad/ap` = **DERIVED**, cuma CF nulis. App **gak pernah** nulis saldo/actual.
- **Urutan:** app tulis movement DULU → CF derive belakangan. App pegang lifecycle (`tst`/`tce`).
- **asset_cache invariant:** `−qt @ fl`, `+qt @ tl`, key `{lv}__{ii}__{cd}`. `mt` gak nentuin tanda (fl/tl null yg nentuin) — `mt` cuma validasi + pilih field actual.
- **task.it[]:** movement ber-`mrf` → query task by `tnm` → match line by `ii` → **DROP→`ad`, PICKUP→`ap`**. SET via recompute Σ-ledger (idempoten).
- **Idempotency WAJIB** (CF fire >1x): it[]=recompute; asset_cache=transactional additive + movementId guard (atau recompute).
- 1 aksi customer = 2 movement (DROP full + PICKUP empty).

---

## 4. Setelah spec final → next

1. Generate CF code (TS, Firebase Functions v2, Firestore `onDocumentCreated`).
2. Implement: validasi (§8) → transaksi (asset_cache delta + task.it[] recompute).
3. Index: `task.tnm`, `movement` query (mrf+ii+mt) buat Σ-ledger.
4. Test pakai §10 worked-example + §13 test cases (happy/multi-line/idempotent/partial/no-mrf/write-off/validasi).
5. **CF kedua (terpisah, nyusul):** `vehicle_check` cty=closing → hitung `ie`, banding `ip`, isi `dp`/`rs` → spawn `investigation`. Di luar scope CF movement ini.

---

## 5. Aturan kerja (standing directives owner)

- **JANGAN ngarang.** Tiap field telusur ke dictionary; tiap rule grounded. Gak yakin → tanya, jgn asumsi. ([[feedback_no_hallucination]])
- **CAVEMAN MODE full** — respons terse. Kode/commit/spec ditulis normal.
- Owner suka edit file manual antar-turn → re-read file sebelum edit.

---

**MCP gsheets** kadang perlu reconnect (`/mcp`). Dictionary sheet read/write via `mcp__gsheets__*` (grid HARD-CAPPED — gak bisa expand row via MCP).
