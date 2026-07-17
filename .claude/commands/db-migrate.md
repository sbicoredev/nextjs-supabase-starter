---
description: Generate and review a Supabase migration from schema changes
---

I've edited one or more files in `supabase/schemas/`. Help me turn that into
a migration:

1. Run `pnpm run db:diff -- $ARGUMENTS` (use a short, descriptive name if I
   didn't provide one as an argument).
2. Show me the generated file in `supabase/migrations/` and explain what it
   does in plain terms, calling out anything destructive (drops, renames,
   type changes) that could lose data.
3. Confirm every new/changed table has Row Level Security enabled with
   explicit policies — flag any that don't, following the pattern in
   `supabase/schemas/001_profiles.sql`.
4. Once I confirm it looks right, run `pnpm run db:migrate` to apply it locally
   and `pnpm run db:types` to refresh `src/lib/supabase/types.ts`.
