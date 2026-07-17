# DeliveryWorkspace — Stock-Cap + Actual-Write Dev Spec (DETAILED)

**Untuk:** Flutter dev. **Tanggal:** 2026-06-26. **Widget:** `ITEM_EXECUTION_LIST` (op1Screen page `vertikaTeknoLokaciptaDeliveryWorkspace`, Widget template `J219`).

**Status:** Dev SELESAI build renderer (handle 5 field cap + deserializer toleran). Config 5 field **LIVE lagi di J219** (re-apply 2026-06-26, propagate ke page 1071). Verify di app: widget gak blank + cap jalan (§7). §0 di bawah = riwayat kenapa sempet blank (buat rujukan).

---

## 0. ⚠️ BACA DULU — kenapa widget jadi KOSONG/HILANG

**Gejala:** owner nambah 5 field baru (`dropCapTable`, `dropCapSearch`, `dropCapKey`, `dropCapField`, `capLabel`) ke config `ITEM_EXECUTION_LIST` → seluruh widget **ilang** dari DeliveryWorkspace. Begitu 5 field dicabut → widget balik.

**Akar:** renderer `ITEM_EXECUTION_LIST` sekarang **strict** — kalau ketemu key JSON yang **gak ada di model deserializer-nya**, dia gagal parse dan **drop seluruh widget** (bukan ignore field-nya). Field `ad`/`ap`/`as`/`ab`/`ar` aman karena model udah punya field itu. 5 field cap = ASING buat model → crash → widget hilang.

**Konsekuensi buat lo (dev):** field config **gak akan jalan kalau model-nya belum tau field itu.** Jadi urutannya WAJIB:

1. **Tambah 5 field cap ke model/deserializer** `ITEM_EXECUTION_LIST` (Step 1 di §4) — ini yang bikin widget gak crash lagi.
2. Implement logika cap (Step 2-5).
3. **Baru** field-nya dimasukin ke sheet (config). Idealnya: dev yang masukin ke `J219`, di commit/PR yang SAMA sama kode renderer.

> Selama model belum punya 5 field ini, JANGAN taruh di sheet — app rusak. Spec ini ditulis biar lo bisa tambah model + logika dulu, baru aktifin config.

---

## 1. Masalah bisnis yang dipecahin

Test live: driver custody-count Amidis = **1** (gudang catat 3, selisih −2). CF `OnCustodyConfirmed` nyesuaiin stok mobil → `asset_cache` mobil Amidis **full = 1**. Tapi di DeliveryWorkspace, stepper drop default = **plan = 3**. Driver bisa submit drop 3 → stok mobil `1 − 3 = −2` (minus). **Gak boleh anter lebih dari yang ada di mobil.**

Dua hal yang harus app lakuin:
- **B. Stock-cap** — batasin stepper drop ≤ stok fisik mobil (dari `asset_cache`). **(fokus utama spec ini)**
- **A. Actual-write** — submit nulis angka stepper beneran (`ad`/`ap`/…) ke `task.it[]`, biar CF gak fallback ke plan. (§6, verify — mungkin udah lo kerjain.)

---

## 2. Data model — sumber angka (REAL, dari firebase prod otq-01)

### 2.1 `task.it[]` — sumber ITEM + PLAN (yang udah dibaca widget sekarang)

Task doc (`tnm = {activeTaskVid}`), array `it[]`, contoh 1 line:
```json
{ "ad": null, "ap": null, "cdi": "empty", "cdo": "full",
  "ii": "8886012560310", "in": "Amidis Galon 19 Liter",
  "pd": 3, "pp": 3, "tx": "deliver" }
```
- `ii` = item id (kunci join). `in` = nama. `pd` = plan drop, `pp` = plan pickup.
- `tx` = jenis transaksi (`deliver`/`sale`/`purchase`/`refill`). `cdo`/`cdi` = kondisi keluar/masuk.
- `ad`/`ap` = aktual drop/pickup (null = belum diisi app).

### 2.2 `asset_cache` — sumber STOK MOBIL (untuk cap; widget BELUM baca ini)

