# Design Spec: Pendaftaran Pegawai Multi-Gerbang (Web + Go)

Tanggal: 2026-07-31 · Status: disetujui user (sesi brainstorming) · Repo terdampak: `backend-go`, VTL web-builder (Web Screen/Menu), sheet Support 2A/2B/2D/2E

## 1. Latar & masalah

Pendaftaran pegawai jalan begini hari ini:

- Client input di **sheet pendaftaran tenant** masing-masing → formula/importrange memunculkan row di tab **`New User`** pada spreadsheet gerbang.
- Gerbang ada **4 spreadsheet kembar**: `2A / 2B / 2D / 2E` (template tab identik: `New User`, `AddUser`, dst.). 2A = `1OHqMDgWbFLGtAjSg6wmoFDdLSKdEU-2Cxjv5YhtIoPg` (= `supportSpreadsheetID` di Go). Dipecah 4 karena beban importrange.
- Backend Go action **`PENDAFTARAN_PEGAWAI`** sudah live (`backend-go/internal/pegawai/adduser*.go`, port `autsorzAddUser()`): A0 salin row `New User` yang belum tercentang → papan kerja `AddUser` → A1..A8 (Alokasi VID CP1 → Admin → Konfig Admin → Induk → Konfig proxy → Listeners → OrgVids → Firebase) → sukses = centang `Process` ☑ + tulis status per-step.
- Web `consteon.io/employee/change` (halaman dari VTL web-builder) menampilkan grid `New User` **2A saja** + tombol aksi borongan.

Masalah yang diselesaikan spec ini:

1. **Bocor antar tenant** — eksekusi = "semua row belum ☑" di satu sheet; row tenant lain ikut terproses.
2. **Gerbang lain tak terlayani** — Go hardcode 1 ssid (2A); 2B/2D/2E manual/copy-paste.
3. **Input wajib manusia** — kolom `Konfig apps` (New User col R, dropdown) harus diisi admin per row, tak bisa dirumuskan; 4 gerbang = buka 4 spreadsheet.
4. Belum ada kabar balik ke sheet tenant (kolom `Status update`).

## 2. Keputusan design (final, urutan penting)

### 2.1 Konvensi tiket — inti solusi per-tenant

> **Row diproses HANYA jika: `Process` belum ☑ DAN `Konfig apps` (col R) terisi.**

Isian `Konfig apps` = keputusan manusia (admin) yang memang wajib ada → dijadikan sekaligus **sinyal pilih**. Konsekuensi:

- Tidak perlu mekanisme centang-pilih terpisah; mengisi dropdown = memilih.
- Row tenant lain (R kosong) mustahil ikut ke-execute.
- Retry gagal = biarkan R terisi, jalankan lagi (☑ belum tercentang karena gagal).

### 2.2 Satu tombol, loop 4 gerbang

Web punya **satu tombol "Jalankan Pendaftaran"**. Go loop gerbang **urut 2A → 2B → 2D → 2E** (V1 sequential):

- Per gerbang: baca `New User` (1 call) → tak ada row ber-tiket → lewat; ada → pipeline penuh untuk gerbang itu.
- Kegagalan satu gerbang dicatat, gerbang berikutnya tetap jalan (kecuali token expired = abort, kontrak existing).
- Mau jalankan 1 gerbang saja? Isi tiket di gerbang itu saja. Tombol per-gerbang = TIDAK dibangun (YAGNI).
- Paralel antar gerbang = boleh nanti (papan kerja independen), bukan V1.

### 2.3 AddUser per gerbang (TIDAK disentralisasi)

Papan kerja `AddUser` tetap di spreadsheet gerbangnya masing-masing:

- Template + ARRAYFORMULA kembar sudah ada → nol kerja sheet.
- A0 baca `New User` + `AddUser` extent dalam **1 batchGet** (satu spreadsheet) — efisiensi existing dipertahankan.
- 4 papan independen → lock per gerbang, paralel dimungkinkan nanti.
- Log/status nempel di gerbangnya (operator buka 2B, lihat riwayat 2B).
- Penanda "sudah diproses" = ☑ di `New User` gerbang masing-masing — sentralisasi arsip tidak menambah fungsi.

