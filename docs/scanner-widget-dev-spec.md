# Dev Spec — `scanner` widget

**Status:** LIVE (op1Screen proxy `18v3w5YJ...`, 2026-06-15). Widget tab `scanner@row198`. Dipakai di page `vertikaTeknoLokaciptaDriverScanLogin` (op1Screen 1001-1005). Reference JSON: `json/scanner.json`, `json/driver-runtime/p2-scan-login.json`. Pasangan: `noticeBar` (`docs/notice-bar-widget-dev-spec.md`).

Widget generic — scan QR kartu identitas → validasi → buka sesi → pindah page. Bukan driver-only (bisa scan pegawai/aset).

> ⚠️ **STANDALONE — JANGAN dibungkus `HORIZONTAL_ICON`.** Wrapper bikin ke-render jadi icon kecil (jalur icon-grid) + `◆` text ke-dump literal. Harus `{"type":"scanner",...}` langsung → kartu scanner fullscreen.

---

## Alur (urutan FIX)

```
scan QR (dapet nilai)
  → cek `table` di mana field(s) `search` cocok sama hasil-scan
      → KETEMU (valid)  → addToTable (tulis sesi) → route (pindah page)
      → GAK KETEMU      → tampil "QR salah" (slot ◆), TIDAK route
```

- `route` jalan **SETELAH berhasil** (ketemu + tulis). Gagal → diem, munculin "QR salah".
- **2 tabel beda peran:** `table`/`search` = BACA/validasi (cth `workforce`); `addToTable` = TULIS (cth `driver.session`).

---

## Field

| field | tipe | wajib | isi |
|---|---|---|---|
| `type` | string | ✅ | `"scanner"` |
| `url` | string | ✅ | URL icon scan |
| `text` | string (`◆`) | ✅ | label + pesan dialog + error. Slot: `judul◆Batal◆…◆sukses◆…◆OK◆QR salah◆pesan-salah◆Scan Lagi◆…`. Slot kosong = `◆◆`. **Error message: dev convert, kita cuma sediain slot.** |
| `width` | int | ✅ | **lebar tampilan scanner (px)** — box scan render segini |
| `height` | int | ✅ | **tinggi tampilan scanner (px)** — box scan render segini |
| `folder` | string | ✅ | folder simpan foto bukti |
| `filename` | string | ✅ | nama file foto bukti |
| `table` | string | ✅ | tabel yang dicek pas scan (validasi). Cth `workforce` |
| `search` | string | ✅ | nama **FIELD** yang dicocokin ke hasil-scan — **TANPA value** (value = nilai QR, di-handle renderer). Single: `VID`. Multi-field: `VID★status` (pisah `★`) |
| `flag` | string | ✅ | flag event (`driver-session-open`, dst) |
| `route` | string | ✅ | page tujuan SETELAH scan sukses |
| `opMode` | enum | ✅ | FIXED `"qr-single"` (sekarang QR-only) |
| `displayMode` | enum | ✅ | `"full-screen"` |
| `addToTable` | string (DSL) | ✅ | tulis event sesi. `<N>`=field index, `◀N|T7|fmt▶`=format tanggal |

> **Size:** scanner render seukuran `width`×`height` (rename dari `imgWidth`/`imgHeight` lama; field `width:100` layout lama DIBUANG). Foto bukti tetep disimpan via `folder`/`filename`.

### `search` — separator (PENTING, jgn ketuker konteks)
- `search` field-only, **TANPA value** (value = hasil scan, implicit).
- Multi-field dipisah **`★`** → `VID★status`.
- ⚠️ `★` ≠ `◆` (itu separator slot di field `text`) ≠ `◼`/`⭘` (itu where-clause value-form di `search` widget LAIN kaya gate DriverHome/LIST_ITEM_CARD). `scanner.search` = field-only `★`.
- **Multi-field value (OPEN):** buat `VID★status`, VID jelas cocok ke hasil-scan, tapi `status` nilainya dari mana (cth harus `active`)? Itu logic renderer/dev — perlu didefinisiin (atau QR bawa banyak nilai).

---

## Contoh

`json/scanner.json` — standalone `{"type":"scanner",...}`, `width`/`height` 600, `table:"workforce"`, `search:"VID"`.

---

## Catatan renderer

1. Register type `scanner`.
2. **JANGAN bungkus `HORIZONTAL_ICON`** — render layout sendiri (kartu fullscreen), ukuran `width`×`height`.
3. **Validasi:** scan QR → cari `table` di mana field `search` == hasil-scan. KETEMU → lanjut (addToTable + route). KOSONG → "QR salah" (slot ◆), gak route.
4. `search` = field-only, multi pisah `★`. Value field = hasil-scan (implicit).
5. Reuse parser `qr-single` (scan QR), TANPA geofence/selfie/gps (field-nya gak ada).
6. `addToTable` jalan setelah validasi sukses.
7. `url` (icon) mungkin gak kepake di standalone (viewport sendiri) — dev confirm.

---

## Pemakaian di P2 (DriverScanLogin)

| field | nilai |
|---|---|
| `table`/`search` | `workforce` / `VID` (validasi: vid terdaftar?) |
| `flag` | `driver-session-open` |
| `route` | `vertikaTeknoLokaciptaDriverHome` |
| `addToTable` | tulis `driver.session` |

Scan → cek workforce.VID == hasil-scan → ketemu → tulis sesi → DriverHome. Fresh-vs-resume dibedain POST-scan di DriverHome (gate). DriverScanResume (page kedua) DIBUANG.

---

## Open / LIKELY-TO-CHANGE

- `[TABLE_PATH]`/`[FOLDER]`/`[FILENAME]` — placeholder, user isi.
- `table`/`search` di-**bake** (`workforce`/`VID`) di template krn scanner 1 instance. Reuse (scan pegawai/aset) → parameterize `[TABLE]`/`[SEARCH]`.
- Multi-field value resolution (lihat atas) — dev definisiin.
- `opMode` FIXED `qr-single`; selfie/gps nyusul kalau perlu (tambah branch, jgn type baru).
- Renderer: validasi (baca table+search) + route-on-success = kemampuan yg harus ada di scanner dev.
