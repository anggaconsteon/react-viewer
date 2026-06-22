# Failed Delivery Sheet — Dev Spec

Bottom sheet for reporting a stop that cannot be executed: pick one reason, add an optional note, see the admin-follow-up notice, submit. Produces a single `failed` event — no movement records.

Source: `src/component/Driverruntimeintegrated.jsx` — `FailedDeliverySheet` (1469-1582); trigger + payload (1102-1119, 928-931).
Parent: `docs/driver-runtime-widgets-MASTER-handoff.md`. Format ref: `docs/stepper-widget-dev-spec.md`.

**Widget tab name:** `failedDeliverySheet`
**Type code:** `FAILED_DELIVERY_SHEET`
**Base template row:** `Widget!J203`
**Master index entry:** `◆failedDeliverySheet▶Widget!J203`

> Presented via a `DO_DIALOG` chain from the workspace "Lapor sebagai gagal" link. The reason picker is a single-select list (same behavior as `selectableVertical`); this widget wraps it with a note field + info banner + submit.

---

## 1. Konsep

1. **Header** — title + `{customer} · Stop {stopNumber}` from data.
2. **Reason picker** — 4 single-select cards (label + desc); selected card = amber + `✓`.
3. **Note** — appears only after a reason is picked; optional textarea.
4. **Info banner** — admin-reschedule notice.
5. **Footer** — cancel + submit (disabled until a reason is selected).

Submit → outcome `failed`, single keyed event (reason + optional note). Nothing was delivered, so NO DROP/PICKUP movements.

---

## 2. Base JSON Template

`Widget!J203`:

```json
{"type":"FAILED_DELIVERY_SHEET","failEvent":"[FAILEVENT]","reasons":"[REASONS]","notePosition":[NOTEPOS],"text":"[TITLE]◆[PICK_LABEL]◆[NOTE_LABEL]◆[NOTE_PLACEHOLDER]◆[INFO_BANNER]◆[CANCEL_LABEL]◆[SUBMIT_LABEL]"}
```

**Demo resolved, `Widget!G203`:**

```json
{"type":"FAILED_DELIVERY_SHEET","failEvent":"[EVENT:deliveryFailed]","reasons":"customer_closed^Customer Tutup^Lokasi tutup / tidak ada orang~access_denied^Akses Ditolak^Tidak diizinkan masuk lokasi~customer_refused^Customer Tolak^Customer menolak menerima~capacity_full^Kapasitas Penuh^Customer tidak punya tempat","notePosition":9,"text":"Lapor Delivery Gagal◆Pilih Alasan◆Catatan Tambahan◆Detail tambahan untuk admin...◆Setelah submit, admin akan dapat signal untuk reschedule atau create task lanjutan.◆Batal◆Lapor Gagal"}
```

---

## 3. Placeholder Catalog

| Placeholder | Type | Required | Default | Notes |
|-------------|------|----------|---------|-------|
| `[FAILEVENT]` | event token | YES | — | `addToEvent` reference for the failed report |
| `[REASONS]` | encoded list | YES | — | Reason options; see §4 |
| `[NOTEPOS]` | int | YES | — | Form position the note textarea writes to (`◁N▷`) |
| `[TITLE]` | string | NO | `Lapor Delivery Gagal` | ◆0 |
| `[PICK_LABEL]` | string | NO | `Pilih Alasan` | ◆1 |
| `[NOTE_LABEL]` | string | NO | `Catatan Tambahan` | ◆2 (rendered with "(opsional)") |
| `[NOTE_PLACEHOLDER]` | string | NO | `Detail tambahan untuk admin...` | ◆3 |
| `[INFO_BANNER]` | string | NO | (admin notice) | ◆4 |
| `[CANCEL_LABEL]` | string | NO | `Batal` | ◆5 |
| `[SUBMIT_LABEL]` | string | NO | `Lapor Gagal` | ◆6 |

---

## 4. `[REASONS]` encoding

Flat string (no arrays — memory: no illegal arrays in DSL). Entries separated by `~`; fields within an entry separated by `^`:

```
<code>^<label>^<desc>~<code>^<label>^<desc>~...
```

| Field | Use |
|-------|-----|
| `code` | machine value written to the event (e.g. `customer_closed`) |
| `label` | card title (e.g. `Customer Tutup`) |
| `desc` | card subtitle (e.g. `Lokasi tutup / tidak ada orang`) |

The 4 stock reasons: `customer_closed`, `access_denied`, `customer_refused`, `capacity_full`. Add/remove entries to change options without code changes.

---

## 5. Text Mapping (`◆`-delimited)

7 segments:
```
"[TITLE]◆[PICK_LABEL]◆[NOTE_LABEL]◆[NOTE_PLACEHOLDER]◆[INFO_BANNER]◆[CANCEL_LABEL]◆[SUBMIT_LABEL]"
```

