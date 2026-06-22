# Dev Spec — Cost Center Card (`LIST_MULTIPLE_PANEL_CARD`)

**Tanggal:** 2026-06-02
**Fitur:** Patroli & Cleaning — Layar 1 (daftar cost center)
**Sumber desain:** `src/App.jsx` → `SiteCard` (L339–409), `SiteSubPanel` (L383–409)
**Scope dokumen ini:** SATU widget = dari search → ringkasan status → grup status (accordion) → kartu cost center (2 panel). TANPA app bar/title (itu page wrapper, bagian spreadsheet engineer). Entity = **cost center** (bukan site). Layar detail (titik & timeline) = dokumen terpisah.

---

## 1. Tujuan

Daftar cost center (BP Legok, Bintaro Xchange, dll). Satu kartu = satu cost center, berisi **2 panel** yang masing-masing bisa di-tap ke halaman berbeda:

- **Panel Kehadiran** → route ke detail kehadiran site
- **Panel Patroli & Cleaning** → route ke detail titik patroli

`LIST_ITEM_CARD` (widget list current — `displayList` sudah lama) bawaan = 1 card = 1 `route` + action `buttons` (savesend + `chain` DO_DIALOG, BUKAN nav). Gak cukup karena butuh **2 panel nav** (tiap panel route + status sendiri).

Solusi: **type baru `LIST_MULTIPLE_PANEL_CARD`** (sibling LIST_ITEM_CARD) + array **`panels`** = N panel nav (tiap panel: `icon` + `text` + `status` + `okText` + `route`). Renderer dev bikin baru.

⚠️ **Reusable (refactor 2026-06-11):** widget ini didesain biar dipakai ulang di domain lain (bukan patrol doang). Reuse ditangani **config**, bukan flag strategy:
- **`variant`** = fork layout (`"grouped"` = accordion-by-status + ringkasan; `"flat"`/kosong = list polos).
- **`groupBy` + `statusLabels`** = token grup + label (lihat §2).
- Panel pakai `<charcode>` doc → render langsung (pure generic). Panel pakai `{computed}` → di-resolve strategy Dart yang **terikat ke type/behavior** (bukan dipilih flag config).

> **DROP `ledgerCode` (CONFIRMED 2026-06-11):** `ledgerCode` cuma dipakai buat **addToEvent** (nulis event ledger), **TIDAK kepake** di widget read/list. Jadi dibuang dari semua list widget. Engine pilih strategy agregasi via `type`+`variant`, bukan `ledgerCode`. (Field ini dulu sempat diminta dev 2026-06-04 sbg selector, tapi ternyata read path gak baca.) Sumber lama: `docs/# LIST_MULTIPLE_PANEL_CARD — Rekomendasi.md`.

### Komponen layar (semua dalam 1 widget)

1. **Search** — "Cari cost center".
2. **Ringkasan status** — baris "X perlu tindak · Y perhatian · Z aman" (hitung per status `{ws}`).
3. **Grup status (accordion)** — kartu dikelompokkan per worst-status: PERLU TINDAK / PERHATIAN / AMAN, tiap grup collapsible + count.
4. **Kartu cost center** — header (`<sn>`/`<an>`) + strip warna (`{ws}`) + 2 panel nav (Kehadiran, Patroli & Cleaning).

---

## 2. Widget JSON

```json
{
  "type": "LIST_MULTIPLE_PANEL_CARD",
  "vidtable": "20342033315492",
  "table": "84214220504259//site",
  "search": "",
  "conditions": "",
  "searchFields": "an◆sn",
  "thresholdMs": "43200000",
  "routeParam": "av◼ccVid",
  "showIcon": "TRUE",
  "showProgress": "FALSE",
  "variant": "grouped",
  "groupBy": "{ws}",
  "statusLabels": "danger◼Perlu tindak◼Perlu tindak★warn◼Perhatian◼Perhatian★ok◼Aman◼Beres",
  "text": "◆<an>◆<sn>◆Cari site atau klien◆Ketik nama site◆Data tidak ditemukan",
  "status": "{ws}",
  "panels": [
    {
      "icon": "users",
      "text": "Kehadiran◆{hadir}/<nm> hadir◆{issues}",
      "status": "{ps}",
      "route": "checkinSiteDetail"
    },
    {
      "icon": "clipboard-check",
      "text": "Patroli & Cleaning◆{llCount} titik◆{staleCount} titik jeda lama · terlama {longestGap} jam",
      "status": "{qs}",
      "route": "patroliCleaningPerSite"
    }
  ]
}
```

