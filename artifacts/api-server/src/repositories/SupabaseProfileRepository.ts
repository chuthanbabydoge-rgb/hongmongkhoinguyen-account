import { eq, count as drizzleCount } from "drizzle-orm";
import type { Profile, UpdateProfileInput } from "../models/profile";
import type { CreateProfileInput, IProfileRepository } from "./IProfileRepository";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";

function toModel(row: typeof profilesTable.$inferSelect): Profile {
  return {
    id: row.id,
    userId: row.userId,
    universeId: row.universeId,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SupabaseProfileRepository implements IProfileRepository {
  async findById(id: string): Promise<Profile | null> {
    const rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, id))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async findByUniverseId(universeId: string): Promise<Profile | null> {
    const rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.universeId, universeId))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async create(input: CreateProfileInput): Promise<Profile> {
    const rows = await db
      .insert(profilesTable)
      .values({
        userId: input.userId,
        universeId: input.universeId,
        username: input.username ?? null,
        displayName: input.displayName ?? null,
        avatarUrl: input.avatarUrl ?? null,
        bio: input.bio ?? null,
      })
      .returning();
    if (!rows[0]) throw new Error("Insert failed — no row returned");
    return toModel(rows[0]);
  }

  async update(userId: string, input: UpdateProfileInput): Promise<Profile | null> {
    const updateData: Partial<typeof profilesTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.displayName !== undefined) updateData.displayName = input.displayName;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl || null;
    if (input.bio !== undefined) updateData.bio = input.bio;

    const rows = await db
      .update(profilesTable)
      .set(updateData)
      .where(eq(profilesTable.userId, userId))
      .returning();
    return rows[0] ? toModel(rows[0]) : null;
  }

  async count(): Promise<number> {
    const result = await db.select({ value: drizzleCount() }).from(profilesTable);
    return result[0]?.value ?? 0;
  }
}
