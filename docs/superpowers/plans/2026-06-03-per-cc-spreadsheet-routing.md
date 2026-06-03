# Per-Cost-Center Spreadsheet Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Satu menu web bisa menampilkan file spreadsheet berbeda per cost center (ROUTED), mengikuti RBAC per-user, di-batch dengan filter lain lewat satu button.

**Architecture:** Spreadsheet-side mendeklarasikan ROUTED lewat widget `dropdownSrc` (punya `target`, tanpa `cell`); `_Helper Web JSON` me-resolve token `[CC_OPTIONS:<page>]`/`[SRC:<page>]` per-user di chokepoint C2:C6. Frontend memperlakukan dropdown ber-`target` sebagai pemicu **client-side src swap** (bukan call backend), di-apply saat button submit, sehingga bisa di-batch dengan dropdown date/filter. Backend `/api/spreadsheet` tidak berubah.

**Tech Stack:** Google Sheets (locale `in_ID`, idiom op1Screen: VLOOKUP + chained SUBSTITUTE), Next.js + React + Zustand (repo `web-dev`, branch `CON-10-google-sheets`).

**Referensi:**
- Design spec: `docs/superpowers/specs/2026-06-03-per-cc-spreadsheet-routing-design.md`
- FE/BE contract: `docs/2026-06-03-per-cc-spreadsheet-routing-contract.md`

**Status awal (sudah live saat brainstorming — JANGAN ulang):**
- Web URL tab (long-form page×CC→URL) + rumus A/D — live.
- Web Widget `dropdownSrc` (J3) — `{"type":"DROPDOWN","key":"[KEY]","target":"[TARGET]",...}`.
- Web Screen salesPerformance rows 42-45 (`dropdownSrc`/`spacer`/`buttonSubmit`/`contentSpreadsheet`), col D = VLOOKUP+SUBSTITUTE.
- _Helper C2:C6 resolve `[CC_OPTIONS:salesPerformance]`/`[SRC:salesPerformance]` — verified suryawdj/Induk.
- 3 file FE sudah diedit di working copy `web-dev` (Task 3-5 mendokumentasikan isi finalnya untuk di-review/merge dev).

---

## File Structure

**Spreadsheet `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`:**
- `Web URL` — registry (page key × cost center) → spreadsheet URL. Setup data-validation + conditional-formatting (Task 1-2).
- `Web Widget` — `dropdownSrc` template (sudah ada).
- `Web Screen` — baris widget per page ROUTED (salesPerformance sudah; page lain di Task 7).
- `_Helper Web JSON` — chokepoint C2:C6 (SUBSTITUTE pair per routed page; salesPerformance sudah, page lain di Task 7).

**Repo `web-dev` (branch `CON-10-google-sheets`):**
- `lib/stores/bar/bar-values.store.ts` — store; tambah `routes` map (Task 3).
- `components/bar/bar-dropdown.tsx` — rekam route on-select (Task 4).
- `components/bar/bar-button.tsx` — apply route + POST cell-only on-submit (Task 5).
- TIDAK disentuh: `app/api/spreadsheet/route.ts`, `actions/spreadsheet.action.ts`, `dto/spreadsheet.dto.ts`.

---

### Task 1: Web URL — data-validation dropdown (manual UI, operator)

**Files:**
- Spreadsheet `Web URL` tab, kolom B & C.

MCP gsheets tidak bisa set data-validation; harus via UI sekali (persist permanen).

- [ ] **Step 1: Set dropdown kolom Page Key**

UI: pilih range `B2:B500` → Data → Data validation → Add rule → Criteria "Dropdown (from a range)" → range `='Web Menu'!$J$2:$J$500` → "Show warning" (jangan reject, biar fleksibel) → Done.

- [ ] **Step 2: Set dropdown kolom Cost Center**

UI: pilih range `C2:C500` → Data → Data validation → Add rule → Criteria "Dropdown (from a range)" → range `='Cost Center'!$D$3:$D$20` → "Show warning" → Done.

- [ ] **Step 3: Verifikasi**

Klik sel kosong di B → muncul daftar page key. Klik sel kosong di C → muncul daftar cost center. Isi 1 baris (page key + CC) → kolom D (Menu auto) terisi label, bukan `❓ key tdk dikenal`.

---

### Task 2: Web URL — conditional formatting anti-duplikat (manual UI, operator)

**Files:**
- Spreadsheet `Web URL` tab, range `A2:E500`.

Mencegah dua baris dengan kombinasi (Page Key × Cost Center) kembar — itu bikin routing ambigu (dua URL untuk satu (page,CC)).

- [ ] **Step 1: Tambah rule conditional formatting**

