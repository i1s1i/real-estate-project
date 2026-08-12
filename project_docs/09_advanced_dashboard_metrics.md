# لوحة الإحصائيات المتقدمة (Advanced Dashboard Metrics) 📊

This document details the data points and visualizations required for the comprehensive admin and user dashboards.

## 1. Time-Series Analysis (الإحصائيات الزمنية)
- **Yearly/Monthly Trends:** Line charts showing the rise/fall of average price per sqm over the last 5 years.
- **Seasonality:** Highlighting peak renting/buying months based on Ejar historical data.

## 2. Neighborhood Micro-Metrics (تفاصيل الحي الدقيقة)
Each neighborhood page will feature a highly detailed metrics board:

| Metric | Source / Calculation | Visualization |
| :--- | :--- | :--- |
| **Market Activity (الحركة والعرض)** | Number of active listings vs. historical average. | Heatmap Gauge |
| **Land Usage (مساحة الأراضي)** | Built Area vs. White Lands (Unsold/Empty). | Doughnut Chart |
| **Strategic Access (مداخل ومخارج)** | Number of highway access points (e.g., King Fahd Rd, Northern Ring). | Text/List |
| **Facilities (الخدمات والمرافق)** | Parks, Hospitals, Malls, Gas Stations, Groceries, Cafes. | Icon Grid with Counts |
| **Infrastructure (البنية التحتية)** | Drainage, Fiber Optics availability. | Progress Bars (0-100%) |
| **Events (الفعاليات)** | Proximity to Riyadh Season zones or major events. | Map Overlays |

## 3. Data Gathering Strategy for Micro-Metrics (OSM)
Since this is a free/academic project, we cannot afford Google Places API. We will use **OpenStreetMap (OSM) Overpass API**.

### Example Overpass Query (For Cafes in a Neighborhood)
```json
[out:json];
area["name:ar"="حي الملقا"]->.searchArea;
node["amenity"="cafe"](area.searchArea);
out count;
```
*This free method will allow the backend scheduler to periodically count cafes, gas stations, and hospitals for every neighborhood and store the counts in the SQLite database.*
