// Visit counting with GoatCounter (https://www.goatcounter.com): free for personal
// sites, no cookies, no consent banner needed. Nothing loads until `site.goatcounter`
// in content.ts is set to your GoatCounter code.
//
// Only page views and command *names* are sent (e.g. "cmd/projects") — never what a
// visitor types or asks.

import { site } from "./content";

declare global {
  interface Window {
    goatcounter?: {
      count?: (vars: { path: string; title?: string; event?: boolean }) => void;
      no_onload?: boolean;
    };
  }
}

const base = () => `https://${site.goatcounter}.goatcounter.com`;

/** Dev only: `?demo-visits` previews the counter UI with a fake number. Stripped from production builds. */
const demo = () => import.meta.env.DEV && new URLSearchParams(location.search).has("demo-visits");

export const analyticsEnabled = () => demo() || /^[a-z0-9-]+$/.test(site.goatcounter);

/** The GoatCounter dashboard, where the full stats live. */
export const dashboardUrl = () => (analyticsEnabled() && !demo() ? base() : "");

export function startAnalytics() {
  if (!analyticsEnabled() || demo()) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = `${base()}/count`;
  document.head.append(script);
}

/** Records that a command was used, as an event (name only). */
export function trackCommand(name: string) {
  if (!analyticsEnabled() || demo()) return;
  window.goatcounter?.count?.({ path: `cmd/${name}`, title: `command: ${name}`, event: true });
}

let cached: Promise<string | null> | null = null;


export function totalVisits(): Promise<string | null> {
  if (!analyticsEnabled()) return Promise.resolve(null);
  if (demo()) return Promise.resolve("1,284");
  cached ??= fetch(`${base()}/counter/TOTAL.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { count?: string } | null) => (d?.count !== undefined ? String(d.count).trim() : null))
    .catch(() => null);
  return cached;
}
