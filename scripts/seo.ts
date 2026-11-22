// Build-time SEO: the site renders in JS, but search engines and AI crawlers
// (GPTBot, ClaudeBot, PerplexityBot…) mostly read raw HTML. This plugin writes
// the same content from src/content.ts into index.html as plain semantic HTML,
// adds JSON-LD, and emits robots.txt, sitemap.xml, llms.txt and llms-full.txt.

import type { Plugin } from "vite";
import { experience, focusAreas, links, profile, projects, recruiter, skills } from "../src/content";

const SITE = "https://navinbhagat322.github.io/";
const ALSO_KNOWN_AS = ["Navin Bhagat"];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const a = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;

const today = () => new Date().toISOString().slice(0, 10);
const openSource = projects.filter((p) => p.kind === "open-source" && p.url);
const sameAs = [links.linkedin, links.github, links.pypi, links.youtube, links.instagram];
const summary = `${profile.name} is an ${profile.role} at ${profile.company} in ${profile.location}, building ${profile.project}. He ${profile.tagline.charAt(0).toLowerCase()}${profile.tagline.slice(1)} ${profile.looking}.`;

function jsonLd() {
  const person = {
    "@type": "Person",
    "@id": `${SITE}#person`,
    name: profile.name,
    alternateName: ALSO_KNOWN_AS,
    url: SITE,
    image: `${SITE}og.png`,
    email: `mailto:${links.email}`,
    jobTitle: profile.role,
    description: summary,
    worksFor: { "@type": "Organization", name: profile.company, url: "https://cloudxlab.com" },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Jodhpur", alternateName: "IIT Jodhpur", url: "https://iitj.ac.in" },
    homeLocation: { "@type": "Place", name: profile.location, address: { "@type": "PostalAddress", addressLocality: "Pune", addressRegion: "Maharashtra", addressCountry: "IN" } },
    knowsAbout: [...new Set([...profile.focus, ...skills.map((s) => s.name)])],
    sameAs,
  };
  const code = openSource.map((p) => ({
    "@type": "SoftwareSourceCode",
    name: p.name,
    description: p.summary,
    codeRepository: p.url,
    programmingLanguage: "Python",
    keywords: p.stack.join(", "),
    author: { "@id": `${SITE}#person` },
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE}#website`, url: SITE, name: profile.name, inLanguage: "en" },
      {
        "@type": "ProfilePage",
        "@id": `${SITE}#profile`,
        url: SITE,
        name: `${profile.name} — ${profile.role}`,
        isPartOf: { "@id": `${SITE}#website` },
        dateModified: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
        mainEntity: { "@id": `${SITE}#person` },
      },
      person,
      ...code,
    ],
  };
}

