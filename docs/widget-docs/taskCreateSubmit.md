# TASK_CREATE_SUBMIT (`taskCreateSubmit`)

**Status:** LIVE di app (tombol simpan buat tugas — admin buat tugas)
**Dev spec:** ADA — `docs/admin-create-task-dev-spec.md`
**Widget tab:** row 255

## Buat apa

Tombol final wizard "buat tugas": mengambil semua isi draft (customer + item + dll.) lalu **menyimpan jadi tugas** (dengan nomor otomatis), diakhiri dialog konfirmasi. Menutup alur buat-tugas.

## Tampilan

```
[     Buat Tugas & Assign     ]  ── tap ──▶ simpan tugas → dialog
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TASK_CREATE_SUBMIT","vidtable":"20342033315492","table":"84214220504259//task","wizardKey":"create_task","action":"savesend","com":"auz","flag":"create-task","delay":"5","run":"","numberPos":"1","route":"vertikaTeknoLokaciptaAdminHome","text":"Buat Tugas & Assign","chain":{"type":"DO_DIALOG","title":"Tugas Dibuat","children":[{"type":"TXT","data":"Tugas berhasil dibuat & ditugaskan."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaAdminHome"}]}]}}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TASK_CREATE_SUBMIT` | — |
| `vidtable` / `table` | Wajib | ID tenant + tabel tujuan (tugas) | `84214220504259//task` |
| `wizardKey` | Wajib | Kunci wizard yang draft-nya disimpan | `create_task` |
| `action` / `com` / `flag` / `delay` | Wajib | Aksi kirim / kanal / penanda / delay | `savesend` / `auz` / `create-task` / `5` |
| `run` | Opsional | `[?] pemicu/mode jalan — cek dev` | `""` |
| `numberPos` | Opsional | Slot nomor tugas otomatis | `1` |
| `route` | Wajib | Halaman tujuan setelah simpan | `…AdminHome` |
| `text` | Wajib | Label tombol | `Buat Tugas & Assign` |
| `chain` (DO_DIALOG) | Wajib | Dialog konfirmasi | `Tugas Dibuat` |

## Posisi field gabungan

`text` = label tombol. Nomor tugas otomatis di `numberPos`.

## Tips & catatan

- Mengumpulkan seluruh draft wizard (`wizardKey`) jadi 1 tugas — jangan lupa `wizardKey` sama dengan langkah-langkah sebelumnya.
- Nomor tugas (tnm) otomatis. Spec: `docs/admin-create-task-dev-spec.md`.
