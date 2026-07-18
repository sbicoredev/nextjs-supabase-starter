# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, etc.) working in this
repository. If anything here conflicts with what you observe in the code,
trust the code and flag the discrepancy.

This is a production-ready Next.js + Supabase starter kit. All tech stack
details, architecture, coding standards, and conventions live in `docs/` —
read the relevant file(s) below before making changes, don't rely on
general training knowledge for anything project-specific.

## Where to look

| File | Read it for |
|---|---|
| `docs/project-overview.md` | What this project is, the tech stack and why, setup commands, known gaps |
| `docs/architecture.md` | Request lifecycle, folder structure, feature data flow pattern, auth/data/state architecture |
| `docs/coding-standards.md` | TypeScript, component, form, Server Action, naming, and security conventions — plus the pre-commit verification checklist |
| `docs/library-docs.md` | Per-library reference and gotchas (Next.js, Supabase, TanStack Query/Form, Zod, Zustand, shadcn/ui + Base UI, Biome, Vitest) |
| `docs/sprint-plan.md` | A generic sprint-roadmap template for turning this starter into a specific product |
| `docs/progress-tracker.md` | Living log of what's been built and what's next — check **Status** here first |

Commands, setup steps, and everything else that would otherwise be
duplicated across files live in `docs/project-overview.md` — this file is
an index, not a second copy.

<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

## Minimum before starting work

1. Read `docs/progress-tracker.md` → **Status** to know where things
   stand.
2. Read `docs/architecture.md` before adding or changing a feature.
3. Read `docs/coding-standards.md` before writing code, and run through
   its verification checklist before calling a task done.
4. Skim `docs/library-docs.md` for the libraries you're about to touch —
   it documents version-specific gotchas (e.g. Next.js 16's `proxy.ts`
   rename, Zod v4's top-level helpers) that training data alone can get
   wrong.

## What you'll typically do first

See `docs/project-overview.md` → "What you'll typically do first" for
initial setup, and `docs/sprint-plan.md` for a suggested order of
operations when turning this into a specific product. Track progress in
`docs/progress-tracker.md` as you go.

Two feature examples already exist to copy the pattern from:
`src/features/auth/` and `src/features/profile/` — see
`docs/architecture.md` → "Feature data flow pattern". Neither has a
TanStack Query hook yet (see that doc for why), so your first CRUD
feature will be the first full end-to-end reference (schema → action →
query hook → form) in this codebase.

## Scaffolding a new feature

Use the `/new-feature <name>` and `/db-migrate <name>` slash commands in
`.claude/commands/` — they encode the same folder/file pattern described
in `docs/architecture.md` so you don't have to re-derive it by hand.
