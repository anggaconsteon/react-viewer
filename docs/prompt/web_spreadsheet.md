You are a senior software architect and system analyst specializing in building scalable web applications with unconventional data sources (e.g., spreadsheets as CMS).

🎯 CONTEXT
The application is a Next.js web-based system that DOES NOT use a traditional database.
All data is sourced from Google Spreadsheet, which acts as a lightweight CMS.

One specific sheet is used to define the sidebar menu structure.
The sheet is maintained directly by non-technical users, so the schema must be human-readable and intuitive — no IDs, no relational references.

The menu supports up to 3 levels of nesting:
- Level 1: Top-level menu (e.g., Dashboard, Pegawai)
- Level 2: Sub-menu (e.g., Pendaftaran Pegawai, PHK)
- Level 3: Nested sub-menu (e.g., Riwayat)

Example:
- Dashboard
- Pegawai
  - Pendaftaran Pegawai
  - PHK
    - Riwayat

The system must dynamically read and render menu configuration from the spreadsheet.

🧠 CORE DESIGN PRINCIPLE
- Simplicity over complexity (no database involved)
- Spreadsheet as single source of truth — editable by non-technical users
- Clear separation of concerns:
  - data fetching
  - data transformation
  - UI rendering
- Fail-safe: if fetch fails, display inline error message in sidebar ("Menu tidak dapat dimuat")
- Maintain scalability at logic level even with simple infrastructure

📋 SPREADSHEET SCHEMA
Design a user-friendly schema using column-per-level approach (not parent_id).
Non-technical users fill only the column matching their menu level — other level columns left empty.

Recommended columns:

| Column   | Type    | Description                                      |
|----------|---------|--------------------------------------------------|
| menu_l1  | text    | Level 1 label (top-level menu)                   |
| menu_l2  | text    | Level 2 label (leave empty if not applicable)    |
| menu_l3  | text    | Level 3 label (leave empty if not applicable)    |
| path     | text    | URL path — empty if item is a parent-only folder |
| icon     | text    | Icon name or class                               |
| order    | number  | Display order (integer)                          |
| is_active| boolean | TRUE = visible, FALSE = hidden/disabled          |

Example rows:

| menu_l1   | menu_l2          | menu_l3  | path               | icon       | order | is_active |
|-----------|------------------|----------|--------------------|------------|-------|-----------|
| Dashboard |                  |          | /dashboard         | home       | 1     | TRUE      |
| Pegawai   |                  |          |                    | users      | 2     | TRUE      |
|           | Pendaftaran      |          | /pegawai/daftar    | user-plus  | 1     | TRUE      |
|           | PHK              |          |                    | user-minus | 2     | TRUE      |
|           |                  | Riwayat  | /pegawai/phk/riwayat | clock   | 1     | TRUE      |

🔌 DATA SOURCE APPROACH
Evaluate and recommend between these two options, then implement the recommended one:

Option A — Published CSV URL (no auth required):
- Sheet published as CSV via File → Share → Publish to web
- Fetched via simple HTTP GET, parsed with CSV parser
- Pros: zero credential setup, simplest implementation
- Cons: slight delay in publish propagation, no fine-grained access control

Option B — Google Sheets API v4 (service account):
- Requires service account credentials on server
- Pros: real-time data, access control
- Cons: credential management overhead

Recommend Option A if data is not sensitive and no write operation is needed.

⚙️ INTERACTION MODEL
- Next.js Route Handler (App Router) fetches and transforms sheet data server-side
- Frontend calls internal API endpoint — never exposes sheet URL to browser
- Menu rendering supports recursive 3-level structure
- Supports ISR (Incremental Static Regeneration) or fetch revalidation

⏱️ CACHING STRATEGY
Recommend and implement the most appropriate caching strategy for this use case.
Consider:
- Menu data changes infrequently (not real-time)
- Google Sheets API/CSV has rate limits
- User expects reasonably fresh data without hard refresh

Evaluate between:
- Next.js fetch revalidation (`revalidate: N` seconds)
- In-memory cache with TTL on server
- ISR with on-demand revalidation

Recommend the simplest option that balances freshness and quota efficiency.

🔄 STATES
The system must handle:
- Loading state (fetching spreadsheet data)
- Success state (menu loaded correctly)
- Empty state (sheet exists but no active menu rows)
- Error state → display error message inline in sidebar: "Menu tidak dapat dimuat. Coba refresh halaman."
- Invalid structure state:
  - All level columns empty → skip row
  - Missing path on clickable item → disable interaction
  - Duplicate order values → use stable fallback sort (row index)

🎨 VISUAL BEHAVIOUR
- Level 1 with children: expand/collapse toggle
- Level 1/2/3 with path: clickable navigation link
- Active menu: highlight based on current route (exact or prefix match)
- Disabled menu: is_active = FALSE → hidden from sidebar entirely

🚨 ISSUE HANDLING
- All level columns empty → skip row silently
- Missing path on leaf node → render as disabled (non-clickable)
- Duplicate order → sort by row index as tiebreaker
- Inconsistent level jump (e.g., l3 filled without l2) → normalize: treat as deepest valid level

🧩 EDGE CASES
- Empty spreadsheet or all rows inactive → show empty state
- Google Sheets API limits / CSV publish delay
- Network latency or fetch failure → error message in sidebar
- Large number of menu items (50+ rows) → ensure transformation is performant

📊 DATA TRANSFORMATION LOGIC
Transform flat rows into nested tree:
1. Parse CSV / API response into array of row objects
2. Filter: keep only rows where is_active = TRUE
3. Sort: by order field ascending (row index as tiebreaker)
4. Build tree: group by menu_l1 → menu_l2 → menu_l3
5. Output: nested array ready for recursive rendering

📦 OUTPUT FORMAT
Present the solution in this exact structure. Use tables, pseudocode, and concise explanation per section. Avoid long prose.

1. **Architecture Overview** — diagram or bullet map of components and data flow
2. **Spreadsheet Schema** — table with column definitions + example rows
3. **Data Source Recommendation** — CSV vs API v4 trade-off table + final recommendation
4. **Transformation Logic** — pseudocode for flat-rows → nested tree (3-level)
5. **Next.js API Layer** — Route Handler structure, fetch + transform + cache
6. **Caching Strategy** — recommendation table (options vs trade-offs) + chosen approach
7. **Frontend Rendering** — recursive component structure (pseudocode/outline, not full UI code)
8. **Error & Edge Case Handling** — table: scenario → behavior
9. **Future Scaling Options** — brief list only (e.g., webhook revalidation, role-based visibility)

IMPORTANT:
This is not a simple menu rendering task.
This is a dynamic, configuration-driven navigation system using Google Spreadsheet as a CMS — maintained by non-technical users.

Priority: user-friendly schema → robust transformation → clean API layer → reliable caching.
Focus on maintainability, clarity, and real-world production considerations.
