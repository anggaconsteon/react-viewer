# Dev Spec — `rowActions[]` + kontrak `text` ◆-segmen (Web)

**Status:** dibuat 2026-08-20 · **TERPASANG 2026-08-28** (Batch C). `rowAction` + `rowView` lama tetap didukung — renderer menormalkannya ke bentuk `rowActions[]` sebelum menggambar, jadi keduanya lewat jalur yang sama persis. Migrasi page lama opsional.

> **Jebakan migrasi:** `rowAction` lama defaultnya **menampilkan** konfirmasi. Di bentuk baru, konfirmasi ditentukan ada-tidaknya segmen teks ke-3 — jadi kalau segmen 3 lupa diisi waktu migrasi, tombol Generate berubah jadi jalan sekali klik tanpa peringatan. Untuk aksi yang menulis dokumen, isi segmen 3.
**Sheet:** VTL Master `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` → tab `Web Widget` row 22 (`contentSpreadsheetRowActions`)
**Menggantikan usulan:** `rowView` sebagai key terpisah
**Terkait:** `docs/web-button-link-dev-spec.md` (ClickAction `OPEN_LINK`)

---

## 1. Ringkas

Permintaan awal: ikon "lihat dokumen" di samping tiap baris tabel, linknya dari kolom sheet. Bentuk yang diusulkan adalah key baru `rowView` bersebelahan dengan `rowAction` yang sudah ada.

Yang dibangun sebagai gantinya: **satu array `rowActions[]`**, tiap entri punya `type`. `rowView` menjadi entri ber-`type: "OPEN_LINK"`.

Alasannya: `rowAction` + `rowView` berarti dua tombol dengan dua bentuk berbeda. Permintaan berikutnya (`rowDelete`, `rowWhatsApp`, buka halaman detail) masing-masing butuh key baru, token template baru, dan kolom sheet baru. Dengan array, ikon ketiga dan seterusnya cuma menambah entri config — nol kode renderer.

Perubahan kedua: **semua teks dalam satu field `text` dipisah `◆`**, mengikuti aturan yang sudah berlaku di op1Screen (`.claude/skills/widget-dsl-pattern/SKILL.md` §3: jangan bikin banyak key untuk teks).

---

## 2. Kontrak `text` — ◆-segmen, indeks mulai 1

Satu field `text` per entri `rowActions`. Indeks **seragam untuk semua `type`** — segmen yang tidak relevan dikosongkan.

| idx | Isi | Kalau kosong |
|---|---|---|
| **1** | label / tooltip ikon | — **wajib diisi** |
| **2** | tooltip saat ikon nonaktif | tooltip default sistem |
| **3** | pertanyaan konfirmasi | **tanpa konfirmasi**, aksi langsung jalan |
| **4** | toast sukses | tidak ada toast |
| **5** | toast gagal | pesan error default |
| **6** | judul dialog (`mode: "dialog"`) | pakai segmen 1 |

### Aturan yang mengikat

1. **Indeks mulai dari 1.** Segmen pertama = idx 1, bukan 0.
2. **Segmen baru hanya boleh di-append di ujung.** Dilarang menyisipkan di tengah atau menukar urutan — itu menggeser makna semua segmen di bawahnya dan diam-diam merusak semua page yang sudah live. Butuh teks baru → idx 7, 8, dst.
3. **Segmen kosong di tengah tetap ditulis** sebagai `◆◆` — posisi menentukan makna.
4. **Segmen kosong di ujung boleh dipotong.** `"Label◆◆Yakin?"` sama saja dengan `"Label◆◆Yakin?◆◆◆"`.
5. **Karakter `◆` dilarang muncul di dalam teks.** Tidak ada escape. Kalau labelnya butuh diamond, ganti kata.
6. Renderer membaca dengan `split("◆")` lalu index; segmen yang tidak ada diperlakukan sebagai string kosong — **jangan lempar error** kalau `text` cuma punya 3 segmen.

### Kenapa kelemahan ini diterima

