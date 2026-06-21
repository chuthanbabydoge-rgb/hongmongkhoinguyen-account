export type VerificationLevel = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type TradeResult = "completed" | "disputed" | "cancelled" | "pending";
export type TradeType = "buy" | "sell" | "swap" | "transfer";

export interface ReputationScores {
  trust: number;        // 0-100
  community: number;    // 0-100
  marketplace: number;  // 0-100
  safePass: number;     // 0-100
  overall: number;      // computed
}

export interface TradeRecord {
  id: string;
  userId: string;
  type: TradeType;
  asset: string;
  amount: number;
  currency: string;
  counterparty: string;
  counterpartyAvatar: string;
  result: TradeResult;
  rating?: number; // 1-5, given by counterparty
  feedback?: string;
  createdAt: string;
  completedAt?: string;
  worldId: string;
  worldName: string;
}

export interface ReviewEntry {
  id: string;
  userId: string;
  fromUser: string;
  fromAvatar: string;
  rating: number;
  text: string;
  category: "community" | "marketplace" | "general";
  createdAt: string;
  verified: boolean;
}

export interface UserReputation {
  userId: string;
  verificationLevel: VerificationLevel;
  scores: ReputationScores;
  totalTrades: number;
  successfulTrades: number;
  disputedTrades: number;
  cancelledTrades: number;
  totalVolume: number;
  avgRating: number;
  reviewCount: number;
  endorsements: number;
  reports: number;
  joinedVerificationAt: string;
  lastUpdated: string;
}

export const VERIFICATION_META: Record<
  VerificationLevel,
  {
    label: string;
    icon: string;
    minScore: number;
    maxScore: number;
    color: string;
    text: string;
    bg: string;
    border: string;
    glow: string;
    gradient: string;
    perks: string[];
  }
> = {
  bronze: {
    label: "Bronze",
    icon: "🥉",
    minScore: 0,
    maxScore: 199,
    color: "text-orange-400",
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    glow: "",
    gradient: "from-orange-400/20 to-amber-600/10",
    perks: ["Basic trading", "Community access", "Standard support"],
  },
  silver: {
    label: "Silver",
    icon: "🥈",
    minScore: 200,
    maxScore: 399,
    color: "text-slate-300",
    text: "text-slate-200",
    bg: "bg-slate-500/10",
    border: "border-slate-400/30",
    glow: "shadow-[0_0_15px_rgba(148,163,184,0.1)]",
    gradient: "from-slate-300/20 to-slate-500/10",
    perks: ["Enhanced trading limits", "Priority matching", "Trade history analytics"],
  },
  gold: {
    label: "Gold",
    icon: "🥇",
    minScore: 400,
    maxScore: 599,
    color: "text-yellow-400",
    text: "text-yellow-300",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.15)]",
    gradient: "from-yellow-400/20 to-amber-500/10",
    perks: ["Premium trading features", "Dispute resolution priority", "Market insights"],
  },
  platinum: {
    label: "Platinum",
    icon: "💠",
    minScore: 600,
    maxScore: 799,
    color: "text-cyan-300",
    text: "text-cyan-200",
    bg: "bg-cyan-500/10",
    border: "border-cyan-400/30",
    glow: "shadow-[0_0_22px_rgba(6,182,212,0.18)]",
    gradient: "from-cyan-400/20 to-blue-600/10",
    perks: ["Unlimited trading", "Dedicated support", "VIP marketplace access", "Custom badges"],
  },
  diamond: {
    label: "Diamond",
    icon: "💎",
    minScore: 800,
    maxScore: 1000,
    color: "text-violet-300",
    text: "text-violet-200",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    glow: "shadow-[0_0_28px_rgba(124,58,237,0.25)]",
    gradient: "from-violet-400/25 to-purple-600/15",
    perks: [
      "Unrestricted access",
      "Governance voting rights",
      "Elite marketplace features",
      "Custom world creation",
      "Diamond-tier badge",
    ],
  },
};

export const TRADE_RESULT_META: Record<
  TradeResult,
  { label: string; color: string; bg: string; border: string }
> = {
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  disputed: {
    label: "Disputed",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-white/35",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
};

export const TRADE_TYPE_META: Record<
  TradeType,
  { label: string; color: string; icon: string }
> = {
  buy: { label: "Buy", color: "text-emerald-400", icon: "↓" },
  sell: { label: "Sell", color: "text-red-400", icon: "↑" },
  swap: { label: "Swap", color: "text-cyan-400", icon: "⇄" },
  transfer: { label: "Transfer", color: "text-violet-400", icon: "→" },
};
