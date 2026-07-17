# Admin Create-Task — tnm Auto-Number + Auto-ID + Savesend Ride (DEV SPEC)

> **Scope kecil, delta doang.** Cuma P4 (`vertikaTeknoLokaciptaCreateTaskSummary`) submit + 1 widget NUMBER baru. **JANGAN ubah flow create-task yg udah jalan. JANGAN dobel-write. JANGAN error.**
>
> Sistem = op1Screen sheet-CMS (config JSON) + renderer Flutter. Config LIVE udah kepasang di op1Screen. Ini nyuruh renderer implement 3 perubahan kecil.

## 0. TL;DR — 4 perubahan
1. **Doc auto-id** — task doc ditulis pakai Firestore **auto-id** (kaya koleksi lain), **BUKAN** custom doc-id = `tnm` (yg sekarang bikin doc-id `TASK-F623956-20260630-210108`).
2. **tnm = auto-number** — `tnm` di-generate widget `NUMBER` (counter backend `vtl.request`, format `TASK-2026-000123`), di-trigger pas submit via `run:"17:generate_number"`, submit baca hasilnya dari `position 17` (`numberPos:"17"`).
3. **Submit numpang savesend** — `TASK_CREATE_SUBMIT` skarang `action:"savesend"` biar `run`/generate_number/chain/nav jalan lewat pipeline savesend yg udah proven. **TAPI write Firestore TETEP di logic native TASK_CREATE_SUBMIT** (bukan savesend). Lihat §4.
4. **Init `ad`/`ap` di tiap it[] line** — WAJIB tulis field `ad` + `ap` (init **`null`**) per baris it[]. Kalo field ABSENT → CF fallback baca plan (`pd`/`pp`) → asset_cache **minus**. Lihat §4b.

## 1. Yg SEKARANG udah jalan (JANGAN diubah)
`TASK_CREATE_SUBMIT` di P4:
- Baca wizard-draft `wizardKey:"admin_create_task"` = `.customer{kl,kn,al,pic}` + `.it[]` (item builder) + `.vv` (vehicle).
- Tulis 1 task doc: field `kl,kn,al,vv,tdt,tst:"assigned",tty:"delivery",gl,cn,cv,t,tablevid` + **`it[]` native array** (`[{ii,in,cdo,cdi,pd,pp,ps,pr,pb,tx,wt}]`) + `search:"tnm★{tnm}"`.
  - ⚠️ **it[] line sekarang KURANG `ad`/`ap`** — itu bug (§4b). Tiap line WAJIB juga punya `ad` + `ap`.
- Validasi: draft kosong → error text (`"Lengkapi data dulu"` / `"Data item kosong"`).
- Sukses → chain `DO_DIALOG` → nav `vertikaTeknoLokaciptaCreateTaskSuccess`.

**Semua di atas TETEP.** Perubahan cuma: doc-id jadi auto, tnm dari NUMBER, submit lewat savesend pipeline.

## 2. Resolved JSON — P4 (LIVE, urutan children)
Header P4 = `WORKSPACE_HEADER → TASK_DRAFT_INFO(card) → TASK_MANIFEST_LIST → NOTICE_BAR → NOTICE_BAR → NUMBER → TASK_CREATE_SUBMIT`. Dua widget terakhir yg relevan:

### 2a. NUMBER (widget baru, display "No. Task" + declare generate)
```json
{
  "type": "NUMBER",
  "text": "No. Task:◆Akan dibuat otomatis",
  "template": "TASK-{{YYYY}}-{{COUNTER(vtl.request,6)}}",
  "textColor": "blue_700",
  "size": 18,
  "executable": "execute1,generate_number",
  "position": 17,
  "margin": "8,16,8,16"
}
```
- `template` → `TASK-2026-000123` (YYYY = tahun skarang, COUNTER `vtl.request` di-pad 6 digit).
- `text` ◆-seg: `[0]` label kiri, `[1]` placeholder sebelum generate.
- `position:17` → hasil generate mendarat di `◁17▷`.
- **Ini widget NUMBER/generate_number yg SAMA** kaya flow request-approval (`SendButtonGpsExeConsteon`), app tablevid `20342033315492`. Renderer harusnya udah ada.

