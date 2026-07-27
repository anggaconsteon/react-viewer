# executor_designate_card (`executorDesignateCard`)

**Status:** LIVE di app (kartu tunjuk pelaksana — driver/gudang)
**Dev spec:** ADA — admin-create-task / busy-guard picker
**Widget tab:** row 241

## Buat apa

Kartu untuk menunjuk **pelaksana (executor)** dari daftar pekerja, dengan penanda siapa yang sedang sibuk (busy) supaya tidak ditugaskan ganda. Dipakai saat menugaskan orang ke kendaraan/tugas.

## Tampilan

```
┌─ Tunjuk Pelaksana ─────────────────┐
│ ○ Budi   · Site A                  │
│ ● Andi   · Site B   [sibuk: rute]  │  ← busy label
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"executor_designate_card","vidtable":"20342033315492","workforceTable":"84214220504259//workforce","nameField":"n","vidField":"vid","siteField":"sv","busyTable":"84214220504259//vehicle_check","busyField":"dv","busyLabelField":"cnm","text":"Tunjuk Pelaksana◆Pilih orang◆sibuk"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `executor_designate_card` | — |
| `vidtable` | otomatis (baked) | ID koneksi tenant | `20342033315492` |
| `workforceTable` | Wajib | Sumber data pekerja | `84214220504259//workforce` |
| `nameField` / `vidField` / `siteField` | Wajib | Field nama / id / site | `n` / `vid` / `sv` |
| `busyTable` / `busyField` / `busyLabelField` | Opsional | Sumber & field status sibuk + label | `vehicle_check` / `dv` / `cnm` |
| `text` | Wajib | Judul + label (dipisah `◆`) | `Tunjuk Pelaksana◆Pilih orang◆sibuk` |

## Posisi field gabungan

`text` dipisah `◆` (judul / label pilih / label sibuk).

## Tips & catatan

- Penanda "sibuk" mencegah menugaskan orang yang sedang mengerjakan rute lain (busy-guard).
- Untuk pilih dari daftar generik (bukan khusus pelaksana), lihat `pickerList` (248).
