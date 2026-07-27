# Dev Spec — GROUP_PICKER `src:"doc"` (Flutter)

**Tanggal:** 2026-07-21 · **Untuk:** Flutter dev (renderer GROUP_PICKER).
**STATUS 2026-07-23: SHEET-SIDE LIVE.** Config §6.2 terpasang di op1Screen `TestBroadcast@977` (Widget template `groupPicker@302`, doc-variant, 21 placeholder G..AA; `notification_grant` masuk registry `auzSettings!J56`). Data live di Firestore terkonfirmasi (doc broadcast `gk=broadcast_{userVid}` + cc/site/vid; doc single `gk=single_{av}` + `r`=vid `◆`-join, dipakai CF bukan picker).
**Menambah:** 1 mode sumber baru `src:"doc"` ke GROUP_PICKER.
**Induk spec:** `group-picker-widget-dev-spec.md` (§3.1 `src`) — sefolder.

---

## 1. Tujuan (1 kalimat)

GROUP_PICKER punya `src:"static"` (baca string dari CELL) & `src:"table"` (query
collection → tiap doc = 1 option). **Tambah `src:"doc"`**: query **1 doc** Firestore,
baca **1 field string** (`nama◆id⭘…`), **split** jadi options. Ini buat picker
broadcast baca grant dari Firestore (bukan cell), tanpa bikin banyak doc.

## 2. Ini cuma GABUNGAN yang sudah ada

```
src:doc  =  query 1 doc   +   baca 1 field string   +   split
            └ engine src:table ┘   └────── parse src:static ──────┘
```
Query = pakai engine yang sama `src:table` (cuma Limit 1). Split = pakai parser yang
sama `src:static` (`pairSep`/`itemSep`). **Tidak ada logika parsing baru.**

## 3. Config group `src:"doc"`

```jsonc
{
  "key":   "cc",                                   // → keyPosition (blv). cc/site/vid.
  "label": "Cost Center",                          // teks tab
  "src":   "doc",
  "vidtable": "20342033315492",                    // db (tenant vid)
  "table":    "84214220504259//notification_grant",// collection (tenant-scoped)
  "search":   "gk◼broadcast_◁sessionVid▷",         // WHERE: field◼value → cari 1 doc
  "field":    "cc"                                  // field string yg dibaca + di-split
}
```

| field | isi |
|---|---|
| `src` | `"doc"` |
| `vidtable` / `table` | lokasi collection (sama format `src:table`) |
| `search` | `field◼value` → query `where field == value`, **ambil 1 doc** (Limit 1). Value boleh token `◁sessionVid▷` (di-resolve saat load). |
| `field` | nama field di doc itu yang isinya string `nama◆id⭘…` |
| `pairSep`/`itemSep` | dari top-level GROUP_PICKER (`◆` / `⭘`) — dipakai split |

## 4. Perilaku renderer (step-by-step)

Saat group `src:"doc"` aktif / picker load:
1. Resolve token di `search` (`◁sessionVid▷` → vid user login).
2. Query `table` collection **WHERE** `search` (`gk == "broadcast_85924392055168"`), **Limit 1**.
3. Dapat 1 doc → baca field `field` (`"cc"`) → string.
4. **Split**: `itemSep`(`⭘`) → item; tiap item `pairSep`(`◆`) → `[nama, id]`. Tampil **nama**, value **id**. (identik `src:static`)
5. Emit tetap sama: `keyPosition`=`key`, `valuePosition`=id terpilih (`◆`/`|`-join), `labelPosition`=nama.

**Edge:**
- Query 0 doc / field kosong / field gak ada → **list kosong** (pakai `emptyText`), tab tetap muncul.
- Doc ada tapi string malformed → item yang gak ada `◆` di-skip (jangan crash).

## 5. `sessionVid`

= vid user yang **login** (pemilik sesi). Sumber sama dengan `cv` di addToEvent
(`Settings!$B$1`). Dipakai saat picker **LOAD** (sebelum event dibuat). Renderer sudah
punya identitas user login (dipakai buat query lain) → pakai itu.

---

## 6. CONTOH LENGKAP

