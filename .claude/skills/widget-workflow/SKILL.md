---
name: widget-workflow
description: Orchestrator for transforming UI mockups into flat DSL widget JSON files.
when_to_use: Use when the user wants to convert a UI image or design concept into a Consteon widget JSON file.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Widget UI-to-JSON Workflow Orchestrator

## Overview

This skill chains the agents specifically meant for designing and building Consteon widget JSONs from UI mockups using the flat DSL pattern.

**Shared state carrier:** `.claude/tasks/[TASK_ID].md`

---

## Pipeline Execution

### Step 1 — Context, Scoping & Interview (widget-project-manager)
- Invoke `widget-project-manager` to define the scope from the user's UI mockup or request.
- It will load `widget-dsl-pattern` and explicitly invoke `widget-interview` to ask the user clarifying questions ONE AT A TIME.
- Once the interview is complete, it sets up the task file.

### Step 2 — Brainstorming & Planning (widget-architect)
- Invoke `widget-architect` to map visual elements to the flat `◆` delimited `text` properties, define proxy variables `<N>`, and structure the `addToTable` syntax.

### Step 3 — Execution (widget-engineer)
- Invoke `widget-engineer` to write the actual `.json` file based on the architect's plan.

### Step 4 — Validation (widget-qa)
- Invoke `widget-qa` to validate the JSON file. Ensure no illegal nesting exists, the `◆` symbol is used correctly, and the JSON is fully valid.

---
