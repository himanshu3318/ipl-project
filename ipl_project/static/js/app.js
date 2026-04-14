/* =============================================
   IPL CricStats Hub — Main Application JS
   Project: IPL Player Ranking System
   Course: Data Science / B.Tech Project
   ============================================= */

"use strict";

// ── GLOBAL STATE ──────────────────────────────
let SEASON_DATA     = {};
let PLAYER_DATA     = {};
let currentSeason   = "2026";
let currentStatType = "batting";

// ── BOOTSTRAP ─────────────────────────────────
async function init() {
  try {
    const [seasonsRes, playersRes] = await Promise.all([
      fetch("static/data/seasons.json"),
      fetch("static/data/players.json")
    ]);
    SEASON_DATA = await seasonsRes.json();
    PLAYER_DATA = await playersRes.json();
    populateSeasonFilter();
    loadSeason(SEASON_DATA[currentSeason] ? currentSeason : getAvailableSeasons()[0]);
    initLiveTicker();
  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

// ── UTILITY HELPERS ───────────────────────────
function getImg(name) {
  return (PLAYER_DATA.images && PLAYER_DATA.images[name]) || "";
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

function teamColor(tc) {
  const map = {
    rr:"#e91e63", srh:"#f46814", rcb:"#c8102e", mi:"#004ba0",
    csk:"#f5a623", kkr:"#3a2253", dc:"#0b4ea2", pbks:"#aa0000",
    gt:"#1c1c2e",  lsg:"#00a0e3", dd:"#0b4ea2", dch:"#fb641b",
    kxip:"#aa0000", gl:"#ff7722", rps:"#4b0082"
  };
  return map[(tc || "").toLowerCase()] || "#666";
}

function nationalityFlag(nat) {
  const map = {
    indian:"🇮🇳", aus:"🇦🇺", sa:"🇿🇦", eng:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    sl:"🇱🇰", nz:"🇳🇿", afg:"🇦🇫", pak:"🇵🇰", wi:"🏴", default:"🌍"
  };
  return map[nat] || map.default;
}

function posNum(i) {
  const cls = i === 0 ? "pos-num g1" : i === 1 ? "pos-num g2" : i === 2 ? "pos-num g3" : "pos-num";
  return `<span class="${cls}">${i + 1}</span>`;
}

function getAvailableSeasons() {
  return Object.keys(SEASON_DATA).sort((a, b) => Number(b) - Number(a));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ── IST TIME HELPERS ──────────────────────────
function getISTNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function getISTDateKey(date) {
  const d = date || getISTNow();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function createISTDateTime(dateKey, time24) {
  return new Date(`${dateKey}T${time24}:00+05:30`);
}

function formatTickerDay(dateKey) {
  const today = getISTDateKey();
  const tmrw  = getISTNow();
  tmrw.setDate(tmrw.getDate() + 1);
  if (dateKey === today)            return "Today";
  if (dateKey === getISTDateKey(tmrw)) return "Tomorrow";
  return new Date(`${dateKey}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday:"short", month:"short", day:"numeric", timeZone:"Asia/Kolkata"
  });
}

// ── LIVE TICKER ───────────────────────────────

// Full IPL 2026 Schedule
const IPL_SCHEDULE = [
  {m:1,  date:"2026-03-28",time:"19:30",t1:"RCB", t2:"SRH", venue:"Chinnaswamy, Bengaluru"},
  {m:2,  date:"2026-03-29",time:"19:30",t1:"KKR", t2:"MI",  venue:"Eden Gardens, Kolkata"},
  {m:3,  date:"2026-03-30",time:"19:30",t1:"CSK", t2:"RR",  venue:"Chepauk, Chennai"},
  {m:4,  date:"2026-03-31",time:"19:30",t1:"GT",  t2:"PBKS",venue:"Narendra Modi Stadium, Ahmedabad"},
  {m:5,  date:"2026-04-01",time:"19:30",t1:"LSG", t2:"DC",  venue:"Ekana Stadium, Lucknow"},
  {m:6,  date:"2026-04-02",time:"19:30",t1:"SRH", t2:"KKR", venue:"Rajiv Gandhi Stadium, Hyderabad"},
  {m:7,  date:"2026-04-03",time:"19:30",t1:"CSK", t2:"PBKS",venue:"Chepauk, Chennai"},
  {m:8,  date:"2026-04-04",time:"19:30",t1:"MI",  t2:"DC",  venue:"Wankhede, Mumbai"},
  {m:9,  date:"2026-04-05",time:"15:30",t1:"RR",  t2:"GT",  venue:"Sawai Mansingh, Jaipur"},
  {m:10, date:"2026-04-05",time:"19:30",t1:"SRH", t2:"LSG", venue:"Rajiv Gandhi Stadium, Hyderabad"},
  {m:11, date:"2026-04-05",time:"19:30",t1:"RCB", t2:"CSK", venue:"Chinnaswamy, Bengaluru"},
  {m:12, date:"2026-04-06",time:"19:30",t1:"KKR", t2:"PBKS",venue:"Eden Gardens, Kolkata"},
  {m:13, date:"2026-04-07",time:"19:30",t1:"RR",  t2:"MI",  venue:"ACA Stadium, Guwahati"},
  {m:14, date:"2026-04-08",time:"19:30",t1:"DC",  t2:"GT",  venue:"Arun Jaitley, Delhi"},
  {m:15, date:"2026-04-09",time:"19:30",t1:"KKR", t2:"LSG", venue:"Eden Gardens, Kolkata"},
  {m:16, date:"2026-04-10",time:"19:30",t1:"RR",  t2:"RCB", venue:"ACA Stadium, Guwahati"},
  {m:17, date:"2026-04-11",time:"15:30",t1:"PBKS",t2:"SRH", venue:"Mullanpur, Punjab"},
  {m:18, date:"2026-04-11",time:"19:30",t1:"CSK", t2:"DC",  venue:"Chepauk, Chennai"},
  {m:19, date:"2026-04-12",time:"15:30",t1:"LSG", t2:"GT",  venue:"Ekana Stadium, Lucknow"},
  {m:20, date:"2026-04-12",time:"19:30",t1:"MI",  t2:"RCB", venue:"Wankhede, Mumbai"},
  {m:21, date:"2026-04-13",time:"19:30",t1:"SRH", t2:"RR",  venue:"Rajiv Gandhi Stadium, Hyderabad"},
  {m:22, date:"2026-04-14",time:"19:30",t1:"CSK", t2:"KKR", venue:"Chepauk, Chennai"},
  {m:23, date:"2026-04-15",time:"19:30",t1:"RCB", t2:"LSG", venue:"Chinnaswamy, Bengaluru"},
  {m:24, date:"2026-04-16",time:"19:30",t1:"MI",  t2:"PBKS",venue:"Wankhede, Mumbai"},
  {m:25, date:"2026-04-17",time:"19:30",t1:"GT",  t2:"KKR", venue:"Narendra Modi Stadium, Ahmedabad"},
  {m:26, date:"2026-04-18",time:"15:30",t1:"RCB", t2:"DC",  venue:"Chinnaswamy, Bengaluru"},
  {m:27, date:"2026-04-18",time:"19:30",t1:"SRH", t2:"CSK", venue:"Rajiv Gandhi Stadium, Hyderabad"},
  {m:28, date:"2026-04-19",time:"15:30",t1:"KKR", t2:"RR",  venue:"Eden Gardens, Kolkata"},
  {m:29, date:"2026-04-19",time:"19:30",t1:"PBKS",t2:"LSG", venue:"Mullanpur, Punjab"},
  {m:30, date:"2026-04-20",time:"19:30",t1:"GT",  t2:"MI",  venue:"Narendra Modi Stadium, Ahmedabad"},
  {m:31, date:"2026-04-21",time:"19:30",t1:"SRH", t2:"DC",  venue:"Rajiv Gandhi Stadium, Hyderabad"},
  {m:32, date:"2026-04-22",time:"19:30",t1:"LSG", t2:"RR",  venue:"Ekana Stadium, Lucknow"},
  {m:33, date:"2026-04-23",time:"19:30",t1:"MI",  t2:"CSK", venue:"Wankhede, Mumbai"},
  {m:34, date:"2026-04-24",time:"19:30",t1:"RCB", t2:"GT",  venue:"Chinnaswamy, Bengaluru"},
  {m:35, date:"2026-04-25",time:"15:30",t1:"DC",  t2:"PBKS",venue:"Arun Jaitley, Delhi"},
  {m:36, date:"2026-04-26",time:"19:30",t1:"RR",  t2:"SRH", venue:"Sawai Mansingh, Jaipur"},
  {m:37, date:"2026-04-27",time:"19:30",t1:"GT",  t2:"CSK", venue:"Narendra Modi Stadium, Ahmedabad"},
  {m:38, date:"2026-04-28",time:"19:30",t1:"LSG", t2:"KKR", venue:"Ekana Stadium, Lucknow"},
  {m:39, date:"2026-04-29",time:"19:30",t1:"DC",  t2:"RCB", venue:"Arun Jaitley, Delhi"},
  {m:40, date:"2026-04-30",time:"19:30",t1:"PBKS",t2:"RR",  venue:"Mullanpur, Punjab"},
  {m:41, date:"2026-05-01",time:"19:30",t1:"MI",  t2:"SRH", venue:"Wankhede, Mumbai"},
  {m:42, date:"2026-05-02",time:"19:30",t1:"GT",  t2:"RCB", venue:"Narendra Modi Stadium, Ahmedabad"},
  {m:43, date:"2026-05-03",time:"19:30",t1:"RR",  t2:"DC",  venue:"Sawai Mansingh, Jaipur"},
  {m:44, date:"2026-05-04",time:"19:30",t1:"CSK", t2:"LSG", venue:"Chepauk, Chennai"},
  {m:45, date:"2026-05-05",time:"19:30",t1:"KKR", t2:"GT",  venue:"Eden Gardens, Kolkata"},
  {m:46, date:"2026-05-06",time:"19:30",t1:"PBKS",t2:"DC",  venue:"Mullanpur, Punjab"},
  {m:47, date:"2026-05-07",time:"19:30",t1:"SRH", t2:"MI",  venue:"Rajiv Gandhi Stadium, Hyderabad"},
  {m:48, date:"2026-05-08",time:"19:30",t1:"RR",  t2:"KKR", venue:"Sawai Mansingh, Jaipur"},
  {m:49, date:"2026-05-09",time:"19:30",t1:"RCB", t2:"PBKS",venue:"Chinnaswamy, Bengaluru"},
  {m:50, date:"2026-05-10",time:"19:30",t1:"LSG", t2:"SRH", venue:"Ekana Stadium, Lucknow"},
  {m:51, date:"2026-05-11",time:"19:30",t1:"GT",  t2:"DC",  venue:"Narendra Modi Stadium, Ahmedabad"},
  {m:52, date:"2026-05-12",time:"19:30",t1:"MI",  t2:"KKR", venue:"Wankhede, Mumbai"},
  {m:53, date:"2026-05-13",time:"19:30",t1:"CSK", t2:"RCB", venue:"Chepauk, Chennai"},
  {m:54, date:"2026-05-14",time:"19:30",t1:"RR",  t2:"PBKS",venue:"Sawai Mansingh, Jaipur"},
  {m:55, date:"2026-05-15",time:"19:30",t1:"DC",  t2:"LSG", venue:"Arun Jaitley, Delhi"},
  {m:56, date:"2026-05-16",time:"19:30",t1:"SRH", t2:"GT",  venue:"Rajiv Gandhi Stadium, Hyderabad"},
  {m:57, date:"2026-05-17",time:"19:30",t1:"KKR", t2:"CSK", venue:"Eden Gardens, Kolkata"},
  {m:58, date:"2026-05-18",time:"19:30",t1:"MI",  t2:"RR",  venue:"Wankhede, Mumbai"},
  {m:59, date:"2026-05-19",time:"19:30",t1:"RCB", t2:"SRH", venue:"Chinnaswamy, Bengaluru"},
  {m:60, date:"2026-05-20",time:"19:30",t1:"PBKS",t2:"CSK", venue:"Mullanpur, Punjab"},
  {m:61, date:"2026-05-21",time:"19:30",t1:"GT",  t2:"LSG", venue:"Narendra Modi Stadium, Ahmedabad"},
  {m:62, date:"2026-05-22",time:"19:30",t1:"DC",  t2:"KKR", venue:"Arun Jaitley, Delhi"},
  {m:63, date:"2026-05-23",time:"19:30",t1:"RR",  t2:"RCB", venue:"Sawai Mansingh, Jaipur"},
  {m:64, date:"2026-05-24",time:"15:30",t1:"CSK", t2:"SRH", venue:"Chepauk, Chennai"},
  {m:65, date:"2026-05-24",time:"19:30",t1:"MI",  t2:"GT",  venue:"Wankhede, Mumbai"},
  {m:66, date:"2026-05-27",time:"19:30",t1:"TBD", t2:"TBD", venue:"Qualifier 1"},
  {m:67, date:"2026-05-28",time:"19:30",t1:"TBD", t2:"TBD", venue:"Eliminator"},
  {m:68, date:"2026-05-30",time:"19:30",t1:"TBD", t2:"TBD", venue:"Qualifier 2"},
  {m:69, date:"2026-06-01",time:"19:30",t1:"TBD", t2:"TBD", venue:"IPL 2026 FINAL"},
];

// Known match results
const IPL_RESULTS = {
  1:  "RCB 201/4 beat SRH 198/6 by 3 wkts",
  2:  "MI 183/4 beat KKR 180/7 by 6 wkts",
  3:  "RR 192/3 beat CSK 188/6 by 7 wkts",
  4:  "PBKS 223/3 beat GT 220/5 by 7 wkts",
  5:  "LSG 176/5 beat DC 173/8 by 3 wkts",
  6:  "SRH 198/4 beat KKR 194/6 by 4 wkts",
  7:  "CSK 210/4 beat PBKS 206/6 by 4 wkts",
  8:  "DC 188/5 beat MI 185/7 by 5 wkts",
  9:  "RR 214/3 beat GT 210/6 by 7 wkts",
  10: "SRH 215/4 beat LSG 210/6 by 5 wkts",
  11: "RCB 253/3 beat CSK 248/5 by 5 wkts",
  12: "KKR vs PBKS — No result (wet outfield)",
  13: "RR 196/3 beat MI 169/8 by 27 runs",
  14: "DC 211/4 beat GT 210/7 by 6 wkts",
  15: "LSG 184/7 beat KKR 181/8 by 3 wkts",
  16: "RR 202/4 beat RCB 201/8 by 6 wkts",
  17: "PBKS 224/3 beat SRH 220/5 by 7 wkts",
  18: "CSK 212/6 beat DC 189/9 by 23 runs",
  19: "LSG beat GT (result confirmed)",
  20: "RCB 240/4 beat MI 222/5 by 18 runs — Salt 78, Patidar 53",
  21: "SRH 216/6 beat RR 159 by 57 runs — Kishan 91, Hinge 4/34 on debut",
};

function buildTickerItems() {
  const now   = getISTNow();
  const items = [];
  let liveMatch  = null;
  let nextMatch  = null;
  let lastResult = null;

  for (const match of IPL_SCHEDULE) {
    const start = createISTDateTime(match.date, match.time);
    const end   = new Date(start.getTime() + 4.5 * 60 * 60 * 1000); // +4.5 hrs

    if (now >= start && now < end) {
      liveMatch = match;
    } else if (now < start && !nextMatch) {
      nextMatch = match;
    }
    if (IPL_RESULTS[match.m] && now >= end) {
      lastResult = { match, score: IPL_RESULTS[match.m] };
    }
  }

  // 1. LIVE now
  if (liveMatch) {
    items.push(`🔴 <span>LIVE NOW:</span> Match ${liveMatch.m} — ${liveMatch.t1} vs ${liveMatch.t2} | ${liveMatch.venue}`);
  }

  // 2. Next match
  if (nextMatch) {
    const dayLabel = formatTickerDay(nextMatch.date);
    items.push(`📅 <span>Next Match:</span> ${nextMatch.t1} vs ${nextMatch.t2} • ${dayLabel} ${nextMatch.time} IST | ${nextMatch.venue}`);
  }

  // 3. Last result
  if (lastResult) {
    items.push(`🏏 <span>Match ${lastResult.match.m} Result:</span> ${lastResult.score}`);
  }

  // 4. Live season caps (from loaded data — always reflects latest seasons.json)
  const liveSeason = SEASON_DATA["2026"];
  if (liveSeason) {
    const oc = liveSeason.awards?.orange_cap;
    const pc = liveSeason.awards?.purple_cap;
    const leader = liveSeason.points_table?.[0];
    if (oc) items.push(`🟠 <span>Orange Cap:</span> ${oc.name} (${oc.team}) — ${oc.value} runs`);
    if (pc) items.push(`🟣 <span>Purple Cap:</span> ${pc.name} (${pc.team}) — ${pc.value} wkts`);
    if (leader) items.push(`📊 <span>Points Leader:</span> ${leader.team} — ${leader.points} pts, NRR ${leader.nrr}`);
  }

  // 5. All-time
  const atb = PLAYER_DATA.alltime_batters?.[0];
  if (atb) items.push(`🔴 <span>All-time runs leader:</span> ${atb.name} — ${Number(atb.runs).toLocaleString()} runs in ${atb.matches} matches`);
  items.push(`⚡ <span>All-time wickets leader:</span> Yuzvendra Chahal — 205 wickets`);

  return items;
}

function renderLiveTicker() {
  const inner = document.querySelector(".ticker-inner");
  if (!inner) return;
  const items = buildTickerItems();
  // Double for seamless CSS loop
  inner.innerHTML = [...items, ...items]
    .map(txt => `<span class="ticker-item">${txt}</span>`)
    .join("");
}

function initLiveTicker() {
  renderLiveTicker();
  // Refresh every 5 minutes
  setInterval(renderLiveTicker, 5 * 60 * 1000);
}

// ── SEASON FILTER ─────────────────────────────
function populateSeasonFilter() {
  const sel = document.getElementById("season-sel");
  if (!sel) return;
  const seasons = getAvailableSeasons();
  sel.innerHTML = seasons.map(yr => `<option value="${yr}">Season ${yr}</option>`).join("");
  if (!SEASON_DATA[currentSeason] && seasons.length) currentSeason = seasons[0];
  sel.value = currentSeason;
}

// ── PLAYER CELL ───────────────────────────────
function playerCell(name, team, tc, nationality) {
  const img  = getImg(name);
  const ini  = initials(name);
  const flag = nationalityFlag(nationality);
  const imgTag = img
    ? `<img src="${img}" alt="${name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">`
    : "";
  return `
    <div class="pcell">
      <div class="pimg-wrap" style="border-color:${teamColor(tc)}">
        ${imgTag}
        <span style="${img ? "display:none" : ""}">${ini}</span>
      </div>
      <div>
        <div class="pname">${name} ${flag}</div>
        <div class="pteam"><span class="pill p-${(tc || "").toLowerCase()}">${team}</span></div>
      </div>
    </div>`;
}

// ── TABLE RENDERERS ───────────────────────────
function renderBattersTable(data, tbodyId, cols) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const show = v => (v !== undefined && v !== null) ? v : "—";
  tbody.innerHTML = data.map((p, i) => {
    const origin = (p.nationality || "").toLowerCase() === "indian" ? "indian" : "overseas";
    const base = `<td class="pos-cell">${posNum(i)}</td><td>${playerCell(p.name, p.team, p.team_code, p.nationality)}</td>`;
    switch (cols) {
      case "full":    return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.runs)}</td><td>${show(p.matches)}</td><td>${show(p.innings)}</td><td>${show(p.not_out)}</td><td>${show(p.highest)}</td><td>${show(p.avg)}</td><td>${show(p.balls_faced)}</td><td>${show(p.sr)}</td><td>${show(p.hundreds)}</td><td>${show(p.fifties)}</td><td>${show(p.fours)}</td><td>${show(p.sixes)}</td></tr>`;
      case "sr":      return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.sr)}</td><td>${show(p.matches)}</td><td>${show(p.runs)}</td><td>${show(p.highest)}</td><td>${show(p.avg)}</td><td>${show(p.sixes)}</td></tr>`;
      case "avg":     return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.avg)}</td><td>${show(p.matches)}</td><td>${show(p.runs)}</td><td>${show(p.highest)}</td><td>${show(p.sr)}</td><td>${show(p.fifties)}</td></tr>`;
      case "sixes":   return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.sixes)}</td><td>${show(p.matches)}</td><td>${show(p.runs)}</td><td>${show(p.sr)}</td><td>${show(p.highest)}</td></tr>`;
      case "hundreds":return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.hundreds)}</td><td>${show(p.matches)}</td><td>${show(p.runs)}</td><td>${show(p.fifties)}</td><td>${show(p.avg)}</td></tr>`;
      case "alltime": return `<tr data-origin="${origin}">${base}<td class="stat-bold">${typeof p.runs === "number" ? p.runs.toLocaleString() : show(p.runs)}</td><td>${show(p.matches)}</td><td>${show(p.innings)}</td><td>${show(p.avg)}</td><td>${show(p.sr)}</td><td>${show(p.hundreds)}</td><td>${show(p.fifties)}</td><td>${show(p.highest)}</td></tr>`;
      default:        return `<tr data-origin="${origin}">${base}<td>${show(p.runs)}</td></tr>`;
    }
  }).join("");
}

