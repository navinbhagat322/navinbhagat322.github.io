// A small rule-based "agent" for plain-English questions. It shows its work the
// way an LLM agent would (plan → tool call → result → answer), and writes the SQL
// it runs. There is no model and no network call; it all runs in the browser.

import { links, profile, projects } from "./content";
import type { Ctx, Shell } from "./shell";
import { query } from "./sql";
import { h, link, reducedMotion, sleep, type Child } from "./ui";
import { vinkMark } from "./views";

interface Intent {
  name: string;
  keywords: RegExp;
  sql?: string;
  answer: () => Child[];
  /** Vink's closing question, and the command a "yes" runs. */
  offer: [question: string, run: string];
}

const ternodbi = projects.find((p) => p.slug === "ternodbi")!;

const intents: Intent[] = [
  {
    name: "ternodbi",
    keywords: /\b(ternodbi|dbi|mcp|connector|connectors|data layer|oauth)\b/gi,
    answer: () => [
      h("strong", {}, "TernoDBI"),
      ` is one part of Navin's work at Terno AI: an open-source MCP server (on PyPI) where he's the top contributor (300+ commits). AI agents connect over MCP; every query is validated and scoped. He built the hosted MCP server with OAuth, the API connectors (GA4, Google Ads, Meta Ads, Shopify, HubSpot, Instagram …), multi-tenancy and the streaming query engine. `,
    ],
    offer: ["Want the full TernoDBI details?", "projects ternodbi"],
  },
  {
    name: "sqlshield",
    keywords: /\b(sqlshield|shield|sql injection|secure sql|safe sql)\b/gi,
    answer: () => [
      h("strong", {}, "SQLShield"),
      " sits between LLM-generated SQL and the database: it limits which tables, columns and rows a query can touch, and rewrites the query before it runs. Navin added Snowflake support and cross-platform builds. ",
    ],
    offer: ["Want the SQL Shield details?", "projects sqlshield"],
  },
  {
    name: "contact",
    keywords: /\b(contact|e-?mail|mail|reach|linkedin|hire|hiring|talk|connect|touch|availab\w*|open|looking|opportunit\w*|roles?|resume|cv)\b/gi,
    sql: "SELECT site, url FROM links WHERE site = 'email' OR site = 'linkedin'",
    answer: () => [
      "Navin is open to AI engineering roles. Email is fastest: ",
      link(`mailto:${links.email}`, links.email),
      ". He's also on ",
      link(links.linkedin, "LinkedIn"),
      ".",
    ],
    offer: ["Want all his links?", "contact"],
  },
  {
    name: "projects",
    keywords: /\b(projects?|built|build|made|portfolio|open.?source|github|side|agents?|evals?|rag|memory)\b/gi,
    sql: "SELECT name, kind, year FROM projects ORDER BY year DESC LIMIT 5",
    answer: () => [
      "At Terno AI, Navin builds ",
      h("strong", {}, "AI agents"),
      " (LangChain, CrewAI, AutoGen, OpenAI SDK and custom), the ",
      h("strong", {}, "evaluation framework"),
      " that tests them, a self-improving ",
      h("strong", {}, "RAG memory"),
      ", and the MCP layer — including the open-source TernoDBI. Earlier: the PyQuest app and a financial RAG assistant. ",
    ],
    offer: ["Want to see all his projects?", "projects"],
  },
  {
    name: "experience",
    keywords: /\b(experience|jobs?|work(ed|s|ing)?|intern(ship)?|compan(y|ies)|career|employ|currently|now)\b/gi,
    sql: "SELECT org, title, kind FROM experience WHERE kind != 'education'",
    answer: () => [
      `Navin is an ${profile.role} at ${profile.company}, building ${profile.project} — agents, evals, RAG memory and MCP. Before that: an SDE internship at CloudxLab (the PyQuest app), an AI internship at Scientific Investing, and R&D at Tata Steel. `,
    ],
    offer: ["Want the full timeline?", "experience"],
  },
  {
    name: "skills",
    keywords: /\b(skills?|stack|tech|languages?|frameworks?|tools?|know|python|sql|pytorch|django|aws|typescript)\b/gi,
    sql: "SELECT area, name FROM skills WHERE area = 'ai / ml'",
    answer: () => [
      "Navin uses Python and SQL every day; LangChain, CrewAI, AutoGen, MCP, RAG and text-to-SQL for agents; PyTorch, Hugging Face and scikit-learn for ML; Django, Celery, React and Flutter for apps; Docker and AWS to ship it. ",
    ],
    offer: ["Want the full skills list?", "skills"],
  },
  {
    name: "education",
    keywords: /\b(educat\w*|stud(y|ied)|college|university|degree|iit|jodhpur|cgpa|gpa|b\.?tech)\b/gi,
    sql: "SELECT org, title FROM experience WHERE kind = 'education'",
    answer: () => ["Navin did his B.Tech at IIT Jodhpur, CGPA 8.15."],
    offer: ["Want his full timeline?", "experience"],
  },
  {
    name: "hobbies",
    keywords: /\b(hobb\w*|films?|movies?|photo\w*|fitness|gym|meditat\w*|free time|fun|offline|youtube|instagram)\b/gi,
    answer: () => [
      `Off-screen Navin makes films, and he's into ${profile.offline.slice(1).join(", ")}. The films are on `,
      link(links.youtube, "YouTube"),
      ".",
    ],
    offer: ["Want to know more about him?", "about"],
  },
  {
    name: "about",
    keywords: /\b(who|about|yourself|navin|introduce|summary|tl;?dr|focus|interests?|do|does)\b/gi,
    answer: () => [`${profile.name} is an ${profile.role} at ${profile.company}, building ${profile.project}. He builds AI agents and the systems around them: agent frameworks, evaluation pipelines, RAG memory, MCP servers and safe text-to-SQL.`],
    offer: ["Want the 30‑second summary?", "tldr"],
  },
];

