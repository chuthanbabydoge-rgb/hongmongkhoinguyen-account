import type { IProfileRepository } from "../repositories/IProfileRepository";
import type { Profile, UpdateProfileInput } from "../models/profile";
import { formatUniverseId } from "../models/profile";
import { UpdateProfileSchema } from "../models/profile";
import { ZodError } from "zod";

export class ProfileNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Profile not found: ${identifier}`);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfileAlreadyExistsError extends Error {
  constructor(userId: string) {
    super(`Profile already exists for user: ${userId}`);
    this.name = "ProfileAlreadyExistsError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ProfileService {
  constructor(private readonly repo: IProfileRepository) {}

  async generateUniverseId(): Promise<string> {
    const total = await this.repo.count();
    const candidate = formatUniverseId(total + 1);

    const existing = await this.repo.findByUniverseId(candidate);
    if (existing) {
      return formatUniverseId(total + 2);
    }
    return candidate;
  }

  async getMyProfile(userId: string): Promise<Profile> {
    const profile = await this.repo.findByUserId(userId);
    if (!profile) throw new ProfileNotFoundError(userId);
    return profile;
  }

  async getProfileById(id: string): Promise<Profile> {
    const profile = await this.repo.findById(id);
    if (!profile) throw new ProfileNotFoundError(id);
    return profile;
  }

  async createProfile(userId: string, username?: string): Promise<Profile> {
    const existing = await this.repo.findByUserId(userId);
    if (existing) throw new ProfileAlreadyExistsError(userId);

    const universeId = await this.generateUniverseId();
    return this.repo.create({ userId, universeId, username: username ?? null });
  }

  async updateMyProfile(userId: string, raw: unknown): Promise<Profile> {
    let input: UpdateProfileInput;
    try {
      input = UpdateProfileSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }

    const updated = await this.repo.update(userId, input);
    if (!updated) throw new ProfileNotFoundError(userId);
    return updated;
  }
}
