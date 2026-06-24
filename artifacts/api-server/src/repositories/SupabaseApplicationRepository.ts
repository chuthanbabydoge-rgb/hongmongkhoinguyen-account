import { eq } from "drizzle-orm";
import type { Application, AccessToken, Permission } from "../models/application";
import type { IApplicationRepository } from "./IApplicationRepository";
import { db } from "@workspace/db";
import { applicationsTable, accessTokensTable } from "@workspace/db/schema";

function toApplicationModel(row: typeof applicationsTable.$inferSelect): Application {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    clientId: row.clientId,
    clientSecret: row.clientSecret,
    permissions: (row.permissions as Permission[]) ?? [],
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

function toAccessTokenModel(row: typeof accessTokensTable.$inferSelect): AccessToken {
  return {
    id: row.id,
    userId: row.userId,
    applicationId: row.applicationId,
    token: row.token,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export class SupabaseApplicationRepository implements IApplicationRepository {
  async createApplication(app: Omit<Application, "id" | "createdAt">): Promise<Application> {
    const rows = await db
      .insert(applicationsTable)
      .values({
        name:         app.name,
        slug:         app.slug,
        clientId:     app.clientId,
        clientSecret: app.clientSecret,
        permissions:  app.permissions,
        isActive:     app.isActive,
      })
      .returning();
    return toApplicationModel(rows[0]!);
  }

  async findByClientId(clientId: string): Promise<Application | null> {
    const rows = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.clientId, clientId))
      .limit(1);
    return rows[0] ? toApplicationModel(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Application | null> {
    const rows = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.slug, slug))
      .limit(1);
    return rows[0] ? toApplicationModel(rows[0]) : null;
  }

  async findById(id: string): Promise<Application | null> {
    const rows = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, id))
      .limit(1);
    return rows[0] ? toApplicationModel(rows[0]) : null;
  }

  async getAllApplications(): Promise<Application[]> {
    const rows = await db.select().from(applicationsTable);
    return rows.map(toApplicationModel);
  }

  async saveToken(token: Omit<AccessToken, "id" | "createdAt">): Promise<AccessToken> {
    const rows = await db
      .insert(accessTokensTable)
      .values({
        userId:        token.userId,
        applicationId: token.applicationId,
        token:         token.token,
        expiresAt:     token.expiresAt,
      })
      .returning();
    return toAccessTokenModel(rows[0]!);
  }

  async findToken(token: string): Promise<AccessToken | null> {
    const rows = await db
      .select()
      .from(accessTokensTable)
      .where(eq(accessTokensTable.token, token))
      .limit(1);
    return rows[0] ? toAccessTokenModel(rows[0]) : null;
  }

  async revokeToken(token: string): Promise<void> {
    await db.delete(accessTokensTable).where(eq(accessTokensTable.token, token));
  }
}
