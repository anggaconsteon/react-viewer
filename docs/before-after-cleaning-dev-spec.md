# Dev Spec — Before/After Cleaning Workflow (VTL)

**Tanggal:** 2026-08-19
**Status:** DESIGN — nunggu review user sebelum build
**Sumber UX (terkunci):** `src/component/BeforeAfterCleaningWorkflow.jsx` (mockup lengkap + alasan tiap keputusan di header comment)
**Proxy:** `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg` · tenant `84214220504259` · vidtable `20342033315492`

---

## 0. Keputusan terkunci (user, 2026-08-19)

1. **Reuse 100% — nol widget baru.** Semua pakai widget existing (`TASKLIST`, `getImages1`, `lqrTextField1`, `3LineBorderForm`, `sendButtonGpsWithEvent`, `listCard`, `detailCard`, `timeline`, `workspaceHeader`, `autoNumber`).
2. **Copy, bukan evolve.** 5 checklist page standalone yang ada (`vertikaTeknoLokaciptaChecklist{PublicArea,Restroom,WorkArea,Pantry,Outdoor}`) **TIDAK disentuh** — tetap 1-submit. Before/after = **fitur baru terpisah**, 5 form-akhir baru yang niru layout+checklist mereka.
3. **Tingkat bukti dipakai** — QR = kuat, lokasi diketik manual = lemah (`lv`).
4. **Viewer before/after & stamp per-foto: SKIP.** Ringkasan = `detailCard` + 2 foto sanding. Stamp jam+GPS = level submit (satu form = satu momen), bukan per-foto.

## 1. Konsep inti

**1 kunjungan = 1 dokumen, ditulis 2× di 2 momen waktu.** Foto awal jam 08:14 = fakta jam 08:14; ditahan sampai submit akhir jam 08:47 = bohong soal waktu. Makanya dipecah 2 form dengan jeda kerja nyata (25–40 mnt) di antaranya.

```
Beranda ─(Scan QR)→ Form 1 AWAL: foto awal + ket → KIRIM  (kunjungan DIBUAT, status open)
   ⏳ jeda kerja nyata; app boleh ditutup
Beranda: kartu "lanjut →" ─(route by kategori)→ Form 2 AKHIR: checklist + foto akhir → KIRIM  (kunjungan DITUTUP, status closed)
   → Ringkasan: AWAL | AKHIR + timeline
```

## 2. Data model — koleksi `84214220504259//cleaning_visit` (keyed)

1 doc = 1 kunjungan. Field char-code (ikut konvensi addToEvent + reuse):

| grup | field | tipe | ditulis | makna |
|---|---|---|---|---|
| id | `key` | str | Form 1 | id kunjungan (auto) |
| | `nm` | str | Form 1 | No. kunjungan (`autoNumber`) |
| status | `st` | str | Form 1→2 | `open` → `closed` |
| kategori | `cat` | str | Form 1 | `restroom`/`pantry`/`public-area`/`work-area`/`outdoor` (dari QR) |
| route | `rt` | str | Form 1 | route Form-Akhir kategori ybs (dihitung dari `cat` saat create) |
| lokasi | `lt` | str | Form 1 | ruangan (dari QR / ketik manual) |
| bukti | `lv` | str | Form 1 | `strong` (QR) / `weak` (manual) |
| awal | `ia` | arr | Form 1 | foto awal (1–5 url) |
| | `tsa` | str | Form 1 | jam awal (ts) |
| | `dsa` | str | Form 1 | keterangan awal |
| akhir | `ib` | arr | Form 2 | foto akhir (1–5) |
| | `tsb` | str | Form 2 | jam akhir |
| | `dsb` | str | Form 2 | keterangan akhir |
| | `ck` | str | Form 2 | hasil centang (packed, pola report-checklist `task☆status`) |
| org | `cv/cn` | str | Form 1 | creator (ref `Settings!$B$1/$B$2`) |
| | `av/an/sv/sn` | str | Form 1 | CC/site (ref `'op1'!$K$7/$L$7/$K$8/$L$8`) |
| | `t/ts` | str | keduanya | epoch + tz (`System!$B$3`) |

