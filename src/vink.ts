// Vink: Navin as a little standing character. Curly hair, clear glasses that glow
// when he's thinking, a cream sweater with rust-and-black stripes and a polo
// collar, beige cargo pants and striped sneakers.

import { h, reducedMotion, sleep, type Child } from "./ui";

export type Pose =
  | "idle"
  | "wave"
  | "think"
  | "type"
  | "celebrate"
  | "shrug"
  | "sleep"
  | "walk"
  | "dance"
  | "point"
  | "held";

const C = {
  skin: "#c98a64",
  skinShade: "#ab6e4c",
  hair: "#15100e",
  hairHi: "#30241f",
  knit: "#f2efe8",
  knitShade: "#dcd7cc",
  rust: "#9b4a2f",
  rustDark: "#7d3922",
  edge: "#1d1715",
  pants: "#d4c4a4",
  pantsShade: "#bba98a",
  shoe: "#f7f6f2",
  sole: "#dad6cc",
  stripe: "#1e1e1e",
  frame: "#d9dde3",
  lip: "#6b3626",
};

// A knit stripe: rust band with thin dark edges.
const band = (x: number, y: number, w: number, hgt: number) => `
  <rect x="${x}" y="${y}" width="${w}" height="${hgt}" fill="${C.rust}"/>
  <rect x="${x}" y="${y}" width="${w}" height="0.9" fill="${C.edge}"/>
  <rect x="${x}" y="${y + hgt - 0.9}" width="${w}" height="0.9" fill="${C.edge}"/>`;

function arm(side: "l" | "r"): string {
  const x = side === "l" ? 42 : 78;
  return `
  <g class="v-arm v-arm-${side}">
    <rect x="${x - 5.5}" y="75" width="11" height="27" rx="5.5" fill="${C.knit}"/>
    <clipPath id="v-upper-${side}"><rect x="${x - 5.5}" y="75" width="11" height="27" rx="5.5"/></clipPath>
    <g clip-path="url(#v-upper-${side})">${band(x - 6, 86, 12, 6)}</g>
    <g class="v-fore v-fore-${side}">
      <rect x="${x - 5}" y="97" width="10" height="23" rx="5" fill="${C.knit}"/>
      <clipPath id="v-fore-${side}"><rect x="${x - 5}" y="97" width="10" height="23" rx="5"/></clipPath>
      <g clip-path="url(#v-fore-${side})">${band(x - 6, 104, 12, 5)}</g>
      <rect x="${x - 5.3}" y="115" width="10.6" height="6" rx="3" fill="${C.knitShade}"/>
      <circle cx="${x}" cy="124.5" r="5.2" fill="${C.skin}"/>
      <path d="M${x - 2.5} 127.5 Q${x} 129 ${x + 2.5} 127.5" stroke="${C.skinShade}" stroke-width="0.9" fill="none"/>
    </g>
  </g>`;
}

function leg(side: "l" | "r"): string {
  const x = side === "l" ? 51.5 : 68.5;
  const out = side === "l" ? -1 : 1;
  const pocketX = side === "l" ? x - 7.6 : x + 3.2;
  return `
  <g class="v-leg v-leg-${side}">
    <rect x="${x - 7}" y="120" width="14" height="56" rx="6" fill="${C.pants}"/>
    <rect x="${pocketX}" y="141" width="4.4" height="12" rx="1.2" fill="${C.pantsShade}"/>
    <rect x="${pocketX - 0.2}" y="140" width="4.8" height="3.2" rx="1" fill="${C.pants}" stroke="${C.pantsShade}" stroke-width="0.6"/>
    <path d="M${x + out * 2} 160 L${x + out * 2.5} 174" stroke="${C.pantsShade}" stroke-width="0.8" opacity=".7"/>
    <path d="M${x - 8.5 + out * 1.5} 185 Q${x - 9 + out * 1.5} 175 ${x + out * 1.5} 174.5 Q${x + 9 + out * 1.5} 175 ${x + 9.5 + out * 1.5} 185 Z" fill="${C.shoe}"/>
    <path d="M${x - 3 + out * 3} 177 L${x - 5 + out * 3} 183 M${x + out * 3} 177 L${x - 2 + out * 3} 183" stroke="${C.stripe}" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="${x - 9.5 + out * 1.5}" y="184" width="19" height="3" rx="1.5" fill="${C.sole}"/>
  </g>`;
}

