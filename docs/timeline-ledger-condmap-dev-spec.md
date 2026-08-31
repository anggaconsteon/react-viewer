# TIMELINE (variant ledger) — `condMap` relabel nilai `<cd>` di itemText (Dev Spec)

**Tanggal:** 2026-08-04
**Buat:** dev Flutter (renderer). Sheet-side config-ahead nyusul saya (nol perubahan kalau param kosong).
**Status:** PROPOSED
**Konteks / Konsumen pertama:** page `vertikaTeknoLokaciptaStockHistoryDetail` (op1Screen row 852, widget `timelineLedger` @ D853) — demo galon VTL. Widget = `TIMELINE` variant `ledger`.
**Referensi:** `docs/timeline-ledger-variant-dev-spec.md` (widget asal), memory `feedback_config_driven_labels`, `feedback_status_3tier_relabel`.

---

## 1. Kenapa

Riwayat Stok nampilin baris item `Aqua Galon 19 Liter ×7  empty` / `×3  full`. Kata **`full`/`empty`** = nilai mentah field `cd` movement (kanonik, dipakai se-sistem — TIDAK boleh diubah di data). User: susah dibaca + inginnya Indonesia (`Isi`/`Kosong`), dan bisa diatur lewat config, bukan hardcode (keputusan user 2026-08-04).

Sekarang `itemText:"<in> ×<qt>◆<cd>"` — `<cd>` di-interpolasi APA ADANYA. Widget udah punya `badgeMap` (map `ac`→label buat badge: openload→Muat dst) tapi TIDAK ada map buat `<cd>`. Config murni gak bisa transform nilai → butuh param renderer.

## 2. Konsep

Param baru `condMap` — value→label map (pola sama persis `badgeMap`): `raw◼Label★raw◼Label`. Renderer terapkan ke token `<cd>` di mana pun muncul (itemText, dan token `<cd>` lain kalau ada). Kosong/absen = tampil nilai mentah (perilaku sekarang, nol regresi). Generic: dipakai buat relabel kondisi apa pun (bukan cuma galon isi/kosong).

## 3. Kontrak field

| Param | Isi | Perilaku |
|---|---|---|
| `condMap` (BARU) | `full◼Isi★empty◼Kosong` | map nilai `<cd>` → label saat render itemText. Nilai yang gak ada di map → tampil mentah. Kosong = semua mentah (nol regresi) |
| `itemText` | `<in> ×<qt>◆<cd>` (tetap) | `<cd>` sekarang di-lewatin `condMap` dulu sebelum ditampilkan |

Separator sama dengan badgeMap: `◼` pasangan value-label, `★` antar-entri. Nol string hardcode di Flutter — label dari config.

## 4. Contoh resolved (konsumen pertama, SESUDAH)

```json
{"type":"TIMELINE","variant":"ledger","flag":"movement","vidtable":"20342033315492","table":"84214220504259//movement","conditions":"[[◀vv▶◼{vehicleId}]]","period":"1 hari◼86400000★7 hari◼604800000★30 hari◼2592000000","periodDefault":"86400000","timeField":"t","title":"Riwayat Stok","subtitle":"{count} pergerakan","groupField":"mrf","groupField2":"tr","sectionText":"Trip · <ts>","badgeField":"ac","badgeMap":"openload◼Muat★closeunload◼Turun★drop◼Antar★pickup◼Ambil★sale◼Jual★buy◼Beli★refill◼Tukar★adjust◼Sesuai★unload◼Bongkar","condMap":"full◼Isi★empty◼Kosong","headText":"<ts>","titleText":"<fln> → <tln>","subText":"oleh <an>◆{n} item","itemText":"<in> ×<qt>◆<cd>","refText":"<mrf>","expandable":"TRUE"}
```

Hasil: `Aqua Galon 19 Liter ×7  Kosong` / `×3  Isi`.

## 6. Sheet-side (builder — SAYA)

- Template `timelineLedger` = Widget!J280, shared. Tambah `[CONDMAP]` ke template + extend SEMUA usage timelineLedger (helper = `""` kecuali StockHistoryDetail) supaya gak ada leftover literal `[CONDMAP]` di page lain. Renderer WAJIB abaikan `condMap` kosong (nilai mentah) — itu yang bikin extend aman.
- Konsumen pertama D853: helper `condMap` = `full◼Isi★empty◼Kosong`.

## 7. Deliverable dev (Flutter)

1. Parse `condMap` (pola `badgeMap`), terapkan ke `<cd>` di `itemText` (dan token `<cd>` lain kalau dipakai).
2. `condMap` kosong/absen = nilai mentah (nol regresi semua timeline live).

## 8. Dictionary

- Nol field data baru (`cd` tetap `full`/`empty` di movement). `condMap` = param widget, bukan field.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| `condMap` render ke `<cd>` | dev Flutter | ⬜ |
| Template +[CONDMAP] + fill D853 + extend usage | builder (saya) | ⬜ (config-ahead, nunggu ACK renderer) |
| CF / dict data | — | nol |

## 10. Not Doing (dan kenapa)

- **Ubah nilai `cd` di data jadi Isi/Kosong** — `full`/`empty` kanonik, dipakai asset_cache/CF/semua widget. Relabel WAJIB di tampilan, bukan data.
- **Map generik buat SEMUA token `<field>` di itemText** — YAGNI; baru `<cd>` yang butuh. Kalau kelak field lain butuh relabel, pola `condMap` gampang digandain (mis. `acMap` udah dicover badgeMap).

## 11. Acceptance

- [ ] `condMap:"full◼Isi★empty◼Kosong"` → baris item tampil `Isi`/`Kosong`, bukan `full`/`empty`.
- [ ] Nilai `cd` di luar map → tampil mentah (gak error).
- [ ] `condMap` kosong = perilaku sekarang (nol regresi timeline lain).
- [ ] Nol string hardcode di Flutter.

## 12. Asumsi & risiko

- [ ] `<cd>` cuma muncul di `itemText` pada usage sekarang — kalau nanti dipakai di headText/subText, condMap harus jalan di situ juga (dev terapkan global ke token `<cd>`).
- [ ] Renderer abaikan field tak-dikenal (`condMap`) saat config-ahead sebelum dukungan landing — sama seperti param lain; verifikasi widget tetap render pas config dipasang (Killer #7).

---

**Referensi:** `docs/timeline-ledger-variant-dev-spec.md` · memory `feedback_config_driven_labels` · `feedback_status_3tier_relabel`
