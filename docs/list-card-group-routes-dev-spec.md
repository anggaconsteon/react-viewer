# LIST_CARD — `groupBy` hidup + param `groupRoutes` (route per kelompok) (Dev Spec)

**Tanggal:** 2026-08-04
**Buat:** dev Flutter (renderer). Sheet-side nyusul saya (collapse 4 list → 1) setelah renderer landing.
**Status:** PROPOSED
**Konteks / Konsumen pertama:** page `vertikaTeknoLokaciptaAdminTaskList` (op1Screen row 1173) — sekarang 4 LIST_CARD numpuk sebagai workaround; user minta disatukan ter-kategori (keputusan user 2026-08-04, pilih extend LIST_CARD daripada widget baru — reuse-first).
**Referensi:** `docs/admin-task-list-assign-dev-spec.md` (fitur induk), `docs/list-card-universal-dev-spec.md` (LIST_CARD asal), memory `feedback_status_3tier_relabel` (pola groupLabels).

---

## 1. Kenapa

AdminTaskList butuh SATU list task yang ter-kategori per status, tapi **hanya kategori tertentu yang boleh di-tap** (assign): `unassigned`, `load_rejected`, `assigned`. Task `in_execution`/`completed`/`failed` wajib read-only — kalau semua row share satu `route`, task selesai pun bisa masuk flow assign (bug UX, temuan user 2026-08-04). DSL sekarang gak bisa ekspresikan "route beda per kelompok" → 4 list terpisah (rame: 4 header + 4 search).

## 2. Konsep

Dua hal di renderer LIST_CARD:
1. **Hidupkan `groupBy`/`groupLabels`** — param sudah ada di template sejak awal tapi belum pernah dirender (semua usage live `groupBy:""`). `groupBy` terisi → rows dikelompokkan per nilai field, section header dari `groupLabels`, urutan section = urutan `groupLabels`.
2. **Param baru `groupRoutes`** — map `value◼route★value◼route`. Kelompok yang ada di map → rows-nya tappable ke route itu (bawa `routeParams` yang sama). Kelompok di luar map → rows **read-only**. Generic: dipakai list apa pun yang butuh "sebagian kategori actionable".

## 3. Kontrak field

| Param | Isi | Perilaku |
|---|---|---|
| `groupBy` | nama field (mis. `tst`) | kosong = flat list (perilaku sekarang, nol regresi) |
| `groupLabels` | `value◼Label★value◼Label` | label + URUTAN section; nilai di data yang gak ada di labels → section paling bawah, label = nilai mentah |
| `groupRoutes` (BARU) | `value◼route★value◼route` | kelompok di map = tappable; di luar = read-only. **Diabaikan total kalau `groupBy` kosong** (lihat §6 kenapa wajib) |
| `route` | existing | fallback: `groupBy` terisi TAPI `groupRoutes` kosong → semua kelompok pakai `route` (kompatibel) |
| `routeParams` / `badgeField` / `badgeMap` / `searchFields` / `sortField` | existing | tetap jalan per row; search menyaring lintas kelompok; kelompok kosong (0 row) di-hide |

Aturan presisi: nilai `tst` di-compare exact-string. Nol string hardcode di Flutter — semua label dari `groupLabels`.

## 4. Contoh resolved (target konsumen pertama, SESUDAH renderer)

```json
{"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//task","search":"",
 "sortField":"t","sortDir":"desc","groupBy":"tst",
 "groupLabels":"unassigned◼Belum Dijadwalkan★load_rejected◼Ditolak · Perlu Assign Ulang★assigned◼Terjadwal★in_execution◼Berjalan★completed◼Selesai★failed◼Gagal",
 "groupRoutes":"unassigned◼vertikaTeknoLokaciptaAssignVehicle★load_rejected◼vertikaTeknoLokaciptaAssignVehicle★assigned◼vertikaTeknoLokaciptaAssignVehicle",
 "title":"<kn>","subtitle":"<ln>","meta":"<ts>","badgeField":"tst",
 "badgeMap":"unassigned◼Belum Dijadwalkan◼neutral★assigned◼Terjadwal◼ok★in_execution◼Berjalan◼ok★load_rejected◼Ditolak◼warn★failed◼Gagal◼danger★completed◼Selesai◼ok",
 "trailing":"<tnm>","stats":"Task◼","searchFields":"kn◆tnm",
 "route":"","routeParams":"taskVid◼{tnm}",
 "text":"Daftar Task◆Semua order · terbaru di atas◆task◆Cari customer / no. task◆Belum ada task"}
```

