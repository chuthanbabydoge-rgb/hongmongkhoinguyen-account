import { z } from "zod";

export const UNIVERSE_ID_REGEX = /^UNI-\d{6}$/;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  universeId: z.string().regex(UNIVERSE_ID_REGEX),
  username: z.string().nullable(),
  displayName: z.string().max(100).nullable(),
  avatarUrl: z.string().url().nullable().or(z.literal("").transform(() => null)),
  bio: z.string().max(500).nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export function formatUniverseId(seq: number): string {
  return `UNI-${String(seq).padStart(6, "0")}`;
}
