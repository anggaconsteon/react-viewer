# Custody Mode Toggle — count vs ack (per-tenant), garis tanggung jawab jelas (Dev Spec)

> ## ✅ MODE B TERUJI — 2026-08-12
> Toggle `op1Screen!G122 = mode-b` aktif, halaman **Terima Muatan** (CustodyAck) berjalan, driver konfirmasi 1 layar tanpa hitung ulang.
> **Bukti tidak langsung bahwa CF guard `0cce349` sudah aktif:** sesudah konfirmasi ack, `asset_cache` kendaraan **tetap terisi** — batas maksimal jual/antar membaca stok mobil dengan benar ("Maks 5 — stok mobil"), dan hitungan closing keluar angka wajar. Kalau guard belum aktif, `custodyAdjustments(ie, nil)` akan mengosongkan stok kendaraan ke 0 dan kedua hal itu tidak mungkin bekerja.

**Tanggal:** 2026-08-07 (rev1: driver SELALU konfirmasi — ack, bukan skip)
**Buat:** dev Flutter (renderer) + dev Go (CF) + builder (config). Design di-approve user 2026-08-07 (brainstorm).
**Status:** PROPOSED.
**Konteks / Konsumen pertama:** galon VTL (tenant `20342033315492`). DriverHome@617 `PRECONDITION_GATE_CARD` (kartu custody), CustodyCount flow, CF `custody_confirm.go`.
**Referensi:** `internal/movement/custody_confirm.go` · `vehicle_opening.go` · WarehouseOpeningCheck(718) · memory `project_driver_return_pindah_fixes`.

---

## 1. Kenapa
Custody sekarang = **hitung 2×** (gudang `ie` + driver `ip` blind-count). Buat ops high-trust / speed-first, hitung-driver = friction. User mau **opsi lebih ringan** — TAPI **driver TETEP konfirmasi** (biar ada garis tanggung jawab, gak saling-lempar kalo ada janggal). Flow lama tetep bisa. Per-tenant.

## 2. Konsep — driver SELALU konfirmasi, cuma BEDA cara
`cst` state machine **SAMA** dua mode: gudang → `awaiting_custody` → **driver konfirmasi** → `custody_confirmed` → antar. Yang beda cuma CARA driver konfirmasi:

| Mode | Driver konfirmasi | Nulis | CF |
|---|---|---|---|
| **A** (default, sekarang) | **HITUNG buta** (CustodyCount→Reveal) | `ip[]` | adjust ip vs ie |
| **B** (ringan) | **1-TAP "Terima & Berangkat"** (gak hitung) | `ip` ABSENT | skip (asset_cache = ie) |

**Gudang: UNCHANGED** — selalu tulis `cst:awaiting_custody` (nulis `ie` dari hitungan gudang). Cuma **kartu custody DRIVER** yang beda (count-flow vs ack-1-tap).

## 3. Model tanggung jawab (INTI — cegah saling-lempar)
| Peran | Punya | Janggal di sini → |
|---|---|---|
| **Admin** | ORDER (`pd`) | order salah → admin |
| **Gudang** | MUAT + hitung (`ie`) | truk < ie **sebelum driver konfirm** → gudang |
| **Driver** | TRANSIT + ANTAR (sejak konfirm) | ilang/salah antar **sesudah konfirm** → driver |

**Garis serah-terima = saat driver konfirmasi** (count di A, ack di B). Dua mode SAMA-SAMA punya garis ini → gak ada mode "driver buta total":
```
Janggal SEBELUM driver konfirm  →  GUDANG (belum jadi tanggung jawab driver)
Janggal SESUDAH driver konfirm  →  DRIVER (udah pegang) → lapor
Ambigu                          →  SUPERVISOR (bukti: ie gudang + timestamp konfirm driver + laporan delivery + closing count)
```
Closing (gudang hitung barang balik) = backstop kuantifikasi loss (muat ie − antar ad − balik).

## 4. Komponen
### 4.1 Setting dropdown per-tenant (builder + config)
1 cell `custodyMode` (data-validation dropdown `A`/`B`) di tab config (mis. `auzSettings`). Owner flip, nol dev.

