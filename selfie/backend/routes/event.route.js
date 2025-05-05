import express from "express";
import {  createEvent, getEvents, updateEvent, deleteEvent} from "../controllers/event.controller.js"

const router = express.Router();

// GET -> eventi dell'utente in tale data ========================
router.get('/', getEvents);

// POST -> crea un nuovo evento (di tipo "manuale") ==============
router.post('/', createEvent);

// PUT -> aggiorna un evento preesistente =========================
router.put('/:id', updateEvent);

// DELETE -> cancella un evento preesistente =====================
router.delete('/:id', deleteEvent);

export default router;
