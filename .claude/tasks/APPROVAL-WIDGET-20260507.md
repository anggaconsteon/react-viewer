# TASK: Pending Approvals Widget (List + Detail View)
**TASK_ID:** APPROVAL-WIDGET-20260507
**Status:** INTERVIEW (Scoping Phase)
**Created:** 2026-05-07

---

## Source Material
Three UI mockup images provided by user:
- Image 1: Pending Approvals list/header card
- Image 2: Detail top section (Worker card + IZIN/request detail card)
- Image 3: Detail bottom section (Conversation timeline + comment input + action bar)

User confirmed: Image 1 = list widget. Clicking a row navigates to detail view (Image 2 stacked above Image 3).

---

## Deep Visual Analysis

### IMAGE 1 — Pending Approvals List Card

**Container:**
- Single card container, white background (#FFFFFF)
- Rounded corners (approx 16-18px radius)
- Light border or subtle shadow

**Header Row:**
- LEFT: Hourglass icon (orange/amber fill), bold black title "Pending Approvals" (approx 16-18px font, semi-bold/bold)
- RIGHT: Orange pill badge with white text "3" (count of pending items)
  - Pill bg: orange (~#F97316 or #FB923C)
  - Text: white, bold, small (11-12px)
  - Border-radius: full pill (999px)
- Horizontal divider below header (light gray, 1px)

**List Items (3 rows, repeating pattern):**

Each row contains:
1. **Left icon block** — 36-40px square, rounded corners (~8px), tinted background color, centered icon
   - Row 1: Airplane icon, purple/violet tint bg (#EDE9FE or similar), purple icon
   - Row 2: Clock icon, amber/yellow tint bg (#FEF3C7 or similar), amber icon
   - Row 3: Pencil/edit icon, pink/rose tint bg (#FFE4E6 or similar), red/pink icon

2. **Text block (center, stacked):**
   - Line 1: Worker name (bold, ~14px, #1E293B) + middot separator + Request type label (normal weight, ~14px, same color or slightly lighter)
     - "Budi . Leave", "Andi . Overtime", "Rudi . Manual Check-In"
   - Line 2: Description (gray, ~12-13px, #94A3B8 or #64748B)
     - Full sentence describing the request reason
   - Line 3: Time ago (lighter gray, ~11px, #CBD5E1 or #94A3B8)
     - "2h ago", "3h ago", "5h ago"

3. **Action buttons (full width, two side-by-side):**
   - "Reject" button: white bg, red border (~1px, #EF4444), red text (#EF4444), thumbs-down icon left
   - "Approve" button: solid green bg (#22C55E or #16A34A), white text, thumbs-up icon left
   - Both buttons: rounded corners (~10-12px), ~40px height, 50/50 width with small gap

4. **Divider** between list items (light gray 1px line, with some padding)

**Icon-to-type mapping observed:**
- Leave = Airplane icon + purple
- Overtime = Clock icon + amber
- Manual Check-In = Pencil icon + pink/red

---

### IMAGE 2 — Detail View: Top Section

**Card 1: WORKER identity card**
- WidgetHeader pattern: shield icon (in gray tile) + uppercase "WORKER" label
- Body content:
  - Avatar circle: 48-52px, solid medium color fill (#7C3AED purple or similar), white initials "SA" centered
  - Name: "Siti Aminah" (bold, ~16px, dark)
  - Subtitle: "Cleaner . Menara BCA . Jakarta" (gray, ~13px)
    - Role + middot + Building/Site + middot + City

**Card 2: IZIN (Permission Request) detail card**
- Orange/amber top border accent (3-4px line at card top)
- WidgetHeader pattern: clock icon (in gray tile) + uppercase "IZIN" label
- RIGHT of header: StatusBadge pill "Pending" (yellow/amber bg, amber text, dot pulse)
- Title line: "Permission . 2026-04-24 . 10:00-12:00" (bold, ~15px)
- Submitted line: "Submitted 2026-04-24 06:50" (gray, ~12px)
- Horizontal divider
- Key-value rows (MetaRow pattern):
  - "Date" : "2026-04-24" (right-aligned, semi-bold)
  - "Start time" : "10:00"
  - "End time" : "12:00"
  - "Location" : "Kantor BPJS Sudirman"
  - "Shift affected" : "Shift A . 06:00-14:00"
- Divider
- Section sub-header: "REASON" (uppercase, small, gray, letter-spaced — same style as WidgetHeader labels)
- Reason paragraph: "Urus dokumen BPJS di kantor cabang." (~13px, dark text)

---

### IMAGE 3 — Detail View: Bottom Section

**Card: CONVERSATION (2)**
- WidgetHeader: chat/message icon + "CONVERSATION" label + "(2)" count in parentheses
- Timeline entries (vertical list):

  **Entry 1 (System):**
  - Left icon: purple sparkle/star icon in tinted square
  - "System" name (bold) + "System" small pill/tag (gray bg, gray text)
  - Timestamp: "Apr 25, 07:55 AM" (gray, right or below name)
  - Content: purple chip/pill with text "Leave request submitted" (purple bg tint, purple text, rounded)

  **Entry 2 (Worker):**
  - Left icon: helmet/hard-hat icon in blue tinted square
  - "Budi" name (bold) + "Worker" small tag (blue bg tint, blue text)
  - Timestamp: "Apr 25, 07:56 AM"
  - Content: plain text message "Saudara saya menikah di Bandung. Saya sudah cek roster, Sari bisa cover shift saya."

**Comment Input Area:**
- Input field with border, rounded (~12px)
- LEFT: Paperclip icon (attachment, gray)
- Placeholder text: "Add a comment..." (gray)
- RIGHT: "Send" button (gray text, appears disabled when empty)

**Bottom Action Bar:**
- Right-aligned, two buttons:
  - "Reject": white bg, red border, red text (same style as list view)
  - "Approve": solid green bg, white text (same style as list view)

---

## Component Inventory (Mapped to Existing Patterns)

| UI Element | Existing Pattern | Notes |
|---|---|---|
| List card container | WidgetShell | White bg, rounded 18px |
| Header + count badge | WidgetHeader + custom right slot | Badge is orange pill |
| List row icon tiles | Colored icon squares | Type-driven color mapping |
| Status pill | StatusBadge | State-driven (idle=pending) |
| Reject/Approve buttons | DestructiveAdjacentButton + PrimaryButton variant | Green primary, red outline |
| Key-value rows | MetaRow | Existing pattern exact match |
| Worker identity card | WidgetShell + WidgetHeader | New composition |
| Conversation timeline | New component | System vs Worker entries |
| Comment input | New component | With attachment + send |
| Request type icon mapping | REQUEST_TYPES config | Already defined in codebase |

---

## DSL Mapping Notes (Preliminary)

This widget spans TWO screens:
1. **List View** — likely maps to `type: "APPROVAL"` with conditions/search filtering
2. **Detail View** — navigated to on row tap; needs its own widget JSON or is composed from multiple widget types

Key DSL elements needed:
- `type: "APPROVAL"` for the list with conditions filtering
- `table` pointing to the leave/request table
- `buttons` array with Approve/Reject actions using `updateTableRow`
- `search` and `conditions` for filtering by cost center VID and status
- Conversation/comments may need a secondary `addToTable` for the comment thread

---

## Scoping Decision: Single-Card Template Model

**Decided in Q1:** The JSON defines ONLY the single-card template (one approval row), NOT the entire list iteration. Key implications:

1. **No list data in JSON** -- Firebase is the runtime data source; the spreadsheet/JSON never carries actual approval row data.
2. **Frontend developer responsibility** -- The developer fetches Firebase data and renders the card template per row.
3. **Type marker field** -- The JSON should expose a type marker (e.g., `requestType` or `<TYPE>` proxy) so the frontend knows which icon, color, and label to bind per request type (Leave = airplane/purple, Overtime = clock/amber, Manual Check-In = pencil/pink).
4. **Header shell** -- The "Pending Approvals" header with count badge is likely a separate shell piece; the count comes from Firebase at runtime.

This means the JSON we produce is a **row template** that the mobile/web app stamps out N times, not a self-contained list widget.

---

## Interview Log

### Q1: Data ownership and list iteration
```
question: Should the JSON define the full list of approval cards, or just a single-card template that the frontend iterates over with Firebase data?
answer: Define only 1 card. Let the frontend list the cards because we cannot define all data from the spreadsheet into JSON. Data should come from Firebase and let the developer execute. We just need to mark the type.
recommendation: JSON = single row template with a type marker field. Frontend fetches Firebase collection, iterates, renders template per document. Header count badge is runtime-derived.
```

### Q2: Button placement — list only, detail only, or both?
```
question: Should the Approve/Reject buttons appear only on list rows, only in the detail view, or on both? Are they the same updateTableRow payload?
answer: Option C — both list AND detail have Approve/Reject buttons. Same updateTableRow payload. Comment input is an independent concern.
recommendation: The single-card row template includes its own Approve/Reject buttons with updateTableRow action. The detail view's Approve/Reject buttons reuse an identical action payload. The comment input does NOT block or gate approval — it is an independent addToTable concern.
```

### Architectural Decisions (from Q2)
1. **List-row template** defines its own Approve/Reject buttons with `updateTableRow` action.
2. **Detail view** Approve/Reject buttons reuse the identical action payload (no separate logic).
3. **Comment input** is independent of the approve/reject flow. Comments are a separate `addToTable` concern and do not block the approval action.

### Q3: Type-to-style mapping — hardcoded in Flutter or self-describing in JSON?
```
question: Does the Flutter app hardcode the icon/color/label mapping for each request type (Leave=airplane+purple, Overtime=clock+amber, etc.), or does the JSON itself carry all that styling metadata so the Flutter app just reads and renders whatever the JSON says?
answer: Option B — self-describing JSON. Flutter ships only base primitives (icon registry, base widget shell). Zero domain hardcode. ALL type-to-style mapping (icon name, fg color, bg tint, display label) is defined in the spreadsheet and built into the JSON. Flutter reads the icon name string from JSON and resolves it from its built-in icon set.
recommendation: The JSON row template must include a type-config lookup map (keyed by type string) that carries: icon name, icon color, background tint color, and display label for each request type. Flutter performs a simple map lookup at render time. Adding a new request type means updating the spreadsheet only — zero Flutter changes.
```

### Architectural Decision: Self-Describing Type Config
The JSON will embed a type-config object (or equivalent DSL structure) mapping each request type string to its full visual definition:
- `icon`: Flutter icon name string (e.g., `"flight"`, `"schedule"`, `"edit"`)
- `iconColor`: hex color for the icon (e.g., `"#7C3AED"`)
- `bgTint`: hex background tint for the icon tile (e.g., `"#EDE9FE"`)
- `label`: display string (e.g., `"Leave"`, `"Overtime"`, `"Manual Check-In"`)

This lives inside the widget JSON and is generated entirely from the spreadsheet. Flutter's only job is to resolve the icon name from its built-in icon registry and apply the colors.

### Q4: Request type strings — Indonesian or English?
```
question: What are the actual request type string values used in the data, and should they be Indonesian or English?
answer: Indonesian lowercase strings: izin, lembur, cuti, absen-manual, tukar-shift, sakit. The type-config map in JSON maps these to display labels (which can be English or bilingual).
recommendation: Use Indonesian strings as canonical keys since the platform is Indonesia-focused. Display labels in the type-config map handle localization.
```

### Q5: Table schema — unified request table + comment sibling
```
question: What does the data schema look like for requests and comments?
answer: User confirmed the recommended schema in full. See "Schema" section below.
recommendation: Single unified table `vtl.request` with 21 fields covering all request types. Separate flat sibling table `vtl.request-comment` with FK back to request VID. Status strings uppercase (PENDING/APPROVED/REJECTED). Locked.
```

---

## Schema (LOCKED)

### Table: `vtl.request` (unified table for all request types)

| Idx | Content | Example |
|---|---|---|
| `<1>` | Request VID | `VID-REQ-001` |
| `<2>` | Worker VID | `VID-WRK-877` |
| `<3>` | Worker name | `Siti Aminah` |
| `<4>` | Worker role | `Cleaner` |
| `<5>` | Site | `Menara BCA` |
| `<6>` | City | `Jakarta` |
| `<7>` | Cost Center VID | `VID-CC-456` |
| `<8>` | Request type | `izin` |
| `<9>` | Title | `Permission · 2026-04-24 · 10:00–12:00` |
| `<10>` | Date | `2026-04-24` |
| `<11>` | Start time | `10:00` |
| `<12>` | End time | `12:00` |
| `<13>` | Location | `Kantor BPJS Sudirman` |
| `<14>` | Shift VID | `VID-SHIFT-A` |
| `<15>` | Shift label | `Shift A · 06:00–14:00` |
| `<16>` | Reason | `Urus dokumen BPJS...` |
| `<17>` | Submitted at | `2026-04-24 06:50` |
| `<18>` | Status | `PENDING` |
| `<19>` | Approver VID | (set on action) |
| `<20>` | Approver name | (set on action) |
| `<21>` | Action timestamp | (set on action) |

**Status strings (uppercase):** `PENDING` / `APPROVED` / `REJECTED`

**Request type strings (Indonesian):** `izin` / `lembur` / `cuti` / `absen-manual` / `tukar-shift` / `sakit`

### Table: `vtl.request-comment` (flat sibling, FK at `<2>`)

| Idx | Content |
|---|---|
| `<1>` | Comment VID |
| `<2>` | Request VID (FK) |
| `<3>` | Author type (`SYSTEM` / `WORKER` / `SUPERVISOR`) |
| `<4>` | Author VID |
| `<5>` | Author name |
| `<6>` | Timestamp |
| `<7>` | Body text |
| `<8>` | Event chip (e.g. `Leave request submitted`, null if free message) |

---

## Interview Log (continued — Session 2026-05-08)

### Q6: Page file split
```
question: How many page JSON files should we produce?
answer: Two pages — one for the list (Image 1) and one for the detail view (Image 2 + Image 3 stacked).
recommendation: Produce pending-approval-page.json and request-detail-page.json. Reusable widget snippets (pending-approval-row.json, request-detail.json, request-conversation.json) get nested as children of the page wrappers. Pattern matches checklist-room-page.json.
```

### Q7: Header rendering on list page
```
question: How should the "Pending Approvals" header (icon + label + count badge) render?
answer: Single widget. No custom icon — Flutter built-in Material icon. Flutter handles fetching + looping rows internally.
recommendation: pending-approval-page.json holds one APPROVAL widget. Header label, count, and Material icon name baked into widget config. Flutter app reads search/conditions and emits N rows.
```

### Q8: Tap behavior — row body vs buttons
```
question: What happens when user taps the row body vs the Approve/Reject buttons?
answer: Row body tap navigates to detail. Buttons trigger a confirmation dialog (no reason field, no navigation).
recommendation: Row body action = navigate◼request-detail⭘request_vid◼<1>. Buttons use RBT widget with chain DO_DIALOG for ack-only confirmation. Reason captured later via comment input on detail page.
```

### Q9: Detail page child order
```
question: What order do detail page widgets stack top to bottom?
answer: Worker card → Request card → Conversation list → Action bar. Comment input nested inside conversation widget. Confirmed.
recommendation: request-detail-page.json children = [workerWidget, requestWidget, conversationWidget, actionBarWidget]. 4 children total.
```

### Q10: Detail page route param
```
question: How does the detail page know which request to load?
answer: Search by the request code at index <1> (e.g., REQ-2026-000112). Existing request-detail.json mapping was wrong and is replaced.
recommendation: List row navigate passes <1> as request_vid. All 4 detail widgets share conditions [[◀1▶◼<request_vid>]] for filtering. Worker-related fields stay denormalized inside the request row (per locked schema: worker name <3>, role <4>, site <5>, city <6>).
```

### Q11: Component types per detail child
```
question: What `type` value does each detail widget use?
answer: Reuse existing types — no new component invention.
recommendation:
  - Worker card → TXT composite (icon + name + subtitle stack)
  - Request card → APPROVAL display-only (no buttons array; buttons live in separate RBT below)
  - Conversation → displayList (already in request-conversation.json)
  - Comment input → nested inside displayList commentInput block
  - Action bar → RBT (separate widget, holds Reject + Approve)
```

### Q12: Post-tap flow on detail action bar
```
question: After Approve/Reject write, what happens?
answer: Both Approve and Reject navigate back to pending-approval-page. Refine flow later if needed.
recommendation: Both buttons run write → DO_DIALOG ack ("Request approved" / "Request rejected") → OK closes dialog → navigate◼pending-approval-page.
```

### Q13: Role gating (maker vs approver)
```
question: How do we gate which UI elements show for maker (worker view-only) vs approver (supervisor full interactive)?
answer: Hardcode role at the spreadsheet layer. Each widget carries a role field. Spreadsheet decides what to emit. No frontend conditional logic.
recommendation: Add a "role" field per widget in the JSON output. Spreadsheet emits the appropriate variant. Frontend stays dumb. Maker view = same JSON minus interactive widgets (action bar, comment input). Approver view = full JSON.
```

---

## SCHEMA RECONCILIATION (NEEDS ARCHITECT ATTENTION)

User shared a real Firebase document sample (REQ-2026-000112). Parsed `c` field reveals column ordering that does NOT match the locked schema above:

```
Actual Firebase row:
1  = REQ-2026-000112       (request code, plain string, not "VID-REQ-...")
2  = 87544551624342        (worker VID)
3  = Agenia Demo-7         (site or project — NOT worker name)
4  = 83674161979544        (VID — cost center?)
5  = Product Group         (label)
6  = 83674161979544        (VID)
7  = Product Group         (label)
8  = 06 May 2026 14:30     (submitted, formatted)
9  = 1778052610947         (submitted epoch)
10 = Cuti Melahirkan       (request title or type label)
11 = testaaa               (reason)
12 = firebase image URL    (attachment)
13 = 1778025600000         (start epoch)
14 = 06 May 2026 07:00     (start formatted)
15 = 1778284800000         (end epoch)
16 = 09 May 2026 07:00     (end formatted)
17 = 6                     (days count)
18 = 91234922513369        (replacement worker VID)
19 = Rejected              (status — note: at <19>, NOT <18> as locked schema claims)
20 = []                    (empty array placeholder)
21 = [[1, PENDING,..],[2, PENDING,..]]  (multi-step approval chain)
22 = description text      (composite human-readable summary)
```

**Discrepancy:** Locked schema says status at `<18>`, worker name at `<3>`. Actual Firebase has status at `<19>`, no worker name in row at all.

**User direction:** "Just search by the code. Replace request-detail.json per recommendation." User confirmed pre-join via spreadsheet but data sample shows worker fields are NOT yet pre-joined.

**Architect must decide:**
- (A) Update spreadsheet schema to add worker name/role/site/city columns and re-emit JSON pointing at the new index positions, OR
- (B) Map directly to current Firebase columns (worker VID at <2>, fetch worker info elsewhere or accept partial render).

Recommend (A) — preserves the SSOT principle (Flutter is dumb), but requires spreadsheet schema change before Engineer writes the final JSON.

---

## DELIVERABLES (FINAL)

1. `pending-approval-page.json` — list wrapper, single APPROVAL child with header + row template + RBT confirm dialogs.
2. `request-detail-page.json` — wraps 4 children: worker TXT, APPROVAL display-only, displayList conversation w/ comment input, RBT action bar.
3. Existing `request-detail.json` — superseded; safe to delete or repurpose as snippet.
4. Each widget includes a `role` field for spreadsheet-driven maker/approver gating.

---

## OPEN QUESTION RESOLUTIONS (Sign-off 2026-05-08)

User answers from architect plan review:

1. **typeConfig** → not currently used but write it anyway. Future-ready.
2. **Action timestamp** → append as `<27>`. Engineer adds to updateTableRow payloads.
3. **Worker pre-join cols `<23>`-`<25>`** → defer. Engineer uses placeholders / leaves blank for now.
4. **`<CC_VID>` source** → col 4 of `vtl.request`. Search/filter binds to `<4>`.
5. **`tablevid` numeric value** → defer. Engineer uses `<PLACEHOLDER_VID>` literal string.
6. **Duplicate cost center cols** → CORRECTED: `<4>/<5>` = cost center pair (VID/label), `<6>/<7>` = site pair (VID/label). Site label = `<7>` (not `<3>`). Worker card subtitle and MetaRow Location both bind to `<7>`.
7. **MetaRow label set** → defer. Engineer keeps plan as-is (Date/Start/End/Location/Duration/REASON).

### Updated proxy bindings (overrides plan column map)

| `<N>` | Was | Now |
|---|---|---|
| `<3>` | Site/project name | (unmapped — leave for later, possibly worker info field) |
| `<6>` | CC VID dup | Site VID |
| `<7>` | CC label dup | Site label (display) — used in Worker card subtitle + MetaRow Location |
| `<27>` | (not in plan) | Action timestamp (NEW, appended) |

---

## REVISION 2 (2026-05-08): Split comment input from displayList

User direction: separate the comment list and comment input into two distinct widgets. Reference `txf` qrScan pattern — comment input becomes its own `txf` variant with attachment + Send button + addToTable.

**Confirmed decisions:**
1. Add column `<9>` to `vtl.request-comment` for attachment URL.
2. Body text written at left payload position 7.
3. Max 3 attachments per comment.
4. Variant name = `commentBox`.

**Updated `vtl.request-comment` schema:**

| Idx | Content |
|---|---|
| `<1>` | Comment VID |
| `<2>` | Request VID (FK) |
| `<3>` | Author type (`SYSTEM` / `WORKER` / `SUPERVISOR`) |
| `<4>` | Author VID |
| `<5>` | Author name |
| `<6>` | Timestamp |
| `<7>` | Body text |
| `<8>` | Event chip |
| `<9>` | Attachment URL **(NEW)** |

**Detail page child order updated to 5 children:**
1. Worker card (TXT)
2. Request card (APPROVAL display-only)
3. Conversation list (displayList — read-only, `commentInput` block REMOVED)
4. Comment input (txf variant `commentBox` — NEW widget)
5. Action bar (RBT)
