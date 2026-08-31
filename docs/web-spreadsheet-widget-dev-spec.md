# Dev Spec — Widget `SPREADSHEET` (Web): kontrak mirror + config + tulis-balik

**Status:** READY FOR DEV · dibuat 2026-08-20
**Sheet:** VTL Master `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` → tab `Web Widget` (`contentSpreadsheet` row 8, `contentSpreadsheetRowAction` row 18, `contentSpreadsheetRowActions` row 22)
**Kode yang diaudit:** `C:\Users\FCT\Documents\Development\consteon\web-dev` (per 2026-08-20)
**Terkait:** `docs/web-row-actions-dev-spec.md`, `docs/web-button-link-dev-spec.md`, `docs/web-data-table-batch-form-dev-spec.md`

---

## 1. Prinsip

**Spreadsheet adalah engine-nya. Web cuma permukaan lain dari sheet yang sama.**

Apa pun yang diatur di spreadsheet — lebar kolom, kolom disembunyikan, format tanggal, dropdown validasi, kolom beku — otomatis berlaku di web. Bukan diatur ulang lewat config. Edit sel di web langsung menulis ke spreadsheet.

Konsekuensi yang harus dipegang dev:

- **Kalau tampilan di web salah, perbaikannya di spreadsheet, bukan tambah key config.** Kolom kosong nongol? Sembunyikan kolomnya di sheet. Header ke-wrap? Lebarkan kolomnya di sheet.
- **Config hanya untuk hal yang spreadsheet tidak punya konsepnya**: tombol aksi per baris, RBAC kita, tab mana yang boleh dilihat, teks UI kita sendiri.
- Setiap properti tampilan yang di-hardcode di renderer adalah bug. Sama seperti aturan label di op1Screen.

---

## 2. Kondisi sekarang (hasil audit kode)

### 2.1 Yang sudah berjalan

| Kemampuan | Di mana |
|---|---|
| Auth: session + token Google **milik user** (bukan service account) | `actions/spreadsheet.action.ts:18-22`, `app/api/spreadsheet/route.ts:44` |
| Baca isi sheet | `lib/google-sheets/sheet.ts:49` `readSheet` |
| Daftar tab, di-cache 30 menit | `sheet.ts:181` `getSheetsMetaCached` |
| Validasi kolom → dropdown / email / url / checkbox / number / date / regex | `sheet.ts:201-296` `parseColumnValidations` |
| Dropdown `ONE_OF_RANGE` di-resolve via satu `values.batchGet` | `sheet.ts:304` `resolveRangeDropdowns` |
| **Kolom hidden ikut tersembunyi di web** | `sheet.ts:350` `parseHiddenColumns` (`hiddenByUser`) |
| Validasi + hidden dalam SATU `spreadsheets.get` | `sheet.ts:367` `getSheetGridInfo` |
| Retry backoff 429/503 | `sheet.ts:33` `withRetry` |
| Tulis sel | `sheet.ts:70` `updateSheet`, `sheet.ts:140` `batchUpdateValues` |
| Audit log perubahan ke Firestore | `lib/firebase/spreadsheet-logger.ts` |

Kontrak data yang diterima grid saat ini (`types/sheet.type.ts:25`):

```ts
type SpreadsheetData = {
  values: string[][]
  sheetName: string
  sheets: SheetMeta[]
  columnValidations: ColumnValidation[]
  hiddenCols: number[]
}
```

**Format angka & tanggal sudah mirror tanpa kerja tambahan**: `values.get` default-nya `valueRenderOption: FORMATTED_VALUE`, jadi `9-Okt-2024` datang sudah jadi dari sheet.

### 2.2 Gap — yang belum mirror

`columnMetadata` **sudah ikut ter-fetch utuh** di `getSheetGridInfo`, tapi hanya `hiddenByUser` yang dibaca. Sisanya belum diambil sama sekali.

| Properti | Sumber | Status |
|---|---|---|
| lebar kolom | `columnMetadata[].pixelSize` | sudah ke-fetch, belum dipakai |
| tinggi baris | `rowMetadata[].pixelSize` | belum di `fields` |
| kolom/baris beku | `sheets.properties.gridProperties.frozenColumnCount` / `frozenRowCount` | `getSheetsMeta` sudah minta `sheets.properties` tapi mapper cuma ambil `sheetId`+`title` (`sheet.ts:164-167`) |
| sel merge | `sheets.merges` | belum |
| warna sel, tebal, warna teks, align, wrap | `effectiveFormat` | belum |
| pewarnaan bersyarat | `sheets.conditionalFormats` | belum |
| range terproteksi | `sheets.protectedRanges` | belum |
| **sel berisi formula** | `userEnteredValue.formulaValue` | **belum — lihat §5.1** |

---

## 3. Kontrak mirror (dari sheet, nol config)