### 6.1 Data di Firestore (yang script tulis)
```jsonc
// collection: MobileTable/20342033315492/tables/84214220504259/notification_grant
// doc id random:
{
  "gk":   "broadcast_85924392055168",
  "cc":   "Product Group◆83674161979544⭘Kantor Pusat◆32639062303108",
  "site": "Product Group◆83674161979544⭘Kantor Pusat◆32639062303108",
  "vid":  "Imaglo CS◆78813680177365⭘Edu FM◆35339332499941⭘Functional test◆41999999104694"
}
```

### 6.2 Widget GROUP_PICKER (3 group src:doc, gk SAMA, field beda)
```jsonc
{
  "type":"GROUP_PICKER","mode":"multi","selector":"segmented","display":"inline",
  "keyPosition":18,"valuePosition":19,"labelPosition":20,
  "pairSep":"◆","itemSep":"⭘",
  "title":"Kirim ke","hint":"Pilih level lalu centang target",
  "text":"Cari◆Data tidak ditemukan◆Pilih◆Batal◆{n} dipilih",
  "groups":[
    {"key":"cc","label":"Cost Center","src":"doc","vidtable":"20342033315492","table":"84214220504259//notification_grant","search":"gk◼broadcast_◁sessionVid▷","field":"cc"},
    {"key":"site","label":"Site","src":"doc","vidtable":"20342033315492","table":"84214220504259//notification_grant","search":"gk◼broadcast_◁sessionVid▷","field":"site"},
    {"key":"vid","label":"Orang","src":"doc","vidtable":"20342033315492","table":"84214220504259//notification_grant","search":"gk◼broadcast_◁sessionVid▷","field":"vid"}
  ]
}
```

### 6.3 Runtime (Angga login, vid `85924392055168`)
```
search resolve → gk == "broadcast_85924392055168"
Tab "Cost Center" (field:cc):
   query 1 doc → field cc = "Product Group◆83674161979544⭘Kantor Pusat◆32639062303108"
   split → [ Product Group|83674161979544 , Kantor Pusat|32639062303108 ]
   tampil:  ☑ Product Group   ☐ Kantor Pusat
Tab "Orang" (field:vid):
   field vid = "Imaglo CS◆78813680177365⭘Edu FM◆35339332499941⭘Functional test◆41999999104694"
   split → 3 pilihan (Imaglo CS / Edu FM / Functional test)

Centang "Product Group" di tab Cost Center → submit:
   ◁18▷ (blv)  = "cc"
   ◁19▷ (bcc)  = "83674161979544"        (id, bukan nama)
   ◁20▷ (label)= "Product Group"
```
Konsumen (tombol kirim) wire `◁18▷→blv`, `◁19▷→bcc` ke prop `notification` /
addToEvent. Widget cuma nulis ke posisi (wiring-agnostic).

---

## 7. Yang TIDAK berubah
- Toggle group, multi/single, emit key+value(+label) → sama persis `src:static`/`src:table`.
- Parsing string → sama `src:static`.
- Query engine → sama `src:table` (cuma Limit 1 + baca 1 field, bukan list docs).

## 8. Acceptance
- [ ] Group `src:"doc"` → query 1 doc by `search`, baca `field`, split → options (tampil nama, value id).
- [ ] `◁sessionVid▷` di `search` ke-resolve ke vid user login.
- [ ] 3 group beda `field` (cc/site/vid), `search`/gk sama → tiap tab tampil options-nya.
- [ ] Doc gak ada / field kosong → list kosong (emptyText), gak crash.
- [ ] Submit → `keyPosition`=key group aktif, `valuePosition`=id `◆`/`|`-join.

## 9. Kontrak (referensi)
- Doc `notification_grant` (broadcast): `gk="broadcast_{userVid}"`, field `cc`/`site`/`vid` = string `nama◆id⭘…`. Ditulis grant script (Apps Script SA) — lihat `../../cloud-function/docs/notification-grant-script-spec.md`.
- Emit picker → `blv`+`bcc` → CF fanout (`cloud-function/internal/push`, sudah jalan).
