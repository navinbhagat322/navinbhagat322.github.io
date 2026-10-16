// The opening line: "I build ___", where the blank types itself out, holds,
// erases, and moves on to the next thing Navin builds. The current phrase is a
// button that opens that project.

import { h, reducedMotion, sleep } from "./ui";

export interface Phrase {
  text: string;
  /** Command run when the phrase is clicked. */
  run: string;
}

export const PHRASES: Phrase[] = [
  { text: "AI Agents", run: "projects agents" },
  { text: "Agent Evals", run: "projects evals" },
  { text: "RAG Memory", run: "projects rag-memory" },
  { text: "MCP Servers", run: "projects ternodbi" },
  { text: "Safe Text-to-SQL", run: "projects sqlshield" },
];

export function headline(): HTMLElement {
  const word = h("span", { class: "rot-word" }, PHRASES[0].text);
  const button = h("button", { type: "button", class: "rot", "data-run": PHRASES[0].run, title: "Open this project" }, word, h("span", { class: "rot-caret", "aria-hidden": "true" }));
  const root = h(
    "h2",
    { class: "headline", "aria-label": `I build ${PHRASES.map((p) => p.text).join(", ")}` },
    h("span", { class: "headline-lead", "aria-hidden": "true" }, "I build"),
    button,
  );
  button.setAttribute("aria-hidden", "true");

  if (reducedMotion()) return root;

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(root);
  const waitUntilShown = async () => {
    while (!visible || document.hidden) await sleep(400);
  };

  void (async () => {
    let i = 0;
    await sleep(2600);
    for (;;) {
      await waitUntilShown();
      // erase
      for (let n = word.textContent!.length; n >= 0; n--) {
        word.textContent = PHRASES[i].text.slice(0, n);
        await sleep(28);
      }
      i = (i + 1) % PHRASES.length;
      button.dataset.run = PHRASES[i].run;
      button.classList.add("typing");
      await sleep(220);
      // type
      for (let n = 1; n <= PHRASES[i].text.length; n++) {
        word.textContent = PHRASES[i].text.slice(0, n);
        await sleep(55 + Math.random() * 35);
      }
      button.classList.remove("typing");
      await sleep(2300);
    }
  })();

  return root;
}