> **Refactor generic (2026-06-11):**
> - **`variant`** ditambah = fork layout: `"grouped"` (accordion-by-status + ringkasan, kasus patrol ini) / `"flat"`/kosong (list polos).
> - **`groupBy` + `statusLabels`** ditambah biar grouping/label domain-independent.
> - **`ledgerCode` DIBUANG** (LIKELY-TO-CHANGE — konfirm dev; lihat ⚠️ §1).
> - **`okText`** per-panel di-drop dari sini (disubsumsi `statusLabels` pillLabel `ok`="Beres"); sisain override OPSIONAL.
> Lihat §2.2.

**Field-set (refactor 2026-06-11):**

| Field | Contoh | Fungsi |
|---|---|---|
| ~~`ledgerCode`~~ | ~~`patrolCleaning`~~ | **DIBUANG (confirmed).** Cuma buat addToEvent, gak kepake read/list. Strategy dipilih via `type`+`variant`. Lihat ⚠️ §1. |
| `variant` | `grouped` | **(baru 2026-06-11)** fork layout. `"grouped"` = accordion-by-status + ringkasan rollup. `"flat"`/kosong = list kartu polos (skip accordion+ringkasan). |
| `vidtable` | `20342033315492` | collection vid |
| `table` | `84214220504259//site` | path data (collection cost center) |
| `search` | `av◼{ccVid}` (kosong di sini) | **WHERE Firebase (server)** — single-filter doc mana yg di-fetch. `field◼value`. Kosong = ambil semua doc di `table`. |
| `conditions` | `[[◀av▶◼{ccVid}]]` (kosong di sini) | **WHERE Firebase (server)** — compound AND-join. Kosong = tanpa filter tambahan. |
| `searchFields` | `an◆sn` | **search box (client)** — char-code field yg dicocokin pas user NGETIK di kotak cari (pisah `◆`). BEDA dari `search`. |
| `thresholdMs` | `43200000` | ambang (ms) dibaca strategy (12 jam = stale patrol). Dulu konstanta `STALE_HOURS`, sekarang field. |
| `routeParam` | `av◼ccVid` | nav: bawa field kartu (`av`) → token (`ccVid`) di layar tujuan. `docField◼token`. Kayak query-param via config. |
| `showIcon` / `showProgress` | `TRUE`/`FALSE` | toggle render kotak ikon / progress |
| `groupBy` | `{ws}` | **(baru 2026-06-11)** token level-kartu yang dipakai grup accordion + ringkasan. **Hanya dibaca kalau `variant:"grouped"`.** Default `{ws}`. Bisa `<charcode>` doc (generic) atau `{computed}` (strategy). (Flat list = set `variant:"flat"`, bukan `groupBy:""`.) |
| `statusLabels` | `danger◼Perlu tindak◼Perlu tindak★warn◼…★ok◼Aman◼Beres` | **(baru 2026-06-11)** map `value◼groupLabel◼pillLabel`, antar-entry `★`. Nyetir label accordion + ringkasan + pill panel. **Urutan entry = urutan render** (entry pertama = grup paling atas). Warna TIDAK di sini — tier `danger/warn/ok` di-map ke merah/amber/hijau oleh theme/renderer. Absen → default patrol. |
| `text` | `◆<an>◆<sn>◆…` | header ◆-pack (lihat slot di bawah) |
| `status` | `{ws}` / `<st>` / `ok` | strip kiri kartu (worst-status) |
| `panels[]` | — | array panel nav (di bawah) |

- `text` slot: slotJudulKosong◆`<an>`◆`<sn>`◆labelSearch◆hint◆emptyText. Slot judul kosong (title di app bar, BUKAN widget); leading `◆` = canonical (`json/list-item-card.json`). Header kartu: `<an>`="A Product Group" (atas), `<sn>`="S Product Group" (bawah). ✅ real data: `<an>`=cost center name, `<sn>`=site name.
- `panels[]` = array panel nav, di-render per kartu. Tiap panel: `icon` + `text` (label◆headline◆details) + `status` (pill: `{token}`/`<charcode>`/literal) + `route` + opsional `routeParam` sendiri (kalo beda dari level kartu) + **opsional `okText`** (override pill pas status `ok`). Beda dari `buttons` LIST_ITEM_CARD (itu aksi+dialog, bukan nav).
  - ⚠️ **`okText` sekarang OPSIONAL** — label pill default sudah dari `statusLabels` pillLabel (`ok`="Beres"). Isi `okText` HANYA kalau panel ini mau label-ok beda dari default global. Patrol case: kosong (kedua panel pakai "Beres").
