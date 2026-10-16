// The same content as ordinary, semantic HTML, for anyone who'd rather read than type.

import { links, profile, projects } from "./content";
import { h, icon, link } from "./ui";
import { contactView, focusRow, skillsView, timeline } from "./views";
import { vinkSVG } from "./vink";

function vinkHead(): HTMLElement {
  const el = h("div", { class: "avatar vink-avatar", "aria-hidden": "true" });
  el.innerHTML = vinkSVG("head");
  return el;
}

export function renderPlain(root: HTMLElement) {
  document.body.classList.add("plain-mode");

  root.append(
    h(
      "article",
      { class: "plain" },
      h(
        "header",
        { class: "plain-head" },
        vinkHead(),
        h("h1", {}, profile.name),
        h("p", { class: "plain-role" }, `${profile.role} at ${profile.company} (${profile.project}) · ${profile.education}`),
        h("p", { class: "plain-tagline" }, profile.tagline),
        h(
          "div",
          { class: "plain-actions" },
          link(`mailto:${links.email}`, h("span", {}, icon("mail", 15), "Email me"), "btn primary"),
          link(links.github, h("span", {}, icon("github", 15), "GitHub"), "btn"),
          link(links.linkedin, h("span", {}, icon("linkedin", 15), "LinkedIn"), "btn"),
          h("a", { href: "./", class: "btn ghost" }, "❯ open the terminal"),
        ),
      ),
      focusRow(),
      h("h2", {}, "Projects"),
      h(
        "div",
        { class: "plain-projects" },
        ...projects.map((p) =>
          h(
            "div",
            { class: "plain-project" },
            h("h3", {}, p.url ? link(p.url, p.name) : p.name, h("span", { class: "muted" }, ` · ${p.year}`)),
            h("p", {}, p.summary),
            p.highlights ? h("ul", { class: "points" }, ...p.highlights.map((x) => h("li", {}, x))) : null,
            h("div", { class: "tags" }, ...p.stack.map((s) => h("span", { class: "tag" }, s))),
          ),
        ),
      ),
      h("h2", {}, "Experience"),
      timeline(),
      h("h2", {}, "Skills"),
      skillsView(),
      h("h2", {}, "Contact"),
      contactView(),
    ),
  );
}
