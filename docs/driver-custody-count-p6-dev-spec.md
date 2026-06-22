# P6 CustodyCount — Dev Spec (REVISED-A, align dev 2026-06-18)

**Buat:** Flutter dev. Page **STEP 1/2** blind count. Driver hitung fisik tiap item (angka gudang disembunyiin) → tombol → page **custodyReveal** (STEP 2/2) yang reveal+compare+branch.
**Flow:** P5 → **P6 (ini, STEP 1/2)** → custodyReveal (STEP 2/2) → P7 / P8 → P9.
**Source:** `json/driver-runtime/p6-custody-count.json`. Reveal/branch: `docs/driver-custody-reveal-dev-spec.md`. Runtime: `docs/driver-p4-handoff-dev.md` §0.

---

## 0. Struktur (align dev feedback)
Dev pegang **opsi A**: reveal = **page terpisah** (`custodyReveal`), P6 = count doang. Ini lebih bersih buat sistem all-JSON-preloaded + Firestore (tiap page 1 tugas, data nyebrang via Firestore, gak ada koordinasi state in-place). Branch (`matchRoute`/`mismatchRoute`) ADA DI custodyReveal, BUKAN di P6.

**Type = UPPERCASE_SNAKE** (`CUSTODY_STEP_HEADER`, `CUSTODY_COUNT_LIST`) — konvensi dev, konsisten `ROUTE_PROGRESS_HEADER` dst. Registry name col-A tetep camelCase.

---

## 1. Widget P6
| widget | isi |
|---|---|
| `CUSTODY_STEP_HEADER` | plat + "KONFIRMASI PENERIMAAN◆STEP 1/2" (spec di custodyReveal §2a) |
| `TXT` spacer + `TXT` note | "Hitung independen · angka warehouse belum diperlihatkan" |
| `TXT` "RETURNABLE" + `CUSTODY_COUNT_LIST`(returnable) | §2 |
| `TXT` "CONSUMABLE" + `CUSTODY_COUNT_LIST`(consumable) | §2 |
| tombol "LIHAT CATATAN WAREHOUSE" | **write-then-nav** → `custodyReveal` (§3) |

## 2. `CUSTODY_COUNT_LIST` (BARU — blind stepper)
| field | nilai |
|---|---|
| `table`/`search` | `84214220504259//vehicle_check` / `cty◼opening⭘vv◼{vehicleId}⭘cdt◼{today}` |
| `itemsField` | `ie` — item SET (manifest gudang, qty BLIND) |
| `joinTable`/`joinKey`/`labelField` | `…//item` / `ii` / `in` |
| `filter` | `ic◼returnable` / `ic◼consumable` (2 instance) |
| `blind` | `TRUE` — sembunyiin `ie[].qt` |
| `writeField` | `ip` — hasil hitung → `ip[]` |
| `text` | "" (label dari `labelField`) |

Render: tiap `ie[]` (cocok `filter`) → nama (`in`) + **stepper** (start 0, min 0, no max). `ie[].qt` TIDAK ditampilin.

## 3. Tombol "LIHAT CATATAN WAREHOUSE" = WRITE-then-nav (PENTING)
Bukan RBT nav-polos. Harus:
1. **Persist `ip[]`** (gabung 2 count-list) ke opening doc **SEBELUM** nav — else custodyReveal gak bisa baca `ip`.
2. Baru route ke `custodyReveal`.

> Dev: jadiin **send-button** (kumpulin stepper → write → nav), bukan RBT biasa.

## 4. Write `ip[]` = NATIVE (bukan DSL)
`ip[]` = **ARRAY** → DSL `updateEventRow`/`updateTableRow` **GAK support array**. Jadi **write NATIVE** (Flutter Firestore `doc.update({ip:[...]})`). Config cuma declare target (`table`/`search`/`writeField`); HOW = native widget code.

| tulis | tipe | cara | kapan |
|---|---|---|---|
| `ip[]` | array | **NATIVE** | P6 (tombol) |
| `dp[]` | array | NATIVE | custodyReveal |
| `rs` | scalar | DSL/native | custodyReveal |
| `cst` | scalar | DSL/native | P7/P8 |

