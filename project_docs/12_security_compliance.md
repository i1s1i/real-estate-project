# الأمان والحماية (Security & Compliance) 🛡️

Since the platform fetches data from the web and may be exposed publicly, strict security measures are implemented.

## 1. Attack Mitigation (الحماية من الهجمات)
- **Cloudflare (Free Tier):** Placed in front of the Render hosting to provide DNS caching, DDoS protection, and Bot Management.
- **SQL Injection Prevention:** SQLAlchemy ORM is strictly used. No raw SQL strings containing user input are ever executed.
- **Cross-Site Scripting (XSS):** Jinja2 auto-escaping is enabled globally for all HTML templates.

## 2. Scraping Compliance (سياسة الجلب)
To protect the server from being IP-banned by target websites (Aqar, etc.):
- **Rate Limiting:** Scraper uses random `time.sleep(2, 5)` delays between HTTP requests.
- **Headers Rotation:** Uses fake User-Agents and avoids requesting the same page excessively.
- **Disclaimer:** The platform strictly displays the disclaimer: *"هذا المشروع دراسي تجريبي فقط وليس تجارياً"*.

## 3. Rate Limiting (Flask-Limiter)
To protect the backend API from abuse (e.g., someone spamming the `/api/chat` RAG endpoint):
- **Limit:** 10 requests per minute per IP for AI endpoints.
- **Limit:** 60 requests per minute for Map data endpoints.
