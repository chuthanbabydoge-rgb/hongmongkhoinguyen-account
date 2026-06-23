import { z } from "zod";

// ─── Category enum ────────────────────────────────────────────────────────────

export const AchievementCategory = {
  ACCOUNT: "ACCOUNT",
  MARKETPLACE: "MARKETPLACE",
  SPORT: "SPORT",
  WORLD: "WORLD",
  ANIMAL: "ANIMAL",
  SOCIAL: "SOCIAL",
  SPECIAL: "SPECIAL",
} as const;

export type AchievementCategory = (typeof AchievementCategory)[keyof typeof AchievementCategory];

// ─── Core models ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  createdAt: Date | null;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  grantedBy: string;
  metadata: Record<string, unknown> | null;
  grantedAt: Date | null;
}

// ─── Zod validation ───────────────────────────────────────────────────────────

export const GrantAchievementRequestSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  key: z.string().min(1, "key is required"),
  grantedBy: z.string().min(1, "grantedBy is required"),
  metadata: z.record(z.unknown()).optional(),
});

export type GrantAchievementRequest = z.infer<typeof GrantAchievementRequestSchema>;

// ─── Default achievements seed ────────────────────────────────────────────────

export const DEFAULT_ACHIEVEMENTS: Omit<Achievement, "id" | "createdAt">[] = [
  {
    key: "FIRST_LOGIN",
    name: "First Login",
    description: "Logged in to Universe for the first time.",
    icon: "🚀",
    category: AchievementCategory.ACCOUNT,
    points: 10,
  },
  {
    key: "FIRST_PROFILE",
    name: "Identity Established",
    description: "Created your Universe profile.",
    icon: "🪪",
    category: AchievementCategory.ACCOUNT,
    points: 15,
  },
  {
    key: "FIRST_AVATAR",
    name: "Face of the Cosmos",
    description: "Customised your avatar for the first time.",
    icon: "🎭",
    category: AchievementCategory.ACCOUNT,
    points: 10,
  },
  {
    key: "FIRST_MARKETPLACE_PURCHASE",
    name: "First Buyer",
    description: "Completed your first purchase in the Marketplace.",
    icon: "🛒",
    category: AchievementCategory.MARKETPLACE,
    points: 20,
  },
  {
    key: "FIRST_MARKETPLACE_SALE",
    name: "First Seller",
    description: "Made your first sale in the Marketplace.",
    icon: "💰",
    category: AchievementCategory.MARKETPLACE,
    points: 25,
  },
  {
    key: "FIRST_FOOTBALL_MATCH",
    name: "Kick Off",
    description: "Played your first Football Universe match.",
    icon: "⚽",
    category: AchievementCategory.SPORT,
    points: 20,
  },
  {
    key: "FIRST_WORLD_CREATED",
    name: "World Builder",
    description: "Created your first world in World Creator.",
    icon: "🌍",
    category: AchievementCategory.WORLD,
    points: 30,
  },
  {
    key: "FIRST_PET_CREATED",
    name: "Pet Parent",
    description: "Adopted your first pet in Animal Evolution.",
    icon: "🐾",
    category: AchievementCategory.ANIMAL,
    points: 20,
  },
  {
    key: "EXPLORER",
    name: "Explorer",
    description: "Visited at least 3 different Universe apps.",
    icon: "🧭",
    category: AchievementCategory.SOCIAL,
    points: 50,
  },
  {
    key: "COLLECTOR",
    name: "Collector",
    description: "Accumulated 10 or more achievements.",
    icon: "🏅",
    category: AchievementCategory.SPECIAL,
    points: 100,
  },
  {
    key: "TRADER",
    name: "Trader",
    description: "Completed at least 10 Marketplace transactions.",
    icon: "📦",
    category: AchievementCategory.MARKETPLACE,
    points: 75,
  },
  {
    key: "FOUNDER",
    name: "Founder",
    description: "One of the earliest members of Universe.",
    icon: "⭐",
    category: AchievementCategory.SPECIAL,
    points: 200,
  },
];
