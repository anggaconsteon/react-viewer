# Driver Runtime — Data per Page (PROVISIONAL)

Cara baca: tiap page → **apa yang tampil di layar**, **BACA** dari tabel mana (field konkret), **TULIS** apa (event + perubahan state). Contoh nilai diambil dari prototype (Budi Santoso, vehicle `B 1234 XY`, Mandiri Tower, item gas/galon).

## Prinsip (sesuai arahan)
- Tabel driver = **case sendiri, koleksi sendiri**. **Tidak** menumpang di `site`/`workforce` (itu case patrol/attendance). **Hanya `event` yang dibagi** (ledger universal).
- Koleksi driver (semua sibling di bawah `tables/{tableVID-driver}/`):

| Koleksi | Sifat | Isi singkat |
|---|---|---|
| `driver` | master (admin seed) | identitas driver + kartu QR |
| `vehicle` | master + state | truk + muatan berjalan |
| `trip` | operasional | rute 1 hari + **gate custody** |
| `task` | operasional | 1 stop (plan vs aktual) |
| `event` | **SHARED** ledger | jejak semua aksi (append-only) |

Format dok: tetap pakai gaya field-code pendek + denormalisasi nama/VID + `r` retention (biar perilaku sama dgn record live).

---

## P2 · ScanLogin

**Layar:** kamera scan QR kartu. Banner: *fresh* ("identitas di kartu") atau *resume* ("lanjutkan trip {n}, {x} task nunggu"). Scan sukses → langsung buka sesi (tanpa PIN) → masuk Home.

**BACA**
- `driver` — lookup by VID hasil decode QR kartu:
  ```
  driver/DRV-001 → { vid:"DRV-001", n:"Budi Santoso", ro:"Driver", card:"<qr-vid>" }
  ```
- `trip` — cek ada trip ke-pause milik driver ini? (nentuin banner fresh vs resume):
  `trip where dv=="DRV-001" && st=="paused"` → kalau ada, banner resume + sisa task.

**TULIS**
- `event` (SHARED) — 1 dok:
  ```
  event/{auto} → { r:4320, ty:"driver-session-open",   // atau "driver-session-resume"
                   t:1781163662868, ts:"11 Jun 2026 08:24:00",
                   cv:"DRV-001", cn:"Budi Santoso",     // aktor
                   vv:"V-007", vp:"B 1234 XY",
                   tv:"TRIP-20260611-001",
                   p:"driverRuntimeScanLogin", ev:"<payload DSL>" }
  ```
- (opsional state) `driver/DRV-001.ss = "on"` (session aktif) — atau cukup turunkan dari event terakhir.

> Catatan: kalau driver tak mau jadi tabel master, identitas bisa murni dari isi QR kartu (nama+VID+role di-encode di QR) → `driver` jadi opsional. Keputusan tech lead.

---

## P4 · DriverHome

**Layar:** header (avatar, Budi, B 1234 XY, tombol Keluar) + 4 kartu: Custody-gate, Cargo, Rute, Return. Rute terkunci 🔒 sampai custody confirmed.

**BACA** (home = dashboard dari 1 `trip`)
- `trip/TRIP-20260611-001`:
  ```
  { vid:"TRIP-20260611-001", d8:"2026-06-11",
    dv:"DRV-001", dn:"Budi Santoso", vv:"V-007", vp:"B 1234 XY",
    gt:"custody", gs:"pending",          // ← gate: pending|confirmed|confirmed_selisih
    cl:[ {iid:"gas_12", in:"Gas 12kg", ity:"returnable", wr:10, dc:null},
         {iid:"gas_3",  in:"Gas 3kg",  ity:"returnable", wr:3,  dc:null},
         {iid:"aqua_galon", in:"Aqua Galon", ity:"returnable", wr:8, dc:null},
         {iid:"aqua_600",   in:"Aqua 600ml (Dus)", ity:"consumable", wr:4, dc:null} ],
    tc:4, cc:0, st:"active" }
  ```
  - **Kartu custody** ← `gs` + `cl[]` (saat pending tampilkan daftar item + qty `wr`).
  - **Header** ← `dn`, `vp`.
