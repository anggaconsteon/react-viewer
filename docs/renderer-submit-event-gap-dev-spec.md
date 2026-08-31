# Dev Spec — Tombol yang di-render Flutter gak masuk jalur Event

**Tanggal:** 2026-08-27 · update 2026-08-28
**Buat:** dev Flutter
**Status:** SEBAGIAN DIKERJAIN — Jalan A (§5A) udah mulai jalan di `taskCreateSubmit`, tapi payload-nya setengah jadi (§5A-1). Sisanya tetep wajib beres sebelum production.
**Kenapa ada:** sebagian tombol nulis langsung ke Firestore dari Flutter, gak lewat DSL. Akibatnya aksinya **gak pernah nyampe tab Event** — dan tab Event itu mesin laporan.

---

## 5A-1. ⚠️ UPDATE 2026-08-28 — `ev` dari `taskCreateSubmit` UDAH ditulis, tapi isinya setengah jadi

Bukti live (`TASK-2026-000561`, tab Event):
```
0admin-create-task◆1787886165028◆◆◆888.8888888◆888.8888888◆◆88◆◆◆◆◆◆◆◆No Gps⬤★★★★★★★★★★★★★★★★TASK-2026-000561
```
Pembanding sehat (NewCustomer, jalur DSL):
```
0admin-new-customer◆1787884035049◆◆◆-6.32288744◆106.66780365◆◆ID◆15310◆Banten◆Kota Tangerang Selatan◆Kecamatan Serpong◆Serpong◆Jalan Salem I◆◆true-location⬤★…★Hotel/Resto/Kafe★Kopi Kenangan★…
```

Yang udah bener: `ev` ditulis, flag `admin-create-task` kepasang, epoch keisi, nomor task masuk di posisi `numberPos`. **Dua gap:**

1. **Blok geo diisi dummy** — `888.8888888` lat/lng, `88` country, `No Gps`. Ini bukan "geo kosong", ini **angka sampah yang bakal masuk kolom koordinat laporan**. Minta: pakai GPS beneran (sama kaya savesend RBT yang punya `gpsPosition`); kalau GPS gak tersedia, **kosongin slotnya** (`◆◆◆◆…`) jangan diisi 888.
2. **Semua posisi `★` kosong** kecuali nomor task. Laporan cuma dapet "ada task dibuat jam X" tanpa pelanggan/kendaraan. Minta isi field skalar minimum: nama pelanggan (`kn`), vid pelanggan (`kl`), kendaraan (`vv`). **Posisi persisnya = keputusan owner** (§8 no.3) — jangan ngarang posisi sendiri, sepakatin dulu biar formula kolom D `op1Script` bisa dipetain sekali dan gak geser.

Array `it[]` tetep JANGAN masuk `ev` (§7).

## 5A-2. Usulan peta posisi `★` buat `admin-create-task` — PROPOSED, nunggu approve owner

Prinsip: (1) skalar doang, array `it[]` di luar; (2) **★17 = nomor task JANGAN digeser** — udah jalan (`numberPos:"17"`, konsisten sama konvensi autoNumber di posisi 17 kaya NewCustomer); (3) posisi itu per-route (formula kolom D `op1Script` di-hardcode per route), jadi yang penting disepakatin SEKALI dan gak berubah.

| ★ | Isi | Sumber | Catatan |
|---|---|---|---|
| 11 | `kl` — vid pelanggan | draft wizard | buat join/telusur |
| 12 | `kn` — nama pelanggan | draft wizard | kolom utama laporan |
| 13 | `vv` — kendaraan | draft wizard | **boleh kosong** kalau "Tugaskan Nanti" |
| 14 | jumlah jenis barang (`it.count`) | draft wizard | skalar agregat, bukan array; contoh `1` |
| 17 | `tnm` — nomor task | `numberPos` | ✅ **udah jalan, jangan disentuh** |

Posisi 15-16 sengaja dikosongin buat cadangan. Contoh hasil:
```
0admin-create-task◆{epoch}◆◆◆{lat}◆{lng}◆…◆true-location⬤★★★★★★★★★★★X4Qwc…★Kopi Kenangan★GDG-01★1★★★TASK-2026-000561
```

Setelah owner approve + dev implement: builder (sheet) nyusun formula kolom D `op1Script` buat route ini — kerjaan terpisah, jangan digabung ke PR renderer.

---

## 1. Gejala — dua doc, satu app, kebalikan sempurna

Doc `stock_location` (Pelanggan Baru, ditulis DSL `addToEvent`) vs doc `task` (Buat Order, ditulis Flutter):

| Field | `stock_location` | `task` |
|---|---|---|
| `ev` (payload event) | ✅ ada | ❌ **gak ada** |
| `et` (event time) | ✅ ada | ❌ gak ada |
| `p` (route/page) | ✅ ada | ❌ gak ada |
| `r` (retention) | ✅ ada | ❌ gak ada |
| `search` | ❌ gak ada | ⚠️ **ada** — `"tnm★TASK-2026-000551"` |
| `tablevid` | ❌ gak ada | ⚠️ **ada** — `"20342033315492"` |

