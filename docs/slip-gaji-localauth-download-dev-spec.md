# Slip Gaji — Local Auth (LIST_CARD gate) + Download PDF (Dev Spec)

**Tanggal:** 2026-08-13
**Buat:** dev Flutter (renderer)
**Status:** PROPOSED (nunggu dev)
**Konteks / Konsumen pertama:**
- Gate: `vertikaTeknoLokaciptaSlipGaji` — LIST_CARD (op1Screen row 1362). Tap kartu slip → biometric → baru buka detail.
- Download: `vertikaTeknoLokaciptaSlipGajiDetail` (row 1365) — tombol di bawah DOC_VIEWER (row 1369). Unduh PDF di `path` ke HP.
**Referensi:** `lib/widget/biometric_gate.dart` (COMMITTED ca7fa54), docs/docviewer-widget-HANDOFF.md, memory project_slip_gaji_mobile_pages.

---

## 1. Kenapa
- Slip gaji = dokumen sensitif. User minta **auth lokal pas buka detail** (keputusan user 2026-08-13, terkunci): tap kartu slip → biometrik/PIN → baru render PDF.
- `biometric_gate.dart` **udah ada** (ca7fa54) TAPI belum diwire ke **LIST_CARD** — gate cuma komponen lepas, belum kepanggil dari tap kartu.
- Download: renderer **belum punya** aksi unduh file-URL ke HP (dikonfirmasi user 2026-08-13: "engga punya, harus buat"). `sharePdfKeyed` = type PRN yg GENERATE pdf dari data grid, BUKAN download file URL yg udah jadi → gak kepake.
- **Gate ditaruh di LIST_CARD, bukan di DOC_VIEWER** (keputusan user 2026-08-13). Sudah dites: naruh `biometrik` di DOC_VIEWER TIDAK di-honor renderer.

---

## 2. Konsep
Dua fitur, dua bagian renderer:
- **(A) BIOMETRIC GATE generik** — bungkus *action* sebuah komponen. Kalau `biometrik` truthy, sebelum action jalan (LIST_CARD → navigate route), panggil `biometric_gate`. Sukses → action lanjut. Gagal → batal, tampil pesan. Wire pertama: **LIST_CARD tap**. Desain reusable (nanti bisa di RBT/tombol lain).
- **(B) DOC_DOWNLOAD** — tombol baru: ambil PDF dari `url` → simpan ke HP. Android → folder Downloads; iOS → share-sheet "Save to Files" (iOS gak punya folder Downloads publik). Opsional ikut gate biometric (reuse A).

---

## 3. Kontrak field

### 3.1 Biometric gate — 3 field, nempel di komponen ber-action (v1: LIST_CARD)
Tambahan di JSON LIST_CARD (semua opsional; absent = perilaku lama, gate mati):
```json
{
  "type":"LIST_CARD", "...": "...(field listCard existing)...",
  "biometrik":"true",
  "biometrikPin":"true",
  "biometrikText":"Verifikasi untuk buka slip gaji◆Akses Ditolak◆Biometrik gagal. Slip tidak dibuka."
}
```
| Field | Wajib | Nilai | Efek |
|---|---|---|---|
| `biometrik` | aktivator | `"true"` (string; bool `true` juga lolos) | absent/`"false"` → gate MATI, tap navigate langsung (perilaku lama). truthy → gate NYALA. |
| `biometrikPin` | opsional | `"true"` | izinkan PIN/pola/passcode device (`biometricOnly:false`). absent → biometrik-saja. |
| `biometrikText` | opsional | 1 string **◆-separated**: `reason◆failTitle◆failMessage` | teks prompt OS + dialog gagal. Part blank/kurang → default ID (lihat bawah). |

**Default `biometrikText` per index** (biometric_gate.dart:63, jangan diubah):
- `[0]` reason → `Verifikasi identitas Anda`
- `[1]` failTitle → `Autentikasi Gagal`
- `[2]` failMessage → `Verifikasi biometrik gagal. Coba lagi.`

**Perilaku wire di LIST_CARD:**
```
onTap kartu:
  if (biometrik truthy):
     ok = await biometricGate(reason, biometrikPin, failTitle, failMessage)
     if (!ok) return            // batal, JANGAN navigate
  navigate(route, routeParams)   // action lama, gak berubah
```
- Gate mbungkus **navigasi**, bukan render kartu. Kartu tetap tampil normal di list; auth baru pas di-tap.
- HP tanpa kunci layar / tanpa biometrik → ikut aturan `biometric_gate.dart` yg udah ada (jangan bikin cabang baru).

