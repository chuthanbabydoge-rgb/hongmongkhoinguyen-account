import { UserReputation, TradeRecord, ReviewEntry } from "../types/reputation";

// ── User Reputations ──────────────────────────────────────────────────────────

export const initialReputations: UserReputation[] = [
  {
    userId: "user-admin",
    verificationLevel: "diamond",
    scores: {
      trust: 97,
      community: 95,
      marketplace: 98,
      safePass: 96,
      overall: 967,
    },
    totalTrades: 347,
    successfulTrades: 338,
    disputedTrades: 3,
    cancelledTrades: 6,
    totalVolume: 2847390,
    avgRating: 4.93,
    reviewCount: 284,
    endorsements: 142,
    reports: 1,
    joinedVerificationAt: new Date(Date.now() - 10000000000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    userId: "user-creator",
    verificationLevel: "gold",
    scores: {
      trust: 78,
      community: 84,
      marketplace: 71,
      safePass: 62,
      overall: 489,
    },
    totalTrades: 93,
    successfulTrades: 87,
    disputedTrades: 2,
    cancelledTrades: 4,
    totalVolume: 387420,
    avgRating: 4.61,
    reviewCount: 71,
    endorsements: 38,
    reports: 2,
    joinedVerificationAt: new Date(Date.now() - 5000000000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    userId: "user-regular",
    verificationLevel: "bronze",
    scores: {
      trust: 34,
      community: 42,
      marketplace: 28,
      safePass: 38,
      overall: 142,
    },
    totalTrades: 4,
    successfulTrades: 3,
    disputedTrades: 0,
    cancelledTrades: 1,
    totalVolume: 1240,
    avgRating: 4.25,
    reviewCount: 3,
    endorsements: 2,
    reports: 0,
    joinedVerificationAt: new Date(Date.now() - 1000000000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
];

// ── Trade Records ─────────────────────────────────────────────────────────────

function trade(
  id: string,
  userId: string,
  type: TradeRecord["type"],
  asset: string,
  amount: number,
  counterparty: string,
  counterpartyAvatar: string,
  result: TradeRecord["result"],
  daysAgo: number,
  worldName: string,
  rating?: number,
  feedback?: string
): TradeRecord {
  return {
    id,
    userId,
    type,
    asset,
    amount,
    currency: "UC",
    counterparty,
    counterpartyAvatar,
    result,
    rating,
    feedback,
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    completedAt:
      result !== "pending"
        ? new Date(
            Date.now() - daysAgo * 86400000 + 3600000
          ).toISOString()
        : undefined,
    worldId: "w1",
    worldName,
  };
}

export const initialTrades: TradeRecord[] = [
  // Admin trades
  trade("tr-a001", "user-admin", "sell", "Nebula Crystal", 4500, "Stellar", "ST", "completed", 1, "Nebula Nexus", 5, "Perfect transaction, fast and reliable!"),
  trade("tr-a002", "user-admin", "buy", "Quantum Shard", 1200, "VoidRunner", "VR", "completed", 3, "Quantum Forge", 5, "Great trade, highly recommend!"),
  trade("tr-a003", "user-admin", "swap", "Data Token ×50", 890, "NeuralNet", "NN", "completed", 5, "Data Realm", 5, "Smooth and professional."),
  trade("tr-a004", "user-admin", "sell", "Stellar Map", 22000, "CrystalX", "CX", "completed", 8, "Crystal Matrix", 5),
  trade("tr-a005", "user-admin", "buy", "Void Stone ×5", 3300, "ArcDriver", "AD", "completed", 10, "Void Frontier", 4, "Good trade overall."),
  trade("tr-a006", "user-admin", "transfer", "XP Boost ×10", 500, "StarForge", "SF", "completed", 14, "Stellar Commons", 5),
  trade("tr-a007", "user-admin", "sell", "Cosmic Artifact", 98000, "CelestialK", "CK", "completed", 18, "Nebula Nexus", 5, "Best trade partner in the universe!"),
  trade("tr-a008", "user-admin", "buy", "Dimension Key", 7400, "QuantumP", "QP", "disputed", 22, "Quantum Forge", undefined, "Item did not match description."),
  trade("tr-a009", "user-admin", "sell", "Neural Chip", 2100, "DataNode", "DN", "completed", 25, "Data Realm", 5),
  trade("tr-a010", "user-admin", "swap", "Energy Cell ×100", 1500, "VoidMaster", "VM", "cancelled", 30, "Void Frontier"),
  trade("tr-a011", "user-admin", "buy", "Holo Badge", 680, "LightYear", "LY", "completed", 35, "Stellar Commons", 4),
  trade("tr-a012", "user-admin", "sell", "Exo Armor", 44000, "RiftKnight", "RK", "completed", 45, "Crystal Matrix", 5, "Flawless execution, legendary seller!"),

  // Creator trades
  trade("tr-c001", "user-creator", "sell", "Art Module", 3200, "VoidRunner", "VR", "completed", 2, "Quantum Forge", 5, "Amazing creator, stunning work!"),
  trade("tr-c002", "user-creator", "buy", "Color Swatch", 450, "PixelWave", "PW", "completed", 6, "Nebula Nexus", 4),
  trade("tr-c003", "user-creator", "swap", "Blueprint ×3", 1100, "NeonArk", "NA", "completed", 12, "Data Realm", 5, "Perfect swap!"),
  trade("tr-c004", "user-creator", "sell", "3D World Pack", 8900, "RiftCraft", "RC", "disputed", 20, "Quantum Forge", undefined, "Incomplete assets delivered."),
  trade("tr-c005", "user-creator", "buy", "Particle FX", 750, "SkyNode", "SN", "completed", 28, "Stellar Commons", 5),
  trade("tr-c006", "user-creator", "transfer", "Template Set", 320, "BuildLab", "BL", "cancelled", 40, "Crystal Matrix"),
  trade("tr-c007", "user-creator", "sell", "Portal Design", 5600, "GlowMesh", "GM", "completed", 55, "Nebula Nexus", 5, "Top quality assets!"),

  // Regular user trades
  trade("tr-u001", "user-regular", "buy", "Starter Pack", 80, "ShopBot", "SB", "completed", 5, "Stellar Commons", 4, "Good starter items."),
  trade("tr-u002", "user-regular", "sell", "Extra Token", 25, "NewUser9", "NU", "completed", 15, "Nebula Nexus", 5),
  trade("tr-u003", "user-regular", "swap", "Item Card", 55, "TradeHive", "TH", "completed", 30, "Quantum Forge", 4),
  trade("tr-u004", "user-regular", "buy", "Rare Gem", 180, "VoidStore", "VS", "cancelled", 45, "Crystal Matrix"),
];

// ── Reviews ───────────────────────────────────────────────────────────────────

function review(
  id: string,
  userId: string,
  fromUser: string,
  fromAvatar: string,
  rating: number,
  text: string,
  category: ReviewEntry["category"],
  daysAgo: number,
  verified = true
): ReviewEntry {
  return {
    id,
    userId,
    fromUser,
    fromAvatar,
    rating,
    text,
    category,
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    verified,
  };
}

export const initialReviews: ReviewEntry[] = [
  // Admin reviews
  review("rv-a001", "user-admin", "Stellar", "ST", 5, "The most trustworthy trader in the entire universe. Every deal is flawless.", "marketplace", 1),
  review("rv-a002", "user-admin", "CelestialK", "CK", 5, "Best trade partner I've ever worked with. 100/100, no hesitation.", "marketplace", 3),
  review("rv-a003", "user-admin", "VoidRunner", "VR", 5, "Admin handles community disputes with incredible fairness and speed.", "community", 7),
  review("rv-a004", "user-admin", "NeuralNet", "NN", 5, "SafePass verified, never a worry. Top-tier security standards.", "general", 12),
  review("rv-a005", "user-admin", "ArcDriver", "AD", 4, "Excellent trader, one small delay but communicated well.", "marketplace", 18),
  review("rv-a006", "user-admin", "LightYear", "LY", 5, "Helped onboard 50+ new community members. True galaxy guardian.", "community", 25),

  // Creator reviews
  review("rv-c001", "user-creator", "VoidRunner", "VR", 5, "Absolutely stunning creative work. The assets are beyond professional.", "marketplace", 2),
  review("rv-c002", "user-creator", "PixelWave", "PW", 4, "Great creator, delivers on time and quality is top notch.", "marketplace", 8),
  review("rv-c003", "user-creator", "SkyNode", "SN", 5, "Most helpful community member in Quantum Forge. Always willing to assist.", "community", 15),
  review("rv-c004", "user-creator", "GlowMesh", "GM", 5, "Exceptional quality assets, would buy again immediately.", "marketplace", 28),
  review("rv-c005", "user-creator", "RiftCraft", "RC", 2, "Had a dispute on one trade, but it was resolved eventually.", "marketplace", 35, false),

  // Regular user reviews
  review("rv-u001", "user-regular", "ShopBot", "SB", 4, "New user but already showing great trading etiquette.", "marketplace", 5),
  review("rv-u002", "user-regular", "NewUser9", "NU", 5, "Super friendly and honest. Looking forward to more trades!", "general", 16),
  review("rv-u003", "user-regular", "TradeHive", "TH", 4, "Solid first trades, growing nicely in the community.", "community", 31),
];