function torso(): string {
  return `
  <g class="v-torso">
    <rect x="44" y="114" width="32" height="14" rx="4" fill="${C.pants}"/>
    <path d="M40 86 Q40 75 51 73 L69 73 Q80 75 80 86 L79 121 Q60 125 41 121 Z" fill="${C.knit}"/>
    <clipPath id="v-body"><path d="M40 86 Q40 75 51 73 L69 73 Q80 75 80 86 L79 121 Q60 125 41 121 Z"/></clipPath>
    <g clip-path="url(#v-body)">
      ${band(38, 86, 44, 7)}
      ${band(38, 103, 44, 7)}
      <rect x="38" y="116" width="44" height="10" fill="${C.knitShade}"/>
      <g stroke="#c9c3b6" stroke-width="0.6">
        ${Array.from({ length: 14 }, (_, i) => `<path d="M${41 + i * 2.8} 117 V124"/>`).join("")}
      </g>
      <path d="M74 76 Q80 80 79 121 L74 122 Z" fill="#000" opacity=".05"/>
    </g>
    <rect x="58.4" y="73" width="3.2" height="14" rx="1" fill="${C.knitShade}"/>
    <circle cx="60" cy="78" r=".9" fill="#b8b2a6"/><circle cx="60" cy="83" r=".9" fill="#b8b2a6"/>
    <path d="M50 72.5 L59.5 73.5 L56 81 Z" fill="${C.knit}" stroke="${C.knitShade}" stroke-width=".8" stroke-linejoin="round"/>
    <path d="M70 72.5 L60.5 73.5 L64 81 Z" fill="${C.knit}" stroke="${C.knitShade}" stroke-width=".8" stroke-linejoin="round"/>
  </g>`;
}

