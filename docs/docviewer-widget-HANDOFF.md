# Widget `DOC_VIEWER` — Handoff Dev Flutter (Mobile)

**Tanggal:** 2026-08-12
**Tipe baru:** `DOC_VIEWER` (name `docViewer`) — **BUKAN** `PDF_VIEW` lama (biar gak tabrakan).
**Fungsi:** render PDF **inline** dari link, + tombol **fullscreen**. Generic — kepake buat slip gaji & dokumen lain.

---

## 2 varian

### Varian A — `source` (link langsung, TANPA fetch DB)
Link dioper dari luar (routeParams / literal). Dipakai slip gaji: list oper `link◼{path}` → detail.
```json
{
  "type": "DOC_VIEWER",
  "source": "{link}",
  "sourceType": "url",
  "swipe": "vertical",
  "fullscreen": "true",
  "text": "Slip Gaji",
  "emptyText": "Slip belum tersedia"
}
```

### ⚠️ STATUS RENDERER (2026-08-13)
- **Varian A (`source` langsung) = JALAN.** Terbukti render inline di device (page TestPdf).
- **Varian B (`table`+`sourceField` fetch) = BELUM diimplement.** Renderer cuma baca `source`; kalau `source` kosong & `table` diisi → **blank** (gak fetch, gak tampil emptyText). Di slip gaji detail kami akhirnya pakai **varian A + routeParams**: list oper `slipPath◼{path}`, DOC_VIEWER `source:"{slipPath}"`.
- **PR dev berikut:** implement varian B (fetch record → baca `sourceField`) ATAU minimal pastikan token routeParam (`{slipPath}`) di-resolve di dalam `source`.

### Varian B — `table` (fetch record dari Firestore, baca field link) — BELUM diimplement, lihat status di atas
Widget cari record → baca `sourceField`. Dipakai kalau mau viewer fetch sendiri.
```json
{
  "type": "DOC_VIEWER",
  "vidtable": "20342033315492",
  "table": "84214220504259//slip_gaji",
  "search": "sg◼{sg}",
  "sourceField": "path",
  "sourceType": "url",
  "swipe": "vertical",
  "fullscreen": "true",
  "text": "Slip Gaji",
  "emptyText": "Slip belum tersedia"
}
```

---

## Kontrak field
| Field | Varian | Wajib | Nilai | Ket |
|-------|--------|-------|-------|-----|
| `type` | A + B | ✅ | `DOC_VIEWER` | |
| `source` | A | ✅ (A) | `{link}` / URL literal | link PDF langsung |
| `vidtable` | B | ✅ (B) | db id | scope DB |
| `table` | B | ✅ (B) | `{tid}//slip_gaji` | collection |
| `search` | B | ✅ (B) | `sg◼{sg}` | cari record |
| `sourceField` | B | ✅ (B) | `path` | field yg nyimpen link |
| `sourceType` | A + B | opsional | `url` (default) / `path` | `url`=network; `path`=Storage getDownloadURL |
| `swipe` | A + B | opsional | `vertical` (default) / `horizontal` | arah scroll |
| `fullscreen` | A + B | opsional | `true` (default) / `false` | tampil icon fullscreen |
| `text` | A + B | opsional | string | judul di atas viewer |
| `emptyText` | A + B | opsional | string | pesan kalau link kosong/404 |

> Renderer bedain varian dari ada-tidaknya `table`: **ada `table` → varian B (fetch)**; else → varian A (pakai `source`).

---

## Perilaku renderer (WAJIB)
```
1. Resolve link:
     link = (table ada) ? fetchRecord(vidtable, table, search).[sourceField]
                        : source            // token {..} udah di-resolve renderer
2. link kosong / record gak ada → tampilkan emptyText (jangan crash)
3. Resolve URL:
     if sourceType == "path"  OR  link tidak diawali "http"
         url = await getDownloadURL(ref(link))     // Storage path → download URL
     else
         url = link                                // udah URL penuh
4. Render SfPdfViewer.network(url)  INLINE di halaman  (embed, BUKAN buka route baru)
5. swipe        → scrollDirection (vertical/horizontal)
6. fullscreen=true → icon di pojok viewer → tap → buka route fullscreen (viewer PDF full)
```

### ⚠️ Yang WAJIB diperhatiin
- **INLINE**, bukan "kotak diklik → masuk halaman lain". PDF langsung kerender di halaman. Fullscreen cuma opsi lewat icon.
- Package: **`syncfusion_flutter_pdfviewer`** (`SfPdfViewer.network`) — render inline.
  **JANGAN** `flutter_pdfview` yang buka file di route baru (itu sumber bug "halaman lain" kemarin).
- Token (`{link}`, `{sg}`, `{prd}`, dll) di-resolve **renderer** dari routeParams/session. `source`/`filename`/`search` harus support substitusi token (bukan cuma `search`).

---

## Pemakaian di slip gaji (varian A, direkomendasi)
```
List (listCardGrouped //slip_gaji):
   card tap → routeParams: "link◼{path}⭘prdL◼{prdL}⭘tyL◼{tyL}"
Detail page:
   WORKSPACE_HEADER  text: "<prdL> · <tyL>" , back
   NOTICE_BAR        provenance vendor (opsional)
   DOC_VIEWER        source="{link}"  swipe=vertical  fullscreen=true
   RBT               Unduh / Bagikan (opsional)
```
- Worker & HR pakai **detail + DOC_VIEWER yang SAMA**; beda cuma `search` di LIST (worker `vid◼{userVid}`, HR `sv◼{userSv}`/`av◼{userAv}`).
- Local-auth gate (biometrik) = shell native, di luar widget.

---

## Contoh literal (buat test cepat)
```json
{
  "type": "DOC_VIEWER",
  "source": "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  "sourceType": "url",
  "swipe": "vertical",
  "fullscreen": "true",
  "text": "Test PDF"
}
```
