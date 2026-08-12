# الاستضافة والتشغيل المجاني (Free DevOps & Deployment) 🚀

This document proves that an academic/student project can be hosted, deployed, and scaled using **100% free tiers**.

## 1. Hosting Architecture (هيكلية الاستضافة المجانية)

| Service | Tool | Why? (Free Tier Benefits) |
| :--- | :--- | :--- |
| **Web Server (Flask)** | `Render.com` | Free Web Service. Sleeps after 15 mins of inactivity (acceptable for demos/academic defense). |
| **Database** | `Supabase` (PostgreSQL) | Free 500MB DB. Faster and infinitely more robust than local SQLite on ephemeral hosting. |
| **Cron Jobs (Scraping)** | `GitHub Actions` | Free 2,000 CI/CD minutes/month. Perfect for triggering Python scrapers to run nightly and push data to Supabase via API. |
| **AI / LLM** | `Groq API` | Free tier offers extremely high tokens-per-minute (TPM) for Llama-3 models. |

## 2. Deployment Pipeline (مسار النشر)
We use GitOps to deploy automatically.

```mermaid
graph LR
    Dev[Developer pushes code] --> Git[GitHub Repository]
    Git --> Actions[GitHub Actions (Tests pass?)]
    Actions -- Yes --> Render[Render.com triggers Webhook]
    Render --> Live[App is Live!]
```

## 3. Academic Business Model (النموذج الأكاديمي)
Unlike commercial models focusing on ROI, this project's value proposition is:
- **Research Value:** Proving that integrating ML and RAG into real estate can optimize urban planning decisions.
- **Cost Efficiency:** Demonstrating high-level software engineering (Microservices, AI, ETL pipelines) at $0 cost.
