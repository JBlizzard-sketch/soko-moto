import { pgTable, serial, text, integer, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { bookingsTable } from "./bookings";

export const mpesaTxStatusEnum = pgEnum("mpesa_tx_status", [
  "pending", "completed", "failed", "cancelled", "timeout"
]);

export const mpesaTransactionsTable = pgTable("mpesa_transactions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookingsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  phone: text("phone").notNull(),
  amount: real("amount").notNull(),
  checkoutRequestId: text("checkout_request_id").unique(),
  merchantRequestId: text("merchant_request_id"),
  mpesaReceiptNumber: text("mpesa_receipt_number"),
  resultCode: integer("result_code"),
  resultDesc: text("result_desc"),
  status: mpesaTxStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
