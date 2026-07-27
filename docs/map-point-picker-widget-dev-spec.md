# Dev Spec (Flutter) — widget `MAP_POINT_PICKER` (pilih titik koordinat: GPS / cari / geser peta)

**Tanggal:** 2026-07-17
**Buat:** dev Flutter (renderer — widget BARU generik, form-field family seperti TXF).
**Konsumen pertama:** form master **Titik Patroli / Titik Cleaning** — client (role tertentu) bikin titik lokasi sendiri dari app, pengganti input koordinat via spreadsheet (yang rawan korup desimal locale id_ID — root masalah selama ini).
**Peta:** OpenStreetMap (flutter_map + tile OSM). **Search & reverse-geocode:** Nominatim.

---

## 0. Problem statement

> Admin/petugas harus bisa ngisi koordinat akurat (lat,long) semudah ngisi textField — tanpa pernah mengetik angka koordinat manual, dan dengan NAMA LOKASI yang kebaca manusia.

Widget ini = form field biasa (punya `position` kaya TXF), nilai akhirnya string `"lat,long"`.

## 1. Anatomi & UX (keputusan user, terkunci)

### 1a. Di form — field ringkas + 2 tombol (BUKAN peta inline)

```
SEBELUM dipilih:                      SESUDAH dipilih:
┌────────────────────────────────┐    ┌────────────────────────────────┐
│ Titik Lokasi                   │    │ Titik Lokasi              ✓    │
│ ┌────────────────────────────┐ │    │ 📍 Pos Satpam Gerbang Timur    │
│ │ Belum ada lokasi terpilih  │ │    │    Jl. BSD Raya Utama, Serpong │
│ └────────────────────────────┘ │    │    -6.30215, 106.65342         │
│ [📍 Lokasi Saya] [🗺️ Cari di Peta] │    │ [Ganti Lokasi]                 │
└────────────────────────────────┘    └────────────────────────────────┘
```

- **[Lokasi Saya]** = GPS 1 tap → langsung keisi (reverse-geocode buat nama) → user bisa lanjut atau tap Ganti buat fine-tune.
- **[Cari di Peta]** / **[Ganti Lokasi]** → buka layar peta fullscreen (1c).
- **Nama lokasi = teks utama** (revisi user: koordinat doang gak manusiawi); alamat baris kedua; koordinat baris kecil ketiga.

### 1b. State
`empty` → `loading` (GPS/geocode, spinner di field) → `selected` (✓). Gagal GPS/izin ditolak → pesan dari `text`, tombol tetap aktif (coba lagi / lewat peta).

### 1c. Layar peta fullscreen — pin tengah + geser peta (pola Gojek)

```
┌────────────────────────────────┐
│ 🔍 Cari alamat / tempat…       │  ← Nominatim search, hasil = list tap-able
│┌──────────────────────────────┐│
││        [peta OSM]            ││
││            📍  ← pin DIAM    ││  ← PETA yang digeser, pin tetap center
││     (peta yang digeser)      ││
│└──────────────────────────────┘│
│ 📍 Pos Satpam Gerbang Timur    │  ← update tiap peta berhenti (reverse-geocode, debounce)
│    -6.30215, 106.65342   [GPS] │  ← tombol GPS = lompat ke posisi sekarang
│ [      Pakai Lokasi Ini      ] │
└────────────────────────────────┘
```

- Search → pilih hasil → peta animasi ke titik itu → user boleh geser buat fine-tune → **Pakai Lokasi Ini**.
- Reverse-geocode dipanggil saat **map idle** (debounce, §4) — bukan tiap frame geser.

## 2. Kontrak config (semua label dari `text` — nol hardcode)

```json
{"type":"MAP_POINT_PICKER","label":"[LABEL]","position":[POSITION],"addressPosition":"[ADDRESSPOSITION]","latPosition":"[LATPOSITION]","lngPosition":"[LNGPOSITION]","currentValue":"","initialCenter":"[INITIALCENTER]","zoom":[ZOOM],"searchEnabled":"[SEARCHENABLED]","searchCountry":"[SEARCHCOUNTRY]","text":"[TEXT]"}
```

| param | fungsi | contoh titik patroli |
|---|---|---|
| `label` | judul field | `Titik Lokasi` |
| `position` | ◁N▷ nilai UTAMA = `"lat,long"` | `12` |
| `addressPosition` | OPSIONAL — nama/alamat hasil geocode ke ◁N▷ sendiri; kosong = tampilan doang | `13` |
| `latPosition` / `lngPosition` | OPSIONAL — lat & long TERPISAH ke 2 ◁N▷ (buat schema `la`/`lo` terpisah kaya koleksi `location`); kosong = skip | `14` / `15` |
| `initialCenter` | `"lat,long"` pusat peta awal saat belum ada nilai (kosong = coba GPS, gagal → Indonesia view) | `-6.302,106.653` |
| `zoom` | zoom awal fullscreen (Number) | `17` |
| `searchEnabled` | `TRUE`/`FALSE` tampil search bar | `TRUE` |
| `searchCountry` | bias hasil Nominatim (`countrycodes`) | `id` |
| `text` | ◆-segmen: 0 placeholder kosong · 1 tombol GPS · 2 tombol peta · 3 tombol ganti · 4 hint search · 5 tombol pakai · 6 loading · 7 error GPS/izin · 8 error jaringan | `Belum ada lokasi terpilih◆📍 Lokasi Saya◆🗺️ Cari di Peta◆Ganti Lokasi◆Cari alamat / tempat…◆Pakai Lokasi Ini◆Mencari lokasi…◆GPS gagal — cek izin lokasi◆Jaringan bermasalah, coba lagi` |

