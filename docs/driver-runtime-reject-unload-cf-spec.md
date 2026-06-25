# SPEC — Reject (`load_rejected`) → Unload Muatan (mekanisme + best practice)

**Untuk:** session yang pegang `driver-runtime-movement-cf-handoff.md` (Movement CF).
**Status:** DRAFT rekomendasi — beberapa keputusan masih perlu ACC owner (lihat §7).
**Tanggal:** 2026-06-24.
**Konteks parent:** `docs/driver-runtime-movement-cf-handoff.md` §6.

> Aturan owner: JANGAN ngarang — tiap field di sini ditelusur ke `docs/driver-runtime-field-dictionary.md` + dictionary sheet `1_XHmo5…`. Yang belum diputuskan ditandai eksplisit, bukan diasumsikan.

---

## 1. Masalah (gap sekarang)

Flow reject (confirmed owner): Admin assign task → **gudang muat FULL ke mobil** (semua task, via movement `INTERNAL` gudang→mobil) + pilih driver → driver review rute @DriverHome → **tolak** stop yang gak searah. Reject **cuma boleh saat opening**, sebelum `vehicle_check.cst = custody_confirmed`.

Saat ini reject **cuma** flip `task.tst = load_rejected` (app, DSL `updateEventRow`). **Tidak ada turunan apa pun.** Akibatnya:

- `asset_cache` mobil **tidak berkurang** → ledger/cache masih bilang barang task rejected ada di mobil (padahal harus di-unload balik ke gudang).
- `vehicle_check.ie[]` (manifest expected, doc `cty=opening`) **masih hitung semua task** → pas P6 reveal banding `ip` (fisik) vs `ie` (expected), muncul **selisih palsu** (barang rejected dianggap "hilang").

Barang task yang ditolak harus **di-unload** (mobil → gudang): stok mobil turun, manifest `ie[]` turun.

---

## 2. Rekomendasi mekanisme (BEST PRACTICE)

**Reject = aksi app yang menghasilkan 3 efek, semuanya konsisten dgn invariant "movement = SSOT":**

| # | Aksi | Penulis | Turunan |
|---|---|---|---|
| 1 | `task.tst = load_rejected` | **app** (DSL, sudah jalan) | — |
| 2 | **emit movement unload** `mobil → gudang` per item-line full | **app** | → **CF movement yang SUDAH ADA** otomatis: `asset_cache` mobil −, gudang + , plus `asset_cache_monthly`. **ZERO kode CF baru.** |
| 3 | recompute `vehicle_check.ie[]` (doc opening) = Σ task NON-rejected | **app** (lihat §7 kalau mau CF) | manifest expected turun → reveal gak selisih palsu |

**Prinsip:** stok fisik (`asset_cache`) = **movement-derived** (selalu). Manifest plan (`ie[]`) = **task-plan-derived** (bukan fisik) → boleh ditulis app, konsisten dgn aturan "app pegang lifecycle, `asset_cache` doang yang app gak pernah tulis".

### Kenapa app-emit-movement, BUKAN CF recompute `asset_cache` langsung

Opsi (b) di handoff §6 ("CF recompute `asset_cache`/`ie[]` langsung on `tst`-change, tanpa movement") **SALAH untuk `asset_cache`**, alasan menentukan:

- `asset_cache` = Σ semua `movement` (lihat `reconcile.go`). Kalau reject menurunkan `asset_cache` mobil **tanpa** baris movement, maka **reconcile berikutnya akan menghitung ulang dari ledger (yang gak punya unload) → mengembalikan saldo mobil ke nilai lama (naik lagi)**. Perubahan opsi (b) **tidak durable** — ke-revert tiap reconcile.
- Sama untuk `asset_cache_monthly`: tanpa movement, rekap bulanan gak nyatat unload → **drift** dari stok asli.
- Opsi (a) movement-based: unload tercatat di ledger → reconcile, asset_cache, dan monthly **semua konsisten otomatis**, plus jejak audit (siapa/kapan/barang apa) seperti pergerakan stok lain.

> Kesimpulan: untuk **stok**, WAJIB lewat movement. Untuk **`ie[]`** (manifest plan) boleh app-recompute (§7 ada opsi CF kalau mau).

---

## 3. Bentuk movement unload (grounded ke dictionary)

Satu movement **per item-line** yang di-unload (mirip DROP/PICKUP = 1 baris per kondisi). Barang yang dimuat ke mobil itu **FULL** (belum ada tukar tabung saat opening), jadi `cd = full`.

```json
{
  "mt": "INTERNAL",
  "fl": "<task.vv = lv mobil>",
  "tl": "<task.gl = lv gudang>",
  "ii": "<item id>",
  "cd": "full",
  "qt": "<pd + ps + pr untuk line ini>",
  "dv": "<driver yang menolak>",
  "dn": "<nama driver>",
  "mrf": "<task.tnm yang ditolak>",
  "er": "DRIVER",
  "d": "unload: task ditolak (load_rejected)"
}
```

Catatan field:
- **`mt = INTERNAL`** = transfer internal gudang↔mobil (load pakai ini juga, arah gudang→mobil; unload = arah dibalik). Arah ditentukan `fl`/`tl`, BUKAN `mt` — konsisten dgn invariant CF. (Alternatif: enum baru `UNLOAD` untuk audit eksplisit — lihat §7.)
- **`qt = pd + ps + pr`** per line. **Exclude `pb`** (purchase = tabung kosong dari customer, gak dimuat dari gudang → gak ada di mobil saat opening). Sama persis formula `ie[]` di handoff §6.
- `fl = task.vv` (lv mobil), `tl = task.gl` (lv gudang) — keduanya FK ke `stock_location`.
- `mrf = task.tnm` → unload bisa ditelusur ke task yang ditolak.