Yang lewat DSL: bawa jejak event, gak bawa sampah config.
Yang ditulis Flutter: gak bawa jejak event, malah bawa sampah config.

Contoh nyata doc `task` `TASK-2026-000551`:
```
al cn cv dn gl it kl kn la ln lo search t tablevid tdt tnm tr ts tst tty vv
                        ^^^^^^        ^^^^^^^^
                        bocor         bocor
tanpa: ev · et · p · r
```

## 2. Kenapa ini penting

Tab **Event** bukan gudang angka — dia **mesin laporan**. Alurnya: tombol ditekan → `ev` masuk kolom C → kolom D (`ld`) ngolah → jadi bahan sheet laporan (mis. laporan pekerjaan).

Aksi yang gak nulis `ev` **gak pernah muncul di laporan mana pun.** Dan yang kena justru aksi paling penting di alur driver-gudang-admin:

- order dibuat
- muatan dihitung & dikonfirmasi (gudang + sopir)
- nota supplier / saldo awal

Artinya laporan alur kerja lengkap "buat task → assign → order → balik ke admin" **gak akan pernah utuh** selama ini dibiarin.

## 3. Akar masalahnya — sama dengan gap array

Tombol-tombol ini nulis sendiri dari Flutter **bukan karena malas**, tapi karena **DSL gak bisa nyatain array**. `addToEvent`/`addToTable` cuma bisa field skalar; sedangkan yang mereka tulis itu array:

| Widget | Nulis array apa |
|---|---|
| `TASK_CREATE_SUBMIT` | `task.it[]` (baris barang) |
| `NOTA_CREATE_SUBMIT` | `nota.li[]` (baris nota) |
| `CUSTODY_COUNT_SUBMIT` | `vehicle_check.ie[]` / `ip[]` (manifest) |
| `ITEM_EXECUTION_LIST` | aktual ke `task.it[]` |

Jadi: **DSL gak sanggup → renderer nulis sendiri → sekalian lompat dari jalur `ev`.** Dua akibat, satu sebab.

Konsekuensi buat urutan kerja: kalau nanti DSL dikasih kemampuan array, sebagian masalah ini hilang sendiri. Tapi **jangan nunggu itu** — jalur `ev` bisa dibenerin duluan tanpa nyentuh soal array (§5).

## 4. Widget terdampak — daftar awal, **dev wajib lengkapi**

Dari config yang kebaca, kandidatnya:

| Widget | Halaman | Nulis `ev`? |
|---|---|---|
| `taskCreateSubmit` | CreateTaskSummary 719 | ❌ |
| `notaCreateSubmit` (walk-in) | WalkIn 740 | ❌ |
| `notaCreateSubmitSupplier` | SupplierTransaksi | ❌ |
| `notaCreateSubmitSeed` | SeedSaldoAwal | ❌ |
| `custodyCountSubmit` | CustodyCount 567 | ❌ |
| `custodyCountSubmitOpening` | WarehouseOpeningCheck 642 | ⚠️ sebagian — ada `addToEvent` buat doc `evidence`, tapi tulisan custody-nya sendiri renderer-internal |
| `custodyCountSubmitClosing` | WarehouseClosingCheck 656 | ⚠️ sama |
| `itemExecutionList` | DeliveryWorkspace 607 | ❌ nulis aktual ke `it[]` |

**Aturan buat nyari sisanya:** widget apa pun yang punya `action`/tulisan tapi **gak punya string `addToEvent`/`addToTable`** di confignya = nulis dari Flutter = kemungkinan besar gak nulis `ev`. Dev tolong sisir dan lengkapi tabelnya — daftar di atas dari config sheet, bukan dari kode.

## 5. Bentuk event yang diusulin

Tiga jalan. Rekomendasi: **A**.

### A. Renderer emit `ev` sendiri — REKOMENDASI

Widget-widget itu bikin payload `ev` yang **sama persis bentuknya** kaya savesend biasa: blok geo (`⬤`-kiri) + posisi form (`★`-kanan), plus `et`/`p`/`r`/`flag`.

- Bentuk `ev` gak berubah sedikit pun → **kolom D dan seluruh sheet laporan gak perlu diapa-apain**.
- Renderer udah punya semua bahannya: `gpsPosition` (geo), `flag`, route (`p`), dan nilai form per posisi.
- Konsisten: semua tombol jadi ninggalin jejak yang sama, gak ada dua kelas warga.

**Isi `★` buat v1:** field skalar aja (nomor task, pelanggan, kendaraan, status). **Array `it[]`/`ie[]`/`ip[]` JANGAN dipaksa masuk `ev`** — itu urusan terpisah (lihat §7). Laporan dapat baris header-nya; rincian item ditarik dari Firestore.

### B. CF yang bikin event dari trigger Firestore

`onWrite` doc → CF nyusun `ev` → append ke tab Event.

