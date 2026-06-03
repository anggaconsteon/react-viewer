---
name: recall-memory
description: Load all past lessons, bug fixes, and user preferences from the long-term memory file into the current context.
---

**critical**: This skill MUST be invoked at the very beginning of every new task or session by the project manager.

<what-to-do>

1. **Read Memory File**:
   - Open and read the contents of `.claude/memory/SSOT_MEMORY.md`.
   - If the file does not exist, return a message saying "No long-term memory established yet."

2. **Inject into Context**:
   - Parse the `### Lesson` blocks.
   - Summarize the key "Good" rules and architectural preferences learned from past sessions.
   - Save this summary into `.claude/tasks/[TASK_ID].md` under a `## Past Lessons` section so that the `sheet-architect` and `sheet-engineer` are aware of them and do not repeat past mistakes.

</what-to-do>