function head(): string {
  const face =
    "M41 40 C41 30.5 49 25.5 60 25.5 C71 25.5 79 30.5 79 40 L79.6 49.5 C79.6 57.5 75.4 63.6 69.6 67.6 C66.4 69.9 63.3 71.2 60 71.2 C56.7 71.2 53.6 69.9 50.4 67.6 C44.6 63.6 40.4 57.5 40.4 49.5 Z";
  const curls: [number, number, number][] = [
    [40, 37, 8], [45, 27, 9], [54, 21, 10], [66, 20, 10], [76, 25, 9], [81, 35, 8],
    [49, 31, 6], [60, 28, 6.5], [71, 29, 6], [52, 34, 4], [60, 32.5, 4.2], [68, 34, 4],
    [38.5, 45, 4.6], [81.5, 44, 4.6],
  ];
  return `
  <g class="v-head">
    <ellipse cx="60" cy="34" rx="25" ry="18" fill="${C.hair}"/>
    <path d="M54.5 64 L65.5 64 L65.5 75 Q60 77 54.5 75 Z" fill="${C.skinShade}"/>
    <path d="M54.5 66 Q60 70.5 65.5 66 L65.5 69 Q60 72.5 54.5 69 Z" fill="#000" opacity=".12"/>

    <ellipse cx="40.2" cy="50" rx="3.4" ry="5" fill="${C.skinShade}"/>
    <ellipse cx="79.8" cy="50" rx="3.4" ry="5" fill="${C.skinShade}"/>
    <path d="M40.6 47.5 Q39 50 40.8 52.6 M79.4 47.5 Q81 50 79.2 52.6" stroke="#8d573a" stroke-width=".9" fill="none" opacity=".7"/>

    <path d="${face}" fill="${C.skin}"/>
    <path d="M73 33 C78 37 79.6 44 79.6 49.5 C79.6 57.5 75.4 63.6 69.6 67.6 C73 60 74.6 50 73 33 Z" fill="#000" opacity=".06"/>
    <path d="M44.5 54.5 Q47 57 51 57.6" stroke="${C.skinShade}" stroke-width=".9" fill="none" opacity=".45"/>
    <path d="M75.5 54.5 Q73 57 69 57.6" stroke="${C.skinShade}" stroke-width=".9" fill="none" opacity=".45"/>
    <path d="M55.5 67.6 Q60 70 64.5 67.6" stroke="${C.skinShade}" stroke-width="1" fill="none" opacity=".35" stroke-linecap="round"/>

    <g fill="${C.hair}">${curls.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
    <g stroke="${C.hairHi}" stroke-width="1.3" stroke-linecap="round" fill="none">
      <path d="M42 26 q3 -3 6 0"/><path d="M51 19 q3 -3 6 0"/><path d="M63 17 q3 -3 6 0"/><path d="M73 22 q3 -3 6 0"/>
      <path d="M56 26 q2.5 -2.5 5 0"/><path d="M78 31 q2.5 -2.5 5 0"/>
    </g>

    <g class="v-brows" fill="${C.hair}">
      <path d="M45.2 41.8 Q49.6 38.4 55.2 40 L55 41.7 Q50 40.6 46 43 Z"/>
      <path d="M74.8 41.8 Q70.4 38.4 64.8 40 L65 41.7 Q70 40.6 74 43 Z"/>
    </g>

    <g class="v-eyes">
      <g class="e-open">
        <path d="M46.8 48.4 Q50.5 44.6 54.2 48.4 Q50.5 50.8 46.8 48.4 Z" fill="#fbf7f2"/>
        <path d="M65.8 48.4 Q69.5 44.6 73.2 48.4 Q69.5 50.8 65.8 48.4 Z" fill="#fbf7f2"/>
        <g class="v-pupils" fill="#1b1412">
          <circle cx="50.5" cy="47.9" r="2.1"/><circle cx="69.5" cy="47.9" r="2.1"/>
          <circle cx="51.3" cy="47.1" r=".7" fill="#fff"/><circle cx="70.3" cy="47.1" r=".7" fill="#fff"/>
        </g>
        <g stroke="#1b1412" stroke-width="1.25" stroke-linecap="round" fill="none">
          <path d="M46.6 48.2 Q50.5 44.3 54.4 48"/><path d="M65.6 48 Q69.5 44.3 73.4 48.2"/>
        </g>
      </g>
      <g class="e-happy" stroke="#1b1412" stroke-width="1.7" stroke-linecap="round" fill="none"><path d="M47.3 49 Q50.5 45.4 53.7 49"/><path d="M66.3 49 Q69.5 45.4 72.7 49"/></g>
      <g class="e-closed" stroke="#1b1412" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M47.3 48.4 Q50.5 50.6 53.7 48.4"/><path d="M66.3 48.4 Q69.5 50.6 72.7 48.4"/></g>
    </g>

    <g class="v-glasses">
      <rect class="v-lens" x="43" y="41.8" width="15.4" height="12.6" rx="4.2" />
      <rect class="v-lens" x="61.6" y="41.8" width="15.4" height="12.6" rx="4.2" />
      <path d="M58.4 46 Q60 44.8 61.6 46" stroke="${C.frame}" stroke-width="1.3" fill="none"/>
      <path d="M43 45.4 L40.6 44.6 M77 45.4 L79.4 44.6" stroke="${C.frame}" stroke-width="1.3"/>
      <path class="v-glint" d="M45.5 44.2 L48 42.8 M64.1 44.2 L66.6 42.8" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
    </g>

    <path d="M60.4 47.8 Q62.6 53.4 62 54.6 Q61 55.6 58.8 55" stroke="${C.skinShade}" stroke-width="1.15" fill="none" stroke-linecap="round"/>
    <path d="M57.6 54.9 Q58.2 55.6 59 55.4" stroke="#8d573a" stroke-width=".8" fill="none" opacity=".6"/>

    <g class="v-cheeks" fill="#e07a6a" opacity=".14"><ellipse cx="46.5" cy="55.6" rx="3.2" ry="1.8"/><ellipse cx="73.5" cy="55.6" rx="3.2" ry="1.8"/></g>

    <g class="v-mouth">
      <path class="m-smile" d="M56 61.4 Q60 64.6 64 61.4" stroke="${C.lip}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path class="m-open" d="M55.6 61 Q60 67.4 64.4 61 Q60 62 55.6 61 Z" fill="${C.lip}"/>
      <path class="m-open" d="M56.8 61.5 Q60 62.3 63.2 61.5 L62.8 62.4 Q60 63 57.2 62.4 Z" fill="#fff" opacity=".85"/>
      <path class="m-flat" d="M56.6 62 L63.4 62" stroke="${C.lip}" stroke-width="1.7" stroke-linecap="round"/>
      <ellipse class="m-o" cx="60" cy="62" rx="2.2" ry="2.6" fill="${C.lip}"/>
      <ellipse class="m-talk" cx="60" cy="62" rx="3" ry="2.2" fill="${C.lip}"/>
    </g>
  </g>`;
}

