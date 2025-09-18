import express from "express";
import {
  createPomodoroSession,
  getLastPomodoroByUser,
} from "../controllers/pomodoro.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// tutte le route Pomodoro richiedono un JWT valido e devono passare per auth; i controller usano poi req.user.id per identificare l’utente
router.use(auth);

// POST -> crea una nuova sessione pomodoro
router.post("/", createPomodoroSession);

// GET -> prende l'ultima sessione di pomodoro dell'utente
router.get("/last/:userId", getLastPomodoroByUser);

export default router;
