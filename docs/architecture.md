# Architecture

## High-level shape

```
Browser
  │
  ├─ Server Components (default) ──► Supabase (server client, cookies-bound)
  │                                     │
  ├─ Client Components ("use client")  │
  │     │                              │
  │     ├─ TanStack Query ─────────────┤ (calls Server Actions as queryFn/mutationFn)
  │     └─ Zustand (local UI state)    │
  │                                    ▼
  └─ src/proxy.ts (session refresh,  Postgres (Row Level Security)
     route protection)
```

There is no separate REST/GraphQL API layer. Server Actions
(`"use server"` functions in `features/*/actions/`) *are* the API — called
directly from Server Components for initial render, and from TanStack Query
hooks for client-side refetches and mutations. This keeps one implementation
of each operation instead of a route handler that duplicates action logic.

## Request lifecycle (protected page, first load)

1. Request hits `src/proxy.ts` (Next's request-boundary layer, formerly
   `middleware.ts`).
2. `updateSession()` (`src/lib/supabase/middleware.ts`) refreshes the
   Supabase auth cookie and, if the route is in `PROTECTED_ROUTE_PREFIXES`
   with no user, redirects to `/login?redirectTo=<original path>`.
3. The page's Server Component runs, creates a fresh
   `createClient()` (`src/lib/supabase/server.ts`) bound to the
   request's cookies, and calls `supabase.auth.getUser()` — this
   round-trips to Supabase to validate the JWT, unlike `getSession()`.
4. Data is fetched directly in the Server Component (see
   `(dashboard)/dashboard/page.tsx`) or delegated to a feature's `actions/`
   functions.
5. The page renders server-side; any Client Components inside hydrate and
   take over their own data fetching via TanStack Query from there.

## Auth architecture

Three Supabase client constructors, each scoped to where it's safe to use:

- `src/lib/supabase/client.ts` — browser client, for Client Components.
  Create it inside the component/hook, not at module scope.
- `src/lib/supabase/server.ts` — `createClient()` for Server
  Components/Actions/Route Handlers (cookie-bound, RLS-respecting), plus
  `createServiceRoleClient()` for trusted server-only operations that must
  bypass RLS (cron jobs, webhooks). The latter throws if called from
  anything that looks like a client bundle.
- `src/lib/supabase/middleware.ts` — a third, request/response-bound client
  used only inside `proxy.ts`, because the cookie read/write contract there
  is different from both of the above.

Auth flows and where they resolve:

| Flow | Entry point | Resolves at |
|---|---|---|
| Email/password sign in | `signInWithPassword` action | Redirects immediately |
| Email/password sign up | `signUpWithPassword` action | `/auth/confirm?type=signup` |
| Magic link | `signInWithMagicLink` action | `/auth/confirm?type=magiclink` |
| OAuth (Google/GitHub) | `signInWithOAuth` action | `/auth/callback` (PKCE code exchange) |
| Password reset request | `requestPasswordReset` action | `/auth/confirm?type=recovery` → `/reset-password` |

Route protection: protected route prefixes are declared in
`src/constants/auth.ts` (`PROTECTED_ROUTE_PREFIXES`) — add new protected
sections there, not by duplicating redirect logic elsewhere. Session refresh
and the actual redirect happen in `src/proxy.ts` →
`src/lib/supabase/middleware.ts` (see "Request lifecycle" above).

In Client Components, read the current user via the `useUser()` hook
(`src/features/auth/hooks/use-user.ts`), which wraps
`supabase.auth.getUser()` in a TanStack Query cache kept in sync with
`onAuthStateChange`.

## Data layer architecture

Each feature's `actions/` file is its Data Access Layer: the only place that
talks to Supabase for that feature. Rules enforced there:

- Re-validate input with the feature's Zod schema, even though the form
  already validated client-side — Server Actions are a public network
  boundary.
- Re-derive the current user from `auth.getUser()` server-side; never accept
  a `userId` field from the client for authorization purposes.
- Row Level Security is the last line of defense, not the only one — a bug
  in application logic should still fail closed at the database.
