// Gamification glue: Vink reacts to what visitors do, quests unlock, XP grows.

import { activity, loadActivity, notable, repoName } from "./activity";
import { canAnswer, isReply, looksLikeQuestion } from "./agent";
import { projects } from "./content";
import { EXPLORE_COMMANDS, Game, levels, quests, type Quest } from "./game";
import type { Command, Shell } from "./shell";
import { onThemeChange } from "./theme";
import { cmd, h, icon, type Child } from "./ui";
import { Vink, vinkSVG, type Pose } from "./vink";

const HINTS: Record<string, () => Child[]> = {
  hello: () => ["Type ", cmd("help"), " to see what this terminal can do."],
  explorer: () => ["Start with ", cmd("projects"), ". The agents card is my favourite."],
  "deep-dive": () => ["Open a project up: ", cmd("projects agents"), "."],
  query: () => ["You can query the résumé with real SQL: ", cmd("sql SHOW TABLES"), "."],
  shipped: () => ["Curious what Navin's working on right now? ", cmd("activity"), " — straight from GitHub."],
  curious: () => ["Just type a question, like ", cmd("what is ternodbi?"), "."],
  palette: () => ["Press ⌘K (or Ctrl K). Everything's in there."],
  hacker: () => ["There are files in here. Try ", cmd("ls"), "."],
  theme: () => ["Too dark? Too bright? ", cmd("theme"), " flips it."],
  poke: () => ["You can poke me, you know. I don't bite."],
  lift: () => ["Fun fact: you can pick me up and drag me along the bar."],
  spark: () => ["See the dots behind everything? That's a neural network. Click it."],
  talk: () => ["Seen enough? ", cmd("contact"), " is where the good stuff happens."],
};

const FIRST_TIME: Record<string, Child[]> = {
  help: ["Pro tip: Tab completes, and → accepts my grey suggestions."],
  about: ["That's him. I'm the illustrated version — same hair, fewer meetings."],
  projects: ["The agents and the eval framework are the big ones. Hit details on them."],
  experience: ["From steel at Tata to SQL for AI agents. Quite the arc."],
  skills: ["Python and SQL are basically my first languages."],
  contact: ["Email's fastest. He actually replies."],
  sql: ["Real SQL, parsed and run right here in your browser."],
  activity: ["All public, pulled straight from GitHub every night. No manual updates."],
  stack: ["That's the whole thing, end to end. Click any part to open it."],
  ls: ["Go on, ", cmd("cat about.md"), "."],
};

