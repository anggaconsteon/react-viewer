# Dev Spec — Timeline Kunjungan per Titik (`TIMELINE` variant `periodic`)

**Tanggal:** 2026-06-02
**Fitur:** Patroli & Cleaning — Layar 3 (riwayat kunjungan 1 titik). Callback name: **timeline**.
**Sumber desain:** `src/App.jsx` → `ScreenTimeline` (L866–963), `RANGES` (L861), `VISITS` (L127–134), `EvidenceBadge` (L139)
**Route masuk:** dari kartu titik di **list site detail** (`route: "patroliCleaningPointTimeline"`).
**Scope dokumen ini:** widget timeline (header + range tab + entries + gap marker + nota). App bar/title + back = page wrapper (bagian spreadsheet engineer).

---

## 1. Tujuan

Riwayat kunjungan satu titik (mis. Gudang Bahan): daftar kronologis tiap kunjungan + jeda signifikan antar kunjungan. Read-only, immutable.

**Widget = `TIMELINE` type existing, variant BARU `periodic`** (variant biasa = `timeline`, lihat `json/incident user.json`). Type sama (widget riwayat-event), variant beda biar fokus seperti mockup: ada **title + subtitle + range tab**. Tambahan variant `periodic`: `title`/`subtitle` terpisah, range tab (`period`), gap marker (`divider`), evidence/method (`badge`) per entry.

---

## 2. Widget JSON

```json
{
  "type": "TIMELINE",
  "variant": "periodic",
  "flag": "timeline",
  "ledgerCode": "event-patrol",
  "table": "$test/{tenantVid}/event//{eventTable}",
  "search": "ln◼<point>",
  "conditions": "[[◀ln▶◼<point>◁site▷◼<site>]]",
  "period": "24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000",
  "periodDefault": "604800000",
  "title": "<ln>",
  "subtitle": "{type} · {visitCount} Kunjungan Periode Ini",
  "text": "<ts>◆oleh <cn>◆{method}◆<d>",
  "badge": "{evidence}",
  "divider": "{gap}"
}
```

- `variant: "periodic"` = variant baru (biasa `timeline`). Renderer pakai variant ini buat layout title+subtitle+range tab.
- `table` = **event ledger** (bukan workforce). Dev isi nama collection event (`{eventTable}`).
- `search` / `conditions` = filter event by titik (`ln`) + site, via token inject (analog `<request_vid>` di TIMELINE incident). Nama token final = keputusan dev.
- `period` = range tab (`label◼offsetMs`, `★` antar tab). `offsetMs` = lebar window dalam milidetik. `periodDefault` = offset awal.
- `title` = nama titik (header besar). `subtitle` = "{type} · {visitCount} Kunjungan Periode Ini" (ikut range aktif).
- `text` = template 1 entry, dipack `◆`: when◆oleh◆method◆note (judul header pindah ke `title`/`subtitle`).
- `badge` = evidence pill per entry. `divider` = gap marker (disisip antar entry oleh renderer).

---

## 3. Range tab — config & logic (epoch ms offset)

Simpan `label◼offsetMs` (BUKAN keyword `24h`/`7d`). `offsetMs` = lebar window dalam milidetik. Dev SATU rumus: `start = now − offsetMs`. Semua tab **rolling** (gak ada anchor kalender) → offset tetap cukup.

| label | offsetMs | window lower bound |
|-------|----------|--------------------|
| 24 jam | `86400000` | `now − 86400000` |
| 7 hari | `604800000` | `now − 604800000` |
| 30 hari | `2592000000` | `now − 2592000000` |

- upper bound = `now`. Filter entry pakai event `t` (epoch, ms). Display `<ts>` (string) buat tampil saja.
- Configurable: edit list `period` di sheet, tambah/kurang tab bebas (mis. `90 hari◼7776000000`).
- **Kenapa ms offset, bukan keyword:** dev gak perlu kamus resolve + math kalender/timezone. Cukup kurangin angka dari `now`.

---

## 4. Konvensi token

| Notasi | Arti | Siapa isi |
|--------|------|-----------|
| `<...>` | Field yang sudah ada di storage (event char-code) | system (read langsung) |
| `{...}` | Variable yang dev hitung / inject | developer |

### Field storage `<>` (event ledger)

