import type { Request, Response } from "express";
import type { IdentityService } from "../services/IdentityService";
import { ProfileNotFoundError, ForbiddenError } from "../services/ProfileService";

export class IdentityController {
  constructor(private readonly service: IdentityService) {}

  /** GET /api/identity/me — full bridge payload for ecosystem apps */
  getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
      const identity = await this.service.getMyIdentity(userId);
      res.json(identity);
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        res.status(404).json({ error: "Profile not found" }); return;
      }
      throw err;
    }
  };

  /** GET /api/identity/:universeId — public identity (no private fields) */
  getByUniverseId = async (req: Request, res: Response): Promise<void> => {
    const universeId = Array.isArray(req.params["universeId"])
      ? req.params["universeId"][0]
      : req.params["universeId"];
    if (!universeId) { res.status(400).json({ error: "Missing universeId" }); return; }
    try {
      const identity = await this.service.getPublicIdentity(universeId);
      res.json(identity);
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        res.status(404).json({ error: "Identity not found" }); return;
      }
      throw err;
    }
  };
}
