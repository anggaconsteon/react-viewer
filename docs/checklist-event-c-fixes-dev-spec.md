# Checklist Event C — 4 perbaikan (Dev Spec)

**Tanggal:** 2026-08-18
**Buat:** dev Flutter (renderer)
**Status:** SEBAGIAN SELESAI — lihat §9

**Update 2026-08-18 17:08** (submit uji `checklist-publicarea`, Surya Widjaja):
- BUG-1 (foto) **SELESAI** — URL Firebase sudah utuh, penanda error hilang. Nama lokasi (pos 11) juga sudah terisi.
- BUG-2 (separator) **DIBATALKAN** — `|` diterima, lihat §4.
- BUG-3 (`★1`) masih terbuka.
- BUG-4 (`null`) belum bisa diuji — keenam item terisi semua.
**Konteks / Konsumen pertama:** 5 page checklist di op1Screen proxy `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` — `ChecklistPublicArea` (row 1371), `ChecklistRestroom` (1397), `ChecklistWorkArea` (1423), `ChecklistPantry` (1447), `ChecklistOutdoor` (1471)
**Referensi:** `docs/standard-page-event-pattern.md`, `docs/FINAL-event-property-dev-spec.md` (BUG-5), tab `EventSplit` + `LedgerSplit` di spreadsheet `1iZN19pj2QVnKsX3VRwMJH7mkToReexN5hXEKMk1QlqI`

---

## 1. Kenapa

Event C checklist dipakai untuk membangun laporan spreadsheet (FR → Filter → Split → tab laporan). Target akhir: kolom `Checklist 1` … `Checklist 10` yang isinya `Sapu dan pel lantai : Selesai`, dengan label dan status **tersimpan terpisah** supaya status bisa dihitung sendiri (berapa Dilewati, berapa Tidak Tersedia).

Submit uji coba 2026-08-18 15:52 (`checklist-publicarea`, user Surya Widjaja) menunjukkan 4 masalah. Satu di antaranya regresi baru.

**Keputusan user, terkunci 2026-08-18:**
- Item checklist distandarkan **10 slot**, posisi widget **12–21**, kontigu, item 1 selalu di posisi 12.
- Label + status disimpan terpisah, digabung di sisi laporan.

**Sudah dikerjakan di sheet (bukan tugas dev, konteks saja):**
- Restroom: posisi item dirapikan jadi 12–17 (sebelumnya lompat 14, pakai 18).
- Kelima page: `addToTable` direstrukturisasi — `<8>` keterangan, `<9>` foto, `<10>`–`<19>` item 1–10.
- `<3>`/`<4>` dan `cv`/`cn` tidak lagi hardcode, sekarang ambil `Settings!$B$1` / `$B$2`.

---

## 2. Konsep — hierarki pemisah

Dari `LedgerSplit` baris 5714 (contoh yang sudah jalan di produksi):

```
approval-scheme-1◈ccvid1☆ccuser1◇ccvid2☆ccuser2◈approvervid1☆approvername1◇approvervid2☆approvername2
```

| Simbol | Tingkat | Fungsi |
|--------|---------|--------|
| `◼` | 1 | field utama ledger |
| `◻` | 2 | blok di dalam field 10 |
| `◈` | 3 | pisah antar kelompok |
| `◇` | 4 | pisah antar item dalam satu daftar |
| `☆` | 5 | **pisah nilai di dalam satu item** |

Di Event C, `★` memisahkan section (satu section = satu position widget), dan `☆` dipakai di dalam section — persis seperti `ccvid1☆ccuser1`.

**Jadi separator label–status yang benar adalah `☆`.**

---

## 3. BUG-1 — Foto gagal upload — ✅ SELESAI 2026-08-18 17:08

Terverifikasi beres. `★2` sudah berisi URL Firebase utuh:

