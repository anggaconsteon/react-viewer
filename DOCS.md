# DOCS — `json/request.json` Field Reference

Dokumentasi setiap field di `json/request.json`. Tujuan: supaya jelas apa kegunaannya, kapan dipakai (list mode vs detail mode), dan bagaimana Flutter harus interpret tiap nilai.

---

## Konteks Singkat

Satu file JSON ini melayani **dua mode rendering** sekaligus:

1. **List mode** — kartu "Pending Approvals" yang nampilin banyak baris request (Image 1).
2. **Detail mode** — saat user tap satu baris di list, Flutter buka layar detail (Image 2 + Image 3 stacked).

Flutter pakai field-field yang sama untuk merender kedua mode. Yang membedakan: `conditions` filter banyak baris di list, sedangkan di detail Flutter narrow ke satu baris pakai `rowKey` yang di-tap.

---

## Field-by-Field

### 1. `type` — `"APPROVAL"`

Tipe widget. Bilang ke Flutter: "ini widget approval list dengan tombol Approve/Reject". Flutter pakai value ini untuk pilih renderer + behavior bawaan (misalnya tap baris → navigate ke detail otomatis untuk type ini).

Nilai legal di project ini: `APPROVAL`, `displayList`, `TXT`, `HORIZONTAL_ICON`, `location`, `RBT`, dst (lihat folder `json/`).

---

### 2. `ledgerCode` — `"APPROVE-REQUEST"`

Identifier unik untuk widget ini di sistem ledger Consteon. Mirip "primary key" untuk konfigurasi. Dipakai backend/Flutter untuk:
- Lookup widget config dari spreadsheet SSOT
- Audit log "siapa pakai widget mana"
- Routing analytics

Format konvensi: UPPERCASE-DASH-SEPARATED. Contoh existing: `APPROVE-LEAVE`, `CHECK-IN`.

---

### 3. `vidTable` — `"<PLACEHOLDER_VID>"`

VID (Virtual ID) dari **table itu sendiri** di koleksi MobileTable Firebase. Bukan VID dari row data — VID dari _definisi tabelnya_.

Kegunaan: `updateTableRow` butuh `tablevid` untuk tahu tabel mana yang mau di-update. Jadi runtime Flutter ambil value ini dan inject ke action string saat tombol ditekan.

Saat deploy: replace `<PLACEHOLDER_VID>` dengan VID asli (misal `2321421421421` seperti di `approval.json`).

---

### 4. `table` — `"$<env>/<workspace>//vtl.request"`

Path Firestore lengkap ke koleksi data request. Format:
- `$<env>` — environment prefix (e.g. `$test`, `$prod`)
- `/<workspace>` — workspace/tenant slug (e.g. `agenia-demo-7`)
- `//` — delimiter folder ke koleksi (literal double-slash, ini convention Consteon)
- `vtl.request` — nama koleksi

Contoh resolved: `$prod/consteon//vtl.request`.

---

### 5. `search` — `"7◼(CC VID)⭘18◼(Status)"`

Definisi **kolom yang di-display** di list (bukan filter). Format:
- `<field_index>◼(label)` — pasangan: index field di tabel + label header kolom
- `⭘` — pemisah antar pasangan

Di sini: kolom 1 = field `<7>` (CC VID), kolom 2 = field `<18>` (Status). Flutter render tabel/list dengan dua kolom ini sebagai header (kalau dipakai dalam mode list dengan header).

Catatan: untuk widget `APPROVAL` yang render kartu (bukan tabel), `search` lebih ke metadata schema — Flutter mungkin tidak pakai untuk visual rendering tapi tetap valid untuk runtime introspection.

---

### 6. `conditions` — `"[[◀7▶◼<CC_VID>◁1▷◼PENDING]]"`

**Filter baris** untuk list mode. Format: 2D array string.

Outer `[[ ... ]]` — array of rule sets (semua rule set di-OR).
Inner `[ ... ]` — satu rule set (semua kondisi di-AND).

Kondisi di sini:
- `◀7▶◼<CC_VID>` — field 7 di row HARUS sama dengan `<CC_VID>` (token runtime; Flutter inject CC VID supervisor yg login)
- `◁1▷◼PENDING` — value referensi (right-payload pos 1) ekspektasinya `PENDING` (masuk ke `toDo` filter)

