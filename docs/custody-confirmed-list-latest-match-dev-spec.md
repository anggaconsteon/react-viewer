# CUSTODY_CONFIRMED_LIST — ambil doc TERBARU saat search match > 1 (Dev Spec)

**Tanggal:** 2026-07-31
**Buat:** dev Flutter (renderer). Nol kerjaan CF; sheet 1 fix sudah LIVE (lihat §3).
**Status:** PROPOSED
**Konteks:** live QA demo galon VTL — hari multi-trip (1 mobil, banyak trip per tanggal).

## 1. Kenapa

`CUSTODY_CONFIRMED_LIST` load `vehicle_check` pakai `search` equality (`cty⭘vv⭘cdt◼{today}`). `{today}`/`cdt` itu per-TANGGAL — di hari multi-trip, SEMUA check hari itu match, dan renderer ambil match pertama (urutan doc-id, acak secara semantik) → list kadang nampilin `ip[]` trip yang sudah lewat. Keluarga bug yang sama sudah difix di CF (`cddc3c6`) dan di config beberapa tombol (`rt★pending` / `cst★awaiting_custody`).

## 2. Kontrak

Saat `search` match lebih dari 1 doc: **pilih doc dengan `t` terbesar** (write terbaru), bukan first-match. Berlaku minimal untuk `CUSTODY_CONFIRMED_LIST`; disarankan jadi aturan umum semua keyed single-doc load (WORKSPACE_HEADER, DETAIL_CARD, PRN keyed, dst) — ambiguitas tanggal ini bakal kejadian lagi di tempat lain.

## 3. Konsumen & status per page

| Page | Widget search | Status |
|---|---|---|
| `vertikaTeknoLokaciptaCustodySuccess` (row 652, D655) | `cty◼opening⭘vv⭘cdt⭘cst◼awaiting_custody` | ✅ SUDAH difix config 2026-07-31 (cst awaiting unik per mobil) — renderer fix jadi lapisan kedua |
| `vertikaTeknoLokaciptaWarehouseClosingMatch` (row 744) | `cty◼closing⭘vv◼{activeVehicle}⭘cdt◼{today}` | ❌ doc closing TIDAK punya field pembeda (no cst/rt) — **hanya bisa renderer** (max `t`) |

Alternatif jangka panjang (opsional, lebih presisi): `CUSTODY_COUNT_SUBMIT` meneruskan id check yang barusan ditulis sebagai route token → list load by id. Lebih besar kerjaannya; max-`t` sudah menutup kasus nyata.

## 11. Acceptance

- [ ] Hari dengan ≥2 closing di mobil yang sama: ClosingMatch nampilin `ip[]` closing yang BARUSAN disubmit.
- [ ] CustodySuccess nampilin hitungan trip aktif (bukan trip pagi).
- [ ] Match tunggal = perilaku sekarang (nol regresi).
