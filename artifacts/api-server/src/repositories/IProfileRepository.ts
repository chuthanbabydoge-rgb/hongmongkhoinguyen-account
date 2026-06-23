import type { Profile, UpdateProfileInput } from "../models/profile";

export interface CreateProfileInput {
  userId: string;
  universeId: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  findByUniverseId(universeId: string): Promise<Profile | null>;
  existsByUniverseId(universeId: string): Promise<boolean>;
  create(input: CreateProfileInput): Promise<Profile>;
  update(userId: string, input: UpdateProfileInput): Promise<Profile | null>;
  count(): Promise<number>;
}
