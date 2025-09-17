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

router.use(auth);

// POST -> crea una nuova nota
router.post("/", saveNotes);

// GET -> get del report homepage
router.get("/recent", getMostRecentNote);

// GET -> get delle note dell'utente
router.get("/", getUserNotes);

// PUT -> salva le modifiche ad una nota preesistente
router.put("/:noteId", updateNote);

// DELETE -> cancella una nota
router.delete("/:noteId", deleteNote);

export default router;
