# WORKSPACE_HEADER — berlangkah (`workspaceHeaderStep`)

**Status:** LIVE di app (header dengan indikator langkah — wizard)
**Dev spec:** ADA — `docs/admin-create-task-dev-spec.md` / delivery-workspace
**Widget tab:** row 252

## Buat apa

Varian `workspaceHeader` (226) dengan **indikator langkah** (step) untuk alur wizard bertahap (mis. Customer → Item → Ringkasan). Judul + tombol kembali + penanda langkah keberapa.

## Tampilan

```
┌────────────────────────────────────┐
│ ←  Buat Tugas · Langkah 2/3        │  ← variant step
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"WORKSPACE_HEADER","variant":"step2","backRoute":"vertikaTeknoLokaciptaCreateTaskCustomer","text":"Buat Tugas◆Pilih Item◆2◆3"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `WORKSPACE_HEADER` | — |
| `variant` | Wajib | Penanda langkah (mis. `step2`) | `step2` |
| `backRoute` | Wajib | Halaman tujuan tombol kembali | `…CreateTaskCustomer` |
| `text` | Wajib | Judul + subjudul + langkah-ke + total-langkah (dipisah `◆`) | `Buat Tugas◆Pilih Item◆2◆3` |

## Posisi field gabungan

`text` dipisah `◆` (judul / subjudul / nomor langkah / total langkah — lihat spec untuk urutan pasti).

## Tips & catatan

- Versi tanpa langkah (terikat data) = `workspaceHeader` (226).
- Dipakai di wizard buat-tugas. Spec: `docs/admin-create-task-dev-spec.md`.
