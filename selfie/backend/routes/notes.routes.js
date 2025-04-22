import express from "express";
import { saveNotes, getUserNotes, updateNote, deleteNote } from "../controllers/notes.controller.js"
const router = express.Router(); 

// POST -> nuova nota
router.post('/save', saveNotes);

// GET -> note dell'utente 
router.get('/:userId', getUserNotes);

// PUT -> modifica nota 
router.put('/:noteId', updateNote);

// DELETE -> cancella nota =========================================
router.delete('/:noteId', deleteNote);

export default router;
 