- `task where tv=="TRIP-...001"` → **Kartu Rute** (daftar stop + progress). Saat `gs=pending` → mode locked.
- `vehicle/V-007.cg` → **Kartu Cargo** (muncul setelah confirmed):
  ```
  vehicle/V-007 → { vid:"V-007", pl:"B 1234 XY", st:"loaded",
    cg:[ {ic:"gas",   in:"Tabung", bk:[{k:"isi",v:13},{k:"kosong",v:0}]},
         {ic:"galon", in:"Galon",  bk:[{k:"isi",v:8}, {k:"kosong",v:0}]} ] }
  ```
- **Kartu Return** aktif kalau `cc >= tc` (semua stop kelar).

**TULIS:** — (read-only; tombol navigasi ke page lain)

---

## P5 · CustodyNotification

**Layar:** kartu vehicle + manifest per stop (collapsible) + total circulation. Tombol "Mulai Konfirmasi".

**BACA**
- `trip/...001` → `vv/vp`, `lb` (loaded-by), `lt` (loaded-at), `cl[]` (total), dan manifest per-stop dari `task`:
  ```
  task where tv=="TRIP-...001" order so →
    T-050 Mandiri Tower  : gas_12 drop4 · aqua_galon drop2
    T-051 Honda Bintaro  : gas_12 drop3 · gas_3 drop3/pick3 · aqua_600 drop4
    ...
  ```
**TULIS:** —

---

## P6 · CustodyCount (hitung independen)

**Layar:** stepper hitung tiap item (angka gudang DISEMBUNYIIN) → semua keisi → tombol reveal → bandingin vs `wr`.

**BACA**
- `trip.cl[].wr` — TAPI baru dipakai **setelah** driver tekan reveal (genuine count).

**TULIS:** belum nulis ke server di sini — `dc` (driver-counted) ditahan di memori, baru di-commit di P7/P8.

---

## P7 · CustodySuccess (semua match)

**Layar:** ✓ konfirmasi tercatat, vehicle siap berangkat.

**TULIS**
- `event` (SHARED):
  ```
  event/{auto} → { r:4320, ty:"custody-confirm", t:…, ts:…,
                   cv:"DRV-001", cn:"Budi Santoso", vv:"V-007",
                   tv:"TRIP-...001", ev:"<count payload>" }
  ```
- `trip/...001`: `gs="confirmed"`, set `cl[].dc = wr` (match).
- `vehicle/V-007`: seed `cg[]` dari `cl[]` (baseline isi).

→ balik Home; rute kebuka.

---

## P8/P9 · MismatchReport → Submitted (ada selisih)

**Layar P8:** daftar item selisih (gudang vs hitung lo + delta) + note (≥10 char) + foto **WAJIB**. **P9:** selisih dikirim ke Supervisor, driver tetap jalan.

**BACA**
- `trip.cl[]` + `dc` (hasil hitung) → hitung delta.

**TULIS**
- `event` (SHARED):
  ```
  event/{auto} → { r:4320, ty:"custody-mismatch", t:…, ts:…,
                   cv:"DRV-001", cn:"Budi Santoso", vv:"V-007", tv:"TRIP-...001",
                   d:"<note driver>", i:"<foto-url>",
                   ev:"<delta payload: gas_12 wr10 dc9 -1 ★ ...>" }
  ```
- `trip/...001`: `gs="confirmed_selisih"`, simpan `cl[].dc` (aktual).
- `vehicle/V-007`: seed `cg[]` dari **`dc`** (angka driver), bukan `wr` gudang.

→ balik Home; rute kebuka (pakai baseline aktual).

---

## P10 · TaskFeed

**Layar:** stop dikelompokin: Berikutnya (assigned) / Gagal (failed) / Selesai (completed). Driver pilih sendiri.

**BACA**
- `task where tv=="TRIP-...001"` grouped by `st`:
  ```
  task/T-050 → { vid:"T-050", tv:"TRIP-...001", so:1, sv:"<siteVID>", sn:"Mandiri Tower",
    ad:"Jl. Jend. Sudirman Kav. 54-55", ds:"0 km · current", st:"assigned", tt:"deliver",
    it:[ {iid:"gas_12", in:"Gas 12kg", ity:"returnable", pd:4, ad:0, pp:0, ap:0},
         {iid:"aqua_galon", in:"Aqua Galon", ity:"returnable", pd:2, ad:0, pp:0, ap:0} ] }
  ```
