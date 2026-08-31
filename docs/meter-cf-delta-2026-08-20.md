# Delta CF — Baca Meter, 20 Agustus 2026

**Buat:** dev Go (CF)
**Status:** delta — **bukan** pengganti
**Induk:** `docs/meter-data-cf-dev-spec.md` v3 · `docs/meter-cf-fix-handoff.md` (19 Agu)
**Ukuran:** 3 field, 1 aturan tulis. Tidak ada langkah CF baru, tidak ada collection baru.

---

## 0. Kenapa ada delta lagi

Foto meter asli dari lapangan (20 Agu) ternyata **4 kotak hitam + 1 kotak merah**. Dua config site yang sudah diketok adalah 5+0 dan 5+2 — jadi ini pola **ketiga**, dan munculnya di site yang config-nya 5+0.

Artinya asumsi "jumlah digit seragam per site" salah. Konsekuensinya ke CF cuma tiga field dan satu aturan tulis.

---

## 1. 🔴 `dg` dipecah jadi `dgh` + `dgm`

`docs/meter-cf-fix-handoff.md` §1 menyuruh menyalin `dg` (Number) dari event ke doc `meter`. **Ganti dengan dua field:**

| Field | Tipe | Isi |
|---|---|---|
| `dgh` | Number | jumlah kotak **hitam** (bagian m³) |
| `dgm` | Number | jumlah kotak **merah** (pecahan m³). `0` = titik satuan m³ |

**`dg` tunggal dihapus dari rancangan.** Kalau sudah terlanjur ditulis ke doc mana pun, biarkan saja — tidak ada yang membacanya lagi.

**Kenapa harus dua, bukan satu:** kalau disimpan "5 digit" saja, letak komanya hilang. `00115` bisa berarti `115` atau `11,5` — beda 10×, dan itu langsung jadi tagihan salah sepuluh kali lipat. Angka yang disimpan tetap **bilangan bulat mentah** (`pv`); pembagian `÷ 10^dgm` hanya saat ditampilkan.

## 2. 🔴 Aturan tulis berubah: isi-kalau-kosong

`meter-cf-fix-handoff.md` §1 menulis: *"Jangan pernah menimpanya di cabang `meter-reading-recorded`."* **Itu terlalu keras.** Ganti jadi:

```
kalau doc BELUM punya dgh  →  tulis dari event
kalau doc SUDAH punya dgh  →  abaikan nilai dari event, jangan timpa
```

Berlaku sama untuk `dgm`. **Berlaku di kedua cabang** (`meter-point-surveyed` dan `meter-reading-recorded`).

**Kenapa:** widget sekarang menampilkan pemilih jumlah kotak kalau doc-nya belum punya config, dan hasil pilihan petugas naik lewat event. Kalau CF menolak menulisnya di cabang bulanan, titik itu akan menanyakan hal yang sama tiap bulan selamanya — dan tiap pertanyaan adalah kesempatan salah pencet, di angka yang salahnya tidak terlihat siapa pun.

Aturan lama tetap berlaku untuk **niatnya**: config lahir sekali, tidak berubah tiap bulan. Yang berubah cuma "sekali"-nya boleh terjadi di pembacaan bulanan, bukan cuma di pendataan awal.

Aturan yang sama berlaku ke `msn` (nomor seri): isi kalau kosong, jangan timpa.

## 3. 🟠 `dgs` — asal-usul config digit

Field baru, String, dua nilai saja:

| Nilai | Artinya |
|---|---|
| `config` | jumlah kotak datang dari doc — petugas tidak menyentuh apa pun |
| `field` | jumlah kotak **dipilih petugas di lapangan** — belum diverifikasi siapa pun |

Disalin apa adanya dari event ke doc `meter`. **Boleh ditimpa tiap bulan** — beda dari `dgh`/`dgm`, karena yang dicatat adalah keadaan pembacaan terakhir.

**Buat apa:** kantor menyaring titik ber-`dgs:"field"`, dan **fotonya sudah ada di event yang sama** — verifikasinya cuma melihat, bukan mengirim orang balik. Ini penutup termurah untuk risiko nomor satu di fitur ini (salah config digit → tagihan salah 10×/100×/1000×, konsisten, dan tampak wajar karena semua unit salah dengan arah yang sama).

**Guard:** nilai selain `config`/`field` → jangan tulis, catat log. Jangan menebak.

## 4. 🟠 `mm` — mode QR

Field baru, String, dua nilai: `mode-a` (titik ber-QR, scan wajib) atau `mode-b` (tanpa QR, masuk lewat daftar). Disalin apa adanya dari event ke doc `meter`, boleh ditimpa tiap bulan.

**Buat apa:** menilai tingkat bukti dengan benar. Di `mode-a`, masuk lewat daftar berarti QR-nya dilewati — bukti lebih lemah, patut ditandai. Di `mode-b`, masuk lewat daftar **memang satu-satunya cara** dan tidak boleh ditandai.

Tanpa `mm`, dua kejadian itu tersimpan identik. Dan kalau semua bacaan `mode-b` ikut tertandai, petugas belajar mengabaikan tanda — lalu semua penjaga lain ikut mati. Ini alasan yang sama kenapa ambang lonjakan tidak boleh kelewat sensitif.

**Guard:** nilai selain `mode-a`/`mode-b` → jangan tulis, catat log.

---

## 5. Yang TIDAK berubah

Supaya tidak dicari-cari:

- Bentuk doc `meter`, doc-id `lk`, semua langkah §5 spec induk — **utuh**
- Aturan `due` / `closed` (§5.4) — **utuh**
- `pv` tetap **bilangan bulat mentah**, koersi String→Number tetap tugas CF — **utuh**
- `ln` denorm dari `location`, fallback ke event — **utuh**
- Semua temuan `meter-cf-fix-handoff.md` §2 (`due` tidak diset), §3 (`ln`), §4 (hapus doc sampah) — **masih berlaku**

## 6. Acceptance

- [ ] Event pendataan awal bawa `dgh:"4"`, `dgm:"1"` → doc `meter` punya `dgh:4`, `dgm:1` (**Number**).
- [ ] Titik yang `dgh`-nya **belum ada**, lalu masuk event `meter-reading-recorded` bawa `dgh` → **tertulis**.
- [ ] Titik yang `dgh`-nya **sudah ada**, lalu masuk event bawa `dgh` berbeda → **tidak berubah**.
- [ ] `msn` berperilaku sama: isi kalau kosong, tidak timpa kalau ada.
- [ ] `dgs` = `field` tersimpan, dan **berubah** jadi `config` di pembacaan bulan berikutnya.
- [ ] `dgs` bernilai aneh (`x`, kosong, angka) → tidak ditulis, ada log.
- [ ] `mm` = `mode-b` tersimpan; nilai di luar dua kata itu → tidak ditulis, ada log.
- [ ] Doc lama yang punya `dg` tunggal tidak bikin CF error.

---

**Referensi:** `docs/meter-data-cf-dev-spec.md` v3 (§3.0 tipe · §5 langkah CF · §5.4 aturan `closed`) · `docs/meter-cf-fix-handoff.md` §1 (aturan yang diganti dokumen ini) · `docs/digit-pad-widget-dev-spec.md` rev d §2.1 (kenapa dua angka) dan §2.2 (dari mana `dgh`/`dgm`/`dgs` datang).