`◆` posisional tidak self-documenting: `◆◆` di tengah tidak menjelaskan apa-apa, dan salah hitung posisi tidak ketahuan sampai muncul di layar. Ini konsekuensi sadar, sama seperti di op1Screen. Yang menahannya cuma dua hal, dan dua-duanya wajib: **tabel indeks di dokumen ini**, dan **aturan append-only di poin 2**. Kalau tabel ini tidak di-update saat menambah segmen, kontraknya hilang.

---

## 3. Kontrak `rowActions[]`

Array pada content `SPREADSHEET`. Tiap entri:

### Field bersama (semua `type`)

| key | tipe | isi |
|---|---|---|
| `type` | string | `RUN_ACTION` \| `OPEN_LINK` |
| `icon` | string | nama ikon lucide, mis. `FileOutput`, `Eye` |
| `text` | string | ◆-segmen, lihat §2 |

### `type: "RUN_ACTION"`

| key | tipe | isi |
|---|---|---|
| `action` | string | key registry backend, mis. `DOCENGINE_GENERATE` |
| `payload` | object | diteruskan apa adanya ke backend; renderer tidak mengubah |
| `refresh` | string | `"TRUE"` \| `"FALSE"` — muat ulang tabel setelah sukses |

Renderer menambahkan konteks baris (nomor baris / key baris) ke request sesuai mekanik `rowAction` yang sudah berjalan sekarang. Tidak ada perubahan di sisi itu.

### `type: "OPEN_LINK"`

| key | tipe | isi |
|---|---|---|
| `sourceColumns` | string | ◆-list nama kolom header. **Yang pertama non-kosong menang.** |
| `mode` | string | `dialog` \| `newTab` \| `sameTab` |

`sourceColumns` menggantikan pasangan `sourceColumn` + `fallbackColumn`. Alasan: pasangan itu hanya menampung dua; sumber ketiga akan memaksa key `fallback2Column`. Sumber ketiga di bentuk baru = tambah satu segmen.

Pencocokan nama kolom: dibaca dari baris `rowHeader`, **trim + case-insensitive**. Kolom tidak ketemu → diperlakukan seperti sel kosong (ikon nonaktif) **dan dicatat di log** — supaya salah ketik nama kolom tidak terlihat sama dengan "belum di-generate".

#### Kolom sumber biasanya DISEMBUNYIKAN — dan itu harus tetap jalan

Kolom link umumnya di-hide di spreadsheet supaya tabel tidak penuh URL panjang. Kasus nyata di sheet `Payroll`: kolom **W** = `Link Drive (Slip Gaji)`, **X** = `Link Storage (Slip Gaji)`, dua-duanya tersembunyi.

Ini jalan, asalkan satu hal tidak salah dibangun:

> **Cari nama kolom di daftar kolom PENUH, bukan di kolom yang dirender.**

`hiddenCols` (`lib/google-sheets/sheet.ts:350`) hanya dipakai untuk **melewati render**. Isi datanya tetap lengkap di `values` — `readSheet` mengambil seluruh sheet tanpa peduli kolom mana yang disembunyikan. Jadi indeks kolom harus dihitung dari baris header utuh; kalau resolusi dilakukan setelah kolom tersembunyi dibuang, `sourceColumns` tidak akan pernah ketemu dan semua ikon jadi nonaktif tanpa error apa pun.

Karena headernya ada, **tidak perlu** dukungan huruf kolom (`"W"`). Kalau suatu saat ada kolom tersembunyi tanpa header sama sekali, baru tambahkan — jangan dibangun sekarang.

#### Bentuk URL yang benar-benar ada di kolom itu

| Kolom | Contoh isi | Perlakuan |
|---|---|---|
| `Link Storage (Slip Gaji)` | `https://firebasestorage.googleapis.com/…/slip-gaji/….pdf?alt=media&token=…` | PDF langsung, aman di-iframe |
| `Link Drive (Slip Gaji)` | `https://drive.google.com/file/d/<id>/view?usp=drivesdk` | **wajib dikonversi ke `/preview`** sebelum masuk iframe |

