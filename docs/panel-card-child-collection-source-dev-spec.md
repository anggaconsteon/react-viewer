# Dev Spec (Flutter) — point-list dari embedded array → child collection (join)

**Tanggal:** 2026-07-10 (rev 2026-07-10: +LIST_STATISTIC_CARD)
**Buat:** Flutter dev (renderer aggregation). **DUA widget kena pola sama:**
- `LIST_MULTIPLE_PANEL_CARD` (page Supervisor, row 927) — panel Patroli hitung `{llCount}` dari `site.ll[]`.
- `LIST_STATISTIC_CARD` strategy patrol (page PatrolSiteDetail, row 972) — "titik resmi" expand `site.ll[]` (`patrol-point-merge-typed-dev-spec.md` §2/§3).

**Sifat:** tambah source **child-collection join** buat point-list. **Generik + backward-compatible** — swap field = reusable domain lain. Default kosong = perilaku embedded lama (nol regresi). **Param & semantik IDENTIK di dua widget** (satu implementasi, dua consumer).

**Kenapa perlu:** titik dipindah dari array embedded `site.ll[]` → collection top-level `location` (FK `sv`). Dua widget masih baca `ll[]` → sekarang kosong → list nol titik.

---

## 0. Konteks / permintaan

Widget di page **Supervisor** (op1Screen row 927, route `vertikaTeknoLokaciptaSupervisor`) baca `table:site` — tiap doc site = 1 kartu. Panel "Patroli" hitung titik dari **`site.ll[]` (array embedded)**:
- `{llCount}` = `ll.length` (jumlah titik)
- `{staleCount}` / `{longestGap}` / `{qs}` = per titik, join `ll[].li` → collection `event` (jeda kunjungan).

**Data pindah:** titik sekarang dipecah ke **collection `location`** (top-level `84214220504259//location`), tiap doc bawa FK **`sv`** = `site.sv`. Mau: point-list ambil dari `location where sv◼<site.sv>`, BUKAN `site.ll[]`.

### Bukti data (Firestore otq-01)

`site/wrAQwOMey1W7p3VHzu4j`:
```
av: 83674161979544 · sv: 83674161979544 · n/an/sn/st...
ll: [ {la,li,ln,lo,ra}, {la,li,ln,lo,ra} ]     ← array embedded (source LAMA)
```
`location/ylzymyooY60Ee9u35A0Y`:
```
la: -6.31607 · li: "0lefc05bc...df371d8" · ln: "BSD Tech Center #18" · lo: 106.64483 · ra: 30
sv: 83674161979544   (double)                  ← FK ke site.sv (source BARU)
```
Field per-titik identik (`la/li/ln/lo/ra`) — cuma pindah dari array embedded ke doc standalone + `sv`. **`li` tetap ada di dua-duanya** → join ke `event` gak berubah, cuma sumber LIST titik yg di-swap.

---

## 1. Perubahan renderer (aggregation)

Ganti sumber point-list jadi pluggable. Sisanya (count, per-titik join `li`→`event`, stale/gap, `{qs}`) **TETAP**.

```dart
// SEBELUM: selalu embedded
final points = (siteDoc['ll'] as List?) ?? [];

// SESUDAH: config-driven, default embedded (backward compat)
final List points = childTable.isEmpty
    ? ((siteDoc[childArrayField] as List?) ?? [])                       // embedded (LAMA)
    : await query(childTable)                                          // child collection (BARU)
        .where(childKey, isEqualTo: siteDoc[parentKey])
        .get();

final llCount = points.length;
for (final p in points) {
  final ref = p[childRefField];   // 'li' — join ke event, SAMA utk 2 source
  // ... hitung stale/gap per titik (UNCHANGED)
}
```

`childTable` kosong → baca `childArrayField` (embedded) persis kaya sekarang → **layar lama nol perubahan**.

## 2. Field config baru (semua generik, default = perilaku lama)

| Field | Fungsi | Default | Nilai page ini |
|---|---|---|---|
| `childTable` | collection sumber point-list. Kosong = embedded array | `""` | `84214220504259//location` |
| `childArrayField` | nama array embedded (dipakai kalo `childTable` kosong) | `ll` | `ll` |
| `parentKey` | field di doc induk (`site`) yg nilainya buat filter child | `sv` | `sv` |
| `childKey` | field di doc child (`location`) yg dicocokin ke `parent[parentKey]` | `sv` | `sv` |
| `childRefField` | field tiap titik buat join hilir ke `event` | `li` | `li` |

Query child = `childTable WHERE childKey == parentDoc[parentKey]`. One-to-many (bukan lookup 1-1).

> **Tipe join key = string.** `sv`/`av` disimpan string (`"83674161979544"`). Join `where(childKey, ==, parent[parentKey])` = string==string, langsung jalan. Semua VID di data = string → gak perlu coerce/fallback tipe.

## 3. Resolved JSON — page Supervisor (SESUDAH, D927)