**auzSettings:** daftarin `84214220504259//cleaning_visit` di kolom J (registry). Ref via `auzSettings!$J$<n>` di DSL, jangan bake literal.

## 3. Page inventory — 8 page baru (semua genericize, nol widget baru)

Route prefix: `vertikaTeknoLokaciptaCleaning…`

| # | Route | Isi (widget existing) |
|---|---|---|
| 1 | `CleaningHome` (Beranda) | `workspaceHeader` + tombol Scan QR (route→CleaningStart) + `listCard` filter `st◼open`, route item → `{rt}` bawa key |
| 2 | `CleaningStart` (Form Awal) | `lqrTextField1` (gate QR, `lv` set dari mode) + fallback manual (TXF+chip kategori) + `autoNumber` + `getImages1` (awal, max 5) + `3LineBorderForm` (ket awal) + `sendButtonGpsWithEvent` → **addToEvent** create |
| 3–7 | `CleaningRestroom` / `CleaningPantry` / `CleaningPublicArea` / `CleaningWorkArea` / `CleaningOutdoor` (Form Akhir ×5) | banner "foto awal terkunci" (`text` dari doc) + `TASKLIST`×n (task kategori — **copy dari page checklist existing**) + `progressBar` + `getImages1` (akhir) + `3LineBorderForm` (ket akhir) + `sendButtonGpsWithEvent` → **updateEventRow** close |
| 8 | `CleaningSummary` (Ringkasan) | `detailCard` (baris data + rentang kerja) + 2 foto sanding (AWAL\|AKHIR) + `timeline` (jejak 2 catatan) |

**Task per kategori** (copy verbatim dari page checklist existing — sudah beda-beda, gak diapa-apain):
- Restroom: kloset/urinoir · wastafel+cermin · isi tissue/sabun · pel lantai · buang sampah · pewangi
- Pantry: meja+kursi · peralatan (microwave/dispenser) · sink+keran · isi sabun · pel · sampah
- Public: lantai lobi · resepsionis · kaca lift · sofa · sampah
- Work: lantai · meja/partisi · sampah · kaca dalam
- Outdoor: halaman/parkir · saluran air · sampah · siram tanaman · asbak

## 4. Wiring — siklus create → route → close

### 4.1 Form Awal submit — `addToEvent` (create)
Tombol `sendButtonGpsWithEvent`, helper Q = addToEvent (genericize, ref semua):
```
auzSettings!$J$<n>(=//cleaning_visit)⭘r◼4320⭘tablevid◼20342033315492⭘st◼open⭘cat◼<catFromQR>⭘rt◼<routeFromQR>⭘nm◼◁<posAutoNumber>▷⭘lt◼◁<posLokasi>▷⭘lv◼<strong|weak>⭘ia◼◁<posFotoAwal>▷⭘dsa◼◁<posKetAwal>▷⭘tsa◼◀2|T{System.B3}|Ddd MMM yyyy HH:mm▶⭘cv◼{Settings.B1}⭘cn◼{Settings.B2}⭘av◼{op1.K7}⭘an◼{op1.L7}⭘sv◼{op1.K8}⭘sn◼{op1.L8}⭘t◼◀2▶⭘ts◼◀2|T{System.B3}|…▶
```
- `cat` & `rt` diturunkan dari QR payload (QR bawa kategori). **[VERIFY builder]** cara `lqr` nyalurin kategori QR → dua field ini (kemungkinan lewat posisi hasil scan / locationNamePosition; atau QR payload multi-field).
- `rt` = `vertikaTeknoLokaciptaCleaning` + PascalCase(cat). Disimpan di doc biar Beranda tau route tujuan tanpa mapping hardcode.

### 4.2 Beranda — `listCard` route by field
`listCard` keyed baca `//cleaning_visit` where `st◼open` → tiap kartu route ke nilai field `rt`, bawa `key`.
- **[VERIFY builder]** `listCard`/`listMultiplePanelCard` dukung route dari **field doc** (`{rt}`) + `routeParam` bawa `key`. Kalau route harus literal, fallback: 1 kartu → route generik + `routeParam key◼{key}⭘cat◼{cat}`, lalu Form-Akhir generik… (TAPI itu balik ke checklist dinamis — hindari). Prefer field-driven route.

