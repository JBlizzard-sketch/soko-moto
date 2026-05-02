import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, dealsTable, venuesTable, bookingsTable } from "@workspace/db";
import {
  GetLiveFeedQueryParams,
  GetLiveFeedResponse,
  GetTrendingDealsResponse,
  GetFeedSummaryResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDealWithVenue(deal: typeof dealsTable.$inferSelect, venue: typeof venuesTable.$inferSelect) {
  return {
    ...deal,
    availableSlots: deal.totalSlots - deal.bookedSlots,
    isStandingDeal: deal.isStandingDeal === 1,
    venue,
  };
}

router.get("/feed/live", async (req, res): Promise<void> => {
  const query = GetLiveFeedQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const liveDeals = await db
    .select()
    .from(dealsTable)
    .where(eq(dealsTable.status, "live"))
    .orderBy(dealsTable.validUntil);

  const enriched = await Promise.all(
    liveDeals
      .filter((d) => {
        if (query.data.category && d.category !== query.data.category) return false;
        return true;
      })
      .map(async (deal) => {
        const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, deal.venueId));
        if (!venue) return null;
        if (query.data.neighborhood && venue.neighborhood !== query.data.neighborhood) return null;
        return toDealWithVenue(deal, venue);
      })
  );

  res.json(GetLiveFeedResponse.parse(enriched.filter(Boolean)));
});

router.get("/feed/trending", async (_req, res): Promise<void> => {
  // Trending = live deals with highest fill rate (bookedSlots/totalSlots)
  const liveDeals = await db
    .select()
    .from(dealsTable)
    .where(eq(dealsTable.status, "live"));

  const sorted = liveDeals
    .sort((a, b) => (b.bookedSlots / b.totalSlots) - (a.bookedSlots / a.totalSlots))
    .slice(0, 6);

  const enriched = await Promise.all(
    sorted.map(async (deal) => {
      const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, deal.venueId));
      if (!venue) return null;
      return toDealWithVenue(deal, venue);
    })
  );

  res.json(GetTrendingDealsResponse.parse(enriched.filter(Boolean)));
});

router.get("/feed/summary", async (_req, res): Promise<void> => {
  const allVenues = await db.select().from(venuesTable);
  const approvedVenues = allVenues.filter((v) => v.status === "approved");

  const allDeals = await db.select().from(dealsTable);
  const liveDeals = allDeals.filter((d) => d.status === "live" || d.status === "filling");

  const allBookings = await db.select().from(bookingsTable);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingsToday = allBookings.filter((b) => new Date(b.createdAt) >= today).length;

  const completedDeals = allDeals.filter((d) => d.status === "completed" || d.status === "sold_out");
  const totalSlots = completedDeals.reduce((s, d) => s + d.totalSlots, 0);
  const bookedSlots = completedDeals.reduce((s, d) => s + d.bookedSlots, 0);
  const averageFillRate = totalSlots > 0 ? bookedSlots / totalSlots : 0;

  // Top neighborhood
  const neighborhoodCounts: Record<string, number> = {};
  for (const v of approvedVenues) {
    neighborhoodCounts[v.neighborhood] = (neighborhoodCounts[v.neighborhood] || 0) + 1;
  }
  const topNeighborhood = Object.entries(neighborhoodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Westlands";

  // Top category
  const categoryCounts: Record<string, number> = {};
  for (const d of liveDeals) {
    categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
  }
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "restaurant";

  const dealsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));

  const summary = {
    liveDealsCount: liveDeals.length,
    totalVenues: approvedVenues.length,
    bookingsToday,
    totalBookingsAllTime: allBookings.length,
    averageFillRate,
    topNeighborhood,
    topCategory,
    dealsByCategory,
  };

  res.json(GetFeedSummaryResponse.parse(summary));
});

router.get("/feed/activity", async (_req, res): Promise<void> => {
  const recentBookings = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(20);

  const activities = await Promise.all(
    recentBookings.map(async (b, i) => {
      const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, b.dealId));
      const [venue] = deal ? await db.select().from(venuesTable).where(eq(venuesTable.id, deal.venueId)) : [null];
      return {
        id: i + 1,
        type: "booking_confirmed" as const,
        message: `${venue?.neighborhood ?? "Nairobi"} booking confirmed`,
        venueName: venue?.name ?? "A venue",
        dealTitle: deal?.title ?? null,
        neighborhood: venue?.neighborhood ?? "Nairobi",
        timestamp: b.createdAt,
      };
    })
  );

  res.json(GetRecentActivityResponse.parse(activities));
});

export default router;
