# TXT (`textVariant`)

**Status:** LIVE di app (dari permintaan dev langsung; dipakai halaman home — bagian Riwayat)
**Widget tab:** row 299

## Buat apa

Teks statis dengan gaya khusus lewat field `variant`. Dua gaya yang dipakai:

- **`section`** — judul bagian (header pemisah antar-blok), seperti "RIWAYAT ABSENSI" / "RIWAYAT" — teks tebal huruf besar dengan garis aksen di kiri.
- **`history`** — daftar riwayat berbentuk **timeline** (titik ungu + garis), tiap baris satu kejadian. Satu field `data` berisi banyak baris dipisah `\n`; renderer memecahnya jadi baris-baris timeline.

## Tampilan

```
│ RIWAYAT ABSENSI                      ← variant:"section"
●  20-Jul · 12:41                      ┐
│  Sekuriti - absen masuk             │  variant:"history"
│  BSD Tech Center #26 - Jalan …      │  (tiap \n = 1 titik timeline:
●  15-Jul · 15:42                      │   tanggal·jam ungu / judul tebal /
│  Sekuriti - absen masuk             │   detail abu-abu)
│  BSD Tech Center #26 - Sampora …    ┘
```

## Contoh JSON

```json
,{"type":"TXT","size":18,"variant":"section","data":"Riwayat"}
```

```json
,{"type":"TXT","size":14,"variant":"history","data":"06-Jul 11:04 - Pengarahan @ - QA-shared-path-regression-check - Jalan Horizon Broadway Banten 15345\n11-Jun 14:41 - Laporan patroli @ -  - Jalan Horizon Broadway Banten 15345\n08-Jun 13:32 - Pengarahan @ - yoigas - Jalan Horizon Broadway Banten 15345"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TXT` | — |
| `size` | Wajib | Ukuran teks — atur per pemakaian (`section` biasa `18`, `history` biasa `14`) | `18` |
| `variant` | Wajib | Gaya tampilan: `section` (judul bagian) atau `history` (daftar timeline). Nilai lain belum dikonfirmasi ke dev | `section` |
| `data` | Wajib | Isi teks. Untuk `history`: banyak baris dipisah `\n`, 1 baris = 1 kejadian | `Riwayat` |

## Posisi field gabungan

Tidak ada field ◆-gabungan. Untuk `variant:"history"`, isi `data` per baris pakai pola (dari contoh dev):

```
{tanggal jam} - {judul} - {detail} - {alamat}
```

Dipisah ` - ` (spasi-strip-spasi), tiap baris dipisah `\n`. Renderer memakai `tanggal jam` sebagai kepala baris ungu, `judul` jadi tebal, sisanya jadi detail abu-abu. `[?]` Pemetaan persis tiap potongan ke elemen tampilan belum ada spec tertulis — pola di atas dibaca dari contoh live, konfirmasi ke dev kalau butuh detail.

## Tips & catatan

- Sibling: `text` (TXT polos tanpa variant), `textRoute` (TXT bisa di-tap), `noticeBar` (banner status berwarna), `timeline`/`timelinePeriodic`/`timelineLedger` (timeline berbasis data tabel — beda dengan `history` yang isinya teks jadi di satu field `data`).
- `variant:"history"` = timeline dari **teks siap-jadi** di satu field. Kalau timeline mau ambil langsung dari koleksi data, itu widget `timeline*` yang lain.
- Nilai `variant` selain `section`/`history` belum terdokumentasi — jangan pakai tanpa konfirmasi dev.
