import { describe, it, expect, beforeEach } from "vitest";
import { SSOService, ApplicationNotFoundError, InvalidClientError, InvalidTokenError, SSOValidationError, DuplicateSlugError } from "../services/SSOService";
import { InMemoryApplicationRepository } from "../repositories/InMemoryApplicationRepository";
import { InMemoryProfileRepository } from "../repositories/InMemoryProfileRepository";
import { InMemoryAvatarRepository } from "../repositories/InMemoryAvatarRepository";
import { ProfileService } from "../services/ProfileService";
import { AvatarService } from "../services/AvatarService";
import { IdentityService } from "../services/IdentityService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeServices() {
  const appRepo     = new InMemoryApplicationRepository();
  const profileRepo = new InMemoryProfileRepository();
  const avatarRepo  = new InMemoryAvatarRepository();
  const profileService  = new ProfileService(profileRepo);
  const avatarService   = new AvatarService(avatarRepo);
  const identityService = new IdentityService(profileRepo, avatarRepo);
  const ssoService = new SSOService(appRepo, profileService, avatarService, identityService);
  return { appRepo, profileRepo, avatarRepo, profileService, avatarService, identityService, ssoService };
}

const PERMS_BASIC = ["PROFILE_READ", "AVATAR_READ"] as const;

async function seedApp(ssoService: SSOService, slug = "football-universe") {
  return ssoService.registerApplication("Football Universe", slug, [...PERMS_BASIC]);
}

