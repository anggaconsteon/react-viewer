# Admin Task List + Adhoc & Assign/Pindah Kendaraan (Dev Spec)

**Tanggal:** 2026-08-03
**Buat:** builder op1Screen (2 page baru — mayoritas reuse) + dev Flutter (1 param kecil). **CF: NOL kerjaan.**
**Status:** PROPOSED (hasil meeting, keputusan user 2026-08-03)
**Konteks / Konsumen pertama:** demo galon VTL (tenant `20342033315492`) — page baru `vertikaTeknoLokaciptaAdminTaskList` + `vertikaTeknoLokaciptaAssignVehicle`; wizard existing `vertikaTeknoLokaciptaCreateTaskVehicle` (op1Screen row 787).
**Referensi:** `docs/driver-runtime-reject-unload-cf-spec.md` (jalur Tolak), `docs/task-feed-exclude-rejected-dev-spec.md`, dict book tab `task`.

---

## 1. Kenapa

Meeting 2026-08-03, dua kebutuhan:
1. **Adhoc**: admin mau bikin task tanpa tahu kapan dikirim → task masuk pool, pas harinya tiba tinggal assign ke mobil, item otomatis ikut kehitung di muatan mobil itu. Plus: admin butuh **daftar semua task per status** (sekarang gak ada sama sekali).
2. **Pindah mobil**: task di B 1234 XY dipindah ke D 2345 X.

Kunci arsitektur yang bikin ini murah: manifest muat = Σ `it[]` semua task `(vv, tdt)` pas opening check. Jadi "item nambah di mobil" itu GRATIS selama assign terjadi **sebelum muat** — nol CF baru.

## 2. Konsep — MODEL C (FINAL, keputusan user 2026-08-04, ganti model A)

**Adhoc = status distinct `tst:unassigned` + `tdt:{today}`, tanpa `vv`.** (Model A "assigned+vv-kosong" DIBATALKAN — bikin adhoc & terjadwal status sama → `groupBy:tst` gak bisa misahin → kepaksa listCard hybrid.)

Kunci yang bikin ini bersih: **gate coordination home itu CONFIGURABLE.** `COORDINATION_SIGNAL_LIST.unassignedGate` diarahkan ke `tst◼unassigned` (config, SUDAH LIVE) → adhoc nongol "Tugaskan" tanpa maksa status. Hasilnya:
- **Daftar Task = PURE `listCardGrouped`** (nol listCard) — `groupBy:tst` misah bersih: `unassigned`→"Belum Dijadwalkan" (tappable assign), `load_rejected`→"Ditolak" (tappable), sisanya read-only. Assign → `tst:assigned` → task PINDAH dari "Belum Dijadwalkan" ke "Terjadwal" otomatis ✓.
- **Home coordination** unassignedGate `tst◼unassigned` → "Tugaskan". Assign nulis `vv◼{vehicleId}⭘tst◼assigned` → adhoc jadi assigned+vv; `tdt` udah ada dari creation → gudang deteksi.
- `unassignedStatus` param = **`unassigned`** (D804) — sinyal enable-gate + nilai `tst` yang ditulis adhoc.

Lifecycle:

```
unassigned ──assign──▶ assigned ──muat/…──▶ in_execution → completed/failed
                          │  ▲
                    (pre-muat: pindah = edit vv)
                          ▼  │
                    load_rejected ──assign ulang──▶ assigned (vv baru)
```

- **Assign** = tulis `vv`+`ln`+`tdt◼{today}`+`tst◼assigned` ke task. Transisi `unassigned→assigned` dan `load_rejected→assigned` **tidak menyentuh gate CF mana pun** (diverifikasi: OnTaskRejected gate `→load_rejected` fresh; OnTaskCompleted gate `→completed`).
- **Pindah mobil pre-muat** = aksi assign yang sama (timpa `vv`/`ln`).
- **Pindah mobil post-muat** = barang fisik harus balik dulu: **Tolak di driver (flow existing, teruji QA 2026-07-31)** → CF unload + manifest mengecil → task jadi `load_rejected` → admin **assign ulang** ke mobil baru → muat normal.

## 3. Kontrak

### 3.1 Status task (dict `task.tst` +1 nilai)