```
https://firebasestorage.googleapis.com/v0/b/otq-01-ase2/o/id%2F2022%2Fvtl%2Ffield-report%2Fsurya-widjaja%2F60181816889090-2026-08-18-17-08-49_da0a8.jpg?alt=media&token=35176742-bc68-4779-b301-a43eb0398774
```

`%2F` terakhir sudah benar, `FTZIMG` dan `aume__`/`__emua` hilang. Riwayat masalahnya disimpan di bawah sebagai rujukan.

### (riwayat) Gejala

### Gejala

`★2` (position 3, `GET_IMAGES`) berisi alamat file lokal + penanda error, bukan URL Firebase:

```
aume__InvalidImagePath-13:/data/user/0/com.otonomiq.master1/files/otq_images/FTZIMG%2Fid%2F2022%2Fvtl%2Ffield-report%2Fsurya-widjaja___60181816889090-2026-08-18-15-52-16_241f9.jpg__emua
```

### Bukti regresi

Submit 14:03 hari yang sama, page yang sama, user yang sama — hasilnya benar:

```
https://firebasestorage.googleapis.com/v0/b/otq-01-ase2/o/id%2F2022%2Fvtl%2Ffield-report%2Fsurya-widjaja%2F60181816889090-2026-08-18-14-03-07_11c04.jpg?alt=media&token=ec7fd6ee-a43d-4001-9f55-de2cd01ec154
```

Antara dua submit itu hanya ada satu perubahan: build baru dengan perubahan separator.

### Tiga petunjuk

**a. Pemisah folder terakhir berubah jadi underscore.**

```
benar : …field-report%2Fsurya-widjaja%2F60181816889090-2026-08-18-14-03-07_11c04.jpg
rusak : …field-report%2Fsurya-widjaja___60181816889090-2026-08-18-15-52-16_241f9.jpg
                                     ^^^ harusnya %2F
```

`%2F` yang lain (`id%2F2022%2Fvtl%2F`) masih utuh — hanya yang terakhir yang kena.

**b. Ada prefiks `FTZIMG` yang tidak ada di URL benar.**

**c. Nilainya dibungkus `aume__` … `__emua`.** Dua string itu saling cermin (`aume` dibalik = `emua`). Tidak ada di config page mana pun — jadi asalnya dari app. Mohon dijelaskan fungsinya; kalau itu penanda internal, jangan sampai ikut tersimpan ke Event C.

### Harusnya

`★2` berisi URL Firebase utuh, sama seperti submit 14:03. Kalau upload gagal, jangan tulis alamat lokal ke Event C — kosongkan section-nya dan munculkan error ke user.

---

## 4. BUG-2 — Separator `|` → ❌ DIBATALKAN 2026-08-18

App mengirim `Sapu dan pel lantai|Selesai`. **Ini diterima apa adanya — dev tidak perlu mengubahnya.**

Keberatan awal spec ini keliru. `|` memang dipakai di grammar DSL (`◀2|T7|Ddd MMM yyyy HH:mm▶`), tapi itu di **config** — Event C adalah hasil setelah token diterjemahkan, jadi kedua lapis tidak pernah bertemu.

Ditelusuri sepanjang rantai: Event C dipecah `★`, tail ledger dipecah `◇`, isi item dipecah `|`. Tidak ada tahap yang bentrok.

**Konsekuensi ke sisi sheet:** `SplitChecklist` memecah sel item pakai `|`, bukan `☆`. Catatan: `|` itu metakarakter regex — `SPLIT()` aman (memperlakukan delimiter sebagai kumpulan karakter), tapi `REGEXEXTRACT` perlu di-escape jadi `\|`.

**Risiko tersisa:** label item tidak boleh mengandung `|`. Sekarang tidak ada, tapi perlu dijaga saat menambah item baru di config.

---

## 5. BUG-3 — `★1` identity block kosong

### Gejala

Semua event checklist (dan semua `request-*`) mulai dengan `⬤★★…` — `★1` kosong. 6 flag berbeda, 2 tenant berbeda, semuanya sama.

