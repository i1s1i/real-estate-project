# Project Architecture & Structure (هيكلة المشروع والملفات)

## 1. Directory Structure (DOM / File Tree)
The proposed clean structure for the rebuild. This structure uses a modular Flask factory pattern, separating concerns cleanly.

```text
real_estate_app/
├── app/
│   ├── __init__.py          # Flask app factory & extensions initialization
│   ├── models/              # Database models (SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── property.py
│   │   ├── neighborhood.py
│   │   └── developer.py
│   ├── routes/              # API and Page routes
│   │   ├── __init__.py
│   │   ├── api.py           # JSON endpoints for AJAX/Map
│   │   └── pages.py         # HTML template rendering
│   ├── services/            # Business logic and external API integrations
│   │   ├── scraper.py       # Web scraping logic
│   │   ├── wafi_api.py      # Wafi API integration
│   │   └── ejar_api.py      # Ejar API integration
│   └── utils/               # Helper functions
│       └── formatters.py
├── config.py                # Environment configurations (Dev/Prod)
├── run.py                   # Main entry point to run the server
├── requirements.txt         # Python dependencies
├── project_docs/            # Project rebuild blueprints (This folder)
├── static/                  # Static assets (CSS, JS, Images, Data)
│   ├── css/
│   │   └── style.css        # Main stylesheet (Vanilla CSS, CSS Variables)
│   ├── js/
│   │   ├── app.js           # Main logic, map loading, API calls
│   │   └── interactions.js  # UI Skills (Ripple, Reveal, Skeleton)
│   └── data/
│       └── major_parks.json # GeoJSON for map rendering
└── templates/               # Jinja2 HTML Templates
    ├── layouts/
    │   └── base.html        # Main layout (Navbar, Footer, CSS/JS links)
    ├── pages/
    │   ├── index.html       # Homepage
    │   ├── map.html         # Interactive Map
    │   └── compare.html     # Neighborhood Comparison
    └── components/          # Reusable UI components (e.g. property card)
```

## 2. System Architecture (UML)
This architecture describes how the Microservices/Components interact. We use a monolithic approach with background workers for data sync.

```mermaid
graph TD
    %% Actors
    User([End User])
    Admin([System Admin / Scheduler])

    %% Frontend Layer
    subgraph Frontend [Frontend Layer (Browser)]
        UI[Web UI HTML/CSS/JS]
        Map[Leaflet Interactive Map]
        Charts[Chart.js Dashboards]
    end

    %% Backend Layer
    subgraph Backend [Backend Layer (Flask)]
        Router[Flask Routes]
        API[API Endpoints JSON]
        Cache[Flask-Caching]
        BackgroundJobs[APScheduler Background Jobs]
    end

    %% Database Layer
    subgraph DB [Database Layer]
        SQLite[(SQLite Database)]
        Chroma[(ChromaDB Vector Store - RAG)]
    end

    %% External Services
    subgraph External [External Data Sources]
        Ejar[Ejar API - Rental Data]
        Wafi[Wafi API - Developers/Off-plan]
        Scraper[Web Scrapers - Aqar, etc.]
        Groq[Groq API - LLM/RAG]
    end

    %% Connections
    User -->|Interacts| UI
    UI -->|Renders| Map
    UI -->|Renders| Charts
    
    UI <-->|HTTP GET/POST| Router
    Map <-->|AJAX JSON| API
    Charts <-->|AJAX JSON| API
    
    Router <-->|Reads/Writes| SQLite
    API <--> Cache
    Cache <--> SQLite
    
    Admin -->|Configures| BackgroundJobs
    BackgroundJobs -->|Triggers Data Sync| Scraper
    BackgroundJobs -->|Fetches Data| Ejar
    BackgroundJobs -->|Fetches Data| Wafi
    
    Scraper -->|Saves Data| SQLite
    Ejar -->|Saves Data| SQLite
    Wafi -->|Saves Data| SQLite

    %% RAG Future Scope
    BackgroundJobs -->|Embeds Data| Chroma
    Router -->|Queries Context| Groq
    Groq <--> Chroma
```

## 3. Technology Stack
- **Backend:** Python 3.12, Flask, SQLAlchemy (ORM), APScheduler.
- **Frontend:** Vanilla HTML5, CSS3 (CSS Variables, No Tailwind), Vanilla JavaScript.
- **Mapping:** Leaflet.js (Map rendering), GeoJSON (Boundaries).
- **Data Visualization:** Chart.js.
- **Database:** SQLite (Development/MVP), PostgreSQL (Recommended for Production).
- **AI/RAG (Future):** ChromaDB (Vector DB), Groq API (LLM inference), Scikit-Learn (Decision modeling).