Semua di bawah ini **tidak boleh** punya key config. Kalau dev merasa butuh key baru untuk salah satunya, itu tanda salah baca spec.

| Tampilan web | Field Sheets API | Aturan render |
|---|---|---|
| lebar kolom | `columnMetadata[i].pixelSize` | px langsung. Kolom tanpa metadata → lebar default sheet (100px) |
| kolom disembunyikan | `columnMetadata[i].hiddenByUser` | kolom tidak dirender sama sekali |
| tinggi baris | `rowMetadata[i].pixelSize` | px langsung; baris yang wrap tetap boleh melar |
| kolom beku | `gridProperties.frozenColumnCount` | N kolom pertama sticky saat scroll horizontal |
| baris beku | `gridProperties.frozenRowCount` | header sticky saat scroll vertikal |
| format angka/tanggal | — | sudah otomatis lewat `FORMATTED_VALUE` |
| rata teks | `effectiveFormat.horizontalAlignment` | `LEFT`/`CENTER`/`RIGHT`. Kosong → ikut default Sheets: angka kanan, teks kiri |
| wrap / potong | `effectiveFormat.wrapStrategy` | `WRAP` → wrap; `CLIP`/`OVERFLOW_CELL` → potong + tooltip isi penuh |
| warna latar sel | `effectiveFormat.backgroundColor` | pakai apa adanya. Putih murni → jangan digambar (biar zebra-striping web tetap jalan) |
| tebal / miring / warna teks | `effectiveFormat.textFormat` | `bold`, `italic`, `strikethrough`, `foregroundColor` |
| pewarnaan bersyarat | `conditionalFormats` | v1: **tidak diproses** — lihat §11 no.3 |
| sel merge | `merges` | **tidak didukung** — tidak digambar melintang |
| dropdown di sel | `dataValidation` | sudah jalan (`parseColumnValidations`) |
| sel terkunci | `protectedRanges` | read-only, tooltip "sel terkunci di spreadsheet" |

### 3.0 Tiga batas yang diterima (jangan dikira bug)

1. **Format cuma dibaca 300 baris pertama**, dihitung dari `rowStartData`. Baris ke-301 ke atas tampil polos. Ini batas biaya yang disengaja: Google mengirim format untuk *setiap* sel termasuk yang defaultnya, jadi menariknya untuk seluruh grid berukuran megabyte tiap halaman dibuka. Jendela yang sama dipakai deteksi kolom formula — jadi **`rowStartData` yang salah bukan cuma menggeser tampilan, kolom formula bisa gagal terdeteksi**.
2. **Baris beku tidak dirender.** Header web memang sudah selalu menempel, jadi `frozenRowCount: 1` sudah terpenuhi; angka 2 ke atas tidak terlihat bedanya. Kolom beku dirender penuh.
3. **Sel merge tidak didukung.**

### 3.1 Perluasan `fields` yang dibutuhkan

Satu `spreadsheets.get` masih cukup — cuma `fields`-nya diperlebar:

```
sheets.properties.gridProperties,
sheets.merges,
sheets.protectedRanges,
sheets.data.rowData.values.dataValidation,
sheets.data.rowData.values.userEnteredValue,
sheets.data.rowData.values.effectiveFormat(backgroundColor,horizontalAlignment,wrapStrategy,textFormat),
sheets.data.columnMetadata,
sheets.data.rowMetadata
```

Jangan pakai `includeGridData` tanpa `fields` — itu menarik seluruh isi grid termasuk format tiap sel dan gampang menembus quota. Batasi `ranges` seperti sekarang (`sheet.ts:390`).

Kuota Sheets: 60 baca/menit per user, 300/menit per project. Tambahan field **tidak** menambah jumlah call, jadi aman — tapi jangan tambah call baru untuk format.

---

## 4. Kolom kosong dan kolom tanpa header

Kasus nyata di halaman Slip Gaji: 5 kolom di kanan tanpa header dan tanpa isi ikut dirender.

Sebabnya `numCols = max(row.length)` (`spreadsheet.action.ts:43`) — satu baris saja punya sel di kanan (termasuk formula yang menghasilkan `""`), semua kolom sampai situ ikut terbawa.

**Aturan:** kolom di-drop kalau **header kosong DAN semua sel data di kolom itu kosong**. Kolom berheader tapi kosong isinya tetap dirender — itu kolom yang memang menunggu diisi.

Ini satu-satunya penyimpangan yang diizinkan dari "mirror persis", alasannya: di Google Sheets kolom kosong itu wajar karena grid memang tak terbatas, sedangkan di tabel web kolom kosong terbaca sebagai data yang hilang.

---

## 5. Kontrak tulis-balik

