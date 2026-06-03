# Real Estate Flow — addToTable / updateTableRow Design

**Source**: op1Screen rows 704–836+ (Vertika Tekno Lokacipta real estate pages)
**Reference page**: vertikaTeknoLokaciptaReportMeetingOwner (row 704–721)

---

## 1. addToTable DSL — token cheatsheet

```
⭘key◼value⭘key◼value⭘<N>◼value...
```

| Symbol | Codepoint | Meaning |
|--------|-----------|---------|
| `⭘` | U+2B58 | Pair separator (between key/value pairs) |
| `◼` | U+25FC | Inner separator (key from value) |
| `<N>` | literal | Target table column index (1-based, positional) |
| `◁N▷` | U+25C1 / U+25B7 | **Reference to widget value at op1Screen seq# N** within current page (col A) |
| `◀ ... ▶` | U+25C0 / U+25B6 | **Formatter token** (e.g. `2\|T7\|Ddd MMM yyyy HH:mm` = pos 2, type 7 = server timestamp formatted) |
| literal | — | Static value baked into formula |

**Header keys** (always at start, no `<N>` slot):
- `retention` — TTL in minutes (4320 = 3 days)
- `description` — activity domain (`report-activity`, `report-prospect`)
- `flag` — activity subtype label (`meeting`, `marketing`, etc.)

**Body** = numbered slots `<1>` to `<N>` mapped to target table columns.

---

## 2. Visual walkthrough — Meeting Owner page (row 704)

### Page widget rows (op1Screen!A705–A720)

```
seq# | widget                  | label               | input type
-----+-------------------------+---------------------+------------------
 1   | topMain                 | (header gradient)   | static
 2   | separator               | -                   | -
 3   | text                    | "Meeting Owner"     | static title
 4   | textField               | Nama Klien          | text
 5   | textField               | Property            | text
 6   | lqrTextField1           | (Property QR scan)  | qr-link → master
 7   | numericField            | Asking Price        | number
 8   | separator               | -                   | -
 9   | displayDropDownData     | Tipe Properti       | enum (House/Apartment/Land/Ruko/...)
10   | displayDropDownData     | Lead Source         | enum (Canvassing/Referral/Online/...)
11   | separator               | -                   | -
12   | getImages1              | Property Photo      | photo[]
13   | radio                   | Hasil Aktivitas     | radio (Potential/Follow Up/...)
14   | 3LineBorderForm         | Catatan             | textarea
15   | displayDropDownData     | Next Action         | enum (Follow-up/Showing/Proposal/...)
16   | sendButtonGpsAddTable   | "Kirim"             | submit (carries addToTable)
```

### addToTable string at row 720 col D (the Kirim button)

```
⭘retention◼4320
⭘description◼report-activity
⭘flag◼meeting
⭘<1>◼report-prospect-owner
⭘<2>◼◀2|T7|Ddd MMM yyyy HH:mm▶
⭘<3>◼87544551624342
⭘<4>◼Agenia Demo-7
⭘<5>◼◁5▷
⭘<6>◼◁11▷
⭘<7>◼◁10▷
⭘<8>◼Product Group
⭘<9>◼Product Group
⭘<10>◼◁3▷
⭘<11>◼◁4▷
⭘<12>◼◁12▷
⭘<13>◼◁13▷
⭘<14>◼◁4▷
```

### How frontend resolves it on submit

```
TARGET TABLE ROW (positional):
col 1  = "report-prospect-owner"           [literal]
col 2  = "11 May 2026 14:32"               [server time, formatted]
col 3  = "87544551624342"                  [employee VID, baked]
col 4  = "Agenia Demo-7"                   [employee name, baked]
col 5  = <value of widget seq#5>           [Property text  — "Villa Permata"]
col 6  = <value of widget seq#11>          [separator — empty? bug or padding]
col 7  = <value of widget seq#10>          [Lead Source — "Referral"]
col 8  = "Product Group"                   [cost center, baked]
col 9  = "Product Group"                   [cost center 2, baked]
col 10 = <value of widget seq#3>           [Title text "Meeting Owner" — header]
col 11 = <value of widget seq#4>           [Nama Klien — "Pak Budi"]
col 12 = <value of widget seq#12>          [Property Photo URLs JSON]
col 13 = <value of widget seq#13>          [Hasil Aktivitas — "Follow Up"]
col 14 = <value of widget seq#4>           [Nama Klien again — duplicate intentional]
```

### Plus auto-injected by sendButtonGpsAddTable

- `gpsPosition: 2` → adds GPS lat/lng as col 2 input (parallel column or merged)
- `chain: DO_DIALOG` → after save, show "Terkirim" + Ok button → route back

---

## 3. Why slot mapping looks weird

Looking at `<5>◼◁5▷ <6>◼◁11▷ <7>◼◁10▷ <10>◼◁3▷ <11>◼◁4▷` — slots not in widget row order. This is because **target table column order differs from form display order**. Designer arranged form by UX flow (Client first, then Property), but DB table columns ordered by reporting needs (Property first, then Client metadata).

This is **the core design decision**: separate UX layout from DB schema via positional mapping.

---

## 4. All 8 real estate pages — full schema

### Page A: Meeting Owner (704–721)
- Title: Meeting Owner
- Inputs: Nama Klien, Property name, Property QR, Asking Price, Tipe Properti, Lead Source, Property Photo, Hasil Aktivitas, Catatan, Next Action
- Submit flag: `report-prospect-owner`

### Page B: Add Listing (722–741)
- Title: Add Listing
- Inputs: Nama Klien, Property name, Property QR, Tipe Properti, **Listing Type** (radio: Sale/Rent), Asking Price, **Negotiable** (checkBox), Lead Source, Property Photo, Hasil Aktivitas, Catatan, Next Action
- Submit flag: `report-prospect-owner` (likely should be `report-listing-add`)

### Page C: Marketing Property (742–761)
- Title: Marketing Property
- Inputs: Nama Klien, Property name, Property QR, Tipe Properti, **Marketing Activity** (radio), Asking Price, Negotiable, Lead Source, Property Photo, Hasil Aktivitas, Catatan, Next Action
- Submit flag: `report-prospect-owner` (should be `report-marketing-property`)

### Page D: Meeting Buyer (762–774)
- Title: Meeting Buyer
- Inputs: Property QR, **Hasil Aktivitas** (DRD: Potential/Follow Up/Not Interested), Nama Klien, Next Action, Property Photo, Catatan
- Submit flag: `report-activity-meeting`

### Page E: Showing (775–787)
- Title: Showing
- Inputs: Nama Buyer, Property QR, **Hasil Jenis Interest**, Next Action, Property Photo, Catatan
- Submit flag: `report-activity-showing`

### Page F: Follow Up (788–802)
- Title: Showing (mislabeled — should be Follow Up)
- Inputs: Nama Buyer, Property QR, **Channel** (WhatsApp/Telp/Email), **Conversation Result**, Next Action, Property Photo, Catatan
- Submit flag: `report-activity-followup`

### Page G: Deal Progress (803–819)
- Title: Showing (mislabeled — should be Deal Progress)
- Inputs: Nama Buyer, Property QR, **Deal Stage** (DRD), **Price** (numeric), **Expected Closing** (datePicker), Next Action, Property Photo, Catatan
- Submit flag: `report-activity-deal`

### Page H: Prospect Owner (820–836+)
- Title: Prospect Owner
- Inputs: Location (text), Property QR, Tipe Properti, Lead Source, Nama Klien, Property Photo, Hasil Aktivitas, **Keterangan**, Next Action
- Submit flag: `report-prospect-*`

---

## 5. Data dictionary — union of all real estate fields

### Auto / system (no widget, baked into addToTable formula)

| Field | Source | Example |
|---|---|---|
| myVid | session VID | `87544551624342` |
| employeeName | session profile | `Agenia Demo-7` |
| timestamp | server time formatter `◀2\|T7\|...▶` | `11 May 2026 14:32` |
| costCenter1 | session org | `Product Group` |
| costCenter2 | session org parent | `Product Group` |
| gpsLatLng | sendButtonGpsAddTable auto | `[-6.31607,106.64483]` |
| activityDomain | header `description` | `report-activity` / `report-prospect` |
| activitySubtype | header `flag` | `meeting`, `marketing`, ... |
| reportTag | `<1>` literal | `report-prospect-owner`, `report-activity-meeting` |

### Client side

