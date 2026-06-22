# Driver Runtime — Test Flow Walkthrough (bahasa bayi)

Cerita 1 hari Budi anter galon/gas, dipetakan ke **data dummy live di Firestore** (`MobileTable/…/tables/84214220504259/`). Dipakai buat test end-to-end + acuan seed sistematis nanti.

## Data dummy (acuan)
| entitas | nilai |
|---|---|
| driver | **Budi Santoso** · VID `87544551624342` (`{driverVid}`) |
| mobil | **B 1234 XY** · `stock_location.lv` `F621a02a983500` (`{vehicleId}`), `dv`=Budi |
| gudang | **Gudang Bintaro** `F621558e33b612` |
| loader gudang | **Dirgahayu** (`gn`) · `gv` `80883888051110` |
| opening doc | `vehicle_check` cty=opening, `cdt`=`1781715600000` (`{today}`) |
| manifest `ie[]` | Aqua Galon 19L ×9 · LPG 12kg ×3 · Aqua 600ml Karton ×10 (consumable) · LPG 3kg ×6 · LPG 15kg ×2 · Amidis Galon 19L ×3 |
| 3 tugas (`task`) | Honda Bintaro · Mandiri Tower · Indomaret BSD — semua vv=`F621a02a983500`, tdt=today, tst=`assigned` |

---

## FASE 0 — Gudang siapin (UDAH di-seed; app gudang belum ada)
1. Gudang tunjuk Budi + mobil B 1234 XY → mobil `stock_location.dv`=Budi.
2. Dirgahayu muat 6 barang → **opening doc**: `ie[]` manifest, `gn`/`gv`/`ldt`, **`cst`=awaiting_custody**, `ip` kosong.
3. Admin bikin 3 `task` (vv=mobil, tdt=today, tst=assigned).
→ Panggung siap, Budi belum mulai.

## FASE 1 — Budi buka app
4. Scan QR kartu → sesi → app inget Budi (`{driverVid}`).
5. App cari mobil yg `dv`=Budi → B 1234 XY (`{vehicleId}`). `{today}`=epoch-midnight.

## FASE 2 — Home (P4) 🔒 KUNCI
6. Gate cari `vehicle_check` `cty◼opening⭘cst◼custody_confirmed` → GAK ketemu (cst=awaiting) → **KUNCI**.
7. Layar: header (Budi+plat) · kartu KUNING **"Konfirmasi Penerimaan Muatan"** · inventory HIDDEN · stop locked (intip 3 tujuan).
8. Pencet "Konfirmasi Penerimaan" → P5.

## FASE 3 — P5 Notifikasi
9. Banner kuning · kartu plat + **"Dimuat oleh Dirgahayu"** (`gn`) · list 3 tugas · total muatan.
10. Pencet "MULAI KONFIRMASI" → P6.

## FASE 4 — P6 Hitung BUTA (STEP 1/2)
11. Daftar barang muncul, **angka gudang (`ie[].qt`) disembunyiin** (`blind`).
12. Budi hitung fisik (+/−).
13. Pencet "Lihat Catatan Warehouse" → **simpan `ip[]`** (native) ke opening → custodyReveal.

## FASE 5 — custodyReveal (STEP 2/2)
14. Angka gudang (`ie`) vs hitungan Budi (`ip`) disandingin + compare.
15a. **Match** → "Konfirmasi" → `cst=custody_confirmed`, `rs=matched` → **P7**.
15b. **Selisih** → "Lapor Selisih" → simpan `dp[]` (native) → **P8** (catatan+foto) → submit → `cst=custody_confirmed` + `rs=discrepancy_detected` → **P9**.

> Match & selisih **dua-duanya** → `cst=custody_confirmed` (selisih cuma ditandai `rs`). Biar gate 1-equality.

## FASE 6 — Balik Home (P4) ✅ KEBUKA
16. Gate cari `cst◼custody_confirmed` → KETEMU → **BUKA**.
17. Kartu HIJAU "Muatan dikonfirmasi" · **Isi Kendaraan MUNCUL** (`asset_cache`) · rute kebuka + progress.
18. Budi jalan → rute aktif (per-stop `task.tst`). **`cst` TETEP `custody_confirmed`** sepanjang rute (gak maju ke on_delivery).

## FASE 7 — Rute (3 stop)
19. Tiap stop drop/pickup → catat **`movement`** → CF update **`asset_cache`** + isi `ad`/`ap` di `task.it[]`.
20. Semua kelar → "Return Kendaraan" (state per-stop `task.tst`). `cst` masih `custody_confirmed`.

## FASE 8 — Balik gudang (tutup)
21. Sampe gudang → hitung sisa → **closing doc** (`cty=closing`) → `cst=closed`. Selesai.

---

## cst lifecycle (ringkas)
`awaiting_custody` (GUDANG/seed) → `custody_confirmed` (DRIVER @P7/P8, **tetep selama rute**) → `closed` (closing). Fase rute (`on_delivery`/`returning`) = **`task.tst`**, BUKAN cst — biar gate `cst◼custody_confirmed` gak break pas rute. Selisih = `rs=discrepancy_detected`.

## Realita test SEKARANG
- **Cuma P4 yang ke-render** (widget P4 udah dibangun dev). **P5/P6 BLANK** — `VEHICLE_CUSTODY_HEADER`/`CUSTODY_COUNT_LIST`/`CUSTODY_REVEAL` dev masih bikin.
- **Gate fix UDAH di-apply** (J201/J202/J203 + `⭘cst◼custody_confirmed`).
- Test P4 locked↔unlock:
  1. opening `cst="awaiting_custody"` → P4 🔒 (Konfirmasi Penerimaan muncul).
  2. ganti `cst="custody_confirmed"` → P4 ✅ (hijau + inventory + rute).
- **Reset opening sebelum test**: `cst=awaiting_custody`, `ip` kosong, `dp`/`rs` hapus (itu punya closing).

## Catatan
- Header nama tampil "Agenia Demo-7" (J200 `search:""` kosong). Mau jadi Budi → `search:"VID◼{driverVid}"`.
- Dict spreadsheet `vehicle_check`: `ie`/`rs`/`dp` deskripsi masih "closing only" — sekarang dipake di OPENING custody juga (reveal selisih). Perlu update teks deskripsi (belum, biar gak over-touch).
