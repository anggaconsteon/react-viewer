---
name: rbac-auditor
description: Security and authorization testing tool. Simulates JSON generation from the perspective of different user roles to verify access control logic.
---

**critical**: MUST be called by `sheet-qa` during the validation phase for applications that use RBAC (Role-Based Access Control).

<what-to-do>

1. **Identify Roles**:
   - Read the `.claude/plans/[TASK_ID].md` or memory to understand the access levels (e.g., Cost Centers: `Induk`, `Kantor Pusat`; Divisions: `Operasional`, `Keamanan`).

2. **Simulate Role A (Low Privilege)**:
   - Formulate a test case simulating a low-privilege user (e.g., A security guard at a specific site).
   - Evaluate the JSON output that would be generated for this user.
   - **Audit**: Are restricted menus (like "PHK" or "Approval Cuti") visible in the JSON payload? If yes, FAIL the test.

3. **Simulate Role B (High Privilege)**:
   - Formulate a test case for a high-privilege user (e.g., Regional Manager).
   - Evaluate the JSON output.
   - **Audit**: Are all expected menus visible?

4. **Action**:
   - If any audit fails, block the workflow and send specific correction instructions back to the `sheet-engineer`.

</what-to-do>