/** The whole site as plain HTML, for crawlers and anyone without JS. */
function staticHtml() {
  const project = (p: (typeof projects)[number]) => `
      <article>
        <h3>${p.url ? a(p.url, p.name) : esc(p.name)} <small>(${p.year})</small></h3>
        <p>${esc(p.summary)}</p>
        ${p.highlights ? `<ul>${p.highlights.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        <p>Stack: ${esc(p.stack.join(", "))}</p>
      </article>`;
  const areas = [...new Set(skills.map((s) => s.area))];
  return `
    <div class="prerender">
      <header>
        <h1>${esc(profile.name)} — ${esc(profile.role)}</h1>
        <p>${esc(summary)}</p>
        <p>${a(`mailto:${links.email}`, links.email)} · ${a(links.linkedin, "LinkedIn")} · ${a(links.github, "GitHub")} · ${a(links.pypi, "PyPI")}</p>
      </header>
      <section>
        <h2>What he builds</h2>
        <ul>${focusAreas.map((f) => `<li><strong>${esc(f.title)}:</strong> ${esc(f.body)}</li>`).join("")}</ul>
      </section>
      <section>
        <h2>Highlights</h2>
        <ul>${recruiter.highlights.map((x) => `<li><strong>${esc(x.title)}:</strong> ${esc(x.body)}</li>`).join("")}</ul>
      </section>
      <section>
        <h2>Projects</h2>${projects.map(project).join("")}
      </section>
      <section>
        <h2>Experience and education</h2>
        <ul>${experience
          .map((r) => `<li><strong>${esc(r.title)}</strong>, ${esc(r.org)} (${esc(r.period)}): ${esc(r.points.join("; "))}</li>`)
          .join("")}</ul>
      </section>
      <section>
        <h2>Skills</h2>
        <ul>${areas.map((ar) => `<li><strong>${esc(ar)}:</strong> ${esc(skills.filter((s) => s.area === ar).map((s) => s.name).join(", "))}</li>`).join("")}</ul>
      </section>
      <section>
        <h2>Contact</h2>
        <p>${esc(profile.looking)}. Email ${a(`mailto:${links.email}`, links.email)}, or find him on ${a(links.linkedin, "LinkedIn")}, ${a(links.github, "GitHub")}, ${a(links.youtube, "YouTube")} and ${a(links.instagram, "Instagram")}.</p>
      </section>
    </div>`;
}

/** llms.txt: a short Markdown brief for AI assistants (https://llmstxt.org). */
function llmsTxt() {
  return `# ${profile.name}

> ${summary}

Also known as: ${ALSO_KNOWN_AS.join(", ")}. Education: ${profile.education}.

## Highlights

${recruiter.highlights.map((x) => `- ${x.href ? `[${x.title}](${x.href})` : x.title}: ${x.body}`).join("\n")}

## Open source

${openSource.map((p) => `- [${p.name}](${p.url}): ${p.summary}`).join("\n")}

## Links

- [Website](${SITE})
- [Full profile for LLMs](${SITE}llms-full.txt)
- [LinkedIn](${links.linkedin})
- [GitHub](${links.github})
- [PyPI](${links.pypi})
- Email: ${links.email}
`;
}

function llmsFullTxt() {
  const areas = [...new Set(skills.map((s) => s.area))];
  return `# ${profile.name} — ${profile.role}

> ${summary}

- Also known as: ${ALSO_KNOWN_AS.join(", ")}
- Current role: ${profile.role} at ${profile.company}, building ${profile.project}
- Location: ${profile.location}
- Education: ${profile.education}
- Status: ${profile.looking}
- Contact: ${links.email} · ${links.linkedin} · ${links.github}

## What he builds

${focusAreas.map((f) => `- **${f.title}:** ${f.body}`).join("\n")}

## Projects

${projects
  .map(
    (p) =>
      `### ${p.url ? `[${p.name}](${p.url})` : p.name} (${p.year})\n\n${p.summary}\n${
        p.highlights ? `\n${p.highlights.map((x) => `- ${x}`).join("\n")}\n` : ""
      }\nStack: ${p.stack.join(", ")}`,
  )
  .join("\n\n")}

## Experience and education

${experience.map((r) => `### ${r.title}, ${r.org} (${r.period})\n\n${r.points.map((x) => `- ${x}`).join("\n")}`).join("\n\n")}

## Skills

${areas.map((ar) => `- **${ar}:** ${skills.filter((s) => s.area === ar).map((s) => s.name).join(", ")}`).join("\n")}

## Links

${[["LinkedIn", links.linkedin], ["GitHub", links.github], ["PyPI", links.pypi], ["YouTube", links.youtube], ["Instagram", links.instagram]]
  .map(([n, u]) => `- [${n}](${u})`)
  .join("\n")}
`;
}

const robotsTxt = () => `# Search engines and AI assistants are welcome here.
User-agent: *
Allow: /

Sitemap: ${SITE}sitemap.xml
`;

const sitemapXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}</loc><lastmod>${today()}</lastmod></url>
</urlset>
`;

const files: Record<string, () => string> = {
  "robots.txt": robotsTxt,
  "sitemap.xml": sitemapXml,
  "llms.txt": llmsTxt,
  "llms-full.txt": llmsFullTxt,
};

export function seo(): Plugin {
  return {
    name: "portfolio-seo",
    transformIndexHtml(html) {
      const ld = JSON.stringify(jsonLd()).replace(/</g, "\\u003c");
      return html
        .replace("<!--seo:jsonld-->", `<script type="application/ld+json">${ld}</script>`)
        .replace('<div id="app"></div>', `<div id="app">${staticHtml()}\n    </div>`);
    },
    // Serve the generated files in dev too.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split("?")[0].slice(1) ?? "";
        const make = files[name];
        if (!make) return next();
        res.setHeader("Content-Type", name.endsWith(".xml") ? "application/xml" : "text/plain; charset=utf-8");
        res.end(make());
      });
    },
    generateBundle() {
      for (const [fileName, make] of Object.entries(files)) this.emitFile({ type: "asset", fileName, source: make() });
    },
  };
}
