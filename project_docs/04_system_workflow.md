# System Workflow (طريقة عمل النظام)

This document maps out how users interact with the system and how background processes run to keep data fresh.

## 1. User Journey (دورة حياة المستخدم)

This Activity Diagram shows the standard flow of a user looking for a property or neighborhood data.

```mermaid
stateDiagram-v2
    [*] --> Homepage
    
    Homepage --> SearchProperties : User enters location/budget
    Homepage --> BrowseMap : User clicks Interactive Map
    Homepage --> CompareNeighborhoods : User wants ROI data
    
    state SearchProperties {
        [*] --> ListProperties
        ListProperties --> FilterProperties
        FilterProperties --> PropertyDetails
    }
    
    state BrowseMap {
        [*] --> LoadRiyadhMap
        LoadRiyadhMap --> ToggleLayers : Street / Satellite / Urban
        LoadRiyadhMap --> ViewParkPolygons
        LoadRiyadhMap --> ViewPropertyPins
    }
    
    state CompareNeighborhoods {
        [*] --> SelectNeighborhoods
        SelectNeighborhoods --> ViewCharts : Price/sqm over time
        SelectNeighborhoods --> ViewInfrastructureScore
    }
    
    PropertyDetails --> ContactAgent
    ContactAgent --> [*]
```

## 2. Background Data Sync (مزامنة البيانات)

To ensure the platform is always up to date without slowing down user requests, we use `APScheduler` in Flask to run background jobs.

```mermaid
sequenceDiagram
    participant Scheduler as APScheduler (Cron)
    participant Scraper as Web Scraper
    participant API as External APIs (Ejar/Wafi)
    participant DB as SQLite Database
    participant Cache as Flask Cache

    Note over Scheduler: Nightly at 3:00 AM
    Scheduler->>API: Fetch latest Ejar rental transactions
    API-->>Scheduler: JSON Data (Prices per sqm)
    Scheduler->>DB: Update rental_prices table
    
    Note over Scheduler: Every 2 hours
    Scheduler->>Scraper: Trigger property scraping
    Scraper->>Scraper: Parse listings from Aqar/Others
    Scraper->>DB: Insert new properties & images
    
    Note over Scheduler: Mondays & Thursdays
    Scheduler->>API: Fetch Wafi Off-plan projects
    API-->>Scheduler: JSON Data (Developers & Projects)
    Scheduler->>DB: Update developers & developer_projects
    
    Note over Scheduler: After any DB update
    Scheduler->>Cache: Clear endpoints cache
    Cache-->>Scheduler: Cache invalidated
```
