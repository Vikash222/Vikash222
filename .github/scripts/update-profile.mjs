import fs from "node:fs/promises";

const USERNAME = "Vikash222";
const README = "README.md";
const START = "<!-- AUTO-GITHUB-START -->";
const END = "<!-- AUTO-GITHUB-END -->";

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Vikash222-profile-automation",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${path}`);
  }

  return response.json();
}

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanDescription(value) {
  const text = (value || "No description").replace(/\s+/g, " ").trim();
  return text.length > 100 ? `${text.slice(0, 97)}…` : text;
}

function repoCard(repo) {
  const language = repo.language ? esc(repo.language) : "Multiple";
  const stars = repo.stargazers_count ?? 0;
  const forks = repo.forks_count ?? 0;

  return `
<td width="50%" valign="top">

### [${esc(repo.name)}](${repo.html_url})

${esc(cleanDescription(repo.description))}

**${language}** · ⭐ ${stars} · 🍴 ${forks}

<a href="${repo.html_url}">View repository →</a>

</td>`;
}

const [user, repos] = await Promise.all([
  github(`/users/${USERNAME}`),
  github(`/users/${USERNAME}/repos?per_page=100&type=owner&sort=updated`),
]);

const ownedPublic = repos
  .filter(repo => !repo.fork && !repo.archived && !repo.private);

const byRecentActivity = [...ownedPublic]
  .sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0));

const selected = byRecentActivity.slice(0, 6);
const stars = ownedPublic.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
const forks = ownedPublic.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

const rows = [];
for (let i = 0; i < selected.length; i += 2) {
  const left = repoCard(selected[i]);
  const right = selected[i + 1] ? repoCard(selected[i + 1]) : `<td width="50%"></td>`;
  rows.push(`<tr>\n${left}\n${right}\n</tr>`);
}

const generated = `${START}

### 🤖 Live GitHub Snapshot

<div align="center">

| Public Repositories | Stars | Forks | Followers |
|---:|---:|---:|---:|
| **${ownedPublic.length}** | **${stars}** | **${forks}** | **${user.followers ?? 0}** |

</div>

<table width="100%">
${rows.join("\n")}
</table>

<div align="center">

<sub>Automatically refreshed from GitHub public repository data • Last sync: ${new Date().toISOString()}</sub>

</div>

${END}`;

const readme = await fs.readFile(README, "utf8");
const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);

if (!pattern.test(readme)) {
  throw new Error(`Automation markers not found in ${README}`);
}

const next = readme.replace(pattern, generated);

if (next === readme) {
  console.log("Profile already up to date.");
  process.exit(0);
}

await fs.writeFile(README, next, "utf8");
console.log("Updated live GitHub section.");
