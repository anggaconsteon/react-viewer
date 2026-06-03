---
name: web-builder-workflow
description: Orchestrator that chains the web-screen agents to turn a UI mockup/code into a formula-assembled Web Screen page in the VTL Master spreadsheet.
when_to_use: Use when the user wants to build or modify a VTL web page (Web Screen) from an image, code, or description.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Web Builder Workflow Orchestrator

Chains the dedicated `web-*` agents. Shared state carrier: `.claude/tasks/[TASK_ID].md` (plan in `.claude/plans/`, report in `.claude/reports/`).

## Pipeline

### Step 1 — Scope & interview (web-screen-analyzer)
Invoke `web-screen-analyzer`. It loads `web-json-pattern`, runs `web-builder-interview` (one question at a time), and writes the component inventory to the task file.

### Step 2 — Plan (web-screen-architect)
Invoke `web-screen-architect`. It reads live `Web Widget` + `Web Screen`, maps components to templates, runs the auto-widget gap-check, computes placement + `Web Menu 2` registration, writes the plan, and STOPS for user approval.

### Step 3 — Execute (web-screen-engineer)
After approval, invoke `web-screen-engineer`. It writes any new Web Widget templates, the Web Screen page (header + widget rows + formulas), and the Web Menu 2 node — live via gsheets MCP — then reports.

### Step 4 — Validate (web-screen-qa)
Invoke `web-screen-qa`. It reads back the assembled pageJSON + Web JSON output and validates. Pass → done; fail → route back to `web-screen-engineer` with specific feedback.

## Notes
- Only engineer + qa touch the live sheet; analyzer + architect are read-only plan-mode.
- This is the WEB workflow; do not confuse with the mobile `widget-workflow` (flat DSL) or `op1screen-page-engineer`.
