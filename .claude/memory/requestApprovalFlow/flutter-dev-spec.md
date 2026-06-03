# Approval Event Row — Flutter Dev Spec

**Context:** When an approval button (`actions`) fires inside a `LIST_ITEM_CARD`, the app must also write a new **Event row** to the Google Sheet. This Event row carries **the full original request data** (mirrored from the RequestLeave submission) **plus 5 approval level slots**.

---

## 1. Trigger Condition

Every time an approver taps **Approved** or **Rejected** on a request item, write 1 Event row to the sheet.

- Route and flag stay **fixed** — same value regardless of approval level
- Max approval levels = **5** (all 5 slots always present, empty if unused)

---

## 2. Event Row Schema

| Column | Value |
|--------|-------|
| **A** — Time | Unix epoch ms at moment of approval action |
| **B** — Route | `vertikaTeknoLokaciptaApproveLeave` *(or agreed route name)* |
| **C** — Data | See format below |

---

## 3. Col C Data Format

Full format — **request data first, then 5 approval slots at the end**:

```
0{flag}◆{requestNo}◆{lat}◆{lng}◆{approvalEpoch}◆{overallStatus}
◆{requesterVID}◆{requesterName}
◆{siteVID}◆{siteName}◆{siteVID2}◆{siteName2}
◆{submitTimeFormatted}◆{submitTimeRaw}
◆{leaveType}◆{reason}◆{photoURL}
◆{startDateRaw}◆{startDateFormatted}
◆{endDateRaw}◆{endDateFormatted}
◆{daysCount}◆{field21}
◆{replacementVID}◆{replacementName}
◆{roleLabel}◆{iconURL}◆◆◆◆{summaryString}
◆{level1}◆{level2}◆{level3}◆{level4}◆{level5}
```

*(line breaks above for readability only — actual value is one continuous string)*

---

## 4. Field Breakdown

### Request data (positions ◆0–◆29) — from Firebase record

All values come from the **Firebase record** currently being approved (`LIST_ITEM_CARD` row data). Flutter should read these from the active record.

| Position | Field | Firebase index | Example |
|----------|-------|----------------|---------|
| ◆0 | flag/ledger type | static | `approve-leave` |
| ◆1 | request number | `<1>` | `REQ-2026-000135` |
| ◆2 | latitude | GPS at tap | `-6.31637471` |
| ◆3 | longitude | GPS at tap | `106.64477693` |
| ◆4 | approval epoch ms | session timestamp | `1778481700000` |
| ◆5 | overall status | result of this action | `APPROVED` / `REJECTED` / `PENDING` |
| ◆6 | requester VID | `<5>` | `87544551624342` |
| ◆7 | requester name | `<6>` | `Agenia Demo-7` |
| ◆8 | site VID | `<7>` | `83674161979544` |
| ◆9 | site name | `<8>` | `Product Group` |
| ◆10 | site VID 2 | `<9>` | `83674161979544` |
| ◆11 | site name 2 | `<10>` | `Product Group` |
| ◆12 | submit time formatted | `<11>` | `11 May 2026 13:40` |
| ◆13 | submit time raw ms | `<12>` | `1778481623268` |
| ◆14 | leave type | `<13>` | `Cuti Besar` |
| ◆15 | reason / keterangan | `<14>` | `testttttt` |
| ◆16 | photo / document URL | `<15>` | `https://...` |
| ◆17 | start date raw ms | `<16>` | `1778457600000` |
| ◆18 | start date formatted | `<17>` | `11 May 2026 07:00` |
| ◆19 | end date raw ms | `<18>` | `1778544000000` |
| ◆20 | end date formatted | `<19>` | `12 May 2026 07:00` |
| ◆21 | days count | `<20>` | `1` |
| ◆22 | field 21 | `<21>` | `` |
| ◆23 | replacement VID | `<22>` | `4199999104694` |
| ◆24 | replacement name | `<23>` | `Functional test` |
| ◆25 | role label | `<24>` | `Sekuriti` |
| ◆26 | icon URL | `<25>` | `https://...` |
| ◆27 | (reserved) | — | `` |
| ◆28 | (reserved) | — | `` |
| ◆29 | (reserved) | — | `` |
| ◆30 | summary string | `<30>` | `Tanggal 11 May 2026 sampai 12 May 2026, jumlah 1 hari, dengan pengganti Functional test` |