const LAPTOP = `
  <g class="v-laptop">
    <rect x="42" y="97" width="36" height="22" rx="2.5" fill="#b5bbc4"/>
    <rect x="42" y="97" width="36" height="22" rx="2.5" fill="url(#v-sheen)" opacity=".55"/>
    <circle class="v-logo" cx="60" cy="108" r="2.6" fill="#e8fbff"/>
    <rect x="38" y="118.5" width="44" height="3.5" rx="1.75" fill="#8e949d"/>
  </g>`;

const EXTRAS = `
  <g class="v-thought" fill="currentColor"><circle cx="86" cy="26" r="2"/><circle cx="93" cy="17" r="3"/><circle cx="102" cy="7" r="4"/></g>
  <g class="v-zzz" fill="currentColor" font-family="var(--mono)" font-weight="700">
    <text x="84" y="26" font-size="9">z</text><text x="91" y="17" font-size="11">z</text><text x="100" y="7" font-size="13">Z</text>
  </g>
  <g class="v-notes" fill="currentColor" font-size="12"><text x="14" y="40">♪</text><text x="98" y="30">♫</text></g>`;

/** The full character, or just the head for avatars. */
export function vinkSVG(crop: "full" | "head" = "full"): string {
  if (crop === "head") {
    return `<svg class="vink-svg vink-head-only" viewBox="29 6 62 66" data-pose="idle" aria-hidden="true">${head()}</svg>`;
  }
  return `<svg class="vink-svg" viewBox="0 -4 120 196" data-pose="idle" role="img" aria-label="Vink, Navin's illustrated twin">
    <defs><linearGradient id="v-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#7dd3fc"/></linearGradient></defs>
    <ellipse class="v-shadow" cx="60" cy="187.5" rx="24" ry="3.2" fill="#000" opacity=".25"/>
    <g class="v-all">
      <g class="v-body">
        ${leg("l")}${leg("r")}
        ${torso()}
        ${arm("l")}${arm("r")}
        <g class="v-head-wrap">${head()}</g>
        ${LAPTOP}
      </g>
      ${EXTRAS}
    </g>
  </svg>`;
}

const POKE_LINES = [
  "Hey! That tickles.",
  "I'm Vink — Navin, but with infinite patience for your questions.",
  "Fun fact: Navin wrote 280+ commits to TernoDBI. I counted.",
  "You can pick me up, you know. Drag me around.",
  "Try typing a question. I'm better at answering than at standing still.",
  "Psst. Have you tried ⌘K?",
  "I'd shake your hand, but I'm made of SVG.",
];

/**
 * The on-screen Vink: stands on the composer, changes pose, follows the cursor
 * with his eyes, wanders, can be dragged, and talks through a speech bubble.
 */
