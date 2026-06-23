import { pgTable, uuid, text, integer, jsonb, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const achievementsTable = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userAchievementsTable = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    achievementId: uuid("achievement_id").notNull(),
    grantedBy: text("granted_by").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("user_achievement_unique").on(table.userId, table.achievementId),
  ],
);

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievementsTable).omit({
  id: true,
  grantedAt: true,
});

export const selectAchievementSchema = createSelectSchema(achievementsTable);
export const selectUserAchievementSchema = createSelectSchema(userAchievementsTable);

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type AchievementRow = typeof achievementsTable.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievementRow = typeof userAchievementsTable.$inferSelect;