Bentuk `/view?usp=drivesdk` **tidak akan render di iframe** — user cuma melihat kotak putih dan mengira slipnya rusak. Konversi: ambil `<id>`, susun ulang jadi `https://drive.google.com/file/d/<id>/preview`, buang query-nya.

Urutan `sourceColumns` yang dipakai sekarang menaruh Storage lebih dulu justru karena alasan itu — yang mulus di-iframe didahulukan, Drive jadi cadangan.

#### Hidden bukan rahasia

Kolom yang disembunyikan **tetap dikirim utuh ke browser**. Siapa pun yang bisa membuka halaman ini bisa membaca seluruh isinya lewat DevTools, termasuk baris milik orang lain.

Untuk Slip Gaji itu berarti setiap pengguna halaman menerima URL slip gaji **semua** pegawai, dan URL Storage itu membawa `token=` yang bisa diakses siapa saja yang memegangnya — tanpa login. Menyembunyikan kolom tidak mengubah apa pun soal ini.

Kalau itu tidak diinginkan, sembunyikan kolom saja tidak cukup. Pilihannya: jangan kirim kolom tersebut ke klien (server yang menyimpan dan hanya mengembalikan URL untuk baris yang diminta saat ikon diklik), atau pakai URL yang berumur pendek. Keputusan ada di pemilik data — yang penting jangan sampai dikira sudah aman karena kolomnya tidak terlihat.

### Boolean

Tidak ada key `confirm`. Konfirmasi ditentukan oleh **ada-tidaknya segmen teks idx 3**. Ini sekaligus menghilangkan sumber bug lama: cell Sheets berisi boolean di-render `TRUE` uppercase, dan itu JSON tidak valid. Flag yang memang harus boolean (`refresh`) ditulis sebagai **string** `"TRUE"`/`"FALSE"` dan dibandingkan case-insensitive.

---

## 4. Sisi sheet

Widget baru `contentSpreadsheetRowActions` (`Web Widget!J22`):

```
{"type":"SPREADSHEET","id":"[ID]","src":"[SRC]","permission":"[PERM]","visibleSheets":"[VISIBLE_SHEETS]","sheetName":"[SHEET_NAME]","rowHeader":[ROWHEADER],"rowStartData":[ROWSTARTDATA],"rowActions":[[ROW_ACTIONS]]}
```

Param di baris Web Screen — G–M identik dengan `contentSpreadsheetRowAction` yang sudah ada:

| Col | Token | Contoh |
|---|---|---|
| G | `[ID]` | `="slipGajiContent"` |
| H | `[SRC]` | `="https://docs.google.com/spreadsheets/d/1FQqc6…/edit"` |
| I | `[PERM]` | `="C◆U◆D"` |
| J | `[VISIBLE_SHEETS]` | `="Payroll◼2☆3"` |
| K | `[SHEET_NAME]` | `="Payroll"` |
| L | `[ROWHEADER]` | `=2` |
| M | `[ROWSTARTDATA]` | `=3` |
| N | `[ROW_ACTIONS]` | isi array, raw-inject (lihat §5) |

`[ROW_ACTIONS]` = objek-objek entri di-comma-join **tanpa kurung siku luar** (template sudah punya `[[ROW_ACTIONS]]`), sama pola dengan `[FIELDS]` di `contentFormAction`.

`contentSpreadsheetRowAction` (row 18) **tidak disentuh** — page Slip Gaji yang sekarang live tetap jalan di atasnya.

---

## 5. JSON hasil resolve (yang benar-benar diterima renderer)

