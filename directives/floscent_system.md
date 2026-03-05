# Flo-scent Business System

## Overview
Full-stack business management system for Flo-scent, a scent marketing company. Built with Django REST API + React frontend.

## Stack
- **Backend:** Django 4.2, Django REST Framework, JWT auth (simplejwt), SQLite (dev) / PostgreSQL (prod)
- **Frontend:** React 18, Vite, Tailwind CSS, React Query, Zustand, React Router v6
- **AI:** Anthropic Claude API (claude-opus-4-6 for proposals/quotes/SEO, claude-haiku-4-5 for chat)
- **Payments:** Stripe (PaymentIntents, Invoices, Webhooks)
- **PDF:** ReportLab (branded proposal PDFs)

## Features
1. **Client Onboarding** — Public multi-step form at `/onboard`, no auth required. Creates Client + OnboardingForm records.
2. **CRM** — Full client management, status tracking (lead → onboarding → active → inactive), notes.
3. **Quotes** — Line-item quotes with discount/tax, billing cycle (monthly/annual/one-time), email send, duplicate.
4. **Proposals** — Full proposal with 9 content sections, PDF export via ReportLab with brand styling.
5. **AI Tools** — Claude-powered: proposal writing, quote suggestions, SEO content generator, client chat assistant.
6. **Asset Tracking** — Track all installed diffusers/systems per client, maintenance scheduling, overdue alerts.
7. **Payments** — Stripe PaymentIntents + Invoices, webhook handler, payment status tracking.
8. **SEO** — Page management (title, meta, H1, keywords, schema), XML sitemap generator, publish toggle.
9. **Admin Dashboard** — Stats, revenue chart, pipeline summary, recent activity feed.
10. **Auth** — JWT login, role-based (admin/staff/client), password change, token refresh + blacklist.

## Directory Structure
```
backend/
  config/           # Django settings, URLs, WSGI
  apps/
    users/          # Custom User model + JWT auth
    clients/        # Client CRM + onboarding forms
    quotes/         # Quote builder with line items
    proposals/      # Proposals + PDF generation
    assets/         # Asset tracking + maintenance logs
    payments/       # Stripe integration
    ai_services/    # Claude AI (proposals, quotes, SEO, chat)
    seo/            # SEO page management + sitemap
    dashboard/      # Stats endpoint
frontend/
  src/
    pages/
      admin/        # All admin dashboard pages
      auth/         # Login
      public/       # Onboarding form
    components/
      Layout/       # AdminLayout + Sidebar
      UI/           # StatCard, Badge, PageHeader
    store/          # Zustand auth store
    api/            # Axios instance with JWT interceptors
execution/
  setup.sh          # One-command setup script
directives/
  floscent_system.md  # This file
```

## Running Locally
```bash
./execution/setup.sh        # One-time setup
# Then:
cd backend && source venv/bin/activate && python manage.py runserver
cd frontend && npm run dev
# Login at http://localhost:5173 with admin@floscent.com / admin123
```

## API Keys Required (backend/.env)
- `ANTHROPIC_API_KEY` — Anthropic console
- `STRIPE_SECRET_KEY` — Stripe dashboard
- `STRIPE_PUBLISHABLE_KEY` — Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` — From `stripe listen --forward-to localhost:8000/api/payments/webhook/`

## Key API Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/login/` | Login (returns JWT) |
| POST | `/api/clients/onboard/` | Public onboarding (no auth) |
| GET/POST | `/api/clients/` | Client list/create |
| GET/POST | `/api/quotes/` | Quote list/create |
| POST | `/api/quotes/{id}/send/` | Send quote |
| GET/POST | `/api/proposals/` | Proposal list/create |
| POST | `/api/proposals/{id}/generate-pdf/` | Generate branded PDF |
| GET | `/api/proposals/{id}/download-pdf/` | Download PDF |
| POST | `/api/ai/generate-proposal/` | AI proposal generation |
| POST | `/api/ai/generate-quote/` | AI quote suggestions |
| POST | `/api/ai/generate-seo/` | AI SEO content |
| POST | `/api/ai/chat/` | Client chat (public) |
| POST | `/api/payments/create-intent/` | Stripe PaymentIntent |
| POST | `/api/payments/create-invoice/` | Stripe Invoice |
| POST | `/api/payments/webhook/` | Stripe webhook |
| GET | `/api/dashboard/stats/` | Dashboard statistics |
| GET | `/api/seo/sitemap.xml` | XML sitemap |

## AI Prompt Design
All AI features use a shared `BRAND_CONTEXT` string defining Flo-scent's voice and services.
- **Proposals:** claude-opus-4-6, returns 9-section JSON
- **Quote suggestions:** claude-opus-4-6, returns line items JSON with pricing
- **SEO content:** claude-opus-4-6, returns title/meta/h1/body/keywords JSON
- **Chat:** claude-haiku-4-5-20251001 (faster/cheaper), stateful conversation history

## Brand
- Colors: `#0A0A0A` (black), `#C9A84C` (gold), `#F5F2ED` (cream)
- Tagline: "Transform Spaces. Elevate Experiences."
- Email: hello@floscent.com

## Known Extensions (future)
- Email sending with SendGrid/SES (PDF attachments for quotes/proposals)
- Stripe Subscriptions UI for recurring scent plans
- Client portal (separate login for clients to view/accept their quotes)
- Push notifications for overdue maintenance
- Celery background jobs for PDF generation + email sending