Hasil: list cuma nampilin request PENDING di Cost Center si supervisor.

`<CC_VID>` adalah **token runtime** — bukan hardcoded string. Flutter resolve token ini dari session login.

---

### 7. `toDo` — `"PENDING"`

Status target yang ditampilkan di list. Filter level berikutnya di atas `conditions`. Bilang Flutter: "list ini fokus ke baris ber-status PENDING saja". Di-pair dengan `conditions` untuk narrow result.

Nilai legal: `PENDING`, `APPROVED`, `REJECTED` (uppercase, sesuai status enum di field `<18>`).

---

### 8. `rowKey` — `"<1>"`

**Field penting untuk row→detail handoff.** Bilang Flutter: "kalau user tap baris di list, ambil value field `<1>` (Request VID) dari baris itu sebagai scope key untuk detail screen".

Tanpa field ini, Flutter tidak tahu request mana yang harus dimuat di detail. Dengan field ini, alur jadi:
1. User tap baris X di list.
2. Flutter ambil value `<1>` dari baris X (misal `VID-REQ-001`).
3. Flutter buka detail screen dengan scope `<1> = VID-REQ-001`.
4. Detail render data dari row yang sama, plus query comments dengan FK match ke VID itu.

`<1>` = Request VID (lihat schema). Selalu unik per row.

---

### 9. `text` — string 13 segmen `◆`-delimited

Semua label UI yang fixed (tidak dari data) dijejer dalam SATU string. Flutter split pakai `◆` jadi array, lalu index ke posisi yang dia butuh.

| Pos | Value | Render di mana |
|---|---|---|
| 1 | `Pending Approvals` | List card header title |
| 2 | `WORKER` | Detail: header card worker |
| 3 | `<4> · <5> · <6>` | Template subtitle worker (role · site · city) — kontainer template, Flutter substitute `<N>` dari data row |
| 4 | `<9>` | Detail: judul request |
| 5 | `Submitted <17>` | Detail: line "Submitted <tanggal>" |
| 6 | `Date` | Label meta row |
| 7 | `Start time` | Label meta row |
| 8 | `End time` | Label meta row |
| 9 | `Location` | Label meta row |
| 10 | `Shift affected` | Label meta row |
| 11 | `REASON` | Header section reason |
| 12 | `CONVERSATION` | Header section conversation |
| 13 | `Add a comment...` | Placeholder input comment |

Kenapa dijadikan satu string? Karena pattern Consteon DSL: kompresi maksimal, satu field carry banyak label. Mirip `display-list.json`.

---

### 10. `content` — `"Date: <10>\nStart time: <11>\n..."`

Body **meta-rows** di kartu IZIN (Image 2). Pasangan label-value, dipisah `\n` (newline literal). Flutter split per `\n`, render tiap baris sebagai key-value row.

Kenapa label diulang di sini padahal sudah ada di `text`? Karena `content` = baris key-value yang LIVE bareng (label + value), sedangkan `text` = label statis untuk header/section. `content` template sudah include placeholder `<N>` yang akan di-replace dari data.

Contoh resolved (data sample dari Image 2):
```
Date: 2026-04-24
Start time: 10:00
End time: 12:00
Location: Kantor BPJS Sudirman
Shift affected: Shift A · 06:00–14:00
```

---

### 11. `reason` — `"<16>"`

Body paragraph alasan request. Field tunggal pointing ke `<16>` di data row. Dirender di section terpisah (di bawah header `REASON` dari `text` pos 11).

Kenapa dipisah dari `content`? Karena reason adalah free-form paragraph, beda visual treatment dari meta key-value rows. Plus reason bisa multi-line panjang.

---

### 12. `worker` — `"<3>◆<4> · <5> · <6>"`

Template untuk kartu Worker (top section detail). 2 segmen pakai `◆`:

| Segmen | Value | Render |
|---|---|---|
| 1 | `<3>` | Nama worker (bold) |
| 2 | `<4> · <5> · <6>` | Subtitle: role · site · city |

Avatar initials (`SA` di Image 2) di-derive Flutter dari nama (`<3>`) — tidak perlu field tersendiri.

Kenapa `<4> · <5> · <6>` disatukan jadi satu segmen? Karena visual = satu line subtitle. `·` literal middot character.

---

### 13. `commentTable` — `"$<env>/<workspace>//vtl.request-comment"`

