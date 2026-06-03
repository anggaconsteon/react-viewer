---
name: schema-onboard
description: Onboard the agent with the available JSON DSL components and structure rules.
---

**critical**: Every JSON layout MUST strictly adhere to these component structures.

<what-to-do>

Read these rules and remember them for the current task.
1. A valid page configuration always has `type: "PAGE"` as the root object.
2. Inside `PAGE`, there must be an `id`, `title`, and `children` array.
3. Available components for `children`:
   - `TOPBAR`: A container typically holding DROPDOWNs, SPACERs, and BUTTONs.
   - `SPREADSHEET`: Renders an iframe to a Google Sheet. Requires `src` and `id`.
   - `BOTTOMBAR`: A container typically holding BUTTONs for submission/reset.
   - `DROPDOWN`: Needs `key`, `variant`, `placeholder`, and `options` (separated by `◆`).
   - `BUTTON`: Needs `variant`, `size`, `text`, `icon` (optional), and `onClick` handler.
   - `SPACER`: Empty object `{ "type": "SPACER" }` used to push elements apart.
4. Action Handlers (`onClick`):
   - `FETCH_CONTENT`: Requires `url`, `method`, `target`.
   - `SUBMIT`: Requires `url`, `method`.
   - `RESET`: Requires `scope`.

</what-to-do>
