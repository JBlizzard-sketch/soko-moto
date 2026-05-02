import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, dealsTable, venuesTable } from "@workspace/db";
import {
  ListDealsQueryParams,
  ListDealsResponse,
  CreateDealBody,
  GetDealParams,
  GetDealResponse,
  UpdateDealParams,
  UpdateDealBody,
  UpdateDealResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDealWithSlots(deal: typeof dealsTable.$inferSelect) {
  return {
    ...deal,
    availableSlots: deal.totalSlots - deal.bookedSlots,
    isStandingDeal: deal.isStandingDeal === 1,
  };
}

router.get("/deals", async (req, res): Promise<void> => {
  const query = ListDealsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db.select().from(dealsTable).$dynamic();
  const conditions = [];
  if (query.data.status) conditions.push(eq(dealsTable.status, query.data.status));
  if (query.data.category) conditions.push(eq(dealsTable.category, query.data.category));
  if (query.data.venueId) conditions.push(eq(dealsTable.venueId, query.data.venueId));
  if (conditions.length) q = q.where(and(...conditions));

  const deals = await q;
  res.json(ListDealsResponse.parse(deals.map(toDealWithSlots)));
});

router.post("/deals", async (req, res): Promise<void> => {
  const parsed = CreateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [deal] = await db.insert(dealsTable).values({
    ...parsed.data,
    bookedSlots: 0,
    status: "live",
  }).returning();

  res.status(201).json(GetDealResponse.parse(toDealWithSlots(deal)));
});

router.get("/deals/:id", async (req, res): Promise<void> => {
  const params = GetDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, params.data.id));
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  res.json(GetDealResponse.parse(toDealWithSlots(deal)));
});

router.patch("/deals/:id", async (req, res): Promise<void> => {
  const params = UpdateDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [deal] = await db
    .update(dealsTable)
    .set(parsed.data)
    .where(eq(dealsTable.id, params.data.id))
    .returning();

  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  res.json(UpdateDealResponse.parse(toDealWithSlots(deal)));
});

export default router;
