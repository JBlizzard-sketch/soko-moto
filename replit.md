# Soko Moto

Flash deal platform for upscale Nairobi restaurants, spas, and wellness venues targeting the dead-hours problem. Venues post same-day deals; subscribers book in under 60 seconds via M-Pesa. Revenue via commission.

## Architecture

Pnpm monorepo with three artifacts:

- `artifacts/api-server` — Express API server (port 8080), contract-first OpenAPI
- `artifacts/soko-moto` — React/Vite frontend (port 22635)
- `artifacts/mockup-sandbox` — Design canvas preview server (port 8081)

Shared libraries under `lib/`:
- `lib/api-spec` — OpenAPI spec + orval codegen config (generates Zod schemas + React Query hooks)
- `lib/api-zod` — Generated Zod validation schemas
- `lib/api-client-react` — Generated React Query hooks
- `lib/db` — Drizzle ORM schema + PostgreSQL client

## Database

PostgreSQL via `DATABASE_URL` env var. Tables:
- `venues` — approved restaurants/spas/bars (status: pending/approved/suspended)
- `users` — platform users with loyalty tiers (bronze/silver/gold)
- `deals` — flash deals (status: draft/live/filling/sold_out/expired/completed)
- `bookings` — bookings with reference codes + M-Pesa payment references
- `ratings` — venue reviews by users
- `standing_deals` — recurring deal templates
- `otp_codes` — OTP verification codes (TTL 10 minutes, single-use)
- `mpesa_transactions` — M-Pesa STK push transaction ledger
- `sessions` — Express session storage (connect-pg-simple)

Migrations via Drizzle: `cd lib/db && npx drizzle-kit push`
Seed: handled via `executeSql` in code_execution sandbox

## API Routes

All routes prefixed under `/api/`:

### Auth (Phase 2)
- `POST /auth/request-otp` — send 6-digit OTP to phone (dev mode: always 123456)
- `POST /auth/verify-otp` — verify OTP, create session, auto-register user
- `GET /auth/me` — get current user from session (401 if not authenticated)
- `POST /auth/logout` — destroy session

### Payments (Phase 2)
- `POST /payments/mpesa/stk-push` — initiate M-Pesa STK Push for a booking
- `POST /payments/mpesa/callback` — Safaricom Daraja callback (updates booking status)
- `GET /payments/mpesa/status/:checkoutRequestId` — poll payment status

### Venues / Deals / Bookings / Users / Ratings
- `GET/POST /venues` · `GET/PATCH /venues/:id` · `GET /venues/:id/stats`
- `GET/POST /deals` · `GET/PATCH /deals/:id`
- `GET/POST /bookings` · `GET/PATCH /bookings/:id`
- `GET/POST /users` · `GET/PATCH /users/:id`
- `GET/POST /ratings`
- `GET/POST/PATCH/DELETE /standing-deals`
- `GET /feed/live` · `GET /feed/trending` · `GET /feed/summary` · `GET /feed/activity`

## Frontend Pages

- `/` — Home: Trending + Live feed with category/neighborhood filters
- `/deals/:id` — Deal detail + Sign In gate + M-Pesa booking + payment modal
- `/venues` — Curated venues list with filters
- `/venues/:id` — Venue detail + stats + live deals + ratings
- `/bookings` — User bookings (requires sign-in, shows QR reference codes)
- `/admin` — Admin dashboard with platform stats
- `/admin/venues` — Approve/suspend venue applications
- `/admin/deals` — Monitor and manage all deals

## Auth & Session

- Phone OTP authentication (no passwords). Uses `express-session` + `connect-pg-simple`.
- `SESSION_SECRET` env var required. Sessions stored in `sessions` table. 30-day TTL.
- `requireAuth` middleware in `artifacts/api-server/src/middleware/auth.ts`
- Frontend: `AuthContext` (`src/contexts/AuthContext.tsx`) provides `user`, `openLogin`, `logout`
- Login triggered from Navbar "Sign In" button or on booking attempt while unauthenticated
- Dev mode OTP: always `123456` when `AFRICASTALKING_API_KEY` not set

## M-Pesa Integration

- Daraja API v1 (Safaricom). STK Push flow: create booking (pending) → STK Push → callback confirms.
- Dev mode: no real charge when `MPESA_CONSUMER_KEY` not set; booking auto-confirmed immediately.
- Service: `artifacts/api-server/src/services/mpesa.ts`
- Env vars needed for production: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`, `MPESA_ENV=production`

## WhatsApp Notifications

- Booking confirmations sent via Africa's Talking WhatsApp API (fire-and-forget).
- Dev mode: logs message instead of sending when `AFRICASTALKING_API_KEY` not set.
- Service: `artifacts/api-server/src/services/whatsapp.ts`
- Env vars for production: `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME`

## Codegen

After editing `lib/api-spec/openapi.yaml`, always run:
```
pnpm --filter @workspace/api-spec run codegen
```
Then rebuild the API server.

**Critical:** `lib/api-spec/orval.config.ts` has `indexFiles: false` in zod output. Do NOT remove this. `lib/api-zod/src/index.ts` must only export from `./generated/api`.

## Design System

- Colors: Forest green primary (`hsl(130, 30%, 28%)`), burnt orange accent (`hsl(15, 65%, 50%)`)
- Fonts: Playfair Display (serif headings) + Inter (body)
- Components: shadcn/ui, Framer Motion animations, Lucide icons
- Price in KES throughout

## GitHub Sync

- Repo: `https://github.com/JBlizzard-sketch/soko-moto`
- Push via: `git push "https://JBlizzard-sketch:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/JBlizzard-sketch/soko-moto.git" main`
- CI: `.github/workflows/ci.yml` (typecheck + build on push)
- Batch upload script: `bash scripts/github-push-phase2.sh`

## Key Notes

- DB boolean columns (`isStandingDeal`, `isActive`, `isCorporate`) stored as integers (0/1)
- Nullable venue fields: logoUrl, contactEmail, whatsappNumber, imageUrl, description, address, cuisineOrType, contactPhone
- New routes (auth, payments) use plain `import { z } from "zod"` — NOT `"zod/v4"` (esbuild can't bundle subpath exports)
- Sessions require `SESSION_SECRET` env var (already provisioned in Replit secrets)
- Phase 3 next: loyalty points engine, deal alert subscriptions, corporate accounts, ratings flow
