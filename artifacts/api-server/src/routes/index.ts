import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import avatarRouter from "./avatar";
import identityRouter from "./identity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(avatarRouter);
router.use(identityRouter);

export default router;
