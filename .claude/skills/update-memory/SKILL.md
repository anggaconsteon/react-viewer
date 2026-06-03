---
name: update-memory
description: Record lessons learned, bug fixes, user corrections, or new SSOT architectural rules into the long-term memory file.
---

**critical**: Use this skill whenever you receive a correction from the user, or when you successfully debug a complex problem.

<what-to-do>

1. **Locate Memory File**:
   - The memory file is located at `.claude/memory/SSOT_MEMORY.md`. If it doesn't exist, create it.

2. **Format the Lesson**:
   - Append the new lesson at the bottom of the file using the following Markdown format:
   ```markdown
   ### Lesson: [Brief Title of the Problem/Rule]
   - **Context**: [When did this happen? e.g., Writing VLOOKUP for RBAC]
   - **Wrong**: [What was the incorrect approach or assumption?]
   - **Good**: [What is the correct, user-approved approach?]
   - **Date**: [Current Date]
   ```

3. **Ensure Permanence**:
   - Do not overwrite past lessons unless explicitly told that an old rule is now deprecated. Always append to the file.

</what-to-do>
