# Patrol Point List — Merge "Typed Location" Dev Spec

**Tanggal:** 2026-06-10
**Widget:** `LIST_STATISTIC_CARD` (strategy patrol, `ledgerCode:"site"`)
**Route:** `vertikaTeknoLokaciptaPatrolPointTimeline`
**Tujuan:** List titik patrol default = titik resmi dari `site.ll`. Tambah: gabung (merge) lokasi yang **diketik manual** oleh operator (tercatat di `event`, `ty=report-patrol`) yang **belum terdaftar** sebagai titik resmi, supaya muncul juga sebagai kartu di list.

---

## 1. JSON

```json
{
  "type": "LIST_STATISTIC_CARD",
  "vidtable": "20342033315492",
  "table": "84214220504259//site",
  "mergeTyped": "ln",
  "search": "av◼{ccVid}",
  "conditions": "[[◀av▶◼{ccVid}]]",
  "text": "Cari titik◆Ketik nama titik◆Data tidak ditemukan",
  "period": "24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000",
  "periodDefault": "86400000",
  "stats": "{totalVisits}◆Total kunjungan★{noVisitCount}◆Titik tanpa kunjungan★{typedCount}◆Lokasi diketik",
  "content": "<ln>◆PATROLI◆Terakhir {lastAgo} · {lastBy}◆{visits} kunjungan dalam {period}",
  "status": "{ps}",
  "badge": "{evidence}",
  "route": "vertikaTeknoLokaciptaPatrolPointTimeline"
}
```

**Satu field baru:** `mergeTyped` = nama char-code field yang dipakai sebagai **kunci dedup** saat merge (di sini `ln` = nama titik). Hadirnya field ini = sinyal ke strategy: "union event-only names ke item list, dedup by field ini". Tanpa field ini = perilaku lama (event yang tak match `ll` diabaikan).

> **`ledgerCode` DIBUANG (2026-06-11):** field `ledgerCode` cuma dipakai buat **addToEvent** (nulis event ledger), TIDAK kepake di widget read/list. Jadi dibuang dari semua list widget. Strategy agregasi dipilih engine via `type`+`variant`, bukan `ledgerCode`.

---

## 2. Sumber data

| Sumber | Path | Peran |
|---|---|---|
| Titik resmi | `84214220504259//site` doc (filter `av == {ccVid}`), array `ll[]` | daftar titik patrol terdaftar (authoritative) |
| Event ledger | `84214220504259//event` (derive: `table` prefix + `//event`) | semua jejak, termasuk lokasi diketik manual |

> **Path event** di-derive strategy dari `table` (`split("//")[0] + "//event"`). Tidak perlu field `tableEvent` di JSON. Kalau build sekarang masih baca `tableEvent` eksplisit, tambahkan kembali — itu keputusan dev, fungsinya sama.

**Scope event (WAJIB diterapkan strategy):**
- `ty == report-patrol` — konstanta strategy patrol (collection event campur banyak `ty`).
- `av == {ccVid}` — **reuse token `{ccVid}` yang sama** dari `search` site-side. Field CC di event = `av`, sama dengan site. Tanpa filter ini, merge akan menyedot event dari SEMUA cost center.
- window periode aktif (`period` / `periodDefault`).

---

## 3. Algoritma merge + dedup (logika dev — TIDAK ada di JSON)

Field `{}` = dihitung dev. Aturan berikut diimplementasi di strategy Dart, bukan config:

1. **Ambil titik resmi:** expand `ll[]` dari doc site → `officialPoints`. Kunci nama = `ll[].ln`.
2. **Ambil event ter-scope:** `event` WHERE `ty==report-patrol AND av=={ccVid} AND ts in window`.
3. **Normalisasi:** lowercase kedua sisi — `ll[].ln.toLowerCase()` dan `event.ln.toLowerCase()`.
4. **Pisahkan orphan:** event yang `ln.toLowerCase()` **tidak** ada di set `officialPoints` nama-lowercase → `orphanEvents` (= lokasi diketik manual yang belum terdaftar).
   - Match (lowercase) → **buang**, sudah terwakili kartu titik resmi.
   - Beda 1 karakter pun (mis. trailing space "Gudang A" vs "Gudang A ") → **string berbeda** → tetap orphan. Tidak perlu logika fuzzy; cukup equality lowercase exact.
