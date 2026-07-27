# TIME_PRESENCE (`timePresence`)

**Status:** Status renderer belum terkonfirmasi — cek dev (di katalog widget masih ditandai `[draft]`; ada contoh live di `json/time-presence.json`)
**Widget tab:** row 172

## Buat apa

Kartu jam & kehadiran: menampilkan waktu berjalan (live), jam check-in, dan aksi terakhir. Dipakai di layar absensi supaya petugas lihat status waktunya.

## Tampilan

```
┌ TIME & PRESENCE ───────────────────┐
│  CHECK-IN 11:17    LIVE 00:07      │
│  LAST ACTION 11:24                 │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh live — `json/time-presence.json`)

```json
{"type":"TIME_PRESENCE","width":100,"height":50,"format":"mm:ss","text":"TIME & PRESENCE◆CHECK-IN◆LIVE◆LAST ACTION◆-:-◆11:17◆11:24◆"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TIME_PRESENCE` | — |
| `width` / `height` | Opsional | Ukuran kartu | `100` / `50` |
| `format` | Opsional | Format jam berjalan | `mm:ss` |
| `text` | Wajib | Semua label + nilai, 8 bagian `◆` (lihat tabel posisi) | — |

## Posisi field gabungan

`text` — 8 segmen dipisah `◆` (sumber: template + contoh live):

| # | Isi | Contoh |
|---|---|---|
| 1 | Judul | `TIME & PRESENCE` |
| 2 | Label check-in | `CHECK-IN` |
| 3 | Label waktu berjalan | `LIVE` |
| 4 | Label aksi terakhir | `LAST ACTION` |
| 5 | Nilai placeholder saat kosong | `--:--` |
| 6 | Nilai check-in | `11:17` (di template: `[CHECKIN]`) |
| 7 | Nilai aksi terakhir | `11:24` (di template: `[LASTACTION]`) |
| 8 | Nilai check-out | kosong (di template: `[CHECKOUT]`) |

## Tips & catatan

- `[?]` Apakah nilai jam (segmen 6-8) diisi manual di config atau otomatis dari data absensi — belum ada spec tertulis; contoh live mengisinya sebagai teks. Konfirmasi ke dev.
- Widget tampilan; tidak menyimpan nilai ke form.
