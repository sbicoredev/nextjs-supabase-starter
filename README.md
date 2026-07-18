# Next.js + Supabase Starter Kit

A production-ready starter for building SaaS apps with Next.js, Supabase,
shadcn/ui (on Base UI primitives), TanStack Query/Form, Zod, and Zustand —
organized as a feature-based codebase that's easy for both humans and AI
coding agents (Claude Code, etc.) to extend consistently.

**Included:** email/password + magic link + OAuth (Google/GitHub) auth,
route protection, an auto-provisioned `profiles` table, dark mode, toasts,
typed env vars, open-redirect-safe auth flows, baseline security headers,
error/not-found/loading pages, and a Vitest + CI setup. See
[`docs/project-overview.md`](./docs/project-overview.md) for what's
intentionally *not* included yet.

## Requirements

- Node.js ≥ 24
- [pnpm](https://pnpm.io) ≥ 10 (`npm install -g pnpm` if you don't have it)
- A [Supabase](https://supabase.com) project (free tier is fine)
- [Docker](https://www.docker.com/) — only if you want to run Supabase
  locally (`pnpm run db:start`); optional, you can develop against your
  hosted project directly

## Getting started

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` with your Supabase project's URL and keys (Project Settings
→ API in the Supabase Dashboard).

Apply the database schema. Either:

```bash
# Option A — local Supabase (requires Docker)
pnpm run db:start
pnpm run db:reset      # applies supabase/schemas/ + supabase/seed.sql

# Option B — push straight to your hosted project
pnpm dlx supabase link --project-ref <your-project-ref>
pnpm run db:push
```

Then:

```bash
pnpm run db:types      # generate src/lib/supabase/types.ts
pnpm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `pnpm run dev` | Start the dev server (Turbopack) |
| `pnpm run build` | Production build |
| `pnpm run start` | Run the production build |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run check` | Check lint/format with Biome (Ultracite preset) |
| `pnpm run fix` | Auto-fix lint + format issues |
| `pnpm run test` | Run the Vitest suite once |
| `pnpm run test:watch` | Run Vitest in watch mode |
| `pnpm run db:start` / `db:stop` | Start/stop local Supabase (Docker) |
| `pnpm run db:reset` | Re-apply `supabase/schemas/` + `supabase/seed.sql` locally |
| `pnpm run db:diff -- <name>` | Generate a migration from schema changes |
| `pnpm run db:migrate` | Apply migrations to your local supabase |
| `pnpm run db:push` | Push migrations to your linked remote project |
| `pnpm run db:types` | Regenerate `src/lib/supabase/types.ts` |

## OAuth setup

OAuth providers are configured in the Supabase Dashboard
(**Authentication → Providers**), not in this app's code — no client secret
env vars are needed here. For local development, `supabase/config.toml` has
commented-out `[auth.external.*]` blocks you can enable if you want OAuth to
work against the local stack too.

## Documentation

Start with [`AGENTS.md`](./AGENTS.md) — a thin index into `docs/` (also
what Claude Code loads automatically). For the actual conventions,
architecture, and command reference:

- [`docs/project-overview.md`](./docs/project-overview.md) — what this is and why
- [`docs/architecture.md`](./docs/architecture.md) — request lifecycle, auth, data layer
- [`docs/coding-standards.md`](./docs/coding-standards.md) — conventions the linter can't enforce
- [`docs/library-docs.md`](./docs/library-docs.md) — per-library reference and gotchas
- [`docs/sprint-plan.md`](./docs/sprint-plan.md) — the project sprint roadmap built on this starter
- [`docs/progress-tracker.md`](./docs/progress-tracker.md) — living progress log

## Using this with Claude Code

This repo is set up as a ready-to-go Claude Code project:

- `AGENTS.md` (also re-exported via `CLAUDE.md`) is loaded automatically at
  the start of every session and indexes `docs/` — the actual folder
  structure, data flow pattern, and command reference live there.
- `.claude/commands/new-feature.md` — scaffold a new feature:
  `/new-feature <name>`
- `.claude/commands/db-migrate.md` — generate and review a migration after
  editing `supabase/schemas/`: `/db-migrate <name>`

Just run `claude` in the project root and it will have full context.

## License

MIT — use this however you like.
