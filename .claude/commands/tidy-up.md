---
description: Clean up the workspace before finishing — remove clutter, dead code, and stray files
---

Before wrapping up this task:

1. Delete any temporary/debug files, `console.log`/print-debugging statements, and commented-out code introduced while working.
2. Remove unused variables, functions, imports, and dependencies that are no longer needed.
3. Make sure naming and code style match the rest of the project.
4. Confirm nothing sensitive (API keys, passwords, `.env` contents) is about to be committed.
5. Then follow CLAUDE.md's standard process: commit, push, open a PR, merge it to `main`, and delete the branch — don't leave this dangling.