| Field | Widget | Type | Pages |
|---|---|---|---|
| namaKlien | textField | text | A, B, C, H |
| namaBuyer | textField | text | D, E, F, G |
| channel | DRD | enum: WhatsApp, Telp, Email, Direct | F |

### Property side

| Field | Widget | Type | Pages |
|---|---|---|---|
| propertyName | textField | text | A, B, C |
| propertyCode | lqrTextField1 | qr-link → property master | A–H |
| location | text | text (free) | H |
| tipeProperti | DRD | enum: House, Apartment, Land, Ruko, Office, Villa | A, B, C, H |
| listingType | radio | enum: Sale, Rent | B |
| propertyPhoto | getImages1 | string[] (URLs) | A–H |

### Commercial

| Field | Widget | Type | Pages |
|---|---|---|---|
| askingPrice | numericField | money | A, B, C |
| price | numericField | money (final/agreed) | G |
| negotiable | checkBox | bool | B, C |
| leadSource | DRD | enum: Canvassing, Referral, Online, Walk-in, Cold-call, Social Media | A, B, C, H |

### Activity outcome

| Field | Widget | Type | Pages |
|---|---|---|---|
| hasilAktivitas | radio / DRD | enum: Potential, Follow Up, Not Interested, Closed | A, B, C, D, H |
| hasilJenisInterest | DRD | enum: High, Medium, Low | E |
| marketingActivity | radio | enum: Brochure, Open House, Tour, Ad | C |
| conversationResult | DRD | enum: Reached, Voicemail, No Answer | F |
| dealStage | DRD | enum: Initial, Negotiation, Offer Sent, Closed Won, Closed Lost | G |
| expectedClosing | datePicker | date | G |

### Continuation

| Field | Widget | Type | Pages |
|---|---|---|---|
| nextAction | DRD | enum: Follow-up, Showing, Proposal, Close, Drop | A–H |
| catatan | 3LineBorderForm | textarea | A–G |
| keterangan | 3LineBorderForm | textarea | H |

---

## 6. Recommended target table — `crm_realestate_activity`

Single positional table, discriminator-based.

```
col | name              | type      | source                | notes
----+-------------------+-----------+-----------------------+-----------------
 1  | activity_subtype  | string    | <1> literal           | report-* tag
 2  | timestamp         | datetime  | <2> formatter ◀...▶   | server time
 3  | employee_vid      | string    | <3> session           | FK → employee
 4  | employee_name     | string    | <4> session           | denormalized
 5  | property_code     | string    | <5> ◁lqr▷             | FK → property master
 6  | property_name     | string    | <6> ◁text▷            | freeform display
 7  | client_name       | string    | <7> ◁text▷            | klien OR buyer
 8  | cost_center_code  | string    | <8> session           |
 9  | cost_center_name  | string    | <9> session           |
10  | tipe_properti     | enum      | <10> ◁DRD▷            | nullable
11  | lead_source       | enum      | <11> ◁DRD▷            | nullable
12  | asking_price      | number    | <12> ◁numeric▷        | nullable
13  | hasil_aktivitas   | enum      | <13> ◁radio/DRD▷      | nullable
14  | next_action       | enum      | <14> ◁DRD▷            | nullable
15  | property_photo    | json[]    | <15> ◁getImages▷      | URLs
16  | notes             | string    | <16> ◁textarea▷       | catatan/keterangan
17  | gps_lat_lng       | json      | gpsPosition auto      | [lat,lng]
18  | listing_type      | enum?     | <18> ◁radio▷          | only B
19  | negotiable        | bool?     | <19> ◁checkBox▷       | only B, C
20  | marketing_activity| enum?     | <20> ◁radio▷          | only C
21  | channel           | enum?     | <21> ◁DRD▷            | only F
22  | conversation_result| enum?    | <22> ◁DRD▷            | only F
23  | deal_stage        | enum?     | <23> ◁DRD▷            | only G
24  | expected_closing  | date?     | <24> ◁datePicker▷     | only G
25  | price_final       | number?   | <25> ◁numeric▷        | only G
26  | location_text     | string?   | <26> ◁text▷           | only H
```

26 cols total. Most pages fill cols 1–17, page-specific extras fill 18–26.

---

## 7. addToTable formula examples (paste into op1Screen)

### Meeting Owner (Page A) — properly normalized
Assume widgets at seq#: 4=Nama Klien, 5=Property, 6=PropQR, 7=AskingPrice, 9=Tipe, 10=LeadSource, 12=Photo, 13=Hasil, 14=Catatan, 15=NextAction.

```
⭘retention◼4320
⭘description◼report-activity
⭘flag◼meeting-owner
⭘<1>◼report-meeting-owner
⭘<2>◼◀2|T7|Ddd MMM yyyy HH:mm▶
⭘<3>◼◀3|VID▶
⭘<4>◼◀4|NAME▶
⭘<5>◼◁6▷
⭘<6>◼◁5▷
⭘<7>◼◁4▷
⭘<8>◼◀5|CC1▶
⭘<9>◼◀6|CC2▶
⭘<10>◼◁9▷
⭘<11>◼◁10▷
⭘<12>◼◁7▷
⭘<13>◼◁13▷
⭘<14>◼◁15▷
⭘<15>◼◁12▷
⭘<16>◼◁14▷
```

### Add Listing (Page B) — adds cols 18, 19
Append after col 17:
```
⭘<18>◼◁<listingTypeRow>▷
⭘<19>◼◁<negotiableRow>▷
```

### Deal Progress (Page G) — adds cols 23, 24, 25
Append:
```
⭘<23>◼◁<dealStageRow>▷
⭘<24>◼◁<expClosingRow>▷
⭘<25>◼◁<priceRow>▷
```

---

## 8. updateTableRow design (from existing pattern)

Existing pattern (page-detail-full.json lines 103, 130):

```
$test/request-approval//vtl.trial-approval
⭘tablevid◼20342033315492
⭘search◼1★<request_vid>
⭘<19>◼APPROVED
⭘<20>◼◁1▷
⭘<21>◼◁2▷
⭘<27>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶
```

**Header pairs**:
- `tablevid` — Firebase node ID untuk table itu
- `search` — `colN★value` (★ = U+2605) cari row yg col N = value

**Body**: hanya kolom yg mau diupdate. Slot lain skipped (sparse patch).

**Untuk Real Estate**, primary key = `request_vid` / `transaction_id` di col 1, generated via NUMBER widget (lihat section 11).

Update pattern jadi:
```
$<env>/<workspace>//vtl.realestate-activity
⭘tablevid◼<RE_TABLE_VID>
⭘search◼1★<activity_id>
⭘<13>◼<new hasilAktivitas>
⭘<14>◼<new nextAction>
⭘<27>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶
```

Sparse: hanya 3 kolom dipatch (status, nextAction, updated_at).

---

## 9. Bugs / inconsistencies spotted (worth fixing before adding more pages)

1. **Pages B, C, H all use flag `report-prospect-owner`** in addToTable header even though intent differs. Real differentiator is `<1>` slot. Header `flag` should mirror page intent (`listing-add`, `marketing`, `prospect-owner`).
2. **Pages F, G mislabeled "Showing"** in title text widget — copy-paste from Page E. Should be "Follow Up" / "Deal Progress".
3. **Static `87544551624342` and `Agenia Demo-7` baked into 8 formulas** — single mock employee. Should template `◀3|VID▶` / `◀4|NAME▶` so formula works for any signed-in user. Same for `Product Group` cost center.
4. **Slot reuse**: row 720 has `<11>◼◁4▷` AND `<14>◼◁4▷` — Nama Klien written to two columns. Either intentional denorm or paste error. Verify.
5. **Slot 6 references seq#11 (separator)** — separator widgets have no value, will produce empty string. Likely off-by-one error.

---

## 10. Quick sanity check before implementation

Open `vertikaTeknoLokaciptaReportMeetingOwner` in app, fill the form, check what server actually receives. Compare against col-by-col map above. Adjust slot indices if any drift.

---

## 11. Unique transaction ID — NUMBER widget pattern

Reference: `request-leave.json` line 47–56.

```json
{
    "type": "NUMBER",
    "text": "No. Permohonan:◆Akan di buat otomatis",
    "template": "REQ-{{YYYY}}-{{COUNTER(vtl.request,6)}}",
    "textColor": "blue_700",
    "size": 18,
    "executable": "execute1,generate_number",
    "position": 17,
    "margin": "8,16,8,16"
}
```

