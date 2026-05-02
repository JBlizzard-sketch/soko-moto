import { pgTable, serial, text, integer, timestamp, pgEnum, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loyaltyTierEnum = pgEnum("loyalty_tier", ["bronze", "silver", "gold"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  neighborhood: text("neighborhood"),
  loyaltyTier: loyaltyTierEnum("loyalty_tier").notNull().default("bronze"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  totalBookings: integer("total_bookings").notNull().default(0),
  totalSpend: real("total_spend").notNull().default(0),
  preferredCategories: json("preferred_categories").$type<string[]>().default([]),
  isCorporate: integer("is_corporate").notNull().default(0),
  corporateCompany: text("corporate_company"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
