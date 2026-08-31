# My Submissions — Head Collection `//submission` (Design)

**Tanggal:** 2026-08-31
**Status:** DRAFT — menunggu review user
**Scope:** Bucket **My Submissions** dari taxonomy `Mobile App — Work & Submission Taxonomy.md` (Downloads). Bucket lain (My Tasks / Pending Approvals / Inbox) di luar scope doc ini — nyusul setelah pola ini terbukti.

---

## 1. Masalah

Menu mobile sekarang 1-menu-per-jenis (My Requests, My Complaints, …) — gak scalable, dan user lapangan (gaptek) bingung harus buka mana. Target: **satu list campur "Kiriman Saya"** — semua yang pernah di-submit user, 1 kiriman = 1 baris, status terkini, tanpa tab, tanpa expand.

Kendala data (hasil audit 2026-08-31):

| Fitur | Nulis ke mana sekarang | Masalah buat feed |
|---|---|---|
| Request (ijin/cuti/lembur/koreksi absen) | `//request` (head keyed, status `dv`) + `//event` row per approve/reject | Event approval `cv` = approver, bukan pengirim |
| Patrol report | `//event` langsung (`ty◼report-patrol`) | Gak ada status; `cv` masih baked demo |
| Incident | `vtl.report-incident` sendiri, **positional** `<1>..<30>` | Bukan event; identitas di posisi `<4>/<5>` = VID proxy |
| Koreksi jam (bottom-sheet) | update `workforce` + jejak `//event` | Gak ada status/nomor |
| Complaint | ❓ belum ketemu di docs repo | Verifikasi sheet live |

Field gak seragam antar fitur (judul: `ttl`/`d`/`<15>`; status: `st`/`dv`/`<3>`; ref: `ref` vs `rf`). Query lintas collection gak mungkin di DSL renderer (AND-only, no join).

## 2. Keputusan desain (disepakati user 2026-08-31)

1. **Feed tunggal campur**, bukan tab per jenis — alasan UX orang lapangan.
2. **`//event` tetap murni historis** (append-only, audit). Feed TIDAK baca event — kalau baca event, request dengan 3 approver muncul 4 baris. Ditolak user.
3. **Collection head baru: `//submission`** — 1 doc = 1 kiriman, status di-merge in place. Ini SATU-SATUNYA tabel baru.
4. **Dirawat config-only** pakai DSL existing: `addToEvent` (append head saat submit) + `updateEventRow` (merge status saat approve/reject/selesai). Multi-write per tombol pakai `◆` multi-doc — udah support beda tabel per blok. **Nol CF, nol fitur renderer baru** (kecuali temuan §8).
5. Doc utama tiap fitur (`//request`, `vtl.report-incident`, …) **tidak diubah** — `//submission` = kartu status tipis (denorm, pola NoSQL biasa).
6. Card list: 4 info (jenis+icon, judul, waktu, status warna), tap → page detail existing. No expand.

## 3. Skema `//submission` (profil 8 kolom)

Char-code reuse kamus addToEvent v0.2 — **tidak ada char-code baru**.

| Kolom | Isi | Dipakai buat |
|---|---|---|
| `fc` | `submission` (marker tetap) | filter query feed |
| `cv` / `cn` | VID + nama **pengirim** (pemilik feed) | query `cv◼{userVid}` |
| `ty` | jenis: `request-leave`, `request-overtime`, `report-incident`, `complaint`, `report-patrol`, `attendance-correction`, … | map icon + label fitur |
| `nm` | nomor submission (REQ-2026-000365, dst) | key merge + routeParams → detail |
| `ttl` | judul manusiawi ("Ijin Sakit 2 hari") | baris 1 card |
| `st` | status kanonik — lihat §4 | warna + label via statusLabels |
| `t` / `ts` | epoch + string waktu submit | sort + tanggal card |
| `d` | ringkasan opsional (baris 2 card) | opsional |

Field approval berjalan (lvl terakhir, siapa yang mutusin) TIDAK disimpan di head — itu urusan `//event` timeline di page detail.

## 4. Kamus `ty` + status (⬜ PERLU APPROVAL USER)

Status kanonik kecil, mengikuti pola 3-tier (warna di theme, label di config `statusLabels` — bukan hardcode Flutter):