**How it works**:
- `template` = format pattern. `{{YYYY}}` → tahun, `{{COUNTER(vtl.request,6)}}` → counter Firebase node `vtl.request` 6-digit zero-padded.
- `executable: "execute1,generate_number"` → triggered saat submit (`run: "...17:generate_number..."` di Kirim button).
- `position: 17` → nilai disimpan di slot 17 widget state.
- Di addToTable, referenced sebagai `<1>◼◁17▷` → kolom 1 table = generated ID.

**Output example**: `REQ-2026-000001`, `REQ-2026-000002`, ...

### Untuk Real Estate, recommended templates:

| Page | Template | Counter node |
|---|---|---|
| Add Listing | `RE-LST-{{YYYY}}-{{COUNTER(vtl.realestate-property,6)}}` | property master |
| Meeting Owner | `RE-MTG-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}` | activity log |
| Meeting Buyer | `RE-MTG-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}` | (sama, beda subtype) |
| Showing | `RE-SHW-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}` | activity log |
| Follow Up | `RE-FUP-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}` | activity log |
| Deal Progress | `RE-DEAL-{{YYYY}}-{{COUNTER(vtl.realestate-deal,6)}}` | deal pipeline |
| Prospect Owner | `RE-PRS-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}` | activity log |

---

## 12. Recommended Firebase schema — 3 tables

Berdasarkan lifecycle entity bukan per-form:

### Table 1: `vtl.realestate-property` (master, slow-update)

Diisi dari **Add Listing** page. Updated jarang (price change, status change).

```
col | name              | type     | source             | indexed
----+-------------------+----------+--------------------+---------
 1  | property_id       | string   | NUMBER widget      | YES (PK)
 2  | created_at        | datetime | server             | YES
 3  | created_by_vid    | string   | session            | YES
 4  | created_by_name   | string   | session            |
 5  | property_name     | string   | textField          | YES (search)
 6  | property_code_qr  | string   | lqrTextField1      | YES
 7  | location          | string   | textField          | YES
 8  | tipe_properti     | enum     | DRD                | YES (filter)
 9  | listing_type      | enum     | radio: Sale/Rent   | YES
10  | asking_price      | number   | numericField       | YES (sort)
11  | negotiable        | bool     | checkBox           |
12  | photos            | json[]   | getImages1         |
13  | gps               | json     | gpsPosition        |
14  | status            | enum     | (Available/Sold/Hold) | YES
15  | updated_at        | datetime | server             |
```

### Table 2: `vtl.realestate-activity` (log, append-heavy)

Diisi dari **Meeting Owner, Meeting Buyer, Showing, Follow Up, Marketing, Prospect Owner**. High volume, immutable rows (insert-only). Update only status outcome.

```
col | name              | type     | source             | indexed
----+-------------------+----------+--------------------+---------
 1  | activity_id       | string   | NUMBER widget      | YES (PK)
 2  | created_at        | datetime | server             | YES
 3  | activity_subtype  | enum     | (meeting-owner, meeting-buyer, showing, follow-up, marketing, prospect) | YES (filter)
 4  | property_id       | string   | FK → property      | YES (join)
 5  | property_name     | string   | denorm display     |
 6  | property_code_qr  | string   | lqr scan           |
 7  | client_name       | string   | textField          | YES (search)
 8  | client_role       | enum     | (owner/buyer)      |
 9  | employee_vid      | string   | session            | YES
10  | employee_name     | string   | session            |
11  | cost_center_vid   | string   | session            |
12  | cost_center_name  | string   | session            |
13  | hasil_aktivitas   | enum     | radio/DRD          | YES
14  | next_action       | enum     | DRD                |
15  | photos            | json[]   | getImages1         |
16  | notes             | string   | 3LineBorderForm    |
17  | gps               | json     | gpsPosition auto   |
18  | channel           | enum?    | only Follow Up     |
19  | conversation_result| enum?   | only Follow Up     |
20  | marketing_activity| enum?    | only Marketing     |
21  | tipe_properti     | enum?    | denorm from prop   |
22  | lead_source       | enum?    | only Prospect/Add  |
23  | status            | enum     | (DONE/PENDING)     | YES
24  | updated_at        | datetime |                    |
```

### Table 3: `vtl.realestate-deal` (pipeline, state machine)

Diisi dari **Deal Progress** page. Updated saat stage berubah.

```
col | name              | type     | source             | indexed
----+-------------------+----------+--------------------+---------
 1  | deal_id           | string   | NUMBER widget      | YES (PK)
 2  | created_at        | datetime | server             | YES
 3  | property_id       | string   | FK → property      | YES
 4  | property_name     | string   | denorm             |
 5  | buyer_name        | string   | textField          | YES
 6  | employee_vid      | string   | session            | YES
 7  | employee_name     | string   | session            |
 8  | deal_stage        | enum     | (Initial/Negotiation/OfferSent/ClosedWon/ClosedLost) | YES
 9  | price_offered     | number   | numericField       |
10  | price_final       | number   | numericField       |
11  | expected_closing  | date     | datePicker         | YES (sort)
12  | actual_closing    | date     |                    |
13  | next_action       | enum     | DRD                |
14  | photos            | json[]   | getImages1         |
15  | notes             | string   | 3LineBorderForm    |
16  | gps               | json     | gpsPosition        |
17  | status            | enum     | (OPEN/CLOSED)      | YES
18  | updated_at        | datetime |                    |
```

### Why split 3 tables (not 1)?

| Concern | Single table | 3 tables |
|---|---|---|
| Query "all activity for property X" | Full scan | Index on `property_id` |
| Query "open deals" | Filter by status across all rows | Single table scan |
| Storage cost (Firebase RTDB) | Bigger rows, more nulls | Tighter rows |
| Update conflicts | Property edit may collide w/ activity insert | Isolated nodes |
| Index cost | Compound indices needed | Simple per-table |
| Permissions (Firebase Rules) | Single ruleset across mixed entities | Per-entity rules |

Trade-off: need **denorm** of `property_name` ke activity & deal tables (avoid join). Acceptable for read-heavy mobile clients.

---

## 13. Bug walkthrough (visual) — Q4 explanation

Lihat row 720 col D (Meeting Owner Kirim button) addToTable:

```
⭘<5>◼◁5▷    ← col 5 table = widget seq#5 value
⭘<6>◼◁11▷   ← col 6 table = widget seq#11 value  ← BUG?
⭘<7>◼◁10▷
...
⭘<11>◼◁4▷   ← col 11 = widget #4 (Nama Klien)
⭘<14>◼◁4▷   ← col 14 = widget #4 (Nama Klien) ← DUPLICATE
```

### Bug A — col 6 reads separator widget

Widget seq# di Meeting Owner page:
```
seq#1  topMain       (header, no value)
seq#2  separator     (no value)
seq#3  text "Meeting Owner"  (static)
seq#4  textField     Nama Klien      ← user input
seq#5  textField     Property        ← user input
seq#6  lqrTextField1 Property QR     ← user input
seq#7  numericField  Asking Price    ← user input
seq#8  separator     (no value)
seq#9  DRD           Tipe Properti   ← user input
seq#10 DRD           Lead Source     ← user input
seq#11 separator     (no value)      ← ← ← formula reads INI
seq#12 getImages1    Photo
seq#13 radio         Hasil
seq#14 textarea      Catatan
seq#15 DRD           Next Action
```

`<6>◼◁11▷` artinya: "isi col 6 dari nilai widget #11". Tapi widget #11 = **separator** (visual spacer, no value). Hasilnya col 6 selalu kosong/null.

**Dugaan**: should be `◁9▷` (Tipe Properti) or `◁12▷` (Photo). Need user confirm.

### Bug B — col 11 dan col 14 sama-sama Nama Klien

```
<11>◼◁4▷    Nama Klien → col 11
<14>◼◁4▷    Nama Klien → col 14
```

Dua kolom DB pegang nilai sama. Possibilities:
1. **Intentional denorm**: col 11 untuk index/search, col 14 untuk display. Common pattern.
2. **Copy-paste error**: salah satu harusnya ref widget lain (e.g. `◁15▷` Next Action).

**Cara verifikasi**: cek detail page (`vertikaTeknoLokaciptaActivityDetail` kalau ada) — kalau col 14 ditampilkan dgn label berbeda dari col 11, berarti bug. Kalau sama-sama "Nama Klien", intentional.

---

## 14. Firebase NoSQL constraints