### 4.2 Kartu custody driver: mode `count` vs `ack` (Flutter + config)
`PRECONDITION_GATE_CARD`@DriverHome(617) sekarang route ke CustodyNotification→CustodyCount. Tambah param `custodyMode`:
- `count` (A, default): route ke CustodyCount (sekarang). Backward-compat.
- `ack` (B): route ke **halaman "Terima Muatan" ringan** (BUKAN cuma 1-tap — lihat §4.2a) → flip `cst:awaiting_custody→custody_confirmed` (TANPA `ip`). Timestamp + `dv` = bukti serah-terima.

Config isi param dari setting: `custodyMode = <ref ke cell setting>`.

### 4.2a Halaman "Terima Muatan" (Mode B ack) — WAJIB ada 3 hal (gap-fix)
Ack ≠ langsung terima buta. Halaman ack nampilin:
1. **Rute + manifest read-only** ("muatan: 8 galon, tujuan: Toko Jaya, Kopi Kenangan") — driver tau bawa apa, GAK buta.
2. **Tombol Tolak per task** (reject "ga searah", reuse RejectTask/`load_rejected`) — SEBELUM terima. Tanpa ini Mode B ilangin reject pre-custody (recomputeIE+unload). "Terima & Berangkat" = "terima SEMUA sisa yang gak ditolak".
3. **Foto muatan (opsi, recommend ON)** — bukti "ini yang gue terima" (`GET_IMAGES`→evidence). Nguatin garis tanggung jawab kalo ada sengketa.

Baru **[ ✓ Terima & Berangkat ]** → `cst:custody_confirmed`.

### 4.3 CF guard — `CustodyConfirmed` skip kalo `ip` absent (Go) ⚠️ KRITIS
`custody_confirm.go`: `custodyAdjustments(ie, ip)` → kalo `ip` KOSONG (mode B ack, gak hitung) → tiap item `diff = 0 − ie.qt < 0` → **buang SEMUA stok mobil → asset_cache = 0!** WAJIB:
```go
if len(ParseCustodyLines(f, fieldIp)) == 0 { return nil }  // mode B ack (no ip) → asset_cache = ie dari opening load
```
Mode A (ip ada) → behavior sekarang. Mode B (ip absent) → skip → asset_cache = `ie`.

### 4.4 Driver custody pages (Count/Reveal/Success/Mismatch)
Mode B: **gak dikunjungi** (kartu ack gak route ke sana). Gak dihapus. Mode A: dipakai (sekarang).

## 5. Flow (page)
**Mode A:** Home[⚠ card custody] → tap → CustodyNotif → Count → Reveal → Success → Home[stop kebuka] → antar.
**Mode B:** Home[⚠ card "Terima & Berangkat"] → **1 tap** → Home[stop kebuka] → antar.
```
Kartu custody DriverHome:
  Mode A:  [ Cek Barang Dulu → ]     (route ke count)
  Mode B:  [ ✓ Terima & Berangkat ]  (1-tap confirm, no count)
```
Sesudah konfirm (dua mode), `cst=custody_confirmed` → stop card kebuka (gate udah ada, UNCHANGED).

## 6. Deliverable
| Bagian | Siapa | Status |
|---|---|---|
| `PRECONDITION_GATE_CARD` param `custodyMode` (count→CustodyCount / ack→halaman Terima Muatan; default count) | dev Flutter | ⬜ |
| Halaman "Terima Muatan" (ack): rute+manifest read-only + tombol Tolak (reuse reject) + foto opsi + Terima→cst confirm (no ip) | dev Flutter + builder | ⬜ |
| `custody_confirm.go` guard skip-if-`ip`-absent (deploy DULU — §7b) | dev Go | ✅ PUSHED `0cce349` (event-push, BELUM DEPLOY). ip parse-once + `len==0→return nil`. Flow Mode A UNCHANGED verified (ip selalu ada→guard no-op; bonus defensif Mode A dari empty-ip nyasar). Deploy `onCustodyConfirmed` (internal/movement shared→deploy all). |
| Setting `custodyMode` dropdown + card param formula @DriverHome(617) + warning "B butuh CF guard" | builder | ⬜ |

## 7. Not Doing
- **Mode "driver buta total" (skip konfirm)** — DITOLAK (user 2026-08-07): ilangin garis tanggung jawab → saling-lempar. Driver SELALU konfirmasi (count atau ack).
- **Mode C (nol count di mana pun, `ie=pd` otomatis)** — DITOLAK: nol verifikasi, terlalu jauh.
- **Ubah gudang** — nol. Gudang selalu `awaiting_custody`.
- **2 set page** — nol. 1 param di kartu.
- **Spot-check (cek sebagian) / per-vehicle mode** — v2. v1 = full-count (A) atau ack (B), per-tenant.

