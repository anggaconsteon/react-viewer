---
name: formula-wizard
description: Best practices for writing complex Google Sheets formulas for JSON generation and text manipulation.
---

<what-to-do>

Use these strategies when generating JSON dynamically inside Google Sheets:

1. **Concatenation and Escaping Quotes**:
   - Use `CHAR(34)` instead of escaping quotes manually `""""` to avoid extreme confusion.
   - Example JSON property: `="{" & CHAR(34) & "type" & CHAR(34) & ":" & CHAR(34) & "BUTTON" & CHAR(34) & "}"`

2. **Dynamic Replacements (SUBSTITUTE)**:
   - When using a base JSON template cell, use `SUBSTITUTE` to inject dynamic values.
   - Example: `SUBSTITUTE(SUBSTITUTE(A1, "{{URL}}", B1), "{{METHOD}}", C1)`

3. **Array Joining**:
   - For `children` arrays, use `TEXTJOIN(",", TRUE, A1:A5)` to combine multiple JSON component strings, then wrap in `[]`.

4. **RBAC Lookups**:
   - Use `INDEX(MATCH())` or `VLOOKUP` to check if a specific user role (column header) has access (marked with 'x' or '✓') to a specific menu/component (row).
   - Use `FILTER` to dynamically pull a list of allowed Cost Centers for a specific site.

</what-to-do>