### 3.2 DOC_DOWNLOAD — tombol unduh file-URL
```json
{
  "type":"DOC_DOWNLOAD",
  "url":"{slipPath}",
  "fileName":"Slip Gaji {prdL}.pdf",
  "mode":"save",
  "icon":"download",
  "text":"Unduh PDF",
  "biometrik":"",
  "biometrikPin":"",
  "biometrikText":""
}
```
| Field | Wajib | Nilai | Efek |
|---|---|---|---|
| `url` | ya | URL file (support token routeParam `{slipPath}`) | file yg diunduh. |
| `fileName` | opsional | nama simpan (support token `{prdL}` dst) | default: ambil basename dari `url`. |
| `mode` | opsional | `save` (default) / `share` | `save` → Android Downloads / iOS Files. `share` → share-sheet OS. |
| `icon` | opsional | nama ikon | ikon di tombol. |
| `text` | opsional | label tombol | default "Unduh". Nol hardcode di Flutter. |
| `biometrik`/`biometrikPin`/`biometrikText` | opsional | sama §3.1 | gate download pakai mekanisme A. absent → langsung unduh. |

**Perilaku:**
```
tap tombol:
  if (biometrik truthy): gate dulu (reuse A); gagal → batal
  fetch(url) → simpan:
     Android: MediaStore/Downloads (scoped storage)
     iOS: share-sheet → "Save to Files" (mode save & share sama2 lewat sini di iOS)
  progress indicator pas unduh; sukses → toast "Tersimpan" (teks dari config kalau ada, else default ID)
```

---

## 4. Contoh resolved (real ids konsumen-pertama)

**A — LIST_CARD slip gaji + gate** (`vertikaTeknoLokaciptaSlipGaji`, row 1362):
```json
{"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//slip_gaji","search":"vid◼{userVid}","conditions":"","sortField":"prds","sortDir":"desc","groupBy":"","groupLabels":"","lead":"","title":"<prdL>","subtitle":"<tyL> · terbit <iss>","meta":"<tn>","badgeField":"ty","badgeMap":"gaji◼Gaji◼ok★makan◼Uang Makan◼neutral","trailing":"","trailingLabel":"","stats":"Slip◼","searchFields":"prdL◆tyL","route":"vertikaTeknoLokaciptaSlipGajiDetail","routeParams":"sg◼{sg}⭘slipPath◼{path}","text":"Slip Gaji◆Dokumen dari perusahaan Anda◆slip◆Cari periode◆Belum ada slip gaji","biometrik":"true","biometrikPin":"true","biometrikText":"Verifikasi untuk buka slip gaji◆Akses Ditolak◆Biometrik gagal. Slip tidak dibuka."}
```

**B — DOC_DOWNLOAD di detail** (`vertikaTeknoLokaciptaSlipGajiDetail`, taruh setelah DOC_VIEWER row 1369):
```json
{"type":"DOC_DOWNLOAD","url":"{slipPath}","fileName":"Slip Gaji {prdL}.pdf","mode":"save","icon":"download","text":"Unduh PDF","biometrik":"","biometrikPin":"","biometrikText":""}
```
> `{slipPath}` udah dioper dari list via routeParams `slipPath◼{path}`. `{prdL}` juga bisa dioper kalau mau nama file rapi (tambah `prdL◼{prdL}` di routeParams list).

---

## 4b. UI / Layout
```
LIST (tap kartu)                     DETAIL
┌──────────────────────────┐         ┌──────────────────────────┐
│ ▤ Juli 2026        [Gaji] │  tap    │ ← Slip Gaji · Juli 2026   │
│   terbit 5 Agu 2026     › │ ──────▶ │ Terbit·Vendor·Tipe        │
└──────────────────────────┘   │      │ ⓘ AUTSORZ apa adanya      │
        │                       │      │ ┌─ PDF (DOC_VIEWER) ──┐   │
        ▼ biometrik NYALA       │      │ │  ...render inline...  │   │
   ╔══════════════════╗         │      │ └───────────────────────┘   │
   ║ 🔒 Verifikasi     ║  gagal  │      │ [ ⬇ Unduh PDF ]           │
   ║  sidik jari/PIN   ║ ──X──── ┘      └──────────────────────────┘
   ╚══════════════════╝ sukses→navigate
```

---

## 6. Sheet-side (builder — aku, SESUDAH renderer siap)
Ikut `op1screen-genericize-widget`. **Config-ahead-of-renderer: renderer landing DULU, config nyusul 1 PR** (biar gak DROP).
- **Gate:** listCard shared gak boleh dikotori. Bikin **varian `listCardBiometric`** (= template listCard + 3 field biometrik) → dipakai row 1362. Atau, kalau dev bikin `biometrik` dibaca generik di SEMUA LIST_CARD (default absent = mati, backward-compatible), cukup extend template listCard + resolver — konfirmasi mana yg dev pilih.
- **Download:** widget baru `docDownloadBtn` (template DOC_DOWNLOAD) → 1 row setelah docViewer di detail. Tambah `slipPath◼{path}` (+ opsional `prdL◼{prdL}`) di routeParams list — `slipPath` udah ada.

