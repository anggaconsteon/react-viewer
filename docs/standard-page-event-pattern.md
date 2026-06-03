# Standard Pattern: Page + addToTable + Event

Dokumen ini adalah panduan untuk membuat page baru yang menyimpan data ke Firebase (addToTable) dan membuat Event entry (savesend). Semua page baru **WAJIB** mengikuti pattern ini agar konsisten dan bisa diparsing oleh op1Script.

**Patokan utama:** `vertikaTeknoLokaciptaRequestLeave` (op1Screen row 655)

---

## 1. Konsep Dasar

Ketika user menekan tombol submit di form:

```
[ User klik Submit ]
        │
        ▼
   action: "savesend"
        │
        ├──► Event C  → masuk ke tab Event (audit trail, reporting)
        │                dibangun dari POSITION widget form
        │
        └──► addToTable → masuk ke Firebase (data operasional)
                          dibangun dari DSL string di button config
```

**Event C** dan **addToTable** adalah 2 hal TERPISAH:
- Event C = dari **position** widget form (★ sections)
- addToTable = dari **DSL string** di property `addToTable` pada button

---

## 2. addToTable — Struktur Standard

### 2.1 Header

```
{table_path}⭘retention◼{hari}⭘tablevid◼{vid}⭘index◼{indexed_fields}⭘description◼{deskripsi}⭘flag◼{flag_name}
```

| Field | Keterangan | Contoh |
|-------|-----------|--------|
| table_path | Path Firebase: `$test/{module}//{provider}.{table}` | `$test/request-approval//vtl.trial-approval` |
| retention | Berapa hari data disimpan | `4320` |
| tablevid | VID tabel (dari sistem) | `20342033315492` |
| index | Field yang bisa di-search, format: `{index}★{type}` (S=string, N=number) | `1★S◼2★S◼5★N◼7★N◼9★N` |
| description | Deskripsi singkat | `Leave request for vtl` |
| flag | Identifier untuk tipe data | `leave-request` |

### 2.2 Default Block (`<1>` sampai `<12>`) — WAJIB SAMA

**Ini adalah bagian yang HARUS IDENTIK di semua page.** Jangan ubah urutan atau index-nya.

| Index | Isi | Cell Reference | Keterangan |
|-------|-----|----------------|------------|
| `<1>` | `◁17▷` | — (runtime) | **No. Permohonan** — dari widget NUMBER di position 17 |
| `<2>` | Status awal | — (static) | Status awal transaksi. Contoh: `PENDING`, `MENUNGGU` |
| `<3>` | `[]` | — (static) | **History** — placeholder, isi `[]` |
| `<4>` | `[]` atau `[[...]]` | — (static) | **Approval levels** — `[]` jika tanpa approval, `[[1, PENDING, , , , ], ...]` jika ada approval |
| `<5>` | myVID | `Settings!$B$1` | VID user yang submit |
| `<6>` | myName | `Settings!$B$2` | Nama user yang submit |
| `<7>` | siteVID | `'op1'!$K$8` | VID site/lokasi kerja |
| `<8>` | siteName | `'op1'!$L$8` | Nama site |
| `<9>` | siteVID2 | `'op1'!$K$7` | VID group/organisasi |
| `<10>` | siteName2 | `'op1'!$L$7` | Nama group |
| `<11>` | submitTime | `◀2\|T"&System!$B$3&"\|Ddd MMM yyyy HH:mm▶` | Timestamp formatted |
| `<12>` | submitEpoch | `◀2▶` | Timestamp raw (epoch ms) |

**Kenapa `<3>` dan `<4>` wajib ada meskipun kosong?**
- Agar `<5>` (VID) selalu di index 5 di SEMUA page
- op1Script bisa pakai 1 scaffold D formula untuk semua route
- Kalau nanti page butuh approval, tinggal isi `<4>` — zero migration

### 2.3 Tail Block (`<13>` dan seterusnya) — CUSTOM per page

