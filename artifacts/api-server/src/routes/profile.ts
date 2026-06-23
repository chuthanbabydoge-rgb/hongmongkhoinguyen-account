import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.profileController;

/**
 * GET /api/profile/me
 * Returns the profile of the authenticated user.
 * Auto-creates one with a new Universe ID if it doesn't exist.
 */
router.get("/profile/me", authMiddleware, ctrl.getMe);

/**
 * GET /api/profile/shared/me
 * Returns SharedIdentity DTO for the authenticated user.
 */
router.get("/profile/shared/me", authMiddleware, ctrl.getSharedMe);

/**
 * GET /api/profile/shared/:userId
 * Returns SharedIdentity DTO for any userId.
 */
router.get("/profile/shared/:userId", ctrl.getSharedByUserId);

/**
 * GET /api/profile/universe/:universeId
 * Returns a profile by Universe ID (e.g. UNI-000001).
 */
router.get("/profile/universe/:universeId", ctrl.getByUniverseId);

/**
 * GET /api/profile/exists/:universeId
 * Checks if a Universe ID is taken. Response: { exists: boolean }
 */
router.get("/profile/exists/:universeId", ctrl.checkExists);

/**
 * GET /api/profile/:id
 * Returns a profile by its UUID (public profile lookup).
 */
router.get("/profile/:id", ctrl.getById);

/**
 * PATCH /api/profile/me
 * Updates display_name, avatar_url, or bio for the authenticated user.
 * Validation: display_name max 100 chars, bio max 500 chars.
 */
router.patch("/profile/me", authMiddleware, ctrl.updateMe);

export default router;
