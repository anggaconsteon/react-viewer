---
name: vision-analyzer
description: Analyze UI mockups/images and map visual elements into valid JSON widget components.
---

**critical**: Use this whenever the user provides an image or UI mockup to translate into a spreadsheet JSON config.

<what-to-do>

1. **Scan for Layout Patterns**:
   - Navigation bars at the top = `TOPBAR`.
   - Grid/Table layouts with rows and columns = `SPREADSHEET` or `DATATABLE`.
   - Action areas at the bottom = `BOTTOMBAR`.
   
2. **Scan for Interactive Elements**:
   - Rectangular clickable areas with text/icons = `BUTTON`.
   - Selection inputs with arrows = `DROPDOWN`.
   - Empty spaces separating elements = `SPACER`.

3. **Map to Schema**:
   After identifying the elements visually, map them exactly to the component types defined in `schema-onboard`. Never invent new component names (e.g., do not use `FILTER_MENU` if the schema requires `DROPDOWN`).

</what-to-do>
