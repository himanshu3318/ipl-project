"""
======================================================
  IPL CricStats Hub — Data Analysis Module
  Project: IPL Player Ranking System
  Course:  Data Science / B.Tech
======================================================
  Usage:
    python analysis.py            → print all stats
    import analysis               → use functions
======================================================
"""

import json
import os
from pathlib import Path
from collections import defaultdict

# ── Paths ──────────────────────────────────────────────
BASE       = Path(__file__).parent.parent
DATA_DIR   = BASE / "static" / "data"
SEASONS_F  = DATA_DIR / "seasons.json"
PLAYERS_F  = DATA_DIR / "players.json"


def load_seasons() -> dict:
    with open(SEASONS_F, encoding="utf-8") as f:
        return json.load(f)

def load_players() -> dict:
    with open(PLAYERS_F, encoding="utf-8") as f:
        return json.load(f)


# ── 1. Season-wise Orange & Purple Cap ────────────────
def cap_history() -> list[dict]:
    """Returns list of {season, oc_player, oc_runs, pc_player, pc_wkts}."""
    data   = load_seasons()
    result = []
    for yr in sorted(data.keys(), reverse=True):
        sd  = data[yr]
        oc  = sd["awards"]["orange_cap"]
        pc  = sd["awards"]["purple_cap"]
        result.append({
            "season":    yr,
            "oc_player": oc["name"],
            "oc_team":   oc["team"],
            "oc_runs":   oc["value"],
            "pc_player": pc["name"],
            "pc_team":   pc["team"],
            "pc_wkts":   pc["value"],
        })
    return result


# ── 2. IPL Champions Summary ───────────────────────────
def champions_summary() -> dict:
    """Returns {team: title_count} sorted by title_count desc."""
    data   = load_seasons()
    titles = defaultdict(int)
    for sd in data.values():
        champ = sd.get("champion")
        if champ:
            titles[champ] += 1
    return dict(sorted(titles.items(), key=lambda x: x[1], reverse=True))


# ── 3. Top N Batters across given seasons ─────────────
def top_batters(seasons: list = None, top_n: int = 10) -> list[dict]:
    """
    Returns top-N batters by runs in given seasons.
    If seasons=None, uses all available.
    """
    data    = load_seasons()
    target  = set(seasons) if seasons else set(data.keys())
    players = defaultdict(lambda: {"runs": 0, "matches": 0, "hundreds": 0, "fifties": 0})

    for yr, sd in data.items():
        if yr not in target:
            continue
        for b in sd.get("batters", []):
            key = b["name"]
            players[key]["name"]     = b["name"]
            players[key]["team"]     = b.get("team", "")
            players[key]["runs"]    += b["runs"]
            players[key]["matches"] += b["matches"]
            players[key]["hundreds"]+= b.get("hundreds", 0)
            players[key]["fifties"] += b.get("fifties", 0)

    ranked = sorted(players.values(), key=lambda x: x["runs"], reverse=True)
    return ranked[:top_n]


# ── 4. Top N Bowlers across given seasons ─────────────
def top_bowlers(seasons: list = None, top_n: int = 10) -> list[dict]:
    """Returns top-N bowlers by wickets in given seasons."""
    data    = load_seasons()
    target  = set(seasons) if seasons else set(data.keys())
    players = defaultdict(lambda: {"wickets": 0, "matches": 0})

    for yr, sd in data.items():
        if yr not in target:
            continue
        for bw in sd.get("bowlers", []):
            key = bw["name"]
            players[key]["name"]    = bw["name"]
            players[key]["team"]    = bw.get("team", "")
            players[key]["wickets"] += bw["wickets"]
            players[key]["matches"] += bw["matches"]

    ranked = sorted(players.values(), key=lambda x: x["wickets"], reverse=True)
    return ranked[:top_n]


# ── 5. Team Win-Loss Record ────────────────────────────
def team_win_loss() -> list[dict]:
    """Returns all teams' aggregated win-loss record across all seasons."""
    data  = load_seasons()
    teams = defaultdict(lambda: {"played": 0, "won": 0, "lost": 0, "points": 0, "titles": 0})

    for yr, sd in data.items():
        for row in sd.get("points_table", []):
            tc = row["code"]
            teams[tc]["team"]    = row["team"]
            teams[tc]["code"]    = row["code"]
            teams[tc]["played"] += row["played"]
            teams[tc]["won"]    += row["won"]
            teams[tc]["lost"]   += row["lost"]
            teams[tc]["points"] += row["points"]
            if row.get("champion"):
                teams[tc]["titles"] += 1

    result = sorted(teams.values(), key=lambda x: x["won"], reverse=True)
    return result