- ⚠️ **`search`/`conditions` vs `searchFields` — DUA hal beda, jangan ketuker:**
  - `search`/`conditions` = **WHERE Firebase (server-side)**, nentuin doc MANA yang di-fetch (SQL `WHERE`). Layar 1 cost-center fetch SEMUA site tenant → dikosongin (`""`). Domain lain butuh kondisi (mis. `st◼active`, atau VID inject `av◼{ccVid}`) → isi `search`/`conditions`. Value: literal statis / token inject `{...}` / system stream `◀N▶`.
  - `searchFields` = **search box (client-side)**, field yg dicocokin pas user NGETIK teks di kotak cari (filter live di atas doc yg UDAH ke-fetch).
- **DROP dari versi lama:** `toDo` (mubazir, gak dibaca widget). `computeMode` & `ledgerCode` → DIBUANG (strategy terikat type, bukan flag). `staleMs` → `thresholdMs`. `tapContext` → `routeParam`. **`search`/`conditions` TETAP** (WHERE server), `searchFields` = TAMBAHAN (search box).

### 2.1 Mode generic (reusable ke domain lain)

Pakai `<charcode>` doc di `status`/`text` panel → render langsung, gak ada strategy jalan (pure generic). Contoh domain aset (grouped by status doc `<st>`):

```json
{
  "type": "LIST_MULTIPLE_PANEL_CARD",
  "vidtable": "20342033315492",
  "table": "84214220504259//asset",
  "searchFields": "an◆cd",
  "routeParam": "av◼assetVid",
  "showIcon": "TRUE",
  "variant": "grouped",
  "groupBy": "<st>",
  "statusLabels": "danger◼Rusak◼Rusak★warn◼Perlu servis◼Perlu servis★ok◼Sehat◼Sehat",
  "text": "◆<an>◆<cd>◆Cari aset◆Ketik nama aset◆Data tidak ditemukan",
  "status": "<st>",
  "panels": [
    {"icon": "build", "text": "Servis◆<sj> jadwal◆<sd>", "status": "<ss>", "route": "assetServiceDetail"},
    {"icon": "description", "text": "Dokumen◆<dn> file◆<df>", "status": "ok", "route": "assetDocsDetail"}
  ]
}
```

**Aturan token `status`/`text` panel:** boleh `{computedToken}` (kalo strategy aktif), `<docCharCode>` (ambil field doc), atau literal `ok`/`warn`/`danger`. Engine resolve generic → 3 bentuk jalan tanpa ubah kode.

**Status SELALU 3 tier baku** (`danger`/`warn`/`ok`) — warna dari theme (merah/amber/hijau). Yang beda antar-domain cuma **label** (di `statusLabels`). Doc `<st>`/`<ss>` harus resolve ke salah satu tier; kalau domain punya status sendiri (mis. `overdue`), dev map ke tier waktu nulis doc / di renderer — BUKAN bikin value baru di config. (Keputusan 2026-06-11; alternatif full-custom-vocab+hex ditolak — warna = render, bukan config.)

### 2.2 Grouping + ringkasan (`variant:"grouped"`)

- **`variant`** = fork layout. `"grouped"` → search + ringkasan rollup + accordion-per-status. `"flat"`/kosong → list kartu polos (renderer skip accordion + ringkasan). Grouping = beda layout → ranah `variant`, bukan toggle `groupBy:""`.
- **`groupBy`** (dibaca hanya kalau `variant:"grouped"`) = token level-kartu buat ngelompokin. Default `{ws}` (worst-status patrol). Generic: `<charcode>` doc.
- **Ringkasan auto-derive** dari `statusLabels` — TIDAK ada field `summary`. Renderer rakit `"{count} {groupLabel}"` per entry yang count>0, join ` · `. Patrol → "3 perlu tindak · 3 perhatian · 3 aman". Asset → "2 rusak · 1 perlu servis · 5 sehat".
- **Urutan grup** = urutan entry di `statusLabels` (entry pertama = accordion teratas). Gak ada field `sortOrder` terpisah.
- **Pill panel** = pillLabel dari `statusLabels` per tier; `panels[].okText` override opsional buat tier `ok` doang.

