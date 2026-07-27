# TASK_DRAFT_INFO — kartu (`taskDraftInfoCard`)

**Status:** LIVE di app (kartu info draft tugas — admin buat tugas)
**Dev spec:** ADA — `docs/admin-create-task-dev-spec.md`
**Widget tab:** row 254

## Buat apa

Varian kartu dari `taskDraftInfo` (253): menampilkan info draft tugas dalam bentuk kartu dengan judul + label. Dipakai di langkah ringkasan wizard buat-tugas.

## Tampilan

```
┌─ Ringkasan Tugas ──────────────────┐
│ Customer: Toko Budi                │
│ 3 item · Drop 20 · Pickup 4        │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_DRAFT_INFO","vidtable":"20342033315492","wizardKey":"create_task","variant":"card","text":"Ringkasan Tugas◆Customer◆item◆Drop◆Pickup"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_DRAFT_INFO` | — |
| `vidtable` | otomatis (baked) | ID koneksi tenant | `20342033315492` |
| `wizardKey` | Wajib | Kunci wizard yang draft-nya dibaca | `create_task` |
| `variant` | Wajib | `card` — tampilan kartu | `card` |
| `text` | Wajib | Judul + label (dipisah `◆`) | `Ringkasan Tugas◆Customer◆item◆Drop◆Pickup` |

## Posisi field gabungan

`text` dipisah `◆` (judul + label-label ringkasan).

## Tips & catatan

- Versi minimal (tanpa `text`) = `taskDraftInfo` (253).
- Angka ringkasan diambil dari draft wizard.
- Spec: `docs/admin-create-task-dev-spec.md`.
