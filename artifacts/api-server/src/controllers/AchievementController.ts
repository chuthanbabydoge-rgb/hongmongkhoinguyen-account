import type { Request, Response } from "express";
import type { AchievementService } from "../services/AchievementService";
import { AchievementNotFoundError, AchievementValidationError } from "../services/AchievementService";

export class AchievementController {
  constructor(private readonly service: AchievementService) {}

  /**
   * GET /api/achievements
   * Returns all achievement definitions.
   */
  getAll = async (_req: Request, res: Response): Promise<void> => {
    const achievements = await this.service.getAll();
    res.json({ achievements });
  };

  /**
   * GET /api/achievements/me
   * Returns achievements earned by the authenticated user.
   */
  getMyAchievements = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const achievements = await this.service.getUserAchievements(userId);
    res.json({ achievements });
  };

  /**
   * GET /api/achievements/count
   * Returns the count of achievements earned by the authenticated user.
   */
  getMyCount = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const count = await this.service.count(userId);
    res.json({ count });
  };

  /**
   * POST /api/achievements/grant
   * Grants an achievement to a user by key.
   * Body: { userId, key, grantedBy, metadata? }
   * Response: { created: boolean, achievement: UserAchievement }
   */
  grant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { achievement, created } = await this.service.grantAchievementByKey(req.body);
      res.status(created ? 201 : 200).json({ created, achievement });
    } catch (err) {
      if (err instanceof AchievementNotFoundError) {
        res.status(404).json({ error: err.message }); return;
      }
      if (err instanceof AchievementValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };
}
