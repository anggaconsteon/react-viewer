# QA Runbook — Return / Reject / Pindah Mobil (fix config 2026-08)

**Tanggal:** 2026-08-05
**Buat:** QA tester (user) — ikutin urut.
**Tenant:** VTL `20342033315492` (galon). **Seed:** Loka Air Master `1q6gLNgEdXKVs_EsQslmllFhl6t8UNqCyqbbDb911tao`.
**Yang divalidasi:**
- Fix serahkan drop-cst (`op1Screen!J696`) — tombol return nyangkut pas trip ada selisih.
- Pindah mobil pra-muat (`op1Screen!AB1179` groupRoutes +assigned).
- Reject multi-trip (CF `OnTaskWrite` — **butuh deploy dulu**).
- `{activeTrip}` resolve (scope per-trip, no leak).
- Kosmetik: coordination `ts`, invoice `ref`.

---

## Data seed (dari Loka Air Master — data ASLI)

**Item (Master_Item):**
| ii (kode) | in (nama) | ic | isi (ga) | kosong (ge) |
|---|---|---|---|---|
| 8886008101138 | **Aqua Galon 19 Liter** | returnable | **50** | **20** |
| 2000000006001 | Aqua 600ml 1 Karton | consumable | 100 | — |
| 2000000000192 | Cleo Galon 19 Liter | returnable | 30 | 10 |
| 9990019000019 | Galon RO 19 Liter | returnable | 25 | 15 |
| 9990019000026 | Galon Isi Ulang 19 Liter | returnable | 20 | 10 |

**Item utama test = Aqua Galon 19 Liter (isi 50 · kosong 20).**

**Customer (Master_Customer):** cuma **Toko Contoh Jaya** (Jl. Contoh No. 2, HoReCa, Ibu Sari, active).
> ⚠️ Buat test 2-stop, **tambah 1 customer** di Master_Customer baris 4: **Kopi Kenangan** (Jl. Kenangan No. 5, HoReCa, active). Kalau males, jalanin single-stop (Toko doang) — angka nyesuaiin di catatan tiap skenario.

**Kendaraan (Master_Kendaraan):**
| kd | ln (plat) | jenis | status |
|---|---|---|---|
| MBL-01 | **B 1234 XY** | Pickup | active |
| MBL-02 | **D 2134 FA** | Viar | active |

Pindah mobil: dari **B 1234 XY** → **D 2134 FA**.

> Kalau seed belum ke-push ke Firestore, jalanin seeder-nya dulu (Driver Seed menu / Seed Saldo Awal) sampai item+gudang+kendaraan+customer nongol di app.

---

## S1 — Happy path + Return normal  (validasi `{activeTrip}` + serahkan)

Trip bersih, custody PAS (no selisih). Pakai **2-stop** (Toko + Kopi Kenangan).

| # | Aksi | Hasil diharapkan |
|---|---|---|
| 1.1 | Admin: task **Toko Contoh Jaya** — drop **2 isi**, pickup **2 kosong** (Aqua Galon 19 Liter) | task tst assigned |
| 1.2 | Admin: task **Kopi Kenangan** — drop **1 isi**, pickup **1 kosong** | task tst assigned |
| 1.3 | Assign dua task ke **B 1234 XY** | dua task vv = B 1234 XY |
| 1.4 | Gudang: muat mobil (opening check) — **3 isi** naik | opening check, ie[] = 3 isi |
| 1.5 | Driver: **Konfirmasi Penerimaan** — hitung **3 isi (PAS)** | cst custody_confirmed. **Cek task yg muncul cuma trip ini** (`{activeTrip}` resolve) |
| 1.6 | Isi Kendaraan | 3 isi · 0 kosong |
| 1.7 | Deliver **Toko**: drop 2 isi, ambil 2 kosong | completed |
| 1.8 | Deliver **Kopi**: drop 1 isi, ambil 1 kosong | completed |
| 1.9 | Semua kelar → **tombol "Return Kendaraan" muncul** (home + TaskFeed) | dua-duanya muncul |
| 1.10 | Return → **Serahkan ke Gudang** | dialog "Kendaraan Diserahkan" |
| 1.11 | Balik home | **tombol return ILANG** |
| 1.12 | Gudang closing → 3 kosong balik | **Aqua akhir: isi 47 · kosong 23** |

