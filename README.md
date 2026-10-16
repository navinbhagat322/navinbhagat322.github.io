# navinbhagat322.github.io

Portfolio of **Navin Kumar**, built as a terminal you can actually use:

- **command blocks**: every command runs in its own block with status and timing
- **rich output**: project cards, a timeline, SQL result tables, copyable contact rows
- **autosuggest**: syntax highlighting, fish-style ghost suggestions (→ to accept), Tab completion, history
- **⌘K command palette**: fuzzy search over commands, projects and actions
- **ask in plain English**: a small rule-based agent shows its plan and tool calls, writes the SQL it needs, then answers
- **query my résumé with SQL**: `sql SELECT name, year FROM projects ORDER BY year DESC`
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
  plain.ts      the plain HTML version (?plain)
  theme.ts      dark / light
  ui.ts         DOM helpers and icons
  main.ts       window chrome and wiring
```

Useful URLs: `/?plain`, `/?cmd=projects`, `/?q=what+is+ternodbi`

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

---