function renderBowlersTable(data, tbodyId, cols) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const show = v => (v !== undefined && v !== null) ? v : "—";
  tbody.innerHTML = data.map((p, i) => {
    const origin = (p.nationality || "").toLowerCase() === "indian" ? "indian" : "overseas";
    const base = `<td class="pos-cell">${posNum(i)}</td><td>${playerCell(p.name, p.team, p.team_code, p.nationality)}</td>`;
    switch (cols) {
      case "full":    return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.wickets)}</td><td>${show(p.matches)}</td><td>${show(p.overs)}</td><td>${show(p.runs_conceded)}</td><td>${show(p.avg)}</td><td>${show(p.economy)}</td><td>${show(p.sr)}</td><td>${show(p.four_wickets)}</td><td>${show(p.five_wickets)}</td><td>${show(p.best)}</td></tr>`;
      case "eco":     return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.economy)}</td><td>${show(p.matches)}</td><td>${show(p.wickets)}</td><td>${show(p.overs)}</td><td>${show(p.avg)}</td><td>${show(p.best)}</td></tr>`;
      case "bowlavg": return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.avg)}</td><td>${show(p.matches)}</td><td>${show(p.wickets)}</td><td>${show(p.economy)}</td><td>${show(p.sr)}</td><td>${show(p.best)}</td></tr>`;
      case "bowlsr":  return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.sr)}</td><td>${show(p.matches)}</td><td>${show(p.wickets)}</td><td>${show(p.economy)}</td><td>${show(p.avg)}</td><td>${show(p.best)}</td></tr>`;
      case "alltime": return `<tr data-origin="${origin}">${base}<td class="stat-bold">${show(p.wickets)}</td><td>${show(p.matches)}</td><td>${show(p.avg)}</td><td>${show(p.economy)}</td><td>${show(p.sr)}</td><td>${show(p.best)}</td></tr>`;
      default:        return `<tr data-origin="${origin}">${base}<td>${show(p.wickets)}</td></tr>`;
    }
  }).join("");
}

