---
name: sheet-workflow
description: The Ultimate Orchestrator for Spreadsheet SSOT. Handles features, schema migrations, debugging, code sync, localization, optimization, reverse engineering, and mock data.
when_to_use: Use when managing any aspect of the Spreadsheet SSOT system.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Spreadsheet SSOT Workflow Orchestrator

## Overview

This skill chains the project's Spreadsheet SSOT agents based on the context of the task.

**Shared state carrier:** `.claude/tasks/[TASK_ID].md`

---

## Pipeline Execution

### Step 1 — Context & Scoping (sheet-project-manager)
- Invoke `sheet-project-manager` to define the scope (Feature, Bug, Refactor, Localization, Optimization, Mock Data, Reverse Engineer).
- It will load `recall-memory` and `spreadsheet-onboard`.

### Step 2 — Branching Logic based on Scope

**Branch A: Reverse Engineering**
- Invoke `json-to-sheet-reverse` to parse local JSON and build the Google Sheet.
- Go to Step 3.

**Branch B: Localization (I18N)**
- Invoke `sheet-translator` to extract hardcoded strings and build a Dictionary sheet.
- Go to Step 3.

**Branch C: Optimization**
- Invoke `sheet-optimizer` to refactor heavy formulas.
- Go to Step 4 (QA).

**Branch D: Mock Data Seeding**
- Invoke `mock-data-generator` to fill tables with dummy data.
- Go to Step 4 (QA).

**Branch E: Standard Feature / From Scratch**
- Invoke `sheet-architect` to plan the schema.
- Invoke `sheet-dba` if structure changes.
- Go to Step 3.

**Branch F: Bug/Error Fixing**
- Invoke `sheet-debugger` to trace `#N/A` or dirty data.
- Go to Step 3.

### Step 3 — Execution (sheet-engineer)
- Invoke `sheet-engineer` to write formulas, JSON, and RBAC via MCP.

### Step 4 — Validation (sheet-qa)
- Invoke `sheet-qa` to validate the spreadsheet syntax.

### Step 5 — Syncing (sheet-syncer)
- Invoke `sheet-syncer` to pull the final JSON to the local codebase.

---
