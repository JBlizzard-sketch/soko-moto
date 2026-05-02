import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, standingDealsTable } from "@workspace/db";
import {
  ListStandingDealsQueryParams,
  ListStandingDealsResponse,
  CreateStandingDealBody,
  UpdateStandingDealParams,
  UpdateStandingDealBody,
  UpdateStandingDealResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toStandingDeal(sd: typeof standingDealsTable.$inferSelect) {
  return {
    ...sd,
    isActive: sd.isActive === 1,
    daysOfWeek: (sd.daysOfWeek as number[]) ?? [],
  };
}

router.get("/standing-deals", async (req, res): Promise<void> => {
  const query = ListStandingDealsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db.select().from(standingDealsTable).$dynamic();
  if (query.data.venueId) q = q.where(eq(standingDealsTable.venueId, query.data.venueId));

  const deals = await q;
  res.json(ListStandingDealsResponse.parse(deals.map(toStandingDeal)));
});

router.post("/standing-deals", async (req, res): Promise<void> => {
  const parsed = CreateStandingDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [deal] = await db.insert(standingDealsTable).values({
    ...parsed.data,
    isActive: 1,
  }).returning();

  res.status(201).json(toStandingDeal(deal));
});

router.patch("/standing-deals/:id", async (req, res): Promise<void> => {
  const params = UpdateStandingDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStandingDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (typeof parsed.data.isActive === "boolean") {
    updateData.isActive = parsed.data.isActive ? 1 : 0;
  }

  const [deal] = await db
    .update(standingDealsTable)
    .set(updateData)
    .where(eq(standingDealsTable.id, params.data.id))
    .returning();

  if (!deal) {
    res.status(404).json({ error: "Standing deal not found" });
    return;
  }
  res.json(UpdateStandingDealResponse.parse(toStandingDeal(deal)));
});

router.delete("/standing-deals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(standingDealsTable).where(eq(standingDealsTable.id, id));
  res.sendStatus(204);
});

export default router;
