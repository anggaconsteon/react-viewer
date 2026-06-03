---
name: web-builder-interview
description: Relentlessly interview the user about a web page mockup/code one question at a time — page meta, content type(s), topbar/bottomBar widgets, RBAC parent, and dynamic tokens — until the Web Screen scope is fully clear.
when_to_use: Use at the start of a Web Screen build, before architecting, to remove ambiguity about page structure and data.
---

# Web Builder Interview

Ask ONE question at a time. Do not batch. Prefer multiple-choice. Continue until every item below is unambiguous, then summarize back for confirmation.

## Required coverage

1. **Page meta** — label, icon, path, parent menu (must match a `Web Menu 2` node), page title, urlSheet/src.
2. **Content zone(s)** — for each: type `spreadsheet` | `map` | `custom`?
   - spreadsheet → src, permission (`C◆U◆D`), visibleSheets, sheetName, rowHeader, rowStartData.
   - map → lat, lng, zoom.
   - custom → the raw JSON object body fragment (and confirm it is valid JSON).
   - Is there more than one content element (content is an array)?
3. **topbar** — which widgets (dropdown/date/buttonSubmit/spacer), in what order, alignment? Per widget, its params.
4. **bottomBar** — same questions, or none.
5. **Dynamic tokens** — which params carry `[CC_LIST]` (per-user cost-center list)? Any other per-user value?
6. **RBAC** — which Level-1 menu group gates this page (the parent's permission)?

## Rules

- If the user supplied an image, restate what you see and ask the user to confirm/correct before drilling into params.
- If a needed widget type does not exist in `Web Widget`, note it explicitly (the architect's gap-check will handle it) and ask for its intended JSON shape.
- Never invent params. If unknown, ask.
