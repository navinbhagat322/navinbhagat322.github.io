// Pulls Navin's latest public commits from GitHub and writes public/activity.json.
// Runs before every build (and nightly in CI), so the site's "what I shipped"
// feed stays current with no manual updates. Only public repos are visible to
// the search API, so private work never ends up on the site.
//
// Usage: node scripts/fetch-activity.mjs   (set GITHUB_TOKEN for a higher rate limit)

import { mkdir, writeFile } from "node:fs/promises";

const USER = "navinbhagat322";
const OUT = new URL("../public/activity.json", import.meta.url);
const DAY = 86_400_000;
// Commits to the portfolio itself or the profile README aren't "shipping".
const EXCLUDE = new Set([`${USER}/${USER}.github.io`, `${USER}/${USER}`]);

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": `${USER}-portfolio`,
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function search(page) {
  const url = `https://api.github.com/search/commits?q=author:${USER}&sort=author-date&order=desc&per_page=100&page=${page}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub search failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const items = [];
  for (let page = 1; page <= 2; page++) {
    const data = await search(page);
    items.push(...data.items);
    if (data.items.length < 100) break;
  }

  const seen = new Set();
  const commits = items
    .filter((c) => !c.repository.private && !c.repository.fork && !EXCLUDE.has(c.repository.full_name))
    .filter((c) => !/^Merge (pull request|branch)/i.test(c.commit.message))
    .filter((c) => (seen.has(c.sha) ? false : seen.add(c.sha)))
    .map((c) => ({
      repo: c.repository.full_name,
      message: c.commit.message.split("\n")[0].slice(0, 140),
      date: c.commit.author.date,
      url: c.html_url,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Commits per day for the last 30 days, oldest first, for the sparkline.
  const now = Date.now();
  const daily = Array.from({ length: 30 }, () => 0);
  for (const c of commits) {
    const age = Math.floor((now - Date.parse(c.date)) / DAY);
    if (age >= 0 && age < 30) daily[29 - age]++;
  }

  const within = (days) => commits.filter((c) => now - Date.parse(c.date) < days * DAY);
  const repos = (list) => [...new Set(list.map((c) => c.repo))];

  const activity = {
    user: USER,
    generatedAt: new Date(now).toISOString(),
    week: { commits: within(7).length, repos: repos(within(7)) },
    month: { commits: within(30).length, repos: repos(within(30)) },
    daily,
    commits: commits.slice(0, 40),
  };

  await mkdir(new URL("../public/", import.meta.url), { recursive: true });
  await writeFile(OUT, JSON.stringify(activity, null, 2) + "\n");
  console.log(`activity.json: ${activity.week.commits} commits this week, ${activity.month.commits} this month, latest ${commits[0]?.date ?? "none"}`);
}

main().catch((err) => {
  // Never fail the build over this: the site simply hides the feed.
  console.warn(`fetch-activity: ${err.message}`);
  process.exit(0);
});
