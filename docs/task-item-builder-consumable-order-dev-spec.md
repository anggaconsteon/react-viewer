# TASK_ITEM_BUILDER mode `order` — item consumable harus tampil (jual-putus) (Dev Spec)

**Tanggal:** 2026-07-30
**Buat:** dev Flutter (renderer). Nol kerjaan CF, nol kerjaan sheet — config live udah lengkap.
**Status:** PROPOSED (nunggu dev Flutter)
**Konteks / Konsumen pertama:** wizard "Buat Tugas" langkah 2 — page `vertikaTeknoLokaciptaCreateTaskItem` (op1Screen row 779, widget D782), demo galon VTL tenant `20342033315492`.
**Referensi:** `docs/task-item-picker-search-sort-dev-spec.md` (search+sort builder), `docs/walkin-flutter-dev-spec.md` (mode walkin — punya picker consumable sendiri, JANGAN disamakan), `docs/widget-docs/taskItemBuilder.md`, mockup `src/component/AdminCreateTaskIntegrated.jsx` (`ProductPickerSheet` + `TaskItemCard`).

---

## 1. Kenapa

Live-test 2026-07-30 (demo galon VTL): picker "+ Barang" di Create Task cuma nampilin item `ic◼returnable` (Aqua Galon, Cleo, Galon RO, Galon Isi Ulang). **Aqua 600ml 1 Karton (`ii` 2000000006001, `ic◼consumable`) gak muncul** → order gak pernah bisa bawa barang habis-pakai.

Ini deviasi dari mockup. `ProductPickerSheet` (AdminCreateTaskIntegrated.jsx:1324) filter-nya CUMA `!itemsInTask.includes(p.id)` — **tanpa filter tipe**; item consumable tampil dengan badge kecil, dan card-nya berperilaku jual-putus. Config sheet juga bersih: `TASK_ITEM_BUILDER` D782 gak punya param filter apa pun di `itemTable`. Penyaringan terjadi di renderer.

## 2. Konsep

Satu picker, dua perilaku by `ic` (dibaca dari `itemCatField`):

- **returnable** = galon/tabung pinjaman. Drop + Pickup (Model A/B), saran pickup = drop + outstanding, kondisi `cdo`/`cdi`. (Perilaku sekarang — nol perubahan.)
- **consumable** = barang habis pakai (dus air). **Jual-putus**: qty tunggal → field `ps` (sale), TANPA pickup, TANPA outstanding, TANPA kondisi. Barang gak pernah balik.

Rantai hilir udah siap tanpa sentuhan: manifest muat gudang = `pd+ps+pr` (ps ikut kemuat ke mobil) → driver antar → CF `OnTaskCompleted` branch `tx◼sale` emit movement `SALE` (mobil → keluar sirkulasi). Barang consumable **tidak** nambah saldo customer di asset_cache — total sirkulasinya memang berkurang saat terjual. Itu perilaku benar.

## 3. Kontrak

**NOL field config baru.** Semua mapping udah live di D782 (`itemCatField:"ic"`, `saleField:"ps"`, dst). Kontraknya perilaku renderer:

| Aspek | returnable | consumable |
|---|---|---|
| Muncul di picker | ✅ (sekarang) | ✅ **(fix ini)** — badge = nilai `ic` apa adanya (data-driven, nol string hardcode) |
| Input di card | stepper Drop + Pickup | **stepper qty tunggal** |
| Saran pickup / outstanding | ada | **tidak ditampilkan** (outstanding = 0 selalu) |
| Kondisi `cdo`/`cdi` | ada | tidak ditulis |
| Line yang ditulis ke `it[]` | `tx◼deliver`, `pd`/`pp` | **`tx◼sale`, `ps`=qty** (pd/pp/pb/pr tidak ditulis / 0) |
| Transfer Kepemilikan / Refill toggle | ada | tidak ada (implisit jual) |

## 4. Contoh resolved (LIVE sekarang — tidak berubah)

```json
{"type":"TASK_ITEM_BUILDER","vidtable":"20342033315492","mode":"order","itemTable":"84214220504259//item","itemIdField":"ii","itemNameField":"in","itemCatField":"ic","itemUnitField":"un","waterTypeField":"wt","searchField":"in","searchHint":"Cari produk…","sortField":"freq","sortDir":"desc","outstandingTable":"84214220504259//asset_cache","outstandingSearch":"lt◼client⭘lv◼{kl}","outstandingQtyField":"qt","outstandingCondField":"cd","txTypes":"deliver","writeTarget":"it","dropField":"pd","pickupField":"pp","saleField":"ps","buyField":"pb","refillField":"pr","priceField":"hg","condOutField":"cdo","condInField":"cdi","wizardKey":"admin_create_task","text":"Tambah Item◆Transfer Kepemilikan◆Refill◆Jual◆Beli◆Kosong◆Penuh◆Air RO◆Isi Ulang"}
```