Content widget, kasus Slip Gaji:

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
  "rowActions": [
    {
      "type": "RUN_ACTION",
      "icon": "FileOutput",
      "action": "DOCENGINE_GENERATE",
      "payload": { "docType": "Slip Gaji" },
      "refresh": "FALSE",
      "text": "Generate slip baris ini◆◆Generate slip untuk baris ini?◆Slip gaji baris ini selesai◆Gagal generate slip"
    },
    {
      "type": "OPEN_LINK",
      "icon": "Eye",
      "sourceColumns": "Link Storage (Slip Gaji)◆Link Drive (Slip Gaji)",
      "mode": "dialog",
      "text": "Lihat slip gaji◆Slip belum di-generate◆◆◆Link tidak valid◆Slip Gaji"
    }
  ]
}
```

Pembacaan segmen entri kedua:

| idx | nilai | efek |
|---|---|---|
| 1 | `Lihat slip gaji` | tooltip ikon |
| 2 | `Slip belum di-generate` | tooltip saat kolom kosong |
| 3 | *(kosong)* | tanpa konfirmasi |
| 4 | *(kosong)* | tanpa toast sukses |
| 5 | `Link tidak valid` | toast saat URL ditolak |
| 6 | `Slip Gaji` | judul dialog |

---

## 6. Kerja renderer

### 6.1 Render ikon per baris

```js
function renderRowIcons(row, content) {
  const list = content.rowActions ?? (content.rowAction ? [content.rowAction] : []);
  return list.map(a => {
    const t = String(a.text ?? "").split("◆");
    const seg = i => (t[i - 1] ?? "").trim();          // 1-based

    const enabled = a.type !== "OPEN_LINK" || Boolean(pickLink(row, content, a));
    return icon({
      name: a.icon,
      tooltip: enabled ? seg(1) : (seg(2) || seg(1)),
      disabled: !enabled,
      onClick: () => runRowAction(a, row, content),
    });
  });
}

function pickLink(row, content, a) {
  const cols = String(a.sourceColumns ?? "").split("◆").map(s => s.trim()).filter(Boolean);
  for (const name of cols) {
    const v = String(cellByHeader(row, content, name) ?? "").trim();
    if (v) return v;                                   // pertama non-kosong menang
  }
  return "";
}
```

Baris tanpa link → **ikon tetap tampil tapi nonaktif**, tooltip = segmen 2. Jangan sembunyikan ikonnya: kolom ikon yang isinya berubah-ubah per baris membuat tabel terlihat rusak.

### 6.2 Klik

```js
async function runRowAction(a, row, content) {
  const t = String(a.text ?? "").split("◆");
  const seg = i => (t[i - 1] ?? "").trim();

  if (seg(3) && !(await confirmDialog(seg(3)))) return;

  if (a.type === "OPEN_LINK") {
    const raw = pickLink(row, content, a);
    const url = safeUrl(raw);                          // §7
    if (!url) return toast(seg(5) || "Link tidak valid");

    if (a.mode === "dialog" && isEmbeddable(url)) return openDialog(toPreview(url), seg(6) || seg(1));
    if (a.mode === "sameTab") return window.location.assign(url);
    return window.open(url, "_blank", "noopener,noreferrer");
  }

  const res = await post("/api/actions", { action: a.action, payload: a.payload, row: rowRef(row) });
  if (!res.ok) return toast(seg(5) || res.error);
  if (seg(4)) toast(seg(4));
  if (String(a.refresh ?? "").toUpperCase() === "TRUE") refreshTable(content.id);
}
```

Aturan:

- `payload` **tidak boleh disentuh** renderer. Bentuknya berbeda-beda per action; renderer hanya meneruskan.
- `mode: "dialog"` tapi URL tidak embeddable (§7) → **jatuh ke tab baru**, bukan iframe kosong.
- Segmen yang tidak ada = string kosong, bukan error.

---

## 7. Keamanan — wajib, bukan opsional

Isi kolom link berasal dari cell spreadsheet. **Siapa pun yang punya akses tulis ke sheet itu bisa mengubahnya**, dan hasilnya menjadi target navigasi atau isi iframe di dalam aplikasi kita. Perlakukan sebagai input tidak tepercaya.

### 7.1 `safeUrl(raw)`

- Parse dengan URL parser, **bukan `startsWith`**. `https://evil.com@real.com` lolos kalau cuma dicek prefix.
- Hanya scheme `https:`. Tolak `http:`, `javascript:`, `data:`, `vbscript:`, `file:`, dan URL relatif.
- Trim whitespace dan karakter kontrol sebelum parsing.
- Gagal → kembalikan kosong, tampilkan toast segmen 5. Jangan buka apa pun.

