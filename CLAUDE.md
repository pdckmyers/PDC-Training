# PDC Training — How Claude Should Work On This Repo

The owner of this project is **not a developer**. They vibe-code by describing
what they want in plain English, often from the Claude app (not a terminal),
sometimes running several sessions at once. These rules exist so that works
reliably without the owner having to manage git, remember to ask for QA, or
clean up after Claude. Follow them automatically — do not wait to be told.

## 1. Ship to main, every time, no exceptions

- The end state of every task is: the change is merged into `main`, and no
  other branch is left behind.
- Do the work on a session/feature branch (branches are cheap and required for
  parallel sessions — see §2), but as soon as the task is done and checked
  (§3), **open a PR and merge it to `main` yourself.** Then delete the branch.
- Never leave a branch open "for later" and never ask "should I merge this?"
  — merging finished, checked work to `main` is standing permission. The only
  time to stop and ask first is if checks are failing and you don't know how
  to fix them, or if the change is something irreversible/high-blast-radius
  (see §6).
- If a PR somehow already exists for the branch you're using, merge that PR
  rather than creating a second one.

## 2. Parallel sessions without collisions

The owner may have multiple Claude sessions running at once (e.g. one for a
UI tweak, one for a new page). Each session must stay out of the others' way:

- **Start every task by syncing:** `git fetch origin main` then branch from
  `origin/main`, not from whatever the local checkout happens to have.
- **Use a fresh, descriptively-named branch per task**, e.g.
  `claude/add-signup-form`, `claude/fix-nav-bug`. Never reuse a branch across
  unrelated tasks.
- **Keep tasks small and scoped to specific files/features.** The smaller the
  change, the smaller the chance two sessions touch the same lines.
- **Before merging, re-sync with `main`:** `git fetch origin main` and rebase
  or merge `origin/main` into your branch. If another session merged first
  and there's a conflict, resolve it, re-run checks (§3), and only then
  merge. Never force-push over someone else's merged work.
- **Never edit files another active session is known to be mid-task on.** If
  the owner tells you another session is working on a specific area, avoid it
  or coordinate by finishing and merging quickly so the other session can
  rebase cleanly.
- Because merges happen fast and often (§1), the window where two branches
  can conflict stays small — frequent, small, fast merges are the collision
  -avoidance strategy, not long-lived branches.

## 3. Always check your own work — don't wait to be asked

Before merging anything to `main`:

1. Run whatever this project's real checks are (build, lint, typecheck, test
   — check `package.json` scripts or the repo's actual tooling; don't assume
   a stack that isn't there). Fix failures yourself.
2. Re-read the diff for logic errors, typos, and edge cases a reviewer would
   catch.
3. If it's a UI/frontend change, actually run the app and click through the
   affected flow (and realistic edge cases) before calling it done — don't
   claim something works because it typechecks.
4. Only report success once this has actually happened, in plain, non
   -technical language (what changed, what you verified, anything you're
   unsure about).

This is equivalent to always running `/check-work` before finishing — do it
by default, every task, without being asked.

## 4. Always tidy up before finishing

Before merging:

- Remove temporary/debug files, stray `console.log`/print-debugging, and
  commented-out code introduced while working.
- Remove unused variables, functions, imports, and dependencies you added but
  no longer need.
- Keep naming/style consistent with the rest of the project.
- Double-check nothing sensitive (API keys, `.env` contents, tokens) is about
  to be committed.

This is equivalent to always running `/tidy-up` before finishing — do it by
default, every task, without being asked.

## 5. Secrets — never make the owner do this by hand if it's automatable

- Real secret values (API keys, database URLs, service tokens) never get
  committed to the repo or written into code. They go into Vercel
  environment variables, GitHub Actions secrets, or Supabase project
  settings — whichever is correct for that secret.
- If Claude has the access (via the Vercel/GitHub/Supabase MCP connections)
  to set a secret directly, do that instead of asking the owner to paste it
  into a dashboard.
- If a secret value can only come from the owner (e.g. they must copy a key
  out of a dashboard once because it's tied to their account), ask for just
  that value, store it immediately via the proper secrets mechanism, and
  never echo it back or leave it sitting in chat/code afterward.
- `.env` / `.env.local` files with real values are always gitignored.

## 6. When it's still okay (or necessary) to stop and ask

Standing permission to merge to `main` and manage branches does **not** cover:

- Deleting data, dropping database tables/columns, or any destructive
  Supabase migration that can lose real data.
- Force-pushing, rewriting shared history, or deleting `main`.
- Spending money (upgrading a paid plan/tier, enabling paid infra) or
  anything that changes billing.
- Sending anything externally on the owner's behalf (emails, posts, messages
  to other people).

For those, explain what you want to do and why, then wait for a yes.

## 7. Tech stack / project notes

**What this is:** a new-hire training app. Admins author modules (text,
optional image, optional video, optional multiple-choice quiz); hires log in,
work through published modules, and their completions/quiz scores are
tracked so admins can see who's finished what.

- **Framework:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS.
- **Auth/DB:** Supabase — email/password auth, Postgres with row-level
  security. Schema lives in `supabase/migrations/0001_init.sql`:
  - `profiles` (id, email, full_name, role: `hire`|`admin`) — a trigger
    creates this automatically on signup; **the very first person to sign up
    becomes admin**, everyone after that defaults to `hire`.
  - `modules` (title, description, body, image_url, video_url, quiz jsonb,
    published, sort_order, created_by) — quiz is an array of
    `{ question, options[], correct_index }`.
  - `completions` (user_id, module_id, quiz_score, quiz_total,
    completed_at) — one row per hire per module.
- **Routes:** `/login`, `/signup`, `/modules` (list + detail for hires),
  `/admin/modules` (list/create/edit/delete, admin-only),
  `/admin/progress` (completion matrix, admin-only). `proxy.ts` (Next 16's
  renamed middleware convention) gates everything behind auth and gates
  `/admin/*` behind the admin role.
- **Hosting:** Vercel project `pdc-training-l7g8`, live at
  `pdc-training-l7g8.vercel.app`, auto-deploys `main`. **Important:** an
  earlier duplicate project named `pdc-training` was created by mistake and
  deleted — if a second Vercel project ever reappears for this repo
  (e.g. from a stray re-import), consolidate back down to one.
- **Env vars set in Vercel:** `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local.example` for local dev) —
  values come from the live Supabase project below.
- **Supabase project:** `myrbessqeorztzqfwvjp` (org `pmgqyuxkfeqlxjridbzu`),
  region us-east-1. Migrations 0001–0003 are applied; security and
  performance advisors are clean as of the last check. Re-run
  `get_advisors` after future schema changes via the Supabase MCP connector.
- Repo: `pdckmyers/PDC-Training`
