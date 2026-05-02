import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requestOtp, verifyOtp } from "../services/otp";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const phoneSchema = z.string().regex(/^\+?[0-9]{9,15}$/, "Invalid phone number");

router.post("/request-otp", async (req, res) => {
  const parsed = z.object({ phone: phoneSchema }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  const { phone } = parsed.data;
  const result = await requestOtp(phone);

  res.json({
    message: "OTP sent",
    devMode: result.devMode,
    devHint: result.devMode ? "Use code 123456 in development" : undefined,
  });
});

router.post("/verify-otp", async (req, res) => {
  const parsed = z.object({
    phone: phoneSchema,
    code: z.string().length(6),
    name: z.string().min(2).optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { phone, code, name } = parsed.data;
  const valid = await verifyOtp(phone, code);

  if (!valid) {
    res.status(401).json({ error: "Invalid or expired OTP" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));

  if (!user) {
    const [created] = await db.insert(usersTable)
      .values({ name: name ?? phone, phone })
      .returning();
    user = created;
  } else if (name && user.name === user.phone) {
    const [updated] = await db.update(usersTable)
      .set({ name })
      .where(eq(usersTable.id, user.id))
      .returning();
    user = updated;
  }

  req.session.userId = user.id;
  req.session.phone = user.phone;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      loyaltyTier: user.loyaltyTier,
      loyaltyPoints: user.loyaltyPoints,
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      loyaltyTier: user.loyaltyTier,
      loyaltyPoints: user.loyaltyPoints,
      totalBookings: user.totalBookings,
      neighborhood: user.neighborhood,
    },
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {});
  res.json({ message: "Logged out" });
});

export default router;
