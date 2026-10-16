// Rich output rendered inside command blocks.

import { experience, links, profile, projects, skills, stats, type Project } from "./content";
import type { Result } from "./sql";
import { cmd, copy, h, icon, link } from "./ui";

const kindLabel: Record<Project["kind"], string> = {
  work: "TernoAI",
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

export function statRow(): HTMLElement {
  return h(
    "div",
    { class: "stats" },
    ...stats.map((s) =>
      h("div", { class: "stat" }, h("strong", {}, s.value), h("span", {}, s.label), h("small", {}, s.hint)),
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
      h("p", { class: "lede" }, `I'm ${profile.name}, an ${profile.role} at ${profile.company}. ${profile.tagline}`),
      h(
        "p",
        {},
        "Most of my time goes into ",
        link("https://github.com/terno-ai/ternodbi", "TernoDBI"),
        ", where I'm the top contributor: the MCP server, OAuth, connectors, multi-tenancy and the query engine. Before that I worked on ML at CloudxLab and Tata Steel, and studied at IIT Jodhpur.",
      ),
      h("p", { class: "muted" }, `Off-screen: ${profile.offline.join(", ")}.`),
    ),
    h(
      "dl",
      { class: "facts" },
      h("dt", {}, "role"),
      h("dd", {}, `${profile.role} @ ${profile.company}`),
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
  const featured = projects.find((p) => p.featured)!;
  return h(
    "section",
    { class: "hero" },
    h(
      "div",
      { class: "hero-id" },
      h("div", { class: "avatar", "aria-hidden": "true" }, "NK"),
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
          profile.education,
        ),
      ),
    ),
    h("p", { class: "hero-tagline" }, profile.tagline),
    statRow(),
    h(
      "div",
      { class: "hero-now" },
      h("span", { class: "pulse", "aria-hidden": "true" }),
      h("span", { class: "muted" }, "currently building"),
      cmd(`projects ${featured.slug}`, featured.name, "cmd-link strong"),
      h("span", { class: "muted" }, "— the data layer between AI agents and your databases"),
    ),
    h(
      "div",
      { class: "hero-try" },
      h("span", { class: "muted" }, "try"),
      cmd("projects", "projects", "chip-btn"),
      cmd("about", "about", "chip-btn"),
      cmd("ask what does navin work on?", h("span", {}, icon("sparkle", 13), "ask a question"), "chip-btn"),
      cmd("sql SELECT name, year FROM projects WHERE kind = 'open-source'", h("span", {}, icon("database", 13), "query with SQL"), "chip-btn"),
      cmd("contact", "contact", "chip-btn"),
    ),
  );
}