**TULIS:** —

---

## P11 · DeliveryWorkspace (eksekusi 1 stop)

**Layar:** stepper drop/pickup tiap item (default = plan) + tanda tangan + note + foto. Submit → SubmitConfirmSheet. Atau "Lapor gagal" (4 reason).

**BACA**
- `task/T-051` (1 stop) → `it[]` dgn `pd/pp` jadi nilai awal stepper.

**TULIS — submit sukses/partial**
- `event` (SHARED), 1 dok per submit (drop+pickup di payload):
  ```
  event/{auto} → { r:4320, ty:"delivery-submit", t:…, ts:…,
                   cv:"DRV-001", cn:"Budi Santoso", sv:"<siteVID>", sn:"Honda Bintaro",
                   tv:"TRIP-...001", d:"<note>", i:"<foto>",
                   ev:"T-051 ★ gas_12 d3 p0 ★ gas_3 d3 p3 ★ aqua_600 d4 p0 ★ sig:1" }
  ```
- `task/T-051`: `st="completed"`, `oc="success"|"partial"`, `it[].ad/ap` = aktual, `ca`, `cc`, `nt`, `i`, `sg`.
- `vehicle/V-007.cg`: recompute (isi −= drop, kosong += pickup).
- `trip/...001.cc += 1`.

**TULIS — lapor gagal**
- `event`: `ty="delivery-fail"`, `ev` bawa `fr` (customer_closed|access_denied|customer_refused|capacity_full) + note.
- `task/T-051`: `st="failed"`, `fr=…`, `ca`.

→ balik Feed (state ke-update; TIDAK auto-promote — driver pilih lagi).

---

## P12 · ReturnVehicle

**Layar:** sisa muatan di kendaraan (per item isi/kosong) → "Serahkan ke Gudang" → sesi tutup.

**BACA**
- `vehicle/V-007.cg` → sisa (tabung isi/kosong, galon isi/kosong).

**TULIS**
- `event` (SHARED): `ty="vehicle-return"`, `ev` bawa snapshot sisa cargo.
- `vehicle/V-007`: `st="returned"`.
- `trip/...001`: `st="closed"`.
- `driver/DRV-001`: `ss="off"` (atau turunkan dari event).

---

## S1 · PauseConfirmSheet (keluar tengah trip)

**Layar:** masih ada N task → pause sesi (trip tetap idup, lanjut di device manapun via scan).

**BACA**
- `trip` → jumlah task `assigned` (sisa).

**TULIS**
- `event` (SHARED): `ty="driver-session-pause"`.
- `trip/...001`: `st="paused"`.
- `driver/DRV-001`: `ss="paused"`.

→ kembali ke gate scan (P2) varian resume.

---

## Ringkasan: tabel disentuh per page

| Page | driver | vehicle | trip | task | event |
|---|:--:|:--:|:--:|:--:|:--:|
| P2 Scan | R/W | — | R | — | **W** |
| P4 Home | R | R | R | R | — |
| P5 Custody notif | — | — | R | R | — |
| P6 Count | — | — | R | — | — |
| P7 Success | — | W | W | — | **W** |
| P8/9 Mismatch | — | W | W | — | **W** |
| P10 Feed | — | — | — | R | — |
| P11 Workspace | — | W | W | W | **W** |
| P12 Return | W | W | W | — | **W** |
| S1 Pause | W | — | W | — | **W** |

R = baca, W = tulis. **`event` = satu-satunya tabel shared**; sisanya milik fitur driver. Tiap aksi penting selalu nempel 1 dok `event` (audit) + update state di tabel operasional.

## Pertanyaan tech lead (singkat)
1. `driver` perlu tabel master, atau identitas cukup dari isi QR kartu?
2. State operasional (trip/task/vehicle) = tabel mutable (rekomendasi), atau diturunkan dari `event` (event-sourced)?
3. `trip` per-driver/hari atau per-vehicle/hari?
4. Item = count (sekarang) atau serialized per-unit (QR tiap tabung)?
5. Vocab gate: `confirmed_selisih` vs `confirmed_mismatch`?