// ── HERO BANNER ───────────────────────────────
function updateHero(sd) {
  const isOC  = (currentStatType !== "bowling");
  const cap   = isOC ? sd.awards.orange_cap : sd.awards.purple_cap;
  const img   = getImg(cap.name);
  const stats = isOC
    ? (sd.batters || []).find(p => p.name === cap.name)
    : (sd.bowlers || []).find(p => p.name === cap.name);

  const vals   = isOC
    ? [cap.value ?? "—", stats?.matches ?? "—", stats?.avg ?? "—", stats?.sr ?? "—", stats?.highest ?? "—", `${stats?.hundreds ?? "—"}/${stats?.fifties ?? "—"}`]
    : [cap.value ?? "—", stats?.matches ?? "—", stats?.avg ?? "—", stats?.economy ?? "—", stats?.best ?? "—", `${stats?.four_wickets ?? "—"}/${stats?.five_wickets ?? "—"}`];
  const labels = isOC
    ? ["Runs","Matches","Average","Strike Rate","HS","100s/50s"]
    : ["Wickets","Matches","Average","Economy","Best","4w/5w"];

  document.getElementById("hero-img").src                    = img;
  document.getElementById("hero-img").style.display          = img ? "" : "none";
  document.getElementById("hero-fallback").style.display     = img ? "none" : "flex";
  document.getElementById("hero-fallback").textContent       = initials(cap.name);
  document.getElementById("hero-name").textContent           = cap.name;
  document.getElementById("hero-team").textContent           = cap.team;
  document.getElementById("hero-team").className             = `hero-team-tag pill p-${cap.team_code}`;
  document.getElementById("hero-country").textContent        = isOC ? "🏏 Top Run-Scorer" : "🎯 Top Wicket-Taker";
  document.getElementById("hero-cap-label").textContent      = isOC ? "🟠 Orange Cap Holder" : "🟣 Purple Cap Holder";
  vals.forEach((v, i) => {
    const el = document.getElementById(`hs${i}`);
    if (!el) return;
    el.textContent = v;
    const key = el.nextElementSibling;
    if (key) key.textContent = labels[i];
  });
}

