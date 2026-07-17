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

Starter kit scaffold, hardened. Auth and profile features are complete and
working end to end; no product-specific features have been built yet. See
`docs/project-overview.md` → "Known limitations" for what's intentionally
not included.

## Now / Next / Later

- **Now:** nothing in progress — ready for the first real feature.
- **Next:** design the first domain table with a real multi-row ownership
  shape (see `docs/sprint-plan.md` → "Read this first"); this starter's
  only existing table (`profiles`) is 1:1 with `auth.users` and doesn't
  demonstrate that pattern.
- **Later:** rate limiting on auth endpoints, error tracking integration,
  a Content-Security-Policy — see `docs/project-overview.md` → "Known
  limitations" for the full list.

---

## Log

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

### Hardening pass

- Fixed an open redirect on the login/OAuth `redirectTo` flow
  (`src/lib/safe-redirect.ts`), validated at every boundary it enters:
  `(auth)/login/page.tsx`, `signInWithPassword`, `signInWithOAuth`, and
  `app/auth/callback/route.ts`.
- Unified the three different Server Action result shapes into one
  `ActionResult<T>` (`src/types/index.ts`), used by every action in
  `auth.actions.ts` and `profile.actions.ts`.
- Wired the previously-unused `AUTH_ERROR_MESSAGES` map into
  `src/features/auth/lib/get-auth-error-message.ts` so auth failures show
  friendly copy instead of raw Supabase error strings.
- Added root `error.tsx`, `global-error.tsx`, `not-found.tsx`, and
  `loading.tsx`.
- Added baseline security headers in `next.config.ts`.
- Added a Vitest suite (`pnpm run test`) covering the auth/profile Zod
  schemas and the redirect-safety helper.
- Added CI (`.github/workflows/ci.yml`): typecheck, lint, test, build on
  every PR.
- Pinned `@biomejs/biome`/`ultracite` to exact versions — `2.5.3`/`2.5.4`
  have a confirmed internal panic that crashes `ultracite check`/`fix` on
  certain files; see `docs/library-docs.md` → Biome section.
