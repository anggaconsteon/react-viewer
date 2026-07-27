---
name: generating-widget-docs
description: Use when generating end-user widget documentation (.md) from the Widget tab of the proxy spreadsheet — triggers "buatkan dokumentasi widget", "generate widget docs", "dokumentasi widget X", "widget docs .md"
---

# Generating Widget Docs

## Overview

1 widget = 1 file `docs/widget-docs/<nama-template>.md` + index `README.md`. Audiens = **USER NON-DEV** (owner, admin, orang baru): bahasa Indonesia, kalimat pendek, detail tapi gampang dipahami. Sumber = sheet + spec — **NOL NGARANG**.

## Sumber data (urutan pakai)

1. **Widget tab** proxy `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`:
   - col **I** = nama template, col **J** = template JSON `[PLACEHOLDER]` → ini SSOT kontrak field.
   - col A/G/H = formula (A spill nama, G resolved) — **read-only, jangan pernah nulis ke sheet dari skill ini**.
   - ⚠ JANGAN baca `I:J` sekaligus — col J gede, output MCP overflow (>200KB ke file dump). Urutan bener: baca `I2:I311` dulu (kecil; **row = index array + 2**), lalu `J<row>` per widget target / batch kecil.
2. **Dev spec** `docs/*-dev-spec.md` (Glob nama widget/type) — kontrak field, tabel posisi field gabungan, ASCII layout, "Contoh resolved" §4, status, Not Doing.
3. **Contoh live** — urutan murah: (a) spec §4 "Contoh resolved"; (b) kalau mau versi live, cari row konsumen dari memory/spec ("Konsumen pertama @row") lalu baca range SEMPIT op1Screen sekitar row itu (col D = resolved). **JANGAN scan full op1Screen.**
4. **Dict book** `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw` tab `widget_field_positions` — posisi field gabungan. Widget belum terdaftar di situ ≠ gak punya field gabungan → fallback tabel posisi dari spec; dua-duanya gak ada → `[?]`.
5. **Memory** (`MEMORY.md` + file project terkait) — status renderer: LIVE / config-ahead (renderer belum ada) / interim. Memory bisu soal renderer → tulis "Config siap — status renderer belum terkonfirmasi, cek dev", JANGAN klaim LIVE.

## Scope pemilihan widget

- User kasih daftar nama / row → pakai itu.
- "yang baru-baru" tanpa daftar → Widget row **±198 ke atas** (era driver-runtime Jun 2026 → sekarang). Ambil nama dari col I, **tampilkan daftar ke user buat konfirmasi SEBELUM generate** (1 pertanyaan, hemat regenerate).
- Skip row kosong dan template yang cuma variant kecil dari sibling (mis. `getImagesGallery` = variant `getImages1`) → dokumentasikan di file induknya sebagai bagian "Variant".

## Template per file (urutan FIXED)

```markdown
# <TYPE_JSON> (`namaTemplate`)

**Status:** LIVE di app / Renderer belum ada (config sudah siap) / Interim
**Widget tab:** row N

## Buat apa
1-2 kalimat awam: masalah apa yang diselesaikan + kapan dipakai. Nol jargon.

## Tampilan
ASCII layout (salin dari spec; kalau spec gak punya, susun dari field — tandai "(perkiraan)").

## Contoh JSON
1 contoh RESOLVED nyata (dari page live / spec §4), pretty-print. BUKAN [PLACEHOLDER].

## Field
| Field | Wajib? | Isi | Contoh |
(satu baris per field template col J; urutan sama dengan JSON.
`type` = baris pertama, tandai "otomatis dari template".
Wajib? default = Wajib, KECUALI spec bilang opsional / "kosong = off".)

## Posisi field gabungan (kalau ada)
Tabel posisi per segmen — sumber: dict tab `widget_field_positions` → fallback spec → `[?]`.
Tulis pemisah AKTUAL field itu (◆ / ★ / ◼ — jangan asumsi selalu ◆).

## Tips & catatan
Gotcha, batasan (Not Doing di spec), widget terkait/sibling.
```

## Aturan

- **NOL NGARANG** (aturan baku user): tiap field di-trace ke template col J / spec / dict. Makna gak ketemu → tulis `[?] belum terdokumentasi — cek dev spec`, JANGAN nebak.
- Simbol DSL tampil apa adanya (`◆ ◼ ★ ⭘ ◁N▷ ◀N▶ {field}`) — jelasin SEKALI di glossary README, jangan diulang tiap file.
- Field umum semua widget (`vidtable`, `table`, `search`, `text`) → jelasin SEKALI di glossary README; di file per-widget cukup 1 baris + isi spesifiknya.
- Bahasa dev (VLOOKUP, SUBSTITUTE, renderer internals) JANGAN di body — kalau perlu, taruh bagian kecil "Catatan teknis" paling bawah.
- `docs/widget-docs/README.md`: **buat di run PERTAMA** (glossary simbol DSL + field umum + tabel index kosong), lalu **append 1 baris index tiap widget selesai** — jangan nunggu "semua selesai" (run parsial = referensi glossary dangling). Format index: `Widget | Type | Buat apa (1 baris) | Status`.
- Read-only ke semua sheet. Output cuma file .md lokal.

## Common mistakes

- Ngedok dari col G (bisa error state) → SSOT template = **col J**.
- Nyalin `[PLACEHOLDER]` ke bagian Contoh → contoh WAJIB resolved.
- Ngarang makna field / nilai enum yang gak ada di spec (mis. nebak daftar variant).
- Ngedok semua 230 template library lama — scope = yang diminta user aja.
- Lupa status renderer → user nyoba widget yang belum ada di app terus bingung. Selalu isi **Status**.
