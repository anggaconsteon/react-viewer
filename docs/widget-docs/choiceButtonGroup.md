# CHOICE_BUTTON_GROUP (`choiceButtonGroup`)

**Status:** ⚠ Prototype — template berisi contoh yang di-hardcode (URL API `example.com`, userId & nama contoh). Renderer belum terkonfirmasi; JANGAN pakai apa adanya tanpa cek dev
**Widget tab:** row 173

## Buat apa

Sekelompok tombol pilihan status (misal: Aman / Perhatian / Masalah). Tiap tombol punya warna + ikon, dan bisa memicu aksi berantai (`chain`): lanjut langsung, buka dialog konfirmasi, atau panggil API.

## Tampilan

```
┌ STATUS AREA  [WAJIB] ──────────────┐
│  [ ✓ Aman ]  [ ⚠ Perhatian ]  [ ⛔ Masalah ]
└────────────────────────────────────┘
Tap Perhatian/Masalah → dialog "Laporkan sebagai kejadian?"
```

## Contoh JSON

(ringkas — 1 tombol; template asli berisi 3 tombol dengan dialog + API contoh)

```json
{"type":"CHOICE_BUTTON_GROUP","label":"STATUS AREA","labelBadge":"WAJIB","alignment":"spaceevenly","children":[{"type":"BUTTON_CHOICE","text":"Aman","value":"aman","color":"green","icon":"check","route":"vertikaTeknoLokacipta","chain":"{\"type\":\"DO_NEXT\"}"}]}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CHOICE_BUTTON_GROUP` | — |
| `label` | Opsional | Judul kelompok | `STATUS AREA` |
| `labelBadge` | Opsional | Badge kecil di sebelah judul | `WAJIB` |
| `alignment` | Opsional | Perataan tombol | `spaceevenly` |
| `children[]` | Wajib | Daftar tombol pilihan (`BUTTON_CHOICE`) | 3 tombol |
| · `text` | Wajib | Label tombol | `Aman` |
| · `value` | Wajib | Nilai yang dipilih | `aman` |
| · `color` | Wajib | Warna tombol | `green` / `yellow` / `red` |
| · `icon` | Wajib | Ikon tombol | `check` / `warning` / `alert` |
| · `route` | Wajib | Halaman tujuan | `vertikaTeknoLokacipta` |
| · `chain` | Opsional | Aksi berantai setelah tap: `DO_NEXT` (lanjut) / `DO_DIALOG` (dialog konfirmasi, bisa `hitApi`) | lihat catatan |

## Posisi field gabungan

Tidak ada field ◆-gabungan; struktur pakai `children[]`.

## Tips & catatan

- ⚠ Template live menaruh nilai contoh yang di-hardcode di dalam `chain`: `apiUrl: https://api.example.com/incident-report`, `userId`/`userName` contoh. Ini **tanda template prototype** — harus diganti nilai nyata (atau dijadikan token) sebelum produksi. Cek dev.
- `chain` dengan `hitApi` = memanggil API langsung (bukan pola simpan-kirim biasa lewat backend Consteon). `[?]` Apakah jalur `hitApi` ini dipakai di produksi belum jelas — konfirmasi.
- Untuk pilihan tombol yang menyimpan ke form (bukan API), lihat `selectableGrid` / `selectableVertical` / `SELECTABLE_BTN`.
