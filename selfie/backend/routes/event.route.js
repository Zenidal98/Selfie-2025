import express from "express";
import {  createEvent, getEventsByDate, updateEvent, deleteEvent} from "../controllers/event.controller.js"

const router = express.Router();

// GET -> eventi dell'utente in tale data ========================
router.get('/:date', getEventsByDate);

// POST -> crea un nuovo evento (di tipo "manuale") ==============
router.post('/', createEvent);

// PUT -> aggiorna un evento preesistente =========================
router.put('/:id', updateEvent);

// DELETE -> cancella un evento preesistente =====================
router.delete('/:id', deleteEvent);

export default router;
