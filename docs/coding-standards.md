# Coding Standards

Most formatting is enforced automatically by Biome/Ultracite
(`pnpm run fix`) — this document covers conventions the linter can't
enforce.

## TypeScript

- `strict` and `strictNullChecks` are on. Don't work around a type error
  with `any` or `as` — fix the type or narrow it properly.
- `noUncheckedIndexedAccess` is on: array/object index access returns
  `T | undefined`. Handle the `undefined` case rather than asserting it
  away.
- Prefer `type` for object shapes and unions; use `interface` only when you
  need declaration merging (rare in application code).
- Derive types from Zod schemas (`z.infer<typeof schema>`) or from the
  generated Supabase types (`Tables<'table_name'>`) instead of hand-writing
  a parallel type that can drift out of sync.

## Naming

- Files: `kebab-case.tsx` / `kebab-case.ts`.
- Components, types, Zod-inferred types: `PascalCase`.
- Functions, variables, hooks: `camelCase`. Hooks are prefixed `use*`.
- Server Actions read as verbs on the resource: `createX`, `updateX`,
  `deleteX`, `getXs` — e.g. `updateProfile`, `getCurrentProfile` (see
  `src/features/profile/actions/profile.actions.ts`) — not `xCreate` or
  `handleCreateX`.
- Constants that are truly fixed (route lists, enum-like unions): `SCREAMING_SNAKE_CASE`
  for the array/object, `camelCase`/`PascalCase` for the derived type.

## Components

- Server Components by default. Add `"use client"` only at the point where
  you actually need hooks, event handlers, or browser APIs — push it as
  deep in the tree as possible rather than marking a whole page client-side.
- One component per file, named the same as the file
  (`login-form.tsx` → `LoginForm`).
- Props: inline the type for simple components
  (`{ title }: { title: string }`); extract a named `type Props` only when
  it's reused or has more than ~4 fields.
- Don't introduce a new UI primitive in `components/ui/` by hand — use
  `pnpm dlx shadcn@latest add <component> -b base-ui` so it matches the
  installed style (`components.json`) and primitive library (Base UI, not
  Radix) already used in this kit.
- To compose a styled component (`Button`, `DialogTrigger`, `DropdownMenuItem`,
  ...) with another element — e.g. rendering a `Button` as a `next/link` —
  use Base UI's `render` prop, not Radix's `asChild`:
  `<Button render={<Link href="/dashboard" />}>Dashboard</Button>`. The
  target element goes in `render` with no children of its own; the visible
  content stays as the styled component's children.
- Co-locate a component with its feature (`features/<name>/components/`)
  unless at least two features need it — then promote it to
  `src/components/`.

## Forms

- Every form's shape is defined once, in `features/*/schemas/*.schema.ts`,
  and reused for both `useForm`'s `validators` and the Server Action's
  `safeParse`. Never hand-write a second validation path.
- Validate `onBlur` for most fields; use `onChange` only where instant
  feedback clearly helps (e.g. password strength) since it re-renders more
  aggressively.
- Read errors via `field.state.meta.errors` and render them with the
  `FieldError` component (`components/ui/field.tsx`) — don't build ad hoc
  error UI per form.

## Server Actions

- Always re-validate input with the Zod schema, even though the client
  already did. A Server Action is a public endpoint.
- Always re-derive the user from `supabase.auth.getUser()`; never trust an
  id passed in from the client for authorization.
- Return the shared `ActionResult<T>` type (`src/types/index.ts`) —
  `{ data: T }` or `{ error: string }` — instead of throwing for expected
  failure cases (validation errors, "not found", permission denied).
  Reserve thrown errors for genuinely unexpected failures. Every action in
  `auth.actions.ts` and `profile.actions.ts` uses this type; don't
  introduce a second result shape.
  - **Gotcha:** narrow the result with `result.error !== undefined`, not
    `if (result.error)`. Since `error` is typed `string`, a truthy check
    doesn't let TypeScript exclude the `{ data: T }` branch — an empty
    string is falsy but is still, technically, the error branch — so
    `result.data` stays typed as possibly `undefined` after the check.
    `!== undefined` narrows correctly either way.
  - For an action whose only success path ends in `redirect()` (which
    never returns), type it `ActionResult<never>` — this makes the type
    system reflect that it only ever *returns* on the error path.
