# Dev Spec (Flutter) — `routeParams` untuk widget `scanner`

**Tanggal:** 2026-08-19
**Buat:** dev Flutter (renderer)
**Status:** ✅ **SELESAI 2026-08-20** — dev Flutter sudah menambahkan `routeParams` ke `scanner`. Dokumen ini jadi arsip; §5b (langkah sisi sheet) belum dikerjakan dan pindah ke antrean builder.
**Ukuran:** 1 field baru di widget yang sudah ada. Bukan widget baru, bukan tipe baru.
**Konsumen pertama:** page `MeterScan` → `MeterRead` (vertikal Paskal). Berlaku umum untuk semua scan-lalu-pindah-halaman.
**Referensi:** `docs/scanner-widget-dev-spec.md` (spec induk) · `docs/meter-data-cf-fix-handoff.md` §6 · `docs/digit-pad-widget-dev-spec.md`

---

## 1. Kenapa

`scanner` sudah bisa: scan QR → validasi ke `table`/`search` → ketemu → `addToTable` → `route` pindah halaman.

Yang belum: **halaman tujuan tidak tahu apa yang barusan di-scan.**

Kejadian nyata (Firestore live, 2026-08-19): halaman tujuan memakai token `{li}` dan yang tertulis ke database adalah **literal string `"{li}"`** — bukan nilainya. Token itu tidak pernah ada di halaman tujuan, jadi tidak pernah di-resolve.

```
event   lq: "{li}"                        ← seharusnya 0lefc05bc4c884bd...
meter   lk: "{li}-83674161979544"         ← doc-id ikut rusak
```

### Kenapa tidak bisa diakali dari config

Sudah dicoba: scan dipindah ke dalam halaman pakai `lqrTextField1`, jadi hasilnya masuk `◁N▷` biasa. **Itu berhasil untuk halaman yang cuma menulis** (`addToEvent` memang bisa membaca `◁N▷`).

Tapi **`search` tidak bisa membaca `◁N▷`** — `search` di-resolve saat halaman **load**, sedangkan `◁N▷` baru terisi setelah petugas melakukan sesuatu. Jadi widget mana pun yang harus **membaca dokumen berdasarkan hasil scan** — `DETAIL_CARD`, `DIGIT_PAD`, `LIST_CARD` — tidak bisa dilayani dengan cara itu.

Di `MeterRead`, dua widget membaca doc `meter` lewat `search`. Tanpa identitas saat load, halaman itu kosong.

**Akibat sekarang:** `MeterRead` hanya bisa dimasuki lewat tap kartu di daftar (jalur itu punya `routeParams` dan bekerja). Jalur scan — yang justru alasan QR dipakai — mati.

## 2. Kontrak

Tambahkan **satu field opsional** ke `scanner`:

```json
{"type":"scanner", …, "route":"[ROUTE]", "routeParams":"[ROUTEPARAMS]", …}
```

| Field | Isi | Contoh |
|---|---|---|
| `routeParams` | `key◼{token}⭘key◼{token}…` — dibawa ke halaman tujuan, persis DSL yang sudah dipakai `LIST_CARD` dan `routeBtn` | `lk◼{lk}⭘li◼{li}⭘ln◼{ln}` |

**Kosong = perilaku sekarang, tidak berubah.** Semua page `scanner` yang sudah live (mis. `DriverScanLogin`) tidak boleh terpengaruh.

### 2.1 Dari mana `{token}` diambil

**Dari dokumen yang barusan divalidasi**, bukan dari teks QR mentah.

`scanner` sudah melakukan lookup: cari di `table` yang field `search`-nya sama dengan hasil scan. Dokumen hasil lookup itu yang jadi sumber token — **semantik yang persis sama dengan `LIST_CARD.routeParams`**, yang mengambil token dari dokumen kartu yang di-tap.

Contoh nyata:

```
scan          →  0lefc05bc4c884bd590a3a13c8d99663b1dfd371d8
table         →  84214220504259//location
search        →  li
doc ketemu    →  { li:"0lefc05…", lk:"0lefc05…-32639062303108",
                   ln:"BSD Tech Center #18", sv:"32639062303108", … }
routeParams   →  lk◼{lk}⭘li◼{li}⭘ln◼{ln}
halaman tujuan menerima {lk}, {li}, {ln}
```

Ini juga **menyelesaikan masalah `li` tidak unik**: `li` sama di beberapa site (hasil fan-out), tapi begitu satu dokumen terpilih, `{lk}` yang dibawa sudah menunjuk tepat satu baris.

### 2.2 Kalau lookup mengembalikan lebih dari satu dokumen

**Ini belum terdefinisi di spec induk dan perlu diputuskan sekarang**, karena `li` memang bisa cocok >1 dokumen.

Usulan: **anggap gagal** — tampilkan slot error "QR salah" yang sudah ada, jangan `route`. Diam-diam memilih dokumen pertama berarti memilih site sembarang, dan di fitur meter itu berujung tagihan nyasar ke tenant yang salah.

Kalau nanti perlu, penyempitan dilakukan lewat `search` multi-field (`li★sv`) — tapi resolusi nilai untuk field kedua juga masih terbuka di spec induk.

## 3. Contoh resolved (konsumen pertama)