export function setupPlay(shell: Shell, windowEl: HTMLElement, statusSlot: HTMLElement) {
  const game = new Game();
  const vink = new Vink();
  windowEl.append(vink.el);
  // Home: in the space to the right of the prompt box, standing level with it. Without room there
  // (narrow screens, phones), he stands on the prompt's right end instead.
  // In window pixels, undoing any scale from the window's opening animation.
  const rel = (el: Element) => {
    const w = windowEl.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const k = windowEl.offsetWidth / (w.width || 1);
    return {
      left: (r.left - w.left) * k,
      right: (r.right - w.left) * k,
      top: (r.top - w.top) * k,
      bottom: (r.bottom - w.top) * k,
      height: windowEl.offsetHeight,
    };
  };
  const shown = (sel: string) => {
    const el = windowEl.querySelector<HTMLElement>(sel);
    return el && el.offsetWidth ? el : null;
  };
  /** The empty strip between the prompt's right edge and the end of the left column, if he fits. */
  const besidePrompt = () => {
    const field = shown(".composer-field");
    const col = shown(".main-col");
    if (!field || !col) return null;
    const f = rel(field);
    const c = rel(col);
    return c.right - f.right >= vink.width + 28 ? { left: f.right + 14, right: c.right - 14, bottom: f.bottom, height: f.height } : null;
  };
  vink.homeSpot = () => {
    const gap = besidePrompt();
    // Centred in the space between the prompt and the side panel.
    if (gap) return { x: (gap.left + gap.right - vink.width) / 2, y: gap.height - gap.bottom - 6 };
    const field = shown(".composer-field");
    if (!field) return { x: 0, y: 0 };
    const f = rel(field);
    return { x: f.right - vink.width - 10, y: f.height - f.top - 2 };
  };
  vink.regions = () => {
    const gap = besidePrompt();
    const areas = [shown(".main-col"), shown(".sidebar")].filter((el): el is HTMLElement => !!el).map(rel);
    return gap ? [gap, ...areas] : areas;
  };
  // Phones have no free space for him, so he waits until someone taps the avatar.
  const small = () => window.matchMedia("(max-width: 640px)").matches;
  let tucked = small();
  vink.el.hidden = tucked;
  const bringOut = () => {
    if (!vink.el.hidden) return;
    tucked = false;
    vink.el.hidden = false;
    vink.settle();
  };
  vink.settle();
  window.addEventListener("load", () => vink.settle());
  windowEl.addEventListener("animationend", (e) => e.target === windowEl && vink.settle());
  new ResizeObserver(() => {
    if (tucked && !small()) bringOut();
    vink.settle();
  }).observe(windowEl);
  // Vink stands by quietly; hints and news wait until the visitor does something.
  let summoned = false;
  const firstVisit = game.xp === 0;
  const summon = () => {
    if (summoned) return;
    summoned = true;
    vink.setPose("wave", 1600);
    // A one-time introduction; returning visitors just get the wave.
    if (firstVisit && !quiet)
      chat(
        phone()
          ? ["Hi, I'm ", h("strong", {}, "Vink"), ", Navin's twin. Tap me for tips, or × to keep me quiet."]
          : ["Hi! I'm ", h("strong", {}, "Vink"), ", Navin's illustrated twin. Poke around and you'll unlock quests — ", cmd("quests"), " shows them all. × keeps me quiet."],
        6500,
      );
  };

  // Closing a bubble with × keeps Vink quiet from then on: no welcome, hints,
  // news or commentary. He still answers when poked or given a command.
  const phone = () => window.matchMedia("(max-width: 640px)").matches;
  let muted = load(MUTE_KEY) === "1";
  const chat = (content: Child | Child[], ms?: number) => {
    if (!muted && !vink.el.hidden) void vink.say(content, ms);
  };

  const toasts = h("div", { class: "toasts", "aria-live": "polite" });
  windowEl.append(toasts);

  // ---------- quest progress in the status bar (levels and XP live in the quests view) ----------
  const xpLabel = h("span", {});
  const xpBtn = h(
    "button",
    { type: "button", class: "xp sb-item sb-link", "data-run": "quests", title: "Your quests" },
    icon("trophy", 12),
    xpLabel,
  );
  statusSlot.replaceWith(xpBtn);
  const paintXp = () => {
    xpLabel.textContent = `${game.done}/${quests.length} quests`;
    // The game shows itself once someone is actually playing.
    xpBtn.hidden = game.done < 2;
  };
  paintXp();

  // ---------- unlocking ----------
  // One channel at a time: a level-up or the finale is Vink's to announce;
  // everything else is a single small toast. Toasts never stack, and wait
  // while Vink is talking.
  const toastQueue: { icon: string; label: string; xp?: number }[] = [];
  let toastBusy = false;

  function showNextToast() {
    if (toastBusy || !toastQueue.length) return;
    if (vink.speaking) {
      window.setTimeout(showNextToast, 400);
      return;
    }
    toastBusy = true;
    const t = toastQueue.shift()!;
    const el = h(
      "div",
      { class: "toast", role: "status" },
      h("span", { class: "toast-icon", "aria-hidden": "true" }, icon(t.icon, 14)),
      h("span", { class: "toast-label" }, t.label),
      t.xp ? h("span", { class: "toast-xp" }, `+${t.xp} xp`) : null,
    );
    toasts.replaceChildren(el);
    window.setTimeout(() => {
      el.classList.add("out");
      window.setTimeout(() => {
        el.remove();
        toastBusy = false;
        showNextToast();
      }, 260);
    }, 2600);
  }

  // Recruiter fast path: Vink steps aside and rewards are counted silently.
  let quiet = false;
  const QUIET_COMMANDS = ["tldr"];

  let pending: Quest[] = [];
  let flushTimer = 0;
  function flushUnlocks() {
    const batch = pending;
    pending = [];
    const gained = batch.reduce((n, q) => n + q.xp, 0);
    const before = levelAt(game.xp - gained);
    const after = game.level();
    if (quiet) return;

    if (game.complete && !muted && !vink.el.hidden) {
      vink.setPose("celebrate", 5000);
      vink.confetti(windowEl);
      void vink.say(
        ["You found everything. Every quest, every secret. Honestly? Navin should hire ", h("em", {}, "you"), ". Or you could just ", cmd("contact"), " him."],
        12000,
      );
      return;
    }
    if (after.number > before && !muted && !vink.el.hidden) {
      vink.setPose("celebrate", 2400);
      void vink.say([`Level up! You're now ${/^[aeiou]/i.test(after.title) ? "an" : "a"} `, h("strong", {}, after.title), ". ", cmd("quests"), " shows what's left."], 5000);
      return;
    }
    vink.setPose("celebrate", 1400);
    toastQueue.push(
      batch.length === 1
        ? { icon: batch[0].icon, label: batch[0].title, xp: gained }
        : { icon: "trophy", label: `${batch.length} quests`, xp: gained },
    );
    showNextToast();
  }

  game.onChange = () => {
    paintXp();
    xpBtn.classList.add("bump");
    window.setTimeout(() => xpBtn.classList.remove("bump"), 600);
  };
  game.onUnlock = (q) => {
    summon();
    pending.push(q);
    clearTimeout(flushTimer);
    flushTimer = window.setTimeout(flushUnlocks, 120);
  };

  vink.onDismiss = () => {
    if (muted) return;
    muted = true;
    save(MUTE_KEY, "1");
    toastQueue.push({ icon: "check", label: "Vink will stay quiet. Tap him to chat." });
    showNextToast();
  };
  const setMuted = (on: boolean) => {
    muted = on;
    save(MUTE_KEY, on ? "1" : "0");
  };

  vink.onPoke = () => game.step("poke");
  vink.onDrag = () => {
    game.unlock("lift");
    if (game.firstTime("vink:dropped")) window.setTimeout(() => void vink.say("Thanks for the lift. Mind the edge next time.", 3200), 300);
  };
  onThemeChange(() => game.unlock("theme"));
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (a && (a.href.startsWith("mailto:") || a.href.includes("linkedin.com"))) game.unlock("talk");
  });

  // ---------- reacting to commands ----------
  shell.onStart = (name, line) => {
    resetIdle();
    if (QUIET_COMMANDS.includes(shell.get(name)?.name ?? "")) {
      quiet = true;
      vink.hush();
      vink.setPose("idle");
      return;
    }
    summon();
    if (name === "ask" || (!shell.get(name) && looksLikeQuestion(line))) vink.setPose("think");
    else if (name === "sql") vink.setPose("type");
    else if (name !== "vink") vink.setPose("type");
  };

  shell.onRun = ({ name, line, ok, known }) => {
    const canonical = shell.get(name)?.name ?? name;
    if (quiet) window.setTimeout(() => (quiet = false), 400);
    const args = line.split(/\s+/).slice(1);
    const question = !known && (looksLikeQuestion(line) || isReply(line) || canAnswer(line));

    if (canonical !== "vink") vink.setPose("idle");
    const xpBefore = game.xp;
    game.unlock("hello");

    if (!known && !question) {
      vink.setPose("shrug", 1800);
      void vink.say(["Hmm, I don't know that one. ", cmd("help"), " has the list — or just ask me something."], 4500);
      game.unlock("oops");
      return;
    }
    if (!ok) {
      vink.setPose("shrug", 1600);
      return;
    }

    if (EXPLORE_COMMANDS.includes(canonical)) game.step("explorer", canonical);
    if (canonical === "projects" && args[0] && projects.some((p) => p.slug === args[0].toLowerCase())) game.unlock("deep-dive");
    if (canonical === "sql" && args.length) game.unlock("query");
    if (canonical === "activity") game.unlock("shipped");
    if (canonical === "cat" && args.length) game.unlock("hacker");
    if ((canonical === "ask" && args.length) || question) game.step("curious");
    if (canonical === "sudo" && args.join(" ").toLowerCase() === "hire navin") game.unlock("root");
    if (canonical === "open" && ["email", "linkedin"].includes(args[0]?.toLowerCase())) game.unlock("talk");

    // A comment the first time someone runs each command (unless a quest just spoke).
    const line1 = FIRST_TIME[canonical];
    if (line1 && game.firstTime(canonical) && game.xp === xpBefore) window.setTimeout(() => chat(line1, 4200), 450);
  };

  // ---------- idle behaviour: a hint now and then, then a nap ----------
  let lastActive = Date.now();
  let hints = 0;
  function resetIdle() {
    lastActive = Date.now();
    if (vink.pose === "sleep") {
      vink.setPose("wave", 1400);
      chat("Oh! I'm up, I'm up.", 2200);
    }
  }
  ["keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
  window.setInterval(() => {
    const idle = Date.now() - lastActive;
    if (!summoned) return;
    if (idle > 110_000 && vink.pose === "idle") {
      vink.hush();
      vink.setPose("sleep");
    } else if (!muted && !phone() && idle > 28_000 && hints < 3 && vink.pose === "idle" && idle < 60_000 + hints * 30_000) {
      const q = game.nextQuest();
      const hint = q && HINTS[q.id];
      if (hint && idle > 28_000 + hints * 30_000) {
        hints++;
        vink.setPose("point", 4000);
        void vink.say(hint(), 6500);
      }
    } else if (idle > 12_000 && vink.pose === "idle" && Math.random() < 0.18) {
      vink.wander();
    }
  }, 4000);

  // ---------- shipping news: once per visit, when Vink has nothing else to say ----------
  void loadActivity().then((a) => {
    if (!a || !a.week.commits) return;
    let told = false;
    try {
      told = sessionStorage.getItem("vink-news") === "1";
    } catch {
      /* no storage: tell them anyway */
    }
    if (told || muted || phone()) return;
    window.setTimeout(() => {
      const data = activity();
      const c = data && notable(data);
      if (!data || !c || muted || !summoned || vink.speaking || vink.pose !== "idle" || game.has("shipped")) return;
      try {
        sessionStorage.setItem("vink-news", "1");
      } catch {
        /* fine */
      }
      vink.setPose("point", 3500);
      void vink.say(
        [
          "Fresh from GitHub: Navin pushed ",
          h("strong", {}, `${data.week.commits} commit${data.week.commits === 1 ? "" : "s"}`),
          ` to ${data.week.repos.map(repoName).join(", ")} this week. Latest: “${c.message.length > 70 ? c.message.slice(0, 68) + "…" : c.message}” `,
          cmd("activity"),
        ],
        8000,
      );
    }, 12_000);
  });

  return { game, vink, commands: playCommands(game, vink, windowEl, setMuted, bringOut) };
}

