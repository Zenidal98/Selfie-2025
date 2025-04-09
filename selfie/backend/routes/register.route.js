import express from "express";
import { registerUser } from "../controllers/register.controller.js";

const router = express.Router();

router.post("/", registerUser); // POST /api/users

export default router;
