# DRIVER_STOP_CARD (`driverStopCard`)

**Status:** LIVE di app (kartu titik antar/rute driver)
**Dev spec:** ADA — `docs/driver-stop-card-dev-spec.md`
**Widget tab:** row 204

## Buat apa

Kartu untuk satu titik pemberhentian rute driver: nama & alamat tujuan, tombol navigasi, plus tombol tolak (kalau tidak bisa diantar). Dipakai di runtime driver saat mengerjakan rute antar.

## Tampilan

Kartu = container "Rute Hari Ini" berisi **daftar** stop (bukan 1 tujuan per kartu). Dua wajah: locked (custody belum confirmed) dan unlocked.

```
LOCKED                                    UNLOCKED
+-----------------------------------+     +-----------------------------------+
| [gembok] Rute Hari Ini            |     | [truk] Rute Hari Ini         65%  |
|          3 tujuan                 |     |        2 dari 3 . lanjut: Budi    |
+-----------------------------------+     | ##########------                  |
| Cek barang dulu buat mulai...     |     +-----------------------------------+
+-----------------------------------+     |  v  Kopi Kenangan     [ Selesai ] |
|  1  Kopi Kenangan Bintaro         |     |     Jl. Merdeka No.5              |
|     Jl. Merdeka No.5 . 2 galon    |     |     [ Lihat Lokasi ] *            |
|     [ Lihat Lokasi ] * [ Tolak ]  |     |                                   |
|  2  Toko Budi                     |     |  2  Toko Budi         [ Lanjut  ] |
|     Jl. Kenanga 12 . 1 galon      |     |     Jl. Kenanga 12                |
|     [ Lihat Lokasi ] * [ Tolak ]  |     |     [ Lihat Lokasi ] *            |
+-----------------------------------+     +-----------------------------------+
| Ada stop nggak searah? Tolak...   |     |   Buka Tasklist (eksekusi) ->     |
+-----------------------------------+     +-----------------------------------+

* = mapsUrl, BELUM ADA DI RENDERER
```

`[ Lihat Lokasi ]` muncul di **tiap baris stop, di kedua mode** — termasuk baris `Selesai`. Di mode locked dia pasangannya `[ Tolak ]`: sopir lihat lokasi dulu, baru mutusin stop itu searah apa enggak.

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"DRIVER_STOP_CARD","variant":"default","vidtable":"20342033315492","table":"84214220504259//task","search":"dv◼{userVid}⭘tst◼assigned","navState":"","route":"vertikaTeknoLokaciptaDeliveryWorkspace","rejectRoute":"vertikaTeknoLokaciptaFailedDelivery","taskIdField":"tnm","gateTable":"84214220504259//vehicle_check","gateSearch":"dv◼{userVid}","icon":"local_shipping","iconLocked":"lock","text":"Titik Antar◆Belum ada titik","nameField":"kn","addressField":"al","excludeStatus":"completed"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `DRIVER_STOP_CARD` | — |
| `variant` | Opsional | Mode tampilan | `default` |
| `vidtable` / `table` / `search` | Wajib | Sumber data titik/tugas | `dv◼{userVid}⭘tst◼assigned` |
| `navState` | Opsional | `[?] status navigasi — cek dev` | `""` |
| `route` | Wajib | Halaman tujuan tombol utama | `…DeliveryWorkspace` |
| `rejectRoute` | Opsional | Halaman tujuan tombol tolak | `…FailedDelivery` |
| `taskIdField` | Wajib | Field id tugas (dibawa ke route) | `tnm` |
| `gateTable` / `gateSearch` | Opsional | Pengecek gerbang (mis. sudah muat/belum) | `dv◼{userVid}` |
| `icon` / `iconLocked` | Opsional | Ikon normal / saat terkunci | `local_shipping` / `lock` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Titik Antar◆Belum ada titik` |
| `nameField` / `addressField` | Wajib | Field nama tujuan / alamat | `kn` / `al` |
| `excludeStatus` | Opsional | Status yang dikecualikan dari daftar | `completed` |
| `mapsUrl` ⬜ | Opsional | Tombol Navigasi — DSL keyed, lihat bawah | `url◼https://…⭘fallback◼https://…⭘empty◼Alamat belum lengkap` |

⬜ = **belum ada di renderer** (nunggu dev). Tombol `[ Navigasi ]` di mockup atas itu target, belum jalan. Spec: `docs/customer-coordinate-maps-dev-spec.md` §6.

## Posisi field gabungan

`text` dipisah `◆` (judul / teks kosong). Kalau `mapsUrl` dipakai, `text` nambah 1 segmen di ujung = **label tombol Navigasi**.

`mapsUrl` dipisah `⭘` antar-pasangan, `◼` antara key dan value — pola yang sama kaya `search` / `gateSearch`:

| key | isi |
|---|---|
| `url` | template URL utama, `<field>` diinterpolasi dari doc tugas |
| `fallback` | template cadangan kalau `url` ada token kosong |
| `empty` | pesan waktu tombol mati |

Aturan: pakai template pertama yang **semua** token-nya keisi; habis → tombol disabled + tampilkan `empty`. Keyed (bukan `◆` posisi) supaya `url` dan `fallback` gak ketuker — dua-duanya URL yang mirip.

## Tips & catatan

- Kartu terkunci (ikon `iconLocked`) kalau prasyarat gerbang belum terpenuhi (mis. belum konfirmasi muatan).
- Tombol tolak → `rejectRoute` bawa `taskIdField` (pola routeParams).
- Spec: `docs/driver-stop-card-dev-spec.md`.
