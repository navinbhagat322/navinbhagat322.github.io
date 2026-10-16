import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./style.css";

import { ask, looksLikeQuestion } from "./agent";
import { commands } from "./commands";
import { links, profile, projects } from "./content";
import { createPalette } from "./palette";
import { renderPlain } from "./plain";
import { Shell } from "./shell";
import { currentTheme, initTheme, onThemeChange, setTheme } from "./theme";
import { h, icon } from "./ui";
import { welcome } from "./views";

initTheme();

const app = document.getElementById("app")!;
const params = new URLSearchParams(location.search);

if (params.has("plain")) renderPlain(app);
else void startShell();

async function startShell() {
  const scroller = h("main", { class: "viewport", tabindex: "-1" });
  const shell = new Shell(scroller, "~/portfolio");
  shell.register(...commands);
  shell.examples = [
    "projects ternodbi",
    "ask what is ternodbi?",
    "ask what does navin work on?",
    "ask how do I contact him?",
    "sql SELECT name, year FROM projects ORDER BY year DESC",
    "sql SHOW TABLES",
    "sudo hire navin",
  ];
  shell.fallback = async (ctx, line) => {
    if (looksLikeQuestion(line)) return ask(line, ctx);
    ctx.error(`command not found: ${line.split(/\s+/)[0]}`);
    ctx.out(
      h("span", { class: "muted" }, "type "),
      h("button", { type: "button", class: "cmd-link", "data-run": "help" }, "help"),
      h("span", { class: "muted" }, ", or ask a question in plain English."),
    );
  };

  const palette = createPalette(shell);

  const themeBtn = h("button", { type: "button", class: "icon-btn", "aria-label": "Toggle theme", title: "Toggle theme" });
  const paintThemeBtn = () => themeBtn.replaceChildren(icon(currentTheme() === "dark" ? "sun" : "moon", 15));
  paintThemeBtn();
  onThemeChange(paintThemeBtn);
  themeBtn.addEventListener("click", () => setTheme(currentTheme() === "dark" ? "light" : "dark"));

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const titlebar = h(
    "header",
    { class: "titlebar" },
    h("div", { class: "lights", "aria-hidden": "true" }, h("span", {}), h("span", {}), h("span", {})),
    h("div", { class: "title" }, h("span", { class: "title-user" }, `${profile.handle}@${profile.host}`), h("span", { class: "title-path" }, " — ~/portfolio")),
    h(
      "div",
      { class: "title-actions" },
      h(
        "button",
        { type: "button", class: "kbd-btn", onClick: () => palette.open(), "aria-label": "Open command palette" },
        icon("search", 14),
        h("span", { class: "kbd-label" }, "Search"),
        h("kbd", {}, isMac ? "⌘K" : "Ctrl K"),
      ),
      themeBtn,
      h("a", { class: "icon-btn", href: links.github, target: "_blank", rel: "noopener", "aria-label": "GitHub", title: "GitHub" }, icon("github", 15)),
    ),
  );

  const clock = h("span", {});
  const tick = () =>
    (clock.textContent =
      new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()) + " IST");
  tick();
  setInterval(tick, 30_000);

  const ternodbi = projects.find((p) => p.slug === "ternodbi")!;
  const statusbar = h(
    "footer",
    { class: "statusbar" },
    h("span", { class: "sb-item" }, icon("branch", 12), "main"),
    h("button", { type: "button", class: "sb-item sb-link", "data-run": `projects ${ternodbi.slug}` }, h("span", { class: "pulse small" }), "shipping TernoDBI"),
    h("span", { class: "sb-spacer" }),
    h("a", { class: "sb-item sb-link", href: "?plain" }, "plain page"),
    h("span", { class: "sb-item sb-clock" }, clock),
  );

  const quickbar = h(
    "nav",
    { class: "quickbar", "aria-label": "Quick commands" },
    ...["help", "about", "projects", "experience", "skills", "contact"].map((c) => h("button", { type: "button", "data-run": c }, c)),
  );

  const win = h("div", { class: "window" }, titlebar, scroller, quickbar, shell.composer, statusbar);
  app.append(h("div", { class: "glow", "aria-hidden": "true" }), win);

  // Any [data-run] element anywhere runs its command.
  document.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-run]");
    if (el?.dataset.run) {
      e.preventDefault();
      void shell.type(el.dataset.run);
    }
  });
  // Clicking empty space in the window focuses the prompt, unless text is being selected.
  scroller.addEventListener("mouseup", (e) => {
    if ((e.target as HTMLElement).closest("a, button, input, table") || window.getSelection()?.toString()) return;
    shell.focus();
  });
  // Typing anywhere lands in the prompt.
  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    shell.focus();
  });

  shell.addToFeed(welcome());
  shell.focus();

  // Deep links: /?cmd=projects  or  /?q=what+is+ternodbi
  const deep = params.get("cmd") ?? params.get("q");
  if (deep) await shell.type(params.has("q") && !looksLikeQuestion(deep) ? `ask ${deep}` : deep);
}
