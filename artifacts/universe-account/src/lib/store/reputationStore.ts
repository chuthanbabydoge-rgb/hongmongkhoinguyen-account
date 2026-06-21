import { UserReputation, TradeRecord, ReviewEntry } from "../types/reputation";

const REPUTATION_KEY = "universe_reputations";
const TRADES_KEY = "universe_trades";
const REVIEWS_KEY = "universe_reviews";

export const reputationStore = {
  getAllReputations(): UserReputation[] {
    try {
      const raw = localStorage.getItem(REPUTATION_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  setAllReputations(reputations: UserReputation[]) {
    localStorage.setItem(REPUTATION_KEY, JSON.stringify(reputations));
  },

  getForUser(userId: string): UserReputation | null {
    return this.getAllReputations().find((r) => r.userId === userId) ?? null;
  },

  upsertReputation(reputation: UserReputation) {
    const all = this.getAllReputations();
    const idx = all.findIndex((r) => r.userId === reputation.userId);
    if (idx === -1) {
      this.setAllReputations([...all, reputation]);
    } else {
      all[idx] = reputation;
      this.setAllReputations(all);
    }
  },

  getAllTrades(): TradeRecord[] {
    try {
      const raw = localStorage.getItem(TRADES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  setAllTrades(trades: TradeRecord[]) {
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  },

  getTradesForUser(userId: string): TradeRecord[] {
    return this.getAllTrades().filter((t) => t.userId === userId);
  },

  getAllReviews(): ReviewEntry[] {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  setAllReviews(reviews: ReviewEntry[]) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  },

  getReviewsForUser(userId: string): ReviewEntry[] {
    return this.getAllReviews().filter((r) => r.userId === userId);
  },

  clear() {
    localStorage.removeItem(REPUTATION_KEY);
    localStorage.removeItem(TRADES_KEY);
    localStorage.removeItem(REVIEWS_KEY);
  },
};
