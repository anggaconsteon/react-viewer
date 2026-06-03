---
name: sheet-backup
description: Acts as a safety net. Creates a backup of the spreadsheet or target tab before destructive operations (like massive formula overwrites or schema changes).
---

**critical**: MUST be called by `sheet-engineer` or `sheet-dba` prior to injecting high-risk formulas or refactoring tables.

<what-to-do>

1. **Pre-Execution Check**:
   - Before modifying a live sheet containing critical data or complex JSON, use MCP to fetch the current state of the sheet (or duplicate the tab if supported by your MCP tool).
   
2. **Snapshot Save**:
   - If duplication is not possible, save the raw `CSV` or JSON tree data into a temporary `.claude/scratch/[TASK_ID]_backup.md` file.

3. **Fallback Logic**:
   - If the subsequent operation results in `#ERROR!` or `#REF!`, the agent must use this backup file to restore the original state of the spreadsheet.

</what-to-do>
