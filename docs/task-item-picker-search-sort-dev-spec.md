# Dev Spec — Item Picker: Search + Sort by Frekuensi (CreateTask)

**Tanggal:** 2026-07-21
**Buat:** dev Flutter (renderer `TASK_ITEM_BUILDER`) + dev Go (CF `asset_cache`).
**Konteks:** page **CreateTaskItem** (`op1Screen!vertikaTeknoLokaciptaCreateTaskItem`, widget `taskItemBuilder`). Real data item ternyata banyak → admin butuh (1) **search** biar cepet nemu, (2) **sort by popularitas** (item sering keluar-masuk naik ke atas, mis. Aqua).

Dua bagian independen. Search = renderer doang (config UDAH siap). Sort = renderer + CF + 1 field baru.

---

## 1. Search — CONFIG UDAH SIAP, tinggal render

Config `TASK_ITEM_BUILDER` udah punya:
```json
"searchField":"in",          // filter by nama item (itemNameField)
"searchHint":"Cari produk…"
```

**Kerjaan renderer:** render kotak search di atas list item. Ketik → filter list client-side by `searchField` (contains, case-insensitive). Kosong = tampil semua. **Gak ada tambahan config** — field udah ada, tinggal dibaca.

**Acceptance:** ketik "aqua" → list nyusut ke item yang namanya ngandung "aqua". Hapus → balik full.

---

## 2. Sort by frekuensi — renderer sort + field `freq`

### 2.1 Data: field `freq` di item
Tiap item doc (collection `{base}/item`) dapet field baru **`freq`** (int, default 0) = berapa kali item itu ke-transaksi (jumlah movement yang nyentuh item ini). Makin gede = makin sering keluar-masuk = makin populer.

> Item doc-id = **auto** (ii = field, bukan doc-id — lihat `audit.go` `itemNames`). Renderer/CF cari item by field `ii`, bukan `Get(ii)`.

### 2.2 Renderer: sort list
`TASK_ITEM_BUILDER` urut list item **`freq` desc** (populer di atas). Item tanpa `freq` (absent) = 0 → jatuh ke bawah, urutan lama. Search (bagian 1) tetep jalan di atas hasil sort.

**Config yang bakal ditambah** (sheet side, gue yang urus pas renderer siap — sekarang belum, hindari config-ahead no-op):
```json
"sortField":"freq",
"sortDir":"desc"
```

**Acceptance:** item dengan `freq` tertinggi muncul paling atas; sisanya turun. Kombinasi dengan search: sort dulu, baru filter ketikan.

---

## 3. CF — increment `item.freq` per movement

`movement` = SSOT immutable, tiap movement udah diproses `internal/movement/created.go` (`Created` → `applyMutations`) buat derive `asset_cache`. Movement bawa 1 `ii` (`mv.II`). Tambah: naikin `freq` item itu **+1 per movement**.

### 3.1 Exactly-once (gratis, ikut marker yang udah ada)
`applyMutations` jalan dalam 1 transaction yang di-guard idempotency marker (`paths.Applied + mid`): kalau marker udah ada → txn return early. Taruh increment **DI DALAM txn yang sama** → exactly-once, retry gak double-count.

### 3.2 Implementasi (`created.go`)
Karena item doc-id ≠ ii, butuh ref item dari field `ii`. Bangun map `ii → *DocumentRef` sekali di luar txn (mirror pola `itemNames`, tapi simpen `snap.Ref`), lalu blind-`Increment` di dalam txn:

```go
// Created(), sebelum applyMutations — 1 read collection kecil (~10-50 doc)
itemRefs := itemRefsByII(ctx, client, db, tid) // map[ii]*firestore.DocumentRef

// applyMutations(...), di bagian WRITES (dalam RunTransaction):
if ref, ok := itemRefs[mvII]; ok {           // mvII di-pass dari Created (mv.II)
    tx.Set(ref, map[string]interface{}{
        "freq": firestore.Increment(1),
    }, firestore.MergeAll) // MergeAll: field freq absent → mulai dari 0
}
```

- **1 movement = +1** (bukan per-qty, bukan per-mutation `muts`). Pakai `mv.II`, bukan loop `muts`.
- `firestore.Increment` = atomic server-side → concurrent movement aman (no lost update). **Race condition gak perlu ditangani manual.**
- `tx.Set(..., MergeAll)` bukan `tx.Update` → aman kalau field/doc belum ada (Update bakal NotFound).
- Item id gak ketemu di map (`ii` nyasar) → skip diam-diam (freq audit-only, jangan sampe gagalin movement emit — sama prinsip `itemNames`).

**Opsi malas (kalau nyentuh txn dihindari):** `ref.Update(...Increment)` di luar txn setelah `applyMutations` sukses. Approximate (retry bisa +1 lebih), tapi populeritas tahan noise → OK. **Rekomendasi tetap in-txn** (ikut disiplin exactly-once codebase).

### 3.3 Backfill (opsional)
Item existing `freq` = 0 sampe ada movement baru. Kalau mau langsung ke-urut dari histori: `ReconcileAssetCache`-style one-shot yang `COUNT(movement GROUP BY ii)` → set `item.freq`. Gak wajib buat v1 (kejalan sendiri seiring transaksi).

---

## 4. Dictionary
- **item** tab: `+freq` (int, default 0) — "jumlah movement (popularitas); dinaikin CF `onMovementCreated`, dipakai sort item picker".

## 5. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| Search box render | dev Flutter | config siap (`searchField`/`searchHint`), tinggal render |
| Sort list `freq` desc | dev Flutter | +config `sortField`/`sortDir` (sheet, nyusul) |
| `item.freq` +1 per movement | dev Go | `created.go` (in-txn Increment) |
| item `+freq` dict | — | catat |

**Referensi:** config live `op1Screen!vertikaTeknoLokaciptaCreateTaskItem` (widget `taskItemBuilder`); CF `internal/movement/created.go` (`Created`/`applyMutations`); item lookup pattern `internal/movement/audit.go` (`itemNames`).
