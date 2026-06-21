export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export type AchievementCategory =
  | "explorer"
  | "trader"
  | "creator"
  | "collector"
  | "breeder"
  | "football_manager";

export interface AchievementReward {
  type: "xp" | "title" | "badge" | "cosmetic";
  label: string;
  value: number | string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  reward: AchievementReward;
  maxProgress: number;
  secret?: boolean;
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export const RARITY_META: Record<
  AchievementRarity,
  {
    label: string;
    color: string;
    text: string;
    bg: string;
    border: string;
    glow: string;
    gradient: string;
    points: number;
  }
> = {
  common: {
    label: "Common",
    color: "text-slate-300",
    text: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/25",
    glow: "",
    gradient: "from-slate-400/20 to-slate-600/10",
    points: 10,
  },
  rare: {
    label: "Rare",
    color: "text-cyan-300",
    text: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.12)]",
    gradient: "from-cyan-400/20 to-blue-600/10",
    points: 25,
  },
  epic: {
    label: "Epic",
    color: "text-violet-300",
    text: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.18)]",
    gradient: "from-violet-400/20 to-purple-600/10",
    points: 50,
  },
  legendary: {
    label: "Legendary",
    color: "text-amber-300",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.22)]",
    gradient: "from-amber-400/25 to-orange-600/10",
    points: 100,
  },
};

export const CATEGORY_META: Record<
  AchievementCategory,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  explorer: {
    label: "Explorer",
    icon: "🌌",
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
  },
  trader: {
    label: "Trader",
    icon: "💎",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  creator: {
    label: "Creator",
    icon: "⚛️",
    color: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
  },
  collector: {
    label: "Collector",
    icon: "📦",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  breeder: {
    label: "Breeder",
    icon: "🧬",
    color: "text-pink-300",
    bg: "bg-pink-500/10",
    border: "border-pink-500/25",
  },
  football_manager: {
    label: "Football Manager",
    icon: "⚽",
    color: "text-lime-300",
    bg: "bg-lime-500/10",
    border: "border-lime-500/25",
  },
};