| Nilai | Arti | Siapa yang nulis |
|---|---|---|
| **`unassigned`** (BARU) | dibuat, belum ada kendaraan (TAPI `tdt` hari ini) | submit wizard (§3.2) |
| `assigned` | terjadwal `(vv, tdt)` | assign page / wizard normal |
| sisanya | tidak berubah | — |

Task `unassigned`: `vv`/`ln` **tidak ditulis** (absen), TAPI **`tdt:{today}` DITULIS** (§3.2b KRITIS — tanpa tdt gudang gak deteksi). `kl`/`kn`/`gl`/`it[]` lengkap dari create.

### 3.2 Wizard — kerjaan renderer (dev Flutter, dua titik kecil di jalur yang SAMA)

1. **Hidupkan tap `adhocLabel` di `PICKER_LIST` mode `capture`** — tombol "Ad-hoc / Nanti" SUDAH ter-render di step kendaraan (config live `adhocLabel:"Ad-hoc / Nanti"`, CreateTaskVehicle) tapi tidak bisa di-tap (temuan live 2026-08-04). Tap = kosongkan capture kendaraan di wizard draft + lanjut ke step berikutnya. Template TIDAK butuh param baru.
2. **Param `unassignedStatus` di `TASK_CREATE_SUBMIT`** (config live D804 = `"unassignedStatus":"unassigned"` — MODEL C). Kalau param terisi DAN wizard vehicle kosong → submit menulis `tst` = nilai param (`unassigned`), **skip `vv`/`ln`/`tdt`** (adhoc = tanpa tanggal, §3.2b REVISI; tdt di-stamp CF saat assign). Param kosong/absen = perilaku sekarang (nol regresi).
3. **RELAX enable-gate tombol submit saat adhoc** (temuan live 2026-08-04) — sekarang tombol `TASK_CREATE_SUBMIT` DISABLE dengan label "Lengkapi data dulu" karena gate completeness wajib kendaraan terisi. Kalau `unassignedStatus` terisi → **kendaraan jadi OPSIONAL**: gate cukup butuh customer + item (≥1), tombol aktif walau kendaraan kosong. Tanpa ini, task adhoc mustahil dibuat (gate mati sebelum submit jalan). Ini bagian yang sama dengan #2 — sinyalnya `unassignedStatus`, bukan param gate baru.

### 3.2b — adhoc DROP `tdt` (tdt di-set saat ASSIGN, bukan create) — REVISI 2026-08-04

⚠️ Ini GANTI aturan "adhoc tulis tdt saat create" (keputusan user 2026-08-04). Model final:
- **Adhoc = tanpa tanggal** (belum tau kapan kirim). Create tulis `tst:unassigned` saja, **skip `vv`/`ln`/`tdt`** (skip TIGA field).
- **Assign mobil = kirim hari itu.** `tdt` di-set **saat assign** = hari assign.

Karena `{today}` gak resolve di COORDINATION inline picker (test-confirmed, Tugaskan gagal → di-revert), `tdt`-at-assign di-jamin lewat **CF auto-stamp** (task `unassigned`→`assigned` → stamp `tdt` server-today). Detail: **`docs/task-tdt-on-assign-cf-dev-spec.md`**.

Adhoc tanpa tdt tetap benar di semua tempat: Daftar Task "Belum Dijadwalkan" (`tst◼unassigned`, gak butuh tdt) ✓ · Coordination "menunggu kendaraan" (`tst◼unassigned`) ✓ · TIDAK di Akan Datang (belum ada vv+tdt — memang belum terjadwal) ✓. Setelah assign → tdt ke-stamp → Akan Datang + gudang jalan.

**Fix (WAJIB): adhoc submit tulis `tdt:{today}` (skip `vv`/`ln` SAJA).** Prinsip: **adhoc = task normal, bedanya cuma kendaraan belum dipilih.** Semua field lain (tdt, it[], kl, kn, gl) IDENTIK task biasa. Begitu tdt masuk → home Tugaskan (nulis vv doang) langsung bener (task udah punya tdt) + gudang deteksi + Akan Datang nongol.

### 3.3 Page `AdminTaskList` (builder — full reuse `LIST_CARD`)

