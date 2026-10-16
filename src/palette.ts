// ⌘K command palette: fuzzy-search every command and a few quick actions.

import { links, projects } from "./content";
import type { Shell } from "./shell";
import { currentTheme, setTheme } from "./theme";
import { copy, h, icon } from "./ui";

interface Action {
  title: string;
  hint: string;
  section: string;
  icon: string;
  run: () => void;
}

/** Subsequence match with a score that favours early, contiguous hits. */
function fuzzy(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q);
  let ti = 0;
  let score = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return 0;
    score += found === ti ? 3 : 1;
    ti = found + 1;
  }
  return score;
}

export function createPalette(shell: Shell, onOpen?: () => void) {
  const actions = (): Action[] => [
    ...shell.list().map((c) => ({
      title: c.name,
      hint: c.summary,
      section: "Commands",
      icon: "command",
      run: () => void shell.type(c.name),
    })),
    ...projects.map((p) => ({
      title: p.name,
      hint: p.summary,
      section: "Projects",
      icon: "branch",
      run: () => void shell.type(`projects ${p.slug}`),
    })),
    {
      title: "Ask a question",
      hint: "what does navin work on?",
      section: "Actions",
      icon: "sparkle",
      run: () => void shell.type("ask what does navin work on?"),
    },
    {
      title: "Copy email address",
      hint: links.email,
      section: "Actions",
      icon: "copy",
      run: () => void copy(links.email),
    },
    {
      title: `Switch to ${currentTheme() === "dark" ? "light" : "dark"} theme`,
      hint: "theme",
      section: "Actions",
      icon: currentTheme() === "dark" ? "sun" : "moon",
      run: () => void setTheme(currentTheme() === "dark" ? "light" : "dark"),
    },
    { title: "Open GitHub", hint: "navinbhagat322", section: "Links", icon: "github", run: () => window.open(links.github, "_blank", "noopener") },
    { title: "Open LinkedIn", hint: "in/navin322", section: "Links", icon: "linkedin", run: () => window.open(links.linkedin, "_blank", "noopener") },
    { title: "Plain page", hint: "no typing, just reading", section: "Links", icon: "arrow", run: () => (location.search = "?plain") },
  ];

  const input = h("input", {
    class: "palette-input",
    type: "text",
    placeholder: "Search commands, projects, actions…",
    autocomplete: "off",
    spellcheck: "false",
    "aria-label": "Search commands",
  });
  const list = h("div", { class: "palette-list", role: "listbox" });
  const dialog = h(
    "div",
    { class: "palette", role: "dialog", "aria-modal": "true", "aria-label": "Command palette" },
    h("div", { class: "palette-search" }, icon("search", 16), input, h("kbd", {}, "esc")),
    list,
  );
  const backdrop = h("div", { class: "palette-backdrop", hidden: true }, dialog);
  document.body.append(backdrop);

  let items: Action[] = [];
  let selected = 0;

  function render() {
    const q = input.value.trim();
    items = actions()
      .map((a) => ({ a, s: Math.max(fuzzy(q, a.title) * 2, fuzzy(q, a.hint)) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => (q ? y.s - x.s : 0))
      .map((x) => x.a);
    selected = Math.min(selected, Math.max(0, items.length - 1));

    const nodes: Node[] = [];
    let section = "";
    items.forEach((a, i) => {
      if (a.section !== section && !q) {
        section = a.section;
        nodes.push(h("div", { class: "palette-section" }, section));
      }
      nodes.push(
        h(
          "button",
          {
            type: "button",
            role: "option",
            class: "palette-item",
            "aria-selected": i === selected ? "true" : "false",
            onClick: () => choose(i),
            onMousemove: () => {
              if (selected !== i) {
                selected = i;
                highlight();
              }
            },
          },
          h("span", { class: "palette-icon" }, icon(a.icon, 15)),
          h("span", { class: "palette-title" }, a.title),
          h("span", { class: "palette-hint" }, a.hint),
        ),
      );
    });
    if (!items.length) nodes.push(h("div", { class: "palette-empty" }, "No matches. Press ↵ to ask the agent instead."));
    list.replaceChildren(...nodes);
  }

  function highlight() {
    list.querySelectorAll(".palette-item").forEach((el, i) => {
      el.setAttribute("aria-selected", String(i === selected));
      if (i === selected) (el as HTMLElement).scrollIntoView({ block: "nearest" });
    });
  }

  function choose(i: number) {
    const a = items[i];
    const q = input.value.trim();
    close();
    if (a) a.run();
    else if (q) void shell.type(`ask ${q}`);
  }

  function open() {
    input.value = "";
    selected = 0;
    render();
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add("open"));
    input.focus();
    onOpen?.();
  }

  function close() {
    backdrop.classList.remove("open");
    backdrop.hidden = true;
    shell.focus();
  }

  input.addEventListener("input", () => {
    selected = 0;
    render();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.max(1, items.length);
      selected = (selected + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      highlight();
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });
  backdrop.addEventListener("mousedown", (e) => {
    if (e.target === backdrop) close();
  });
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (backdrop.hidden) open();
      else close();
    }
  });

  return { open, close };
}
