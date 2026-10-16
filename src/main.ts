import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./style.css";

import { fillPlaceholders, loadActivity } from "./activity";
import { ask, looksLikeQuestion } from "./agent";
import { commands } from "./commands";
import { links, profile } from "./content";
import { NeuralBackground } from "./neural";
import { createPalette } from "./palette";
import { renderPlain } from "./plain";
import { setupPlay } from "./play";
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

  let onPaletteOpen = () => {};
  const palette = createPalette(shell, () => onPaletteOpen());

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

  const xpSlot = h("span", {});
  const statusbar = h(
    "footer",
    { class: "statusbar" },
    h("span", { class: "sb-item" }, icon("branch", 12), "main"),
    h("button", { type: "button", class: "sb-item sb-link sb-hide-mobile", "data-run": "projects" }, h("span", { class: "pulse small" }), "building Terno AI"),
    h("span", { class: "sb-spacer" }),
    xpSlot,
    h("a", { class: "sb-item sb-link", href: "?plain" }, "plain page"),
    h("span", { class: "sb-item sb-clock" }, clock),
  );

  const quickbar = h(
    "nav",
    { class: "quickbar", "aria-label": "Quick commands" },
    ...["tldr", "projects", "about", "experience", "skills", "contact", "help"].map((c) => h("button", { type: "button", "data-run": c }, c === "tldr" ? "⚡ tldr" : c)),
  );

  const win = h("div", { class: "window" }, titlebar, scroller, quickbar, shell.composer, statusbar);
  const glow = h("div", { class: "glow", "aria-hidden": "true" });
  app.append(glow, win);
  const neural = new NeuralBackground(glow);

  const play = setupPlay(shell, win, xpSlot);
  shell.register(...play.commands);
  onPaletteOpen = () => play.game.unlock("palette");

  // The background network reacts: click empty space to fire a spike, and it
  // gets busier while Vink is thinking about a question.
  neural.onSpike = () => play.game.step("spark");
  document.addEventListener("pointerdown", (e) => {
    const t = e.target as HTMLElement;
    const empty = t === app || t === document.body || t === document.documentElement || t.classList.contains("viewport") || t.classList.contains("feed") || t.classList.contains("hero");
    if (empty && e.button === 0) neural.spike(e.clientX, e.clientY);
  });
  const onStart = shell.onStart;
  shell.onStart = (name, line) => {
    onStart?.(name, line);
    if (name === "ask" || (!shell.get(name) && looksLikeQuestion(line))) neural.think(5);
    else if (name === "sql") neural.think(2);
  };

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
  const activityReady = loadActivity().then(() => fillPlaceholders());

  // Deep links: /?cmd=projects  or  /?q=what+is+ternodbi
  // Give the activity feed a moment so the summary can include "last shipped".
  await Promise.race([activityReady, new Promise((r) => setTimeout(r, 1500))]);
  const deep = params.has("tldr") ? "tldr" : (params.get("cmd") ?? params.get("q"));
  if (deep) await shell.type(params.has("q") && !looksLikeQuestion(deep) ? `ask ${deep}` : deep);
}
