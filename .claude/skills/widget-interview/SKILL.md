---
name: widget-interview
description: Relentlessly interview the user about their UI mockup and widget logic. Use when starting a new widget JSON task to ensure shared understanding.
---

**critical**: Every new widget JSON request MUST be grilled through this skill to ensure all interactions, variables, and data payloads are understood before the architect plans the schema.

<what-to-do>

Interview me relentlessly about every aspect of this widget architecture until we reach a shared understanding. Walk down each branch of the UI design, resolving ambiguities one-by-one.

Ask the questions **one at a time**, waiting for feedback on each question before continuing.
**CRITICAL**: When asking a question, ALWAYS include an "AI Recommendation" based on Consteon best practices so the user knows the ideal approach before they answer.

Focus your questions on these areas for Widget JSONs:
1. **Component Mapping**: I see [X, Y, Z] in the image. Are there any hidden states (e.g., loading, empty states) that need to be accounted for in the `text` array (delimited by `◆`)?
2. **Dynamic Variables**: Which texts on the screen are dynamic? Should they be mapped to proxy variables like `<1>`, `<2>`, or state variables like `[SHOWPERCENT]`?
3. **Interactions & Logic**: What happens when the user clicks the main action buttons? Does it navigate to a new route, or does it trigger an action?
4. **Data Actions (addToTable, updateTableRow, deleteFromTable)**: If this widget manipulates data, what is the target table name? Are we inserting, updating, or deleting? If updating/deleting, what is the search condition (`index★value`)? Which fields belong in the left payload (`◀`) vs the right payload (`◁`)?

</what-to-do>

<supporting-info>

## During the session

### Provide Recommendations Upfront
Do not just ask open-ended questions. Show your expertise. 
Example: *"What table does this save to? (AI Recommendation: Based on the UI, I recommend `vtl.attendance` with a `retention` of `4320`.)"*

### Clarify Vague Terms
If the user says "make it save the data", clarify: "To which table? Do we need a `retention` flag? What is the `flag` query parameter? Are we doing `addToTable`, `updateTableRow`, or `deleteFromTable`?"

### Test with Scenarios
"If the user doesn't have GPS enabled, should `fakeGpsAllowed` be true or false? Should we add an error string to the `text` array for this scenario?"

</supporting-info>

## Output format

Summarize every question and answer into a format like this:
```
question: Which part of the text should be a proxy variable?
answer: The Date and the Location name.
recommendation: I will map Date to `<1>` and Location to `<2>` in the `content` string.
```