| `st` | Tier | Label default (in_ID) |
|---|---|---|
| `waiting` | warn 🟡 | Menunggu |
| `processing` | warn 🟡 | Sedang diproses |
| `approved` | ok 🟢 | Disetujui |
| `done` | ok 🟢 | Selesai |
| `rejected` | danger 🔴 | Ditolak |

Multi-level approval TETAP `waiting` sampai keputusan final (label bisa "Menunggu atasan" — user gak perlu tau L1/L2/L3; detail level ada di page detail).

Label per `ty` (icon + nama fitur) juga via config map di widget — segment `◆`, bukan hardcode.

## 5. Write flow per aksi (pola DSL)

Semua contoh = POLA; string final resolved per page dibikin saat implementasi (wajib embed JSON resolved real per aturan dev-spec).

**Submit (semua fitur)** — tombol existing, `addToEvent` ditambah 1 blok `◆`:

```
addToEvent":
<blok existing (audit //event / doc utama) tetap>
◆
84214220504259//submission
⭘r◼<retention>⭘tablevid◼20342033315492
⭘fc◼submission
⭘ty◼request-leave
⭘nm◼<nomor — sumber sama dgn doc utama>
⭘ttl◼<judul>
⭘st◼waiting
⭘cv◼{userVid}⭘cn◼{userName}
⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
⭘d◼◁N▷
```

**Approve/reject/selesai** — tombol keputusan existing, `updateEventRow` ditambah 1 blok `◆`:

```
updateEventRow":
<blok existing //request⭘search◼nm★{nm}⭘dv◼approve… tetap>
◆
84214220504259//submission
⭘tablevid◼20342033315492
⭘search◼nm★{nm}
⭘st◼approved
```

Approval non-final (L1 dari 3): TIDAK update `//submission` (status masih `waiting`), atau update label saja — keputusan implementasi per flow.

## 6. Feed page "Kiriman Saya"

- 1 page baru op1Screen, widget **LIST_CARD existing** (reuse-first).
- Query: `table◼…//submission` + `search◼cv◼{userVid}⭘fc◼submission`, sort `t` desc.
- Card: icon+label dari map `ty` ◆-segment, `ttl`, `ts`, badge `st` via `statusLabels`.
- `route` + `routeParams◼nm◼{nm}⭘ty◼{ty}` → page detail per jenis (routing per `ty` — cek dulu apakah route bisa conditional per row; kalau tidak, detail page universal DETAIL_CARD).
- Menu: entry "Kiriman Saya" gantiin menu "My X" per jenis secara bertahap.

## 7. Rollout

1. **Request family** dulu (ijin/sakit/lembur/koreksi absen) — nomor + status + approval udah rapi.
2. Complaint (setelah verifikasi §8.1).
3. Incident (tambah blok `◆` submission di addToTable submit existing).
4. Patrol / laporan rutin — masuk feed dengan `st◼done` langsung (gak ada lifecycle).
5. Data lama TIDAK di-backfill — feed mulai terisi dari kiriman baru. (Backfill = CF one-shot, only if diminta.)

## 8. Verifikasi WAJIB sebelum implementasi (blocker)

1. ⬜ **Complaint**: nulis ke collection mana, tombolnya di page mana (cek sheet live 18v3w5YJ).
2. ⬜ **Token `{userVid}`/`{userName}`**: per catatan `customer-namelist-and-creator-token-dev-spec`, belum kebukti resolve di Flutter. Tanpa ini `cv` gak keisi → konsep "punyaku" mati. Test 1 tombol dulu; kalau gagal = dev ask #1.
3. ⬜ **`◆` multi-doc lintas tabel di `updateEventRow`**: user bilang udah support — konfirmasi dengan 1 test write di tombol approve sandbox.
4. ⬜ **Route conditional per row** (`ty` → page detail beda): cek kemampuan routeParams; fallback = DETAIL_CARD universal.
5. ⬜ **Sumber `nm` seragam**: incident pakai autoNumber `<2>`, request pakai `nm` — pastikan tiap fitur punya nomor yang bisa dipakai sebagai key merge.

## 9. Di luar scope (eksplisit)

- Bucket My Tasks / Pending Approvals / Inbox (doc taxonomy §5–7) — desain terpisah setelah ini jalan.
- Badge count di Home — butuh counter; nyusul.
- Perombakan `//event` atau doc utama fitur — tidak ada.
