# NOTICE_BAR (`noticeBar`)

**Status:** LIVE di app (banner info/peringatan berwarna)
**Dev spec:** ADA — `docs/notice-bar-widget-dev-spec.md`
**Widget tab:** row 200

## Buat apa

Banner satu baris berwarna sesuai nada (ok/peringatan/bahaya) untuk menampilkan info penting di halaman — mis. "Auto-approve jalan", "Stok menipis". Warna diambil dari tema lewat `variant`.

## Tampilan

```
┌────────────────────────────────────┐
│ ✓  Auto-approve jalan — sampel …   │  ← warna dari variant (ok=hijau dst)
└────────────────────────────────────┘
```

## Contoh JSON

(contoh live — halaman RewardReview banner auto-approve)

```json
{"type":"NOTICE_BAR","variant":"ok","icon":"check_circle","text":"Auto-approve jalan — sampel & flag masuk antrian review"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `NOTICE_BAR` | — |
| `variant` | Wajib | Nada → warna dari tema: `ok` / `warn` / `danger` (dan sejenisnya) | `ok` |
| `icon` | Opsional | Ikon di kiri | `check_circle` |
| `text` | Wajib | Isi banner | `Auto-approve jalan — …` |

## Posisi field gabungan

Tidak ada (versi ini 1 baris teks). Versi bertingkat (label/judul/teks) = `noticeBar2` (206).

## Tips & catatan

- Warna dari `variant` (tema), **bukan** hex di config — ikut aturan status 3-tier.
- Teks statis: angka dinamis tidak bisa dihitung di banner ini (isi teks tetap). Butuh banner bertingkat → `noticeBar2`; butuh banner yang bisa di-tap ke halaman → `noticeBarRoute` (236).
- Spec: `docs/notice-bar-widget-dev-spec.md`.
