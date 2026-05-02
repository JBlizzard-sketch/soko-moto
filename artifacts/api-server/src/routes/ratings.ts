import { Router, type IRouter } from "express";
import { eq, and, avg } from "drizzle-orm";
import { db, ratingsTable, venuesTable } from "@workspace/db";
import {
  ListRatingsQueryParams,
  ListRatingsResponse,
  CreateRatingBody,
  GetRatingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ratings", async (req, res): Promise<void> => {
  const query = ListRatingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db.select().from(ratingsTable).$dynamic();
  const conditions = [];
  if (query.data.venueId) conditions.push(eq(ratingsTable.venueId, query.data.venueId));
  if (query.data.userId) conditions.push(eq(ratingsTable.userId, query.data.userId));
  if (conditions.length) q = q.where(and(...conditions));

  const ratings = await q;
  res.json(ListRatingsResponse.parse(ratings));
});

router.post("/ratings", async (req, res): Promise<void> => {
  const parsed = CreateRatingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rating] = await db.insert(ratingsTable).values(parsed.data).returning();

  // Update venue average rating
  const allRatings = await db.select().from(ratingsTable).where(eq(ratingsTable.venueId, parsed.data.venueId));
  const avgScore = allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length;
  await db.update(venuesTable).set({
    averageRating: avgScore,
    totalRatings: allRatings.length,
  }).where(eq(venuesTable.id, parsed.data.venueId));

  res.status(201).json(rating);
});

export default router;
