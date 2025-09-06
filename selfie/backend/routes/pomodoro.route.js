import express from "express";
import {
  createPomodoroSession,
  getLastPomodoroByUser,
} from "../controllers/pomodoro.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All pomodoro routes require a valid JWT; controllers will use req.user.id
router.use(auth);

// POST -> create a new Pomodoro session for the logged-in user
router.post("/", createPomodoroSession);

// GET -> fetch the last Pomodoro session of the logged-in user
router.get("/last/:userId", getLastPomodoroByUser);

export default router;
