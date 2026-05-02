import { pgTable, serial, text, integer, timestamp, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { relations } from "drizzle-orm";

export const dealStatusEnum = pgEnum("deal_status", ["draft", "live", "filling", "sold_out", "expired", "completed"]);
export const dealTypeEnum = pgEnum("deal_type", ["lunch", "dinner", "spa", "wellness", "fitness", "drinks", "experience"]);
export const dealCategoryEnum = pgEnum("deal_category", ["restaurant", "spa", "fitness", "bar", "experience"]);

export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id),
  title: text("title").notNull(),
  description: text("description"),
  discountPercent: integer("discount_percent").notNull(),
  originalPrice: real("original_price"),
  dealPrice: real("deal_price").notNull(),
  totalSlots: integer("total_slots").notNull(),
  bookedSlots: integer("booked_slots").notNull().default(0),
  status: dealStatusEnum("status").notNull().default("draft"),
  category: dealCategoryEnum("category").notNull(),
  dealType: dealTypeEnum("deal_type").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isStandingDeal: integer("is_standing_deal").notNull().default(0),
  standingDealId: integer("standing_deal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dealsRelations = relations(dealsTable, ({ one }) => ({
  venue: one(venuesTable, {
    fields: [dealsTable.venueId],
    references: [venuesTable.id],
  }),
}));

export const insertDealSchema = createInsertSchema(dealsTable).omit({ id: true, createdAt: true, bookedSlots: true });
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof dealsTable.$inferSelect;