### 4.3 Form Akhir submit — `updateEventRow` (close)
Tombol `sendButtonGpsWithEvent`, helper R = updateEventRow (cari doc by key, pola attendanceCorrection):
```
auzSettings!$J$<n>(=//cleaning_visit)⭘tablevid◼20342033315492⭘search◼key★<keyDariRoute>⭘st◼closed⭘ib◼◁<posFotoAkhir>▷⭘ck◼<packed centang task☆status>⭘dsb◼◁<posKetAkhir>▷⭘tsb◼◀2|T{System.B3}|…▶
```
- `key` kunjungan dibawa dari Beranda via routeParam → dipakai di `search◼key★<…>`.
- `ck` packing centang = pola report-checklist (`task☆status`, pisah item). Reuse token TASKLIST.
- addToTable di tombol ini boleh kosong (semua ke event/visit doc).

### 4.4 Ringkasan
`detailCard` keyed baca 1 doc `//cleaning_visit` by key → tampil `lt`, `cat`, jml foto (`ia`/`ib` count), `lv` (kuat/lemah), rentang `tsa`→`tsb`, centang `ck`. 2 foto sanding = `ia[0]` & `ib[0]`. `timeline` = 2 titik (`tsa` awal, `tsb` akhir).

## 5. Bukti kuat/lemah (`lv`)
- Gate QR sukses → `lv:strong`. Fallback manual (QR rusak): worker ketik lokasi + pilih kategori chip → `lv:weak`, GPS tetap ikut. Ringkasan + kartu tandai beda (warna). Reuse pola `location opMode` + flag.

## 6. Reuse map (bukti nol widget baru)
| Kebutuhan | Widget existing |
|---|---|
| Header form | `workspaceHeader` |
| Gate QR + manual | `lqrTextField1` + TXF/chip |
| No. kunjungan | `autoNumber` |
| Foto awal/akhir 1–5 | `getImages1` (`GET_IMAGES` max) |
| Checklist + progress | `TASKLIST` + `progressBar` |
| Keterangan | `3LineBorderForm` |
| Submit create/close | `sendButtonGpsWithEvent` (`addToEvent`+`updateEventRow` slot udah ada) |
| List kunjungan open | `listCard` |
| Ringkasan baris | `detailCard` |
| Jejak | `timeline` |

## 7. [VERIFY builder] — 3 hal dicek pas build (bukan blocker desain)
1. `lqr` QR bisa nyalurin **kategori** ke field (buat `cat`/`rt`) — atau kategori diisi manual di Form Awal.
2. `listCard` route item bisa dari **field doc** (`{rt}`) + `routeParam key◼{key}`.
3. `updateEventRow` `search◼key★<key>` nemuin doc yang bener (pola attendanceCorrection pakai `search◼vid★<vid>`).

Kalau salah satu gak dukung: fallback di §4.2 (tetap jalan, cuma kurang elegan). Nol-nya butuh widget baru tetap kejaga.

## 8. Urutan build (setelah spec di-approve)
1. auzSettings: daftar `//cleaning_visit`.
2. Page `CleaningStart` (Form Awal) + `CleaningHome` (Beranda) — bikin create + list dulu, test kunjungan kebikin & muncul di beranda.
3. 1 page Form Akhir (mis. `CleaningRestroom`) — copy checklist ChecklistRestroom + wiring close. Test 1 siklus penuh.
4. 4 page Form Akhir sisanya (copy per kategori).
5. `CleaningSummary`.
6. Registrasi Plug + menu entry.
7. Verifikasi live tiap page (col D resolved, JSON valid, no `#N/A`/`[TOKEN]`).

## 9. Not doing (v1)
- Viewer before/after ber-tab + swipe (pakai 2 foto sanding).
- Stamp jam+GPS per-foto (pakai stamp level submit).
- Auto-close kunjungan telantar (mockup: sistem gak nebak; kunjungan open dibiarin).
- Approval/review (kirim = terkunci).

---
**Ref:** `docs/tasklist-status-separator-dev-spec.md` (☆ separator centang), page checklist existing rows op1Screen (task per kategori), memory `reference_addToEvent_pattern` / `reference_updateEventRow_pattern` / `reference_route_params`.