Saat ini: `POST /api/spreadsheet` → `updateSheet(spreadsheetId, cell, [[value]], googleToken)` per sel, dijalankan paralel `Promise.all` (`app/api/spreadsheet/route.ts:57-61`), `valueInputOption: "USER_ENTERED"` (`sheet.ts:80`).

Tiga hal wajib diubah.

### 5.1 Sel berformula → read-only, tanpa kecuali

`values.get` dengan `FORMATTED_VALUE` mengembalikan **hasil** formula, tak bisa dibedakan dari literal. Artinya web hari ini bisa menimpa sel `=VLOOKUP(...)` dengan teks, formulanya hilang, dan tidak ada undo.

Ini bukan risiko teoretis — kelas bug yang sama sudah terjadi di workbook ini: satu literal ditulis ke kolom ber-`ARRAYFORMULA`, spill-nya kolaps, dan **semua** halaman jadi `#N/A`.

Wajib:

- Ambil `userEnteredValue` di `getSheetGridInfo` (sudah satu call yang sama).
- Sel dengan `formulaValue` → **terkunci**, walau `permission` mengandung `U`.
- Tooltip: teks segmen (§7), default "kolom terhitung otomatis".
- Ditandai visual (latar abu tipis) supaya user tidak mencoba lalu bingung kenapa tak bisa.
- Server **wajib** cek ulang sebelum menulis. Kunci di UI saja tidak cukup — request bisa dikirim langsung.

### 5.2 `valueInputOption` per tipe kolom, bukan global

`USER_ENTERED` menyuruh Sheets menebak tipe. Akibatnya nyata di data yang ada sekarang:

| Isi | Dengan `USER_ENTERED` |
|---|---|
| `0812345678` (telepon) | nol depan hilang → `812345678` |
| `78813680177365` (VID) | jadi number; 15 digit, mepet batas presisi |
| `1/2` | jadi tanggal 1 Februari |
| `TRUE` | jadi boolean |
| `+62812…` | dianggap formula → `#ERROR!` |

Tapi `RAW` global juga salah: kolom tanggal dan angka jadi teks, dan `numberFormat` sheet tidak berlaku lagi.

**Aturan:** pilih per kolom berdasarkan `columnValidations` yang **sudah dihitung hari ini**:

| `ColumnValidation.type` | `valueInputOption` |
|---|---|
| `number`, `date`, `checkbox` | `USER_ENTERED` |
| `text`, `email`, `url`, `regex`, `dropdown` | `RAW` |

Kolom tanpa validasi = `text` → `RAW`. Ini default yang aman: yang tidak dideklarasikan sebagai angka/tanggal disimpan persis seperti diketik.

### 5.3 Bentrok dua penyunting

Sekarang tidak ada pengecekan sama sekali — tulisan terakhir menang diam-diam. Untuk sheet payroll itu kehilangan data yang tidak terlihat.

**Aturan minimum:** kirim nilai lama bersama nilai baru; server baca ulang sel, kalau nilai sekarang ≠ nilai lama → tolak dengan `409` dan beri tahu user isinya sudah berubah, sertakan nilai terbarunya.

```jsonc
// POST /api/spreadsheet
{
  "spreadsheetId": "1FQqc6…",
  "data": [
    { "cell": "Payroll!D5", "value": "Imaglo CS", "previousValue": "Imaglo" }
  ]
}
```

`previousValue` opsional supaya klien lama tetap jalan; kalau tidak dikirim, perilakunya seperti sekarang. Renderer baru **wajib** mengirimnya.

Catatan: `Promise.all` per sel berarti sebagian sel bisa tersimpan dan sebagian gagal. Untuk edit satu baris, gunakan `values.batchUpdate` (`sheet.ts:140`) supaya satu panggilan, bukan N panggilan paralel — sekaligus menghemat kuota.

### 5.4 Status simpan per sel

Sekarang ada **satu** penanda "Menyimpan…" di atas tabel (`components/spreadsheet/spreadsheet.tsx:307`). Kalau user mengubah tiga sel berturut-turut dan satu gagal, tidak ada cara tahu yang mana.

Penanda ini **murni tampilan web**. Tidak ada yang ditulis ke spreadsheet untuk merepresentasikannya — tidak ada kolom penanda, tidak ada sel status. Yang masuk ke spreadsheet tetap hanya nilainya. Refresh halaman → penandanya hilang, nilainya tetap.

Sumber pemicunya adalah request yang **sudah berjalan hari ini**:

```
Enter ditekan
   │
   ├─ nilai baru masuk state browser  ──────────→  sel: ◌ menyimpan
   ├─ POST /api/spreadsheet {cell, value}
   ├─ server → Google values.update
   ├─ Google balas OK  ──────────────────────────→  sel: ✓ tersimpan (hilang ~1,5 dtk)
   └─ Google balas error  ───────────────────────→  sel: ! gagal + nilai dikembalikan
```