```json
{"type":"scanner","url":"https://firebasestorage.googleapis.com/v0/b/otq-01-ase2/o/c%2Fautsorz%2Ficon2%2Ficon-190120-qr-scan-90x90.png?alt=media&token=da753564-7c75-4073-a750-bf2e9c1826c1","text":"Scan QR Meter◆Arahkan QR di stiker dekat meter ke kamera.◆Titik ditemukan◆Lanjut ke pembacaan◆◆◆◆✔️ Titik terbaca. Lanjut isi angka meter.◆OK◆QR salah◆Stiker ini belum terdaftar sebagai titik meter. Coba scan lagi.◆Scan Lagi◆◆◆◆◆◆◆◆◆◆◆◆◆","height":300,"width":300,"folder":"id/2026/vtl/meter/agenia-demo-7","filename":"scan","flag":"meter-scan","route":"vertikaTeknoLokaciptaMeterRead","routeParams":"lk◼{lk}⭘li◼{li}⭘ln◼{ln}","opMode":"qr-single","displayMode":"full-screen","addToTable":"","qr":"lqr","table":"84214220504259//location","search":"li","com":"con"}
```

Halaman `MeterRead` kemudian bisa:
- `DETAIL_CARD` / `DIGIT_PAD` → `search:"lk◼{lk}"`
- tombol simpan → `addToEvent … lq◼{li}⭘ln◼{ln}`

## 4. Deliverable

1. Parse field `routeParams` di `scanner` (opsional; kosong = tidak ada yang berubah).
2. Setelah validasi **berhasil**, resolve `{token}` dari dokumen hasil lookup, lalu teruskan ke halaman tujuan — mekanisme yang sama dengan `LIST_CARD.routeParams`.
3. Lookup >1 dokumen → perlakukan sebagai gagal (§2.2), jangan `route`.
4. Urutan tidak berubah: validasi → `addToTable` (kalau ada) → `route` + params.

## 5. Acceptance

- [ ] `routeParams` kosong → page `DriverScanLogin` yang sudah live berperilaku persis seperti sebelumnya.
- [ ] Scan QR titik yang terdaftar → `MeterRead` terbuka, `DETAIL_CARD` terisi, `DIGIT_PAD` merender kotak digit.
- [ ] Yang tertulis ke Firestore adalah nilai asli (`0lefc05bc…`), **bukan literal `"{li}"`**.
- [ ] Scan QR yang tidak terdaftar → "QR salah", tidak pindah halaman, tidak ada tulisan apa pun.
- [ ] Satu `li` yang cocok di 2 site → gagal dengan pesan, bukan diam-diam pilih salah satu.

## 5b. Sisi sheet — dikerjakan BARENG renderer, bukan sebelumnya

`Widget!J199` (`scanner`) **belum diubah, sengaja.** Aturan rumah: field ber-token yang ditambahkan sebelum renderer siap bikin app **membuang seluruh widget**, bukan mengabaikan field-nya — dan `scanner` template **bersama**, dipakai `DriverScanLogin` yang sudah live. Sampai renderer mendarat, menambahkannya cuma menambah risiko tanpa manfaat.

Begitu renderer siap, tiga langkah ini dikerjakan dalam satu PR:

**1. Template `Widget!J199` — sisipkan tepat setelah `"route"`:**
```
…,"route":"[ROUTE]","routeParams":"[ROUTEPARAMS]","opMode":"[OPMODE]",…
```

**2. Sisir SEMUA pemakaian dulu.** Cari `scanner` di kolom B **dua tab**: `op1Screen` dan `op1Screen 16072026` — Widget tab dipakai berdua. Row number di catatan lama sudah tidak bisa dipercaya (sync memindahkan baris), jadi cari **by name**, jangan by row.

**3. Tiap pemakaian:** tambahkan satu `SUBSTITUTE` di kolom D dan satu sel helper. Yang belum dipakai diisi `=""` — string kosong aman, nol token.

```
…SUBSTITUTE( … , "[ROUTEPARAMS]", V{r}) …
```
(kolom helper menyesuaikan yang masih kosong di baris itu)

**4. Baru isi nilainya** di `MeterScan` (`op1Screen 16072026` baris 1520) dan `MeterScanSurvey` (1549):
```
lk◼{lk}⭘li◼{li}⭘ln◼{ln}
```

**Verifikasi:** baca balik kolom D tiap pemakaian — tidak boleh ada `[ROUTEPARAMS]` literal yang tersisa, dan `DriverScanLogin` harus resolve ke `"routeParams":""`.

> Catatan: `MeterScanSurvey` saat ini **yatim** — `MeterSurvey` sudah memakai scan inline (`lqrTextField1`), jadi tidak ada yang me-route ke sana. Boleh diaktifkan lagi setelah fitur ini jalan, atau dibersihkan.

## 6. Titipan terpisah (bukan bagian spec ini, tapi satu orang yang sama)

QR versi `0` isinya plaintext `0l<sha1hex>`, dan `docs/aec2_lqr_crypto_spec.md` §1 menulis *"payload = everything after the `0`"*. Sementara `location.li` di Firestore menyimpannya **dengan** `0` di depan.

Perlu dipastikan: hasil decode yang dipakai untuk mencocokkan ke `search` itu **dengan atau tanpa `0`**. Kalau tanpa, `search:"li"` tidak akan pernah cocok walau datanya ada — dan gejalanya identik dengan "QR tidak terdaftar", jadi mustahil dibedakan dari luar.

---

**Referensi:** `docs/scanner-widget-dev-spec.md` · `docs/aec2_lqr_crypto_spec.md` §1 · `docs/meter-cf-fix-handoff.md` §6 · pola `routeParams` di `LIST_CARD` (`Widget!291`) dan `routeBtn` (`Widget!303`).