/** Level number for an arbitrary XP total, to spot level-ups. */
function levelAt(xp: number) {
  return levels.filter((l) => xp >= l.xp).length;
}

function questView(game: Game): HTMLElement {
  const lvl = game.level();
  const avatar = h("div", { class: "avatar vink-avatar", "aria-hidden": "true" });
  avatar.innerHTML = vinkSVG("head");
  return h(
    "div",
    { class: "quests" },
    h(
      "div",
      { class: "quest-head" },
      avatar,
      h(
        "div",
        {},
        h("p", { class: "quest-level" }, `Level ${lvl.number} · ${lvl.title}`, h("small", {}, `${game.xp} / ${game.maxXp} xp`)),
        h("div", { class: "quest-progress" }, h("span", { style: `width:${Math.round((game.xp / game.maxXp) * 100)}%` })),
        h(
          "div",
          { class: "quest-next" },
          lvl.next ? `${lvl.next.xp - game.xp} xp to ${lvl.next.title} · ${game.done} of ${quests.length} quests done` : "Max level. You've seen it all.",
        ),
      ),
    ),
    h(
      "div",
      { class: "quest-list" },
      ...quests.map((q) => {
        const done = game.has(q.id);
        const hidden = q.secret && !done;
        const progress = q.goal && !done ? ` · ${game.count(q.id)}/${q.goal}` : "";
        return h(
          "div",
          { class: `quest ${done ? "done" : "locked"}` },
          h("span", { class: "quest-icon" }, hidden ? icon("alert", 16) : icon(q.icon, 16)),
          h("div", {}, h("strong", {}, hidden ? "Secret quest" : q.title), h("span", {}, (hidden ? q.hint : q.desc) + progress)),
          h("span", { class: "quest-xp" }, done ? "✓" : `${q.xp} xp`),
        );
      }),
    ),
  );
}