## 3. Kontrak output (KRITIS — anti-korupsi desimal)

- `position` → string `"lat,long"`: **titik desimal (bukan koma), 6 angka desimal** (≈0.1 m), pemisah koma tanpa spasi. Contoh: `-6.302154,106.653428`. **JANGAN PERNAH pakai formatter locale** — ini persis bug spreadsheet id_ID yang widget ini gantikan.
- `latPosition`/`lngPosition` (kalau diisi) → string angka masing-masing, aturan format sama.
- `addressPosition` (kalau diisi) → `display_name` Nominatim (atau hasil pilihan search).
- Nilai ke-capture pola TXF standar → dipakai `addToEvent`/`addToTable` via ◁N▷ seperti biasa.

## 4. Teknis OSM + Nominatim (aturan pakai — WAJIB)

1. **Tile OSM**: flutter_map + `tile.openstreetmap.org` WAJIB kirim **User-Agent/package id** app (kebijakan OSMF). Kalau trafik produksi membesar → pindah tile provider (MapTiler/Thunderforest) = ganti 1 URL, bukan arsitektur.
2. **Nominatim** (search + reverse): **max 1 request/detik**, User-Agent wajib, no autocomplete-per-keystroke — search di-trigger **submit / debounce ≥600ms**; reverse-geocode cuma saat **map idle** (debounce ~800ms) + saat GPS fix. Cache respons terakhir.
3. Reverse gagal / offline: koordinat TETAP kepakai (nama fallback = `"lat,long"` — jangan blok pemilihan karena geocode mati; koordinat = data primer, nama = pemanis).
4. GPS: pakai plugin lokasi existing app; tampilkan akurasi kalau >30 m (badge kecil "±45 m" — user tau harus fine-tune).

## 5. Resolved JSON — konsumen pertama (form Tambah Titik Patroli)

```json
{"type":"MAP_POINT_PICKER","label":"Titik Lokasi","position":12,"addressPosition":"","latPosition":"14","lngPosition":"15","currentValue":"","initialCenter":"","zoom":17,"searchEnabled":"TRUE","searchCountry":"id","text":"Belum ada lokasi terpilih◆📍 Lokasi Saya◆🗺️ Cari di Peta◆Ganti Lokasi◆Cari alamat / tempat…◆Pakai Lokasi Ini◆Mencari lokasi…◆GPS gagal — cek izin lokasi◆Jaringan bermasalah, coba lagi"}
```

Submit page (di luar spec widget): nulis doc `location` `{sv, li, la◼◁14▷, lo◼◁15▷, ra, ln}` — page + Widget template row nyusul pas renderer landing (pola config-ahead TIDAK dipakai buat type baru: renderer dulu, config nyusul).

## 6. Acceptance

1. Tap **Lokasi Saya** → field keisi nama + alamat + koordinat dalam ≤5 detik (GPS normal); ◁12▷ = `"lat,long"` format §3.
2. **Cari di Peta** → ketik "monas" → pilih hasil → peta ke Monas → geser dikit → nama & koordinat update → **Pakai Lokasi Ini** → field keisi.
3. Pin DIAM di tengah, peta yang geser; reverse-geocode gak nembak tiap frame (cek log: idle-only, ≤1 rps).
4. Offline/geocode mati → pilih titik tetap bisa, nama fallback koordinat, error text dari `text` segmen 8.
5. Nilai tersimpan SELALU titik-desimal 6 dp — device locale id_ID gak ngubah format.
6. `latPosition`/`lngPosition`/`addressPosition` kosong = nol efek (cuma `position` utama).
7. Nol string hardcode di Flutter — semua dari `text`/`label`.

## 7. Asumsi & risiko (surfaced, belum divalidasi)

- [ ] **Nominatim publik cukup** buat volume client (input master = jarang) — kalau nanti dipakai high-frequency, self-host/ganti provider.
- [ ] **1 widget = 1 nilai**: satu form satu titik. Multi-titik (rute patroli sekaligus) = di luar scope, bikin varian nanti.
- [ ] Geofence engine existing baca `la`/`lo` string desimal-titik dari koleksi `location` — verifikasi sekali pas titik pertama dibikin via app (bukan sheet).

## 8. Not Doing (dan kenapa)

- **Peta inline di form** — form master jadi berat (tile load tiap buka); fullscreen on-demand cukup (keputusan user).
- **Ketik koordinat manual** — justru sumber bug yang mau dibunuh; kalau ada yang hafal koordinat, paste ke search Nominatim juga jalan.
- **Simpan radius geofence (`ra`) di widget ini** — itu field angka biasa di form yang sama (TXF), bukan urusan picker.
- **Draw polygon/area** — titik + radius udah model geofence yang jalan; polygon = proyek lain.
- **Google Maps/Places** — butuh API key + billing; OSM+Nominatim gratis dan cukup (keputusan user: open street).

---

**Referensi:** pola form-field TXF (`position`, label via config), `docs/scanner-widget-dev-spec.md` (sibling: widget baru trimmed dari `location`), koleksi `location` schema (dict book: `sv/li/la/ln/lo/ra`, desimal disimpan text gara-gara locale — masalah yang spec ini pensiunkan), aturan config-driven labels.
