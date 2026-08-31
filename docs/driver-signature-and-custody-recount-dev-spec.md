# Signature Pad simpan-ke-DB + Custody recount partial-reset (Dev Spec)

**Tanggal:** 2026-08-07
**Buat:** dev Flutter (renderer).
**Konteks / Konsumen pertama:** galon VTL (tenant `20342033315492`). DeliveryWorkspace(681) `SIGNATURE_PAD`, CustodyCount(635)/CustodyReveal(645).
**Status:** PROPOSED.
**Referensi:** `docs/widget-docs/signaturePad.md`, memory `project_driver_runtime_widgets`.

---

## Case 1 — Signature pad harus ke-insert DB (format & wiring)

### Format: **IMAGE (PNG), simpan sebagai URL Firebase Storage** — BUKAN base64/raw
Tanda tangan = goresan → render jadi **PNG**. Simpan pola **sama kaya foto** (`GET_IMAGES`): upload PNG ke Firebase Storage → simpan **URL/path** di field. JANGAN base64 inline (bikin doc Firestore bengkak + mahal query). Alasan pilih image (bukan vektor/points): bukti serah-terima harus bisa **ditampilin** di Surat Jalan / invoice / audit — URL image gampang di-render.

### Kondisi sekarang (gap)
`SIGNATURE_PAD` @DeliveryWorkspace(684): `optional:true, position:3, writeField:"sig"`, **F=FALSE (disable)**. Masalah:
1. **Position tabrakan** — `position:3` sama dengan `GET_IMAGES`(686) `position:3`. Signature butuh position UNIK.
2. **Belum ke-wire** ke submit — `sendButtonGpsWithEvent`(688) addToEvent cuma referensiin `i◼◁3▷` (foto) + `d◼◁10▷` (catatan). Signature belum ada di updateEventRow/addToEvent.
3. Disable.

### Yang dibutuhin
1. **Upload:** pastiin `SIGNATURE_PAD` renderer upload PNG ke Storage + balikin URL (kaya GET_IMAGES). Kalo perlu param `folder`/`filename`/`imageParameter` kaya GET_IMAGES → tambahin ke config. **KONFIRMASI dev Flutter:** signaturePad sekarang output-nya URL (uploaded), base64, apa points? Target = **URL uploaded**.
2. **Position unik** (mis. `position:4`), jangan 3.
3. **Wire ke submit:** simpan URL signature ke `task.sig` (atau evidence) — tambah ke updateEventRow submit: `...⭘sig◼◁4▷` (atau via `writeField:"sig"` kalau widget nulis langsung).
4. **Enable** (F=FALSE→TRUE) sesudah wiring.

### Keputusan (LOCKED — user 2026-08-07)
- Simpan ke **`task.sig`** (1 tanda tangan per task, gampang ditarik ke Surat Jalan/invoice). ✓
- Bentuk = **URL Firebase Storage** (sama kaya image lain di app). **Mekanisme upload = Flutter** (renderer yang urus, kaya GET_IMAGES) — builder gak usah mikirin cara upload, cukup wire position + submit reference. ✓

---

## Case 2 — Custody recount: reset HANYA yang kurang, jangan semua

### Bug
CustodyReveal(645) `CUSTODY_REVEAL`: kalo ada selisih → tombol "Hitung Ulang" (`recountRoute`→CustodyCount). Sekarang balik ke CustodyCount **SEMUA hitungan (`ip`) ke-reset 0** → driver hitung ulang SEMUA item, walau cuma 1 yang salah. Harusnya: **cuma item yang selisih/kurang yang di-clear**; yang udah cocok TETEP keisi.

### Fix (renderer — `CUSTODY_COUNT_LIST` + recount flow)
Pas masuk CustodyCount **via recount** (bukan first-time):
- **Pre-fill `ip`** tiap item dari hitungan sebelumnya (yang udah keisi).
- **Clear (blank) HANYA item yang selisih** (ip ≠ ie / yang dp≠0 dari reveal).
- Item yang udah cocok → keep nilainya, driver gak usah hitung ulang.

Butuh renderer bawa state hitungan sebelumnya + tau item mana yang mismatch (dari `dp`/perbandingan ie vs ip di reveal). Blind-count TIDAK dilanggar: reveal udah kejadian (selisih udah keliatan), jadi wajar recount targeted.

### Catatan
- First-time count (belum pernah reveal) → tetep blind + kosong semua (UNCHANGED).
- Cuma jalur **recount sesudah reveal** yang partial-reset.

---

## Ringkasan kerjaan
| # | Bagian | Siapa | Status |
|---|---|---|---|
| 1 | Signature: upload PNG→Storage URL, position unik, wire ke submit (`task.sig`), enable | dev Flutter + builder(config wiring) | ⬜ |
| 2 | Custody recount partial-reset (clear yg selisih doang) | dev Flutter | ⬜ |

## Acceptance
- [ ] Signature ke-capture → PNG upload Storage → **URL** ke `task.sig` (bukan base64). Keliat di doc + bisa di-render.
- [ ] Signature position gak tabrakan foto; submit nyimpen sig.
- [ ] Recount sesudah selisih → item cocok **tetep keisi**, cuma yang selisih ke-clear.
- [ ] First-time count → tetep kosong semua (blind, unchanged).

## Asumsi & risiko
- [ ] signaturePad renderer bisa upload ke Storage (kaya GET_IMAGES) — kalo belum, itu tambahan renderer. KONFIRMASI.
- [ ] `dp` (discrepancy per item) ke-track pas reveal → dipakai recount buat nentuin item mana yang di-clear.

---

**Referensi:** `docs/widget-docs/signaturePad.md` · DeliveryWorkspace(681) SIGNATURE_PAD/GET_IMAGES/submit · CustodyCount(635) CUSTODY_COUNT_LIST · CustodyReveal(645) CUSTODY_REVEAL (`dp`/`recountRoute`).
