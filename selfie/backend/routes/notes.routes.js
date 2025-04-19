import express from "express";
import { saveNotes, getUserNotes, updateNote } from "../controllers/notes.controller.js"
const router = express.Router(); 

// POST -> nuova nota
router.post('/save', saveNotes);

// GET -> note dell'utente 
router.get('/:userId', getUserNotes);

// PUT -> modifica nota 
router.put('/id', updateNote);

export default router;
 
