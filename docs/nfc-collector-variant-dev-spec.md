# Dev Spec (Flutter) — `nfc_reader` variant `collector` (multi-scan accumulator, CNG tabung)

**Tanggal:** 2026-07-14
**Buat:** Flutter dev (renderer — extend widget `nfc_reader` yang SUDAH ADA).
**Mockup:** `src/component/04_Field_Runtime_System.jsx` — `ScanTarget` (pad), `ScanStrip` (strip), `CylinderRow` (baris hasil), `SectionCard` counter `n/target`, mismatch note non-blocking.
**Sifat:** VARIANT baru di type existing. `variant` kosong/absen = single-shot lama (nol regresi). 100% config-driven — reusable buat serialized-asset apa pun (tabung CNG, pallet, alat), bukan cuma CNG.

---

## 0. Konteks

`nfc_reader` sekarang = single-shot: 1 tap → baca 1 kartu → selesai (route / addToTable). Config live:

```json
{"type":"nfc_reader","text":"Baca Kartu NFC◆Dekatkan kartu ke perangkat◆Tap Kartu◆Membaca kartu...◆Berhasil◆Gagal membaca kartu◆NFC tidak tersedia","timeoutSeconds":20,"route":"cardResult","addToTable":"84214220504259//nfc-reader⭘retention◼4320⭘flag◼card-scan⭘index◼3★S⭘tablevid◼20342033315492⭘<1>◼card-scan⭘<2>◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶⭘<3>◼<NFC_RESULT>"}
```

Kasus CNG (driver): terima/serah N tabung, scan **per-ID berkali-kali**, daftar numpuk di layar, counter vs target, submit di akhir. = `collector`.

## 1. Perilaku collector

1. User tap **pad** (scanMode `pad`) atau **strip group** (scanMode `strip`) → sesi baca NFC (pakai state feedback existing: `text` seg 4 "Membaca..." → seg 5 sukses / seg 6 gagal / seg 7 unavailable, `timeoutSeconds` sama).
2. Sukses → tag ID **append ke daftar group itu** (baris: dot warna + ID mono + pill label). Baris terbaru di ATAS + highlight sebentar (mockup `fresh`).
3. Counter group naik: `n` atau `n/target` (kalo target ada).
4. `dedupe:"TRUE"` → ID yang sudah ada di daftar MANA PUN di widget ini → diabaikan (flash baris existing, jangan double).
5. `n ≠ target` (dan target ada) → tampil `mismatchText` — **warning doang, GAK ngeblok** (aturan mockup: "selisih jadi catatan, gak ngeblok").
6. **Capture:** daftar ID per group → join `★` → position form group itu (`◁24▷` = `A-1067★A-1051★A-1043`). Konsumsi = tombol RBT savesend page (pola standar: widget nangkep, tombol nulis).
7. `addToTable` di config keisi → TIAP scan sukses juga nulis row (perilaku write-mode lama, `<NFC_RESULT>` = tag ID). Kosong = capture-only. Independen dari capture.

## 2. Param

| param | fungsi | wajib |
|---|---|---|
| `variant` | `"collector"` (absen/kosong = single-shot lama) | ya |
| `scanMode` | `"pad"` = 1 tombol gede (ScanTarget); `"strip"` = tombol dashed kecil per group (ScanStrip) | ya |
| `groups` | `key◼judulSection◼labelScan◼pillLabel◼target◼position` per group, antar group `★`. **target boleh kosong** (`◼◼` berurutan) → counter tanpa `/target` | ya |
| `text` | 7 segmen feedback NFC — SAMA persis dgn single-shot (judul◆hint◆tap◆membaca◆sukses◆gagal◆unavailable). Seg 2 (hint) tampil di pad | ya |
| `title` / `badge` | header card (scanMode strip): judul + badge kanan (mis. "scan per-ID"). Opsional | — |
| `emptyText` | placeholder daftar kosong | ya |
| `mismatchText` | note selisih (muncul kalo target ada && n≠target) | — |
| `dedupe` | `"TRUE"`/`"FALSE"` | ya |
| `timeoutSeconds` | existing | ya |
| `addToTable` | opsional per-scan write (lihat §1.7) | — |

**`target`:** literal angka (`12`) ATAU token routeParams (`{doQty}`) — di-resolve sebelum render, non-numeric/kosong = treated kosong. Sumber produksi = page sebelumnya inject via `routeParams:"doQty◼<qtyField>"` (pola `taskVid◼{tnm}` SuratJalan). Schema DO/CNG belum ada → demo pakai literal.

