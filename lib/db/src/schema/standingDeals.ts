import { pgTable, serial, integer, text, timestamp, pgEnum, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { relations } from "drizzle-orm";

export const standingDealCategoryEnum = pgEnum("standing_deal_category", ["restaurant", "spa", "fitness", "bar", "experience"]);
export const standingDealTypeEnum = pgEnum("standing_deal_type", ["lunch", "dinner", "spa", "wellness", "fitness", "drinks", "experience"]);

export const standingDealsTable = pgTable("standing_deals", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id),
  title: text("title").notNull(),
  discountPercent: integer("discount_percent").notNull(),
  dealPrice: real("deal_price").notNull(),
  totalSlots: integer("total_slots").notNull(),
  category: standingDealCategoryEnum("category").notNull(),
  dealType: standingDealTypeEnum("deal_type").notNull(),
  daysOfWeek: json("days_of_week").$type<number[]>().notNull().default([]),
  startHour: integer("start_hour").notNull(),
  endHour: integer("end_hour").notNull(),
  activationThreshold: integer("activation_threshold").notNull(),
  triggerHour: integer("trigger_hour").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const standingDealsRelations = relations(standingDealsTable, ({ one }) => ({
  venue: one(venuesTable, {
    fields: [standingDealsTable.venueId],
    references: [venuesTable.id],
  }),
}));

export const insertStandingDealSchema = createInsertSchema(standingDealsTable).omit({ id: true, createdAt: true });
export type InsertStandingDeal = z.infer<typeof insertStandingDealSchema>;
export type StandingDeal = typeof standingDealsTable.$inferSelect;
