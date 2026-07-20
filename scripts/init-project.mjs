#!/usr/bin/env node
/**
 * Interactive setup for a new project cloned from this starter template.
 *
 * Updates `package.json`'s `name` field and `src/configs/site-config.ts`'s
 * `name` / `author` / `links.github` fields. Everything else in
 * `docs/getting-started-checklist.md` (branding assets, the Supabase
 * project, git remotes) needs a human, so this script prints those as
 * follow-up steps rather than attempting them.
 *
 * Safe to re-run: it only rewrites the specific known fields below, by
 * matching their current literal values — if a field has already been
 * customized away from the template's placeholder, it's left alone and
 * reported as "already set" rather than overwritten.
 */

import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PKG_PATH = `${ROOT}package.json`;
const SITE_CONFIG_PATH = `${ROOT}src/configs/site-config.ts`;

const PLACEHOLDERS = {
  pkgName: "nextjs-supabase-starter-kit",
  siteName: "Starter Kit",
  authorName: "Your Name",
  authorUrl: "https://your-domain.com",
  githubUrl: "https://github.com/your-org/your-repo",
};

function toKebabCase(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * A minimal question-prompt built directly on `readline`'s `line` event
 * rather than `question()`. Both the promise-based and classic
 * callback-style `question()` reliably hang after the *first* call when
 * stdin isn't a TTY (piped input) on current Node versions.
 *
 * The subtler trap: when stdin is piped, readline can emit *all* buffered
 * `line` events synchronously, back-to-back, before this script's async
 * `ask()` calls have each had a chance to run and register as a
 * consumer — so a naive "resolve whichever `ask()` is currently pending"
 * queue silently drops every line after the first. This implementation
 * is a proper producer/consumer queue: lines are buffered as they arrive
 * regardless of whether anything is waiting yet, and `ask()` drains the
 * buffer first before registering a new waiter. It also resolves any
 * still-pending `ask()` with `""` once stdin ends, so piping in fewer
 * answers than there are questions can't hang the process.
 */
function createPrompter() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  const lineBuffer = [];
  const waiters = [];
  let ended = false;

  rl.on("line", (line) => {
    const waiter = waiters.shift();
    if (waiter) {
      waiter(line.trim());
    } else {
      lineBuffer.push(line.trim());
    }
  });
  rl.on("close", () => {
    ended = true;
    for (const waiter of waiters.splice(0)) {
      waiter("");
    }
  });

  return {
    ask(question, fallback) {
      process.stdout.write(`${question}${fallback ? ` [${fallback}]` : ""}: `);
      return new Promise((resolve) => {
        const settle = (answer) => resolve(answer || fallback || "");
        if (lineBuffer.length > 0) {
          settle(lineBuffer.shift());
        } else if (ended) {
          settle("");
        } else {
          waiters.push(settle);
        }
      });
    },
    close() {
      rl.close();
    },
  };
}

async function promptAnswers() {
  const prompter = createPrompter();

  console.log("Project setup — press Enter to skip a field.\n");

  const projectName = await prompter.ask(
    'Project name (human-readable, e.g. "Acme Dashboard")'
  );
  const authorName = await prompter.ask("Your name or team name");
  const authorUrl = await prompter.ask("Your website (e.g. https://acme.com)");
  const githubUrl = await prompter.ask(
    "Repository URL (e.g. https://github.com/acme/dashboard)"
  );

  prompter.close();
  return { projectName, authorName, authorUrl, githubUrl };
}

async function updatePackageJson(projectName) {
  if (!projectName) {
    return { changed: false, reason: "no project name given" };
  }
  const raw = await readFile(PKG_PATH, "utf8");
  const pkg = JSON.parse(raw);

  if (pkg.name !== PLACEHOLDERS.pkgName) {
    return {
      changed: false,
      reason: `"name" already set to "${pkg.name}", left alone`,
    };
  }

  pkg.name = toKebabCase(projectName);
  await writeFile(PKG_PATH, `${JSON.stringify(pkg, null, 2)}\n`);
  return { changed: true, value: pkg.name };
}

async function updateSiteConfig({
  projectName,
  authorName,
  authorUrl,
  githubUrl,
}) {
  let src = await readFile(SITE_CONFIG_PATH, "utf8");
  const changes = [];

  const replacements = [
    [
      projectName,
      `name: "${PLACEHOLDERS.siteName}"`,
      `name: "${projectName}"`,
      "site name",
    ],
    [
      authorName,
      `name: "${PLACEHOLDERS.authorName}"`,
      `name: "${authorName}"`,
      "author name",
    ],
    [
      authorUrl,
      `url: "${PLACEHOLDERS.authorUrl}"`,
      `url: "${authorUrl}"`,
      "author url",
    ],
    [
      githubUrl,
      `github: "${PLACEHOLDERS.githubUrl}"`,
      `github: "${githubUrl}"`,
      "github link",
    ],
  ];

  for (const [value, from, to, label] of replacements) {
    if (!value) {
      continue;
    }
    if (!src.includes(from)) {
      changes.push({
        label,
        changed: false,
        reason: "already customized, left alone",
      });
      continue;
    }
    src = src.replace(from, to);
    changes.push({ label, changed: true, value });
  }

  await writeFile(SITE_CONFIG_PATH, src);
  return changes;
}

async function main() {
  const answers = await promptAnswers();

  const pkgResult = await updatePackageJson(answers.projectName);
  const siteConfigResults = await updateSiteConfig(answers);

  console.log("\n--- Results ---");
  if (pkgResult.changed) {
    console.log(`✓ package.json name → "${pkgResult.value}"`);
  } else {
    console.log(`- package.json name: skipped (${pkgResult.reason})`);
  }
  for (const r of siteConfigResults) {
    console.log(
      r.changed
        ? `✓ site-config.ts ${r.label} → "${r.value}"`
        : `- site-config.ts ${r.label}: skipped (${r.reason})`
    );
  }

  console.log(
    "\nThis only covers the mechanical fields. See docs/getting-started-checklist.md " +
      "for what's left: branding assets (public/og.png, src/app/icon.png), " +
      "the Supabase project, and pointing git at your own repository."
  );
}

main().catch((error) => {
  console.error("init-project failed:", error);
  process.exitCode = 1;
});