---

## 3. Konvensi token

| Notasi | Arti | Siapa isi |
|--------|------|-----------|
| `<...>` | Field yang **sudah ada di storage** (char-code dari doc `site`) | system (read langsung) |
| `{...}` | Variable yang **dev harus hitung / inject** | developer |

### Field storage `<>` (sudah ada — doc `site`, real Firebase)

Sumber: `$test/84214220504259//site` → satu doc = satu cost center.

| Token | Arti | Contoh nilai (real) |
|-------|------|---------------------|
| `<an>` | **cost center name** (baris-atas header kartu) | `A Product Group` |
| `<sn>` | **site name** (baris-bawah header kartu) | `S Product Group` |
| `<av>` | cost center VID | `83674161979544` |
| `<sv>` | site VID | `83674161979544` |
| `<nm>` | headcount needed (jumlah pegawai dibutuhkan) | `2` |
| `<st>` | status doc | `active` |
| `<af>` `<sf>` | slug/path (`tenant◆cost-center`) | `vtl◆product-group` |
| `<en>` | blob terenkripsi (jangan render) | — |

**`ll` = array of OBJECTS** (location list, di doc `site`). Tiap elemen titik:

| Field obj | Arti |
|-----------|------|
| `ln` | nama titik (join key ke event `ln`) |
| `li` | id titik / QR id (== event `lq`) |
| `la` `lo` | latitude / longitude |
| `ra` | radius (m) |

### Variable `{}` (dev buat)

| Token | Arti | Asal hitung |
|-------|------|-------------|
| `{llCount}` | jumlah titik | **frontend** `ll.length` (array `ll` di doc `site`) |
| `{hadir}` | jumlah pegawai hadir | count `workforce` (collection terpisah) |
| `{issues}` | teks masalah ("2 belum scan, 1 lupa clock-out") | count workforce |
| `{ps}` | status panel kehadiran (`ok`/`warn`/`danger`) | derived |
| `{staleCount}` | jumlah titik jeda lama | aggregate event |
| `{longestGap}` | jeda terlama (jam) | aggregate event |
| `{qs}` | status panel patroli (`ok`/`warn`/`danger`) | derived |
| `{ws}` | worst status per kartu (`danger`/`warn`/`ok`) | derived: status terburuk antar 2 panel. Dipakai: strip kiri kartu + grup accordion + ringkasan |
| `{tenantVid}` | segment path tenant (inject, analog `{docId}`) | system |
| `{ccVid}` | konteks cost center (`<av>`) yang di-inject ke page tujuan saat panel di-tap; page tujuan filter sendiri | system |

---

## 4. Logic perhitungan (untuk dev)

### 4.1 Panel Kehadiran (dari collection `workforce` — TERPISAH dari `site`)

⚠️ Pegawai **tidak** di doc `site`. Mereka di collection sibling `workforce` (`$test/{tenantVid}//workforce`). Join ke cost center via `sv`/`av` (cost center VID) == `<av>` doc site.

Field pegawai: `ci` (clock in), `co` (clock out).

- `{hadir}` = COUNT pegawai dengan `ci` terisi.
- `{issues}` = gabungan:
  - "X belum scan" → X = COUNT pegawai `ci` kosong.
  - "Y lupa clock-out" → Y = COUNT pegawai `ci` terisi **dan** `co` kosong (shift sudah lewat).
  - Kalau tidak ada masalah → "Semua beres".
- `{ps}` = `danger` jika ada "belum scan"; `warn` jika hanya ada masalah ringan; `ok` jika beres. (mapping final dev sesuaikan.)

### 4.2 Panel Patroli & Cleaning (dari `event/content`)

Field event: `ty` (type), `t` (timestamp epoch), `ln` (location name).

Gunakan **`t` (epoch, angka)** untuk hitung — **jangan** `ts` (string, display only).

