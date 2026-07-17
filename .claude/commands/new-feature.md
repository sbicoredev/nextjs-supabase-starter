---
description: Scaffold a new feature folder following this repo's conventions
---

Scaffold a new feature named `$ARGUMENTS` under `src/features/`.

Follow the pattern documented in `docs/architecture.md` under "Feature
data flow pattern":

1. Create `src/features/$ARGUMENTS/schemas/$ARGUMENTS.schema.ts` with a Zod
   schema for the primary shape.
2. Create `src/features/$ARGUMENTS/types/$ARGUMENTS.types.ts` re-exporting
   the relevant `Tables<'...'>` type from `src/lib/supabase/types.ts` (ask
   me for the table name if it doesn't exist yet — offer to draft the SQL
   schema file too).
3. Create `src/features/$ARGUMENTS/actions/$ARGUMENTS.actions.ts` with
   "use server" Server Actions that validate against the schema and check
   `auth.getUser()` before touching data.
4. Create `src/features/$ARGUMENTS/hooks/` with TanStack Query hooks
   wrapping those actions.
5. Create `src/features/$ARGUMENTS/components/` with a form (TanStack Form +
   the Zod schema) and a list/detail view, built from `src/components/ui`.
6. Wire up route(s) under `src/app/(dashboard)/$ARGUMENTS/` if this feature
   needs its own pages.

After scaffolding, run `pnpm run typecheck` and `pnpm run check`.
