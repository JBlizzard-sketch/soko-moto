# Soko Moto

Flash deal platform for upscale Nairobi restaurants, spas, and wellness venues targeting the dead-hours problem. Venues post same-day deals; subscribers book in under 60 seconds. Revenue via commission.

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
- `users` — platform users with loyalty tiers
- `deals` — flash deals (status: draft/live/filling/sold_out/expired/completed)
- `bookings` — bookings with reference codes
- `ratings` — venue reviews by users
- `standing_deals` — recurring deal templates

Migrations via Drizzle: `pnpm --filter @workspace/db run migrate`
Seed: handled via `executeSql` in code_execution sandbox

## API Routes

All routes prefixed under `/api/`:
- `GET/POST /venues` · `GET/PATCH /venues/:id` · `GET /venues/:id/stats`
- `GET/POST /deals` · `GET/PATCH /deals/:id`
- `GET/POST /bookings` · `GET/PATCH /bookings/:id`
- `GET/POST /users` · `GET/PATCH /users/:id`
- `GET/POST /ratings`
- `GET/POST/PATCH/DELETE /standing-deals`
- `GET /feed/live` · `GET /feed/trending` · `GET /feed/summary` · `GET /feed/activity`

## Frontend Pages

- `/` — Home: Trending + Live feed with category/neighborhood filters
- `/deals/:id` — Deal detail + M-Pesa booking flow
- `/venues` — Curated venues list with filters
- `/venues/:id` — Venue detail + stats + live deals + ratings
- `/bookings` — User bookings with QR reference codes
- `/admin` — Admin dashboard with platform stats
- `/admin/venues` — Approve/suspend venue applications
- `/admin/deals` — Monitor and manage all deals

## Codegen

After editing `lib/api-spec/openapi.yaml`, always run:
```
pnpm --filter @workspace/api-spec run codegen
```
Then rebuild the API server:
```
cd artifacts/api-server && pnpm run build
```

**Critical:** `lib/api-spec/orval.config.ts` has `indexFiles: false` in zod output. Do NOT remove this — it prevents duplicate export errors. `lib/api-zod/src/index.ts` must only export from `./generated/api`.

## Design System

- Colors: Forest green primary (`hsl(130, 30%, 28%)`), burnt orange accent (`hsl(15, 65%, 50%)`)
- Fonts: Playfair Display (serif headings) + Inter (body)
- Components: shadcn/ui, Framer Motion animations, Lucide icons
- Price in KES throughout

## Key Notes

- DB boolean columns (`isStandingDeal`, `isActive`, `isCorporate`) stored as integers (0/1)
- Nullable venue fields: logoUrl, contactEmail, whatsappNumber, imageUrl, description, address, cuisineOrType, contactPhone
- Sessions use `SESSION_SECRET` env var
- User ID hardcoded to 1 for booking (auth not yet implemented)