## 4b. UI / Layout

```
┌ Daftar Task ── 🔍 Cari customer / no. task ┐
│ BELUM DIJADWALKAN (2)                      │
│  Kopi Kenangan · TASK-2026-000402        › │  ← tappable
│ DITOLAK · PERLU ASSIGN ULANG (1)           │
│  Warung A · TASK-2026-000399             › │  ← tappable
│ TERJADWAL (1)                              │
│  Toko Contoh Jaya · D 2134 FA            › │  ← tappable (pindah mobil)
│ BERJALAN (1)                               │
│  Toko Contoh Jaya · D 2134 FA   [Berjalan] │  ← read-only, TANPA chevron
│ SELESAI (3)  …                             │  ← read-only
└────────────────────────────────────────────┘
```

Read-only = tanpa chevron/ripple, tap = no-op.

## 6. Sheet-side (builder — SAYA, setelah renderer)

- Template `listCard` = Widget!J291, **shared banyak page**. `[GROUPROUTES]` ditambah ke template TAPI usage lama TIDAK langsung di-extend → mereka resolve dengan literal `"groupRoutes":"[GROUPROUTES]"`. **Aman KARENA aturan §3: `groupRoutes` diabaikan saat `groupBy` kosong** — semua usage lama `groupBy:""`. Renderer WAJIB implement aturan itu; tanpa itu, leftover literal jadi bahaya. Usage lama di-extend nyicil pas disentuh.
- Setelah landing: AdminTaskList di-collapse 4 list → 1 (row 1175 = list gabungan, 1176-1178 dikosongkan), window page tetap.

## 7. Deliverable dev (Flutter)

1. Render `groupBy`+`groupLabels` (section, urutan config, kelompok kosong di-hide, nilai tak-terdaftar → bawah).
2. `groupRoutes`: map per kelompok; luar map = read-only (no chevron/ripple); fallback `route` saat map kosong; **abaikan `groupRoutes` saat `groupBy` kosong** (termasuk nilai literal `[GROUPROUTES]`).
3. Regression: semua usage LIST_CARD live (`groupBy:""`) nol perubahan visual/behavior.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| groupBy render + groupRoutes | dev Flutter | ⬜ |
| Template +[GROUPROUTES] + collapse AdminTaskList | builder (saya) | ⬜ nunggu renderer |
| CF / dict | — | nol |

## 10. Not Doing (dan kenapa)

- **Route beda per-ROW dalam satu kelompok** — belum ada kebutuhan; per-kelompok cukup.
- **Split `assigned` jadi "belum muat vs sudah muat" dalam satu groupBy** — `groupBy` satu field, `tr` field lain. Keputusan v1: kelompok `assigned` tetap routed (pindah mobil); guard "sudah muat" = notice di AssignVehicle + validasi keras nyusul di renderer submit (cek `tr` terisi → tolak). Kalau kelak butuh, kandidatnya `groupBy` computed/multi-field — jangan sekarang.
- **Tab / LIST_MULTIPLE_PANEL_CARD retrofit** — dibanding, kalah murah (keputusan user 2026-08-04).

## 11. Acceptance

- [ ] Kasus §4: 1 list, 6 section urut config, 3 section pertama tappable → AssignVehicle bawa `taskVid`, 3 sisanya read-only tanpa chevron.
- [ ] Kelompok 0 row tidak dirender; search menyaring lintas kelompok.
- [ ] `groupBy:""` (semua page live) = nol regresi, `groupRoutes` apa pun diabaikan.
- [ ] `groupBy` terisi + `groupRoutes` kosong = semua kelompok pakai `route` (kompatibel).
- [ ] Nol string hardcode.

## 12. Asumsi & risiko

- [ ] `groupBy`/`groupLabels` benar-benar belum dirender renderer (disimpulkan dari config live yang selalu `""` — dev konfirmasi; kalau ternyata sudah ada, deliverable #1 tinggal verifikasi).
- [ ] Interaksi `stats` (`Task◼`) dengan grouping: hitungan total atau per-section — dev pilih, saran: total di header + count kecil per section.

---

**Referensi:** `docs/admin-task-list-assign-dev-spec.md` · `docs/list-card-universal-dev-spec.md` · memory `feedback_reuse_first_widget`, `feedback_status_3tier_relabel`
