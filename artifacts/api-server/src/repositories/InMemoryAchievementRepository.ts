import { randomUUID } from "node:crypto";
import type { Achievement, UserAchievement, GrantAchievementRequest } from "../models/achievement";
import { DEFAULT_ACHIEVEMENTS } from "../models/achievement";
import type { IAchievementRepository } from "./IAchievementRepository";

export class InMemoryAchievementRepository implements IAchievementRepository {
  private achievements: Map<string, Achievement> = new Map(); // key → Achievement
  private achievementsById: Map<string, Achievement> = new Map(); // id → Achievement
  private userAchievements: Map<string, UserAchievement> = new Map(); // id → UserAchievement
  private seeded = false;

  async seedDefaults(): Promise<void> {
    if (this.seeded) return;
    for (const def of DEFAULT_ACHIEVEMENTS) {
      if (!this.achievements.has(def.key)) {
        const record: Achievement = {
          id: randomUUID(),
          key: def.key,
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
          points: def.points,
          createdAt: new Date(),
        };
        this.achievements.set(record.key, record);
        this.achievementsById.set(record.id, record);
      }
    }
    this.seeded = true;
  }

  async getAll(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async findByKey(key: string): Promise<Achievement | null> {
    return this.achievements.get(key) ?? null;
  }

  async findById(id: string): Promise<Achievement | null> {
    return this.achievementsById.get(id) ?? null;
  }

  async grant(
    input: GrantAchievementRequest & { achievementId: string },
  ): Promise<{ record: UserAchievement; created: boolean }> {
    const achievement = this.achievementsById.get(input.achievementId);
    if (!achievement) throw new Error(`Achievement not found: ${input.achievementId}`);

    for (const ua of this.userAchievements.values()) {
      if (ua.userId === input.userId && ua.achievementId === input.achievementId) {
        return { record: ua, created: false };
      }
    }

    const record: UserAchievement = {
      id: randomUUID(),
      userId: input.userId,
      achievementId: input.achievementId,
      achievement,
      grantedBy: input.grantedBy,
      metadata: input.metadata ?? null,
      grantedAt: new Date(),
    };
    this.userAchievements.set(record.id, record);
    return { record, created: true };
  }

  async hasAchievement(userId: string, key: string): Promise<boolean> {
    const achievement = this.achievements.get(key);
    if (!achievement) return false;
    for (const ua of this.userAchievements.values()) {
      if (ua.userId === userId && ua.achievementId === achievement.id) return true;
    }
    return false;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter((ua) => ua.userId === userId)
      .sort((a, b) => (b.grantedAt?.getTime() ?? 0) - (a.grantedAt?.getTime() ?? 0));
  }

  async countUserAchievements(userId: string): Promise<number> {
    let count = 0;
    for (const ua of this.userAchievements.values()) {
      if (ua.userId === userId) count++;
    }
    return count;
  }

  clear(): void {
    this.achievements.clear();
    this.achievementsById.clear();
    this.userAchievements.clear();
    this.seeded = false;
  }
}