### 2.4 Kunci per-tenant = `VID Client`

`New User` col P (`VID Client`, angka, mis. `84214220504259`) = identitas tenant per row. Dipakai:

1. **Identitas sesi** (jalur tenant, fase 2): login → sesi bawa VID Client.
2. **Filter antrian**: tenant hanya lihat/proses row miliknya; admin bebas.
3. **Cek ulang server**: sebelum eksekusi, row yang diminta diverifikasi VID Client-nya; tenant kirim row orang lain → 403. Nama client string TIDAK dipakai sebagai kunci (rawan beda ejaan).

### 2.5 Lock per gerbang (WAJIB bersama web)

Papan kerja = state bersama; web membuat pemicu bisa banyak (2 admin, nanti + auto-run tenant). Tanpa lock, 2 batch bareng di gerbang sama = A0 saling timpa.

- V1: **mutex in-process per gerbang** + Cloud Run **`max-instances=1`** untuk service ini.
- Request kedua di gerbang yang sama = menunggu giliran (bukan ditolak).
- Multi-instance kelak → naik ke lease Firestore (bukan sekarang).

### 2.6 Writeback ke sheet tenant

Step baru pasca A8 (label mis. `[AddUser] Status update tenant`): isi kolom **`Status update`** di sheet pendaftaran tenant (match `ponsel + nama`), supaya client sheet-era dapat kabar. Best-effort (gagal writeback = catatan di status, bukan gagal row) — konsisten kontrak step existing.

### 2.7 Registry gerbang & tenant

Dua data konfigurasi:

1. **Daftar gerbang**: `{kode → ssid}` untuk 2A/2B/2D/2E (config env/registry; menggantikan konstanta `supportSpreadsheetID` di jalur adduser — action lain (PHK dll.) tetap pakai konstanta lama sampai giliran mereka).
2. **Registry tenant**: `VID Client → {nama display, gerbang, ssid sheet pendaftaran tenant}` — dipakai writeback (2.6) & jalur form tenant (2.9). Kandidat: extend tabel `Client` (auzCP1) yang sudah dipakai lookup A2, tambah kolom ssid sheet pendaftaran. Nambah tenant = nambah 1 baris registry, nol kode.

### 2.8 Mesin inti TIDAK diubah

A0→A8, 3 fase (lookup paralel → planning serial deterministik → row paralel `workers`), prefetch batch-level, rate limiter dua-ember (55/menit + backoff), dry-run, kontrak error, test penjaga (`TestAddUserCallsDoNotScalePerRow`, `TestAddUserDeterministic`) — semua dipertahankan. Delta hanya di pintu masuk (filter A0), pembungkus (loop gerbang, lock), dan ekor (writeback).

### 2.9 Jalur tenant (fase 2 — dirancang sekarang, dibangun nanti)

Form web tenant: submit data pegawai (tenant terkunci dari sesi) → Go tulis 1 baris ke **sheet pendaftaran tenant** (jalur input sah; TIDAK boleh tulis langsung ke `New User` — kolomnya formula, menulis = merusak) → formula spill ke `New User` (jeda detik–menit) → row antri dengan R kosong.

> **Konsekuensi bisnis (diterima user):** jalur tenant TIDAK full-auto. `Konfig apps` = keputusan admin → tiap pendaftaran tenant menunggu admin mengisi R (gerbang approval alami), baru terproses.

### 2.10 Web V1 (nol widget baru) & V2

- **V1 minimum**: tombol `Jalankan Pendaftaran` = `buttonAction` existing (RUN_ACTION → `PENDAFTARAN_PEGAWAI`). Admin isi `Konfig apps` di spreadsheet ATAU di grid web existing (grid SPREADSHEET editable + tersimpan ke sheet — dikonfirmasi user).
- **V1 opsional**: +3 page grid (2B/2D/2E) via web-builder (9-row block, SPREADSHEET content) supaya isi R semua gerbang dari web.
- **V2 (kalau kebutuhan muncul)**: content type `QUEUE` baru di web-dev — tabel gabungan 4 gerbang, filter tenant, status per-step live, retry per row. Nilai tambah kenyamanan, bukan fungsi.