Efek lewat CF movement yang ada: `asset_cache` `{mobil}__{ii}__full` −qt, `{gudang}__{ii}__full` +qt; `asset_cache_monthly` bulan berjalan ke-update. Idempoten via marker `asset_cache_applied/{mid}` (sudah ada).

---

## 4. Recompute `ie[]` (manifest expected)

`ie[]` di doc `vehicle_check` `cty=opening` untuk trip ini (link trip = `(vv, tanggal)`, bukan FK — lihat handoff §2).

```
ie[] = Σ atas SEMUA task trip ini yang tst ≠ load_rejected:
         per (ii, cd=full): qty = pd + ps + pr        # exclude pb
```

Begitu satu task jadi `load_rejected`, kontribusinya hilang dari Σ → `ie[]` turun → reveal P6 (`ip` vs `ie`) gak lagi selisih palsu.

Penulis `ie[]`: rekomendasi **app** (app sudah nulis `vehicle_check` opening + tahu set task per trip). Kalau owner mau ini CF, lihat §7.

---

## 5. Dampak ke CF yang sudah ada

- **CF movement (`OnMovementCreated`)**: **TIDAK berubah.** Unload = movement biasa → otomatis ke-derive `asset_cache` + `asset_cache_monthly`.
- **`reconcile`**: **TIDAK berubah.** Unload ada di ledger → rebuild tetap benar.
- Tidak ada koleksi baru. `mt=INTERNAL` sudah ada di enum (kalau pilih `UNLOAD`, +1 enum).

---

## 6. Idempotency & edge cases

1. **Double-reject (double-tap):** app HARUS guard — emit unload + recompute `ie[]` **hanya kalau** `tst` belum `load_rejected` (transisi sekali). Kalau gak, dobel unload → stok mobil minus 2×.
2. **Reassign setelah reject:** Admin reassign = set `vv` (mobil lain) + `tst → assigned` (handoff). Karena barang sudah balik ke gudang (unload), reassign WAJIB **emit ulang movement load** `gudang→mobil` untuk mobil baru. Tanpa itu, mobil baru gak punya stok.
3. **Kondisi:** unload selalu `cd=full` (opening, belum ada exchange tabung).
4. **Exclude `pb`:** purchase items gak pernah dimuat dari gudang → jangan di-unload, jangan masukin `ie[]`.
5. **Multi-line task:** 1 movement unload per item-line.

---

## 7. Keputusan OPEN (perlu ACC owner)

| # | Pilihan | Rekomendasi |
|---|---|---|
| D1 | `asset_cache`/stok: app-emit-movement (a) vs CF-recompute (b) | **(a) app-emit-movement.** (b) di-revert reconcile (§2) — jangan. |
| D2 | `ie[]` ditulis app vs CF baru (`onDocumentUpdated` task) | **app** (paling simpel, `ie[]` = plan task, app sudah nulis vehicle_check). CF baru hanya kalau owner mau `ie[]` fully server-derived. |
| D3 | `mt` unload: reuse `INTERNAL` vs enum baru `UNLOAD` | **reuse `INTERNAL`** (no enum baru; arah dari fl/tl). `UNLOAD` hanya kalau butuh laporan/audit eksplisit. |
| D4 | Trigger: app emit movement saat reject (a) vs CF `onDocumentUpdated(task)` (b) | **app emit** (sejalan D1; CF movement yang ada langsung handle). |

Default kalau semua di-ACC: **murni app-side** (emit unload movement + recompute `ie[]`), **0 CF baru**, CF movement existing + reconcile handle stok & monthly. Paling murah, paling konsisten SSOT.

---

## 8. Test cases (buat session CF/app yang implement)

1. **Happy reject:** 1 task (deliver pd=5 full) ditolak → 1 movement `INTERNAL` mobil→gudang qt=5 full → `asset_cache` mobil −5, gudang +5; `ie[]` turun 5; reveal `ip` vs `ie` match (no selisih palsu).
2. **Mixed tx:** task dgn deliver(pd) + sale(ps) + refill(pr) + purchase(pb) → unload qt = pd+ps+pr (pb di-skip); `asset_cache` & `ie[]` turun sesuai.
3. **Idempotent:** reject di-submit 2×  → stok mobil turun **sekali** (app guard transisi `tst`).
4. **Reassign:** reject → unload → Admin reassign ke mobil B → emit load `gudang→mobil B` → stok mobil B benar.
5. **Reconcile aman:** setelah reject+unload, jalankan reconcile → `asset_cache` & `asset_cache_monthly` tidak berubah (unload sudah di ledger).
6. **Post-confirm bukan reject:** kalau `cst=custody_confirmed`, tombol Tolak ke-gate → drop stop = **FailedDelivery** (`tst=failed`, barang tetap di truk, reschedule), BUKAN unload. (handoff §6 constraint.)

---

## 9. Constraint penting

- Reject + unload **hanya saat opening**, sebelum `cst = custody_confirmed`. Setelah confirmed, muatan **LOCKED** → drop stop = **FailedDelivery** (alur lain, barang di truk, reschedule), bukan reject. Tombol Tolak sudah gated `cst◼custody_confirmed`.
- `vv` saat reject **DIPERTAHANKAN** (jangan di-null) — Admin butuh tahu task tadinya di mobil/driver mana buat reassign (handoff + dictionary).
