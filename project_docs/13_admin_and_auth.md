# لوحة الإدارة والتوثيق (Admin & Authentication) 🔐

This document defines how the platform owner (Admin) accesses the control panel to manage the system.

## 1. Authentication System (نظام الدخول)
Since this is a free academic project, we avoid expensive auth providers like Auth0.
- **Library:** `Flask-Login` + `Werkzeug.security` (Bcrypt password hashing).
- **Session Management:** Secure HTTP-only cookies with a 24-hour expiration.

## 2. Admin Login Screen (شاشة دخول المشرف)
- **Path:** `/admin/login` (Hidden from public navigation).
- **Design:** A minimalist, highly secure dark-themed screen. Includes rate limiting (max 5 failed attempts locks the IP for 15 minutes).

## 3. Admin Dashboard Capabilities (صلاحيات لوحة الإدارة)
Once logged in, the Admin can:
1. **Trigger Scrapers Manually:** A button to force a run of the scraping script without waiting for the Cron job.
2. **Review Scraped Data:** Approve or delete properties that have suspicious prices (outliers) before they appear on the public map.
3. **System Health Monitor:** View logs for the latest Wafi/Ejar API syncs to ensure external connections are alive.
4. **AI Token Usage:** Monitor how many Groq API tokens have been consumed today.

## 4. Role-Based Access Control (RBAC)
For the MVP, there is only one role: `SuperAdmin`.
If the project scales to allow normal users to favorite properties, a `User` role will be introduced, managed via `JWT` (JSON Web Tokens) for stateless authentication.
