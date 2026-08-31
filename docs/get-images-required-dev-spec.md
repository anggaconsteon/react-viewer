# Dev Spec (Flutter) — `optional` untuk widget `GET_IMAGES`

**Tanggal:** 2026-08-21
**Buat:** dev Flutter (renderer)
**Status:** PROPOSED
**Ukuran:** 1 field di widget yang sudah ada. Bukan widget baru, bukan tipe baru.
**Preseden:** `SIGNATURE_PAD` sudah punya field ini persis (`optional:"TRUE"/"FALSE"`, LIVE). Spec ini cuma minta pola yang sama dipasang di `GET_IMAGES`.
**Konsumen pertama:** `MeterRead` (op1Screen 16072026 baris 1529) dan `MeterSurvey` (baris 1540) — vertikal meter Paskal.
**Referensi:** `docs/widget-docs/signaturePad.md` · `handoff-meter-pascal-v3.md` #5 · `docs/digit-pad-widget-dev-spec.md`

---

## 1. Kenapa

Keputusan produk yang sudah diketok (`handoff-meter-pascal-v3.md` #5):

> **Foto meter WAJIB, bukan opsional per config.** Di meter, foto benar-benar memverifikasi ulang angkanya oleh siapa pun, termasuk tenant yang protes.

Fotonya bukan buat OCR. Fotonya buat **sengketa tagihan**: tenant protes angkanya kegedean, buka fotonya, selesai. Tanpa foto, yang tersisa cuma "kata petugas" — dan yang dipertaruhkan tagihan bulanan 400 unit.

**Yang terjadi sekarang (diuji live 2026-08-20):** kolom foto di `MeterRead` bisa dilewat. Tekan "Simpan & lanjut" tanpa memotret, bacaan tetap tersimpan. Tidak ada peringatan, tidak ada tanda. Yang tersimpan adalah tagihan tanpa bukti — dan baru ketahuan waktu ada yang protes, berbulan-bulan kemudian.

`SELECTABLE_BTN` di halaman yang sama menampilkan badge **wajib**. `GET_IMAGES` tidak. Jadi mekanismenya ada di renderer, cuma belum menjangkau widget ini.

### Kenapa tidak bisa diakali dari config

Sudah disisir: `GET_IMAGES` resolved di `MeterRead` maupun `MeterSurvey` tidak punya field apa pun yang bisa disetel jadi wajib. Isinya `margin`/`size`/`position`/`label`/`style`/`labelPosition`/`alignment`/`text`/`previewSize`/`camera`/`folder`/`filename`/`imageParameter`/`currentValue`/`max`. Tidak ada yang bisa dipakai. Ini murni kerjaan renderer.

## 2. Kontrak field

Tambahkan **satu field opsional** ke `GET_IMAGES`, nama dan nilainya **persis** seperti di `SIGNATURE_PAD`:

```json
{"type":"GET_IMAGES", …, "max":"1", "optional":"[OPTIONAL]"}
```

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `optional` | Opsional | `"TRUE"` = boleh dikosongkan · `"FALSE"` = wajib ada minimal 1 foto sebelum submit | `"FALSE"` |

**String `"TRUE"`/`"FALSE"`, bukan Boolean** — mengikuti `SIGNATURE_PAD` yang sudah live. Jangan bikin varian baru.

### 2.0 ⚠️ Aturan default — ini yang bikin spec ini murah

**HANYA `"FALSE"` persis yang berarti wajib. Apa pun selain itu = opsional.**

Termasuk: field tidak ada · string kosong · `"TRUE"` · **dan literal `"[OPTIONAL]"` yang belum ter-substitute.**

Yang terakhir itu bukan kelonggaran, itu **inti keputusannya** (user, 2026-08-21). `getImages1` adalah template **bersama** yang dipakai banyak page live. Kalau renderer cuma menerima `"TRUE"`/`"FALSE"`, tiap pemakaian yang ada harus disisir satu-satu supaya placeholder-nya ter-substitute — puluhan sel, dua tab, semuanya cuma untuk menghasilkan "tidak berubah". Dengan aturan ini, penyisiran itu **tidak perlu sama sekali**: satu-satunya sel yang disentuh adalah dua baris meter yang memang mau diwajibkan.

Konsekuensi yang diterima sadar: sebagian page live akan mengirim `"optional":"[OPTIONAL]"` di payload-nya. Jelek dilihat, nol dampak — JSON tetap valid, perilakunya tetap persis seperti sekarang.

**Jangan** bikin nilai tak dikenal jadi error, warning, atau widget di-drop. Diam dan perlakukan sebagai opsional.

### 2.1 Pesan kalau kosong — dari config, bukan hardcode

Pesannya diambil dari `text` sebagai **segmen ◆ kedua**:

```
"text":"+◆Fotonya belum diambil"
        ↑           ↑
   segmen 1     segmen 2
   label tombol  pesan kalau wajib tapi kosong
```

**Guard backward-compat:** kalau `text` **tidak mengandung `◆`**, seluruh isinya = label tombol — persis perilaku sekarang. Semua page live saat ini `text:"+"` tanpa `◆`, jadi tidak ada yang tersentuh.

Nol string hardcode di Flutter.

## 3. Perilaku

Waktu petugas menekan tombol `action:"savesend"` di halaman yang punya `GET_IMAGES` dengan `optional:"FALSE"` dan **belum ada foto**:

1. Submit **dibatalkan** — tidak menulis event, tidak pindah halaman, tidak menjalankan `chain`.
2. Tampilkan pesan dari segmen ◆ ke-2 (mekanisme yang sama dengan field wajib lain di halaman).
3. Isian lain yang sudah diisi **tidak hilang**.

### 3.1 Berlaku ke SEMUA tombol savesend di halaman itu

`MeterRead` punya dua jalur simpan:

| Tombol | Wajib foto? |
|---|---|
| "Simpan & lanjut" (baris 1531) | Ya |
| "Simpan alasan" di bottom sheet "Tidak bisa dibaca" (baris 1532) | **Ya juga** |

**Keputusan: dua-duanya wajib.** Alasannya: kalau box meternya terkunci atau angkanya buram, **foto box terkunci itu bukti yang jauh lebih kuat daripada pilihan dropdown**. Biayanya satu ketukan yang sama. Jalur gagal justru yang paling sering dipertanyakan kantor.

> Kalau di lapangan ini ternyata bikin petugas mentok (mis. meternya benar-benar tidak ditemukan, tidak ada yang bisa difoto), kabari — pelonggarannya cukup di sisi sheet, tidak perlu ubah renderer.

## 4. Contoh resolved (konsumen pertama)

**`MeterRead` — `getImages1`, op1Screen 16072026 baris 1529 kolom D:**

```json
{"type":"GET_IMAGES","margin":"0,0,0,0","size":18,"position":3,"label":"Foto Muka Meter","style":"Normal","labelPosition":"end","alignment":"spaceEvenly","text":"+◆Foto muka meter belum diambil","previewSize":120,"camera":1,"folder":"id/2026/vtl/meter/agenia-demo-7","filename":"87544551624342-meter","imageParameter":"1200,1200,85","currentValue":"","max":"1","optional":"FALSE"}
```

**`MeterSurvey` — `getImages1`, baris 1540 kolom D:**

```json
{"type":"GET_IMAGES","margin":"0,0,0,0","size":18,"position":3,"label":"Foto Meter (muka & badan)","style":"Normal","labelPosition":"end","alignment":"spaceEvenly","text":"+◆Foto meter belum diambil","previewSize":120,"camera":1,"folder":"id/2026/vtl/meter/agenia-demo-7","filename":"87544551624342-meter-survey","imageParameter":"1200,1200,85","currentValue":"","max":"2","optional":"FALSE"}
```

Catatan: `max:"2"` di survey berarti boleh dua foto (muka + badan, supaya nomor serinya ikut terekam). `optional:"FALSE"` menuntut **minimal satu**, bukan harus penuh sampai `max`.

## 5. Sheet-side — dikerjakan BARENG renderer, bukan sebelumnya

`Widget!J` untuk `getImages1` **belum diubah, sengaja.** Aturan rumah: field baru yang ditambahkan sebelum renderer siap bikin app **membuang seluruh widget**, bukan mengabaikan field-nya — dan `getImages1` template **bersama**, dipakai banyak page yang sudah live.

Begitu renderer mendarat, **berkat §2.0 tinggal dua langkah**:

1. **Template `Widget!J134`** — sisipkan setelah `"max"`: `…,"max":"[MAX_IMAGES]","optional":"[OPTIONAL]"}`
2. **Dua baris meter saja** (`op1Screen 16072026` baris 1529 MeterRead dan 1540 MeterSurvey): tambah `SUBSTITUTE` + helper `="FALSE"`, dan tambahkan `◆` segmen ke-2 di helper `[BUTTON]`-nya (`+` → `+◆Foto muka meter belum diambil`).

**Pemakaian `getImages1` yang lain sengaja TIDAK disentuh** — mereka akan resolve ke `"optional":"[OPTIONAL]"` dan §2.0 memperlakukannya sebagai opsional. Ini keputusan, bukan kelalaian.

**Verifikasi:** dua baris meter resolve ke `"optional":"FALSE"`, dan satu page non-meter mana pun masih menampilkan kotak fotonya (bukti widget tidak di-drop gara-gara nilai tak dikenal).

## 6. Deliverable dev Flutter

1. Parse field `optional` di `GET_IMAGES`. **Hanya `"FALSE"` persis = wajib; nilai lain apa pun (tidak ada, kosong, `"TRUE"`, atau literal `"[OPTIONAL]"`) = opsional, tanpa error/warning/drop.** Lihat §2.0 — ini yang menghapus penyisiran sheet.
2. `optional:"FALSE"` + belum ada foto → batalkan `savesend`, tampilkan pesan, isian lain tidak hilang.
3. Pesan diambil dari `text` segmen ◆ ke-2. Tidak ada `◆` → seluruh `text` = label, perilaku sekarang.
4. Berlaku ke semua tombol `savesend` di halaman itu, termasuk yang di dalam `DO_BOTTOM_SHEET`.

## 7. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Parse `optional` + blokir submit | dev Flutter | PROPOSED |
| Pesan dari `text` ◆ segmen 2 | dev Flutter | PROPOSED |
| Template `Widget!J` + sisir pemakaian | builder | nunggu renderer |
| Isi `FALSE` di baris 1529 & 1540 | builder | nunggu renderer |

## 8. Not Doing (dan kenapa)

- **Tidak bikin field `required` baru.** `optional` sudah jadi nama rumah di `SIGNATURE_PAD`. Dua nama untuk satu konsep = orang berikutnya salah pakai.
- **Tidak memaksa jumlah foto sampai `max`.** Wajib = minimal satu. `max:"2"` di survey itu izin, bukan kuota.
- **Tidak mengubah urutan halaman jadi kamera-dulu seperti mockup.** Mockup memang menaruh foto sebagai layar pertama, tapi memaksa isian sudah menutup lubangnya. Ubah urutan = ubah struktur page, biaya jauh lebih besar untuk hasil yang sama.
- **Tidak menyentuh OCR.** Beda pekerjaan, lihat §10.

## 9. Acceptance

- [ ] `optional` tidak ada → semua page `GET_IMAGES` yang live berperilaku persis seperti sebelumnya.
- [ ] `optional:"TRUE"` → sama, boleh dilewat.
- [ ] **`optional:"[OPTIONAL]"` (placeholder mentah) → boleh dilewat, kotak fotonya TETAP muncul, tidak ada error dan widget tidak di-drop.** Ini kriteria terpenting di daftar ini — kalau gagal, puluhan page live kehilangan kotak fotonya sekaligus.
- [ ] `optional:"FALSE"` + belum foto + tekan "Simpan & lanjut" → **tidak ada event tertulis ke Firestore**, tidak pindah halaman, pesan muncul.
- [ ] Pesannya persis segmen ◆ ke-2 dari `text` — ubah teks di sheet, teks di app ikut berubah. Nol string hardcode.
- [ ] `text:"+"` tanpa `◆` → label tetap `+`, tidak muncul `◆` di layar.
- [ ] `optional:"FALSE"` + sudah foto 1 dari `max:"2"` → boleh submit.
- [ ] Blokir juga berlaku di "Simpan alasan" dalam bottom sheet "Tidak bisa dibaca".
- [ ] Ditolak submit → angka yang sudah diketik di `DIGIT_PAD` tidak hilang.

## 10. Titipan terpisah (bukan bagian spec ini, tapi orang yang sama)

**`digit-pad-widget-dev-spec.md` §7.8 — perbandingan OCR.** Belum dikerjakan. Tidak ada widget baru dan tidak ada config baru: `photoPosition:"3"` dan `ocrPattern:"\\d{4,9}"` sudah terpasang di kedua halaman, dan kalimat peringatannya sudah ada di `text` segmen 7 (`"Hasil baca foto {ocr}, kamu ketik {value} — cek lagi?"`). Yang belum cuma bagian bacanya.

**Urutannya: spec ini dulu, baru §7.8.** OCR membaca foto — selama fotonya masih bisa dilewat, OCR-nya sering tidak dapat apa-apa untuk dibaca.

## 11. Asumsi & risiko

- [ ] **Diasumsikan renderer punya jalur "batalkan submit + tampilkan pesan" yang sudah dipakai field wajib lain.** Kalau `SIGNATURE_PAD.optional` ternyata diimplementasikan dengan cara lain (mis. tombol disable, bukan blokir saat tekan), samakan dengan yang itu — konsistensi lebih penting daripada usulan di §3.
- [ ] **Belum diverifikasi apa yang menyalakan badge "wajib" di `SELECTABLE_BTN`.** Di JSON-nya tidak ada field apa pun yang menandai itu, jadi kemungkinan bawaan per tipe. Kalau ternyata ada mekanisme umum yang sudah jalan, pakai itu dan abaikan §2.1.
- [ ] **Keputusan "jalur gagal juga wajib foto" (§3.1) belum diuji di lapangan.** Diambil karena bukti visual mengalahkan dropdown. Bisa dilonggarkan dari sheet tanpa sentuh renderer.

## 12. Temuan sampingan — bukan bagian spec ini

`lqrTextField2` di `MeterSurvey` (baris 1539 kolom D) masih menyimpan **placeholder yang belum ter-resolve**:

```
"fakeGpsAllowed": "[FAKEGPSALLOWED]", "outPositionAllowed": "[OUTPOSITIONALLOWED]"
```

Yang sampai ke app adalah literal `"[FAKEGPSALLOWED]"`, bukan `TRUE`/`FALSE`. Widget-nya tetap render, jadi belum kelihatan rusak — tapi dua setelan itu efektifnya tidak terdefinisi. Ini kerjaan builder di sisi sheet, bukan dev Flutter.

---

**Referensi:** `docs/widget-docs/signaturePad.md` (preseden `optional`) · `handoff-meter-pascal-v3.md` #5 · `docs/digit-pad-widget-dev-spec.md` §7.8 · `docs/scanner-routeparams-dev-spec.md` §5b (pola sheet-side yang sama).
