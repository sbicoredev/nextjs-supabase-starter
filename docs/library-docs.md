# Library Docs & Reference

Quick reference and gotchas for the key libraries in this starter, plus
where to look up the real docs when something isn't covered here. Package
versions are pinned in `package.json` — check there before assuming an API.

## Next.js (App Router)

- Docs: https://nextjs.org/docs
- This project uses **`src/proxy.ts`**, not `middleware.ts` — Next.js 16
  renamed the request-boundary file convention. It exports a `proxy`
  function instead of `middleware`, but the API (`NextRequest`,
  `NextResponse`, `matcher`) is unchanged. If you're referencing older
  tutorials, mentally substitute `middleware` → `proxy`.
- `params` and `searchParams` in Server Components are `Promise`s and must
  be `await`ed (see `(auth)/login/page.tsx`'s `searchParams` usage for a
  working example).
- Server Actions live next to the feature that owns them
  (`features/*/actions/`), not in `app/api/`. Only reach for a Route
  Handler when you need a non-Server-Action HTTP endpoint (webhooks, OAuth
  callbacks — see `app/auth/callback/route.ts`).

## Supabase (`@supabase/ssr`, `@supabase/supabase-js`)

- Docs: https://supabase.com/docs
- Always use `supabase.auth.getUser()` server-side for authorization
  decisions, never `getSession()` — `getSession()` reads the JWT from the
  cookie without revalidating it against Supabase.
- Three client constructors, three contexts — see `docs/architecture.md`
  → "Auth architecture" for which one to use where.
- This repo uses Supabase's **declarative schema** workflow, not
  hand-written timestamped migrations:
  1. Edit the desired end-state directly in `supabase/schemas/*.sql`.
  2. Run `pnpm run db:diff -- <descriptive_name>` to generate a migration
     from the diff against your local DB.
  3. Review the generated migration in `supabase/migrations/` before
     applying.
  4. Run `pnpm run db:reset` locally to verify, then `pnpm run db:migrate` to
     apply to local supabase remote project.
  5. Run `pnpm run db:push` to apply to a linked remote project.
  6. Run `pnpm run db:types` to refresh `src/lib/supabase/types.ts`.

  Every table needs Row Level Security enabled and explicit policies — see
  `supabase/schemas/001_profiles.sql` for the pattern; new domain tables
  will typically need owner- or workspace-scoped
  select/insert/update/delete policies rather than profiles' simpler
  1:1-with-`auth.users` shape.
- CLI reference: https://supabase.com/docs/guides/local-development/cli/getting-started

## TanStack Query v5

- Docs: https://tanstack.com/query/latest
- `getQueryClient()` (`src/lib/query-client.ts`) returns a new client per
  request on the server and a stable singleton in the browser — don't
  instantiate `QueryClient` anywhere else.
- Query keys are factories per feature (e.g. `clientsKeys.list(filters)`,
  `clientsKeys.detail(id)`) so `invalidateQueries({ queryKey: clientsKeys.all })`
  reliably catches every related query.
- Mutations call `queryClient.invalidateQueries` (or `setQueryData` for a
  cheap optimistic update) `onSuccess` — see `docs/architecture.md` →
  "Feature data flow pattern" for the full request/response shape to
  follow.

## TanStack Form v1

- Docs: https://tanstack.com/form/latest
- v1 supports **Standard Schema** natively — pass a Zod schema straight into
  `validators: { onChange: schema }` / `onBlur` / `onSubmit`. There is no
  adapter package (`@tanstack/zod-form-adapter` is legacy/v0 and is **not**
  a dependency here).
- Field errors from a schema validator are objects
  (`{ message: string, ... }`), not plain strings — the `FieldError`
  component in `components/ui/field.tsx` already handles both shapes.
- Use `form.Subscribe` with a `selector` to read `canSubmit`/`isSubmitting`
  without re-rendering the whole form on every keystroke.

## Zod v4

- Docs: https://zod.dev
- Use top-level helpers introduced in v4: `z.email()`, `z.url()`,
  `z.uuid()` — not the v3-style `z.string().email()` chains.
- Error introspection uses the new top-level functions:
  `z.flattenError(result.error)`, `z.treeifyError(result.error)` (replacing
  `.flatten()` / `.format()` instance methods from v3).

## Zustand v5

- Docs: https://zustand.docs.pmnd.rs
- Keep stores small and feature-scoped (`features/*/store/`). Avoid
  app-wide stores; promote only when multiple unrelated features genuinely
  need the same state.
- Don't put server data in a Zustand store — that's what TanStack Query is
  for (see `docs/architecture.md` → "Client state architecture").

## shadcn/ui + Base UI + Tailwind CSS v4

- shadcn docs: https://ui.shadcn.com/docs
- This kit uses **Base UI** as the primitive library under shadcn/ui's
  styled components, not Radix. Package: `@base-ui/react` (subpath imports
  per component, e.g. `@base-ui/react/dialog`, `@base-ui/react/menu`).
  Base UI docs: https://base-ui.com/react/overview/quick-start
- Composition uses a `render` prop instead of Radix's `asChild` — see
  `docs/coding-standards.md` → "Components" for the pattern.
- State-based styling uses boolean-style data attributes —
  `data-[open]:`/`data-[closed]:` instead of Radix's
  `data-[state=open]:`/`data-[state=closed]:`; menu items use
  `data-[highlighted]:` instead of a focus pseudo-class; active tabs use
  `data-[active]:` instead of `data-[state=active]:`. Check the relevant
  `*DataAttributes` type export in `@base-ui/react` if a new component's
  styling states aren't obvious from the existing `components/ui/*` files.
- Tailwind v4 uses CSS-first config — there is no `tailwind.config.js`.
  Theme tokens live in `src/app/globals.css` (`:root`, `.dark`, and
  `@theme inline`). To add a new design token, define it in both places
  following the existing pattern (e.g. the `--warning` example in the
  shadcn theming docs).
- Add new components with `pnpm dlx shadcn@latest add <name> -b base-ui` —
  it reads `components.json` and writes into `src/components/ui/`, matching
  the `base-vega` style, Base UI primitives, and CSS-variable theming
  already configured. Omitting `-b base-ui` will pull the Radix version
  instead — don't mix the two libraries in one project.

## Biome / Ultracite

- Ultracite docs: https://www.ultracite.ai
- `biome.json` extends `ultracite/biome/core`, `ultracite/biome/next`, and
  `ultracite/biome/react`. Prefer adjusting rules there over disabling them
  inline; use `// biome-ignore lint/<rule>: <reason>` for genuine one-off
  exceptions.
- `pnpm run fix` both lints and formats — there's no separate step.

## Vitest

- Docs: https://vitest.dev
- Config: `vitest.config.ts`. Tests live next to what they test
  (`*.test.ts`), picked up by the `src/**/*.test.ts` glob.
- `pnpm run test` runs once (use this in CI and before finishing a task);
  `pnpm run test:watch` for local development.
- Scope: unit tests for pure logic only (Zod schemas, standalone helpers)
  — see `docs/coding-standards.md` → "Testing". No React Testing Library,
  no Supabase-backed integration tests, and no Playwright/e2e are set up
  in this starter yet.