// ── POINTS TABLE ──────────────────────────────
function renderPointsTable(sd) {
  const tbody = document.getElementById("pts-tbody");
  tbody.innerHTML = sd.points_table.map((t, i) => {
    const color    = teamColor(t.team_code);
    const form     = Array.isArray(t.form) ? t.form : [];
    const dots     = form.map(f => `<div class="fd ${f.toLowerCase()}">${f}</div>`).join("");
    const nrrCls   = (t.nrr && t.nrr.startsWith("+")) ? "nrr-p" : "nrr-n";
    const champCls = t.champion ? " champ-row" : "";
    return `<tr class="${champCls}">
      <td><strong>${i+1}</strong>${i < 4 ? `<span class="q-badge">Q</span>` : ""}${t.champion ? `<span class="e-badge">🏆</span>` : ""}</td>
      <td><div class="team-cell-pts"><div class="team-icon-pts" style="background:${color}">${t.code}</div><strong>${t.team}</strong></div></td>
      <td>${t.played}</td><td>${t.won}</td><td>${t.lost}</td><td>${t.no_result}</td>
      <td><span class="pts-bold ${i < 4 ? "top4" : ""}">${t.points}</span></td>
      <td><span class="${nrrCls}">${t.nrr}</span></td>
      <td><div class="form-row">${dots}</div></td>
    </tr>`;
  }).join("");

  document.getElementById("pts-title").textContent = `IPL ${currentSeason} — Points Table`;
  document.getElementById("pts-upd").textContent   = sd.updated;

  const wrap = document.getElementById("champ-banner-wrap");
  if (sd.champion) {
    wrap.innerHTML = `<div class="champ-banner"><div class="champ-trophy">🏆</div><div class="champ-txt"><div class="title">IPL ${currentSeason} CHAMPIONS</div><div class="winner">${sd.champion}</div><div class="sub">${sd.final}</div></div><div class="champ-score"><div class="result">${sd.margin}</div><div class="margin">Final Result</div></div></div>`;
  } else {
    wrap.innerHTML = `<div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;padding:14px 20px;margin-bottom:20px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;color:#1565c0;letter-spacing:1px">🔴 LIVE — Season 2026 in progress • 21 of 74 matches played • Last: SRH beat RR by 57 runs (Match 21)</div>`;
  }
}

