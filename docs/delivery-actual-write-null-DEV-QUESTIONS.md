# Actual-write `it[].ad/ap` masih NULL — pertanyaan ke dev

**Page:** `vertikaTeknoLokaciptaDeliveryWorkspace` (op1Screen row 1071)
**Widget:** `ITEM_EXECUTION_LIST` (Widget!J219)
**Tanggal:** 2026-06-29
**Status:** actual-write **diklaim sudah diimplement**, sempat **berhasil 1×** (`ad=2, ap=1`), sekarang **konsisten null lagi**.

---

## 1. Gejala

Skenario: custody 2 full → DeliveryWorkspace → drop 2, pickup 2 → Kirim.

Hasil: `task.it[0].ad = null`, `ap = null` **setelah** `tst=completed`. CF `OnTaskCompleted` `qt = ad ?? pd = null ?? plan` → pakai plan → "Isi Kendaraan" jadi **−1**.

Sudah dites 2 variasi, **dua-duanya null**:
- **Run A** — stepper TIDAK disentuh (biarkan di seed) → submit → `ad/ap` null.
- **Run B** — tiap stepper disentuh (+1 lalu −1 balik) → submit → `ad/ap` null.

Catatan penting: **pernah berhasil 1× hari ini** (`ad=2, ap=1`) dengan skenario drop 2 / pickup 1. Jadi kode actual-write **ada dan sempat jalan**, tapi sekarang tidak konsisten / tidak menulis.

---

## 2. Yang SUDAH dipastikan benar (bukan ini penyebabnya)

**Config sheet 100% utuh** — sudah diverifikasi live di Widget!J219 dan resolved di page row 1071. Field target actual-write ADA semua:

```json
"planDropField":"pd","actualDropField":"ad",
"planPickupField":"pp","actualPickupField":"ap",
"saleField":"ps","actualSaleField":"as",
"buyField":"pb","actualBuyField":"ab",
"refillField":"pr","actualRefillField":"ar",
"condOutField":"cdo","condInField":"cdi","waterField":"wt",
"search":"tnm◼{activeTaskVid}"
```

Renderer punya semua nama field tujuan (`ad`/`ap`/`as`/`ab`/`ar`) dan tahu doc mana (`search: tnm◼{activeTaskVid}`). **Bug bukan di config — murni renderer.**

---

## 3. Temuan akar (kemungkinan besar): actual-write itu CROSS-WIDGET

Di page yang sama ada **2 widget terpisah**:

| widget | peran |
|---|---|
| `ITEM_EXECUTION_LIST` (child #2) | **stepper drop/pickup hidup di sini** (state-nya) |
| `"Kirim"` `sendButtonGpsWithEvent` (child #7) | **tombol submit** — widget LAIN |

Submit "Kirim" DSL-nya:
```
"action":"savesend", "flag":"delivery-submit",
"updateEventRow":"…//task⭘…⭘search◼tnm★{activeTaskVid}⭘tst◼completed⭘tce◼◀2▶"
```
→ `updateEventRow` cuma flip `tst`+`tce`, **tidak bawa `it[]`**.

**Tidak ada DSL yang menjembatani dua widget ini.** Supaya `ad/ap` tertulis, renderer harus: *saat "Kirim" di-savesend, jangkau state stepper `ITEM_EXECUTION_LIST` yang live → tulis ke `task.it[].ad/ap`*. Ini murni hook renderer, bukan config.

**Hipotesis:** hook actual-write nyangkut ke trigger yang salah (mis. menunggu `submitConfirmSheet`) — sedangkan **page ini TIDAK punya `submitConfirmSheet`**, submit-nya RBT "Kirim" saja. Atau hook membaca state `ITEM_EXECUTION_LIST` dari instance/snapshot yang kosong → tulis null. "Pernah berhasil 1×" = hook kebetulan ke-fire saat state terisi; selebihnya baca kosong.

**Catatan:** `updateEventRow` = sparse-merge keyed-doc (cuma tulis field yang disebut), **tidak me-rewrite `it[]`** → jadi ini **bukan** clobber/tabrakan write. Akarnya hook cross-widget yang tidak jalan.

---

## 4. Pertanyaan (mohon jawab satu-satu, sertakan `file:line`)

1. **Actual-write `it[]` di-hook ke event apa?** Harus = tombol "Kirim" (`sendButtonGpsWithEvent`, `action:savesend`, `flag:delivery-submit`) di DeliveryWorkspace. Page ini **TIDAK ada `submitConfirmSheet`** — kalau hook menunggu confirm-sheet/tombol lain, tidak akan jalan di sini. Konfirmasi titik hook-nya.

2. **Saat savesend, renderer baca state stepper `ITEM_EXECUTION_LIST` dari mana?** Cross-widget — gimana renderer menemukan widget itu di page dan baca nilai stepper live-nya? Kalau state tidak ter-share (instance lain / belum ter-build) → baca kosong → tulis null. Tunjukkan kodenya.

3. **Log saat submit:** isi `updatedItArray` yang ditulis — `ad`/`ap` terisi nilai stepper (2/2) atau null? Tunjukkan log-nya.

4. **`doc.update({it:...})` benar terpanggil + sukses?** Cek Firestore PERSIS setelah submit — `ad` terisi tidak? (Pelototin live: `ad` muncul lalu hilang, atau tidak pernah muncul?)

5. **Urutan write:** native `it[]` write vs `updateEventRow tst=completed` — mana dulu? Idealnya `it[]` tertulis SEBELUM/BARENG flip `tst` (CF trigger di flip `tst`, langsung baca `it[]`).

---

## 5. Acceptance test

Custody 2 full → drop 2, pickup 2 → Kirim:

| sumber | field | harus |
|---|---|---|
| `task.it[0]` | `ad` | **2** (bukan null) |
| `task.it[0]` | `ap` | **2** (bukan null) |
| `task` | `tst` | `completed` |
| `movement drop-…` | `qt` | **2** (bukan plan 3) |
| `movement pickup-…` | `qt` | **2** |
| "Isi Kendaraan" (asset_cache) | full / empty | **0 full / 2 empty** (tidak minus) |

Sekarang: `ad=null`, `ap=null`, `qt=3`, mobil minus.
