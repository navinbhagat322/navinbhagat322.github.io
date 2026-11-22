// Rich output rendered inside command blocks.

import { experience, focusAreas, links, profile, projects, recruiter, skills, type Project } from "./content";
import { cmd, copy, h, icon, link, reducedMotion, type Child } from "./ui";
import { lastShipped } from "./activity";
import { query, tables, type Result } from "./sql";
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
        ", which I published on PyPI, and contributed to the open-source Terno agent. On the side I built Vink, a YouTube-to-notes tool on PyPI. Before that I shipped CloudxLab's PyQuest app, built a financial RAG assistant at Scientific Investing, did materials R&D at Tata Steel, and studied at IIT Jodhpur.",
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
      h("dt", {}, "looking"),
      h("dd", { class: "accent" }, profile.looking),
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
    ["box", "pypi", "3 packages", links.pypi],
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

/** One tool call in the opening session: "Working…" for a beat, then the call and its result. */
function toolStep(tool: string, args: string, working: string, at: number, result: HTMLElement): HTMLElement {
  const done = h("span", {}, h("strong", {}, tool), h("code", {}, `(${args})`));
  const call = h("p", { class: "ag-call" });
  if (reducedMotion()) call.append(done);
  else {
    call.append(h("span", { class: "spinner", "aria-hidden": "true" }), h("span", { class: "ag-working" }, working));
    window.setTimeout(() => call.replaceChildren(done), at * 1000);
  }
  return h(
    "li",
    { class: "ag-step ag-tool", style: `--delay:${at - 0.45}s; --at:${at}s` },
    h("span", { class: "ag-dot ag-dot-tool", "aria-hidden": "true" }),
    h("div", {}, call, h("div", { class: "ag-result" }, result)),
  );
}

/** The featured work, one line each, as the second tool's result. The numbers live in the facts above. */
const FEATURED: [string, string, string, string[]][] = [
  ["ternodbi", "TernoDBI", "MCP server that lets AI agents query databases safely", ["oss", "pypi"]],
  ["agents", "Terno agents", "multi-agent CLI that answers questions about your data", ["oss", "pypi"]],
  ["evals", "Agent evals", "regression tests that score agent answers against SQL", []],
  ["vink", "Vink", "turns YouTube videos into detailed notes · CLI and MCP", ["oss", "pypi"]],
];

/** The opening screen: who Navin is, then a short agent session that answers it. */
export function welcome(): HTMLElement {
  const t0 = performance.now();
  const result = query("SELECT * FROM navin");
  const ms = performance.now() - t0;
  const facts = h(
    "div",
    {},
    h(
      "table",
      { class: "hq-table" },
      h(
        "tbody",
        {},
        ...result.rows.map((r, i) =>
          h(
            "tr",
            { style: `--i:${i}`, class: `hq-${r.field}` },
            h("th", { scope: "row" }, String(r.field)),
            h("td", {}, ...(FACT_LINKS[String(r.field)]?.() ?? [String(r.value)])),
          ),
        ),
      ),
    ),
    h("span", { class: "ag-meta" }, `${result.rows.length} rows · ${ms < 1 ? "<1" : Math.round(ms)} ms`),
  );
  const work = h(
    "div",
    {},
    h(
      "ul",
      { class: "ag-work" },
      ...FEATURED.map(([slug, name, line, tags], i) =>
        h(
          "li",
          { style: `--i:${i}` },
          cmd(`projects ${slug}`, name, "ag-work-name"),
          h(
            "span",
            { class: "ag-work-line" },
            line,
            tags.length ? h("span", { class: "ag-tags", title: tags.map((t) => (t === "oss" ? "open source" : "on PyPI")).join(", ") }, tags.join(" · ")) : null,
          ),
        ),
      ),
    ),
    h("span", { class: "ag-meta" }, `${FEATURED.length} of ${projects.length} projects · `, cmd("projects", "see all", "ag-more")),
  );
  return h(
    "section",
    { class: "hero" },
    h(
      "div",
      { class: "hero-main" },
      h(
        "div",
        { class: "hero-id" },
        vinkAvatar(),
        h(
          "div",
          {},
          h("h1", {}, profile.name),
          h("p", { class: "hero-role" }, `${profile.role} at ${profile.company}, building ${profile.project}`),
        ),
      ),
      h(
        "ol",
        { class: "agent", "aria-label": "A short agent session about Navin" },
        h("li", { class: "ag-user", style: "--delay:0.15s" }, h("span", { class: "ag-mark", "aria-hidden": "true" }, ">"), "who is Navin?"),
        toolStep("Query", "SELECT * FROM navin", "Querying…", 0.9, facts),
        toolStep("Read", "projects --featured", "Reading…", 1.7, work),
        h(
          "li",
          { class: "ag-step ag-reply", style: "--delay:2.15s" },
          h("span", { class: "ag-dot", "aria-hidden": "true" }),
          h(
            "div",
            {},
            h("p", {}, "Want the 30-second version, or to get in touch?"),
            h(
              "div",
              { class: "hero-hurry" },
              cmd("tldr", h("span", {}, h("em", { class: "cta-tag" }, "TL;DR"), "Read the 30-second summary"), "cta cta-main"),
              link(`mailto:${links.email}?subject=Hi%20Navin`, h("span", {}, icon("mail", 15), "Email"), "cta"),
              link(links.linkedin, h("span", {}, icon("linkedin", 15), "LinkedIn"), "cta"),
            ),
          ),
        ),
      ),
    ),
    exploreIndex(),
  );
}

