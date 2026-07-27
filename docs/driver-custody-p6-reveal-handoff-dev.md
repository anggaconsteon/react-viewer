# Custody P6 + custodyReveal — Dev Handoff (1-pager)

**Buat:** Flutter dev (renderer). 4 widget type BARU buat custody-confirmation flow. JSON udah live di op1Screen (`p6-custody-count.json`, `custody-reveal.json`). Doc ini = **behavior contract** (yang JSON gak nunjukin).

## Flow
```
P4 gate → P5 notif → P6 CustodyCount (STEP 1/2, blind count) → custodyReveal (STEP 2/2, reveal+compare+branch) → P7 match / P8 selisih → P9
```
Page (op1Screen, LIVE): P6 = `vertikaTeknoLokaciptaCustodyCount`; reveal = `vertikaTeknoLokaciptaCustodyReveal`.

---

## ⚠️ 4 ATURAN WAJIB (JSON gak cover — ini yang penting)

1. **Write array = NATIVE, bukan DSL.** `ip[]` & `dp[]` = array → DSL `addToTable`/`updateTableRow`/`updateEventRow` **GAK support array**. Tulis pakai **Firestore SDK** (`doc.update({ip:[...]})`). Config cuma declare target (`table`/`search`/`writeField`).
2. **Single-writer `ip`.** Yang NULIS `ip[]` = **`CUSTODY_COUNT_SUBMIT`** doang (kumpulin hitungan dari 2 `CUSTODY_COUNT_LIST` via shared page state). `writeField:ip` di count-list = NANDAIN field tujuan; JANGAN 2 list nulis sendiri-sendiri (returnable & consumable bakal saling timpa).
3. **Await sebelum nav.** Submit: tulis `ip[]` → **TUNGGU write kelar** → baru route ke `custodyReveal`. Kalau gak, reveal baca `ip` kosong (Firestore propagation).
4. **Blind + branch client-side.** Count-list sembunyiin `ie[].qt` (`blind:TRUE`). Reveal compare `ie` (gudang) vs `ip` (driver) → semua sama = match → `matchRoute`; ada beda = selisih → compute `dp[]` (`ex=ie.qt, ac=ip.qt, dl=ac-ex`) + `rs=discrepancy_detected` → `mismatchRoute`.

`cst` (scalar) di-finalize di **P7/P8** (BUKAN P6/reveal): P7 confirm / P8 submit → `cst=custody_confirmed` (match & selisih dua-duanya; selisih ditandai `rs`).

---

## Widget types (4 BARU)

### CUSTODY_STEP_HEADER — header step (dipake P6 + reveal)
| field | isi |
|---|---|
| `vehicleTable`/`vehicleSearch`/`plateField` | `…//stock_location` / `lv◼{vehicleId}` / `ln` (plat) |
| `text` | `judul◆step` (cth `KONFIRMASI PENERIMAAN◆STEP 1/2`) |

### CUSTODY_COUNT_LIST — blind stepper list (P6, 2× filter returnable/consumable)
| field | isi |
|---|---|
| `table`/`search` | `…//vehicle_check` / `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}` |
| `itemsField` | `ie` (manifest gudang; qty di-BLIND) |
| `joinTable`/`joinKey`/`labelField` | `…//item` / `ii` / `in` (nama via join) |
| `filter` | `ic◼returnable` / `ic◼consumable` |
| `blind` | `TRUE` (sembunyiin `ie.qt`) |
| `writeField` | `ip` (nandain field; SUBMIT yg nulis) |

Render: tiap `ie[]` (cocok filter) → nama + stepper (start 0, min 0). Qty gudang TIDAK ditampilin.

### CUSTODY_COUNT_SUBMIT — tombol submit (P6)
| field | isi |
|---|---|
| `table`/`search` | opening doc (sama atas) |
| `writeField` | `ip` |
| `route` | `vertikaTeknoLokaciptaCustodyReveal` |
| `text` | label tombol (`Lihat Catatan Warehouse`) |

Behavior: kumpulin `ip[]` dari 2 count-list → **write native** → **await** → nav `route`. (Aturan 1-3.)

### CUSTODY_REVEAL — reveal + compare + branch (custodyReveal page)
| field | isi |
|---|---|
| `table`/`search` | opening doc |
| `expectedField`/`actualField` | `ie` (gudang) / `ip` (driver, dari P6) |
| `joinTable`/`joinKey`/`labelField`/`categoryField` | `…//item` / `ii` / `in` / `ic` (group section) |
| `discrepancyField`/`reconcileField` | `dp` / `rs` (tulis native/scalar) |
| `matchRoute` | `vertikaTeknoLokaciptaCustodySuccess` (P7) |
| `mismatchRoute` | `vertikaTeknoLokaciptaMismatchReport` (P8) |
| `recountRoute` | `vertikaTeknoLokaciptaCustodyCount` (P6) |
| `text` | 9 slot ◆: RETURNABLE◆CONSUMABLE◆warehouse◆hitungan lo◆Match◆(selisih)◆(btn match)◆(btn mismatch)◆Hitung Ulang |

Behavior: render per item (group `ic`) gudang vs driver + match/selisih → tombol computed (Aturan 4).

---

## Fields (vehicle_check opening doc)
`ie[]`{ii,cd,qt} (gudang manifest, pre-seed) · `ip[]`{ii,cd,qt} (driver count, tulis @SUBMIT) · `dp[]`{ii,cd,ex,ac,dl} (selisih, tulis @reveal) · `rs` (matched|discrepancy_detected) · `cst` (awaiting_custody→custody_confirmed→closed, @P7/P8).

## Routes
| route | status |
|---|---|
| `vertikaTeknoLokaciptaCustodyReveal` | ✅ live |
| `vertikaTeknoLokaciptaCustodyCount` (recount) | ✅ live (P6) |
| `vertikaTeknoLokaciptaCustodySuccess` / `…MismatchReport` (P7/P8) | ❌ belum → snackbar "belum tersedia". Expected. |

## Status
- **Live op1Screen:** P6 (CUSTODY_COUNT_LIST ×2 + CUSTODY_COUNT_SUBMIT) + custodyReveal (CUSTODY_REVEAL). Type UPPERCASE_SNAKE.
- **Pending:** P6 belum ada CUSTODY_STEP_HEADER (room window); P7/P8 belum dibikin.
- Source JSON: `json/driver-runtime/p6-custody-count.json`, `json/driver-runtime/custody-reveal.json`.