```json
{"type":"LIST_MULTIPLE_PANEL_CARD","vidtable":"20342033315492","table":"84214220504259//site","search":"","conditions":"","searchFields":"an◆sn","thresholdMs":"43200000","routeParam":"av◼ccVid","showIcon":"TRUE","showProgress":"FALSE","variant":"grouped","groupBy":"","statusLabels":"danger◼Perlu tindak◼Perlu tindak★warn◼Perhatian◼Perhatian★ok◼Aman◼Beres","childTable":"84214220504259//location","childArrayField":"ll","parentKey":"sv","childKey":"sv","childRefField":"li","text":"◆<an>◆<sn>◆Cari site atau klien◆Ketik nama site◆Data tidak ditemukan","status":"{ws}","panels":[{"icon":"users","text":"Kehadiran◆{hadir}/<nm> hadir◆{issues}","status":"{ps}","route":"vertikaTeknoLokaciptaCheckinSiteDetail"},{"icon":"clipboard-check","text":"Patroli◆{llCount} titik◆{staleCount} titik jeda lama · terlama {longestGap} jam","status":"{qs}","route":"vertikaTeknoLokaciptaPatrolSiteDetail"}]}
```

Config LAMA (D927 sebelum, buat diff): sama persis tanpa 5 field `child*`/`parentKey` — waktu itu titik dari `site.ll[]`.

## 3b. Resolved JSON — page PatrolSiteDetail (LIST_STATISTIC_CARD, D972)

Sumber "titik resmi" (spec `patrol-point-merge-typed-dev-spec.md` §3 langkah 1: "expand `ll[]`") diganti → query `location WHERE sv == site.sv`. Sisanya (typed-merge dari `event` scope `av=={ccVid}`, dedup by `ln`, stats, tap) **TETAP**. Join titik pakai nilai field doc (`site.sv`→`location.sv`, number==number) — **bukan** via token string `{ccVid}`, jadi nol konflik tipe.

```json
{"type":"LIST_STATISTIC_CARD","vidtable":"20342033315492","table":"84214220504259//site","mergeTyped":"ln","childTable":"84214220504259//location","childArrayField":"ll","parentKey":"sv","childKey":"sv","childRefField":"li","search":"av◼{ccVid}","conditions":"[[◀av▶◼{ccVid}]]","text":"Cari titik◆Ketik nama titik◆Data tidak ditemukan","period":"24 jam◼86400000★7 hari◼604800000★30 hari◼2592000000","periodDefault":"86400000","stats":"{totalVisits}◆Total kunjungan★{noVisitCount}◆Titik tanpa kunjungan★{typedCount}◆Lokasi diketik","content":"<ln>◆PATROLI◆Terakhir {lastAgo} · {lastBy}◆{visits} kunjungan dalam {period}","status":"{ps}","badge":"{evidence}","route":"vertikaTeknoLokaciptaPatrolPointTimeline"}
```

- `table:site` + `search:av◼{ccVid}` → tetep dipake buat **temuin site** (av string, match OK) + derive path event + scope event `av=={ccVid}`.
- `childTable:location` + `parentKey:sv`/`childKey:sv` → **titik resmi** = doc location `sv==site.sv` (ganti `ll[]`).
- `childRefField:li` → per titik join hilir ke `event` (sama kaya `ll[].li` dulu; location punya `li`).
- `{noVisitCount}` = titik resmi (skrg dari location) 0 kunjungan; `{typedCount}` typed-orphan — **tak berubah**.

## 4. Reusability (bukti generik — nol perubahan renderer)

Swap 3 field → sub-list dari collection lain:
- **Aset per site (dokumen di coll terpisah):** `childTable:"...//asset_doc"`, `parentKey:"av"`, `childKey:"assetVid"`.
- **Kembali ke embedded:** `childTable:""` → baca `childArrayField`.
- Pola sama kaya join `CUSTOMER_OUTSTANDING_LIST` (`customerTable`/`customerKey`) & `ASSET_STOCK_LIST` (`joinTable`/`joinKey`), tapi ini **one-to-many child**, bukan lookup 1-1.

## 5. Backward compatibility

- `childTable` default `""` → semua layar existing baca embedded `ll` persis kaya sekarang. **Wajib diubah cuma page yg mau pindah source** (set `childTable`+key).
- `childRefField` default `li` → join `event` gak berubah.
- Unknown field di widget type dikenal = renderer lama abaikan → **config bisa di-stage duluan** (staged di D927 skrg; behavior baru nyala pas renderer landing).

## 6. Acceptance

1. `childTable:location` + `childKey:sv` + `parentKey:sv` → `{llCount}` = jumlah doc `location` dgn `sv==site.sv` (bukan `site.ll.length`).
2. `{staleCount}`/`{longestGap}`/`{qs}` = per doc location, join `li`→`event` (sama kaya dulu, sumber titik beda).
3. `childTable:""` → embedded `ll` (regresi nol di layar lain).
4. Kehadiran panel (`{hadir}`/`{ps}`, join `workforce` by `sv`) **tak tersentuh**.
5. Nol string/collection baked — semua dari config.

---

**Referensi:** op1Screen row 927 (page `vertikaTeknoLokaciptaSupervisor`), `# LIST_MULTIPLE_PANEL_CARD — Rekomendasi.md` (computeMode/reuse — catatan: live TANPA `computeMode`, aggregation baked). Sibling join: `customer-outstanding-list-widget-dev-spec.md`, `asset-stock-list-widget-dev-spec.md`. Data: Firestore `otq-01` coll `site`/`location`.