### Approval slots (positions ◆31–◆35) — from session + cumulative state

| Position | Field | Source |
|----------|-------|--------|
| ◆31 | **level 1 slot** | see slot format below |
| ◆32 | **level 2 slot** | see slot format below |
| ◆33 | **level 3 slot** | see slot format below |
| ◆34 | **level 4 slot** | empty string `""` if unused |
| ◆35 | **level 5 slot** | empty string `""` if unused |

---

## 5. Level Slot Format (sub-delimiter `◇`)

```
{levelNo}◇{status}◇{approverVID}◇{approverName}◇{epochMs}◇{comment}
```

| Sub-field | Source |
|-----------|--------|
| `levelNo` | authorization level of the approver doing this action (e.g. `1`, `2`, `3`) |
| `status` | `APPROVED` or `REJECTED` |
| `approverVID` | VID of the currently logged-in user (session) |
| `approverName` | Name of the currently logged-in user (session) |
| `epochMs` | Unix epoch ms at time of this level's action |
| `comment` | optional, empty string `""` if none |

---

## 6. Rules

1. **All 5 approval slots always present** — empty string `""` if level not yet done. Positions must never shift.

   ```
   // ✅ Correct — level 1 done, slots 2–5 empty but position preserved
   ...◆1◇APPROVED◇87544551624342◇Agenia Demo-7◇1778481623268◇◆◆◆◆

   // ❌ Wrong — missing empty slots
   ...◆1◇APPROVED◇87544551624342◇Agenia Demo-7◇1778481623268◇
   ```

2. **Leading `0` on col C** is required — sheet parser uses `ARRAYFORMULA(IF(LEFT(C)="0", MID(C,2,...)))` to strip it.

3. **Each approval action = 1 new appended row** — never overwrite existing Event rows.

4. **Cumulative slots** — if level 1 already approved and level 2 is now approving, write both slot 1 (from Firebase record `<4>`) and slot 2 (current session) in this Event row.

5. **GPS required** at positions ◆2 and ◆3 — captured at the moment of the tap.

---

## 7. Full Example

**Scenario:** 3-level approval flow. Level 2 approver just tapped Approved.

```
Col A: 1778481700000
Col B: vertikaTeknoLokaciptaApproveLeave
Col C: 0approve-leave◆REQ-2026-000135◆-6.31637471◆106.64477693◆1778481700000◆PENDING◆87544551624342◆Agenia Demo-7◆83674161979544◆Product Group◆83674161979544◆Product Group◆11 May 2026 13:40◆1778481623268◆Cuti Besar◆testttttt◆https://...photo.jpg◆1778457600000◆11 May 2026 07:00◆1778544000000◆12 May 2026 07:00◆1◆◆4199999104694◆Functional test◆Sekuriti◆https://...icon.png◆◆◆◆Tanggal 11 May 2026 sampai 12 May 2026, jumlah 1 hari, dengan pengganti Functional test◆1◇APPROVED◇87544551624342◇Agenia Demo-7◇1778481623268◇◆2◇APPROVED◇34079207578683◇Perry Huang◇1778481700000◇◆◆◆
```

---

## 8. Questions to Confirm

| # | Question |
|---|----------|
| 1 | What token/API is available for **approver VID** (currently logged-in user) in the `actions` context? |
| 2 | What token/API is available for **approver name** in the `actions` context? |
| 3 | What token/API exposes the **level number** of the current approver (from their auth role)? |
| 4 | Is **GPS** automatically captured when `actions` fires, or does a flag need to be set? |
| 5 | Are **previous approval slots** (levels already done) accessible from the Firebase record `<4>` field in the `actions` context, so they can be written cumulatively into ◆31–◆35? |
| 6 | All Firebase fields `<1>`–`<30>` from the active record — are these readable in the `actions` context? |

---

*Prepared by: Spreadsheet/Backend team — 2026-05-20*
