import { activityView, loadActivity } from "./activity";
import { ask } from "./agent";
import { links, projects } from "./content";
import type { Command } from "./shell";
import { query, tables } from "./sql";
import { systemDiagram } from "./system";
import { setTheme, themes } from "./theme";
import { cmd, h, link } from "./ui";
import { aboutView, contactView, projectDetail, projectGrid, skillsView, sqlTable, timeline, tldrView } from "./views";

const files: Record<string, string> = {
  "about.md": "about",
  "projects/": "projects",
  "experience.log": "experience",
  "skills.json": "skills",
  "contact.vcf": "contact",
};

const sqlExamples = [
  "SHOW TABLES",
  "SELECT name, year FROM projects ORDER BY year DESC",
  "SELECT name FROM skills WHERE area = 'ai / ml'",
  "SELECT org, title FROM experience WHERE kind != 'education'",
  "SELECT COUNT(*) FROM projects WHERE kind = 'personal'",
];

export const commands: Command[] = [
  {
    name: "help",
    summary: "everything you can do here",
    group: "system",
    aliases: ["?", "man"],
    run: ({ shell, add }) => {
      const groups: [string, string][] = [
        ["explore", "Explore"],
        ["tools", "Tools"],
        ["play", "Play"],
        ["system", "System"],
      ];
      add(
        h(
          "div",
          { class: "help" },
          ...groups.map(([key, title]) =>
            h(
              "div",
              { class: "help-group" },
              h("h4", {}, title),
              ...shell
                .list()
                .filter((c) => (c.group ?? "system") === key)
                .map((c) =>
                  h(
                    "div",
                    { class: "help-row" },
                    cmd(c.name, c.name, "cmd-link"),
                    h("span", { class: "help-usage" }, c.usage ?? ""),
                    h("span", { class: "help-summary" }, c.summary),
                  ),
                ),
            ),
          ),
          h(
            "p",
            { class: "help-foot" },
            h("kbd", {}, "Tab"),
            " complete  ",
            h("kbd", {}, "→"),
            " accept suggestion  ",
            h("kbd", {}, "↑↓"),
            " history  ",
            h("kbd", {}, "⌘K"),
            " command palette  ",
            h("kbd", {}, "Ctrl L"),
            " clear",
          ),
        ),
      );
    },
  },
  {
    name: "tldr",
    summary: "the 30-second summary, for recruiters in a hurry",
    group: "explore",
    aliases: ["summary", "recruiter", "hire"],
    run: ({ add }) => void add(tldrView()),
  },
  {
    name: "stack",
    summary: "how everything I build fits together, animated",
    group: "explore",
    aliases: ["system", "architecture", "how"],
    run: ({ add }) => void add(systemDiagram()),
  },
  {
    name: "activity",
    summary: "what I shipped this week, live from GitHub",
    group: "explore",
    aliases: ["shipped", "commits", "log"],
    run: async ({ add, out }) => {
      const a = await loadActivity();
      if (!a) {
        out(h("span", { class: "muted" }, "Couldn't load the activity feed right now. "), link(links.github, "See GitHub →"));
        return;
      }
      add(activityView(a));
    },
  },
  {
    name: "about",
    summary: "who I am and what I do",
    group: "explore",
    aliases: ["whoami"],
    run: ({ add }) => void add(aboutView()),
  },
  {
    name: "projects",
    summary: "things I've built",
    usage: "[name | --work | --personal]",
    group: "explore",
    aliases: ["work"],
    complete: () => [...projects.map((p) => p.slug), "--work", "--open-source", "--personal"],
    run: ({ args, add, out, error }) => {
      const arg = args[0]?.toLowerCase();
      if (!arg) {
        const featured = projects.filter((p) => p.featured);
        const rest = projects.filter((p) => !p.featured);
        add(h("h4", { class: "section-title" }, "Featured"));
        add(projectGrid(featured));
        add(h("h4", { class: "section-title" }, "More"));
        add(projectGrid(rest));
        return;
      }
      if (arg.startsWith("--")) {
        const list = projects.filter((p) => p.kind === arg.slice(2));
        if (!list.length) return error(`no projects of kind ${arg}. try --work, --open-source or --personal`);
        add(projectGrid(list));
        return;
      }
      const p = projects.find((x) => x.slug === arg || x.name.toLowerCase() === arg);
      if (!p) {
        error(`no project "${arg}".`);
        out("projects: ", ...projects.flatMap((x, i) => [i ? ", " : "", cmd(`projects ${x.slug}`, x.slug)]));
        return;
      }
      add(projectDetail(p));
    },
  },
  {
    name: "experience",
    summary: "where I've worked and studied",
    group: "explore",
    aliases: ["exp", "journey"],
    run: ({ add }) => void add(timeline()),
  },
  {
    name: "skills",
    summary: "languages, ML and infrastructure",
    group: "explore",
    aliases: ["tech"],
    run: ({ add }) => void add(skillsView()),
  },
  {
    name: "contact",
    summary: "how to reach me",
    group: "explore",
    aliases: ["socials", "links"],
    run: ({ add }) => void add(contactView()),
  },
  {
    name: "ask",
    summary: "ask anything about me, in English",
    usage: "<question>",
    group: "tools",
    run: async (ctx) => {
      if (!ctx.raw) {
        ctx.out(h("span", { class: "muted" }, "ask me something, or just type a question at the prompt:"));
        ["ask what does navin work on?", "ask how do I contact him?", "ask what is ternodbi?", "ask what's his stack?"].forEach((q) =>
          ctx.out("  ", cmd(q)),
        );
        return;
      }
      await ask(ctx.raw, ctx);
    },
  },
  {
    name: "sql",
    summary: "query my résumé with SQL",
    usage: "<query>",
    group: "tools",
    complete: () => ["SELECT", "SHOW TABLES", "DESCRIBE", ...Object.keys(tables)],
    run: ({ raw, add, out }) => {
      if (!raw) {
        out(h("span", { class: "muted" }, `read-only SQL over ${Object.keys(tables).length} tables: `), Object.keys(tables).join(", "));
        sqlExamples.forEach((q) => out("  ", cmd(`sql ${q}`)));
        return;
      }
      const t0 = performance.now();
      const result = query(raw);
      add(sqlTable(result, performance.now() - t0));
    },
  },
  {
    name: "open",
    summary: "open a profile in a new tab",
    usage: "<site>",
    group: "tools",
    complete: () => Object.keys(links),
    run: ({ args, out, error }) => {
      const site = args[0]?.toLowerCase() as keyof typeof links | undefined;
      const url = site ? links[site] : undefined;
      if (!url) return error(`usage: open <${Object.keys(links).join(" | ")}>`);
      const href = site === "email" ? `mailto:${url}` : url;
      out("opening ", link(href, href), " …");
      window.open(href, "_blank", "noopener");
    },
  },
  {
    name: "ls",
    summary: "list files",
    group: "system",
    run: ({ out }) =>
      void out(...Object.keys(files).flatMap((f) => [cmd(`cat ${f}`, f, `cmd-link file ${f.endsWith("/") ? "dir" : ""}`), "   "])),
  },
  {
    name: "cat",
    summary: "print a file",
    usage: "<file>",
    group: "system",
    complete: () => Object.keys(files),
    run: async (ctx) => {
      const file = ctx.args[0];
      const target = file ? files[file] : undefined;
      if (!target) return ctx.error(file ? `cat: ${file}: no such file or directory` : "usage: cat <file>  (try ls)");
      await ctx.shell.exec(target, ctx);
    },
  },
  {
    name: "theme",
    summary: "switch light / dark",
    usage: `[${themes.join(" | ")}]`,
    group: "system",
    complete: () => [...themes],
    run: ({ args, out, error }) => {
      const name = args[0] ?? (document.documentElement.dataset.theme === "dark" ? "light" : "dark");
      if (!setTheme(name)) return error(`usage: theme <${themes.join(" | ")}>`);
      out(h("span", { class: "muted" }, "theme → "), name);
    },
  },
  {
    name: "history",
    summary: "commands you've run",
    group: "system",
    run: ({ shell, out }) =>
      shell.getHistory().forEach((line, i) => out(h("span", { class: "muted" }, String(i + 1).padStart(3) + "  "), cmd(line))),
  },
  {
    name: "clear",
    summary: "clear the screen",
    group: "system",
    aliases: ["cls"],
    run: ({ shell }) => shell.clear(),
  },
  {
    name: "gui",
    summary: "the plain, no-typing version",
    group: "system",
    aliases: ["plain", "exit"],
    run: ({ out }) => {
      out(h("span", { class: "muted" }, "switching to the plain page …"));
      setTimeout(() => (location.search = "?plain"), 250);
    },
  },
  // Hidden from help, found by the curious.
  {
    name: "sudo",
    summary: "",
    hidden: true,
    run: ({ raw, out, error }) => {
      if (raw.toLowerCase() === "hire navin") {
        out(h("span", { class: "ok" }, "✓ permission granted."), " opening a draft to ", link(`mailto:${links.email}?subject=Let's%20work%20together`, links.email));
      } else error("navin is not in the sudoers file. This incident will be reported. (psst: sudo hire navin)");
    },
  },
  {
    name: "rm",
    summary: "",
    hidden: true,
    run: ({ error }) => error("rm: read-only file system. The résumé stays."),
  },
  {
    name: "echo",
    summary: "",
    hidden: true,
    run: ({ raw, out }) => void out(raw),
  },
  {
    name: "date",
    summary: "",
    hidden: true,
    run: ({ out }) => void out(new Date().toString()),
  },
  {
    name: "pwd",
    summary: "",
    hidden: true,
    run: ({ shell, out }) => void out(shell.path.replace("~", "/home/navin")),
  },
];
