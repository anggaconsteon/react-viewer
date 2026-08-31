# Adhoc undated + `tdt` di-stamp saat assign (CF auto-stamp) (Dev Spec)

**Tanggal:** 2026-08-04
**Buat:** dev Go (CF — auto-stamp) + dev Flutter (adhoc create drop tdt) + builder (config kecil).
**Status:** PROPOSED (keputusan user 2026-08-04 — ganti model tdt-at-creation)
**Konteks / Konsumen pertama:** demo galon VTL (tenant `20342033315492`). Induk: `admin-task-list-assign-dev-spec.md` (adhoc + assign).
**Referensi:** `docs/admin-task-list-assign-dev-spec.md`, `docs/driver-runtime-reject-unload-cf-spec.md` (pola task document.updated trigger), memory `project_asset_cache_cf`.

---

## 1. Kenapa

Model tanggal kirim (keputusan user 2026-08-04, ganti "tdt di-tulis saat create"):
- **Belum ada mobil = belum tau kapan dikirim.** Task adhoc = pool tanpa tanggal.
- **Udah pilih mobil = dikirim HARI ITU JUGA.** Assign vehicle = commit berangkat hari assign.

Kenapa bukan date picker: di lapangan tanggal sering berubah (client tiba-tiba mau lebih cepat). Assign-on-the-day lebih fleksibel + gak ada tanggal basi.

Masalah implementasi: `tdt` harus di-set **saat assign**, dari surface MANA pun (Daftar Task / home "Tugaskan" coordination / upcoming). Config `tdt◼{today}` di updateEventRow cuma resolve di **RBT savesend** (AssignConfirm/Daftar Task ✓); di **COORDINATION_SIGNAL_LIST inline vehiclePicker** `{today}` TIDAK resolve (test-confirmed 2026-08-04, bikin Tugaskan gagal, di-revert). Jadi butuh mekanisme surface-agnostic = **CF auto-stamp**.

## 2. Konsep

Task berubah dari `tst:unassigned` → `tst:assigned` (dapet mobil) = "berangkat hari ini". CF trigger di transisi itu, **stamp `tdt = midnight hari ini (WIB)`** kalau `tdt` masih kosong. Server-side, gak tergantung token config → assign dari surface mana pun konsisten.

Normal task (dibuat langsung dengan mobil) lahir `tst:assigned` + `tdt` dari create → BUKAN transisi unassigned→assigned → CF gak kena → tdt create-nya aman.

## 3. Kontrak CF (dev Go) — via `OnTaskWrite` konsolidasi (usulan review §A, ACC)

**Arsitektur (ganti "CF ke-3"):** konsolidasi 3 task-trigger jadi 1 `OnTaskWrite` (`document.updated` di `task/{tnm}`) yang dispatch by transisi `tst` — analog OnTenantWrite tapi kunci route = transisi old→new tst, BUKAN coll. Hilangkan 3×-invocation. Lihat §5/§A.
```
transition (oldTst → newTst):
  *                        → "load_rejected" → movement.TaskRejected   (existing, byte-identik)
  *                        → "completed"     → movement.TaskCompleted  (existing, byte-identik)
  unassigned|load_rejected → "assigned"      → movement.TaskAssigned   (BARU — stamp tdt)
```

**Gate assign (pure, pre-I/O) — R3 fix: include reassign-dari-rejected:**
```
after.tst == "assigned"  &&  before.tst ∈ {"unassigned", "load_rejected"}
```
Kenapa 2 state: adhoc (`unassigned`→assigned) DAN "Assign Ulang" task ditolak (`load_rejected`→assigned) dua-duanya = "kirim hari ini" → tdt WAJIB = hari assign (task rejected mungkin masih bawa tdt basi hari kemarin). Task normal lahir `assigned` lewat CREATE (before=nil, bukan updated) → gate gak kena → tdt create aman.

**Handler `TaskAssigned`:**
1. `tdt = ` epoch ms **midnight hari ini WIB** — R2 GOTCHA: `time.Date(y,m,d,0,0,0,0, wibZone).UnixMilli()` dengan Y/M/D dari `time.Now().In(wibZone)`. **JANGAN `now.Truncate(24h)`** (Truncate jalan di UTC → meleset 7 jam → `tdt≠cdt` → task hilang dari manifest Surat Jalan).
2. `Set(ctx, {tdt: <int64>}, MergeAll)` — tulis Number, OVERWRITE (reassign refresh tdt ke hari ini; adhoc-assign set pertama kali). Self-write re-fire → before.tst=assigned → gate gagal → drop (idempotent, gak perlu skip-if-set).

**Field:** `tdt` (epoch ms midnight, byte-match `cdt` manifest — konsumen `vehicle_opening.go stampTrips` match `tdt==cdt`). Nol field baru.

## 4. Perilaku per surface (SESUDAH)

