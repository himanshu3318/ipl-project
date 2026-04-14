# 🏏 IPL CricStats Hub — Player Ranking System

> **Data Science / B.Tech College Project**
> IPL Season 2008–2026 | Stats, Rankings, Records

---

## 📁 Project Structure

```
ipl_project/
├── templates/
│   └── index.html              ← Main HTML page (UI)
├── static/
│   ├── css/
│   │   └── style.css           ← All CSS styles
│   ├── js/
│   │   └── app.js              ← All frontend JavaScript
│   └── data/
│       ├── seasons.json        ← IPL 2008–2026 season data
│       └── players.json        ← All-time players + records
├── backend/
│   ├── app.py                  ← Flask web server + REST API
│   └── analysis.py             ← Python data analysis module
├── requirements.txt            ← Python packages needed
└── README.md                   ← This file
```

---

## 🚀 How to Run

### Option 1 — Python Flask Server (Recommended for submission)

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
cd backend
python app.py

# Open browser at:
http://127.0.0.1:5000
```

### Option 2 — Open HTML directly (no Python needed)

```bash
# Just open in browser directly — works without Flask
open templates/index.html
# or double-click index.html in File Explorer
```

> ⚠️ Note: When opening HTML directly, JSON data is loaded via
> relative fetch() paths. Use a local server or Flask for best results.

### Option 3 — Run Data Analysis

```bash
cd backend
python analysis.py
```

---

## 🌐 API Endpoints (Flask Backend)

| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | `/`                               | Main web page                      |
| GET    | `/api/seasons`                    | List all available seasons         |
| GET    | `/api/season/2026`                | Full data for IPL 2026             |
| GET    | `/api/season/2026?stat=batting`   | Only batting stats for 2026        |
| GET    | `/api/season/2026?stat=bowling`   | Only bowling stats for 2026        |
| GET    | `/api/season/2026?stat=points`    | Only points table for 2026         |
| GET    | `/api/season/2026?stat=awards`    | Only awards for 2026               |
| GET    | `/api/players/alltime`            | All-time run scorers & wicket takers|
| GET    | `/api/records`                    | All-time IPL records               |
| GET    | `/api/orangecap`                  | Orange Cap history all seasons     |
| GET    | `/api/purplecap`                  | Purple Cap history all seasons     |
| GET    | `/api/champions`                  | IPL Champions all seasons          |
| GET    | `/api/player/stats?name=Virat+Kohli` | Career stats for one player   |
| GET    | `/api/team/stats?code=RCB`        | All-season record for one team     |

---

## 📊 Features

- ✅ IPL 2026 Live Data (updated April 12, 2026)
- ✅ Season Dropdown — 2008 to 2026
- ✅ Orange Cap / Purple Cap heroes with player photos
- ✅ Batting stats: Runs, SR, Avg, Sixes, Hundreds
- ✅ Bowling stats: Wickets, Economy, Avg, SR
- ✅ Points Table with NRR, Form guide, Playoff qualifiers
- ✅ Awards page — Orange Cap, Purple Cap, MVP
- ✅ All-Time Records page
- ✅ Search by player name
- ✅ Filter by Team / Indian / Overseas
- ✅ Live scrolling ticker bar
- ✅ Python REST API (Flask)
- ✅ Python Data Analysis module

---

## 📦 Data Sources

- Season stats: iplt20.com / ESPNcricinfo
- Player images: ESPNcricinfo CDN (public)
- Data manually curated and verified for accuracy

---

## 🛠 Tech Stack

| Layer     | Technology        |
|-----------|-------------------|
| Frontend  | HTML5, CSS3, Vanilla JS |
| Backend   | Python 3.11 + Flask |
| Data      | JSON (structured datasets) |
| Fonts     | Google Fonts (Bebas Neue, Barlow) |
| Images    | ESPNcricinfo CDN |

---

*CricStats Hub — IPL Analytics | Data Science B.Tech Project*
