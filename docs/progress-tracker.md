# Progress Tracker

A living log of what's been built, what's in progress, and what's next.
Update this as you complete work — especially useful for AI agents picking
up a session where a previous one left off. Keep entries short; this is a
log, not a design doc (put design decisions in `docs/architecture.md`).

## How to use this file

- Add a dated entry under **Log** for anything non-trivial you finish.
- Keep **Status** current — it's the first thing to check at the start of a
  new session.
- Move items between **Now / Next / Later** as priorities shift.

---

## Status

Starter kit scaffold, hardened. Auth and profile features are mostly
complete, but the password-recovery flow currently has a known bug (see
**Known issues** below) — fix that before treating auth as fully working
end to end. No product-specific features have been built yet. See
`docs/project-overview.md` → "Known limitations" for what's intentionally
not included (as opposed to broken).

## Known issues

Actual bugs to fix, not deliberate scope gaps (those are in
`docs/project-overview.md` → "Known limitations"):

- **Password reset is broken end-to-end.** `/reset-password` is listed in
  `AUTH_ROUTES` (`src/constants/auth.ts`), and `src/lib/supabase/middleware.ts`
  redirects any authenticated user on an `AUTH_ROUTES` path to `/dashboard`.
  Since verifying the recovery link (`/auth/confirm?type=recovery`)
  establishes a session before redirecting to `/reset-password`, the very
  next request gets bounced to `/dashboard` before the user can set a new
  password. Fix: exclude `/reset-password` from the "redirect
  authenticated users away" branch (e.g. split `AUTH_ROUTES` into a
  redirect-when-authenticated list that excludes it), or gate that
  redirect on something more specific than "any authenticated user." See
  `docs/architecture.md` → "Auth architecture" for the full flow table.
- **Avatar storage bucket was never migrated.** `supabase/schemas/001_profiles.sql`
  declares an `avatars` bucket + RLS policies, but `supabase/migrations/`
  has never had this diffed in, so `pnpm run db:reset` doesn't actually
  create it. Fix: run `pnpm run db:diff -- add_avatars_storage` and commit
  the generated migration. See `docs/library-docs.md` → Supabase section.
- **CI cache key targets the wrong lockfile.** `.github/workflows/ci.yml`
  hashes `**/package-lock.json` for the Next.js build cache key, but this
  project uses pnpm (`pnpm-lock.yaml`) — the cache never keys off real
  dependency changes. Fix: change the `hashFiles` target to
  `pnpm-lock.yaml`.

## Now / Next / Later

- **Now:** fix the three items in **Known issues** above — especially the
  password-reset redirect bug, since it's a broken core auth flow, not a
  gap.
- **Next:** design the first domain table with a real multi-row ownership
  shape (see `docs/sprint-plan.md` → "Read this first"); this starter's
  only existing table (`profiles`) is 1:1 with `auth.users` and doesn't
  demonstrate that pattern.
- **Later:** error tracking integration (Sentry or similar), integration
  and E2E tests (see `docs/project-overview.md` → "Known limitations").

---

## Log

### Documentation audit

- Reviewed `AGENTS.md`, `README.md`, and all of `docs/` against the actual
  code. Corrected several docs that had drifted from what the code does
  (ban-check cache described as in-memory/single-instance when it's
  Redis-backed; `db:reset` described as re-applying `supabase/schemas/`
  when it applies `supabase/migrations/`; a stale CSP claim; an
  undemonstrated `features/*/types/` folder convention). Logged the
  underlying code bugs this surfaced under **Known issues** above —
  those still need actual code fixes, not just doc corrections.

### Initial scaffold

- Set up Next.js App Router project with the feature-based structure
  documented in `AGENTS.md`.
- Configured Supabase (`@supabase/ssr`) with three scoped clients
  (browser, server, service role) plus `proxy.ts` for session refresh and
  route protection.
- Implemented full auth: email/password, magic link, OAuth (Google,
  GitHub), password reset, email confirmation — all backed by Server
  Actions in `src/features/auth/actions/`.
- Added `profiles` table with an auto-provisioning trigger on
  `auth.users` insert, with Row Level Security policies.
- Wired TanStack Form (Zod-validated via Standard Schema, no adapter) in
  both `auth` and `profile` features. TanStack Query is wired for reading
  the current user (`src/features/auth/hooks/use-user.ts`) but neither
  feature has a list/mutation query hook yet — the first CRUD feature
  built on this starter will be the first full end-to-end reference
  (schema → action → query hook → form) in this codebase.
- Installed shadcn/ui on Tailwind CSS v4 (CSS-first theme, `new-york`
  style) with the primitives this starter's UI needs (button, input,
  textarea, label, card, dialog, dropdown-menu, avatar, separator, badge,
  alert, skeleton, tabs, field, sonner toaster).
- Configured Biome via Ultracite for lint + format, and `AGENTS.md` /
  `CLAUDE.md` for AI-agent context.
