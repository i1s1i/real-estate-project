"""Verified public real-estate indicators published by official sources."""

GASTAT_REPI_Q3_2026 = {
    "period": "Q3 2026",
    "annual_change_pct": 1.2,
    "quarterly_change_pct": -1.2,
    "riyadh_region_annual_change_pct": 4.6,
    "base_year": 2023,
    "source_name": "General Authority for Statistics (GASTAT)",
    "source_url": (
        "https://www.stats.gov.sa/documents/20117/2435267/"
        "RPI+Q3+2026-EN.pdf/bb3d3d86-89c4-d57a-c6a0-c2f0995b6312"
        "?t=1792395027642"
    ),
    "sectors": [
        {
            "label_ar": "السكني",
            "label_en": "Residential",
            "annual_change_pct": 2.3,
        },
        {
            "label_ar": "التجاري",
            "label_en": "Commercial",
            "annual_change_pct": -2.0,
        },
        {
            "label_ar": "الزراعي",
            "label_en": "Agricultural",
            "annual_change_pct": 3.9,
        },
    ],
    "residential_types": [
        {
            "label_ar": "الأراضي السكنية",
            "label_en": "Residential land",
            "annual_change_pct": 4.9,
        },
        {
            "label_ar": "الشقق",
            "label_en": "Apartments",
            "annual_change_pct": 1.7,
        },
        {
            "label_ar": "الفلل",
            "label_en": "Villas",
            "annual_change_pct": -7.7,
        },
        {
            "label_ar": "الأدوار السكنية",
            "label_en": "Residential floors",
            "annual_change_pct": 0.8,
        },
    ],
}