| Token | Arti |
|-------|------|
| `<ln>` | nama titik (header + filter) |
| `<ts>` | waktu kunjungan (string display) |
| `<cn>` | nama pelaku ("oleh ...") |
| `<d>` | catatan kunjungan (opsional, italic) |
| `<t>` | waktu epoch (HITUNG gap/window — bukan display) |
| `<lq>` | QR id (penanda bukti kuat) |

### Variable `{}` (dev)

| Token | Arti | Asal hitung |
|-------|------|-------------|
| `{method}` | "Scan QR + foto" / "Lokasi diketik + foto" | ada `<lq>` → QR; kosong → ketik |
| `{evidence}` | pill bukti (`strong`→"Bukti kuat" hijau / `weak`→"GPS saja" amber) + warna dot | ada `<lq>` → strong; kosong → weak |
| `{gap}` | divider "Jeda X jam" antar 2 kunjungan berurutan | `t[i-1] − t[i]` (ms); tampil hanya jika ≥ `43200000` (12 jam) |
| `{type}` | kategori titik (header) | TBD — kategori di `ll` atau derive dari `ty` event (sama list site detail) |
| `{visitCount}` | jumlah kunjungan dalam range (header) | COUNT entry dalam window |
| `{period}` | label range aktif | dari tab terpilih |
| `{tenantVid}` `{site}` `<point>` | segment/filter inject | system |

---

## 5. Logic

### 5.1 Filter & urut
- Ambil event WHERE `ln` = titik AND site = current AND `t` ∈ window range aktif.
- Urut **terbaru di atas** (timeline desc).

### 5.2 Gap marker (`{gap}`)
```
gap_ms  = t[atas] − t[bawah]                    // antar 2 entry berurutan (epoch ms)
gap_jam = gap_ms / 3600000                       // buat display "Jeda X jam"
tampil "Jeda {gap_jam} jam" HANYA jika gap_ms ≥ 43200000   // 12 jam
```
Renderer sisip divider di antara 2 entry. Threshold = `43200000` ms (12 jam, configurable, simpan ms biar konsisten sama `period`).

### 5.3 Evidence & method (per entry)
- `<lq>` terisi → `{evidence}` = strong (dot hijau, "Bukti kuat"), `{method}` = "Scan QR + foto".
- `<lq>` kosong → `{evidence}` = weak (dot amber, "GPS saja"), `{method}` = "Lokasi diketik + foto".

### 5.4 Header (title + subtitle)
- `title` = `<ln>` (nama titik), header besar.
- `subtitle` = "{type} · {visitCount} Kunjungan Periode Ini". `{visitCount}` ikut range aktif (re-compute saat ganti tab).
- Header ADA di widget (variant `periodic`), BUKAN di wrapper — beda dari variant `timeline` biasa.

### 5.5 Nota immutable (transparency)
Teks statik: "Catatan tak bisa diubah. Setiap kunjungan terkunci sejak dibuat. Sistem tidak menyajikan rata-rata/frekuensi normal." (event ledger append-only → cocok.) Render via note/wrapper.

---

## 6. Navigasi
- Masuk dari kartu titik (list site detail), route `patroliCleaningPointTimeline`. Konteks titik + site ke-inject otomatis (pola `<request_vid>`); timeline filter sendiri via `search`/`conditions`. Tidak ada `passParams`.
- Timeline = read-only, gak ada route keluar per entry.

---

## 7. TODO / pertanyaan dev
1. **Variant `periodic` di `TIMELINE`** — render variant baru (title+subtitle+range tab+gap divider) di type TIMELINE existing? Type tetep TIMELINE, beda `variant` aja (biasa `timeline`).
2. **Token filter titik** (analog `<request_vid>`) — nama final? Filter by nama titik (`ln`) cukup, atau pakai vid titik?
3. **`{type}` source** — kategori titik di `ll` atau dari `ty` event? (sama list site detail)
4. ~~Header — slot judul `text` atau wrapper?~~ → RESOLVED: `title`/`subtitle` terpisah di widget (variant `periodic`).
5. **Threshold gap (`43200000` ms = 12 jam)** — taruh di mana biar configurable (ms, konsisten sama `period`).
6. **`badge` + `divider`** field — OK, atau fold evidence/gap ke `text`?

---

## 8. Di luar scope dokumen ini
- App bar / title + back = page wrapper (bagian spreadsheet engineer).
- Layar sebelumnya (list cost center, list site detail) = dokumen masing-masing.
