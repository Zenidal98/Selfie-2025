import express from "express";
import {  createEvent, getEvents, updateEvent, deleteEvent, deleteOccurrence } from "../controllers/event.controller.js"

const router = express.Router();

// GET -> eventi dell'utente in tale periodo (periodo e id definiti nella query, vedi controller) ========================
router.get('/', getEvents);

// POST -> crea un nuovo evento (di tipo "manuale") ==============
router.post('/', createEvent);

// PUT -> aggiorna un evento preesistente NON ATTUALMENTE IN UTILIZZO=========================
router.put('/:id', updateEvent);

// DELETE -> cancella un evento preesistente (ed eventualmente la sua ricorrenza) =====================
router.delete('/:id', deleteEvent);

// DELETE 2 -> cancella un'istanza di un evento ricorrente
router.delete('/:recurrenceId/:date', deleteOccurrence);
export default router;
