---
name: event-workflow
description: Orchestrator for generating Event artifacts (addToTable, ★ map, D formula, event DSL) from an op1Screen row number.
when_to_use: Use when the user wants to create or standardize Event entries for a page. User provides an op1Screen row number (or page route key) and this skill generates all Event-related artifacts.
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Event Workflow Orchestrator

## Overview

Given an **op1Screen row number**, this skill analyzes the page and generates all Event-related artifacts following the standardized pattern from `vertikaTeknoLokaciptaRequestLeave`.

**Shared state carrier:** `.claude/tasks/[TASK_ID].md`

---

## Input

User provides ONE of:
- **op1Screen row number** (e.g., `655`, `886`)
- **Page route key** (e.g., `vertikaTeknoLokaciptaRequestLeave`)

If user says "buat Event untuk row 886" or "Event for report-incident" — this skill applies.

---

## Pipeline Execution

### Step 0 — Load Source of Truth

Read these files BEFORE any work:
1. `docs/standard-page-event-pattern.md` — master pattern doc
2. `docs/event-dsl-spec.md` — `event` DSL spec for approval buttons
3. `docs/approve-leave-event-spec.md` — reference position map

### Step 1 — Read Page from Spreadsheet

Use MCP `mcp__gsheets__get_sheet_data` to read the op1Screen row. Extract:
- Page JSON from column B
- All child widgets with `type`, `position`, `label`/`text`
- Submit/action button(s) — `action: "savesend"` or `buttons[]`
- Existing `addToTable`, `flag`, `gpsPosition`

If MCP unavailable, ask user to paste the page JSON or read from local `json/` files.

### Step 2 — Detect Page Type & Branch

| Signal | Type | Branch |
|--------|------|--------|
| Button has `action: "savesend"` + `addToTable` | **FORM** | → Branch A |
| Widget has `LIST_ITEM_CARD` with `buttons[]` | **APPROVAL** | → Branch B |
| `savesend` inside `LIST_ITEM_CARD` | **HYBRID** | → Branch B |

### Branch A: FORM Page (savesend)

Invoke `event-builder` agent with:
```
Page type: FORM
op1Screen row: {row}
Page JSON: {json}

Generate:
1. Widget position table
2. Standardized addToTable DSL formula (default block <1>-<12> + tail)
3. Event C ★ position map (★ = position - 1)
4. D formula for op1Script (scaffold + org chain + route + tail)
5. op1Script row config (A/B/C/D/F columns)
```

**Validation checklist for FORM:**
- [ ] Default block `<1>`-`<12>` matches template exactly
- [ ] `<3>◼[]` and `<4>◼[]` present (even if no approval)
- [ ] `<5>`-`<10>` use cell refs (`Settings!$B$1`, etc.), NOT hardcoded
- [ ] `<11>` uses `System!$B$3` for timezone
- [ ] Tail starts at `<13>`
- [ ] `◁N▷` tokens match widget positions
- [ ] `<30>` has summary template
- [ ] ★ map: ★N = position (N+1), column = chr('E' + N - 1)
- [ ] D formula uses ☆ separator in tail, ◻ between blocks
- [ ] D formula wrapped in REGEXREPLACE

### Branch B: APPROVAL Page (buttons)

First, identify the ORIGINAL FORM page that creates the Firebase records this approval page acts on. This is critical — the form's widget positions determine the ★ mapping.

Invoke `event-builder` agent with:
```
Page type: APPROVAL
op1Screen row: {row}
Original form row: {form_row}
Page JSON: {json}

Generate:
1. Firebase field → ★ mapping table
2. `event` DSL string for button config
3. Updated button JSON with `event` property
4. Event C ★ position map
5. D formula for op1Script
```

**Validation checklist for APPROVAL:**
- [ ] ★1 NOT in DSL (system auto-builds identity)
- [ ] Each `★N◼<M>` maps to correct Firebase field
- [ ] `★18◼approver` present (VID☆Name combined)
- [ ] `★23◼levels` present (expands `<4>` array, max 5)
- [ ] `<2>` read AFTER updateTableRow (status updated)
- [ ] Level blocks use ☆ separator: `{level}☆{status}☆{name}☆{vid}☆{ts}☆{epoch}`
- [ ] `event` property added to BOTH Approve AND Reject buttons
- [ ] D formula uses ☆ in tail, ◻ between blocks

### Step 3 — Present Results to User

Output all artifacts in structured format:

```
## Results for {page_name} (row {row})

### 1. Position Table
{table}

### 2. addToTable Formula (FORM) / event DSL (APPROVAL)
{formula or DSL}

### 3. ★ Position Map
{map}

### 4. D Formula (op1Script)
{formula}

### 5. op1Script Row Config
{config}
```

### Step 4 — Apply to Spreadsheet (on user confirmation)

Only after user says "ok" or "apply":
- Use MCP to update op1Screen with new addToTable / button JSON
- Use MCP to add/update op1Script row with D formula
- Verify by re-reading the cells

---

## Quick Reference

### Default Block (sacred, never change)
```
<1>◼◁17▷          — auto-number
<2>◼{STATUS}       — initial status
<3>◼[]             — history (always [])
<4>◼{APPROVAL}     — approval array or []
<5>◼Settings!$B$1  — submitter VID
<6>◼Settings!$B$2  — submitter Name
<7>◼'op1'!$K$8     — site VID
<8>◼'op1'!$L$8     — site Name
<9>◼'op1'!$K$7     — group VID
<10>◼'op1'!$L$7    — group Name
<11>◼◀2|T{tz}|fmt▶ — timestamp formatted
<12>◼◀2▶           — timestamp epoch
```

### ★ Mapping Formula
```
★ section = widget_position - 1
op1Script column = chr(ord('E') + ★_section - 1)
```

### D Formula Structure
```
=REGEXREPLACE(
  {scaffold}       — C$16&"◼"&D$16&"◼"&B$16&"◼"&$F$13&"◼"&N$14&", "&M$14&...
  &"◻"&{org_chain} — 'op1'!$H$1&"☆"&'op1'!$H$2
  &"◻"&{divisions} — 'op1'!$I$5&"◻"&'op1'!$J$5&"◻"&'op1'!$K$5
  &"◻"&{route}     — Event!$B$2&"☆"&$B$12
  &"◻"&{tail}      — custom ☆-separated cells
, "(""|')", "`")
```

### DSL Tokens
| Token | Meaning |
|-------|---------|
| `⭘` | Entry separator |
| `◼` | Key-value separator |
| `◁N▷` | Form widget at position N |
| `◀N▶` | System stream N |
| `◀N\|T7\|fmt▶` | System stream N with format |
| `☆` | Sub-field separator (inside ★, D tail) |
| `◻` | Major block separator (D formula) |
| `★N` | Event C section N |

---

## Error Patterns to Watch

| Error | Fix |
|-------|-----|
| Hardcoded VID/Name in addToTable | Use `Settings!$B$1`/`$B$2` |
| Missing `<3>◼[]` or `<4>` | Always include, even empty |
| ◇ in level blocks | Must be ☆ |
| Approver VID and Name in separate ★ | Combine: `VID☆Name` in one ★18 |
| ★1 in event DSL | Remove — system auto-builds |
| Tail includes F13 | Skip — already in scaffold |
