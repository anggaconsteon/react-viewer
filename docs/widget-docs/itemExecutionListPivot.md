# ITEM_EXECUTION_LIST — pivot (`itemExecutionListPivot`)

**Status:** LIVE di app (eksekusi item tampilan pivot — driver runtime)
**Dev spec:** ADA — `docs/item-execution-list-variant-dev-spec.md`
**Widget tab:** row 246

## Buat apa

Varian `itemExecutionList` (220) dengan tampilan **pivot**: item dikelompokkan lalu dijabarkan per "slot" (mis. per jenis/kondisi) dalam satu baris. Untuk kasus di mana satu item punya banyak slot nilai.

## Tampilan

```
┌─ Item (pivot) ─────────────────────┐
│ Galon 19L                          │
│  Isi [__]  Kosong [__]  Rusak [__] │  ← slots
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"ITEM_EXECUTION_LIST","variant":"pivot","vidtable":"20342033315492","table":"84214220504259//task","search":"tnm◼{taskVid}","groupKey":"ii","pivotField":"cond","slots":"Isi◆Kosong◆Rusak","valueField":"qt","hideZero":"FALSE","writeField":"aq","joinTable":"84214220504259//stock_item","joinKey":"ii","labelField":"in","catField":"cat","text":"Item Pengiriman◆Belum ada item"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `ITEM_EXECUTION_LIST` | — |
| `variant` | Wajib | `pivot` — tampilan slot per item | `pivot` |
| `vidtable` / `table` / `search` | Wajib | Sumber data tugas | `tnm◼{taskVid}` |
| `groupKey` | Wajib | Field pengelompok item | `ii` |
| `pivotField` | Wajib | Field yang dijadikan kolom slot | `cond` |
| `slots` | Wajib | Nama-nama slot (dipisah `◆`) | `Isi◆Kosong◆Rusak` |
| `valueField` / `writeField` | Wajib | Field nilai / tempat simpan hasil | `qt` / `aq` |
| `hideZero` | Opsional | Sembunyikan slot 0 | `FALSE` |
| `joinTable` / `joinKey` / `labelField` / `catField` | Opsional | Referensi nama & kategori item | `stock_item` / `ii` / `in` / `cat` |
| `text` | Wajib | Judul + teks kosong (dipisah `◆`) | `Item Pengiriman◆Belum ada item` |

## Posisi field gabungan

`text` dan `slots` dipisah `◆`. Beda dari `itemExecutionList` (220): tampilan **pivot** (kolom per slot) alih-alih rencana-vs-aktual.

## Tips & catatan

- Pakai kalau satu item punya banyak nilai per kondisi/slot yang mau ditampilkan sejajar.
- Versi rencana-vs-aktual = `itemExecutionList` (220).
- Spec: `docs/item-execution-list-variant-dev-spec.md`.