`LIST_CARD` over `task`, `groupBy:"tst"`, `groupLabels` + `badgeMap`:
`unassigned◼Belum Dijadwalkan★assigned◼Terjadwal★in_execution◼Berjalan★load_rejected◼Ditolak — perlu assign ulang★failed◼Gagal★completed◼Selesai`
`title:"<kn>"`, `subtitle:"<ln>"`, `meta:"<ts>"`, `searchFields:"kn"`, `route:"vertikaTeknoLokaciptaAssignVehicle"`, `routeParams:"taskVid◼{tnm}⭘taskCustomer◼{kn}"`.

### 3.4 Page `AssignVehicle` (builder — full reuse)

1. `WORKSPACE_HEADER` — load task by `tnm◼{taskVid}` (judul = customer).
2. `vehiclePicker` (existing, search `lt◼vehicle⭘lst◼active`) → capture `{pickedVehicle}`/`{pickedPlate}`.
3. `NOTICE_BAR` warn: "Task yang mobilnya sudah MUAT tidak boleh dipindah dari sini — pakai Tolak di driver dulu."
4. `RBT` "Assign / Pindahkan" — `updateEventRow`:
```
84214220504259//task⭘tablevid◼20342033315492⭘search◼tnm★{taskVid}⭘vv◼{pickedVehicle}⭘ln◼{pickedPlate}⭘tdt◼{today}⭘tst◼assigned
```

## 4b. UI / Layout

```
[AdminTaskList]                          [AssignVehicle]
┌ Daftar Task ─────────────────┐        ┌ Toko Contoh Jaya ── TASK-2026-000401 ┐
│ 🔍 Cari customer             │        │ ⚠ Mobil sudah muat? Tolak dulu.      │
│ BELUM DIJADWALKAN · 2        │        │ Pilih kendaraan:                     │
│  Kopi Kenangan    [Belum]  › │        │  ◉ D 2345 X   ○ B 1234 XY           │
│ TERJADWAL · 1                │        │ [ Assign / Pindahkan ]               │
│  Toko Contoh Jaya [B1234] › │        └──────────────────────────────────────┘
│ DITOLAK · 1                  │
│  Warung A  [perlu assign] ›  │
└──────────────────────────────┘
```

## 7. Deliverable per dev

**dev Flutter (1):** param `unassignedStatus` di `taskCreateSubmit` + tombol "Lewati" di step kendaraan (§3.2).
**builder op1Screen (saya):** 2 page (§3.3-3.4) + tombol Lewati config + entry menu admin — dipasang SETELAH renderer §3.2 landing (page list/assign boleh duluan, config-ahead aman: widget existing semua).
**dev Go:** nol.

## 8. Dictionary

- `task.tst` + nilai `unassigned` (1 baris di tab task).

## 9. Ringkasan kerjaan (update 2026-08-04)

**Widget yang berubah — DEV Flutter (renderer):**

| Widget | Perubahan | Status |
|---|---|---|
| `TASK_CREATE_SUBMIT` | (a) baca `unassignedStatus` → adhoc tulis `tst`=nilai param (`unassigned`), **skip `vv`/`ln`/`tdt`** (adhoc tanpa tanggal, §3.2b REVISI; tdt di-stamp CF saat assign — lihat `task-tdt-on-assign-cf-dev-spec.md`); (b) relax enable-gate: kendaraan opsional saat `unassignedStatus` terisi | ⬜ |
| CF `OnTaskAssigned` | stamp `tdt` server-today pas task unassigned→assigned (surface-agnostic; `{today}` gak resolve di coordination) | ⬜ (dev Go/aku) |
| `PICKER_LIST` (mode capture) | tap `adhocLabel` "Ad-hoc / Nanti" → kosongkan capture kendaraan + lanjut step | ⬜ |
| `LIST_CARD` | `groupBy`/`groupLabels`/`groupRoutes` (untuk "Semua Task" grouped) | ✅ DONE (dev) |

**Widget yang berubah — CONFIG (builder, SUDAH LIVE):**

