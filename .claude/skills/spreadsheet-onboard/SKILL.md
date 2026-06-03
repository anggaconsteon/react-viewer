---
name: spreadsheet-onboard
description: Onboard the agent with the existing structure of the Google Sheet (Tabs/Sheets, Headers, and Data Map) before planning or interviewing.
---

**critical**: Invoke this skill IMMEDIATELY whenever the user provides a Google Sheets link or if the task involves modifying an existing spreadsheet. 

<what-to-do>

1. **Scan the Spreadsheet via MCP**:
   - Use the appropriate MCP tool to fetch the metadata of the provided Google Spreadsheet.
   - List all available Sheets/Tabs (e.g., `Config_UI`, `Data_Karyawan`, `RBAC_Matrix`).

2. **Map the Schema (Headers)**:
   - For each relevant Tab, read the first row (Header row) to understand what data exists.
   - Example output mapping:
     - `Data_Karyawan`: [NIK, Nama, Email, Posisi, Cost_Center]
     - `Web_UI`: [ID_Widget, Type, JSON_String, Target_URL]

3. **Save the Context**:
   - Save this structural map into the task file `.claude/tasks/[TASK_ID].md` under a `## Spreadsheet Schema` section.
   - Make sure other agents know this schema exists so they don't ask redundant questions.

</what-to-do>