// ── AWARDS ────────────────────────────────────
function renderAwards(sd) {
  const oc = sd.awards.orange_cap;
  const pc = sd.awards.purple_cap;
  document.getElementById("awards-title").textContent = `IPL ${currentSeason} — Awards & Performances`;

  const capHTML = (cap, color, emoji, label, valColor) => {
    const img = getImg(cap.name);
    const av  = img
      ? `<img src="${img}" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><span style="display:none">${initials(cap.name)}</span>`
      : `<span>${initials(cap.name)}</span>`;
    return `<div class="cap-card"><div class="cap-hdr" style="background:${color}"><div style="font-size:28px">${emoji}</div><div><div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:#fff;letter-spacing:2px">${label}</div><div style="font-size:11px;color:rgba(255,255,255,0.7)">IPL ${currentSeason}</div></div></div><div class="cap-body"><div class="cap-av" style="border-color:${valColor}">${av}</div><div><div class="cap-pname">${cap.name}</div><div class="cap-psub"><span class="pill p-${cap.team_code}">${cap.team}</span> • ${cap.stat}</div></div><div class="cap-val" style="color:${valColor}">${cap.value}</div></div></div>`;
  };

  document.getElementById("cap-cards").innerHTML =
    capHTML(oc, "linear-gradient(135deg,#e8622a,#f57c00)", "🟠", "ORANGE CAP", "#e8622a") +
    capHTML(pc, "linear-gradient(135deg,#7b1fa2,#4a148c)", "🟣", "PURPLE CAP", "#7b1fa2");

  const extras = (sd.extra_awards || []).map(e =>
    `<tr><td><strong>${e.award}</strong></td><td>${e.winner}</td><td><span class="pill p-${(e.team||"").toLowerCase()}">${e.team}</span></td><td>${e.stat}</td><td>${currentSeason}</td></tr>`
  ).join("");

  document.getElementById("awards-tbody").innerHTML = `
    <tr><td><strong>Orange Cap</strong></td><td>${oc.name}</td><td><span class="pill p-${oc.team_code}">${oc.team}</span></td><td>${oc.value} runs</td><td>${currentSeason}</td></tr>
    <tr><td><strong>Purple Cap</strong></td><td>${pc.name}</td><td><span class="pill p-${pc.team_code}">${pc.team}</span></td><td>${pc.value} wickets</td><td>${currentSeason}</td></tr>
    ${extras}`;
}