Mulai dari `<13>`, isi dengan data form sesuai kebutuhan page. Urutan bebas, tapi usahakan konsisten.

**Format token:**
- `◁N▷` = ambil value dari widget di **position N** (runtime, user input)
- `◀N▶` = ambil value dari **system stream N** (timestamp, GPS, dll)
- `◀N|T7|format▶` = system stream dengan format waktu
- `◁N|T7|format▷` = widget value dengan format waktu
- Teks biasa = static/literal value

### 2.4 Index Field

```
index◼{idx1}★{type}◼{idx2}★{type}◼...
```

Index = field yang bisa dipakai untuk search/filter di Firebase. Hanya index field yang PERLU di-search.

**Standar minimum:**
```
index◼1★S◼2★S◼5★N◼7★N◼9★N
```
- `1★S` = No. Permohonan (string, searchable)
- `2★S` = Status (string, filterable)
- `5★N` = myVID (number, filter by user)
- `7★N` = siteVID (number, filter by site)
- `9★N` = siteVID2 (number, filter by group)

Tambahkan index lain jika page butuh search/filter tambahan.

### 2.5 Template Formula

**Copy-paste template ini, ganti bagian `{...}` saja:**

```
="$test/{module}//{provider}.{table}⭘retention◼4320⭘tablevid◼20342033315492⭘index◼1★S◼2★S◼5★N◼7★N◼9★N⭘description◼{deskripsi}⭘flag◼{flag}⭘<1>◼◁17▷⭘<2>◼{STATUS_AWAL}⭘<3>◼[]⭘<4>◼{APPROVAL_ATAU_KOSONG}⭘<5>◼"&Settings!$B$1&"⭘<6>◼"&Settings!$B$2&"⭘<7>◼"&'op1'!$K$8&"⭘<8>◼"&'op1'!$L$8&"⭘<9>◼"&'op1'!$K$7&"⭘<10>◼"&'op1'!$L$7&"⭘<11>◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm▶⭘<12>◼◀2▶⭘<13>◼{TAIL_FIELDS}⭘<30>◼{SUMMARY_TEMPLATE}"
```

**Yang perlu diganti:**
| Placeholder | Isi dengan |
|-------------|-----------|
| `{module}` | Nama modul Firebase (contoh: `request-approval`, `report-incident`) |
| `{provider}.{table}` | Nama provider + tabel (contoh: `vtl.trial-approval`) |
| `{deskripsi}` | Deskripsi singkat |
| `{flag}` | Flag identifier |
| `{STATUS_AWAL}` | Status awal: `PENDING`, `MENUNGGU`, dll |
| `{APPROVAL_ATAU_KOSONG}` | `[]` (tanpa approval) atau `[[1, PENDING, , , , ], [2, PENDING, , , , ]]` (dengan N level) |
| `{TAIL_FIELDS}` | Field form dari `<13>` dst, pakai token `◁N▷` |
| `{SUMMARY_TEMPLATE}` | Template text untuk display (pakai `◁N▷` tokens) |

---

## 3. Widget Position — Aturan

### 3.1 Position yang FIXED (jangan pakai untuk field lain)

| Position | Fungsi | Widget Type |
|----------|--------|-------------|
| 17 | No. Permohonan (auto-number) | NUMBER |
| 251 | Submit button | RBT |

### 3.2 Position untuk form field

Gunakan position **3 sampai 16** dan **18 ke atas** untuk field form. Hindari position 1, 2, 17, 251.

**Saat mendesain form baru, assign position secara berurutan:**

```
Position 3  → field pertama
Position 4  → field kedua
Position 5  → field ketiga
...dst
```

### 3.3 Hubungan Position → ★ Section → op1Script Column

```
★ section = position - 1
op1Script column = chr(ord('E') + ★_section - 1)
```

