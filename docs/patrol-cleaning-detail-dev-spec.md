# Dev Spec — Patroli & Cleaning Detail per Cost Center (`LIST_STATISTIC_CARD`)

**Tanggal:** 2026-06-02
**Fitur:** Patroli & Cleaning — Layar 2 (daftar titik per cost center; route `patroliCleaningPerSite` dari panel kartu cost center)
**Sumber desain:** `src/App.jsx` → `ScreenPatrol` (L769–816), `SummaryNum` (L817–826), `PointRow` (L827–856)
**Scope dokumen ini:** SATU widget penuh = tab periode + box statistik + search + daftar kartu titik. App bar/title ("BP Legok" + back) = page wrapper (bagian spreadsheet engineer).

---

## 1. Tujuan

Layar detail satu cost center: daftar titik patroli & cleaning (Gudang Bahan, Genset, Mushola, dll). Seluruh layar = **1 widget** (`LIST_STATISTIC_CARD`, type baru):

1. **Tab periode** — Hari ini / 24 jam / Minggu ini (configurable di sheet).
2. **Box statistik** — 3 angka (Total kunjungan / Titik tanpa kunjungan / Lokasi diketik), dihitung dalam window tab aktif.
3. **Search** — cari titik by nama.
4. **Daftar kartu titik** — tiap kartu 1 titik, tap → timeline kunjungan titik (1 card = 1 route).

`LIST_ITEM_CARD` biasa = list saja (1 card = 1 route). Di sini list dibungkus tab periode + box statistik + search dalam satu widget → type baru.

---

## 2. Widget JSON

```json
{
  "type": "LIST_STATISTIC_CARD",
  "ledgerCode": "event-patrol",
  "vidtable": "{tablevid}",
  "table": "$test/{tenantVid}//site",
  "search": "av◼{ccVid}",
  "conditions": "[[◀av▶◼{ccVid}]]",
  "text": "Cari titik◆Ketik nama titik◆Data tidak ditemukan",
  "period": "24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000",
  "periodDefault": "86400000",
  "stats": "{totalVisits}◆Total kunjungan★{noVisitCount}◆Titik tanpa kunjungan★{typedCount}◆Lokasi diketik",
  "content": "<ln>◆{type}◆Terakhir {lastAgo} · {lastBy}◆{visits} kunjungan dalam {period}",
  "status": "{ps}",
  "badge": "{evidence}",
  "route": "patroliCleaningPointTimeline"
}
```

- Field list-level (`ledgerCode`/`vidtable`/`table`/`search`/`text`/`route`) = mirip `LIST_ITEM_CARD`.
- ⚠️ **Data source = SATU doc `site`** (cost center yang di-tap, match `<av>`==`{ccVid}` inject), bukan collection event. Tiap kartu titik = satu elemen `ll[]` di doc itu (nama = `ll[].ln`). Agregat kunjungan = left-join event ledger per titik (lihat §5.1).
- `period` = tab bar. Tiap tab `label◼offsetMs`, `★` antar tab. `periodDefault` = offset tab aktif awal.
- `stats` = 3 box statistik. Tiap box `value◆label`, `★` antar box.
- `content` = template kartu titik, dipack `◆` (nama◆tipe◆baris terakhir◆baris jumlah).
- `status` = strip kiri kartu (stale). `badge` = pill bukti. `route` = tujuan tap kartu (timeline titik).

---

## 3. Tab periode — config & logic (epoch ms offset)

**Simpan `label◼offsetMs`** (`offsetMs` = lebar window dalam milidetik). Dev SATU rumus: `start = now − offsetMs`. Semua tab **rolling** → offset tetap cukup, gak perlu math kalender/timezone.

| label | offsetMs | lower bound window |
|-------|----------|--------------------|
| 24 jam | `86400000` | `now − 86400000` |
| 7 hari | `604800000` | `now − 604800000` |
| 30 hari | `2592000000` | `now − 2592000000` |

- upper bound = `now` untuk semua.
- Configurable: edit list `period` di sheet, tambah/kurang tab bebas (mis. `90 hari◼7776000000`).
- Semua count (stats + per-kartu) filter event `t` (epoch ms) dalam `[start, now]`. **Pakai `t`, JANGAN `ts` (string display).**
- **Kenapa ms offset, bukan keyword `today`/`week`:** tab kalender (midnight/Senin) butuh resolve timezone + math kalender per code → ribet buat dev. ms offset = `now − angka`, satu rumus, konsisten sama timeline. Trade: tab jadi **rolling** (hilang anchor "Hari ini"/"Minggu ini"); buat monitoring patroli rolling lebih konsisten (lookback sama ga peduli jam berapa). Kalau nanti butuh anchor kalender lagi → balik ke keyword khusus tab itu.

---

## 4. Konvensi token

| Notasi | Arti | Siapa isi |
|--------|------|-----------|
| `<...>` | Field yang sudah ada di storage (char-code schema) | system (read langsung) |
| `{...}` | Variable yang dev hitung / inject | developer |

### Field storage `<>`

| Token | Arti |
|-------|------|
| `<ln>` | nama titik (`ll[].ln`, array of objects di doc `site`) |
| `<li>` | id titik / QR id (`ll[].li`, join ke event `lq`) |

