# Dev Spec — `{allClosed}` return-gate (NAV_ACTION_CARD) fix

**Tanggal:** 2026-07-02
**Buat:** Flutter dev (renderer — token computed).
**Bug:** Return card (`NAV_ACTION_CARD` "Return Kendaraan") **gak muncul** di DriverHome walau semua task udah delivered + `DRIVER_STOP_CARD` progress 100%. → driver gak bisa balikin kendaraan ke gudang.

---

## 0. Bukti live (otq-01, 2026-07-02)

Koleksi `task`, mobil `vv=F621a02a983500`, `tdt=1782925200000` — **cuma 2 doc, dua-duanya `tst="completed"`**:

| doc | kn | tnm | tst | tty |
|---|---|---|---|---|
| `Pn3LCvk8ZDycVOxkGWZc` | Mandiri Tower | TASK-2026-000209 | **completed** | delivery |
| `zp942Bv7jxmoA8zDvzER` | Indomaret BSD | TASK-2026-000210 | **completed** | delivery |

Set = 2, dua-duanya kelar, search match (stop card nampil + 100%). **Return card tetep hidden** → `{allClosed}` evaluate **FALSE** padahal semua completed.

---

## 1. Root cause

`NAV_ACTION_CARD` config (`p4-driver-home.json`): `"ready":"{allClosed}"`. `{allClosed}` = token **computed renderer** = "semua stop kelar" (`driverhome-p4-dev-spec.md` §100/105).

Karena semua task `completed` tapi `{allClosed}` false → **renderer gak treat `tst="completed"` sbg kelar.** Kemungkinan besar dia ngecek `tst="closed"` — padahal:
- **Delivery nulis `tst◼completed`** (`p11-delivery-workspace.json`: `updateEventRow …tst◼completed`).
- **`closed` = state GUDANG SETELAH return** (`driver-return-vehicle-p12-dev-spec.md` §7: gudang reconcile return → baru `cst=closed`).

→ **DEADLOCK:** return card butuh "closed", tapi "closed" baru ada **setelah** return. Card gak akan pernah muncul.

---

## 2. Fix — definisi `{allClosed}` yang bener

```
{allClosed} = TRUE kalau: untuk SEMUA task (vv◼{vehicleId} ⭘ tdt◼{today}, EXCLUDE tst=load_rejected),
              tst ∈ { "completed", "failed" }
```

- **`completed`** = delivered (nilai yang delivery tulis). **Ini yang wajib dikenali** — bug utamanya di sini.
- **`failed`** = barang masih di truk (reschedule) → return TETEP boleh (barang balik ke gudang lewat return). Hitung sbg terminal.
- **`load_rejected`** = udah di-unload pas opening → **exclude** dari hitungan (bukan stop aktif).
- **JANGAN** pake `"closed"` — itu punya gudang post-return, bukan driver.

**Konsistensi WAJIB:** `{allClosed}` dan `DRIVER_STOP_CARD` `{closed}/{total}` HARUS pakai definisi "done" yang SAMA (`tst ∈ {completed, failed}`). Bug ini = dua token divergen (stop 100% tapi allClosed false). Idealnya 1 fungsi shared.

---

## 3. Search + type-tolerance (`tdt`)

Search: `vv◼{vehicleId}⭘tdt◼{today}`.

**`tdt` boleh String ATAU Number** — jangan dipaksa satu tipe. Matching di-handle operator `◼` **type-tolerant** (lihat `dsl-eq-type-tolerance-dev-spec.md`). Bukti: doc live `tdt:"1782925200000"` (String) tapi `t:1782960126391` (Number) — campur di 1 doc. Fix operator `◼` = beres system-wide (tdt/cdt/cst/vid/vv), bukan tambal per-field.

> Catatan: return-card ini **bukan** korban tdt-type (search-nya match — stop card jalan). Tapi `tdt` String = instance type-drift yang sama; toleransi `◼` nutup ini + widget lain.

---

## 4. Visibility vs ready (konfirmasi behavior)

`driverhome-p4-dev-spec.md` §105: `NAV_ACTION_CARD` **SEMBUNYI saat pending** (custody belum confirmed), **TAMPIL saat confirmed**, "aktif penuh kalau `{allClosed}`". Sekarang keliatan **hidden total** pas confirmed-tapi-belum-allClosed.

**Konfirmasi desain:** pas confirmed tapi `{allClosed}` false → card **tampil-disabled** (greyed, biar driver tau ada tombol return) atau **hidden**? Rekomendasi: **tampil-disabled** — lebih jelas buat driver. (Kalau existing sengaja hidden, biarin — yang penting pas `{allClosed}` true dia MUNCUL + aktif.)

---

## 5. Acceptance

- 2 task `completed` (kasus bug ini) → return card **muncul + aktif**.
- 1 `completed` + 1 `assigned` → `{allClosed}` false → card disabled/hidden (belum semua kelar).
- ada task `failed` + sisanya `completed` → `{allClosed}` **true** (return boleh, barang failed balik ke gudang).
- ada task `load_rejected` → di-exclude, gak ngeblok `{allClosed}`.
- `tdt` String atau Number → dua-duanya match (operator `◼` tolerant).
- `{allClosed}` dan `DRIVER_STOP_CARD` progress **selalu sinkron** (gak ada "100% tapi return gak muncul").

---

**Referensi:** `p4-driver-home.json` (`NAV_ACTION_CARD` `ready:{allClosed}` + `DRIVER_STOP_CARD` `{closed}/{total}`), `driverhome-p4-dev-spec.md` §100/105, `p11-delivery-workspace.json` (delivery `tst◼completed`), `driver-return-vehicle-p12-dev-spec.md` §7 (`cst=closed` = gudang), `dsl-eq-type-tolerance-dev-spec.md` (operator `◼` tolerant).
