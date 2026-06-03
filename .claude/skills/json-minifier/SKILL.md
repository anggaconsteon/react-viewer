---
name: json-minifier
description: Compresses and sanitizes generated JSON payloads by removing excess whitespace and formatting artifacts before local sync.
---

**critical**: Invoke this right before writing JSON to the local filesystem to save application bandwidth.

<what-to-do>

1. **Read Payload**:
   - Take the raw JSON string retrieved from the Google Sheets SSOT.

2. **Minify**:
   - Parse the JSON to ensure it is valid.
   - Re-stringify the JSON without any indentation, newlines, or extra spaces (`JSON.stringify(JSON.parse(data))`).
   - Alternatively, if standard formatting is desired by the user, format it with exactly 2 spaces. (Check user preference in memory).

3. **Return**:
   - Return the minified/formatted JSON string to the calling agent (usually `sheet-syncer`) to be written to the local file.

</what-to-do>
