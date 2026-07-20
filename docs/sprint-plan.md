# Sprint Plan: <Project Name>

> **How to use this file:** this is a blank template, not a worked
> example — fill in the placeholders (`<...>`) for your specific product.
> Keep this file and `docs/progress-tracker.md` in sync as you go: this
> file is the plan, `progress-tracker.md` is the log of what's actually
> been done.

A sprint roadmap for building **<Project Name>** on top of this starter
kit. Each sprint maps your product roadmap onto the starter's actual
conventions: `supabase/schemas/*.sql` files, `src/features/<name>/`
folders, and routes under `src/app/(dashboard)/` (or your app's protected
route group). Follow `docs/architecture.md` → "Feature data flow pattern"
for every feature you build.

## Read this first: the one foundational decision

Decide your top-level ownership model before writing any schema — it
determines almost every RLS policy and query you'll write afterward.
Common shapes:

- **Single-user** — every row belongs to exactly one `auth.users` row
  (the pattern the starter's own `profiles` table demonstrates).
- **Multi-tenant / workspace** — rows belong to a `<tenant>` (workspace,
  team, organization, account — pick one name and use it everywhere) that
  has many members with roles. This needs a `<tenant>_members` join table
  and an `is_<tenant>_member()` helper used in every RLS policy.
- **Something else** — shared/public data with per-row visibility rules,
  a marketplace with two-sided ownership, etc. Write down the shape
  explicitly here before Sprint 2, since it's expensive to change later.

<!-- Replace this line with your project's actual decision, e.g.:
"This project uses the workspace model: every domain table has a
`workspace_id`, and `is_workspace_member(workspace_id)` gates every RLS
policy." -->

---

## Sprint 0 — Project Foundation

**Already in place from the starter kit** (verify against
`docs/project-overview.md` → "Included out of the box" for the current
list):

- Next.js (App Router) + TypeScript + Tailwind, UI primitives, lint/format
- Environment variable validation
- Supabase configured (scoped clients, `supabase/schemas/`)
- Row Level Security pattern established (see `supabase/schemas/001_profiles.sql`)
- Authentication (see Sprint 3 — mostly already built, verify against
  `docs/progress-tracker.md` → "Known issues" for anything currently broken)
- Base layout, protected routes, standard error/loading/not-found pages
- Baseline security headers, CI (typecheck/lint/test/build)

**Deliverable:** Running application with the starter's defaults intact;
nothing product-specific yet.

---

## Sprint 1 — Design System

Add every reusable UI primitive your product needs via the shadcn CLI
(see `docs/library-docs.md` for the exact command/style this kit uses),
then build composite components on top.

**Already in `src/components/ui/`:** check the current contents of that
folder — don't assume a fixed list here, since it changes over time.

**Custom composite components** (`src/components/`, cross-feature — these
belong outside `features/`, not inside any one feature). Typical examples,
adapt to your product:

- A stat/metric card for dashboard widgets
- A section header (title + description + action slot)
- A list-view toolbar (search + filters + bulk actions)
- A status badge with a fixed color mapping per domain enum
- An empty state (icon + message + CTA) for list views with no data
- A debounced search input
- A small inline loading spinner

**Deliverable:** Complete design system; every later sprint only composes
these, never invents new base styling.

---

## Sprint 2 — Database & Core Infrastructure

Design and land your full schema. One `supabase/schemas/*.sql` file per
domain, following `supabase/schemas/001_profiles.sql`'s pattern (RLS
enabled, explicit policies, an `updated_at` trigger via
`public.set_updated_at()`, which already exists there).

Lay out your own table breakdown here, one row per schema file — replace
this example shape with your actual domains:

| File | Tables |
|---|---|
| `002_<domain>.sql` | `<table>`, `<table>` |
| `003_<domain>.sql` | `<table>`, `<table>` |

Notes:

- If you're using the multi-tenant/workspace model from "Read this first"
  above, every table gets a `<tenant>_id` column plus the
  `is_<tenant>_member()` RLS policy pattern.
- Polymorphic tables (rows that attach to more than one parent type, e.g.
  a shared `notes` or `tags` table used across several features) use a
  `(target_type text, target_id uuid)` pair with a `check` constraint on
  allowed `target_type` values, plus an index on `(target_type, target_id)`.
- After every schema change: `pnpm run db:diff -- <name>` →
  `pnpm run db:reset` → `pnpm run db:types` (see `docs/library-docs.md`
  → Supabase section for the full workflow, including the schemas-vs-
  migrations gotcha documented there).

**Backend layer** (follows the Data Access Layer convention already
established in `src/features/auth/actions/` and
`src/features/profile/actions/`, generalized to every new feature):

- One `actions/*.actions.ts` file per feature — this is already the Data
  Access Layer convention; no separate repository abstraction needed on
  top (`docs/architecture.md` → "Data layer architecture").
- Zod schemas per feature for validation, already the pattern
  (`docs/coding-standards.md` → "Forms").
- If you need role-based permissions, add a
  `has<Tenant>Role(<tenant>Id, role)` helper next to your membership
  check, used both in RLS policies and in Server Actions that need to
  gate by role.
- If you need an audit trail, add a small `logActivity()` helper in
  `src/lib/`, called from Server Actions after a mutating operation
  succeeds.