| SQL pattern | Firebase RTDB equivalent |
|---|---|
| `WHERE col = val` | `orderByChild("col").equalTo(val)` |
| `WHERE col >= val` | `orderByChild("col").startAt(val)` |
| `ORDER BY col DESC LIMIT N` | `orderByChild("col").limitToLast(N)` (reverse client-side) |
| `JOIN` | **No JOIN**. Denormalize / dual-write / client-side merge |
| `GROUP BY` | **No GROUP BY**. Maintain summary node via write-time fan-out atau dedup di client |
| Aggregate COUNT/SUM | Counter node maintained on write |

**Implication for RE**:
- Client master table `vtl.realestate-client` is **required** (cannot group-by on activity table)
- Activities denormalize `client_name`, `property_name` (no JOIN at read time)
- Counter cols (e.g. `total_activities` in client master) maintained via Cloud Function trigger atau dual-write pattern (TBD)

## 15. Final 4-table schema

```
vtl.realestate-client/   ← register klien sekali (master)
vtl.realestate-property/ ← register properti sekali (master, dari Add Listing)
vtl.realestate-activity/ ← log aktivitas (append, denorm client/property)
vtl.realestate-deal/     ← pipeline deal (state machine)
```

### vtl.realestate-client cols

| Col | Field | Source | Index |
|---|---|---|---|
| 1 | client_id | NUMBER `RE-CL-YYYY-NNNNNN` | ★ |
| 2 | created_at | server | ★ |
| 3 | activity_subtype | literal `client-add` | |
| 4 | client_name | textField | ★ |
| 5 | phone | numericField | |
| 6 | email | textField | |
| 7 | client_type | DRD (Owner/Buyer/Investor/Both) | |
| 8 | lead_source | DRD | |
| 9 | owned_by_vid | session | ★ |
| 10 | owned_by_name | session | |
| 11 | total_activities | counter | |
| 12 | status | enum ACTIVE/INACTIVE | ★ |
| 13 | notes | textarea | |

### vtl.realestate-property cols (Add Listing target)

| Col | Field | Source | Index |
|---|---|---|---|
| 1 | property_id | NUMBER `RE-LST-YYYY-NNNNNN` | ★ |
| 2 | created_at | server | ★ |
| 3 | created_by_vid | session | ★ |
| 4 | created_by_name | session | |
| 5 | property_name | textField | ★ |
| 6 | property_code_qr | lqrTextField (own QR generated) | ★ |
| 7 | location | textField | |
| 8 | tipe_properti | DRD | ★ |
| 9 | listing_type | radio (Sale/Rent) | ★ |
| 10 | asking_price | numericField | |
| 11 | negotiable | checkBox | |
| 12 | photos | getImages1 | |
| 13 | gps | auto | |
| 14 | status | enum Available/Sold/Hold | ★ |
| 15 | updated_at | server | |
| 16 | lead_source | DRD | |
| 17 | notes | textarea | |

### vtl.realestate-activity cols (Meeting/Showing/Follow Up/Marketing/Prospect target)

| Col | Field | Source | Index |
|---|---|---|---|
| 1 | activity_id | NUMBER | ★ |
| 2 | created_at | server | ★ |
| 3 | activity_subtype | literal | ★ |
| 4 | client_id | lqr FK | ★ |
| 5 | client_name | denorm | |
| 6 | property_id | lqr FK | ★ |
| 7 | property_name | denorm | |
| 8 | property_code_qr | denorm | |
| 9 | client_role | literal (owner/buyer) | |
| 10 | employee_vid | session | ★ |
| 11 | employee_name | session | |
| 12 | cost_center_vid | session | |
| 13 | cost_center_name | session | |
| 14 | hasil_aktivitas | radio/DRD | ★ |
| 15 | next_action | DRD | |
| 16 | photos | getImages | |
| 17 | notes | textarea | |
| 18 | gps | auto | |
| 21 | tipe_properti | DRD nullable | |
| 22 | lead_source | DRD nullable | |
| 23 | status | literal DONE | |
| 24 | asking_price_snapshot | numeric nullable | |
| 25 | follow_up_date | datePicker | ★ |
| 26 | channel | nullable (Follow Up only) | |
| 27 | conversation_result | nullable (Follow Up only) | |
| 28 | marketing_activity | nullable (Marketing only) | |

### vtl.realestate-deal cols (Deal Progress target)

| Col | Field | Source | Index |
|---|---|---|---|
| 1 | deal_id | NUMBER `RE-DEAL-YYYY-NNNNNN` | ★ |
| 2 | created_at | server | ★ |
| 3 | property_id | lqr FK | ★ |
| 4 | property_name | denorm | |
| 5 | buyer_name | textField (atau FK ke client) | ★ |
| 6 | employee_vid | session | ★ |
| 7 | employee_name | session | |
| 8 | deal_stage | DRD | ★ |
| 9 | price_offered | numeric | |
| 10 | price_final | numeric | |
| 11 | expected_closing | datePicker | ★ |
| 12 | actual_closing | datePicker nullable | |
| 13 | next_action | DRD | |
| 14 | photos | getImages | |
| 15 | notes | textarea | |
| 16 | gps | auto | |
| 17 | status | enum OPEN/CLOSED | ★ |
| 18 | updated_at | server | |

## 16. Meeting Owner — FINAL addToTable

```
$<env>/<workspace>//vtl.realestate-activity
⭘retention◼4320
⭘description◼report-realestate-activity
⭘flag◼meeting-owner
⭘tablevid◼<RE_ACTIVITY_TABLE_VID>
⭘index◼1★S◼3★S◼4★S◼6★S◼10★S◼14★S◼25★D
⭘<1>◼◁4▷
⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶
⭘<3>◼meeting-owner
⭘<4>◼◁5▷
⭘<5>◼◁5|name▷
⭘<6>◼◁6▷
⭘<7>◼◁6|name▷
⭘<8>◼◁6|qr▷
⭘<9>◼owner
⭘<10>◼◀session|VID▶
⭘<11>◼◀session|NAME▶
⭘<12>◼◀session|CC_VID▶
⭘<13>◼◀session|CC_NAME▶
⭘<14>◼◁13▷
⭘<15>◼◁16▷
⭘<16>◼◁12▷
⭘<17>◼◁14▷
⭘<18>◼◀2|GPS▶
⭘<21>◼◁9▷
⭘<22>◼◁10▷
⭘<23>◼DONE
⭘<24>◼◁7▷
⭘<25>◼◁15▷
```

Widget seq# mapping (post-revisi):
- seq#4 NUMBER → activity_id
- seq#5 lqrTextField client master → client_id + client_name
- seq#6 lqrTextField property master → property_id + property_name + qr
- seq#7 numericField → asking_price snapshot
- seq#9 DRD → tipe_properti
- seq#10 DRD → lead_source
- seq#12 getImages → photos
- seq#13 radio → hasil_aktivitas
- seq#14 textarea → notes
- seq#15 datePicker → follow_up_date
- seq#16 DRD → next_action

## 17. Add Client form (NEW page — prerequisite master)

Route key: `vertikaTeknoLokaciptaAddClient`

### Page widgets (op1Screen rows TBD)

```
seq#1  topMain
seq#2  separator
seq#3  text "Tambah Klien Baru"
seq#4  NUMBER             template: RE-CL-{{YYYY}}-{{COUNTER(vtl.realestate-client,6)}}
       position 4
seq#5  textField          Nama Lengkap        position 5
seq#6  numericField       No. HP              position 6
seq#7  textField          Email               position 7
seq#8  displayDropDownData Tipe Klien         option: [Owner, Buyer, Investor, Both]  position 8
seq#9  displayDropDownData Lead Source        option: [Canvassing, Referral, Online, Walk-in, Social Media, Cold-call]  position 9
seq#10 separator
seq#11 3LineBorderForm    Catatan             position 11
seq#12 sendButtonGpsAddTable  position 251
```

### addToTable

```
$<env>/<workspace>//vtl.realestate-client
⭘retention◼4320
⭘description◼client-registration
⭘flag◼client-add
⭘tablevid◼<CLIENT_TABLE_VID>
⭘index◼1★S◼2★D◼4★S◼9★S◼12★S
⭘<1>◼◁4▷
⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶
⭘<3>◼client-add
⭘<4>◼◁5▷
⭘<5>◼◁6▷
⭘<6>◼◁7▷
⭘<7>◼◁8▷
⭘<8>◼◁9▷
⭘<9>◼◀session|VID▶
⭘<10>◼◀session|NAME▶
⭘<11>◼0
⭘<12>◼ACTIVE
⭘<13>◼◁11▷
```

