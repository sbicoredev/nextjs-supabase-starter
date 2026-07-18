# Sprint Plan: <Project_Name>

A sprint roadmap for building **Project_Name**. Each sprint below
maps the product roadmap onto the starter's actual conventions:
`supabase/schemas/*.sql` files, `src/features/<name>/` folders, and
routes under `src/app/(dashboard)/`. Follow `docs/architecture.md` →
"Feature data flow pattern" for every feature you build.

This replaces the generic phase-based plan that ships with the starter —
keep this file and `docs/progress-tracker.md` in sync as you go.

## Read this first: the one foundational decision

The starter kit's only existing example table (`profiles`) is 1:1 with
`auth.users` — it doesn't demonstrate the "many rows owned by one user"
shape most of the project needs, let alone multi-tenancy.

---

## Sprint 0 — Project Foundation

**Already in place:**

- Next.js (App Router) + TypeScript + Tailwind v4 ✅
- shadcn/ui on Base UI ✅
- Biome via Ultracite
- Husky + lint-staged ✅
- Absolute imports (`~/*`) ✅
- Environment variables validated via `src/env.ts` ✅
- Supabase configured (three scoped clients, `supabase/schemas/`) ✅
- Row Level Security pattern established ✅
- Authentication (see Sprint 3 — already built) ✅
- Base layout, protected routes ✅
- Standard Next.js `error.tsx`/`global-error.tsx`/`not-found.tsx`/`loading.tsx` ✅
- Baseline security headers, CI (typecheck/lint/test/build) ✅

**Deliverable:** Running application. A workspace-aware layout doesn't
exist yet — that's Sprint 5, once `workspaces`/`workspace_members` exist.

---

## Sprint 1 — Design System

