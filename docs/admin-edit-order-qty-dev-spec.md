# Admin Edit Order Qty + Strict-Mode Driver Lock + Edit Audit (Dev Spec)

**Tanggal:** 2026-08-06
**Buat:** dev Flutter (renderer) + dev Go (CF audit) + builder (config).
**Status:** PROPOSED — **SHELF** (bangun sekarang biar siap; aktif per-tenant pas ada permintaan strict-mode). Keputusan user 2026-08-06.
**Konteks / Konsumen pertama:** galon VTL (tenant `20342033315492`, table `84214220504259`). Non-generic, khusus task galon.
**Referensi:** `op1Screen` DeliveryWorkspace(681) `ITEM_EXECUTION_LIST`, CreateTaskSummary(795) `TASK_CREATE_SUBMIT`, AdminTaskList(1173), CF `task_write_trigger.go` (`OnTaskWrite`), `internal/movement/vehicle_opening.go` (ie[] manifest), dict book, memory `project_driver_return_pindah_fixes`.

---

## 1. Kenapa

Debat manajemen: **siapa boleh ngubah qty drop** — admin doang apa driver juga. Dua mode dibutuhin sebagai **opsi per-tenant**:
- **Fleksibel** (SEKARANG, udah jalan): driver catat aktual (`ad`), order (`pd`) tetep, admin reconcile. Offline-aman.
- **Ketat** (BARU): driver **gak boleh** ubah drop; kalo customer minta beda → driver chat/call admin → **admin edit order** → driver refresh → kirim. **Wajib online** (disepakati user 2026-08-06).

Mode Ketat butuh 3 hal yang belum ada: (a) **kunci drop di driver**, (b) **layar admin edit qty order** (sekarang admin cuma bisa BIKIN, belum EDIT), (c) **audit** perubahan (5→4 siapa/kapan/kenapa) — karena overwrite `pd` NGILANGIN order asli.

**Constraint keras (ditemukan sesi ini):** `it[]` = array; **config-DSL (updateEventRow/addToEvent) GAK BISA nulis array**. Makanya bikin task aja pake widget khusus `TASK_CREATE_SUBMIT`, bukan DSL. Jadi **edit `it[]` WAJIB lewat renderer** (Flutter) — bukan pilihan, emang batasan sistem.

**Audit di CF, bukan client (tech-lead call):** Go nulis array native (gak kena batasan DSL), server otoritatif (client gak bisa skip/boong audit dirinya), 1 write atomik. Pola CDC (change-data-capture).

## 2. Konsep

3 potong + 1 companion:
1. **Saklar kunci** (driver): `ITEM_EXECUTION_LIST` +flag `editDrop`/`editConsumable`. `false` → field jadi read-only (ikut `pd`). Per-tenant.
2. **Admin Edit Order** (Flutter): `TASK_EDIT_SUBMIT` = sodara `TASK_CREATE_SUBMIT` mode edit — pre-fill `it[]` task existing, admin sesuaikan qty, overwrite `it[]` + stamp `led`/`ler`/`ledt`. Bukan bikin task baru.
3. **CF audit** (Go): `OnTaskWrite` +cabang diff `pd`/`ps`/`pp` old vs new → tulis 1 doc `order_edit_log` (array `changes[]`). Murni pencatat, nol cascade.
4. **Surat jalan 2 kolom** (config, companion — berlaku dua mode): PRN cetak **Dipesan (`pd`) + Diterima (`ad`)**.

## 3. Kontrak per komponen

### 3.1 Saklar kunci driver — `ITEM_EXECUTION_LIST` (Flutter + config)
Tambah param:
| field | isi | default |
|---|---|---|
| `editDrop` | `"true"`/`"false"` — boleh +/− drop | `"true"` (fleksibel = sekarang) |
| `editConsumable` | `"true"`/`"false"` — boleh +/− sale/consumable | `"true"` |