Generator run: `"run": "5:disable◆6:disable◆7:disable◆8:disable◆9:disable◆11:disable◆4:generate_number◆251:disable"`

---

## 18. Add Listing form refactor (existing row 722–741)

### Patch widget seq# layout (insert NUMBER, switch property text → property generates own QR)

```
seq#1  topMain
seq#2  separator
seq#3  text "Add Listing"
seq#4  NUMBER             template: RE-LST-{{YYYY}}-{{COUNTER(vtl.realestate-property,6)}}  position 4
seq#5  textField          Nama Properti       position 5
seq#6  textField          Lokasi              position 6
seq#7  displayDropDownData Tipe Properti      position 7
seq#8  radio              Listing Type (Sale/Rent)  position 8
seq#9  numericField       Asking Price        position 9
seq#10 checkBox           Negotiable          position 10
seq#11 displayDropDownData Lead Source        position 11
seq#12 getImages1         Property Photo      position 12
seq#13 3LineBorderForm    Catatan             position 13
seq#14 sendButtonGpsAddTable  position 251
```

### addToTable

```
$<env>/<workspace>//vtl.realestate-property
⭘retention◼4320
⭘description◼property-listing
⭘flag◼property-add
⭘tablevid◼<PROPERTY_TABLE_VID>
⭘index◼1★S◼2★D◼3★S◼5★S◼6★S◼8★S◼9★S◼14★S
⭘<1>◼◁4▷
⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶
⭘<3>◼◀session|VID▶
⭘<4>◼◀session|NAME▶
⭘<5>◼◁5▷
⭘<6>◼◁4▷
⭘<7>◼◁6▷
⭘<8>◼◁7▷
⭘<9>◼◁8▷
⭘<10>◼◁9▷
⭘<11>◼◁10▷
⭘<12>◼◁12▷
⭘<13>◼◀2|GPS▶
⭘<14>◼Available
⭘<15>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶
⭘<16>◼◁11▷
⭘<17>◼◁13▷
```

`<6>` property_code_qr = pakai property_id itu sendiri (col 1) sebagai QR payload — agent scan QR di lapangan → langsung dapet ID.

---

## 19. Meeting Buyer form refactor (existing row 762–774)

```
seq#1  topMain
seq#2  separator
seq#3  text "Meeting Buyer"
seq#4  NUMBER             template: RE-MTG-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}  position 4
seq#5  lqrTextField       Pilih Klien (buyer)  table=vtl.realestate-client  position 5
seq#6  lqrTextField1      Pilih Properti       table=vtl.realestate-property  position 6
seq#7  displayDropDownData Hasil Aktivitas    [Potential, Follow Up, Not Interested]  position 7
seq#8  getImages1         Photo                position 8
seq#9  3LineBorderForm    Catatan              position 9
seq#10 TXF date           Jadwal Follow-up    position 10
seq#11 displayDropDownData Next Action        position 11
seq#12 sendButtonGpsAddTable position 251
```

### addToTable

```
$<env>/<workspace>//vtl.realestate-activity
⭘retention◼4320
⭘description◼report-realestate-activity
⭘flag◼meeting-buyer
⭘tablevid◼<RE_ACTIVITY_TABLE_VID>
⭘index◼1★S◼3★S◼4★S◼6★S◼10★S◼14★S◼25★D
⭘<1>◼◁4▷
⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶
⭘<3>◼meeting-buyer
⭘<4>◼◁5▷
⭘<5>◼◁5|name▷
⭘<6>◼◁6▷
⭘<7>◼◁6|name▷
⭘<8>◼◁6|qr▷
⭘<9>◼buyer
⭘<10>◼◀session|VID▶
⭘<11>◼◀session|NAME▶
⭘<12>◼◀session|CC_VID▶
⭘<13>◼◀session|CC_NAME▶
⭘<14>◼◁7▷
⭘<15>◼◁11▷
⭘<16>◼◁8▷
⭘<17>◼◁9▷
⭘<18>◼◀2|GPS▶
⭘<23>◼DONE
⭘<25>◼◁10▷
```

---

## 20. Showing form refactor (existing row 775–787)

```
seq#1  topMain
seq#2  separator
seq#3  text "Showing"
seq#4  NUMBER             template: RE-SHW-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}
seq#5  lqrTextField       Pilih Buyer        position 5
seq#6  lqrTextField1      Pilih Properti     position 6
seq#7  displayDropDownData Hasil Jenis Interest  [High, Medium, Low]  position 7
seq#8  getImages1         Photo               position 8
seq#9  3LineBorderForm    Catatan             position 9
seq#10 TXF date           Jadwal Follow-up   position 10
seq#11 displayDropDownData Next Action       position 11
seq#12 sendButtonGpsAddTable
```

### addToTable

```
$<env>/<workspace>//vtl.realestate-activity
⭘retention◼4320⭘description◼report-realestate-activity⭘flag◼showing
⭘tablevid◼<RE_ACTIVITY_TABLE_VID>
⭘index◼1★S◼3★S◼4★S◼6★S◼10★S◼14★S◼25★D
⭘<1>◼◁4▷⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶⭘<3>◼showing
⭘<4>◼◁5▷⭘<5>◼◁5|name▷
⭘<6>◼◁6▷⭘<7>◼◁6|name▷⭘<8>◼◁6|qr▷
⭘<9>◼buyer
⭘<10>◼◀session|VID▶⭘<11>◼◀session|NAME▶⭘<12>◼◀session|CC_VID▶⭘<13>◼◀session|CC_NAME▶
⭘<14>◼◁7▷⭘<15>◼◁11▷
⭘<16>◼◁8▷⭘<17>◼◁9▷⭘<18>◼◀2|GPS▶
⭘<23>◼DONE⭘<25>◼◁10▷
```

---

## 21. Follow Up form refactor (existing row 788–802)

```
seq#1  topMain
seq#2  separator
seq#3  text "Follow Up"             ← FIX title (was "Showing")
seq#4  NUMBER  RE-FUP-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}
seq#5  lqrTextField  Pilih Klien
seq#6  lqrTextField1 Pilih Properti
seq#7  displayDropDownData Channel  [WhatsApp, Telp, Email, Direct]  position 7
seq#8  displayDropDownData Conversation Result  [Reached, Voicemail, No Answer]  position 8
seq#9  getImages1 Photo
seq#10 3LineBorderForm Catatan
seq#11 TXF date Jadwal Follow-up berikutnya
seq#12 displayDropDownData Next Action
seq#13 sendButtonGpsAddTable
```

### addToTable

```
$<env>/<workspace>//vtl.realestate-activity
⭘retention◼4320⭘description◼report-realestate-activity⭘flag◼follow-up
⭘tablevid◼<RE_ACTIVITY_TABLE_VID>
⭘index◼1★S◼3★S◼4★S◼6★S◼10★S◼14★S◼25★D
⭘<1>◼◁4▷⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶⭘<3>◼follow-up
⭘<4>◼◁5▷⭘<5>◼◁5|name▷
⭘<6>◼◁6▷⭘<7>◼◁6|name▷⭘<8>◼◁6|qr▷
⭘<9>◼buyer
⭘<10>◼◀session|VID▶⭘<11>◼◀session|NAME▶⭘<12>◼◀session|CC_VID▶⭘<13>◼◀session|CC_NAME▶
⭘<14>◼◁8▷⭘<15>◼◁12▷
⭘<16>◼◁9▷⭘<17>◼◁10▷⭘<18>◼◀2|GPS▶
⭘<23>◼DONE⭘<25>◼◁11▷
⭘<26>◼◁7▷⭘<27>◼◁8▷
```

---

## 22. Marketing Property form refactor (existing row 742–761)

```
seq#1  topMain
seq#2  separator
seq#3  text "Marketing Property"
seq#4  NUMBER RE-MKT-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}
seq#5  lqrTextField1 Pilih Properti
seq#6  radio Marketing Activity [Brochure, Open House, Tour, Ad]
seq#7  numericField Reach / Impressions
seq#8  getImages1 Photo
seq#9  3LineBorderForm Catatan
seq#10 TXF date Jadwal Follow-up
seq#11 displayDropDownData Next Action
seq#12 sendButtonGpsAddTable
```

### addToTable

