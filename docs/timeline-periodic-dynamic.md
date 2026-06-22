# TIMELINE (variant `periodic`) — Rekomendasi Dynamic & Reusable

**Tanggal:** 2026-06-04
**Tujuan:** Bikin `TIMELINE` variant `periodic` bisa dipakai ulang sebagai timeline event generic (bukan cuma riwayat kunjungan patrol) dengan menambah sedikit field config.

> ⚠️ **SUPERSEDED sebagian (2026-06-11):** premis `computeMode` di doc ini **ditolak**. Konsisten sama refactor sibling (`LIST_STATISTIC_CARD`, `LIST_MULTIPLE_PANEL_CARD`): derivasi `{method}`/`{evidence}` = **default behavior** type+`variant:"periodic"`, BUKAN flag `computeMode`. Generic reuse = pakai `<charcode>` di `badge`/`text` (lihat §5, tetap valid). `ledgerCode` juga DIBUANG (confirmed — cuma buat addToEvent, gak kepake read/list). `evidenceField`/`statusField` boleh tetap sebagai **key deklaratif opsional** (field mana sumber evidence/status, analog `mergeTyped`), tapi BUKAN gate on/off. Live JSON 2026-06-11 sudah tanpa `computeMode`/`evidenceField`/`gapMs`.

---

## 1. Ringkasan

Widget ini **paling generic** dari tiga komponen patrol. Hampir semua sudah config-driven: filter event (`conditions` multi-field + token `screenTx`), window periode, `<ts>` (waktu relatif), `<cn>`/`<d>` (char-code), `{visitCount}`, `{gap}`, galeri image (`<i>`), footer. Yang masih nempel ke domain patrol cuma **derivasi `{method}` + `{evidence}` + warna dot dari field `lq`**. Rekomendasi: gate itu di balik `computeMode`.

---

## 2. Kondisi sekarang

### Sudah dinamis (config-driven) ✓
`table` (`//event` → subcollection bebas), `vidtable`, `conditions` (filter multi-field AND, resolve `<token>` dari `screenTx`), `period`, `periodDefault`, `title`, `subtitle` (`{visitCount}`), `text` (`<ts>◆oleh <cn>◆…◆<d>`), `divider` (`{gap}`), `image` (`<i>`, multi + viewer), `footer`, `gapMs`. `<ts>` (relatif), `{gap}`, `{visitCount}` semua generic.

### Masih hardcode (patrol-only)
| Hardcode | Akibat |
|---|---|
| `{method}` = "Scan QR / Lokasi diketik + foto" dari `lq` | domain lain tak punya konsep QR-scan |
| `{evidence}` = "Bukti kuat / GPS saja" dari `lq` | idem |
| warna dot entry = dari `{evidence}` | idem |

---

## 3. Field config baru

| Field | Nilai | Default | Fungsi |
|---|---|---|---|
| ~~`computeMode`~~ | ~~`"patrolVisit"`~~ | **DITOLAK 2026-06-11** | ~~gate method/evidence~~ → derivasi sekarang = default behavior type+`variant`, bukan flag. Generic reuse = `<charcode>` (§5). |
| `evidenceField` | char-code, mis. `"lq"` | `lq` | (kalau `computeMode` aktif) field penentu strong/weak |
| `statusField` | char-code, mis. `"st"` | — | (kalau `computeMode` kosong) warna dot dari field doc; kosong → dot netral |

---

## 4. JSON — riwayat kunjungan patrol (sekarang)

Cukup tambah `computeMode`:

```json
{
  "type": "TIMELINE",
  "variant": "periodic",
  "flag": "timeline",
  "vidtable": "20342033315492",
  "table": "84214220504259//event",
  "search": "ln◼<point>",
  "conditions": "[[◀ln▶◼<point>◀ty▶◼report-patrol]]",
  "period": "24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000",
  "periodDefault": "604800000",
  "title": "<ln>",
  "subtitle": "{visitCount} Kunjungan Periode Ini",
  "text": "<ts>◆oleh <cn>◆{method}◆<d>",
  "badge": "{evidence}",
  "divider": "{gap}",
  "image": "<i>"
}
```

**Token (default behavior type+`variant:"periodic"`, TANPA `computeMode`):** `{method}` (Scan QR/Lokasi diketik + foto, dari `lq`), `{evidence}` (Bukti kuat/GPS saja, dari `lq`) + warna dot. Generic (selalu ada): `<ts>` relatif, `<cn>`, `<d>`, `{visitCount}`, `{gap}`, `<i>` (galeri multi-image + viewer full-screen). Reuse non-patrol → pakai `<charcode>` ganti `{method}`/`{evidence}` (§5).

---

## 5. JSON — timeline event generic (TANPA method/evidence)

Contoh: audit log / riwayat status. Tanpa `computeMode` → tak ada method/evidence; badge & warna dot dari char-code doc:

```json
{
  "type": "TIMELINE",
  "variant": "periodic",
  "vidtable": "20342033315492",
  "table": "84214220504259//audit",
  "statusField": "lv",
  "search": "rid◼<recordId>",
  "conditions": "[[◀rid▶◼<recordId>]]",
  "period": "24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000",
  "periodDefault": "604800000",
  "gapMs": "43200000",
  "title": "<rn>",
  "subtitle": "{visitCount} Aktivitas",
  "text": "<ts>◆oleh <cn>◆<act>◆<d>",
  "badge": "<lv>",
  "divider": "{gap}",
  "image": "<i>"
}
```

Tanpa `computeMode`: segmen ke-3 `text` pakai `<act>` (char-code) ganti `{method}`; `badge` pakai `<lv>` (char-code) ganti `{evidence}`; warna dot dari `statusField` (`<lv>`).

---

## 6. Aturan token

`text` / `badge` boleh `{computedToken}` (kalau `computeMode` aktif), `<charcode>` (dari event), atau literal. `<ts>` selalu jadi waktu relatif (hari ini / Kemarin / N hari lalu). Token tanpa nilai dibiarkan literal.

---

## 7. Backward compatibility

- `evidenceField` default `lq` → layar patrol lama jalan tanpa field tsb.
- **Tidak perlu `computeMode`** — patrol method/evidence = default behavior `variant:"periodic"`. Patrol lama jalan apa adanya (live JSON sudah tanpa flag).

---

## 8. Tahap implementasi (usulan)

- **P1 — `computeMode` gate.** `patrolVisit` → derivasi `{method}`/`{evidence}` + warna dot dari `lq`. Kosong → tanpa keduanya.
- **P2 — `statusField`** buat warna dot di mode generic.
- Sisanya (filter, periode, `<ts>`, `{gap}`, image, footer) sudah generic — tak perlu ubah.
