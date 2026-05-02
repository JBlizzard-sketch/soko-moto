import { Router, type IRouter } from "express";
import { eq, avg, sum, count, and } from "drizzle-orm";
import { db, venuesTable, dealsTable, bookingsTable, ratingsTable } from "@workspace/db";
import {
  ListVenuesQueryParams,
  ListVenuesResponse,
  CreateVenueBody,
  GetVenueParams,
  GetVenueResponse,
  UpdateVenueParams,
  UpdateVenueBody,
  UpdateVenueResponse,
  GetVenueStatsParams,
  GetVenueStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/venues", async (req, res): Promise<void> => {
  const query = ListVenuesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db.select().from(venuesTable).$dynamic();
  const conditions = [];
  if (query.data.category) conditions.push(eq(venuesTable.category, query.data.category));
  if (query.data.neighborhood) conditions.push(eq(venuesTable.neighborhood, query.data.neighborhood));
  if (query.data.status) conditions.push(eq(venuesTable.status, query.data.status));
  if (conditions.length) q = q.where(and(...conditions));

  const venues = await q;
  res.json(ListVenuesResponse.parse(venues));
});

router.post("/venues", async (req, res): Promise<void> => {
  const parsed = CreateVenueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [venue] = await db.insert(venuesTable).values(parsed.data).returning();
  res.status(201).json(GetVenueResponse.parse(venue));
});

router.get("/venues/:id", async (req, res): Promise<void> => {
  const params = GetVenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, params.data.id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json(GetVenueResponse.parse(venue));
});

router.patch("/venues/:id", async (req, res): Promise<void> => {
  const params = UpdateVenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateVenueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [venue] = await db
    .update(venuesTable)
    .set(parsed.data)
    .where(eq(venuesTable.id, params.data.id))
    .returning();

  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json(UpdateVenueResponse.parse(venue));
});

router.get("/venues/:id/stats", async (req, res): Promise<void> => {
  const params = GetVenueStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const venueId = params.data.id;

  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const deals = await db.select().from(dealsTable).where(eq(dealsTable.venueId, venueId));
  const dealIds = deals.map((d) => d.id);

  let totalBookings = 0;
  let totalRevenue = 0;
  const bookingsByDayMap: Record<string, number> = {};
  const bookingsByHourMap: Record<number, number> = {};

  if (dealIds.length > 0) {
    const allBookings = await db.select().from(bookingsTable).where(
      eq(bookingsTable.dealId, dealIds[0])
    );
    // Simple approach: fetch all bookings for venue deals
    for (const deal of deals) {
      const bks = await db.select().from(bookingsTable).where(eq(bookingsTable.dealId, deal.id));
      for (const b of bks) {
        totalBookings++;
        totalRevenue += b.totalPaid;
        const day = new Date(b.createdAt).toLocaleDateString("en-US", { weekday: "short" });
        bookingsByDayMap[day] = (bookingsByDayMap[day] || 0) + 1;
        const hour = new Date(b.createdAt).getHours();
        bookingsByHourMap[hour] = (bookingsByHourMap[hour] || 0) + 1;
      }
    }
  }

  const completedDeals = deals.filter((d) => d.status === "completed" || d.status === "sold_out");
  const totalSlots = completedDeals.reduce((s, d) => s + d.totalSlots, 0);
  const bookedSlots = completedDeals.reduce((s, d) => s + d.bookedSlots, 0);
  const averageFillRate = totalSlots > 0 ? bookedSlots / totalSlots : 0;

  const typeCounts: Record<string, number> = {};
  for (const d of deals) typeCounts[d.dealType] = (typeCounts[d.dealType] || 0) + 1;
  const topDealType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "lunch";

  const stats = {
    venueId,
    totalDeals: deals.length,
    totalBookings,
    totalRevenue,
    averageFillRate,
    averageRating: venue.averageRating ?? 0,
    topDealType,
    revenueRecovered: totalRevenue,
    bookingsByDayOfWeek: Object.entries(bookingsByDayMap).map(([day, count]) => ({ day, count })),
    bookingsByHour: Object.entries(bookingsByHourMap).map(([hour, count]) => ({ hour: Number(hour), count })),
  };

  res.json(GetVenueStatsResponse.parse(stats));
});

export default router;
