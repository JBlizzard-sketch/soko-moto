# Soko Moto 🔥

> **Flash deals for Nairobi's finest venues — booked in under 60 seconds.**

Soko Moto solves the *dead-hours problem*: upscale Nairobi restaurants, spas, and wellness venues post same-day flash deals during their quiet periods. Subscribers discover, book, and pay instantly via M-Pesa before slots vanish.

**Revenue model**: Commission on every completed booking.

---

## Live Features

| Area | Status |
|------|--------|
| Flash deal discovery feed | ✅ Live |
| Venue catalogue (8 curated venues) | ✅ Live |
| Deal booking flow (M-Pesa) | ✅ Live |
| Booking history + QR reference codes | ✅ Live |
| Admin dashboard + venue management | ✅ Live |
| Admin deal management | ✅ Live |
| Venue detail + performance stats | ✅ Live |
| Full REST API (OpenAPI contract-first) | ✅ Live |
| M-Pesa payment processing | 🔄 Phase 2 |
| WhatsApp bot integration | 🔄 Phase 2 |
| User authentication | 🔄 Phase 2 |
| Venue self-service portal | 🔄 Phase 3 |
| Standing deals / recurring templates | 🔄 Phase 3 |

---

## Tech Stack

```
Frontend          React 18 + Vite + TypeScript
Styling           Tailwind CSS + shadcn/ui
Animations        Framer Motion
Routing           Wouter
Data fetching     TanStack React Query (generated from OpenAPI)
API validation    Zod (generated from OpenAPI)

Backend           Express + TypeScript
ORM               Drizzle ORM
Database          PostgreSQL
Logging           Pino
Build             esbuild

Monorepo          pnpm workspaces
API spec          OpenAPI 3.0 (contract-first, orval codegen)
```

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express REST API (port 8080)
│   └── soko-moto/           # React/Vite frontend (port 22635)
├── lib/
│   ├── api-spec/            # OpenAPI spec + orval codegen config
│   ├── api-zod/             # Generated Zod validation schemas
│   ├── api-client-react/    # Generated React Query hooks
│   └── db/                  # Drizzle schema + PostgreSQL client
├── scripts/                 # Utility scripts
└── README.md
```

---

## API Reference

All routes prefixed `/api/`

### Venues
```
GET    /venues                    List venues (filter: category, neighborhood, status)
POST   /venues                    Create venue
GET    /venues/:id                Get venue
PATCH  /venues/:id                Update venue (approve, suspend, etc.)
GET    /venues/:id/stats          Revenue, fill rate, booking stats
```

### Deals
```
GET    /deals                     List deals (filter: status, category, venueId)
POST   /deals                     Create deal
GET    /deals/:id                 Get deal
PATCH  /deals/:id                 Update deal status
```

### Bookings
```
GET    /bookings                  List bookings (filter: userId, dealId, status)
POST   /bookings                  Create booking (decrements slots, updates deal status)
GET    /bookings/:id              Get booking
PATCH  /bookings/:id              Update booking (cancel, complete, etc.)
```

### Feed
```
GET    /feed/live                 Live deals with venue data (filter: category, neighborhood)
GET    /feed/trending             Top 6 deals by fill rate
GET    /feed/summary              Platform stats (live count, venues, bookings, fill rate)
GET    /feed/activity             Recent booking activity stream
```

### Supporting
```
GET/POST       /users
GET/PATCH      /users/:id
GET/POST       /ratings
GET/POST/PATCH /standing-deals
DELETE         /standing-deals/:id
```

---

## Database Schema

```sql
venues         (id, name, category, neighborhood, status, price_range, image_url, ...)
users          (id, name, phone, email, loyalty_tier, loyalty_points, is_corporate, ...)
deals          (id, venue_id, title, discount_percent, deal_price, total_slots, booked_slots, status, ...)
bookings       (id, user_id, deal_id, covers, total_paid, booking_reference, status, ...)
ratings        (id, venue_id, user_id, booking_id, score, review, ...)
standing_deals (id, venue_id, title, discount_percent, days_of_week, is_active, ...)
```

**Deal statuses**: `draft → live → filling → sold_out → completed`  
**Venue statuses**: `pending → approved | suspended`

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL database (or Replit DB via `DATABASE_URL`)

### Installation
```bash
pnpm install
```

### Database setup
```bash
pnpm --filter @workspace/db run migrate
```

### Development
```bash
# API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Frontend (port 22635)
pnpm --filter @workspace/soko-moto run dev
```

### After editing the OpenAPI spec
```bash
# Regenerate Zod schemas and React Query hooks
pnpm --filter @workspace/api-spec run codegen

# Rebuild API server
pnpm --filter @workspace/api-server run build
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | Express session secret | ✅ |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | For automated pushes | CI only |

---

## Seed Data

8 hand-picked Nairobi venues:
- **Talisman Restaurant** (Karen) — Contemporary International, ⭐ 4.7
- **Mercury Lounge** (Westlands) — Cocktails & Tapas, ⭐ 4.5
- **The Serene Spa** (Kilimani) — Full Body Treatments, ⭐ 4.9
- **Cultured Kitchen** (Kilimani) — Modern Kenyan, ⭐ 4.6
- **Primal Strength Studio** (Westlands) — Functional Fitness, ⭐ 4.8
- **Osteria Della Pace** (Westlands) — Italian, ⭐ 4.4
- **Flow Wellness Center** (Kilimani) — Yoga & Wellness, ⭐ 4.7
- **The Roastery CBD** (CBD) — Brunch & Coffee, ⭐ 4.3

---

## Phase Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Foundation, API, core data model, frontend scaffold | ✅ Done |
| 2 | M-Pesa STK Push, WhatsApp bot, user auth | 🔄 Next |
| 3 | Venue self-service portal, standing deals UI | 📋 Planned |
| 4 | Loyalty programme, referral system | 📋 Planned |
| 5 | Corporate accounts, team bookings | 📋 Planned |
| 6 | Analytics dashboard, revenue reporting | 📋 Planned |

---

## Contributing

This is a private project. All changes go through pull request review.

---

*Built with ❤️ for Nairobi's hospitality industry.*