- `false` → render angka mati (dari `planDropField pd`), **tanpa tombol +/−**, `ad` = `pd` otomatis pas submit. Pickup **selalu** editable (jumlah kosong balik cuma tau di tempat).
- Nilai plain-string (bukan token) → aman ditambah ke widget live (Killer #7).

### 3.2 Admin Edit Order — `TASK_EDIT_SUBMIT` + builder pre-fill (Flutter)
Mirror `TASK_CREATE_SUBMIT` TAPI:
- **Pre-fill** `it[]` dari task (`search tnm◼{editTaskVid}`), bukan wizard draft kosong.
- **Overwrite** task existing (`search tnm`), **BUKAN** create + counter/no-baru.
- **Stamp** `led` (admin vid), `ler` (alasan), `ledt` (epoch edit) barengan.
- Builder (`TASK_ITEM_BUILDER`) mode edit: qty editable + **guard arah** (§3.2a).

**§3.2a Guard timing (renderer):**
| State task | Aturan qty |
|---|---|
| Belum muat (`tr`=="" / gak ada opening) | bebas naik/turun |
| **Udah muat** (`tr` keisi) | **cuma TURUN**, cap = stok mobil (`asset_cache lv◼{vehicleId}⭘cd◼full`, reuse `dropCap` yang udah ada di delivery widget) |
| **Completed** | **blokir total** — gak boleh edit |

### 3.3 CF audit — `OnTaskWrite` cabang baru (Go) [REVISI per CF-REVIEW 2026-08-06]
`document.updated` di task. **Rumah kode: paket baru `internal/orderaudit`** (pure `diffOrder` + `Audit` I/O, pola `internal/reorder`).

**R1 — Penempatan SEBELUM early-return.** `OnTaskWrite` sekarang `if act=="" {return nil}` (sebelum parse path). Edit **gak flip tst** → `act==""` → audit **ketelan** kalo ditaruh di `switch`. Jadi:
```go
act := taskAction(oldTst, newTst)
isEdit := before != nil && strField(after, fieldLedt) != strField(before, fieldLedt)  // R2
if act == "" && !isEdit { return nil }        // early-return kejaga buat UPDATE BIASA
db, tid, tnm, err := parseTaskPath(newVal.GetName())
if err != nil { log; return nil }
if isEdit { if err := orderaudit.Audit(ctx, client, db, tid, tnm, before, after); err != nil { return err } }  // R4
switch act { ... }                            // dispatch tst tetep jalan (independen)
```

**R2 — Gate = `ledt` BERUBAH, bukan led-present.** `led`/`ler`/`ledt` nempel **permanen** sesudah edit pertama → update lain (delivery nulis `ad`) `led` masih keisi → gate `led!=""` lolos (rapuh, cuma keselametan karena "pd kebetulan gak berubah"). Gate bener = **`new.ledt != old.ledt`** (edit BARU, idiom fresh-transition kaya reject/complete/assign). Cek `ledt` (murah) DULU → baru diff `it[]`.

**R3 — Diff WAJIB numeric-tolerant.** `pd/ps/pp` ditulis **String ATAU Number** (addEventRow stringify vs table CRUD native). `old[f] != new[f]` string-compare → `5`(num) vs `"5"`(str) ke-detect beda → **audit palsu** (from:5 to:5). WAJIB `fsdoc.AsInt64(old[f]) != fsdoc.AsInt64(new[f])`.

```
diffOrder(before, after)  → []Change      # PURE, unit-tested penuh
  diff = []
  for ii in (old.it ∪ new.it):            # union by ii (handle item ditambah/dihapus)
    for f in {pd, ps, pp}:                # field ORDER, BUKAN ad/ap (aktual driver)
      if AsInt64(old[f]) != AsInt64(new[f]):                        # R3 numeric-tolerant
        diff.push({ii, in: new.in ?? old.in, field:f,              # nama fallback ke old kalau item dihapus
                   from: AsInt64(old[f]), to: AsInt64(new[f])})
  return diff

Audit(...)  → error                         # I/O, dipanggil cuma kalau isEdit (R2)
  diff = diffOrder(before, after)
  if len(diff)==0: return nil               # ledt berubah tapi qty gak (mis. edit alasan doang) → skip
  id = "edit-" + tnm + "-" + ledt           # deterministik → redelivery = overwrite (idempotent)
  Set order_edit_log/{id} = { erf:tnm, changes:diff (ARRAY native Go),
                              by:led, reason:ler, at:ledt, ts:fmt(ledt,WIB) }
```

**R4 — Error handling:** transient write-err → **`return err`** (Eventarc retry; id deterministik `ledt` = gak dobel; reject/complete re-run idempotent → aman). parse/logic-err → **`log + nil`** (jangan infinite-loop di doc rusak). Audit = catatan penting → condong retry.

- **Cuma diff `pd`/`ps`/`pp`** (order). Delivery=`ad`, reject=`vv/tr`, assign=`tdt`, opening=`tr/dn` → **nol yang nulis pd** (R5 verified) + `ledt` gak berubah → gate R2 skip total. Nol audit palsu.
- **Murni tulis audit** — NOL sentuh asset_cache/movement (jaga "no cascade" §5).
- Deploy = **`onTaskWrite`** (udah pending deploy). CF bisa dibangun+ditest sekarang (pure diff), tapi **IDLE** sampai Flutter nulis `ledt` (aman, gak ganggu apa-apa).

### 3.4 Surat jalan 2 kolom — PRN (config)
Ganti `<LOOP source='it'>` di template PRN DeliveryWorkspace(681):
```
Sekarang: {{item.pd}}                         (1 kolom, order)
Jadi:     Dipesan {{item.pd}}  Diterima {{item.ad}}
```
`ad` kosong (barang pas, gak diubah) → fallback ke `pd` di template (`{{item.ad|pd}}` atau pastiin `ad` selalu ketulis pas submit).

## 4. Contoh resolved (konkret)

**Task TASK-2026-000210 sebelum edit:**
```
it: [ {ii:"8886008101138", in:"Aqua Galon 19 Liter", pd:5},
      {ii:"2000000000192", in:"Cleo Galon 19 Liter", pd:3} ]
```
**Admin edit Aqua 5→4 (Cleo tetep), alasan "customer minta kurang (WA)":**
```
task (overwrite): it[0].pd=4 ; led="admin-budi-vid" ; ler="customer minta kurang (WA)" ; ledt=1754...
```
**CF tulis:**
```
order_edit_log/edit-TASK-2026-000210-1754... = {
  erf:"TASK-2026-000210",
  changes:[ {ii:"8886008101138", in:"Aqua Galon 19 Liter", field:"pd", from:5, to:4} ],
  by:"admin-budi-vid", reason:"customer minta kurang (WA)",
  at:1754..., ts:"06 Aug 2026 · 14:30"
}
```
(Cleo gak masuk changes — gak berubah.)

## 4b. UI / Layout

**Edit Order:**
```
┌──────────────────────────────────────┐
│ ←  Edit Order · Toko Contoh Jaya      │
│    TASK-2026-000210                   │
│ ⚠ Sudah dimuat — qty hanya bisa turun │  (kondisional §3.2a)
│ Aqua Galon 19 Liter   [−]  4  [+]     │
│ Cleo Galon 19 Liter   [−]  3  [+]     │
│ Alasan ubah *  [ customer minta ____ ]│
│         [   Simpan Perubahan   ]      │
└──────────────────────────────────────┘
WORKSPACE_HEADER + TASK_ITEM_BUILDER(pre-fill) + NOTICE_BAR + TXF + TASK_EDIT_SUBMIT
```
**Riwayat Ubah Order:**
```
┌──────────────────────────────────────┐
│ ←  Riwayat Ubah Order · TASK-...210   │
│ Aqua Galon 19 Liter    5 → 4    −1    │
│ Admin Budi · 06 Aug 14:30             │
│ 💬 "customer minta kurang (WA)"       │
└──────────────────────────────────────┘
WORKSPACE_HEADER + LIST_CARD(order_edit_log, search erf◼{tnm})
```
Masuk: AdminTaskList → tap task → tombol "Edit Order" + "Riwayat".

## 5. Dictionary (field baru)
| field | tab | tipe | makna |
|---|---|---|---|
| `task.led` | task | String | last-edit-by (admin vid). Overwrite tiap edit; CF nangkep ke log. |
| `task.ler` | task | String | last-edit-reason (alasan). |
| `task.ledt` | task | Number (epoch ms) | waktu edit; dipake CF buat id audit deterministik. |
| `order_edit_log` (coll baru) | — | doc | audit: `erf`(tnm), `changes[]`({ii,in,field,from,to}), `by`, `reason`, `at`, `ts`. Append-only, immutable. |

## 6. Deliverable per dev

**dev Flutter:**
1. `ITEM_EXECUTION_LIST` honor `editDrop`/`editConsumable` (lock/unlock +/−; false → `ad`=`pd`).
2. `TASK_EDIT_SUBMIT` (mode edit `TASK_CREATE_SUBMIT`): pre-fill it[] dari task, overwrite, stamp led/ler/ledt, skip counter.
3. `TASK_ITEM_BUILDER` mode edit: pre-fill + guard arah (§3.2a, reuse dropCap).

**dev Go (CF):**
4. Paket `internal/orderaudit`: pure `diffOrder` (numeric-tolerant, union-by-ii) + `Audit` I/O → `order_edit_log`. Wiring `OnTaskWrite` (R1 sebelum early-return, R2 gate `ledt`-berubah, R4 retry-transient). Murni audit, nol cascade. Test: diff-detect, per-item, num-vs-string, item ditambah/dihapus, idempotent (`ledt` id), gate `ledt`. Deploy `onTaskWrite`.
   - Dict: daftar `task.led/ler/ledt` + coll `order_edit_log` ke Dictionary book (`1_XHmo5…`) — **cek collision** short-code `led`/`ler`/`ledt`/`erf` ke tab existing dulu.

**builder (config):**
5. Page **Edit Order** + **Riwayat Ubah Order** (reuse WORKSPACE_HEADER/NOTICE_BAR/TXF/LIST_CARD).
6. Saklar `editDrop`/`editConsumable` per-tenant (config value).
7. Surat jalan PRN 2 kolom (§3.4).
8. Tombol "Edit Order"/"Riwayat" di AdminTaskList/task detail.

## 7. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| Saklar kunci drop/consumable | dev Flutter + builder | ⬜ |
| TASK_EDIT_SUBMIT + builder pre-fill + guard | dev Flutter | ⬜ |
| CF audit-branch → order_edit_log | dev Go | ⬜ |
| Page Edit Order + Riwayat + saklar + SJ 2-kolom | builder | ⬜ |

## 8. Not Doing (dan kenapa)
- **addToEvent support array** — DITOLAK; audit pindah ke CF (Go array native), gak perlu garap DSL.
- **Per-baris N addToEvent (client loop)** — DITOLAK; gak atomik (log separuh), client nyatet dirinya sendiri.
- **Generic edit-widget** — sengaja SPECIFIC task doang (user 2026-08-06). Generalize nanti kalo ada case ke-2 (edit nota dll).
- **Offline strict-mode** — DITOLAK; strict mode WAJIB online (disepakati).
- **CF recompute ie[] pas pd edit** — TIDAK; edit sesudah-muat = residu balik pas closing (udah konsisten via fisik; asset_cache/movement gak kesentuh — analisis sesi 2026-08-06).

## 9. Acceptance
- [ ] `editDrop:"false"` → drop read-only, `ad`=`pd`, pickup tetep editable.
- [ ] Admin Edit Order sebelum muat → pd berubah bebas; sesudah muat → cuma turun, cap stok mobil; completed → keblokir.
- [ ] Edit Aqua 5→4 → task `it[0].pd=4` + `led`/`ler`/`ledt` keisi.
- [ ] CF tulis 1 `order_edit_log` isi `changes:[{Aqua,5→4}]` (Cleo gak masuk). Edit 2 item → changes 2 elemen, 1 doc.
- [ ] Gate `ledt` (R2): delivery/reject/assign (`led` leftover, `ledt` sama) → NOL audit.
- [ ] Edit alasan doang (qty gak berubah, `ledt` berubah) → NOL audit (diff kosong).
- [ ] Numeric-tolerant (R3): `pd` String vs Number (5 vs "5") → NOL audit palsu.
- [ ] Redelivery event edit → gak dobel audit (id `edit-{tnm}-{ledt}` deterministik).
- [ ] Transient write-err → retry sampai keTulis (R4); doc rusak → nil (gak infinite-loop).
- [ ] asset_cache & movement TIDAK berubah gara2 edit pd (cek balance sebelum=sesudah edit).
- [ ] Surat jalan cetak Dipesan + Diterima.
- [ ] Riwayat nampil semua perubahan per task.

## 10. Asumsi & risiko
- [ ] Driver app **online** pas strict-mode edit (biar refresh keliat pd baru). Offline = di luar scope (disepakati).
- [ ] `TASK_CREATE_SUBMIT` bisa di-extend jadi mode edit tanpa rombak besar (pre-fill + overwrite + skip counter). Kalo ternyata terlalu beda → widget baru `TASK_EDIT_SUBMIT` penuh.
- [ ] `ad` selalu ketulis pas delivery (biar SJ kolom Diterima keisi); kalo cuma ketulis-pas-diubah → template fallback `ad|pd`.
- [ ] Nol konsumen lain nulis `task.pd` selain admin (dicek: delivery=ad, reject=vv/tr, opening=tr/dn — semua bukan pd). Jadi diff-pd = murni admin edit.

---

**Referensi:** DeliveryWorkspace(681) `ITEM_EXECUTION_LIST`/PRN · CreateTaskSummary(795) `TASK_CREATE_SUBMIT` · CF `task_write_trigger.go` `OnTaskWrite` · `vehicle_opening.go` (ie[] snapshot) · memory `project_driver_return_pindah_fixes` · dict book (tab task + coll baru order_edit_log).
