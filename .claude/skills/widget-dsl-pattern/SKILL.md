---
name: widget-dsl-pattern
description: Defines the exact flat DSL format, symbols, and array syntax required for Consteon widget JSON files.
---

**critical**: Every new widget JSON MUST strictly adhere to this specific flat structure and symbol pattern. Never invent nested hierarchies unless specifically supported.

<what-to-do>

Read these rules and remember them for writing widget JSONs:

### 1. The Spreadsheet SSOT Wrapper Philosophy
A generated `.json` file is NOT just a single widget—it usually represents an entire Page or Section.
All designs and settings live in the Spreadsheet SSOT. The frontend is completely "dumb" and just consumes the merged JSON.
If a UI shows multiple interactive items (e.g., 3 attendance buttons), they must be created as individual modular widget objects inside a wrapper's `children` array.
Example: 3 `type: "location"` widgets (one for QR, one for Selfie, one for GPS) wrapped inside a single `HORIZONTAL_ICON` parent.

### 2. Flat Structure for Individual Widgets
While the parent wrapper uses a `children` array, the individual widgets themselves rarely use deeply nested objects. Properties control the UI layout directly on the widget root.

### 3. The Diamond Delimiter (`◆`)
Do not create multiple keys for texts (e.g., `title`, `subtitle`, `buttonText`). Instead, combine them into a single `text` property separated by `◆`.
Example:
```json
"text": "Laporan pekerjaan◆Cari di laporan◆Tulis yang anda ingin lihat"
```

### 4. Proxy Variables (`<N>`)
Data injected from the mobile device/proxy uses angle brackets with numbers.
Example:
```json
"content": "Tanggal: <2>\nNama: <4>\nLokasi: <6>"
```

### 5. Data Action Syntax (addToTable, updateTableRow, deleteFromTable)
When a widget saves, updates, or deletes data, it uses a highly compressed custom syntax instead of a JSON object.

**The Notation Language:**
- `⭘` (U+2B58) Separates main key-value pairs (properties).
- `◼` (U+25FC) Acts as the equals sign (`=`) mapping a key to a value.
- `<N>` (e.g., `<10>`) Represents the FIELD TARGET in the database record.
- `⬤` The physical separator between the Left Payload and Right Payload.
- `◀` and `▶` Extracts data from the **LEFT** payload.
- `◁` and `▷` Extracts data from the **RIGHT** payload.
- `◆` (Diamond) serves TWO purposes: 
  1. Splits data inside the Left Payload.
  2. **Splits MULTIPLE table operations!** (e.g., `addToTable_String1◆addToTable_String2`).
- `★` (Star) serves TWO purposes: 
  1. Splits data inside the Right Payload.
  2. Separates conditions in search or index definitions (e.g., `search◼3★[Value]`).
- `◇` (Open Diamond) Separates array items (like multiple image URLs) *inside* a single payload field.

**Real-World Payload Example:**
If the device sends this payload string:
`0report-patrol◆1744350386030◆◆◆-6.3163542◆106.6448252⬤★★https://image1.jpg◇https://image2.jpg★★0l1148...★★★★★aman`

- **Left Payload (`◀`)** is everything before `⬤`. Split by `◆`.
  - `◀1▶` = `0report-patrol`
  - `◀2▶` = `1744350386030` (Timestamp)
  - `◀5▶` = `-6.3163542` (Latitude)
- **Right Payload (`◁`)** is everything after `⬤`. Split by `★`.
  - `◁1▷` = (empty)
  - `◁2▷` = (empty)
  - `◁3▷` = `https://image1.jpg◇https://image2.jpg` (Multiple images split by `◇`)
  - `◁5▷` = `0l1148...`
  - `◁10▷` = `aman`

**Format Modifiers:**
You can append format modifiers inside payload brackets, such as `◀2|T7|Ddd MMM yyyy HH:mm▶`. `T7` sets the timezone to +7, and the rest is the date format.

**Table Foldering:**
When defining a table path, using `//` (e.g., `$test/agenia-demo-7//vtl.attendance`) creates a proper folder/collection. If you omit it, it saves incorrectly with `%` signs.

**addToTable Example**:
```json
"addToTable": "$test/agenia//vtl.report⭘retention◼4320⭘<1>◼report⭘<10>◼◁3▷⭘<2>◼◀2|T7|Ddd MMM yyyy HH:mm▶"
```
*(Meaning: Target field 10 gets data position 3 from the Right payload. Target field 2 gets data position 2 from the Left payload formatted as a date).*

**updateTableRow Example**:
```json
"updateTableRow": "$test/agenia//vtl.attendance⭘tablevid◼20342033315492⭘search◼3★87544551624342⭘<5>◼updated_value"
```
Requires the table path, `tablevid`, and `search` (e.g., `search◼index★value`), followed by fields to update (`<N>◼new_value`).

**deleteFromTable Example**:
```json
"deleteFromTable": "$test/agenia//vtl.attendance⭘tablevid◼20342033315492⭘search◼3★87544551624342"
```
Stops immediately after the `search` condition.

### 6. Common Properties
- `type`: The component type (e.g., `displayList`, `txf`, `RBT`, `LOCATION_DETECTOR`)
- `variant`: The style variant (e.g., `tableCardInteractive`, `qrScan`)
- `margin`, `alignment`, `size`, `icon`, `image`, `bgColor`
- Boolean/State tokens often use bracket syntax: `[SHOWPERCENT]`, `[SHOWCOUNT]`

</what-to-do>
