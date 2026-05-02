import { pgTable, serial, text, integer, timestamp, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const venueCategoryEnum = pgEnum("venue_category", ["restaurant", "spa", "fitness", "bar", "experience"]);
export const venuePriceRangeEnum = pgEnum("venue_price_range", ["budget", "mid", "upscale", "luxury"]);
export const venueStatusEnum = pgEnum("venue_status", ["pending", "approved", "suspended"]);

export const venuesTable = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: venueCategoryEnum("category").notNull(),
  neighborhood: text("neighborhood").notNull(),
  address: text("address"),
  imageUrl: text("image_url"),
  logoUrl: text("logo_url"),
  priceRange: venuePriceRangeEnum("price_range").notNull(),
  cuisineOrType: text("cuisine_or_type"),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  status: venueStatusEnum("status").notNull().default("pending"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  whatsappNumber: text("whatsapp_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVenueSchema = createInsertSchema(venuesTable).omit({ id: true, createdAt: true });
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venuesTable.$inferSelect;
