// The background: a quiet neural network. Neurons drift, nearby ones connect,
// and every so often one fires — the signal travels along its connections and
// sets off its neighbours, like an activation spreading through layers.
// Click the background (or empty space in the terminal) to fire a spike yourself.

interface Neuron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 0..1, how recently it fired. */
  charge: number;
}

interface Signal {
  from: number;
  to: number;
  /** 0..1 progress along the edge. */
  t: number;
  speed: number;
  /** How many hops this cascade has already made. */
  gen: number;
}

interface Ripple {
  x: number;
  y: number;
  age: number;
}

const LINK = 150; // px: neurons closer than this are connected
const MAX_GEN = 5; // a cascade fades out after this many hops
const MAX_SIGNALS = 160;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class NeuralBackground {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private neurons: Neuron[] = [];
  private signals: Signal[] = [];
  private ripples: Ripple[] = [];
  private neighbours: number[][] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private frame = 0;
  private running = false;
  private nextSpontaneous = 0;
  private pointer = { x: -9999, y: -9999, active: false };
  private colors = { node: "", a: "", b: "", line: "" };
  /** Fires once per visitor-triggered spike. */
  onSpike?: () => void;

  constructor(host: HTMLElement) {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "neural";
    this.canvas.setAttribute("aria-hidden", "true");
    this.ctx = this.canvas.getContext("2d")!;
    host.append(this.canvas);

    this.readColors();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener(
      "pointermove",
      (e) => {
        this.pointer = { x: e.clientX, y: e.clientY, active: true };
      },
      { passive: true },
    );
    document.addEventListener("pointerleave", () => (this.pointer.active = false));
    document.addEventListener("visibilitychange", () => (document.hidden ? this.stop() : this.start()));
    new MutationObserver(() => this.readColors()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    this.start();
  }

  // ---------- public ----------

  /** A visitor fired a spike at (x, y): ripple out and set off nearby neurons. */
  spike(x: number, y: number) {
    this.ripples.push({ x, y, age: 0 });
    const near = this.neurons
      .map((n, i) => ({ i, d: Math.hypot(n.x - x, n.y - y) }))
      .filter((n) => n.d < 130)
      .sort((a, b) => a.d - b.d)
      .slice(0, 4);
    // No neuron close by? Grow one where they clicked, already firing.
    if (!near.length && this.neurons.length < 140) {
      this.neurons.push(this.makeNeuron(x, y));
      this.rebuildNeighbours();
      near.push({ i: this.neurons.length - 1, d: 0 });
    }
    near.forEach(({ i }, k) => window.setTimeout(() => this.fire(i, 0), k * 60));
    this.onSpike?.();
    if (!this.running) this.draw();
  }

  /** Busier for a moment — used while Vink is thinking. */
  think(intensity = 4) {
    for (let k = 0; k < intensity; k++) {
      window.setTimeout(() => this.fire(Math.floor(Math.random() * this.neurons.length), 1), k * 180);
    }
  }

  // ---------- setup ----------

  private readColors() {
    const css = getComputedStyle(document.documentElement);
    const dark = document.documentElement.dataset.theme !== "light";
    this.colors = {
      node: dark ? "rgba(200, 205, 225, 0.42)" : "rgba(60, 64, 90, 0.34)",
      line: dark ? "200, 205, 225" : "60, 64, 90",
      a: css.getPropertyValue("--accent").trim() || "#22d3ee",
      b: css.getPropertyValue("--violet").trim() || "#a78bfa",
    };
    if (!this.running) this.draw();
  }

  private makeNeuron(x = Math.random() * this.w, y = Math.random() * this.h): Neuron {
    const speed = 0.06 + Math.random() * 0.12;
    const angle = Math.random() * Math.PI * 2;
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 1.1 + Math.random() * 1.3, charge: 0 };
  }

  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const target = Math.round(Math.min(95, Math.max(28, (this.w * this.h) / 17000)));
    while (this.neurons.length < target) this.neurons.push(this.makeNeuron());
    if (this.neurons.length > target + 10) this.neurons.length = target;
    for (const n of this.neurons) {
      n.x = Math.min(n.x, this.w);
      n.y = Math.min(n.y, this.h);
    }
    this.signals = [];
    this.rebuildNeighbours();
    if (!this.running) this.draw();
  }

  private rebuildNeighbours() {
    const ns = this.neurons;
    this.neighbours = ns.map(() => []);
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        if (Math.hypot(ns[i].x - ns[j].x, ns[i].y - ns[j].y) < LINK) {
          this.neighbours[i].push(j);
          this.neighbours[j].push(i);
        }
      }
    }
  }

  // ---------- firing ----------

  private fire(i: number, gen: number, from = -1) {
    const n = this.neurons[i];
    if (!n) return;
    n.charge = 1;
    if (gen >= MAX_GEN || this.signals.length > MAX_SIGNALS) return;
    const options = this.neighbours[i].filter((j) => j !== from);
    // Fewer branches the further a cascade has travelled, so it fades naturally.
    const branches = Math.min(options.length, gen === 0 ? 3 : Math.random() < 0.7 - gen * 0.12 ? (Math.random() < 0.35 ? 2 : 1) : 0);
    for (const j of options.sort(() => Math.random() - 0.5).slice(0, branches)) {
      this.signals.push({ from: i, to: j, t: 0, speed: 0.018 + Math.random() * 0.02, gen: gen + 1 });
    }
  }

  // ---------- loop ----------

  private start() {
    if (this.running || reduced()) {
      this.draw();
      return;
    }
    this.running = true;
    const tick = (now: number) => {
      if (!this.running) return;
      this.step(now);
      this.draw();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private step(now: number) {
    const { w, h } = this;
    let moved = false;
    for (const n of this.neurons) {
      // The cursor is a neuron too: a gentle pull on anything nearby.
      if (this.pointer.active) {
        const dx = this.pointer.x - n.x;
        const dy = this.pointer.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 180 && d > 1) {
          n.x += (dx / d) * 0.12;
          n.y += (dy / d) * 0.12;
        }
      }
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;
      n.charge *= 0.955;
      moved = true;
    }
    // Connections change slowly; recompute a few times a second, not every frame.
    if (moved && Math.floor(now / 250) !== Math.floor((now - 16) / 250)) this.rebuildNeighbours();

    for (const s of this.signals) s.t += s.speed;
    const arrived = this.signals.filter((s) => s.t >= 1);
    this.signals = this.signals.filter((s) => s.t < 1);
    for (const s of arrived) this.fire(s.to, s.gen, s.from);

    for (const r of this.ripples) r.age += 1;
    this.ripples = this.ripples.filter((r) => r.age < 70);

    if (now > this.nextSpontaneous) {
      this.fire(Math.floor(Math.random() * this.neurons.length), 2);
      this.nextSpontaneous = now + 1800 + Math.random() * 2600;
    }
  }

  private draw() {
    const { ctx, neurons, colors } = this;
    ctx.clearRect(0, 0, this.w, this.h);

    // connections
    ctx.lineWidth = 1;
    for (let i = 0; i < neurons.length; i++) {
      const a = neurons[i];
      for (const j of this.neighbours[i]) {
        if (j < i) continue;
        const b = neurons[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > LINK) continue;
        const heat = Math.max(a.charge, b.charge);
        const alpha = (1 - d / LINK) * (0.12 + heat * 0.4);
        ctx.strokeStyle = heat > 0.15 ? this.withAlpha(colors.a, alpha) : `rgba(${colors.line}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // cursor connections
    if (this.pointer.active) {
      for (const n of neurons) {
        const d = Math.hypot(n.x - this.pointer.x, n.y - this.pointer.y);
        if (d < 170) {
          ctx.strokeStyle = this.withAlpha(colors.b, (1 - d / 170) * 0.28);
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(this.pointer.x, this.pointer.y);
          ctx.stroke();
        }
      }
    }

    // signals travelling along connections
    for (const s of this.signals) {
      const a = neurons[s.from];
      const b = neurons[s.to];
      if (!a || !b) continue;
      const x = a.x + (b.x - a.x) * s.t;
      const y = a.y + (b.y - a.y) * s.t;
      const fade = 1 - s.gen / (MAX_GEN + 1);
      ctx.fillStyle = this.withAlpha(s.gen % 2 ? colors.a : colors.b, 0.18 * fade);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.withAlpha(s.gen % 2 ? colors.a : colors.b, 0.85 * fade);
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // neurons
    for (const n of neurons) {
      if (n.charge > 0.05) {
        ctx.fillStyle = this.withAlpha(colors.a, n.charge * 0.22);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 7 * n.charge, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = n.charge > 0.15 ? this.withAlpha(colors.a, 0.5 + n.charge * 0.5) : colors.node;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + n.charge * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // click ripples
    for (const r of this.ripples) {
      const p = r.age / 70;
      ctx.strokeStyle = this.withAlpha(colors.b, (1 - p) * 0.45);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 8 + p * 150, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private alphaCache = new Map<string, [number, number, number]>();

  private withAlpha(color: string, alpha: number): string {
    let rgb = this.alphaCache.get(color);
    if (!rgb) {
      const hex = color.replace("#", "");
      const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
      const v = parseInt(full, 16);
      rgb = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
      this.alphaCache.set(color, rgb);
    }
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
  }
}
