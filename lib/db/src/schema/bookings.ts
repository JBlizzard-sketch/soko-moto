import { pgTable, serial, integer, timestamp, pgEnum, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { dealsTable } from "./deals";
import { relations } from "drizzle-orm";

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "completed", "cancelled", "no_show"]);
export const paymentMethodEnum = pgEnum("payment_method", ["mpesa", "card", "corporate"]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  dealId: integer("deal_id").notNull().references(() => dealsTable.id),
  covers: integer("covers").notNull().default(1),
  totalPaid: real("total_paid").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  bookingReference: text("booking_reference").notNull().unique(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [bookingsTable.userId],
    references: [usersTable.id],
  }),
  deal: one(dealsTable, {
    fields: [bookingsTable.dealId],
    references: [dealsTable.id],
  }),
}));

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
