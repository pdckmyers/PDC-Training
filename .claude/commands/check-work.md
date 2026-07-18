---
description: Verify the current changes actually work before calling anything done
---

Review the changes made so far on this branch (compared to `main`) and verify they actually work:

1. Run this project's real checks — build, lint, typecheck, test — based on what's actually configured (check `package.json` scripts or equivalent). Fix any failures yourself; don't just report them.
2. Re-read every changed file for logic errors, edge cases, and typos a careful human reviewer would catch.
3. If this touches the UI or a user-facing flow, actually run the app and click through the affected flow (and at least one edge case) in a browser rather than assuming it works from the code alone.
4. Report back in plain, non-technical language: what you checked, what you fixed, and anything you're still unsure about.
