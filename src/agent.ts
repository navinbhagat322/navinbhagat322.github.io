// A small rule-based "agent" for plain-English questions. It shows its work the
// way an LLM agent would (plan → tool call → result → answer), and writes the SQL
// it runs. There is no model and no network call; it all runs in the browser.

import { links, profile, projects } from "./content";
import type { Ctx } from "./shell";
import { query } from "./sql";
import { cmd, h, icon, link, reducedMotion, sleep, type Child } from "./ui";
import { sqlTable } from "./views";

interface Intent {
  name: string;
  keywords: RegExp;
  sql?: string;
  showTable?: boolean;
  answer: () => Child[];
}

const ternodbi = projects.find((p) => p.slug === "ternodbi")!;

const intents: Intent[] = [
  {
    name: "ternodbi",
    keywords: /\b(ternodbi|dbi|mcp|connector|connectors|data layer|oauth)\b/gi,
    answer: () => [
      h("strong", {}, "TernoDBI"),
      ` is the open-source database intelligence layer at TernoAI, and Navin is its top contributor (280+ commits). AI agents connect over MCP; every query is validated and scoped. He built the hosted MCP server with OAuth, the API connectors (GA4, Google Ads, Meta Ads, Shopify, HubSpot, Instagram …), multi-tenancy and the streaming query engine. `,
      cmd("projects ternodbi", "Full details →"),
    ],
  },
  {
    name: "sqlshield",
    keywords: /\b(sqlshield|shield|sql injection|secure sql|safe sql)\b/gi,
    answer: () => [
      h("strong", {}, "SQLShield"),
      " sits between LLM-generated SQL and the database: it limits which tables, columns and rows a query can touch, and rewrites the query before it runs. Navin added Snowflake support and cross-platform builds. ",
      cmd("projects sqlshield", "Details →"),
    ],
  },
  {
    name: "projects",
    keywords: /\b(projects?|built|build|made|portfolio|open.?source|github|side)\b/gi,
    sql: "SELECT name, kind, year FROM projects ORDER BY year DESC LIMIT 5",
    answer: () => [
      "His main work is ",
      h("strong", {}, "TernoDBI"),
      " and ",
      h("strong", {}, "SQLShield"),
      ", open-source infrastructure for letting AI agents query real databases safely. On the side: an air-gapped QR file transfer kit, a PDF RAG chatbot, and a few ML projects. ",
      cmd("projects", "See all →"),
    ],
  },
  {
    name: "experience",
    keywords: /\b(experience|jobs?|work(ed|s|ing)?|intern(ship)?|compan(y|ies)|career|employ|currently|now)\b/gi,
    sql: "SELECT org, title, kind FROM experience WHERE kind != 'education'",
    answer: () => [
      `He's an ${profile.role} at ${profile.company}. Before that he interned at CloudxLab (data science & ML) and Tata Steel (product R&D). `,
      cmd("experience", "Timeline →"),
    ],
  },
  {
    name: "skills",
    keywords: /\b(skills?|stack|tech|languages?|frameworks?|tools?|know|python|sql|pytorch|django|aws|typescript)\b/gi,
    sql: "SELECT area, name FROM skills WHERE area = 'ai / ml'",
    showTable: false,
    answer: () => [
      "Python and SQL every day; Django for backends; LLM agents, MCP, RAG and text-to-SQL on the AI side; Postgres, MySQL, Snowflake and BigQuery for data; AWS, Docker and Nginx to ship it. ",
      cmd("skills", "Full list →"),
    ],
  },
  {
    name: "education",
    keywords: /\b(educat\w*|stud(y|ied)|college|university|degree|iit|jodhpur|cgpa|gpa|b\.?tech)\b/gi,
    sql: "SELECT org, title FROM experience WHERE kind = 'education'",
    answer: () => [`${profile.education}, CGPA 8.15.`],
  },
  {
    name: "contact",
    keywords: /\b(contact|e-?mail|mail|reach|linkedin|hire|hiring|talk|connect|available|resume|cv)\b/gi,
    sql: "SELECT site, url FROM links WHERE site = 'email' OR site = 'linkedin'",
    answer: () => [
      "Email is fastest: ",
      link(`mailto:${links.email}`, links.email),
      ". He's also on ",
      link(links.linkedin, "LinkedIn"),
      ". ",
      cmd("contact", "All links →"),
    ],
  },
  {
    name: "hobbies",
    keywords: /\b(hobb\w*|films?|movies?|photo\w*|fitness|gym|meditat\w*|free time|fun|offline|youtube|instagram)\b/gi,
    answer: () => [
      `Off-screen he makes films, and is into ${profile.offline.slice(1).join(", ")}. The films are on `,
      link(links.youtube, "YouTube"),
      ".",
    ],
  },
  {
    name: "about",
    keywords: /\b(who|about|yourself|navin|introduce|summary|tl;?dr|focus|interests?)\b/gi,
    answer: () => [`${profile.name} — ${profile.role} at ${profile.company}. ${profile.tagline} `, cmd("about", "More →")],
  },
];

