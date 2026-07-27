# LIST_ACTION_CARD (`listActionCard`)

**Status:** Renderer belum ada (config sudah siap & terpasang di halaman RewardReview 2026-07-27)
**Widget tab:** row 308

## Buat apa

Daftar kartu dengan tombol **Approve / Reject langsung di tiap baris** — untuk antrian review yang harus cepat (ratusan item/hari). Tanpa widget ini admin harus buka detail satu-satu. Tap kartu tetap membuka halaman detail (lihat gambar besar); Reject bisa diwajibkan mengisi alasan lewat popup. Baris yang sudah divonis hilang sendiri dari daftar.

## Tampilan

```
┌──────────────────────────────────────┐
│ Antrian Review                  [5]  │ ← judul + jumlah
│ Cuma yang kena flag / sampel …       │ ← subjudul
│ 🔍 Cari nama worker                  │ ← kotak cari
│ ┌──────────────────────────────────┐ │
│ │ [img] Dedi K.           🕐 6 jam │ │ ← foto/judul/waktu
│ │       instagram.com/p/Cx9k…      │ │ ← subtitle
│ │       ⚠ Foto duplikat            │ │ ← badge
│ │ [ ✓ Approve ]   [ ✕ Reject ]     │ │ ← aksi 1 / aksi 2
│ └──────────────────────────────────┘ │
│ ┌── baris berikutnya … ────────────┐ │
└──────────────────────────────────────┘
Tap KARTU (bukan tombol) → halaman detail.
Tap Reject → popup isi alasan → kirim.
```

## Contoh JSON

```json
{"type":"LIST_ACTION_CARD","vidtable":"20342033315492","table":"84214220504259//post_claim","search":"st◼review","sort":"t◼asc","fields":"<cn>◆<pl>◆i◆<ts>◆fl◆sample◼Sampel acak◼neutral★burst◼Submit cepat◼warn★duplicate◼Foto duplikat◼warn★link◼Link bekas◼warn★ai◼Cek AI◼warn","stats":"Antrian◼","searchFields":"cn","route":"vertikaTeknoLokaciptaRewardReviewDetail","routeParams":"ck◼{ck}","action1":"84214220504259//post_claim⭘tablevid◼20342033315492⭘search◼ck★{ck}⭘st◼approved","action2":"84214220504259//post_claim⭘tablevid◼20342033315492⭘search◼ck★{ck}⭘st◼rejected⭘rr◼◁5▷","actionMeta":"ok◼reward-approve◆danger◼reward-reject◼5","text":"Antrian Review◆Cuma yang kena flag / sampel — sisanya auto◆item◆Cari nama worker◆Antrian kosong — semua bersih◆Approve◆Reject◆Reject Submission◆Kasih alasan biar worker tahu harus perbaiki apa.◆Alasan reject◆Mis. screenshot buram◆Reject◆Tanpa link"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `LIST_ACTION_CARD` | — |
| `vidtable` / `table` / `search` | Wajib | Data sumber + filter antrian | `st◼review` |
| `sort` | Wajib | Urutan: `field◼arah` | `t◼asc` |
| `fields` | Wajib | Tampilan kartu, 6 posisi `◆` (lihat tabel posisi) | — |
| `stats` | Opsional (kosong = off) | Penghitung di judul: `Label◼` | `Antrian◼` |
| `searchFields` | Opsional (kosong = off) | Field yang bisa dicari di kotak cari | `cn` |
| `route` | Opsional (kosong = tap mati) | Halaman detail saat kartu di-tap | `…RewardReviewDetail` |
| `routeParams` | Wajib kalau route ada | Data yang dibawa ke detail | `ck◼{ck}` |
| `action1` | Opsional (kosong = tombol off) | Perintah tulis (DSL updateEventRow utuh) tombol pertama; `{field}` diambil dari baris yang di-tap | lihat contoh |
| `action2` | Opsional (kosong = tombol off) | Sama, tombol kedua | lihat contoh |
| `actionMeta` | Wajib kalau ada action | Gaya + penanda per tombol, per bagian `◆` (lihat tabel posisi) | `ok◼reward-approve◆danger◼reward-reject◼5` |
| `text` | Wajib | Semua label, 13 posisi `◆` (lihat tabel posisi) | — |

## Posisi field gabungan

Sumber: dict book tab `widget_field_positions`. Segmen kosong = fitur off; selalu pad sampai jumlah posisi penuh.

`fields` — 6 posisi dipisah `◆`:

| # | Isi | Contoh |
|---|---|---|
| 1 | Judul kartu — template `<field>` | `<cn>` |
| 2 | Subtitle — template `<field>` (kosong di data → fallback text #13) | `<pl>` |
| 3 | Foto kecil — nama field | `i` |
| 4 | Waktu/meta kanan-atas — template `<field>` | `<ts>` |
| 5 | Field badge | `fl` |
| 6 | Peta badge: `value◼label◼tone★…` (tone warna dari tema: ok/warn/danger/neutral) | `sample◼Sampel acak◼neutral★…` |

`actionMeta` — segmen `◆` ke-N = tombol ke-N; isi per segmen `tone◼flag[◼posisiNote]`:

| Sub-posisi | Isi | Contoh |
|---|---|---|
| 1 | Warna tombol dari tema (`ok`/`warn`/`danger`/`neutral` — bukan hex) | `ok` |
| 2 | Penanda kirim (registry backend) | `reward-approve` |
| 3 (opsional) | Terisi angka N = tap → popup isi catatan dulu, isinya masuk posisi N (`◁N▷` di DSL). Kosong = langsung kirim | `5` |

`text` — 13 posisi dipisah `◆`:

| # | Isi | Contoh |
|---|---|---|
| 1 | Judul daftar | `Antrian Review` |
| 2 | Subjudul | `Cuma yang kena flag / sampel — sisanya auto` |
| 3 | Satuan item (buat penghitung) | `item` |
| 4 | Hint kotak cari | `Cari nama worker` |
| 5 | Teks daftar kosong | `Antrian kosong — semua bersih` |
| 6 | Label tombol 1 | `Approve` |
| 7 | Label tombol 2 | `Reject` |
| 8 | Judul popup catatan | `Reject Submission` |
| 9 | Isi popup | `Kasih alasan biar worker tahu harus perbaiki apa.` |
| 10 | Label input popup | `Alasan reject` |
| 11 | Hint input popup | `Mis. screenshot buram` |
| 12 | Tombol kirim popup | `Reject` |
| 13 | Pengganti subtitle kosong | `Tanpa link` |

## Tips & catatan

- `{field}` di action (misal `{ck}`) = nama field persis di database, diambil dari baris yang di-tap — bukan daftar token khusus. Case lain tinggal ganti field (`{lk}`, `{tnm}`, dst) tanpa perubahan aplikasi.
- Field yang dipakai di `search◼…★{field}` action harus ada di data dan **unik** — dia sasaran tulis.
- Dua tombol cukup; bulk approve sengaja tidak ada (review harus per-item). Bulk ada di `payoutList`.
- Double-tap / 2 admin barengan aman — backend menolak vonis kedua.
- Konsumen pertama: RewardReview (antrian review reward posting). Spec: `docs/list-action-card-widget-dev-spec.md`.
