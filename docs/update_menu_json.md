# Update menu JSON — DocEngine / Slip Gaji

Catatan perubahan menu JSON untuk memasang halaman **Slip Gaji** (`DOCENGINE_GENERATE`
per-baris + `DOCENGINE_GENERATE_ALL` batch). Sumber pembanding: `JSON_change.md`
(menu JSON development vs menu JSON production yang dipakai user sekarang).

Menu JSON tidak ada di dalam repo — ia disimpan per-user di Firestore. Dokumen ini
mencatat **apa yang harus ditambahkan** ke JSON production, bukan patch yang bisa
di-apply otomatis.

---

## 1. Ringkasan beda dev vs production

| # | Beda | Terkait DocEngine? | Aksi |
|---|------|--------------------|------|
| 1 | Node **`Slip Gaji`** (halaman + `rowAction` + tombol bottomBar) | ya | **tambahkan** — isi §2 |
| 2 | Tombol **`Collect all new pegawai`** (`COLLECT_NEW_PEGAWAI`) di bottomBar *Pendaftaran Pegawai* | tidak | keputusan terpisah — lihat §5 |
| 3 | `email: 'dsatria@consteon.com'` vs `'mangga@consteon.com'` | tidak | **jangan disalin** — ini identitas pemilik menu, beda per user |

Selain ketiganya, kedua JSON identik.

---

## 2. Node `Slip Gaji` (yang perlu ditambahkan)

```json
{
  "label": "Slip Gaji",
  "icon": "FileText",
  "path": "/reports/slip-gaji",
  "key": "slipGaji",
  "parent": "Reports",
  "pageData": {
    "title": "Slip Gaji",
    "description": "Generate slip gaji dari antrian Payroll.",
    "topbar": { "alignment": "", "children": [] },
    "content": [
      {
        "type": "SPREADSHEET",
        "id": "slipGajiContent",
        "src": "https://docs.google.com/spreadsheets/d/1lYsl2MGOVBREJKuUNhUJUBvpOOXZptEawsrkbwL7LQ8/edit",
        "permission": "",
        "visibleSheets": "Payroll◼2☆3",
        "sheetName": "Payroll",
        "rowHeader": 2,
        "rowStartData": 3,
        "rowAction": {
          "action": "DOCENGINE_GENERATE",
          "payload": { "docType": "Slip Gaji" },
          "icon": "FileOutput",
          "label": "Generate slip baris ini",
          "confirm": true,
          "successToast": "Slip gaji baris ini selesai",
          "refresh": false
        }
      }
    ],
    "bottomBar": {
      "alignment": "",
      "children": [
        {
          "type": "BUTTON",
          "variant": "default",
          "size": "default",
          "text": "Generate Semua Slip Gaji",
          "onClick": {
            "type": "RUN_ACTION",
            "action": "DOCENGINE_GENERATE_ALL",
            "confirm": true,
            "payload": { "docType": "Slip Gaji" },
            "onSuccess": { "toast": "Slip gaji diproses", "then": "REFRESH_CONTENT" },
            "onError": { "toast": "Gagal generate slip gaji" }
          }
        }
      ]
    }
  }
}
```

Dua perbedaan dari versi dev — **disengaja**, alasannya di §4:

- `visibleSheets` diisi `"Payroll◼2☆3"` (di dev masih `""`).
- Penempatan node-nya, lihat §4 poin 1.

---

## 3. Kenapa tiap field DocEngine-nya begitu

| Field | Nilai | Alasan |
|-------|-------|--------|
| `rowAction.action` | `DOCENGINE_GENERATE` | Aksi per-baris. Wajib mengirim `row`; `spreadsheetId`/`sheetName`/`row` dilampirkan otomatis oleh `RowActionButton`, jangan ditulis di `payload`. |
| `rowAction.payload.docType` | `Slip Gaji` | Memilih **baris di tab `DocTypes`**, bukan template. Ganti template cukup edit `DocTypes!M` di spreadsheet, JSON tak perlu diubah. |
| `rowAction.refresh` | `false` | `DocTypes` kolom N (Kolom Tulis-Balik) **kosong** untuk Slip Gaji → tak ada link yang ditulis balik ke baris, jadi reload grid tak menampilkan apa-apa yang baru. Kalau kolom N nanti diisi, ubah jadi `true` (atau hapus — default-nya `true`). |
| `rowStartData` | `3` | Harus **≥** `DocTypes` kolom E (Row Data = 3). Lebih kecil → user bisa mengklik baris yang ditolak backend dengan 400 (`ErrInvalidRow`). Lebih besar → sebagian baris teratas tak bisa dicetak per-baris. Sekarang pas. |
| `rowHeader` | `2` | Cocok dengan `DocTypes` kolom D. |
| `sheetName` | `Payroll` | Harus persis sama dengan `DocTypes` kolom C (Sheet Sumber = `Payroll`). `rowAction` hanya muncul di tab default; di tab lain nomor barisnya menunjuk data yang salah, jadi tombolnya sengaja disembunyikan. |
| `permission` | `""` | View-only. `rowAction` **tidak** butuh token C/U/D — kolom gutter tetap muncul untuk tombolnya sendiri. Slip gaji tak seharusnya diedit dari web. |
| bottomBar `DOCENGINE_GENERATE_ALL` | — | Sudah ada di `STREAMING_ACTIONS` (`components/bar/bar-action-button.tsx`), jadi tombolnya otomatis membaca NDJSON dan menampilkan progres per baris. Tak ada yang perlu dinyalakan di JSON. |

