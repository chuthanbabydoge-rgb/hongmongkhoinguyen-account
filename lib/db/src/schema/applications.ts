import { pgTable, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationsTable = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  clientId: text("client_id").notNull().unique(),
  clientSecret: text("client_secret").notNull(),
  permissions: jsonb("permissions").notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const accessTokensTable = pgTable("access_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  applicationId: uuid("application_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
});

export const insertAccessTokenSchema = createInsertSchema(accessTokensTable).omit({
  id: true,
  createdAt: true,
});

export const selectApplicationSchema = createSelectSchema(applicationsTable);
export const selectAccessTokenSchema = createSelectSchema(accessTokensTable);

export type ApplicationRow = typeof applicationsTable.$inferSelect;
export type AccessTokenRow = typeof accessTokensTable.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertAccessToken = z.infer<typeof insertAccessTokenSchema>;
