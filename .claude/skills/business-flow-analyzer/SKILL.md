---
name: business-flow-analyzer
description: Skill for translating high-level business flows into specific Spreadsheet SSOT layouts, Widget JSON configurations, and Consteon database actions (addToTable/updateTableRow).
when_to_use: Use this skill when the user asks for a new business module (e.g., "Real Estate flow", "CRM module") and you need to recommend what widgets to build and how they map to the spreadsheet.
---

# Business Flow Analyzer Skill

## Overview

As part of the Spreadsheet SSOT (Single Source of Truth) architecture, you are required to act as a **Business & System Analyst**. When a user requests a new feature or business flow, do not just generate random JSON. You must break down the business logic into actionable Steps, map those to Widgets, and design the correct Database Actions.

## The Workflow

### 1. Break Down the Business Flow
Identify the **Actors** (e.g., Seller, Buyer, Supervisor) and the **Steps** they take.
*Example for Real Estate:* Prospect -> Meeting -> Follow Up -> Deal.

### 2. Map Steps to Widgets
For each Step, decide which JSON Widget type makes the most sense.
- `FORM`: For data entry (e.g., adding a Prospect).
- `HORIZONTAL_ICON` or `displayList`: For viewing lists of items (e.g., scheduled Meetings).
- `APPROVAL` or `request.json` variant: For detailed timelines, comments, and compound actions (e.g., Follow up logs and Deals).

**Critical Step:** You must explicitly recommend *creating* the necessary widgets if they do not exist. Furthermore, you must **confirm with the user** whether your recommended widget design matches their attached JSON examples. If possible, provide or ask for a visual preview/image of the widget to ensure the recommendation perfectly aligns with the visual design.

### 3. Design Database Actions (Consteon DSL)
Formulate the exact payload strings needed for the spreadsheet. Keep in mind:
- **`addToTable`**: Creates a new row. Requires `tablevid` or path, and a payload of mapped fields.
- **`updateTableRow`**: Updates an existing row.
- **Compound Actions**: Use the diamond `◆` to chain multiple actions (e.g., update status AND add a log).
- **Runtime Tokens**: Use `◀N▶` for left/device payloads (like UUID `◀2▶` or timestamp `◀1|T7...▶`) and `◁N▷` for right/session payloads.

### 4. Output the Synchronization Matrix
Present the recommendation to the user in a clear table. This table bridges the Spreadsheet Menu/Layout with the JSON configuration.
Once approved, `sheet-engineer` will use this matrix to edit the Google Sheet via MCP and generate the corresponding `.json` files.

---

## Example Case: Real Estate Flow

If the user says: *"I want a flow for Real Estate: ketemuan, meeting, sampai dealing. Recommend the widgets and addToTable logic."*

### Analysis & Recommendation Output

**1. Prospect (Seller Activity)**
*   **Goal**: Mendaftarkan prospek baru.
*   **Widget Recommendation**: `type: FORM`
*   **Spreadsheet Mapping**: Menu Level 1 "Real Estate" -> Level 2 "Prospect"
*   **Action Logic**: 
    `addToTable` ke `vtl.real-estate-prospect`
    *DSL Payload*: `$<env>/<workspace>//vtl.real-estate-prospect⭘<1>◼◀2▶(UUID)⭘<2>◼◁1▷(User/Seller VID)⭘<3>◼◀3▶(Nama Prospek)⭘<4>◼◀4▶(Kontak)⭘<5>◼PROSPECT`

**2. Meeting (Seller & Buyer Activity)**
*   **Goal**: Mengatur dan melihat jadwal ketemuan/showing properti.
*   **Widget Recommendation**: `type: HORIZONTAL_ICON` (List view dengan tombol aksi).
*   **Spreadsheet Mapping**: Menu Level 2 "Meeting Schedule"
*   **Action Logic**: 
    `addToTable` ke `vtl.real-estate-meeting` dengan FK ke Prospect.
    *DSL Payload*: `$<env>/<workspace>//vtl.real-estate-meeting⭘<1>◼◀2▶⭘<2>◼◁3▷(Prospect VID FK)⭘<3>◼◀3▶(Jadwal Meeting)⭘<4>◼PENDING`

**3. Follow Up (Buyer Activity)**
*   **Goal**: Log interaksi/negosiasi dengan prospek.
*   **Widget Recommendation**: Detail Page (seperti pola `request.json` dengan section conversation).
*   **Spreadsheet Mapping**: Hide dari menu utama (diakses dari list Prospect).
*   **Action Logic**: 
    `addToTable` ke `vtl.real-estate-history` (Tabel komentar/log).
    *DSL Payload*: `$<env>/<workspace>//vtl.real-estate-history⭘<1>◼◀2▶⭘<2>◼◁3▷(Prospect VID FK)⭘<3>◼◁1▷(Author VID)⭘<4>◼◀3▶(Teks Follow Up)`

**4. Deal (Buyer Activity)**
*   **Goal**: Menutup transaksi.
*   **Widget Recommendation**: Tombol Action di dalam Detail Page Prospect.
*   **Action Logic**: 
    **Compound Action (`◆`)**: Ubah status Prospect jadi DEAL + Tambah log kemenangan.
    *DSL Payload*: `<5>◼DEAL⭘<6>◼◁1▷(Approver)⭘<7>◼◀1|T7|yyyy-MM-dd HH:mm:ss▶◆$<env>/<workspace>//vtl.real-estate-history⭘<1>◼◀2▶⭘<2>◼◁3▷⭘<3>◼◁1▷⭘<4>◼Closed Deal`

---

## Important Rules for Execution

1. **Spreadsheet is SSOT**: Never hardcode colors, icons, or role matrices in the JSON if the frontend is configured to resolve them via the spreadsheet.
2. **Consult Schema First**: If you need to write `updateTableRow`, ensure you know the target `vidtable`. If not known, use placeholders like `<PLACEHOLDER_VID>`.
3. **Compound Actions**: Always use `◆` for actions that require both an update and an insert (e.g., Approve + Log).
4. **Handoff**: After designing this, instruct `sheet-engineer` to write these rows into the Google Sheets via MCP, ensuring absolute synchronization between JSON blueprints and the database.