- Untung: app gak perlu tau soal Event sama sekali.
- Rugi: nambah permukaan CF, dan CF harus bisa nulis ke sheet (jalur yang belum tentu ada). Event jadi telat (async) — laporan bisa ketinggalan beberapa detik.

### C. Hibrida — renderer emit minimal, CF perkaya

Paling fleksibel, paling banyak bagian yang bisa rusak. **Jangan buat v1.**

## 6. Field sampah di doc

### 6.1 `search` + `tablevid` — ✅ KEPUTUSAN OWNER: HAPUS

Doc `task` nyimpen:
```
search:   "tnm★TASK-2026-000555"
tablevid: "20342033315492"
```

Dua-duanya **parameter config yang keikut ketulis**, bukan data bisnis. `tablevid` = id koneksi tenant, udah ketentuan dari path Firestore-nya sendiri. `search` = string DSL buat *nyari* doc, aneh disimpen di dalam doc yang dicari.

Bukti bahwa ini bukan kebutuhan skema: doc yang ditulis lewat `addToEvent` (`stock_location`) **gak punya dua-duanya**, dan semua fitur jalan normal.

**Keputusan owner 2026-08-27: berhenti nulis dua field ini.** Buang dari write path renderer.

⚠️ **Doc lama biarin dulu** — jangan bulk-delete field dari koleksi yang udah jalan. Cukup doc baru yang bersih. Kalau nanti mau dibersihin surut, itu migrasi terpisah.

### 6.2 `r` (retention) — ✅ KEPUTUSAN OWNER: HAPUS, tapi URUTANNYA penting

Owner konfirmasi 2026-08-27: `r` gak kepake, aman dibuang.

Bedanya sama `search`/`tablevid`: **`r` itu bagian kontrak DSL.** `docs/2026-06-01-addToEvent-design.md` + kamus `addToEvent` nulis `r` sebagai **REQUIRED** (`⭘r◼<retention-minutes>`), sederajat `ty`/`t`/`ts`. Dan `r◼4320` ketulis di **hampir tiap string `addToEvent` di sheet** — puluhan halaman.

Jadi buangnya bukan satu tambalan, tapi sapuan. **Urutannya wajib begini:**

1. **Renderer berhenti mewajibkan `r`** — parser `addToEvent` harus nerima string tanpa `r` tanpa error/reject. Kalau `r` dicabut dari sheet duluan sementara parser masih maksa, **submit-nya gagal** dan itu kena semua halaman sekaligus.
2. **Kontrak DSL diupdate** — `r` turun dari REQUIRED jadi dihapus, di `2026-06-01-addToEvent-design.md` + kamus.
3. **Baru sapu sheet** — cabut `⭘r◼4320` dari semua string `addToEvent`. Ini kerjaan builder, bukan dev.
4. Renderer berhenti nulis `r` buat doc baru.

**Kerjain sebagai sapuan terpisah, jangan dicampur ke spec ini.** Yang ini fokus jalur `ev`; `r` cuma kebetulan ketemu barengan.

⚠️ Sama kaya §6.1: **doc lama biarin**, jangan bulk-delete.

## 7. Not doing (v1)

- **Masukin array ke `ev`.** `ev` itu flat positional; daftar panjang berubah belum punya tempat, dan `☆` gak boleh dipakai sebagai pemisah baris (nabrak ekor kolom D — lihat `tasklist-status-separator-dev-spec.md` §5). Bahasannya kepisah.
- **Backfill event buat doc lama.** Yang udah terlanjur gak ada `ev` biarin; mulai dari tulisan baru.
- **Ngerombak DSL biar bisa array.** Itu yang bikin masalah ini ada, tapi jauh lebih besar. Jalur `ev` bisa dibenerin duluan tanpa nunggu.

## 8. Yang harus diputusin sebelum dikerjain

1. **Jalan A / B / C?** (rekomendasi A)
2. **`flag` tiap widget apa?** Tiap tombol butuh flag sendiri biar kebedain di laporan — mis. `admin-create-task`, `walkin-nota`, `custody-count-driver`, `custody-count-opening`. Sebagian udah ada di config (`flag:"admin-create-task"`), sebagian belum.
3. **Posisi `★` mana yang diisi per widget?** Perlu dipetakan satu-satu — dan itu nentuin bentuk laporannya nanti.
4. ~~`search`/`tablevid`/`r` dibuang atau dipertahanin~~ — **sudah diputus owner 2026-08-27: HAPUS ketiganya.** `search`/`tablevid` (§6.1) bisa jalan sekarang. `r` (§6.2) sapuan terpisah, **urutannya wajib: renderer berhenti mewajibkan → kontrak diupdate → baru sheet disapu**.

---

**Referensi:** `docs/standard-page-event-pattern.md` (anatomi `ev`) · `docs/2026-06-01-addToEvent-design.md` (separator + jalur DSL) · `docs/tasklist-status-separator-dev-spec.md` §5 (aturan `☆` di ekor kolom D) · `op1Script` baris 13 (peta `★`→sel).
