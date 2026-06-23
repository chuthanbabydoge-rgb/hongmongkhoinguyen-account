import { describe, it, expect, beforeEach } from "vitest";
import { ProfileService, ProfileNotFoundError, ForbiddenError } from "../services/ProfileService";
import { IdentityService } from "../services/IdentityService";
import { InMemoryProfileRepository } from "../repositories/InMemoryProfileRepository";
import { InMemoryAvatarRepository } from "../repositories/InMemoryAvatarRepository";
import { AvatarService } from "../services/AvatarService";
import { requireProfileOwner } from "../middlewares/requireProfileOwner";
import type { Request, Response } from "express";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    status: (code: number) => { res._status = code; return res; },
    json: (body: unknown) => { res._body = body; return res; },
    _status: 200,
    _body: null as unknown,
  };
  return res;
}

describe("Sprint 3 — Identity Bridge", () => {
  let profileRepo: InMemoryProfileRepository;
  let avatarRepo: InMemoryAvatarRepository;
  let profileService: ProfileService;
  let avatarService: AvatarService;
  let identityService: IdentityService;

  beforeEach(() => {
    profileRepo = new InMemoryProfileRepository();
    avatarRepo = new InMemoryAvatarRepository();
    profileService = new ProfileService(profileRepo);
    avatarService = new AvatarService(avatarRepo);
    identityService = new IdentityService(profileRepo, avatarRepo);
  });

  // ─── Repository: findByUniverseId ────────────────────────────────────────

  describe("repository.findByUniverseId", () => {
    it("returns profile when Universe ID exists", async () => {
      const created = await profileService.createProfile("user-001");
      const found = await profileRepo.findByUniverseId(created.universeId);
      expect(found).not.toBeNull();
      expect(found!.universeId).toBe(created.universeId);
    });

    it("returns null when Universe ID does not exist", async () => {
      const found = await profileRepo.findByUniverseId("UNI-999999");
      expect(found).toBeNull();
    });
  });

  // ─── Repository: existsByUniverseId ──────────────────────────────────────

  describe("repository.existsByUniverseId", () => {
    it("returns true when Universe ID exists", async () => {
      const created = await profileService.createProfile("user-001");
      const exists = await profileRepo.existsByUniverseId(created.universeId);
      expect(exists).toBe(true);
    });

    it("returns false when Universe ID does not exist", async () => {
      const exists = await profileRepo.existsByUniverseId("UNI-000099");
      expect(exists).toBe(false);
    });
  });

  // ─── ProfileService: getProfileByUniverseId ───────────────────────────────

  describe("ProfileService.getProfileByUniverseId", () => {
    it("returns profile for valid Universe ID", async () => {
      const created = await profileService.createProfile("user-001");
      const found = await profileService.getProfileByUniverseId(created.universeId);
      expect(found.universeId).toBe(created.universeId);
      expect(found.userId).toBe("user-001");
    });

    it("throws ProfileNotFoundError for unknown Universe ID", async () => {
      await expect(
        profileService.getProfileByUniverseId("UNI-000099")
      ).rejects.toThrow(ProfileNotFoundError);
    });

    it("profile lookup preserves exact Universe ID format", async () => {
      const created = await profileService.createProfile("user-001");
      const found = await profileService.getProfileByUniverseId(created.universeId);
      expect(found.universeId).toMatch(/^UNI-\d{6}$/);
      expect(found.universeId).toBe(created.universeId);
    });
  });

  // ─── ProfileService: existsUniverseId ────────────────────────────────────

  describe("ProfileService.existsUniverseId", () => {
    it("returns true when Universe ID exists", async () => {
      const created = await profileService.createProfile("user-001");
      const exists = await profileService.existsUniverseId(created.universeId);
      expect(exists).toBe(true);
    });

    it("returns false when Universe ID does not exist", async () => {
      const exists = await profileService.existsUniverseId("UNI-000099");
      expect(exists).toBe(false);
    });
  });

  // ─── ProfileService: verifyOwnership ─────────────────────────────────────

  describe("ProfileService.verifyOwnership", () => {
    it("resolves when userId matches profile owner", async () => {
      const profile = await profileService.createProfile("user-001");
      await expect(
        profileService.verifyOwnership("user-001", profile.id)
      ).resolves.toBeUndefined();
    });

    it("throws ForbiddenError when userId does not match", async () => {
      const profile = await profileService.createProfile("user-001");
      await expect(
        profileService.verifyOwnership("user-002", profile.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it("ForbiddenError has correct name", async () => {
      const profile = await profileService.createProfile("user-001");
      const err = await profileService.verifyOwnership("user-002", profile.id).catch((e) => e);
      expect(err.name).toBe("ForbiddenError");
    });

    it("throws ProfileNotFoundError for non-existent profileId", async () => {
      await expect(
        profileService.verifyOwnership("user-001", "00000000-0000-0000-0000-000000000000")
      ).rejects.toThrow(ProfileNotFoundError);
    });
  });

  // ─── ProfileService: verifyUniverseOwnership ─────────────────────────────

  describe("ProfileService.verifyUniverseOwnership", () => {
    it("resolves when userId owns the universeId", async () => {
      const profile = await profileService.createProfile("user-001");
      await expect(
        profileService.verifyUniverseOwnership("user-001", profile.universeId)
      ).resolves.toBeUndefined();
    });

    it("throws ForbiddenError when userId does not own the universeId", async () => {
      const profile = await profileService.createProfile("user-001");
      await expect(
        profileService.verifyUniverseOwnership("user-002", profile.universeId)
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ProfileNotFoundError for non-existent universeId", async () => {
      await expect(
        profileService.verifyUniverseOwnership("user-001", "UNI-000099")
      ).rejects.toThrow(ProfileNotFoundError);
    });
  });

  // ─── ProfileService: getSharedIdentity ───────────────────────────────────

  describe("ProfileService.getSharedIdentity", () => {
    it("returns SharedIdentity with correct fields", async () => {
      const profile = await profileService.createProfile("user-001", "nova");
      const identity = await profileService.getSharedIdentity("user-001");
      expect(identity.userId).toBe("user-001");
      expect(identity.universeId).toBe(profile.universeId);
      expect(identity.reputationLevel).toBe("standard");
    });

    it("does NOT expose email", async () => {
      await profileService.createProfile("user-001");
      const identity = await profileService.getSharedIdentity("user-001");
      expect((identity as Record<string, unknown>)["email"]).toBeUndefined();
    });

    it("does NOT expose auth token", async () => {
      await profileService.createProfile("user-001");
      const identity = await profileService.getSharedIdentity("user-001");
      expect((identity as Record<string, unknown>)["token"]).toBeUndefined();
      expect((identity as Record<string, unknown>)["authToken"]).toBeUndefined();
    });

    it("throws ProfileNotFoundError for unknown user", async () => {
      await expect(
        profileService.getSharedIdentity("ghost-user")
      ).rejects.toThrow(ProfileNotFoundError);
    });
  });

  // ─── IdentityService: getMyIdentity ──────────────────────────────────────

  describe("IdentityService.getMyIdentity", () => {
    it("returns profile + avatar when both exist", async () => {
      await profileService.createProfile("user-001");
      await avatarService.getOrCreateAvatar("user-001");
      const bridge = await identityService.getMyIdentity("user-001");
      expect(bridge.profile).toBeDefined();
      expect(bridge.avatar).not.toBeNull();
      expect(bridge.avatar!.frame).toBeDefined();
    });

    it("returns profile + null avatar when no avatar exists", async () => {
      await profileService.createProfile("user-001");
      const bridge = await identityService.getMyIdentity("user-001");
      expect(bridge.profile).toBeDefined();
      expect(bridge.avatar).toBeNull();
    });

    it("avatar is included in identity bridge", async () => {
      await profileService.createProfile("user-001");
      const { avatar: created } = await avatarService.getOrCreateAvatar("user-001");
      const bridge = await identityService.getMyIdentity("user-001");
      expect(bridge.avatar!.id).toBe(created.id);
    });

    it("throws ProfileNotFoundError when no profile exists", async () => {
      await expect(
        identityService.getMyIdentity("ghost-user")
      ).rejects.toThrow(ProfileNotFoundError);
    });
  });

  // ─── IdentityService: getPublicIdentity ──────────────────────────────────

  describe("IdentityService.getPublicIdentity", () => {
    it("returns public identity by Universe ID", async () => {
      const profile = await profileService.createProfile("user-001");
      const pub = await identityService.getPublicIdentity(profile.universeId);
      expect(pub.universeId).toBe(profile.universeId);
      expect(pub.reputationLevel).toBe("standard");
    });

    it("does NOT include email in public identity", async () => {
      const profile = await profileService.createProfile("user-001");
      const pub = await identityService.getPublicIdentity(profile.universeId);
      expect((pub as Record<string, unknown>)["email"]).toBeUndefined();
      expect((pub as Record<string, unknown>)["userId"]).toBeUndefined();
    });

    it("throws ProfileNotFoundError for unknown universeId", async () => {
      await expect(
        identityService.getPublicIdentity("UNI-000099")
      ).rejects.toThrow(ProfileNotFoundError);
    });
  });

  // ─── requireProfileOwner middleware ──────────────────────────────────────

  describe("requireProfileOwner middleware", () => {
    it("calls next() when userId matches profile owner", async () => {
      const profile = await profileService.createProfile("user-001");
      const middleware = requireProfileOwner(profileRepo);
      let nextCalled = false;

      const req = { userId: "user-001", params: { profileId: profile.id } } as unknown as Request;
      const res = mockRes() as unknown as Response;
      const next = () => { nextCalled = true; };

      await middleware(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it("returns 403 when userId does not match profile owner", async () => {
      const profile = await profileService.createProfile("user-001");
      const middleware = requireProfileOwner(profileRepo);

      const req = { userId: "user-002", params: { profileId: profile.id } } as unknown as Request;
      const res = mockRes();
      const next = () => { throw new Error("next should not be called"); };

      await middleware(req, res as unknown as Response, next);
      expect(res._status).toBe(403);
    });

    it("returns 404 when profile does not exist", async () => {
      const middleware = requireProfileOwner(profileRepo);

      const req = {
        userId: "user-001",
        params: { profileId: "00000000-0000-0000-0000-000000000000" },
      } as unknown as Request;
      const res = mockRes();
      const next = () => { throw new Error("next should not be called"); };

      await middleware(req, res as unknown as Response, next);
      expect(res._status).toBe(404);
    });

    it("returns 401 when no userId on request", async () => {
      const middleware = requireProfileOwner(profileRepo);

      const req = { params: { profileId: "some-id" } } as unknown as Request;
      const res = mockRes();
      const next = () => { throw new Error("next should not be called"); };

      await middleware(req, res as unknown as Response, next);
      expect(res._status).toBe(401);
    });
  });
});
