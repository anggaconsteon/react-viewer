# Delta vs Schema Tech Lead — Catatan Revisi

Sumber resmi tetap `docs/firebase-schema-galon.md`. Doc ini = **perubahan yg kita usulkan** di atas schema itu (buat dibawa balik ke tech lead, belum final).

Status: DRAFT — nunggu approve tech lead.

---

## Delta 1 — `tenant_id` jadi PATH, bukan field ✅ RESOLVED
| | |
|---|---|
| Asli | tiap doc punya field `tenant_id` (global rule #1) |
| Putusan | `tenants` udah jadi collection sendiri di kita. Semua collection tech lead masuk SUB di dalam tenant doc → `/tenants/{tid}/movements/...`, `/tenants/{tid}/asset_cache/...`, dst. |
| Efek | field `tenant_id` di tiap doc DIHAPUS (implisit dari path). Security Rule cek tenant dari path, bukan field. |
| Kena | semua collection (jadi subcollection di bawah `tenants/{tid}`) |

Side effect: `asset_cache.cache_id` composite `{tenant}__{loc}__{item}__{cond}` → buang `{tenant}` → `{loc}__{item}__{cond}` (tenant udah di path).

---

## Delta 2 — STOCK_LOCATIONS: buang `home_warehouse_id`
| | |
|---|---|
| Asli | `home_warehouse_id string?` (vehicle-only, opsional) |
| Usul | hapus |
| Alasan | vehicle bisa lintas gudang; `vehicle_checks.warehouse_location_id` udah nentuin gudang balik. Redundant. |

OK, aman. Field emang udah opsional.

---

## Delta 3 — MOVEMENTS: `driver_id` = vid yang scan ✅ RESOLVED
| | |
|---|---|
| Asli | `driver_id string?` FK→users |
| Putusan | `driver_id` = **vid yang SCAN** (id pegawai yg mindai), TETAP nama `driver_id`. BUKAN `user_id`. |
| Penting | **id login ≠ id scan.** Id login (sesi/akun) udah ada di session, terpisah — bukan disimpen di sini. Yg masuk movement = vid yang scan. |

2 id beda yg jangan ketuker:
- **id login** = akun yg masuk app (sesi) — udah ada, dipegang di luar movement
- **`driver_id`** = vid yang scan = pegawai yg mindai item (yg ditulis di movement)

(Opsional, kalau audit butuh: bisa simpen `login_id` juga di movement. Belum diminta.)

---

## Delta 4 — MOVEMENTS: `emitter_runtime` TETAP ✅ RESOLVED
| | |
|---|---|
| Asli | `emitter_runtime string` enum `DRIVER\|VEHICLE\|SUPERVISOR` |
| Putusan | **TETAP ada, gak diubah.** Enum app-asal dipertahanin. |

Ide repurpose jadi id HP/device → batal. Identitas pemindai udah dicover `driver_id` (vid yang scan). `emitter_runtime` balik ke makna asli = app/runtime asal gerakan.

---

## Delta 5 — STOCK_CACHE → `asset_cache` (rename collection)
| | |
|---|---|
| Asli | collection `stock_cache` |
| Usul | rename `asset_cache` (biar kepake aset, bukan stok doang) |
| Alasan | mekanisme ledger→saldo sama buat stok & aset; `items.category returnable` udah handle aset returnable |

OK. Konsisten sama rencana "mau buat asset juga".
Ingat: ini count-based (qty). Kalau aset perlu dilacak per-nomor-seri, butuh tabel `assets` per-unit terpisah (belum di-scope).

---

## Delta 6 — TASKS: `scheduled_date` format di JSON
| | |
|---|---|
| Asli | `scheduled_date string YYYY-MM-DD` |
| Usul | simpen mentah `YYYY-MM-DD`; format tampilan nanti di widget JSON |
| Cara | pakai token format DSL `◀N\|T7\|fmt▶` pas render, bukan simpen string udah-keformat |

OK. Storage mentah, display diformat — bener (jangan simpen string keformat).

---

## Ringkas tabel perubahan
| # | collection | field | aksi | status |
|---|---|---|---|---|
| 1 | SEMUA | `tenant_id` | hapus — tenant ke PATH (`/tenants/{tid}/...`) | ✅ |
| 2 | stock_locations | `home_warehouse_id` | hapus | ✅ |
| 3 | movements | `driver_id` | TETAP nama; arti = vid yang scan (≠ id login) | ✅ |
| 4 | movements | `emitter_runtime` | TETAP (enum app-asal, gak diubah) | ✅ |
| 5 | (collection) | `stock_cache`→`asset_cache` | rename | ✅ |
| 6 | tasks | `scheduled_date` | mentah, format di JSON | ✅ |

Semua delta udah diputus. Tinggal bawa ke tech lead buat ACC final.

---

## Delta 7 — Custody dihitung DRIVER (bukan checker) ✅ RESOLVED
| | |
|---|---|
| Asli | `vehicle_checks` opening/closing oleh `checker` (role=checker) |
| Putusan | yg ngitung muatan = **DRIVER**. (role admin & gudang nyusul nanti, sekarang fokus driver) |

## Delta 8 — TANPA fase, flow penuh sekaligus ✅ RESOLVED (revisi)
Batal dipecah fase. Langsung **flow penuh**: `vehicle_check` (opening custody + closing rekonsiliasi) + `movements` + `tasks` + `evidence` + `asset_cache` + `investigations`. Semua dijelasin sekaligus.
Spec bahasa-bayi flow penuh: `docs/driver-runtime-phase1-driver-babylang.md`.

## Delta 9 — `users` → pakai ulang `workforce` ✅ RESOLVED
| | |
|---|---|
| Asli | collection `users` (user_id, name, role, active) |
| Putusan | **JANGAN bikin `users`.** Pakai collection `workforce` yg UDAH ADA (data orang udah ada). |
| Buang | field `role` & `active` — gak perlu. |
| Bukti live | `tables/{tableVID}/workforce/{doc}` → field `vid`, `search:"vid★…☆sv★…"`, `ev`, `st`, `p`, `ci`, `et`. Driver = sebuah doc workforce, dikunci by `vid`. |

## Delta 10 — Home container = `tables/{tableVID}` (tenant) ✅ RESOLVED
Tenant path Delta 1 = struktur live `MobileTable/{db}/tables/{tableVID}/`. Sibling collection yg udah ada: `event` (ledger universal), `site` (lokasi), `workforce` (orang). Collection galon baru = sibling di bawah `tables/{tableVID}/`.

### Putusan integrasi ✅ RESOLVED
1. **`stock_location` = collection TERPISAH sendiri.** Bukan reuse `site`.
2. **`movement` = collection TERPISAH sendiri.** Bukan numpang di `event`. (`event` tetep ledger audit universal; `movement` ledger stok khusus, robot baca `movement` → `asset_cache`.)

Jadi sibling final di bawah `tables/{tableVID}/`: `workforce`(reuse) · `site`(ada) · `event`(ada) · `item` · `stock_location` · `task` · `movement` · `vehicle_check` · `evidence` · `investigation` · `asset_cache`.