### Variable `{}` (dev hitung)

| Token | Arti | Asal hitung |
|-------|------|-------------|
| `{type}` | kategori titik (PATROLI / CLEANING) | **TBD** — kategori titik di `ll`, atau derive dari `ty` event (konfirmasi) |
| `{lastAgo}` | jeda kunjungan terakhir (mnt/jam/hari lalu) | `now − MAX(t)` event di titik, diformat |
| `{lastBy}` | pelaku kunjungan terakhir | `cn` event terbaru di titik |
| `{visits}` | jumlah kunjungan dalam window | COUNT event di titik dalam `[start, now]` |
| `{period}` | label tab aktif ("24 jam") | dari tab terpilih |
| `{ps}` | status strip kartu (`ok`/`warn`) | `warn` jika `(now − MAX(t)) ≥ 43200000` (12 jam stale), else `ok` |
| `{evidence}` | pill bukti (`strong`→"Bukti kuat" hijau / `weak`→"GPS saja" amber) | dari metode kunjungan terakhir: ada QR `lq` → strong; ketik/GPS → weak |
| `{totalVisits}` | total kunjungan dalam window | COUNT semua event (`ty` patrol/clean) dalam window |
| `{noVisitCount}` | titik tanpa kunjungan | COUNT titik di `ll` yang 0 event dalam window |
| `{typedCount}` | lokasi diketik manual | COUNT event dalam window yang lokasinya diketik (tanpa QR `lq`) |
| `{tablevid}` `{tenantVid}` | segment dinamis (inject) | system |
| `{ccVid}` | konteks cost center (`<av>`) yang di-inject dari kartu cost center; widget filter doc `site` ini | system |

---

## 5. Logic perhitungan

### 5.1 Sumber data

- **Titik (authoritative)** = array `ll` (array of objects) di doc `site` cost center ini. Titik 0-kunjungan WAJIB dari `ll` (gak ada di event ledger) → dibutuhkan untuk `{noVisitCount}`.
- **Kunjungan** = event ledger (`event/content`), field `ty` (type), `t` (epoch), `ln` (location name), `cn` (creator), `lq` (QR id).
- Dev expand `ll[]` → baris, left-join agregat event per titik (join event `lq` == `ll[].li`; fallback event `ln` == `ll[].ln` exact match untuk scan manual).

### 5.2 Per kartu titik (dalam window aktif)

```
visits_titik   = COUNT(event WHERE ln = titik AND t ∈ [start, now])
lastAgo_titik  = now − MAX(t WHERE ln = titik)        // format mnt/jam/hari
lastBy_titik   = cn dari event t-terbaru di titik
{ps}           = warn jika (now − MAX(t)) ≥ 43200000 ms (12 jam), else ok
{evidence}     = strong jika event terakhir punya lq (QR); weak jika diketik/GPS
```

- Urut kartu: jeda terlama di atas (sort `{lastAgo}` desc).
- Titik di `ll` tanpa event sama sekali = belum pernah dipatroli → masuk `{noVisitCount}`, label kunjungan fallback (keputusan dev).

### 5.3 Box statistik (dalam window aktif)

```
{totalVisits}  = COUNT(event WHERE ty ∈ {patrol, clean} AND t ∈ [start, now])
{noVisitCount} = COUNT(titik di ll WHERE 0 event dalam window)
{typedCount}   = COUNT(event dalam window WHERE diketik manual / tanpa lq)
```

Tone box (warna): dev derive (mis. `noVisitCount`/`typedCount` > 0 → kuning, else hijau).

### 5.4 Threshold stale

Default `43200000` ms (12 jam, sebaiknya configurable, simpan ms biar konsisten sama `period` — sama Layar 1).

---

## 6. Navigasi

- Tap kartu titik → `route: "patroliCleaningPointTimeline"` (nama final dev/user).
- Konteks titik (nama titik + site) ke-inject otomatis via token (pola `<request_vid>`/`{docId}`). Page timeline filter sendiri pakai `search`/`conditions` by nama titik + site. Tidak ada `passParams`.

---

## 7. TODO / pertanyaan dev

1. **Render type baru `LIST_STATISTIC_CARD`** — 1 widget = tab `period` (`label◼code`) + box `stats` + search + list kartu (`content`+`status`+`badge`+`route`). Bisa?
2. **`badge` field** untuk pill bukti — OK, atau fold ke `content` text?
3. **`{type}` source** — `ll` simpan kategori titik, atau derive dari `ty` event?
4. **Tab klik → re-filter** — pastikan ganti tab re-compute stats + per-kartu pakai window baru (frontend).
5. **Threshold stale (`43200000` ms = 12 jam)** — taruh di mana biar configurable (ms, konsisten sama `period`).
6. **Kosakata status** — `ok`/`warn` + warna (hijau/kuning/amber), + evidence `strong`/`weak`.

---

## 8. Di luar scope dokumen ini

- **App bar / title** ("BP Legok" + tombol back) = page wrapper (bagian spreadsheet engineer).
- **Layar timeline kunjungan satu titik** (Layar 3) = dokumen spec berikutnya.