| Position | ★ Section | op1Script Col | Cell (row 13) |
|----------|-----------|---------------|---------------|
| 3 | ★2 | F | F13 |
| 4 | ★3 | G | G13 |
| 5 | ★4 | H | H13 |
| 6 | ★5 | I | I13 |
| 7 | ★6 | J | J13 |
| 8 | ★7 | K | K13 |
| 9 | ★8 | L | L13 |
| 10 | ★9 | M | M13 |
| 11 | ★10 | N | N13 |
| 12 | ★11 | O | O13 |
| 13 | ★12 | P | P13 |
| 14 | ★13 | Q | Q13 |
| 15 | ★14 | R | R13 |
| 16 | ★15 | S | S13 |
| 17 | ★16 | T | T13 |
| 18 | ★17 | U | U13 |

**★1 (E13) selalu identity block** (auto dari sistem, bukan dari form).

---

## 4. Event C — Struktur

Saat savesend dijalankan, mobile app otomatis membuat Event C dari position widget:

```
0{flag}◆{timestamp}◆◆◆{lat}◆{lng}◆◆{country}◆{zip}◆{state}◆{regency}◆{district}◆{village}◆{street}◆{number}◆{location-type}⬤★{identity}★{pos3}★{pos4}★{pos5}★...★{pos17}
```

- Bagian sebelum `⬤` = **geo block** (otomatis dari GPS, gpsPosition: 2)
- `★1` = **identity block** (otomatis dari sistem)
- `★2` dst = **data form** sesuai position widget (★ = position - 1)
- Position yang tidak ada widget = ★ section kosong

**Anda TIDAK perlu membuat Event C secara manual.** Selama button punya `action: "savesend"` dan widget punya `position`, Event C otomatis dibuat.

---

## 5. D Formula (op1Script) — Pattern

D formula di op1Script mengubah Event C menjadi format reporting. Setiap route punya 1 baris D formula.

### 5.1 Struktur: Scaffold + Tail

