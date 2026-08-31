# TASK_FEED_LIST + ROUTE_FEED_HEADER — exclude task `load_rejected` (Dev Spec)

**Tanggal:** 2026-07-31
**Buat:** dev Flutter (renderer). Nol kerjaan sheet/CF.
**Status:** PROPOSED (nunggu dev Flutter)
**Konteks / Konsumen pertama:** page `vertikaTeknoLokaciptaTaskFeed` (op1Screen row 676) — demo galon VTL; berlaku juga untuk feed driver Consteon (widget yang sama).
**Referensi:** `docs/driver-task-feed-p10-dev-spec.md` (feed asli), `docs/driver-runtime-reject-unload-cf-spec.md` (reject flow), `docs/driver-route-progress-header-dev-spec.md`.

---

## 1. Kenapa

Live QA 2026-07-31 (trip 2 task, 1 ditolak): task `tst◼load_rejected` **masih tampil** di "Rute Hari Ini" sebagai stop aktif — masuk bucket "Stop Berikutnya" lengkap dengan tombol "Mulai Eksekusi", dan header ngitung drop-nya ("Drop 0/4" padahal harusnya 0/2). Driver bisa mengeksekusi task yang sudah dia tolak → barang yang sudah di-unload CF bakal ke-drop lagi → saldo kacau.

Akar: `groupField:"tst"` — renderer cuma kenal bucket assigned/in_execution/failed/completed; state tak dikenal jatuh ke bucket default, bukan disembunyikan.

Gak bisa dari config: DSL `search` = equality-AND saja (`◼`/`⭘`), tidak ada "≠ load_rejected", dan feed tetap butuh state lain buat bucket Gagal/Selesai.

## 2. Konsep

`load_rejected` = task yang keluar dari trip SEBELUM berangkat (muatannya sudah dikembalikan CF ke gudang). Dia **bukan stop** — bukan pula "gagal" (failed = gagal di lokasi). Semantik, bukan preferensi tampilan → di-skip unconditional di renderer, bukan param config baru.

## 3. Kontrak perilaku (nol field config baru)

| Widget | Perilaku sekarang | Harusnya |
|---|---|---|
| `TASK_FEED_LIST` | `load_rejected` → bucket default "Stop Berikutnya", actionable | **Skip total** — tidak dirender di bucket mana pun |
| `ROUTE_FEED_HEADER` | counter stop + Drop/Pickup ikut ngitung task rejected | **Exclude** dari count stop, Σdrop (`pd`), Σpickup (`pp`), progress |
| Gate "Semua Stop Selesai" | — | Hitung selesai HANYA atas task non-rejected (trip 2 task, 1 ditolak, 1 selesai = semua selesai → tampil CTA "Kembali ke Gudang") |

Status lain (assigned / in_execution / failed / completed) tidak berubah.

## 4. Contoh kasus live (data QA)

Trip `tr:"..."` punya 2 task: `TASK-2026-000390` (Toko Contoh Jaya, assigned) + `TASK-2026-000391` (Kopi Kenangan, `load_rejected`). Expected: list = 1 stop (Toko Contoh Jaya), header "0 / 1 stop · Drop 0/2 · Pickup 0/0". Setelah 000390 selesai → banner "Semua Stop Selesai".

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Skip `load_rejected` di list + counter + gate selesai | dev Flutter | ⬜ |
| Config sheet | — | ✅ tidak berubah |
| CF | — | ✅ tidak berubah (unload + manifest sudah benar) |

## 10. Not Doing (dan kenapa)

- **Bucket "Ditolak" yang tampil read-only** — belum ada kebutuhan; driver tidak perlu lihat task yang dia tolak (admin yang reschedule). Kalau nanti perlu, baru jadi param (`showRejected`).
- **Param `hideStates` generik** — YAGNI; rejected itu semantik tetap, bukan preferensi per-page.

## 11. Acceptance

- [ ] Task `load_rejected` tidak muncul di bucket mana pun di TASK_FEED_LIST.
- [ ] ROUTE_FEED_HEADER: count stop + Drop/Pickup exclude rejected (kasus §4 = "0/1 stop · Drop 0/2").
- [ ] Trip yang task non-rejected-nya selesai semua → banner "Semua Stop Selesai" muncul walau ada task rejected.
- [ ] Nol regresi bucket assigned/failed/completed; nol string hardcode baru.

## 12. Asumsi & risiko

- [ ] Nilai state persis `load_rejected` (konsisten dgn CF gate `tst -> load_rejected`); tidak ada variasi lain.
- [ ] Widget home-card "Rute Hari Ini" (DriverHome) diasumsikan filter terpisah — verifikasi sekali pas test (kalau ikut nampilin rejected, perlakukan sama).

---

**Referensi:** `docs/driver-task-feed-p10-dev-spec.md` · `docs/driver-route-progress-header-dev-spec.md` · `docs/driver-runtime-reject-unload-cf-spec.md`
