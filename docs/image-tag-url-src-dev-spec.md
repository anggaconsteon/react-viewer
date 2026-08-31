# `<IMAGE>` PDF tag — tambah sumber `src` (URL), asset bundle TETAP (Dev Spec)

**Tanggal:** 2026-08-03
**Buat:** dev Flutter (renderer PDF — parser tag `<IMAGE>` di variant `share-pdf`)
**Status:** PROPOSED (nunggu dev — additive, backward-compatible)
**Konteks / Konsumen pertama:** footer PDF share-pdf — P3 TitikDetail (`op1Screen!D1002`) + batch "Cetak Semua QR" (`D988`). Logo "powered by āutsorz".
**Referensi:** `docs/share-pdf-widget-dev-spec.md` (§3c tag `<IMAGE>`), `docs/share-pdf-DEV-HANDOFF.md`, `docs/titik-patroli-app-first-location-dev-spec.md`

---

## 1. Kenapa

Footer PDF pakai `<IMAGE asset='powered_by_autsorz'/>` = PNG dari **asset bundle Flutter**. Ganti logo = harus bundle ulang + redeploy app. Owner minta bisa taruh **URL** (Firebase Storage) langsung di config → ganti logo = edit sheet, **nol redeploy**.

**Keputusan user (2026-08-03, terkunci):** URL = **TAMBAHAN**, bukan pengganti. Sumber `asset` (bundle) **WAJIB tetap jalan apa adanya** — jangan diubah/dihapus. Share-pdf konteks online (share ke WA) → URL aman; offline degrade OK.

## 2. Konsep

Tag `<IMAGE>` dapat **atribut sumber baru `src`** (URL http/https). Renderer resolusi gambar:

1. Ada `src` → **fetch bytes** dari URL → decode → embed ke PDF.
2. `src` gagal (offline / 404 / timeout) **DAN** ada `asset` → fallback ke asset bundle.
3. Cuma `asset` (no `src`) → **perilaku LAMA persis** (bundle). Nol regresi.
4. Dua-duanya kosong / semua gagal → skip diam-diam (baris footer ilang, jangan crash) — sama seperti sekarang.

App sudah render Firebase image di tempat lain (GET_IMAGES, banner BNR) → mekanik fetch+decode sudah ada, tinggal dipakai di sink PDF.

## 3. Kontrak atribut `<IMAGE>`

| Atribut | Isi | Wajib | Catatan |
|---|---|---|---|
| `src` | URL `http(s)://…` | — | **BARU.** Sumber utama. Absen → pakai `asset`. Boleh mengandung `&`/`?`/`%` (query Firebase) — parser jangan patah di `&` |
| `asset` | key bundle Flutter | — | **TIDAK BERUBAH.** Fallback kalau `src` gagal; sumber tunggal kalau `src` absen |
| `align` | `center`/`left`/`right` | — | existing (hasil tes 2026-07-23 harus jalan) |
| `width` / `height` | pt (angka) | — | existing; rasio asli dijaga kalau cuma satu diisi |

Prioritas resolusi: **`src` → (gagal) `asset` → (gagal) skip**. Tidak ada atribut baru selain `src`.

## 4. Contoh resolved (footer share-pdf)

Template baris footer (single P3 + batch, IDENTIK) — cuma tag `<IMAGE>` yang berubah:

```
<TEXT align='center' bold='true' color='#1FA0A6'>{{ln}}</TEXT>;<FEED/>;<QRCODE data='{{li}}' align='center'/>;<FEED/>;<IMAGE src='https://firebasestorage.googleapis.com/v0/b/otq-01-ase2/o/c%2Fautsorz%2Fimage%2Fpowered-by-autsorz-1000x120.png?alt=media&token=cfd427f3-67df-4630-96f0-ab53a9895265' align='center' height=14/>;
```

Logo 1000×120 → `height=14` pt → lebar ≈ 117 pt (rasio 8.33:1, dijaga).

**Opsi dengan fallback offline** (dua sumber sekaligus):
```
<IMAGE src='https://…powered-by-autsorz-1000x120.png?alt=media&token=…' asset='powered_by_autsorz' align='center' height=14/>
```
→ online pakai URL; offline pakai bundle. Owner pilih; renderer wajib support dua-duanya.

## 5. Deliverable dev (Flutter)

1. Parser `<IMAGE>`: baca atribut `src` (selain `asset`). Atribut URL boleh berisi `&`/`?`/`%` — jangan ke-split.
2. Resolver gambar (di sink PDF): `src` ada → HTTP GET bytes → decode → `MemoryImage`/`pw.MemoryImage`; timeout wajar (mis. 5s) → gagal → fallback `asset` → gagal → skip.
3. `asset`-only path **NOL sentuhan** — regresi = 0.
4. Hormati `align` + `width`/`height` untuk kedua sumber (URL & asset) sama.
5. Berlaku di **mode single & grid** (footer sama). Kalau grid banyak kartu → fetch URL **sekali, cache**, reuse ke semua kartu (jangan N× download logo yang sama).

## 6. Sheet-side (builder — setelah renderer live)

Swap `[TEMPLATE]` (col U) di **U1002** (single) + **U988** (batch) dari `<IMAGE asset='powered_by_autsorz'/>` → `<IMAGE src='<URL>'/>` (atau `src`+`asset` fallback). Cuma 2 cell; D auto-recompute (formula). **JANGAN swap sebelum renderer handle `src`** — kalau belum, footer ilang (unknown attr di-skip).

## 7. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| `<IMAGE>` `src` URL fetch + fallback asset | dev Flutter | PROPOSED |
| Swap U1002/U988 ke `src` | builder | NUNGGU renderer |
| CF / field baru | — | NOL |

## 8. Not Doing (dan kenapa)

- **Hapus/ubah `asset`** — TIDAK. Bundle tetap sumber sah (offline-safe). URL cuma tambahan.
- **Cache URL persist ke disk antar-sesi** — nggak perlu; cache in-memory per render (per PDF) cukup.
- **Retry/backoff URL** — 1× fetch + timeout → fallback. Jangan bikin pipeline retry.
- **Auth header ke Firebase** — URL sudah bawa `token` download publik; jangan tambah auth.

## 9. Acceptance

- [ ] `<IMAGE src='<firebase-url>' height=14/>` → logo tampil di PDF (single & grid), center, rasio benar.
- [ ] `<IMAGE asset='powered_by_autsorz'/>` (tanpa `src`) → **sama persis seperti sekarang** (regresi 0).
- [ ] `src`+`asset` bareng, online → URL dipakai; offline → asset dipakai.
- [ ] `src` gagal & tanpa `asset` → footer skip, PDF tetap kebentuk (no crash).
- [ ] URL dengan `&token=…` ke-fetch utuh (parser gak patah di `&`).
- [ ] Grid `4x4`: logo di 16 kartu, URL di-fetch **1×** (cache), bukan 16×.

## 10. Asumsi & risiko

- [ ] Token URL Firebase = download-token publik (bisa dicabut). Kalau dicabut → footer ilang / fallback asset. Owner jaga URL tetap valid.
- [ ] Render PDF butuh internet saat `src` dipakai; offline tanpa `asset` fallback → footer kosong (by design).
- [ ] Package HTTP fetch = yang app sudah pakai (image loader existing); anggap sudah ada, bukan dependency baru.

**Referensi:** `share-pdf-widget-dev-spec.md` · `share-pdf-DEV-HANDOFF.md` · `titik-patroli-app-first-location-dev-spec.md`
