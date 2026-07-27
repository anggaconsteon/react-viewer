# Dev Spec (Flutter) — `TIMELINE` variant `ledger`: audit timeline generik (grouped + expandable)

**Tanggal:** 2026-07-08
**Buat:** Flutter dev (renderer). Konsumen pertama: audit pergerakan stok admin/supervisor (`StockHistory` page, sumber `movement`). **Tapi widget 100% generik** — dipakai ulang buat riwayat nota, riwayat task, timeline event apa pun tanpa ubah renderer.
**Sifat:** variant BARU dari `TIMELINE`. `variant:comment` & `variant:periodic` existing TIDAK diubah.
**Dependency:** `routeParams` (docs/rbt-route-params-dev-spec.md) — mekanisme pass token antar-route, dipake page-1→page-2 di sini (sama item dev yg juga dibutuhin nota-history). +CF field kecil `ac`/`fln`/`tln` (§6, nebeng movement-audit-denorm yg udah jalan).

---

## 0. Kenapa variant baru (bukan pol periodic)

`variant:periodic` (asalnya buat laporan patrol) kebaca data movement keyed ✓ TAPI bawa baggage patrol yg gak relevan buat stok:
- badge "GPS saja" (kualitas evidence) — nongol walau `badge:""`, gak ada artinya buat ledger.
- 1 baris/movement flat → delivery multi-item = banjir kartu.
- jenis mentah (`INTERNAL` nongol 2× ambigu: muat vs turun).

`variant:ledger` = timeline audit proper: **group per-kejadian + expand item**, **badge aksi** (ganti evidence), **nama lokasi kebaca**, label semua dari config.

## 1. Prinsip: NOL hardcode

Tiap teks/field/warna dari config. Renderer gak tau apa-apa soal galon/mobil/stok. Ganti `table`+field param → jalan buat koleksi lain (contoh §8). Aturan:
- Semua label = token `<field>` (per-row) / `{agg}` (agregat) di string config. Gak ada string baked di Dart.
- Warna badge = **theme** (palette kategori), BUKAN config — konsisten [[feedback_status_3tier_relabel]] (warna di theme, config cuma kasih value→label).
- `groupField` kosong → mode FLAT (tiap row 1 kartu, no expand). Isi → mode GROUPED (model B). **1 widget, 2 mode.**

## 2. Param (semua generik)

| param | fungsi | contoh |
|---|---|---|
| `type` | `TIMELINE` | |
| `variant` | `ledger` | |
| `vidtable` / `table` | standar keyed | `84214220504259//movement` |
| `conditions` | filter keyed (token-driven, runtime) | `[[◀vv▶◼{vehicleId}]]` |
| `period` / `periodDefault` | filter periode (reuse periodic) | `1 hari◼86400000★7 hari◼604800000★30 hari◼2592000000` / `604800000` |
| `timeField` | field waktu (epoch Number) buat urut + filter periode | `t` |
| `title` / `subtitle` | judul halaman timeline; `{count}`=total movement match | `Riwayat Stok` / `{count} pergerakan` |
| `groupField` | **kosong=flat, isi=grouped**. Kartu dikelompokin by field ini | `mrf` |
| `badgeField` | field → badge | `ac` |
| `badgeMap` | `value◼Label★…` (value→teks badge) | lihat §5 |
| `headText` | template baris waktu kartu (token `<field>`) | `<ts>` |
| `titleText` | template judul kartu (token `<field>`) | `<fln> → <tln>` |
| `subText` | template sub-baris; `{n}`=jumlah item dalam grup | `oleh <an>◆{n} item` |
| `itemText` | template per-baris item (mode expand); `◆`-seg | `<in> ×<qt>◆<cd>` |
| `refText` | baris ref/sumber kecil (opsional) | `<mrf>` |
| `expandable` | `TRUE`/`FALSE` (mode grouped) | `TRUE` |

