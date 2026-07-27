# NOTICE_BAR + aksi route (`noticeBarRoute`)

**Status:** LIVE di app (banner berwarna + tombol aksi ke halaman)
**Dev spec:** ADA — `docs/notice-bar-widget-dev-spec.md`
**Widget tab:** row 236

## Buat apa

Sama seperti `noticeBar` (banner berwarna), tapi ada **tombol aksi** yang mengarah ke halaman lain. Untuk peringatan yang butuh tindak lanjut (mis. "Ada 3 tugas belum diassign → Buka").

## Tampilan

```
┌────────────────────────────────────┐
│ ⚠ 3 tugas belum diassign  [ Buka ]│  ← actionText → actionRoute
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"NOTICE_BAR","variant":"warn","icon":"warning","text":"3 tugas belum diassign","actionText":"Buka","actionRoute":"vertikaTeknoLokaciptaAdminHome"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `NOTICE_BAR` | — |
| `variant` | Wajib | Nada → warna tema (`ok`/`warn`/`danger`) | `warn` |
| `icon` | Opsional | Ikon | `warning` |
| `text` | Wajib | Isi banner | `3 tugas belum diassign` |
| `actionText` | Wajib | Label tombol aksi | `Buka` |
| `actionRoute` | Wajib | Halaman tujuan tombol | `…AdminHome` |

## Posisi field gabungan

Tidak ada (field terpisah).

## Tips & catatan

- Beda dari `noticeBar` (200, tanpa aksi) & `noticeBar2` (206, bertingkat) — `noticeBarRoute` = banner + 1 tombol navigasi.
- Warna dari `variant` (tema), bukan hex. Spec: `docs/notice-bar-widget-dev-spec.md`.