async function seedProfile(profileService: ProfileService, userId = "user-001") {
  return profileService.createProfile(userId);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Sprint 8 — Universe SSO Layer", () => {
  let svc: ReturnType<typeof makeServices>;

  beforeEach(() => {
    svc = makeServices();
  });

  // ─── registerApplication ────────────────────────────────────────────────────

  describe("registerApplication", () => {
    it("creates application with given name", async () => {
      const app = await seedApp(svc.ssoService);
      expect(app.name).toBe("Football Universe");
    });

    it("creates application with given slug", async () => {
      const app = await seedApp(svc.ssoService);
      expect(app.slug).toBe("football-universe");
    });

    it("generates a clientId automatically", async () => {
      const app = await seedApp(svc.ssoService);
      expect(app.clientId).toBeTruthy();
      expect(app.clientId).toMatch(/^cid_/);
    });

    it("generates a clientSecret automatically", async () => {
      const app = await seedApp(svc.ssoService);
      expect(app.clientSecret).toBeTruthy();
      expect(app.clientSecret).toMatch(/^csk_/);
    });

    it("assigns a uuid id", async () => {
      const app = await seedApp(svc.ssoService);
      expect(app.id).toBeTruthy();
      expect(app.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("stores permissions", async () => {
      const app = await seedApp(svc.ssoService);
      expect(app.permissions).toEqual(["PROFILE_READ", "AVATAR_READ"]);
    });

    it("sets isActive to true by default", async () => {
      const app = await seedApp(svc.ssoService);
      expect(app.isActive).toBe(true);
    });

    it("rejects duplicate slug", async () => {
      await seedApp(svc.ssoService);
      await expect(seedApp(svc.ssoService)).rejects.toThrow(DuplicateSlugError);
    });

    it("allows different slugs", async () => {
      const a1 = await seedApp(svc.ssoService, "football-universe");
      const a2 = await seedApp(svc.ssoService, "world-creator");
      expect(a1.id).not.toBe(a2.id);
    });

    it("generates unique clientIds across apps", async () => {
      const a1 = await seedApp(svc.ssoService, "app-one");
      const a2 = await seedApp(svc.ssoService, "app-two");
      expect(a1.clientId).not.toBe(a2.clientId);
    });

    it("generates unique clientSecrets across apps", async () => {
      const a1 = await seedApp(svc.ssoService, "app-one");
      const a2 = await seedApp(svc.ssoService, "app-two");
      expect(a1.clientSecret).not.toBe(a2.clientSecret);
    });

    it("stores FULL_ACCESS permission", async () => {
      const app = await svc.ssoService.registerApplication("Admin App", "admin-app", ["FULL_ACCESS"]);
      expect(app.permissions).toContain("FULL_ACCESS");
    });

    it("stores all permission types", async () => {
      const allPerms = [
        "PROFILE_READ", "AVATAR_READ", "ACHIEVEMENT_READ",
        "NOTIFICATION_READ", "REPUTATION_READ", "ACTIVITY_READ",
        "IDENTITY_READ", "FULL_ACCESS",
      ] as const;
      const app = await svc.ssoService.registerApplication("Full App", "full-app", [...allPerms]);
      expect(app.permissions).toHaveLength(8);
    });

    it("throws SSOValidationError for empty name", async () => {
      await expect(
        svc.ssoService.registerApplication("", "some-slug", ["PROFILE_READ"])
      ).rejects.toThrow(SSOValidationError);
    });

    it("throws SSOValidationError for empty slug", async () => {
      await expect(
        svc.ssoService.registerApplication("App", "", ["PROFILE_READ"])
      ).rejects.toThrow(SSOValidationError);
    });

    it("throws SSOValidationError for invalid slug format", async () => {
      await expect(
        svc.ssoService.registerApplication("App", "UPPER_CASE", ["PROFILE_READ"])
      ).rejects.toThrow(SSOValidationError);
    });

    it("throws SSOValidationError for empty permissions", async () => {
      await expect(
        svc.ssoService.registerApplication("App", "some-slug", [])
      ).rejects.toThrow(SSOValidationError);
    });
  });

  // ─── getApplications ────────────────────────────────────────────────────────

  describe("getApplications", () => {
    it("returns empty array when no apps", async () => {
      const apps = await svc.ssoService.getApplications();
      expect(apps).toHaveLength(0);
    });

    it("returns all registered applications", async () => {
      await seedApp(svc.ssoService, "app-one");
      await seedApp(svc.ssoService, "app-two");
      const apps = await svc.ssoService.getApplications();
      expect(apps).toHaveLength(2);
    });

    it("returns apps with correct data", async () => {
      await seedApp(svc.ssoService);
      const [app] = await svc.ssoService.getApplications();
      expect(app!.name).toBe("Football Universe");
      expect(app!.slug).toBe("football-universe");
    });

    it("returns many apps", async () => {
      const slugs = ["app-1", "app-2", "app-3", "app-4", "app-5"];
      for (const slug of slugs) {
        await svc.ssoService.registerApplication(slug, slug, ["PROFILE_READ"]);
      }
      const apps = await svc.ssoService.getApplications();
      expect(apps).toHaveLength(5);
    });
  });

  // ─── generateAccessToken ────────────────────────────────────────────────────

  describe("generateAccessToken", () => {
    it("returns a token string", async () => {
      const app = await seedApp(svc.ssoService);
      const result = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      expect(typeof result.token).toBe("string");
      expect(result.token).toMatch(/^sso_/);
    });

    it("returns an expiresAt date", async () => {
      const app = await seedApp(svc.ssoService);
      const result = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("token expires ~30 days from now", async () => {
      const app = await seedApp(svc.ssoService);
      const before = new Date();
      const result = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const diffDays = (result.expiresAt.getTime() - before.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(29);
      expect(diffDays).toBeLessThan(31);
    });

    it("generates unique tokens for same user", async () => {
      const app = await seedApp(svc.ssoService);
      const t1 = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const t2 = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      expect(t1.token).not.toBe(t2.token);
    });

    it("throws InvalidClientError for wrong clientId", async () => {
      await seedApp(svc.ssoService);
      await expect(
        svc.ssoService.generateAccessToken("user-001", "wrong-client-id", "any-secret")
      ).rejects.toThrow(InvalidClientError);
    });

    it("throws InvalidClientError for wrong clientSecret", async () => {
      const app = await seedApp(svc.ssoService);
      await expect(
        svc.ssoService.generateAccessToken("user-001", app.clientId, "wrong-secret")
      ).rejects.toThrow(InvalidClientError);
    });

    it("throws InvalidClientError for inactive application", async () => {
      const app = await seedApp(svc.ssoService);
      // manually set inactive via repo
      const record = await svc.appRepo.findByClientId(app.clientId);
      svc.appRepo["applications"].set(record!.id, { ...record!, isActive: false });

      await expect(
        svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret)
      ).rejects.toThrow(InvalidClientError);
    });

    it("generates tokens for multiple users", async () => {
      const app = await seedApp(svc.ssoService);
      const t1 = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const t2 = await svc.ssoService.generateAccessToken("user-002", app.clientId, app.clientSecret);
      expect(t1.token).not.toBe(t2.token);
    });

    it("generates tokens for multiple applications", async () => {
      const a1 = await seedApp(svc.ssoService, "app-one");
      const a2 = await seedApp(svc.ssoService, "app-two");
      const t1 = await svc.ssoService.generateAccessToken("user-001", a1.clientId, a1.clientSecret);
      const t2 = await svc.ssoService.generateAccessToken("user-001", a2.clientId, a2.clientSecret);
      expect(t1.token).not.toBe(t2.token);
    });
  });

  // ─── verifyToken ────────────────────────────────────────────────────────────

  describe("verifyToken", () => {
    it("verifies a valid token and returns userId", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.userId).toBe("user-001");
    });

    it("returns permissions from the application", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toEqual(["PROFILE_READ", "AVATAR_READ"]);
    });

    it("returns universeId from profile", async () => {
      const profile = await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.universeId).toBe(profile.universeId);
    });

    it("returns displayName from profile", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(typeof result.displayName).toBe("string");
    });

    it("returns avatarUrl (null if not set)", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect("avatarUrl" in result).toBe(true);
    });

    it("returns correct payload shape", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("universeId");
      expect(result).toHaveProperty("displayName");
      expect(result).toHaveProperty("avatarUrl");
      expect(result).toHaveProperty("permissions");
    });

    it("throws InvalidTokenError for invalid token string", async () => {
      await expect(
        svc.ssoService.verifyToken("totally-invalid-token")
      ).rejects.toThrow(InvalidTokenError);
    });

    it("throws InvalidTokenError for expired token", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);

      // Force expiry in the past
      const record = await svc.appRepo.findToken(token);
      svc.appRepo["tokens"].set(token, { ...record!, expiresAt: new Date(Date.now() - 1000) });

      await expect(svc.ssoService.verifyToken(token)).rejects.toThrow(InvalidTokenError);
    });

    it("throws InvalidTokenError for revoked token", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      await svc.ssoService.revokeToken(token);
      await expect(svc.ssoService.verifyToken(token)).rejects.toThrow(InvalidTokenError);
    });

    it("throws InvalidTokenError when application is inactive", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);

      // Deactivate app
      svc.appRepo["applications"].set(app.id, { ...app, isActive: false });

      await expect(svc.ssoService.verifyToken(token)).rejects.toThrow(InvalidTokenError);
    });

    it("handles missing profile gracefully (returns Unknown)", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-no-profile", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.displayName).toBe("Unknown");
    });

    it("isolates tokens per user", async () => {
      await seedProfile(svc.profileService, "user-001");
      await seedProfile(svc.profileService, "user-002");
      const app = await seedApp(svc.ssoService);
      const { token: t1 } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const { token: t2 } = await svc.ssoService.generateAccessToken("user-002", app.clientId, app.clientSecret);
      const r1 = await svc.ssoService.verifyToken(t1);
      const r2 = await svc.ssoService.verifyToken(t2);
      expect(r1.userId).toBe("user-001");
      expect(r2.userId).toBe("user-002");
    });

    it("future expiry is valid", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      // verify token with a future expiry (default 30d) — should not throw
      await expect(svc.ssoService.verifyToken(token)).resolves.not.toThrow();
    });

    it("verifies PROFILE_READ permission in result", async () => {
      await seedProfile(svc.profileService);
      const app = await svc.ssoService.registerApplication("P App", "p-app", ["PROFILE_READ"]);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toContain("PROFILE_READ");
    });

    it("verifies AVATAR_READ permission in result", async () => {
      await seedProfile(svc.profileService);
      const app = await svc.ssoService.registerApplication("A App", "a-app", ["AVATAR_READ"]);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toContain("AVATAR_READ");
    });

    it("verifies ACHIEVEMENT_READ permission", async () => {
      await seedProfile(svc.profileService);
      const app = await svc.ssoService.registerApplication("Ach App", "ach-app", ["ACHIEVEMENT_READ"]);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toContain("ACHIEVEMENT_READ");
    });

    it("verifies NOTIFICATION_READ permission", async () => {
      await seedProfile(svc.profileService);
      const app = await svc.ssoService.registerApplication("Notif App", "notif-app", ["NOTIFICATION_READ"]);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toContain("NOTIFICATION_READ");
    });

    it("verifies REPUTATION_READ permission", async () => {
      await seedProfile(svc.profileService);
      const app = await svc.ssoService.registerApplication("Rep App", "rep-app", ["REPUTATION_READ"]);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toContain("REPUTATION_READ");
    });

    it("verifies ACTIVITY_READ permission", async () => {
      await seedProfile(svc.profileService);
      const app = await svc.ssoService.registerApplication("Act App", "act-app", ["ACTIVITY_READ"]);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toContain("ACTIVITY_READ");
    });

    it("verifies IDENTITY_READ permission", async () => {
      await seedProfile(svc.profileService);
      const app = await svc.ssoService.registerApplication("Id App", "id-app", ["IDENTITY_READ"]);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toContain("IDENTITY_READ");
    });

    it("verifies FULL_ACCESS permission", async () => {
      await seedProfile(svc.profileService);
      const app = await svc.ssoService.registerApplication("FA App", "fa-app", ["FULL_ACCESS"]);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.permissions).toContain("FULL_ACCESS");
    });

    it("multiple tokens for same user are all independently valid", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token: t1 } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const { token: t2 } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const r1 = await svc.ssoService.verifyToken(t1);
      const r2 = await svc.ssoService.verifyToken(t2);
      expect(r1.userId).toBe("user-001");
      expect(r2.userId).toBe("user-001");
    });
  });

  // ─── revokeToken ────────────────────────────────────────────────────────────

  describe("revokeToken", () => {
    it("revokes a valid token", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      await svc.ssoService.revokeToken(token);
      await expect(svc.ssoService.verifyToken(token)).rejects.toThrow(InvalidTokenError);
    });

    it("revoking twice does not throw", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      await svc.ssoService.revokeToken(token);
      await expect(svc.ssoService.revokeToken(token)).resolves.not.toThrow();
    });

    it("revoking one token does not affect others", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token: t1 } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const { token: t2 } = await svc.ssoService.generateAccessToken("user-002", app.clientId, app.clientSecret);
      await svc.ssoService.revokeToken(t1);
      const result = await svc.ssoService.verifyToken(t2);
      expect(result.userId).toBe("user-002");
    });

    it("token is no longer findable after revoke", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      await svc.ssoService.revokeToken(token);
      const found = await svc.appRepo.findToken(token);
      expect(found).toBeNull();
    });

    it("revoking nonexistent token silently succeeds", async () => {
      await expect(svc.ssoService.revokeToken("sso_nonexistent_token")).resolves.not.toThrow();
    });
  });

  // ─── Timestamp & persistence ─────────────────────────────────────────────────

  describe("timestamps and persistence", () => {
    it("application has a createdAt timestamp", async () => {
      const app = await seedApp(svc.ssoService);
      expect(app.createdAt).toBeInstanceOf(Date);
    });

    it("token persists in repository", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const found = await svc.appRepo.findToken(token);
      expect(found).not.toBeNull();
      expect(found!.userId).toBe("user-001");
    });

    it("application persists and is retrievable by clientId", async () => {
      const app = await seedApp(svc.ssoService);
      const found = await svc.appRepo.findByClientId(app.clientId);
      expect(found).not.toBeNull();
      expect(found!.slug).toBe("football-universe");
    });

    it("application persists and is retrievable by slug", async () => {
      const app = await seedApp(svc.ssoService);
      const found = await svc.appRepo.findBySlug(app.slug);
      expect(found).not.toBeNull();
      expect(found!.clientId).toBe(app.clientId);
    });

    it("duplicate clientIds are prevented by unique generation", async () => {
      const a1 = await seedApp(svc.ssoService, "app-one");
      const a2 = await seedApp(svc.ssoService, "app-two");
      expect(a1.clientId).not.toBe(a2.clientId);
    });

    it("duplicate tokens are prevented by unique generation", async () => {
      const app = await seedApp(svc.ssoService);
      const tokens = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          svc.ssoService.generateAccessToken(`user-${i}`, app.clientId, app.clientSecret)
        )
      );
      const tokenStrings = tokens.map((t) => t.token);
      const unique = new Set(tokenStrings);
      expect(unique.size).toBe(10);
    });

    it("token expiresAt is in the future", async () => {
      const app = await seedApp(svc.ssoService);
      const { expiresAt } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("past expiry edge case is rejected", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      svc.appRepo["tokens"].set(token, {
        ...(await svc.appRepo.findToken(token))!,
        expiresAt: new Date(0),
      });
      await expect(svc.ssoService.verifyToken(token)).rejects.toThrow(InvalidTokenError);
    });

    it("application isolation: many apps coexist", async () => {
      const slugs = ["hub", "football", "animals", "worlds", "safepass", "exchange"];
      const apps = await Promise.all(
        slugs.map((s) => svc.ssoService.registerApplication(s, s, ["PROFILE_READ"]))
      );
      expect(apps).toHaveLength(6);
      const all = await svc.ssoService.getApplications();
      expect(all).toHaveLength(6);
    });

    it("many tokens coexist for different users", async () => {
      const app = await seedApp(svc.ssoService);
      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          svc.ssoService.generateAccessToken(`user-${i}`, app.clientId, app.clientSecret)
        )
      );
      expect(results).toHaveLength(20);
    });
  });

  // ─── Integration ─────────────────────────────────────────────────────────────

  describe("integration with profile, avatar, identity", () => {
    it("verifyToken uses real profile data when available", async () => {
      const profile = await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.universeId).toBe(profile.universeId);
    });

    it("verifyToken returns consistent universeId format", async () => {
      await seedProfile(svc.profileService);
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("user-001", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.universeId).toMatch(/^UNI-\d{6}$/);
    });

    it("verifyToken returns fallback for user without profile", async () => {
      const app = await seedApp(svc.ssoService);
      const { token } = await svc.ssoService.generateAccessToken("ghost-user", app.clientId, app.clientSecret);
      const result = await svc.ssoService.verifyToken(token);
      expect(result.userId).toBe("ghost-user");
      expect(result.displayName).toBe("Unknown");
    });
  });
});
