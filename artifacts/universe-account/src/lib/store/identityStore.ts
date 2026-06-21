import { UniverseIdentity } from "../types/identity";
import { DEMO_IDENTITIES, SEARCHABLE_USERS } from "../mock/identityMock";

const STORAGE_KEY = "universe_identity_v2";

function loadIdentity(userId: string): UniverseIdentity | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    if (raw) return JSON.parse(raw) as UniverseIdentity;
  } catch {}
  return DEMO_IDENTITIES[userId] ?? null;
}

function saveIdentity(userId: string, identity: UniverseIdentity) {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(identity));
  } catch {}
}

const _listeners = new Set<() => void>();
const _cache: Record<string, UniverseIdentity> = {};

export const identityStore = {
  getIdentity(userId: string): UniverseIdentity | null {
    if (!_cache[userId]) {
      const loaded = loadIdentity(userId);
      if (loaded) _cache[userId] = loaded;
    }
    return _cache[userId] ?? null;
  },

  setVisibility(userId: string, visibility: "public" | "private"): void {
    const identity = this.getIdentity(userId);
    if (!identity) return;
    _cache[userId] = { ...identity, visibility };
    saveIdentity(userId, _cache[userId]);
    _listeners.forEach(fn => fn());
  },

  updateBio(userId: string, bio: string): void {
    const identity = this.getIdentity(userId);
    if (!identity) return;
    _cache[userId] = { ...identity, bio };
    saveIdentity(userId, _cache[userId]);
    _listeners.forEach(fn => fn());
  },

  searchByUniverseId(query: string): UniverseIdentity | null {
    const normalised = query.trim().toUpperCase();
    return SEARCHABLE_USERS.find(u => u.universeId === normalised) ?? null;
  },

  subscribe(fn: () => void): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
