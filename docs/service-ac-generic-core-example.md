# Service AC — Contoh Generic-Core + Alur Data Antar-Page

**Tanggal:** 2026-08-04
**Tujuan:** buktiin AC bisa dibangun dari widget **generic** doang (nol domain-leaky, nol `wizardKey`), + tunjukin alur data antar-page (routeParams → search) secara konkret.
**Semua JSON di bawah = bentuk widget LIVE** (dicek dari op1Screen sesi ini). Beda cuma di isi `table`/field.

---

## 0. Generic-core yang dipakai (semua sudah LIVE, nol bau domain)

`WORKSPACE_HEADER` · `LIST_CARD` · `LIST_ACTION_CARD` · `TIMELINE`(ledger) · `NOTICE_BAR` · `STAT_CARD_ROW` · `PRN`/`RECEIPT_DOC` · `GET_IMAGES` · `signaturePad` · `SELECTABLE_BTN` · `tablePicker` · `sendButtonGpsWithEvent`.

Tiap widget = **table + search + peta-field**. Dia gak tau "AC" — kita yang kasih tau lewat config.

---

## 1. Skema minimal (biar contoh konkret)

Coll `work_order` (1 doc = 1 job). Field-code:

| code | isi |
|---|---|
| `wo` | kode WO (KEY) — mis `JOB-1204` |
| `cn` / `ca` / `cp` | customer nama / alamat / hp |
| `jn` / `un` | jenis (label) / jumlah unit |
| `kl` | keluhan |
| `jm` | jadwal (jam) |
| `pr` | prioritas |
| `tn` | teknisi (nama) |
| `st` | status: `requested`/`assigned`/`in_progress`/`completed`/`invoiced` |

Coll `//event` (timeline WO): `ref◼{wo}` + `ty:workorder-*` + `ttl` + `cn`(pelaku) + `t`/`ts`.

---

## 2. Page A — `ServiceWOList` (Admin: daftar job)

```json
{"title":"Service AC","children":[
  {"type":"WORKSPACE_HEADER","vidtable":"20342033315492","table":"","search":"",
   "idField":"","titleField":"","addressField":"","backRoute":"vertikaTeknoLokaciptaAdminHome",
   "text":"Job Service◆Koordinasi & assign"},

  {"type":"LIST_CARD","vidtable":"20342033315492","table":"84214220504259//work_order",
   "search":"st◼requested","conditions":"","sortField":"jm","sortDir":"asc",
   "groupBy":"","groupLabels":"","lead":"",
   "title":"<cn>","subtitle":"<jn> · <un> unit","meta":"<jm> · <tn>",
   "badgeField":"st","badgeMap":"requested◼Belum diassign★assigned◼Ditugaskan★in_progress◼Dikerjakan★completed◼Belum invoice★invoiced◼Selesai",
   "trailing":"","trailingLabel":"","stats":"Job◼","searchFields":"cn",
   "route":"vertikaTeknoLokaciptaServiceWODetail","routeParams":"wo◼{wo}",
   "text":"Job Service◆Pilih job◆job◆Cari customer◆Belum ada job"}
]}
```

**Kunci:** `route: ServiceWODetail` + `routeParams:"wo◼{wo}"`. Waktu 1 kartu di-tap, sistem bawa **cuma nilai `wo`** (mis `"JOB-1204"`) ke page tujuan. **Bukan objek** — cuma kunci.

---

## 3. Page B — `ServiceWODetail` (route param `{wo}`)

```json
{"title":"Service AC","children":[
  {"type":"WORKSPACE_HEADER","vidtable":"20342033315492","table":"84214220504259//work_order",
   "search":"wo◼{wo}","idField":"wo","titleField":"cn","addressField":"ca",
   "backRoute":"vertikaTeknoLokaciptaServiceWOList","text":"Detail Job◆<wo>"},

  {"type":"NOTICE_BAR","variant":"info","icon":"","text":"Keluhan: <kl>"},

  {"type":"STAT_CARD_ROW","vidtable":"20342033315492","table":"84214220504259//work_order",
   "search":"wo◼{wo}","cards":"Jenis◼jn◼neutral★Unit◼un◼neutral★Teknisi◼tn◼accent","highlight":"tn",
   "text":"—"},

  {"type":"TIMELINE","variant":"ledger","flag":"timeline","vidtable":"20342033315492",
   "table":"84214220504259//event","conditions":"[[◀ref▶◼{wo}]]",
   "period":"Semua◼315360000000","periodDefault":"315360000000","timeField":"t",
   "title":"Kronologi","subtitle":"{count} langkah","groupField":"",
   "badgeField":"ttl","badgeMap":"","headText":"<ts>","titleText":"<ttl>","subText":"oleh <cn>",
   "itemText":"","expandable":"FALSE"},

  {"type":"LIST_ACTION_CARD","...":"...","route":"vertikaTeknoLokaciptaServiceAssign","routeParams":"wo◼{wo}","...":"..."}
]}
```

