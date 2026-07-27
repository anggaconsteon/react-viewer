# Dev Spec (Flutter) — Busy Guard: kendaraan in-route & driver in-route gak bisa dipilih

**Tanggal:** 2026-07-16
**Buat:** dev Flutter (renderer — extend 2-3 widget picker, NOL widget baru, NOL schema baru, NOL CF baru).
**Latar (kejadian nyata):** mobil lagi in-route → admin bikin task baru buat mobil itu / gudang designate driver yang lagi jalan → task gak nampil di driver, gak ada konfirmasi kendaraan, closing gudang gantung. Guard ini nyegah masuk ke state rusak itu.

---

## 0. Sinyal busy (SUDAH LIVE — bukan bagian dev ini)

`stock_location` (row kendaraan):
- **O1 submit** (`CUSTODY_COUNT_SUBMIT mode:opening`, op1Screen WarehouseOpeningCheck) → `updateEventRow` set `dv◼{chosenVid}⭘dn◼{chosenName}`.
- **C1 submit** (`mode:closing`, WarehouseClosingCheck) → `dv◼⭘dn◼` (clear).

Definisi:
- **Kendaraan busy** ⇔ row kendaraan punya `dv` non-empty.
- **Driver busy** ⇔ ADA row kendaraan (lt◼vehicle) dengan `dv` == vid driver itu.

Koleksi stock_location kecil (≤ puluhan row) → 1 query extra per picker aman.

## 1. EXTEND #1 — `executor_designate_card` (O1 pilih pengemudi)

Param baru (semua opsional — kosong = perilaku sekarang, nol regresi):

| param | contoh | fungsi |
|---|---|---|
| `busyTable` | `84214220504259//stock_location` | koleksi yang di-scan buat busy-set |
| `busyField` | `dv` | field yang nge-bind pegawai |
| `busyLabelField` | `ln` | label pembanding (plat mobil yang lagi dipakai) |

Perilaku: pas sheet picker kebuka, load `busyTable` sekali → set `{dv → ln}` dari row yang `busyField` non-empty. Pegawai yang vid-nya ada di set → **tetap tampil tapi DISABLED** (abu) + subtitle dari `text` segmen baru: `Sedang jalan · {ln}`. Jangan di-hide — checker perlu tau siapa lagi bawa mobil apa.

**Config SUDAH STAGED LIVE (2026-07-16, op1Screen D720 — WarehouseOpeningCheck):**
`"busyTable":"84214220504259//stock_location","busyField":"dv","busyLabelField":"ln"` + `text` segmen ke-8 (terakhir) = `Sedang jalan · ` (prefix label; renderer append plat dari busyLabelField). Header B718 verified assembled.

## 2. EXTEND #2 — picker kendaraan (CreateTask admin + entry O1)

Kasus self-field (row kendaraan bawa `dv`-nya sendiri):

| param | contoh | fungsi |
|---|---|---|
| `busySelfField` | `dv` | kalo field ini non-empty di row → row disabled |
| `busySelfLabelField` | `dn` | ditampilin di subtitle ("Sedang jalan · Agenia Demo-3") |

Konsumen:
1. **Picker kendaraan di Admin CreateTask** (`PICKER_LIST mode:capture`) — kendaraan in-route gak bisa dipilih buat task baru sampai C1 selesai. **Config SUDAH STAGED LIVE (op1Screen D790 — CreateTaskVehicle):** `"busySelfField":"dv","busySelfLabelField":"dn"` + `text` segmen ke-4 = `Sedang jalan · `. Header B787 verified assembled. NOTE: picker ini udah punya `statusSearch`/`statusOnLabel:"On Route"` (label doang) — busySelfField yang bikin BLOCKING; jangan dirancukan.
2. **WarehouseFeed / entry O1** — kendaraan yang `dv` keisi = trip masih jalan → blok buka O1 BARU (arahin ke closing). Kalau feed tier composite udah nge-gate ini, cukup verifikasi; jangan dobel.

Perilaku sama: tampil + disabled + label, `hideBusy:"TRUE"` opsional kalo mau di-hide.

## 3. Yang TIDAK dibangun

- TIDAK ada status enum baru (`in_route` dll) — `dv` empty/non-empty CUKUP. Kalau nanti butuh fase lebih halus, itu `vehicle_check.cst` (udah ada).
- TIDAK ada CF — set/clear udah kejadian di O1/C1 submit existing.
- TIDAK nge-guard driver app side — driver cuma liat trip-nya sendiri, udah aman by design.

## 4. Edge cases

1. **Trip nyangkut kemarin** (O1 kemarin, gak pernah closing) → `dv` masih keisi → kendaraan+driver kebaca busy. INI BENER (bukan bug) — paksa closing dulu. Tapi kasih jalan keluar: label busy tampilin plat/nama biar admin tau harus closing mobil mana.
2. **Data lama pre-guard** yang udah terlanjur `dv` keisi tanpa trip nyata → clear manual `dv`/`dn` di Firestore (satu kali).
3. Row `dv` == vid user sendiri → tetap disabled (satu orang gak bisa 2 trip).
4. `busyTable` gagal load → fail-open (semua enabled) + log; guard = kenyamanan, bukan security boundary.

## 5. Acceptance

1. Mobil A in-route (O1 done, C1 belum): di CreateTask mobil A disabled ("Sedang jalan · {driver}"); di O1 designate, driver-nya disabled ("Sedang jalan · {plat A}").
2. C1 mobil A selesai → dua-duanya langsung bisa dipilih lagi (tanpa deploy/config).
3. Driver di-assign mobil B saat masih bawa mobil A = MUSTAHIL via UI.
4. Param kosong → semua picker behave persis kaya sekarang (nol regresi).
5. Label 100% dari `text` ◆-segmen (nol hardcode string di Flutter).

---

**Referensi:** op1Screen WarehouseOpeningCheck (B718 — executor_designate_card + CUSTODY_COUNT_SUBMIT opening), WarehouseClosingCheck (B732 — submit closing clear dv/dn), `docs/admin-create-task-dev-spec.md` (picker kendaraan CreateTask), dict stock_location `dv`/`dn` (#set O1 / clear closing).
