import express from "express";
import {
  createEvent,
  getEvents,
  deleteEvent,
  excludeOccurrence,
  toggleActivityCompletion,
  exportIcal,
  getEventById,
  patchPomodoroState,
  getCalendarReport,
  updateEvent
} from "../controllers/event.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// forza l'utilizzo di JWT, i controller useranno req.user.id
router.use(auth);

// GET -> eventi dell'utete (nel periodo di query)
router.get("/", getEvents);

// POST -> crea un evento 
router.post("/", createEvent);

// DELETE -> cancella un evento o serie ricorrente
router.delete("/:id", deleteEvent);

// PATCH -> esclude un'istanza singola di evento ricorrente
router.patch("/:id/exclude", excludeOccurrence);

// PATCH -> toggle di completamento attivita'
router.patch("/:id/toggle-complete", toggleActivityCompletion);

// GET -> export del calendario come .ics
router.get("/export", exportIcal);

// GET -> get del report per la homepage
router.get("/report", getCalendarReport);

router.get("/:id", auth, getEventById);

// PATCH -> sincronizza il timer Pomodoro del frontend col database, così se l’utente ricarica o cambia device non perde lo stato
router.patch("/:id/pomodoro/state", auth, patchPomodoroState);

// PATCH -> modifica un evento pre esistente
router.patch("/:id", updateEvent);

export default router;
