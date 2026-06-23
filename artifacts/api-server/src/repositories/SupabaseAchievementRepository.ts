import { eq, and } from "drizzle-orm";
import { count as drizzleCount } from "drizzle-orm";
import type { Achievement, UserAchievement, GrantAchievementRequest } from "../models/achievement";
import { DEFAULT_ACHIEVEMENTS } from "../models/achievement";
import type { IAchievementRepository } from "./IAchievementRepository";
import { db } from "@workspace/db";
import { achievementsTable, userAchievementsTable } from "@workspace/db/schema";

function toAchievementModel(row: typeof achievementsTable.$inferSelect): Achievement {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category as Achievement["category"],
    points: row.points,
    createdAt: row.createdAt,
  };
}

function toUserAchievementModel(
  row: typeof userAchievementsTable.$inferSelect,
  achievement: Achievement,
): UserAchievement {
  return {
    id: row.id,
    userId: row.userId,
    achievementId: row.achievementId,
    achievement,
    grantedBy: row.grantedBy,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    grantedAt: row.grantedAt,
  };
}

export class SupabaseAchievementRepository implements IAchievementRepository {
  async seedDefaults(): Promise<void> {
    for (const def of DEFAULT_ACHIEVEMENTS) {
      await db
        .insert(achievementsTable)
        .values({
          key: def.key,
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
          points: def.points,
        })
        .onConflictDoNothing();
    }
  }

  async getAll(): Promise<Achievement[]> {
    const rows = await db.select().from(achievementsTable);
    return rows.map(toAchievementModel);
  }

  async findByKey(key: string): Promise<Achievement | null> {
    const rows = await db
      .select()
      .from(achievementsTable)
      .where(eq(achievementsTable.key, key))
      .limit(1);
    return rows[0] ? toAchievementModel(rows[0]) : null;
  }

  async findById(id: string): Promise<Achievement | null> {
    const rows = await db
      .select()
      .from(achievementsTable)
      .where(eq(achievementsTable.id, id))
      .limit(1);
    return rows[0] ? toAchievementModel(rows[0]) : null;
  }

  async grant(
    input: GrantAchievementRequest & { achievementId: string },
  ): Promise<{ record: UserAchievement; created: boolean }> {
    const achievement = await this.findById(input.achievementId);
    if (!achievement) throw new Error(`Achievement not found: ${input.achievementId}`);

    const existing = await db
      .select()
      .from(userAchievementsTable)
      .where(
        and(
          eq(userAchievementsTable.userId, input.userId),
          eq(userAchievementsTable.achievementId, input.achievementId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      return {
        record: toUserAchievementModel(existing[0], achievement),
        created: false,
      };
    }

    const inserted = await db
      .insert(userAchievementsTable)
      .values({
        userId: input.userId,
        achievementId: input.achievementId,
        grantedBy: input.grantedBy,
        metadata: input.metadata ?? null,
      })
      .returning();

    return {
      record: toUserAchievementModel(inserted[0]!, achievement),
      created: true,
    };
  }

  async hasAchievement(userId: string, key: string): Promise<boolean> {
    const achievement = await this.findByKey(key);
    if (!achievement) return false;
    const rows = await db
      .select({ id: userAchievementsTable.id })
      .from(userAchievementsTable)
      .where(
        and(
          eq(userAchievementsTable.userId, userId),
          eq(userAchievementsTable.achievementId, achievement.id),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const rows = await db
      .select()
      .from(userAchievementsTable)
      .where(eq(userAchievementsTable.userId, userId))
      .orderBy(userAchievementsTable.grantedAt);

    const result: UserAchievement[] = [];
    for (const row of rows) {
      const achievement = await this.findById(row.achievementId);
      if (achievement) result.push(toUserAchievementModel(row, achievement));
    }
    return result;
  }

  async countUserAchievements(userId: string): Promise<number> {
    const result = await db
      .select({ value: drizzleCount() })
      .from(userAchievementsTable)
      .where(eq(userAchievementsTable.userId, userId));
    return result[0]?.value ?? 0;
  }
}
