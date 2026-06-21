import { UserAchievement } from "../types/achievement";

const ACHIEVEMENTS_KEY = "universe_achievements";

export const achievementStore = {
  getAll(): UserAchievement[] {
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  setAll(achievements: UserAchievement[]) {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  },

  getForUser(userId: string): UserAchievement[] {
    return this.getAll().filter((a) => a.userId === userId);
  },

  upsert(achievement: UserAchievement) {
    const all = this.getAll();
    const idx = all.findIndex(
      (a) =>
        a.userId === achievement.userId &&
        a.achievementId === achievement.achievementId
    );
    if (idx === -1) {
      this.setAll([...all, achievement]);
    } else {
      all[idx] = achievement;
      this.setAll(all);
    }
  },

  clear() {
    localStorage.removeItem(ACHIEVEMENTS_KEY);
  },
};
