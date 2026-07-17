# Fate — Flutter renderer: `SELECTABLE_BTN` multi-select + array serialize — DEV SPEC

> **Owner:** Flutter (renderer) · **Scope:** 1 widget extend + 1 write-serializer rule. TIDAK ada widget baru.
> **Kenapa:** form create project (N1) pilih **beberapa model** → harus jadi **1 field array** (`mv:["Kirana","Dara","Sasha"]`) di payload `addToTable`. CF yang pecah jadi per-row assign. Renderer sekarang cuma single-select + serialize string.

---

## 1. Dua perubahan (itu doang)
1. **`SELECTABLE_BTN` mode `multi`** — boleh pilih >1, state = `List`, + opsi **data-bound** dari table (tarik pool model).
2. **Serializer `◁N▷`** — kalau field posisi N isinya `List`, tulis ke payload sebagai **Firestore array**, BUKAN CSV string.

Backward-compat: `multi` absent / `false` → perilaku single-select lama, **0 regresi**.

---

## 2. Config contract
Widget di N1 (resolved):
```json
{
  "type": "SELECTABLE_BTN",
  "variant": "grid",
  "multi": true,
  "title": "ASSIGN MODEL",
  "maxGrid": 2,
  "height": 50,
  "position": 7,
  "bgSelected": "green",
  "source": "{fateTenant}//user⭘search◼ro◼model",
  "labelField": "n",
  "valueField": "vid",
  "text": "Pilih model · yang dipilih harus dia yang kerja"
}
```

| field | arti | catatan |
|---|---|---|
| `multi` | `true` = boleh banyak | absent/false = single (lama) |
| `source` | table + `search` filter pool opsi | data-bound; ganti `text`-static |
| `labelField` | field ditampilin (`n` = nama) | |
| `valueField` | field di-capture (`vid`) | **ini yg masuk array** |
| `position` | slot `◁7▷` | capture = `List<String>` of `valueField` |
| `maxGrid` | kolom grid | reuse existing |
| `bgSelected` | warna chip kepilih | reuse existing |

**MVP tanpa data-bound (opsional):** drop `source`/`labelField`/`valueField`, pakai `text:"Kirana◆Dara◆Sasha◆..."` (baked). `multi:true` tetap. Capture = array label. (CF fallback `mn=vid`.)

---

## 3. Perilaku UI
- Render opsi dari `source` (query `//user` where `ro◼model`, tampil `labelField`) ATAU `text` ◆-split (baked).
- Tap = toggle masuk/keluar seleksi (single: tap = replace). Chip kepilih = `bgSelected` + centang.
- State internal: `List<String> selected` isi `valueField` (`vid`).
- Grid `maxGrid` kolom, tinggi `height`.
- (opsional) tampil counter "N dipilih".

---

## 4. Serialize `◁7▷` (INTI)
N1 pakai **`addToEvent` (keyed)**, BUKAN addToTable — widget Fate baca field by nama. Field keyed `mv◼◁7▷` → substitusi `◁N▷`:

```
nilai posisi N single (TXF)      → "Studio Kolektif"          (String)
nilai posisi N List (multi)      → ["Kirana","Dara","Sasha"]  (native Array<String>)
```

- Deteksi: field posisi N bertipe `List` → tulis sebagai **native Firestore array** di field keyed (`mv`).
- **JANGAN** `selected.join(",")` → CSV string. CF baca `mv` harus array; string bikin CF reject (CF spec §9.5).
- Keyed doc = `mv` field top-level array (legal, bukan nested) → gak ada urusan c-string positional.
- `d◼◁7▷` di event ledger = boleh array (catatan); yang wajib array = `mv` di `//project`.

Type contract [[project_runtime_type_contract]]: `mv` = `Array<String>`.

---

## 5. Validasi submit (gate)
Mock N1: `valid = ... && picked.length > 0`. Renderer:
- Tombol savesend **disabled** kalau field `multi` required & `selected.isEmpty`.
- Samain sama field wajib lain (brand/title/…): semua keisi baru enable.

---

## 6. Hasil di payload (contoh)
User isi form + pilih 3 model → `addToEvent` keyed terkirim:
```
{fateTenant}//project⭘r◼43200⭘tablevid◼{fateTableVid}⭘ty◼project⭘t◼◀2|T7|epoch▶⭘br◼Bloom⭘ti◼Editorial⭘...⭘cat◼<epoch>⭘mv◼["Kirana","Dara","Sasha"]
```
`mv` = 1 field keyed, native array. → 1 `project` doc keyed. CF fan-out (lihat fate-cf-onprojectcreate-dev-spec.md).

---

## 7. Acceptance
1. `multi:true` + pilih 3 → field `mv` = `["a","b","c"]` **native array** (cek Firestore type = array, bukan string).
2. Pilih 1 → `["a"]` (tetap array len-1, bukan scalar).
3. Pilih 0 + field required → savesend **disabled**.
4. `multi` absent → single-select lama jalan, capture String, **0 regresi**.
5. `source` data-bound → opsi = model dari `//user ro◼model`, capture `vid` (bukan `n`).
6. Toggle deselect → item hilang dari array.

---

## 8. Non-goal
- Fan-out N doc = **CF**, bukan renderer (jangan loop `◆` di client).
- `mn` resolve = CF (renderer capture `vid` doang).