Perubahannya: satu flag global jadi catatan per alamat sel.

```js
const [cellStatus, setCellStatus] = useState({})   // { "Payroll!D5": "saving" }

async function commitEdit(cell, value) {
  setCellStatus(s => ({ ...s, [cell]: "saving" }))
  try {
    await post("/api/spreadsheet", { spreadsheetId, data: [{ cell, value }] })
    setCellStatus(s => ({ ...s, [cell]: "saved" }))
    setTimeout(() => setCellStatus(s => omit(s, cell)), 1500)
  } catch (e) {
    setCellStatus(s => ({ ...s, [cell]: e.status === 409 ? "conflict" : "error" }))
    revertCell(cell)
  }
}
```

Endpoint, request, dan panggilan Google API-nya sama persis. **Tiga dari empat state tidak butuh perubahan backend sama sekali** — datanya sudah ada di respons yang sekarang pun sudah datang. Hanya `conflict` yang bergantung pada §5.3.

| State | Tampilan | Kapan |
|---|---|---|
| `saving` | titik berputar di pojok sel | request jalan |
| `saved` | centang, hilang sendiri ~1,5 detik | respons OK |
| `error` | border merah, nilai dikembalikan, tawaran "Coba lagi" | respons gagal |
| `conflict` | border kuning + nilai terbaru orang lain + pilihan mana yang dipakai | respons `409` (§5.3) |

```
 mengetik              menyimpan             tersimpan             gagal
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│Imaglo CS▮    │     │Imaglo CS   ◌ │     │Imaglo CS   ✓ │     │Imaglo CS   ! │
└━━━━━━━━━━━━━━┘     └──────────────┘     └──────────────┘     └━━━━━━━━━━━━━━┘
   ring biru                                                     nilai kembali
   (sudah ada)                                                   ke isi lama
```

**`revertCell` wajib, bukan kosmetik.** Sekarang kalau simpan gagal, nilai yang salah tetap terlihat di layar seolah tersimpan; user pergi dan mengira beres. Mengembalikan ke nilai lama adalah yang membuat layar jujur terhadap isi spreadsheet.

Penanda global tetap dipakai untuk aksi yang memang menyentuh banyak baris (generate massal), bukan untuk edit satu sel.

### 5.5 Navigasi keyboard di grid

Yang **sudah ada** (`spreadsheet.tsx:415-444`): sel punya konsep terpilih dengan outline, dipilih lewat klik; masuk edit lewat klik dua kali; di dalam editor `Enter` simpan, `Escape` batal, klik luar simpan.

Yang **belum ada**: tidak ada `onKeyDown` di level sel maupun tabel, jadi keyboard tidak bisa dipakai berpindah sel sama sekali.

| Tombol | Sekarang | Harus |
|---|---|---|
| `←` `↑` `→` `↓` | tidak ada efek | pindah sel terpilih |
| `Enter` di sel terpilih | tidak ada efek | masuk mode edit |
| `Enter` setelah simpan | tetap di sel itu | pindah ke sel bawahnya |
| `Tab` / `Shift+Tab` | lompat keluar tabel | pindah sel kanan / kiri |
| ketik huruf langsung | tidak ada efek | masuk edit, timpa isi |
| `Ctrl+C` / `Ctrl+V` | seleksi teks browser | salin / tempel isi sel |

Aturan tambahan:

- Sel terkunci (formula / protected, §5.1) tetap **bisa dilewati** panah dan tetap bisa disalin — yang ditolak cuma masuk edit.
- Kolom tersembunyi **dilewati** navigasi, tidak berhenti di sel yang tak terlihat.
- Sel terpilih harus ikut ter-scroll ke dalam pandangan saat navigasi menyentuh tepi tabel.
- Fokus keyboard wajib punya tampilan yang terlihat — outline yang sekarang sudah cukup, jangan dihilangkan.

Prioritas kalau dikerjakan bertahap: `Enter` untuk masuk edit, panah untuk pindah, dan `Enter` setelah simpan turun ke bawah. Tiga itu saja sudah mengubah pengisian kolom 800 baris dari klik-dua-kali per sel menjadi tangan tidak lepas dari keyboard.

### 5.6 Otorisasi

Read dan write memakai **token Google milik user**, bukan service account. Jadi batas otorisasi sebenarnya adalah ACL Google Drive user itu: dia hanya bisa menulis ke spreadsheet yang memang di-share ke dia.

Yang tetap harus dijaga:

- `permission` (`C◆U◆D`) di config adalah pembatas **tambahan** di atas ACL Google, dan **wajib dicek di server**, bukan cuma menyembunyikan tombol. Menyembunyikan tombol hapus tidak menghentikan siapa pun yang mengirim request DELETE langsung.
- Validasi bentuk `cell` sudah ada (`dto/spreadsheet.dto.ts:7`) dan membatasi ke satu sel — pertahankan.
- Server harus memastikan `cell` berada di **sheet yang memang dibuka halaman itu**. Tanpa ini, satu halaman yang hanya menampilkan tab `Payroll` tetap bisa dipakai menulis ke tab lain di spreadsheet yang sama.
- Audit log (`spreadsheet-logger.ts`) sudah ada — pastikan tiap penolakan (formula, 409, permission) ikut tercatat, bukan cuma yang sukses.

---

## 6. Kontrak config (yang sheet tidak punya konsepnya)

```json
{
  "type": "SPREADSHEET",
  "id": "slipGajiContent",
  "src": "https://docs.google.com/spreadsheets/d/1FQqc6KIOT1e194_1Dux-6zVR4Ab76bg8l7hxd4GG2mg/edit",
  "permission": "C◆U◆D",
  "visibleSheets": "Payroll◼2☆3",
  "sheetName": "Payroll",
  "rowHeader": 2,
  "rowStartData": 3,
  "toolbar": "search◆addRow◆export◆sync",
  "export": "csv◆xlsx",
  "pageSize": 50,
  "selectable": "FALSE",
  "text": "Cari di tabel…◆Tambah Baris◆Ekspor◆Muat Ulang◆Belum ada data◆Memuat data…◆Gagal memuat data◆Kamu tidak punya akses ke spreadsheet ini◆kolom terhitung otomatis◆sel terkunci di spreadsheet◆Data sudah diubah orang lain",
  "rowActions": [ /* docs/web-row-actions-dev-spec.md */ ]
}
```

| Key | Wajib | Fungsi |
|---|---|---|
| `type` | ✅ | `"SPREADSHEET"` |
| `id` | ✅ | ID unik; jadi target `refresh` dari `rowActions` |
| `src` | ✅ | URL spreadsheet, atau token `[SRC:pageKey]` (SSOT tab `Web URL`) |
| `permission` | ✅ | `C`reate / `U`pdate / `D`elete, ◆-list. Batas di atas ACL Google. **Dicek server.** |
| `visibleSheets` | ✅ | ◆-list `Nama◼rowHeader☆rowStartData`. Tab di luar daftar tidak boleh dibuka |
| `sheetName` | ✅ | tab default saat halaman dibuka |
| `rowHeader` | ✅ | nomor baris header (1-based) |
| `rowStartData` | ✅ | nomor baris data pertama |
| `toolbar` | — | ◆-list dari `search`\|`addRow`\|`export`\|`sync`. Urutan = urutan tampil. **Key absen ≠ string kosong**: absen = toolbar bawaan (`addRow`+`export`); `""` = benar-benar tanpa toolbar |
| `export` | — | ◆-list format: `csv`\|`xlsx`\|`pdf`. Absen = `xlsx`+`pdf`. `""` = tombol ekspor tidak muncul walau disebut di `toolbar` |
| `pageSize` | — | jumlah baris per halaman, **angka tanpa kutip**. `0` = scroll semua. Jangan dikosongkan — sel kosong bikin seluruh menu JSON tidak valid |
| `selectable` | — | `"TRUE"` = checkbox per baris + bar seleksi. Default `"FALSE"`. **Aksi massalnya diambil dari entri `RUN_ACTION` di `rowActions[]`** — tidak ada key sendiri |
| `text` | — | ◆-segmen, §7 |
| `rowActions` | — | tombol ikon per baris — spec terpisah |

**Yang sengaja TIDAK ada:** `columns`, `width`, `align`, `format`, `frozen`, `hideColumns`, `sortBy`. Semuanya dari sheet.

`addRow` hanya aktif kalau `permission` mengandung `C`; edit sel hanya kalau ada `U`; hapus baris hanya kalau ada `D`. Toolbar yang menyebut aksi tanpa izinnya → item tidak dirender.

---

### 6.1 Aturan izin yang muncul setelah guard server dipasang

Tiga hal ini tidak terlihat waktu spec ini pertama ditulis, dan baru kelihatan setelah `permission`/`visibleSheets` benar-benar dicek di server (Batch A).

**`visibleSheets: ""` itu wildcard, bukan "belum diisi".** Artinya semua tab di spreadsheet itu boleh ditulis.

**Izin digabung (union) antar page yang menunjuk spreadsheet yang sama.** Satu user memang punya akses lewat lebih dari satu pintu, dan yang paling longgar menang. Akibatnya satu page berwildcard **membatalkan** pembatasan page lain atas spreadsheet yang sama:

| Page | `src` | `permission` | `visibleSheets` |
|---|---|---|---|
| `dashboard` | `1FTaIACx…` | `C◆U◆D` | `""` ← wildcard |
| `pendaftaranPegawaiTenant` | `1FTaIACx…` | `U` | `Pendaftaran Pegawai◼2☆3` |