---

## 4. Yang perlu diperiksa sebelum dipasang ke production

1. **Penempatan node di sidebar.** Di JSON dev, node `Slip Gaji` diletakkan sebagai
   anak **top-level** `children[]` dengan `parent: 'Reports'`. Sidebar (`components/ui/app-sidebar.tsx`)
   merender dari **`children` bersarang**, bukan dari field `parent` — `groupNavItems()`
   di `lib/helper.global.ts` yang memakai `parent` tidak dipanggil dari mana pun.
   Akibatnya node itu jatuh ke `standaloneItems` dan muncul sebagai tautan root
   sejajar *Dashboard*, **bukan** di bawah grup *Reports*.
   → Pindahkan node ini ke dalam `children` milik node `Reports` (sejajar
   *Laporan Pekerjaan*). Field `parent: 'Reports'` boleh tetap ada; ia tak dibaca.

2. **`visibleSheets` jangan dibiarkan kosong.** Spreadsheet Slip Gaji berisi tab
   sistem DocEngine (`DocTypes`, `Templates`, `DocLog`) dan tab template
   (`aum-id-basic-2a`). Dengan `visibleSheets: ""` semuanya terlihat dan bisa
   dibuka user — termasuk registry yang kalau tersenggol akan merusak generate.
   → Isi `"Payroll◼2☆3"`.

3. **Backend masih dry-run.** `docEngineGenerateDryRun = true`
   (`internal/handler/actions_docengine.go`). Per-baris akan membuka **dialog pratinjau
   PDF** alih-alih toast sukses, dan tidak ada berkas yang masuk Drive maupun baris
   yang masuk `DocLog`. Nomor dokumen di pratinjau **bukan** nomor final: `DocLog`
   tak pernah ditulis, jadi semua baris memakai `maxNo+1` yang sama.
   → Kalau menu ini dipasang untuk user production, jelaskan dulu bahwa hasilnya
   belum tersimpan, atau matikan dry-run + deploy ulang lebih dahulu.

4. **Kunci i18n sudah di-seed** (204 kunci, 11 di antaranya baru, dieksekusi
   2026-08-11). Tanpa itu tombol per-baris menampilkan kunci mentah. Sudah beres —
   dicatat di sini supaya kalau menu dipasang di lingkungan lain, seed-nya diingat.

5. **Registry harus sudah benar di spreadsheet target.** `DocTypes` baris `Slip Gaji`:
   Renderer `sheet`, Sheet Sumber `Payroll`, Row Header 2 / Row Data 3, Sel Periode `I1`,
   Template Aktif `Template Slip Gaji 2` → tab `aum-id-basic-2a`, Filter Antrian kosong
   (= semua baris ber-Nama masuk antrian).
   Catatan kecil di registry yang sama: `DocTypes` menulis `SKK Standard`, `Templates`
   menulis `SKK Standar`. Tidak berbahaya sekarang (SKK cuma punya satu template, dan
   `GetSelectedTemplate` jatuh ke template valid pertama), tapi begitu SKK punya
   template kedua, salah ketik ini akan diam-diam memilih template yang salah.

6. **`Payroll!I1` = periode yang sama dengan 5 baris `DocLog` bekas AppScript.**
   Setelah go-live: `DOCENGINE_GENERATE_ALL` akan melaporkan kelimanya `Skipped`
   (sudah ada di `DocLog`), sedangkan tombol per-baris sengaja mengabaikan `DocLog`
   dan akan **menimpa** PDF-nya di Drive (`UpsertFile` — nama file sama → isi diganti,
   file ID & link tetap). Ini perilaku "Ulangi" yang memang diinginkan.

---

## 5. Beda non-DocEngine: tombol `Collect all new pegawai`

JSON dev punya tombol kedua di bottomBar *Pendaftaran Pegawai*:

```json
{
  "type": "BUTTON",
  "variant": "outline",
  "size": "default",
  "text": "Collect all new pegawai",
  "onClick": {
    "type": "RUN_ACTION",
    "action": "COLLECT_NEW_PEGAWAI",
    "confirm": true,
    "method": "POST",
    "onSuccess": { "toast": "Berhasil diproses!", "then": "REFRESH_CONTENT" },
    "onError": { "toast": "Gagal memproses" }
  }
}
```

Tidak ada hubungannya dengan Slip Gaji — dicatat di sini hanya supaya tidak ikut
tersalin tanpa sadar saat menyalin JSON dev ke production. `COLLECT_NEW_PEGAWAI`
bersifat **live** dan **tidak idempoten**: menjalankannya dua kali menggandakan
baris di `NewUserWeb` (lihat `internal/pegawai/collect_new.go`). Pasang hanya kalau
user production memang butuh.

---

## 6. Catatan kecil

- Field `method: 'POST'` yang muncul di beberapa `RUN_ACTION` (`PHK`,
  `PENDAFTARAN_PEGAWAI`, `COLLECT_NEW_PEGAWAI`) **tidak ada di tipe `RunAction`**
  (`types/menu.type.ts`) dan tidak dibaca — semua RUN_ACTION selalu POST ke
  `/api/actions/run`. Tombol Slip Gaji tidak menyertakannya. Tak perlu diseragamkan,
  tapi jangan bingung kalau beda.
- Referensi field `rowAction` yang lengkap: `web-dev/docs/menu-json/content-spreadsheet.md`.
- Alur end-to-end DocEngine: `docs/docengine-slip-gaji-flow.md` (repo ini).