Collection `asset_cache`, contoh doc stok mobil Amidis SETELAH custody (driver hitung 1):
```json
{ "lv": "F621a02a983500", "cd": "full", "ii": "8886012560310",
  "qt": 1, "lm": "custodyadj-...-full", "t": 1782441869089 }
```
- `lv` = lokasi (= vehicle id, ini yang `{vehicleId}` resolve ke `F621a02a983500`).
- `cd` = kondisi (`full`/`empty`). Cap drop pakai yang **`full`**.
- `ii` = item id (join ke `it[].ii`).
- `qt` = **saldo stok** (hasil hitung movement). **Ini nilai cap.**

> `asset_cache` = stok yang sama yang dipake "Isi Kendaraan Sekarang" + `VEHICLE_CARGO_SUMMARY` (`cacheTable`/`cacheSearch`). Query-nya identik. Bukan koleksi baru.

---

## 3. Konsep cap — `cap` ≠ `plan` (JANGAN ketuker)

Tiap drop stepper punya 2 batas beda:

| batas | dibanding apa | boleh dilewatin? | efek di UI |
|---|---|---|---|
| **plan** (`pd`) | rencana pengiriman | **BOLEH** (surplus / opportunistic) | warna + status line (Partial/Sesuai/+extra), `[+]` jalan terus |
| **cap** (stok fisik) | `asset_cache` full mobil | **GAK BOLEH** | value clamp, `[+]` di-disable di cap, tampil `capLabel` |

Contoh:
- plan 3, stok (cap) 5 → boleh drop 1..5. Drop 4 = `+1 extra` (surplus, valid). `[+]` mati di 5.
- plan 3, stok (cap) 1 → cap 1. Driver gak bisa drop > 1. `[+]` mati di 1.

**Cuma DROP yang di-cap** (narik full keluar dari mobil). **PICKUP gak di-cap** — pickup = galon kosong dari customer MASUK ke mobil, gak narik stok. Makanya namanya `dropCap*` (drop-only).

---

## 4. Renderer contract — step by step (INI INTI)

### Step 1 — tambah 5 field ke model (WAJIB pertama, biar gak crash)

Di model/deserializer `ITEM_EXECUTION_LIST`, tambah 5 field opsional (nullable, default kosong):

```dart
final String dropCapTable;   // "" = no cap
final String dropCapSearch;  // where-clause DSL
final String dropCapKey;     // join field name
final String dropCapField;   // qty field name
final String capLabel;       // text saat mentok cap, token <max>
```

Parse toleran: kalau field gak ada di JSON → default `""`/null, **jangan throw**. (Sekalian: bikin deserializer ITEM_EXECUTION_LIST toleran terhadap unknown key ke depan, biar nambah field gak pernah nge-blank widget lagi.)

### Step 2 — resolve cap map (sekali per render, sebelum bikin baris)

Kalau `dropCapTable` kosong → **skip semua cap** (perilaku lama, no cap). Kalau ada:

```dart
// dropCapTable  = "84214220504259//asset_cache"
// dropCapSearch = "lv◼{vehicleId}⭘cd◼full"   (◼ = '=', ⭘ = AND)
// dropCapKey    = "ii"
// dropCapField  = "qt"

final search = resolveTokens(dropCapSearch);     // {vehicleId} -> "F621a02a983500"
final rows = await query(dropCapTable, parseWhere(search)); // WHERE lv='F621a02a983500' AND cd='full'
final Map<String,num> capByItem = {
  for (final r in rows) r[dropCapKey] as String : (r[dropCapField] as num)
};
// contoh hasil: { "8886012560310": 1 }
```

`parseWhere`: split by `⭘` (AND), tiap term split by `◼` → `field = value`. `resolveTokens`: ganti `{vehicleId}` (session token, sama yang dipake page lain). Catatan: `{vehicleId}` HARUS ke-resolve di scope DeliveryWorkspace — kalau token gak ke-resolve, JANGAN crash, treat as no-cap + log.

### Step 3 — seed tiap drop stepper = `min(plan, cap)` ← TITIK UTAMA

Pas bikin drop stepper buat item `line`:
```dart
final cap = capByItem[line.ii];                 // null kalau item gak ada di asset_cache / no cap
final plan = line.pd ?? 0;
final initial = (cap == null) ? plan : min(plan, cap);
// plan 3, cap 1  -> initial 1   (BUKAN 3)
// plan 3, cap 5  -> initial 3
// cap null       -> initial 3   (no cap)
```
Default plan TANPA clamp = bug (3 padahal stok 1). Ini yang bikin minus.

### Step 4 — clamp + disable `[+]`

