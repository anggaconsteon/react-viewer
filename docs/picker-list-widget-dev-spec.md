# PICKER_LIST — Widget Dev Spec (generic single-select picker)

Widget **NEW** (live app skrg: "wrong widget name" buat type ini = renderer belum ada). **Generic** — pilih 1 record dari koleksi apapun, capture id-nya ke token, opsional badge count + baris "lainnya/ad-hoc". BUKAN khusus kendaraan; vehicle cuma 1 config. Reusable: pilih kendaraan, gudang, slot, kategori, approver, dll.

> Asal: di-genericize dari `VEHICLE_PICKER` (2026-06-29) — owner mau widget kepake di case apapun. Renderer belum dibangun → rename gratis.

---

## 1. Sumber data
- `table` + `search` = koleksi + filter (DSL `key◼val⭘…`). Tiap baris = 1 doc (key = id doc).
- Contoh vehicle: `table:"…//stock_location"`, `search:"lt◼vehicle⭘lst◼active"`.

## 2. Field tampil (per baris) — semua opsional kecuali title
| field config | fungsi |
|---|---|
| `titleField` | judul baris (wajib) |
| `subField` | sub/tag baris |
| `metaField` | baris ke-3 (opsional); kosong → placeholder |
| `countTable` + `countSearch` | badge "{N} {countLabel}" — count `countTable` WHERE `countSearch`, per baris. `{lv}`/token-baris = id doc baris ini |

`{lv}` (atau token baris) = **token per-baris** (id doc yg lagi di-render), bukan token page. Renderer hitung count tiap baris.

## 3. Aksi pilih (2 mode)
| `mode` | perilaku |
|---|---|
| `"capture"` (default) | bind `captureToken` = id record terpilih ke **state/draft**; **gak navigate, gak nulis Firestore**. Caller/halaman yg pakai token-nya. |
| `"navigate"` | sama capture + **navigate ke `route`** (bawa id terpilih), buat picker yg lanjut ke page lain. |

`captureToken` = nama token tujuan id terpilih (bebas per konteks — `vv`, `vehicleId`, `kl`, dll). Picker **gak pernah nulis Firestore sendiri**; write = tanggung jawab caller (`updateEventRow` di H1) atau submit halaman (draft di P3).

## 4. Baris ad-hoc / "lainnya"
Kalau `adhocLabel` ada → render 1 baris ekstra (ikon ＋) di bawah list = pilih "tanpa record tetap" (ad-hoc). Tap → capture token = kosong/ad-hoc marker (lihat OPEN Q1).

## 5. Empty state
`search` 0 hasil → render `emptyText` (config-driven). Jangan ngilangin widget diam-diam.

## 6. `text` ◆-segment
`[0]` judul list · `[1]` label tombol pilih per baris · `[2]` suffix badge count.
(ad-hoc & empty = field sendiri `adhocLabel`/`emptyText`, BUKAN segment.)
Semua label dari config — jangan hardcode.

---

## 7. JSON resolved

### Contoh A — Vehicle picker, capture (LIVE op1Screen P3 `CreateTaskVehicle` row 1178)
```json
{
  "type": "PICKER_LIST",
  "mode": "capture",
  "vidtable": "20342033315492",
  "table": "84214220504259//stock_location",
  "search": "lt◼vehicle⭘lst◼active",
  "titleField": "ln",
  "subField": "ty",
  "metaField": "dv",
  "countTable": "84214220504259//task",
  "countSearch": "vv◼{lv}⭘tst◼assigned",
  "captureToken": "vv",
  "route": "",
  "adhocLabel": "Ad-hoc / Nanti",
  "emptyText": "Belum ada kendaraan aktif",
  "text": "Pilih Kendaraan◆Pilih kendaraan ini◆task aktif"
}
```
Pilih kendaraan → bind `vv` ke draft task. CTA halaman ("Lanjut · Review") yg navigate ke P4.

### Contoh B — Vehicle picker, H1 assign/reassign sheet
```json
{
  "type": "PICKER_LIST",
  "mode": "capture",
  "vidtable": "20342033315492",
  "table": "84214220504259//stock_location",
  "search": "lt◼vehicle",
  "titleField": "ln",
  "subField": "ty",
  "captureToken": "vehicleId",
  "adhocLabel": "Ad-hoc / Lainnya",
  "emptyText": "Belum ada kendaraan",
  "text": "Pilih Kendaraan◆Pilih◆task aktif"
}
```
Sheet dipicu `coordinationSignalList`/`UPCOMING_TASK_LIST`/`OUTSTANDING_PANEL`; caller consume `{vehicleId}` lewat `updateEventRow:"…vv◼{vehicleId}…"`.

### Contoh C — (opsi) Customer picker, navigate
Kalau P1 disatuin ke sini: `table:stock_location`, `search:"lt◼client⭘lst◼active"`, `titleField:"ln"`, `subField:"al"`, `mode:"navigate"`, `route:"…CreateTaskItem"`, `captureToken:"kl"`. Ganti TASK_FEED_LIST flat. (BELUM diputus — lihat OPEN Q4.)

---

## 8. GENERIC (kenapa worth)
1 renderer = semua picker: kendaraan, gudang, slot, kategori, approver, customer. Beda cuma config (table/search/field/token/route). NOL entity baked di renderer.

## 9. OPEN
1. **Capture boleh kosong (ad-hoc)?** Task tanpa `vv` boleh ga? Selaras admin-home §6 Q1.
2. **H1 `schedule` mode** = sheet+capture aja atau route ke Create Task pre-filled? (admin-home §6 Q2)
3. `captureToken` beda per konteks (`vv` vs `vehicleId`) — biarin (rekomendasi) atau seragamin.
4. ~~Satuin P1 customer-picker ke PICKER_LIST?~~ **DECIDED 2026-06-29: PISAH.** P1 tetep `TASK_FEED_LIST` flat (refactor visual = `customer-namelist-and-creator-token-dev-spec.md` §1b). PICKER_LIST = capture-only; TASK_FEED_LIST flat = navigate-list. Jangan disatuin.