Token: `<field>`=nilai doc; `{count}`=total match (subtitle); `{n}`=jumlah movement dlm grup; `◆`=pemisah segmen (renderer render tiap seg jadi baris/bagian). Badge warna = theme.

## 3. Resolved JSON — StockHistoryDetail (movement, per-mobil)

Ini yg BAKAL dipasang di sheet **pas renderer landing** (sekarang belum, config-ahead = widget ke-drop). `{vehicleId}` = token runtime (dari route param, §7).

```json
{"type":"TIMELINE","variant":"ledger","vidtable":"20342033315492","table":"84214220504259//movement","conditions":"[[◀vv▶◼{vehicleId}]]","period":"1 hari◼86400000★7 hari◼604800000★30 hari◼2592000000","periodDefault":"604800000","timeField":"t","title":"Riwayat Stok","subtitle":"{count} pergerakan","groupField":"mrf","badgeField":"ac","badgeMap":"openload◼Muat★closeunload◼Turun★drop◼Antar★pickup◼Ambil★sale◼Jual★buy◼Beli★refill◼Tukar★adjust◼Sesuai★unload◼Bongkar","headText":"<ts>","titleText":"<fln> → <tln>","subText":"oleh <an>◆{n} item","itemText":"<in> ×<qt>◆<cd>","refText":"<mrf>","expandable":"TRUE"}
```

## 4. Render (grouped, model B)

```
● 16:14                         [🟧 Antar]     ← headText(<ts>)  +  badge(ac→badgeMap, warna theme)
  B 1234 XY → Honda Bintaro                     ← titleText(<fln> → <tln>)
  oleh Agenia Demo-7 · 3 item              ▾    ← subText(oleh <an> · {n} item), chevron expand
  ┈┈┈ (tap → expand) ┈┈┈
  Aqua Galon 19 L ×3 · penuh                    ← itemText per movement dlm grup
  Aqua Galon 19 L ×3 · kosong
  TASK-2026-000269                              ← refText (kecil, muted)
```

- **Group** by `groupField` (`mrf`): semua movement 1 kejadian (opening/task/closing) jadi 1 kartu. Header ambil dari row representatif grup (badge/head/title/actor sama se-grup; kalau beda-ambil first).
- **{n}** = jumlah movement dalam grup. **{count}** = total movement match (subtitle halaman).
- **Expand/collapse** per kartu (`expandable:TRUE`). Collapse = header+sub doang; expand = item lines + ref.
- **Urut** by `timeField` desc (terbaru atas). Grup di-urut by max(timeField) anggotanya.
- **Mode flat** (`groupField:""`): tiap movement = 1 kartu, headText+titleText+subText+itemText semua di 1 kartu, no chevron.

## 5. Badge aksi (ganti evidence)

`badgeField:"ac"` → `badgeMap` map value→label. Warna **auto dari theme category palette** (renderer assign per-value stabil; owner atur di theme, BUKAN config).

`ac` (§6) bikin jenis eksplisit → **fix ambiguitas INTERNAL**: `openload`→Muat, `closeunload`→Turun (dulu dua-duanya "INTERNAL"). Map default:
```
openload◼Muat★closeunload◼Turun★drop◼Antar★pickup◼Ambil★sale◼Jual★buy◼Beli★refill◼Tukar★adjust◼Sesuai★unload◼Bongkar
```
`badgeMap` gak nemu value → tampil raw value (jangan crash).

## 6. CF addendum (kecil — nebeng movement-audit-denorm)

3 field denorm/audit baru di movement. `OnMovementCreated` **abaikan** (balance tetep dari fl/tl/qt). Tiap emitter tau konteksnya → tulis literal/lookup:

| field | isi | catatan |
|---|---|---|
| `ac` | aksi spesifik (string konstan per-emitter) | `openload`/`closeunload`/`drop`/`pickup`/`sale`/`buy`/`refill`/`adjust`/`unload`. Tiap emitter udah action-specific → tulis 1 string konstan. Ini yg fix INTERNAL 2× |
| `fln` | nama lokasi asal (kebaca) | task movement: `fl`=mobil→`task.ln` (plat); opening: gudang name. Fallback `""` |
| `tln` | nama lokasi tujuan (kebaca) | drop: `tl`=customer→`task.kn`; opening: `tl`=mobil→plat. Fallback `""` |

