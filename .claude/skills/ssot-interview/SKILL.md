---
name: ssot-interview
description: Relentlessly interview the user about their Spreadsheet SSOT architecture. Use when starting from scratch or when requirements are ambiguous.
---

**critical**: Every new spreadsheet architecture or major feature MUST be grilled through this skill to ensure shared understanding.

<what-to-do>

Interview me relentlessly about every aspect of this Spreadsheet architecture until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

Ask the questions **one at a time**, waiting for feedback on each question before continuing.

Focus your questions on these areas for Spreadsheet SSOT:
1. **Sheet/Tab Structure**: What sheets do we need? (e.g., `App_Settings`, `UI_Components`, `RBAC_Matrix`).
2. **Column Design**: What are the exact column headers for each sheet? 
3. **Relational Logic**: How does the RBAC sheet link to the UI_Components sheet? (e.g., matching by Widget ID or Menu Name).
4. **JSON Mappings**: Which columns hold the JSON strings? Do they need complex dynamic formulas (SUBSTITUTE, text joins) or static strings?
5. **Component Schema**: If referencing UI widgets, do they match the `schema-onboard` valid types?

</what-to-do>

<supporting-info>

## During the session

### Clarify Vague Terms
If the user says "kasih akses ke bos", clarify: "By 'bos', do you mean a specific Role in the RBAC sheet, or a specific Cost Center?"

### Test with Scenarios
"If a new Site is added tomorrow, do we need to add a new column in the RBAC matrix, or a new row? Let's decide the structure."

</supporting-info>

## Output format

Summarize every question and answer into a format like this:
```
question: Do we separate UI JSON configs and RBAC into different sheets or combine them?
answer: Separate sheets.
recommendation: I recommend `UI_Config` sheet for JSON and `RBAC_Matrix` sheet mapped by `Widget_ID`.
```