```
$<env>/<workspace>//vtl.realestate-activity
⭘retention◼4320⭘description◼report-realestate-activity⭘flag◼marketing
⭘tablevid◼<RE_ACTIVITY_TABLE_VID>
⭘index◼1★S◼3★S◼6★S◼10★S◼25★D
⭘<1>◼◁4▷⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶⭘<3>◼marketing
⭘<6>◼◁5▷⭘<7>◼◁5|name▷⭘<8>◼◁5|qr▷
⭘<10>◼◀session|VID▶⭘<11>◼◀session|NAME▶⭘<12>◼◀session|CC_VID▶⭘<13>◼◀session|CC_NAME▶
⭘<15>◼◁11▷
⭘<16>◼◁8▷⭘<17>◼◁9▷⭘<18>◼◀2|GPS▶
⭘<23>◼DONE⭘<25>◼◁10▷
⭘<28>◼◁6▷
```

(Marketing tidak punya client — col 4,5,9,14 NULL)

---

## 23. Prospect Owner form refactor (existing row 820–836+)

```
seq#1  topMain
seq#2  separator
seq#3  text "Prospect Owner"
seq#4  NUMBER RE-PRS-{{YYYY}}-{{COUNTER(vtl.realestate-activity,6)}}
seq#5  textField Nama Klien (jika belum di-master, save langsung)
seq#6  lqrTextField1 Pilih Properti (existing) OR text Lokasi (new prospect)
seq#7  displayDropDownData Tipe Properti
seq#8  displayDropDownData Lead Source
seq#9  getImages1 Photo
seq#10 radio Hasil Aktivitas
seq#11 3LineBorderForm Keterangan
seq#12 TXF date Jadwal Follow-up
seq#13 displayDropDownData Next Action
seq#14 sendButtonGpsAddTable
```

### addToTable

```
$<env>/<workspace>//vtl.realestate-activity
⭘retention◼4320⭘description◼report-realestate-activity⭘flag◼prospect-owner
⭘tablevid◼<RE_ACTIVITY_TABLE_VID>
⭘index◼1★S◼3★S◼4★S◼6★S◼10★S◼14★S◼25★D
⭘<1>◼◁4▷⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶⭘<3>◼prospect-owner
⭘<5>◼◁5▷
⭘<6>◼◁6▷⭘<7>◼◁6|name▷⭘<8>◼◁6|qr▷
⭘<9>◼owner
⭘<10>◼◀session|VID▶⭘<11>◼◀session|NAME▶⭘<12>◼◀session|CC_VID▶⭘<13>◼◀session|CC_NAME▶
⭘<14>◼◁10▷⭘<15>◼◁13▷
⭘<16>◼◁9▷⭘<17>◼◁11▷⭘<18>◼◀2|GPS▶
⭘<21>◼◁7▷⭘<22>◼◁8▷
⭘<23>◼DONE⭘<25>◼◁12▷
```

(Prospect Owner: client belum di-master → simpan nama as text col 5, client_id col 4 NULL → backend cleanup later)

---

## 24. Deal Progress form refactor (existing row 803–819)

Target table: `vtl.realestate-deal` (beda dari activity)

```
seq#1  topMain
seq#2  separator
seq#3  text "Deal Progress"
seq#4  NUMBER RE-DEAL-{{YYYY}}-{{COUNTER(vtl.realestate-deal,6)}}  position 4
seq#5  lqrTextField  Pilih Buyer  (client master)  position 5
seq#6  lqrTextField1 Pilih Properti              position 6
seq#7  displayDropDownData Deal Stage [Initial, Negotiation, OfferSent, ClosedWon, ClosedLost]  position 7
seq#8  numericField Price Offered                position 8
seq#9  numericField Price Final                  position 9
seq#10 TXF date Expected Closing                 position 10
seq#11 getImages1 Photo                          position 11
seq#12 3LineBorderForm Catatan                   position 12
seq#13 displayDropDownData Next Action           position 13
seq#14 sendButtonGpsAddTable position 251
```

### addToTable

```
$<env>/<workspace>//vtl.realestate-deal
⭘retention◼4320⭘description◼deal-pipeline⭘flag◼deal-create
⭘tablevid◼<DEAL_TABLE_VID>
⭘index◼1★S◼2★D◼3★S◼5★S◼6★S◼8★S◼11★D◼17★S
⭘<1>◼◁4▷
⭘<2>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶
⭘<3>◼◁6▷⭘<4>◼◁6|name▷
⭘<5>◼◁5|name▷
⭘<6>◼◀session|VID▶⭘<7>◼◀session|NAME▶
⭘<8>◼◁7▷
⭘<9>◼◁8▷⭘<10>◼◁9▷
⭘<11>◼◁10▷
⭘<13>◼◁13▷
⭘<14>◼◁11▷⭘<15>◼◁12▷⭘<16>◼◀2|GPS▶
⭘<17>◼OPEN
⭘<18>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶
```

### Deal Stage update (updateTableRow — agent edit existing deal)

Untuk edit deal yg sudah ada (e.g. stage berubah dari Negotiation → OfferSent):

```
$<env>/<workspace>//vtl.realestate-deal
⭘action◼update
⭘tablevid◼<DEAL_TABLE_VID>
⭘search◼1★<deal_id>
⭘<8>◼<new deal_stage>
⭘<10>◼<new price_final>
⭘<11>◼<new expected_closing>
⭘<13>◼<new next_action>
⭘<17>◼<new status: OPEN or CLOSED>
⭘<18>◼◀2|T7|yyyy-MM-dd HH:mm:ss▶
```

Trigger via button di Deal Detail page. Tombol "Update Status".

---

## 25. Activity Detail page (NEW — universal untuk semua activity subtype)

Route key: `vertikaTeknoLokaciptaActivityDetail`
Param: `activity_id`

```json
{
  "title": "Vertika Tekno Lokacipta",
  "children": [
    {"type": "HGR", "width": 86, "row": 1, "fontSize": 13, "beforeSpacing": 5, "afterSpacing": 0, "sortBy": "alphabetically", "children": [
      {"url": "<autsorz-icon>", "text": "Autsorz", "route": "autsorz"},
      {"url": "<vtl-icon>", "text": "VTL", "route": "vertikaTeknoLokacipta"},
      {"url": "<info-icon>", "text": "Info", "route": "info"}
    ]},
    {"type": "TXT", "afterSpacing": 0, "size": 4, "data": " "},
    {
      "type": "WORKER_CARD_DETAIL",
      "role": "AGENT",
      "vidtable": "<RE_ACTIVITY_TABLE_VID>",
      "table": "$<env>/<workspace>//vtl.realestate-activity",
      "search": "1◼<activity_id>",
      "conditions": "[[◀1▶◼<activity_id>]]",
      "text": "AGENT◆<11>◆<3> . <14>"
    },
    {
      "type": "displayStaticField",
      "table": "$<env>/<workspace>//vtl.realestate-activity",
      "search": "1◼<activity_id>",
      "fields": [
        {"label": "Activity ID", "value": "<1>"},
        {"label": "Type", "value": "<3>"},
        {"label": "Created", "value": "<2>"},
        {"label": "Client", "value": "<5>", "route": "vertikaTeknoLokaciptaClientDetail⭘client_id◼<4>"},
        {"label": "Property", "value": "<7>", "route": "vertikaTeknoLokaciptaPropertyDetail⭘property_id◼<6>"},
        {"label": "Asking Price", "value": "<24>"},
        {"label": "Tipe Properti", "value": "<21>"},
        {"label": "Lead Source", "value": "<22>"},
        {"label": "Hasil", "value": "<14>"},
        {"label": "Next Action", "value": "<15>"},
        {"label": "Follow-up", "value": "<25>"},
        {"label": "Channel", "value": "<26>"},
        {"label": "Conv. Result", "value": "<27>"},
        {"label": "Catatan", "value": "<17>"}
      ]
    },
    {
      "type": "photoDisplay2",
      "table": "$<env>/<workspace>//vtl.realestate-activity",
      "search": "1◼<activity_id>",
      "image": "<16>"
    },
    {
      "type": "COMMENT_SECTION",
      "role": "AGENT",
      "ledgerCode": "RE-ACTIVITY-CONVERSATION",
      "vidtable": "<RE_COMMENT_TABLE_VID>",
      "table": "$<env>/<workspace>//vtl.realestate-comment",
      "search": "2◼<activity_id>",
      "text": "DISKUSI",
      "content": "<3>◆<4>◆<5>◆<6>"
    },
    {
      "type": "txf",
      "variant": "commentBox",
      "role": "AGENT",
      "vidtable": "<RE_COMMENT_TABLE_VID>",
      "table": "$<env>/<workspace>//vtl.realestate-comment",
      "text": "Tambah komentar...◆Kirim◆Lampiran◆Komentar kosong",
      "icon": "attach_file",
      "label": "",
      "hint": "Tambah komentar...",
      "maxLength": 500,
      "position": 7,
      "buttonIcon": "send",
      "disabledWhenEmpty": true,
      "attachmentEnabled": true,
      "attachmentFolder": "id/<workspace>/vtl/realestate-comment/<activity_id>",
      "attachmentFilename": "<activity_id>-<timestamp>",
      "attachmentMax": 3,
      "addToTable": "$<env>/<workspace>//vtl.realestate-comment⭘retention◼4320⭘<2>◼<activity_id>⭘<3>◼AGENT⭘<4>◼◀session|VID▶⭘<5>◼◀session|NAME▶⭘<6>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶⭘<7>◼◀3▶⭘<8>◼⭘<9>◼◀4▶"
    }
  ]
}
```