- `fln`/`tln`: kalo emitter gak gampang dapet nama → boleh `""`; widget degrade (titleText tampil "→" doang atau ganti `titleText:"<mrf>"`). JANGAN block emit gara2 nama kosong.
- `ac` = **wajib** buat badge kebaca (murah, konstan). Sisanya nice-to-have.
- Semua nebeng lookup yg udah ada di movement-audit-denorm (`in`/`an`). Nol emitter baru.

## 7. Dinamis walau JSON pre-loaded — `{vehicleId}` via routeParams

App load semua JSON sekali di awal (= STRUKTUR + placeholder). **Data tetep dinamis** karena token di-resolve saat RUNTIME + query live. `conditions` bawa `{vehicleId}` = slot runtime, BUKAN nilai baked. Nol regen JSON.

**2-page (route param) = jalur reliable** (picker single-page reaktivitas belum ada):

```
Page 1  StockHistory                 Page 2  StockHistoryDetail
[ LIST vehicle ]        tap  ───▶     [ TIMELINE:ledger ]
  B 1234 XY  ─── routeParams ──▶        conditions [[◀vv▶◼{vehicleId}]]
  B 5678 CD    vehicleId◼{lv}           (resolve runtime dari route param → query live)
```

Page-1 = **`PICKER_LIST`** (host asli tap-list — BUKAN `LIST_ITEM_CARD`; itu approval card posisional. Koreksi dev 2026-07-08). `route`+`routeParams` bawa row `lv` → token `vehicleId` di page-2 (resolved JSON, shape live):
```json
{"type":"PICKER_LIST","mode":"navigate","vidtable":"20342033315492","table":"84214220504259//stock_location","search":"lt◼vehicle⭘lst◼active","titleField":"ln","subField":"dn","metaField":"dv","rowIcon":"truck","titleMono":"true","accentColor":"0xFF2563EB","route":"vertikaTeknoLokaciptaStockHistoryDetail","routeParams":"vehicleId◼{lv}","emptyText":"Belum ada kendaraan","text":"Pilih Kendaraan◆Lihat riwayat◆"}
```
- `routeParams:"vehicleId◼{lv}"` = `destToken◼{srcToken}`. Tap row → navigate → set `{vehicleId}` = row `lv` → page-2 ledger resolve live. `{lv}` = field row (row-first resolve, dev `resolveRowCurlyTokens`).
- `search:"lt◼vehicle⭘lst◼active"` = roster mobil aktif (shape live).
- **`{vehicleId}` reserved token (kosong buat admin)** → ledger resolve `conditions` via `resolveScreenTxTokens` (route-param), BUKAN `resolveDriverCurlyTokens`. Kalo salah jalur → admin liat kosong senyap (catch dev). Kosong beneran → fail-CLOSED, JANGAN drop klausa.

## 8. Reusability (bukti generik — nol perubahan renderer)

Ganti param → widget yg sama:
- **Riwayat nota walk-in:** `table:nota`, `conditions:[[◀src▶◼walkin]]`, `groupField:"nno"`, `badgeField:"bym"`+`badgeMap:"tunai◼Tunai★transfer◼Transfer"`, `titleText:"<by>"`, `itemText:"<in> ×<qt>◆<hg>"`.
- **Riwayat task driver:** `table:task`, `conditions:[[◀vv▶◼{vehicleId}]]`, `groupField:""` (flat), `badgeField:"tst"`.
- **Timeline event patrol:** `table:event`, `groupField:""`, `badgeField:"ty"`.

## 8b. ADDENDUM 2026-07-09 — `groupField2`: section 2-level opsional (group per-trip)

