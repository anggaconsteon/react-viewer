---
name: code-analyzer
description: Parse HTML / JSX / TSX source into a deterministic UI element list (same output shape as vision-analyzer) so the rest of the widget pipeline can consume it.
---

**critical**: Use whenever the user provides a code file (or code range) instead of a screenshot to translate into Consteon widget JSON. Output shape MUST mirror `vision-analyzer` so downstream agents (`widget-architect`, `formula-substituter`, `widget-placeholder-resolver`, `op1screen-page-engineer`, `widget-qa`) do not need to know the source was code, not an image.

<what-to-do>

## 1. Receive scope

User MUST provide either:
- `file_path` (absolute) + optional `selector` (an `id="..."`, a CSS-style class, or a JSX component name)
- `file_path` + `start_line` + `end_line`
- raw code block fenced in the message

If ambiguous (e.g., file has many sections), ask user **one** clarifying question: "Section mana? Sebut id/class/component name atau range baris."

## 2. Detect source dialect

- `.html` / `.htm` → HTML mode
- `.jsx` / `.tsx` → JSX mode
- `.js` / `.ts` with JSX → JSX mode
- Inline snippet → infer from first non-whitespace token (`<` + lowercase = HTML, `<Capital` or `function Foo` = JSX)

## 3. Extract elements (top-to-bottom DOM order)

For each visible element, record:

| Field | HTML source | JSX source |
|---|---|---|
| `tag` | tag name (`div`, `button`, `i`) | component / intrinsic (`View`, `Button`, `<div>`) |
| `role` | inferred from class / text / structure | inferred from component / props |
| `text` | text node content (trim, join siblings with space) | string children, template literals (drop `{var}` placeholders, keep as `<VAR>` token) |
| `attrs` | id, class, data-*, onclick target screen, src, href, alt, placeholder, type | props verbatim — incl. `onClick`, `onSubmit`, `style`, `variant`, `label`, `placeholder` |
| `style` | inline `style="..."` parsed as obj | `style={{...}}` parsed as obj (flatten ternaries to both branches if simple) |
| `children` | nested element list | nested element list |
| `state_refs` | n/a | any `useState`, prop reference, or `{var}` interpolation flagged → candidate `<N>` proxy |
| `handler_refs` | onclick target (e.g. `switchScreen('s-x', 4)`) | onClick / onSubmit body summary |

Drop: comment nodes, `<script>`, `<style>`, dev-only annotation blocks (`class="annotation"`), invisible spacers, `display: none` siblings (unless they're collapsed sections — keep but mark `collapsed: true`).

## 4. Classify role (vision-analyzer parity)

Use the SAME role vocabulary as `vision-analyzer`:

- `TOPBAR` — first row with back-arrow + title + right-side icons
- `KPI_STRIP` — 2-4 small cards each `<big-number> + <small-label>`
- `FILTER_BAR` — row of buttons / chips toggling list filter
- `SECTION_HEADER` — small uppercase label between groups (`SUDAH SELESAI`, `SITE BERIKUTNYA`)
- `COLLAPSIBLE_CARD` — clickable header row with chevron + expandable child block (detect via `onclick="toggle..."` or `aria-expanded`)
- `LIST_ITEM_AVATAR` — avatar circle + name + sub + trailing meta (worker rows, site rows)
- `HIGHLIGHTED_CARD` — full-width card with bg color + bold text (Bintaro "SEDANG DI SINI", Salim "BELUM CLOCK-IN")
- `INFO_BANNER` — bottom callout with bulb icon
- `BUTTON` — standalone CTA (Reassign)
- `BOTTOMBAR`

Never invent new roles. If something does not fit, mark `role: "UNKNOWN"` and include the raw HTML/JSX snippet for human review.

## 5. Identify dynamic fields

Anything that looks like data (numbers, names, status text) → flag as proxy candidate. Track in `state_refs[]`:

```
{ "label": "site_count", "sample": "12 lokasi", "suggested_proxy_index": null }
```

`formula-substituter` will later assign `<N>` indexes — analyzer just lists candidates in reading order.

## 6. Output

Emit ONE structured block (in the task file or response):

```yaml
source:
  file: src/consteon-worker-app.html
  range: 1089-1380
  dialect: html
elements:
  - role: TOPBAR
    text: "Smart grouping ◆ 12 lokasi · group by proximity"
    attrs: { back_target: "s-routes", right_icons: [list, map] }
  - role: KPI_STRIP
    items:
      - { value: 3, label: "Selesai", color: success }
      - { value: 1, label: "Aktif",   color: info }
      - { value: 8, label: "Berikutnya", color: neutral }
  - role: SECTION_HEADER
    text: "SUDAH SELESAI"
  - role: COLLAPSIBLE_CARD
    header: { icon: circle-check, title: "Selesai", meta: "3 site · 14km drive · 1j 23m total", color: success, collapsed: true }
    children:
      - role: LIST_ITEM_AVATAR
        text: "BP Kelapa Gading ◆ 4/4 checkpoint · 06:42"
        attrs: { trailing_icon: circle-check, color: success }
      ...
  ...
state_refs:
  - { label: "kpi_done_count",    sample: "3" }
  - { label: "kpi_active_count",  sample: "1" }
  - { label: "kpi_next_count",    sample: "8" }
  - { label: "cluster_name",      sample: "Cluster Jakarta Selatan" }
  - { label: "cluster_site_count",sample: "3 site" }
  - { label: "cluster_distance",  sample: "12km" }
  - { label: "cluster_drive_eta", sample: "22m" }
  ...
```

## 7. Hand off

Downstream agents read this block. Do NOT call them yourself — `define-page-from-code` orchestrator chains them.

</what-to-do>
