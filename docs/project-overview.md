# Project Overview

## What this is

A production-ready starter template for building SaaS-style applications
with Next.js and Supabase. It ships with working authentication and a typed
data layer, following a feature-based pattern (Zod schema → Server Action →
TanStack Query hook → TanStack Form) that every new feature should repeat —
see `src/features/auth/` and `src/features/profile/` for worked examples.

It is meant to be cloned/forked as the first commit of a real product, not
studied as a toy example — every piece (auth flows, RLS policies, form
validation, error handling) is wired up the way it would need to be in
production. See "Known limitations" below for what's intentionally not
included yet.

## Goals

- **Zero ambiguity for AI coding agents.** Consistent, feature-based folder
  structure with one obvious place for every kind of code, documented across
  `docs/` (indexed from `AGENTS.md`) so Claude Code (or any other agent) can
  extend it correctly without re-deriving conventions from scratch.
- **Secure by default.** Row Level Security on every table, server-side auth
  checks on every mutation, environment variables validated at startup,
  validated redirect targets (see `src/lib/safe-redirect.ts`), and baseline
  security headers (`next.config.ts`).
- **Type-safe end to end.** Database schema → generated types → Zod schemas
  → form state → UI, with no `any` in between.
- **Minimal but real.** No demo-only shortcuts that you'd have to rip out
  before shipping (no hardcoded fake data, no skipped validation, no
  client-trusts-client-input auth).

### Security Practices

The starter is secure by default:
- Row Level Security on all tables
- Server-side authorization checks
- Open-redirect protection (`safe-redirect.ts`)
- Environment validation at startup
- **Rate limiting on all public endpoints** (auth + general API) using Upstash Redis
- Baseline security headers in `next.config.ts`

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Server Components + Server Actions remove the need for a separate API layer for most CRUD |
| Database & Auth | Supabase (Postgres + `@supabase/ssr`) | RLS gives you real authorization at the data layer, not just in app code |
| UI components | shadcn/ui on Tailwind CSS v4 | Copy-in components you own and can modify, not a black-box dependency |
| Forms | TanStack Form | Headless, framework-agnostic, validates directly against Standard Schema (Zod) with no adapter |
| Server state | TanStack Query | Caching, background refetch, and optimistic updates for anything fetched from Supabase |
| Client state | Zustand | Small, explicit stores for UI-only state that doesn't belong in TanStack Query or component state |
| Validation | Zod v4 | One schema shared by the form, the Server Action, and (indirectly, via generated types) the database |
| Lint/format | Biome via Ultracite | Single fast tool for lint and format; opinionated defaults an agent can rely on |
| Testing | Vitest | Fast, ESM-native, zero-config with Vite — used for schema/pure-logic unit tests (see `docs/library-docs.md`) |

## Included out of the box

- Email/password, magic link, and OAuth (Google, GitHub) authentication
- Session refresh and route protection via `src/proxy.ts`
- Open-redirect protection on every auth redirect target (`src/lib/safe-redirect.ts`)
- Auto-created user profile row on sign-up (`profiles` table + trigger)
- A settings/profile page
- Dark mode (`next-themes`)
- Toasts (`sonner`)
- Environment variable validation (`src/env.ts`)
- Root `error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx`
- Baseline security headers (`next.config.ts`) — see "Known limitations" for what's not included
- Rate limiting on auth flows and API routes (Upstash Redis + `@upstash/ratelimit`) with proper 429 responses and headers
- CI (`.github/workflows/ci.yml`): typecheck, lint, test, build on every PR
- A Vitest suite covering the Zod schemas and the redirect-safety helper

## Known limitations

Deliberately out of scope for the starter kit — call these out explicitly
rather than silently discovering them mid-project. This list is scope
gaps, not bugs — for currently-broken behavior that should be fixed
rather than intentionally deferred, see `docs/progress-tracker.md` →
**Known issues**.

- **CSP needs tuning.** A baseline Content-Security-Policy is set in
  `next.config.ts`. `unsafe-eval` is already stripped in production builds
  (it's only added in `development`, where Next.js requires it) — but
  `script-src` still allows `unsafe-inline` unconditionally, which weakens
  the policy against injected-script attacks. Move to nonce- or hash-based
  script sources for production and add any third-party origins your app
  uses.
- **Error tracking is pluggable.** A `reportError` helper exists in
  `src/lib/error-reporter.ts` — currently logs to console. Drop in Sentry
  (or similar) by importing it there; all error boundaries already route
  through it.
- **Only one example table** (`profiles`, 1:1 with `auth.users`). Nothing
  in the starter demonstrates the "many rows owned by one user/workspace"
  RLS pattern most real products need first — see `docs/sprint-plan.md` →
  "Read this first" before designing your schema.
- **Only unit tests.** The Vitest setup covers schemas and pure logic, not
  integration tests against a local Supabase instance or end-to-end tests.
  See `docs/sprint-plan.md` Sprint 4 → "QA" for what to add before a
  production launch.
- **Google Fonts requires network access at build time.** The layout
  (`src/app/layout.tsx`) imports Inter and JetBrains Mono from
  `next/font/google`. This fetches fonts from `fonts.googleapis.com` during
  `next build`, which will fail in network-restricted environments (CI behind
  a corporate proxy, air-gapped Docker builds). To self-host, switch to
  `next/font/local` with locally downloaded font files.

## Commands

```bash
pnpm install           # install dependencies
pnpm run dev           # start dev server (Turbopack)
pnpm run build         # production build
pnpm run typecheck     # tsc --noEmit
pnpm run check         # ultracite check (read-only)
pnpm run fix           # ultracite fix (auto-fix + format)
pnpm run test          # run the Vitest suite once
pnpm run test:watch    # run Vitest in watch mode
pnpm run db:start      # start local Supabase (Docker required)
pnpm run db:reset      # reset local DB, apply supabase/migrations/, re-run seed.sql
pnpm run db:diff -- <name>   # generate a migration from schemas/ changes
pnpm run db:migrate    # apply generated migrations to your local supabase project
pnpm run db:push       # push migrations to your linked remote project
pnpm run db:types      # regenerate src/lib/supabase/types.ts
```

Run `pnpm run typecheck`, `pnpm run check`, and `pnpm run test` before
considering any task done — this is also what `.github/workflows/ci.yml`
runs on every PR. Run `pnpm run db:types` after changing anything in
`supabase/schemas/`.

## What you'll typically do first

1. Create a Supabase project and copy its URL/keys into `.env` (see
   `.env.example`).
2. `pnpm install`
3. `pnpm run db:start` (local Supabase via Docker) 
4. `pnpm run dev`
5. Build your first real feature following `docs/architecture.md` →
   "Feature data flow pattern" — either `src/features/auth/` or
   `src/features/profile/` is the closest existing example to copy from.
   `.claude/commands/new-feature.md` (`/new-feature <name>`) scaffolds the
   folders for you.

See `docs/sprint-plan.md` for a suggested order of operations when turning
this into a specific product, and `docs/progress-tracker.md` to track it.
