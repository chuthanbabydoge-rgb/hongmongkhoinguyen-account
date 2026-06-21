import { UserReputation, TradeRecord, ReviewEntry } from "../types/reputation";
import { reputationStore } from "../store/reputationStore";
import {
  initialReputations,
  initialTrades,
  initialReviews,
} from "../mock/reputationData";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function getStoredReputations(): UserReputation[] {
  const stored = reputationStore.getAllReputations();
  if (stored.length > 0) return stored;
  reputationStore.setAllReputations(initialReputations);
  return initialReputations;
}

function getStoredTrades(): TradeRecord[] {
  const stored = reputationStore.getAllTrades();
  if (stored.length > 0) return stored;
  reputationStore.setAllTrades(initialTrades);
  return initialTrades;
}

function getStoredReviews(): ReviewEntry[] {
  const stored = reputationStore.getAllReviews();
  if (stored.length > 0) return stored;
  reputationStore.setAllReviews(initialReviews);
  return initialReviews;
}

// SUPABASE: Replace with supabase.from('reputations').select('*').eq('userId', userId).single()
export async function apiGetUserReputation(
  userId: string
): Promise<UserReputation> {
  await delay(rand(300, 500));
  const all = getStoredReputations();
  const rep = all.find((r) => r.userId === userId);
  if (rep) return rep;

  // Create default reputation for new users
  const defaultRep: UserReputation = {
    userId,
    verificationLevel: "bronze",
    scores: { trust: 0, community: 0, marketplace: 0, safePass: 0, overall: 0 },
    totalTrades: 0,
    successfulTrades: 0,
    disputedTrades: 0,
    cancelledTrades: 0,
    totalVolume: 0,
    avgRating: 0,
    reviewCount: 0,
    endorsements: 0,
    reports: 0,
    joinedVerificationAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
  reputationStore.upsertReputation(defaultRep);
  return defaultRep;
}

// SUPABASE: Replace with supabase.from('trades').select('*').eq('userId', userId).order('createdAt', { ascending: false })
export async function apiGetUserTrades(userId: string): Promise<TradeRecord[]> {
  await delay(rand(300, 500));
  const all = getStoredTrades();
  const userTrades = all.filter((t) => t.userId === userId);
  if (userTrades.length > 0) return userTrades.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return [];
}

// SUPABASE: Replace with supabase.from('reviews').select('*').eq('userId', userId).order('createdAt', { ascending: false })
export async function apiGetUserReviews(userId: string): Promise<ReviewEntry[]> {
  await delay(rand(200, 400));
  const all = getStoredReviews();
  return all
    .filter((r) => r.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

// SUPABASE: Replace with supabase.from('reputations').update({ scores, verificationLevel }).eq('userId', userId)
export async function apiRefreshReputation(
  userId: string
): Promise<UserReputation> {
  await delay(rand(600, 1000));
  const rep = await apiGetUserReputation(userId);
  const updated: UserReputation = {
    ...rep,
    lastUpdated: new Date().toISOString(),
  };
  reputationStore.upsertReputation(updated);
  return updated;
}

// SUPABASE: Replace with supabase.rpc('endorse_user', { targetUserId })
export async function apiEndorseUser(
  targetUserId: string
): Promise<UserReputation> {
  await delay(rand(400, 700));
  const rep = await apiGetUserReputation(targetUserId);
  const updated: UserReputation = {
    ...rep,
    endorsements: rep.endorsements + 1,
    lastUpdated: new Date().toISOString(),
  };
  reputationStore.upsertReputation(updated);
  return updated;
}