**Kondisi (Isi/Kosong) = dari GROUP** — strip yang dipencet nentuin pill + position. Tag NFC cuma ID. Baca kondisi dari tag payload / lookup asset = **v2 EKSPLISIT** (butuh coll asset CNG / payload standar, dua-duanya belum ada — jangan bangun sekarang).

Warna pill/dot = theme (Isi=ok/emerald, Kosong=warn/amber-abu) — BUKAN config hex ([[feedback_status_3tier_relabel]]).

## 3. Layout

### scanMode `pad` (1 group)
```
╭ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╮
┆     (📶)           ┆   ← lingkaran accent + text seg-3
┆   Scan Tabung      ┆
┆   <text seg-2>     ┆   ← hint
╰ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╯
┌─────────────────────┐
│ judulSection   n/tgt│
│ ● A-1067        Isi │   ← pill = pillLabel, terbaru di atas+flash
│ ● A-1051        Isi │
│ (emptyText kalo 0)  │
└─────────────────────┘
   mismatchText (kalo beda)
```

### scanMode `strip` (N group, contoh 2)
```
● title            [badge]
judulSection-1        3/2
● A-1042           Isi
╭ 📶 labelScan-1 ─ ─ ╮   ← dashed strip
judulSection-2        2/2
● A-0820        Kosong
╭ 📶 labelScan-2 ─ ─ ╮
```

## 4. Resolved JSON (contoh REAL, siap sheet)

### 4a. Terima dari Distributor (pad, 1 group, target literal demo)
```json
{"type":"nfc_reader","variant":"collector","scanMode":"pad","text":"Baca Kartu NFC◆Tap tiap tabung isi yang diterima◆Scan Tabung◆Membaca kartu...◆Berhasil◆Gagal membaca kartu◆NFC tidak tersedia","groups":"in◼Diterima dari Distributor◼Scan Tabung◼Isi◼12◼24","emptyText":"Belum ada tabung. Scan buat mulai.","mismatchText":"Beda dari surat jalan (DO) — selisih jadi catatan, gak ngeblok","dedupe":"TRUE","timeoutSeconds":20}
```
→ IDs ★-join ke ◁24▷. Produksi: `12` → `{doQty}` + page list-DO navigate `routeParams:"doQty◼<qtyField>"`.

### 4b. Serah terima (strip, dual: isi keluar / kosong masuk)
```json
{"type":"nfc_reader","variant":"collector","scanMode":"strip","title":"CNG Tabung","badge":"scan per-ID","text":"Baca Kartu NFC◆Tempel kartu◆Tap Kartu◆Membaca...◆Terbaca◆Gagal◆NFC tidak tersedia","groups":"out◼Isi keluar◼Scan tabung isi◼Isi◼2◼24★in◼Kosong masuk◼Scan tabung kosong◼Kosong◼2◼25","emptyText":"Belum ada tabung","mismatchText":"Selisih jadi catatan, gak ngeblok","dedupe":"TRUE","timeoutSeconds":20}
```
→ isi ke ◁24▷, kosong ke ◁25▷. Submit page RBT contoh payload: `<25>◼◁24▷` (isi keluar) + `<26>◼◁25▷` (kosong masuk) — posisi field final nunggu schema CNG.

### 4c. Tanpa target (count doang)
```json
{"type":"nfc_reader","variant":"collector","scanMode":"pad","text":"Baca Kartu NFC◆Tap tiap tabung◆Scan Tabung◆Membaca...◆Terbaca◆Gagal◆NFC tidak tersedia","groups":"in◼Tabung discan◼Scan Tabung◼Isi◼◼24","emptyText":"Belum ada tabung","dedupe":"TRUE","timeoutSeconds":20}
```

## 5. Acceptance

1. `variant` absen → single-shot lama byte-identik (nol regresi, config live §0 tetep jalan).
2. Pad/strip sesuai `scanMode`; N group = N (daftar+counter+tombol).
3. Tiap scan sukses append baris (terbaru atas + flash); dedupe lintas group.
4. Counter `n` / `n/target`; target token `{...}` ke-resolve dari routeParams; kosong = no `/target`, no mismatch.
5. Mismatch note = warning only, submit page TETEP bisa.
6. Capture ★-join per group ke `◁position▷`; kebaca RBT savesend standar.
7. `addToTable` keisi → per-scan write jalan barengan capture.
8. Nol label/warna baked — semua config/theme.

---

**Referensi:** mockup `04_Field_Runtime_System.jsx` (ScanTarget/ScanStrip/CylinderRow/LineItem), widget live `nfc_reader` (single-shot), pola capture-position (SELECTABLE_BTN/stepper), routeParams (`rbt-route-params-dev-spec.md`). V2 (JANGAN dibangun sekarang): kondisi dari tag payload / asset lookup; target auto dari DO doc.