## 3. Perubahan backend-go (delta konkret)

| # | Perubahan | Lokasi | Sifat |
|---|---|---|---|
| 1 | Config daftar gerbang (kode+ssid), env/registry | `internal/config` | baru |
| 2 | `RunAddUser` menerima ssid gerbang sebagai parameter (bukan konstanta) | `internal/pegawai/adduser*.go` | ubah signature, mekanis |
| 3 | Filter A0: `belum ☑ AND Konfig apps terisi` (kolom R = `nuColKonfig`) | `buildAddUserPaste` / `adduser_a0.go` | 1 titik, kecil |
| 4 | Loop gerbang urut + agregasi hasil per gerbang (lanjut walau 1 gerbang gagal; token expired tetap abort) | handler / orkestrator baru tipis | baru, tipis |
| 5 | Lock (mutex) per gerbang; deploy `max-instances=1` | handler/service | baru, kecil |
| 6 | Step writeback `Status update` ke sheet tenant (match ponsel+nama, via registry 2.7; best-effort) | `internal/pegawai` step baru | baru |
| 7 | Response JSON: hasil per gerbang per row per step | handler | ubah bentuk amplop |

Catatan: `supportSpreadsheetID` dipakai lintas action (PHK `Inactive`, `ClientInduk`) — parameterisasi HANYA jalur adduser dulu; jangan sentuh action lain.

## 4. Perubahan web (VTL web-builder)

1. Tombol `Jalankan Pendaftaran` di page Pendaftaran Pegawai (buttonAction existing; ganti/lengkapi tombol borongan sekarang).
2. (Opsional V1-A) 3 page baru `Antrian 2B/2D/2E`: 9-row block Web Screen, SPREADSHEET content menunjuk `New User` gerbang masing-masing + tombol yang sama. Web Menu node per page (L static, Display TRUE).
3. Tampilan hasil mengikuti kemampuan dispatcher sekarang (hasil muncul setelah batch selesai; tanpa progress live di V1).

## 5. Risiko & batasan yang diterima

- **Checkbox positional**: kolom ☑/R adalah kolom literal di samping kolom formula; kalau sumber tenant me-reorder/menghapus baris, penanda bisa bergeser. Asumsi operasional: append-only (praktik sekarang). Bukan regresi — perilaku existing.
- **Orang iseng mengisi R** = row terproses saat tombol ditekan; mitigasi: akses sheet/web terbatas admin (+ tenant hanya fase 2 dengan cek VID Client).
- **Limiter per-request**: 2 request bersamaan user sama = 2×55/menit; margin 55<60 + backoff + lock per gerbang menekan risikonya. Diterima V1.
- **Jeda spill** sheet tenant → New User (jalur tenant fase 2): detik–menit, tampil sebagai "menunggu" di UI.
- **Hasil single-shot** (tanpa progress live) di V1.

## 6. Testing

- Unit: filter tiket A0 (kombinasi ☑/R), loop multi-gerbang (gerbang kosong dilewati; gagal 1 gerbang lanjut), lock (2 request serentak gerbang sama = serial), writeback match ponsel+nama.
- Test penjaga existing tetap hijau: call-tidak-scale-per-row + deterministik.
- Dry-run per gerbang (pola existing, `dryRun`/`a0DryRun`) sebelum run basah pertama di 2B/2D/2E.

## 7. Di luar scope (eksplisit)

- Content type QUEUE web (V2) · tombol per-gerbang · paralel antar gerbang · form tenant + halaman status tenant (fase 2, sudah dirancang di 2.9) · sentralisasi AddUser (DITOLAK, 2.3) · auto-derive Konfig apps (DITOLAK — keputusan manusia) · parameterisasi gerbang untuk action selain adduser.
