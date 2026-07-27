# CONTEXT_CARD (`contextCard`)

**Status:** LIVE di app (kartu konteks dari draft wizard — admin buat tugas)
**Dev spec:** ADA — `docs/admin-create-task-dev-spec.md`
**Widget tab:** row 251

## Buat apa

Kartu yang menampilkan **konteks pilihan sebelumnya** di wizard (mis. customer yang sudah dipilih) supaya tetap terlihat di langkah berikutnya. Baca dari draft wizard. Dipakai sebagai "kepala" konteks di tiap langkah buat-tugas.

## Tampilan

```
┌────────────────────────────────────┐
│ 🏪 Toko Budi          [badge]      │  ← title + badge
│    Jl. Merdeka 5 · PIC Andi        │  ← meta / sub
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CONTEXT_CARD","source":"draft","wizardKey":"create_task","draftKey":"customer","iconField":"","titleField":"ln","metaField":"al","subField":"pic","badgeTable":"84214220504259//asset_cache","badgeSearch":"lv◼{customerId}","badgeField":"qt","seedLabel":"","text":"Customer◆outstanding"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CONTEXT_CARD` | — |
| `source` | otomatis (baked) | `draft` — baca dari draft wizard | `draft` |
| `wizardKey` / `draftKey` | Wajib | Kunci wizard + bagian draft yang dibaca | `create_task` / `customer` |
| `iconField` / `titleField` / `metaField` / `subField` | Wajib | Field ikon / judul / meta / subjudul | `ln` / `al` / `pic` |
| `badgeTable` / `badgeSearch` / `badgeField` | Opsional | Badge dari data lain (mis. outstanding) | `asset_cache` / `lv◼{customerId}` / `qt` |
| `seedLabel` | Opsional | Label item seed | `""` |
| `text` | Wajib | Judul + label badge (dipisah `◆`) | `Customer◆outstanding` |

## Posisi field gabungan

`text` dipisah `◆` (judul / label badge).

## Tips & catatan

- Membaca pilihan dari draft wizard (`wizardKey`/`draftKey`) — carry konteks antar-langkah tanpa memanggil data ulang.
- Dipakai di tiap langkah wizard buat-tugas sebagai header konteks. Spec: `docs/admin-create-task-dev-spec.md`.
