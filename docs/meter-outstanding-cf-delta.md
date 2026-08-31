# Delta CF — penanda titik yang masih ditunggu (`ov`)

**Tanggal:** 2026-08-20
**Buat:** dev Go (CF)
**Status:** delta — **bukan** pengganti
**Induk:** `docs/meter-data-cf-dev-spec.md` v3 · `docs/meter-cf-delta-2026-08-20.md`
**Ukuran:** 1 field, 2 aturan tulis. Tidak ada collection baru, tidak ada langkah CF baru.
**⚠️ Menyentuh keputusan yang sudah di-defer** — lihat §4.

---

## 1. Lubangnya

`search` di widget list hanya bisa **sama-dengan**, tidak ada lebih-kecil-dari. `MeterRound` mencari:

```
sv◼83674161979544⭘due◼<periode berjalan>
```

`due` = periode paling awal yang masih ditunggu. Selama semuanya tertib, ini benar.

**Yang terjadi kalau satu titik kelewat:** titik itu tetap `due:"202608"`. Masuk September, daftar mencari `due◼202609` → **titik yang kelewat hilang dari daftar, permanen.** Tidak ada error, tidak ada tanda, tidak ada yang tahu. Dia cuma lenyap.

Dan itu persis kebalikan dari keputusan produk yang sudah diketok (`handoff-meter-pascal-v3.md` #4):

> **Daftar meter-yang-diharapkan WAJIB.** Kalau satu unit kelewat, **tagihannya tidak bisa terbit**. Ketidaklengkapan di sini = kegagalan, bukan sekadar sinyal.

Rancangan sekarang cuma benar kalau **tidak pernah ada yang kelewat**. Di 400 unit, 8 petugas, tiap bulan — itu asumsi yang pasti gugur, dan gugurnya diam-diam.

**Bukti dari data live (20 Agu):** doc `0l114807…-83674161979544` punya `due:"202609"` setelah pendataan menutup 202608. Perilaku itu **benar**. Yang belum ada cuma cara menemukan titik yang periodenya lewat tanpa pernah ditutup.

## 2. Yang diminta

Satu field di doc `meter`:

| Field | Tipe | Isi |
|---|---|---|
| `ov` | **String** | `"1"` = masih ditunggu (periode `due` sudah dibuka dan belum ditutup) · `"0"` = tidak |

**String, bukan Number, bukan Boolean.** `search` mengirim nilai sebagai String; field bertipe Number membuat pencarian mengembalikan 0 baris **tanpa error** — ini sudah pernah jadi bug di sistem ini, jangan diulang di jalur yang ujungnya tagihan.

Setelah `ov` ada, `MeterRound` berubah jadi:

```
sv◼83674161979544⭘ov◼1
```

Tidak ada tanggal di dalamnya. Titik yang kelewat **tetap nangkring di daftar** sampai benar-benar dibaca — yang memang seharusnya, karena tagihannya belum bisa terbit.

## 3. Aturan tulis

**Tutup — di setiap cabang yang memajukan `due`:**
```
reading tercatat → due maju → ov = "0"
```

**Buka — saat periode baru dibuka untuk titik itu:**
```
periode dibuka → ov = "1"
```

Doc baru dari pendataan awal: pendataan **adalah** pembacaan (v3 #24), jadi periodenya langsung tertutup → `ov = "0"`. Titik itu baru muncul di daftar saat periode berikutnya dibuka.

**Guard:** jangan pernah menulis `ov` dengan nilai selain `"1"`/`"0"`. Kalau ragu, tulis `"1"` — titik yang muncul padahal sudah dibaca itu gangguan kecil; titik yang hilang padahal belum dibaca itu tagihan yang tidak terbit.

## 4. ⚠️ Ini menghidupkan kembali cron yang sudah di-defer

Yang membuka periode tiap bulan adalah `openMeterPeriod` — **kodenya sudah ada dan sudah diuji**, tapi sengaja tidak dimasukkan ke `ALL=` di `deploy.sh` (di-defer 19 Agu, "nanti aja dulu").

Waktu itu keputusannya benar: tanpa `ov`, cron itu tidak mengubah apa pun yang dilihat petugas — `MeterRound` jalan murni dari `meter.due` yang dirawat `onEventCreated`.

**Sekarang beda.** `ov` tidak punya yang membalikkannya ke `"1"` selain cron. Jadi dua hal ini **satu paket**:

1. deploy `openMeterPeriod` + jadwalkan Scheduler-nya (bulanan, tanggal 1)
2. cron itu menyetel `ov = "1"` untuk tiap titik `mst:"active"` yang periodenya dibuka

Kalau cuma `ov` yang dikerjakan tanpa cron, daftarnya akan kosong selamanya setelah putaran pertama — **lebih buruk dari sekarang.** Jangan dipisah.

> Kalau cron memang belum mau dijalankan, biarkan saja apa adanya — sisi sheet punya jalan sementara (§5). Yang tidak boleh: `ov` tanpa cron.

## 5. Sementara, di sisi sheet

Sampai §4 jalan, `MeterRound` bisa mencari `sv` saja — semua titik site itu tampil, terbaca maupun belum, dan badge `mo` membedakannya.

Jujur soal batasnya: di 400 unit daftarnya jadi panjang dan "sisa berapa" hilang. Itu **jalan sementara buat menguji**, bukan bentuk akhirnya.

## 6. Acceptance

- [ ] Pendataan awal → doc punya `ov:"0"` (**String**), karena periodenya langsung tertutup.
- [ ] `openMeterPeriod` jalan → tiap titik `mst:"active"` jadi `ov:"1"`.
- [ ] Bacaan tercatat → `due` maju **dan** `ov` jadi `"0"` di transaksi yang sama.
- [ ] Titik yang **tidak** dibaca sepanjang satu periode → `ov` tetap `"1"` setelah cron periode berikutnya, dan `due`-nya **tidak** ikut maju.
- [ ] `search sv◼…⭘ov◼1` mengembalikan titik yang kelewat bulan lalu **bersama** titik bulan ini.
- [ ] `ov` tersimpan String — cek di Firestore, bukan cuma di UI.

---

**Referensi:** `docs/meter-data-cf-dev-spec.md` v3 (§5.4 aturan `closed`, §5b cron `openMeterPeriod`) · `docs/meter-cf-delta-2026-08-20.md` (delta sebelumnya, masih berlaku) · `handoff-meter-pascal-v3.md` #4 (daftar wajib) dan #24 (pendataan adalah pembacaan) · dict book tab `meter`.