```
jeda_titik   = now − MAX(t WHERE ln = titik AND ty = patrol)   // ms
{staleCount} = COUNT(titik WHERE jeda_titik ≥ 43200000)        // 12 jam
{longestGap} = MAX(jeda_titik) / 3600000   // ms → jam buat display
```

- Threshold default = **`43200000` ms (12 jam)** (di mock = `STALE_HOURS`; simpan ms biar konsisten sama `period` layar lain, sebaiknya configurable).
- `{qs}` = `warn` jika `{staleCount}` > 0, else `ok`.
- Kalau `{staleCount}` = 0 → tampilkan "Tidak ada jeda signifikan" (fallback di render).

### 4.3 Join event ↔ titik

- Daftar titik = array `ll` (array of objects) di doc `site`. Nama titik = `ll[].ln`.
- ⚠️ Event nyambung ke titik via **`ln` (nama titik) + `ty` (tipe event, mis. `report-patrol`)**: `event.ln == ll[].ln AND event.ty == <tipe-patrol>`. `ty` WAJIB (collection event campur banyak tipe). **`lq` (QR id) BUKAN buat join/filter** — cuma buat `{evidence}` (strong/weak).
- ⚠️ Match `ln` string harus **persis sama** dengan `ll[].ln`. Beda (typo/spasi) → event orphan, tidak masuk titik manapun.
- Titik di `ll` yang **belum ada event sama sekali** = belum pernah dipatroli. Saran: hitung sebagai jeda lama tapi label "belum pernah" (bukan "X jam"). **Keputusan final dev.**

### 4.4 Ringkasan status + grup accordion (dari `{ws}` tiap kartu)

Renderer kelompokkan kartu per **`groupBy`** (default `{ws}`), render accordion + baris ringkasan. **Label/urutan grup diambil dari `statusLabels`** (config), tapi ALGORITMA (count, group, sort) tetap dev-side. Hitung frontend dari kumpulan nilai `groupBy`:

- Ringkasan = COUNT kartu per status: "{nDanger} perlu tindak · {nWarn} perhatian · {nOk} aman".
- Grup accordion (urut: danger → warn → ok), tiap grup: label + count + collapsible.

**Kosakata status (konfirmasi):**

| nilai (`{ws}`/`{ps}`/`{qs}`) | warna | label grup/ringkasan | label pill panel |
|------|-------|----------------------|------------------|
| `danger` | merah | Perlu tindak | Perlu tindak |
| `warn` | amber | Perhatian | Perhatian |
| `ok` | hijau | Aman | Beres |

(pill panel `ok` = "Beres", tapi grup/ringkasan `ok` = "Aman" — sesuai mock.)

---

## 5. Pertanyaan / TODO dev

1. **Render type baru `LIST_MULTIPLE_PANEL_CARD`** — sibling `LIST_ITEM_CARD` + array `panels`. Layout: header (`text`) + strip warna (`status`) + N panel (tiap panel: icon + label + status pill + headline + details + chevron + route).
2. **`{llCount}`** = `ll.length` dihitung frontend — token/syntax-nya apa?
3. ✅ RESOLVED — **`routeParam`** = `docField◼token` (mis. `av◼ccVid`). Tap kartu → bawa `doc['av']` jadi token `ccVid` di layar tujuan; page tujuan filter sendiri `search: "av◼{ccVid}"`. Ganti hardcode `ccVid=doc['av']`.
4. **Penempatan di `text`** — pack semua di `text` (gak ada `content` terpisah). Urutan diusulkan: `judul◆<an>◆<sn>◆labelSearch◆hint`. Konfirmasi urutan.
5. ✅ RESOLVED — **`thresholdMs`** field (`43200000` ms = 12 jam). Configurable di JSON, dibaca strategy.
6. **Kosakata status** — konfirmasi nilai (`ok`/`warn`/`danger`) + mapping warna (hijau/kuning/merah) + label (Aman/Beres untuk `ok`).
7. **Grup status + ringkasan** — di-render frontend dari `{ws}` tiap kartu (accordion danger→warn→ok + baris count)? Atau perlu config field di sheet?

---

## 6. Di luar scope dokumen ini

- **Page wrapper** (`title`, `hideBottomBar`, `children`) = bagian spreadsheet engineer.
- **Layar detail Patroli & Cleaning** (daftar titik + timeline kunjungan) = dokumen spec berikutnya.