Add every reusable primitive via the shadcn CLI (`-b base-ui` to match this
kit's primitive library — see `docs/library-docs.md`), then build the
composite components on top.

**Already in `src/components/ui/`:** button, input, textarea, label, card,
dialog, dropdown-menu, avatar, separator, badge, alert, skeleton, tabs,
field, sonner (toaster).

**Add via `pnpm dlx shadcn@latest add <name> -b base-ui`:**
checkbox, radio-group, switch, select, combobox (community recipe on top of
`command` + `popover`), calendar, popover, tooltip, drawer, table,
pagination, command, accordion, breadcrumb.

**Add as a dependency (not in the shadcn registry):** a chart library —
`recharts` is already available in this kit's sandboxed Artifacts
environment; add it as a real `package.json` dependency for the app itself
(Sprint 14's reports will need it).

**Custom composite components** (`src/components/`, cross-feature so they
belong outside `features/`, not inside any one feature):

- `StatCard` — number + label + trend indicator (dashboard widgets, reports)
- `SectionHeader` — title + description + action slot
- `ActionBar` — toolbar row (search + filters + bulk actions), used by
  every list view (clients, projects, invoices, ...)
- `StatusBadge` — wraps `Badge` with a fixed color mapping per domain status
  enum (invoice status, proposal status, task status, ...)
- `EmptyState` — icon + message + CTA, used by every list view (clients,
  projects, invoices, ...) once there's no data to show
- `SearchInput` — debounced input using `src/hooks/use-debounce.ts` (already
  in the starter)
- `LoadingSpinner` — small inline spinner for buttons/pending states

**Deliverable:** Complete design system; every later sprint only composes
these, never invents new base styling.

---

## Sprint 2 — Database & Core Infrastructure

Design and land the full schema. One `supabase/schemas/*.sql` file per
domain, following `supabase/schemas/001_profiles.sql`'s pattern (RLS
enabled, explicit policies, `updated_at` trigger via
`public.set_updated_at()`, which already exists there). Suggested file
breakdown:

| File | Tables |
|---|---|
| `002_workspaces.sql` | `workspaces`, `workspace_members`, `is_workspace_member()` (see "Read this first") |
| `003_clients.sql` | `clients`, `contacts` |
| `004_projects.sql` | `projects`, `milestones` |
| `005_tasks.sql` | `tasks`, `task_labels` (or a shared `tags` join — see `014_tags.sql`) |
| `006_time_entries.sql` | `time_entries` |
| `007_proposals.sql` | `proposals`, `proposal_line_items` |
| `008_contracts.sql` | `contracts`, `contract_templates` |
| `009_invoices.sql` | `invoices`, `invoice_items`, `payments` |
| `010_expenses.sql` | `expenses`, `expense_categories` |
| `011_files.sql` | `files` (metadata; binary lives in Supabase Storage — see Sprint 12) |
| `012_notes.sql` | `notes` (polymorphic: `notable_type` + `notable_id`) |
| `013_messages.sql` | `messages`, `message_threads` |
| `014_tags.sql` | `tags`, `taggings` (polymorphic join, shared across clients/projects/tasks) |
| `015_notifications.sql` | `notifications` |
| `016_activity_logs.sql` | `activity_logs` (append-only, `security definer` insert helper) |
| `017_settings.sql` | `workspace_settings` (branding, currency, tax defaults — see Sprint 15) |

Notes:

- Every table above gets `workspace_id` plus the `is_workspace_member()` RLS
  policy pattern from "Read this first" above.
- `notes`, `taggings`, and `activity_logs` are the only "polymorphic"
  tables (attach to more than one parent type) — use a `(target_type text,
  target_id uuid)` pair with a `check` constraint on allowed `target_type`
  values, and add an index on `(target_type, target_id)`.
- After every schema change: `pnpm run db:diff -- <name>` →
  `pnpm run db:reset` → `pnpm run db:types` (see `docs/library-docs.md`
  → Supabase section for the full workflow).

**Backend layer** (follows the Data Access Layer convention already
established in `src/features/auth/actions/` and
`src/features/profile/actions/`, generalized to every new feature):

- Repository pattern → this is already the Data Access Layer convention:
  one `actions/*.actions.ts` file per feature, no separate repository
  abstraction needed on top (`docs/architecture.md` → "Data layer
  architecture").
- Validation layer → Zod schemas per feature, already the pattern
  (`docs/coding-standards.md` → "Forms").
- Permission system → a `hasWorkspaceRole(workspaceId, role)` helper next
  to `is_workspace_member()`, used both in RLS policies and in Server
  Actions that need to gate by role (e.g., only `owner`/`admin` can delete
  an invoice).
- Audit logging → a small `logActivity()` helper in `src/lib/`, called from
  Server Actions after a mutating operation succeeds; writes to
  `activity_logs`.

**Deliverable:** Complete schema applied locally, RLS verified, types
regenerated.

---

## Sprint 3 — Authentication & User Management

**Already done by the starter kit:** signup, login, magic links, forgot
password, reset password, session management, protected routes, email
verification (all in `src/features/auth/`).

**New work — extend the profile:**

- Avatar upload to Supabase Storage (`profiles.avatar_url` already exists
  in the schema; the upload flow itself doesn't — add a bucket + policy
  and wire it into `src/features/profile/components/profile-form.tsx`).
- Account deletion (a Server Action that deletes the `auth.users` row via
  the service-role client, cascading to `profiles` and everything with a
  `workspace_id`/`user_id` foreign key onto it).
- Email-change flow (Supabase supports this via
  `supabase.auth.updateUser({ email })` plus a confirmation link; add a
  form + Server Action following the existing auth pattern).

**Deliverable:** Profile management complete; no further auth work needed
before building product features.

---

## Sprints 5–15 — Feature Sprints

Each sprint below builds the feature layer (Server Actions, TanStack Query
hooks, TanStack Form, routes under `src/app/(dashboard)/`) on top of the
schema Sprint 2 already landed — the same "schema exists, build the
feature" shape as Sprint 3, generalized to `docs/architecture.md` →
"Feature data flow pattern". Build them in this order; each one becomes
progressively more useful once the sprints before it exist (e.g. Invoicing
in Sprint 10 reads from Projects/Tasks in Sprint 7).

| Sprint | Feature | Schema (Sprint 2) |
|---|---|---|
| 5 | Workspaces & members | `002_workspaces.sql` |
| 6 | Clients & contacts | `003_clients.sql` |
| 7 | Projects, milestones & tasks | `004_projects.sql`, `005_tasks.sql` |
| 8 | Time tracking | `006_time_entries.sql` |
| 9 | Proposals & contracts | `007_proposals.sql`, `008_contracts.sql` |
| 10 | Invoicing & payments | `009_invoices.sql` |
| 11 | Expenses | `010_expenses.sql` |
| 12 | File attachments (Supabase Storage) | `011_files.sql` |
| 13 | Notes & messaging | `012_notes.sql`, `013_messages.sql` |
| 14 | Tags & notifications | `014_tags.sql`, `015_notifications.sql` |
| 15 | Activity logs & workspace settings | `016_activity_logs.sql`, `017_settings.sql` |

Each sprint's deliverable is the same shape: list view (`ActionBar` +
table/cards + `EmptyState` from Sprint 1), detail view, create/edit form
(TanStack Form + the feature's Zod schema), and the Server Actions/query
hooks backing all three — verified against
`docs/coding-standards.md`'s checklist before moving to the next sprint.

---

## Sprint 4 — Production Polish

Not a feature sprint — a hardening pass across everything built so far.
Run this **after** Sprints 5–15, not before (there's little to harden
until the feature sprints exist) — it's numbered 4 only because it was
adapted from the starter kit's original phase-based plan; treat the
sprints as an ordered list, not literal chronology by number.

- **Performance:** code splitting and lazy loading are mostly automatic
  with the App Router; focus effort on database indexes (every
  `workspace_id` and every foreign key used in a `where`/`join` from
  Sprints 5–15 should have one — audit `supabase/schemas/` for missing
  ones), image optimization (`next/image`, already configured for
  Supabase Storage in `next.config.ts`), and bundle size (check what
  Sprint 1's chart/PDF/drag-and-drop libraries cost and code-split them to
  the routes that use them).
- **Security:** re-run the RLS check from `docs/coding-standards.md`'s
  verification checklist against every table added since Sprint 2; add
  rate limiting to any public-facing route (proposal/contract approval
  links from Sprint 9 are the main candidates, since they're accessed
  without auth) — the starter kit ships with baseline rate limiting via
  `@upstash/ratelimit` in `src/lib/rate-limit.ts` (auth: 5 req / 5 min,
  general: 100 req / min), enforced in `src/proxy.ts` and Server Actions.
- **UX:** accessibility pass, responsive check on every feature built,
  keyboard shortcuts, a command palette (Sprint 1's `command` primitive,
  wired up globally with a feature-scoped Zustand store and a global
  `Cmd+K` keydown listener), consistent empty/loading/error states (the
  Sprint 1 `EmptyState`/`LoadingSpinner` components should already make
  this mostly consistent if used throughout — this sprint is the audit,
  not the first implementation).
- **QA:** unit tests for Zod schemas and pure logic (invoice numbering,
  recurring-date calculation — following the pattern already established
  for the starter's own schemas, see `docs/coding-standards.md` →
  "Testing"), integration tests for Server Actions (against a local
  Supabase instance), end-to-end tests for the critical paths (signup →
  create workspace → create client → send proposal → convert to project →
  track time → send invoice).
- **Deployment:** production deploy (Vercel + hosted Supabase are the path
  of least resistance for this stack), monitoring/logging/analytics (not
  yet a dependency — add one), backup strategy (Supabase's built-in
  backups, verify retention matches your needs), CI/CD (the starter ships
  a baseline `.github/workflows/ci.yml` — typecheck/lint/test/build; add a
  deploy step once you have a target), and documentation (update `docs/`
  to reflect the finished product, not just the starter kit's generic
  scaffolding).

**Deliverable:** Production-ready <Project_Name>.

---

## Sequencing notes

The sprint order above follows the pasted roadmap as-is, with one
addition: Sprint 4 ("Production Polish") is placed last in practice even
though it's numbered before the feature sprints, since it's a hardening
pass over work that doesn't exist yet at Sprint 4's original position in
the numbering. If you're picking sprints up individually rather than in
order, treat "Sprint 4" as "the last sprint" regardless of its number.

## What's V2 (don't build yet)

Things that came up while planning the above but that add real complexity
and aren't needed for a first production launch — revisit only once
Sprints 5–15 and Sprint 4 are done and the product has real users:

- Multi-currency support (Sprint 10's invoicing assumes a single
  workspace-level currency from `017_settings.sql`).
- Recurring invoices / subscriptions billing.
- Client-facing portal (a separate, more restricted auth surface from the
  team-facing app built above).
- Custom fields / configurable schemas per workspace.
- Third-party integrations (accounting software, calendar sync, Slack).
- Advanced reporting/analytics beyond the Sprint 1 `StatCard` dashboard
  widgets (e.g. a full BI-style report builder).