### 2b. TASK_CREATE_SUBMIT (submit, +savesend +run +numberPos)
```json
{
  "type": "TASK_CREATE_SUBMIT",
  "vidtable": "20342033315492",
  "table": "84214220504259//task",
  "wizardKey": "admin_create_task",
  "action": "savesend",
  "com": "auz",
  "flag": "admin-create-task",
  "delay": 5,
  "run": "17:generate_number",
  "numberPos": "17",
  "route": "vertikaTeknoLokaciptaCreateTaskSuccess",
  "text": "Buat Task & Assign◆Lengkapi data dulu◆Gagal membuat task◆Data item kosong",
  "chain": {
    "type": "DO_DIALOG",
    "title": "Task Dibuat",
    "children": [
      { "type": "TXT", "data": "Task masuk antrian Gudang · status assigned, nunggu loading" },
      { "type": "RBT", "alignment": "center", "children": [ { "text": "Ok", "route": "vertikaTeknoLokaciptaCreateTaskSuccess" } ] }
    ]
  }
}
```

## 3. Field baru — arti
| field | fungsi |
|---|---|
| `action:"savesend"` | submit ride pipeline savesend (proses `run`, chain, delay, nav). |
| `com:"auz"` | routing backend (buat counter/generate_number nembak). |
| `flag:"admin-create-task"` | tag savesend (konvensi). |
| `delay:5` | delay savesend (konvensi). |
| `run:"17:generate_number"` | pas submit: eksekusi `generate_number` di posisi 17 → counter `vtl.request` naik → `◁17▷` = `TASK-2026-000123`. |
| `numberPos:"17"` | kasih tau submit: ambil `tnm` dari `◁17▷` (hasil generate). |

## 4. ⚠️ DIVISION OF LABOR (kunci biar gak dobel-write / error)
Submit ini **numpang** savesend, TAPI:
- **Savesend engine** cuma urus **pipeline**: proses `run:"17:generate_number"`, `delay`, `chain` (DO_DIALOG), navigasi `route`. **BUKAN** nulis Firestore.
- **Write Firestore TETEP di logic native `TASK_CREATE_SUBMIT`**: baca draft → tulis task doc (auto-id) + `it[]` array + `search`.
- **Submit GAK ada `addToTable`/`addToEvent`/`updateEventRow` string** → savesend gak punya write-DSL buat dijalanin → **cuma 1 write (native)**. 

> **JANGAN** bikin savesend nulis dokumen sendiri + native nulis lagi = **dobel doc / error**. Savesend = trigger doang; native = satu-satunya penulis.

**Urutan pas tombol dipencet:**
1. Validasi draft (existing) — kosong → error text, stop.
2. `run` → `generate_number` posisi 17 → `◁17▷` = tnm baru (`TASK-2026-000123`).
3. Native write: task doc **auto-id**, `tnm = ◁17▷`, `search = "tnm★" + ◁17▷`, + semua field existing + `it[]` (tiap line +`ad`/`ap`, §4b).
4. Chain `DO_DIALOG` → nav success.

## 4b. ⚠️ Init `ad`/`ap` di tiap it[] line — WAJIB (fix asset_cache minus)
**Masalah (live-verified):** it[] yg ditulis sekarang **gak ada `ad`/`ap`** (cuma `pd/pp/ps/pr/pb/...`). Alur stok sistem: **actual-write isi `ad`/`ap` → CF derive asset_cache**. Pas **konfirmasi muatan / custody**, CF baca `ad`/`ap`; kalo **field-nya ABSENT** → CF **fallback baca plan** (`pd`/`pp`) → dijumlahin → **asset_cache MINUS** (regresi masalah lama).

**Penyebab spesifik = field ABSENT, bukan value.** Task hasil seeder yg BENER punya `ad:null`/`ap:null` (present, value null) → CF anggep "belum kirim" (0) → aman. Task admin sekarang **omit field total** → fallback → minus.