- Validate any user-supplied redirect target with `getSafeRedirectPath`
  (`src/lib/safe-redirect.ts`) before passing it to `redirect()`. A raw
  `?redirectTo=` (or similar) query param is attacker-controlled and,
  unvalidated, becomes an open redirect — see `signInWithPassword` and
  `app/auth/callback/route.ts` for the pattern.
- Call `revalidatePath()` for any path whose cached data the mutation
  affects.

## Data fetching

- Read data directly in Server Components where the data is only needed for
  first render.
- Use a TanStack Query hook when a Client Component needs to fetch,
  refetch, or mutate that data after the initial render.
- Query keys follow a factory pattern per feature — e.g.
  `{ all: ['clients'], list: (filters) => [...all, 'list', filters], detail: (id) => [...all, 'detail', id] }`
  — don't hand-write ad hoc key arrays that could drift and break
  invalidation.

## Database (Supabase)

- Every table gets Row Level Security enabled and explicit policies for
  each operation you actually need (`select`/`insert`/`update`/`delete`) —
  don't add a blanket "allow all to authenticated" policy.
- Prefer `auth.uid() = user_id`-style ownership checks over
  application-level filtering wherever possible; it protects the table even
  if a future code path forgets to filter.
- Add an index for any column you filter or join on regularly (e.g.
  `<table>_<column>_idx`).
- Name triggers and functions descriptively (`set_profiles_updated_at`, not
  `trg1` — see `supabase/schemas/001_profiles.sql`) — an agent reading the
  schema cold should understand intent from names alone.

## Testing

- Unit-test pure logic with Vitest (`pnpm run test`): Zod schemas
  (`*.schema.test.ts`, alongside the schema) and standalone helpers like
  `src/lib/safe-redirect.ts`. See existing tests for the pattern.
- Server Actions themselves aren't unit-tested (they need a real or local
  Supabase instance) — that's an integration-test concern, not currently
  set up in this starter (see `docs/project-overview.md` → "Known
  limitations").
- Don't test Biome/TypeScript-enforced things (formatting, type errors) —
  test behavior: given this input, does the schema/function return the
  right result.

## Comments

- Explain *why*, not *what* — the code should be legible enough that a
  comment restating it adds nothing. Reserve comments for non-obvious
  constraints (see the ordering comment in `middleware.ts` around
  `getUser()`) and for JSDoc on exported functions that aren't
  self-explanatory from their name and types alone.

## Dependencies

- Don't reach for a new npm package without checking `package.json` first;
  this stack already covers forms, validation, data fetching, and client
  state.
- Biome/Ultracite formats on save and enforces most style rules — don't
  hand-format against its output; run `pnpm run fix` instead.

## Environment & secrets

- Never commit `.env` (only `.env.example`).
- Never log or expose `SUPABASE_SERVICE_ROLE_KEY` to the client — it's
  server-only (see `createServiceRoleClient()` in
  `src/lib/supabase/server.ts`, which throws if called from client code).
- All environment variables are validated at startup through `src/env.ts` —
  add new ones to its Zod schemas rather than reading `process.env`
  directly elsewhere.

## Commits (if using conventional commits)

`type(scope): summary`, e.g. `feat(profile): add avatar upload`,
`fix(auth): correct redirect after magic link`. Scope is usually the
feature folder name.

## Verification checklist before finishing a task

- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run check` passes (or `pnpm run fix` was run)
- [ ] `pnpm run test` passes; new pure logic (schemas, helpers) has tests
- [ ] New tables have RLS enabled with explicit policies
- [ ] New forms validate with a Zod schema shared by the Server Action
- [ ] New protected routes are added to `PROTECTED_ROUTE_PREFIXES` if needed
- [ ] Any new user-supplied redirect target goes through `getSafeRedirectPath`
- [ ] `docs/progress-tracker.md` updated if you completed a sprint-plan item
