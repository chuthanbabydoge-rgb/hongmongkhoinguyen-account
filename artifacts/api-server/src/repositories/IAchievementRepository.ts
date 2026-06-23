import type { Achievement, UserAchievement, GrantAchievementRequest } from "../models/achievement";

export interface IAchievementRepository {
  /** Seed all DEFAULT_ACHIEVEMENTS — skips any that already exist (idempotent). */
  seedDefaults(): Promise<void>;

  /** Return every achievement definition. */
  getAll(): Promise<Achievement[]>;

  /** Find an achievement definition by its unique key (e.g. "FIRST_LOGIN"). */
  findByKey(key: string): Promise<Achievement | null>;

  /** Find an achievement definition by its UUID. */
  findById(id: string): Promise<Achievement | null>;

  /**
   * Grant an achievement to a user.
   * If the (userId, achievementId) pair already exists returns the existing record.
   * Returns { record, created } where created=false on duplicate.
   */
  grant(
    input: GrantAchievementRequest & { achievementId: string },
  ): Promise<{ record: UserAchievement; created: boolean }>;

  /** Check if a user already has a specific achievement (by achievement key). */
  hasAchievement(userId: string, key: string): Promise<boolean>;

  /** All achievements earned by a user, newest first. */
  getUserAchievements(userId: string): Promise<UserAchievement[]>;

  /** Total number of achievements earned by a user. */
  countUserAchievements(userId: string): Promise<number>;
}
