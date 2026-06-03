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

Solusi: **type baru `LIST_MULTIPLE_PANEL_CARD`** (sibling LIST_ITEM_CARD). Pinjem semua field list-level dari LIST_ITEM_CARD (`ledgerCode`/`vidtable`/`table`/`search`/`toDo`/`text`/`showIcon`/`showProgress`), tambah array **`panels`** = N panel nav (tiap panel: `icon` + `text` + `status` + `route`). Renderer dev bikin baru.

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
  "ledgerCode": "workforce",
  "vidtable": "{tablevid}",
  "table": "$test/{tenantVid}/ref/{site}//workforce",
  "search": "",
  "toDo": "",
  "text": "◆<an>◆<sn>◆Cari cost center◆Ketik nama cost center◆Data tidak ditemukan",
  "status": "{ws}",
  "showIcon": "FALSE",
  "showProgress": "FALSE",
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

- field list-level (`ledgerCode`/`vidtable`/`table`/`search`/`toDo`/`showIcon`/`showProgress`) = pinjem persis dari `LIST_ITEM_CARD` biar dev familiar.
- `text` (level atas) = dipack `◆`: slotJudulKosong◆`<an>`◆`<sn>`◆labelSearch◆hint◆emptyText. Slot judul kosong (title di app bar, BUKAN bagian widget); leading `◆` = canonical (lihat `json/list-item-card.json`). Search = "Cari cost center". Header kartu: baris-atas = nama cost center (`<an>`), baris-bawah = site (`<sn>`) — **konfirmasi char-code mana yang nama cost center.**
- `status` (level atas) = warna strip kiri kartu = status terburuk antar panel (`{ws}`).
- `panels` = array panel nav, di-render per kartu. Tiap panel: `icon` + `text` (label◆headline◆details) + `status` (pill) + `route`. Beda dari `buttons` LIST_ITEM_CARD (itu aksi+dialog, bukan nav).

---

## 3. Konvensi token

| Notasi | Arti | Siapa isi |
|--------|------|-----------|
| `<...>` | Field yang **sudah ada di storage** (char-code dari schema workforce) | system (read langsung) |
| `{...}` | Variable yang **dev harus hitung / inject** | developer |

### Field storage `<>` (sudah ada — schema `ref/workforce`)

| Token | Arti |
|-------|------|
| `<sn>` | site name |
| `<an>` | cost center / area name |
| `<nm>` | headcount needed (jumlah pegawai dibutuhkan) |
| `<sv>` `<av>` | site VID / cost center VID (untuk konteks route) |

### Variable `{}` (dev buat)

| Token | Arti | Asal hitung |
|-------|------|-------------|
| `{llCount}` | jumlah titik | **frontend** `ll.length` (array `ll` di doc workforce) |
| `{hadir}` | jumlah pegawai hadir | count workforce |
| `{issues}` | teks masalah ("2 belum scan, 1 lupa clock-out") | count workforce |
| `{ps}` | status panel kehadiran (`ok`/`warn`/`danger`) | derived |
| `{staleCount}` | jumlah titik jeda lama | aggregate event |
| `{longestGap}` | jeda terlama (jam) | aggregate event |
| `{qs}` | status panel patroli (`ok`/`warn`/`danger`) | derived |
| `{ws}` | worst status per kartu (`danger`/`warn`/`ok`) | derived: status terburuk antar 2 panel. Dipakai: strip kiri kartu + grup accordion + ringkasan |
| `{tenantVid}` `{site}` | segment path dinamis (inject, analog `{docId}`) | system |

---

## 4. Logic perhitungan (untuk dev)

### 4.1 Panel Kehadiran (dari `ref/workforce`, sub-doc per pegawai)

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

- Daftar titik = array `ll` (location list) di doc workforce.
- Event nyambung ke titik via **`ln` (event) == nama di `ll` (exact match)**.
- ⚠️ Lokasi yang diketik manual harus **persis sama** dengan nama di `ll`. Kalau beda (typo/spasi) → event orphan, tidak masuk titik manapun.
- Titik di `ll` yang **belum ada event sama sekali** = belum pernah dipatroli. Saran: hitung sebagai jeda lama tapi label "belum pernah" (bukan "X jam"). **Keputusan final dev.**

### 4.4 Ringkasan status + grup accordion (dari `{ws}` tiap kartu)

Renderer kelompokkan kartu per `{ws}`, render accordion + baris ringkasan. Hitung frontend dari kumpulan `{ws}`:

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
3. **Token inject konteks cost-center** ke page tujuan (analog `<request_vid>` / `{docId}`) — namanya apa? Page tujuan akan filter sendiri pakai `search: "<col>◼<token>"` + `conditions`.
4. **Penempatan di `text`** — `LIST_ITEM_CARD` pack semua di `text` (gak ada `content` terpisah). Urutan diusulkan: `judul◆<sn>◆<an>◆labelSearch◆hint`. Konfirmasi urutan.
5. **Threshold jeda (`43200000` ms = 12 jam)** — taruh di mana biar configurable (ms, konsisten sama `period` layar lain)?
6. **Kosakata status** — konfirmasi nilai (`ok`/`warn`/`danger`) + mapping warna (hijau/kuning/merah) + label (Aman/Beres untuk `ok`).
7. **Grup status + ringkasan** — di-render frontend dari `{ws}` tiap kartu (accordion danger→warn→ok + baris count)? Atau perlu config field di sheet?

---

## 6. Di luar scope dokumen ini

- **Page wrapper** (`title`, `hideBottomBar`, `children`) = bagian spreadsheet engineer.
- **Layar detail Patroli & Cleaning** (daftar titik + timeline kunjungan) = dokumen spec berikutnya.
