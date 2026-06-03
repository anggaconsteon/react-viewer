# Task: ssot-vid-autofill-001

## Status: CREATED

## Spreadsheet
- **Spreadsheet ID:** `1uWKxoafSGIcOAvy14YCD1GhkqDji97P4HOyOq5EvJh8`
- **Target Sheet:** `Web JSON`
- **Scope:** Modify existing sheet (not from scratch)

## Raw Requirements

1. Add an input component for **VID** in **Column A** of the `Web JSON` sheet.
2. **Auto-fill rule:** When the VID field is filled (non-empty), the **Email** field must auto-fill automatically.

## Open Questions for Architect

- Where does the Email value come from when VID is provided? (lookup table, formula, API, or same spreadsheet?)
- Which column currently holds the Email field?
- What is the current structure/layout of the `Web JSON` sheet in this spreadsheet? (This is a different spreadsheet from the one documented in project memory.)
- Is VID a free-text input or a dropdown/validated input?
- What data source maps VID to Email? (e.g., a `Master` sheet, external database, VLOOKUP target range)

## Handoff

Next: `sheet-architect` -- assess the current sheet structure, determine the lookup mechanism for VID-to-Email, and plan the formula/component changes.