Izin efektif user atas spreadsheet itu jadi `C,U,D` atas **semua** tab — `permission:"U"` di page kedua tidak membatasi apa pun.

> **Isi `visibleSheets` di SETIAP widget SPREADSHEET**, terutama kalau spreadsheet-nya dipakai lebih dari satu page. Page yang cuma untuk dilihat diisi `permission:""`.

**`dropdown.target` harus persis sama dengan `spreadsheet.id`** di page yang sama. Dulu ini cuma menentukan "refresh-nya kena atau tidak"; sekarang guard memakainya untuk mengenali spreadsheet tujuan. Salah ketik → grid tetap bertukar `src`, tapi setiap penulisan ditolak `403 SHEET_FORBIDDEN`.

**Setiap tab yang muncul di `cell` sebuah DROPDOWN/DATE harus ada di `visibleSheets` grid-nya.** Kalau tidak, tombol filter gagal `403` **hanya saat tab itu aktif** — gejala yang membingungkan kalau tidak tahu aturannya.

### 6.2 Yang TIDAK dijaga guard

Guard cuma berdiri di depan `/api/spreadsheet` dan `/api/spreadsheet/rows`. Dua jalur ini menulis ke spreadsheet tanpa lewat situ:

- **`/api/reset-device`** — widget `RESET_DEVICE` memang tidak punya `permission`/`visibleSheets`.
- **`/api/actions`** — semua tombol `RUN_ACTION`. Yang membatasi adalah allowlist `action` di sisi Go.

Konkretnya: page `phk` punya `permission:"C◆U"` tanpa `D`, tapi tombol Process PHK memanggil action `PHK` yang bebas melakukan apa pun di spreadsheet-nya. `permission` membatasi apa yang boleh dilakukan **user lewat grid**, bukan apa yang boleh dilakukan **action** yang dipicu dari page itu. Dua batas berbeda; jangan diandalkan sebagai satu.

## 7. Kontrak `text` — ◆-segmen, indeks mulai 1

Aturan umum ◆ (append-only, kosong di tengah tetap ditulis, `◆` haram di dalam teks) ada di `docs/web-row-actions-dev-spec.md` §2 dan berlaku sama di sini.

**`text` itu override, bukan sumber teks.** Aplikasi sudah punya terjemahannya sendiri; segmen yang dikosongkan tetap ikut bahasa aplikasi. Jadi isi `text` cuma kalau satu halaman memang butuh kata yang berbeda dari halaman lain — bukan supaya teksnya muncul.

| idx | Isi | Kalau kosong |
|---|---|---|
| **1** | placeholder kotak cari | "Cari…" |
| **2** | label tombol tambah baris | "Tambah Baris" |
| **3** | label tombol ekspor | "Ekspor" |
| **4** | label tombol muat ulang | "Muat Ulang" |
| **5** | teks saat tabel kosong | "Belum ada data" |
| **6** | teks saat memuat | "Memuat…" |
| **7** | teks saat gagal memuat | pesan error default |
| **8** | teks saat tidak punya akses spreadsheet | pesan default |
| **9** | tooltip sel berformula | "kolom terhitung otomatis" |
| **10** | tooltip sel terkunci | "sel terkunci di spreadsheet" |
| **11** | pesan saat sel bentrok (409) | "Data sudah diubah orang lain" |

Segmen baru → idx 12 dan seterusnya. **Jangan menyisipkan di tengah.**

---

## 8. Visual per state

Lebar kolom di gambar-gambar ini mengikuti `pixelSize` dari sheet.

### 8.1 Normal

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [🔍 Cari di tabel…            ]              + Tambah Baris   ⬇ Ekspor  ⟳ │
├─────┬──────────────┬───────┬──────────────┬──────────┬────────┬──────────┤
│  #  │ VID          │ NIP   │ Nama         │ Jabatan  │ Site   │  ⋯       │
│ ═══ │ ════════════ │ ═════ │ ════════════ │ ════════ │ ══════ │ ════════ │  ← baris beku
├─────┼──────────────┼───────┼──────────────┼──────────┼────────┼──────────┤
│  1  │ 788136801773 │       │ Imaglo CS    │ Selektor │ Produc │  ⚙  👁   │
│  2  │ 353393324999 │       │ Edu FM       │ Selektor │ Produc │  ⚙  👁   │
│  3  │ 419999991046 │       │ Functional   │ Selektor │ Produc │  ⚙  👁   │
└─────┴──────────────┴───────┴──────────────┴──────────┴────────┴──────────┘
  └── kolom beku ──┘                                      └ kolom aksi tetap
                                                            (BUKAN hover)
     ◀━━━━━━━━━━━━━━━━ scroll horizontal ━━━━━━━━━━━━━━━━▶
   Menampilkan 1–50 dari 812        ◀ 1 [2] 3 … 17 ▶
