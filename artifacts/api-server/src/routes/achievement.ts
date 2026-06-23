import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.achievementController;

/**
 * GET /api/achievements
 * All achievement definitions. Public — no auth required.
 */
router.get("/achievements", ctrl.getAll);

/**
 * GET /api/achievements/me
 * Achievements earned by the authenticated user.
 */
router.get("/achievements/me", authMiddleware, ctrl.getMyAchievements);

/**
 * GET /api/achievements/count
 * Count of achievements earned by the authenticated user.
 */
router.get("/achievements/count", authMiddleware, ctrl.getMyCount);

/**
 * POST /api/achievements/grant
 * Grant an achievement to a user by key.
 * Body: { userId, key, grantedBy, metadata? }
 * Called by ecosystem apps (Football Universe, Marketplace, etc.)
 */
router.post("/achievements/grant", ctrl.grant);

export default router;
