// The shell. Each command runs in its own "block" (header + output), and the
// composer at the bottom does syntax highlighting, fish-style ghost suggestions
// and a completion popover. It knows nothing about Navin; commands come from outside.

import { h, icon, reducedMotion, sleep, type Child } from "./ui";

export interface Ctx {
  args: string[];
  raw: string;
  shell: Shell;
  block: Block;
  /** Append a line (or any nodes) to this block's output. */
  out: (...children: Child[]) => HTMLElement;
  /** Append a ready-made node. */
  add: <T extends Node>(node: T) => T;
  error: (message: string) => void;
}

export interface Command {
  name: string;
  summary: string;
  usage?: string;
  aliases?: string[];
  hidden?: boolean;
  group?: "explore" | "tools" | "play" | "system";
  /** Values offered after the command name. */
  complete?: () => string[];
  run: (ctx: Ctx) => void | Promise<void>;
}

const SQL_KEYWORDS = /^(select|from|where|and|or|order|by|asc|desc|limit|like|ilike|show|tables|describe|count)$/i;

export class Block {
  readonly el: HTMLElement;
  readonly body: HTMLElement;
  private readonly meta: HTMLElement;
  private readonly started = performance.now();

  constructor(command: Node, path: string) {
    this.meta = h("span", { class: "block-meta" }, h("span", { class: "spinner", "aria-hidden": "true" }));
    this.body = h("div", { class: "block-body" });
    this.el = h(
      "section",
      { class: "block running" },
      h(
        "header",
        { class: "block-head" },
        h("span", { class: "block-path" }, path),
        h("span", { class: "block-chevron", "aria-hidden": "true" }, "❯"),
        h("span", { class: "block-cmd" }, command),
        this.meta,
      ),
      this.body,
    );
  }

  finish(ok: boolean) {
    const ms = performance.now() - this.started;
    this.el.classList.remove("running");
    this.el.classList.add(ok ? "succeeded" : "failed");
    this.meta.replaceChildren(
      h("span", { class: "block-status" }, ok ? icon("check", 12) : "✕"),
      ms < 1000 ? `${Math.max(1, Math.round(ms))}ms` : `${(ms / 1000).toFixed(1)}s`,
    );
    if (!this.body.hasChildNodes()) this.el.classList.add("empty");
  }
}

export class Shell {
  readonly feed: HTMLElement;
  readonly composer: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly overlay: HTMLElement;
  private readonly popover: HTMLElement;
  private readonly commands = new Map<string, Command>();
  private history: string[] = [];
  private cursor = 0;
  private busy = false;
  private ghost = "";
  private options: { value: string; label: string; hint: string }[] = [];
  private selected = -1;
  /** Phrases offered as ghost suggestions besides history and command names. */
  examples: string[] = [];
  /** Called for input that matches no command. */
  fallback?: (ctx: Ctx, line: string) => void | Promise<void>;
  /** Called as a command starts, and after it finishes. */
  onStart?: (name: string, line: string) => void;
  onRun?: (info: { name: string; line: string; ok: boolean; known: boolean }) => void;

  constructor(
    private readonly scroller: HTMLElement,
    readonly path: string,
  ) {
    this.feed = h("div", { class: "feed", role: "log", "aria-live": "polite" });
    scroller.append(this.feed);

    this.input = h("input", {
      class: "composer-input",
      type: "text",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      enterkeyhint: "go",
      "aria-label": "Type a command, or ask a question",
      "aria-autocomplete": "list",
      "aria-controls": "suggestions",
    });
    this.overlay = h("div", { class: "composer-overlay", "aria-hidden": "true" });
    this.popover = h("div", { class: "popover", id: "suggestions", role: "listbox", hidden: true });
    this.composer = h(
      "div",
      { class: "composer" },
      this.popover,
      h(
        "label",
        { class: "composer-field" },
        h("span", { class: "composer-chevron", "aria-hidden": "true" }, "❯"),
        h("span", { class: "composer-stack" }, this.overlay, this.input),
        h("span", { class: "composer-hint" }, h("kbd", {}, "↵"), " run"),
      ),
    );

    this.input.addEventListener("input", () => this.refresh());
    this.input.addEventListener("keydown", (e) => this.onKey(e));
    this.input.addEventListener("scroll", () => (this.overlay.scrollLeft = this.input.scrollLeft));
    this.input.addEventListener("blur", () => setTimeout(() => this.closePopover(), 120));
    this.input.addEventListener("focus", () => this.refresh());

    try {
      this.history = JSON.parse(localStorage.getItem("history") ?? "[]");
    } catch {
      this.history = [];
    }
    this.cursor = this.history.length;
    this.refresh();
  }

  // ---------- registry ----------

  register(...cmds: Command[]) {
    for (const c of cmds) {
      this.commands.set(c.name, c);
      c.aliases?.forEach((a) => this.commands.set(a, c));
    }
  }

  list(): Command[] {
    return [...new Set(this.commands.values())].filter((c) => !c.hidden);
  }