---

## 7. Deliverable dev (Flutter)
1. **Wire `biometric_gate` ke LIST_CARD onTap** — baca `biometrik`/`biometrikPin`/`biometrikText`, gate navigasi. Absent = perilaku lama persis. (§3.1)
2. **Desain gate reusable** — helper yg bisa dipanggil dari komponen ber-action lain (biar DOC_DOWNLOAD & RBT nyusul gampang). (§2)
3. **Widget baru `DOC_DOWNLOAD`** — fetch url → save (Android Downloads / iOS Files) / share; progress + toast; support token routeParam di `url`/`fileName`; opsional gate biometric. (§3.2)
4. **Nol string hardcode** — semua label/pesan dari config `text`/`biometrikText`, fallback default ID.

## 8. Dictionary (field baru)
| Field | Tab | Tipe | Default | Makna |
|---|---|---|---|---|
| `biometrik` | widget_props | string-bool | absent (mati) | aktivator gate biometric komponen |
| `biometrikPin` | widget_props | string-bool | absent (biometrik-saja) | izinkan PIN/pola/passcode |
| `biometrikText` | widget_props | string ◆×3 | default ID | reason◆failTitle◆failMessage |
| `url` (DOC_DOWNLOAD) | widget_props | string/URL | — | file yg diunduh |
| `fileName` | widget_props | string | basename(url) | nama simpan |
| `mode` (DOC_DOWNLOAD) | widget_props | enum save/share | save | tujuan simpan |

## 9. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| Wire biometric_gate → LIST_CARD onTap | dev Flutter | PROPOSED (lagi dikerjain) |
| Gate reusable helper | dev Flutter | PROPOSED |
| Widget DOC_DOWNLOAD (fetch url→save) | dev Flutter | PROPOSED |
| Config biometrik di listCard row 1362 | builder | ✅ APPLIED config-ahead (D1362 literal, tipe tetap LIST_CARD) |
| Config DOC_DOWNLOAD row 1370 detail + extend assembler + routeParams `prdL` | builder | ✅ APPLIED config-ahead |
| Field ke dictionary | builder | PROPOSED |

> **Config udah nangkring di op1Screen (2026-08-13).** Begitu 3 baris dev di atas kelar → langsung jalan tanpa sentuh sheet. Renderer harus **DROP** tipe tak dikenal `DOC_DOWNLOAD` dgn aman (jangan crash page) selama belum diimplement.

## 10. v1 scope & Not Doing
**v1:** gate di LIST_CARD (tap→detail) + DOC_DOWNLOAD save. 
**Not Doing (dan kenapa):**
- Gate di DOC_VIEWER — user nolak, mesti di listCard. (2026-08-13)
- `sharePdfKeyed` buat unduh — salah alat (generate pdf, bukan download URL).
- Re-auth per widget dalam 1 sesi — biar `biometric_gate` yg atur sesi; jangan bikin aturan baru.
- Silent download tanpa UI di iOS — OS gak izinin; pakai share-sheet/Files.

## 11. Acceptance
- [ ] LIST_CARD `biometrik:"true"` → tap kartu munculin prompt biometrik; sukses → buka detail; gagal → tetap di list, pesan `failMessage`.
- [ ] `biometrik` absent/`"false"` → tap navigate langsung (nol regresi page lain).
- [ ] `biometrikPin:"true"` → PIN/pola device diterima; absent → biometrik-saja.
- [ ] `biometrikText` kurang part → default ID kepasang per index.
- [ ] DOC_DOWNLOAD tap → file di `url` kesimpan (Android Downloads / iOS Files); progress + toast sukses.
- [ ] `url` token routeParam ke-resolve (`{slipPath}`).
- [ ] Nol string hardcode di Flutter (semua dari config).

## 12. Asumsi & risiko
- [ ] `biometric_gate.dart` API bisa dipanggil sinkron dari onTap (return bool sukses) — belum baca isinya, asumsi dari tabel field.
- [ ] `biometrik` mau dibaca **generik di semua LIST_CARD** (default mati) ATAU cuma via varian `listCardBiometric` — **dev pilih**, nentuin sheet-side.
- [ ] iOS: `mode:"save"` jatuh ke share-sheet "Save to Files" (gak ada Downloads publik) — dikonfirmasi ke dev.
- [ ] Token routeParam di `url`/`fileName` DOC_DOWNLOAD di-resolve sama kayak `source` DOC_VIEWER (udah kebukti resolve di source).

**Referensi:** `lib/widget/biometric_gate.dart:63` (default text) · ca7fa54 · docs/docviewer-widget-HANDOFF.md · memory project_slip_gaji_mobile_pages.
