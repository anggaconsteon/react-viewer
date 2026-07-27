# TASK_MANIFEST_LIST — draft (`taskManifestListDraft`)

**Status:** LIVE di app (manifest tugas dari draft wizard — admin buat tugas)
**Dev spec:** ADA — `docs/admin-create-task-dev-spec.md`
**Widget tab:** row 249

## Buat apa

Varian `taskManifestList` (208) yang membaca dari **draft wizard** (bukan tugas tersimpan): menampilkan rekap item yang sedang disusun di alur "buat tugas" sebelum disimpan. Sumber = `source` (form/draft), bukan tabel.

## Tampilan

```
┌─ Rekap Item ───────────────────────┐
│ Galon 19L   Drop 12  Pickup 4      │  ← dari draft yang sedang disusun
│ Tabung 3kg  Drop 8                 │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_MANIFEST_LIST","source":"{DRAFT}","itemsField":"it","dropField":"dp","pickupField":"pu","txField":"tx","saleField":"sale","refillField":"refill","buyField":"buy","text":"Rekap Item◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_MANIFEST_LIST` | — |
| `source` | Wajib | Sumber draft — `{DRAFT}`/`{FORM}` (bukan tabel) | `{DRAFT}` |
| `itemsField` | Wajib | Field daftar item di draft | `it` |
| `dropField` / `pickupField` | Wajib | Field jumlah drop / pickup | `dp` / `pu` |
| `txField` + `saleField`/`refillField`/`buyField` | Opsional | Jenis transaksi & kategori | `tx` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Rekap Item◆Belum ada item` |

## Posisi field gabungan

`text` dipisah `◆`. Beda dari `taskManifestList` (208): sumber = `source` (draft/form), bukan `table`/`search`.

## Tips & catatan

- Dipakai di langkah ringkasan wizard buat-tugas untuk pratinjau item sebelum submit.
- Versi dari tabel tersimpan = `taskManifestList` (208).
- Spec: `docs/admin-create-task-dev-spec.md`.
