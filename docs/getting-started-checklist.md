# Getting started checklist

Everything to change when starting a **new** project from this template,
before writing any product code. If you have Node installed, run
`pnpm run init` instead of doing this by hand — see
"Automated: `pnpm run init`" below. This file documents what that script
does, and covers the couple of steps it can't do for you.

## 1. Identity

- [ ] `package.json` → `"name"` field
- [ ] `src/configs/site-config.ts` → `name`, `description`, `author`,
      `links.github`
- [ ] `.env` → `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL` (once you have
      a real domain)
- [ ] `LICENSE` → copyright holder name (currently a placeholder)

## 2. Branding assets

- [ ] `public/og.png` — replace the generic placeholder social-preview
      image (referenced by `siteConfig.ogImage`)
- [ ] `src/app/icon.png` / `src/app/apple-icon.png` — replace the generic
      placeholder app icon (Next.js's App Router picks these up
      automatically; no metadata wiring needed once you swap the files)
- [ ] Tailwind theme colors in your global CSS, if you want something
      other than the default shadcn palette

## 3. Supabase project

- [ ] Create a Supabase project (or use a local one via
      `pnpm run db:start`) and fill in `.env`'s Supabase keys
- [ ] Run the setup in `docs/project-overview.md` → "What you'll
      typically do first" to apply migrations and generate types
- [ ] If you're using OAuth, configure providers in the Supabase
      Dashboard (see `README.md` → "OAuth setup")
- [ ] Set your production `site_url` and redirect URLs in the Supabase
      Dashboard (Authentication → URL Configuration) once you have a
      production domain — `supabase/config.toml`'s `localhost`/
      `127.0.0.1` values are for local dev only

## 4. Repository

- [ ] Point `git remote` at your new repository (or use "Use this
      template" on GitHub if this repo is marked as a template — see
      Settings → General → Template repository)
- [ ] Update `docs/sprint-plan.md` and `docs/progress-tracker.md` for
      your actual product (both start as blank fill-in templates — see
      the note at the top of each)
- [ ] Review `docs/project-overview.md` → "Known limitations" and
      `docs/progress-tracker.md` → "Known issues" for anything in the
      starter itself you should be aware of before building on top of it

## Automated: `pnpm run init`

Runs `scripts/init-project.mjs`, which handles the mechanical parts of
section 1 above interactively: it prompts for your project's name,
author, and repository URL, then updates `package.json` and
`src/configs/site-config.ts` for you. It does **not** touch branding
assets, the Supabase project, or git remotes — those need a human either
way (a real logo, a real Supabase project, a real repo).

```bash
pnpm run init
```

Safe to run more than once; it only rewrites the specific fields listed
above; it never touches files it doesn't recognize the shape of.
