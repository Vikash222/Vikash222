import fs from "node:fs";
import path from "node:path";

const username = "Vikash222";
const out = path.resolve("assets/profile-pulse.svg");

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Vikash222-profile-automation",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

const [user, repos] = await Promise.all([
  getJson(`https://api.github.com/users/${username}`),
  getJson(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
]);

const publicRepos = repos.length;
const stars = repos.reduce((n, r) => n + (r.stargazers_count || 0), 0);
const forks = repos.reduce((n, r) => n + (r.forks_count || 0), 0);
const recent = repos
  .filter(r => !r.fork)
  .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
  .slice(0, 3);

const esc = (v) => String(v)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const short = (v, max = 30) => {
  const s = (v || "No description").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
};

const card = (repo, x) => `
  <g transform="translate(${x} 78)">
    <rect width="330" height="118" rx="16" fill="#0b1220" stroke="#243244"/>
    <circle cx="24" cy="25" r="6" fill="#22d3ee">
      <animate attributeName="opacity" values=".35;1;.35" dur="2s" repeatCount="indefinite"/>
    </circle>
    <text x="40" y="30" font-family="monospace" font-size="15" font-weight="700" fill="#f8fafc">${esc(short(repo.name, 27))}</text>
    <text x="20" y="57" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#94a3b8">${esc(short(repo.description, 40))}</text>
    <text x="20" y="85" font-family="monospace" font-size="12" fill="#64748b">★ ${repo.stargazers_count || 0}   ⑂ ${repo.forks_count || 0}</text>
    <text x="20" y="104" font-family="monospace" font-size="10" fill="#475569">${repo.language ? esc(repo.language) : "GitHub repository"}</text>
  </g>`;

const updated = new Date().toISOString().replace("T", " ").replace(/:\d{2}\.\d{3}Z$/, " UTC");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="245" viewBox="0 0 1200 245" role="img">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#070b14"/><stop offset=".55" stop-color="#0f172a"/><stop offset="1" stop-color="#17112f"/>
  </linearGradient>
  <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#818cf8"/><stop offset="1" stop-color="#c084fc"/>
  </linearGradient>
</defs>
<rect width="1200" height="245" rx="22" fill="url(#bg)" stroke="#243244"/>
<rect x="1" y="1" width="1198" height="243" rx="21" fill="none" stroke="#334155" stroke-opacity=".4"/>

<text x="32" y="34" font-family="monospace" font-size="12" fill="#64748b">AUTOMATED PROFILE PULSE</text>
<text x="32" y="60" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" fill="#f8fafc">Vikash222 / live developer snapshot</text>
<rect x="32" y="70" width="410" height="2" rx="1" fill="url(#line)">
  <animate attributeName="width" values="120;410;220;410" dur="6s" repeatCount="indefinite"/>
</rect>

<g font-family="monospace">
  <text x="480" y="39" font-size="12" fill="#64748b">PUBLIC REPOS</text>
  <text x="480" y="62" font-size="20" fill="#e2e8f0">${publicRepos}</text>
  <text x="590" y="39" font-size="12" fill="#64748b">STARS</text>
  <text x="590" y="62" font-size="20" fill="#e2e8f0">${stars}</text>
  <text x="670" y="39" font-size="12" fill="#64748b">FORKS</text>
  <text x="670" y="62" font-size="20" fill="#e2e8f0">${forks}</text>
  <text x="750" y="39" font-size="12" fill="#64748b">FOLLOWERS</text>
  <text x="750" y="62" font-size="20" fill="#e2e8f0">${user.followers || 0}</text>
  <text x="900" y="39" font-size="12" fill="#64748b">SYNCED</text>
  <text x="900" y="61" font-size="12" fill="#94a3b8">${esc(updated)}</text>
</g>

${recent.length ? recent.map((r, i) => card(r, 32 + i * 350)).join("") : ""}

<text x="32" y="222" font-family="monospace" font-size="10" fill="#475569">Updated automatically by GitHub Actions • public repository data</text>
</svg>`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(`Generated ${out}`);