Ini bug yang sama dengan **BUG-5** di `docs/FINAL-event-property-dev-spec.md` (`buildIdentityBlock` tidak terpanggil).

### Harusnya

Bentuk yang benar ada di `EventSplit` baris 5697:

```
★Rika Putri Amelia Listiana☆rika39538@gmail.com☆6281776629336☆☆Kantor Pusat
```

Formatnya: `nama☆email☆telepon☆(kosong)☆site`

### Dampak

`$E$13` di op1Script selalu kosong → laporan tidak tahu siapa yang mengerjakan. Satu perbaikan menutup semua flag, bukan cuma checklist.

---

## 6. BUG-4 — Item tak disentuh keluar `null`

### Gejala

Dari submit `checklist-restroom` sebelumnya, item yang tidak pernah disentuh user:

```
★★★Ada★★1786665600000★…★null★…★null
```

Sebagian keluar string `"null"`, sebagian keluar kosong — tidak konsisten.

### Harusnya

Selalu **empty string**. Sectionnya tetap ada (jangan dihapus — slot posisi harus tetap dipesan), isinya saja yang kosong.

```
★Sapu dan pel lantai☆Selesai★★Lap touch point (handrail, gagang, tombol)☆Dilewati★
                            ^^ item 2 tidak disentuh: section ada, isi kosong
```

### Kenapa penting

Kalau tidak, sel laporan akan tertulis "null" dan dibaca user.

---

## 7. Contoh Event C target (resolved)

Page `ChecklistPublicArea`, user Surya Widjaja (VID `60181816889090`), 6 item, item ke-2 dan ke-5 tidak disentuh:

```
0checklist-publicarea◆1787043230650◆◆◆-6.3162659◆106.6448161◆◆ID◆15345◆Banten◆Tangerang Regency◆Cisauk◆Sampora◆◆◆true-location⬤★Surya Widjaja☆surya@vtl.co.id☆628xxxxxxxxx☆☆Kantor Pusat★https://firebasestorage.googleapis.com/v0/b/otq-01-ase2/o/id%2F2022%2Fvtl%2Ffield-report%2Fsurya-widjaja%2F60181816889090-2026-08-18-15-52-16_241f9.jpg?alt=media&token=xxxx★★★★★★★hahhaha★★Sapu dan pel lantai☆Selesai★★Lap touch point (handrail, gagang, tombol)☆Selesai★Lap kaca, cermin, dan permukaan☆Selesai★★Semprot pewangi☆Selesai
```

Pemetaan section:

| ★ | Position | Isi |
|---|----------|-----|
| ★1 | — | identity: `nama☆email☆telepon☆☆site` |
| ★2 | 3 | URL foto (Firebase) |
| ★3–★8 | 4–9 | kosong (tidak ada widget) |
| ★9 | 10 | Keterangan |
| ★10 | 11 | Nama lokasi (dari QR, kosong kalau tidak scan) |
| ★11–★16 | 12–17 | item 1–6, format `label☆status` |
| (★17–★20) | 18–21 | slot cadangan item 7–10, belum ada widget |

---

## 8. Deliverable dev (Flutter) — sisa

1. Panggil `buildIdentityBlock` sehingga `★1` terisi `nama☆email☆telepon☆☆site`.
2. Item tak disentuh → empty string, bukan `"null"`. Section tetap ada.
3. Kalau upload foto gagal: section dikosongkan + error tampil ke user. Jangan tulis path lokal ke Event C. (Jalur sukses sudah benar; jalur gagal belum diuji.)

Sudah selesai: upload foto jalur sukses. Dibatalkan: penggantian separator.