| Assign dari | Nulis | tdt |
|---|---|---|
| Daftar Task (AssignConfirm RBT savesend) | `vv`+`ln`+`tdt◼{today}`+`tst◼assigned` | config set (CF skip, sudah keisi) |
| Home "Tugaskan" (COORDINATION inline picker) | `vv`+`tst◼assigned` (tdt gagal resolve) | **CF stamp** |
| Home Upcoming | idem | **CF stamp** |

Dua-duanya berakhir sama: task `assigned` + `vv` + `tdt` hari ini → muncul di Akan Datang + gudang deteksi.

## 5. Deliverable per dev

**dev Go (CF, aku garap) — konsolidasi `OnTaskWrite` (review §A):**
- Root `task_write_trigger.go`: `OnTaskWrite` — unmarshal, hitung old/new tst, dispatch 3 route (rejected/completed/assigned). Lebur adapter `task_reject_trigger.go` + `task_complete_trigger.go`; `internal/movement.TaskRejected/TaskCompleted` TETAP byte-identik.
- `internal/movement/task_assigned.go`: `TaskAssigned` — stamp tdt midnight-WIB (§3 R2), overwrite MergeAll.
- `deploy.sh`: +`onTaskWrite`; drop `onTaskRejected`/`onTaskCompleted` dari ALL. **Migrasi (preseden onFateWrite→onTenantWrite): post-deploy `gcloud functions delete onTaskRejected onTaskCompleted` (devops) — kalau tidak, dobel-proses.**
- Test: dispatch table (transisi→handler), pure gate assign (4 kombinasi tst), idempotent (re-fire drop), midnight-WIB byte-match cdt.
- Konsolidasi ALL-OR-NOTHING (review §A): tiga-tiganya masuk OnTaskWrite, jangan setengah.

**dev Flutter:** adhoc create **DROP `tdt`** — tulis `tst:unassigned` saja, skip `vv`/`ln`/**`tdt`** (revert §3.2b induk-spec; balik ke skip-tiga-field). Normal task (ada mobil) tetap tulis tdt seperti sekarang.

**builder (config):** AssignConfirm R1190 `tdt◼{today}` BOLEH tetap (CF skip kalau sudah keisi) atau dihapus (biar CF single-source) — pilihan; rekomendasi TETAP (set sinkron, CF backstop). Coordination/Upcoming: JANGAN tambah tdt (gagal). Nol page baru.

## 6. Dictionary
- `task.tdt` = epoch ms tanggal kirim (midnight). Makna diperjelas: **di-set saat assign** (bukan create) untuk task adhoc; create-time untuk task normal. Nol field baru.

## 7. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| CF `OnTaskAssigned` stamp tdt | dev Go (aku) | ⬜ |
| Adhoc create drop tdt (skip vv/ln/tdt) | dev Flutter | ⬜ |
| Config (AssignConfirm tdt opsional; coordination JANGAN tdt) | builder | ✅ current OK |

## 8. Not Doing (dan kenapa)
- **Date picker / pilih tanggal ke depan** — DITOLAK user (tanggal lapangan berubah-ubah; assign-on-the-day lebih fleksibel).
- **CF stamp tdt server-jam-pasti (bukan midnight)** — tdt = tanggal (midnight) biar cocok cdt manifest; jam gak relevan buat trip-date.
- **Backfill task lama** — task adhoc lama (dari model tdt-at-create) sudah punya tdt; gak perlu.

## 9. Acceptance
- [ ] Adhoc create → doc `tst:unassigned`, **TANPA `tdt`** (dan tanpa vv/ln).
- [ ] Adhoc muncul di Daftar Task "Belum Dijadwalkan" + Coordination "menunggu kendaraan"; TIDAK di Akan Datang (belum ada tdt+vv).
- [ ] Assign dari **home "Tugaskan"** → doc `tst:assigned` + `vv` asli + **`tdt` hari ini (CF stamp)** → muncul Akan Datang + gudang deteksi.
- [ ] Assign dari **Daftar Task** → `tdt` keisi (config), CF gak dobel-stamp.
- [ ] Normal task (dibuat dengan mobil) → tdt create-time TIDAK ke-overwrite CF (gate unassigned→assigned gak kena).
- [ ] Re-fire trigger idempotent (tdt sudah keisi → skip).

## 10. Asumsi & risiko
- [ ] Semua surface assign nulis `tst:assigned` di updateEventRow (Daftar Task ✓, coordination ✓, upcoming ✓) — jadi transisi unassigned→assigned selalu kena. Verifikasi coordination memang flip tst (updateEventRow-nya `...⭘tst◼assigned`).
- [ ] `tdt` "kosong" = absent ATAU 0 — handler cek dua-duanya sebelum stamp.
- [ ] Assign lewat tengah malam (assign hari-A, muat hari-B) = tdt hari-A ≠ cdt hari-B → mismatch. Edge, di-terima v1 (assign+muat biasanya sehari).

---

**Referensi:** `docs/admin-task-list-assign-dev-spec.md` (§2 MODEL C, §3.2b — DIREVISI: adhoc drop tdt) · `docs/driver-runtime-reject-unload-cf-spec.md` (pola task-update trigger) · memory `project_asset_cache_cf`