function pick(question: string): { intent: Intent; score: number } | undefined {
  let best: { intent: Intent; score: number } | undefined;
  for (const intent of intents) {
    const score = question.match(intent.keywords)?.length ?? 0;
    if (score > (best?.score ?? 0)) best = { intent, score };
  }
  return best;
}

function step(ctx: Ctx, list: HTMLElement, label: string, ...detail: Child[]) {
  const row = h(
    "li",
    { class: "step running" },
    h("span", { class: "step-icon" }, h("span", { class: "spinner" })),
    h("span", { class: "step-label" }, label),
    h("span", { class: "step-detail" }, ...detail),
  );
  list.append(row);
  ctx.add(document.createTextNode("")); // nudge the shell to keep following output
  return async (...result: Child[]) => {
    if (!reducedMotion()) await sleep(280 + Math.random() * 220);
    row.classList.remove("running");
    row.querySelector(".step-icon")!.replaceChildren(icon("check", 12));
    if (result.length) row.querySelector(".step-detail")!.append(h("span", { class: "muted" }, "  → ", ...result));
  };
}

export async function ask(question: string, ctx: Ctx) {
  const steps = ctx.add(h("ol", { class: "agent-steps" }));

  let done = step(ctx, steps, "plan", "reading the question");
  const hit = pick(question);
  await done(hit ? `intent: ${hit.intent.name}` : "no confident match");

  if (!hit) {
    ctx.add(
      h(
        "div",
        { class: "answer" },
        h("span", { class: "answer-icon" }, icon("sparkle", 15)),
        h(
          "p",
          {},
          "I'm a small rule-based agent, so I only know about Navin: his projects, experience, skills, education and how to reach him. Try ",
          cmd("ask what is ternodbi?"),
          " or ",
          cmd("help"),
          ".",
        ),
      ),
    );
    return;
  }

  const { intent } = hit;
  if (intent.sql) {
    done = step(ctx, steps, "tool", "sql.run(", h("code", {}, intent.sql), ")");
    const t0 = performance.now();
    const result = query(intent.sql);
    const ms = performance.now() - t0;
    await done(`${result.rows.length} row${result.rows.length === 1 ? "" : "s"}`);
    if (intent.showTable !== false) ctx.add(sqlTable(result, ms));
  } else {
    done = step(ctx, steps, "tool", "memory.read(", h("code", {}, `"${intent.name}"`), ")");
    await done(intent.name === "ternodbi" ? `${ternodbi.highlights?.length ?? 0} facts` : "found");
  }

  done = step(ctx, steps, "answer", "writing");
  await done();
  ctx.add(h("div", { class: "answer" }, h("span", { class: "answer-icon" }, icon("sparkle", 15)), h("p", {}, ...intent.answer())));
}

/** Does unknown input read like a question rather than a mistyped command? */
export function looksLikeQuestion(input: string): boolean {
  const s = input.trim();
  return s.endsWith("?") || s.split(/\s+/).length >= 3 || /^(who|what|where|when|why|how|is|are|does|do|can|tell)\b/i.test(s);
}
