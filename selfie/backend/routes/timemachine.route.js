import express from "express";
import {
  setVirtualTime,
  getVirtualTime,
  resetVirtualTime,
} from "../controllers/timemachine.controller.js";

const router = express.Router();

// Set new virtual time
router.post("/", setVirtualTime);

// Get current virtual + system time
router.get("/", getVirtualTime);

// Reset to real system time
router.delete("/", resetVirtualTime);

export default router;
