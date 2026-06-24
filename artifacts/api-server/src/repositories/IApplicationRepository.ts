import type { Application, AccessToken } from "../models/application";

export interface IApplicationRepository {
  createApplication(app: Omit<Application, "id" | "createdAt">): Promise<Application>;
  findByClientId(clientId: string): Promise<Application | null>;
  findBySlug(slug: string): Promise<Application | null>;
  findById(id: string): Promise<Application | null>;
  getAllApplications(): Promise<Application[]>;
  saveToken(token: Omit<AccessToken, "id" | "createdAt">): Promise<AccessToken>;
  findToken(token: string): Promise<AccessToken | null>;
  revokeToken(token: string): Promise<void>;
}
