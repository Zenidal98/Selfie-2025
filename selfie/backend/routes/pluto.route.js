import express from "express";
import { getPlutos, createPlutos, updatePlutos, deletePlutos } from "../controllers/pluto.controller.js";

const router = express.Router();

router.get("", getPlutos);

router.post("/", createPlutos);

router.put("/:id", updatePlutos);

router.delete("/:id", deletePlutos);

export default router;