# ── 6. Average runs per season (trend) ────────────────
def avg_runs_per_season() -> dict:
    """Returns {season: avg_runs_of_top_scorer} — shows batting trend over time."""
    data = load_seasons()
    trend = {}
    for yr, sd in data.items():
        if sd.get("batters"):
            top = sd["batters"][0]
            trend[yr] = {"player": top["name"], "runs": top["runs"], "sr": top.get("sr", "-")}
    return dict(sorted(trend.items()))


# ── 7. Player career summary ──────────────────────────
def player_career(name: str) -> dict:
    """Returns aggregated career batting + bowling stats for one player."""
    data    = load_seasons()
    batting = []
    bowling = []

    for yr, sd in data.items():
        for b in sd.get("batters", []):
            if b["name"].lower() == name.lower():
                batting.append({"season": yr, **b})
        for bw in sd.get("bowlers", []):
            if bw["name"].lower() == name.lower():
                bowling.append({"season": yr, **bw})

    # Aggregate totals
    total_runs    = sum(b["runs"]    for b in batting)
    total_matches = sum(b["matches"] for b in batting)
    total_wkts    = sum(bw["wickets"] for bw in bowling)

    return {
        "player":        name,
        "seasons_played": sorted(set(b["season"] for b in batting + bowling)),
        "total_runs":    total_runs,
        "total_matches": total_matches,
        "total_wickets": total_wkts,
        "batting_by_season": sorted(batting, key=lambda x: x["season"], reverse=True),
        "bowling_by_season": sorted(bowling, key=lambda x: x["season"], reverse=True),
    }


# ── CLI runner ─────────────────────────────────────────
if __name__ == "__main__":
    sep = "=" * 55

    print(f"\n{sep}")
    print("  IPL CricStats Hub — Data Analysis Report")
    print(sep)

    print("\n📊 IPL CHAMPIONS (All Time):")
    for team, titles in champions_summary().items():
        print(f"   {team:35s} {titles} title{'s' if titles>1 else ''}")

    print(f"\n🟠 ORANGE CAP / 🟣 PURPLE CAP HISTORY:")
    print(f"  {'Season':<8} {'OC Player':<28} {'Runs':<6} {'PC Player':<28} {'Wkts'}")
    for row in cap_history():
        print(f"  {row['season']:<8} {row['oc_player']:<28} {row['oc_runs']:<6} {row['pc_player']:<28} {row['pc_wkts']}")

    print(f"\n🏏 TOP 10 BATTERS (All Available Seasons):")
    print(f"  {'#':<4} {'Player':<30} {'Team':<8} {'Runs'}")
    for i, p in enumerate(top_batters(), 1):
        print(f"  {i:<4} {p.get('name',''):<30} {p.get('team',''):<8} {p.get('runs',0)}")

    print(f"\n⚡ TOP 10 BOWLERS (All Available Seasons):")
    print(f"  {'#':<4} {'Player':<30} {'Team':<8} {'Wickets'}")
    for i, p in enumerate(top_bowlers(), 1):
        print(f"  {i:<4} {p.get('name',''):<30} {p.get('team',''):<8} {p.get('wickets',0)}")

    print(f"\n🏆 TEAM WIN-LOSS RECORDS:")
    print(f"  {'Team':<38} {'P':<6} {'W':<6} {'L':<6} {'Titles'}")
    for t in team_win_loss():
        print(f"  {t.get('team',''):<38} {t['played']:<6} {t['won']:<6} {t['lost']:<6} {t['titles']}")

    print(f"\n📈 AVG RUNS OF TOP SCORER BY SEASON:")
    for yr, info in avg_runs_per_season().items():
        print(f"   {yr}: {info['player']:<28} {info['runs']} runs  SR {info['sr']}")

    print(f"\n👤 SAMPLE: Virat Kohli Career Summary:")
    vc = player_career("Virat Kohli")
    print(f"   Total runs    : {vc['total_runs']}")
    print(f"   Total matches : {vc['total_matches']}")
    print(f"   Seasons played: {', '.join(vc['seasons_played'])}")

    print(f"\n{sep}\n")
