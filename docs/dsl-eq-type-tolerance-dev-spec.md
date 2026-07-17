# Search-DSL `◼` Equality — Type Tolerance (DEV SPEC)

> **Renderer fix, generic. Config sheet 0 perubahan.** Bikin operator `◼` (equality) di search-DSL parser toleran **angka↔string** biar gate berhenti gagal gara-gara String-vs-Number. Fix sekali di operator = beres **system-wide** (tdt, cdt, cst, vid, vv, t, ts, dll).

## 1. Problem konkret (bukti live)
Admin bikin task `EtlsNcFDhbt62WsP90oW`:
- `vv: "F621a02a983500"` (String) — **confirmed** = `lv` B 1234X di stock_location. ✓ match.
- `tst: "assigned"` ✓
- `tdt: "1782838800000"` (**String**) = 2026-07-01 00:00 WIB = hari ini (nilai bener).
- `t: 1782875462202` (**Number**) — **doc yg SAMA campur tipe**: `t` Number, `tdt` String.

Gudang feed (`VEHICLE_FEED_LIST`) surface kendaraan yg punya task match:
```
taskSearch: "vv◼{lv}⭘tdt◼{today}"
```
`{today}` di-resolve **Number** (epoch start-of-today). Task `tdt` = **String**. Firestore strict → `"1782838800000" ≠ 1782838800000` → **gak match** → **B 1234X gak muncul di Gudang, driver gak bisa di-assign.** Nilai sama, cuma tipe beda.

## 2. Root cause
Writer campur: `addEventRow`/`updateEventRow` **stringify semua** → `tdt/cdt/t/ts` sering lahir String; native write kadang Number. Gate `◼` banding strict → gagal walau nilai identik. Ini akar type-contract (custody `cst`-stuck dll juga korban — gate `cst◼custody_confirmed⭘cdt◼{today}` gagal di klausa `cdt` type-nya, bukan `cst`-nya).

**Arah keputusan: TOLERANT-READ** (bikin `◼` toleran), **bukan** canonical-on-write. Alasan: `addEventRow` inheren stringify → maksa semua writer Number = lawan arus. 1 fix operator > tambal tiap writer. (Supersede pendekatan canonical-on-write di `docs/runtime-type-contract-DEV.md` buat sisi READ.)

## 3. Fix — operator `◼` toleran (contract)
Di parser search-DSL, tiap evaluasi klausa `key◼value`, banding pake `eq()` toleran:

```dart
bool eq(dynamic a, dynamic b) {
  final sa = a?.toString() ?? '';
  final sb = b?.toString() ?? '';
  final na = num.tryParse(sa);
  final nb = num.tryParse(sb);
  // numeric-compare HANYA kalo dua-duanya angka KANONIK (round-trip persis)
  // → cegah "0123"=="123" dan barcode leading-zero ke-collide
  if (na != null && nb != null &&
      na.toString() == sa.trim() && nb.toString() == sb.trim()) {
    return na == nb;
  }
  return sa == sb; // fallback string
}
```

**Kenapa guard round-trip (`na.toString()==sa`):**
- `"1782838800000"` ◼ `1782838800000` → dua-dua kanonik → numeric → **match**. ✓ (target bug)
- `"F621a02a983500"` ◼ `...` → `num.tryParse` gagal (ada huruf) → string compare. ✓ (vv/vid/id aman)
- `"custody_confirmed"` ◼ `...` → string. ✓ (cst aman)
- barcode `"8886008101138"` ◼ `"8886008101138"` → kanonik, sama → match. ✓
- `"08886..."` ◼ `"8886..."` → `"08886"` gak round-trip (jadi `"8886"`) → **string compare → beda** → gak salah-match. ✓ (barcode leading-zero aman)

**⚠️ Caveat safe-integer:** id numerik super-panjang (>~18 digit) bisa lewat presisi int64/double → banding salah. Kalo ada field id numerik panjang, guard tambahan: skip numeric kalo `sa.length > 15` (biarin string), atau parse pake `BigInt`. Epoch (13 digit) + barcode (13 digit) aman di int64.

## 4. Scope — SEMUA `◼`, otomatis kebagian
Fix di operator = generic. Guard round-trip bikin aman buat semua field tanpa whitelist:
| field | tipe efektif | jalur |
|---|---|---|
| `tdt`, `cdt`, `t`, `ts` | epoch (Number/String) | **numeric** → ke-fix |
| `qt`, `pd`, `pp`, count-an | angka | numeric |
| `vv`, `vid`, `cv`, `lv` | id hex-ish (ada huruf) | string (aman, unaffected) |
| `cst`, `tst`, `cty`, `cd` | enum string | string (aman) |
| `ii`, `in` | barcode/nama | string (round-trip guard cegah collision) |

> **JANGAN** whitelist per-field. Cukup benerin `eq()` di operator — guard round-trip yg jaga id/barcode.

**Operator laen:**
- `⭘` (AND) — cuma join klausa, gak banding. No change.
- `★` (keyed search) — kalo dia banding value-equality, pake `eq()` yg SAMA biar konsisten (key epoch/numeric bisa kena juga). Kalo murni doc-id string, gak ngaruh.

## 5. ⚠️ Firestore strict — WAJIB client-side
Firestore server `where(field, ==, value)` **strict**, gak bisa toleran. Jadi klausa yg butuh toleransi **gak boleh** jadi server-side `where`. Pola:
- **Fetch by field strict-safe** (mis. `vv` — id string, exact), **terus filter sisanya (`tdt`) client-side pake `eq()`.**
- Feed ini udah fetch task per-kendaraan (`vv◼{lv}`) → tinggal `tdt◼{today}` di-evaluate client-side loose. Feasible, set kecil.

**Perf note:** buat gate di koleksi GEDE yg gak ada anchor strict, fetch-then-filter bisa mahal (banyak read, gak bisa paginate di field itu). Kalo ketemu kasus gitu, pertimbangin dupe-field ter-index bertipe konsisten. Buat feed/custody sekarang (fetch-by-vv/by-vehicle) aman.

## 6. Non-goal
- ❌ **JANGAN** ubah config sheet — `tdt◼{today}` dll udah bener.
- ❌ **JANGAN** maksa writer nulis Number (canonical-on-write) — di-drop, `addEventRow` stringify inheren.
- ❌ **JANGAN** numeric-compare tanpa guard round-trip (bakal collide barcode/leading-zero).
- ❌ **JANGAN** whitelist per-field.

## 7. Test / verifikasi
1. **Target:** task `tdt:"1782838800000"` (String) + feed `tdt◼{today}`(Number 1782838800000) → **match** → **B 1234X muncul di Gudang** "Perlu Tindakan / Opening Check". (bug utama beres)
2. **vv tetep jalan:** `vv:"F621a02a983500"` ◼ `lv` → string compare → match (gak ke-regres).
3. **cst gate:** `cst◼custody_confirmed⭘cdt◼{today}` — `cst` string match + `cdt` epoch String/Number match → custody gak stuck.
4. **Barcode no-collision:** `ii:"8886008101138"` cuma match barcode identik; `"08886..."` ≠ `"8886..."`.
5. **Enum:** `tst◼assigned` tetep exact string.
6. **Mixed-type doc:** task `t`(Number)/`tdt`(String) — gate manapun yg banding dua field itu jalan.

## 8. Rollback
Murni logic renderer di 1 fungsi `eq()`. Revert = balikin ke `==` strict. Config sheet gak kesentuh, jadi gak ada yg perlu di-undo di sheet.
