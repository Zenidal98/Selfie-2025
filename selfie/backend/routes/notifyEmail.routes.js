import { Router } from "express";
import { notifyEmailController } from "../controllers/notifyEmail.controller.js";

const router = Router();

router.post("/", notifyEmailController);

export default router;
