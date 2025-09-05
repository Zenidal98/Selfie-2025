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
} from "../controllers/event.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All events routes require a valid JWT; controllers will use req.user.id
router.use(auth);

// GET -> events for the logged-in user (period via query)
router.get("/", getEvents);

// POST -> create a new manual event for the logged-in user
router.post("/", createEvent);

// DELETE -> delete an existing event (and its recurrence, if any)
router.delete("/:id", deleteEvent);

// PATCH -> exclude a single instance of a recurring event
router.patch("/:id/exclude", excludeOccurrence);

// PATCH -> toggle an activity's completion
router.patch("/:id/toggle-complete", toggleActivityCompletion);

// GET -> export the user's calendar as .ics
router.get("/export", exportIcal);

router.get("/:id", auth, getEventById);
router.patch("/:id/pomodoro/state", auth, patchPomodoroState);

// GET -> get the homepage report for the calendar activities
router.get("/report", getCalendarReport);

export default router;