**Deliverable:** Complete schema applied locally, RLS verified, types
regenerated.

---

## Sprint 3 — Authentication & User Management

**Already done by the starter kit:** signup, login, magic links, forgot
password, reset password, session management, protected routes, email
verification (all in `src/features/auth/`) — check
`docs/progress-tracker.md` → "Known issues" before assuming this is fully
working end to end, since the starter may have open bugs in this area.

**Typical new work — extend the profile for your product:**

- Avatar upload to Supabase Storage, if your product needs one — check
  whether `supabase/schemas/001_profiles.sql` already declares a bucket
  for this, and whether it's actually been migrated (see
  `docs/library-docs.md` → Supabase section for a schemas-vs-migrations
  gotcha that specifically affects storage buckets).
- Account deletion (a Server Action that deletes the `auth.users` row via
  the service-role client, cascading to `profiles` and every table with a
  foreign key onto it).
- Email-change flow (Supabase supports this via
  `supabase.auth.updateUser({ email })` plus a confirmation link; add a
  form + Server Action following the existing auth pattern).
- If using the multi-tenant model: tenant creation, invitations, and
  member-role management.

**Deliverable:** Profile/account management complete for your product;
no further generic auth work needed before building product features.

---

## Sprints 5–N — Feature Sprints

Each sprint builds one feature's full vertical slice (Server Actions,
TanStack Query hooks, TanStack Form, routes) on top of the schema Sprint 2
already landed — the same "schema exists, build the feature" shape as
Sprint 3, generalized via `docs/architecture.md` → "Feature data flow
pattern". Order them so each one becomes useful once the sprints before it
exist (a feature that reads from another feature's data should come
after it).

Lay out your own feature list here, one row per feature — replace this
example shape with your actual product's features:

| Sprint | Feature | Schema (Sprint 2) |
|---|---|---|
| 5 | `<feature>` | `002_<domain>.sql` |
| 6 | `<feature>` | `003_<domain>.sql` |

Each sprint's deliverable is the same shape: list view (toolbar + table/
cards + empty state from Sprint 1), detail view, create/edit form
(TanStack Form + the feature's Zod schema), and the Server Actions/query
hooks backing all three — verified against
`docs/coding-standards.md`'s checklist before moving to the next sprint.

---

## Sprint N+1 — Production Polish

Not a feature sprint — a hardening pass across everything built so far.
Run this **after** your feature sprints, not before (there's little to
harden until the features exist) — it's numbered N+1 only to match the
starter's original phase-based ordering; treat sprint numbers as an
ordered list, not literal chronology.

- **Performance:** code splitting and lazy loading are mostly automatic
  with the App Router; focus effort on database indexes (every foreign
  key used in a `where`/`join`, and every tenant-scoping column if you're
  using the multi-tenant model — audit `supabase/schemas/` for missing
  ones), image optimization (`next/image`), and bundle size for any heavy
  client-side libraries you added in Sprint 1.
- **Security:** re-run the RLS check from `docs/coding-standards.md`'s
  verification checklist against every table added since Sprint 2; add
  rate limiting to any public-facing, unauthenticated route (approval
  links, public share links, webhooks) — the starter kit ships with
  baseline rate limiting via `@upstash/ratelimit` in
  `src/lib/rate-limit.ts`, enforced in `src/proxy.ts` and Server Actions.
- **UX:** accessibility pass, responsive check on every feature built,
  keyboard shortcuts/command palette if your product needs one, consistent
  empty/loading/error states (this sprint is the audit, not the first
  implementation, if Sprint 1's components were used throughout).
- **QA:** unit tests for Zod schemas and pure logic, following the pattern
  already established for the starter's own schemas (see
  `docs/coding-standards.md` → "Testing"); integration tests for Server
  Actions against a local Supabase instance; end-to-end tests for your
  product's critical paths.
- **Deployment:** production deploy target, monitoring/logging/analytics
  (not yet a dependency in the starter — add one), backup strategy
  (Supabase's built-in backups, verify retention matches your needs),
  CI/CD (the starter ships a baseline `.github/workflows/ci.yml` —
  typecheck/lint/test/build; add a deploy step once you have a target),
  and documentation (update `docs/` to reflect the finished product, not
  just the starter kit's generic scaffolding).

**Deliverable:** Production-ready <Project Name>.

---

## Sequencing notes

Sprint N+1 ("Production Polish") should be run last in practice even though
it's numbered before the feature sprints — it's a hardening pass over
work that doesn't exist yet at its position in the numbering. If you're
picking sprints up individually rather than in order, treat "Sprint N+1" as
"the last sprint" regardless of its number.

## What's V2 (don't build yet)

Track things that come up while planning the above but add real
complexity and aren't needed for a first production launch here — revisit
only once your feature sprints and Sprint N+1 are done and the product has
real users. Examples of the kind of thing that belongs in this list:

- Advanced billing (multi-currency, subscriptions, usage-based pricing)
- A separate, more restricted external-facing portal or public API
- Custom fields / configurable schemas per tenant
- Third-party integrations
- Advanced reporting/analytics beyond simple dashboard widgets

<!-- Replace the above with your project's actual deferred items. -->
