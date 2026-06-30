# AI-Solutions — Website System (CET333 Product Development)

A multi-page website for **AI-Solutions Ltd**, a fictional Sunderland start-up that uses AI to
improve the digital employee experience. The public site markets the company's services, past
projects, feedback, events and gallery, and lets visitors submit an enquiry through a Contact Us
form. A password-protected admin area lets staff review those enquiries.

- **Frontend:** React (Create React App) + React Router
- **Backend:** Node.js + Express (REST API)
- **Database:** PostgreSQL
- **AI chatbot:** Google Gemini (free tier), proxied through the backend
- **Design system:** see [`DESIGN.md`](DESIGN.md) — warm cream surfaces, dark terminal panels,
  a single violet accent, Inter + JetBrains Mono. All UI is derived from those tokens.

---

## Features

### Public website
- **Home** — mission, value proposition and featured services/feedback
- **Services** — the software solutions offered
- **Past Solutions** — case studies of completed industry projects
- **Customer Feedback** — testimonials with star ratings
- **Photo Gallery** — past & upcoming event photos with a lightbox
- **Events** — upcoming events (plus a past-events archive)
- **Contact Us** — 7-field enquiry form (Full Name, Email, Phone, Company, Country, Job Title,
  Job Details). No customer account required. Validated on both client and server and protected by
  Cloudflare Turnstile.
- **AI chatbot ("Ava")** — a floating widget on every page. Messages are sent to the backend Gemini
  proxy (the API key never reaches the browser) and the bot gracefully offers a human hand-off when a
  query should be escalated.

### Admin area (password-protected)
- Sign in with the **existing** secure flow: email + password + Turnstile, then a 6-digit email **OTP**.
- A back-office dashboard whose sole job is to review Contact Us enquiries: headline stats, a
  **searchable / filterable / paginated** table, and a full-detail view of any single enquiry
  (mark read/unread, reply by email, delete).
- Only the **admin** role exists — there is no public sign-up and no role-management UI.

> The authentication/security backend (JWT sessions, OTP, Turnstile, hashing, CSRF, rate limiting,
> Helmet, account lockout, audit logs) is reused as-is. The front end integrates with it; it does
> not reimplement or weaken any of it.

---

## Project structure

```
src/
  components/      Shared UI: Navbar, Footer, Field, Modal, StarRating, Chatbot, Turnstile, States…
  pages/           Public pages (Home, Services, PastSolutions, Feedback, Gallery, Events, Contact)
  pages/admin/     AdminLogin (login + OTP), AdminLayout, AdminDashboard (enquiries)
  lib/             useFetch data hook
  index.css        Design system (DESIGN.md tokens + components)
  api.js           fetch wrapper (CSRF + token refresh) + JSON helpers
backend/
  controllers/     auth, admin (inquiries), contact, publicContent, chat (Gemini proxy)
  routes/          authRoutes, adminRoutes, publicRoutes
  middleware/      authMiddleware, validate
  utils/           hash, otp, email, logger, validator, turnstile
  server.js        Express app (Helmet, CORS, CSRF, rate limit)
  seed.js          Creates the admin + sample public content
database/
  schema.sql       Tables: users(admin), sessions, password_history, logs,
                   inquiries, solutions, case_studies, feedback, articles, events, gallery_images
```

---

## Setup & run locally

### 1. Configure environment
Copy `.env.example` to `.env` and fill in the values (DB credentials, JWT secret, Turnstile keys,
email/OTP credentials). To enable the AI chatbot, add a free Gemini key from
<https://aistudio.google.com/app/apikey>:

```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

If `GEMINI_API_KEY` is left blank, the site still runs — the chatbot replies with a friendly
"offline" message and points visitors to the Contact page.

### 2. Install dependencies
```bash
npm install            # frontend (repo root)
cd backend && npm install
```

### 3. Create the database
```bash
# create the database once (psql), then load the schema:
psql -U postgres -d auth_db -f database/schema.sql

# seed the admin account + sample website content:
cd backend && node seed.js
```
The seed prints the default admin credentials:

```
Admin login:  admin@ai-solutions.com
Password:     Admin@2026!
```
(Change this after the first login. You can override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.)

### 4. Start the apps
```bash
cd backend && npm run dev     # API → http://localhost:5000
npm start                     # site → http://localhost:3000  (run from repo root)
```

The public site is at `/`; the admin portal is at `/admin`.

---

## Notes
- The Contact form and admin login both require a valid Cloudflare Turnstile challenge, which only
  completes in a real browser — automated/curl submissions are intentionally rejected server-side.
- OTP codes are emailed; in development they are also logged to the backend console.
