import express from "express";
import {  createEvent, getEvents, deleteEvent, excludeOccurrence } from "../controllers/event.controller.js"

const router = express.Router();

// GET -> eventi dell'utente in tale periodo (periodo e id definiti nella query, vedi controller) ========================
router.get('/', getEvents);

// POST -> crea un nuovo evento (di tipo "manuale") ==============
router.post('/', createEvent);

// DELETE -> cancella un evento preesistente (ed eventualmente la sua ricorrenza) =====================
router.delete('/:id', deleteEvent);

// DELETE 2 -> cancella un'istanza di un evento ricorrente (lo marca nella blacklist dell'evento base)
router.patch('/:id/exclude', excludeOccurrence);
export default router;
