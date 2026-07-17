# Dev Spec (Flutter) — search DSL numeric-aware (field number gak ke-match karena search dikirim sbg string)

**Tanggal:** 2026-07-10
**Buat:** Flutter dev (renderer — parser `search` / `conditions` `◼` eq, dipake LIST_ITEM_CARD dll).
**Bug live:** page `vertikaTeknoLokaciptaLogIncident` (op1Screen row 950) list KOSONG walau doc ada di Firestore. Root = **type mismatch**: field query = number, search value dikirim string.

---

## 0. Bukti (test isolasi, live)

Doc `report-incident/26RgtH11TAZm2kiXDP4r` (Firestore otq-01):
```
1: "REQ-2026-000295"   (string)
2: "MENUNGGU"          (string)
5: 87544551624342      (number)
7: 83674161979544      (number)   ← field yg di-filter LogIncident
9: 83674161979544      (number)
c: "[...positional...]"           t: 1783667999498
```

CREATE DSL report-incident deklarasi tipe: **`index◼1★S◼2★S◼5★N◼7★N`** → field 5 & 7 = **N (number)**, field 1 & 2 = **S (string)**.

Test di widget yg sama, cuma ganti field search:
| search | field tipe | hasil |
|---|---|---|
| `7◼83674161979544` | **N (number)** | **KOSONG** ❌ |
| `2◼MENUNGGU` | S (string) | **MUNCUL** ✓ |

### Case ke-2 (confirm cross-cutting) — `vertikaTeknoLokaciptaPatrolSiteDetail` (op1Screen row 966, `LIST_STATISTIC_CARD`)

`search:"av◼{ccVid}"` — field `av` di `site` = **number** (`av: 83674161979544`). Tap panel card inject `av◼ccVid` → `ccVid` = site.av. Detail filter `av◼{ccVid}` numeric → **page KOSONG**.

Pola diagnostik identik: panel card (list) `search:""` → no numeric filter → **jalan**; detail `av◼{ccVid}` → numeric filter → **kosong**. Sama persis LogIncident. Nunjukin ini emang cross-cutting semua filter field-number, bukan one-off.

Kesimpulan: parser `search` bangun `where("7", isEqualTo: "83674161979544")` — value **String**. Doc simpan field 7 = **num** → Firestore eq beda tipe → **nol match**. String field jalan karena tipe cocok.

## 1. Fix — coerce value ke tipe number saat all-digit

Parser `search` / `conditions` (token `key◼value`, AND `⭘`): kalo `value` **all-digit** (`^-?\d+$`, opsional desimal) → query pake **num** (`int.tryParse` / `num.tryParse`), bukan String.

```dart
dynamic _coerce(String v) {
  final n = num.tryParse(v);
  return (n != null && RegExp(r'^-?\d+(\.\d+)?$').hasMatch(v)) ? n : v;
}
// where(field, isEqualTo: _coerce(value))
```

Kenapa aman: semua VID / timestamp / kuantitas di sistem = **number** (83674161979544, 87544551624342, epoch `t`, dst). Nilai yg emang string SELALU ada non-digit (`REQ-2026-000295`, `MENUNGGU`, `client`, `report-patrol`) → gak kena coerce. Field pure-digit yg SENGAJA string = **gak ada** sekarang.

### Escape hatch (opsional, kalo nanti butuh)
Field pure-digit yg WAJIB string (mis. kode pos, nomor telp as string) → tambah `searchStr:"<field>◆<field>"` (daftar field yg dipaksa string). Default kosong. **YAGNI — belum perlu**, sebut aja di kode.

## 2. Cakupan

- Semua widget yg lewat parser `search`/`conditions` eq: `LIST_ITEM_CARD`, `PICKER_LIST`, `TIMELINE`, `LIST_STATISTIC_CARD`, dst.
- **Nol perubahan config** — `7◼83674161979544` yg udah ada langsung jalan abis fix. Semua filter numeric-vid lain (yg mungkin diam-diam kena) auto kebenerin.

## 3. Resolved JSON — LogIncident (config BENER, gak diubah)

```json
{"type":"LIST_ITEM_CARD","ledgerCode":"report-incident","vidtable":"20342033315492","table":"84214220504259//report-incident","search":"7◼83674161979544","toDo":"[MENUNGGU, DITINJAU, PROSES, SELESAI, DITUTUP]","text":"Lapor Temuan◆<15>◆<14>◆<11>◆Cari Laporan◆Ketik Untuk Mencari◆Data tidak ditemukan◆<24>◆Belum di-assign","route":"vertikaTeknoLokaciptaLogIncidentDetail","showIcon":"FALSE","showProgress":"FALSE"}
```

`7◼83674161979544` = filter incident by site vid (field 7, number). Bener secara config — cuma nunggu parser numeric-aware.

## 4. Acceptance

1. `7◼83674161979544` (field number) → doc dgn field 7 = num 83674161979544 **muncul**.
2. `2◼MENUNGGU` (field string) → tetep jalan (regresi nol).
3. `lt◼client`, `tr◼{activeTrip}`, `ty◼report-patrol` (string) → tetep jalan.
4. Multi-term `a◼<num>⭘b◼<str>` → num ke-coerce, str enggak, dua-dua match.
5. Nilai desimal / negatif (kalo ada) ke-handle.
6. **Token-resolved value** juga ke-coerce: `av◼{ccVid}` di PatrolSiteDetail (row 966) — `{ccVid}` resolve ke digit → num → site match → page isi. Coerce jalan SETELAH token resolusi (di value final, bukan di literal `{ccVid}`).

---

**Referensi:** op1Screen row 950 (`vertikaTeknoLokaciptaLogIncident`). Data: Firestore `otq-01` `report-incident`. Konvensi tipe write = `index◼<pos>★N/S` (addToTable). Bug ini kemungkinan **nyangkut ke SEMUA filter field-number** yg belum ketauan — fix sekali, beres semua.
