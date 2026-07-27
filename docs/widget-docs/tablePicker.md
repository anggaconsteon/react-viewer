# TABLE_PICKER (`tablePicker`)

**Status:** LIVE di app (picker dari tabel, single/multi)
**Dev spec:** ⚠ TIDAK ADA spec khusus — mesin dijelaskan di `docs/group-picker-widget-dev-spec.md` (GROUP_PICKER menyerap fungsinya)
**Widget tab:** row 290

## Buat apa

Field pilih dari **tabel/koleksi** (mis. pilih site, pilih model): cari & pilih satu atau beberapa, hasilnya disimpan ke slot form. Picker terikat data langsung dari Firestore.

## Tampilan

```
┌ [TITLE] ───────────────────────────┐
│ [ Pilih…                        ▸] │  ← tap → sheet cari & pilih
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TABLE_PICKER","mode":"multi","vidtable":"20342033315492","table":"84214220504259//site","search":"st◼active","labelField":"sn","subField":"an","valueField":"sv","max":10,"position":18,"labelPosition":19,"title":"Pilih Site","hint":"Cari site","text":"Pilih Site◆Cari◆Data tidak ditemukan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TABLE_PICKER` | — |
| `mode` | Wajib | `single` (pilih 1) / `multi` (pilih banyak) | `multi` |
| `vidtable` / `table` / `search` | Wajib | Sumber data + filter | `st◼active` |
| `labelField` / `subField` / `valueField` | Wajib | Field nama / baris-2 / id yang dikirim | `sn` / `an` / `sv` |
| `max` | Opsional | Batas jumlah pilihan (mode multi) | `10` |
| `position` | Wajib | Slot form tempat id terpilih disimpan (`◁N▷`) | `18` |
| `labelPosition` | Opsional | Slot form untuk nama terpilih | `19` |
| `title` / `hint` | Wajib | Judul & hint | `Pilih Site` |
| `text` | Wajib | Label (dipisah `◆`) | `Pilih Site◆Cari◆Data tidak ditemukan` |

## Posisi field gabungan

`text` dipisah `◆` (judul / hint cari / teks kosong).

## Tips & catatan

- Mode multi mengirim id yang di-join. Tampil nama (`labelField`), kirim id (`valueField`).
- Ke depan fungsi ini bisa diserap `groupPicker` (302) dengan 1 group + `selector:"none"`. Untuk sekarang tetap dipakai.
- Konsumen: pilih site multi (titik patroli), pilih model (Fate).
