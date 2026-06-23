import { z } from "zod";

/**
 * SharedIdentity — DTO công khai, dùng chung cho toàn bộ ecosystem:
 * Universe Hub, Football Universe, Animal Evolution, World Creator,
 * Exchange Hub, SafePass.
 *
 * KHÔNG expose: email, phone, auth token, password, internal DB ids.
 */
export const SharedIdentitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  universeId: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  avatarId: z.string().uuid().nullable(),
  reputationLevel: z.string(),
  createdAt: z.date().nullable(),
});

export type SharedIdentity = z.infer<typeof SharedIdentitySchema>;

/**
 * PublicIdentity — minimal public profile, returned on GET /api/identity/:universeId
 * KHÔNG expose: email, phone, token, userId interne.
 */
export const PublicIdentitySchema = z.object({
  universeId: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  reputationLevel: z.string(),
});

export type PublicIdentity = z.infer<typeof PublicIdentitySchema>;

/**
 * IdentityBridge — combined response for GET /api/identity/me
 * Used by all ecosystem apps to bootstrap a session.
 */
export interface IdentityBridge {
  profile: {
    id: string;
    universeId: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date | null;
  };
  avatar: {
    id: string;
    frame: string | null;
    background: string | null;
    title: string | null;
    accessories: string[] | null;
    avatarName: string | null;
  } | null;
}
