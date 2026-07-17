# Dev Spec — INVENTORY_BUCKET_CARD: hormati `hideZero` (skip item saldo 0)

**Tanggal:** 2026-07-07
**Buat:** Flutter dev (renderer — `INVENTORY_BUCKET_CARD`, DriverHome "Isi Kendaraan Sekarang").
**Bug:** kartu nampilin SEMUA doc `asset_cache` mobil, termasuk yang saldonya 0 → tiap trip nambah barisan item 0/0 (item lama "balik nongol"); pas reject, item trip aktif turun ke 0 dan yang keliatan malah item-item lama → kayak "keganti trip sebelumnya".

---

## 0. Konteks — angka BENER, filter tampilan yang gak ada

Ledger movement + asset_cache udah akurat (verified live 2026-07-07: openload/closeunload/reject-unload/adjustment semua jalan). Doc `asset_cache` **gak dihapus saat saldo 0** (by design — saldo per item+kondisi, kayak rekening 0; Reconcile rebuild dari ledger). Konsekuensi: makin banyak item pernah lewat mobil = makin banyak doc 0 → semua ke-render.

Kasus reproduksi: 1 trip 1 task → sebelum reject kartu bener (1 item) → reject → CF unload (item → 0, BENER) → kartu malah nampilin item-item lama saldo 0.

## 1. Config live (resolved, DriverHome — `hideZero` UDAH dipasang 2026-07-07, renderer belum baca)

```json
{"type":"INVENTORY_BUCKET_CARD", "vidtable": "20342033315492","table":"84214220504259//asset_cache","search":"lv◼{vehicleId}","categoryField":"cd","buckets":"full◼ok⭘empty◼warn","hideZero":"TRUE","gateTable":"84214220504259//vehicle_check","gateSearch":"cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}⭘cst◼custody_confirmed","icon":"[ICON]","text":"Isi Kendaraan Sekarang◆Update otomatis tiap serah-terima (kirim isi, ambil kosong).", "itemTable":"84214220504259//item"}
```

## 2. Fix (renderer, kecil)

`hideZero == "TRUE"` → **skip item yang SEMUA bucket-nya 0** (`full == 0 && empty == 0`; umumnya: semua nilai di `buckets` = 0). Salah satu bucket ≠ 0 → tetap tampil (mis. 0 full / 1 empty tetap nampil — itu info valid: bawa tabung kosong).

- Konsisten sama `PRECONDITION_GATE_CARD` yang udah punya `hideZero` — kalau bisa reuse helper yang sama.
- `hideZero` absen/`FALSE` → perilaku lama (tampil semua) — jangan ubah default, widget lain aman.
- `qt` bisa Number atau String → pakai parse tolerant yang sama dengan pembacaan qt existing.

## 2b. Berlaku JUGA di closing gudang — `ITEM_EXECUTION_LIST` variant `pivot`

Page `vertikaTeknoLokaciptaWarehouseClosingCheck` ("Hitung fisik turun dari mobil") baca sumber yang SAMA (`asset_cache` `lv◼{activeVehicle}`) → item saldo 0 ikut nongol dan MAKSA checker ngisi hitungan 0-0. Config live (resolved, `hideZero` udah dipasang 2026-07-07):

```json
{"type":"ITEM_EXECUTION_LIST","variant":"pivot","vidtable":"20342033315492","table":"84214220504259//asset_cache","search":"lv◼{activeVehicle}","groupKey":"ii","pivotField":"cd","slots":"full^Penuh~empty^Kosong","valueField":"qt","hideZero":"TRUE","writeField":"ip","joinTable":"84214220504259//item","joinKey":"ii","labelField":"in","catField":"ic","text":"Hitung fisik turun dari mobil◆Ekspektasi◆✓ Sesuai◆Selisih · <delta>◆Returnable◆Consumable"}
```

Aturan skip sama: **semua slot (full+empty) = 0 → item di-skip** dari daftar hitung (dan otomatis gak masuk `ip[]`). Idealnya 1 helper hideZero yang sama dipakai INVENTORY_BUCKET_CARD + ITEM_EXECUTION_LIST pivot + PRECONDITION_GATE_CARD.

> Edge yang disadari & DITERIMA: barang "kejutan" yang turun padahal saldonya 0 (ledger gak tau) jadi gak bisa dicatet lewat daftar ini — kasus itu emang ranah investigation manual, bukan closing count. Jangan bikin affordance tambah-item dulu.

## 2c. Berlaku JUGA di `VEHICLE_CARGO_SUMMARY` (Return Kendaraan "Sisa di Kendaraan")

