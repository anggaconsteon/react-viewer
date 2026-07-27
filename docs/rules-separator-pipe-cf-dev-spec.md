# Rules Engine — separator `rl` ganti `◆` → `|` (Dev Spec, CF delta kecil)

**Tanggal:** 2026-07-27
**Buat:** dev Go (CF `internal/validate`)
**Status:** ✅ BUILT + PUSHED `29b2acd` 2026-07-27 — `parseRules` split `|`, test parser di-update + case live-string 5 rule + single-rule; build+vet+test ijo. Sheet-side sudah LIVE duluan.
**Konteks:** Rules engine reward posting (`docs/sales-freelance-reward-dev-spec.md` §3 — sudah di-update). Delta 1 titik: `parseRules`.

---

## 1. Kenapa (bug live 2026-07-27, test-confirmed)

Parser addToEvent di APP split `◆` **sebelum** parse pair `⭘`. Akibat nilai `rl` ber-◆ (`limit:10:day◆burst:3◆…`):

- `rl` kepotong di ◆ pertama → doc kesimpan `rl:"limit:10:day"` doang.
- **Semua pair SETELAH rl ikut kebuang** (cv/cn/t/ts hilang) → doc cacat stuck `pending`, CF gak bisa proses (bukti: `post_claim/sonjam8lJEMkyMfXVt1R`, sudah dihapus).

Kesimpulan: nilai field addToEvent **gak boleh mengandung ◆**. Separator rules diganti.

**Kenapa `|` (bukan koma):** konsisten precedent platform "list dalam 1 field" — `wl` payout `|`-join, output groupPicker/payoutList `joinSep:"|"`. Keputusan user 2026-07-27, final.

## 2. Delta

**`internal/validate` — `parseRules`: split antar-rule ganti `"◆"` → `"|"`.** Itu doang.

```
SEBELUM: rl◼limit:1:day◆burst:10◆sample:5   (MATI — gak pernah nyampe utuh)
SESUDAH: rl◼limit:1:day|burst:10|sample:5
```

- Param tetap `:` (`limit:1:day`, `burst:10:reject`) — nol perubahan.
- Semantik nol perubahan: urutan sesuai tulisan, first-hit-stop, unknown→skip+WARN, kosong→default case `limit:1:day`, terisi=override total, WARN rl-tanpa-limit.
- **Gak perlu dukung ◆ lama**: nol doc valid ber-◆ di data (satu-satunya yang ber-maksud-◆ = doc cacat, sudah dihapus). Doc lama `rl` 1-rule tanpa separator (`limit:10:day`, `sample:100`) tetap valid di split `|` (hasil split = 1 elemen).
- `|` di token `ts◼◀2|T7|…▶` bukan urusan CF — CF baca nilai field `rl` yang sudah landing di doc, split `|` cuma di string itu.

## 3. Yang sudah live di sheet (jangan kaget pas lihat data)

`S1011` (saklar rl RewardHome) sekarang ngirim:
```
rl◼limit:10:day|burst:3|duplicate|link|sample:100
```
Verified transport utuh sampai doc (cv/cn/av/an/sv/sn/t/ts semua selamat). Sebelum CF deploy delta ini, string di atas kebaca 1 token rule tak dikenal → skip+WARN → semua pass (auto-approve) — itu perilaku sekarang, indikator buat verifikasi deploy.

## 4. Test

- Update test parser existing (◆ → `|`), tambah case: `"limit:10:day|burst:3|duplicate|link|sample:100"` → 5 rule urut; `"limit:10:day"` → 1 rule; `""` → nol (default case).
- Regression suite (135) tetap hijau.

## 5. Acceptance

- [ ] Submit dengan S1011 terisi multi-rule → doc `rl` full string → verdict sesuai urutan rule (limit dulu → burst → duplicate → link → sample).
- [ ] `rl:"sample:100"` (doc existing) → tetap kebaca 1 rule sample.
- [ ] `rl` kosong → default `limit:1:day` jalan (nol perubahan).
- [ ] WARN masih muncul untuk unknown rule + rl-tanpa-limit.

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` §3 (sudah `|`) · dict book `1_XHmo5…` tab `validation_rules` (G3/J3/J5 sudah `|`).
