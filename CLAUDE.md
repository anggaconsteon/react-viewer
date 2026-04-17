# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test framework is configured.

## Architecture

This is a React 19 + Vite project serving as a UI widget showcase for the **Consteon / Autsorz / Adrifa E-Patrol** field operations platform.

### Key files

- `src/main.jsx` — entry point, mounts `src/App.jsx`
- `src/App.jsx` — active app: the WorkerLiveCard showcase (4 states, filter tabs, dark/light toggle)
- `src/component/WorkerLiveCard.jsx` — standalone copy of the same worker card component (contains its own demo `App` default export)
- `src/component/ChecklistItem.jsx` — checklist item widget; exports both `ChecklistItem` (named) and a demo `App` (default)

### Patterns

**Inline styles only** — there is no CSS framework, no CSS modules, no Tailwind. All component styling is done via the `style` prop with plain JS objects.

**State-driven theming** — each component uses a `stateConfig` / `STATUS_CONFIG` object that maps status keys to a full set of colors (`color`, `colorBorder`, `bg`, `headerBg`, etc.). When adding a new state, add an entry to that object and the rest of the component picks it up automatically.

**Self-contained components** — each widget in `src/component/` manages its own local state (e.g., `WorkerCard` runs its own live clock; `ChecklistItem` owns its status state). Callbacks (`onStatusChange`, `onPhotoAdd`, `onNoteChange`) are optional and used only to notify the parent.

**Dual-export pattern** — each component file exports the reusable widget (`ChecklistItem` named export) plus a default `App` that demonstrates it. This lets a file be dropped directly into the entry point for isolated development.

**WorkerLiveCard states:** `not-checked-in` | `active` | `idle` | `issue`

**ChecklistItem statuses:** `pending` | `done` | `not_available` | `skipped` | `issue`
