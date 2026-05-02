import { Router } from "express";
import { db, bookingsTable, mpesaTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { initiateStkPush, parseCallback } from "../services/mpesa";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

router.post("/mpesa/stk-push", requireAuth, async (req, res) => {
  const parsed = z.object({
    bookingId: z.number().int().positive(),
    phone: z.string().regex(/^\+?[0-9]{9,15}$/),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { bookingId, phone } = parsed.data;

  const [booking] = await db.select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  if (booking.userId !== req.session.userId) {
    res.status(403).json({ error: "Not your booking" });
    return;
  }

  if (booking.status !== "pending") {
    res.status(400).json({ error: `Booking is already ${booking.status}` });
    return;
  }

  const result = await initiateStkPush({
    phone,
    amount: booking.totalPaid,
    accountReference: booking.bookingReference,
    transactionDesc: `Soko Moto Booking ${booking.bookingReference}`,
  });

  if (!result.success) {
    res.status(502).json({ error: result.error ?? "STK Push failed" });
    return;
  }

  const [tx] = await db.insert(mpesaTransactionsTable).values({
    bookingId: booking.id,
    userId: booking.userId,
    phone,
    amount: booking.totalPaid,
    checkoutRequestId: result.checkoutRequestId,
    merchantRequestId: result.merchantRequestId,
    status: "pending",
  }).returning();

  res.json({
    message: result.devMode
      ? "DEV MODE — payment auto-confirmed, no actual charge"
      : "STK Push sent to your phone. Enter your M-Pesa PIN to complete payment.",
    checkoutRequestId: result.checkoutRequestId,
    transactionId: tx.id,
    devMode: result.devMode ?? false,
  });

  if (result.devMode) {
    await db.update(bookingsTable)
      .set({ status: "confirmed", paymentReference: result.checkoutRequestId })
      .where(eq(bookingsTable.id, booking.id));
    await db.update(mpesaTransactionsTable)
      .set({ status: "completed", mpesaReceiptNumber: `DEV${Date.now()}` })
      .where(eq(mpesaTransactionsTable.id, tx.id));
  }
});

router.post("/mpesa/callback", async (req, res) => {
  try {
    const parsed = parseCallback(req.body);
    req.log.info({ parsed }, "M-Pesa callback received");

    const [tx] = await db.select()
      .from(mpesaTransactionsTable)
      .where(eq(mpesaTransactionsTable.checkoutRequestId, parsed.checkoutRequestId));

    if (!tx) {
      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
      return;
    }

    const status = parsed.success ? "completed" : parsed.resultCode === 1032 ? "cancelled" : "failed";

    await db.update(mpesaTransactionsTable).set({
      status,
      resultCode: parsed.resultCode,
      resultDesc: parsed.resultDesc,
      mpesaReceiptNumber: parsed.mpesaReceiptNumber || null,
      updatedAt: new Date(),
    }).where(eq(mpesaTransactionsTable.id, tx.id));

    if (parsed.success && tx.bookingId) {
      await db.update(bookingsTable).set({
        status: "confirmed",
        paymentReference: parsed.mpesaReceiptNumber,
      }).where(eq(bookingsTable.id, tx.bookingId));
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    req.log.error({ err }, "M-Pesa callback error");
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

router.get("/mpesa/status/:checkoutRequestId", requireAuth, async (req, res) => {
  const [tx] = await db.select()
    .from(mpesaTransactionsTable)
    .where(eq(mpesaTransactionsTable.checkoutRequestId, req.params.checkoutRequestId));

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if (tx.userId !== req.session.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json({ status: tx.status, mpesaReceiptNumber: tx.mpesaReceiptNumber });
});

export default router;
