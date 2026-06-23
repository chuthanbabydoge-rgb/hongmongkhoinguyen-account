import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.identityController;

/**
 * GET /api/identity/me
 * Full Identity Bridge for authenticated user.
 * Response: { profile, avatar }
 * Used by: Universe Hub, Football Universe, Animal Evolution, World Creator, SafePass
 */
router.get("/identity/me", authMiddleware, ctrl.getMe);

/**
 * GET /api/identity/:universeId
 * Public identity by Universe ID — no private fields.
 * Response: { universeId, displayName, avatarUrl, reputationLevel }
 */
router.get("/identity/:universeId", ctrl.getByUniverseId);

export default router;