```
=REGEXREPLACE(
  {SCAFFOLD}
  &"◻"&{ORG_CHAIN}
  &"◻"&{ROUTE_BLOCK}
  &"◻"&{TAIL}
, "(""|')", "`")
```

**Scaffold** (SAMA untuk semua route):
```
C$16&"◼"&D$16&"◼"&B$16&"◼"&$F$13&"◼"&N$14&", "&M$14&", "&L$14&", "&K$14&", "&J$14&", "&I$14
```

**Org chain** (SAMA untuk semua route):
```
'op1'!$H$1&"☆"&'op1'!$H$2&"◻"&'op1'!$I$5&"◻"&'op1'!$J$5&"◻"&'op1'!$K$5
```

**Route block** (SAMA untuk semua route):
```
Event!$B$2&"☆"&$B$12
```

**Tail** (BEDA per route — hanya cell yang ada data, separator ☆):
```
${CELL1}$13&"☆"&${CELL2}$13&"☆"&...
```

### 5.2 Cara Menentukan Tail

1. List semua position yang punya data di form
2. Convert position → op1Script column (lihat tabel di Section 3.3)
3. Susun cell references dengan separator `☆`
4. **SKIP** F13 karena sudah masuk di scaffold (`$F$13`)
5. **SKIP** position kosong (gak perlu dimasukkan)

### 5.3 Row Config di op1Script

Taruh di area rows 45+ (setelah row terakhir yang ada):

| Column | Isi |
|--------|-----|
| A | Label (contoh: `ReportIncident`) |
| B | Route key dengan `◇` separator (contoh: `report◇incident`) |
| C | Sama dengan B |
| D | Formula (lihat di atas) |
| F | Slug hyphenated (contoh: `report-incident`) |

---

## 6. Button Config — Properties Wajib

```json
{
  "position": 251,
  "text": "Kirim",
  "action": "savesend",
  "com": "auz",
  "gpsPosition": 2,
  "flag": "{flag_name}",
  "delay": 5,
  "width": "full",
  "height": 64,
  "run": "{positions_to_disable}◆17:generate_number◆251:disable",
  "addToTable": "{DSL_string}",
  "chain": {
    "type": "DO_DIALOG",
    "title": "{dialog_title}",
    "children": [
      { "type": "TXT", "data": "Terkirim" },
      { "type": "RBT", "alignment": "center", "children": [{ "text": "Ok", "route": "" }] }
    ]
  }
}
```

**Catatan penting:**
- `action` HARUS `"savesend"` (bukan `"addToTable"`) agar Event C juga dibuat
- `gpsPosition: 2` = ambil GPS saat submit
- `run` harus include `17:generate_number` untuk auto-number dan `251:disable` untuk disable button
- `flag` di button = flag untuk Event C. `flag` di addToTable DSL = flag untuk Firebase record (bisa beda)

---

## 7. Contoh Lengkap

### 7.1 RequestLeave (PATOKAN)

**Form positions:**
| Pos | Widget | Field |
|-----|--------|-------|
| 3 | GET_IMAGES | Dokumen |
| 4 | DRD | Jenis Cuti |
| 6 | TXF date | Tanggal Mulai |
| 7 | TXF date | Tanggal Selesai |
| 10 | TXF text | Keterangan |
| 11 | TXF numeric | Jumlah Hari |
| 15 | TXF static | Status |
| 16 | tableSearch | Pengganti VID |
| 17 | NUMBER | No. Permohonan |
| 18 | TXF readonly | Nama Pengganti |

**addToTable:**
```
="$test/request-approval//vtl.trial-approval⭘retention◼4320⭘description◼Leave request for vtl⭘flag◼leave-request⭘tablevid◼20342033315492⭘index◼1★S◼2★S◼5★N◼7★N◼9★N◼13★S⭘<1>◼◁17▷⭘<2>◼◁15▷⭘<3>◼[]⭘<4>◼[[1, PENDING, , , , ], [2, PENDING, , , , ], [3, PENDING, , , , ]]⭘<5>◼"&Settings!$B$1&"⭘<6>◼"&Settings!$B$2&"⭘<7>◼"&'op1'!$K$8&"⭘<8>◼"&'op1'!$L$8&"⭘<9>◼"&'op1'!$K$7&"⭘<10>◼"&'op1'!$L$7&"⭘<11>◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm▶⭘<12>◼◀2▶⭘<13>◼◁4▷⭘<14>◼◁10▷⭘<15>◼◁3▷⭘<16>◼◁6▷⭘<17>◼◁6|T7|Ddd MMM yyyy HH:mm▷⭘<18>◼◁7▷⭘<19>◼◁7|T7|Ddd MMM yyyy HH:mm▷⭘<20>◼◁11▷⭘<21>◼⭘<22>◼◁16▷⭘<23>◼◁18▷⭘<24>◼Sekuriti⭘<25>◼{icon_url}⭘<30>◼Tanggal ◁6|T7|Ddd MMM yyyy▷ sampai ◁7|T7|Ddd MMM yyyy▷, jumlah ◁11▷ hari, dengan pengganti ◁18▷"
```

**Event C ★ mapping:**
```
★1  (E13) = identity (auto)
★2  (F13) = pos 3  = Dokumen
★3  (G13) = pos 4  = Jenis Cuti
★5  (I13) = pos 6  = Tanggal Mulai
★6  (J13) = pos 7  = Tanggal Selesai
★9  (M13) = pos 10 = Keterangan
★10 (N13) = pos 11 = Jumlah Hari
★14 (R13) = pos 15 = Status
★15 (S13) = pos 16 = Pengganti VID
★16 (T13) = pos 17 = No. Permohonan
★17 (U13) = pos 18 = Nama Pengganti
```

**D formula tail:**
```
$T$13&"☆"&$G$13&"☆"&$R$13&"☆"&$I$13&"☆"&$J$13&"☆"&$N$13&"☆"&$M$13&"☆"&$S$13&"☆"&$U$13
```
= reqNum☆jenisCuti☆status☆startDate☆endDate☆days☆keterangan☆replVID☆replName

---

### 7.2 LogIncident (Contoh Kedua)

**Form positions:**
| Pos | Widget | Field |
|-----|--------|-------|
| 3 | TXF text | Catatan |
| 4 | GET_IMAGES | Dokumen |
| 5 | TXF qrScan | Lokasi |
| 6 | SELECTABLE_BTN | Tingkat Urgensi |
| 7 | SELECTABLE_BTN | Jenis Keluhan |
| 8 | TXF generic | Judul |
| 11 | (locationName) | Nama Lokasi |
| 17 | NUMBER | No. Permohonan |

**addToTable:**
```
="$test/report-incident//vtl.report-incident⭘retention◼4320⭘tablevid◼20342033315492⭘index◼1★S◼2★S◼5★N◼7★N◼9★N⭘description◼field-report⭘flag◼report-incident⭘<1>◼◁17▷⭘<2>◼MENUNGGU⭘<3>◼[]⭘<4>◼[]⭘<5>◼"&Settings!$B$1&"⭘<6>◼"&Settings!$B$2&"⭘<7>◼"&'op1'!$K$8&"⭘<8>◼"&'op1'!$L$8&"⭘<9>◼"&'op1'!$K$7&"⭘<10>◼"&'op1'!$L$7&"⭘<11>◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm▶⭘<12>◼◀2▶⭘<13>◼◁5▷⭘<14>◼◁11▷⭘<15>◼◁8▷⭘<16>◼◁7▷⭘<17>◼◁4▷⭘<18>◼◁3▷⭘<19>◼◁6▷⭘<20>◼⭘<30>◼Lokasi ◁11▷, ◁8▷, urgensi ◁6▷"
```

**Event C ★ mapping:**
```
★1  (E13) = identity (auto)
★2  (F13) = pos 3  = Catatan
★3  (G13) = pos 4  = Dokumen
★4  (H13) = pos 5  = Lokasi
★5  (I13) = pos 6  = Tingkat Urgensi
★6  (J13) = pos 7  = Jenis Keluhan
★7  (K13) = pos 8  = Judul
★10 (N13) = pos 11 = Nama Lokasi
★16 (T13) = pos 17 = No. Permohonan
```

**D formula tail:**
```
$T$13&"☆"&$K$13&"☆"&$J$13&"☆"&$I$13&"☆"&$H$13&"☆"&$N$13&"☆"&$G$13
```
= reqNum☆judul☆keluhan☆urgensi☆lokasi☆namaLokasi☆dokumen

**Catatan:** F13 (Catatan) tidak masuk tail karena sudah ada di scaffold.

---

## 8. Checklist: Membuat Page Baru

### A. Persiapan
- [ ] Tentukan module name dan table path Firebase
- [ ] Tentukan flag name
- [ ] Tentukan apakah butuh approval (jika ya, berapa level?)
- [ ] List semua field form dan assign position (3-16, 18+)
- [ ] Position 17 = auto-number (NUMBER widget, WAJIB)
- [ ] Position 251 = submit button (WAJIB)

### B. addToTable
- [ ] Copy template dari Section 2.5
- [ ] Ganti placeholder
- [ ] Default block `<1>` sampai `<12>` — **JANGAN UBAH** cell references
- [ ] `<3>◼[]` dan `<4>◼[]` (atau approval array) — **WAJIB ADA**
- [ ] Tail dari `<13>` dst — map `◁N▷` token ke position widget
- [ ] `<30>` — summary template untuk display
- [ ] `index` — minimal `1★S◼2★S◼5★N◼7★N◼9★N`

### C. Button Config
- [ ] `action: "savesend"` (BUKAN `"addToTable"`)
- [ ] `flag: "{flag_name}"`
- [ ] `gpsPosition: 2`
- [ ] `com: "auz"`
- [ ] `run` include `17:generate_number◆251:disable`
- [ ] `addToTable` = DSL string dari step B
- [ ] `chain` = DO_DIALOG konfirmasi

### D. Event & Reporting
- [ ] Pastikan flag terdaftar di sistem (tanya dev jika Event C tidak muncul)
- [ ] Map position → ★ section → op1Script column (pakai tabel Section 3.3)
- [ ] Buat D formula: scaffold + org + route + tail
- [ ] Tambah row di op1Script (A=label, B/C=route key, D=formula, F=slug)
- [ ] Test: submit form, cek Firebase + Event tab

### E. Verifikasi
- [ ] Firebase record punya data di `<1>` sampai `<12>` yang benar
- [ ] `<5>` = VID user, `<6>` = nama user (bukan hardcoded)
- [ ] Event tab punya row baru dengan flag yang benar
- [ ] D formula menghasilkan output tanpa `#VALUE!` atau `#REF!`

