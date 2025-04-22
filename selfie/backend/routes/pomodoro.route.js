import express from "express";
import { createPomodoroSession, getLastPomodoroByUser } from "../controllers/pomodoro.controller.js";

const router = express.Router();

router.post("/", createPomodoroSession);               // POST /api/pomodoro
router.get("/last/:userId", getLastPomodoroByUser);    // GET /api/pomodoro/last/123abc

export default router;