// ── RECORDS ───────────────────────────────────
function renderRecords() {
  document.getElementById("records-grid").innerHTML = (PLAYER_DATA.records || []).map(r =>
    `<div class="rec-card"><div class="rec-icon" style="background:${r.bg}">${r.icon}</div><div><div class="rec-label">${r.label}</div><div class="rec-player">${r.player}</div><div class="rec-val">${r.value}</div><div class="rec-detail">${r.detail}</div></div></div>`
  ).join("");
  renderBattersTable(PLAYER_DATA.alltime_batters || [], "alltime-bat-tbody", "alltime");
  renderBowlersTable(PLAYER_DATA.alltime_bowlers || [], "alltime-bowl-tbody", "alltime");
}

// ── TEAM DROPDOWN ─────────────────────────────
function populateTeamFilter(sd) {
  const teams   = [...new Set(sd.batters.map(p => p.team))].sort();
  const sel     = document.getElementById("team-filter");
  const prev    = sel.value;
  sel.innerHTML = `<option value="">All Teams</option>` + teams.map(t => `<option value="${t}">${t}</option>`).join("");
  sel.value     = teams.includes(prev) ? prev : "";
}

// ── FILTERS ───────────────────────────────────
function applyActiveFilters() {
  const q      = document.getElementById("search-input").value.trim().toLowerCase();
  const team   = document.getElementById("team-filter").value.toLowerCase();
  const origin = document.getElementById("player-filter").value;
  document.querySelectorAll(".stbl tbody tr").forEach(row => {
    const txt        = row.textContent.toLowerCase();
    const rowOrigin  = row.getAttribute("data-origin") || "";
    const okSearch   = !q      || txt.includes(q);
    const okTeam     = !team   || txt.includes(team);
    const okOrigin   = !origin || rowOrigin === origin;
    row.style.display = (okSearch && okTeam && okOrigin) ? "" : "none";
  });
}