  get(name: string) {
    return this.commands.get(name.toLowerCase());
  }

  getHistory() {
    return [...this.history];
  }

  // ---------- running ----------

  focus() {
    this.input.focus({ preventScroll: true });
  }

  clear() {
    this.feed.replaceChildren();
  }

  /** Adds a non-command node (like the welcome card) to the feed. */
  addToFeed(node: Node) {
    this.feed.append(node);
  }

  /** Types the command into the composer like a person would, then runs it. */
  async type(text: string) {
    if (this.busy) return;
    this.busy = true;
    this.closePopover();
    this.input.value = "";
    if (!reducedMotion()) {
      const delay = Math.max(8, Math.min(28, 600 / text.length));
      for (const ch of text) {
        this.input.value += ch;
        this.refresh(false);
        await sleep(delay + Math.random() * 12);
      }
    }
    this.busy = false;
    await this.run(text);
  }

  async run(raw: string) {
    if (this.busy) return;
    const line = raw.trim();
    this.input.value = "";
    this.refresh();
    if (!line) return;

    if (this.history[this.history.length - 1] !== line) this.history.push(line);
    this.history = this.history.slice(-200);
    this.cursor = this.history.length;
    try {
      localStorage.setItem("history", JSON.stringify(this.history));
    } catch {
      /* private mode: history just won't persist */
    }

    const block = new Block(this.highlight(line), this.path);
    this.feed.append(block.el);
    this.scrollToEnd();

    const ctx = this.ctx(block, line);
    const name = line.split(/\s+/)[0].toLowerCase();
    const cmd = this.get(name);
    this.busy = true;
    this.composer.classList.add("busy");
    this.onStart?.(name, line);
    let ok = true;
    try {
      if (cmd) await cmd.run(ctx);
      else if (this.fallback) await this.fallback(ctx, line);
      else ctx.error(`command not found: ${name}`);
      ok = !block.el.classList.contains("has-error");
    } catch (err) {
      ctx.error(err instanceof Error ? err.message : String(err));
      ok = false;
    } finally {
      block.finish(ok);
      this.busy = false;
      this.composer.classList.remove("busy");
      this.settleScroll(block);
      this.focus();
      this.onRun?.({ name, line, ok, known: !!cmd });
    }
  }

  /** Runs a command inside another command's block. */
  async exec(line: string, parent: Ctx) {
    const name = line.trim().split(/\s+/)[0];
    const cmd = this.get(name);
    if (!cmd) throw new Error(`command not found: ${name}`);
    await cmd.run(this.ctx(parent.block, line.trim()));
  }

  private ctx(block: Block, line: string): Ctx {
    const [name, ...args] = line.split(/\s+/);
    const add = <T extends Node>(node: T): T => {
      block.body.append(node);
      this.followOutput(block);
      return node;
    };
    return {
      args,
      raw: line.slice(name.length).trim(),
      shell: this,
      block,
      add,
      out: (...children) => add(h("div", { class: "line" }, ...children)),
      error: (message) => {
        block.el.classList.add("has-error");
        add(h("div", { class: "line error" }, message));
      },
    };
  }

  private scrollToEnd() {
    this.scroller.scrollTop = this.scroller.scrollHeight;
  }

  /** While a block streams, keep following it unless it outgrew the viewport. */
  private followOutput(block: Block) {
    if (block.el.offsetHeight < this.scroller.clientHeight - 40) this.scrollToEnd();
  }

  /** A tall result is read from its top; a short one keeps the composer in view. */
  private settleScroll(block: Block) {
    if (block.el.offsetHeight > this.scroller.clientHeight - 40) {
      const offset = block.el.getBoundingClientRect().top - this.scroller.getBoundingClientRect().top;
      this.scroller.scrollTo({
        top: this.scroller.scrollTop + offset,
        behavior: reducedMotion() ? "auto" : "smooth",
      });
    } else this.scrollToEnd();
  }

  // ---------- composer ----------