function playCommands(game: Game, vink: Vink, windowEl: HTMLElement, setMuted: (on: boolean) => void, bringOut: () => void): Command[] {
  const actions: Record<string, Pose | "hide" | "show" | "quiet" | "talk"> = {
    wave: "wave",
    dance: "dance",
    jump: "celebrate",
    walk: "walk",
    point: "point",
    think: "think",
    code: "type",
    sleep: "sleep",
    shrug: "shrug",
    hide: "hide",
    show: "show",
    quiet: "quiet",
    talk: "talk",
  };
  return [
    {
      name: "quests",
      summary: "your quests, XP and level",
      group: "play",
      aliases: ["achievements", "xp", "level"],
      usage: "[--reset]",
      complete: () => ["--reset"],
      run: ({ args, add, out }) => {
        if (args[0] === "--reset") {
          game.reset();
          out(h("span", { class: "muted" }, "progress reset. fresh start."));
          return;
        }
        add(questView(game));
      },
    },
    {
      name: "vink",
      summary: "say hi to Vink, or make him do something",
      group: "play",
      usage: "[wave | dance | walk | think | code | …]",
      complete: () => Object.keys(actions),
      run: ({ args, out, error }) => {
        const action = args[0]?.toLowerCase();
        if (!action) {
          bringOut();
          vink.setPose("wave", 1600);
          void vink.say("That's me! Poke me, drag me around, ask me things, or tell me what to do.", 4000);
          out("Vink is Navin's illustrated twin. He lives on the command bar, reacts to what you do, follows your cursor with his eyes and hands out quests. Pick him up and move him if he's in the way, or close any of his bubbles with × to keep him quiet.");
          out(
            h("span", { class: "muted" }, "try: "),
            ...Object.keys(actions).flatMap((a, i) => [i ? "  " : "", cmd(`vink ${a}`, a)]),
          );
          return;
        }
        const pose = actions[action];
        if (!pose) return error(`vink doesn't know how to ${action}. try: ${Object.keys(actions).join(", ")}`);
        if (pose === "hide") {
          vink.el.hidden = true;
          out(h("span", { class: "muted" }, "vink went for a walk. "), cmd("vink show", "call him back"));
          return;
        }
        if (pose === "quiet") {
          setMuted(true);
          vink.hush();
          out(h("span", { class: "muted" }, "vink will only speak when spoken to. "), cmd("vink talk", "let him chat again"));
          return;
        }
        if (pose === "talk") {
          setMuted(false);
          vink.setPose("wave", 1500);
          void vink.say("I'm back to chatting. × on any bubble quiets me again.", 3500);
          return;
        }
        if (pose === "show") {
          bringOut();
          vink.setPose("wave", 1500);
          void vink.say("Missed me?", 2500);
          return;
        }
        if (pose === "walk") {
          void vink.say("Going for a stroll.", 1800);
          vink.wander();
          out(h("span", { class: "muted" }, "vink → walk"));
          return;
        }
        vink.setPose(pose, pose === "sleep" ? 0 : pose === "dance" ? 4200 : 3200);
        if (pose === "dance") void vink.say("♪ Shipping on a Friday ♪", 3000);
        if (pose === "celebrate") vink.confetti(windowEl);
        out(h("span", { class: "muted" }, `vink → ${action}`));
      },
    },
  ];
}

const MUTE_KEY = "vink-muted";

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* no storage: the choice lasts this visit */
  }
}