UI: pilih range `A2:E500` → Format → Conditional formatting → "Custom formula is" → isi:

```
=AND($B2<>"";$C2<>"";COUNTIFS($B$2:$B$500;$B2;$C$2:$C$500;$C2)>1)
```

Set fill merah → Done. (Locale `in_ID`: separator argumen `;`. `$B2`/`$C2` baris-relatif, range `$B$2:$B$500` absolut.)

- [ ] **Step 2: Verifikasi**

Isi dua baris dengan (Page Key, Cost Center) yang sama → kedua baris jadi merah. Ubah salah satu CC → merah hilang. Baris dengan B atau C kosong → tidak merah (di-guard `<>""`).

---

### Task 3: FE — `bar-values.store.ts` tambah `routes` map

**Files:**
- Modify: `web-dev/lib/stores/bar/bar-values.store.ts` (replace seluruh file)

Store menyimpan pending src-swap per dropdown key, dipisah dari `values`/`cells`. Dipakai biar swap bisa ditunda sampai button (bukan saat select).

- [ ] **Step 1: Replace isi file dengan ini**

```ts
// stores/bar-values.store.ts
import { create } from "zustand"

interface BarRoute {
  target: string
  src: string
}

interface BarValuesStore {
  values: Record<string, string>
  cells: Record<string, string>
  /** Pending src swaps keyed by dropdown key. Applied on button submit, not on select. */
  routes: Record<string, BarRoute>
  setValue: (key: string, value: string, cell?: string) => void
  setRoute: (key: string, target: string, src: string) => void
  resetValues: () => void
}

export const useBarValuesStore = create<BarValuesStore>()((set) => ({
  values: {},
  cells: {},
  routes: {},
  setValue: (key, value, cell) =>
    set((state) => ({
      values: { ...state.values, [key]: value },
      cells: cell ? { ...state.cells, [key]: cell } : state.cells,
    })),
  setRoute: (key, target, src) =>
    set((state) => ({
      routes: { ...state.routes, [key]: { target, src } },
    })),
  resetValues: () => set({ values: {}, cells: {}, routes: {} }),
}))
```

- [ ] **Step 2: Verifikasi typecheck/lint**

Run (di `web-dev`): `pnpm lint`
Expected: tidak ada error di `bar-values.store.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/stores/bar/bar-values.store.ts
git commit -m "feat(bar): add pending route map to bar-values store"
```

---

### Task 4: FE — `bar-dropdown.tsx` rekam route on-select

**Files:**
- Modify: `web-dev/components/bar/bar-dropdown.tsx`

Dropdown ROUTED (punya `target`, opsi `label▶url`) saat dipilih **hanya merekam** pending swap. Tidak lagi memanggil `setSrcOverride` langsung (itu yang bikin swap kepicu sebelum date dipilih).

- [ ] **Step 1: Ganti import store**

Hapus `import { usePageStore } from "@/lib/stores/page-data.store"` (tidak dipakai lagi di file ini). Pastikan import store bar:

```ts
import { useBarValuesStore } from "@/lib/stores/bar/bar-values.store"
```

- [ ] **Step 2: Ganti destructure hook**

```ts
const { values, setValue, setRoute } = useBarValuesStore()
```

(sebelumnya mengambil `setSrcOverride` dari `usePageStore` — buang.)

- [ ] **Step 3: Ganti `handleSelect`**

```ts
function handleSelect(label: string) {
  const option = options.find((o) => o.label === label)
  setValue(item.key, label, item.cell)
  // ROUTED dropdown: record the pending src swap. Applied on button submit
  // (not on select) so it can be batched with other filters like date.
  if (option?.srcUrl && item.target) {
    setRoute(item.key, item.target, option.srcUrl)
  }
}
```

- [ ] **Step 4: Verifikasi**

Run (di `web-dev`): `pnpm lint`
Expected: tidak ada error/unused-import di `bar-dropdown.tsx`.

- [ ] **Step 5: Commit**

```bash
git add components/bar/bar-dropdown.tsx
git commit -m "feat(bar): record routed src swap on select instead of applying it"
```

---

### Task 5: FE — `bar-button.tsx` apply route + POST cell-only on-submit

**Files:**
- Modify: `web-dev/components/bar/bar-button.tsx`

Button: (a) apply semua pending route dulu (swap src) → content refetch; (b) kalau ada key ber-`cell`, recompute spreadsheetId dari src baru lalu POST cell-write saja; (c) pure ROUTED (tanpa cell) → selesai tanpa POST. Payload POST di-filter ke key ber-`cell` (key ROUTED dibuang biar regex DTO `Sheet!A1` tidak kena URL).