---

## 26. Client Detail page (NEW)

Route: `vertikaTeknoLokaciptaClientDetail`
Param: `client_id`

```json
{
  "title": "Detail Klien",
  "children": [
    {"type": "HGR", "...": "<header>"},
    {
      "type": "displayStaticField",
      "table": "$<env>/<workspace>//vtl.realestate-client",
      "search": "1◼<client_id>",
      "fields": [
        {"label": "Client ID", "value": "<1>"},
        {"label": "Nama", "value": "<4>"},
        {"label": "HP", "value": "<5>"},
        {"label": "Email", "value": "<6>"},
        {"label": "Tipe", "value": "<7>"},
        {"label": "Lead Source", "value": "<8>"},
        {"label": "Owner Agent", "value": "<10>"},
        {"label": "Total Aktivitas", "value": "<11>"},
        {"label": "Status", "value": "<12>"},
        {"label": "Catatan", "value": "<13>"}
      ]
    },
    {"type": "TXT", "size": 18, "data": "Riwayat Aktivitas", "margin": "16,0,0,16"},
    {
      "type": "displayTableInteractive",
      "table": "$<env>/<workspace>//vtl.realestate-activity",
      "vidtable": "<RE_ACTIVITY_TABLE_VID>",
      "search": "4◼<client_id>",
      "conditions": "[[◀4▶◼<client_id>]]",
      "orderByChild": "2",
      "limitToLast": 50,
      "sortDesc": true,
      "text": "Aktivitas◆<3>◆<7>◆<14>◆<25>◆<2>",
      "route": "vertikaTeknoLokaciptaActivityDetail⭘activity_id◼<1>"
    }
  ]
}
```

---

## 27. Property Detail page (NEW)

Route: `vertikaTeknoLokaciptaPropertyDetail`
Param: `property_id`

```json
{
  "title": "Detail Properti",
  "children": [
    {"type": "HGR", "...": "<header>"},
    {
      "type": "displayStaticField",
      "table": "$<env>/<workspace>//vtl.realestate-property",
      "search": "1◼<property_id>",
      "fields": [
        {"label": "Property ID", "value": "<1>"},
        {"label": "Nama", "value": "<5>"},
        {"label": "QR", "value": "<6>"},
        {"label": "Lokasi", "value": "<7>"},
        {"label": "Tipe", "value": "<8>"},
        {"label": "Listing", "value": "<9>"},
        {"label": "Asking Price", "value": "<10>"},
        {"label": "Negotiable", "value": "<11>"},
        {"label": "Lead Source", "value": "<16>"},
        {"label": "Status", "value": "<14>"}
      ]
    },
    {
      "type": "photoDisplay2",
      "table": "$<env>/<workspace>//vtl.realestate-property",
      "search": "1◼<property_id>",
      "image": "<12>"
    },
    {"type": "TXT", "size": 18, "data": "Riwayat Aktivitas Properti"},
    {
      "type": "displayTableInteractive",
      "table": "$<env>/<workspace>//vtl.realestate-activity",
      "search": "6◼<property_id>",
      "conditions": "[[◀6▶◼<property_id>]]",
      "orderByChild": "2",
      "limitToLast": 50,
      "sortDesc": true,
      "text": "Aktivitas◆<3>◆<5>◆<14>◆<2>",
      "route": "vertikaTeknoLokaciptaActivityDetail⭘activity_id◼<1>"
    },
    {"type": "TXT", "size": 18, "data": "Deal Pipeline"},
    {
      "type": "displayTableInteractive",
      "table": "$<env>/<workspace>//vtl.realestate-deal",
      "search": "3◼<property_id>",
      "conditions": "[[◀3▶◼<property_id>]]",
      "orderByChild": "2",
      "limitToLast": 20,
      "sortDesc": true,
      "text": "Deal◆<8>◆<5>◆<10>◆<11>",
      "route": "vertikaTeknoLokaciptaDealDetail⭘deal_id◼<1>"
    }
  ]
}
```

---

## 28. Deal Detail page (NEW — with status update buttons)

Route: `vertikaTeknoLokaciptaDealDetail`
Param: `deal_id`

```json
{
  "title": "Detail Deal",
  "children": [
    {"type": "HGR", "...": "<header>"},
    {
      "type": "displayStaticField",
      "table": "$<env>/<workspace>//vtl.realestate-deal",
      "search": "1◼<deal_id>",
      "fields": [
        {"label": "Deal ID", "value": "<1>"},
        {"label": "Property", "value": "<4>", "route": "vertikaTeknoLokaciptaPropertyDetail⭘property_id◼<3>"},
        {"label": "Buyer", "value": "<5>"},
        {"label": "Agent", "value": "<7>"},
        {"label": "Stage", "value": "<8>"},
        {"label": "Price Offered", "value": "<9>"},
        {"label": "Price Final", "value": "<10>"},
        {"label": "Expected Closing", "value": "<11>"},
        {"label": "Actual Closing", "value": "<12>"},
        {"label": "Next Action", "value": "<13>"},
        {"label": "Catatan", "value": "<15>"},
        {"label": "Status", "value": "<17>"}
      ]
    },
    {
      "type": "RBT",
      "alignment": "spaceEvenly",
      "children": [
        {
          "text": "Next Stage",
          "color": "blue",
          "icon": "arrow_forward",
          "route": "vertikaTeknoLokaciptaDealUpdate⭘deal_id◼<deal_id>",
          "delay": 5
        },
        {
          "text": "Tutup Deal",
          "color": "green",
          "icon": "check",
          "updateTableRow": "$<env>/<workspace>//vtl.realestate-deal⭘tablevid◼<DEAL_TABLE_VID>⭘search◼1★<deal_id>⭘<8>◼ClosedWon⭘<12>◼◀1|T7|yyyy-MM-dd▶⭘<17>◼CLOSED⭘<18>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶",
          "chain": {
            "type": "DO_DIALOG",
            "title": "Deal Closed",
            "children": [
              {"type": "TXT", "data": "Selamat! Deal ditutup."},
              {"type": "RBT", "alignment": "center", "children": [{"text": "OK", "route": "vertikaTeknoLokaciptaMyDeals"}]}
            ]
          }
        },
        {
          "text": "Batal Deal",
          "color": "red",
          "icon": "close",
          "updateTableRow": "$<env>/<workspace>//vtl.realestate-deal⭘tablevid◼<DEAL_TABLE_VID>⭘search◼1★<deal_id>⭘<8>◼ClosedLost⭘<17>◼CLOSED⭘<18>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶",
          "chain": {
            "type": "DO_DIALOG",
            "title": "Deal Batal",
            "children": [
              {"type": "TXT", "data": "Deal ditandai batal."},
              {"type": "RBT", "alignment": "center", "children": [{"text": "OK", "route": "vertikaTeknoLokaciptaMyDeals"}]}
            ]
          }
        }
      ]
    }
  ]
}
```

---

## 29. List "Klien Saya"

Route: `vertikaTeknoLokaciptaMyClients`

```json
{
  "title": "Klien Saya",
  "children": [
    {"type": "HGR", "...": "<header>"},
    {"type": "TXT", "size": 24, "data": "Klien Saya"},
    {"type": "TXT", "afterSpacing": 0, "size": 4, "data": " "},
    {
      "type": "RBT",
      "alignment": "end",
      "children": [{
        "text": "+ Tambah Klien",
        "color": "primary",
        "route": "vertikaTeknoLokaciptaAddClient",
        "delay": 5
      }]
    },
    {
      "type": "displayTableInteractive",
      "table": "$<env>/<workspace>//vtl.realestate-client",
      "vidtable": "<CLIENT_TABLE_VID>",
      "search": "9◼<session.vid>",
      "conditions": "[[◀9▶◼<session.vid>],[◀12▶◼ACTIVE]]",
      "orderByChild": "2",
      "limitToLast": 100,
      "sortDesc": true,
      "text": "Klien◆<4>◆<7>◆<5>◆<11> aktivitas◆<2>",
      "route": "vertikaTeknoLokaciptaClientDetail⭘client_id◼<1>"
    }
  ]
}
```

