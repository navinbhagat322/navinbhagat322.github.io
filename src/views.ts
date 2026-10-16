// Rich output rendered inside command blocks.

import { experience, focusAreas, links, profile, recruiter, skills, type Project } from "./content";
import type { Result } from "./sql";
import { cmd, copy, h, icon, link } from "./ui";
import { lastShipped } from "./activity";
import { systemDiagram } from "./system";
import { vinkSVG } from "./vink";

export function vinkAvatar(): HTMLElement {
  const el = h("button", { type: "button", class: "avatar vink-avatar", "data-run": "vink", title: "This is Vink. Say hi.", "aria-label": "Meet Vink" });
  el.innerHTML = vinkSVG("head");
  return el;
}

const kindLabel: Record<Project["kind"], string> = {
  work: "work",
  "open-source": "open source",
  personal: "personal",
};

export function projectCard(p: Project): HTMLElement {
  return h(
    "article",
    { class: `card project ${p.featured ? "featured" : ""}` },
    h(
      "div",
      { class: "card-top" },
      h("span", { class: `badge badge-${p.kind}` }, kindLabel[p.kind]),
      h("span", { class: "muted" }, p.year),
    ),
    h("h3", {}, p.name),
    h("p", {}, p.summary),
    h("div", { class: "tags" }, ...p.stack.map((s) => h("span", { class: "tag" }, s))),
    h(
      "div",
      { class: "card-actions" },
      p.highlights ? cmd(`projects ${p.slug}`, "details", "chip-btn") : null,
      p.url ? link(p.url, h("span", {}, p.url.includes("pypi") ? "PyPI" : "source", icon("arrow", 13)), "chip-btn") : null,
    ),
  );
}

export function projectGrid(list: Project[]): HTMLElement {
  return h("div", { class: "grid" }, ...list.map(projectCard));
}

