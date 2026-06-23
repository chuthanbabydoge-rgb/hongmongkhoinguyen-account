import type { IProfileRepository } from "../repositories/IProfileRepository";
import type { IAvatarRepository } from "../repositories/IAvatarRepository";
import type { SharedIdentity, PublicIdentity, IdentityBridge } from "../models/sharedIdentity";
import { ProfileNotFoundError, ForbiddenError } from "./ProfileService";

export class IdentityService {
  constructor(
    private readonly profileRepo: IProfileRepository,
    private readonly avatarRepo: IAvatarRepository,
  ) {}

  async getMyIdentity(userId: string): Promise<IdentityBridge> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new ProfileNotFoundError(userId);

    const avatar = await this.avatarRepo.findByUserId(userId);

    return {
      profile: {
        id: profile.id,
        universeId: profile.universeId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        createdAt: profile.createdAt,
      },
      avatar: avatar
        ? {
            id: avatar.id,
            frame: avatar.frame,
            background: avatar.background,
            title: avatar.title,
            accessories: avatar.accessories,
            avatarName: avatar.avatarName,
          }
        : null,
    };
  }

  async getPublicIdentity(universeId: string): Promise<PublicIdentity> {
    const profile = await this.profileRepo.findByUniverseId(universeId);
    if (!profile) throw new ProfileNotFoundError(universeId);

    return {
      universeId: profile.universeId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      reputationLevel: "standard",
    };
  }

  async getSharedIdentity(userId: string): Promise<SharedIdentity> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new ProfileNotFoundError(userId);

    const avatar = await this.avatarRepo.findByUserId(userId);

    return {
      id: profile.id,
      userId: profile.userId,
      universeId: profile.universeId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? avatar?.avatarUrl ?? null,
      avatarId: avatar?.id ?? null,
      reputationLevel: "standard",
      createdAt: profile.createdAt,
    };
  }

  async getSharedIdentityByUniverseId(universeId: string): Promise<SharedIdentity> {
    const profile = await this.profileRepo.findByUniverseId(universeId);
    if (!profile) throw new ProfileNotFoundError(universeId);

    const avatar = await this.avatarRepo.findByUserId(profile.userId);

    return {
      id: profile.id,
      userId: profile.userId,
      universeId: profile.universeId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? avatar?.avatarUrl ?? null,
      avatarId: avatar?.id ?? null,
      reputationLevel: "standard",
      createdAt: profile.createdAt,
    };
  }

  async verifyOwnershipByProfileId(userId: string, profileId: string): Promise<void> {
    const profile = await this.profileRepo.findById(profileId);
    if (!profile) throw new ProfileNotFoundError(profileId);
    if (profile.userId !== userId) throw new ForbiddenError(userId, profileId);
  }
}