### 7.2 `isEmbeddable(url)` — khusus `mode: "dialog"`

Menaruh halaman orang lain di dalam chrome aplikasi kita membuatnya tampak sebagai bagian dari aplikasi. Karena itu **dialog hanya untuk host yang di-allowlist**:

```
drive.google.com
docs.google.com
storage.googleapis.com
<domain sendiri>
```

Host di luar daftar → paksa `newTab`. Daftar ini disimpan di config aplikasi, **bukan di sheet** — kalau di sheet, orang yang bisa mengubah linknya juga bisa mengubah daftar yang seharusnya membatasi dia.

### 7.3 `toPreview(url)`

Link Google Drive bentuk `/view` **tidak akan render di iframe**. Konversi ke `/preview` dulu:

```
https://drive.google.com/file/d/<id>/view?usp=sharing
→ https://drive.google.com/file/d/<id>/preview
```

Bentuk lain yang tidak dikenali → biarkan apa adanya, dan kalau iframe gagal muat dalam ~5 detik, tawarkan "buka di tab baru". Tanpa ini, user cuma melihat kotak putih dan mengira slipnya rusak.

---

## 8. Kompatibilitas

- `rowAction` singular yang sudah live **tetap didukung**: renderer memperlakukannya sebagai `rowActions` berisi satu entri.
- Entri lama boleh tetap memakai key `label` / `successToast` / `confirm`. Kalau `text` ada, `text` yang menang. Ini supaya page Slip Gaji tidak perlu diubah bersamaan dengan renderer.
- Migrasi Slip Gaji ke `contentSpreadsheetRowActions` dilakukan terpisah, setelah renderer siap.

---

## 9. Test case

| # | Kondisi | Harapan |
|---|---|---|
| 1 | 2 entri `rowActions` | 2 ikon per baris, urutan sesuai array |
| 2 | `rowAction` singular (page lama) | 1 ikon, perilaku sama seperti sekarang |
| 3 | kolom sumber 1 kosong, kolom 2 isi | pakai kolom 2 |
| 4 | dua-duanya kosong | ikon nonaktif, tooltip = segmen 2 |
| 5 | nama kolom salah ketik | ikon nonaktif + log warning |
| 6 | `text` cuma 3 segmen | idx 4–6 dianggap kosong, tidak error |
| 7 | segmen 3 kosong | klik langsung jalan tanpa dialog |
| 8 | segmen 3 isi, user batal | tidak ada request, tidak ada navigasi |
| 9 | cell berisi `javascript:alert(1)` | ditolak, toast segmen 5 |
| 10 | cell berisi `http://…` | ditolak |
| 11 | `mode:"dialog"`, link Drive `/view` | dialog terbuka dengan bentuk `/preview` |
| 12 | `mode:"dialog"`, host di luar allowlist | dibuka di tab baru, bukan dialog |
| 13 | `refresh:"TRUE"` setelah sukses | tabel dimuat ulang |
| 14 | `refresh:"FALSE"` | tabel tidak dimuat ulang |
| 15 | label mengandung `◆` | dilarang — cek saat review config, bukan runtime |

---

## 10. Yang masih terbuka

1. **Ikon kondisional per baris.** Belum ada cara menyembunyikan entri berdasarkan isi kolom lain (mis. sembunyikan "Generate" kalau statusnya sudah selesai). Kalau perlu, tambahkan `visibleIf: "<kolom>◼<nilai>"` — DSL yang sama sudah dipakai di spec form. Jangan dibangun sebelum ada kebutuhan nyata.
2. **`type` berikutnya.** `NAVIGATE` (buka page lain dengan param dari baris) kemungkinan besar permintaan berikutnya. Masuk ke array yang sama, tidak perlu struktur baru.
3. Nama kolom vs huruf kolom: spec ini memakai **nama header**. Kalau ada sheet yang headernya sering diganti, sediakan alternatif huruf kolom — tapi jangan dua-duanya aktif tanpa aturan mana yang menang.
4. Batas jumlah ikon per baris sebelum kolom aksi jadi terlalu sempit di layar kecil.
