import { randomUUID } from "node:crypto";
import type { Profile, UpdateProfileInput } from "../models/profile";
import type { CreateProfileInput, IProfileRepository } from "./IProfileRepository";

export class InMemoryProfileRepository implements IProfileRepository {
  private store: Map<string, Profile> = new Map();

  async findById(id: string): Promise<Profile | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    for (const profile of this.store.values()) {
      if (profile.userId === userId) return profile;
    }
    return null;
  }

  async findByUniverseId(universeId: string): Promise<Profile | null> {
    for (const profile of this.store.values()) {
      if (profile.universeId === universeId) return profile;
    }
    return null;
  }

  async create(input: CreateProfileInput): Promise<Profile> {
    const now = new Date();
    const profile: Profile = {
      id: randomUUID(),
      userId: input.userId,
      universeId: input.universeId,
      username: input.username ?? null,
      displayName: input.displayName ?? null,
      avatarUrl: input.avatarUrl ?? null,
      bio: input.bio ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(profile.id, profile);
    return profile;
  }

  async update(userId: string, input: UpdateProfileInput): Promise<Profile | null> {
    for (const [id, profile] of this.store.entries()) {
      if (profile.userId === userId) {
        const updated: Profile = {
          ...profile,
          displayName: input.displayName !== undefined ? input.displayName : profile.displayName,
          avatarUrl: input.avatarUrl !== undefined ? (input.avatarUrl || null) : profile.avatarUrl,
          bio: input.bio !== undefined ? input.bio : profile.bio,
          updatedAt: new Date(),
        };
        this.store.set(id, updated);
        return updated;
      }
    }
    return null;
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