// ── LOAD SEASON ───────────────────────────────
function loadSeason(yr) {
  const sd = SEASON_DATA[yr];
  if (!sd) return;
  currentSeason = yr;

  const sel = document.getElementById("season-sel");
  if (sel) sel.value = yr;

  document.getElementById("last-upd-txt").textContent = `Updated: ${sd.updated}`;
  populateTeamFilter(sd);

  renderBattersTable([...sd.batters].sort((a,b)=>b.runs-a.runs),                           "main-batting-tbody","full");
  renderBattersTable([...sd.batters].sort((a,b)=>parseFloat(b.sr)-parseFloat(a.sr)),        "sr-tbody",         "sr");
  renderBattersTable([...sd.batters].sort((a,b)=>parseFloat(b.avg)-parseFloat(a.avg)),      "avg-tbody",        "avg");
  renderBattersTable([...sd.batters].sort((a,b)=>b.sixes-a.sixes),                         "sixes-tbody",      "sixes");
  renderBattersTable([...sd.batters].sort((a,b)=>b.hundreds-a.hundreds),                   "hundreds-tbody",   "hundreds");

  renderBowlersTable([...sd.bowlers].sort((a,b)=>b.wickets-a.wickets),                     "bowl-wkts-tbody",  "full");
  renderBowlersTable([...sd.bowlers].sort((a,b)=>parseFloat(a.economy)-parseFloat(b.economy)),"bowl-econ-tbody","eco");
  renderBowlersTable([...sd.bowlers].sort((a,b)=>parseFloat(a.avg)-parseFloat(b.avg)),     "bowl-avg-tbody",   "bowlavg");
  renderBowlersTable([...sd.bowlers].sort((a,b)=>parseFloat(a.sr)-parseFloat(b.sr)),       "bowl-sr-tbody",    "bowlsr");

  renderPointsTable(sd);
  renderAwards(sd);
  updateHero(sd);
  applyActiveFilters();
}

