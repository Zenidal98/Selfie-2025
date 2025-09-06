import express from "express";
import {
  saveNotes,
  getUserNotes,
  updateNote,
  deleteNote,
  getMostRecentNote,
} from "../controllers/notes.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All notes routes require a valid JWT; controllers will use req.user.id
router.use(auth);

// POST -> create a new note for the logged-in user
router.post("/", saveNotes);

// GET -> get the the homepage report
router.get("/recent", getMostRecentNote);

// GET -> get notes of the logged-in user
router.get("/", getUserNotes);

// PUT -> update a note owned by the logged-in user
router.put("/:noteId", updateNote);

// DELETE -> delete a note owned by the logged-in user
router.delete("/:noteId", deleteNote);

export default router;
