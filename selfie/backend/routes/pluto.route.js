import express from "express";
import { getPlutos, createPlutos, updatePlutos, deletePlutos, getPlutoByID } from "../controllers/pluto.controller.js";

const router = express.Router();

router.get("/", getPlutos);

router.get("/:id", getPlutoByID);

router.post("", createPlutos);

router.put("/:id", updatePlutos);

router.delete("/:id", deletePlutos);

export default router;