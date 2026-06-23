import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Auth middleware — extracts userId from Bearer token.
 *
 * Token format matches the mock auth used by the Universe Account frontend:
 *   base64(JSON.stringify({ userId: string, exp: number }))
 *
 * HUB: Replace with JWT verification against Universe Hub's public key.
 * SUPABASE: Replace with supabase.auth.getUser(token)
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8")) as {
      userId: string;
      exp: number;
    };

    if (!payload.userId || typeof payload.userId !== "string") {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    if (payload.exp && payload.exp < Date.now()) {
      res.status(401).json({ error: "Token expired" });
      return;
    }

    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Malformed token" });
  }
}