- [ ] **Step 1: Filter payload `executeAction` ke key ber-`cell`**

Di dalam `executeAction`, blok `payload`:

```ts
const payload = {
  spreadsheetId,
  // Only keys that carry a cell are FILTER writes. Routed-only keys (no cell)
  // are handled via src override in handleAction and excluded here.
  data: Object.entries(values)
    .filter(([key]) => cells[key])
    .map(([key, value]) => ({ cell: cells[key], value })),
}
```

- [ ] **Step 2: Ambil `routes` dari store + `setSrcOverride` dari page store**

Di komponen `BarButton`:

```ts
const { values, cells, routes } = useBarValuesStore()
const { setSrcOverride } = usePageStore()
```

- [ ] **Step 3: Ganti badan `handleAction` (setelah short-circuit RESET)**

```ts
// Keys this button is responsible for (◆-delimited). Absent → all keys.
const keys = item.data ? splitByDiamond(item.data) : Object.keys(values)

// ROUTED: apply pending src swaps FIRST so any subsequent cell writes target
// the newly-loaded file. setSrcOverride re-fetches the content via the store.
const routeKeys = keys.filter((k) => routes[k])
routeKeys.forEach((k) => setSrcOverride(routes[k].target, routes[k].src))

// FILTER: keys carrying a cell. Routed-only keys (no cell) are skipped from POST.
const hasCellWrites = keys.some((k) => filtered.cells[k])

// Pure ROUTED (no cell writes): the src swap already triggered a refresh — done.
// NOTE: RESET already returned at the top of handleAction, so onClick.type is
// narrowed to "FETCH_CONTENT" | "SUBMIT" here — do NOT re-check !== "RESET"
// (TS2367: no overlap).
if (!hasCellWrites) {
  if (routeKeys.length > 0 && item.onClick.onSuccess?.toast) {
    toast.success("Success!", { description: item.onClick.onSuccess.toast })
  }
  return
}

// Recompute the active link AFTER overrides so cell writes hit the routed file.
const spreadsheetContent = pageData?.content.find((c) => c.type === "SPREADSHEET")
const freshOverrides = usePageStore.getState().srcOverrides
const spreadsheetLink = spreadsheetContent
  ? (freshOverrides[spreadsheetContent.id] ?? spreadsheetContent.src)
  : null

if (!spreadsheetLink) {
  toast.error("Error!", {
    description: "Spreadsheet link not valid. Try re-sync data please.",
  })
  return
}

setIsLoading(true)
await executeAction(
  item.onClick,
  filtered.values,
  filtered.cells,
  extractSpreadsheetId(spreadsheetLink),
  bumpSpreadsheetSyncKey,
)
setIsLoading(false)
```

- [ ] **Step 4: Verifikasi**

Run (di `web-dev`): `pnpm lint`
Expected: tidak ada error di `bar-button.tsx`.

- [ ] **Step 5: Commit**

```bash
git add components/bar/bar-button.tsx
git commit -m "feat(bar): apply routed swap before cell writes; POST cell-only"
```

---

### Task 6: Verifikasi end-to-end di dev server (salesPerformance)

**Files:**
- Repo `web-dev` (dev server).

Tidak ada unit test harness; verifikasi manual lewat browser dengan user yang punya akses CC.

- [ ] **Step 1: Sync JSON terbaru ke FE**

Pastikan FE menarik Web JSON terbaru untuk user uji (suryawdj — CC Induk, punya salesPerformance). Re-sync data sesuai mekanisme app (mis. tombol re-sync / refetch nav).

- [ ] **Step 2: Jalankan dev server**

Run (di `web-dev`): `pnpm dev`
Buka app, login sebagai suryawdj.

- [ ] **Step 3: Buka page salesPerformance**

Expected: dropdown "Pilih cost center" muncul di topbar dengan opsi `Induk`; content `mainContent` ter-load dari URL Induk (`[SRC:salesPerformance]` ter-resolve). Tidak ada error console.

- [ ] **Step 4: Uji ROUTED + (jika ada) date dalam satu submit**

Pilih cost center di dropdown → konten **belum** berubah (cuma terekam). Jika ada dropdown date, pilih tanggal. Klik **Tampilkan**.
Expected: src swap dulu (konten ganti ke file CC terpilih), lalu jika ada cell-write date → POST ke `/api/spreadsheet` dengan `spreadsheetId` = file CC baru; toast sukses; konten ter-refresh.

- [ ] **Step 5: Uji pure ROUTED (tanpa date)**

Pilih cost center → klik Tampilkan.
Expected: konten swap & refetch; TIDAK ada request ke `/api/spreadsheet` (cek Network tab — pure client).

- [ ] **Step 6: Uji user lain (regresi)**