Item konsumen pertama: `item/2000000006001` → `{ii:"2000000006001", in:"Aqua 600ml 1 Karton", ic:"consumable", hrg:45000}`.

## 4b. UI / Layout (dari mockup)

```
Picker "+ Barang":                          Card consumable (setelah dipilih):
┌─ Pilih Item ──────────────────────┐       ┌─ 💧 Aqua 600ml 1 Karton  CONSUMABLE ─┐
│ 💧 Aqua Galon 19 Liter          › │       │ Jual · habis pakai, tanpa kembalian  │
│    ↑ Customer outstanding 3       │       │ Qty  [−] 3 [+]              Hapus    │
│ 💧 Aqua 600ml 1 Karton CONSUMABLE›│       └──────────────────────────────────────┘
│ 💧 Cleo Galon 19 Liter          › │
└───────────────────────────────────┘
```

Badge & label dari data/config (`ic`, `text` ◆-segmen yang ada) — nol string baru hardcode di Flutter.

## 7. Deliverable dev (Flutter)

1. Hapus penyaringan tipe di picker mode `order` — tampilkan semua item aktif dari `itemTable`. **Cek juga**: kalau exclusion-nya ternyata efek `orderBy(freq)` Firestore (doc tanpa field `freq` ke-drop dari query), pindahin sort ke client-side — item tanpa `freq` = 0, tetap tampil (sesuai spec search+sort §2.2).
2. Badge consumable di baris picker (sumber: nilai `itemCatField`).
3. Card variant consumable: qty tunggal → `ps`, line `tx◼sale`; sembunyikan pickup/outstanding/kondisi/toggle.
4. Regression: returnable, mode `walkin`/`supplier`/`seed` tidak berubah.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Picker tampil semua tipe + badge | dev Flutter | ⬜ |
| Card variant consumable (`tx◼sale`, `ps`) | dev Flutter | ⬜ |
| Config sheet D782 | builder | ✅ LIVE, nol perubahan |
| CF (SALE movement, manifest pd+ps+pr, invoice harga dari `item.hrg`) | dev Go | ✅ existing, nol perubahan |

## 10. Not Doing (dan kenapa)

- **Refill Doctrine** (konversi isi→kosong di customer) — deferred, spec terpisah.
- **`pb` (beli) untuk consumable** — gak relevan, barang habis pakai gak dibeli balik.
- **Param config baru** — gak perlu; mapping `ps`/`ic` udah live.
- **Mode walkin** — udah punya jalur consumable sendiri (picker terpisah), jangan disentuh.

## 11. Acceptance

- [ ] Picker Create Task nampilin Aqua 600ml 1 Karton (badge consumable), search + sort `freq` tetap jalan.
- [ ] Pilih consumable → card qty tunggal; TIDAK ada pickup/outstanding/kondisi.
- [ ] Line tersimpan: `tx◼sale`, `ps`=qty, tanpa `pd`/`pp`/`cdo`/`cdi`.
- [ ] End-to-end: order Aqua 600ml ×3 → muat (gudang isi −3, mobil +3) → antar → movement `SALE` → mobil 0, **customer TIDAK nambah**, total sirkulasi item −3.
- [ ] Nol regresi returnable + mode lain; nol string hardcode baru.

## 12. Asumsi & risiko

- [ ] Penyebab pasti exclusion (filter `ic` vs `orderBy(freq)`) belum diverifikasi dari kode Flutter — dev cek dua-duanya (Deliverable #1).
- [ ] `tx◼sale` untuk consumable di order disimpulkan dari mockup walk-in (`addConsumable` → SALE) + branch CF `task_complete`; belum ada contoh order-consumable live.
- [ ] Harga line: builder TIDAK wajib isi `hg` — invoice CF (`DeliveryInvoice`) udah menghargai line dari `item.hrg`. Kalau driver-app butuh tampil harga sebelum invoice, baru bahas lagi.
- [ ] Driver `DeliveryWorkspace` diasumsikan udah render line `tx◼sale` (jalur sale existing dari walk-in/driver) — verifikasi sekali pas test end-to-end.

---

**Referensi:** `docs/task-item-picker-search-sort-dev-spec.md` · `docs/walkin-flutter-dev-spec.md` · `docs/widget-docs/taskItemBuilder.md` · mockup `src/component/AdminCreateTaskIntegrated.jsx` (ProductPickerSheet:1324, TaskItemCard:955) · dict book `1_XHmo5…` tab `item`/`task`