---

## 6. Runtime Tokens

| Token | Resolution | Scope |
|-------|------------|-------|
| `◁[NOTEPOS]▷` | note textarea content | sibling/`failEvent` `addToEvent` |
| selected `code` | chosen reason's `code` field | `addToEvent` reason field |

---

## 7. Renderer Contract

1. Mount as bottom sheet (slide-up) over a tap-to-dismiss scrim; drag handle; `maxHeight 85%`.
2. Header: `[TITLE]` + `{customer} · Stop {stopNumber}` (from data).
3. `[PICK_LABEL]` caps label, then parse `[REASONS]` → one selectable card per entry (label bold + desc muted). Selected: amber50 bg, amber border, trailing `✓`. Single-select.
4. After a selection: reveal note block (`[NOTE_LABEL]` + "(opsional)") with textarea (`[NOTE_PLACEHOLDER]`, bound to `[NOTEPOS]`) + info banner (`[INFO_BANNER]`, blue).
5. Footer: `[CANCEL_LABEL]` (dismiss) + `[SUBMIT_LABEL]` (amber; disabled/grey until a reason is selected).
6. Submit → fire `[FAILEVENT]` with selected `code` + `◁[NOTEPOS]▷`, outcome `failed`; dismiss + return to feed; host marks task `failed`.

---

## 8. Integration with `addToEvent`

Single keyed write (no movements). Payload carries: task id, reason `code`, note `◁[NOTEPOS]▷`, outcome `failed`, GPS + driver + ts via `◀N▶`. Admin consumes this as a reschedule/follow-up signal (MASTER §4.2).

---

## 9. Op1Screen Integration

### 9.1 Widget row
col B = `failedDeliverySheet`, col D = resolved JSON, col E = `,`+JSON, col F = `TRUE`. Instantiated by the workspace "Lapor sebagai gagal" link via `DO_DIALOG`.

### 9.2 Param columns (sibling convention)

| Col | Param | | Col | Param |
|-----|-------|-|-----|-------|
| G | FAILEVENT | | L | NOTE_LABEL |
| H | REASONS | | M | NOTE_PLACEHOLDER |
| I | NOTEPOS | | N | INFO_BANNER |
| J | TITLE | | O | CANCEL_LABEL |
| K | PICK_LABEL | | P | SUBMIT_LABEL |

---

## 10. Validation Rules

1. `[FAILEVENT]` must reference a valid `addToEvent` payload (failed report, no movements).
2. `[REASONS]` ≥ 1 entry; each entry has exactly 3 `^`-fields; entries `~`-separated.
3. `code` values unique within `[REASONS]`.
4. `text` = 7 segments (6× `◆`).
5. Submit disabled until a reason `code` is selected; note is optional.
6. `[NOTEPOS]` unique on the page.

---

## 11. Edge Cases

| Case | Behavior |
|------|----------|
| no reason selected | submit disabled (grey) |
| reason selected, empty note | submit allowed (note optional) |
| tap scrim / cancel | dismiss, no event, stay in workspace |
| `[REASONS]` entry malformed (≠3 fields) | skip entry, log warning |
| reason changed after note typed | note retained; only `code` updates |

---

## 12. Add Widget to Spreadsheet (1-time)

`A203=failedDeliverySheet`, `I203=failedDeliverySheet`, `J203=`base template (§2), `G203=`demo resolved. Append `◆failedDeliverySheet▶Widget!J203` to `Widget!G1`. Verify `G203` renders with no `[X]` leftover.

---

## 13. Reference Checklist

- [ ] `Widget!J203` base template written
- [ ] `Widget!G1` master index updated
- [ ] `G203` demo renders OK
- [ ] `[REASONS]` parsed into selectable single-select cards
- [ ] note block revealed only after selection
- [ ] submit gated by selection; note optional
- [ ] submit fires `failEvent` (failed, no movements) then returns to feed
- [ ] `widget-qa` sign-off

---

## 14. Test Cases

| # | Scenario | Expected |
|---|----------|----------|
| 1 | open sheet | 4 reason cards, submit disabled |
| 2 | select "Customer Tutup" | card amber + ✓, note block appears, submit enabled |
| 3 | submit with empty note | event written, `code=customer_closed`, outcome failed |
| 4 | type note then submit | note included via `◁NOTEPOS▷` |
| 5 | cancel | dismiss, no event |
| 6 | task state after submit | `failed`, card moves to "Dilaporkan Gagal" section |

---

## 15. Versi & History

- v1.0 (2026-06-10) — Initial spec. Row 203. Single-select reason picker (`^`/`~` encoded), optional note, single failed event (no movements).
