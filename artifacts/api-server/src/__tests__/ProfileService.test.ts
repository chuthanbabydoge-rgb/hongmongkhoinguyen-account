import { describe, it, expect, beforeEach } from "vitest";
import { ProfileService, ProfileNotFoundError, ProfileAlreadyExistsError, ValidationError } from "../services/ProfileService";
import { InMemoryProfileRepository } from "../repositories/InMemoryProfileRepository";
import { formatUniverseId } from "../models/profile";

describe("ProfileService", () => {
  let repo: InMemoryProfileRepository;
  let service: ProfileService;

  beforeEach(() => {
    repo = new InMemoryProfileRepository();
    service = new ProfileService(repo);
  });

  // ─── Universe ID Format ───────────────────────────────────────────────────

  describe("formatUniverseId", () => {
    it("formats sequence 1 as UNI-000001", () => {
      expect(formatUniverseId(1)).toBe("UNI-000001");
    });
    it("formats sequence 2 as UNI-000002", () => {
      expect(formatUniverseId(2)).toBe("UNI-000002");
    });
    it("formats sequence 100 as UNI-000100", () => {
      expect(formatUniverseId(100)).toBe("UNI-000100");
    });
    it("formats sequence 999999 as UNI-999999", () => {
      expect(formatUniverseId(999999)).toBe("UNI-999999");
    });
  });

  // ─── Create Profile ───────────────────────────────────────────────────────

  describe("createProfile", () => {
    it("creates a profile with auto-generated Universe ID", async () => {
      const profile = await service.createProfile("user-001");
      expect(profile.userId).toBe("user-001");
      expect(profile.universeId).toMatch(/^UNI-\d{6}$/);
      expect(profile.universeId).toBe("UNI-000001");
    });

    it("assigns sequential Universe IDs to multiple users", async () => {
      const p1 = await service.createProfile("user-001");
      const p2 = await service.createProfile("user-002");
      const p3 = await service.createProfile("user-003");
      expect(p1.universeId).toBe("UNI-000001");
      expect(p2.universeId).toBe("UNI-000002");
      expect(p3.universeId).toBe("UNI-000003");
    });

    it("stores username if provided", async () => {
      const profile = await service.createProfile("user-001", "nova_star");
      expect(profile.username).toBe("nova_star");
    });

    it("throws ProfileAlreadyExistsError on duplicate userId", async () => {
      await service.createProfile("user-001");
      await expect(service.createProfile("user-001")).rejects.toThrow(
        ProfileAlreadyExistsError
      );
    });
  });

  // ─── Universe ID Uniqueness ───────────────────────────────────────────────

  describe("Universe ID uniqueness", () => {
    it("never generates duplicate Universe IDs", async () => {
      const ids = new Set<string>();
      const userIds = Array.from({ length: 10 }, (_, i) => `user-${i}`);
      for (const userId of userIds) {
        const p = await service.createProfile(userId);
        ids.add(p.universeId);
      }
      expect(ids.size).toBe(10);
    });
  });

  // ─── Get Profile ──────────────────────────────────────────────────────────

  describe("getMyProfile", () => {
    it("returns profile for existing userId", async () => {
      await service.createProfile("user-001");
      const profile = await service.getMyProfile("user-001");
      expect(profile.userId).toBe("user-001");
    });

    it("throws ProfileNotFoundError for unknown userId", async () => {
      await expect(service.getMyProfile("ghost-user")).rejects.toThrow(
        ProfileNotFoundError
      );
    });
  });

  describe("getProfileById", () => {
    it("returns profile for existing id", async () => {
      const created = await service.createProfile("user-001");
      const found = await service.getProfileById(created.id);
      expect(found.id).toBe(created.id);
    });

    it("throws ProfileNotFoundError for unknown id", async () => {
      await expect(
        service.getProfileById("00000000-0000-0000-0000-000000000000")
      ).rejects.toThrow(ProfileNotFoundError);
    });
  });

  // ─── Update Profile ───────────────────────────────────────────────────────

  describe("updateMyProfile", () => {
    it("updates displayName", async () => {
      await service.createProfile("user-001");
      const updated = await service.updateMyProfile("user-001", {
        displayName: "Commander Nova",
      });
      expect(updated.displayName).toBe("Commander Nova");
    });

    it("updates bio", async () => {
      await service.createProfile("user-001");
      const updated = await service.updateMyProfile("user-001", {
        bio: "Explorer of the void.",
      });
      expect(updated.bio).toBe("Explorer of the void.");
    });

    it("rejects displayName longer than 100 chars", async () => {
      await service.createProfile("user-001");
      const longName = "a".repeat(101);
      await expect(
        service.updateMyProfile("user-001", { displayName: longName })
      ).rejects.toThrow(ValidationError);
    });

    it("rejects bio longer than 500 chars", async () => {
      await service.createProfile("user-001");
      const longBio = "b".repeat(501);
      await expect(
        service.updateMyProfile("user-001", { bio: longBio })
      ).rejects.toThrow(ValidationError);
    });

    it("throws ProfileNotFoundError when profile does not exist", async () => {
      await expect(
        service.updateMyProfile("ghost-user", { displayName: "Ghost" })
      ).rejects.toThrow(ProfileNotFoundError);
    });

    it("preserves Universe ID on update", async () => {
      const created = await service.createProfile("user-001");
      const updated = await service.updateMyProfile("user-001", {
        displayName: "Star Lord",
      });
      expect(updated.universeId).toBe(created.universeId);
    });
  });

  // ─── Duplicate Universe ID protection ─────────────────────────────────────

  describe("Universe ID collision protection", () => {
    it("generateUniverseId skips already-used IDs", async () => {
      await service.createProfile("user-001");
      const next = await service.generateUniverseId();
      const existing = await repo.findByUniverseId(next);
      expect(existing).toBeNull();
    });
  });
});
