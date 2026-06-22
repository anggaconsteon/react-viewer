# LIST_MULTIPLE_PANEL_CARD — Rekomendasi Dynamic & Reusable


**Tanggal:** 2026-06-04
**Tujuan:** Bikin widget `LIST_MULTIPLE_PANEL_CARD` bisa dipakai ulang di halaman lain (bukan cuma patrol/cost-center) dengan menambah beberapa field config, tanpa merombak engine render-nya.


---


## 1. Ringkasan


Layer **render** widget ini sudah generic (digerakkan config). Yang ngunci reuse cuma layer **agregasi** + beberapa field yang masih di-hardcode ke domain patrol/cost-center. Rekomendasi: tambah **4 field config** + jadikan agregasi **opt-in**. Backward-compatible — layar patrol yang sudah ada cukup tambah 1 field (`computeMode`).


---


## 2. Kondisi sekarang


### Sudah dinamis (config-driven) ✓
`table`, `vidtable`, `text` (header ◆-pack), `panels` (icon/text/status/route/okText), `status` (template kartu), `staleMs`, resolusi token (`<charcode>` dari doc + `{token}` dari hasil hitung), dan seluruh render (search box, summary, accordion status, kartu, panel, grouping danger/warn/ok).


### Masih hardcode (pengunci reuse)
| Hardcode | Akibat |
|---|---|
| subscribe subcollection `workforce` + `event` | domain lain tak punya / beda nama |
| agregasi Kehadiran + Patroli → token `{hadir}`/`{issues}`/`{ps}`/`{llCount}`/`{staleCount}`/`{longestGap}`/`{qs}`/`{ws}` | rumus & token patrol-only — **pengunci utama** |
| field cari `an`/`sn` | halaman lain cari field lain |
| tap → `ccVid = doc['av']`, dispatch `ccVid`/`request_vid` | konteks cost-center-only |


> Catatan: field `search`, `toDo`, `showIcon`, `showProgress` yang ada di JSON saat ini **belum dibaca** widget.


---


## 3. Field config baru


| Field | Nilai | Default | Fungsi |
|---|---|---|---|
| `computeMode` | `"patrolCleaning"` / kosong | **kosong** (= tanpa agregasi) | pilih strategy hitung. Kosong → token `{...}` tidak dihitung; kartu murni dari `<charcode>` doc → **reusable** |
| `searchFields` | char-code dipisah `◆`, mis. `"an◆sn"` | `an◆sn` | field yang dicari di search box |
| `tapContext` | `docField◼screenTxKey`, mis. `"av◼ccVid"` | `av◼ccVid` | nilai yang di-inject ke `screenTx` saat panel ditekan |
| `showIcon` | `"TRUE"` / `"FALSE"` | `TRUE` | tampil/sembunyikan kotak ikon panel |
| `showProgress` | `"TRUE"` / `"FALSE"` | `FALSE` | tampil/sembunyikan indikator progress |


`computeMode` default **kosong** = generic → bikin perilaku default widget reusable. Layar patrol opt-in dengan `"computeMode":"patrolCleaning"`.


---


## 4. JSON — halaman patrol (sekarang)


Cukup tambah `computeMode` (sisanya field baru opsional karena default-nya sama):


```json
{
 "type": "LIST_MULTIPLE_PANEL_CARD",
 "vidtable": "20342033315492",
 "table": "84214220504259//site",
 "computeMode": "patrolCleaning",
 "staleMs": "43200000",
 "searchFields": "an◆sn",
 "tapContext": "av◼ccVid",
 "showIcon": "TRUE",
 "showProgress": "FALSE",
 "text": "◆<an>◆<sn>◆Cari cost center◆Ketik nama cost center◆Data tidak ditemukan",
 "status": "{ws}",
 "panels": [
   {
     "icon": "users",
     "text": "Kehadiran◆{hadir}/<nm> hadir◆{issues}",
     "status": "{ps}",
     "route": "vertikaTeknoLokaciptaCheckinSiteDetail"
   },
   {
     "icon": "clipboard-check",
     "text": "Patroli & Cleaning◆{llCount} titik◆{staleCount} titik jeda lama · terlama {longestGap} jam",
     "status": "{qs}",
     "route": "vertikaTeknoLokaciptaPatrolCleaningSiteDetail"
   }
 ]
}
```


**Token hasil agregasi (`computeMode:"patrolCleaning"`):** `{hadir}`, `{issues}`, `{ps}` (Kehadiran dari subcollection `workforce`, join `sv`); `{llCount}`, `{staleCount}`, `{longestGap}`, `{qs}` (Patroli dari subcollection `event`, join `ll[].li`); `{ws}` = worst(`{ps}`,`{qs}`).


---


## 5. JSON — halaman lain (generic, TANPA agregasi)


`computeMode` dihilangkan → tak ada subscribe sibling, tak ada token hitung. Status & isi panel ambil langsung dari **char-code doc** (`<...>`):


```json
{
 "type": "LIST_MULTIPLE_PANEL_CARD",
 "vidtable": "20342033315492",
 "table": "84214220504259//asset",
 "searchFields": "an◆cd",
 "tapContext": "av◼assetVid",
 "showIcon": "TRUE",
 "text": "◆<an>◆<cd>◆Cari aset◆Ketik nama aset◆Data tidak ditemukan",
 "status": "<st>",
 "panels": [
   {
     "icon": "build",
     "text": "Servis◆<sj> jadwal◆<sd>",
     "status": "<ss>",
     "route": "assetServiceDetail"
   },
   {
     "icon": "description",
     "text": "Dokumen◆<dn> file◆<df>",
     "status": "ok",
     "route": "assetDocsDetail"
   }
 ]
}
```


---


## 6. Aturan token (status & isi panel)


Tiap field `status` / `text` panel boleh isi salah satu:
- `{computedToken}` — kalau `computeMode` aktif (mis. `{ps}`, `{qs}`, `{ws}`).
- `<docCharCode>` — ambil langsung dari field doc (mis. `<st>`, `<ss>`).
- literal status — `ok` / `warn` / `danger`.


Engine resolve sudah generic, jadi ketiga bentuk ini jalan tanpa ubah kode. Token yang tidak ada nilainya dibiarkan literal (kelihatan saat debug).


---


## 7. Backward compatibility


- `searchFields` / `tapContext` / `showIcon` default = perilaku patrol sekarang → layar lama tetap jalan tanpa field tsb.
- Yang **wajib ditambah** di layar patrol lama: `"computeMode":"patrolCleaning"` (karena default kosong = tanpa agregasi).


---


## 8. Tahap implementasi (usulan)


- **P1 — `computeMode` gate + strategy.** Pisahkan agregasi dari render; jalankan hanya bila `computeMode` cocok. Strategy `patrolCleaning` pegang subscribe `workforce`/`event` + rumusnya sendiri. Domain baru yang butuh hitung sendiri = tambah strategy Dart (bukan config rumit).
- **P2 — `searchFields` + `tapContext`.** Ganti hardcode `an`/`sn` dan `av`→`ccVid`.
- **P3 — honor `showIcon` / `showProgress`.**
- **P4 (opsional)** — vokab status (`statusLabels`) configurable untuk domain/bahasa lain.


> **Dihindari:** DSL agregasi full-deklaratif (`compute:[{from,join,reduce,...}]`) — over-engineering (YAGNI) kecuali nanti benar-benar banyak domain.