/** Table cells that link somewhere; the plain text in content.ts stays the SQL value. */
const FACT_LINKS: Record<string, () => Child[]> = {
  proof: () => [
    link(links.pypi, "3 packages on PyPI", "hq-link"),
    " · ",
    cmd("projects ternodbi", "300+ commits to TernoDBI", "hq-link"),
    " · ",
    cmd("projects agents", "agents in production", "hq-link"),
  ],
  looking: () => [h("strong", { class: "accent" }, profile.looking)],
};

/** Every section of the site, one click away. Each row shows the command it runs. */
export function exploreIndex(): HTMLElement {
  const rows: [string, string, Child, string][] = [
    ["box", "Projects", `${projects.length} things I've built · agents, evals, TernoDBI`, "projects"],
    ["branch", "Experience", "CloudxLab · Scientific Investing · Tata Steel", "experience"],
    ["command", "Skills", `${skills.length} tools · Python, SQL, LangChain, MCP`, "skills"],
    ["network", "How it fits", "the whole system, end to end", "stack"],
    ["github", "Shipping", h("span", { "data-activity": "count" }, "public commits, straight from GitHub"), "activity"],
    ["chat", "Ask me anything", "answers in plain English", "ask what does navin work on?"],
    ["database", "Query with SQL", `${Object.keys(tables).length} tables of me · try SHOW TABLES`, "sql SHOW TABLES"],
    ["mail", "Contact", "email · LinkedIn · GitHub · PyPI", "contact"],
    ["trophy", "Quests", "play along and level up", "quests"],
  ];
  return h(
    "nav",
    { class: "explore", "aria-label": "Explore the site" },
    h("div", { class: "explore-head" }, h("span", {}, "explore")),
    h(
      "ul",
      {},
      ...rows.map(([ic, title, sub, run]) =>
        h(
          "li",
          {},
          h(
            "button",
            { type: "button", class: "explore-row", "data-run": run, title: typeof sub === "string" ? sub : undefined },
            h("span", { class: "explore-icon", "aria-hidden": "true" }, icon(ic, 15)),
            h("span", { class: "explore-text" }, h("strong", {}, title), h("span", {}, sub)),
            h("code", { class: "explore-cmd" }, run.split(" ")[0]),
          ),
        ),
      ),
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
      cmd("stack"),
      " · ",
      cmd("projects"),
      " · ",
      cmd("experience"),
      " · ",
      link("?plain", "plain page"),
      " — or stick around and explore with Vink.",
    ),
  );
}