```

**Perubahan penting dari yang sekarang:** tombol aksi baris pindah ke **kolom tetap paling kanan**. Sekarang toolbar melayang di atas baris dan menutupi isi sel Nama/NIP — persis sel yang sedang ingin diedit user.

### 8.2 Sedang mengedit sel

```
│  1  │ 788136801773 │       │ ┌──────────────┐│ Selektor │
│     │              │       │ │Imaglo CS▮    ││          │   ← border tebal
│     │              │       │ └──────────────┘│          │
                              Enter simpan · Esc batal
```

Kolom dengan `dataValidation` dropdown → editor jadi combobox, opsi dari sheet:

```
│ Jabatan  ▾ │
├────────────┤
│ Selektor   │
│ Supervisor │
│ Admin      │
```

### 8.3 Sel terkunci (formula / protected)

```
│ Masa Kerja       │
│▒1 tahun 10 bulan▒│  ← latar abu, kursor not-allowed
└──────────────────┘
   ⓘ kolom terhitung otomatis
```

### 8.4 Kosong / memuat / gagal / tanpa akses

```
┌────────────────────────┐  ┌────────────────────────┐
│                        │  │ ▒▒▒▒▒▒  ▒▒▒▒  ▒▒▒▒▒▒▒▒ │
│      Belum ada data    │  │ ▒▒▒▒▒▒  ▒▒▒▒  ▒▒▒▒▒▒▒▒ │
│    [ + Tambah Baris ]  │  │ ▒▒▒▒▒▒  ▒▒▒▒  ▒▒▒▒▒▒▒▒ │
└────────────────────────┘  └────────────────────────┘
        kosong                      memuat