Multi-trip 1 mobil = movement antar-trip nyampur di list (bingung trip mana). Fix: **grouping tier** — opsional, backward-compat.

| param | fungsi |
|---|---|
| `groupField2` | **KOSONG → 1-level** (kayak sekarang, kartu event flat by `groupField`). **KEISI (mis. `tr`) → 2-level**: SECTION (by groupField2) → kartu event (by groupField) di dalamnya |
| `sectionText` | template header section (mode 2-level). Token: `<field>` (nilai row wakil), `{sectionCount}` (Σ movement di section), `{groupCount}` (Σ kartu event di section), `{sectionTime}` (waktu paling awal/akhir section). Contoh `Trip · {sectionTime}` atau `<trl>` |

- **1 widget, 2 mode** — `groupField2` kosong = perilaku existing NOL berubah (tier opt-in).
- **Render 2-level:** SECTION header (sectionText) → di bawahnya kartu-kartu event (groupField) → tiap kartu expand ke item. 3 tingkat visual: section → kartu → item.
- **Sort:** section by waktu (terbaru atas), kartu dalam section by waktu, item by waktu.
- **Label trip kebaca:** `tr` = doc-id opening (jelek). 2 opsi header section:
  - **Default (nol CF):** derive dari `{sectionTime}` — "Trip · 09:37" (pagi) vs "Trip · 14:20" (sore), kebedain by jam.
  - **Rapi (CF kecil):** denorm `trl` (trip label, mis. opening `cnm` `CHK-B5678-20260709-2` atau "Trip N") → `sectionText:"<trl>"`. Optional, nyusul.
- **Resolved JSON contoh (2-level per-trip):** tambah `"groupField2":"tr","sectionText":"Trip · {sectionTime}"` ke config ledger existing. Kosongin `groupField2` = balik 1-level.

**Acceptance tambahan:** `groupField2` kosong → identik 1-level (regresi nol). `groupField2:"tr"` → movement kepisah per-trip (section), tiap section punya kartu Muat/Antar/Turun-nya sendiri. Multi-trip gak nyampur lagi.

---

## 9. Urutan ship (WAJIB — [[feedback_config_ahead_of_renderer]])

1. CF `ac` (+`fln`/`tln`) deploy — field keisi, nganggur, harmless.
2. Renderer `variant:ledger` rilis.
3. **BARU** sheet dipasang (row StockHistoryDetail + 2-page + routeParams) — GUE pegang, kabarin build ready. Config token-bearing mendahului renderer = widget ke-DROP total.
4. Interim (sekarang): StockHistory tetep `variant:periodic` literal (jalan, nampil data) — jangan diutak-atik sampe ledger landing.

## 10. Acceptance

1. `groupField:mrf` → movement 1 kejadian jadi 1 kartu; expand nampil item lines; collapse ringkas. `{n}` bener.
2. `groupField:""` → flat 1 kartu/movement, no expand (regresi mode lama).
3. Badge dari `ac`+`badgeMap`, warna dari theme; `openload`≠`closeunload` (Muat vs Turun, gak ambigu lagi). Value gak ke-map → raw, no crash.
4. Filter periode jalan by `timeField` (epoch); default 7 hari.
5. `{vehicleId}` dari route param (page-1 tap) → ledger query live, dinamis walau JSON pre-loaded. Kosong → nol data (fail-closed).
6. Ganti `table`+field (nota/task/event) → jalan tanpa ubah renderer (§8).
7. Nol string/warna baked di Dart — semua dari config/theme.

---

**Referensi:** `movement-audit-denorm-cf-dev-spec.md` (vv/tr/av/an/in + ADDENDUM ac/fln/tln di sini), `rbt-route-params-dev-spec.md` (routeParams — dep bersama nota-history), `walkin-history-dev-spec.md` (konsumen routeParams lain), `feedback_config_ahead_of_renderer` (urutan ship), `feedback_status_3tier_relabel` (warna di theme).
