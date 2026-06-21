export type UniverseId = string; // Format: UNI-XXXXXXXX

export type ProfileVisibility = "public" | "private";

export interface IdentityStats {
  level: number;
  experience: number;
  experienceToNext: number;
  reputation: number;
  reputationRank: "Newcomer" | "Explorer" | "Pioneer" | "Guardian" | "Legend" | "Cosmic";
  worldsVisited: number;
  assetsOwned: number;
  tradesCompleted: number;
  achievementsUnlocked: number;
  joinedAt: string;
}

export interface FutureModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  gradientFrom: string;
  gradientTo: string;
  status: "coming_soon" | "beta" | "available";
  eta?: string;
}

export interface UniverseIdentity {
  universeId: UniverseId;
  username: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  title: string;
  bio: string;
  stats: IdentityStats;
  badges: string[];
  visibility: ProfileVisibility;
  verifiedAt: string | null;
  lastSeen: string;
}
