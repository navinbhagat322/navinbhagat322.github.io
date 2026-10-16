// Gamification glue: Vink reacts to what visitors do, quests unlock, XP grows.

import { activity, loadActivity, notable, repoName } from "./activity";
import { looksLikeQuestion } from "./agent";
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
  shell.composer.append(vink.el);

  const toasts = h("div", { class: "toasts", "aria-live": "polite" });
  windowEl.append(toasts);

  // ---------- XP pill in the status bar ----------
  const xpFill = h("span", {});
  const xpLabel = h("span", { class: "xp-level" });
  const xpBtn = h(
    "button",
    { type: "button", class: "xp sb-item", "data-run": "quests", title: "Quests & XP" },
    xpLabel,
    h("span", { class: "xp-bar" }, xpFill),
  );
  statusSlot.replaceWith(xpBtn);
  const paintXp = () => {
    const lvl = game.level();
    xpLabel.textContent = `Lv ${lvl.number} · ${game.xp} xp`;
    xpFill.style.width = `${Math.round((game.xp / game.maxXp) * 100)}%`;
  };
  paintXp();

  // ---------- unlocking ----------
  // One channel at a time: a level-up or the finale is Vink's to announce;
  // everything else is a single small toast. Toasts never stack, and wait
  // while Vink is talking.
  const toastQueue: { icon: string; label: string; xp: number }[] = [];
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
      h("span", { class: "toast-xp" }, `+${t.xp} xp`),
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

    if (game.complete) {
      vink.setPose("celebrate", 5000);
      vink.confetti(windowEl);
      void vink.say(
        ["You found everything. Every quest, every secret. Honestly? Navin should hire ", h("em", {}, "you"), ". Or you could just ", cmd("contact"), " him."],
        12000,
      );
      return;
    }
    if (after.number > before) {
      vink.setPose("celebrate", 2400);
      void vink.say(["Level up! You're now a ", h("strong", {}, after.title), ". ", cmd("quests"), " shows what's left."], 5000);
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
    pending.push(q);
    clearTimeout(flushTimer);
    flushTimer = window.setTimeout(flushUnlocks, 120);
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
    if (name === "ask" || (!shell.get(name) && looksLikeQuestion(line))) vink.setPose("think");
    else if (name === "sql") vink.setPose("type");
    else if (name !== "vink") vink.setPose("type");
  };

  shell.onRun = ({ name, line, ok, known }) => {
    const canonical = shell.get(name)?.name ?? name;
    if (quiet) window.setTimeout(() => (quiet = false), 400);
    const args = line.split(/\s+/).slice(1);
    const question = !known && looksLikeQuestion(line);

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
    if (line1 && game.firstTime(canonical) && game.xp === xpBefore) window.setTimeout(() => void vink.say(line1, 4200), 450);
  };

  // ---------- idle behaviour: a hint now and then, then a nap ----------
  let lastActive = Date.now();
  let hints = 0;
  function resetIdle() {
    lastActive = Date.now();
    if (vink.pose === "sleep") {
      vink.setPose("wave", 1400);
      void vink.say("Oh! I'm up, I'm up.", 2200);
    }
  }
  ["keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
  window.setInterval(() => {
    const idle = Date.now() - lastActive;
    if (idle > 110_000 && vink.pose === "idle") {
      vink.hush();
      vink.setPose("sleep");
    } else if (idle > 28_000 && hints < 3 && vink.pose === "idle" && idle < 60_000 + hints * 30_000) {
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

  // ---------- hello ----------
  if (!new URLSearchParams(location.search).has("tldr")) window.setTimeout(() => {
    vink.setPose("wave", 1800);
    if (game.xp > 0) {
      const lvl = game.level();
      void vink.say(["Welcome back! You're level ", h("strong", {}, String(lvl.number)), ` (${lvl.title}) with ${game.done}/${quests.length} quests. `, cmd("quests")], 6500);
    } else {
      void vink.say(["Hi! I'm ", h("strong", {}, "Vink"), ", Navin's illustrated twin. Look around and you'll unlock quests — ", cmd("quests"), " shows them all."], 7000);
    }
  }, 900);

  // ---------- shipping news: once per visit, when Vink has nothing else to say ----------
  void loadActivity().then((a) => {
    if (!a || !a.week.commits) return;
    let told = false;
    try {
      told = sessionStorage.getItem("vink-news") === "1";
    } catch {
      /* no storage: tell them anyway */
    }
    if (told) return;
    window.setTimeout(() => {
      const data = activity();
      const c = data && notable(data);
      if (!data || !c || vink.speaking || vink.pose !== "idle" || game.has("shipped")) return;
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

  return { game, vink, commands: playCommands(game, vink, windowEl) };
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
          lvl.next ? `${lvl.next.xp - game.xp} xp to ${lvl.next.title} · ${game.done}/${quests.length} quests` : "Max level. You've seen it all.",
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

function playCommands(game: Game, vink: Vink, windowEl: HTMLElement): Command[] {
  const actions: Record<string, Pose | "hide" | "show"> = {
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
          vink.setPose("wave", 1600);
          void vink.say("That's me! Poke me, drag me around, ask me things, or tell me what to do.", 4000);
          out("Vink is Navin's illustrated twin. He lives on the command bar, reacts to what you do, follows your cursor with his eyes and hands out quests. Pick him up and move him if he's in the way.");
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
        if (pose === "show") {
          vink.el.hidden = false;
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
