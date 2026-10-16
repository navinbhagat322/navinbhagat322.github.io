// Quests, XP and levels. Progress lives in this visitor's localStorage only.

export interface Quest {
  id: string;
  icon: string;
  title: string;
  desc: string;
  hint?: string;
  xp: number;
  secret?: boolean;
  goal?: number;
}

export const EXPLORE_COMMANDS = ["about", "projects", "experience", "skills", "contact"];

export const quests: Quest[] = [
  { id: "hello", icon: "terminal", title: "Hello, world", desc: "Run your first command", xp: 10 },
  { id: "explorer", icon: "compass", title: "Explorer", desc: "Open about, projects, experience, skills and contact", xp: 50, goal: EXPLORE_COMMANDS.length },
  { id: "deep-dive", icon: "search", title: "Deep dive", desc: "Open a project's details", xp: 20 },
  { id: "query", icon: "database", title: "Query wizard", desc: "Run a SQL query against the résumé", xp: 30 },
  { id: "shipped", icon: "box", title: "Fresh commits", desc: "Check what Navin shipped this week", xp: 10 },
  { id: "curious", icon: "chat", title: "Curious mind", desc: "Ask Vink 3 questions in plain English", xp: 30, goal: 3 },
  { id: "palette", icon: "command", title: "Power user", desc: "Open the ⌘K command palette", xp: 20 },
  { id: "hacker", icon: "file", title: "Poking around", desc: "Read a file with cat", xp: 15 },
  { id: "theme", icon: "moon", title: "Other side", desc: "Switch the theme", xp: 10 },
  { id: "poke", icon: "pointer", title: "That tickles", desc: "Poke Vink 5 times", xp: 15, goal: 5 },
  { id: "lift", icon: "move", title: "Personal space", desc: "Pick Vink up and move him", xp: 15 },
  { id: "spark", icon: "network", title: "Neuroscientist", desc: "Fire 10 neurons in the background network", hint: "The background isn't just decoration…", xp: 15, goal: 10, secret: true },
  { id: "talk", icon: "mail", title: "Let's talk", desc: "Open Navin's email or LinkedIn", xp: 40 },
  { id: "root", icon: "key", title: "Root access", desc: "Hired Navin with sudo", hint: "Some commands need superuser rights…", xp: 40, secret: true },
  { id: "oops", icon: "alert", title: "It happens", desc: "Ran a command that doesn't exist", hint: "Make a typo. Seriously.", xp: 5, secret: true },
];

export const levels = [
  { xp: 0, title: "Visitor" },
  { xp: 30, title: "Explorer" },
  { xp: 90, title: "Regular" },
  { xp: 160, title: "Insider" },
  { xp: 230, title: "Teammate" },
  { xp: quests.reduce((n, q) => n + q.xp, 0), title: "Vink's best friend" },
];

interface State {
  unlocked: Record<string, number>;
  counts: Record<string, number>;
  seen: string[];
}

const KEY = "vink-quests";

export class Game {
  private state: State;
  /** Fires once per newly unlocked quest. */
  onUnlock?: (quest: Quest, game: Game) => void;
  /** Fires whenever XP or progress changes. */
  onChange?: (game: Game) => void;

  constructor() {
    this.state = this.load();
  }

  private load(): State {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (raw && typeof raw === "object") return { unlocked: raw.unlocked ?? {}, counts: raw.counts ?? {}, seen: raw.seen ?? [] };
    } catch {
      /* fall through to a fresh state */
    }
    return { unlocked: {}, counts: {}, seen: [] };
  }

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      /* private mode: progress lasts for this visit only */
    }
  }

  reset() {
    this.state = { unlocked: {}, counts: {}, seen: [] };
    this.save();
    this.onChange?.(this);
  }

  has(id: string) {
    return id in this.state.unlocked;
  }

  count(id: string) {
    return this.state.counts[id] ?? 0;
  }

  /** First time this visitor runs a command? Records it either way. */
  firstTime(name: string): boolean {
    if (this.state.seen.includes(name)) return false;
    this.state.seen.push(name);
    this.save();
    return true;
  }

  unlock(id: string) {
    const quest = quests.find((q) => q.id === id);
    if (!quest || this.has(id)) return;
    this.state.unlocked[id] = Date.now();
    this.save();
    this.onUnlock?.(quest, this);
    this.onChange?.(this);
  }

  /** Counts a step towards a counted quest and unlocks it at the goal. */
  step(id: string, key = "") {
    const quest = quests.find((q) => q.id === id);
    if (!quest || this.has(id)) return;
    if (key) {
      const seenKey = `${id}:${key}`;
      if (this.state.counts[seenKey]) return;
      this.state.counts[seenKey] = 1;
    }
    this.state.counts[id] = this.count(id) + 1;
    this.save();
    if (this.count(id) >= (quest.goal ?? 1)) this.unlock(id);
    else this.onChange?.(this);
  }

  get xp() {
    return quests.filter((q) => this.has(q.id)).reduce((n, q) => n + q.xp, 0);
  }

  get maxXp() {
    return levels[levels.length - 1].xp;
  }

  get done() {
    return quests.filter((q) => this.has(q.id)).length;
  }

  get complete() {
    return this.done === quests.length;
  }

  level() {
    const xp = this.xp;
    let index = 0;
    levels.forEach((l, i) => {
      if (xp >= l.xp) index = i;
    });
    const next = levels[index + 1];
    const from = levels[index].xp;
    return {
      number: index + 1,
      title: levels[index].title,
      next,
      /** 0..1 progress towards the next level. */
      progress: next ? (xp - from) / (next.xp - from) : 1,
    };
  }

  /** A quest the visitor hasn't done yet, for Vink's hints. */
  nextQuest(): Quest | undefined {
    return quests.find((q) => !q.secret && !this.has(q.id));
  }
}
