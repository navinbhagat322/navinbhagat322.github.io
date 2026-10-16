# navinbhagat322.github.io

Portfolio of **Navin Kumar**, built as a terminal you can actually use:

- **command blocks**: every command runs in its own block with status and timing
- **rich output**: project cards, a timeline, SQL result tables, copyable contact rows
- **autosuggest**: syntax highlighting, fish-style ghost suggestions (→ to accept), Tab completion, history
- **⌘K command palette**: fuzzy search over commands, projects and actions
- **ask in plain English**: a small rule-based agent shows its plan and tool calls, writes the SQL it needs, then answers
- **query my résumé with SQL**: `sql SELECT name, year FROM projects ORDER BY year DESC`
- **Vink**: a little rigged version of me standing on the command bar. His eyes follow your cursor, his glasses glow while he thinks, he reacts to what you do (thinks, types, shrugs, dances, naps), wanders around, and you can poke him or pick him up and drag him
- **quests**: 13 achievements (two of them secret), XP and levels, one quiet toast at a time (Vink announces level-ups instead), and a confetti ending at 100%. `quests` shows progress
- **recruiter fast path**: one button (or `tldr`, or [`?tldr`](https://navinbhagat322.github.io/?tldr)) shows a 30-second summary; Vink stays quiet while it's open
- **live GitHub feed**: `activity` shows what I shipped this week (public commits only), the opening screen shows "last commit …", and Vink mentions the latest one
- **neural background**: a quiet neural network behind everything. Neurons fire on their own and signals cascade along connections; the cursor acts as a neuron, clicking empty space fires a spike, and it gets busier while Vink thinks
- dark and light themes, a mobile layout, and a plain page at [`?plain`](https://navinbhagat322.github.io/?plain)

Live: https://navinbhagat322.github.io

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + build to dist/
npm run preview   # serve dist/
```

Vite + vanilla TypeScript, no framework, no backend.

## Layout

```
src/
  content.ts    everything the site says. edit this, not the engine
  shell.ts      the engine: blocks, composer, highlighting, suggestions, history
  commands.ts   every command (help, projects, sql, ask, theme, …)
  views.ts      rich output: cards, timeline, tables, hero
  palette.ts    the ⌘K command palette
  agent.ts      the rule-based "agent" for English questions
  sql.ts        a tiny read-only SQL engine over the résumé tables
  vink.ts       Vink: the SVG character, poses, speech bubble, confetti
  game.ts       quests, XP and levels (saved in localStorage)
  play.ts       wires Vink and quests to the shell; quests / vink commands
  plain.ts      the plain HTML version (?plain)
  theme.ts      dark / light
  ui.ts         DOM helpers and icons
  neural.ts     the neural-network background (canvas)
  main.ts       window chrome and wiring
```

Useful URLs: `/?plain`, `/?cmd=projects`, `/?q=what+is+ternodbi`

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.
It also runs nightly, and before each build `npm run activity` (scripts/fetch-activity.mjs) pulls my latest
public commits into `public/activity.json` (git-ignored), so the activity feed stays current on its own.
Run `npm run activity` locally to refresh it during development.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

---
