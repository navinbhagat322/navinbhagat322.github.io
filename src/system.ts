// The opening screen's centrepiece: the system Navin builds, end to end.
// A sample question travels through it on a loop — agent, memory, MCP host,
// TernoDBI, SQL Shield, the data, and back through evals — with each part
// lighting up as it's used. Every part is clickable and opens that project.

import { h, reducedMotion } from "./ui";

interface Part {
  id: string;
  title: string;
  sub: string;
  /** Command run when the part is clicked. */
  run?: string;
  tag?: string;
}

const PARTS: Part[] = [
  { id: "q", title: "Question", sub: "in plain English", run: "ask what does navin work on?" },
  { id: "agent", title: "AI agent", sub: "LangChain · CrewAI · AutoGen · OpenAI SDK", run: "projects agents" },
  { id: "mem", title: "RAG memory", sub: "Milvus · self-improving", run: "projects rag-memory" },
  { id: "evals", title: "Evals", sub: "regression-tests every answer", run: "projects evals" },
  { id: "mcp", title: "MCP host", sub: "multi-threaded tool runtime", run: "projects mcp-host" },
  { id: "dbi", title: "TernoDBI", sub: "MCP server · on PyPI", run: "projects ternodbi", tag: "open source" },
  { id: "shield", title: "SQL Shield", sub: "validate · scope · rewrite", run: "projects sqlshield" },
  { id: "data", title: "Your data", sub: "Postgres · Snowflake · BigQuery · APIs" },
];

/** The story the loop tells: which part is active, which link carries it there, and the caption. */
const STEPS: { part: string; link?: string; text: string }[] = [
  { part: "q", text: "“Which campaigns drove the most revenue last month?”" },
  { part: "agent", link: "c1", text: "The agent plans the task and picks its tools" },
  { part: "mem", link: "cm", text: "…recalls the org's context from semantic memory" },
  { part: "mcp", link: "c2", text: "…and calls execute_query through the MCP host" },
  { part: "dbi", link: "c3", text: "TernoDBI resolves the schema and builds the query" },
  { part: "shield", link: "c4", text: "SQL Shield checks every table, column and row" },
  { part: "data", link: "c5", text: "Results stream back from the warehouse" },
  { part: "agent", text: "The agent writes the answer…" },
  { part: "evals", link: "ce", text: "…and evals score it against the expected result ✓" },
];

export function systemDiagram(): HTMLElement {
  const nodes = new Map<string, HTMLElement>();
  for (const p of PARTS) {
    const attrs: Record<string, string> = { class: `sys-node sys-${p.id}`, "data-part": p.id };
    const children = [
      h("span", { class: "sys-title" }, p.title, p.tag ? h("em", {}, p.tag) : null),
      h("span", { class: "sys-sub" }, p.sub),
    ];
    nodes.set(
      p.id,
      p.run
        ? h("button", { ...attrs, type: "button", "data-run": p.run, title: `Open ${p.title}` }, ...children)
        : h("div", attrs, ...children),
    );
  }
  const links = new Map<string, HTMLElement>();
  for (const id of ["c1", "c2", "c3", "c4", "c5", "cm", "ce"]) {
    links.set(id, h("span", { class: `sys-link sys-${id}`, "aria-hidden": "true" }, h("i", {})));
  }

  const caption = h("p", { class: "sys-caption", "aria-live": "off" }, STEPS[0].text);
  const grid = h(
    "div",
    { class: "sys-grid" },
    nodes.get("mem")!,
    links.get("cm")!,
    nodes.get("q")!,
    links.get("c1")!,
    nodes.get("agent")!,
    links.get("c2")!,
    nodes.get("mcp")!,
    links.get("c3")!,
    nodes.get("dbi")!,
    links.get("c4")!,
    nodes.get("shield")!,
    links.get("c5")!,
    nodes.get("data")!,
    links.get("ce")!,
    nodes.get("evals")!,
  );

  const root = h(
    "section",
    { class: "sys", "aria-label": "The system Navin builds, end to end" },
    h(
      "div",
      { class: "sys-head" },
      h("span", { class: "sys-kicker" }, "What I build — end to end"),
      h("span", { class: "sys-hint" }, "click any part"),
    ),
    grid,
    caption,
  );

  // ---------- the loop ----------
  let step = 0;
  let visible = true;
  let paused = false;

  const show = (i: number) => {
    const s = STEPS[i];
    const seen = new Set(STEPS.slice(0, i + 1).map((x) => x.part));
    nodes.forEach((el, id) => {
      el.classList.toggle("active", id === s.part);
      el.classList.toggle("lit", seen.has(id) && id !== s.part);
    });
    const used = new Set(STEPS.slice(0, i + 1).map((x) => x.link).filter(Boolean));
    links.forEach((el, id) => {
      el.classList.toggle("flow", id === s.link);
      el.classList.toggle("lit", used.has(id) && id !== s.link);
    });
    caption.classList.remove("in");
    void caption.offsetWidth; // restart the fade
    caption.textContent = s.text;
    caption.classList.add("in");
  };

  const tick = () => {
    if (!visible || paused) return;
    step = (step + 1) % (STEPS.length + 1);
    if (step === STEPS.length) {
      // A beat with everything lit, then start over.
      nodes.forEach((el) => {
        el.classList.remove("active");
        el.classList.add("lit");
      });
      links.forEach((el) => el.classList.remove("flow"));
      caption.textContent = "Agents, memory, MCP, TernoDBI, guardrails and evals — I've built every part of it.";
      return;
    }
    show(step);
  };

  if (reducedMotion()) {
    nodes.forEach((el) => el.classList.add("lit"));
    links.forEach((el) => el.classList.add("lit"));
    caption.textContent = "Agents, memory, MCP, TernoDBI, guardrails and evals — I've built every part of it.";
  } else {
    show(0);
    window.setInterval(tick, 1500);
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(root);
    // Hovering a part with a mouse pauses the story so people can read it.
    // Touch taps don't pause (there's no "leave" on touch), and any pause ends on its own.
    let resume = 0;
    grid.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse" || !(e.target as HTMLElement).closest(".sys-node")) return;
      paused = true;
      clearTimeout(resume);
      resume = window.setTimeout(() => (paused = false), 6000);
    });
    grid.addEventListener("pointerleave", () => {
      paused = false;
      clearTimeout(resume);
    });
  }
  return root;
}
