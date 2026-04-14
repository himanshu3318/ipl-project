"""
======================================================
  IPL CricStats Hub — Python Flask Backend
  Project: IPL Player Ranking System
  Course:  Data Science / B.Tech
  Author:  [Your Name]
  Date:    April 2026
======================================================
  Run:  python app.py
  URL:  http://127.0.0.1:5000
======================================================
"""

import json
import os
import re
import time
from pathlib import Path
from datetime import datetime, timedelta, timezone
from html import unescape
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from flask import Flask, jsonify, render_template


# ── Flask app setup ────────────────────────────────────
app = Flask(
    __name__,
    template_folder=str(Path(__file__).parent.parent / "templates"),
    static_folder=str(Path(__file__).parent.parent / "static"),
)

# ── Data file paths ────────────────────────────────────
DATA_DIR     = Path(__file__).parent.parent / "static" / "data"
SEASONS_FILE = DATA_DIR / "seasons.json"
PLAYERS_FILE = DATA_DIR / "players.json"

IST = timezone(timedelta(hours=5, minutes=30))
LIVE_TICKER_CACHE = {"expires_at": 0.0, "payload": None}
OFFICIAL_MATCH_REPORTS_URL = "https://www.iplt20.com/news/match-reports"
OFFICIAL_SITE_BASE = "https://www.iplt20.com"
LIVE_TICKER_SCHEDULE_2026 = [
    {"matchNo": 19, "date": "2026-04-12", "time": "19:30", "teams": "MI vs RCB", "venue": "Wankhede Stadium, Mumbai"},
    {"matchNo": 21, "date": "2026-04-13", "time": "19:30", "teams": "SRH vs RR", "venue": "Rajiv Gandhi International Stadium, Hyderabad"},
    {"matchNo": 22, "date": "2026-04-14", "time": "19:30", "teams": "CSK vs KKR", "venue": "MA Chidambaram Stadium, Chennai"},
    {"matchNo": 23, "date": "2026-04-15", "time": "19:30", "teams": "RCB vs LSG", "venue": "M Chinnaswamy Stadium, Bengaluru"},
    {"matchNo": 24, "date": "2026-04-16", "time": "19:30", "teams": "MI vs PBKS", "venue": "Wankhede Stadium, Mumbai"},
    {"matchNo": 25, "date": "2026-04-17", "time": "19:30", "teams": "GT vs KKR", "venue": "Narendra Modi Stadium, Ahmedabad"},
    {"matchNo": 34, "date": "2026-04-18", "time": "19:30", "teams": "RCB vs PBKS", "venue": "M Chinnaswamy Stadium, Bengaluru"},
    {"matchNo": 35, "date": "2026-04-19", "time": "15:30", "teams": "GT vs DC", "venue": "Narendra Modi Stadium, Ahmedabad"},
    {"matchNo": 36, "date": "2026-04-19", "time": "19:30", "teams": "RR vs LSG", "venue": "Jaipur"},
    {"matchNo": 37, "date": "2026-04-20", "time": "15:30", "teams": "PBKS vs RCB", "venue": "New Chandigarh"},
    {"matchNo": 38, "date": "2026-04-20", "time": "19:30", "teams": "MI vs CSK", "venue": "Wankhede Stadium, Mumbai"},
]