---

## 30. List "Pipeline Deal"

Route: `vertikaTeknoLokaciptaMyDeals`

```json
{
  "title": "Pipeline Deal",
  "children": [
    {"type": "HGR", "...": "<header>"},
    {"type": "TXT", "size": 24, "data": "Pipeline Saya"},
    {"type": "TXT", "afterSpacing": 0, "size": 4, "data": " "},
    {
      "type": "displayTableInteractive",
      "table": "$<env>/<workspace>//vtl.realestate-deal",
      "vidtable": "<DEAL_TABLE_VID>",
      "search": "6◼<session.vid>",
      "conditions": "[[◀6▶◼<session.vid>],[◀17▶◼OPEN]]",
      "orderByChild": "11",
      "limitToLast": 50,
      "text": "Deal◆<8>◆<4>◆<5>◆<10>◆Closing: <11>",
      "route": "vertikaTeknoLokaciptaDealDetail⭘deal_id◼<1>"
    }
  ]
}
```

---

## 31. List "Today Follow Up"

Route: `vertikaTeknoLokaciptaTodayFollowUp`

```json
{
  "title": "Follow-up Hari Ini",
  "children": [
    {"type": "HGR", "...": "<header>"},
    {"type": "TXT", "size": 24, "data": "Follow-up Hari Ini"},
    {
      "type": "displayTableInteractive",
      "table": "$<env>/<workspace>//vtl.realestate-activity",
      "vidtable": "<RE_ACTIVITY_TABLE_VID>",
      "search": "10◼<session.vid>",
      "conditions": "[[◀10▶◼<session.vid>],[◀25▶◁<today>▷],[◀23▶◼DONE]]",
      "orderByChild": "25",
      "limitToLast": 50,
      "sortDesc": false,
      "text": "Follow-up◆<5>◆<7>◆<14>◆<25>◆<15>",
      "route": "vertikaTeknoLokaciptaActivityDetail⭘activity_id◼<1>"
    }
  ]
}
```

Note: `<today>` placeholder resolves client-side ke ISO date hari ini. `conditions` filter `follow_up_date <= today` butuh range query Firebase: `orderByChild("25").endAt("<today>")`. DSL syntax tepat TBD — verify dgn existing `pending-approval-page.json` pattern.

---

## 32. List "Aktivitas Terbaru"

Route: `vertikaTeknoLokaciptaRecentActivity`

```json
{
  "title": "Aktivitas Terbaru",
  "children": [
    {"type": "HGR", "...": "<header>"},
    {"type": "TXT", "size": 24, "data": "Aktivitas 30 Hari Terakhir"},
    {
      "type": "displayTableInteractive",
      "table": "$<env>/<workspace>//vtl.realestate-activity",
      "vidtable": "<RE_ACTIVITY_TABLE_VID>",
      "search": "10◼<session.vid>",
      "conditions": "[[◀10▶◼<session.vid>]]",
      "orderByChild": "2",
      "limitToLast": 100,
      "sortDesc": true,
      "text": "Aktivitas◆<3>◆<5>◆<7>◆<14>◆<2>",
      "route": "vertikaTeknoLokaciptaActivityDetail⭘activity_id◼<1>"
    }
  ]
}
```

---

## 33. Vertika home menu — tambah entry list

Route handler `vertikaTeknoLokacipta` (home page) tambah menu items:

```
+ Tambah Klien     → vertikaTeknoLokaciptaAddClient
Klien Saya         → vertikaTeknoLokaciptaMyClients
Pipeline Deal      → vertikaTeknoLokaciptaMyDeals
Follow-up Hari Ini → vertikaTeknoLokaciptaTodayFollowUp
Aktivitas Terbaru  → vertikaTeknoLokaciptaRecentActivity

Lapor Aktivitas:
  Meeting Owner    → vertikaTeknoLokaciptaReportMeetingOwner
  Meeting Buyer    → vertikaTeknoLokaciptaReportMeetingBuyer
  Showing          → vertikaTeknoLokaciptaReportShowing
  Follow Up        → vertikaTeknoLokaciptaReportFollowUp
  Marketing        → vertikaTeknoLokaciptaReportMarketing
  Prospect Owner   → vertikaTeknoLokaciptaReportProspect
  Add Listing      → vertikaTeknoLokaciptaReportAddListing
  Deal Progress    → vertikaTeknoLokaciptaReportDealProgress
```

---

## 34. Firebase Rules sketch

```json
{
  "rules": {
    "$env": {
      "$workspace": {
        "vtl_realestate-client": {
          ".indexOn": ["1", "2", "4", "9", "12"],
          "$row": {
            ".read":  "auth.uid != null && data.child('9').val() == auth.uid",
            ".write": "auth.uid != null && newData.child('9').val() == auth.uid"
          }
        },
        "vtl_realestate-property": {
          ".indexOn": ["1", "2", "3", "5", "6", "8", "9", "14"],
          ".read":  "auth.uid != null",
          "$row": {
            ".write": "auth.uid != null && (!data.exists() || data.child('3').val() == auth.uid)"
          }
        },
        "vtl_realestate-activity": {
          ".indexOn": ["1", "2", "3", "4", "6", "10", "14", "25"],
          "$row": {
            ".read":  "auth.uid != null && data.child('10').val() == auth.uid",
            ".write": "auth.uid != null && newData.child('10').val() == auth.uid && (!data.exists() || data.child('10').val() == auth.uid)"
          }
        },
        "vtl_realestate-deal": {
          ".indexOn": ["1", "2", "3", "5", "6", "8", "11", "17"],
          "$row": {
            ".read":  "auth.uid != null && data.child('6').val() == auth.uid",
            ".write": "auth.uid != null && newData.child('6').val() == auth.uid"
          }
        },
        "vtl_realestate-comment": {
          ".indexOn": ["1", "2", "4"],
          "$row": {
            ".read":  "auth.uid != null",
            ".write": "auth.uid != null && newData.child('4').val() == auth.uid"
          }
        }
      }
    }
  }
}
```

Property = world-readable in workspace (semua agent boleh lihat listing apa saja). Client + Activity + Deal = scoped ke owner agent. Comment = readable all, writable own.

---

## 35. Build order checklist

```
☐ 1. Create Firebase nodes:
     vtl.realestate-client / property / activity / deal / comment
☐ 2. Apply Firebase Rules (section 34)
☐ 3. Build Add Client form (section 17)         → seed master
☐ 4. Build Add Listing form (section 18 refactor) → seed property master
☐ 5. Build Activity Detail page (section 25)    → universal detail
☐ 6. Build Client Detail page (section 26)
☐ 7. Build Property Detail page (section 27)
☐ 8. Build Deal Detail page (section 28)
☐ 9. Refactor 6 activity forms (sections 19–23, Meeting Owner section 16)
☐ 10. Build Deal Progress form (section 24)
☐ 11. Build 4 list pages (sections 29–32)
☐ 12. Update Vertika home menu (section 33)
☐ 13. End-to-end smoke test:
       Add Client → Add Listing → Meeting Owner → Follow Up → Deal Progress → Close Deal
       Verify each row appears in correct list, detail pages load, status updates persist.
```

---

## 36. Cross-page wiring (route → detail flow)

Existing pattern (pending-approval-page.json line 12):
```json
"route": "vertikaTeknoLokaciptaRequestDetail⭘no_request◼<1>"
```

Saat user tap row di list, navigate ke detail page dgn param `no_request = col1 value` (= request ID). Detail page baca param via `<no_request>` placeholder, lookup row di Firebase via `search: "1◼<no_request>"`.

**Untuk Real Estate**, list page route should be:
```
vertikaTeknoLokaciptaRealEstateActivityDetail⭘activity_id◼<1>
```

Detail page baca `<activity_id>`, query `vtl.realestate-activity` where col1 = activity_id, render fields.

Approve/Reject flow (kalau perlu approval) pakai `updateTableRow` w/ `search◼1★<activity_id>` patch col status.