Perhatiin: **tiap widget di page B nge-query sendiri pakai `{wo}`** —
- HEADER `search:"wo◼{wo}"` → baca 1 doc WO.
- STAT_CARD_ROW `search:"wo◼{wo}"` → doc yang sama.
- TIMELINE `conditions:"[[◀ref▶◼{wo}]]"` → query event yang ref-nya WO ini.
- Tombol aksi lempar `{wo}` lagi ke page bawahnya.

---

## 4. Alur data — INI jawaban "passing antar page"

```
[ServiceWOList]
   LIST_CARD  route=ServiceWODetail  routeParams="wo◼{wo}"
        │
        │  yang jalan cuma nilai:  wo = "JOB-1204"      (kunci, bukan objek)
        ▼
[ServiceWODetail]   ← {wo} = "JOB-1204"
   HEADER      search      = "wo◼{wo}"          ─┐
   STAT_ROW    search      = "wo◼{wo}"           ├─ tiap widget QUERY ULANG dari Firestore
   TIMELINE    conditions  = "[[◀ref▶◼{wo}]]"   ─┘   pakai kunci itu
        │
        │  lempar {wo} lagi
        ▼
[ServiceAssign]  routeParams="wo◼{wo}"  → assign teknisi ke WO ini
```

**Padanan code:**

| Code biasa | SDUI JSON |
|---|---|
| `Navigator.push(Detail(job: jobObj))` — lempar OBJEK | `route:Detail, routeParams:"wo◼{wo}"` — lempar KUNCI |
| Detail baca `widget.job.keluhan` | widget `search:"wo◼{wo}"` → re-baca doc, ambil `<kl>` |

**Firestore = memori bersama. Yang jalan antar-page = kunci. Doc di-baca ulang di tujuan.** (NoSQL denorm → 1 doc lengkap → re-baca murah.)

**`wizardKey` = NOL di sini.** Semua page di atas cuma baca/tampil → gak perlu draft. `wizardKey` baru muncul kalau lu numpuk input lintas-step SEBELUM save (builder). Buat view/detail/form-1-halaman → gak ada.

---

## 5. Coverage penuh AC pakai generic-core

| Surface | Page | Generic-core | wizardKey? |
|---|---|---|---|
| Admin | WO list → detail → assign | LIST_CARD, WORKSPACE_HEADER, STAT_CARD_ROW, TIMELINE, LIST_ACTION_CARD, tablePicker | ❌ |
| Admin | Buat order | split 3 route: textField/tablePicker → SELECTABLE_BTN → SELECTABLE_BTN + `sendButtonGpsWithEvent` | ❌ (form biasa) |
| Teknisi | jadwal → eksekusi | LIST_CARD, WORKSPACE_HEADER, GET_IMAGES, SELECTABLE_BTN, signaturePad, sendButtonGpsWithEvent, PRN | ❌ |
| Teknisi | konfirmasi unit | tablePicker multi | ❌ |
| Registry | list → detail | LIST_CARD (badge derive), WORKSPACE_HEADER, STAT_CARD_ROW, TIMELINE | ❌ |
| Admin | **invoice/requote (line-item)** | PRN/RECEIPT_DOC + **1 builder line-item** | ✅ hanya di sini (numpuk baris sebelum terbit) |

**Kesimpulan:** seluruh AC = generic-core + page baru. `wizardKey` cuma nongol di 1 tempat (builder line-item invoice), dan itu **wajar** karena satu-satunya yang numpuk input multi-baris sebelum save. Sisanya nol.

---

## 6. Yang generic-core BELUM cakup (jujur)

1. **Line-item builder harga** (invoice/requote) — butuh 1 widget generic baru (`LINE_ITEM` bersih, bukan taskItemBuilder galon). Di sinilah wizardKey sah.
2. **Badge kondisi turunan** registry — client-derive / CF-denorm.
3. **Picker + create-inline** (unit/customer baru) — route "Tambah" terpisah.

Tiga ini kecil. Selebihnya = compose.

---

## 7. Next
Kalau model ini kepahaman & kepake → lanjut kunci skema (`work_order` + `//event` taxonomy + `asset` + `price_book`) lalu bangun **M1 = Teknisi happy-path** (paling reuse, nol widget baru).
