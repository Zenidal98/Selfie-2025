import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import registerRoutes from "./routes/register.route.js";
import loginRoutes from "./routes/login.route.js";
import noteRoutes from "./routes/notes.routes.js";
import pomodoroRoutes from "./routes/pomodoro.route.js";
import eventRoutes from "./routes/event.route.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// consenti dev server classici (CRA 3000, Vite 5173)
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/register", registerRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/events", eventRoutes);

app.listen(PORT, async () => {
  await connectDB();
  console.log("Server attivato sulla porta " + PORT);
});