  /** Colours a command line: known command, unknown command, flags, strings, SQL keywords. */
  highlight(line: string): DocumentFragment {
    const frag = document.createDocumentFragment();
    const parts = line.split(/(\s+)/);
    const first = parts.findIndex((p) => p.trim());
    const isSql = parts[first]?.toLowerCase() === "sql";
    let inString = false;
    parts.forEach((part, i) => {
      if (!part.trim()) {
        frag.append(part);
        return;
      }
      let cls = "";
      if (i === first) cls = this.get(part) ? "tok-cmd" : "tok-word";
      else if (inString || /^['"]/.test(part)) {
        cls = "tok-str";
        const quotes = (part.match(/'/g) ?? []).length;
        if (quotes % 2 === 1) inString = !inString;
      } else if (/^--?\w/.test(part)) cls = "tok-flag";
      else if (isSql && SQL_KEYWORDS.test(part.replace(/[,;()]/g, ""))) cls = "tok-kw";
      else if (/^\d+$/.test(part)) cls = "tok-num";
      frag.append(cls ? h("span", { class: cls }, part) : part);
    });
    return frag;
  }

  private refresh(withPopover = true) {
    const value = this.input.value;
    this.ghost = this.suggest(value);
    this.overlay.replaceChildren(
      this.highlight(value),
      this.ghost ? h("span", { class: "ghost" }, this.ghost.slice(value.length)) : "",
      !value ? h("span", { class: "placeholder" }, "type a command, or ask anything about me…") : "",
    );
    this.overlay.scrollLeft = this.input.scrollLeft;
    if (withPopover && document.activeElement === this.input) this.updatePopover(value);
    else this.closePopover();
  }

  private suggest(value: string): string {
    if (!value.trim() || this.input.selectionStart !== value.length) return "";
    const lower = value.toLowerCase();
    const fromHistory = [...this.history].reverse().find((h) => h.toLowerCase().startsWith(lower) && h.length > value.length);
    if (fromHistory) return value + fromHistory.slice(value.length);
    const pool = [...this.list().map((c) => c.name), ...this.examples];
    const hit = pool.find((p) => p.toLowerCase().startsWith(lower) && p.length > value.length);
    return hit ? value + hit.slice(value.length) : "";
  }

  private updatePopover(value: string) {
    const trimmed = value.trimStart();
    const parts = trimmed.split(/\s+/);
    let options: typeof this.options = [];

    if (trimmed && parts.length === 1) {
      const q = parts[0].toLowerCase();
      options = this.list()
        .filter((c) => c.name.startsWith(q) && c.name !== q)
        .map((c) => ({ value: c.name, label: c.name, hint: c.summary }));
    } else if (parts.length >= 2) {
      const cmd = this.get(parts[0]);
      const partial = parts[parts.length - 1].toLowerCase();
      const head = trimmed.slice(0, trimmed.length - parts[parts.length - 1].length);
      options = (cmd?.complete?.() ?? [])
        .filter((o) => o.toLowerCase().startsWith(partial) && o.toLowerCase() !== partial)
        .map((o) => ({ value: head + o, label: o, hint: cmd!.name }));
    }

    this.options = options.slice(0, 7);
    if (!this.options.length) {
      this.closePopover();
      return;
    }
    this.selected = Math.min(this.selected, this.options.length - 1);
    this.popover.replaceChildren(
      ...this.options.map((o, i) =>
        h(
          "button",
          {
            type: "button",
            role: "option",
            class: "popover-item",
            "aria-selected": i === this.selected ? "true" : "false",
            onMousedown: (e: Event) => {
              e.preventDefault();
              this.accept(o.value);
            },
          },
          h("span", { class: "popover-label" }, o.label),
          h("span", { class: "popover-hint" }, o.hint),
        ),
      ),
    );
    this.popover.hidden = false;
  }

  private closePopover() {
    this.popover.hidden = true;
    this.options = [];
    this.selected = -1;
  }

  private accept(value: string) {
    this.input.value = value + " ";
    this.closePopover();
    this.refresh();
    this.focus();
  }

  private onKey(e: KeyboardEvent) {
    const open = !this.popover.hidden && this.options.length > 0;
    switch (e.key) {
      case "Enter": {
        e.preventDefault();
        if (open && this.selected >= 0) {
          this.input.value = this.options[this.selected].value;
          this.closePopover();
        }
        void this.run(this.input.value);
        return;
      }
      case "Tab": {
        e.preventDefault();
        if (open) this.accept(this.options[Math.max(0, this.selected)].value);
        else if (this.ghost) this.accept(this.ghost.trimEnd());
        return;
      }
      case "ArrowRight": {
        if (this.ghost && this.input.selectionStart === this.input.value.length) {
          e.preventDefault();
          this.input.value = this.ghost;
          this.refresh();
        }
        return;
      }
      case "ArrowUp":
      case "ArrowDown": {
        e.preventDefault();
        const step = e.key === "ArrowUp" ? -1 : 1;
        if (open) {
          const n = this.options.length;
          this.selected = this.selected < 0 ? (step > 0 ? 0 : n - 1) : (this.selected + step + n) % n;
          [...this.popover.children].forEach((c, i) => c.setAttribute("aria-selected", String(i === this.selected)));
          return;
        }
        this.cursor = Math.max(0, Math.min(this.history.length, this.cursor + step));
        this.input.value = this.history[this.cursor] ?? "";
        this.refresh(false);
        return;
      }
      case "Escape": {
        if (open) this.closePopover();
        else {
          this.input.value = "";
          this.refresh();
        }
        return;
      }
    }
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      this.clear();
    } else if (e.ctrlKey && e.key === "c" && !window.getSelection()?.toString()) {
      this.input.value = "";
      this.refresh();
    } else if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      this.input.value = "";
      this.refresh();
    }
    // Keep the overlay in step with caret moves that don't fire "input".
    requestAnimationFrame(() => {
      if (e.key === "ArrowLeft" || e.key === "Home" || e.key === "End") this.refresh(false);
    });
  }
}
