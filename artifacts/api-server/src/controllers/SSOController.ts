import type { Request, Response } from "express";
import type { SSOService } from "../services/SSOService";
import {
  ApplicationNotFoundError,
  InvalidClientError,
  InvalidTokenError,
  SSOValidationError,
  DuplicateSlugError,
} from "../services/SSOService";
import type { Permission } from "../models/application";

export class SSOController {
  constructor(private readonly service: SSOService) {}

  /** POST /api/sso/apps/register */
  handleRegisterApplication = async (req: Request, res: Response): Promise<void> => {
    const { name, slug, permissions } = req.body as {
      name?: string;
      slug?: string;
      permissions?: unknown;
    };

    if (!name || !slug || !permissions) {
      res.status(400).json({ error: "Missing required fields: name, slug, permissions" });
      return;
    }

    try {
      const app = await this.service.registerApplication(
        name,
        slug,
        permissions as Permission[],
      );
      res.status(201).json({
        application: {
          id:           app.id,
          name:         app.name,
          slug:         app.slug,
          clientId:     app.clientId,
          clientSecret: app.clientSecret,
          permissions:  app.permissions,
        },
      });
    } catch (err) {
      if (err instanceof DuplicateSlugError) {
        res.status(409).json({ error: err.message }); return;
      }
      if (err instanceof SSOValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** GET /api/sso/apps */
  handleGetApplications = async (_req: Request, res: Response): Promise<void> => {
    const apps = await this.service.getApplications();
    res.json({
      applications: apps.map((a) => ({
        id:          a.id,
        name:        a.name,
        slug:        a.slug,
        clientId:    a.clientId,
        permissions: a.permissions,
        isActive:    a.isActive,
        createdAt:   a.createdAt,
      })),
    });
  };

  /** POST /api/sso/token */
  handleGenerateToken = async (req: Request, res: Response): Promise<void> => {
    const { userId, clientId, clientSecret } = req.body as {
      userId?: string;
      clientId?: string;
      clientSecret?: string;
    };

    if (!userId || !clientId || !clientSecret) {
      res.status(400).json({ error: "Missing required fields: userId, clientId, clientSecret" });
      return;
    }

    try {
      const result = await this.service.generateAccessToken(userId, clientId, clientSecret);
      res.json({ token: result.token, expiresAt: result.expiresAt });
    } catch (err) {
      if (err instanceof InvalidClientError) {
        res.status(401).json({ error: err.message }); return;
      }
      if (err instanceof SSOValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** POST /api/sso/verify */
  handleVerifyToken = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body as { token?: string };

    if (!token) {
      res.status(400).json({ error: "Missing required field: token" });
      return;
    }

    try {
      const result = await this.service.verifyToken(token);
      res.json(result);
    } catch (err) {
      if (err instanceof InvalidTokenError) {
        res.status(401).json({ error: err.message }); return;
      }
      if (err instanceof SSOValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** POST /api/sso/revoke */
  handleRevokeToken = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body as { token?: string };

    if (!token) {
      res.status(400).json({ error: "Missing required field: token" });
      return;
    }

    try {
      await this.service.revokeToken(token);
      res.json({ revoked: true });
    } catch (err) {
      if (err instanceof SSOValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };
}