**Fix:** tiap baris `it[]` WAJIB include `ad` + `ap`, init **`null`**:
```json
{ "ii":"...", "in":"...", "cdo":"full", "cdi":"empty", "pd":2, "pp":2, "ps":0, "pr":0, "pb":0, "tx":"deliver", "wt":"", "ad":null, "ap":null }
```
- **`null`** = mirror persis task seeder yg proven jalan. Pake ini.
- `0` **kemungkinan** juga jalan (kalo CF cek presence, bukan `?? pd`) — tapi **belum ke-verify**. Pake `null` dulu, test `0` belakangan kalo mau.
- **Yg kritis = field-nya ADA** (present) di tiap line. `null` vs `0` = detail kedua.

**Alur lengkap:** admin create task → it[] `ad/ap=null` (belum kirim) → driver delivery **actual-write** set `ad/ap` = angka nyata → **CF** derive asset_cache. Tanpa init ini, rantai putus di langkah 1.

> **Long-term (bukan scope submit ini, catat aja):** idealnya CF **jangan fallback ke plan** sama sekali — stok actual diturunin dari `movement` (SSOT), bukan tebak `pd/pp`. Selama itu belum, init `ad/ap` present = penambal wajib.

## 5. tnm & doc-id — before/after
| | Sebelum | Sesudah |
|---|---|---|
| doc-id | `TASK-F623956-20260630-210108` (custom = tnm) | **auto-id** Firestore (mis. `BsnPvUGgjzztbWm42v8C`) |
| `tnm` (field) | `TASK-F623956-20260630-210108` (composed string) | `TASK-2026-000123` (counter `vtl.request`) |
| `search` | `tnm★TASK-F623956-...` | `tnm★TASK-2026-000123` (`= "tnm★" + ◁17▷`) |

`tnm` tetep ada sebagai **field** (buat display + `search`), cuma nilainya skarang sequential + doc-id-nya lepas dari tnm.

## 6. NON-GOAL (JANGAN dikerjain)
- ❌ **JANGAN** tulis `movement` — create task **gak** gerakin stok. Stok gerak nanti pas driver delivery (DROP/PICKUP) / walk-in (SALE). Nulis movement di sini = `asset_cache` ke-decrement duluan = **SALAH**.
- ❌ **JANGAN** tulis `event`/audit-ledger — task doc sendiri udah jadi record. (User: tiap aksi bikin event = kebanyakan log.)
- ❌ **JANGAN** ubah: draft read, `it[]` native write, manifest, validasi, chain, nav, `wizardKey`.
- ❌ **JANGAN** dobel-write (§4).

## 7. Edge case
- **User mundur dari P4 abis generate** → counter `vtl.request` udah naik → nomor loncat. **OK** (di-ACC, gak perlu gap-free). generate idealnya pas submit (`run`), bukan page-load, biar loncat minimal.
- **Draft kosong** → validasi existing jalan duluan (sebelum generate) → error text, counter **jangan** naik.
- **generate_number gagal (backend)** → jangan tulis task dgn tnm kosong; tampilkan `"Gagal membuat task"`, jangan naikin state.

## 8. Test / verifikasi (non-regresi)
1. **Render:** buka P4 → **gak blank**, NUMBER "No. Task: Akan dibuat otomatis" muncul di atas tombol. (semua field plain-string, harusnya aman — kalo blank, laporin: renderer NUMBER/field belum ada.)
2. **Flow existing utuh:** submit dgn draft lengkap → task doc kebentuk + `it[]` bener (kaya sebelum), nav ke success. **Gak boleh berubah/rusak.**
3. **Auto-id:** doc baru = random id (bukan `TASK-...`).
4. **tnm:** field `tnm` = `TASK-2026-0000NN` sequential; `search` = `tnm★` + tnm.
5. **Counter naik** tiap submit sukses; **gak naik** kalo validasi gagal.
6. **1 doc doang** per submit (no dobel dari savesend).
7. **Gak ada** movement / event doc kebikin.

## 9. Rollback
Kalo `action:"savesend"` bikin submit current error (renderer branch on `action` sebelum siap): hapus `action`/`com`/`flag`/`delay` dari 2b → balik ke TASK_CREATE_SUBMIT murni (working state). Semua field plain-string, aman di-revert dari sheet.