export class Vink {
  readonly el: HTMLElement;
  private readonly figure: HTMLButtonElement;
  private readonly svg: SVGSVGElement;
  private readonly bubble: HTMLElement;
  private poseTimer = 0;
  private sayTimer = 0;
  private sayToken = 0;
  private pokeIndex = 0;
  private current: Pose = "idle";
  private offset = 0;
  private walkTimer = 0;
  onPoke?: () => void;
  onDrag?: () => void;

  constructor() {
    this.bubble = h("div", { class: "vink-bubble", role: "status", "aria-live": "polite", hidden: true });
    this.figure = h("button", { type: "button", class: "vink-figure", "aria-label": "Vink. Click to poke, drag to move.", title: "Poke me, or drag me around" });
    this.figure.innerHTML = vinkSVG();
    this.svg = this.figure.querySelector("svg")!;
    this.el = h("div", { class: "vink" }, this.bubble, this.figure);
    this.bindPointer();
    this.bindEyes();
    this.figure.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.poke();
      }
    });
  }

  get pose() {
    return this.current;
  }

  /** Switches pose; with `ms`, returns to idle afterwards. */
  setPose(pose: Pose, ms = 0) {
    clearTimeout(this.poseTimer);
    this.current = pose;
    this.svg.dataset.pose = pose;
    if (ms) this.poseTimer = window.setTimeout(() => this.setPose("idle"), ms);
  }

  // ---------- moving ----------

  private maxOffset() {
    const host = this.el.parentElement;
    if (!host) return 0;
    return Math.max(0, host.clientWidth - this.figure.offsetWidth - 40);
  }

  private place(offset: number, lift = 0) {
    this.offset = Math.max(0, Math.min(this.maxOffset(), offset));
    this.el.style.setProperty("--offset", `${this.offset}px`);
    this.el.style.setProperty("--lift", `${lift}px`);
    // Past the middle, the bubble goes on his right so it stays in the window.
    const host = this.el.parentElement;
    this.el.classList.toggle("bubble-right", !!host && this.offset > host.clientWidth / 2 - 120);
  }

  /** Strolls along the composer to a spot, `offset` px left of his home corner. */
  async walkTo(offset: number) {
    if (reducedMotion() || this.current === "held") return;
    const target = Math.max(0, Math.min(this.maxOffset(), offset));
    const distance = Math.abs(target - this.offset);
    if (distance < 8) return;
    const ms = Math.min(4000, distance * 9);
    this.el.classList.toggle("facing-left", target > this.offset);
    this.el.style.setProperty("--walk-ms", `${ms}ms`);
    this.el.classList.add("walking");
    this.setPose("walk");
    this.place(target);
    clearTimeout(this.walkTimer);
    await new Promise<void>((r) => (this.walkTimer = window.setTimeout(r, ms)));
    this.el.classList.remove("walking", "facing-left");
    if (this.current === "walk") this.setPose("idle");
  }

  wander() {
    const max = this.maxOffset();
    if (!max || window.innerWidth < 640) return;
    const target = this.offset > max / 3 ? Math.random() * max * 0.2 : max * (0.25 + Math.random() * 0.35);
    void this.walkTo(target);
  }

  home() {
    void this.walkTo(0);
  }

  private bindPointer() {
    let startX = 0;
    let startY = 0;
    let startOffset = 0;
    let dragging = false;
    let down = false;

    this.figure.addEventListener("pointerdown", (e) => {
      down = true;
      dragging = false;
      startX = e.clientX;
      startY = e.clientY;
      startOffset = this.offset;
      this.figure.setPointerCapture(e.pointerId);
    });
    this.figure.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) > 6) {
        dragging = true;
        clearTimeout(this.walkTimer);
        this.el.classList.remove("walking", "facing-left");
        this.el.classList.add("dragging");
        this.setPose("held");
        void this.say("Whoa — easy! 😵", 2000);
      }
      if (dragging) this.place(startOffset - dx, Math.max(-70, Math.min(0, dy - 18)));
    });
    const release = () => {
      if (!down) return;
      down = false;
      if (!dragging) {
        this.poke();
        return;
      }
      this.el.classList.remove("dragging");
      this.el.classList.add("landing");
      this.place(this.offset, 0);
      this.setPose("idle");
      window.setTimeout(() => this.el.classList.remove("landing"), 450);
      this.onDrag?.();
    };
    this.figure.addEventListener("pointerup", release);
    this.figure.addEventListener("pointercancel", release);
    // Keep the click from also firing [data-run] handlers or focusing oddly.
    this.figure.addEventListener("click", (e) => e.preventDefault());
  }

  private bindEyes() {
    let frame = 0;
    window.addEventListener(
      "pointermove",
      (e) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const r = this.svg.getBoundingClientRect();
          if (!r.width) return;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height * 0.27;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const len = Math.hypot(dx, dy) || 1;
          const reach = Math.min(1, len / 160);
          this.svg.style.setProperty("--ex", ((dx / len) * 1.8 * reach).toFixed(2));
          this.svg.style.setProperty("--ey", ((dy / len) * 1.4 * reach).toFixed(2));
          // A slight head turn toward the cursor too.
          this.svg.style.setProperty("--look", ((dx / len) * 6 * reach).toFixed(2));
        });
      },
      { passive: true },
    );
  }

  // ---------- talking ----------

  /** Shows a speech bubble, typed out, and hides it after a while. */
  async say(content: Child | Child[], ms = 5200) {
    const token = ++this.sayToken;
    clearTimeout(this.sayTimer);
    const parts = Array.isArray(content) ? content : [content];
    const text = h("p", {});
    this.bubble.replaceChildren(
      h("span", { class: "vink-name" }, "vink"),
      text,
      h("button", { type: "button", class: "vink-close", "aria-label": "Dismiss", onClick: () => this.hush() }, "×"),
    );
    this.bubble.hidden = false;
    this.bubble.classList.remove("out");
    this.el.classList.add("talking");

    // Type plain strings out; append nodes (links, commands) whole.
    for (const part of parts) {
      if (token !== this.sayToken) return;
      if (typeof part === "string" && !reducedMotion()) {
        const span = h("span", {});
        text.append(span);
        for (let i = 0; i < part.length; i += 2) {
          if (token !== this.sayToken) return;
          span.textContent = part.slice(0, i + 2);
          await sleep(14);
        }
      } else if (part !== null && part !== undefined && part !== false) {
        text.append(typeof part === "object" ? part : String(part));
      }
    }
    this.el.classList.remove("talking");
    this.sayTimer = window.setTimeout(() => this.hush(), ms);
  }

  hush() {
    clearTimeout(this.sayTimer);
    this.sayToken++;
    this.el.classList.remove("talking");
    this.bubble.classList.add("out");
    window.setTimeout(() => {
      if (this.bubble.classList.contains("out")) this.bubble.hidden = true;
    }, 200);
  }

  poke() {
    this.setPose("wave", 1600);
    void this.say(POKE_LINES[this.pokeIndex++ % POKE_LINES.length], 3500);
    this.onPoke?.();
  }

  confetti(host: HTMLElement) {
    if (reducedMotion()) return;
    const colors = ["#22d3ee", "#a78bfa", "#4ade80", "#fbbf24", "#f472b6", "#9b4a2f"];
    const layer = h("div", { class: "confetti", "aria-hidden": "true" });
    for (let i = 0; i < 70; i++) {
      const piece = h("i", {});
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.6}s`;
      piece.style.animationDuration = `${1.8 + Math.random() * 1.4}s`;
      piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 160}px`);
      piece.style.setProperty("--spin", `${Math.random() * 720 - 360}deg`);
      layer.append(piece);
    }
    host.append(layer);
    window.setTimeout(() => layer.remove(), 3800);
  }
}