---

## 9. Bug Umum & Solusi

| Bug | Penyebab | Solusi |
|-----|----------|--------|
| `◁N▷` menghasilkan kosong | Position N tidak ada di form | Cek position assignment widget |
| Firebase masuk, Event tidak | `action` bukan `"savesend"`, atau flag belum terdaftar | Pastikan `action: "savesend"`, cek flag whitelist |
| `<5>` isi hardcoded bukan VID user | Pakai literal bukan cell reference | Ganti ke `"&Settings!$B$1&"` |
| D formula `#VALUE!` | Reference ke cell kosong yang dipakai dalam kalkulasi | Hindari reference ke row 11 cells, pakai row 13 langsung |
| addToTable index mismatch | Index field number tidak cocok setelah perubahan | Update `index◼...` sesuai posisi `<N>` yang baru |
| Position tumpang tindih | 2 widget pakai position sama | Audit semua position di page, pastikan unik |
| `<3>` atau `<4>` tidak ada | Lupa tambah placeholder | Tambah `<3>◼[]⭘<4>◼[]` — VID harus mulai di `<5>` |

---

## 10. Perbandingan: Dengan vs Tanpa Approval

| Aspek | Tanpa Approval (LogIncident) | Dengan Approval (RequestLeave) |
|-------|------------------------------|-------------------------------|
| `<2>` (status awal) | `MENUNGGU` | `PENDING` (atau `◁15▷` dari field) |
| `<3>` (history) | `[]` | `[]` |
| `<4>` (approval levels) | `[]` | `[[1, PENDING, , , , ], [2, PENDING, , , , ], ...]` |
| Approval buttons | Tidak ada | Ada di page Approver/Detail — `updateTableRow` |
| Event saat approval | Tidak ada | Perlu dibuat khusus (lihat `docs/approve-leave-event-spec.md`) |

---

## 11. DSL Token Reference

| Token | Arti | Contoh |
|-------|------|--------|
| `◁N▷` | Value dari widget di position N (user input) | `◁5▷` = value dari datePicker pos 5 |
| `◁N\|T7\|format▷` | Widget value + format waktu | `◁6\|T7\|Ddd MMM yyyy HH:mm▷` |
| `◀N▶` | System stream value | `◀2▶` = epoch timestamp |
| `◀N\|T7\|format▶` | System stream + format waktu | `◀2\|T7\|Ddd MMM yyyy HH:mm▶` |
| `⭘` | Separator antar field di addToTable | `⭘<13>◼◁5▷` |
| `◼` | Separator key-value | `<13>◼◁5▷` |
| `★` | Separator section di Event C | `★{data section}` |
| `☆` | Separator field dalam 1 section / tail D formula | `vid☆name☆email` |
| `◻` | Separator major block di D formula | `scaffold◻org◻route◻tail` |
| `⬤` | Pemisah geo block dan data di Event C | `...location-type⬤★{identity}★...` |
