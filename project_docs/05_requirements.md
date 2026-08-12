# Requirements (المتطلبات)

This document lists all the gathered functional and non-functional requirements based on the user's requests and project discussions.

## 1. Functional Requirements (المتطلبات الوظيفية)

| ID | Feature | Description | Status |
| :--- | :--- | :--- | :--- |
| **FR-01** | Property Search | Users can search properties by type, budget, and neighborhood. | ✅ Done |
| **FR-02** | Interactive Map | A Leaflet map displaying property pins, park polygons, and neighborhood heatmaps based on infrastructure scores. | ✅ Done |
| **FR-03** | Map Layers | Users can toggle between Street, Satellite, Urban Planning, and Terrain layers. | ✅ Done |
| **FR-04** | Neighborhood Comparison | Users can compare two or more neighborhoods using charts (Chart.js) showing price/sqm over time. | ✅ Done |
| **FR-05** | Developer Directory | A page listing major real estate developers (Al Majedia, Raseen, etc.) and their projects from Wafi. | ✅ Done |
| **FR-06** | Real Boundaries | Neighborhoods and parks must use real GeoJSON coordinates/polygons, not dummy circles. | ✅ Done |
| **FR-07** | Automated Scraping | Background tasks to scrape property data and update the database automatically. | ✅ Done |
| **FR-08** | RAG / AI Chatbot | An AI assistant trained on the database to help users make investment decisions. | ⏳ Pending |

## 2. Non-Functional Requirements (المتطلبات غير الوظيفية)

| Category | Requirement | Detail |
| :--- | :--- | :--- |
| **Performance** | Fast Load Times | Pages should render quickly. Implemented `Flask-Caching` and `Flask-Compress` (GZIP). |
| **UX / UI** | Premium Aesthetics | Must look like a premium B2B/B2C platform. No basic Bootstrap. Added modern interactions (Ripple, Tilt, Scroll Reveal). |
| **Localization** | Clean Arabic Language | UI must be natively Arabic (RTL) using the `Tajawal` font. Encoding must be clean UTF-8 (No BOM). |
| **Legal** | Disclaimer | A blinking disclaimer must be present on the homepage indicating this is an academic demo, not a commercial product. |
| **Hosting** | PaaS Deployment | Cannot be hosted on InfinityFree (PHP only). Must be deployed to a Python-compatible PaaS like Render.com or Heroku. |
| **Extensibility** | Microservices Architecture | Code must be decoupled (Routes, Models, Services) so it can be easily rebuilt or migrated to Microservices. |