Path Firestore ke koleksi comment (terpisah dari `vtl.request`). Comment = sub-collection logically tapi dimodelkan sebagai flat sibling table dengan FK ke request VID.

Kenapa pisah table tapi same JSON document? Karena:
- Single ledger code = single config doc.
- Tapi data domain comment tetap punya schema sendiri (8 fields), retention sendiri, query pattern sendiri (real-time stream).
- Pemisahan table di Firebase ≠ pemisahan widget config.

---

### 14. `commentSearch` — `"2◼(Request VID)"`

Mirip `search` tapi untuk koleksi comment. Definisi kolom display + key field. Field `<2>` = Request VID FK, ini kolom utama yang menghubungkan comment ke request parent.

---

### 15. `commentConditions` — `"[[◀2▶◼<request_vid>]]"`

**Filter comment** untuk request yang sedang di-detail. `<request_vid>` token runtime — Flutter inject value `<1>` dari row yang di-tap (lihat `rowKey`).

Hasil: detail screen cuma nampilin comments yang FK-nya match request yang sedang dibuka.

---

### 16. `commentOrderBy` — `"6 ASC"`

Sort order untuk list comment. Format: `<field_index> <direction>`.
- Field `<6>` = Timestamp comment.
- `ASC` = ascending = oldest first.

Kenapa oldest first? Karena conversation paling natural dibaca dari atas ke bawah by waktu (System submit → Worker reply → Supervisor reply → dst).

---

### 17. `comment` — `"<5>◆<6>◆<7>◆<8>"`

Template untuk **satu entry comment** di timeline. 4 segmen `◆`-delimited:

| Pos | Value | Field di vtl.request-comment |
|---|---|---|
| 1 | `<5>` | Author name |
| 2 | `<6>` | Timestamp |
| 3 | `<7>` | Body text |
| 4 | `<8>` | Event chip text (e.g. "Leave request submitted") |

Flutter render tiap entry pakai template ini. Logic visual (System pakai chip vs Worker pakai bubble pesan) di-handle Flutter berdasarkan field `<3>` (Author type) — tidak perlu di JSON.

---

### 18. `commentAddToTable` — DSL string panjang

Action string untuk **tombol Send** di input comment box. Format: `addToTable` ke `vtl.request-comment`.

Breakdown left-to-right:
| Fragment | Field target | Source value |
|---|---|---|
| `$<env>/<workspace>//vtl.request-comment` | (table path) | — |
| `<1>◼◀2▶` | Comment VID | UUID generate di device (left payload pos 2) |
| `<2>◼◁3▷` | Request VID FK | dari row context (right payload pos 3) |
| `<3>◼◁4▷` | Author type | dari session (right payload pos 4: `WORKER` / `SUPERVISOR`) |
| `<4>◼◁1▷` | Author VID | dari session (right payload pos 1) |
| `<5>◼◁2▷` | Author name | dari session (right payload pos 2) |
| `<6>◼◀1\|T7\|yyyy-MM-dd HH:mm:ss▶` | Timestamp | epoch sekarang, formatted TZ+7 |
| `<7>◼◀3▶` | Body | text dari input (left payload pos 3) |
| `<8>◼` | Event chip | empty (free comment, bukan system event) |

Symbol catatan:
- `<N>` = target field di tabel tujuan
- `◁N▷` = ambil value dari right payload (session/row)
- `◀N▶` = ambil value dari left payload (device)
- `◼` = "set to" (sama dengan `=`)
- `⭘` = pemisah antar pasangan
- `|T7|` = timezone modifier UTC+7
- `//` = delimiter folder di table path

---

### 19. `buttons` — array of 2 button objects

Array tombol Approve dan Reject. Sama-sama dipakai di list row dan di detail screen (per Q2 decision Option C).

#### 19a. Button Approve

```json
{
  "label": "APPROVED",
  "color": "green",
  "actions": "<18>◼APPROVED⭘<19>◼◁1▷⭘<20>◼◁2▷⭘<21>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶"
}
```

| Bagian | Kegunaan |
|---|---|
| `label` | Text di tombol |
| `color` | `green` — Flutter resolve ke hex hijau internal |
| `actions` | DSL untuk `updateTableRow` di `vtl.request` |

Trace `actions`:
- `<18>◼APPROVED` — set status field 18 ke literal `APPROVED`
- `<19>◼◁1▷` — set approver VID dari session
- `<20>◼◁2▷` — set approver name dari session
- `<21>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶` — set timestamp action sekarang TZ+7