/** The question's words plus their simple stems, so "builds" also matches "build". */
function forms(question: string): string {
  const out = new Set<string>();
  for (const w of question.toLowerCase().match(/[a-z0-9.;+#-]+/g) ?? []) {
    out.add(w);
    for (const end of ["ing", "ed", "es", "s"]) if (w.length > end.length + 2 && w.endsWith(end)) out.add(w.slice(0, -end.length));
  }
  return [...out].join(" ");
}

function pick(question: string): { intent: Intent; score: number } | undefined {
  let best: { intent: Intent; score: number } | undefined;
  const text = forms(question);
  for (const intent of intents) {
    const score = text.match(intent.keywords)?.length ?? 0;
    if (score > (best?.score ?? 0)) best = { intent, score };
  }
  return best;
}

/** A tool call, drawn like the opening session: "Working…" for a beat, then the call and a one-line result. */
async function toolLine(ctx: Ctx, list: HTMLElement, tool: string, args: string, working: string, result: () => string) {
  const call = h("p", { class: "ag-call" }, h("span", { class: "spinner", "aria-hidden": "true" }), h("span", { class: "ag-working" }, working));
  const meta = h("span", { class: "ag-meta" });
  list.append(
    h(
      "li",
      { class: "ag-step ag-tool", style: "--delay:0s; --at:0s" },
      h("span", { class: "ag-dot ag-dot-tool", "aria-hidden": "true" }),
      h("div", {}, call, h("div", { class: "ag-result" }, meta)),
    ),
  );
  ctx.add(document.createTextNode("")); // nudge the shell to keep following output
  if (!reducedMotion()) await sleep(420 + Math.random() * 260);
  call.replaceChildren(h("span", {}, h("strong", {}, tool), h("code", {}, `(${args})`)));
  meta.textContent = result();
}

/** Vink's reply: his face and the answer, ending with his question if he has one. */
function reply(list: HTMLElement, answer: Child[], question?: string) {
  list.append(
    h(
      "li",
      { class: "ag-step ag-reply", style: "--delay:0s" },
      vinkMark(),
      h("div", {}, h("p", {}, ...answer, question ? h("span", { class: "ag-offer" }, " ", question) : null)),
    ),
  );
}

// What Vink last offered, so a plain "yes" can run it.
let offered: string | null = null;

/** Remember (or clear) Vink's open offer, and hint the reply in the prompt. */
export function setOffer(run: string | null, shell: Shell) {
  offered = run;
  shell.setHint(run ? "yes" : null);
}

const YES = /^(y|yes|yeah|yep|yup|sure|ok(ay)?|please|go ahead|do it|show me)[.!]*$/i;
const NO = /^(n|no|nope|nah|not now|no thanks?)[.!]*$/i;

/** Is this a short yes/no reply to Vink rather than a command or question? */
export const isReply = (line: string) => YES.test(line.trim()) || NO.test(line.trim());

/** Answers a yes/no: "yes" runs what Vink offered, "no" lets it go. */
export async function answerReply(line: string, ctx: Ctx) {
  const pending = offered;
  setOffer(null, ctx.shell);
  if (YES.test(line.trim()) && pending) {
    await ctx.shell.exec(pending, ctx);
    return;
  }
  const list = ctx.add(h("ol", { class: "agent agent-answer", "aria-label": "Vink's answer" }));
  if (YES.test(line.trim())) {
    // Nothing was on offer: suggest the best starting point, so the next "yes" does something.
    reply(list, ["Sure. The quickest way in is the 30‑second summary."], "Want it?");
    setOffer("tldr", ctx.shell);
    return;
  }
  reply(list, ["No worries. Ask me anything else about Navin whenever you like."]);
}

export async function ask(question: string, ctx: Ctx) {
  const list = ctx.add(h("ol", { class: "agent agent-answer", "aria-label": "Vink's answer" }));
  const hit = pick(question);

  if (!hit) {
    reply(
      list,
      ["I didn't quite catch that. I know about Navin's projects, experience, skills, education and how to reach him."],
      "Want the 30‑second summary to start?",
    );
    setOffer("tldr", ctx.shell);
    return;
  }

  const { intent } = hit;
  if (intent.sql) {
    const sql = intent.sql;
    await toolLine(ctx, list, "Query", sql, "Querying…", () => {
      const t0 = performance.now();
      const n = query(sql).rows.length;
      const ms = performance.now() - t0;
      return `${n} row${n === 1 ? "" : "s"} · ${ms < 1 ? "<1" : Math.round(ms)} ms`;
    });
  } else {
    await toolLine(ctx, list, "Read", `memory "${intent.name}"`, "Reading…", () =>
      intent.name === "ternodbi" ? `${ternodbi.highlights?.length ?? 0} facts` : "found",
    );
  }
  reply(list, intent.answer(), intent.offer[0]);
  setOffer(intent.offer[1], ctx.shell);
}

/** Does Vink recognise the topic, even in a short phrase like "his skills"? */
export const canAnswer = (input: string) => !!pick(input);

/** Does unknown input read like a question rather than a mistyped command? */
export function looksLikeQuestion(input: string): boolean {
  const s = input.trim();
  return s.endsWith("?") || s.split(/\s+/).length >= 3 || /^(who|what|where|when|why|how|is|are|does|do|can|tell)\b/i.test(s);
}
