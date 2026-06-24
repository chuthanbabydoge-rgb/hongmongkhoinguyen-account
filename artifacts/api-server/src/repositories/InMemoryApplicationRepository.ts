import { randomUUID } from "node:crypto";
import type { Application, AccessToken } from "../models/application";
import type { IApplicationRepository } from "./IApplicationRepository";

export class InMemoryApplicationRepository implements IApplicationRepository {
  private applications: Map<string, Application> = new Map(); // id → Application
  private byClientId: Map<string, string> = new Map();        // clientId → id
  private bySlug: Map<string, string> = new Map();            // slug → id
  private tokens: Map<string, AccessToken> = new Map();       // token string → AccessToken

  async createApplication(app: Omit<Application, "id" | "createdAt">): Promise<Application> {
    const record: Application = {
      ...app,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.applications.set(record.id, record);
    this.byClientId.set(record.clientId, record.id);
    this.bySlug.set(record.slug, record.id);
    return record;
  }

  async findByClientId(clientId: string): Promise<Application | null> {
    const id = this.byClientId.get(clientId);
    if (!id) return null;
    return this.applications.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Application | null> {
    const id = this.bySlug.get(slug);
    if (!id) return null;
    return this.applications.get(id) ?? null;
  }

  async findById(id: string): Promise<Application | null> {
    return this.applications.get(id) ?? null;
  }

  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applications.values()).sort(
      (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
    );
  }

  async saveToken(token: Omit<AccessToken, "id" | "createdAt">): Promise<AccessToken> {
    const record: AccessToken = {
      ...token,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.tokens.set(record.token, record);
    return record;
  }

  async findToken(token: string): Promise<AccessToken | null> {
    return this.tokens.get(token) ?? null;
  }

  async revokeToken(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  clear(): void {
    this.applications.clear();
    this.byClientId.clear();
    this.bySlug.clear();
    this.tokens.clear();
  }
}