Login user FILTER (mis. page patrolReport yang pakai `[CC_LIST]`/cell). Pilih CC + submit.
Expected: perilaku FILTER lama tetap jalan (POST cell-write, file tetap). Tidak ada regresi.

---

### Task 7: Generalisasi ke page ROUTED lain (per page)

**Files:**
- `Web URL` tab (baris baru per page×CC).
- `Web Screen` tab (baris widget baru per page).
- `_Helper Web JSON` C2:C6 (SUBSTITUTE pair baru).

Ulang untuk tiap page yang butuh routing (mis. dashboard). Pakai salesPerformance (rows 42-45) sebagai contoh acuan.

- [ ] **Step 1: Daftarkan URL per CC di Web URL**

Untuk page `<pageKey>`, tambah 1 baris per cost center: isi B=`<pageKey>`, C=`<costCenter>`, E=URL spreadsheet penuh (file+gid). A & D auto (ARRAYFORMULA). Pastikan tidak kena merah (Task 2).

- [ ] **Step 2: Susun baris widget di Web Screen**

Untuk page `<pageKey>`, tambahkan baris widget berurutan (kolom B = widget type), col D tetap pakai pattern VLOOKUP+SUBSTITUTE (jangan tulis JSON manual ke D):
- `dropdownSrc` — side col: KEY=`<keyUnik>`, TARGET=`mainContent`, PLACEHOLDER=`Pilih cost center`, OPTIONS=`[CC_OPTIONS:<pageKey>]`, EMPTY_TEXT, VARIANT=`outline`.
- `spacer`.
- `buttonSubmit` — side col: TEXT=`Tampilkan`, DATA=`<keyUnik>`, ICON=`FilterIcon`, API_URL=`https://autsorz.consteon.ai/api/spreadsheet`, THEN=`REFRESH_CONTENT`, ERROR=`Gagal memuat data.`
- `contentSpreadsheet` — side col: SRC=`[SRC:<pageKey>]`, PERM=`C◆U◆D`, dst.

- [ ] **Step 3: Tambah SUBSTITUTE pair di _Helper C2:C6**

Di formula chokepoint per-user, tambahkan satu pasang:
```
...; "[CC_OPTIONS:<pageKey>]"; opt<PageKey>); "[SRC:<pageKey>]"; src<PageKey>)
```
di mana `opt<PageKey>`/`src<PageKey>` = formula Options/SRC (design spec §6) untuk `<pageKey>`.

- [ ] **Step 4: Verifikasi resolusi**

Baca `_Helper Web JSON!C2` (atau baris user uji): token `[CC_OPTIONS:<pageKey>]` & `[SRC:<pageKey>]` ter-resolve jadi `label▶url◆...` dan URL pertama. Token lain tidak rusak.

- [ ] **Step 5: Verifikasi di dev server**

Ulang Task 6 step 3-5 untuk `<pageKey>`.

---

## Self-Review

**Spec coverage:**
- Diskriminator cell/target → didokumentasikan & dipakai di Task 4-5 (dropdown `target`, payload filter `cells[key]`). ✓
- Web URL registry + anti-dup → Task 1-2. ✓
- `dropdownSrc` widget + Web Screen pattern → Task 7 step 2 (salesPerformance sudah live). ✓
- _Helper resolusi token → Task 7 step 3 (salesPerformance sudah live, verified). ✓
- Routing pure-client + button-triggered → Task 3-5. ✓
- Backend tidak berubah → dinyatakan eksplisit (file structure: TIDAK disentuh). ✓
- E2E per-user + regresi FILTER → Task 6. ✓

**Placeholder scan:** Tidak ada TBD/TODO; semua step punya formula/kode/command konkret. `<pageKey>`/`<keyUnik>` di Task 7 adalah parameter per-iterasi (by design, bukan placeholder kosong).

**Type consistency:** `setRoute(key, target, src)` & `routes: Record<string, {target, src}>` (Task 3) dipakai konsisten di Task 4 (`setRoute(item.key, item.target, option.srcUrl)`) & Task 5 (`routes[k].target`, `routes[k].src`). `setSrcOverride(id, src)` dari page store dipakai konsisten. ✓

---

## Catatan adaptasi TDD

Skill writing-plans default TDD. Domain ini tidak punya test harness (Google Sheets formula + Next.js app tanpa unit test setup), jadi setiap task pakai **langkah verifikasi konkret** (baca cell hasil, jalankan `pnpm lint`, uji manual di dev server + Network tab) sebagai ganti unit test. Ini sesuai prinsip "follow existing patterns" — repo tidak punya test, jangan paksa scaffolding test baru di luar scope.