---

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|--------|-------|--------|
| Upload foto (BUG-1) | dev Flutter | DONE 2026-08-18 17:08 |
| Separator `|` → `☆` (BUG-2) | — | DIBATALKAN — `|` diterima |
| `★1` identity (BUG-3) | dev Flutter | PENDING |
| `null` → kosong (BUG-4) | dev Flutter | PENDING — belum bisa diuji |
| Perilaku saat upload gagal | dev Flutter | PENDING |
| Renumber posisi Restroom | builder op1Screen | DONE 2026-08-18 |
| addToTable 10 slot, item di akhir | builder op1Screen | DONE 2026-08-18 |
| Baris op1Script + D formula (5 route) | builder op1Screen | PENDING |
| `Filter!C3` + `SplitChecklist` + tab laporan | builder | PENDING |

---

## 10. Not Doing (dan kenapa)

- **Tidak menambah widget TASKLIST ke posisi 18–21 sekarang.** Slotnya sudah dipesan di `addToTable`; widget menyusul saat ada checklist yang butuh lebih dari 6 item.
- **Tidak mengubah cara padding 10 kolom.** D formula di op1Script menyebut sel `$O$13`–`$X$13` secara absolut, jadi kolom laporan tetap 10 walau app cuma mengirim 6 item. App tidak perlu mengirim section kosong tambahan di ekor.
- **Tidak memperbaiki `<5>`/`<6>` dan `av`/`an`/`sv`/`sn` yang masih hardcode.** Semua bernilai `Product Group` / `83674161979544` di proxy ini, jadi belum bisa dipastikan mana area mana site. Nunggu konfirmasi user.
- **Bug timezone +7 jam di picker Lembur & Keluar Kantor** — nyata, tapi di luar checklist. Spec terpisah.

---

## 11. Acceptance

- [x] Submit checklist dengan foto → `★2` berisi URL `https://firebasestorage.googleapis.com/...`, bisa dibuka di browser
- [x] Tidak ada string `InvalidImagePath`, `FTZIMG`, `aume__`, `__emua` di Event C
- [ ] Upload gagal → `★2` kosong dan user melihat pesan error
- [ ] `★1` berisi `nama☆email☆telepon☆☆site` sesuai user yang login
- [ ] Submit dengan 2 item sengaja dilewatkan → dua section kosong, tidak ada tulisan `null`
- [ ] Jumlah section `★` tetap sama antara submit yang lengkap dan yang tidak lengkap
- [ ] Item ke-N selalu mendarat di `★(N+10)` — tidak dipadatkan
- [ ] Nol string hardcode di Flutter; semua label item tetap dari `text` ◆-segmen di config

---

## 12. Asumsi & risiko

- [ ] Diasumsikan `aume__`/`__emua` dan `FTZIMG` berasal dari app, bukan dari config — dasarnya JSON page di `op1Screen!B1371` bersih dari string tersebut. Belum dikonfirmasi dev.
- [ ] Diasumsikan regresi foto terbawa build separator, dasarnya hanya urutan waktu (14:03 benar, 15:52 rusak). Belum ada bukti dari kode.
- [ ] Diasumsikan label item tidak akan pernah mengandung `☆`. Kalau suatu saat ada, label dan status jadi tidak terbedakan.
- [ ] `null` leak baru terlihat di satu submit (`checklist-restroom`). Belum diuji ulang setelah build baru.
- [ ] Format identity block diambil dari `EventSplit` baris 5697 (`reset-device`, 2023). Belum diverifikasi bahwa checklist memakai format yang sama persis.

---

**Referensi:**
- `docs/standard-page-event-pattern.md` — pola position → ★ → kolom op1Script
- `docs/FINAL-event-property-dev-spec.md` — BUG-5 identity block
- Spreadsheet `1iZN19pj2QVnKsX3VRwMJH7mkToReexN5hXEKMk1QlqI`, tab `EventSplit` & `LedgerSplit` — dokumentasi grammar separator
- Spreadsheet laporan `1BXA0naHnb0Nwj_RylntELcGaryN1ZeXjUQE5sFSjT-A` — konsumen akhir (FR → Filter → Split → tab laporan)
