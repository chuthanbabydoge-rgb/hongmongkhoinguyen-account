import type { Request, Response, NextFunction } from "express";
import type { IProfileRepository } from "../repositories/IProfileRepository";

/**
 * requireProfileOwner — ownership middleware factory.
 *
 * Reads profileId from req.params.profileId (or custom param name).
 * Fetches the profile and checks profile.userId === req.userId.
 * If mismatch → 403 Forbidden.
 * If not found → 404.
 *
 * Usage:
 *   router.patch("/profile/:profileId", authMiddleware, requireProfileOwner(repo), ctrl.update);
 */
export function requireProfileOwner(
  repo: IProfileRepository,
  paramName = "profileId",
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const profileId = Array.isArray(req.params[paramName])
      ? req.params[paramName]![0]
      : req.params[paramName];

    if (!profileId) {
      res.status(400).json({ error: `Missing route param: ${paramName}` });
      return;
    }

    const profile = await repo.findById(profileId);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    if (profile.userId !== userId) {
      res.status(403).json({ error: "Forbidden — you do not own this profile" });
      return;
    }

    next();
  };
}
