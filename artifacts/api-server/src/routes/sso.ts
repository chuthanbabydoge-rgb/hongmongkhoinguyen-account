import { Router, type IRouter } from "express";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.ssoController;

/**
 * POST /api/sso/apps/register
 * Register a new ecosystem application as an SSO client.
 * Body: { name, slug, permissions[] }
 */
router.post("/sso/apps/register", ctrl.handleRegisterApplication);

/**
 * GET /api/sso/apps
 * List all registered SSO applications.
 */
router.get("/sso/apps", ctrl.handleGetApplications);

/**
 * POST /api/sso/token
 * Generate a 30-day access token for a user under an application.
 * Body: { userId, clientId, clientSecret }
 */
router.post("/sso/token", ctrl.handleGenerateToken);

/**
 * POST /api/sso/verify
 * Verify an access token and return user identity + permissions.
 * Body: { token }
 */
router.post("/sso/verify", ctrl.handleVerifyToken);

/**
 * POST /api/sso/revoke
 * Revoke an access token immediately.
 * Body: { token }
 */
router.post("/sso/revoke", ctrl.handleRevokeToken);

export default router;