// ── UI HANDLERS ───────────────────────────────
function showPage(id, el) {
  document.querySelectorAll(".page-sec").forEach(s => { s.style.display = "none"; s.classList.remove("active"); });
  const sec = document.getElementById("page-" + id);
  sec.style.display = "block";
  setTimeout(() => sec.classList.add("active"), 10);
  document.querySelectorAll(".nav-a").forEach(a => a.classList.remove("active"));
  if (el) el.classList.add("active");
  if (id === "records") renderRecords();
}

function showSubTab(id, btn) {
  document.querySelectorAll("#page-stats .tab-sec").forEach(t => t.style.display = "none");
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
  document.querySelectorAll("#page-stats .sub-tabs .stab").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function switchStatType(type, btn) {
  currentStatType = type;
  document.querySelectorAll(".tab-sw-btn").forEach(b => b.classList.remove("active"));
  const activeBtn = btn || document.querySelector(`.tab-sw-btn[onclick*="'${type}'"]`);
  if (activeBtn) activeBtn.classList.add("active");
  const capSel = document.getElementById("cap-sel");
  if (capSel) capSel.value = type === "bowling" ? "purple" : "orange";

  const batSubTabs  = document.querySelector("#page-stats > .sub-tabs");
  const bowlSection = document.getElementById("bowling-section");

  if (type === "bowling") {
    document.querySelectorAll("#page-stats > .tab-sec").forEach(t => t.style.display = "none");
    bowlSection.style.display = "block";
    if (batSubTabs) batSubTabs.style.display = "none";
    showSubTab("bowling-wkts", document.querySelector("#bowling-section .sub-tabs .stab"));
  } else {
    bowlSection.style.display = "none";
    if (batSubTabs) batSubTabs.style.display = "";
    showSubTab("batting-tabs", document.querySelector("#page-stats > .sub-tabs .stab"));
    const firstTab = document.querySelectorAll("#page-stats > .sub-tabs .stab")[0];
    if (firstTab) firstTab.classList.add("active");
  }

  const sd = SEASON_DATA[currentSeason];
  if (sd) updateHero(sd);
}

function onSeasonChange() {
  loadSeason(document.getElementById("season-sel").value);
}

function doSearch()        { applyActiveFilters(); }
function filterByTeam()    { applyActiveFilters(); }
function filterByOrigin()  { applyActiveFilters(); }

// ── FOOTER CANVAS ─────────────────────────────
(function initFooterCanvas() {
  const canvas = document.getElementById("footerCanvas");
  if (!canvas) return;
  const ctx    = canvas.getContext("2d");
  const TEXT   = "designedbyhimanshu";
  const DPR    = window.devicePixelRatio || 1;
  const W = 1400, H = 200, RADIUS = 130;
  let FONT_SIZE = 148;
  let mx = -999, my = -999, smx = -999, smy = -999, isHover = false;

  canvas.width        = W * DPR;
  canvas.height       = H * DPR;
  canvas.style.width  = "100%";
  canvas.style.height = "auto";
  ctx.scale(DPR, DPR);

  function fitFont() {
    let s = 148;
    ctx.font = `800 ${s}px 'Syne', sans-serif`;
    while (ctx.measureText(TEXT).width > W - 60 && s > 10) {
      s--;
      ctx.font = `800 ${s}px 'Syne', sans-serif`;
    }
    return s;
  }

  canvas.addEventListener("mousemove", e => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left) * (W / r.width);
    my = (e.clientY - r.top)  * (H / r.height);
    isHover = true;
  });
  canvas.addEventListener("mouseleave", () => { isHover = false; mx = -999; my = -999; });

  function draw() {
    smx += isHover ? (mx - smx) * 0.75 : (-999 - smx) * 0.1;
    smy += isHover ? (my - smy) * 0.75 : (-999 - smy) * 0.1;

    ctx.clearRect(0, 0, W, H);
    ctx.font          = `800 ${FONT_SIZE}px 'Syne', sans-serif`;
    ctx.textAlign     = "center";
    ctx.textBaseline  = "middle";
    const cx = W / 2, cy = H * 0.58;

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth   = 1.2;
    ctx.lineJoin    = "round";
    ctx.strokeText(TEXT, cx, cy);
    ctx.restore();

    if (smx > -900) {
      ctx.save();
      const g = ctx.createRadialGradient(smx, smy, 0, smx, smy, RADIUS);
      g.addColorStop(0,    "rgba(42,122,75,1)");
      g.addColorStop(0.45, "rgba(20,80,45,0.75)");
      g.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillText(TEXT, cx, cy);
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }

  function start() { FONT_SIZE = fitFont(); draw(); }

  if (document.fonts && document.fonts.load) {
    document.fonts.load("800 148px Syne").then(start).catch(start);
  } else {
    setTimeout(start, 500);
  }
})();

// ── START APP ─────────────────────────────────
document.addEventListener("DOMContentLoaded", init);



// ----------------------------------------