```dart
onIncrement: () {
  if (cap != null && value >= cap) return;       // mentok, no-op
  value = (cap == null) ? value + 1 : min(value + 1, cap);
}
plusDisabled  = cap != null && value >= cap;
minusDisabled = value <= 0;                        // min selalu 0
```

### Step 5 — tampil `capLabel` pas mentok

Pas `cap != null && value == cap`: render `capLabel`, ganti token `<max>` dengan nilai cap.
```dart
// capLabel = "Maks <max> — stok mobil"  -> "Maks 1 — stok mobil"
```
Item dengan `cap == null` (no cap) → jangan tampil capLabel. Status line plan-relative (Partial/Sesuai/Opportunistic/+extra) dari `text` ◆-segment tetap jalan seperti sekarang; capLabel cuma TAMBAHAN saat value == cap.

### Catatan edge

| kasus | perilaku |
|---|---|
| item ada di `it[]` tapi gak ada di `asset_cache` | `cap = 0` → drop ke-stuck 0 (bener: gak ada barang di mobil). **Beda dari no-cap.** |
| `dropCapTable` kosong | no cap, semua stepper bebas (perilaku lama, regression-safe) |
| pickup stepper | TANPA cap, surplus bebas |
| `tx == sale` (`ps`/`as`) atau `refill` keluar (`pr`/`ar`) | juga narik full stock — idealnya di-cap pakai cap yang sama. Prioritas = `deliver` drop dulu. Kalau mau strict: kurangi cap pool buat semua outbound-full di item yang sama |
| `cap` resolve gagal (token/query error) | treat no-cap + log warning, JANGAN blank widget |

---

## 5. Config JSON — full (yang dev masukin ke sheet SETELAH model siap)

5 field, disisipin sebelum `"text"` di `ITEM_EXECUTION_LIST`:

```json
"dropCapTable":"84214220504259//asset_cache",
"dropCapSearch":"lv◼{vehicleId}⭘cd◼full",
"dropCapKey":"ii",
"dropCapField":"qt",
"capLabel":"Maks <max> — stok mobil"
```

Resolved penuh (DeliveryWorkspace, gimana app nerima-nya):
```json
{"type":"ITEM_EXECUTION_LIST","vidtable":"20342033315492","table":"84214220504259//task","search":"tnm◼{activeTaskVid}","itemsField":"it","labelField":"in","planDropField":"pd","actualDropField":"ad","planPickupField":"pp","actualPickupField":"ap","txField":"tx","saleField":"ps","actualSaleField":"as","buyField":"pb","actualBuyField":"ab","refillField":"pr","actualRefillField":"ar","condOutField":"cdo","condInField":"cdi","waterField":"wt","dropCapTable":"84214220504259//asset_cache","dropCapSearch":"lv◼{vehicleId}⭘cd◼full","dropCapKey":"ii","dropCapField":"qt","capLabel":"Maks <max> — stok mobil","text":"Catat aktual · default = rencana, sesuaikan kalau beda◆Drop◆Pickup◆Partial · <kurang> kurang◆✓ Sesuai◆Opportunistic · <value>◆+<extra> extra◆plan◆Returnable◆Consumable◆💡 …◆Jual◆…◆Kosong◆Penuh◆RO◆Isi Ulang"}
```

**Field reference:**

| field | nilai | arti |
|---|---|---|
| `dropCapTable` | `84214220504259//asset_cache` | koleksi sumber stok. `""` = no cap |
| `dropCapSearch` | `lv◼{vehicleId}⭘cd◼full` | WHERE: lokasi=mobil DAN kondisi=full. `◼`='=', `⭘`=AND, `{vehicleId}`=session token |
| `dropCapKey` | `ii` | field buat join `it[].ii` ↔ `asset_cache.ii` |
| `dropCapField` | `qt` | field nilai cap (saldo stok) |
| `capLabel` | `Maks <max> — stok mobil` | label saat mentok; `<max>` = nilai cap |

**Cara apply ke sheet (dev, 1×, di PR yang sama):** edit template `Widget!J219` — sisipin 5 field di atas sebelum `"text":"[TEXT]"`. Sebagai literal (bukan placeholder), jadi propagate ke page otomatis tanpa ubah formula. JANGAN tulis kolom A/E (arrayformula). Verify `op1Screen!D1073` resolve bersih (no `[X]`, JSON valid).

