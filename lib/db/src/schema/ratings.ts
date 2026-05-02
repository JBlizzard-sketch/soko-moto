import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { venuesTable } from "./venues";
import { bookingsTable } from "./bookings";
import { relations } from "drizzle-orm";

export const ratingsTable = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id),
  bookingId: integer("booking_id").notNull().references(() => bookingsTable.id),
  score: integer("score").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratingsRelations = relations(ratingsTable, ({ one }) => ({
  user: one(usersTable, { fields: [ratingsTable.userId], references: [usersTable.id] }),
  venue: one(venuesTable, { fields: [ratingsTable.venueId], references: [venuesTable.id] }),
  booking: one(bookingsTable, { fields: [ratingsTable.bookingId], references: [bookingsTable.id] }),
}));

export const insertRatingSchema = createInsertSchema(ratingsTable).omit({ id: true, createdAt: true });
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;
