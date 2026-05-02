import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, bookingsTable, dealsTable, usersTable, venuesTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
} from "@workspace/api-zod";
import { randomBytes } from "crypto";
import { sendBookingConfirmation } from "../services/whatsapp";

const router: IRouter = Router();

function generateRef(): string {
  return "SM-" + randomBytes(4).toString("hex").toUpperCase();
}

router.get("/bookings", async (req, res): Promise<void> => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db.select().from(bookingsTable).$dynamic();
  const conditions = [];
  if (query.data.userId) conditions.push(eq(bookingsTable.userId, query.data.userId));
  if (query.data.dealId) conditions.push(eq(bookingsTable.dealId, query.data.dealId));
  if (query.data.status) conditions.push(eq(bookingsTable.status, query.data.status));
  if (conditions.length) q = q.where(and(...conditions));

  const bookings = await q;

  // Attach deal to each booking
  const enriched = await Promise.all(
    bookings.map(async (b) => {
      const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, b.dealId));
      return {
        ...b,
        deal: deal ? { ...deal, availableSlots: deal.totalSlots - deal.bookedSlots, isStandingDeal: deal.isStandingDeal === 1 } : null,
      };
    })
  );

  res.json(ListBookingsResponse.parse(enriched));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check deal availability
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, parsed.data.dealId));
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  const available = deal.totalSlots - deal.bookedSlots;
  if (available < parsed.data.covers) {
    res.status(409).json({ error: "Not enough slots available" });
    return;
  }

  const totalPaid = deal.dealPrice * parsed.data.covers;

  const [booking] = await db.insert(bookingsTable).values({
    ...parsed.data,
    totalPaid,
    status: "confirmed",
    bookingReference: generateRef(),
  }).returning();

  // Update booked slots
  const newBooked = deal.bookedSlots + parsed.data.covers;
  const newStatus = newBooked >= deal.totalSlots ? "sold_out" : newBooked >= deal.totalSlots * 0.7 ? "filling" : "live";
  await db.update(dealsTable).set({ bookedSlots: newBooked, status: newStatus }).where(eq(dealsTable.id, deal.id));

  // Update user stats
  await db
    .update(usersTable)
    .set({
      totalBookings: db.$count(bookingsTable, eq(bookingsTable.userId, parsed.data.userId)),
    })
    .where(eq(usersTable.id, parsed.data.userId))
    .catch(() => {});

  const [dealFull] = await db.select().from(dealsTable).where(eq(dealsTable.id, booking.dealId));

  res.status(201).json(GetBookingResponse.parse({
    ...booking,
    deal: dealFull ? { ...dealFull, availableSlots: dealFull.totalSlots - dealFull.bookedSlots, isStandingDeal: dealFull.isStandingDeal === 1 } : null,
  }));

  // Fire-and-forget: send WhatsApp confirmation
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));
    const [venue] = dealFull?.venueId
      ? await db.select().from(venuesTable).where(eq(venuesTable.id, dealFull.venueId))
      : [null];
    if (user && dealFull && venue) {
      sendBookingConfirmation({
        phone: user.phone,
        guestName: user.name,
        venueName: venue.name,
        dealTitle: dealFull.title,
        bookingReference: booking.bookingReference,
        covers: booking.covers,
        totalPaid: booking.totalPaid,
        validFrom: dealFull.validFrom,
      }).catch(() => {});
    }
  } catch {}
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, booking.dealId));
  res.json(GetBookingResponse.parse({
    ...booking,
    deal: deal ? { ...deal, availableSlots: deal.totalSlots - deal.bookedSlots, isStandingDeal: deal.isStandingDeal === 1 } : null,
  }));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, booking.dealId));
  res.json(UpdateBookingResponse.parse({
    ...booking,
    deal: deal ? { ...deal, availableSlots: deal.totalSlots - deal.bookedSlots, isStandingDeal: deal.isStandingDeal === 1 } : null,
  }));
});

export default router;
