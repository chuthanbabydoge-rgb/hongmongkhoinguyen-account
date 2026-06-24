import { z } from "zod";

// ─── Permission enum ───────────────────────────────────────────────────────────

export const Permission = {
  PROFILE_READ:      "PROFILE_READ",
  AVATAR_READ:       "AVATAR_READ",
  ACHIEVEMENT_READ:  "ACHIEVEMENT_READ",
  NOTIFICATION_READ: "NOTIFICATION_READ",
  REPUTATION_READ:   "REPUTATION_READ",
  ACTIVITY_READ:     "ACTIVITY_READ",
  IDENTITY_READ:     "IDENTITY_READ",
  FULL_ACCESS:       "FULL_ACCESS",
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export const PermissionSchema = z.enum([
  "PROFILE_READ",
  "AVATAR_READ",
  "ACHIEVEMENT_READ",
  "NOTIFICATION_READ",
  "REPUTATION_READ",
  "ACTIVITY_READ",
  "IDENTITY_READ",
  "FULL_ACCESS",
]);

// ─── Core models ───────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  name: string;
  slug: string;
  clientId: string;
  clientSecret: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date | null;
}

export interface AccessToken {
  id: string;
  userId: string;
  applicationId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date | null;
}

export interface VerifyTokenResponse {
  userId: string;
  universeId: string;
  displayName: string;
  avatarUrl: string | null;
  permissions: Permission[];
}

// ─── Zod schemas ───────────────────────────────────────────────────────────────

export const CreateApplicationRequestSchema = z.object({
  name:        z.string().min(1, "name is required"),
  slug:        z.string().min(1, "slug is required").regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with dashes"),
  permissions: z.array(PermissionSchema).min(1, "at least one permission is required"),
});
export type CreateApplicationRequest = z.infer<typeof CreateApplicationRequestSchema>;

export const GenerateTokenRequestSchema = z.object({
  userId:       z.string().min(1, "userId is required"),
  clientId:     z.string().min(1, "clientId is required"),
  clientSecret: z.string().min(1, "clientSecret is required"),
});
export type GenerateTokenRequest = z.infer<typeof GenerateTokenRequestSchema>;

export const VerifyTokenRequestSchema = z.object({
  token: z.string().min(1, "token is required"),
});
export type VerifyTokenRequest = z.infer<typeof VerifyTokenRequestSchema>;

export const RevokeTokenRequestSchema = z.object({
  token: z.string().min(1, "token is required"),
});
export type RevokeTokenRequest = z.infer<typeof RevokeTokenRequestSchema>;
