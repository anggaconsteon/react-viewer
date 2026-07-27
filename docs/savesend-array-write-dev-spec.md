# Dev Spec — CUSTODY_COUNT_SUBMIT + colokan savesend

**Tanggal:** 2026-06-30
**Status:** minta dev konfirmasi feasibility (kecil).
**Inti:** **KEEP** widget `CUSTODY_COUNT_SUBMIT` (opening + closing) — dia udah handle bagian susah (native array `ie[]`/`ip[]` + bikin doc + closing branch). **TAMBAH** colokan savesend (`action`/`gpsPosition`/`flag`/`addToEvent`) biar abis native write, jalanin **pipeline savesend** → **nulis Event (audit) + GPS**, kaya tombol lain.
**Page JSON:** `json/warehouse/opening.json`, `json/warehouse/closing.json`.

> Catatan: usul sebelumnya (ganti ke RBT + `arrayFlush` general hook) **DIBATALIN** — kebanyakan nambah. Ini versi minimal.

---

## 0. NON-NEGOTIABLE — additive, JANGAN ubah flow existing

**Syarat utama (user): nambahin ini TIDAK BOLEH bikin yang existing error.**

1. **Field savesend (`action`/`gpsPosition`/`flag`/`addToEvent`) = OPTIONAL.** Kalau `action:"savesend"` GAK ada → `CUSTODY_COUNT_SUBMIT` jalan **persis kaya sekarang**. Page/widget lama tanpa field ini = 0 perubahan perilaku.
2. **Native write = JANGAN diutak-atik.** Array `ie[]`/`ip[]`, bikin doc, closing branch (`rs`/`dp[]`/investigation/match-mismatch route) = **tetep apa adanya**. savesend cuma **NEMPEL DI BELAKANG** (Event+GPS), bukan ganti alur.
3. **Event/GPS gagal ≠ rollback.** Native write udah sukses duluan. Kalau `addToEvent` error, jangan batalin count yang udah ketulis. (best-effort emit; log doang.)
4. **Widget lain & driver custody flow = JANGAN kesentuh.** Driver pakai `CUSTODY_COUNT_SUBMIT` juga (ip[] driver) tapi mungkin tanpa field savesend → harus tetep jalan.

**Urutan aman ship:**
- **Fase A (zero-risk, additive):** colok savesend (§2). Field optional → gak mungkin mecahin existing.
- **Fase B (behaviour-change, test dulu):** fix widget §4 (cdt Number / auto-id / cst-via-search). Ini NGUBAH bentuk data tulis → **regresi-test** sebelum + sesudah (lihat §6).

---

## 1. Masalah

`CUSTODY_COUNT_SUBMIT` write native langsung → **gak lewat savesend** → **Event kosong, GPS gak ke-capture**. Aksi lain (clockin, failed-delivery, custody-success) lewat savesend semua → ada audit + GPS. Opening/closing gak.

## 2. Yang diminta (minimal)

Widget tetap. Tambah field savesend di config-nya:

| field | fungsi |
|---|---|
| `action: "savesend"` | abis native write, jalanin pipeline savesend |
| `gpsPosition: 2` | capture GPS |
| `flag: "warehouse-opening-check"` / `"warehouse-closing-check"` | tag event |
| `addToEvent: "…//evidence⭘…"` | tulis row Event (audit) |

Urutan yang diharapkan: **native write doc (ie/ip + scalar) DULU → terus savesend (addToEvent + GPS).** 1 tombol, gak ada widget/hook baru.

## 3. Pertanyaan ke dev

1. **Bisa gak `CUSTODY_COUNT_SUBMIT` jalanin pipeline savesend** (`addToEvent` + GPS + flag) **setelah** native write-nya? Atau savesend cuma kebind ke RBT?
2. Kalau gak bisa nempel ke widget custom → opsi: widget native write + **RBT savesend kedua** (cuma `addToEvent`+GPS) di-trigger barengan? Atau renderer panggil pipeline savesend internal dari widget?
3. GPS via `gpsPosition` → landing di Event row? Perlu map `evidence.la/lo` (ety:gps)? Konfirmasi.

## 4. Sekalian fix widget (terpisah dari savesend, tapi 1 paket)

Bug widget yang udah ke-temu (lihat `runtime-type-contract-DEV.md` §8) — fix bareng:

1. **`cdt`/`ldt` ditulis Number** (epoch), bukan String. (`cdt`=`{today}` midnight Number, `ldt`=`◀2▶` now Number.) Sekarang String → custody/closing query `cdt◼{today}` miss.
2. **Doc-id auto-id** (kaya seed), bukan deterministik `CHK-{vv}-{ymd}`. Simpan business key (`cnm`) sebagai field. Deterministic-id = sumber ghost.
3. **Closing set opening `cst=closed` via search** (`cty◼opening⭘vv◼{vv}⭘cdt◼{today}`), bukan constructed-id → gak bikin ghost 1-field `{cst:closed}`.

## 5. Token (konfirmasi source)

| token | arti | source |
|---|---|---|
| `{activeVehicle}` | vehicle dipilih dari feed | nav VEHICLE_FEED_LIST |
| `{chosenVid}` / `{chosenName}` | driver dipilih (opening) | executor_designate_card |
| `{checkerVid}` / `{checkerName}` | petugas gudang (gv/gn, cv/cn) | sesi login gudang |
| `{today}` | epoch-midnight Number | device |

> Inject `{…Vid}` = **String** (vid kanonik String); `{today}` = **Number**. Lihat `runtime-type-contract-DEV.md` §3.

## 6. Acceptance + REGRESI

**Fitur baru:**
- Opening/closing submit → **Event row ke-tulis** (audit) + **GPS ke-capture** (kaya aksi savesend lain).
- `cdt`/`ldt` Number; doc **auto-id**; closing **0 ghost** (cst=closed via search).

**Regresi WAJIB (jangan sampe pecah):**
- `CUSTODY_COUNT_SUBMIT` **tanpa** field savesend → perilaku **identik** kaya sekarang.
- Opening: `ie[]` tetep keisi dari count list; `stock_location.dv/dn` tetep keset.
- Closing: `ip[]` + `rs` + `dp[]` + investigation + branch route (match/mismatch) **tetep jalan** persis.
- **Driver custody flow** (CUSTODY_COUNT_SUBMIT ip[] + reveal + success) = **gak kesentuh**.
- Page lain yang reuse widget ini = 0 perubahan.
- (Fase B) abis fix cdt→Number + auto-id: pastiin **read-side gak ada yang baca doc by constructed-id `CHK-{vv}-{ymd}`** — semua harus query by field (`cty/vv/cdt`). Cek custody gate + closing list + vehicle feed.
