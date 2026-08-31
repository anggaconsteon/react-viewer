# Field `note` generic (baris display opsional) — Dev Spec (Flutter)

**Tanggal:** 2026-07-30
**Buat:** **dev Flutter (renderer)** — `LIST_ACTION_CARD` (utama) + `LIST_CARD` / `DETAIL_CARD` (reuse sama).
**Status:** PROPOSED — **config-ahead SUDAH LIVE** (test 2026-07-30: note gak kerender = renderer belum support). Sheet NOL perubahan lagi.
**Konsumen pertama:** **ApproveLeave** (op1Screen @1050 `LIST_ACTION_CARD`, D1052) — biar approver liat request ini lagi di level berapa.
**Referensi:** `docs/approve-leave-gating-and-note-dev-spec.md` §5 (asal field ini) · `docs/approval-flow-keyed-dev-spec.md` (CF stamp `cl`/`nl`).

---

## 1. Kenapa

Kartu antrian approval sekarang gak nunjukin "request ini lagi di level berapa". User minta indikator level — TAPI **generic** (widget kepake banyak case; isinya bisa apa aja, bukan khusus level) + **kondisional** (opsional, kosong = gak muncul). Field `note` udah gua pasang di config (LIVE), tapi test 2026-07-30 nunjukin **renderer belum baca field ini** → kartu gak nampilin apa-apa. Butuh dukungan renderer.

**Keputusan user (2026-07-30):** field `note` = **generic + opsional**, BUKAN khusus level. Isi bebas per-case; renderer cuma render kalau ada.

## 2. Konsep

`note` = 1 slot display opsional di kartu/detail. Isinya string ber-token `<field>` yang di-resolve dari doc row (persis kaya `title`/`subtitle`/`fields` yang udah jalan). Kosong/absen → **gak dirender** (gak makan tempat). Nol string hardcode di Flutter — semua teks dari config.

## 3. Kontrak field

```json
{ "type":"LIST_ACTION_CARD", …, "note":"Level <cl> dari <nl>" }
```
| field | tipe | isi |
|---|---|---|
| `note` | string (opsional) | teks display ber-token `<field>`. Token di-resolve dari doc row (reuse resolver `title`/`subtitle`). **Kosong `""` / absen → GAK dirender.** Isi bebas per-case — BUKAN khusus level |

- `<field>` = ambil nilai field dari doc row (contoh `<cl>` → nilai field `cl` doc). Field gak ada di doc → resolve jadi kosong (jangan error, jangan tampil literal `<cl>`).
- Nol hardcode: label + teks SEMUA dari `note` config.

## 4. Contoh resolved (data live — request `REQ-2026-000369`, `//request`)

Doc punya `cl` (level aktif) + `nl` (total level), di-stamp CF.

| config `note` | doc | render |
|---|---|---|
| `"Level <cl> dari <nl>"` | `cl=2, nl=3` | **Level 2 dari 3** |
| `"Level <cl> dari <nl>"` | `cl=3, nl=3` | **Level 3 dari 3** |
| `""` (RewardReview @1018) | — | *(gak dirender)* |
| `"<kn>"` (case lain) | `kn="Budi"` | **Budi** (bukti generic) |

## 4b. UI / Layout

```
┌─────────────────────────────────────┐
│ Agenia Demo-7            [Menunggu]  │  ← title + badge (udah ada)
│ Cuti Tahunan                        │  ← subtitle (udah ada)
│ Level 2 dari 3          ← note (BARU, muted/kecil)
│ 30 Jul 2026 08:34                    │  ← meta (udah ada)
│ [ Setujui ]   [ Tolak ]             │
└─────────────────────────────────────┘
```
Posisi: bawah subtitle / dekat meta — **renderer's call**, yang penting konsisten di LIST_ACTION_CARD + LIST_CARD. Gaya: 1 baris kecil/muted. `note` kosong → baris hilang total (bukan baris kosong).

## 6. Sheet-side (SUDAH LIVE — config-ahead, jangan diapa-apain)

Field udah dipasang lewat genericize proper (template `listActionCard`@Widget!J308 punya placeholder `[NOTE]`; op1Screen D-formula SUBSTITUTE → helper col Y):
- **ApproveLeave** D1052 → helper Y1052 = `Level <cl> dari <nl>` → render.
- **RewardReview** D1018 → helper Y1018 = `""` → gak render.

Renderer tinggal baca `note` dari resolved JSON. NOL kerjaan sheet lagi.

## 7. Deliverable dev (renderer)
1. **Baca `note`** dari config widget (`LIST_ACTION_CARD` dulu). Absen/`""` → skip (jangan render slot).
2. **Resolve token `<field>`** dari doc row — reuse resolver yang udah dipake `title`/`subtitle`/`fields`. Field gak ada → kosong (jangan error / jangan literal).
3. **Render 1 baris** kecil/muted (posisi konsisten, lihat §4b). Non-empty hasil resolve → tampil; kalau semua token kosong & sisanya kosong → boleh skip.
4. **Reuse** di `LIST_CARD` + `DETAIL_CARD` (field `note` sama; nyusul, LIST_ACTION_CARD dulu).

## 9. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| Render `note` + resolve `<field>` (LIST_ACTION_CARD) | **dev Flutter** | **PENDING (renderer belum support)** |
| Reuse `note` di LIST_CARD / DETAIL_CARD | dev Flutter | PENDING (nyusul) |
| Config `note` ApproveLeave + RewardReview | builder | ✅ LIVE (config-ahead) |
| CF stamp `cl`/`nl` | — | ✅ LIVE |

## 10. Not Doing (dan kenapa)
- **`note` khusus level** — SENGAJA generic (`<field>` bebas); widget kepake banyak case, jangan hardcode "Level".
- **Field terpisah per-case (levelText, dsb)** — gak; 1 field generic cukup.
- **Render pas kosong** — jangan; kosong = baris hilang (kondisional), bukan baris kosong.

## 11. Acceptance
- [ ] ApproveLeave: `note:"Level <cl> dari <nl>"` + doc `cl=2,nl=3` → kartu nampil **"Level 2 dari 3"**.
- [ ] `note:""` (RewardReview) → **gak ada baris** note.
- [ ] `note:"<kn>"` di case lain → render nilai `kn` (bukti generic, bukan khusus level).
- [ ] Token field gak ada di doc → resolve kosong, **bukan** literal `<cl>`, bukan error.
- [ ] Nol string hardcode di Flutter — semua dari `note` config.
- [ ] Konsisten posisi/gaya di LIST_ACTION_CARD (+ LIST_CARD pas nyusul).

## 12. Asumsi & risiko
- [ ] Resolver `<field>` title/subtitle bisa langsung dipake buat `note` (asumsi 1 resolver generik). [VERIFY di kode renderer.]
- [ ] `cl`/`nl` ada di doc `//request` (CF stamp) — kalau request belum diproses CF, `cl` bisa kosong → note kosong (aman, kondisional).
- [ ] `note` di LIST_CARD/DETAIL_CARD reuse mulus (field sama) — [VERIFY struktur widget itu terima key baru tanpa drop widget].

---

**Referensi:** `docs/approve-leave-gating-and-note-dev-spec.md` (§5 asal) · op1Screen ApproveLeave @1050 / D1052 · Widget `listActionCard`@J308 (`[NOTE]` placeholder) · RewardReview @1018 (`note:""`).
