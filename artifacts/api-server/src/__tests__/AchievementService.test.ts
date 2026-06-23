import { describe, it, expect, beforeEach } from "vitest";
import { AchievementService, AchievementNotFoundError, AchievementValidationError } from "../services/AchievementService";
import { InMemoryAchievementRepository } from "../repositories/InMemoryAchievementRepository";
import { DEFAULT_ACHIEVEMENTS, AchievementCategory } from "../models/achievement";

describe("Sprint 4 — Achievement System", () => {
  let repo: InMemoryAchievementRepository;
  let service: AchievementService;

  beforeEach(async () => {
    repo = new InMemoryAchievementRepository();
    service = new AchievementService(repo);
    await service.initialize();
  });

  // ─── Seed & initialize ────────────────────────────────────────────────────

  describe("initialize / seedDefaults", () => {
    it("seeds all default achievements on initialize", async () => {
      const all = await service.getAll();
      expect(all.length).toBe(DEFAULT_ACHIEVEMENTS.length);
    });

    it("each seeded achievement has a non-empty key", async () => {
      const all = await service.getAll();
      for (const a of all) {
        expect(a.key).toBeTruthy();
      }
    });

    it("initialize is idempotent — calling twice does not duplicate", async () => {
      await service.initialize();
      await service.initialize();
      const all = await service.getAll();
      expect(all.length).toBe(DEFAULT_ACHIEVEMENTS.length);
    });

    it("seeded achievements have correct categories", async () => {
      const all = await service.getAll();
      const validCategories = Object.values(AchievementCategory);
      for (const a of all) {
        expect(validCategories).toContain(a.category);
      }
    });

    it("FIRST_LOGIN achievement exists after seed", async () => {
      const all = await service.getAll();
      const login = all.find((a) => a.key === "FIRST_LOGIN");
      expect(login).toBeDefined();
      expect(login!.name).toBe("First Login");
    });

    it("FOUNDER achievement has 200 points", async () => {
      const all = await service.getAll();
      const founder = all.find((a) => a.key === "FOUNDER");
      expect(founder).toBeDefined();
      expect(founder!.points).toBe(200);
    });
  });

  // ─── getAll ───────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all 12 default achievements", async () => {
      const all = await service.getAll();
      expect(all).toHaveLength(12);
    });

    it("returns empty array before seeding", async () => {
      const freshRepo = new InMemoryAchievementRepository();
      const freshService = new AchievementService(freshRepo);
      const all = await freshService.getAll();
      expect(all).toHaveLength(0);
    });
  });

  // ─── grantAchievementByKey ────────────────────────────────────────────────

  describe("grantAchievementByKey", () => {
    it("grants an achievement and returns created=true", async () => {
      const { achievement, created } = await service.grantAchievementByKey({
        userId: "user-001",
        key: "FIRST_LOGIN",
        grantedBy: "system",
      });
      expect(created).toBe(true);
      expect(achievement.userId).toBe("user-001");
      expect(achievement.achievement.key).toBe("FIRST_LOGIN");
    });

    it("duplicate grant returns created=false", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      const { created } = await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      expect(created).toBe(false);
    });

    it("duplicate grant does not create a second record", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      const count = await service.count("user-001");
      expect(count).toBe(1);
    });

    it("throws AchievementNotFoundError for unknown key", async () => {
      await expect(
        service.grantAchievementByKey({ userId: "user-001", key: "UNKNOWN_KEY", grantedBy: "system" }),
      ).rejects.toThrow(AchievementNotFoundError);
    });

    it("AchievementNotFoundError has correct name", async () => {
      const err = await service
        .grantAchievementByKey({ userId: "user-001", key: "GHOST", grantedBy: "system" })
        .catch((e) => e);
      expect(err.name).toBe("AchievementNotFoundError");
    });

    it("throws AchievementValidationError when userId missing", async () => {
      await expect(
        service.grantAchievementByKey({ userId: "", key: "FIRST_LOGIN", grantedBy: "system" }),
      ).rejects.toThrow(AchievementValidationError);
    });

    it("throws AchievementValidationError when key missing", async () => {
      await expect(
        service.grantAchievementByKey({ userId: "user-001", key: "", grantedBy: "system" }),
      ).rejects.toThrow(AchievementValidationError);
    });

    it("throws AchievementValidationError when grantedBy missing", async () => {
      await expect(
        service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "" }),
      ).rejects.toThrow(AchievementValidationError);
    });

    it("stores metadata on the user achievement", async () => {
      const { achievement } = await service.grantAchievementByKey({
        userId: "user-001",
        key: "FIRST_LOGIN",
        grantedBy: "football-universe",
        metadata: { source: "match", matchId: "abc-123" },
      });
      expect(achievement.metadata).toEqual({ source: "match", matchId: "abc-123" });
    });

    it("stores grantedBy on the user achievement", async () => {
      const { achievement } = await service.grantAchievementByKey({
        userId: "user-001",
        key: "FIRST_LOGIN",
        grantedBy: "marketplace",
      });
      expect(achievement.grantedBy).toBe("marketplace");
    });
  });

  // ─── hasAchievement ───────────────────────────────────────────────────────

  describe("hasAchievement", () => {
    it("returns false before granting", async () => {
      const has = await service.hasAchievement("user-001", "FIRST_LOGIN");
      expect(has).toBe(false);
    });

    it("returns true after granting", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      const has = await service.hasAchievement("user-001", "FIRST_LOGIN");
      expect(has).toBe(true);
    });

    it("returns false for unknown key", async () => {
      const has = await service.hasAchievement("user-001", "GHOST_KEY");
      expect(has).toBe(false);
    });
  });

  // ─── getUserAchievements ──────────────────────────────────────────────────

  describe("getUserAchievements", () => {
    it("returns empty array when user has no achievements", async () => {
      const list = await service.getUserAchievements("user-001");
      expect(list).toHaveLength(0);
    });

    it("returns achievements for a user", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_PROFILE", grantedBy: "system" });
      const list = await service.getUserAchievements("user-001");
      expect(list).toHaveLength(2);
    });

    it("does not include achievements from other users", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      await service.grantAchievementByKey({ userId: "user-002", key: "FIRST_PROFILE", grantedBy: "system" });
      const list = await service.getUserAchievements("user-001");
      expect(list).toHaveLength(1);
      expect(list[0]!.achievement.key).toBe("FIRST_LOGIN");
    });

    it("each item has the full achievement object embedded", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_AVATAR", grantedBy: "system" });
      const list = await service.getUserAchievements("user-001");
      expect(list[0]!.achievement.name).toBe("Face of the Cosmos");
      expect(list[0]!.achievement.points).toBe(10);
    });
  });

  // ─── count ────────────────────────────────────────────────────────────────

  describe("count", () => {
    it("returns 0 for user with no achievements", async () => {
      expect(await service.count("user-001")).toBe(0);
    });

    it("increments count after each grant", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      expect(await service.count("user-001")).toBe(1);
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_PROFILE", grantedBy: "system" });
      expect(await service.count("user-001")).toBe(2);
    });

    it("does not count duplicate grants", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      expect(await service.count("user-001")).toBe(1);
    });

    it("counts independently per user", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      await service.grantAchievementByKey({ userId: "user-002", key: "FIRST_LOGIN", grantedBy: "system" });
      await service.grantAchievementByKey({ userId: "user-002", key: "FIRST_PROFILE", grantedBy: "system" });
      expect(await service.count("user-001")).toBe(1);
      expect(await service.count("user-002")).toBe(2);
    });
  });

  // ─── Multiple users / ecosystem realism ──────────────────────────────────

  describe("multi-user / ecosystem scenarios", () => {
    it("grants multiple different achievements to the same user", async () => {
      const keys = ["FIRST_LOGIN", "FIRST_PROFILE", "FIRST_AVATAR", "EXPLORER"];
      for (const key of keys) {
        await service.grantAchievementByKey({ userId: "user-001", key, grantedBy: "system" });
      }
      expect(await service.count("user-001")).toBe(4);
    });

    it("same achievement can be granted to multiple users independently", async () => {
      await service.grantAchievementByKey({ userId: "user-001", key: "FOUNDER", grantedBy: "system" });
      await service.grantAchievementByKey({ userId: "user-002", key: "FOUNDER", grantedBy: "system" });
      expect(await service.hasAchievement("user-001", "FOUNDER")).toBe(true);
      expect(await service.hasAchievement("user-002", "FOUNDER")).toBe(true);
    });

    it("unique constraint: user cannot have same achievement twice", async () => {
      const r1 = await service.grantAchievementByKey({ userId: "user-001", key: "COLLECTOR", grantedBy: "system" });
      const r2 = await service.grantAchievementByKey({ userId: "user-001", key: "COLLECTOR", grantedBy: "system" });
      expect(r1.created).toBe(true);
      expect(r2.created).toBe(false);
      expect(r1.achievement.id).toBe(r2.achievement.id);
    });

    it("grantedAt is set on creation", async () => {
      const { achievement } = await service.grantAchievementByKey({
        userId: "user-001",
        key: "FIRST_LOGIN",
        grantedBy: "system",
      });
      expect(achievement.grantedAt).toBeInstanceOf(Date);
    });

    it("returned achievement embeds the definition with category", async () => {
      const { achievement } = await service.grantAchievementByKey({
        userId: "user-001",
        key: "FIRST_FOOTBALL_MATCH",
        grantedBy: "football-universe",
      });
      expect(achievement.achievement.category).toBe(AchievementCategory.SPORT);
    });
  });
});