- Return the shared `ActionResult<T>` type (`src/types/index.ts`) rather
  than throwing for expected failures — see `docs/coding-standards.md` →
  "Server Actions" for the exact convention and a narrowing gotcha to
  avoid.

TanStack Query hooks (`features/*/hooks/`) are a thin caching layer on top
of the actions. Give each feature a query key factory (e.g. `{ all, list(filters), detail(id) }`)
so invalidation after a mutation reliably catches every related query,
rather than hand-writing ad hoc key arrays per hook.

## Client state architecture

Two kinds of "state that isn't a single component's":

- **Server state** (anything that ultimately comes from Supabase) →
  TanStack Query. Never duplicated into Zustand.
- **Client-only UI state** (a filter selection, a search box's current
  value, a sidebar's open/closed state) → Zustand, scoped to the feature
  that owns it (`features/<name>/store/`) unless genuinely app-wide, in
  which case it goes in `src/stores/` (see `src/stores/ui-store.ts` for the
  app-wide pattern).

## Styling architecture

Tailwind CSS v4 with CSS-first configuration — there is no
`tailwind.config.js`; theme tokens are defined in `src/app/globals.css`
under `@theme inline`, sourced from CSS variables in `:root`/`.dark`. shadcn/ui
components are copied into `src/components/ui/` and are meant to be edited
directly (they're your code, not a dependency) rather than wrapped.

## Directory reference

```
src/
├── app/            # routes only: layout, page, route handlers. Keep thin —
│                   # delegate to features/ for anything non-trivial.
├── components/     # app-wide, cross-feature building blocks
│   └── ui/         # shadcn/ui primitives (installed via `pnpm dlx shadcn add`)
├── configs/        # static app configuration (site metadata, etc.)
├── constants/      # shared constant values (route lists, enums as consts)
├── features/       # feature-scoped code — see below
├── hooks/          # app-wide hooks not tied to one feature
├── lib/            # framework glue: supabase clients, query-client, utils
├── stores/         # app-wide Zustand stores (rare — prefer feature stores)
├── types/          # app-wide hand-written types
└── proxy.ts        # Next.js request boundary (formerly `middleware.ts`)
```

Each feature under `src/features/<name>/` owns its own slice, using only the
subfolders it needs:

```
features/<name>/
├── actions/     # Server Actions ("use server") — the data access layer
├── api/         # client-side fetch wrappers, if a feature calls a
│                # non-Supabase HTTP API
├── components/  # feature-scoped UI, composed from components/ui
├── hooks/       # TanStack Query hooks wrapping actions/api
├── schemas/     # Zod schemas — the single source of truth for shape +
│                # validation, shared by both the form and the server action
├── store/       # feature-scoped Zustand store (client-only UI state)
└── types/       # feature-scoped types (often derived from schemas or
                 # `Tables<'table_name'>` from lib/supabase/types)
```

**Rule of thumb:** a feature never imports from another feature's internals.
Cross-feature composition happens in `src/app/**` (routes) or
`src/components/**` (shared UI), not feature-to-feature.

## Feature data flow pattern

Follow this for every new feature:

1. **Schema first** — define the Zod schema in `features/<name>/schemas/`.
   Both the form and the server action validate against it, so validation
   logic never drifts.
2. **Server Action** in `features/<name>/actions/` does the actual Supabase
   call. Re-validate with the schema, re-check `auth.getUser()` — never
   trust a client-supplied user id. Row Level Security is the backstop, not
   the only check.
3. **TanStack Query hook** in `features/<name>/hooks/` wraps the action as a
   `queryFn`/`mutationFn`. Server Actions can be called directly from
   client-side query/mutation functions — no separate REST route needed.
4. **TanStack Form** in the component calls `useForm` with
   `validators: { onBlur: schema }` (or `onChange`/`onSubmit`), passing the
   Zod schema straight through — v1 supports Standard Schema natively.
5. **Component** renders `form.Field`, submits via the mutation hook.

See `src/features/auth/` and `src/features/profile/` for worked examples of
the Server Action / schema layers; neither has the TanStack Query list/
mutation hooks yet, so your first CRUD feature will be the first full
end-to-end reference in this codebase — that's expected.
