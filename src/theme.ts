// Colour themes live in style.css as [data-theme] blocks; this just switches them.

export const themes = ["dark", "light"] as const;
type Theme = (typeof themes)[number];

const isTheme = (v: string | null | undefined): v is Theme => themes.includes(v as Theme);
const listeners: ((t: Theme) => void)[] = [];

export function onThemeChange(fn: (t: Theme) => void) {
  listeners.push(fn);
}

export function currentTheme(): Theme {
  return isTheme(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : "dark";
}

export function setTheme(name: string): boolean {
  if (!isTheme(name)) return false;
  document.documentElement.dataset.theme = name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", name === "dark" ? "#09090b" : "#f4f4f5");
  try {
    localStorage.setItem("theme", name);
  } catch {
    /* fine: the choice just won't stick */
  }
  listeners.forEach((fn) => fn(name));
  return true;
}

export function initTheme() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem("theme");
  } catch {
    saved = null;
  }
  const preferLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  document.documentElement.dataset.theme = isTheme(saved) ? saved : preferLight ? "light" : "dark";
}
