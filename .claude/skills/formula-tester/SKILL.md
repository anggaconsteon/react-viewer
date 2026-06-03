---
name: formula-tester
description: A simulation sandbox for complex spreadsheet formulas. Tests array formulas and string concatenations in a scratchpad before touching the live database.
---

**critical**: Use this when writing complex nested formulas involving `CHAR(34)`, `SUBSTITUTE`, `VLOOKUP`, or `ARRAYFORMULA`.

<what-to-do>

1. **Create Scratchpad**:
   - If the user's spreadsheet has a sheet named `Scratchpad`, use it. If not, create a temporary sheet or use an empty column far away (e.g., Column ZZ).

2. **Dry Run**:
   - Write your complex Google Sheets formula to the scratchpad cell via MCP.
   - Read the result of that cell via MCP immediately.

3. **Validate Result**:
   - Does it evaluate to `#ERROR!` or `#N/A`?
   - If it evaluates to a JSON string, is the syntax perfectly valid? Check for unescaped quotes or trailing commas.
   - Only when the scratchpad result is 100% correct, proceed to copy the formula to the actual live target cell.

</what-to-do>