export function projectDetail(p: Project): HTMLElement {
  return h(
    "div",
    { class: "detail" },
    h(
      "div",
      { class: "detail-head" },
      h("h3", {}, p.name),
      h("span", { class: `badge badge-${p.kind}` }, kindLabel[p.kind]),
      p.url ? link(p.url, h("span", {}, p.url.replace(/^https:\/\//, ""), icon("arrow", 13)), "detail-link") : null,
    ),
    h("p", { class: "lede" }, p.summary),
    p.highlights ? h("ul", { class: "points" }, ...p.highlights.map((x) => h("li", {}, x))) : null,
    h("div", { class: "tags" }, ...p.stack.map((s) => h("span", { class: "tag" }, s))),
  );
}

/** What I build: four short capability cards. */
export function focusRow(): HTMLElement {
  return h(
    "div",
    { class: "focus" },
    ...focusAreas.map((f) =>
      h(
        "div",
        { class: "focus-item" },
        h("span", { class: "focus-icon" }, icon(f.icon, 15)),
        h("strong", {}, f.title),
        h("span", {}, f.body),
      ),
    ),
  );
}

export function aboutView(): HTMLElement {
  return h(
    "div",
    { class: "about" },
    h(
      "div",
      { class: "about-text" },
      h("p", { class: "lede" }, `I'm ${profile.name}, an ${profile.role} at ${profile.company}, building ${profile.project}. ${profile.tagline}`),
      h(
        "p",
        {},
        "Day to day that means building agents (LangChain, CrewAI, AutoGen, the OpenAI SDK and custom ones), the evaluation framework that keeps them honest, their RAG memory, and the MCP layer they use to reach databases — including ",
        link("https://github.com/terno-ai/ternodbi", "TernoDBI"),
        ", which I published on PyPI. Before that I shipped CloudxLab's PyQuest app, built a financial RAG assistant at Scientific Investing, did materials R&D at Tata Steel, and studied at IIT Jodhpur.",
      ),
      h("p", { class: "muted" }, `Off-screen: ${profile.offline.join(", ")}.`),
    ),
    h(
      "dl",
      { class: "facts" },
      h("dt", {}, "role"),
      h("dd", {}, `${profile.role} @ ${profile.company} · ${profile.project}`),
      h("dt", {}, "focus"),
      h("dd", {}, profile.focus.join(" · ")),
      h("dt", {}, "education"),
      h("dd", {}, profile.education),
      h("dt", {}, "based in"),
      h("dd", {}, profile.location),
    ),
  );
}

export function timeline(): HTMLElement {
  return h(
    "ol",
    { class: "timeline" },
    ...experience.map((r) =>
      h(
        "li",
        { class: r.current ? "current" : "" },
        h(
          "div",
          { class: "tl-head" },
          h("strong", {}, r.org),
          h("span", {}, r.title),
          h("span", { class: `badge badge-${r.kind}` }, r.current ? "now" : r.kind),
        ),
        h("ul", { class: "points" }, ...r.points.map((p) => h("li", {}, p))),
      ),
    ),
  );
}

export function skillsView(): HTMLElement {
  const areas = [...new Set(skills.map((s) => s.area))];
  return h(
    "div",
    { class: "skills" },
    ...areas.map((a) =>
      h(
        "div",
        { class: "skill-row" },
        h("span", { class: "skill-area" }, a),
        h("div", { class: "tags" }, ...skills.filter((s) => s.area === a).map((s) => h("span", { class: "tag" }, s.name))),
      ),
    ),
  );
}

function copyButton(text: string): HTMLButtonElement {
  const btn = h("button", { type: "button", class: "icon-btn", "aria-label": `Copy ${text}`, title: "Copy" }, icon("copy", 14));
  btn.addEventListener("click", async () => {
    if (await copy(text)) {
      btn.replaceChildren(icon("check", 14));
      btn.classList.add("done");
      setTimeout(() => {
        btn.replaceChildren(icon("copy", 14));
        btn.classList.remove("done");
      }, 1400);
    }
  });
  return btn;
}

export function contactView(): HTMLElement {
  const rows: [string, string, string, string][] = [
    ["mail", "email", links.email, `mailto:${links.email}`],
    ["linkedin", "linkedin", "in/navin322", links.linkedin],
    ["github", "github", "navinbhagat322", links.github],
    ["youtube", "youtube", "@Navin_bhagat", links.youtube],
    ["instagram", "instagram", "navin.bhagat_", links.instagram],
  ];
  return h(
    "div",
    { class: "contact" },
    ...rows.map(([ic, label, value, href]) =>
      h(
        "div",
        { class: "contact-row" },
        h("span", { class: "contact-icon" }, icon(ic, 16)),
        h("span", { class: "contact-label" }, label),
        link(href, value, "contact-value"),
        label === "email" ? copyButton(links.email) : h("span", {}),
      ),
    ),
  );
}

export function sqlTable({ columns, rows }: Result, ms: number): HTMLElement {
  return h(
    "div",
    { class: "sql-result" },
    h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        {},
        h("thead", {}, h("tr", {}, ...columns.map((c) => h("th", {}, c)))),
        h(
          "tbody",
          {},
          ...rows.map((r) =>
            h(
              "tr",
              {},
              ...columns.map((c) => {
                const v = r[c];
                return h("td", { class: typeof v === "number" ? "num" : typeof v === "boolean" ? "bool" : "" }, String(v));
              }),
            ),
          ),
        ),
      ),
    ),
    h("div", { class: "sql-meta" }, `${rows.length} row${rows.length === 1 ? "" : "s"} · ${ms.toFixed(2)} ms`),
  );
}

export function welcome(): HTMLElement {
  return h(
    "section",
    { class: "hero" },
    h(
      "div",
      { class: "hero-id" },
      vinkAvatar(),
      h(
        "div",
        {},
        h("h1", {}, profile.name),
        h(
          "p",
          { class: "hero-role" },
          `${profile.role} at `,
          h("span", { class: "accent" }, profile.company),
          h("span", { class: "dot-sep" }, "·"),
          `building ${profile.project}`,
        ),
      ),
    ),
    h("p", { class: "hero-tagline" }, profile.tagline),
    h(
      "div",
      { class: "hero-hurry" },
      cmd("tldr", h("span", {}, "⚡ In a hurry? Read the 30-second summary"), "hurry-btn"),
    ),
    systemDiagram(),
    h(
      "div",
      { class: "hero-proof" },
      h("span", { class: "proof-item" }, h("span", { class: "pulse small", "aria-hidden": "true" }), `building ${profile.project} at ${profile.company}`),
      cmd("projects ternodbi", h("span", {}, h("strong", {}, "280+"), " commits to TernoDBI"), "proof-item proof-link"),
      h("span", { class: "proof-item" }, "published on PyPI"),
      h("button", { type: "button", class: "proof-item proof-link hero-last", "data-activity": "last", "data-run": "activity", hidden: true }),
    ),
    h(
      "div",
      { class: "hero-try" },
      h("span", { class: "muted" }, "or explore"),
      cmd("projects", "projects", "chip-btn"),
      cmd("about", "about", "chip-btn"),
      cmd("ask what does navin work on?", h("span", {}, icon("sparkle", 13), "ask a question"), "chip-btn"),
      cmd("sql SELECT name, year FROM projects WHERE kind = 'work'", h("span", {}, icon("database", 13), "query with SQL"), "chip-btn"),
      cmd("contact", "contact", "chip-btn"),
      cmd("quests", h("span", {}, "🏆 quests"), "chip-btn"),
    ),
  );
}

export function tldrView(): HTMLElement {
  return h(
    "div",
    { class: "tldr" },
    h(
      "div",
      { class: "tldr-head" },
      vinkAvatar(),
      h(
        "div",
        {},
        h("span", { class: "tldr-kicker" }, icon("sparkle", 12), "30-second summary"),
        h("h3", {}, profile.name),
        h("p", {}, recruiter.pitch),
      ),
    ),
    h(
      "ol",
      { class: "tldr-list" },
      ...recruiter.highlights.map((x) =>
        h(
          "li",
          {},
          h("strong", {}, x.href ? link(x.href, h("span", {}, x.title, icon("arrow", 12))) : x.title),
          h("span", {}, x.body),
        ),
      ),
    ),
    h(
      "dl",
      { class: "tldr-facts" },
      ...recruiter.facts.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]),
      ...(lastShipped() ? [h("dt", {}, "shipping"), h("dd", {}, cmd("activity", lastShipped()!))] : []),
    ),
    h(
      "div",
      { class: "tldr-actions" },
      link(`mailto:${links.email}?subject=Hi%20Navin`, h("span", {}, icon("mail", 15), "Email Navin"), "btn primary"),
      copyButton(links.email),
      link(links.linkedin, h("span", {}, icon("linkedin", 15), "LinkedIn"), "btn"),
      link(links.github, h("span", {}, icon("github", 15), "GitHub"), "btn"),
    ),
    h(
      "p",
      { class: "tldr-more" },
      "Want the detail? ",
      cmd("projects"),
      " · ",
      cmd("experience"),
      " · ",
      link("?plain", "plain page"),
      " — or stick around and explore with Vink.",
    ),
  );
}