## 7b. Rollout (URUTAN WAJIB)
1. **Deploy CF guard (§4.3) DULU.** Kalo enable Mode B sebelum guard deploy → asset_cache mobil ke-ZERO (custodyAdjustments(ie, nil)).
2. Baru Flutter ack-page + config.
3. Baru flip dropdown `custodyMode=B` per-tenant. **Kasih warning di cell setting: "B butuh CF guard live dulu."**

## 8. Acceptance
- [ ] `custodyMode=count` (A) → kartu route ke CustodyCount, driver hitung, `ip` ketulis, CF adjust (behavior sekarang).
- [ ] `custodyMode=ack` (B) → kartu = 1-tap "Terima & Berangkat" → `cst:custody_confirmed`, `ip` ABSENT, gak ke CustodyCount.
- [ ] Mode B: `CustodyConfirmed` CF **skip** → asset_cache mobil = `ie` (TIDAK 0).
- [ ] Mode B ack-page nampilin **rute+manifest read-only** + **tombol Tolak** (reject `load_rejected` jalan, recomputeIE+unload) + **foto opsi** SEBELUM "Terima & Berangkat". Driver GAK buta.
- [ ] Dua mode: sesudah konfirm ada timestamp + `dv` (garis serah-terima) → janggal bisa di-attribute sebelum/sesudah konfirm.
- [ ] Mode A: CF adjust ip vs ie tetep (regresi).
- [ ] Flip dropdown → nol ubahan gudang, nol regenerate page.
- [ ] Rollout: enable B TANPA CF guard live → asset_cache ke-zero (bukti kenapa urutan wajib).

## 9. Risiko
- [ ] **CF guard WAJIB** — kelewat = mode B nge-zero asset_cache mobil.
- [ ] Mode B = **percaya hitungan gudang** (driver gak verify angka, cuma akui terima). Cocok high-trust. Bukti = ie gudang + ack timestamp. Loss tetep ke-kuantifikasi di closing.
- [ ] `ip` absent = NO LINES (mode B). Mode A CustodyCount selalu nulis lines (walau qt 0) → `len>0` → guard aman. Pastiin mode A gak pernah submit ip kosong.

## 10. Backward-compat — JANGAN RUSAK FLOW EXISTING (wajib dicek dev)
Mode A = default = **100% flow sekarang**. Yang bikin aman:
- **Param `custodyMode` ABSENT / `count` → behavior sekarang PERSIS.** Renderer default = count (route CustodyNotification→CustodyCount). Tenant lama (gak set param) = nol perubahan.
- **CF guard cuma kena Mode B.** `if len(ip)==0` — di Mode A, CustodyCount SELALU nulis `ip` lines (walau qt 0) → `len>0` → guard lolos → adjustment jalan kaya sekarang. ⚠️ **CF dev VERIFIKASI:** CustodyCount gak pernah submit `ip` KOSONG (0 lines) di Mode A — kalo bisa kosong, guard salah-skip. Bedain "ip absent (0 lines = B)" vs "ip present isi 0 (A)".
- **Gudang (WarehouseOpeningCheck) UNCHANGED** — selalu `awaiting_custody` + `ie`. Nol risiko sisi gudang.
- **Reject kejaga dua mode** — Mode B ack-page reuse RejectTask/`load_rejected` (recomputeIE+unload sama). Mode A reject di tempat sekarang.
- **asset_cache/movement:** Mode A unchanged (openload+custody adjust). Mode B = `ie` dari openload (guard skip) → gak korupsi.
- **Halaman baru (Terima Muatan) hanya muncul di Mode B.** Page A (Count/Reveal/Success/Mismatch) gak disentuh — cuma gak dikunjungi di B.

**Deploy note (devops):** guard di `internal/movement/custody_confirm.go` — package `internal/movement` SHARED sama pending lain (reject-clear `eb3f923`, outstanding `3e74253`). Deploy `onCustodyConfirmed` ikut kebawa package itu → koordinasi deploy bareng pending movement lain, jangan setengah.

---

**Referensi:** `custody_confirm.go` (`custodyAdjustments`, zero-risk kalo ip absent) · `vehicle_opening.go` · DriverHome(617) `PRECONDITION_GATE_CARD` + gate cst · WarehouseOpeningCheck(718) (unchanged) · memory `project_driver_return_pindah_fixes`.
