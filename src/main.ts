import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource/press-start-2p/400.css";
import "./style.css";

import { fillPlaceholders, loadActivity } from "./activity";
import { analyticsEnabled, startAnalytics, totalVisits, trackCommand } from "./analytics";
import { answerReply, ask, canAnswer, isReply, looksLikeQuestion, setOffer } from "./agent";
import { commands } from "./commands";
import { links, profile } from "./content";
import { NeuralBackground } from "./neural";
import { createPalette } from "./palette";
import { renderPlain } from "./plain";
import { setupPlay } from "./play";
import { Shell } from "./shell";
import { currentTheme, initTheme, onThemeChange, setTheme } from "./theme";
import { h, icon } from "./ui";
import { exploreIndex, welcome } from "./views";

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
    "ask how do I reach him?",
    "sql SELECT name, year FROM projects ORDER BY year DESC",
    "sql SHOW TABLES",
    "sudo hire navin",
  ];
  shell.fallback = async (ctx, line) => {
    if (isReply(line)) return answerReply(line, ctx);
    if (looksLikeQuestion(line) || canAnswer(line)) return ask(line, ctx);
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
    h("div", { class: "title" }, h("span", { class: "title-user" }, `${profile.handle}@${profile.host}`), h("span", { class: "title-path" }, " — ~/portfolio")),
    // Search sits in the middle, like an app's command bar.
    h(
      "div",
      { class: "title-search" },
      h(
        "button",
        { type: "button", class: "kbd-btn", onClick: () => palette.open(), "aria-label": "Open command palette" },
        icon("search", 14),
        h("span", { class: "kbd-label" }, "Search or jump to…"),
        h("kbd", {}, isMac ? "⌘K" : "Ctrl K"),
      ),
    ),
    h(
      "div",
      { class: "title-actions" },
      // Ways to reach Navin, always in reach.
      h("a", { class: "tb-link", href: `mailto:${links.email}?subject=Hi%20Navin`, title: "Email Navin" }, icon("mail", 15), h("span", { class: "tb-label" }, "Email")),
      h("a", { class: "tb-link", href: links.linkedin, target: "_blank", rel: "noopener", title: "Navin on LinkedIn" }, icon("linkedin", 15), h("span", { class: "tb-label" }, "LinkedIn")),
      h("a", { class: "tb-link", href: links.github, target: "_blank", rel: "noopener", title: "Navin on GitHub" }, icon("github", 15), h("span", { class: "tb-label" }, "GitHub")),
      // The theme toggle sits apart, at the end: it's a setting, not a link.
      h("span", { class: "tb-gap", "aria-hidden": "true" }),
      themeBtn,
    ),
  );

  const clock = h("span", {});
  const tick = () =>
    (clock.textContent =
      new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()) + " IST");
  tick();
  setInterval(tick, 30_000);

  const xpSlot = h("span", {});
  // Analytics run quietly; the count stays behind the `visits` command.
  // Visit count: hidden until analytics is set up and the number loads.
  const visitsSlot = h("button", { type: "button", class: "sb-item sb-link sb-visits", "data-run": "visits", title: "Profile visits", hidden: true });
  if (analyticsEnabled()) {
    startAnalytics();
    void totalVisits().then((n) => {
      if (!n || n === "0") return;
      visitsSlot.replaceChildren(icon("eye", 12), n, h("span", { class: "sb-visits-word" }, n === "1" ? "visit" : "visits"));
      visitsSlot.hidden = false;
    });
  }

  const statusbar = h(
    "footer",
    { class: "statusbar" },
    // Availability, always in view.
    h("button", { type: "button", class: "sb-item sb-link sb-hide-mobile", "data-run": "contact", title: "How to reach Navin" }, h("span", { class: "pulse small" }), profile.looking),
    h("span", { class: "sb-spacer" }),
    visitsSlot,
    xpSlot,
    h("a", { class: "sb-item sb-link", href: "?plain" }, "plain page"),
    h("span", { class: "sb-item sb-clock" }, clock),
  );

  const quickbar = h(
    "nav",
    { class: "quickbar", "aria-label": "Quick commands" },
    ...["tldr", "projects", "about", "experience", "skills", "contact", "help"].map((c) => h("button", { type: "button", "data-run": c }, c)),
  );

  // On wide screens explore lives in a side panel, so it stays put while answers scroll.
  const sidebar = h("aside", { class: "sidebar" }, exploreIndex());
  // The left column holds the conversation, the prompt and the status bar; the side panel runs to the bottom.
  const mainCol = h("div", { class: "main-col" }, scroller, quickbar, shell.composer, statusbar);
  const workspace = h("div", { class: "workspace" }, mainCol, sidebar);
  const win = h("div", { class: "window" }, titlebar, workspace);
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
  // Count which commands get used (names only, never what was typed).
  const onRun = shell.onRun;
  shell.onRun = (info) => {
    onRun?.(info);
    const name = shell.get(info.name)?.name;
    if (name) trackCommand(name);
    else if (looksLikeQuestion(info.line)) trackCommand("question");
  };

  const onStart = shell.onStart;
  shell.onStart = (name, line) => {
    onStart?.(name, line);
    // Anything but a yes/no moves the conversation on, so Vink's last offer lapses.
    if (!isReply(line)) setOffer(null, shell);
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

  // No auto-focus: the prompt stays quiet until someone types (keys anywhere land in it).
  shell.addToFeed(welcome());
  setOffer("tldr", shell);
  const activityReady = loadActivity().then(() => fillPlaceholders());

  // Deep links: /?cmd=projects  or  /?q=what+is+ternodbi
  // Give the activity feed a moment so the summary can include "last shipped".
  await Promise.race([activityReady, new Promise((r) => setTimeout(r, 1500))]);
  const deep = params.has("tldr") ? "tldr" : (params.get("cmd") ?? params.get("q"));
  if (deep) await shell.type(params.has("q") && !looksLikeQuestion(deep) ? `ask ${deep}` : deep);
}
