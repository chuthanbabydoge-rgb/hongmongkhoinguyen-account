import { UserAchievement } from "../types/achievement";
import { achievementStore } from "../store/achievementStore";
import {
  allAchievements,
  initialUserAchievements,
} from "../mock/achievementData";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function getStoredUserAchievements(): UserAchievement[] {
  const stored = achievementStore.getAll();
  if (stored.length > 0) return stored;
  achievementStore.setAll(initialUserAchievements);
  return initialUserAchievements;
}

// SUPABASE: Replace with supabase.from('achievements').select('*')
export async function apiGetAllAchievements() {
  await delay(rand(200, 400));
  return allAchievements;
}

// SUPABASE: Replace with supabase.from('user_achievements').select('*').eq('userId', userId)
export async function apiGetUserAchievements(
  userId: string
): Promise<UserAchievement[]> {
  await delay(rand(300, 500));
  const all = getStoredUserAchievements();
  const userEntries = all.filter((a) => a.userId === userId);
  if (userEntries.length > 0) return userEntries;

  // Seed defaults for new users
  const defaults = allAchievements.map((a) => ({
    achievementId: a.id,
    userId,
    progress: 0,
    isUnlocked: false,
  }));
  const existing = all.filter((a) => a.userId !== userId);
  achievementStore.setAll([...existing, ...defaults]);
  return defaults;
}

// SUPABASE: Replace with supabase.from('user_achievements').upsert({ userId, achievementId, isUnlocked, unlockedAt })
export async function apiUnlockAchievement(
  userId: string,
  achievementId: string
): Promise<UserAchievement> {
  await delay(rand(300, 600));
  const all = getStoredUserAchievements();
  const achievement = allAchievements.find((a) => a.id === achievementId);
  if (!achievement) throw new Error("Achievement not found");

  const updated: UserAchievement = {
    achievementId,
    userId,
    progress: achievement.maxProgress,
    isUnlocked: true,
    unlockedAt: new Date().toISOString(),
  };
  achievementStore.upsert(updated);
  return updated;
}

// SUPABASE: Replace with supabase.from('user_achievements').update({ progress }).eq('userId', userId).eq('achievementId', achievementId)
export async function apiUpdateProgress(
  userId: string,
  achievementId: string,
  progress: number
): Promise<UserAchievement> {
  await delay(rand(200, 400));
  const achievement = allAchievements.find((a) => a.id === achievementId);
  if (!achievement) throw new Error("Achievement not found");

  const isUnlocked = progress >= achievement.maxProgress;
  const all = getStoredUserAchievements();
  const existing = all.find(
    (a) => a.userId === userId && a.achievementId === achievementId
  );

  const updated: UserAchievement = {
    achievementId,
    userId,
    progress: Math.min(progress, achievement.maxProgress),
    isUnlocked,
    unlockedAt:
      isUnlocked && !existing?.unlockedAt
        ? new Date().toISOString()
        : existing?.unlockedAt,
  };
  achievementStore.upsert(updated);
  return updated;
}