✅ Lolos: return ilang + gudang **47 / 23**.
> Single-stop (Toko doang, drop 2): muat 2 → serahkan 2 kosong → gudang **isi 48 · kosong 22**.

---

## S2 — Return dgn SELISIH custody  ⭐ (validasi fix `J696`)

Sama kaya S1 TAPI custody driver hitung BEDA. Ini kasus yg bikin tombol nyangkut sebelum fix.

| # | Aksi | Hasil diharapkan |
|---|---|---|
| 2.1 | Ulang 1.1–1.4 (task baru, B 1234 XY, muat 3 isi) | opening check |
| 2.2 | Driver: **Konfirmasi** — hitung **2 isi** (harusnya 3) → **selisih** | notif "Ada selisih · Supervisor review", kerjaan tetep jalan |
| 2.3 | Deliver dua task | dua completed |
| 2.4 | Semua kelar → tombol Return muncul | muncul |
| 2.5 | **Serahkan ke Gudang** | dialog sukses |
| 2.6 | Balik home | **tombol return ILANG** ← FIX (sebelum fix: NYANGKUT) |

✅ Lolos: return **ilang walau tadi selisih**.
❌ Masih nyangkut → sisa titik #2 (`cdt` keyed tolerance). Lapor + cek doc opening check field **`cdt`** (String apa Number).

---

## S3 — Reject 1 task  (validasi CF — **butuh `OnTaskWrite` deployed**)

> Skip kalau CF belum deploy. Sesudah deploy: **hapus check nyangkut lama** `wsiCmao6FPouGsTJFYDd` (set cst=cancelled) dulu.

| # | Aksi | Hasil diharapkan |
|---|---|---|
| 3.1 | Task **1** (Toko, drop 2 isi), assign B 1234 XY, muat | opening check, ie[] = 2 |
| 3.2 | Driver: **Tolak muatan** | task tst load_rejected |
| 3.3 | Cek vehicle_check | **cst cancelled**, driver ke-clear |
| 3.4 | Cek `ie[]` | **kosong** (bukan angka trip lama) |
| 3.5 | Driver home | card custody **ilang** |

✅ Lolos: `ie[]` kosong + card ilang. Ini yg kemarin bocor (ie[]=7 dari trip lama).

---

## S4 — Pindah mobil  (validasi `AB1179` groupRoutes +assigned)

### 4a — belum muat (AMAN, jalur utama)
| # | Aksi | Hasil diharapkan |
|---|---|---|
| 4a.1 | Task (Toko, drop 1 isi), assign **B 1234 XY**, **JANGAN muat** | assigned, `tr` kosong |
| 4a.2 | Admin → Daftar Task → grup **"Terjadwal"** → **tap task** | masuk Assign Kendaraan (ketap ← fix) |
| 4a.3 | Pilih **D 2134 FA** → konfirmasi | vv pindah ke D 2134 FA |
| 4a.4 | Cek task | vv = D 2134 FA, nol driver/gudang |

✅ Lolos: task pindah mobil tanpa reject/round-trip.

### 4b — udah muat (WARN, jangan lanjut)
| # | Aksi | Hasil diharapkan |
|---|---|---|
| 4b.1 | Task yg UDAH dimuat (`tr` keisi, dari S1) | ada di grup Terjadwal |
| 4b.2 | Tap → Assign Kendaraan | **warn-bar**: "Mobil yg SUDAH muat: tolak dulu di driver" |
| 4b.3 | **JANGAN lanjut** | validasi warn kebaca |

⚠️ Footgun: kalau dipaksa, `vv` geser tanpa unload = barang nyangkut di mobil lama. Warn-bar = penjaga.

---

## S5 — Kosmetik (cepet, visual)

| # | Aksi | Hasil diharapkan |
|---|---|---|
| 5.1 | Admin home → card **"Tugaskan"** | tanggal = **string "05 Aug 2026 · HH:mm"**, BUKAN epoch |
| 5.2 | Invoice list (task completed belum invoice) | card nampil **nomor task (TASK-...) · tanggal** |

---

## (Opsional) S6 — Consumable jual-putus