def load_json(filepath: Path) -> dict:
    """Load and return a JSON file as a Python dict."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def _compact_ws(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value or "")).strip()


def _fetch_remote_html(url: str) -> str:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 IPLCricStatsHub/1.0"})
    with urlopen(req, timeout=10) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="ignore")


def _ist_now() -> datetime:
    return datetime.now(IST)


def _build_schedule_state() -> dict:
    now = _ist_now()
    fixtures = []
    for item in LIVE_TICKER_SCHEDULE_2026:
        start = datetime.fromisoformat(f"{item['date']}T{item['time']}:00+05:30")
        end = start + timedelta(hours=4, minutes=30)
        fixtures.append({**item, "start": start, "end": end})

    live_fixture = next((fixture for fixture in fixtures if fixture["start"] <= now < fixture["end"]), None)
    next_fixture = next((fixture for fixture in fixtures if now < fixture["start"]), None)
    recent_fixture = next((fixture for fixture in reversed(fixtures) if now >= fixture["end"]), None)

    def serialize_fixture(fixture: dict | None) -> dict | None:
        if not fixture:
            return None
        return {
            "match_no": fixture["matchNo"],
            "date": fixture["date"],
            "time": fixture["time"],
            "teams": fixture["teams"],
            "venue": fixture["venue"],
        }

    return {
        "live_fixture": serialize_fixture(live_fixture),
        "next_fixture": serialize_fixture(next_fixture),
        "recent_finished_fixture": serialize_fixture(recent_fixture),
    }


def _extract_latest_official_result() -> dict:
    listing_html = _fetch_remote_html(OFFICIAL_MATCH_REPORTS_URL)

    report_match = re.search(
        r'href="(?P<href>/news/[^"]+)"[^>]*>\s*(?P<title>TATA IPL 2026,\s*Match\s*(?P<match>\d+):[^<]+?Match Report)\s*<',
        listing_html,
        re.IGNORECASE,
    )
    if not report_match:
        raise ValueError("Could not parse official match report listing")

    article_url = urljoin(OFFICIAL_SITE_BASE, report_match.group("href"))
    article_html = _fetch_remote_html(article_url)

    summary_match = (
        re.search(r'<meta[^>]+property="og:description"[^>]+content="([^"]+)"', article_html, re.IGNORECASE)
        or re.search(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', article_html, re.IGNORECASE)
        or re.search(r"<p>(.*?)</p>", article_html, re.IGNORECASE | re.DOTALL)
    )

    summary = _compact_ws(summary_match.group(1)) if summary_match else _compact_ws(report_match.group("title"))
    title = _compact_ws(report_match.group("title"))
    if title and summary.startswith(title):
        summary = summary[len(title):].lstrip(" :-|")

    return {
        "match_no": int(report_match.group("match")),
        "title": title,
        "summary": summary or title,
        "url": article_url,
    }


def build_live_ticker_payload(force_refresh: bool = False) -> dict:
    now_ts = time.time()
    if (
        not force_refresh
        and LIVE_TICKER_CACHE["payload"] is not None
        and now_ts < LIVE_TICKER_CACHE["expires_at"]
    ):
        return LIVE_TICKER_CACHE["payload"]

    seasons = load_json(SEASONS_FILE)
    players = load_json(PLAYERS_FILE)
    live_season = seasons.get("2026", {})
    schedule_state = _build_schedule_state()

    latest_result = {
        "match_no": 18,
        "summary": "CSK beat DC by 23 runs",
        "detail": "Sanju Samson 115* | Overton 4/18",
        "source": "local-fallback",
        "url": None,
    }

    source = "local-fallback"
    fetch_error = None
    try:
        official_result = _extract_latest_official_result()
        latest_result = {
            "match_no": official_result["match_no"],
            "summary": official_result["summary"],
            "detail": official_result["title"],
            "source": "official-iplt20",
            "url": official_result["url"],
        }
        source = "official-iplt20"
    except Exception as exc:
        fetch_error = str(exc)

    payload = {
        "generated_at": _ist_now().isoformat(),
        "source": source,
        "fetch_error": fetch_error,
        "latest_result": latest_result,
        "live_fixture": schedule_state["live_fixture"],
        "next_fixture": schedule_state["next_fixture"],
        "recent_finished_fixture": schedule_state["recent_finished_fixture"],
        "orange_cap": live_season.get("awards", {}).get("orange_cap"),
        "purple_cap": live_season.get("awards", {}).get("purple_cap"),
        "points_leader": (live_season.get("points_table") or [None])[0],
        "all_time_runs_leader": (players.get("alltime_batters") or [None])[0],
    }

    LIVE_TICKER_CACHE["payload"] = payload
    LIVE_TICKER_CACHE["expires_at"] = now_ts + 300
    return payload


# ── Page Routes ────────────────────────────────────────
@app.route("/")
def home():
    """Serve the main IPL Stats page."""
    return render_template("index.html")
@app.route('/dhurandhar')
def dhurandhar():
    return render_template('dhurandhar.html')


# ── API Routes (for Data Science analysis use) ─────────
@app.route("/api/seasons", methods=["GET"])
def get_all_seasons():
    """
    GET /api/seasons
    Returns a list of all available IPL seasons.
    """
    data = load_json(SEASONS_FILE)
    seasons = sorted(data.keys(), reverse=True)
    return jsonify({"seasons": seasons, "count": len(seasons)})


@app.route("/api/season/<year>", methods=["GET"])
def get_season(year: str):
    """
    GET /api/season/<year>
    Returns full data for a specific IPL season.
    Params:
      year  — e.g. 2026, 2016, 2008
    Query:
      stat  — 'batting' | 'bowling' | 'points' | 'awards'  (optional, returns subset)
    """
    data = load_json(SEASONS_FILE)
    if year not in data:
        return jsonify({"error": f"Season {year} not found"}), 404

    season = data[year]
    stat = request.args.get("stat", "all")

    if stat == "batting":
        result = sorted(season["batters"], key=lambda x: x["runs"], reverse=True)
        return jsonify({"season": year, "batting": result})
    elif stat == "bowling":
        result = sorted(season["bowlers"], key=lambda x: x["wickets"], reverse=True)
        return jsonify({"season": year, "bowling": result})
    elif stat == "points":
        return jsonify({"season": year, "points_table": season["points_table"],
                        "champion": season.get("champion"),
                        "final": season.get("final"),
                        "margin": season.get("margin")})
    elif stat == "awards":
        return jsonify({"season": year,
                        "awards": season["awards"],
                        "extra_awards": season.get("extra_awards", [])})
    else:
        return jsonify({"season": year, "data": season})


@app.route("/api/players/alltime", methods=["GET"])
def get_alltime_players():
    """
    GET /api/players/alltime
    Returns all-time run scorers and wicket takers.
    Query:
      type  — 'batting' | 'bowling'  (optional, returns subset)
    """
    data = load_json(PLAYERS_FILE)
    stat = request.args.get("type", "all")

    if stat == "batting":
        batters = sorted(data["alltime_batters"], key=lambda x: x["runs"], reverse=True)
        return jsonify({"type": "batting", "players": batters})
    elif stat == "bowling":
        bowlers = sorted(data["alltime_bowlers"], key=lambda x: x["wickets"], reverse=True)
        return jsonify({"type": "bowling", "players": bowlers})
    else:
        return jsonify({"batters": data["alltime_batters"],
                        "bowlers": data["alltime_bowlers"]})


@app.route("/api/records", methods=["GET"])
def get_records():
    """
    GET /api/records
    Returns all IPL all-time records.
    """
    data = load_json(PLAYERS_FILE)
    return jsonify({"records": data.get("records", [])})


@app.route("/api/orangecap", methods=["GET"])
def orange_cap_history():
    """
    GET /api/orangecap
    Returns Orange Cap winners for all seasons.
    """
    data = load_json(SEASONS_FILE)
    history = []
    for yr in sorted(data.keys(), reverse=True):
        oc = data[yr]["awards"]["orange_cap"]
        history.append({
            "season": yr,
            "player": oc["name"],
            "team":   oc["team"],
            "runs":   oc["value"],
            "stat":   oc["stat"],
        })
    return jsonify({"orange_cap_history": history})


@app.route("/api/purplecap", methods=["GET"])
def purple_cap_history():
    """
    GET /api/purplecap
    Returns Purple Cap winners for all seasons.
    """
    data = load_json(SEASONS_FILE)
    history = []
    for yr in sorted(data.keys(), reverse=True):
        pc = data[yr]["awards"]["purple_cap"]
        history.append({
            "season":  yr,
            "player":  pc["name"],
            "team":    pc["team"],
            "wickets": pc["value"],
            "stat":    pc["stat"],
        })
    return jsonify({"purple_cap_history": history})


@app.route("/api/champions", methods=["GET"])
def champions():
    """
    GET /api/champions
    Returns IPL champions for all completed seasons.
    """
    data = load_json(SEASONS_FILE)
    result = []
    for yr in sorted(data.keys(), reverse=True):
        champ = data[yr].get("champion")
        if champ:
            result.append({
                "season":  yr,
                "champion": champ,
                "final":   data[yr].get("final"),
                "margin":  data[yr].get("margin"),
            })
    return jsonify({"champions": result})


@app.route("/api/player/stats", methods=["GET"])
def player_stats():
    """
    GET /api/player/stats?name=Virat+Kohli
    Returns all season stats for a specific player.
    """
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify({"error": "Provide player name as ?name=Player+Name"}), 400

    seasons_data = load_json(SEASONS_FILE)
    batting_stats = []
    bowling_stats = []

    for yr, sd in seasons_data.items():
        for b in sd.get("batters", []):
            if b["name"].lower() == name.lower():
                batting_stats.append({"season": yr, **b})
        for bw in sd.get("bowlers", []):
            if bw["name"].lower() == name.lower():
                bowling_stats.append({"season": yr, **bw})

    if not batting_stats and not bowling_stats:
        return jsonify({"error": f"No data found for player: {name}"}), 404

    return jsonify({
        "player":  name,
        "batting": sorted(batting_stats,  key=lambda x: x["season"], reverse=True),
        "bowling": sorted(bowling_stats, key=lambda x: x["season"], reverse=True),
    })


@app.route("/api/team/stats", methods=["GET"])
def team_stats():
    """
    GET /api/team/stats?code=RCB
    Returns all season points-table entries for a specific team.
    """
    code = request.args.get("code", "").upper().strip()
    if not code:
        return jsonify({"error": "Provide team code as ?code=RCB"}), 400

    seasons_data = load_json(SEASONS_FILE)
    results = []

    for yr, sd in seasons_data.items():
        for row in sd.get("points_table", []):
            if row["code"].upper() == code:
                results.append({
                    "season":   yr,
                    "played":   row["played"],
                    "won":      row["won"],
                    "lost":     row["lost"],
                    "points":   row["points"],
                    "nrr":      row["nrr"],
                    "champion": row.get("champion", False),
                })

    if not results:
        return jsonify({"error": f"No data found for team: {code}"}), 404

    return jsonify({"team": code, "seasons": sorted(results, key=lambda x: x["season"], reverse=True)})


@app.route("/api/live-ticker", methods=["GET"])
def live_ticker():
    """
    GET /api/live-ticker
    Returns latest ticker data using official IPL match reports when available,
    with local schedule fallback for live/next fixtures.
    """
    force_refresh = request.args.get("refresh") == "1"
    return jsonify(build_live_ticker_payload(force_refresh=force_refresh))


# ── Data Analysis Helper (Python-only, for notebook use) ──
def compute_summary_stats() -> dict:
    """
    Compute summary statistics across all seasons.
    Useful for Data Science analysis / Jupyter notebook.
    Returns a dict with key aggregated stats.
    """
    data = load_json(SEASONS_FILE)
    total_seasons = len(data)
    all_batters   = []
    all_bowlers   = []
    champions     = {}

    for yr, sd in data.items():
        all_batters.extend(sd.get("batters", []))
        all_bowlers.extend(sd.get("bowlers", []))
        champ = sd.get("champion")
        if champ:
            champions[champ] = champions.get(champ, 0) + 1

    # Top run scorer across seasons
    if all_batters:
        top_batter = max(all_batters, key=lambda x: x["runs"])
    else:
        top_batter = {}

    # Top wicket taker across seasons
    if all_bowlers:
        top_bowler = max(all_bowlers, key=lambda x: x["wickets"])
    else:
        top_bowler = {}

    return {
        "total_seasons":   total_seasons,
        "top_run_scorer":  top_batter,
        "top_wkt_taker":   top_bowler,
        "title_counts":    champions,
        "most_titles":     max(champions, key=champions.get) if champions else None,
    }


# ── Main entrypoint ────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  IPL CricStats Hub — Python Backend")
    print("  Running at: http://127.0.0.1:5000")
    print("  Press Ctrl+C to quit")
    print("=" * 55)
    app.run(debug=True, host="0.0.0.0", port=5000)