One-tap. Tidak butuh konfirmasi atau alasan.

#### 19b. Button Reject

```json
{
  "label": "REJECTED",
  "color": "red",
  "actions": "<update_string>◆<addToTable_string>"
}
```

Beda dari Approve: actions chained pakai `◆`. **Dua operasi atomic**:

**Part A — `updateTableRow` di `vtl.request`** (sebelum `◆`):
- Sama shape dengan Approve, tapi status = `REJECTED`.

**Part B — `addToTable` di `vtl.request-comment`** (setelah `◆`):
- Buat comment record baru sebagai jejak alasan reject.
- `<3>` author type = `SUPERVISOR` (literal, karena yang reject pasti supervisor).
- `<7>` body = text dari input comment (`◀3▶`).
- `<8>` event chip = `Rejected` (literal label untuk tampil sebagai chip merah di conversation timeline).

**Penting:** Reject dimatikan oleh Flutter sampai input comment non-empty (gating logic di Flutter, bukan di JSON). Ini decision dari interview (Q6).

---

## Payload Convention (Untuk Action Strings)

Token `◁N▷` dan `◀N▶` di action strings = referensi ke "payload" yang Flutter inject saat runtime. Ada 2 payload:

### Right Payload (`◁N▷`) — context dari session/row

| Pos | Content | Source |
|---|---|---|
| `◁1▷` | VID approver atau author | Session login user |
| `◁2▷` | Nama approver atau author | Session login user |
| `◁3▷` | Request VID (= `<1>` row aktif) | Row context |
| `◁4▷` | Role author (`WORKER`/`SUPERVISOR`) | Session login user |

### Left Payload (`◀N▶`) — context dari device

| Pos | Content | Source |
|---|---|---|
| `◀1▶` | Timestamp epoch sekarang | Device clock |
| `◀2▶` | UUID baru | Device generator |
| `◀3▶` | Text dari input comment | UI input field saat tombol Send/Reject ditekan |

Flutter punya mapping internal antara position-payload ↔ source value. Saat eksekusi action, Flutter expand semua `◁N▷`/`◀N▶` jadi value real, baru dikirim ke Firebase.

---

## Mode Flow Recap

### List mode (Image 1)
1. Flutter load `request.json`.
2. Apply `table` + `search` + `conditions` + `toDo` → query Firebase, dapat N baris PENDING.
3. Render N kartu pakai `text[1]` (header) + per-row data + `buttons` (tombol inline).
4. Tombol Approve = fire `updateTableRow` ke baris itu.
5. Tap body baris = pakai `rowKey` (`<1>`) dari baris itu, navigate ke detail.

### Detail mode (Image 2 + Image 3)
1. Flutter pakai `<1>` dari baris yg di-tap sebagai scope.
2. Render Worker section pakai `text[2]` header + `worker` template.
3. Render IZIN section pakai `text[4]` title + `text[5]` submitted + `content` meta + `text[11]` REASON header + `reason` body.
4. Render Conversation section pakai `text[12]` header + query `commentTable` filtered by `commentConditions` (FK = `<request_vid>`) + sort by `commentOrderBy`.
5. Render setiap entry pakai `comment` template.
6. Render input bar pakai `text[13]` placeholder + Send button → fire `commentAddToTable`.
7. Render bottom action bar pakai `buttons` (sama dengan list, tapi Reject sekarang gated by comment input).

---

## Catatan Engineer / Frontend

1. `<PLACEHOLDER_VID>` — replace dengan VID Firebase asli saat deploy.
2. `$<env>/<workspace>` — replace per environment.
3. `<CC_VID>` di `conditions` — runtime token, Flutter inject dari session.
4. `<request_vid>` di `commentConditions` — runtime token, Flutter inject dari `rowKey` value baris yang di-tap.
5. Flutter handle visual mapping untuk `<8>` (request type) → icon/warna kartu list. Tidak ada di JSON.
6. Flutter handle visual mapping untuk `<3>` (comment author type) → bubble style chip vs message. Tidak ada di JSON.
7. Reject button gating (disabled saat comment empty) = Flutter responsibility.
8. Tap row navigation = Flutter native behavior untuk `type: APPROVAL` widgets, gunakan `rowKey` value.
