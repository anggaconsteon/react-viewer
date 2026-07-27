# Dev Spec — `noticeBar` widget

**Status:** DRAFT (lahir dari Driver Runtime P2 ScanLogin, 2026-06-15). `[ICON]` = LIKELY-TO-CHANGE.

Widget type **baru generic** — banner pemberitahuan di page manapun.

| type | fungsi | lahir di |
|---|---|---|
| `noticeBar` | strip/callout pemberitahuan (icon + teks), warna by `variant` | P2 ScanLogin (warn + info), P5, P6 |

Reference JSON: `json/notice-bar.json`. Live usage: `json/driver-runtime/p2-scan-login.json`. Pasangan widget: `scanner` (`docs/scanner-widget-dev-spec.md`).

---

## Apa

Callout pemberitahuan — icon (opsional) di gutter kiri + sampai 3 tier teks. Warna ditentukan `variant`. Skala dari strip tipis 1 baris (P2) sampai callout 3 tier (P5).

**ATURAN WARNA (penting):** warna **JANGAN** di JSON. `variant` map ke warna di **theme** (3-tier baku: `danger`/`warn`/`ok` + `info`). JSON cuma kirim nama variant. Config relabel only, warna di theme.

## Field

| field | tipe | wajib | isi |
|---|---|---|---|
| `type` | string | ✅ | `"noticeBar"` |
| `variant` | enum | ✅ | `"danger"` \| `"warn"` \| `"ok"` \| `"info"` → warna dari theme |
| `icon` | string | ⬜ | URL/key icon, di **gutter KIRI** (opsional) |
| `iconAlign` | enum | ⬜ | `"top"` \| `"center"` — posisi vertikal icon vs blok teks. Default `"center"`. P5=`top` (sejajar eyebrow), P6=`center` |
| `label` | string | ⬜ | eyebrow uppercase kecil, baris paling atas (P5 `KONFIRMASI DIPERLUKAN`) |
| `title` | string | ⬜ | judul bold (P5/P6) |
| `text` | string | ✅ | body, selalu ada |

**Tier teks (atas→bawah):** `label` (eyebrow uppercase) → `title` (bold) → `text` (body). Semua **rata-kiri**, opsional kecuali `text`.

> **GAK ADA center horizontal.** P6 keliatan "ke tengah" cuma karena teks ke-geser kanan oleh gutter icon — bukan center beneran. Icon SELALU di gutter kiri; `iconAlign` cuma atur vertikalnya.

**Skala 1→3 tier:**
- **P2** = `variant` + `text` (strip tipis 1 baris).
- **P5** = `variant:warn` + `icon` + `iconAlign:top` + `label` + `title` + `text`.
- **P6** = `variant:info` + `icon` + `iconAlign:center` + `title` + `text`.

## Variant → makna

| variant | makna | contoh |
|---|---|---|
| `danger` | error / blok | sesi expired, device dicabut |
| `warn` | hati-hati | "device ini bisa jadi bukan punya lo…" (P2 login), "KONFIRMASI DIPERLUKAN" (P5) |
| `ok` | sukses / aman | "sesi aktif, semua kecatat" |
| `info` | info netral | "lanjutkan trip, sesi di-pause…" (P2 resume), "Hitung sendiri dulu" (P6) |

## Contoh

Lihat `json/notice-bar.json`: array 5 — strip tipis (danger/warn/ok) + bentuk kaya P5 (icon top + label + title + body) + P6 (icon center + title + body).

## Catatan renderer

1. Register type `noticeBar`.
2. `variant` → lookup warna (`bg`, `color`, `colorBorder`) dari theme aktif. JANGAN baca hex dari JSON.
3. Layout = SELALU rata-kiri. Icon (kalau ada) di gutter kiri; `iconAlign` (`top`/`center`, default `center`) atur posisi vertikalnya vs blok teks.
4. Render tier yang ADA aja: `label` (uppercase) → `title` (bold) → `text` (body). Slot kosong di-skip, jangan sisain ruang.

## Pemakaian

| page | variant | tier | iconAlign |
|---|---|---|---|
| P2 ScanLogin (fresh) | `warn` | text | — |
| P2 ScanLogin (resume) | `info` | text | — |
| P5 CustodyNotification | `warn` | label + title + text | `top` |
| P6 CustodyCount | `info` | title + text | `center` |

P5/P6 **bukan widget baru** — `noticeBar` yang sama, cuma nambah tier `label`/`title` + `iconAlign`.

## Open / LIKELY-TO-CHANGE

- `icon` prop surface (URL vs icon-key) belum diverif — belum ada contoh existing di repo.
- `variant` set: 3-tier baku + `info`. Kalau theme cuma punya 3-tier, `info` perlu ditambah ke theme registry.