| Widget / Cell | Perubahan |
|---|---|
| `TASK_CREATE_SUBMIT` D804 | `unassignedStatus:"unassigned"` (MODEL C) |
| AdminTaskList = PURE `listCardGrouped` | groupBy tst; groupRoutes `unassigned◼AssignVehicle★load_rejected◼AssignVehicle`; groups Belum Dijadwalkan/Ditolak tappable, sisanya read-only |
| `COORDINATION_SIGNAL_LIST` D759 | `unassignedGate:"tst◼unassigned"` (dari `tst◼assigned⭘vv◼`) — biar adhoc distinct nongol "Tugaskan" |
| `AssignVehicle` LIST_CARD routeParams Z1184 | token `assignVeh` (bukan `vehicleId` reserved) |
| `AssignConfirm` `sendButtonGpsWithEvent` R1190 | `vv◼{assignVeh}⭘...⭘tdt◼{today}` |
| `UPCOMING_TASK_LIST` | NOL (sempat +tdt, di-REVERT — {today} gak resolve di inline picker) |

**CF:** nol (semua transisi assign tidak kena gate).

## 10. Not Doing (dan kenapa) — keputusan user 2026-08-03

- **Nyusul barang ke mobil yang SUDAH muat** (muat tambahan mid-trip) — fase 2; v1 = assign hanya ke (mobil, hari) yang belum muat; mobil udah jalan → trip berikutnya (multi-trip sehari sudah didukung sejak fix 2026-07-31).
- **Transfer langsung mobil-ke-mobil tanpa via gudang** — gak ada yang menghitung/konfirmasi serah fisik, audit bolong. Selalu via Tolak→gudang→muat ulang.
- **Pilih tanggal kirim ke depan (scheduling)** — v1 assign = kirim `{today}` (sesuai cerita user: assign pas harinya tiba). Datepicker nyusul kalau kebutuhan nyata.
- **Guard app "task sudah muat gak boleh dipindah"** — v1 prosedural (notice bar); guard keras (cek `tr` keisi → blokir) nyusul bareng kerjaan Flutter lain.

## 11. Acceptance

- [ ] Wizard adhoc: pilih "Ad-hoc / Nanti" di step kendaraan → di Review kendaraan "belum dipilih" TAPI tombol submit **AKTIF** (bukan disable "Lengkapi data dulu"), asal customer + item terisi.
- [ ] Wizard: simpan tanpa kendaraan → task `tst◼unassigned`, **tanpa `vv`/`ln`/`tdt`** (adhoc = tanpa tanggal); TIDAK muncul di muatan/rute/Akan Datang. Setelah di-assign → CF stamp `tdt` → baru gudang deteksi.
- [ ] AdminTaskList: semua task tampil ter-grup per status, search by customer.
- [ ] Assign unassigned → `assigned⭘vv⭘ln⭘tdt◼{today}` → muat mobil itu: item task ikut manifest otomatis.
- [ ] Pindah pre-muat (B 1234 XY → D 2345 X) → manifest muat masing-masing benar.
- [ ] Post-muat: Tolak di driver → barang balik gudang (existing) → assign ulang dari grup Ditolak → muat mobil baru → jalan; saldo konsisten end-to-end (total sirkulasi konstan).
- [ ] Transisi assign/re-assign tidak memicu CF apa pun (cek: nol movement baru saat assign).
- [ ] Nol string hardcode di Flutter (label tombol/grup dari config).

## 12. Asumsi & risiko

- [ ] `updateEventRow` (assign) menulis field yang sebelumnya ABSEN di doc: **`vv`/`ln`** pada task unassigned (`tdt` SUDAH ada dari creation §3.2b) — diasumsikan merge biasa; verifikasi sekali di test pertama.
- [ ] Task `load_rejected` di-assign ulang ke mobil yang SAMA di hari yang sama: manifest recompute reject sudah mengeluarkannya dari `ie[]` — muat trip berikutnya menghitung ulang dari nol, aman; tapi belum pernah dites live.
- [ ] `vehiclePicker` capture token (`{pickedVehicle}`/`{pickedPlate}`) — nama token pasti mengikuti implementasi widget live; builder cek pas pasang page.
- [ ] Feed/rute driver tidak menampilkan task `unassigned` — karena filter butuh `tr`/`vv` yang ABSEN di task unassigned (`tdt` ADA, tapi `vv`/`tr` tidak), tapi cek sekali.

---

**Referensi:** `docs/driver-runtime-reject-unload-cf-spec.md` · `docs/task-feed-exclude-rejected-dev-spec.md` · `docs/driver-home-scope-leak-dev-spec.md` (fail-closed token kosong — relevan buat task tanpa vv) · dict book `1_XHmo5…` tab `task`