---

## 6. A — Actual-write (verify; mungkin udah jalan)

Submit "Kirim" harus nulis angka stepper ke `task.it[]` **atomik bareng** `tst=completed`. DSL `updateEventRow` di RBT **gak bisa** nulis elemen array → ini WAJIB native write di renderer.

```dart
doc.update({
  'it': updatedItArray,   // tiap line: ad/ap/as/ab/ar = angka stepper (yang UDAH ke-cap §4)
  'tst': 'completed',
  'tce': nowEpochMs,
});
```

Map per `tx`: `deliver`→`ad`,`ap` · `sale`→`as` · `purchase`→`ab` · `refill`→`ar`. (Nama field dari config: `actualDropField` dst.)

**Kritis:** aktual ke-tulis SEBELUM/BARENG `tst=completed` (CF `OnTaskCompleted` trigger di flip `tst`, langsung baca `it[]`). 1 native write = aman. Detail: `item-execution-actual-write-dev-spec.md`.

**Verify:** drop 2, submit → `task.it[].ad == 2`; movement `qt == 2`. Kalau masih null/3 → actual-write belum jalan.

---

## 7. Test — skenario nyata (pakai data lo)

Reset bersih dulu: hapus `movement` + `asset_cache` + `asset_cache_applied` + `asset_cache_monthly`, lalu re-seed. (Hapus `asset_cache` doang gak cukup — movement lama gak ke-apply ulang.)

| # | langkah | expected |
|---|---|---|
| 1 | custody count Amidis = **1** (gudang 3, selisih −2), submit mismatch | `asset_cache` mobil Amidis full `qt=1`; "Isi Kendaraan" = 1 |
| 2 | buka TaskFeed → tap task → DeliveryWorkspace | drop stepper Amidis **seed = 1** (BUKAN 3), `[+]` **disabled**, tampil "Maks 1 — stok mobil" |
| 3 | coba tap `[+]` | gak naik (mentok cap 1) |
| 4 | submit "Kirim" | `task.it[].ad == 1`; movement drop `qt == 1` |
| 5 | balik Home | "Isi Kendaraan" = **0** (1 − 1), GAK minus |

**Regression:** task tanpa custody mismatch (stok = plan), atau `dropCapTable` kosong → stepper jalan normal kaya sekarang (no blank, no cap aneh).

**Verify widget GAK blank:** abis tambah 5 field + model update, buka DeliveryWorkspace → ITEM_EXECUTION_LIST tetap muncul dengan baris item. Kalau blank = model belum nampung 5 field (balik Step 1).

---

## 8. Checklist

- [ ] **Step 1** — 5 field cap masuk model deserializer ITEM_EXECUTION_LIST; parse toleran (widget gak blank lagi)
- [ ] **Step 2** — resolve cap map dari `asset_cache` (query `dropCapSearch`, join `dropCapKey`, ambil `dropCapField`)
- [ ] **Step 3** — seed drop `= min(plan, cap)` (uji plan 3 / cap 1 → seed 1)
- [ ] **Step 4** — `[+]` disabled di `value == cap`; clamp
- [ ] **Step 5** — `capLabel` + token `<max>`
- [ ] pickup stepper TANPA cap
- [ ] `dropCapTable` kosong = no cap (regression)
- [ ] item gak di asset_cache → cap 0 (drop stuck 0)
- [ ] **A** actual-write: submit nulis `ad/ap/...` ke `it[]` atomik + `tst=completed`
- [ ] config 5 field masuk `Widget!J219` di PR yang SAMA sama kode renderer
- [ ] test §7 end-to-end: custody 1 → seed 1 → submit qt 1 → Isi Kendaraan 0
- [ ] verify widget gak blank abis config aktif

---

## 9. History

- v2.0 (2026-06-26) — Ditulis ulang DETAIL. Akar widget-blank (renderer strict reject unknown key) + fix urutan (model dulu, config belakangan, 1 PR). Pseudocode Step 1-5, data shape real (asset_cache lv/cd/ii/qt + task it[]), test pakai scenario custody-1 nyata.
- v1.1 (2026-06-26) — Koreksi target widget ke ITEM_EXECUTION_LIST J219. Config sempat baked lalu revert (bikin widget blank).
- v1.0 (2026-06-26) — Draft awal (target widget salah: executionStepper/itemExecutionRow).
