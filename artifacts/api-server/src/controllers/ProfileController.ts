import type { Request, Response } from "express";
import type { ProfileService } from "../services/ProfileService";
import {
  ProfileNotFoundError,
  ProfileAlreadyExistsError,
  ValidationError,
  ForbiddenError,
} from "../services/ProfileService";

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
      const profile = await this.service.getMyProfile(userId);
      res.json({ profile });
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        const created = await this.service.createProfile(userId);
        res.status(201).json({ profile: created });
        return;
      }
      throw err;
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    if (!id) { res.status(400).json({ error: "Missing id parameter" }); return; }
    try {
      const profile = await this.service.getProfileById(id);
      res.json({ profile });
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        res.status(404).json({ error: "Profile not found" }); return;
      }
      throw err;
    }
  };

  getByUniverseId = async (req: Request, res: Response): Promise<void> => {
    const universeId = Array.isArray(req.params["universeId"])
      ? req.params["universeId"][0]
      : req.params["universeId"];
    if (!universeId) { res.status(400).json({ error: "Missing universeId" }); return; }
    try {
      const profile = await this.service.getProfileByUniverseId(universeId);
      res.json({ profile });
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        res.status(404).json({ error: "Profile not found" }); return;
      }
      throw err;
    }
  };

  getSharedMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
      const identity = await this.service.getSharedIdentity(userId);
      res.json({ identity });
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        res.status(404).json({ error: "Profile not found" }); return;
      }
      throw err;
    }
  };

  getSharedByUserId = async (req: Request, res: Response): Promise<void> => {
    const userId = Array.isArray(req.params["userId"])
      ? req.params["userId"][0]
      : req.params["userId"];
    if (!userId) { res.status(400).json({ error: "Missing userId" }); return; }
    try {
      const identity = await this.service.getSharedIdentity(userId);
      res.json({ identity });
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        res.status(404).json({ error: "Profile not found" }); return;
      }
      throw err;
    }
  };

  checkExists = async (req: Request, res: Response): Promise<void> => {
    const universeId = Array.isArray(req.params["universeId"])
      ? req.params["universeId"][0]
      : req.params["universeId"];
    if (!universeId) { res.status(400).json({ error: "Missing universeId" }); return; }
    const exists = await this.service.existsUniverseId(universeId);
    res.json({ exists });
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
      const profile = await this.service.updateMyProfile(userId, req.body);
      res.json({ profile });
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        res.status(404).json({ error: "Profile not found" }); return;
      }
      if (err instanceof ValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      if (err instanceof ProfileAlreadyExistsError) {
        res.status(409).json({ error: err.message }); return;
      }
      if (err instanceof ForbiddenError) {
        res.status(403).json({ error: err.message }); return;
      }
      throw err;
    }
  };
}
