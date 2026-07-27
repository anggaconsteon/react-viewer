# TASK_DRAFT_INFO (`taskDraftInfo`)

**Status:** LIVE di app (info ringkas draft tugas — admin buat tugas)
**Dev spec:** ADA — `docs/admin-create-task-dev-spec.md`
**Widget tab:** row 253

## Buat apa

Menampilkan info ringkas dari **draft tugas** yang sedang disusun di wizard (mis. ringkasan pilihan sejauh ini). Versi minimal — hanya baca draft, tanpa banyak label. Varian kartu = `taskDraftInfoCard` (254).

## Tampilan

```
Customer: Toko Budi · 3 item · Drop 20    ← ringkasan draft (variant)
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_DRAFT_INFO","variant":"summary","wizardKey":"create_task"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_DRAFT_INFO` | — |
| `variant` | Wajib | Mode tampilan info draft | `summary` |
| `wizardKey` | Wajib | Kunci wizard yang draft-nya dibaca | `create_task` |

## Posisi field gabungan

Tidak ada (versi minimal, tanpa `text`).

## Tips & catatan

- Versi kartu (dengan judul + label) = `taskDraftInfoCard` (254).
- Membaca draft wizard `wizardKey` — tidak menyimpan apa pun.
- Spec: `docs/admin-create-task-dev-spec.md`.
