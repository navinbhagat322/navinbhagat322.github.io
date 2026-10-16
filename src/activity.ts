// "What I shipped": public commits pulled from GitHub at build time
// (scripts/fetch-activity.mjs → /activity.json). If the file is missing the
// site just leaves the feed out.

import { links } from "./content";
import { h, icon, link } from "./ui";

export interface Commit {
  repo: string;
  message: string;
  date: string;
  url: string;
}

export interface Activity {
  generatedAt: string;
  week: { commits: number; repos: string[] };
  month: { commits: number; repos: string[] };
  daily: number[];
  commits: Commit[];
}

let cache: Activity | null = null;
let loading: Promise<Activity | null> | null = null;

export function loadActivity(): Promise<Activity | null> {
  loading ??= fetch(`${import.meta.env.BASE_URL}activity.json`, { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((a: Activity | null) => (cache = a && Array.isArray(a.commits) ? a : null))
    .catch(() => null);
  return loading;
}

export const activity = () => cache;

export const repoName = (full: string) => full.split("/").pop() ?? full;

export function ago(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** The latest commit worth talking about (skips version bumps and chores). */
export function notable(a: Activity): Commit | undefined {
  return a.commits.find((c) => !/\b(bump(ed)?|version|gitignore|typo|readme|lock ?file)\b/i.test(c.message)) ?? a.commits[0];
}

/** e.g. "last commit 2d ago · ternodbi" */
export function lastShipped(a: Activity | null = cache): string | null {
  const c = a?.commits[0];
  return c ? `last commit ${ago(c.date)} · ${repoName(c.repo)}` : null;
}

/** Fills placeholders like <span data-activity="last"> once the data arrives. */
export function fillPlaceholders(root: ParentNode = document) {
  const text = lastShipped();
  if (!text) return;
  root.querySelectorAll<HTMLElement>('[data-activity="last"]').forEach((el) => {
    el.textContent = text;
    el.hidden = false;
  });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function sparkline(daily: number[]): HTMLElement {
  const max = Math.max(1, ...daily);
  return h(
    "div",
    { class: "spark", role: "img", "aria-label": `Commits per day over the last ${daily.length} days` },
    ...daily.map((n, i) =>
      h("span", {
        class: n ? "on" : "",
        style: `height:${n ? 18 + (n / max) * 82 : 8}%`,
        title: `${n} commit${n === 1 ? "" : "s"}, ${daily.length - 1 - i === 0 ? "today" : `${daily.length - 1 - i}d ago`}`,
      }),
    ),
  );
}

export function activityView(a: Activity, limit = 12): HTMLElement {
  const groups = new Map<string, Commit[]>();
  for (const c of a.commits.slice(0, limit)) {
    const key = dayLabel(c.date);
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const repos = a.week.repos.length ? a.week.repos : a.month.repos;
  return h(
    "div",
    { class: "activity" },
    h(
      "div",
      { class: "activity-head" },
      h(
        "div",
        { class: "activity-stat" },
        h("strong", {}, String(a.week.commits)),
        h("span", {}, `commit${a.week.commits === 1 ? "" : "s"} this week`),
        h("small", {}, `${a.month.commits} in the last 30 days · ${repos.map(repoName).join(", ") || "—"}`),
      ),
      h("div", { class: "activity-spark" }, sparkline(a.daily), h("small", {}, "last 30 days")),
    ),
    h(
      "ol",
      { class: "activity-list" },
      ...[...groups].map(([day, commits]) =>
        h(
          "li",
          {},
          h("span", { class: "activity-day" }, day),
          h(
            "ul",
            {},
            ...commits.map((c) =>
              h(
                "li",
                { class: "activity-row" },
                h("span", { class: "tag" }, repoName(c.repo)),
                link(c.url, c.message, "activity-msg"),
                h("span", { class: "activity-time" }, ago(c.date)),
              ),
            ),
          ),
        ),
      ),
    ),
    h(
      "p",
      { class: "activity-foot" },
      icon("github", 13),
      `Public commits, pulled from GitHub nightly · updated ${ago(a.generatedAt)} · `,
      link(links.github, "all activity →"),
    ),
  );
}
