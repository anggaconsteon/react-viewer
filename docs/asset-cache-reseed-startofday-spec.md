# asset_cache Re-seed — Start-of-Day (demo bootstrap)

**Buat:** agent yang eksekusi seed Firestore.
**Tujuan:** `asset_cache` mobil demo sekarang ke-seed skenario **AKHIR HARI** (full=0, empty=N) → widget `inventoryBucketCard` ("Isi Kendaraan Sekarang") nampil **0 full**. Re-seed ke **AWAL HARI** (full = manifest yang dimuat, empty=0) biar nampil stok full pas custody baru di-confirm.

**Kenapa:** `asset_cache` normalnya **CF-derived**; CF belum deploy → di-hand-seed. Seed lama = end-of-day. Spec ini bikin state awal-hari.

---

## Path & target
- Collection: `MobileTable/20342033315492/tables/84214220504259/asset_cache`
- Mobil demo: **`lv = F621a02a983500`** (plat B 1234 XY · driver Budi `87544551624342`)
- **doc-id (konvensi LIVE sekarang):** `{lv}__{ii}__{cd}` — mis. `F621a02a983500__8886008101138__full`.
  - ⚠️ Ada rencana ganti doc-id → **auto-id** (brainstorm tech-lead), **TAPI BELUM diterapin**. Untuk re-seed ini **PAKAI composite id existing** (biar upsert nimpa doc lama, bukan bikin duplikat).

## Sumber data — JANGAN hardcode qty, baca live
Baca doc `vehicle_check` **opening** mobil ini:
- Collection: `MobileTable/20342033315492/tables/84214220504259/vehicle_check`
- Filter: `cty == "opening"` && `vv == "F621a02a983500"` (ambil `cdt` hari ini / doc terbaru)
- Ambil **`ip[]`** (hitungan confirmed driver). **Fallback `ie[]`** (manifest gudang) kalau `ip` kosong.
- Tiap entry = `{ ii, cd, qt }` (`cd` umumnya `"full"` untuk stok yang dimuat awal hari).

## Transform (per entry ip[]/ie[])
Upsert asset_cache doc id `F621a02a983500__{ii}__{cd}`:
```json
{ "lv": "F621a02a983500", "ii": "{ii}", "cd": "{cd}", "qt": {qt} }
```

## Empty buckets — awal hari = 0
- Set semua doc asset_cache `lv==F621a02a983500` `cd=="empty"` → `qt: 0`, **atau hapus**.
- (Awal hari mobil belum bawa tabung kosong → empty 0.)

## Urutan eksekusi
1. **Cleanup:** hapus / zero SEMUA doc asset_cache existing untuk `lv==F621a02a983500` (skenario end-of-day lama).
2. **Tulis full buckets** dari `ip[]` (/`ie[]`) per transform di atas.
3. Pastiin empty = 0.

## Verifikasi
Buka DriverHome → `inventoryBucketCard` harus nampil **full = qty manifest** (mis. Aqua Galon `8886008101138` = 9 full, LPG 12kg `2000000000123` = 3 full, dst), **empty = 0**.

## Guardrail (penting)
- Ini **BOOTSTRAP DEMO** doang. Begitu **CF asset_cache deploy** → **STOP hand-seed** (CF yang punya asset_cache; hand-seed bakal ketiban CF / dobel).
- asset_cache sebenarnya CF-derived dari `movement` (load `INTERNAL` full → bucket full +). Ref: `docs/driver-runtime-movement-cf-handoff.md`.

## Ref field asset_cache
`{ lv, ii, cd, qt }` — `lv`=stock_location (mobil) · `ii`=item · `cd`=kondisi (full/empty) · `qt`=jumlah. 1 doc per kombinasi `(lv, ii, cd)`.