Aqua 600ml 1 Karton (`ic=consumable`) = jual putus, gak ada kosong balik.

| # | Aksi | Hasil diharapkan |
|---|---|---|
| 6.1 | Task Toko: **jual 1 Aqua 600ml 1 Karton** | task ada |
| 6.2 | Deliver: jual 1 | completed, sirkulasi = Jual 1 (bukan drop/pickup) |
| 6.3 | Return circulation | consumable masuk kolom **Jual**, gudang isi 600ml −1, **no kosong** |

---

## Detail Stock Ledger (per item — Aqua Galon 19 Liter `8886008101138`)

Model gerak: **muat** gudang isi→mobil isi · **drop** mobil isi→customer · **pickup** customer→mobil kosong · **serahkan** mobil(isi+kosong)→gudang.

### S1 — happy 2-stop
| Step | Aksi | Gudang isi | Gudang kosong | Mobil isi | Mobil kosong |
|---|---|---|---|---|---|
| start | seed | **50** | **20** | 0 | 0 |
| 1.4 | muat 3 isi | 47 | 20 | 3 | 0 |
| 1.5 | konfirmasi 3 (pas) | 47 | 20 | 3 | 0 |
| 1.7 | Toko: drop 2, pickup 2 kosong | 47 | 20 | 1 | 2 |
| 1.8 | Kopi: drop 1, pickup 1 kosong | 47 | 20 | 0 | 3 |
| 1.12 | serahkan → 0 isi + 3 kosong ke gudang | **47** | **23** | 0 | 0 |

Customer: Toko terima 2 isi / kasih 2 kosong · Kopi terima 1 isi / kasih 1 kosong.
> Single-stop (Toko drop 2 doang): muat 2 → serahkan 2 kosong → gudang **48 / 22**.

### S3 — reject (balik ke awal)
| Step | Aksi | Gudang isi | Gudang kosong | Mobil isi | Mobil kosong |
|---|---|---|---|---|---|
| start | seed | 50 | 20 | 0 | 0 |
| 3.1 | muat 2 isi | 48 | 20 | 2 | 0 |
| 3.2 | reject → CF unload 2 isi balik | **50** | **20** | 0 | 0 |

Gudang balik **50/20**, `ie[]` kosong. Kalau ≠ → CF bocor.

### S4 — pindah mobil (belum muat): **nol gerak stock**
Gudang tetep 50/20. Cuma `vv` pindah B 1234 XY → D 2134 FA. Stock kesenggol = bug.

### S2 — selisih (fokus tombol)
Muat 3 (gudang 47) → konfirmasi **2** → selisih −1 ke-flag (`rs`, residu = jejak, by design). Angka akhir off sebesar residu = MEMANG desain. Dicek: selisih ke-flag + **tombol return ILANG**.

### S6 — consumable (Aqua 600ml 1 Karton `2000000006001`, isi 100)
| Step | Aksi | Gudang isi | Mobil isi | Catatan |
|---|---|---|---|---|
| start | seed | 100 | 0 | consumable, **no kosong** |
| muat | muat 1 | 99 | 1 | |
| jual | Toko jual 1 | 99 | 0 | sirkulasi = **Jual 1** (bukan drop/pickup), no kosong balik |
| serahkan | — | **99** | 0 | gudang tetep 99, nol kosong |

---

## Ringkasan pass/fail

- [ ] S1 — return normal ilang + gudang 47/23 (2-stop) / 48/22 (single)
- [ ] S2 — return ilang WALAU selisih (fix J696) ⭐
- [ ] S3 — reject: ie[] kosong (butuh deploy CF)
- [ ] S4a — pindah mobil belum-muat jalan (B 1234 XY → D 2134 FA)
- [ ] S4b — pindah mobil udah-muat kena warn
- [ ] S5 — ts string + invoice ref
- [ ] S6 — consumable jual-putus (opsional)

**Referensi fix:** `op1Screen!J696` (serahkan drop-cst), `op1Screen!AB1179` (groupRoutes +assigned), `op1Screen!D759` (coordination ts), `op1Screen!R963` (invoice ref), CF `OnTaskWrite`/`task_reject.go` (recomputeIE by tr).