┌──────────────────────────────────────────────┐
│  ⚠  Gagal memuat data                        │
│     Kuota Google terlampaui, coba lagi.      │
│     [ Coba Lagi ]                            │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  🔒 Kamu tidak punya akses ke spreadsheet ini │
│     Minta akses ke pemilik dokumen.          │
└──────────────────────────────────────────────┘
```

State "tanpa akses" berbeda dari "gagal memuat" karena solusinya berbeda: yang satu minta di-share, yang satu tunggu lalu ulangi. Menyatukan keduanya membuat user menunggu sesuatu yang tak akan pernah berhasil.

### 8.5 Baris terpilih (`selectable:"TRUE"`)

```
┌────────────────────────────────────────────────────────┐
│ ☑ 12 baris dipilih      [ Generate 12 Slip ]  [ Batal ]│
├──┬─────┬──────────────┬───────────────────────────────┤
│☑ │  1  │ 788136801773 │ Imaglo CS                     │
│☑ │  2  │ 353393324999 │ Edu FM                        │
│☐ │  3  │ 419999991046 │ Functional test               │
└──┴─────┴──────────────┴───────────────────────────────┘
```

Bar seleksi menggantikan toolbar selama ada yang terpilih.

### 8.6 Banyak tab (`visibleSheets` lebih dari satu)

```
┌──────────────────────────────────────────────┐
│ [ Payroll ] [ Arsip ] [ Batal ]              │  ← tab, bukan chip pojok kanan
├──────────────────────────────────────────────┤
```

---

## 9. Sisi sheet

Template `contentSpreadsheetRowActions` (`Web Widget!J22`) perlu diperluas dengan key baru §6:

```
{"type":"SPREADSHEET","id":"[ID]","src":"[SRC]","permission":"[PERM]","visibleSheets":"[VISIBLE_SHEETS]","sheetName":"[SHEET_NAME]","rowHeader":[ROWHEADER],"rowStartData":[ROWSTARTDATA],"toolbar":"[TOOLBAR]","export":"[EXPORT]","pageSize":[PAGE_SIZE],"selectable":"[SELECTABLE]","text":"[TEXT]","rowActions":[[ROW_ACTIONS]]}
```

| Col | Token | Contoh |
|---|---|---|
| G | `[ID]` | `="slipGajiContent"` |
| H | `[SRC]` | `="https://docs.google.com/spreadsheets/d/1FQqc6…/edit"` |
| I | `[PERM]` | `="C◆U◆D"` |
| J | `[VISIBLE_SHEETS]` | `="Payroll◼2☆3"` |
| K | `[SHEET_NAME]` | `="Payroll"` |
| L | `[ROWHEADER]` | `=2` |
| M | `[ROWSTARTDATA]` | `=3` |
| N | `[ROW_ACTIONS]` | array entri, raw-inject |
| O | `[TOOLBAR]` | `="search◆addRow◆export◆sync"` |
| P | `[EXPORT]` | `="csv◆xlsx"` |
| Q | `[PAGE_SIZE]` | `=50` |
| R | `[SELECTABLE]` | `="FALSE"` |
| S | `[TEXT]` | ◆-segmen §7 |

`[PAGE_SIZE]` angka tanpa kutip — **jangan pernah dikosongkan**, sel kosong membuat JSON tidak valid. Isi `=0` kalau tidak mau paging.

---

## 10. Test case

| # | Kondisi | Harapan |
|---|---|---|
| 1 | kolom di-hide di sheet | hilang juga di web |
| 2 | lebar kolom diubah di sheet | ikut berubah di web setelah muat ulang |
| 3 | `frozenColumnCount: 2` | 2 kolom pertama sticky saat scroll horizontal |
| 4 | kolom tanpa header dan tanpa isi | tidak dirender |
| 5 | kolom berheader tapi isinya kosong | tetap dirender |
| 6 | sel `=VLOOKUP(...)` | terkunci di UI **dan** ditolak server kalau request dipaksakan |
| 7 | kolom validasi dropdown | editor jadi combobox, opsi dari sheet |
| 8 | ketik `0812345678` di kolom teks | tersimpan persis, nol depan utuh (`RAW`) |
| 9 | ketik tanggal di kolom validasi date | tersimpan sebagai tanggal asli (`USER_ENTERED`) |
| 10 | dua user edit sel sama | yang kedua dapat `409` + nilai terbaru, bukan tertimpa diam-diam |
| 11 | `permission` tanpa `D`, request DELETE dipaksakan | ditolak server |
| 12 | `cell` menunjuk tab di luar `visibleSheets` | ditolak server |
| 13 | user tidak punya akses Drive ke spreadsheet | state "tanpa akses", bukan "gagal memuat" |
| 14 | kuota Google terlampaui | retry backoff, lalu state gagal + tombol coba lagi |
| 15 | sel merge di sheet | render `colSpan`/`rowSpan` |
| 16 | `toolbar` kosong | tidak ada toolbar sama sekali |
| 17 | `toolbar` menyebut `addRow` tapi `permission` tanpa `C` | item tidak dirender |
| 18 | `pageSize: 0`, 5.000 baris | scroll virtual, tidak nge-freeze |
| 19 | `text` cuma 3 segmen | idx 4+ pakai default, tidak error |
| 20 | sel `CLIP` yang isinya kepanjangan | terpotong + tooltip isi penuh |
| 21 | edit 3 sel cepat, 1 gagal | hanya sel yang gagal yang bertanda `!`, dua lainnya `✓` |
| 22 | simpan gagal | nilai di layar **kembali ke isi lama**, bukan tetap menampilkan yang gagal |
| 23 | simpan sukses | `✓` muncul lalu hilang sendiri; tidak ada yang tertulis ke spreadsheet selain nilainya |
| 24 | refresh halaman setelah edit | nilai tetap, penanda `✓`/`!` hilang (penanda cuma state browser) |
| 25 | panah di sel terpilih | pindah sel; melewati kolom tersembunyi |
| 26 | `Enter` di sel terpilih (belum edit) | masuk mode edit |
| 27 | `Enter` setelah simpan | pindah ke sel bawahnya |
| 28 | panah sampai tepi tabel | sel terpilih ikut ter-scroll ke dalam pandangan |
| 29 | panah masuk ke sel berformula | boleh berhenti di situ dan boleh disalin, tapi tidak bisa masuk edit |

---

## 11. Yang masih terbuka

1. **Banner "Enable third-party cookies"** di halaman Slip Gaji. Grid ini dibaca lewat Sheets API server-side, jadi seharusnya tidak butuh cookie pihak ketiga. Berarti ada komponen lain yang masih meng-embed Google. Perlu ditelusuri — user Brave/Safari/incognito akan terus melihat banner ini, dan sebagian akan melihat komponen itu kosong.
2. **Reaksi terhadap perubahan di spreadsheet.** Sekarang mirror hanya terjadi saat muat halaman. Kalau seseorang mengubah sheet, web baru ikut setelah `sync`/reload. Butuh polling atau tidak — tentukan sebelum dibangun, jangan ditambal belakangan.
3. **`conditionalFormats`** sengaja tidak diproses di v1: aturannya bisa berupa formula sembarang yang harus dievaluasi ulang di klien. Kalau butuh status berwarna, cara termurah adalah mewarnai selnya langsung di sheet — itu ikut termirror lewat `backgroundColor`.
4. **`protectedRanges`** perlu dicek per user atau cukup keberadaannya? Range yang diproteksi untuk orang lain tetap boleh diedit user ini.
5. **Undo setelah hapus baris.** Belum ada. Hapus baris di sheet tidak bisa dibatalkan dari API.
6. **Batas jumlah baris** sebelum grid perlu server-side paging, bukan hanya virtual scroll.