Page `ReturnVehicle` baca asset_cache `lv◼{vehicleId}` (semua stok mobil) → item saldo-0 (full 0 & empty 0) nongol sebagai "pcs isi 0 · pcs kosong 0". Config live (`hideZero` udah dipasang 2026-07-08, Widget 228 `vehicleCargoSummary` + op1Screen row 691 helper U):

```json
{"type":"VEHICLE_CARGO_SUMMARY","vidtable":"20342033315492","vehicleTable":"84214220504259//stock_location","vehicleSearch":"lv◼{vehicleId}","plateField":"ln","cacheTable":"84214220504259//asset_cache","cacheSearch":"lv◼{vehicleId}","itemTable":"84214220504259//item","itemKey":"ii","nameField":"in","unitField":"un","condField":"cd","fullValue":"full","emptyValue":"empty","hideZero":"TRUE","text":"…"}
```

Aturan sama: `hideZero=TRUE` → skip item yang full 0 DAN empty 0. Item dengan salah satu bucket ≠ 0 (mis. empty 1 = returnable yg mau diserahin) TETAP tampil. Idealnya 1 helper hideZero dipakai INVENTORY_BUCKET_CARD + ITEM_EXECUTION_LIST pivot + VEHICLE_CARGO_SUMMARY + PRECONDITION_GATE_CARD.

## 3. Acceptance

- Mobil dengan riwayat banyak trip: kartu CUMA nampilin item bersaldo ≠ 0. Item trip lama (saldo 0) gak nongol.
- Reject satu-satunya task → kartu kosong / "belum ada muatan" (semua 0) — BUKAN barisan item lama.
- Item 0 full / 1 empty → TETAP tampil.
- Config tanpa `hideZero` → perilaku lama (regresi nol).

---

## 4. ⚠️ ADDENDUM 2026-07-07 sore — dilaporkan "sudah di-develop", RE-TEST MASIH GAGAL. Jawab 3 pertanyaan verifikasi ini.

**Bukti re-test (otq-01, 15:19):** DriverHome "Isi Kendaraan Sekarang" masih nampilin **Amidis Galon 19 Liter 0 full / 0 empty**. Data Firestore-nya SUDAH BENAR:

| doc asset_cache | qt | lm (movement terakhir) |
|---|---|---|
| `F621a02a983500__8886012560310__full` | **0** | `drop-FhqRUlCDztIXtRmX2wJc-8886012560310` |
| `F621a02a983500__8886012560310__empty` | **0** | `closeunload-BAI6lhViaVQyzYimLKKs-8886012560310-empty` |

Dua bucket 0 → implementasi hideZero yang bener HARUS nge-hide item ini. Masih tampil = filter gak nyala di device. Ledger/CF aman (closeunload kebukti di `lm`), config aman (§1, `"hideZero":"TRUE"` resolved live) — sisa jalur renderer.

**3 pertanyaan (jawab sebelum coding ulang):**

1. **Fix-nya ada di build yang ke-install di device test?** Sebutin versi/build number yang include fix vs yang ke-install. ("Sudah di-develop" ≠ sudah ke-deploy ke HP — kasus yang sama pernah kejadian di fix ☆ updateEventRow.)
2. **`hideZero` dibaca sebagai apa?** Config kirim **String `"TRUE"`** (bukan boolean `true`). Kalau kode ngecek `== true` / bool parse → gak pernah nyala. Pembanding yang udah bener: `PRECONDITION_GATE_CARD` baca `hideZero:"TRUE"` string dan jalan — pakai cara baca yang SAMA.
3. **Filternya dipasang di widget mana & ngecek bucket apa?** Harus di `INVENTORY_BUCKET_CARD`, dan kondisi skip = **SEMUA bucket 0** (`full==0 && empty==0`). Cuma cek `full` doang pun kasus Amidis ini harusnya ke-hide (dua-duanya 0) — jadi kalau masih tampil, kemungkinan filternya gak ke-eksekusi sama sekali, bukan salah kondisi.

**Debug 1 reproduce:** log di INVENTORY_BUCKET_CARD pas render — (a) nilai `hideZero` yang kebaca dari config, (b) jumlah item sebelum vs sesudah filter. Langsung keliatan filternya jalan apa nggak.

---

**Referensi:** op1Screen DriverHome resolved (§1), Widget!J202 (template `inventoryBucketCard`), `vehicle-closing-unload-cf-dev-spec.md` (kenapa doc 0 makin banyak & kenapa itu bukan bug ledger), `updateeventrow-star-search-type-dev-spec.md` §5 (preseden "fix dilaporkan masuk tapi build device beda").