5. **Collapse N→1:** `orphanEvents` di-`GROUP BY ln.toLowerCase()`. 10 event nama "gudang a" → **1** entry typed.
6. **Union:** `items = officialPoints ∪ typedEntries`. Render bareng di satu list.

---

## 4. Token per kartu

### Titik resmi (`ll[]`-backed) — sama seperti sekarang
| token | logic |
|---|---|
| `<ln>` | `ll[].ln` |
| `{visits}` | jumlah event match `ln` (lowercase) dalam window |
| `{lastAgo}` / `{lastBy}` | dari event terbaru titik itu |
| `{evidence}` | dari `lq`: QR cocok → **"Bukti kuat"** ; GPS-only / tanpa QR → **"GPS saja"** |
| `{ps}` | no-visit → danger (strip merah) ; stale/GPS-only → warn ; else ok (strip hijau) |

> Vokab `{evidence}` terkonfirmasi dari UI live: **"Bukti kuat"** (QR match) / **"GPS saja"** (GPS only). Bukan `strong`/`weak`.

### Typed-only (orphan, hasil merge) — baru
| token | logic |
|---|---|
| `<ln>` | nama dari event (pakai casing event terbaru, atau title-case) |
| `{visits}` | jumlah event orphan dengan `ln` itu (lowercase) dalam window |
| `{lastAgo}` / `{lastBy}` | dari event orphan terbaru nama itu |
| `{evidence}` | **"GPS saja"** — selalu, karena tak ada titik terdaftar → tak mungkin match QR |
| `{ps}` | **`warn`** — lokasi diketik = kurang terverifikasi (tak ada QR/registrasi) |

`content` segmen 2 = literal `PATROLI` untuk semua kartu. **Opsi:** ganti jadi token `{label}` (resmi → "PATROLI", typed → "DIKETIK") kalau mau bedakan visual. Default: biarkan `PATROLI`.

---

## 5. Stats header (3 box)

| token | logic | terdampak merge? |
|---|---|---|
| `{totalVisits}` | total kunjungan dalam window (semua event ter-scope) | tidak berubah |
| `{noVisitCount}` | jumlah **titik resmi** (`ll[]`) dengan 0 kunjungan | tidak berubah (hanya titik resmi) |
| `{typedCount}` | jumlah lokasi diketik = jumlah **distinct** nama di `typedEntries` | definisi tetap; sekarang angka ini = jumlah kartu typed yang muncul di list |

`{typedCount}` dan kartu typed sekarang konsisten: yang dihitung = yang ditampilkan.

---

## 6. Tap / route

Tap kartu → `route` (`vertikaTeknoLokaciptaPatrolPointTimeline`), inject konteks via field **`routeParam`** (peta `itemField◼txKey◆…`; nama lama `tapContext` sudah di-rename ke `routeParam`).
- **Titik resmi:** `li` (point id) tersedia, `ln` = nama.
- **Typed-only:** `li` kosong/null (tak ada id terdaftar), `ln` = nama diketik. Timeline page filter by `ln` → tetap jalan tanpa `li`.

---

## 7. Open questions / konfirmasi dev

1. **`tableEvent`** — di-derive dari `table` (spec ini) atau build sekarang masih baca field eksplisit? Kalau eksplisit, re-add `"tableEvent":"84214220504259//event"`.
2. **Casing `<ln>` typed** — pakai event terbaru apa adanya, atau normalisasi title-case? (UI consistency).
3. **Sort** — typed entry di-mix dengan resmi by `{lastAgo}` desc, atau dikelompokkan di bawah? Default usul: mix by recency.
4. **`{ps}`/`{evidence}` typed** — usul `warn`/`weak`; konfirmasi vokab status final.
5. **Hapus titik resmi yang juga punya event match** tidak dilakukan — titik resmi selalu tampil walau 0 visit (`{noVisitCount}` butuh itu). Hanya orphan yang di-merge.
