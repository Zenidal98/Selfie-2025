import express from "express";
import {
  setVirtualTime,
  getVirtualTime,
  resetVirtualTime,
} from "../controllers/timemachine.controller.js";

const router = express.Router();

// imposta il nuovo orario manuale
router.post("/", setVirtualTime);

// prende un resoconto diciamo del tempo vero e del tempo della time machine
router.get("/", getVirtualTime);

// resetta il tutto all'orario normale del sistema operativo
router.delete("/", resetVirtualTime);

export default router;