## 5. Field codes (P6)
`vehicle_check` opening: `ie[]`{ii,cd,qt}(gudang, blind, **pre-seed**) · `ip[]`{ii,cd,qt}(TULIS native) · `cty`/`vv`/`cdt`. `item`: `ii`→`in`+`ic`.

## 6. Resolved
| item | keputusan |
|---|---|
| reveal | **page terpisah** `custodyReveal` (opsi A, align dev) |
| branch | di **custodyReveal** (`matchRoute`/`mismatchRoute`), bukan P6 |
| count list | **2 instance** + `filter` (dev pegang) |
| `ip` write | **@P6 native** (send-button), sebelum nav |
| `ie`@opening | pre-seed gudang; `ip` KOSONG sebelum P6 |
| type | UPPERCASE_SNAKE |

## TX-DELTA + REJECT (2026-06-22)

Acuan: `docs/driver-runtime-transaction-delta.md`. P6 beda dari P5 — `CUSTODY_COUNT_LIST` baca **`ie[]`** (manifest gudang di `vehicle_check` opening), BUKAN `task`. Dampaknya beda.

### A. Blind count sendiri TIDAK berubah
Driver hitung **fisik full/empty** di mobil. tx (deliver/sale/refill) gak ngubah cara hitung — galon full = galon full apapun rencana transaksinya. Stepper, `writeField:ip`, `blind`, filter `ic` returnable/consumable → **tetap**.

### B. `ie[]` harus sudah bersih (upstream, bukan P6)
`ie[]` = SSOT "apa yg fisik dimuat gudang". Supaya count cocok, `ie[]` harus:
1. **Exclude item dari task `tst=load_rejected`** — barang ditolak gak naik mobil, jangan masuk manifest.
2. **Exclude purchase (`pb`)** — barang beli naik mid-rute dari customer, BUKAN dimuat gudang awal. Jangan ada di `ie[]` opening.
3. **Include** full dari deliver (`pd`) + sale (`ps`) + refill (`pr`).

→ `ie[]` full = `Σ(pd + ps + pr)` task non-rejected, per item+kondisi. Sama rumus manifest awal P5 §B.

### C. Tanggung jawab build `ie[]` (dependency, FLAG)
`ie[]` di-seed **gudang sebelum driver** (lihat §6 pre-seed). Reject = **opening-only, sebelum P6**. Urutan benar: driver Tolak @P4 → gudang/CF rebuild `ie[]` (drop item rejected) → P5/P6.

- Kalau gudang-app/CF blm rebuild `ie[]` saat reject → count P6 mismatch palsu (sama isu P5 §A).
- **Dependency dev:** reject task HARUS trigger re-derive `ie[]` (atau gudang muat ulang) sebelum custody count. Domain gudang-flow/CF, di luar widget P6. Tandain.
- P6 widget sendiri gak filter `tst` (gak baca task) — andalkan `ie[]` udah bersih.

### D. Ringkas
| layer | exclude rejected | exclude purchase | siapa |
|---|---|---|---|
| P5 manifest (task-derived) | filter `tst≠load_rejected` di widget | skip `pb` di Σ | widget config (P5 §B/§C) |
| P6 count (`ie`-derived) | `ie[]` sudah bersih upstream | `ie[]` gak punya `pb` | gudang-flow/CF (rebuild) |

---

## 7. References
- `json/driver-runtime/p6-custody-count.json` (source) · `docs/driver-custody-reveal-dev-spec.md` (STEP 2/2 + branch)
- `docs/driver-runtime-transaction-delta.md` (tx + reject schema delta)
- `docs/driver-custody-notification-p5-dev-spec.md` (P5) · `docs/driver-runtime-field-dictionary.md`
- Lanjutan: P7 / P8 / P9 — belum di-spec.

## 8. Live op1Screen — PENDING (domain dev / koordinasi)
Live P6 (row 1025) masih `custodyCountList` camelCase + `[ROUTE:custodyReveal]` placeholder. Re-wire (type→UPPERCASE, tambah `CUSTODY_STEP_HEADER`, send-button) = **koordinasi sama dev** (mereka lagi build renderer + kemarin live-nya rame). Gue gak sentuh live tanpa aba-aba.
