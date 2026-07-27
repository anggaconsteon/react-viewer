# Titik Patroli — App-First Location + Generate LQR (Dev Spec)

**Tanggal:** 2026-07-22
**Buat:** dev Go (CF `onLocationCreate`) + builder op1Screen (page TitikPatroli)
**Status:** PROPOSED (nunggu dev CF; page-edit bisa jalan duluan)
**Konteks / Konsumen pertama:** `op1Screen!vertikaTeknoLokaciptaTitikPatroli` (row 959), collection `84214220504259//location`
**Referensi:** `map-point-picker-widget-dev-spec.md` (MAP_POINT_PICKER), dict book (location tab), pola fan-out CF `internal/fate` `onProjectCreate` (mv[]→assign)

---

## 1. Kenapa

Bikin titik patroli sekarang **manual banget**: ada list LQR id + 1 sheet mapping (site ↔ Location QR code + radius + flag), lalu **copy-paste manual** ke op1 / ke tiap user. Effort besar, rawan salah.

Mau **app-first**: admin isi titik dari app → masuk `location` otomatis. 2 masalah inti:
1. **`li` (Location ID = LQR)** harus di-**generate unik** + dicek belum kepakai di Firebase. Pola id: `0lefc05bc4c884bd590a3a13c8d99663b1dfd371d8` — prefix `0`=no-encrypt, `l`=marker location, lalu 40 hex.
2. **1 titik bisa masuk >1 site.** Submit 1× → **N doc location**, SEMUA data sama (nama/lat/long/radius/**li sama**), beda cuma `sv`/`sn` + flag site-nya.

**Keputusan user (dikonfirmasi 2026-07-22, terkunci):**
- Generate `li` di **CF** (server jamin unik + atomic). Format **mirror `0l`+40hex** dulu; **algoritma di-isolasi di 1 function** (`generateLqrID`) biar gampang diganti nanti.
- Site **multi-select**; fan-out N doc, cuma site yang beda.
- Cost-center + site (+flag) **diambil dari doc `site`** by `sv` (denorm ke `location`).

## 2. Konsep

Admin isi: nama titik + titik peta (lat/long via MAP_POINT_PICKER) + radius + **pilih ≥1 site**. Submit → tulis **1 draft** `location` (`lst:pending`, `li` kosong, `svs`=daftar site vid). CF `onLocationCreate` nangkep draft → **generate `li` unik** → **fan-out**: tiap site vid dibaca doc `site`-nya (ambil `sn/af/sf/av/an`) → bikin 1 doc `location` aktif (li sama) → **hapus draft**. QR patroli dirender dari `li`.

## 3. Kontrak field

### 3.1 doc `site` (SUDAH ADA — sumber denorm, dari screenshot Firebase)
| field | isi |
|---|---|
| `sv` | site vid (PK) |
| `sn` | site name |
| `sf` | **site flag** (mis. `vtl◆product-group`) |
| `av` | cost-center vid |
| `an` | cost-center name |
| `af` | **cost-center flag** (mis. `vtl◆product-group`) |
| `st` | status (`active`) |
| `en` | encrypted blob (abaikan) |

### 3.2 draft `location` (app tulis via addToEvent, `lst:pending`)
| field | isi | sumber |
|---|---|---|
| `ln` | nama titik | `◁10▷` |
| `la` | lat | `◁14▷` (MAP_POINT_PICKER latPosition) |
| `lo` | long | `◁15▷` (lngPosition) |
| `ra` | radius (m) | `◁16▷` |
| `svs` | daftar site vid — **array** (mis. `["83674161979544","32639062303108"]`) atau string `` [`a`,`b`] `` | `◁18▷` (TABLE_PICKER multi) |
| `lst` | `pending` (penanda draft — gate CF) | literal |
| `li` | **kosong** (CF yang isi) | — |
| `cv`/`cn` | creator | `{userVid}`/`{userName}` |
| `t`/`ts` | timestamp | `◀2▶` / `◀2\|T7\|…▶` |

> `li` & `sv`/`sn`/`af`/`sf` **JANGAN** ditulis app — CF yang generate + fan-out.

### 3.3 doc `location` final (CF tulis, `lst:active`) — 1 per site
| field | isi |
|---|---|
| `ln`,`la`,`lo`,`ra` | copy dari draft (sama semua site) |
| `li` | **LQR digenerate CF** (sama semua site untuk 1 titik) |
| `sv`,`sn` | site (per fan-out) |
| `af`,`sf` | cost-center-flag + site-flag (dari doc `site`) |
| `av`,`an` | cost-center vid/name (dari doc `site`; opsional tapi murah) |
| `lst` | `active` |
| `cv`/`cn`/`t`/`ts` | copy dari draft |

## 4. Contoh resolved (konkret)

Draft submit (1 titik, 2 site: Product Group `83674161979544` + Kantor Pusat `32639062303108`):
```json
{ "ln":"Pos Satpam Gerbang Timur", "la":-6.31607, "lo":106.64483, "ra":30,
  "svs":["83674161979544","32639062303108"], "lst":"pending", "li":"",
  "cv":"87544551624342", "cn":"Agenia Demo-7", "t":..., "ts":"22 Jul 2026 14:05:00" }
```
CF → `li="0lefc05bc4c884bd590a3a13c8d99663b1dfd371d8"` (unik) → 2 doc:
```json
{ "ln":"Pos Satpam Gerbang Timur","la":-6.31607,"lo":106.64483,"ra":30,
  "li":"0lefc05bc4c884bd590a3a13c8d99663b1dfd371d8",
  "sv":"83674161979544","sn":"Product Group","af":"vtl◆product-group","sf":"vtl◆product-group",
  "lst":"active","cv":"87544551624342","cn":"Agenia Demo-7","t":...,"ts":"..." }
{ "...sama...","li":"0lefc05bc4c884bd590a3a13c8d99663b1dfd371d8",
  "sv":"32639062303108","sn":"Kantor Pusat","af":"vtl◆kantor-pusat","sf":"vtl◆kantor-pusat","av":"32639062303108","an":"Kantor Pusat",
  "lst":"active", ... }
```

## 5. Kontrak `li` (LQR)

`li = "0l" + 40 hex lowercase` (total 42 char). `0`=no-encrypt, `l`=marker location. Sekarang: 20 byte acak → hex. **Isolasi di `generateLqrID()`** (user: algo bakal diubah — mungkin derive dari coords/site nanti). Uniqueness: query `location where li==kandidat`; kalau ada, ulang (tabrakan 160-bit ≈ nol, praktis 1× jalan).

```go
// crypto/rand + encoding/hex. Ganti body-nya kalau algo berubah — signature tetap.
func generateLqrID() string {
    b := make([]byte, 20)
    _, _ = rand.Read(b)
    return "0l" + hex.EncodeToString(b)
}
```

## 6. Sheet-side (page TitikPatroli @959, builder op1Screen)

Edit page existing:
1. **Buang `li◼◁17`** dari addToEvent (POINT-counter jadi `li` = SALAH). `li` sekarang dari CF.
2. **NUMBER counter** (`POINT-{{YYYY}}-{{COUNTER}}`, position 17): drop, ATAU simpan jadi `pno` (nomor titik human-readable, display doang) — **bukan** `li`.
3. **+ TABLE_PICKER (mode:multi)** baca `site` → `labelField:sn`, `valueField:sv`, capture ke `◁18▷` (field `svs`). Reuse `tablePicker`@290 (multi LIVE di Fate).
4. **addToEvent → draft** (hapus `sv`/`sn` single yang di-bake, hapus `li`; +`svs`, +`lst◼pending`; `cv`/`cn` → `{userVid}`/`{userName}` generic):
```
84214220504259//location⭘r◼4320⭘tablevid◼20342033315492⭘ln◼◁10▷⭘la◼◁14▷⭘lo◼◁15▷⭘ra◼◁16▷⭘svs◼◁18▷⭘lst◼pending⭘cv◼{userVid}⭘cn◼{userName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```
Ikut pola generic+SUBSTITUTE (`op1screen-genericize-widget`) — jangan hardcode di D.

> `svs` = multi site vid → **array** (renderer array-serialize) atau string `` [`a`,`b`] ``. **BUKAN `◼`-join.** CF parse toleran (reuse pola Fate `parseModelList`, fate.go).

## 7. Deliverable dev

**dev Go (CF):**
1. `onLocationCreate` (trigger `location` doc create) — **gate `lst==pending && li==""`** (doc aktif hasil fan-out di-skip → no self-loop).
2. `generateLqrID()` (§5) + uniqueness-check (query `li`).
3. Fan-out: **parse `svs`** (reuse `parseModelList` fate.go — toleran Firestore array ATAU string `` [`a`,`b`] `` backtick-comma) → tiap `sv`: **`site.Doc(sv).Get`** (doc-id = sv, ambil `sn/af/sf/av/an`) → create doc `location` aktif, **doc-id deterministik `f(li,sv)`** (idempotent, re-fire = no dup).
4. **Hapus draft** setelah fan-out (atau tandai processed). Re-fire draft-event → draft gone → skip.
5. Site tak ketemu / `svs` kosong → skip site itu (log), jangan gagalin yang lain.

**builder op1Screen:** §6 (page edit).

## 8. Dictionary
- **location** tab: pastikan ada `li` (LQR string `0l`+40hex), `af` (cost-center flag), `sf` (site flag), `av`/`an` (cost-center vid/name denorm), `lst` (`pending`/`active`), `svs` (draft-only, multi site vid). `la/lo/ln/ra/sv/sn` sudah ada.
- **site** tab: dokumentasikan `sv/sn/sf/av/an/af/st/en` (§3.1) kalau belum.

## 9. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| Page: buang li-counter, +site-picker multi, addToEvent draft | builder op1Screen | bisa jalan duluan |
| CF `onLocationCreate`: generate li + uniqueness + fan-out + hapus draft | dev Go | PROPOSED |
| `generateLqrID()` isolasi (algo swappable) | dev Go | PROPOSED |
| Dict location `+li/af/sf/av/an/lst/svs` | builder | catat |

## 10. Not Doing (dan kenapa)
- **Render/print QR** dari `li` — di luar scope; `li` = payload QR, render ikut mekanisme QR patroli existing.
- **Pool LQR fisik (claim used-flag)** — user pilih generate-virtual dulu; kalau nanti LQR = tag fisik, ganti `generateLqrID` → claim-from-pool (signature tetap, CF doang yang berubah).
- **Edit/hapus titik** — v1 create-only.
- **`en` (encrypted blob)** di doc location — abaikan; ikut mekanisme enkripsi existing kalau perlu.

## 11. Acceptance
- [ ] Submit 1 titik + 2 site → **2 doc** `location` `lst:active`, `li` SAMA, beda cuma `sv/sn/af/sf`.
- [ ] `li` = `0l`+40hex, unik (2 titik beda → li beda).
- [ ] Draft `lst:pending` hilang setelah fan-out (gak nyangkut).
- [ ] Re-fire CF (retry) → gak ada doc dobel (doc-id deterministik).
- [ ] `af`/`sf`/`sn` benar per site (ketarik dari doc `site`).
- [ ] Nol string hardcode di Flutter (label dari config); app gak generate `li`.

## 12. Asumsi & risiko
- ✅ **Path koleksi `site`** = `{base}//site` (this-tenant `84214220504259//site`). `{base}` = prefix tenant (beda per tenant), tabel `site` pasti (dikonfirmasi user 2026-07-22). Belum di registry auzSettings — pakai path langsung kayak table lain, atau daftarin di auzSettings kalau mau rapi.
- ✅ **doc `site` di-key by `sv`** → CF `site.Doc(sv).Get` langsung (dikonfirmasi user 2026-07-22).
- ✅ **`svs` = ARRAY** (renderer array-serialize) / string `` [`a`,`b`] `` — BUKAN `◼`-join (dikonfirmasi via CF Fate `parseModelList` 2026-07-22). CF reuse parser toleran itu.
- [ ] **TABLE_PICKER multi array-serialize LIVE di renderer?** Memory: `tablePicker`@290 multi LIVE. Tapi Fate `SELECTABLE_BTN` multi masih gated (butuh Flutter multi+array-serialize). VERIFY di device: multi site kesimpen jadi array/`[`…`]` beneran. Kalau belum → gated (renderer duluan).
- [ ] `av`/`an`/`af`/`sf` field names benar (dari screenshot Firebase site 2026-07-22). `af`=cost-center-flag, `sf`=site-flag.
- [ ] Draft di collection `location` (gate `lst:pending`) vs collection `location_request` terpisah — dipilih `location`+gate (1 collection, hemat); risiko N self-trigger no-op (murah, di-skip gate).

**Referensi:** `map-point-picker-widget-dev-spec.md`, `internal/fate` onProjectCreate (fan-out), `task-item-picker-search-sort-dev-spec.md` (contoh split CF+builder), dict book location/site.
