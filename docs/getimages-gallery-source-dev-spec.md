# GET_IMAGES `source:"gallery"` — ambil screenshot dari galeri (Dev Spec)

**Tanggal:** 2026-07-24
**Buat:** dev Flutter (delta kecil di widget GET_IMAGES existing)
**Status:** PROPOSED
**Konteks / Konsumen pertama:** `RewardHome@1005` row 1009 (`getImages1`) — worker submit **screenshot** postingan IG. Screenshot adanya di GALERI, bukan hasil jepret kamera. Config existing `camera:1` → kamera. Spec induk: `docs/sales-freelance-reward-dev-spec.md`.

---

## 1. Kenapa

Bukti fitur reward = screenshot post IG. Alur kamera (existing) maksa worker moto layar HP sendiri = mustahil/absurd. Butuh picker galeri native.

## 2. Kontrak (delta 1 field)

Tambah field `source` di GET_IMAGES:

```jsonc
{ "type":"GET_IMAGES", ..., "camera":1, "source":"gallery" }
```

| nilai | perilaku |
|---|---|
| (absen) | perilaku sekarang persis (kamera) — **backward compatible, semua page report existing nol perubahan** |
| `"gallery"` | buka picker galeri native (image_picker source gallery) |
| `"both"` | dialog pilih Kamera / Galeri (labelnya dari `text` — jangan hardcode) |

- Kalau ternyata renderer existing SUDAH punya semantik `camera:0` = galeri → kabari, kita pakai itu dan spec ini gugur jadi catatan config doang. [VERIFY] dev.
- Sisanya (folder/filename/imageParameter/max/preview/currentValue) TIDAK berubah — file galeri lewat pipeline upload yang sama, hasil akhirnya URL di form position (dipakai `i◼◁6▷` + CF hash `ih`).

## 3. Permission (klarifikasi user 2026-07-24: ambil dari galeri DEVICE user → wajib runtime permission)

| Platform | Permission | Catatan |
|---|---|---|
| Android 13+ (API 33) | `READ_MEDIA_IMAGES` | atau Photo Picker API (nol permission — rekomendasi kalau image_picker versi baru udah pakai; cek) |
| Android ≤ 12 | `READ_EXTERNAL_STORAGE` | manifest + runtime request |
| iOS | `NSPhotoLibraryUsageDescription` di Info.plist | wajib string alasan |

Perilaku:
- Request permission **saat tombol ditap** (bukan saat app start).
- **Ditolak** → tampilkan pesan dari `text` config (segmen baru, JANGAN hardcode) + jangan crash; ditolak permanen → arahkan ke Settings (pesan dari config juga).
- Kamera path existing (permission kamera) NOL perubahan.

## 6. Sheet-side (builder, setelah renderer live)

Template `getImages1@134` SHARED (ReportPatrol/Daily/Routine + RewardHome) → JANGAN tambah placeholder di situ (Killer #8). Bikin Widget row VARIANT `getImagesGallery` (copy J134 + `"source":"gallery"` baked) → swap B1009 doang. Report pages nol sentuhan.

## 9. Ringkasan

| Bagian | Siapa | Status |
|---|---|---|
| `source` di renderer GET_IMAGES | dev Flutter | PROPOSED ([VERIFY] mungkin camera:0 udah galeri) |
| Widget row `getImagesGallery` + swap B1009 | builder | NUNGGU renderer |

## 11. Acceptance

- [ ] `source:"gallery"` → picker galeri, file keupload pipeline sama, URL masuk position (submit `i` keisi).
- [ ] Permission belum ada → diminta pas tap; ditolak → pesan dari config, no crash; ditolak permanen → arahan ke Settings.
- [ ] Android 13 & Android ≤12 & iOS — tiga-tiganya bisa milih dari galeri.
- [ ] Page report existing (tanpa `source`) → kamera, nol regresi.
- [ ] `max` tetap dihormati (RewardHome max 1).

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` · `docs/payout-list-widget-dev-spec.md` (paket dev yang sama).
