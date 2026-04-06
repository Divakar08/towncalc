import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Mortgage calculation inputs schema
export const mortgageInputsSchema = z.object({
  propertyValue: z.number().min(0),
  annualRate: z.number().min(0).max(1), // Decimal
  strataMonthly: z.number().min(0),
  propertyTaxMonthly: z.number().min(0),
  homeInsuranceMonthly: z.number().min(0),
  postTaxIncomeMonthly: z.number().min(0),
  householdSpendingMonthly: z.number().min(0),
});
